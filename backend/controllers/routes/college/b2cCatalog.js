const express = require('express');
const mongoose = require('mongoose');
const { Vertical, Project, Center, Courses } = require('../../models');

const router = express.Router();

function toId(value) {
	if (value == null || value === '') return '';
	if (typeof value === 'object') return String(value._id || value.id || '');
	return String(value);
}

function uniqueIds(values) {
	return [...new Set((values || []).map(toId).filter(Boolean))];
}

function courseCentreIds(course) {
	const fromList = Array.isArray(course.center) ? course.center : [];
	return uniqueIds([...fromList, course.centerId]);
}

function byName(a, b) {
	return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
}

function invalidIdMessage(label, value) {
	if (!value) return '';
	if (!mongoose.Types.ObjectId.isValid(value)) return `${label} is not a valid id`;
	return '';
}

function narrowToIds(departments, projects, courses, centres, filters) {
	let nextDepartments = departments;
	let nextProjects = projects;
	let nextCourses = courses;
	let nextCentres = centres;

	if (filters.department) {
		nextDepartments = nextDepartments.filter((item) => item._id === filters.department);
		nextProjects = nextProjects.filter((item) => item.department === filters.department);
		nextCourses = nextCourses.filter((item) => item.department === filters.department);
		const projectIds = new Set(nextProjects.map((item) => item._id));
		nextCentres = nextCentres.filter((item) => item.projects.some((id) => projectIds.has(id)));
	}

	if (filters.project) {
		nextProjects = nextProjects.filter((item) => item._id === filters.project);
		const departmentIds = new Set(nextProjects.map((item) => item.department));
		nextDepartments = nextDepartments.filter((item) => departmentIds.has(item._id));
		nextCourses = nextCourses.filter((item) => item.project === filters.project);
		nextCentres = nextCentres.filter((item) => item.projects.includes(filters.project));
	}

	if (filters.centre) {
		nextCentres = nextCentres.filter((item) => item._id === filters.centre);
		const projectIds = new Set(nextCentres.flatMap((item) => item.projects));
		nextProjects = nextProjects.filter((item) => projectIds.has(item._id));
		const departmentIds = new Set(nextProjects.map((item) => item.department));
		nextDepartments = nextDepartments.filter((item) => departmentIds.has(item._id));
		nextCourses = nextCourses.filter((item) => item.centres.includes(filters.centre));
	}

	if (filters.course) {
		nextCourses = nextCourses.filter((item) => item._id === filters.course);
		const projectIds = new Set(nextCourses.map((item) => item.project));
		const departmentIds = new Set(nextCourses.map((item) => item.department));
		const centreIds = new Set(nextCourses.flatMap((item) => item.centres));
		nextProjects = nextProjects.filter((item) => projectIds.has(item._id));
		nextDepartments = nextDepartments.filter((item) => departmentIds.has(item._id));
		if (centreIds.size) {
			nextCentres = nextCentres.filter((item) => centreIds.has(item._id));
		} else {
			nextCentres = nextCentres.filter((item) => item.projects.some((id) => projectIds.has(id)));
		}
	}

	return {
		departments: nextDepartments,
		projects: nextProjects,
		courses: nextCourses,
		centres: nextCentres,
	};
}

function applyNameSearch(departments, projects, courses, centres, query) {
	const needle = String(query || '').trim().toLowerCase();
	if (!needle) {
		return { departments, projects, courses, centres };
	}

	const hit = (name) => String(name || '').toLowerCase().includes(needle);
	const deptIds = new Set();
	const projectIds = new Set();
	const courseIds = new Set();
	const centreIds = new Set();

	departments.forEach((item) => {
		if (!hit(item.name)) return;
		deptIds.add(item._id);
		projects
			.filter((project) => project.department === item._id)
			.forEach((project) => projectIds.add(project._id));
	});

	projects.forEach((item) => {
		if (!hit(item.name)) return;
		projectIds.add(item._id);
		deptIds.add(item.department);
	});

	const matchedProjectIds = new Set(projects.filter((item) => hit(item.name)).map((item) => item._id));
	const departmentProjectIds = new Set(
		projects.filter((item) => deptIds.has(item.department) && departments.some((dept) => dept._id === item.department && hit(dept.name))).map((item) => item._id)
	);

	courses.forEach((item) => {
		const underMatchedParent = departmentProjectIds.has(item.project) || matchedProjectIds.has(item.project);
		if (hit(item.name) || underMatchedParent) {
			courseIds.add(item._id);
			projectIds.add(item.project);
			deptIds.add(item.department);
			item.centres.forEach((id) => centreIds.add(id));
		}
	});

	centres.forEach((item) => {
		const underMatchedProject = item.projects.some((id) => matchedProjectIds.has(id) || departmentProjectIds.has(id));
		if (hit(item.name) || underMatchedProject) {
			centreIds.add(item._id);
			item.projects.forEach((id) => projectIds.add(id));
		}
	});

	projects.forEach((item) => {
		if (projectIds.has(item._id)) deptIds.add(item.department);
	});

	centres.forEach((item) => {
		if (!centreIds.has(item._id) && item.projects.some((id) => matchedProjectIds.has(id) || departmentProjectIds.has(id))) {
			centreIds.add(item._id);
		}
	});

	courses.forEach((item) => {
		if (courseIds.has(item._id)) return;
		if (item.centres.some((id) => centres.some((centre) => centre._id === id && hit(centre.name)))) {
			courseIds.add(item._id);
			projectIds.add(item.project);
			deptIds.add(item.department);
		}
	});

	return {
		departments: departments.filter((item) => deptIds.has(item._id)),
		projects: projects.filter((item) => projectIds.has(item._id)),
		courses: courses.filter((item) => courseIds.has(item._id)),
		centres: centres.filter((item) => centreIds.has(item._id)),
	};
}

