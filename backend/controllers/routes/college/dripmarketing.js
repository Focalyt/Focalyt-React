const express = require('express');
const router = express.Router();
const moment = require('moment');
const { isCollege } = require('../../../helpers');
const { AppliedCourses, StatusLogs, User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, CandidateProfile, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, StatusB2b, Center, Courses, B2cFollowup, DripMarketingRule, DripMarketingJob } = require("../../models");
const { runDripMarketingTick, countMatchingLeads } = require("../../../schedular/dripMarketingScheduler");
const bcrypt = require("bcryptjs");
let fs = require("fs");
let path = require("path");

const axios = require("axios");
const mongoose = require('mongoose');

/** Calendar date in IST (YYYY-MM-DD). Avoids UTC day-shift from toISOString(). */
function getISTDatePart(dateVal) {
	if (!dateVal) return '';
	if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
		return dateVal.trim();
	}
	return moment(dateVal).utcOffset('+05:30').format('YYYY-MM-DD');
}

/** Parse end/start date + HH:mm as IST wall-clock time → Date */
function parseDateTimeIST(dateVal, timeStr) {
	const datePart = getISTDatePart(dateVal);
	if (!datePart || !timeStr) return null;
	const parsed = moment(`${datePart} ${timeStr}`, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD H:mm'], true);
	if (!parsed.isValid()) return null;
	return parsed.utcOffset('+05:30', true);
}

function toIdString(value) {
	if (value == null) return '';
	if (typeof value === 'object') return String(value._id || value.id || '');
	return String(value);
}

function getB2bAccessScope(user) {
	const permissionType = user?.permissions?.permission_type;
	const isAdmin = permissionType === 'Admin';
	const deptIds = (user?.departments_access || []).map(toIdString).filter(Boolean);
	const projectIds = (user?.projects_access || []).map(toIdString).filter(Boolean);
	return {
		isAdmin,
		deptIds: !isAdmin && deptIds.length ? deptIds : [],
		projectIds: !isAdmin && projectIds.length ? projectIds : [],
	};
}

function getB2cAccessScope(user) {
	const isAdmin = user?.permissions?.permission_type === 'Admin';
	const verticalIds = (user?.verticals_access || []).map(toIdString).filter(Boolean);
	const projectIds = (user?.b2c_projects_access || []).map(toIdString).filter(Boolean);
	return {
		isAdmin,
		verticalIds: !isAdmin && verticalIds.length ? verticalIds : [],
		projectIds: !isAdmin && projectIds.length ? projectIds : [],
	};
}

function enforceB2bConditionAccess(conditionBlocks, access) {
	if (!access || access.isAdmin || (!access.deptIds.length && !access.projectIds.length)) {
		return { ok: true, conditionBlocks };
	}

	const blocks = Array.isArray(conditionBlocks)
		? JSON.parse(JSON.stringify(conditionBlocks))
		: [];

	for (const block of blocks) {
		for (const condition of (block.conditions || [])) {
			const type = condition.activityType;
			const values = (condition.values || []).map(toIdString).filter(Boolean);

			if (type === 'b2bDepartment' && access.deptIds.length) {
				if (condition.operator === 'not_equals') {
					return { ok: false, message: 'You can only create rules for your assigned departments' };
				}
				const outside = values.filter((id) => !access.deptIds.includes(id));
				if (outside.length) {
					return { ok: false, message: 'You cannot create a rule for departments outside your access' };
				}
				condition.operator = 'equals';
				condition.values = values.length ? values.filter((id) => access.deptIds.includes(id)) : [...access.deptIds];
			}

			if ((type === 'b2bProject' || type === 'project') && access.projectIds.length) {
				if (condition.operator === 'not_equals') {
					return { ok: false, message: 'You can only create rules for your assigned projects' };
				}
				const outside = values.filter((id) => !access.projectIds.includes(id));
				if (outside.length) {
					return { ok: false, message: 'You cannot create a rule for projects outside your access' };
				}
				condition.operator = 'equals';
				condition.values = values.length ? values.filter((id) => access.projectIds.includes(id)) : [...access.projectIds];
			}
		}
	}

	const hasDeptEquals = blocks.some((block) =>
		(block.conditions || []).some((c) =>
			c.activityType === 'b2bDepartment' && c.operator === 'equals' && (c.values || []).length > 0
		)
	);
	const hasProjectEquals = blocks.some((block) =>
		(block.conditions || []).some((c) =>
			(c.activityType === 'b2bProject' || c.activityType === 'project') &&
			c.operator === 'equals' &&
			(c.values || []).length > 0
		)
	);

	const toInject = [];
	if (access.deptIds.length && !hasDeptEquals) {
		toInject.push({
			activityType: 'b2bDepartment',
			operator: 'equals',
			values: [...access.deptIds],
		});
	}
	if (access.projectIds.length && !hasProjectEquals) {
		toInject.push({
			activityType: 'b2bProject',
			operator: 'equals',
			values: [...access.projectIds],
		});
	}
	if (toInject.length) {
		if (!blocks.length) {
			blocks.push({ conditions: toInject, intraBlockLogicOperator: 'and' });
		} else {
			blocks[0].conditions = [...toInject, ...(blocks[0].conditions || [])];
		}
	}

	return { ok: true, conditionBlocks: blocks };
}

function enforceB2cConditionAccess(conditionBlocks, access) {
	if (!access || access.isAdmin || (!access.verticalIds.length && !access.projectIds.length)) {
		return { ok: true, conditionBlocks };
	}

	const blocks = Array.isArray(conditionBlocks)
		? JSON.parse(JSON.stringify(conditionBlocks))
		: [];

	for (const block of blocks) {
		for (const condition of (block.conditions || [])) {
			const type = condition.activityType;
			const values = (condition.values || []).map(toIdString).filter(Boolean);

			if (type === 'vertical' && access.verticalIds.length) {
				if (condition.operator === 'not_equals') {
					return { ok: false, message: 'You can only create rules for your assigned departments' };
				}
				const outside = values.filter((id) => !access.verticalIds.includes(id));
				if (outside.length) {
					return { ok: false, message: 'You cannot create a rule for departments outside your access' };
				}
				condition.operator = 'equals';
				condition.values = values.length ? values.filter((id) => access.verticalIds.includes(id)) : [...access.verticalIds];
			}

			if (type === 'project' && access.projectIds.length) {
				if (condition.operator === 'not_equals') {
					return { ok: false, message: 'You can only create rules for your assigned projects' };
				}
				const outside = values.filter((id) => !access.projectIds.includes(id));
				if (outside.length) {
					return { ok: false, message: 'You cannot create a rule for projects outside your access' };
				}
				condition.operator = 'equals';
				condition.values = values.length ? values.filter((id) => access.projectIds.includes(id)) : [...access.projectIds];
			}
		}
	}

	const hasVerticalEquals = blocks.some((block) =>
		(block.conditions || []).some((c) =>
			c.activityType === 'vertical' && c.operator === 'equals' && (c.values || []).length > 0
		)
	);
	const hasProjectEquals = blocks.some((block) =>
		(block.conditions || []).some((c) =>
			c.activityType === 'project' && c.operator === 'equals' && (c.values || []).length > 0
		)
	);

	const toInject = [];
	if (access.verticalIds.length && !hasVerticalEquals) {
		toInject.push({
			activityType: 'vertical',
			operator: 'equals',
			values: [...access.verticalIds],
		});
	}
	if (access.projectIds.length && !hasProjectEquals) {
		toInject.push({
			activityType: 'project',
			operator: 'equals',
			values: [...access.projectIds],
		});
	}
	if (toInject.length) {
		if (!blocks.length) {
			blocks.push({ conditions: toInject, intraBlockLogicOperator: 'and' });
		} else {
			blocks[0].conditions = [...toInject, ...(blocks[0].conditions || [])];
		}
	}

	return { ok: true, conditionBlocks: blocks };
}

router.get('/getVerticals', [isCollege], async (req, res) => {

	try {
		let collegeId = req.user.college._id;

		if (!collegeId || !mongoose.Types.ObjectId.isValid(collegeId)) {
			return res.json({
				status: false,
				message: "College not found or invalid"
			});
		}
		if (typeof collegeId !== 'string') { collegeId = new mongoose.Types.ObjectId(collegeId); }

		const verticals = await Vertical.find({ college: collegeId }).sort({ createdAt: -1 });
		const access = getB2cAccessScope(req.user);
		const scopedVerticals = access.verticalIds.length
			? verticals.filter((v) => access.verticalIds.includes(String(v._id)))
			: verticals;

		return res.json({
			status: true,
			message: "Verticals fetched successfully",
			data: scopedVerticals
		});
	} catch (err) {
		console.error("❌ Get Verticals Error:", err.message);
		return res.status(500).json({
			status: false,
			message: err.message || "Failed to fetch verticals"
		});
	}
});


router.get('/list-projects', [isCollege], async (req, res) => {
	try {
		let filter = {};
		let collegeId = req.user.college._id;
		let vertical = req.query.vertical;
		if (typeof collegeId !== 'string') { collegeId = new mongoose.Types.ObjectId(collegeId); }
		if (typeof vertical !== 'string') { vertical = new mongoose.Types.ObjectId(vertical); }
		if (vertical) {
			filter.vertical = vertical;
		}
		filter.college = collegeId;
		
		const projects = await Project.find(filter).sort({ createdAt: -1 });
		const access = getB2cAccessScope(req.user);
		const scopedProjects = access.projectIds.length
			? projects.filter((p) => access.projectIds.includes(String(p._id)))
			: projects;
		
		res.json({ success: true, data: scopedProjects });
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/list_all_projects', [isCollege], async (req, res) => {
	try {
		const collegeId = req.user.college._id;


		const projects = await Project.find({ status: 'active', college: collegeId }).sort({ createdAt: -1 });
		const access = getB2cAccessScope(req.user);
		const scopedProjects = access.projectIds.length
			? projects.filter((p) => access.projectIds.includes(String(p._id)))
			: projects;
		
		res.json({ success: true, data: scopedProjects });
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/list-centers', [isCollege], async (req, res) => {
	try {
		let collegeId = req.user.college._id;
		let projectId = req.query.projectId;


		if (typeof collegeId !== 'string') { collegeId = new mongoose.Types.ObjectId(collegeId); }


		if (projectId) {
			if (!mongoose.Types.ObjectId.isValid(projectId)) {
				return res.status(400).json({ success: false, message: 'Invalid Project ID' });
			}
			if (typeof projectId !== 'string') { projectId = new mongoose.Types.ObjectId(projectId); }

			const projectDetails = await Project.findById(projectId);
			if (!projectDetails) {
				return res.status(404).json({ success: false, message: 'Project not found.' });
			}
			if (projectDetails.college.toString() !== collegeId.toString()) {
				return res.status(403).json({ success: false, message: 'You are not authorized to list centers for this project' });
			}
			let allCenters = await Center.find({ projects: new mongoose.Types.ObjectId(projectId) }).sort({ createdAt: -1 });
			const centers = allCenters.map(center => {
				const centerObj = center.toObject();
				return {
					...centerObj,
					status: centerObj.status ? "active" : "inactive"
				};
			});
			return res.json({ success: true, data: centers });
		}
		else {
			const allCenters = await Center.find({ status: true, college: collegeId }).sort({ createdAt: -1 });
			const centers = allCenters.map(center => {
				const centerObj = center.toObject();
				return {
					...centerObj,
					status: centerObj.status ? "active" : "inactive"
				};
			});
			return res.json({ success: true, data: centers });
		}


	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/list_all_centers', [isCollege], async (req, res) => {
	try {
		const collegeId = req.user.college._id;

		const allCenters = await Center.find({ status: true, college: collegeId }).sort({ createdAt: -1 });
		const centers = allCenters.map(center => {
			const centerObj = center.toObject();
			return {
				...centerObj,
				status: centerObj.status ? "active" : "inactive"
			};
		});

		res.json({ success: true, data: centers });
	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/status', isCollege, async (req, res) => {
	try {
	   const statuses = await Status.find({college: req.user.college._id}).sort({ index: 1 });
   
	   // For each status, get count of AppliedCourses with _leadStatus = status._id
   
	   const statusesWithCount = await Promise.all(
		 statuses.map(async (status) => {
		   const count = await AppliedCourses.countDocuments({ _leadStatus: status._id, kycStage: { $nin: [true] },
			   kyc: { $nin: [true] },
			   admissionDone: { $nin: [true] } });
		   return {
			 _id: status._id,
			 title: status.title,
			 description: status.description,
			 milestone: status.milestone,
			 index: status.index,
			 count,          // yaha count add kar diya
			 substatuses: status.substatuses,
			 createdAt: status.createdAt,
			 updatedAt: status.updatedAt
		   };
		 })
	   );
   
	   return res.status(200).json({ success: true, message: 'Statuses fetched successfully', data: statusesWithCount });
   
	 } catch (err) {
	   console.error(err.message);
	   res.status(500).send('Server Error');
	 }
});

router.get('/substatus', isCollege, async (req, res) => {
    try {
     const statuses = await Status.find({college: req.user.college._id});

  
      if (!statuses) {
        return res.status(404).json({ msg: 'Status not found' });
      }

	  let subStatuses = []

	  for (let 	status of statuses) {
		let data = {
			_id: new mongoose.Types.ObjectId(status._id),
			title: status.title || "Untitled"
		}
		subStatuses.push(data);
	  }

	  

	  return res.status(200).json({ success: true, data: subStatuses });
  
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

router.get('/list-centers', [isCollege], async (req, res) => {
	try {
		let collegeId = req.user.college._id;
		let projectId = req.query.projectId;


		if (typeof collegeId !== 'string') { collegeId = new mongoose.Types.ObjectId(collegeId); }


		if (projectId) {
			if (!mongoose.Types.ObjectId.isValid(projectId)) {
				return res.status(400).json({ success: false, message: 'Invalid Project ID' });
			}
			if (typeof projectId !== 'string') { projectId = new mongoose.Types.ObjectId(projectId); }

			const projectDetails = await Project.findById(projectId);
			if (!projectDetails) {
				return res.status(404).json({ success: false, message: 'Project not found.' });
			}
			if (projectDetails.college.toString() !== collegeId.toString()) {
				return res.status(403).json({ success: false, message: 'You are not authorized to list centers for this project' });
			}
			let allCenters = await Center.find({ projects: new mongoose.Types.ObjectId(projectId) }).sort({ createdAt: -1 });
			const centers = allCenters.map(center => {
				const centerObj = center.toObject();
				return {
					...centerObj,
					status: centerObj.status ? "active" : "inactive"
				};
			});
			return res.json({ success: true, data: centers });
		}
		else {
			const allCenters = await Center.find({ status: true, college: collegeId }).sort({ createdAt: -1 });
			const centers = allCenters.map(center => {
				const centerObj = center.toObject();
				return {
					...centerObj,
					status: centerObj.status ? "active" : "inactive"
				};
			});
			return res.json({ success: true, data: centers });
		}


	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});
router.get('/all_courses', async (req, res) => {
	try {
		const courses = await Courses.find({ status: true }).sort({ createdAt: -1 });

		res.json({ success: true, data: courses });
	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/get_batches', async (req, res) => {
	try {
		const { centerId, courseId } = req.query;  // Get query params for filtering

		let filter = {};

		if (centerId) {
			filter.centerId = centerId;
		}

		if (courseId) {
			filter.courseId = courseId;
		}

		const batches = await Batch.find(filter).sort({ createdAt: -1 });  // Sorting by createdAt

		res.json({
			success: true,
			data: batches
		});

	} catch (error) {
		console.error('Error fetching batches:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/leadowner', [isCollege], async (req, res) => {
	try {
		const collegeId = req.user.college._id;

		if (!collegeId || !mongoose.Types.ObjectId.isValid(collegeId)) {
			return res.status(400).json({ 
				success: false, 
				message: "College not found or invalid" 
			});
		}

		const college = await College.findById(collegeId).populate('_concernPerson._id', 'name email mobile designation');

		if (!college) {
			return res.status(404).json({ 
				success: false, 
				message: "College not found" 
			});
		}
        let concernPersons = college._concernPerson.filter(person => person._id && person._id.name).map(person => ({
            _id: person?._id?._id,
            name: person?._id?.name ,
        }));
		// console.log("concernPersons",concernPersons)
		return res.status(200).json({ 
			success: true, 
			concernPersons: concernPersons 
		});
		

	} catch (error) {
		console.error('Error fetching concern persons:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Server error' 
		});
	}
});

  router.get("/joblisting", async (req, res) => {
 
	// ✅ Only show Public jobs, exclude Private jobs
	let recentJobs = await Vacancy.find({
		status: true,
		validity: { $gte: moment().utcOffset('+05:30') }, 
		verified: true,
		$or: [
			{ postingType: 'Public' },
			{ postingType: { $exists: false } }, 
			{ postingType: null }
		]
	}).select('title');
	// console.log("recentJobs",recentJobs)
	


	 res.json({
		data: recentJobs,
	});
});

router.post('/create-dripmarketing-rule', [isCollege], async (req, res) => {
	try {
		let {name, startDate, startTime, endDate, endTime, conditionBlocks, interBlockLogicOperator, primaryAction, additionalActions, communication ,uiState, leadType} = req.body;
		
		const resolvedLeadType = leadType === 'b2b' ? 'b2b' : 'b2c';
		// IF + communication only (no field-update THEN actions) for B2B and B2C
		if (!name || !startDate || !startTime || !conditionBlocks || !interBlockLogicOperator || !communication) {
			return res.status(400).json({ success: false, message: 'All fields are required' });
		}

		const collegeId = req.user.college._id;
		const user = req.user;

		let scopedConditionBlocks = conditionBlocks;
		if (resolvedLeadType === 'b2b') {
			const access = getB2bAccessScope(user);
			const enforced = enforceB2bConditionAccess(conditionBlocks, access);
			if (!enforced.ok) {
				return res.status(403).json({ success: false, message: enforced.message });
			}
			scopedConditionBlocks = enforced.conditionBlocks;
		} else {
			const access = getB2cAccessScope(user);
			const enforced = enforceB2cConditionAccess(conditionBlocks, access);
			if (!enforced.ok) {
				return res.status(403).json({ success: false, message: enforced.message });
			}
			scopedConditionBlocks = enforced.conditionBlocks;
		}

		const startMoment = parseDateTimeIST(startDate, startTime);
		const startDateTime = startMoment ? startMoment.toDate() : new Date(`${getISTDatePart(startDate)}T${startTime}`);

		let endDateTime;
		if (endDate && endTime) {
			const endMoment = parseDateTimeIST(endDate, endTime);
			const nowIST = moment().utcOffset('+05:30');
			console.log('[Drip] endDate check (create)', {
				rawEndDate: endDate,
				rawEndTime: endTime,
				parsedIST: endMoment ? endMoment.format('YYYY-MM-DD HH:mm Z') : null,
				nowIST: nowIST.format('YYYY-MM-DD HH:mm Z'),
				isAfter: endMoment ? endMoment.isAfter(nowIST) : false
			});
			if (!endMoment || !endMoment.isAfter(nowIST)) {
				return res.status(400).json({
					success: false,
					message: 'End date/time must be greater than current Indian Standard Time'
				});
			}
			endDateTime = endMoment.toDate();
		}

		const dripMarketingRule = new DripMarketingRule({
			name,
			leadType: resolvedLeadType,
			startDate: startDateTime,
			...(endDateTime && { endDate: endDateTime }),
			
			conditionBlocks: scopedConditionBlocks,
			interBlockLogicOperator,
			additionalActions: [],
			communication,
			collegeId: collegeId,
			uiState,
			createdBy: user._id,
			
		});

		console.log("dripMarketingRule",dripMarketingRule)

		await dripMarketingRule.save();

		res.status(201).json({
			success: true,
			message: 'Drip Marketing Rule created successfully',
			dripMarketingRule,
		});

	} catch (error) {
		console.error('Error creating drip marketing rule:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.put('/status-update/:id', [isCollege], async (req, res) => {
	try {
		
	const {status}=req.body;

	const id = req.params.id;

		const collegeId = req.user.college._id;
		const user = req.user._id;
		const wantsActive = status === true || status === 'true';

		if (wantsActive) {
			const rule = await DripMarketingRule.findOne({ _id: id, collegeId });
			if (!rule) {
				return res.status(404).json({ success: false, message: 'Rule not found' });
			}
			const nowIST = moment().utcOffset('+05:30');
			if (!rule.endDate || !moment(rule.endDate).isAfter(nowIST)) {
				return res.status(400).json({
					success: false,
					code: 'END_DATE_PASSED',
					message: 'End date/time must be greater than current Indian Standard Time. Please update end date and end time before activating.'
				});
			}
		}

		const updateRule = await DripMarketingRule.findByIdAndUpdate(id, {isActive: status , updatedBy: user}, {new: true});


		res.status(201).json({
			success: true,
			message: 'Drip Marketing Rule status updated successfully',
			updateRule,
		});

	} catch (error) {
		console.error('Error updating drip marketing rule status:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.put('/update-dripmarketing-rule/:id', [isCollege], async (req, res) => {
try{
	let {name, startDate, startTime, endDate, endTime, conditionBlocks, interBlockLogicOperator, primaryAction, additionalActions, communication ,uiState, leadType} = req.body;

	// console.log("req.body",req.body)
	const collegeId = req.user.college._id;
	const user = req.user;
	const resolvedLeadType = leadType === 'b2b' ? 'b2b' : (leadType === 'b2c' ? 'b2c' : undefined);

	let scopedConditionBlocks = conditionBlocks;
	if (resolvedLeadType === 'b2b' || (!resolvedLeadType && req.body?.leadType === 'b2b')) {
		const access = getB2bAccessScope(user);
		const enforced = enforceB2bConditionAccess(conditionBlocks, access);
		if (!enforced.ok) {
			return res.status(403).json({ success: false, message: enforced.message });
		}
		scopedConditionBlocks = enforced.conditionBlocks;
	} else {
		const access = getB2cAccessScope(user);
		const enforced = enforceB2cConditionAccess(conditionBlocks, access);
		if (!enforced.ok) {
			return res.status(403).json({ success: false, message: enforced.message });
		}
		scopedConditionBlocks = enforced.conditionBlocks;
	}

	

	
	const startMoment = parseDateTimeIST(startDate, startTime);
	const startDateTime = startMoment ? startMoment.toDate() : new Date(`${getISTDatePart(startDate)}T${startTime}`);

	let endDateTime;
	if (endDate && endTime) {
		const endMoment = parseDateTimeIST(endDate, endTime);
		const nowIST = moment().utcOffset('+05:30');
		console.log('[Drip] endDate check (update)', {
			rawEndDate: endDate,
			rawEndTime: endTime,
			parsedIST: endMoment ? endMoment.format('YYYY-MM-DD HH:mm Z') : null,
			nowIST: nowIST.format('YYYY-MM-DD HH:mm Z'),
			isAfter: endMoment ? endMoment.isAfter(nowIST) : false
		});
		if (!endMoment || !endMoment.isAfter(nowIST)) {
			return res.status(400).json({
				success: false,
				message: 'End date/time must be greater than current Indian Standard Time'
			});
		}
		endDateTime = endMoment.toDate();
	}

	const setPayload = {
		name,
		startDate: startDateTime,
		...(endDateTime && { endDate: endDateTime }),
		conditionBlocks: scopedConditionBlocks,
		interBlockLogicOperator,
		communication,
		uiState,
		collegeId: collegeId,
		updatedBy: user._id
	};
	if (resolvedLeadType) setPayload.leadType = resolvedLeadType;

	// IF + communication only — clear field-update THEN actions for B2B and B2C
	setPayload.additionalActions = [];
	const updateQuery = { $set: setPayload, $unset: { primaryAction: 1 } };

	const dripMarketingRule = await DripMarketingRule.findByIdAndUpdate(req.params.id, updateQuery, {new: true});
	console.log("dripMarketingRule",dripMarketingRule)

	return res.status(200).json({ success: true, message: 'Drip Marketing Rule updated successfully', data: dripMarketingRule });
}
catch(err){
	console.error('Error updating drip marketing rule:', err);
	res.status(500).json({ success: false, message: 'Server error' });
}
})

router.get('/get-dripmarketing-rule', [isCollege], async (req, res) => {
	try {
		// console.log("edit rules")
		const collegeId = req.user.college._id;
		const leadType = req.query.leadType === 'b2b' ? 'b2b' : 'b2c';
		const filter = { collegeId };
		if (leadType === 'b2b') {
			filter.leadType = 'b2b';
		} else {
			// Backward compatible: old rules without leadType are treated as b2c
			filter.$or = [{ leadType: 'b2c' }, { leadType: { $exists: false } }, { leadType: null }];
		}
		const dripMarketingRule = await DripMarketingRule.find(filter).populate('createdBy');
		
		// Format the data to separate date and time for frontend (IST)
		const formatDateTime = (dateValue) => {
			const m = moment(dateValue).utcOffset('+05:30');
			const hours = m.hours();
			const minutes = m.minutes();
			const ampm = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours % 12 || 12;
			return {
				date: m.format('YYYY-MM-DD'),
				time: `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`
			};
		};

		const formattedRules = dripMarketingRule.map(rule => {
			const ruleObj = rule.toObject();
			
			
			if (ruleObj.startDate) {
				const formatted = formatDateTime(ruleObj.startDate);
				ruleObj.startDate = formatted.date;
				ruleObj.startTime = formatted.time;
			}

			if (ruleObj.endDate) {
				const formatted = formatDateTime(ruleObj.endDate);
				ruleObj.endDate = formatted.date;
				ruleObj.endTime = formatted.time;
			}
			
			return ruleObj;
		});
		
		// console.log("dripMarketingRule",dripMarketingRule[0])
		res.status(200).json({ success: true, data: formattedRules });
	}
	catch (error) {
		console.error('Error fetching drip marketing rule:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

/** Preview how many people match current IF conditions (no send) */
router.post('/preview-match-count', [isCollege], async (req, res) => {
	try {
		const collegeId = req.user.college._id;
		const { leadType, conditionBlocks, interBlockLogicOperator } = req.body || {};
		const resolvedLeadType = leadType === 'b2b' ? 'b2b' : 'b2c';

		let scopedConditionBlocks = conditionBlocks || [];
		if (resolvedLeadType === 'b2b') {
			const access = getB2bAccessScope(req.user);
			const enforced = enforceB2bConditionAccess(scopedConditionBlocks, access);
			if (!enforced.ok) {
				return res.status(403).json({ success: false, message: enforced.message });
			}
			scopedConditionBlocks = enforced.conditionBlocks;
		} else {
			const access = getB2cAccessScope(req.user);
			const enforced = enforceB2cConditionAccess(scopedConditionBlocks, access);
			if (!enforced.ok) {
				return res.status(403).json({ success: false, message: enforced.message });
			}
			scopedConditionBlocks = enforced.conditionBlocks;
		}

		const result = await countMatchingLeads({
			collegeId,
			leadType: resolvedLeadType,
			conditionBlocks: scopedConditionBlocks,
			interBlockLogicOperator: interBlockLogicOperator || 'and'
		});

		return res.status(200).json({
			success: true,
			count: result.count,
			scanned: result.scanned,
			capped: result.capped,
			message: result.capped
				? `Showing matches within first ${result.scanned} scanned leads`
				: undefined
		});
	} catch (error) {
		console.error('Error previewing drip match count:', error);
		return res.status(500).json({ success: false, message: error.message || 'Server error' });
	}
});

/** Manually trigger drip evaluation + due WhatsApp sends (for testing) */
router.post('/run-now', [isCollege], async (req, res) => {
	try {
		const result = await runDripMarketingTick();
		return res.status(200).json({
			success: true,
			message: 'Drip marketing tick completed',
			result
		});
	} catch (error) {
		console.error('Error running drip marketing:', error);
		return res.status(500).json({ success: false, message: error.message || 'Server error' });
	}
});

/** List queued / sent drip jobs for this college */
router.get('/jobs', [isCollege], async (req, res) => {
	try {
		const collegeId = req.user.college._id;
		const { status, ruleId } = req.query;
		const filter = { collegeId };
		if (status) filter.status = status;
		if (ruleId && mongoose.Types.ObjectId.isValid(ruleId)) filter.ruleId = ruleId;

		const jobs = await DripMarketingJob.find(filter)
			.sort({ createdAt: -1 })
			.limit(200)
			// leadRef (refPath) → AppliedCourses or B2BLead
			.populate('leadId')
			.lean();

		return res.status(200).json({ success: true, data: jobs });
	} catch (error) {
		console.error('Error fetching drip jobs:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
});

module.exports = router; 