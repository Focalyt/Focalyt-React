const mongoose = require('mongoose');
const Vertical = require('../controllers/models/verticals');
const Project = require('../controllers/models/Project');
const B2cMilestone = require('../controllers/models/b2cMilestone');
const B2cMilestoneAssignment = require('../controllers/models/b2cMilestoneAssignment');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const uniqueIds = (values = []) => [...new Set((values || []).map(String).filter(isValidId))];

const emptyAssignment = () => ({
	projects: new Set(),
	departments: new Set(),
	projectPositions: new Map(),
	departmentPositions: new Map(),
});

let droppedDepartmentOrder = false;

// Position lives on B2cMilestoneAssignment.index. Drop the extra collection if an earlier version created it.
async function dropDepartmentOrderCollection() {
	if (droppedDepartmentOrder) return;
	droppedDepartmentOrder = true;
	try {
		const db = mongoose.connection.db;
		if (!db) {
			droppedDepartmentOrder = false;
			return;
		}
		const found = await db.listCollections({ name: 'b2cmilestonedepartmentorders' }).toArray();
		if (found.length) await db.dropCollection('b2cmilestonedepartmentorders');
	} catch (err) {
		droppedDepartmentOrder = false;
		console.error('Error dropping unused milestone department order collection:', err.message);
	}
}

/**
 * Copies the old global milestone order onto assignment rows that have no position yet.
 */
async function ensureMilestonePositions(collegeId) {
	await dropDepartmentOrderCollection();
	const assignmentCount = await B2cMilestoneAssignment.countDocuments({ college: collegeId });
	if (!assignmentCount) return;

	const [milestones, rows] = await Promise.all([
		B2cMilestone.find({ college: collegeId }).sort({ index: 1, createdAt: 1 }).select('_id').lean(),
		B2cMilestoneAssignment.find({ college: collegeId }).select('_id project milestone index').lean(),
	]);
	const globalRank = new Map(milestones.map((item, index) => [String(item._id), index]));

	const missingByProject = new Map();
	rows.forEach((row) => {
		if (Number.isFinite(row.index)) return;
		const projectId = String(row.project);
		if (!missingByProject.has(projectId)) missingByProject.set(projectId, []);
		missingByProject.get(projectId).push(row);
	});
	const assignmentOps = [];
	missingByProject.forEach((list, projectId) => {
		const placed = rows.filter((row) => String(row.project) === projectId && Number.isFinite(row.index));
		let next = placed.reduce((max, row) => Math.max(max, row.index), -1) + 1;
		list.sort((a, b) => (globalRank.get(String(a.milestone)) ?? 0) - (globalRank.get(String(b.milestone)) ?? 0));
		list.forEach((row) => {
			assignmentOps.push({
				updateOne: {
					filter: { _id: row._id, index: { $exists: false } },
					update: { $set: { index: next } },
				},
			});
			next += 1;
		});
	});
	if (assignmentOps.length) await B2cMilestoneAssignment.bulkWrite(assignmentOps);
}

/**
 * Map<milestoneId, { projects, departments, projectPositions, departmentPositions }>
 * projectPositions come from each assignment row.
 * departmentPositions are those same indexes for projects that still follow the department.
 */
async function getMilestoneAssignmentState(collegeId, milestoneIds = []) {
	const ids = uniqueIds(milestoneIds);
	const state = new Map();
	if (!ids.length) return state;

	const rows = await B2cMilestoneAssignment.find({ college: collegeId, milestone: { $in: ids } })
		.select('milestone project department index customOrder')
		.lean();
	const customMin = new Map();
	rows.forEach((row) => {
		const key = String(row.milestone);
		if (!state.has(key)) state.set(key, emptyAssignment());
		const entry = state.get(key);
		const projectId = String(row.project);
		entry.projects.add(projectId);
		if (row.department) entry.departments.add(String(row.department));
		if (!row.department || !Number.isFinite(row.index)) return;
		const departmentId = String(row.department);
		entry.projectPositions.set(projectId, row.index);
		const slot = `${key}:${departmentId}`;
		if (!row.customOrder) {
			entry.departmentPositions.set(departmentId, row.index);
			return;
		}
		const current = customMin.get(slot);
		customMin.set(slot, Number.isFinite(current) ? Math.min(current, row.index) : row.index);
	});
	state.forEach((entry, milestoneId) => {
		entry.departments.forEach((departmentId) => {
			if (entry.departmentPositions.has(departmentId)) return;
			const fallback = customMin.get(`${milestoneId}:${departmentId}`);
			if (Number.isFinite(fallback)) entry.departmentPositions.set(departmentId, fallback);
		});
	});
	return state;
}