function buildTree(departments, projects, courses, centres) {
	return departments.map((department) => {
		const departmentProjects = projects.filter((project) => project.department === department._id);
		return {
			_id: department._id,
			name: department.name,
			projects: departmentProjects.map((project) => ({
				_id: project._id,
				name: project.name,
				centres: centres
					.filter((centre) => centre.projects.includes(project._id))
					.map((centre) => ({ _id: centre._id, name: centre.name })),
				courses: courses
					.filter((course) => course.project === project._id)
					.map((course) => ({
						_id: course._id,
						name: course.name,
						centres: course.centres,
					})),
			})),
		};
	});
}

router.get('/catalog', async (req, res) => {
	try {
		const collegeId = toId(req.query.college);
		const filters = {
			department: toId(req.query.department || req.query.vertical),
			project: toId(req.query.project),
			course: toId(req.query.course),
			centre: toId(req.query.center || req.query.centre),
		};
		const query = req.query.q || req.query.search || '';

		const invalid = [
			invalidIdMessage('college', collegeId),
			invalidIdMessage('department', filters.department),
			invalidIdMessage('project', filters.project),
			invalidIdMessage('course', filters.course),
			invalidIdMessage('centre', filters.centre),
		].find(Boolean);
		if (invalid) {
			return res.status(400).json({ status: false, message: invalid });
		}

		const collegeFilter = collegeId ? { college: collegeId } : {};
		const [verticals, projectDocs, courseDocs, centerDocs] = await Promise.all([
			Vertical.find({ ...collegeFilter, status: { $ne: false } }).select('_id name').lean(),
			Project.find({ ...collegeFilter, status: 'active' }).select('_id name vertical').lean(),
			Courses.find({ ...collegeFilter, status: true, isDeleted: { $ne: true } })
				.select('_id name vertical project center centerId')
				.lean(),
			Center.find({ ...collegeFilter, status: true }).select('_id name projects').lean(),
		]);

		let departments = verticals.map((item) => ({ _id: String(item._id), name: item.name || '' }));
		let projects = projectDocs.map((item) => ({
			_id: String(item._id),
			name: item.name || '',
			department: toId(item.vertical),
		}));
		let courses = courseDocs.map((item) => ({
			_id: String(item._id),
			name: item.name || '',
			department: toId(item.vertical),
			project: toId(item.project),
			centres: courseCentreIds(item),
		}));
		let centres = centerDocs.map((item) => ({
			_id: String(item._id),
			name: item.name || '',
			projects: uniqueIds(item.projects),
		}));

		({ departments, projects, courses, centres } = narrowToIds(
			departments,
			projects,
			courses,
			centres,
			filters
		));
		({ departments, projects, courses, centres } = applyNameSearch(
			departments,
			projects,
			courses,
			centres,
			query
		));

		departments.sort(byName);
		projects.sort(byName);
		courses.sort(byName);
		centres.sort(byName);

		const centers = centres;
		return res.json({
			status: true,
			message: 'B2C catalog fetched successfully',
			departments,
			projects,
			courses,
			centres,
			centers,
			tree: buildTree(departments, projects, courses, centres),
		});
	} catch (error) {
		console.error('Error in /college/b2c/catalog:', error);
		return res.status(500).json({ status: false, message: 'Server error' });
	}
});

module.exports = router;
