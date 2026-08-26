const mongoose = require('mongoose');
const { Project } = require('../controllers/models');

function toAccessIdString(value) {
	if (value == null) return '';
	if (typeof value === 'object') return String(value._id || value.id || '');
	return String(value);
}

function toObjectIds(ids = []) {
	return (ids || [])
		.map((id) => toAccessIdString(id))
		.filter((id) => mongoose.Types.ObjectId.isValid(id))
		.map((id) => new mongoose.Types.ObjectId(id));
}

function getB2cAccessScope(user) {
	const isAdmin = user?.permissions?.permission_type === 'Admin';
	const verticalIds = (user?.verticals_access || []).map(toAccessIdString).filter(Boolean);
	const projectIds = (user?.b2c_projects_access || []).map(toAccessIdString).filter(Boolean);
	return {
		isAdmin,
		verticalIds: !isAdmin && verticalIds.length ? verticalIds : [],
		projectIds: !isAdmin && projectIds.length ? projectIds : [],
	};
}

function applyB2cAccessToFilters(user, verticalsArray = [], projectsArray = []) {
	const access = getB2cAccessScope(user);
	let nextVerticals = Array.isArray(verticalsArray) ? [...verticalsArray] : [];
	let nextProjects = Array.isArray(projectsArray) ? [...projectsArray] : [];

	if (access.verticalIds.length) {
		if (!nextVerticals.length) {
			nextVerticals = [...access.verticalIds];
		} else {
			nextVerticals = nextVerticals.filter((id) => access.verticalIds.includes(String(id)));
			if (!nextVerticals.length) nextVerticals = [...access.verticalIds];
		}
	}
	if (access.projectIds.length) {
		if (!nextProjects.length) {
			nextProjects = [...access.projectIds];
		} else {
			nextProjects = nextProjects.filter((id) => access.projectIds.includes(String(id)));
			if (!nextProjects.length) nextProjects = [...access.projectIds];
		}
	}
	return { verticalsArray: nextVerticals, projectsArray: nextProjects };
}

async function resolveB2cProjectIds(user) {
	const access = getB2cAccessScope(user);
	if (access.isAdmin || (!access.projectIds.length && !access.verticalIds.length)) {
		return {
			scoped: false,
			access,
			projectObjectIds: [],
			verticalObjectIds: [],
			projectIds: [],
			verticalIds: [],
		};
	}

	let projectObjectIds = toObjectIds(access.projectIds);
	const verticalObjectIds = toObjectIds(access.verticalIds);

	if (!projectObjectIds.length && verticalObjectIds.length) {
		const projects = await Project.find({ vertical: { $in: verticalObjectIds } }).select('_id').lean();
		projectObjectIds = projects.map((p) => p._id);
	}

	return {
		scoped: true,
		access,
		projectObjectIds,
		verticalObjectIds,
		projectIds: projectObjectIds.map((id) => String(id)),
		verticalIds: access.verticalIds,
	};
}

function isIdAllowed(id, allowedIds) {
	if (!allowedIds?.length) return true;
	if (id == null || id === '') return false;
	return allowedIds.map(String).includes(String(id));
}

function filterByAllowedIds(items, allowedIds, getId = (item) => item?._id) {
	if (!allowedIds?.length) return items || [];
	const allowed = new Set(allowedIds.map(String));
	return (items || []).filter((item) => allowed.has(String(getId(item))));
}

module.exports = {
	toAccessIdString,
	toObjectIds,
	getB2cAccessScope,
	applyB2cAccessToFilters,
	resolveB2cProjectIds,
	isIdAllowed,
	filterByAllowedIds,
};
