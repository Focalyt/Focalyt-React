const mongoose = require('mongoose');
const B2BProject = require('../controllers/models/b2b/b2bProject');
const B2bMilestoneAssignment = require('../controllers/models/b2bMilestoneAssignment');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const uniqueIds = (values = []) => [...new Set((values || []).map(String).filter(isValidId))];

// A B2B project can list several departments; `department` is the legacy single field.
const firstDepartmentId = (project) => uniqueIds([...(project.departments || []), project.department])[0] || null;

/**
 * Map<milestoneId, { projects: Set, departments: Set }>
 */
async function getMilestoneAssignmentState(collegeId, milestoneIds = []) {
	const ids = uniqueIds(milestoneIds);
	const state = new Map();
	if (!ids.length) return state;

	const rows = await B2bMilestoneAssignment.find({ college: collegeId, milestone: { $in: ids } }).lean();
	rows.forEach((row) => {
		const key = String(row.milestone);
		if (!state.has(key)) state.set(key, { projects: new Set(), departments: new Set() });
		const entry = state.get(key);
		entry.projects.add(String(row.project));
		if (row.department) entry.departments.add(String(row.department));
	});
	return state;
}

/**
 * Adds rows for the given projects. With replace, rows for other projects are deleted.
 */
async function saveMilestoneProjects({ collegeId, milestoneId, projects, createdBy, replace = true }) {
	const projectIds = uniqueIds(projects);

	if (projectIds.length) {
		const projectDocs = await B2BProject.find({ _id: { $in: projectIds } }).select('_id department departments').lean();
		const projectDepartment = new Map(projectDocs.map((p) => [String(p._id), firstDepartmentId(p)]));

		await B2bMilestoneAssignment.bulkWrite(projectIds.map((projectId) => ({
			updateOne: {
				filter: { college: collegeId, project: projectId, milestone: milestoneId },
				update: {
					$set: { department: projectDepartment.get(projectId) || null, updatedBy: createdBy },
					$setOnInsert: { createdBy },
				},
				upsert: true,
			},
		})));
	}

	if (replace) {
		await B2bMilestoneAssignment.deleteMany({
			college: collegeId,
			milestone: milestoneId,
			project: { $nin: projectIds },
		});
	}
}

/**
 * Set of milestone ids assigned to any of the given projects.
 */
async function getMilestonesForProjects(collegeId, projectIds = []) {
	const ids = uniqueIds(projectIds);
	if (!ids.length) return new Set();
	const milestoneIds = await B2bMilestoneAssignment.distinct('milestone', { college: collegeId, project: { $in: ids } });
	return new Set(milestoneIds.map(String));
}

module.exports = {
	getMilestoneAssignmentState,
	saveMilestoneProjects,
	getMilestonesForProjects,
};
