const express = require("express");
const uuid = require('uuid/v1');
const cron = require('node-cron');

const { isCollege, auth1, authenti, getAllTeamMembers } = require("../../../helpers");
const { extraEdgeAuthToken, extraEdgeUrl, env, baseUrl } = require("../../../config");
const axios = require("axios");
const mongoose = require('mongoose');

const { ObjectId } = require('mongoose').Types.ObjectId;
const puppeteer = require("puppeteer");
const { CollegeValidators } = require('../../../helpers/validators')
const { AppliedCourses, User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, Candidate, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, Center, Courses } = require("../../models");
const bcrypt = require("bcryptjs");
let fs = require("fs");
let path = require("path");
const candidateRoutes = require("./candidate");
const digitalLeadRoutes = require('./digitalLead');
const leadAssignmentRuleRoutes = require("./leadAssingmentRule");


const batchRoutes = require("./batches");
const statusRoutes = require("./status");
const skillTestRoutes = require("./skillTest");
const careerObjectiveRoutes = require("../college/careerObjective");
const todoRoutes = require("./todo");
const userRoutes = require("./users");
const smsRoutes = require("./sms");
const roleManagementRoutes = require("./roleManagement");
const coverLetterRoutes = require("./coverLetter");
const mockInterviewRoutes = require("./mockInterview");
const coursesRoutes = require("./courses");
const router = express.Router();
const moment = require('moment')
router.use("/todo", isCollege, todoRoutes);
router.use("/digitalLead", digitalLeadRoutes);
router.use("/leadAssignmentRule", isCollege, leadAssignmentRuleRoutes);
router.use("/users", userRoutes);
router.use("/batches", isCollege, batchRoutes);
router.use("/sms", isCollege, smsRoutes);
router.use("/roles", isCollege, roleManagementRoutes);
router.use("/candidate", isCollege, candidateRoutes);
router.use("/skillTest", isCollege, skillTestRoutes);
router.use("/careerObjective", isCollege, careerObjectiveRoutes);
// router.use(isCollege);
router.use("/coverLetter", isCollege, coverLetterRoutes);
router.use("/mockInterview", isCollege, mockInterviewRoutes);
router.use("/courses", isCollege, coursesRoutes);
router.use("/status", statusRoutes);
const readXlsxFile = require("read-excel-file/node");
const appliedCourses = require("../../models/appliedCourses");


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
// Define the custom error
class InvalidParameterError extends Error {
	constructor(message) {
		super(message);
		this.name = 'InvalidParameterError';
	}
}

const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const allowedDocumentExtensions = ['pdf', 'doc', 'docx']; // ✅ PDF aur DOC types allow karein

const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, ...allowedDocumentExtensions];


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

// Utility function to check and convert string to ObjectId
const validateAndConvertId = (id) => {
	try {
		// If it's already an ObjectId, return it
		if (id instanceof mongoose.Types.ObjectId) {
			return id;
		}

		// If it's a string, check if it's a valid ObjectId
		if (typeof id === 'string') {
			if (!mongoose.Types.ObjectId.isValid(id)) {
				throw new Error('Invalid ObjectId format');
			}
			return new mongoose.Types.ObjectId(id);
		}

		throw new Error('Invalid ID type');
	} catch (error) {
		throw new Error(`ID validation failed: ${error.message}`);
	}
};

// Function to update followups at 11:55 PM IST
const updateFollowupsToMissed = async () => {
	try {
		// Get current time in IST (UTC+5:30)
		const now = new Date();
		const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
		const hours = istTime.getUTCHours();
		const minutes = istTime.getUTCMinutes();

		// Check if current time is exactly 11:55 PM IST
		if (hours === 23 && minutes === 55) {
			// Fetch all profiles with 'Planned' followups
			const profiles = await AppliedCourses.find({
				'followups.status': 'Planned',
				'followups.date': { $lte: new Date() }  // Ensure followup date is in the past or current
			});

			// Loop through profiles to update 'Planned' followups to 'Missed'
			for (const profile of profiles) {
				// Map through followups array and update status
				const updatedFollowups = profile.followups.map(followup => {
					if (followup.status === 'Planned') {
						followup.status = 'Missed';  // Change status to 'Missed'
					}
					return followup;
				});

				// Update the followups array and save the changes
				profile.followups = updatedFollowups;

				// Add log entry for the status change
				profile.logs.push({
					user: new mongoose.Types.ObjectId('64ab1234abcd5678ef901234'), // System user ID
					timestamp: new Date(),
					action: 'Followup Status Changed',
					remarks: `Followup status automatically changed from 'Planned' to 'Missed' for date ${followup.date}`
				});

				await profile.save();
			}
		}
	} catch (error) {
		console.error('Error updating followups to missed:', error);
	}
};

// Schedule the cron job to run at 11:55 PM every day
cron.schedule('55 23 * * *', updateFollowupsToMissed);  // This will run at 11:55 PM every day

router.route('/')
	.get(async (req, res) => {
		let user = req.session.user
		if (!user) {
			res.redirect("/college/login");
		}
		else {
			res.redirect("/college/dashboard");
		}
	})
router.route("/login")

	.post(async (req, res) => {
		try {

			const { userInput, password } = req.body;

			let query = {
				$or: []
			};

			const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput);

			// If it's email
			if (isEmail) {
				query.$or.push({ email: userInput, role: 2 });
			} else {
				// Assume it's mobile — convert to number
				const mobileNumber = Number(userInput);
				query.$or.push({ mobile: mobileNumber, role: 2 });
			}


			const user = await User.findOne(query);

			if (!user) {
				return res.json({ status: false, error: "User not found" });
			}

			const isMatch = user.validPassword(password);

			if (!isMatch) {
				return res.json({ status: false, error: "Wrong password" });

			}
			const userId = new mongoose.Types.ObjectId(user._id);
			// const college = await College.findOne({ _concernPerson: { $in: [{ _id: userId }] } }, "name");
			const college = await College.findOne({
				_concernPerson: { $elemMatch: { _id: userId } }
			}, "name _concernPerson");

			if (!college || college === null) {
				console.log('Missing College!');

				return res.json({ status: false, message: 'Missing College!' });

			};
			// Extract isDefaultAdmin from _concernPerson
			const concernPersonData = college._concernPerson.find(p => p._id.toString() === userId.toString());
			const isDefaultAdmin = concernPersonData?.isDefaultAdmin || false;
			const token = await user.generateAuthToken();


			userData = {
				_id: user._id, name: user.name, role: 2, email: user.email, mobile: user.mobile, collegeName: college.name, collegeId: college._id, token, isDefaultAdmin
			};
			return res.json({ status: true, message: "Login successful", userData });

		} catch (err) {
			console.log('====================>!err ', err.message)
			return res.send({ status: false, error: err.message });
		}
	});

router.route("/register")
	.post(async (req, res) => {
		try {
			const { collegeName, concernedPerson, email, mobile, type, password, confirmPassword, location } = req.body;

			const { value, error } = await CollegeValidators.register(req.body)
			if (error) {
				console.log('====== register error ', error, value)
				return res.send({ status: false, error: error.message });
			}
			let checkEmail = await User.findOne({
				email: email,
				isDeleted: false,
				role: 2,
			});
			let checkNumber = await User.findOne({
				mobile,
				isDeleted: false,
				role: 2,
			});
			if (checkNumber || checkEmail) {
				return res.send({
					status: "failure",
					error: "Number Or Email already exists!",
				});
			}

			if (!checkEmail && !checkNumber) {
				if (password === confirmPassword) {
					const user = await User.create({
						name: concernedPerson,
						email,
						mobile,
						role: 2,
						password,
						permissions: {
							permission_type: 'Admin',
						}
					});
					if (!user) {
						return res.send({
							status: "failure",
							error: "College user not created!",
						});
					}
					let college = await College.create({
						_concernPerson: [{ _id: user._id, defaultAdmin: true }],
						name: collegeName,
						type: type,
						location
					});
					if (!college) {
						return res.send({ status: "failure", error: "College not created!" });
					}
					return res.send({
						status: "success",
						message: "College registered successfully",
					})
				}
				else {
					return res.send({ status: false, error: "Password and Confirm Password not matched" });

				}
			}
		} catch (err) {
			console.log('====================>!err ', err.message)
			return res.send({ status: false, error: err.message });
		}
	});
router.route("/appliedCandidates").get(isCollege, async (req, res) => {

	try {
		const user = req.user;
		const teamMembers = await getAllTeamMembers(user._id);
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;      // Default page 1
		const limit = parseInt(req.query.limit) || 50;   // Default limit 50
		const skip = (page - 1) * limit;

		let appliedCourses = [];

		for (const member of teamMembers) {
			const response = await AppliedCourses.find({
				kycStage: { $nin: [true] },
				kyc: { $nin: [true] },
				admissionDone: { $nin: [true] },
				$or: [
					// registeredBy field se match (single member ke liye)
					{ registeredBy: member }, // $in hata diya kyunki member ek single value hai
			
					// leadAssignment ke last element ki _id se match
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._id", -1] },
								member
							]
						}
					}
				]
			})
				.populate({
					path: '_course',
					populate: [
						{
							path: 'sectors',
							select: 'name'
						},
						{
							path: 'vertical',
							select: 'name'  // Add the fields you want to populate from the `vertical` path
						},
						{
							path: 'project',
							select: 'name'  // Add the fields you want to populate from the `project` path
						}
					]
				})
				.populate('_leadStatus')
				.populate('_center')
				.populate('registeredBy')
				.populate({
					path: '_candidate',
					populate: [
						{ path: '_appliedCourses', populate: [{ path: '_course', select: 'name description' }, { path: 'registeredBy', select: 'name email' }, { path: '_center', select: 'name location' }, { path: '_leadStatus', select: 'title' }] },
					]
				})
				.populate({
					path: 'logs',
					populate: {
						path: 'user',
						select: 'name'
					}
				})
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit);
			

			appliedCourses.push(...response);
		}






		const filteredAppliedCourses = appliedCourses.filter(doc => {
			// _course must be populated!
			return doc._course && String(doc._course.college) === String(college._id);
		});

		const result = filteredAppliedCourses.map(doc => {
			let selectedSubstatus = null;

			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			const docObj = doc.toObject();

			const firstSectorName = docObj._course?.sectors?.[0]?.name || 'N/A';
			if (docObj._course) {
				docObj._course.sectors = firstSectorName; // yahan replace ho raha hai
			}

			const requiredDocs = docObj._course?.docsRequired || [];
			const uploadedDocs = docObj.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});

			// Prepare combined docs array
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					// Agar uploaded hai to uploadedDoc details bhejo
					return {
						...uploadedDoc,
						Name: reqDoc.Name,        // Required document ka name bhi add kar lo
						mandatory: reqDoc.mandatory,
						_id: reqDoc._id
					};
				} else {
					// Agar uploaded nahi hai to Not Uploaded status ke saath dummy object bhejo
					return {
						docsId: reqDoc._id,
						Name: reqDoc.Name,
						mandatory: reqDoc.mandatory,
						status: "Not Uploaded",
						fileUrl: null,
						reason: null,
						verifiedBy: null,
						verifiedDate: null,
						uploadedAt: null
					};
				}
			});

			if (requiredDocs) {
				docsRequired = requiredDocs

				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = docsRequired.map(reqDoc => {
					// Convert Mongoose document to plain object
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

					// Find matching uploaded docs for this required doc
					const matchingUploads = uploadedDocs.filter(
						uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
					);

					return {
						_id: docObj._id,
						Name: docObj.Name || 'Document',
						mandatory: docObj.mandatory,
						description: docObj.description || '',
						uploads: matchingUploads || []
					};
				});


			} else {
				console.log("Course not found or no docs required");
			};

			// Count calculations
			let verifiedCount = 0;
			let RejectedCount = 0;
			let pendingVerificationCount = 0;
			let notUploadedCount = 0;

			allDocs.forEach(doc => {
				if (doc.status === "Verified") verifiedCount++;
				else if (doc.status === "Rejected") RejectedCount++;
				else if (doc.status === "Pending") pendingVerificationCount++;
				else if (doc.status === "Not Uploaded") notUploadedCount++;
			});

			const totalRequired = allDocs.length;
			const uploadedCount = allDocs.filter(doc => doc.status !== "Not Uploaded").length;
			const uploadPercentage = totalRequired > 0
				? Math.round((uploadedCount / totalRequired) * 100)
				: 0;
			return {
				...docObj,
				selectedSubstatus,
				uploadedDocs: combinedDocs,    // Uploaded + Not uploaded combined docs array
				docCounts: {
					totalRequired,
					RejectedCount,
					uploadedCount,
					verifiedCount,
					pendingVerificationCount,
					notUploadedCount,
					uploadPercentage
				}
			};
		});



		const totalCount = result.length


		res.status(200).json({
			success: true,
			count: result.length,
			page,
			limit,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			data: result,
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});




