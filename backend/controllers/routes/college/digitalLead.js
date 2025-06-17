// server.js
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();


// Status Model
const Status = require('../../models/status');
const {AppliedCourses, CandidateProfile, Courses} = require('../../models');

// @route   GET api/statuses
// @desc    Get All Statuses
// @access  Public
router.route("/addleaddandcourseapply")
	.post( async (req, res) => {
		console.log("req.body");

		try {
			console.log("Incoming body:", req.body);

			let { name, mobile,sex, dob,email, courseId, selectedCenter} = req.body;

			if (mongoose.Types.ObjectId.isValid(courseId)) courseId = new mongoose.Types.ObjectId(courseId);
			if (mongoose.Types.ObjectId.isValid(selectedCenter)) selectedCenter = new mongoose.Types.ObjectId(selectedCenter);

			if (dob) dob = new Date(dob); 

			// Fetch course
			const course = await Courses.findById(courseId);
			if (!course) {
				return res.status(400).json({ status: false, msg: "Course not found" });
			}

			

			// ✅ Build CandidateProfile Data
			let candidateData = {
				name,
				mobile,
				email,
				sex,
				dob,
                appliedCourses: [
					{
						courseId: courseId,
						centerId: selectedCenter
					}
				],
				verified: false
			};

			console.log("Final Candidate Data:", candidateData);

			// ✅ Create CandidateProfile
			const candidate = await CandidateProfile.create(candidateData);

			console.log('selectedCenter' , typeof selectedCenter)
			// ✅ Insert AppliedCourses Record
			const appliedCourseEntry = await AppliedCourses.create({
				_candidate: candidate._id,
				_course: courseId,
				_center: selectedCenter
			});

			console.log("Candidate Profile created and Course Applied.");

			// ✅ Optional: Update your Google Spreadsheet
			

			res.json({ status: true, msg: "Candidate added and course applied successfully", data: candidate });

		} catch (err) {
			console.error(err);
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});


module.exports = router;