/**
 * Adds rows for the given projects. With replace, rows for other projects are deleted.
 * index on the row is the milestone position in that project.
 * A project that still follows its department shares that index with the department's other projects.
 * A project ordered on its own gets the milestone at the end.
 */
async function saveMilestoneProjects({ collegeId, milestoneId, projects, createdBy, replace = true }) {
	const projectIds = uniqueIds(projects);

	if (projectIds.length) {
		const projectDocs = await Project.find({ _id: { $in: projectIds } }).select('_id vertical').lean();
		const projectVertical = new Map(projectDocs.map((p) => [String(p._id), p.vertical]));
		const departmentIds = uniqueIds([...projectVertical.values()]);

		const [existing, siblingRows] = await Promise.all([
			B2cMilestoneAssignment.find({
				college: collegeId,
				project: { $in: projectIds },
			}).select('project milestone index customOrder').lean(),
			departmentIds.length
				? B2cMilestoneAssignment.find({
					college: collegeId,
					department: { $in: departmentIds },
					customOrder: { $ne: true },
				}).select('department milestone index').lean()
				: [],
		]);
		const nextIndex = new Map();
		const customProjects = new Set();
		existing.forEach((row) => {
			const projectId = String(row.project);
			if (Number.isFinite(row.index)) {
				nextIndex.set(projectId, Math.max(nextIndex.get(projectId) ?? -1, row.index));
			}
			if (row.customOrder) customProjects.add(projectId);
		});
		const sharedIndex = new Map();
		const maxByDepartment = new Map();
		siblingRows.forEach((row) => {
			if (!Number.isFinite(row.index)) return;
			const departmentId = String(row.department);
			maxByDepartment.set(departmentId, Math.max(maxByDepartment.get(departmentId) ?? -1, row.index));
			sharedIndex.set(`${departmentId}:${row.milestone}`, row.index);
		});

		await B2cMilestoneAssignment.bulkWrite(projectIds.map((projectId) => {
			const already = existing.some((row) => String(row.project) === projectId && String(row.milestone) === String(milestoneId));
			const update = {
				$set: { department: projectVertical.get(projectId), updatedBy: createdBy },
				$setOnInsert: { createdBy },
			};
			if (!already) {
				const departmentId = String(projectVertical.get(projectId) || '');
				let index;
				let customOrder = false;
				if (customProjects.has(projectId)) {
					index = (nextIndex.get(projectId) ?? -1) + 1;
					nextIndex.set(projectId, index);
					customOrder = true;
				} else {
					const sharedKey = `${departmentId}:${milestoneId}`;
					if (sharedIndex.has(sharedKey)) {
						index = sharedIndex.get(sharedKey);
					} else {
						index = (maxByDepartment.get(departmentId) ?? -1) + 1;
						maxByDepartment.set(departmentId, index);
						sharedIndex.set(sharedKey, index);
					}
				}
				update.$setOnInsert.index = index;
				update.$setOnInsert.customOrder = customOrder;
			}
			return {
				updateOne: {
					filter: { college: collegeId, project: projectId, milestone: milestoneId },
					update,
					upsert: true,
				},
			};
		}));
	}

	if (replace) {
		await B2cMilestoneAssignment.deleteMany({
			college: collegeId,
			milestone: milestoneId,
			project: { $nin: projectIds },
		});
	}
}

/**
 * Puts these milestones on one project at startIndex (0-based), shifting the project's other milestones.
 * customOrder marks the project as having its own position.
 */
