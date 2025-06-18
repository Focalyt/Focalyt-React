// server.js
let express = require("express");
let mongoose = require('mongoose');
let cors = require('cors');
let router = express.Router();


// Status Model
let Status = require('../../models/status');
let { AppliedCourses, CandidateProfile, Courses, Center } = require('../../models');

// @route   GET api/statuses
// @desc    Get All Statuses
// @access  Public
router.route("/addleaddandcourseapply")
    .post(async (req, res) => {
        console.log("req.body");

        try {
            console.log("Incoming body:", req.body);

            let { FirstName, MobileNumber, Gender, DateOfBirth, Email, courseId, Field4} = req.body;
            let mobile = MobileNumber;
            let name = FirstName;
            let sex = Gender;
            let dob = DateOfBirth;
            let email = Email;

            let course = await Courses.findById(courseId);
            if (!course) {
                return res.status(400).json({ status: false, msg: "Course not found" });
            }
      
            let centerName = Field4?.trim(); // Trim kar diya yahan
            let selectedCenterName = await Center.findOne({name: centerName, college: course.college});
            if(!selectedCenterName){
                return res.status(400).json({ status: false, msg: "Center not found" });
            }         

            let selectedCenter = selectedCenterName._id;

            if (mongoose.Types.ObjectId.isValid(courseId)) courseId = new mongoose.Types.ObjectId(courseId);
            if (mongoose.Types.ObjectId.isValid(selectedCenter)) selectedCenter = new mongoose.Types.ObjectId(selectedCenter);

            if (dob) dob = new Date(dob);

            // Fetch course
            

            let existingCandidate = await CandidateProfile.findOne({ mobile });
            let alreadyApplied = await AppliedCourses.findOne({ _candidate: existingCandidate._id, _course: courseId });
            if(alreadyApplied){
                return res.json({ status: false, msg: "Candidate already exists and course already applied", data:{existingCandidate, alreadyApplied} });
            }
            if (existingCandidate) {
                let appliedCourseEntry = await AppliedCourses.create({
                    _candidate: existingCandidate._id,
                    _course: courseId,
                    _center: selectedCenter
                });

                return res.json({ status: true, msg: "Candidate already exists and course applied successfully", data:{existingCandidate, appliedCourseEntry} });

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
            let candidate = await CandidateProfile.create(candidateData);

            console.log('selectedCenter', typeof selectedCenter)
            // ✅ Insert AppliedCourses Record
            let appliedCourseEntry = await AppliedCourses.create({
                _candidate: candidate._id,
                _course: courseId,
                _center: selectedCenter
            });

            console.log("Candidate Profile created and Course Applied.");

            // ✅ Optional: Update your Google Spreadsheet


            res.json({ status: true, msg: "Candidate added and course applied successfully", data:{candidate, appliedCourseEntry} });
        }

        } catch (err) {
            console.error(err);
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    });


module.exports = router;