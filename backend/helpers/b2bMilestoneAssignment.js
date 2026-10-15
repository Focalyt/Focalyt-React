const mongoose = require('mongoose');
const B2BDepartment = require('../controllers/models/b2b/b2bDepartment');
const B2BProject = require('../controllers/models/b2b/b2bProject');
const B2bMilestone = require('../controllers/models/b2bMilestone');
const B2bMilestoneAssignment = require('../controllers/models/b2bMilestoneAssignment');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const uniqueIds = (values = []) => [...new Set((values || []).map(String).filter(isValidId))];

const projectDepartmentIds = (project) => uniqueIds([...(project?.departments || []), project?.department]);
const firstDepartmentId = (project) => projectDepartmentIds(project)[0] || null;

const emptyAssignment = () => ({
	projects: new Set(),
	departments: new Set(),
	projectPositions: new Map(),
	departmentPositions: new Map(),
});

/**
 * Map<milestoneId, { projects, departments, projectPositions, departmentPositions }>
 */
async function getMilestoneAssignmentState(collegeId, milestoneIds = []) {
	const ids = uniqueIds(milestoneIds);
	const state = new Map();
	if (!ids.length) return state;

	const rows = await B2bMilestoneAssignment.find({ college: collegeId, milestone: { $in: ids } })
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

async function createMilestonesForProjects({ collegeId, title, description, projectIds, createdBy }) {
	const ids = uniqueIds(projectIds);
	if (!ids.length) return { error: 'Select at least one project' };

	const projectDocs = await B2BProject.find({ _id: { $in: ids } }).select('_id department departments').lean();
	if (projectDocs.length !== ids.length) return { error: 'One or more projects were not found' };
	if (projectDocs.some((project) => !firstDepartmentId(project))) {
		return { error: 'A selected project has no department' };
	}

	const existing = await B2bMilestoneAssignment.find({ college: collegeId, project: { $in: ids } })
		.select('project index')
		.lean();
	const nextIndex = new Map();
	existing.forEach((row) => {
		if (!Number.isFinite(row.index)) return;
		const projectId = String(row.project);
		nextIndex.set(projectId, Math.max(nextIndex.get(projectId) ?? -1, row.index));
	});

	const milestones = [];
	for (const project of projectDocs) {
		const projectId = String(project._id);
		const index = (nextIndex.get(projectId) ?? -1) + 1;
		nextIndex.set(projectId, index);
		const milestone = await B2bMilestone.create({
			title,
			description: description || '',
			index: 0,
			college: collegeId,
			createdBy,
		});
		await B2bMilestoneAssignment.create({
			college: collegeId,
			department: firstDepartmentId(project),
			project: project._id,
			milestone: milestone._id,
			index,
			customOrder: false,
			createdBy,
		});
		milestones.push(milestone);
	}
	return { milestones };
}

async function placeMilestonesAt({ collegeId, projectId, milestoneIds, startIndex, customOrder, createdBy }) {
	const project = await B2BProject.findById(projectId).select('_id department departments').lean();
	if (!project) return { error: 'Project not found' };
	const departmentId = firstDepartmentId(project);
	if (!departmentId) return { error: 'A selected project has no department' };

	const ids = uniqueIds(milestoneIds);
	const rows = await B2bMilestoneAssignment.find({ college: collegeId, project: projectId })
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

	await B2bMilestoneAssignment.bulkWrite(finalIds.map((milestoneId, index) => ({
		updateOne: {
			filter: { college: collegeId, project: projectId, milestone: milestoneId },
			update: {
				$set: {
					index,
					department: departmentId,
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

async function copyMilestonesOntoProject({
	collegeId,
	sources,
	projectId,
	startIndex,
	customOrder,
	createdBy,
	repositionExisting = true,
}) {
	const existingIds = [];
	const freshIds = [];
	for (const source of sources) {
		const already = await B2bMilestoneAssignment.findOne({
			college: collegeId,
			milestone: source._id,
			project: projectId,
		}).select('_id').lean();
		if (already) {
			existingIds.push(String(source._id));
			continue;
		}
		const copy = await B2bMilestone.create({
			title: source.title,
			description: source.description || '',
			index: 0,
			college: collegeId,
			createdBy,
		});
		freshIds.push(String(copy._id));
	}
	const milestoneIds = repositionExisting ? [...existingIds, ...freshIds] : freshIds;
	if (!milestoneIds.length) return {};
	return placeMilestonesAt({
		collegeId,
		projectId,
		milestoneIds,
		startIndex,
		customOrder,
		createdBy,
	});
}

async function saveMilestoneProjects({ collegeId, milestoneId, projects, createdBy, replace = true }) {
	const projectIds = uniqueIds(projects);

	if (projectIds.length) {
		const projectDocs = await B2BProject.find({ _id: { $in: projectIds } }).select('_id department departments').lean();
		const projectDepartment = new Map(projectDocs.map((project) => [String(project._id), firstDepartmentId(project)]));
		const existing = await B2bMilestoneAssignment.find({ college: collegeId, project: { $in: projectIds } })
			.select('project milestone index')
			.lean();
		const nextIndex = new Map();
		existing.forEach((row) => {
			if (!Number.isFinite(row.index)) return;
			const projectId = String(row.project);
			nextIndex.set(projectId, Math.max(nextIndex.get(projectId) ?? -1, row.index));
		});

		await B2bMilestoneAssignment.bulkWrite(projectIds.map((projectId) => {
			const already = existing.some((row) => String(row.project) === projectId && String(row.milestone) === String(milestoneId));
			const update = {
				$set: { department: projectDepartment.get(projectId) || null, updatedBy: createdBy },
				$setOnInsert: { createdBy },
			};
			if (!already) {
				const index = (nextIndex.get(projectId) ?? -1) + 1;
				nextIndex.set(projectId, index);
				update.$setOnInsert.index = index;
				update.$setOnInsert.customOrder = false;
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
		await B2bMilestoneAssignment.deleteMany({
			college: collegeId,
			milestone: milestoneId,
			project: { $nin: projectIds },
		});
	}
}

async function setProjectOrder({ collegeId, projectId, orderedMilestoneIds }) {
	const rows = await B2bMilestoneAssignment.find({ college: collegeId, project: projectId }).select('milestone').lean();
	const allowed = rows.map((row) => String(row.milestone));
	const allowedSet = new Set(allowed);
	const ordered = uniqueIds(orderedMilestoneIds).filter((id) => allowedSet.has(id));
	const finalIds = [...ordered, ...allowed.filter((id) => !ordered.includes(id))];
	if (!finalIds.length) return;
	await B2bMilestoneAssignment.bulkWrite(finalIds.map((milestoneId, index) => ({
		updateOne: {
			filter: { college: collegeId, project: projectId, milestone: milestoneId },
			update: { $set: { index, customOrder: true } },
		},
	})));
}

async function setDepartmentOrder({ collegeId, departmentId, orderedMilestoneIds }) {
	const rows = await B2bMilestoneAssignment.find({ college: collegeId, department: departmentId })
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
	if (ops.length) await B2bMilestoneAssignment.bulkWrite(ops);
}

async function reorderMilestoneScope({ collegeId, departmentId, projectId, orderedMilestoneIds }) {
	if (!isValidId(departmentId)) return { error: 'Choose a department before changing milestone order' };
	const department = await B2BDepartment.findById(departmentId).select('_id').lean();
	if (!department) return { error: 'Department not found' };

	if (projectId) {
		if (!isValidId(projectId)) return { error: 'Project not found in this department' };
		const project = await B2BProject.findOne({
			_id: projectId,
			$or: [{ department: departmentId }, { departments: departmentId }],
		}).select('_id').lean();
		if (!project) return { error: 'Project not found in this department' };
		await setProjectOrder({ collegeId, projectId, orderedMilestoneIds });
		return {};
	}

	await setDepartmentOrder({ collegeId, departmentId, orderedMilestoneIds });
	return {};
}

async function getMilestonesForProjects(collegeId, projectIds = []) {
	const ids = uniqueIds(projectIds);
	if (!ids.length) return new Set();
	const milestoneIds = await B2bMilestoneAssignment.distinct('milestone', { college: collegeId, project: { $in: ids } });
	return new Set(milestoneIds.map(String));
}

module.exports = {
	getMilestoneAssignmentState,
	createMilestonesForProjects,
	copyMilestonesOntoProject,
	saveMilestoneProjects,
	reorderMilestoneScope,
	getMilestonesForProjects,
};