router.route('/dashboard').get(isCollege, async (req, res) => {
	let college = await College.findOne({ _concernPerson: { $elemMatch: { _id: req.user._id } }, status: true })

	let totalShortlisted
	let monthShortlisted
	let weekShortlisted
	let dayShortlisted
	let totalHired
	let monthHired
	let weekHired
	let dayHired
	let totalAppliedJobs
	let monthAppliedJobs
	let weekAppliedJobs
	let dayAppliedJobs
	let totalCandidates
	let monthCandidates
	let weekCandidates
	let dayCandidates
	if (college.place) {
		// Candidates

		// signups
		totalCandidates = await Candidate.find({ status: true, qualifications: { $elemMatch: { collegePlace: college.place } } }).countDocuments()
		monthCandidates = await Candidate.find({
			status: true, qualifications: { $elemMatch: { collegePlace: college.place } },
			createdAt: {
				$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
				$lte: moment().utcOffset('+05:30').endOf('month').toDate()
			}
		}
		).countDocuments()
		weekCandidates = await Candidate.find({
			status: true, qualifications: { $elemMatch: { collegePlace: college.place } },
			createdAt: {
				$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
				$lte: moment().utcOffset('+05:30').endOf('week').toDate()
			}
		}
		).countDocuments()
		dayCandidates = await Candidate.find({
			status: true, qualifications: { $elemMatch: { collegePlace: college.place } },
			createdAt: {
				$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
				$lte: moment().utcOffset('+05:30').endOf('day').toDate()
			}
		}
		).countDocuments()



		// Shortlisted
		totalShortlisted = await HiringStatus.aggregate([
			{ $match: { status: { '$ne': 'rejected' }, isDeleted: false } },
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		monthShortlisted = await HiringStatus.aggregate([
			{
				$match: {
					status: { '$ne': 'rejected' }, createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('month').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		weekShortlisted = await HiringStatus.aggregate([
			{
				$match: {
					status: { '$ne': 'rejected' }, createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('week').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		dayShortlisted = await HiringStatus.aggregate([
			{
				$match: {
					status: { '$ne': 'rejected' }, createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('day').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])


		// Hired

		totalHired = await HiringStatus.aggregate([
			{ $match: { status: 'hired', isDeleted: false } },
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		monthHired = await HiringStatus.aggregate([
			{
				$match: {
					status: 'hired', createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('month').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		weekHired = await HiringStatus.aggregate([
			{
				$match: {
					status: 'hired', createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('week').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
		dayHired = await HiringStatus.aggregate([
			{
				$match: {
					status: 'hired', createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('day').toDate()
					}, isDeleted: false
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: 'company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: 'candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])


		//applied jobs
		totalAppliedJobs = await AppliedJobs.aggregate([
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},
			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		monthAppliedJobs = await AppliedJobs.aggregate([
			{
				$match: {
					createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('month').toDate()
					}
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},
			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		weekAppliedJobs = await AppliedJobs.aggregate([
			{
				$match: {
					createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('week').toDate()
					}
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}
		])
		dayAppliedJobs = await AppliedJobs.aggregate([
			{
				$match: {
					createdAt: {
						$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
						$lte: moment().utcOffset('+05:30').endOf('day').toDate()
					}
				}
			},
			{
				$lookup: {
					from: 'companies',
					localField: '_company',
					foreignField: '_id',
					as: 'company'
				}
			},
			{ $match: { 'company.0.status': true, 'company.0.isDeleted': false } },
			{
				$lookup: {
					from: 'candidates',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},

			{
				$unwind: {
					path: '$candidate.0.qualifications',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$match: {
					'candidate.0.qualifications.collegePlace': college.place
				}
			}

		])
	} else {
		totalShortlisted = []
		monthShortlisted = []
		weekShortlisted = []
		dayShortlisted = []
		totalHired = []
		monthHired = []
		weekHired = []
		dayHired = []
		totalAppliedJobs = []
		monthAppliedJobs = []
		weekAppliedJobs = []
		dayAppliedJobs = []
		totalCandidates = 0
		monthCandidates = 0
		weekCandidates = 0
		dayCandidates = 0
	}

	// Company
	// signups
	const totalCompanies = await Company.find({ status: true }).countDocuments()
	const monthCompanies = await Company.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('month').toDate()
		}
	}
	).countDocuments()
	const weekCompanies = await Company.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('week').toDate()
		}
	}
	).countDocuments()
	const dayCompanies = await Company.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('day').toDate()
		}
	}
	).countDocuments()
	// jobs
	const totalJobs = await Vacancy.find({ status: true }).countDocuments()
	const dayJobs = await Vacancy.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('day').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('day').toDate()
		}
	})
		.countDocuments()
	const weekJobs = await Vacancy.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('week').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('week').toDate()
		}
	})
		.countDocuments()
	const monthJobs = await Vacancy.find({
		status: true, createdAt: {
			$gte: moment().utcOffset('+05:30').startOf('month').toDate(),
			$lte: moment().utcOffset('+05:30').endOf('month').toDate()
		}
	})
		.countDocuments()


	res.render(`${req.vPath}/app/college/dashboard`, {
		menu: 'dashboard',
		totalCandidates, dayCandidates, weekCandidates, monthCandidates,
		dayCompanies, weekCompanies, monthCompanies, totalCompanies,
		totalJobs, dayJobs, weekJobs, monthJobs,
		totalShortlisted: totalShortlisted.length,
		dayShortlisted: dayShortlisted.length,
		weekShortlisted: weekShortlisted.length,
		monthShortlisted: monthShortlisted.length,
		totalHired: totalHired.length,
		dayHired: dayHired.length,
		weekHired: weekHired.length,
		monthHired: monthHired.length,
		totalAppliedJobs: totalAppliedJobs.length,
		monthAppliedJobs: monthAppliedJobs.length,
		weekAppliedJobs: weekAppliedJobs.length,
		dayAppliedJobs: dayAppliedJobs.length
	});
})

router.route("/myprofile")
	.get(isCollege, async (req, res) => {
		let college = await College.findOne({ _id: req.session.user.collegeId, status: true })
			.populate([{
				path: "_concernPerson",
				select: "name designation email mobile"
			}])

		const state = await State.find({
			countryId: "101",
			status: { $ne: false },
		});

		let hasState = false;
		let st = {};
		if (college.stateId && isObjectIdValid(college.stateId)) {
			hasState = true;
			st = await State.findOne({ _id: college.stateId, status: { $ne: false } });
		} else {
			hasState = false;
		}
		const city = hasState
			? await City.find({ stateId: st.stateId, status: { $ne: false } })
			: [];
		let university = await University.find({ status: true }, "name")
		res.render(`${req.vPath}/app/college/myprofile`, { menu: 'myprofile', college, state, city, university });
	})
	.post(authenti, isCollege, async (req, res) => {
		try {
			const { collegeInfo, concernedPerson, representativeInfo } = req.body;
			const college = await College.findOne({
				_id: req.session.user.collegeId,
			});

			if (!college) throw req.ykError("College doesn't exist!");
			const userUpdatedFields = {};
			if (concernedPerson) {
				Object.keys(concernedPerson).forEach((key) => {
					if (concernedPerson[key] !== "") {
						userUpdatedFields[key] = concernedPerson[key];
					}
				});
			}

			const userUpdate = await User.findOneAndUpdate(
				{ _id: req.session.user._id, role: "2" },
				userUpdatedFields
			);

			if (!userUpdate) throw req.ykError("User not updated!");

			const updatedFields = { isProfileCompleted: true };
			if (representativeInfo && representativeInfo.length > 0) {
				updatedFields["collegeRepresentatives"] = representativeInfo;
			}

			if (collegeInfo) {
				Object.keys(collegeInfo).forEach((key) => {
					if (req.body.collegeInfo[key] !== "") {
						updatedFields[key] = collegeInfo[key];
					}
				});
			}

			const collegeUpdate = await College.findOneAndUpdate(
				{ _id: req.session.user.collegeId },
				updatedFields,
				{ new: true }
			).populate({ path: '_concernPerson' });

			if (!collegeUpdate) throw req.ykError("Candidate not updated!");
			req.flash("success", "Company updated successfully!");
			res.send({ status: 200, message: "Profile Updated Successfully" });
		} catch (err) {
			console.log('====================>!err ', err)
			req.flash("error", err.message || "Something went wrong!");
			return res.send({ status: "failure", error: "Something went wrong!" });
		}
	});

router.get('/availablejobs', [isCollege], async (req, res) => {
	try {
		const data = req.query
		const { qualification, experience, industry, state, jobType, minSalary, techSkills } = req.query
		const populate = [
			{
				path: "_qualification",
				select: ["name"]
			},
			{ path: "_industry" },
			{ path: "city" },
			{ path: "state" },
			{ path: "_company" },
			{ path: "_techSkills" }
		]
		let filter = { status: true, validity: { $gte: moment().utcOffset('+05:30') } }
		if (qualification) {
			filter._qualification = qualification
		}
		if (industry) {
			filter._industry = industry
		}
		if (state) {
			filter.state = state
		}
		if (jobType) {
			filter.jobType = jobType
		}
		if (experience) {
			experience == "0"
				? (filter["$or"] = [
					{ experience: { $gte: experience } },
				])
				: (filter["experience"] = { $gte: experience });
		}
		if (techSkills) {
			filter._techSkills = techSkills
		}
		if (minSalary) {
			filter["$or"] = [{ isFixed: true, amount: { $gte: minSalary } }, { isFixed: false, min: { $gte: minSalary } }]
		}
		const allQualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		const allIndustry = await Industry.find({ status: true })
		const allStates = await State.find({ countryId: '101', status: { $ne: false } })
		const allJobs = await Vacancy.find(filter).populate(populate)
		let jobs = allJobs.filter(job => job._company?.isDeleted === false && job._company?.status === true)
		let skills = await Skill.find({ status: true })
		res.render(`${req.vPath}/app/college/searchjob`, { menu: 'Jobs', jobs, allQualification, allIndustry, allStates, data, skills })
	} catch (err) {
		console.log('===============> err', err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})
router.get('/job/:jobId', [isCollege], async (req, res) => {
	try {
		const jobId = req.params.jobId
		const populate = [
			{ path: "_qualification" },
			{ path: "_industry" },
			{ path: "city" },
			{ path: "state" },
			{ path: "_jobCategory" },
			{ path: "_company", populate: "_concernPerson" },
			{ path: "_techSkills" },
			{ path: "_nonTechSkills" }
		]
		const jobDetails = await Vacancy.findById(jobId).populate(populate)
		const stateId = jobDetails._company.stateId
		const state = await State.findOne({ _id: stateId })
		const cityId = jobDetails._company.cityId
		const city = await City.findOne({ _id: cityId })

		res.render(`${req.vPath}/app/college/viewjob`, { menu: 'Jobs', jobDetails, state, city })
	} catch (err) {
		console.log('===============> err ', err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})

router.post('/uploadfiles', [isCollege], async (req, res) => {
	try {
		let files = req.files;
		if (req.files == undefined) {
			req.flash("error", "Please select file ");
			return res.redirect("/college/uploadCandidates");
		}
		var data1 = req.files.filename;
		if (!req.files.filename) {
			req.flash("error", "Please select file ");
			return res.redirect("/college/uploadCandidates");
		}
		const college = await College.findOne({ _concernPerson: req.session.user._id, status: true, isDeleted: false })
		if (!college) {
			req.flash("error", "College not found");
			return res.redirect("/college/uploadCandidates");

		}
		if (!(college.place && college.longitude && college.latitude)) {
			req.flash("error", "Complete Your Profile")
			return res.redirect("/college/uploadCandidates");
		}
		var checkFileError = true;
		let extension = req.files.filename.name.split(".").pop();
		console.log(extension, " -- Extension --");
		if (extension !== "ods" && extension !== "xlsx" && extension !== "xls" && extension !== "xl") {
			console.log("upload excel file only");
			req.flash("error", "Excel format not matched.");
			return res.redirect("/college/uploadCandidates");
		}
		filename = new Date().getTime() + "_" + data1.name;
		const write = await fs.promises.writeFile("public/" + filename, data1.data)
			.then(() => console.log("********* File Upload successfully!"))
			.catch((err) => {
				console.log(err.message)
				return res.redirect("/college/uploadCandidates");
			});
		let errorMessages = []
		console.log(__dirname, "../../../public/" + filename)
		await readXlsxFile(
			path.join(__dirname, "../../../public/" + filename)
		).then((rows) => {
			console.log(rows[0])
			if (
				rows[0][0] !== 'name' ||
				rows[0][1] !== 'email' ||
				rows[0][2] !== 'mobile' ||
				rows[0][3] !== 'whatsapp' ||
				rows[0][4] !== 'dob' ||
				rows[0][5] !== 'state' ||
				rows[0][6] !== 'city' ||
				rows[0][7] !== 'sex' ||
				rows[0][8] !== 'pincode' ||
				rows[0][9] !== 'highestQualifcation' ||
				rows[0][10] !== 'address' ||
				rows[0][11] !== 'Experienced' ||
				rows[0][12] !== 'PassingYear' ||
				rows[0][13] !== 'Qualifications' ||
				rows[0][14] !== 'subQualification'
			) {
				checkFileError = false;
			} else {
				checkFileError = true;
			}

		}).catch(err => {
			console.log('readClsxFile error========>>>>>>', err.message)
			req.flash("error", "Caught error while reading file.");
			return res.redirect("/college/uploadCandidates");
		})

		if (checkFileError == false) {
			req.flash("error", "Please upload right pattern file");
			return res.redirect("/college/uploadCandidates");
		} else {
			let allRows = []
			await readXlsxFile(
				path.join(__dirname, "../../../public/" + filename)
			).then(async (rowsList) => {
				rowsList.shift();
				for (let [index, rows] of rowsList.entries()) {
					let message = "";
					qualification
					let highestQualification = "";
					let cityId = "";
					let stateId = "";
					let name
					if (rows[0]) {
						name = rows[0]
					} else {
						message = `Name `
					};
					let email
					if (rows[1]) {
						email = rows[1]
					}

					let mobile = rows[2] ? rows[2] : '';
					if (mobile === '') {
						message += `mobile `
					}

					let whatsapp = rows[3] ? rows[3] : '';
					let dob = rows[4] ? rows[4] : "";
					if (dob === '') {
						message += `dob `
					}

					if (rows[5] != null && rows[5] != '') {
						var state = await State.findOne({
							name: rows[5], status: { $ne: false }
						});
						stateId = state ? state._id : '';
						if (stateId === '') {
							message += `State(invalid) `
						}
					}
					if (stateId === '') {
						message += `State `
					}

					if (rows[6] != null && rows[6] != '') {
						let city = await City.findOne({
							name: rows[6], status: { $ne: false }
						});
						cityId = city ? city._id : '';
						if (cityId === '') {
							message += `City(invalid) `
						}
					}

					if (cityId === '') {
						message += `City `
					}

					let sex = rows[7] ? rows[7] : "";

					if (sex === '') {
						message += `sex `
					}

					let pincode = rows[8] ? rows[8] : "";

					if (pincode === '') {
						message += `pincode `
					}

					if (rows[9] != null) {
						var qualification = await Qualification.findOne({ name: { $regex: new RegExp(rows[9], "i") } });
						highestQualification = qualification ? qualification._id : '';
						if (highestQualification === '') {
							message += `highestQualification(invalid) `
						}
					}

					if (highestQualification === '') {
						message += `highestQualification `
					}

					let address = rows[10] ? rows[10] : "";
					if (address === '') {
						message += `address `
					}
					let isExperienced = rows[11] === 'Experienced' ? true : false

					let PassingYear = rows[12] ? rows[12] : "";

					if (PassingYear === '') {
						message += `PassingYear `
					}
					if (rows[13] != null) {
						var qualification = await Qualification.findOne({ name: { $regex: new RegExp(rows[13], "i") } });
						Qualifications = qualification ? qualification._id : '';
						if (Qualifications === '') {
							message += `Qualifications(invalid) `
						}
					}

					if (Qualifications === '') {
						message += `Qualifications `
					}

					if (rows[14] != null) {
						var qualification = await SubQualification.findOne({ name: { $regex: new RegExp(rows[14], "i") } });
						subQualification = qualification ? qualification._id : '';
						if (subQualification === '') {
							message += `subQualification(invalid) `
						}
					}

					if (subQualification === '') {
						message += `subQualification `
					}
					if (message) {
						message += ` not populated for the row ${index + 1}`
						errorMessages.push(message)
						continue;
					}

					let isExistUser = await User.findOne({
						mobile,
						role: 3,
					});
					if (isExistUser) {
						console.log('===> User exists')
						errorMessages.push(`User with mobile ${mobile} already exists for row ${index + 1}.`)
						continue;
					}

					let isExistCandidate = await Candidate.findOne({
						mobile
					});

					if (isExistCandidate) {
						console.log('==> isExistCandidate exists')
						errorMessages.push(`Candidate with mobile ${mobile} already exists for row ${index + 1}.`)
						continue;
					}

					let dup = allRows.find(can => can.mobile.toString() === mobile.toString())

					if (!isExistUser && !isExistCandidate && !dup) {
						allRows.push({ mobile, email })
						const user = await User.create({
							name,
							mobile,
							role: 3,
							isImported: true
						});

						if (!user) {
							errorMessages.push(`User not created for row ${index + 1}.`)
							continue;
						}

						const coins = await CoinsAlgo.findOne()
						let cityData = await City.findOne({ _id: cityId, status: { $ne: false } }).select({ location: 1, _id: 0 })
						let obj = cityData.toObject()
						let addCandidate = {
							isImported: true,
							isProfileCompleted: true,
							availableCredit: coins.candidateCoins,
							creditLeft: coins.candidateCoins,
							location: obj.location
						};
						let qual = {}
						if (name) { addCandidate['name'] = name }
						if (mobile) {
							addCandidate['mobile'] = mobile
							addCandidate['whatsapp'] = whatsapp || mobile
						}
						if (email) { addCandidate['email'] = email }
						if (highestQualification) { addCandidate['highestQualification'] = highestQualification }
						if (stateId) { addCandidate['state'] = stateId }
						if (cityId) { addCandidate['city'] = cityId }
						if (address) { addCandidate['address'] = address }
						if (dob) { addCandidate['dob'] = dob }
						if (sex) { addCandidate['sex'] = sex }
						if (pincode) { addCandidate['pincode'] = pincode }
						if (isExperienced) { addCandidate['isExperienced'] = isExperienced }
						if (PassingYear) { qual['PassingYear'] = PassingYear }
						if (Qualifications) { qual['Qualification'] = Qualifications }
						if (subQualification) { qual['subQualification'] = subQualification }
						let loc = {}
						loc["type"] = 'Point'
						loc["coordinates"] = [college.longitude, college.latitude]
						qual['location'] = loc
						qual['collegePlace'] = college.place

						addCandidate['qualifications'] = qual
						const candidate = await Candidate.create(addCandidate)
						if (!candidate) {
							console.log(addCandidate, "candidate not created", "row number is =>>>>>>>", recordCount)
							errorMessages.push(`Candidate not created for row ${index + 1}.`)
							continue;
						}
						// else{
						// 	let city = await City.findOne({_id:cityId}).select("name")
						// 	let state = await State.findOne({_id:stateId}).select("name")
						//  if(env.toLowerCase()==='production'){
						// 	 let dataFormat = {
						// 		Source: "mipie",
						// 		FirstName: name,
						// 		MobileNumber:mobile,
						// 		LeadSource: "Website",
						// 		LeadType:"Online",
						// 		LeadName: "app",
						// 		Course:"Mipie general",
						// 		Center:"Padget",
						// 		Location:"Technician",
						// 		Country: "India",
						// 		LeadStatus: "Signed Up",
						// 		ReasonCode:"27" ,
						// 		City: city.name,
						// 		State: state.name
						// 	  }
						// 	  let edgeBody = JSON.stringify(dataFormat)
						// 	  let header = { 'AuthToken': extraEdgeAuthToken, "Content-Type": "multipart/form-data" }
						// 	  let extraEdge = await axios.post(extraEdgeUrl,edgeBody,header).then(res=>{
						// 		console.log(res.data)
						// 	  }).catch(err=>{
						// 		console.log(err, "Couldn't send data in extraEdge","row number is ===>",recordCount)
						// 	    errorMessages.push(`Falied to send data in Extra edge for row ${index + 1}.`)
						// 	  })
						//  }
						// }
					} else {
						errorMessages.push(`Candidate/User with mobile ${mobile} already exists for row ${index + 1}.`)
					}
				}
				var imports = {
					name: req.files.filename.name,
					message: errorMessages.length <= 0 ? "success" : errorMessages.join('</br>'),
					status: "Completed",
					record: allRows.length
				};
				console.log(
					"--------------------- REcord INSERTED ---------------------------"
				);
				console.log(imports);
				await CandidateImport.create(imports);
				console.log('========================> allRows ', allRows.length)
				await fs.promises.unlink("public/" + filename).then(() => {
					return res.redirect("/college/uploadCandidates");
				})
					.catch(async (err) => {
						console.log(err)
						await fs.promises.unlink("public/" + filename).then(() => {
							return res.redirect("/college/uploadCandidates");
						})
					});
			})
		}
	} catch (err) {
		console.log(err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})

router.get("/uploadcandidates", async (req, res) => {
	const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
	console.log('======================> 1', ipAddress, req.session.user)

	if (req.session && req.session.user && req.session.user._id) {
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;

		let imports = await CandidateImport.find({ status: "Completed" })
			.sort({ createdAt: -1 }).skip(perPage * page - perPage).limit(perPage)

		let count = await CandidateImport.countDocuments()
		const totalPages = Math.ceil(count / perPage);
		const college = await College.findOne({ _concernPerson: req.session.user._id, status: true, isDeleted: false })
		if (!college) {
			return res.status(400).send({ status: false, message: "College not found" })
		}

		res.render(`${req.vPath}/app/college/uploadcandidates`, { menu: 'upload', perPage, totalPages, page, imports, isProfileCompleted: college.isProfileCompleted });
	} else {
		return res.status(401).send({ status: false, message: "Unauthorized" })
	}
});
router.post("/removeDocument", async (req, res) => {
	try {
		const { id } = req.body;
		await CollegeDocuments.deleteOne({ _id: ObjectId(id) })
		return res.status(200).send({ status: true });
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

//change password
router
	.route("/changepassword2")
	.get(auth1, async (req, res) => {
		rePath = res.render(`${req.vPath}/college/setting/changePass`);
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(auth1, async (req, res) => {
		try {
			const newpassword = req.body.newpassword;
			const oldpassword = req.body.oldpassword;
			const confirmpassword = req.body.confirmpassword;
			if (newpassword !== confirmpassword)
				throw req.ykError("Passwords must be matched ");

			const userData = await User.findOne({ _id: req.session.user._id });
			if (!userData) throw req.ykError("User not found!");

			if (!bcrypt.compareSync(oldpassword, userData.password)) {
				throw req.ykError("Old password is incorrect!");
			}

			const user = bcrypt.hash(newpassword, 10, async function (err, hash) {
				const user = await User.findByIdAndUpdate(
					{ _id: userData._id },
					{
						password: hash,
					}
				);
				if (!user) throw req.ykError("user not matched!");
				req.flash("success", "Password has been changed!");
				req.session.user = null;
				return res.redirect("/admin/login");
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

//edit profile
router
	.route("/editprofile2")
	.get(auth1, async (req, res) => {
		var user = req.session.user;
		rePath = res.render(`${req.vPath}/college/setting/editProfile`, {
			user,
		});
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(auth1, async (req, res) => {
		try {
			const email = req.body.email;
			const name = req.body.name;
			var id = req.session.user._id;

			var userData = await User.findOne({ email: email });
			if (!userData)
				throw req.ykError("This email is already registered with us");
			var userData = await User.findByIdAndUpdate(
				{ _id: id },
				{
					// email: email,
					name: name,
				},
				{
					new: true,
				}
			);

			req.flash("success", "Profile updated successfullly");
			req.session.user = userData;
			return res.redirect("back");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

function isObjectIdValid(id) {
	return ObjectId.isValid(id) && new ObjectId(id) == id;
}
router.route("/candidate/:id").get(async (req, res) => {
	try {

		let menu = 'myStudents';
		let user = req.session.user;
		const populate = [
			{
				path: "techSkills.id",
				select: "name",
			},
			{
				path: "nonTechSkills.id",
				select: "name",
			},
			{
				path: "experiences.Industry_Name",
				select: "name",
			},
			{
				path: "experiences.SubIndustry_Name",
				select: "name",
			},
			{
				path: "qualifications.Qualification",
				select: "name",
			},
			{
				path: "qualifications.subQualification",
				select: "name",
			},
			{
				path: "qualifications.University",
				select: "name",
			},
			{ path: "locationPreferences.state", select: ["name"] },
			{ path: "locationPreferences.city", select: ["name"] },
			{ path: "state", select: ["name", "stateId"] },
			{ path: "city", select: ["name"] },
		];
		const candidate = await Candidate.findOne({
			_id: req.params.id,
		})
			.populate(populate);

		if (!candidate) {
			req.flash("error", "Candidate not found !");
			return res.redirect("back");
		}

		const qualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		res.render(`${req.vPath}/app/college/studentProfile`, {
			candidate,
			qualification,
			menu
		});
	} catch (err) {
		console.log(err);
		return res.status(500).send({ status: false, message: err })
	}
})
router.route("/myStudents")
	.get(isCollege, async (req, res) => {
		try {
			let menu = 'myStudents';
			let user = req.user;


			const college = await College.findOne(
				{
					_concernPerson: { $elemMatch: { _id: user._id } },
					status: true,
					isDeleted: false,
					place: { $exists: true }
				});
			const qualification = await Qualification.find()
			if (!college || college.isProfileCompleted == false) {
				req.flash('error', 'Kindly fill your College Location');
				return res.render(`${req.vPath}/app/college/myStudents`, { menu, students: [], qualification, count: 0, totalPages: 0, page: 0, isProfileCompleted: false })
			}
			const perPage = 20;
			const p = parseInt(req.query.page);
			const page = p || 1;
			const students = await Candidate.aggregate([
				{
					$unwind: {
						path: '$qualifications'
					}
				},
				{
					$match: {
						'qualifications.collegePlace': {
							"$regex": college.place,
							"$options": "i"
						}
					}
				},
				{
					$sort: {
						'createdAt': -1
					}
				},
				{
					'$facet': {
						metadata: [{ '$count': "total" }],
						data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
					}
				}
			])

			let count = students[0].metadata[0]?.total
			if (!count) {
				count = 0
			}
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/app/college/myStudents`, { menu, students, qualification, count, totalPages, page, isProfileCompleted: true })
		}
		catch (err) {
			console.log(err);
			return res.status(500).send({ status: false, message: err })
		}
	})
router.route("/createResume/:id").get(isCollege, authenti, async (req, res) => {
	try {

		let url = `${req.protocol}://${req.get("host")}/candidateForm/${req.params.id}`

		const candidate = await Candidate.findById(req.params.id);

		if (!candidate || !candidate._id) throw req.ykError("No candidate found!");

		let params = {};
		if (process.env.NODE_ENV !== "development") {
			params = {
				executablePath: "/usr/bin/chromium-browser",
			};
		}
		const logo = fs.readFileSync(path.join(__dirname, '../../../public/images/elements/mipie-footer.png'), { encoding: 'base64' });
		const browser = await puppeteer.launch(params);
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "networkidle2" });
		const data = await page.pdf({
			path: path.join(__dirname, `../../../public/documents/output${req.params.id}.pdf`),
			format: 'A4',
			displayHeaderFooter: true,
			preferCSSPageSize: true,
			headerTemplate: `
	   <div style="display:flex;width:90%;font-size: 10px;padding: 5px 0;margin:auto;">
		 <div style="width:25%;text-align:right"></div>
	   </div>`,
			footerTemplate: `<footer style="margin: auto; width: 100%; border-top:1px solid #666;">
	   <a href = "${baseUrl}">
	   <img width="70%" height="auto" style="float: right; padding-right: 20px; padding-left: 36px; width: 25%" src="data:image/png;base64,${logo}" alt="Pivohub" />
	   </a>
	   </footer>`,
			margin: {
				top: '30px',
				bottom: '50px',
				right: '30px',
				left: '30px',
			},
		});
		await browser.close();

		if (!data) {
			throw req.ykError("Unable to create pdf1");
		}

		req.flash("success", "Create pdf successfully!");

		res.send({
			status: 200,
			uploadData: `${req.protocol}://${req.get("host")}/documents/output${req.params.id
				}.pdf`,
		});
	} catch (err) {
		console.log(err.message);
		req.flash("error", err.message || "Something went wrong!");
		return res.send({ status: false, err });
	}
});

router.route('/uploadTemplates')
	.get(isCollege, async (req, res) => {
		try {
			const collegeDocs = await CollegeDocuments.find({ college: req.session.user.collegeId }, "name path")
			res.render(`${req.vPath}/app/college/uploadTemplates`, { menu: 'uploadTemplates', collegeDocs });
		}
		catch (err) {
			console.log(err)
			return res.status(500).send({ status: false, message: err.message })
		}
	})
	.post([isCollege, authenti], async (req, res) => {
		try {
			const { name, path } = req.body;
			const collegeDocument = await CollegeDocuments.create({
				college: req.session.user.collegeId,
				name,
				path,
			})
			return res.status(200).send({ status: true });
		}
		catch (err) {
			console.log(err);
			return res.send({ status: false, message: err.message })
		}
	})

router.route("/single").get(auth1, function (req, res) {
	res.download("public/Student.xlsx", function (err) {
		if (err) {
			console.log(err);
		}
	});
});
router.post("/courses/add", [isCollege], async (req, res) => {
	try {
		const body = req.body;

		const newCourse = new Course(req.body);
		await newCourse.save();

		// set creator
		body.createdBy = "college";

		// convert string to array
		body.photos = body.photos ? body.photos.split(",") : [];
		body.videos = body.videos ? body.videos.split(",") : [];
		body.testimonialvideos = body.testimonialvideos ? body.testimonialvideos.split(",") : [];

		const course = await Courses.create(body);

		return res.json({ status: true, message: "Course added", data: course });
	} catch (err) {
		console.error("❌ Course Add Error:", err.message);
		return res.status(500).json({ status: false, message: err.message || "Failed to add course" });
	}
});

//Vertical APIS

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

router.post('/addVertical', [isCollege], async (req, res) => {
	try {
		const { formData } = req.body;
		const user = req.user;
		const collegeId = req.user.college._id;


		// Default value handling
		const newVertical = new Vertical({
			name: formData.name,
			description: formData.description,
			status: formData.status !== undefined ? formData.status : true,
			createdBy: user._id,
			college: collegeId,
		});


		const savedVertical = await newVertical.save();

		return res.json({
			status: true,
			message: "Vertical added successfully",
			data: savedVertical
		});

	} catch (err) {
		console.error("❌ Vertical Add Error:", err.message);
		return res.status(500).json({
			status: false,
			message: err.message || "Failed to add vertical"
		});
	}
});
router.put('/editVertical/:id', [isCollege], async (req, res) => {
	try {
		const verticalId = req.params.id;
		const { formData } = req.body;
		const collegeId = req.user.college._id;

		const updated = await Vertical.findByIdAndUpdate(
			verticalId,
			{
				name: formData.name,
				description: formData.description,
				status: formData.status,
				college: collegeId
			},
			{ new: true } // return updated document
		);

		if (!updated) {
			return res.status(404).json({
				status: false,
				message: "Vertical not found"
			});
		}

		return res.json({
			status: true,
			message: "Vertical updated successfully",
			data: updated
		});

	} catch (err) {
		console.error("❌ Edit Vertical Error:", err.message);
		return res.status(500).json({
			status: false,
			message: err.message || "Failed to update vertical"
		});
	}
});

router.delete('/deleteVertical/:id', [isCollege], async (req, res) => {
	try {
		const verticalId = req.params.id;
		const collegeId = req.user.college._id;

		const vertical = await Vertical.findById(verticalId);

		if (!vertical) {
			return res.status(404).json({
				status: false,
				message: "Vertical not found"
			});
		}

		if (vertical.college.toString() !== collegeId.toString()) {
			return res.status(403).json({
				status: false,
				message: "You are not authorized to delete this vertical"
			});
		}


		if (vertical.isApproved) {

			return res.status(403).json({
				status: false,
				message: "You are not authorized to delete this vertical"
			});
		}


		const deleted = await Vertical.findByIdAndDelete(verticalId);

		if (!deleted) {
			return res.status(404).json({
				status: false,
				message: "Vertical not found"
			});
		}

		return res.json({
			status: true,
			message: "Vertical deleted successfully",
			data: deleted
		});

	} catch (err) {
		console.error("❌ Delete Vertical Error:", err.message);
		return res.status(500).json({
			status: false,
			message: err.message || "Failed to delete vertical"
		});
	}
});

/// Project
// POST /api/projects/add
router.post('/add_project', [isCollege], async (req, res) => {
	try {

		let { name, description, vertical, status } = req.body;
		const user = req.user
		const collegeId = req.user.college._id;





		// Basic validation
		if (!name || !vertical) {

			return res.status(400).json({ success: false, message: 'Name and verticalId are required.' });
		}

		const verticalDetails = await Vertical.findById(vertical);

		if (!verticalDetails) {

			return res.status(404).json({
				status: false,
				message: "Vertical not found"
			});
		}

		if (verticalDetails.college.toString() !== collegeId.toString()) {
			return res.status(403).json({
				status: false,
				message: "You are not authorized to add project to this vertical"
			});
		}


		// Create new project document
		const newProject = new Project({
			name,
			description,
			vertical,
			createdBy: user._id,
			status: status !== undefined ? status : 'active',
			college: collegeId,
		});

		const savedProject = await newProject.save();

		return res.status(201).json({ success: true, message: 'Project added successfully', data: savedProject });
	} catch (error) {
		console.error('Error adding project:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.put('/edit_project/:id', [isCollege], async (req, res) => {
	try {
		const projectId = req.params.id;
		const { name, description, vertical, status } = req.body;
		const user = req.user;
		const collegeId = req.user.college._id;

		const projectDetails = await Project.findById(projectId);
		if (!projectDetails) {
			return res.status(404).json({ success: false, message: 'Project not found.' });
		}

		if (projectDetails.college.toString() !== collegeId.toString()) {
			return res.status(403).json({
				status: false,
				message: "You are not authorized to edit this project"
			});
		}

		// Validation
		if (!name || !vertical) {
			return res.status(400).json({ success: false, message: 'Name and verticalId are required.' });
		}

		// Find project by id
		const project = await Project.findById(projectId);
		if (!project) {
			return res.status(404).json({ success: false, message: 'Project not found.' });
		}

		// Update fields
		project.name = name;
		project.description = description || project.description;
		project.vertical = vertical;
		project.college = collegeId;
		project.status = status !== undefined ? status : project.status;
		project.updatedBy = user._id; // Optional: agar aap update karne wale user ko track karna chahte hain

		const updatedProject = await project.save();

		return res.status(200).json({ success: true, message: 'Project updated successfully', data: updatedProject });
	} catch (error) {
		console.error('Error updating project:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.delete('/delete_project/:id', [isCollege], async (req, res) => {
	try {
		const projectId = req.params.id;
		const collegeId = req.user.college._id;

		const projectDetails = await Project.findById(projectId);
		if (!projectDetails) {
			return res.status(404).json({ success: false, message: 'Project not found.' });
		}


		if (projectDetails.college.toString() !== collegeId.toString()) {

			return res.status(403).json({
				status: false,
				message: "You are not authorized to delete this project"
			});
		}

		const deletedProject = await Project.findByIdAndDelete(projectId);
		if (!deletedProject) {
			return res.status(404).json({ success: false, message: 'Project not found' });
		}

		return res.status(200).json({ success: true, message: 'Project deleted successfully' });
	} catch (error) {
		console.error('Error deleting project:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
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

//Center Api

// POST /api/centers/add
router.post('/add_canter', [isCollege], async (req, res) => {
	try {
		let { name, location, status, project } = req.body;
		const user = req.user; // agar aap authentication middleware laga rahe hain
		const collegeId = req.user.college._id;

		// Validation
		if (!name || !project) {
			return res.status(400).json({ success: false, message: 'Name and project are required.' });
		}

		const projectDetails = await Project.findById(project);

		if (!projectDetails) {
			return res.status(404).json({ success: false, message: 'Project not found.' });
		}

		if (projectDetails.college.toString() !== collegeId.toString()) {
			return res.status(403).json({ success: false, message: 'You are not authorized to add center to this project.' });
		}

		// Ensure project is an array
		const projectArray = Array.isArray(project) ? project : [project];

		if (status === 'active') {
			status = true;
		}
		else {
			status = false;
		}

		console.log(collegeId, 'collegeId');

		const newCenter = new Center({
			name,
			address: location,
			status: status,
			project: projectArray,
			createdBy: user ? user._id : null,
			college: collegeId,
		});

		const savedCenter = await newCenter.save();
		console.log(savedCenter, 'savedCenter');

		res.status(201).json({ success: true, message: 'Center added successfully', data: savedCenter });
	} catch (error) {
		console.error('Error adding center:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});



router.put('/edit_center/:id', [isCollege], async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;
		const collegeId = req.user.college._id;

		const centerDetails = await Center.findById(id);

		if (!centerDetails) {
			return res.status(404).json({ success: false, message: 'Center not found' });
		}

		if (centerDetails.college.toString() !== collegeId.toString()) {

			return res.status(403).json({ success: false, message: 'You are not authorized to edit this center' });
		}

		updateData.college = collegeId;

		const updatedCenter = await Center.findByIdAndUpdate(id, updateData, { new: true });
		if (!updatedCenter) {
			return res.status(404).json({ success: false, message: 'Center not found' });
		}

		res.json({ success: true, data: updatedCenter });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.put('/asign_center/:id', [isCollege], async (req, res) => {
	try {
		const { id } = req.params;
		const { projectId } = req.body; // extract projectId from body
		const collegeId = req.user.college._id;


		if (!projectId) {
			return res.status(400).json({ success: false, message: 'Project ID is required' });
		}

		const projectDetails = await Project.findById(projectId);

		if (!projectDetails) {
			return res.status(404).json({ success: false, message: 'Project not found.' });
		}

		if (projectDetails.college.toString() !== collegeId.toString()) {
			return res.status(403).json({ success: false, message: 'You are not authorized to asign this center to this project' });
		}

		const centerDetails = await Center.findById(id);

		if (centerDetails.college.toString() !== collegeId.toString()) {
			return res.status(403).json({ success: false, message: 'You are not authorized to asign this center to this project' });
		}


		// Use $addToSet instead of $push if you want to avoid duplicates
		const updatedCenter = await Center.findByIdAndUpdate(
			id,
			{ $addToSet: { projects: projectId } }, // pushes projectId into project array if not already present
			{ new: true }
		);

		if (!updatedCenter) {
			return res.status(404).json({ success: false, message: 'Center not found' });
		}

		res.json({ success: true, data: updatedCenter });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.put('/remove_project_from_center/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { projectId } = req.body;
		if (!projectId) {
			return res.status(400).json({ success: false, message: 'Project ID is required' });
		}
		const collegeId = req.user.college._id;

		const centerDetails = await Center.findById(id);

		if (centerDetails.collegeId.toString() !== collegeId.toString()) {
			return res.status(403).json({ success: false, message: 'You are not authorized to remove this project from this center' });
		}


		const updatedCenter = await Center.findByIdAndUpdate(
			id,
			{ $pull: { projects: projectId } }, // removes projectId from the array
			{ new: true }
		);

		if (!updatedCenter) {
			return res.status(404).json({ success: false, message: 'Center not found' });
		}

		res.json({ success: true, data: updatedCenter });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});




router.get('/list-centers', [isCollege], async (req, res) => {
	try {
		let collegeId = req.user.college._id;
		let projectId = req.query.projectId;
		console.log('projectId', projectId)
		console.log('collegeId', collegeId)

		if (typeof collegeId !== 'string') { collegeId = new mongoose.Types.ObjectId(collegeId); }


		if (projectId) {
			if (!mongoose.Types.ObjectId.isValid(projectId)) {
				return res.status(400).json({ success: false, message: 'Invalid Project ID' });
			}
			if (typeof projectId !== 'string') { projectId = new mongoose.Types.ObjectId(projectId); }

			const projectDetails = await Project.findById(projectId);
			console.log('projectDetails', projectDetails)
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


router.delete('/center_delete/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deletedCenter = await Center.findByIdAndDelete(id);
		if (!deletedCenter) {
			return res.status(404).json({ success: false, message: 'Center not found' });
		}

		res.json({ success: true, message: 'Center deleted successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});



//lead status change
router.put('/lead/status_change/:id', [isCollege], async (req, res) => {
	try {
		const { id } = req.params;
		const {
			_leadStatus,
			_leadSubStatus,
			remarks,
			followup,  // combined date and time
		} = req.body;

		const userId = req.user._id;

		// Find the AppliedCourse document by ID
		const doc = await AppliedCourses.findById(id);
		if (!doc) {
			return res.status(404).json({ success: false, message: 'AppliedCourse not found' });
		}

		let actionParts = [];

		// Fetch the current status document (including sub-statuses)
		const oldStatusDoc = await Status.findById(doc._leadStatus).lean();
		const oldStatusTitle = oldStatusDoc ? oldStatusDoc.title : 'Unknown';
		const oldSubStatusTitle = oldStatusDoc?.substatuses?.find(s => s._id.toString() === doc._leadSubStatus?.toString())?.title || 'Unknown';

		// Fetch the new status document (including sub-statuses)
		const newStatusDoc = await Status.findById(_leadStatus).lean();
		const newStatusTitle = newStatusDoc ? newStatusDoc.title : 'Unknown';
		const newSubStatusTitle = newStatusDoc?.substatuses?.find(s => s._id.toString() === _leadSubStatus)?.title || 'Unknown';


		// If lead sub-status is updated, log the change and update the sub-status
		// Logging changes
		if (_leadStatus && doc._leadStatus.toString() !== _leadStatus) {
			actionParts.push(`Lead status changed from "${oldStatusTitle}" to "${newStatusTitle}"`);
			doc._leadStatus = _leadStatus;
		}

		if (_leadSubStatus && doc._leadSubStatus.toString() !== _leadSubStatus) {
			actionParts.push(`Lead sub-status changed from "${oldSubStatusTitle}" to "${newSubStatusTitle}"`);
			doc._leadSubStatus = _leadSubStatus;
		}
		if (doc.followups?.length > 0) {
			const lastFollowup = doc.followups[doc.followups.length - 1];
			if (lastFollowup?.status === 'Planned') {
				lastFollowup.status = 'Done'
			}
		}
		// If followup date and time is set or updated, log the change and update the followup
		if (followup && doc.followups?.[doc.followups.length - 1]?.date?.toISOString() !== new Date(followup).toISOString()) {
			actionParts.push(`Followup updated to ${new Date(followup).toLocaleString()}`);
			// Push a new followup object
			doc.followups.push({
				date: new Date(followup),
				status: 'Planned'
			});
		}


		// If remarks are set or updated, log the change and update remarks
		if (remarks && doc.remarks !== remarks) {
			//   actionParts.push(`Remarks updated: "${remarks}"`);
			actionParts.push(`Remarks updated`);  // Remarks included in action log
			doc.remarks = remarks; // Update remarks
		}

		// If there are no changes, log a generic action
		if (actionParts.length === 0) {
			actionParts.push('No changes made to status or followup');
		}
		console.log(userId, 'userId')
		// Add a log entry for the update
		// Add a log entry for the update with proper validation
		const newLogEntry = {
			user: userId,
			action: actionParts.join('; '), // Combine all actions in one log message
			remarks: remarks || '', // Optional remarks in the log
			timestamp: new Date() // Add timestamp if your schema supports it
		};

		// Validate the log entry before pushing
		console.log('New log entry:', newLogEntry);

		doc.logs.push(newLogEntry);

		// Save the updated document
		await doc.save();

		return res.json({ success: true, data: doc });
	} catch (error) {
		console.error('Error updating status and followup:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});


///courses

router.get('/all_courses', async (req, res) => {
	try {
		const courses = await Courses.find({ status: true }).sort({ createdAt: -1 });

		res.json({ success: true, data: courses });
	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/all_courses_centerwise', async (req, res) => {
	try {
		const { centerId, projectId } = req.query
		let filter = {
			center: centerId,
			project: projectId

		}
		if (!centerId || !projectId) {
			return res.status(400).json({ success: false, message: 'centerId and projectId are required.' });

		}
		const courses = await Courses.find(filter).sort({ createdAt: -1 });
		// Update the 'status' field based on the boolean value

		res.json({ success: true, data: courses });
	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

//Batch APi

router.post('/add_batch', isCollege, async (req, res) => {
	try {
		// Destructure the data sent in the request body
		const {
			name,
			startDate,
			description,
			endDate,
			zeroPeriodStartDate,
			zeroPeriodEndDate,
			maxStudents,
			status,
			instructor,
			courseId,
			centerId,

		} = req.body;

		const user = req.user;
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		// Validation: Ensure all required fields are provided
		if (!name || !startDate || !endDate || !zeroPeriodStartDate || !zeroPeriodEndDate || !courseId || !centerId) {
			return res.status(400).json({ success: false, message: 'All required fields must be provided' });
		}

		// Create a new batch
		const newBatch = new Batch({
			name,
			startDate,
			description,
			instructor,
			endDate,
			zeroPeriodStartDate,
			zeroPeriodEndDate,
			maxStudents: maxStudents || 0,  // Default to 0 if not provided
			status,  // Default to active if not provided
			courseId,
			centerId,
			createdBy: user._id,
			college: college._id
		});

		// Save the batch to the database
		const savedBatch = await newBatch.save();

		// Send success response
		res.status(201).json({
			success: true,
			message: 'Batch created successfully',
			data: savedBatch
		});
	} catch (error) {
		console.error('Error creating batch:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

// GET API to fetch batches
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


//Applied data update api

router.put('/update/:id', isCollege, async (req, res) => {
	try {
		const user = req.user;
		const { id } = req.params;
		const updateData = req.body;

		const appliedCourse = await AppliedCourses.findById(id);
		if (!appliedCourse) {
			return res.status(404).json({ success: false, message: "Applied course not found" });
		}

		// Update fields
		Object.keys(updateData).forEach(key => {
			appliedCourse[key] = updateData[key];
		});

		// Add log for Move to KYC
		if (typeof updateData.kycStage !== 'undefined' && updateData.kycStage === true) {
			appliedCourse.logs.push({
				user: user._id,
				timestamp: new Date(),
				action: 'Moved to KYC',
				remarks: 'Profile moved to KYC by College'
			});
		}

		// Add log for Move to Admission List
		if (typeof updateData.admissionDone !== 'undefined' && updateData.admissionDone === true) {
			appliedCourse.logs.push({
				user: user._id,
				timestamp: new Date(),
				action: 'Moved to Admission List',
				remarks: 'Profile moved to Admission List by College'
			});
		}

		await appliedCourse.save();
		return res.json({ success: true, message: "Profile updated successfully" });
	} catch (err) {
		console.error("Error updating profile:", err);
		return res.status(500).json({ success: false, message: err.message });
	}
});

//KYC Leads

router.route("/kycCandidates").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;      // Default page 1
		const limit = parseInt(req.query.limit) || 50;   // Default limit 50
		const skip = (page - 1) * limit;



		const appliedCourses = await AppliedCourses.find({
			kycStage: { $in: [true] },
			admissionDone: { $nin: [true] }
		})
			.populate({
				path: '_course',
				select: 'name description docsRequired college', // Select the necessary fields
				populate: {
					path: 'sectors',
					select: 'name'
				}
			})
			.populate('_center')
			.populate('_leadStatus')
			.populate('registeredBy')
			.populate({
				path: '_candidate',
				populate: [
					{ path: '_appliedCourses', populate: [{ path: '_course', select: 'name description' }, { path: 'registeredBy', select: 'name email' }, { path: '_center', select: 'name location' }, { path: '_leadStatus', select: 'title' }] },
				]
			})
			.populate({
				path: 'logs',
				populate: {
					path: 'user',
					select: 'name'
				}
			})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);



		const filteredAppliedCourses = appliedCourses.filter(doc => {
			// _course must be populated!
			return doc._course && String(doc._course.college) === String(college._id);
		});

		const totalCount = filteredAppliedCourses.length;
		const pendingKycCount = filteredAppliedCourses.filter(doc =>
			doc.kycStage === true && doc.kyc === false
		).length;
		const doneKycCount = totalCount - pendingKycCount



		const result = filteredAppliedCourses.map(doc => {
			let selectedSubstatus = null;



			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			const docObj = doc.toObject();

			const firstSectorName = docObj._course?.sectors?.[0]?.name || 'N/A';
			if (docObj._course) {
				docObj._course.sectors = firstSectorName; // yahan replace ho raha hai
			}

			const requiredDocs = docObj._course?.docsRequired || [];
			const uploadedDocs = docObj.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});
			// Prepare combined docs array
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					// Agar uploaded hai to uploadedDoc details bhejo
					return {
						...uploadedDoc,
						Name: reqDoc.Name,        // Required document ka name bhi add kar lo
						_id: reqDoc._id
					};
				} else {
					// Agar uploaded nahi hai to Not Uploaded status ke saath dummy object bhejo
					return {
						docsId: reqDoc._id,
						Name: reqDoc.Name,
						status: "Not Uploaded",
						fileUrl: null,
						reason: null,
						verifiedBy: null,
						verifiedDate: null,
						uploadedAt: null
					};
				}
			});


			// Prepare combined docs array
			if (requiredDocs) {
				docsRequired = requiredDocs

				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = docsRequired.map(reqDoc => {
					// Convert Mongoose document to plain object
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

					// Find matching uploaded docs for this required doc
					const matchingUploads = uploadedDocs.filter(
						uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
					);

					return {
						_id: docObj._id,
						Name: docObj.Name || 'Document',
						description: docObj.description || '',
						uploads: matchingUploads || []
					};
				});


			} else {
				console.log("Course not found or no docs required");
			};

			// Count calculations
			let verifiedCount = 0;
			let RejectedCount = 0;
			let pendingVerificationCount = 0;
			let notUploadedCount = 0;

			allDocs.forEach(doc => {
				if (doc.status === "Verified") verifiedCount++;
				else if (doc.status === "Rejected") RejectedCount++;
				else if (doc.status === "Pending") pendingVerificationCount++;
				else if (doc.status === "Not Uploaded") notUploadedCount++;
			});

			const totalRequired = allDocs.length;
			const uploadedCount = allDocs.filter(doc => doc.status !== "Not Uploaded").length;
			const uploadPercentage = totalRequired > 0
				? Math.round((uploadedCount / totalRequired) * 100)
				: 0;
			return {
				...docObj,
				selectedSubstatus,
				uploadedDocs: combinedDocs,    // Uploaded + Not uploaded combined docs array
				docCounts: {
					totalRequired,
					RejectedCount,
					uploadedCount,
					verifiedCount,
					pendingVerificationCount,
					notUploadedCount,
					uploadPercentage
				}
			};
		});



		res.status(200).json({
			success: true,
			count: result.length,
			page,
			pendingKycCount,
			doneKycCount,
			limit,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			data: result,
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});

router.put("/update_kyc/:id", async (req, res) => {
	try {
		const user = req.user
		let { id } = req.params;
		let { doc, kycStatus } = req.body;
		let docsId = doc;
		if (!docsId) {
			return res.status(400).json({ error: "docs id not found." });
		}
		if (typeof docsId === 'string' && mongoose.Types.ObjectId.isValid(docsId)) {
			docsId = new mongoose.Types.ObjectId(docsId);
		}

		if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
			id = new mongoose.Types.ObjectId(id);
		}

		const appliedCourse = await AppliedCourses.findOne({ _id: id });

		if (!appliedCourse) {
			return res.status(400).json({ error: "You have not applied for this course." });
		}




		appliedCourse.uploadedDocs.update({
			docsId: new mongoose.Types.ObjectId(docsId),
			fileUrl: fileUrl,
			status,
			verifiedDate: new Date(),
			verifiedBy: user._id
		});

		await appliedCourse.save();

		return res.status(200).json({
			status: true,
			message: "Document uploaded successfully",
			data: appliedCourse
		});

	} catch (err) {
		console.log(err)
		return res.status(500).send({ status: false, message: err.message });
	}
})


//doccumnet upload
router.put("/upload_docs/:id", isCollege, async (req, res) => {
	try {
		const user = req.user;
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		let { id } = req.params;
		let { doc } = req.body;
		let docsId = doc;

		if (!docsId) {
			return res.status(400).json({ error: "docs id not found." });
		}

		if (typeof docsId === 'string' && mongoose.Types.ObjectId.isValid(docsId)) {
			docsId = new mongoose.Types.ObjectId(docsId);
		}

		if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
			id = new mongoose.Types.ObjectId(id);
		}

		const appliedCourse = await AppliedCourses.findOne({ _id: id }).populate({
			path: '_course',
			select: 'docsRequired'
		});

		if (!appliedCourse) {
			return res.status(400).json({ error: "You have not applied for this course." });
		}

		// Find document name from course's docsRequired
		const docName = appliedCourse._course?.docsRequired?.find(d => d._id.toString() === docsId.toString())?.name || 'Unknown Document';

		const files = req.files?.file;
		if (!files) {
			return res.status(400).send({ status: false, message: "No files uploaded" });
		}

		const filesArray = Array.isArray(files) ? files : [files];
		const uploadedFiles = [];
		const uploadPromises = [];

		filesArray.forEach((item) => {
			const { name, mimetype } = item;
			const ext = name?.split('.').pop().toLowerCase();

			if (!allowedExtensions.includes(ext)) {
				throw new Error(`File type not supported: ${ext}`);
			}

			let fileType = "document";
			if (allowedImageExtensions.includes(ext)) {
				fileType = "image";
			} else if (allowedVideoExtensions.includes(ext)) {
				fileType = "video";
			}

			const key = `Documents for course/${appliedCourse._course}/${appliedCourse._candidate}/${docsId}/${uuid()}.${ext}`;
			const params = {
				Bucket: bucketName,
				Key: key,
				Body: item.data,
				ContentType: mimetype,
			};

			uploadPromises.push(
				s3.upload(params).promise().then((uploadResult) => {
					uploadedFiles.push({
						fileURL: uploadResult.Location,
						fileType,
					});
				})
			);
		});

		await Promise.all(uploadPromises);
		const fileUrl = uploadedFiles[0].fileURL;

		// Add document to uploadedDocs array
		appliedCourse.uploadedDocs.push({
			docsId: new mongoose.Types.ObjectId(docsId),
			fileUrl: fileUrl,
			status: "Pending",
			uploadedAt: new Date()
		});

		// Add log for document upload with document name
		appliedCourse.logs.push({
			user: user._id,
			timestamp: new Date(),
			action: 'Document Uploaded',
			remarks: `${docName} uploaded for verification`
		});

		await appliedCourse.save();

		return res.status(200).json({
			status: true,
			message: "Document uploaded successfully",
			data: appliedCourse
		});

	} catch (err) {
		console.log(err);
		return res.status(500).send({ status: false, message: err.message });
	}
});


//my followups
router.get("/leads/my-followups", async (req, res) => {
	try {
		const { fromDate, toDate, page = 1, limit = 10 } = req.query;

		// Add date validation
		let from, to;

		if (fromDate) {
			from = new Date(fromDate);
			if (isNaN(from.getTime())) {
				return res.status(400).json({ error: "Invalid fromDate format" });
			}
		} else {
			from = new Date(new Date().setHours(0, 0, 0, 0));
		}

		if (toDate) {
			to = new Date(toDate);
			if (isNaN(to.getTime())) {
				return res.status(400).json({ error: "Invalid toDate format" });
			}
		} else {
			to = new Date(new Date().setHours(23, 59, 59, 999));
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);

		// First, get the documents that match our criteria
		const matchingDocs = await AppliedCourses.find({
			followups: { $exists: true, $ne: [] },
			"followups.date": { $gte: from, $lte: to }
		})
			.populate([
				{
					path: '_course',
					select: 'name description docsRequired',
					populate: { path: 'sectors', select: 'name' }
				},
				{ path: '_leadStatus' },
				{ path: 'registeredBy' },
				{
					path: '_candidate',
					populate: [
						{
							path: '_appliedCourses',
							populate: [
								{ path: '_course', select: 'name description' },
								{ path: 'registeredBy', select: 'name email' },
								{ path: '_center', select: 'name location' },
								{ path: '_leadStatus', select: 'title' }
							]
						}
					]
				},
				{
					path: 'logs',
					populate: {
						path: 'user',
						select: 'name'
					}
				}
			]);

		// Now flatten and filter the followups
		let allFollowups = [];

		matchingDocs.forEach(doc => {
			doc.followups.forEach(followup => {
				if (followup.date >= from && followup.date <= to) {
					allFollowups.push({
						...doc.toObject(), // Convert to plain object here
						followupDate: followup.date,
						followupStatus: followup.status
					});
				}
			});
		});

		// Sort by followup date
		allFollowups.sort((a, b) => new Date(b.followupDate) - new Date(a.followupDate));

		// Apply pagination
		const total = allFollowups.length;
		const totalPages = Math.ceil(total / parseInt(limit));
		const paginatedData = allFollowups.slice(skip, skip + parseInt(limit));

		const result = paginatedData.map(doc => {
			let selectedSubstatus = null;

			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			// doc is already a plain object from toObject() above, so no need to call toObject() again
			const docObj = doc;

			const firstSectorName = docObj._course?.sectors?.[0]?.name || 'N/A';
			if (docObj._course) {
				docObj._course.sectors = firstSectorName; // yahan replace ho raha hai
			}

			const requiredDocs = docObj._course?.docsRequired || [];
			const uploadedDocs = docObj.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});

			// Prepare combined docs array
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					// Agar uploaded hai to uploadedDoc details bhejo
					return {
						...uploadedDoc,
						Name: reqDoc.Name,        // Required document ka name bhi add kar lo
						_id: reqDoc._id
					};
				} else {
					// Agar uploaded nahi hai to Not Uploaded status ke saath dummy object bhejo
					return {
						docsId: reqDoc._id,
						Name: reqDoc.Name,
						status: "Not Uploaded",
						fileUrl: null,
						reason: null,
						verifiedBy: null,
						verifiedDate: null,
						uploadedAt: null
					};
				}
			});

			let combinedDocs = []; // Initialize combinedDocs

			if (requiredDocs && requiredDocs.length > 0) {
				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = requiredDocs.map(reqDoc => {
					// Handle both Mongoose documents and plain objects
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

					// Find matching uploaded docs for this required doc
					const matchingUploads = uploadedDocs.filter(
						uploadDoc => uploadDoc.docsId && uploadDoc.docsId.toString() === docObj._id.toString()
					);

					return {
						_id: docObj._id,
						Name: docObj.Name || 'Document',
						description: docObj.description || '',
						uploads: matchingUploads || []
					};
				});
			} else {
				console.log("Course not found or no docs required");
			}

			// Count calculations
			let verifiedCount = 0;
			let RejectedCount = 0;
			let pendingVerificationCount = 0;
			let notUploadedCount = 0;

			allDocs.forEach(doc => {
				if (doc.status === "Verified") verifiedCount++;
				else if (doc.status === "Rejected") RejectedCount++;
				else if (doc.status === "Pending") pendingVerificationCount++;
				else if (doc.status === "Not Uploaded") notUploadedCount++;
			});

			const totalRequired = allDocs.length;
			const uploadedCount = allDocs.filter(doc => doc.status !== "Not Uploaded").length;
			const uploadPercentage = totalRequired > 0
				? Math.round((uploadedCount / totalRequired) * 100)
				: 0;

			return {
				...docObj,
				selectedSubstatus,
				uploadedDocs: combinedDocs,    // Uploaded + Not uploaded combined docs array
				docCounts: {
					totalRequired,
					RejectedCount,
					uploadedCount,
					verifiedCount,
					pendingVerificationCount,
					notUploadedCount,
					uploadPercentage
				}
			};
		});



		res.status(200).json({
			success: true,
			page: parseInt(page),
			limit: parseInt(limit),
			total,
			totalPages,
			data: result
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Server Error" });
	}
});

// Get admission list


// Verify document and update KYC status
router.route("/verify-document/:profileId/:uploadId").put(isCollege, async (req, res) => {
	try {
		const { profileId, uploadId } = req.params;
		const { status, rejectionReason } = req.body;

		const validProfileId = validateAndConvertId(profileId);
		const validUploadId = validateAndConvertId(uploadId);

		// Populate _course to get docsRequired
		const profile = await AppliedCourses.findById(validProfileId).populate('_course');
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		const docId = profile.uploadedDocs.find(doc => doc._id.toString() === validUploadId.toString()).docsId;

		console.log(docId,'docId');

		//merge docsRequired and uploadedDocs

		const requiredDocs = profile._course?.docsRequired || [];
		const uploadedDocs = profile.uploadedDocs || [];

		// Map uploaded docs by docsId for quick lookup
		const uploadedDocsMap = {};
		uploadedDocs.forEach(d => {
			if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
		});

		// Prepare combined docs array
		const allDocs = requiredDocs.map(reqDoc => {
			const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
			if (uploadedDoc) {
				// Agar uploaded hai to uploadedDoc details bhejo
				return {
					...uploadedDoc,
					Name: reqDoc.Name,        // Required document ka name bhi add kar lo
					mandatory: reqDoc.mandatory,
					_id: reqDoc._id
				};
			} else {
				// Agar uploaded nahi hai to Not Uploaded status ke saath dummy object bhejo
				return {
					docsId: reqDoc._id,
					Name: reqDoc.Name,
					mandatory: reqDoc.mandatory,
					status: "Not Uploaded",
					fileUrl: null,
					reason: null,
					verifiedBy: null,
					verifiedDate: null,
					uploadedAt: null
				};
			}
		});

		if (requiredDocs) {
			docsRequired = requiredDocs

			// Create a merged array with both required docs and uploaded docs info
			combinedDocs = docsRequired.map(reqDoc => {
				// Convert Mongoose document to plain object
				const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

				// Find matching uploaded docs for this required doc
				const matchingUploads = uploadedDocs.filter(
					uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
				);

				return {
					_id: docObj._id,
					Name: docObj.Name || 'Document',
					mandatory: docObj.mandatory,
					description: docObj.description || '',
					uploads: matchingUploads || []
				};
			});


		} else {
			console.log("Course not found or no docs required");
		};

		console.log(uploadId, 'uploadId');

		console.log(combinedDocs, 'combinedDocs');



		const isCurrentDoccumentMandatory = !!combinedDocs?.find(doc => doc._id.toString() === docId.toString() && doc.mandatory === true);

		console.log(isCurrentDoccumentMandatory, 'isCurrentDoccumentMandatory');

		const requiredCount = combinedDocs?.filter(doc => doc.mandatory === true).length || 0;
		let verifiedCount = isCurrentDoccumentMandatory ? 1 : 0;

		console.log(verifiedCount, 'verifiedCount before');



		// Count already verified docs (excluding the current one)
		for (const doc of combinedDocs || []) {

			console.log(doc, 'doc');
			if (doc._id.toString() !== docId.toString() && doc.uploads?.[doc.uploads.length - 1]?.status === 'Verified' && doc.mandatory === true) {
				verifiedCount++;
			}
		}

		console.log(verifiedCount, 'verifiedCount', requiredCount, 'requiredCount');

		// Find and update the current doc
		for (const doc of profile.uploadedDocs || []) {
			if (doc._id.toString() === validUploadId.toString()) {
				doc.status = status;
				if (status === 'Rejected') {
					doc.reason = rejectionReason;
				}
				if (status === 'Verified') {
					doc.verifiedBy = req.user._id;
					doc.verifiedDate = new Date();
				}
			}
		}

		// If this is the last required doc being verified, set KYC true
		if (status === 'Verified' && verifiedCount === requiredCount) {
			profile.kyc = true;
		}

		await profile.save();

		return res.json({
			success: true,
			message: "Document status updated successfully",
			kycUpdated: profile.kyc === true,
			verifiedCount: verifiedCount + (status === 'Verified' ? 1 : 0),
			requiredCount
		});

	} catch (err) {
		console.error("Error verifying document:", err);
		return res.status(500).json({
			success: false,
			message: err.message || "Error verifying document",
			error: err.message
		});
	}
});

//admission list
router.route("/admission-list").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;      // Default page 1
		const limit = parseInt(req.query.limit) || 50;   // Default limit 50
		const skip = (page - 1) * limit;

		const appliedCourses = await AppliedCourses.find({
			admissionDone: { $in: [true] }
		})
			.populate({
				path: '_course',
				select: 'name description docsRequired college', // Select the necessary fields
				populate: {
					path: 'sectors',
					select: 'name'
				}
			})
			.populate('_center')
			.populate('_leadStatus')
			.populate('registeredBy')
			.populate({
				path: '_candidate',
				populate: [
					{ path: '_appliedCourses', populate: [{ path: '_course', select: 'name description' }, { path: 'registeredBy', select: 'name email' }, { path: '_center', select: 'name location' }, { path: '_leadStatus', select: 'title' }] },
				]
			})
			.populate({
				path: 'logs',
				populate: {
					path: 'user',
					select: 'name'
				}
			})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const filteredAppliedCourses = appliedCourses.filter(doc => {
			// _course must be populated!
			return doc._course && String(doc._course.college) === String(college._id);
		});

		const totalCount = filteredAppliedCourses.length
		const pendingKycCount = filteredAppliedCourses.filter(doc =>
			doc.kycStage === true && doc.kyc === false
		).length;
		const doneKycCount = totalCount - pendingKycCount


		const result = filteredAppliedCourses.map(doc => {
			let selectedSubstatus = null;



			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			const docObj = doc.toObject();

			const firstSectorName = docObj._course?.sectors?.[0]?.name || 'N/A';
			if (docObj._course) {
				docObj._course.sectors = firstSectorName; // yahan replace ho raha hai
			}

			const requiredDocs = docObj._course?.docsRequired || [];
			const uploadedDocs = docObj.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});
			// Prepare combined docs array
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					// Agar uploaded hai to uploadedDoc details bhejo
					return {
						...uploadedDoc,
						Name: reqDoc.Name,        // Required document ka name bhi add kar lo
						_id: reqDoc._id
					};
				} else {
					// Agar uploaded nahi hai to Not Uploaded status ke saath dummy object bhejo
					return {
						docsId: reqDoc._id,
						Name: reqDoc.Name,
						status: "Not Uploaded",
						fileUrl: null,
						reason: null,
						verifiedBy: null,
						verifiedDate: null,
						uploadedAt: null
					};
				}
			});


			// Prepare combined docs array
			if (requiredDocs) {
				docsRequired = requiredDocs

				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = docsRequired.map(reqDoc => {
					// Convert Mongoose document to plain object
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

					// Find matching uploaded docs for this required doc
					const matchingUploads = uploadedDocs.filter(
						uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
					);

					return {
						_id: docObj._id,
						Name: docObj.Name || 'Document',
						description: docObj.description || '',
						uploads: matchingUploads || []
					};
				});


			} else {
				console.log("Course not found or no docs required");
			};

			// Count calculations
			let verifiedCount = 0;
			let RejectedCount = 0;
			let pendingVerificationCount = 0;
			let notUploadedCount = 0;

			allDocs.forEach(doc => {
				if (doc.status === "Verified") verifiedCount++;
				else if (doc.status === "Rejected") RejectedCount++;
				else if (doc.status === "Pending") pendingVerificationCount++;
				else if (doc.status === "Not Uploaded") notUploadedCount++;
			});

			const totalRequired = allDocs.length;
			const uploadedCount = allDocs.filter(doc => doc.status !== "Not Uploaded").length;
			const uploadPercentage = totalRequired > 0
				? Math.round((uploadedCount / totalRequired) * 100)
				: 0;
			return {
				...docObj,
				selectedSubstatus,
				uploadedDocs: combinedDocs,    // Uploaded + Not uploaded combined docs array
				docCounts: {
					totalRequired,
					RejectedCount,
					uploadedCount,
					verifiedCount,
					pendingVerificationCount,
					notUploadedCount,
					uploadPercentage
				}
			};
		});



		res.status(200).json({
			success: true,
			count: result.length,
			page,
			pendingKycCount,
			doneKycCount,
			limit,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			data: result,
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});




// GET API for users with pagination and filtering
// router.get('/users', isCollege, async (req, res) => {
//     try {
//         const user = req.user;

//         // Find colleges where user is concern person
//         const colleges = await College.find({
//             '_concernPerson._id': user._id
//         });

//         // Extract all concern person IDs
//         const concernPersonIds = colleges.flatMap(college => 
//             college._concernPerson.map(cp => cp._id)
//         );

//         // Get actual users
//         const users = await User.find({
//             _id: { $in: concernPersonIds }
//         });

//         res.json({
//             success: true,
//             data: { users }
//         });

//     } catch (err) {
//         console.error('Error in GET /users:', err);
//         res.status(500).json({
//             success: false,
//             message: "Server Error"
//         });
//     }
// });

//refer leads
router.route("/refer-leads")
	.get(isCollege, async (req, res) => {
		try {
			const user = req.user;
			const college = await College.findOne({
				'_concernPerson._id': user._id
			}).populate({
				path: '_concernPerson',
				populate: {
					path: '_id',
					select: 'name'
				}
			});
			const concernPerson = college._concernPerson;

			console.log(concernPerson,'concernPerson');

			res.status(200).json({
				status: true,
				concernPerson: concernPerson
			});
			// ... existing code ...
		} catch (err) {
			console.error(err);
			res.status(500).json({
				status: false,
				message: "Server Error"
			});
			// ... existing code ...
		}
	})
	.post(isCollege, async (req, res) => {
		try {
			console.log(req.body,'req.body');
			let { appliedCourseId, counselorId } = req.body;
			if (!appliedCourseId || !counselorId) {
				return res.status(400).json({ success: false, message: 'appliedCourseId and counselorId are required.' });
			}
			// Validate IDs
			if (!mongoose.Types.ObjectId.isValid(appliedCourseId) || !mongoose.Types.ObjectId.isValid(counselorId)) {
				return res.status(400).json({ success: false, message: 'Invalid appliedCourseId or counselorId.' });
			}
			if (typeof appliedCourseId == 'string') {
				appliedCourseId = new mongoose.Types.ObjectId(appliedCourseId);
			}
			if (typeof counselorId == 'string') {
				counselorId = new mongoose.Types.ObjectId(counselorId);
			}
			// Find the applied course
			const appliedCourse = await AppliedCourses.findById(appliedCourseId);
			console.log(appliedCourse,'appliedCourse');
			const oldCounselor = await User.findById(appliedCourse.leadAssignment[appliedCourse.leadAssignment.length - 1]._id);
			console.log(oldCounselor,'oldCounselor');
			const newCounselor = await User.findById(counselorId);
			console.log(newCounselor,'newCounselor');
			if (!appliedCourse) {
				return res.status(404).json({ success: false, message: 'Applied course not found.' });
			}
			// Update the assigned counselor
			appliedCourse.leadAssignment.push({
				_id: counselorId,
				counsellorName: newCounselor.name,
				assignDate: new Date()
			});
			// Add a log entry
			appliedCourse.logs = appliedCourse.logs || [];
			appliedCourse.logs.push({
				user: req.user._id,
				timestamp: new Date(),
				action: 'Lead referred to another counselor',
				remarks: `Lead referred to counselorId: ${newCounselor.name} from ${oldCounselor.name}`
			});
			await appliedCourse.save();
			return res.json({ success: true, message: 'Lead referred successfully.' });
		} catch (err) {
			console.error('Error referring lead:', err);
			return res.status(500).json({ success: false, message: 'Server error', error: err.message });
		}
	});

module.exports = router;
