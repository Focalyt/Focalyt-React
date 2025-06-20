// server.js
let express = require("express");
let mongoose = require('mongoose');
let cors = require('cors');
let router = express.Router();


// Status Model
let Status = require('../../models/status');
let { AppliedCourses, CandidateProfile, Courses, Center, User } = require('../../models');

// @route   GET api/statuses
// @desc    Get All Statuses
// @access  Public
router.route("/addleaddandcourseapply")
    .post(async (req, res) => {
        console.log("req.body");

        try {
            console.log("Incoming body:", req.body);

            let { FirstName, MobileNumber, Gender, DateOfBirth, Email, courseId, Field4, source } = req.body;
            if(!source){
                source = 'FB Form';
            }

            if(!FirstName || !MobileNumber || !Gender || !DateOfBirth || !Email || !courseId || !Field4){
                return res.status(400).json({ status: false, msg: "All fields are required" });
            }

            if (MobileNumber) {
                MobileNumber = MobileNumber.toString();  // Convert to string
            
                // Check the type after conversion
                console.log('MobileNumber:', MobileNumber, 'Type:', typeof MobileNumber); 
            
                // Remove +91 or 91 prefix if present
                if (MobileNumber.startsWith('+91')) {
                    MobileNumber = MobileNumber.slice(3);  // Remove +91
                } else if (MobileNumber.startsWith('91') && MobileNumber.length === 12) {
                    MobileNumber = MobileNumber.slice(2);  // Remove 91
                }
            
                // Validate the 10-digit mobile number
                if (!/^[0-9]{10}$/.test(MobileNumber)) {
                    return res.status(400).json({ message: 'Invalid mobile number format' });
                }
            MobileNumber = parseInt(MobileNumber);

            
                // Continue processing
            } else {
                return res.status(400).json({ message: 'Mobile number is required' });
            }

            

            let mobile = MobileNumber;
            let name = FirstName;
            let sex = Gender;
            let dob = DateOfBirth;
            let email = Email;

           

            if(typeof courseId === 'string'){
                courseId = new mongoose.Types.ObjectId(courseId);
            }

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
            if(existingCandidate){
               
            
            let alreadyApplied = await AppliedCourses.findOne({ _candidate: existingCandidate._id, _course: courseId });
            if(alreadyApplied){
                return res.json({ status: false, msg: "Candidate already exists and course already applied", data:{existingCandidate, alreadyApplied} });
            }
            if (existingCandidate && !alreadyApplied) {
                let appliedCourseEntry = await AppliedCourses.create({
                    _candidate: existingCandidate._id,
                    _course: courseId,
                    _center: selectedCenter
                });

                return res.json({ status: true, msg: "Candidate already exists and course applied successfully", data:{existingCandidate, appliedCourseEntry} });

            }}

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
                verified: false,
                source
            };


            console.log("Final Candidate Data:", candidateData);

            // ✅ Create CandidateProfile
            let candidate = await CandidateProfile.create(candidateData);
            let user = await User.create({
                name: candidate.name,
                email: candidate.email,
                mobile: candidate.mobile,
                role: 3,
                status: true,
                source
            });

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