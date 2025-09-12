const express = require('express');
const router = express.Router();
const { isCollege } = require('../../../helpers');
const { AppliedCourses, StatusLogs, User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, CandidateProfile, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, StatusB2b, Center, Courses, B2cFollowup } = require("../../models");
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
		console.log("vertical", vertical);
		console.log("filter", filter);
		const projects = await Project.find(filter).sort({ createdAt: -1 });
		console.log("projects", projects);
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





module.exports = router; 