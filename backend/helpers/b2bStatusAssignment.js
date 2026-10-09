const mongoose = require('mongoose');
const B2BDepartment = require('../controllers/models/b2b/b2bDepartment');
const B2BProject = require('../controllers/models/b2b/b2bProject');
const B2BLead = require('../controllers/models/b2b/lead');
const B2bStatusAssignment = require('../controllers/models/b2bStatusAssignment');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
const uniqueIds = (values = []) => [...new Set((values || []).map(String).filter(isValidId))];

// A B2B project can list several departments; `department` is the legacy single field.
const projectDepartmentIds = (project) => uniqueIds([...(project.departments || []), project.department]);
const projectsOfDepartmentsQuery = (departmentIds) => ({
	$or: [{ department: { $in: departmentIds } }, { departments: { $in: departmentIds } }],
});

/**
 * Turns the department and project pickers into a checked list of B2B project ids.
 * A department with none of its projects picked means all of its current projects.
 */
async function resolveProjectSelection(departments = [], projects = []) {
	const departmentIds = uniqueIds(departments);
	const projectIds = uniqueIds(projects);
	if (!departmentIds.length && !projectIds.length) {
		return { error: 'Select at least one department or project' };
	}

	const [departmentDocs, projectDocs] = await Promise.all([
		departmentIds.length ? B2BDepartment.find({ _id: { $in: departmentIds } }).select('_id').lean() : [],
		projectIds.length ? B2BProject.find({ _id: { $in: projectIds } }).select('_id department departments').lean() : [],
	]);
	if (departmentDocs.length !== departmentIds.length) {
		return { error: 'One or more departments were not found' };
	}
	if (projectDocs.length !== projectIds.length) {
		return { error: 'One or more projects were not found' };
	}
	if (departmentIds.length && projectDocs.some((p) => !projectDepartmentIds(p).some((id) => departmentIds.includes(id)))) {
		return { error: 'A selected project does not belong to the selected departments' };
	}

	const coveredDepartments = new Set(projectDocs.flatMap(projectDepartmentIds));
	const wholeDepartments = departmentIds.filter((id) => !coveredDepartments.has(id));
	let expanded = [];
	if (wholeDepartments.length) {
		expanded = await B2BProject.find(projectsOfDepartmentsQuery(wholeDepartments)).select('_id').lean();
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

	const rows = await B2bStatusAssignment.find({ college: collegeId, status: { $in: ids } }).lean();
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
		const projectDocs = await B2BProject.find({ _id: { $in: statusProjects } }).select('_id department departments').lean();
		const projectDepartment = new Map(projectDocs.map((p) => [String(p._id), projectDepartmentIds(p)[0] || null]));

		await B2bStatusAssignment.bulkWrite(statusProjects.map((projectId) => {
			const substatuses = [...(subProjects || new Map())]
				.filter(([, subSet]) => subSet.has(projectId))
				.map(([subId]) => subId);
			return {
				updateOne: {
					filter: { college: collegeId, project: projectId, status: statusId },
					update: {
						$set: { department: projectDepartment.get(projectId) || null, substatuses, updatedBy: createdBy },
						$setOnInsert: { createdBy },
					},
					upsert: true,
				},
			};
		}));
	}

	await B2bStatusAssignment.deleteMany({
		college: collegeId,
		status: statusId,
		project: { $nin: statusProjects },
	});
}

/**
 * B2B projects whose statuses the user may see. Returns null for admins (they see every status).
 * Other users get their B2B project access; department-only access means all projects of those
 * departments. A non-admin with no B2B access gets an empty list.
 */
async function getStatusProjectScope(user) {
	if (user?.permissions?.permission_type === 'Admin') return null;
	const projectIds = uniqueIds(user?.projects_access);
	if (projectIds.length) return projectIds;
	const departmentIds = uniqueIds(user?.departments_access);
	if (!departmentIds.length) return [];
	const projects = await B2BProject.find(projectsOfDepartmentsQuery(departmentIds)).select('_id').lean();
	return projects.map((p) => String(p._id));
}

/**
 * Map<statusId, Set<substatusId>> of what the given projects are assigned.
 */
async function getAssignedForProjects(collegeId, projectIds = []) {
	const visible = new Map();
	const ids = uniqueIds(projectIds);
	if (!ids.length) return visible;
	const rows = await B2bStatusAssignment.find({ college: collegeId, project: { $in: ids } })
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
 * B2B leads that the user may not move to this status/substatus, because it is not assigned
 * to the lead's project. Admins are never blocked. Leads with no project, or whose status and
 * substatus are not changing, are allowed.
 * Returns [{ _id, name }].
 */
async function findLeadsBlockedForStatus({ user, leadIds = [], statusId, substatusId, LeadModel = B2BLead }) {
	if (user?.permissions?.permission_type === 'Admin') return [];
	const ids = uniqueIds(leadIds);
	if (!ids.length || !isValidId(statusId)) return [];

	const leads = await LeadModel.find({ _id: { $in: ids } })
		.select('b2bProject businessName status subStatus')
		.lean();

	const targetStatus = String(statusId);
	const targetSub = isValidId(substatusId) ? String(substatusId) : '';
	const toCheck = leads.filter((lead) => lead.b2bProject && (
		String(lead.status || '') !== targetStatus
		|| (targetSub && String(lead.subStatus || '') !== targetSub)
	));
	if (!toCheck.length) return [];

	const rows = await B2bStatusAssignment.find({
		college: user.college._id,
		status: targetStatus,
		project: { $in: uniqueIds(toCheck.map((lead) => lead.b2bProject)) },
	}).select('project substatuses').lean();
	const allowedSubs = new Map(rows.map((row) => [String(row.project), new Set((row.substatuses || []).map(String))]));

	return toCheck
		.filter((lead) => {
			const subs = allowedSubs.get(String(lead.b2bProject));
			return !subs || (targetSub && !subs.has(targetSub));
		})
		.map((lead) => ({ _id: lead._id, name: lead.businessName || '' }));
}

module.exports = {
	resolveProjectSelection,
	getAssignmentState,
	saveAssignmentState,
	getStatusProjectScope,
	getAssignedForProjects,
	findLeadsBlockedForStatus,
};
