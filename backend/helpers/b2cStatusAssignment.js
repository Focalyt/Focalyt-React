const mongoose = require('mongoose');
const Vertical = require('../controllers/models/verticals');
const Project = require('../controllers/models/Project');
const B2cStatusAssignment = require('../controllers/models/b2cStatusAssignment');
const AppliedCourses = require('../controllers/models/appliedCourses');
const { resolveB2cProjectIds } = require('./b2cAccess');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const uniqueIds = (values = []) => [...new Set((values || []).map(String).filter(isValidId))];

/**
 * Turns the department and project pickers into a checked list of project ids.
 * A department with none of its projects picked means all of its current projects.
 */
async function resolveProjectSelection(collegeId, departments = [], projects = []) {
	const departmentIds = uniqueIds(departments);
	const projectIds = uniqueIds(projects);
	if (!departmentIds.length && !projectIds.length) {
		return { error: 'Select at least one department or project' };
	}

	const [departmentDocs, projectDocs] = await Promise.all([
		departmentIds.length
			? Vertical.find({ _id: { $in: departmentIds }, college: collegeId }).select('_id').lean()
			: [],
		projectIds.length
			? Project.find({ _id: { $in: projectIds }, college: collegeId }).select('_id vertical').lean()
			: [],
	]);
	if (departmentDocs.length !== departmentIds.length) {
		return { error: 'One or more departments were not found for this college' };
	}
	if (projectDocs.length !== projectIds.length) {
		return { error: 'One or more projects were not found for this college' };
	}
	if (departmentIds.length && projectDocs.some((p) => !departmentIds.includes(String(p.vertical)))) {
		return { error: 'A selected project does not belong to the selected departments' };
	}

	const coveredDepartments = new Set(projectDocs.map((p) => String(p.vertical)));
	const wholeDepartments = departmentIds.filter((id) => !coveredDepartments.has(id));
	let expanded = [];
	if (wholeDepartments.length) {
		expanded = await Project.find({ vertical: { $in: wholeDepartments }, college: collegeId }).select('_id').lean();
	}

	const result = uniqueIds([...projectIds, ...expanded.map((p) => p._id)]);
	if (!result.length) return { error: 'The selected departments have no projects yet' };
	return { projectIds: result };
}

/**
 * Reads the per-project rows back into per-status sets:
 * Map<statusId, { projects: Set, departments: Set, subProjects: Map<substatusId, Set> }>
 */
async function getAssignmentState(collegeId, statusIds = []) {
	const ids = uniqueIds(statusIds);
	const state = new Map();
	if (!ids.length) return state;

	const rows = await B2cStatusAssignment.find({ college: collegeId, status: { $in: ids } }).lean();
	rows.forEach((row) => {
		const key = String(row.status);
		if (!state.has(key)) state.set(key, { projects: new Set(), departments: new Set(), subProjects: new Map() });
		const entry = state.get(key);
		const projectId = String(row.project);
		entry.projects.add(projectId);
		if (row.department) entry.departments.add(String(row.department));
		(row.substatuses || []).forEach((subId) => {
			const subKey = String(subId);
			if (!entry.subProjects.has(subKey)) entry.subProjects.set(subKey, new Set());
			entry.subProjects.get(subKey).add(projectId);
		});
	});
	return state;
}

/**
 * Makes one college's rows for one status match the given sets:
 * one row per project, holding the substatuses whose set includes that project.
 * Rows for projects no longer listed are deleted; existing rows keep createdAt/createdBy.
 */
async function saveAssignmentState({ collegeId, statusId, projects, subProjects, createdBy }) {
	const statusProjects = uniqueIds(projects);

	if (statusProjects.length) {
		const projectDocs = await Project.find({ _id: { $in: statusProjects } }).select('_id vertical').lean();
		const projectVertical = new Map(projectDocs.map((p) => [String(p._id), p.vertical]));

		await B2cStatusAssignment.bulkWrite(statusProjects.map((projectId) => {
			const substatuses = [...(subProjects || new Map())]
				.filter(([, subSet]) => subSet.has(projectId))
				.map(([subId]) => subId);
			return {
				updateOne: {
					filter: { college: collegeId, project: projectId, status: statusId },
					update: {
						$set: { department: projectVertical.get(projectId), substatuses, updatedBy: createdBy },
						$setOnInsert: { createdBy },
					},
					upsert: true,
				},
			};
		}));
	}

	await B2cStatusAssignment.deleteMany({
		college: collegeId,
		status: statusId,
		project: { $nin: statusProjects },
	});
}

/**
 * Projects whose statuses the user may see. Returns null for admins (they see every status).
 * Other users get their B2C project access; department-only access means all projects of those
 * departments. A non-admin with no B2C access gets an empty list.
 */
async function getStatusProjectScope(user) {
	if (user?.permissions?.permission_type === 'Admin') return null;
	const access = await resolveB2cProjectIds(user);
	return access.scoped ? access.projectIds.map(String) : [];
}

/**
 * Map<statusId, Set<substatusId>> of what the given projects are assigned.
 */
async function getAssignedForProjects(collegeId, projectIds = []) {
	const visible = new Map();
	const ids = uniqueIds(projectIds);
	if (!ids.length) return visible;
	const rows = await B2cStatusAssignment.find({ college: collegeId, project: { $in: ids } })
		.select('status substatuses')
		.lean();
	rows.forEach((row) => {
		const key = String(row.status);
		if (!visible.has(key)) visible.set(key, new Set());
		(row.substatuses || []).forEach((id) => visible.get(key).add(String(id)));
	});
	return visible;
}

/**
 * Leads that the user may not move to this status/substatus, because it is not assigned
 * to the lead's course project. Admins are never blocked. Leads whose course has no project,
 * or whose status and substatus are not changing, are allowed.
 * Returns [{ _id, name }].
 */
async function findLeadsBlockedForStatus({ user, leadIds = [], statusId, substatusId }) {
	if (user?.permissions?.permission_type === 'Admin') return [];
	const ids = uniqueIds(leadIds);
	if (!ids.length || !isValidId(statusId)) return [];

	const leads = await AppliedCourses.find({ _id: { $in: ids } })
		.select('_course _candidate _leadStatus _leadSubStatus')
		.populate('_course', 'project')
		.populate('_candidate', 'name')
		.lean();

	const targetStatus = String(statusId);
	const targetSub = isValidId(substatusId) ? String(substatusId) : '';
	const toCheck = leads.filter((lead) => lead._course?.project && (
		String(lead._leadStatus || '') !== targetStatus
		|| (targetSub && String(lead._leadSubStatus || '') !== targetSub)
	));
	if (!toCheck.length) return [];

	const rows = await B2cStatusAssignment.find({
		college: user.college._id,
		status: targetStatus,
		project: { $in: uniqueIds(toCheck.map((lead) => lead._course.project)) },
	}).select('project substatuses').lean();
	const allowedSubs = new Map(rows.map((row) => [String(row.project), new Set((row.substatuses || []).map(String))]));

	return toCheck
		.filter((lead) => {
			const subs = allowedSubs.get(String(lead._course.project));
			return !subs || (targetSub && !subs.has(targetSub));
		})
		.map((lead) => ({ _id: lead._id, name: lead._candidate?.name || '' }));
}

module.exports = {
	resolveProjectSelection,
	getAssignmentState,
	saveAssignmentState,
	getStatusProjectScope,
	getAssignedForProjects,
	findLeadsBlockedForStatus,
};
