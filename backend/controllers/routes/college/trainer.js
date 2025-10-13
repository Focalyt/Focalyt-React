const express = require('express');
const router = express.Router();
const uuid = require('uuid/v1');
const { isCollege, isTrainer } = require('../../../helpers');
const { Parser } = require("json2csv");
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const puppeteer = require("puppeteer");
const { ObjectId } = require('mongoose').Types.ObjectId;



const AWS = require("aws-sdk");
const multer = require('multer');
const crypto = require("crypto");

const {
    accessKeyId,
    secretAccessKey,
    bucketName,
    region,
    authKey,
    msg91WelcomeTemplate,
} = require("../../../config");

AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
});

const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const allowedDocumentExtensions = ['pdf', 'doc', 'docx']; // ✅ PDF aur DOC types allow karein

const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, ...allowedDocumentExtensions];
const { AppliedCourses, StatusLogs, User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, CandidateProfile, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, StatusB2b, Center, Courses, B2cFollowup, TrainerTimeTable } = require("../../models");


const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');
if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const storage = multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage }).single('file');

router.post('/trinerValidation' ,isTrainer,  async(req, res)=>{


})


router.post('/addTrainer', isCollege, async (req, res) => {
    try {
        const { name, email, mobile, designation } = req.body;
        
        if (!name || !email || !mobile) {
            return res.status(400).json({
                success: false,
                message: "All Fields are required"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
            role: 4,
            isDeleted: false
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const existingMobile = await User.findOne({
            mobile: parseInt(mobile),
            role: 4,
            isDeleted: false
        });

        if (existingMobile) {
            return res.status(400).json({
                success: false,
                message: 'User with this mobile number already exists'
            });
        }

        const currentUserId =  req.user ? req.user.id : null;

        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            mobile: parseInt(mobile),
            designation: designation ,
            role: 4,
            status: true,
            password: 'Focalyt',
            isDeleted: false,
            userAddedby: currentUserId
        });
        
        const savedUser = await newUser.save()
        
       
        if (req.college && req.college._id) {
            await College.findByIdAndUpdate(
                req.college._id,
                { $addToSet: { trainers: savedUser._id } },
                { new: true }
            );
        }

        const userResponse ={
            id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
            mobile: savedUser.mobile,
            designation: savedUser.designation,
            role: savedUser.role,
            status: savedUser.status,
            created_at: savedUser.createdAt
        }

    //   console.log("newUser" , newUser)
        res.status(200).json({
            status: true,
            message: `User "${name}" added successfully`,
            data: userResponse
        });

        }
        catch (err) {
            console.log('====================>!err ', err.message)
            return res.send({ status: false, error: err.message });

        }
})
router.put('/update/:id', isCollege, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, mobile, designation } = req.body;
        
        if (!name || !email || !mobile) {
            return res.status(400).json({
                success: false,
                message: "All Fields are required"
            });
        }

        
        const existingTrainer = await User.findOne({
            _id: id,
            role: 4,
            isDeleted: false
        });

        if (!existingTrainer) {
            return res.status(404).json({
                success: false,
                message: 'Trainer not found'
            });
        }

       
        const emailExists = await User.findOne({
            email: email.toLowerCase(),
            role: 4,
            isDeleted: false,
            _id: { $ne: id }
        });

        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists for another trainer'
            });
        }

        // Check if mobile is already taken by another trainer
        const mobileExists = await User.findOne({
            mobile: parseInt(mobile),
            role: 4,
            isDeleted: false,
            _id: { $ne: id }
        });

        if (mobileExists) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number already exists for another trainer'
            });
        }

        // Update the trainer
        const updatedTrainer = await User.findByIdAndUpdate(
            id,
            {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                mobile: parseInt(mobile),
                designation: designation,
                updatedAt: new Date()
            },
            { new: true }
        );

        const userResponse = {
            id: updatedTrainer._id,
            name: updatedTrainer.name,
            email: updatedTrainer.email,
            mobile: updatedTrainer.mobile,
            designation: updatedTrainer.designation,
            role: updatedTrainer.role,
            status: updatedTrainer.status,
            updated_at: updatedTrainer.updatedAt
        };

        res.status(200).json({
            status: true,
            message: `Trainer "${name}" updated successfully`,
            data: userResponse
        });

    } catch (err) {
        console.log('Error in PUT /update:', err.message);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
});

router.get('/trainers', isCollege ,async (req, res) => {
    try {
        const user = req.user;
        // console.log("user" , user)
       
        const trainers = await User.find({
            role: 4,
            isDeleted: false
        })
        
        res.status(200).json({
            status: true,
            message: "Trainers retrieved successfully",
            data: trainers,
            count: trainers.length
        });
        
    } catch (err) {
        console.log('Error in GET /trainers:', err.message);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
})

router.route("/mark-attendance").post(isTrainer, async (req, res) => {
	try {
		const user = req.user;
		const { 
			appliedCourseId, 
			date, 
			status, 
			period = 'regularPeriod', 
			remarks = '' 
		} = req.body;

		console.log("req.body", req.body);

		// Validate required fields
		if (!appliedCourseId || !date || !status) {
			return res.status(400).json({
				status: false,
				message: "appliedCourseId, date, and status are required"
			});
		}

		// Validate status
		if (!['Present', 'Absent'].includes(status)) {
			return res.status(400).json({
				status: false,
				message: "Status must be 'Present' or 'Absent'"
			});
		}

		// Validate period
		if (!['zeroPeriod', 'regularPeriod'].includes(period)) {
			return res.status(400).json({
				status: false,
				message: "Period must be 'zeroPeriod' or 'regularPeriod'"
			});
		}

		// Find the applied course
		const appliedCourse = await AppliedCourses.findById(appliedCourseId)
			.populate('_course')
			.populate('batch');

		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: "Applied course not found"
			});
		}

		// Verify that the course belongs to the college
		const college = await College.findOne({
			'trainers': user._id 
		});

		if (!college) {
			return res.status(403).json({
				status: false,
				message: "College not found"
			});
		}

		if (String(appliedCourse._course.college) !== String(college._id)) {
			return res.status(403).json({
				status: false,
				message: "You don't have permission to mark attendance for this course"
			});
		}

		// Mark attendance using the schema method
		await appliedCourse.markAttendance(date, status, period, user._id, remarks);

		// Get updated attendance data
		const updatedCourse = await AppliedCourses.findById(appliedCourseId)
			.populate('_course')
			.populate('batch');

		res.status(200).json({
			status: true,
			message: "Attendance marked successfully",
			data: {
				appliedCourseId,
				date,
				status,
				period,
				markedBy: user._id,
				attendance: updatedCourse.attendance
			}
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			status: false,
			message: err.message || "Server Error"
		});
	}
});
module.exports = router;