async function placeMilestonesAt({ collegeId, projectId, milestoneIds, startIndex, customOrder, createdBy }) {
	const project = await Project.findOne({ _id: projectId, college: collegeId }).select('_id vertical').lean();
	if (!project) return { error: 'Project not found' };

	const ids = uniqueIds(milestoneIds);
	const rows = await B2cMilestoneAssignment.find({ college: collegeId, project: projectId })
		.select('milestone index customOrder')
		.sort({ index: 1, createdAt: 1 })
		.lean();
	const placing = new Set(ids);
	const others = [];
	rows.forEach((row) => {
		const id = String(row.milestone);
		if (placing.has(id) || others.includes(id)) return;
		others.push(id);
	});
	const at = Math.max(0, Math.min(Number(startIndex) || 0, others.length));
	const finalIds = [...others.slice(0, at), ...ids, ...others.slice(at)];
	const sticky = Boolean(customOrder) || rows.some((row) => row.customOrder);

	await B2cMilestoneAssignment.bulkWrite(finalIds.map((milestoneId, index) => ({
		updateOne: {
			filter: { college: collegeId, project: projectId, milestone: milestoneId },
			update: {
				$set: {
					index,
					department: project.vertical,
					updatedBy: createdBy,
					customOrder: sticky,
				},
				$setOnInsert: { createdBy },
			},
			upsert: true,
		},
	})));
	return {};
}

async function setProjectOrder({ collegeId, projectId, orderedMilestoneIds }) {
	const rows = await B2cMilestoneAssignment.find({ college: collegeId, project: projectId }).select('milestone').lean();
	const allowed = rows.map((row) => String(row.milestone));
	const allowedSet = new Set(allowed);
	const ordered = uniqueIds(orderedMilestoneIds).filter((id) => allowedSet.has(id));
	const finalIds = [...ordered, ...allowed.filter((id) => !ordered.includes(id))];
	if (!finalIds.length) return;
	await B2cMilestoneAssignment.bulkWrite(finalIds.map((milestoneId, index) => ({
		updateOne: {
			filter: { college: collegeId, project: projectId, milestone: milestoneId },
			update: { $set: { index, customOrder: true } },
		},
	})));
}

async function setDepartmentOrder({ collegeId, departmentId, orderedMilestoneIds }) {
	const rows = await B2cMilestoneAssignment.find({ college: collegeId, department: departmentId })
		.select('_id project milestone customOrder')
		.lean();
	const allowed = [...new Set(rows.map((row) => String(row.milestone)))];
	const allowedSet = new Set(allowed);
	const ordered = uniqueIds(orderedMilestoneIds).filter((id) => allowedSet.has(id));
	const finalIds = [...ordered, ...allowed.filter((id) => !ordered.includes(id))];
	const rank = new Map(finalIds.map((id, index) => [id, index]));
	const byProject = new Map();
	rows.forEach((row) => {
		const projectId = String(row.project);
		if (!byProject.has(projectId)) byProject.set(projectId, []);
		byProject.get(projectId).push(row);
	});
	const ops = [];
	byProject.forEach((list) => {
		if (list.some((row) => row.customOrder)) return;
		const sorted = [...list].sort((a, b) => (rank.get(String(a.milestone)) ?? 0) - (rank.get(String(b.milestone)) ?? 0));
		sorted.forEach((row, index) => {
			ops.push({
				updateOne: {
					filter: { _id: row._id },
					update: { $set: { index } },
				},
			});
		});
	});
	if (ops.length) await B2cMilestoneAssignment.bulkWrite(ops);
}

async function reorderMilestoneScope({ collegeId, departmentId, projectId, orderedMilestoneIds }) {
	if (!isValidId(departmentId)) return { error: 'Choose a department before changing milestone order' };
	const department = await Vertical.findOne({ _id: departmentId, college: collegeId }).select('_id').lean();
	if (!department) return { error: 'Department not found' };

	if (projectId) {
		if (!isValidId(projectId)) return { error: 'Project not found in this department' };
		const project = await Project.findOne({ _id: projectId, college: collegeId, vertical: departmentId }).select('_id').lean();
		if (!project) return { error: 'Project not found in this department' };
		await setProjectOrder({ collegeId, projectId, orderedMilestoneIds });
		return {};
	}

	await setDepartmentOrder({ collegeId, departmentId, orderedMilestoneIds });
	return {};
}

/**
 * Set of milestone ids assigned to any of the given projects.
 */
async function getMilestonesForProjects(collegeId, projectIds = []) {
	const ids = uniqueIds(projectIds);
	if (!ids.length) return new Set();
	const milestoneIds = await B2cMilestoneAssignment.distinct('milestone', { college: collegeId, project: { $in: ids } });
	return new Set(milestoneIds.map(String));
}

module.exports = {
	ensureMilestonePositions,
	getMilestoneAssignmentState,
	saveMilestoneProjects,
	placeMilestonesAt,
	reorderMilestoneScope,
	getMilestonesForProjects,
};
