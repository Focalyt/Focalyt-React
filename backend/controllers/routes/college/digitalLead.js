// server.js
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();


// Status Model
const Status = require('../../models/status');
const { AppliedCourses, CandidateProfile, Courses, Center } = require('../../models');

// @route   GET api/statuses
// @desc    Get All Statuses
// @access  Public
router.route("/addleaddandcourseapply")
    .post(async (req, res) => {
        console.log("req.body");

        try {
            console.log("Incoming body:", req.body);

            let { name, MobileNumber, sex, dob, email, courseId, Field4} = req.body;
            const mobile = MobileNumber;
            const courseName = Field4?.trim();

            const course = await Courses.findById(courseId);
            if (!course) {
                return res.status(400).json({ status: false, msg: "Course not found" });
            }
      
            const centerName = Field4?.trim(); // Trim kar diya yahan
            const selectedCenter = await Center.findOne({name: centerName, college: course.college});
            console.log("selectedCenter", selectedCenter);
            if(!selectedCenter){
                return res.status(400).json({ status: false, msg: "Center not found" });
            }         


            if (mongoose.Types.ObjectId.isValid(courseId)) courseId = new mongoose.Types.ObjectId(courseId);
            if (mongoose.Types.ObjectId.isValid(selectedCenter)) selectedCenter = new mongoose.Types.ObjectId(selectedCenter);

            if (dob) dob = new Date(dob);

            // Fetch course
            

            const existingCandidate = await CandidateProfile.findOne({ mobile });
            if (existingCandidate) {
                const appliedCourseEntry = await AppliedCourses.create({
                    _candidate: existingCandidate._id,
                    _course: courseId,
                    _center: selectedCenter
                });

                return res.json({ status: true, msg: "Candidate already exists and course applied successfully", data: existingCandidate });

            }

            else{
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

            console.log('selectedCenter', typeof selectedCenter)
            // ✅ Insert AppliedCourses Record
            const appliedCourseEntry = await AppliedCourses.create({
                _candidate: candidate._id,
                _course: courseId,
                _center: selectedCenter
            });

            console.log("Candidate Profile created and Course Applied.");

            // ✅ Optional: Update your Google Spreadsheet


            res.json({ status: true, msg: "Candidate added and course applied successfully", data: candidate });
        }

        } catch (err) {
            console.error(err);
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    });


module.exports = router;