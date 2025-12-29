const express = require('express');
const router = express.Router();
const moment = require('moment');
const { isCollege } = require('../../../helpers');
const { AppliedCourses, StatusLogs, User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, CandidateProfile, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, StatusB2b, Center, Courses, B2cFollowup, DripMarketingRule } = require("../../models");
const bcrypt = require("bcryptjs");
let fs = require("fs");
let path = require("path");

const axios = require("axios");
const mongoose = require('mongoose');

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

		return res.json({
			status: true,
			message: "Verticals fetched successfully",
			data: verticals
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
		
		res.json({ success: true, data: projects });
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/list_all_projects', [isCollege], async (req, res) => {
	try {
		const collegeId = req.user.college._id;


		const projects = await Project.find({ status: 'active', college: collegeId }).sort({ createdAt: -1 });
		
		res.json({ success: true, data: projects });
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
		let {name, startDate, startTime, conditionBlocks, interBlockLogicOperator, primaryAction, additionalActions, communication ,uiState} = req.body;
		
		if(!name  || !startDate || !startTime || !conditionBlocks || !interBlockLogicOperator || !primaryAction || !additionalActions || !communication) {
			return res.status(400).json({ success: false, message: 'All fields are required' });
		}
		


		const collegeId = req.user.college._id;
		const user = req.user;


		const datePart = startDate.split("T")[0];  // "2025-09-20"
	const startDateTimeString = `${datePart}T${startTime}`;
	const startDateTime = new Date(startDateTimeString);



		const dripMarketingRule = new DripMarketingRule({
			name,
			
			startDate: startDateTime,
			
			conditionBlocks,
			interBlockLogicOperator,
			primaryAction,
			additionalActions,
			communication,
			collegeId: collegeId,
			
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
	let {name, startDate, startTime,  conditionBlocks, interBlockLogicOperator, primaryAction, additionalActions, communication ,uiState} = req.body;

	// console.log("req.body",req.body)
	const collegeId = req.user.college._id;
	const user = req.user;

	

	
	const datePart = startDate.split("T")[0];  // "2025-09-20"
	const startDateTimeString = `${datePart}T${startTime}`;
	const startDateTime = new Date(startDateTimeString);

	const dripMarketingRule = await DripMarketingRule.findByIdAndUpdate(req.params.id, {name, startDate: startDateTime,  conditionBlocks, interBlockLogicOperator, primaryAction, additionalActions, communication, uiState, collegeId: collegeId, updatedBy: user._id}, {new: true});
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
		const dripMarketingRule = await DripMarketingRule.find({ collegeId: collegeId }).populate('createdBy');
		
		// Format the data to separate date and time for frontend
		const formattedRules = dripMarketingRule.map(rule => {
			const ruleObj = rule.toObject();
			
			
			if (ruleObj.startDate) {
				const startDate = new Date(ruleObj.startDate);
				ruleObj.startDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
				
				
				const hours = startDate.getHours();
				const minutes = startDate.getMinutes();
				const ampm = hours >= 12 ? 'PM' : 'AM';
				const displayHours = hours % 12 || 12; 
				ruleObj.startTime = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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



module.exports = router; 