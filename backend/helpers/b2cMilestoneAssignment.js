const mongoose = require('mongoose');
const Project = require('../controllers/models/Project');
const B2cMilestoneAssignment = require('../controllers/models/b2cMilestoneAssignment');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const uniqueIds = (values = []) => [...new Set((values || []).map(String).filter(isValidId))];

/**
 * Map<milestoneId, { projects: Set, departments: Set }>
 */
async function getMilestoneAssignmentState(collegeId, milestoneIds = []) {
	const ids = uniqueIds(milestoneIds);
	const state = new Map();
	if (!ids.length) return state;

	const rows = await B2cMilestoneAssignment.find({ college: collegeId, milestone: { $in: ids } }).lean();
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
		const projectDocs = await Project.find({ _id: { $in: projectIds } }).select('_id vertical').lean();
		const projectVertical = new Map(projectDocs.map((p) => [String(p._id), p.vertical]));

		await B2cMilestoneAssignment.bulkWrite(projectIds.map((projectId) => ({
			updateOne: {
				filter: { college: collegeId, project: projectId, milestone: milestoneId },
				update: {
					$set: { department: projectVertical.get(projectId), updatedBy: createdBy },
					$setOnInsert: { createdBy },
				},
				upsert: true,
			},
		})));
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
 * Set of milestone ids assigned to any of the given projects.
 */
async function getMilestonesForProjects(collegeId, projectIds = []) {
	const ids = uniqueIds(projectIds);
	if (!ids.length) return new Set();
	const milestoneIds = await B2cMilestoneAssignment.distinct('milestone', { college: collegeId, project: { $in: ids } });
	return new Set(milestoneIds.map(String));
}

module.exports = {
	getMilestoneAssignmentState,
	saveMilestoneProjects,
	getMilestonesForProjects,
};
