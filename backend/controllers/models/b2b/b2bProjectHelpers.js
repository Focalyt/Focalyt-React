const mongoose = require('mongoose');

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(String(id));

const getProjectDepartmentIds = (project) => {
	if (!project) return [];
	const fromArray = (project.departments || []).map((d) => String(d?._id || d));
	if (fromArray.length) return fromArray;
	if (project.department) return [String(project.department?._id || project.department)];
	return [];
};

const projectBelongsToDepartment = (project, departmentId) => {
	if (!departmentId) return false;
	return getProjectDepartmentIds(project).includes(String(departmentId));
};

const parseDepartmentsFromBody = (body = {}) => {
	if (Array.isArray(body.departments) && body.departments.length) {
		return [...new Set(body.departments.filter((id) => isValidId(id)).map(String))];
	}
	if (body.department && isValidId(body.department)) {
		return [String(body.department)];
	}
	return [];
};

const projectDepartmentQuery = (departmentId) => ({
	$or: [
		{ departments: departmentId },
		{
			department: departmentId,
			$or: [
				{ departments: { $exists: false } },
				{ departments: { $size: 0 } },
			],
		},
	],
});

const syncLegacyDepartmentField = (projectLike) => {
	const ids = getProjectDepartmentIds(projectLike);
	if (ids.length) {
		projectLike.department = ids[0];
		projectLike.departments = ids.map((id) => new mongoose.Types.ObjectId(id));
	}
	return projectLike;
};

module.exports = {
	isValidId,
	getProjectDepartmentIds,
	projectBelongsToDepartment,
	parseDepartmentsFromBody,
	projectDepartmentQuery,
	syncLegacyDepartmentField,
};
