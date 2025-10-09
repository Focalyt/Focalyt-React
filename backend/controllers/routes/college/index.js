const express = require("express");
const uuid = require('uuid/v1');
const cron = require('node-cron');
const { Parser } = require("json2csv");

const { isCollege, isTrainer, auth1, authenti, getAllTeamMembers } = require("../../../helpers");
const { extraEdgeAuthToken, extraEdgeUrl, env, baseUrl } = require("../../../config");
const axios = require("axios");
const mongoose = require('mongoose');

const { ObjectId } = require('mongoose').Types.ObjectId;
const puppeteer = require("puppeteer");
const { CollegeValidators } = require('../../../helpers/validators')
const { statusLogHelper } = require("../../../helpers/college");
const { AppliedCourses, StatusLogs, User, College, State, University, City, Qualification, Industry, Vacancy, CandidateImport,
	Skill, CollegeDocuments, CandidateProfile, SubQualification, Import, CoinsAlgo, AppliedJobs, HiringStatus, Company, Vertical, Project, Batch, Status, StatusB2b, Center, Courses, B2cFollowup, TrainerTimeTable } = require("../../models");
const bcrypt = require("bcryptjs");
let fs = require("fs");
let path = require("path");
const candidateRoutes = require("./candidate");
const digitalLeadRoutes = require('./digitalLead');
const leadAssignmentRuleRoutes = require("./leadAssingmentRule");
const attendanceRoutes = require("./attendance");
const classroomMediaRoutes = require("./classroomMedia");
const whatsappRoutes = require("./whatsapp");


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
const dripmarketingRoutes = require("./dripmarketing");

//Trainer route 
const trainerRoutes = require('./trainer');

//b2b routes
const b2bRoutes = require("./b2b/b2b");
const androidAppRoutes = require("./androidApp");
const statusB2bRoutes = require("./b2b/statusB2b");
const router = express.Router();
const moment = require('moment')

router.use("/b2b", isCollege, b2bRoutes);
router.use("/statusB2b", statusB2bRoutes);
router.use("/androidApp", androidAppRoutes);

router.use("/todo", isCollege, todoRoutes);
router.use("/attendance", isCollege, attendanceRoutes);
router.use("/classroom-media", isCollege, classroomMediaRoutes);
router.use("/whatsapp", isCollege, whatsappRoutes);

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
router.use("/dripmarketing", isCollege, dripmarketingRoutes);
router.use("/trainer", isCollege, trainerRoutes)
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
				return res.json({ status: false, message: 'Missing College!' });

			};
			// Extract isDefaultAdmin from _concernPerson
			const concernPersonData = college._concernPerson.find(p => p._id.toString() === userId.toString());
			const isDefaultAdmin = concernPersonData?.isDefaultAdmin || false;
			const token = await user.generateAuthToken();


			userData = {
				_id: user._id, name: user.name, role: 2, email: user.email, mobile: user.mobile, collegeName: college.name, collegeId: college._id, token, isDefaultAdmin, googleAuthToken: user.googleAuthToken, permissions: user.permissions
			};

			return res.json({ status: true, message: "Login successful", userData });

		} catch (err) {
			console.log('====================>!err ', err.message)
			return res.send({ status: false, error: err.message });
		}
	});

router.route('/permission')
	.get(isCollege, async (req, res) => {
		try {
			const user = req.user;
			const permissions = user.permissions;
			return res.send({ status: true, message: "Permission fetched successfully", permissions: permissions });
		} catch (err) {
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


					const statusData = {
						title: "Untouch Lead",
						description: "This is the default status for all new leads",
						index: 0,
						milestone: '',
						substatuses: [],
						college: college._id
					}

					const newSubstatus = {
						title: "Untouch Lead",
						description: "This is the default status for all new leads",
						hasRemarks: false,
						hasFollowup: false,
						hasAttachment: false
					}

					const newStatus = await new Status(statusData).save();
					newStatus.substatuses.push(newSubstatus);
					const newSubStatusData = await newStatus.save();

					const newStatusB2B = await new StatusB2b(statusData).save();
					newStatusB2B.substatuses.push(newSubstatus);
					const newSubStatusB2BData = await newStatusB2B.save();

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


// router.route("/appliedCandidates").get(isCollege, async (req, res) => {
// 		try {
// 			const user = req.user;
// 			let teamMembers = await getAllTeamMembers(user._id);

// 			const college = await College.findOne({
// 				'_concernPerson._id': user._id
// 			});

// 			const page = parseInt(req.query.page) || 1;
// 			const limit = parseInt(req.query.limit) || 50;
// 			const skip = (page - 1) * limit;

// 			// Extract ALL filter parameters from query
// 			const {
// 				name,
// 				courseType,
// 				status,
// 				leadStatus,
// 				sector,
// 				createdFromDate,
// 				createdToDate,
// 				modifiedFromDate,
// 				modifiedToDate,
// 				nextActionFromDate,
// 				nextActionToDate,
// 				// Multi-select filters (these come as JSON strings)
// 				projects,
// 				verticals,
// 				course,
// 				center,
// 				counselor
// 			} = req.query;

// 			// Parse multi-select filter values
// 			let projectsArray = [];
// 			let verticalsArray = [];
// 			let courseArray = [];
// 			let centerArray = [];
// 			let counselorArray = [];

// 			try {
// 				if (projects) projectsArray = JSON.parse(projects);
// 				if (verticals) verticalsArray = JSON.parse(verticals);
// 				if (course) courseArray = JSON.parse(course);
// 				if (center) centerArray = JSON.parse(center);
// 				if (counselor) counselorArray = JSON.parse(counselor);
// 			} catch (parseError) {
// 				console.error('Error parsing filter arrays:', parseError);
// 			}

// 			if (counselorArray.length > 0) {
// 				teamMembers = counselorArray
// 			}




// 			let allFilteredResults = [];

// 			for (let member of teamMembers) {
// 				// Build aggregation pipeline
// 				let aggregationPipeline = [];

// 				if (typeof member === 'string') {
// 					member = new mongoose.Types.ObjectId(member)

// 				}


// 				// Base match stage
// 				let baseMatchStage = {
// 					kycStage: { $nin: [true] },
// 					kyc: { $nin: [true] },
// 					admissionDone: { $nin: [true] },
// 					$or: [
// 						{ registeredBy: member },
// 						{
// 							$expr: {
// 								$eq: [
// 									{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
// 									member
// 								]
// 							}
// 						}
// 					]
// 				};

// 				// Add date filters to base match
// 				if (createdFromDate || createdToDate) {
// 					baseMatchStage.createdAt = {};
// 					if (createdFromDate) {
// 						baseMatchStage.createdAt.$gte = new Date(createdFromDate);
// 					}
// 					if (createdToDate) {
// 						const toDate = new Date(createdToDate);
// 						toDate.setHours(23, 59, 59, 999);
// 						baseMatchStage.createdAt.$lte = toDate;
// 					}
// 				}

// 				if (modifiedFromDate || modifiedToDate) {
// 					baseMatchStage.updatedAt = {};
// 					if (modifiedFromDate) {
// 						baseMatchStage.updatedAt.$gte = new Date(modifiedFromDate);
// 					}
// 					if (modifiedToDate) {
// 						const toDate = new Date(modifiedToDate);
// 						toDate.setHours(23, 59, 59, 999);
// 						baseMatchStage.updatedAt.$lte = toDate;
// 					}
// 				}

// 				if (nextActionFromDate || nextActionToDate) {
// 					baseMatchStage.followupDate = {};
// 					if (nextActionFromDate) {
// 						baseMatchStage.followupDate.$gte = new Date(nextActionFromDate);
// 					}
// 					if (nextActionToDate) {
// 						const toDate = new Date(nextActionToDate);
// 						toDate.setHours(23, 59, 59, 999);
// 						baseMatchStage.followupDate.$lte = toDate;
// 					}
// 				}

// 				// Status filters
// 				if (status && status !== 'true') {
// 					baseMatchStage._leadStatus = new mongoose.Types.ObjectId(status);
// 				}
// 				if (leadStatus) {
// 					baseMatchStage._leadStatus = new mongoose.Types.ObjectId(leadStatus);
// 				}

// 				// Add base match stage
// 				aggregationPipeline.push({ $match: baseMatchStage });

// 				// Lookup stages for all related collections
// 				aggregationPipeline.push(
// 					// Course lookup with sectors, vertical, project population
// 					{
// 						$lookup: {
// 							from: 'courses',
// 							localField: '_course',
// 							foreignField: '_id',
// 							as: '_course',
// 							pipeline: [
// 								{
// 									$lookup: {
// 										from: 'sectors',
// 										localField: 'sectors',
// 										foreignField: '_id',
// 										as: 'sectors'
// 									}
// 								},
// 								{
// 									$lookup: {
// 										from: 'verticals',
// 										localField: 'vertical',
// 										foreignField: '_id',
// 										as: 'verticalData'
// 									}
// 								},
// 								{
// 									$lookup: {
// 										from: 'projects',
// 										localField: 'project',
// 										foreignField: '_id',
// 										as: 'projectData'  // ← Different name
// 									}
// 								},
// 								{
// 									$addFields: {
// 										projectInfo: { $arrayElemAt: ['$projectData', 0] },  // ← Single object
// 										// Keep original 'project' field as ObjectId
// 										verticalInfo: { $arrayElemAt: ['$verticalData', 0] },
// 									}
// 								}
// 							]
// 						}
// 					},
// 					{ $unwind: '$_course' },

// 					// Lead Status lookup
// 					{
// 						$lookup: {
// 							from: 'status',
// 							localField: '_leadStatus',
// 							foreignField: '_id',
// 							as: '_leadStatus'
// 						}
// 					},
// 					{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } },

// 					// Center lookup
// 					{
// 						$lookup: {
// 							from: 'centers',
// 							localField: '_center',
// 							foreignField: '_id',
// 							as: '_center'
// 						}
// 					},
// 					{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },

// 					// Registered By lookup
// 					{
// 						$lookup: {
// 							from: 'users',
// 							localField: 'registeredBy',
// 							foreignField: '_id',
// 							as: 'registeredBy'
// 						}
// 					},
// 					{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },

// 					// Candidate lookup with applied courses
// 					{
// 						$lookup: {
// 							from: 'candidateprofiles',
// 							localField: '_candidate',
// 							foreignField: '_id',
// 							as: '_candidate',
// 							pipeline: [
// 								{
// 									$lookup: {
// 										from: 'appliedcourses',
// 										localField: '_appliedCourses',
// 										foreignField: '_id',
// 										as: '_appliedCourses',
// 										pipeline: [
// 											{
// 												$lookup: {
// 													from: 'courses',
// 													localField: '_course',
// 													foreignField: '_id',
// 													as: '_course'
// 												}
// 											},
// 											{
// 												$lookup: {
// 													from: 'users',
// 													localField: 'registeredBy',
// 													foreignField: '_id',
// 													as: 'registeredBy'
// 												}
// 											},
// 											{
// 												$lookup: {
// 													from: 'centers',
// 													localField: '_center',
// 													foreignField: '_id',
// 													as: '_center'
// 												}
// 											},
// 											{
// 												$lookup: {
// 													from: 'status',
// 													localField: '_leadStatus',
// 													foreignField: '_id',
// 													as: '_leadStatus'
// 												}
// 											}
// 										]
// 									}
// 								}
// 							]
// 						}
// 					},
// 					{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

// 					// Logs lookup

// 					{
// 						$lookup: {
// 							from: 'users',
// 							localField: 'logs.user',
// 							foreignField: '_id',
// 							as: 'logUsers'
// 						}
// 					},
// 					{
// 						$addFields: {
// 							logs: {
// 								$map: {
// 									input: "$logs",
// 									as: "log",
// 									in: {
// 										$mergeObjects: [
// 											"$$log",
// 											{
// 												user: {
// 													$arrayElemAt: [
// 														{
// 															$filter: {
// 																input: "$logUsers",
// 																cond: { $eq: ["$$this._id", "$$log.user"] }
// 															}
// 														},
// 														0
// 													]
// 												}
// 											}
// 										]
// 									}
// 								}
// 							}
// 						}
// 					}

// 				);

// 				// Filter by college
// 				aggregationPipeline.push({
// 					$match: {
// 						'_course.college': college._id
// 					}
// 				});

// 				// Apply additional filters based on populated data
// 				let additionalMatches = {};

// 				// Course type filter
// 				if (courseType) {
// 					additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(courseType, 'i') };
// 				}

// 				// Sector filter (multi-select)
// 				if (projectsArray.length > 0) {
// 					additionalMatches['_course.project'] = {
// 						$in: projectsArray.map(id => new mongoose.Types.ObjectId(id))
// 					};
// 				}

// 				// Verticals filter (multi-select)
// 				if (verticalsArray.length > 0) {
// 					additionalMatches['_course.vertical'] = { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
// 				}

// 				// Course filter (multi-select)
// 				if (courseArray.length > 0) {
// 					additionalMatches['_course._id'] = { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) };
// 				}

// 				// Center filter (multi-select)
// 				if (centerArray.length > 0) {
// 					additionalMatches['_center._id'] = { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) };
// 				}


// 				// Name search filter
// 				if (name && name.trim()) {
// 					const searchTerm = name.trim();
// 					const searchRegex = new RegExp(searchTerm, 'i');



// 					additionalMatches.$or = additionalMatches.$or ? [
// 						...additionalMatches.$or,
// 						{ '_candidate.name': searchRegex },
// 						{ '_candidate.mobile': searchRegex },
// 						{ '_candidate.mobile': parseInt(searchTerm) || searchTerm }, // Try both number and string
// 						{ '_candidate.email': searchRegex }
// 					] : [
// 						{ '_candidate.name': searchRegex },
// 						{ '_candidate.mobile': searchRegex },
// 						{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
// 						{ '_candidate.email': searchRegex }
// 					];
// 				}

// 				// Add additional match stage if any filters are applied
// 				if (Object.keys(additionalMatches).length > 0) {
// 					aggregationPipeline.push({ $match: additionalMatches });
// 				}

// 				// Sort by creation date
// 				aggregationPipeline.push({
// 					$sort: { updatedAt: -1 }
// 				});

// 				// Execute aggregation
// 				const response = await AppliedCourses.aggregate(aggregationPipeline);

// 				// Add unique results to the main array
// 				response.forEach(doc => {
// 					if (!allFilteredResults.some(existingDoc => existingDoc._id.toString() === doc._id.toString())) {
// 						allFilteredResults.push(doc);
// 					}
// 				});
// 			}

// 			// Process results for document counts and other formatting
// 			const results = allFilteredResults.map(doc => {
// 				let selectedSubstatus = null;

// 				if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
// 					selectedSubstatus = doc._leadStatus.substatuses.find(
// 						sub => sub._id.toString() === doc._leadSubStatus.toString()
// 					);
// 				}

// 				// Process sectors to show first sector name
// 				const firstSectorName = doc._course?.sectors?.[0]?.name || 'N/A';
// 				if (doc._course) {
// 					doc._course.sectors = firstSectorName;
// 				}

// 				const requiredDocs = doc._course?.docsRequired || [];
// 				const uploadedDocs = doc.uploadedDocs || [];

// 				// Map uploaded docs by docsId for quick lookup
// 				const uploadedDocsMap = {};
// 				uploadedDocs.forEach(d => {
// 					if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
// 				});

// 				let combinedDocs = [];

// 				if (requiredDocs) {
// 					// Create a merged array with both required docs and uploaded docs info
// 					combinedDocs = requiredDocs.map(reqDoc => {
// 						// Convert Mongoose document to plain object
// 						const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

// 						// Find matching uploaded docs for this required doc
// 						const matchingUploads = uploadedDocs.filter(
// 							uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
// 						);

// 						return {
// 							_id: docObj._id,
// 							Name: docObj.Name || 'Document',
// 							mandatory: docObj.mandatory,
// 							description: docObj.description || '',
// 							uploads: matchingUploads || []
// 						};
// 					});
// 				}

// 				// Prepare combined docs array for legacy compatibility
// 				const allDocs = requiredDocs.map(reqDoc => {
// 					const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
// 					if (uploadedDoc) {
// 						return {
// 							...uploadedDoc,
// 							Name: reqDoc.Name,
// 							mandatory: reqDoc.mandatory,
// 							_id: reqDoc._id
// 						};
// 					} else {
// 						return {
// 							docsId: reqDoc._id,
// 							Name: reqDoc.Name,
// 							mandatory: reqDoc.mandatory,
// 							status: "Not Uploaded",
// 							fileUrl: null,
// 							reason: null,
// 							verifiedBy: null,
// 							verifiedDate: null,
// 							uploadedAt: null
// 						};
// 					}
// 				});

// 				// Count calculations
// 				let verifiedCount = 0;
// 				let RejectedCount = 0;
// 				let pendingVerificationCount = 0;
// 				let notUploadedCount = 0;

// 				allDocs.forEach(doc => {
// 					if (doc.status === "Verified") verifiedCount++;
// 					else if (doc.status === "Rejected") RejectedCount++;
// 					else if (doc.status === "Pending") pendingVerificationCount++;
// 					else if (doc.status === "Not Uploaded") notUploadedCount++;
// 				});

// 				const totalRequired = allDocs.length;
// 				const uploadedCount = allDocs.filter(doc => doc.status !== "Not Uploaded").length;
// 				const uploadPercentage = totalRequired > 0
// 					? Math.round((uploadedCount / totalRequired) * 100)
// 					: 0;

// 				return {
// 					...doc,
// 					selectedSubstatus,
// 					uploadedDocs: combinedDocs,
// 					docCounts: {
// 						totalRequired,
// 						RejectedCount,
// 						uploadedCount,
// 						verifiedCount,
// 						pendingVerificationCount,
// 						notUploadedCount,
// 						uploadPercentage
// 					}
// 				};
// 			});

// 			// Calculate CRM filter counts
// 			const crmFilterCounts = await calculateCrmFilterCounts(teamMembers, college._id, {
// 				name,
// 				courseType,
// 				sector,
// 				createdFromDate,
// 				createdToDate,
// 				modifiedFromDate,
// 				modifiedToDate,
// 				nextActionFromDate,
// 				nextActionToDate,
// 				projectsArray,
// 				verticalsArray,
// 				courseArray,
// 				centerArray,
// 				counselorArray
// 			});

// 			// Apply pagination
// 			const totalCount = results.length;
// 			const paginatedResult = results.slice(skip, skip + limit);


// 			res.status(200).json({
// 				success: true,
// 				count: paginatedResult.length,
// 				page,
// 				limit,
// 				totalCount,
// 				totalPages: Math.ceil(totalCount / limit),
// 				data: paginatedResult,
// 				allData: results,
// 				crmFilterCounts
// 			});

// 		} catch (err) {
// 			console.error(err);
// 			res.status(500).json({
// 				success: false,
// 				message: "Server Error"
// 			});
// 		}
// 	});

// Helper function to calculate CRM filter counts with applied filters
// async function calculateCrmFilterCounts(teamMembers, collegeId, appliedFilters = {}) {
// 	const counts = { all: 0 };

// 	try {
// 		const allStatuses = await Status.find({}).select('_id title milestone');

// 		// Initialize counts for each status
// 		allStatuses.forEach(status => {
// 			counts[status._id.toString()] = {
// 				_id: status._id,
// 				name: status.title,
// 				milestone: status.milestone,
// 				count: 0
// 			};
// 		});

// 		for (let member of teamMembers) {
// 			// Build base aggregation pipeline
// 			let basePipeline = [];

// 			if (typeof member === 'string') {
// 				member = new mongoose.Types.ObjectId(member)
// 			}

// 			// Base match stage
// 			let baseMatchStage = {
// 				kycStage: { $nin: [true] },
// 				kyc: { $nin: [true] },
// 				admissionDone: { $nin: [true] },
// 				$or: [
// 					{ registeredBy: member },
// 					{
// 						$expr: {
// 							$eq: [
// 								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
// 								member
// 							]
// 						}
// 					}
// 				]
// 			};

// 			// Add date filters
// 			if (appliedFilters.createdFromDate || appliedFilters.createdToDate) {
// 				baseMatchStage.createdAt = {};
// 				if (appliedFilters.createdFromDate) {
// 					baseMatchStage.createdAt.$gte = new Date(appliedFilters.createdFromDate);
// 				}
// 				if (appliedFilters.createdToDate) {
// 					const toDate = new Date(appliedFilters.createdToDate);
// 					toDate.setHours(23, 59, 59, 999);
// 					baseMatchStage.createdAt.$lte = toDate;
// 				}
// 			}

// 			if (appliedFilters.modifiedFromDate || appliedFilters.modifiedToDate) {
// 				baseMatchStage.updatedAt = {};
// 				if (appliedFilters.modifiedFromDate) {
// 					baseMatchStage.updatedAt.$gte = new Date(appliedFilters.modifiedFromDate);
// 				}
// 				if (appliedFilters.modifiedToDate) {
// 					const toDate = new Date(appliedFilters.modifiedToDate);
// 					toDate.setHours(23, 59, 59, 999);
// 					baseMatchStage.updatedAt.$lte = toDate;
// 				}
// 			}

// 			if (appliedFilters.nextActionFromDate || appliedFilters.nextActionToDate) {
// 				baseMatchStage.followupDate = {};
// 				if (appliedFilters.nextActionFromDate) {
// 					baseMatchStage.followupDate.$gte = new Date(appliedFilters.nextActionFromDate);
// 				}
// 				if (appliedFilters.nextActionToDate) {
// 					const toDate = new Date(appliedFilters.nextActionToDate);
// 					toDate.setHours(23, 59, 59, 999);
// 					baseMatchStage.followupDate.$lte = toDate;
// 				}
// 			}

// 			basePipeline.push({ $match: baseMatchStage });

// 			// Add lookups
// 			basePipeline.push(
// 				{
// 					$lookup: {
// 						from: 'courses',
// 						localField: '_course',
// 						foreignField: '_id',
// 						as: '_course',
// 						pipeline: [
// 							{
// 								$lookup: {
// 									from: 'sectors',
// 									localField: 'sectors',
// 									foreignField: '_id',
// 									as: 'sectors'
// 								}
// 							},
// 							{
// 								$lookup: {
// 									from: 'verticals',
// 									localField: 'vertical',
// 									foreignField: '_id',
// 									as: 'verticalData'
// 								}
// 							},
// 							{
// 								$lookup: {
// 									from: 'projects',
// 									localField: 'project',
// 									foreignField: '_id',
// 									as: 'projectData'  // ← Changed from 'project' to 'projectData'
// 								}
// 							},
// 							{
// 								$addFields: {
// 									projectInfo: { $arrayElemAt: ['$projectData', 0] },  // ← Single object
// 									// Keep original 'project' field as ObjectId
// 									verticalInfo: { $arrayElemAt: ['$verticalData', 0] },
// 								}
// 							}
// 						]
// 					}
// 				},
// 				{ $unwind: '$_course' },
// 				{
// 					$lookup: {
// 						from: 'centers',
// 						localField: '_center',
// 						foreignField: '_id',
// 						as: '_center'
// 					}
// 				},
// 				{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },

// 				{
// 					$lookup: {
// 						from: 'users',
// 						localField: 'registeredBy',
// 						foreignField: '_id',
// 						as: 'registeredBy'
// 					}
// 				},
// 				{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },
// 				{
// 					$lookup: {
// 						from: 'candidateprofiles',
// 						localField: '_candidate',
// 						foreignField: '_id',
// 						as: '_candidate'
// 					}
// 				},
// 				{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

// 			);

// 			// Filter by college FIRST
// 			basePipeline.push({
// 				$match: {
// 					'_course.college': collegeId
// 				}
// 			});

// 			// Apply additional filters
// 			let additionalMatches = {};

// 			if (appliedFilters.courseType) {
// 				additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(appliedFilters.courseType, 'i') };
// 			}

// 			if (appliedFilters.projectsArray.length > 0) {
// 				additionalMatches['_course.project'] = {
// 					$in: appliedFilters.projectsArray.map(id => new mongoose.Types.ObjectId(id))
// 				};
// 			}

// 			if (appliedFilters.verticalsArray && appliedFilters.verticalsArray.length > 0) {
// 				additionalMatches['_course.vertical'] = { $in: appliedFilters.verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
// 			}

// 			if (appliedFilters.courseArray && appliedFilters.courseArray.length > 0) {
// 				additionalMatches['_course._id'] = { $in: appliedFilters.courseArray.map(id => new mongoose.Types.ObjectId(id)) };
// 			}

// 			if (appliedFilters.centerArray && appliedFilters.centerArray.length > 0) {
// 				additionalMatches['_center._id'] = { $in: appliedFilters.centerArray.map(id => new mongoose.Types.ObjectId(id)) };
// 			}



// 			if (appliedFilters.name && appliedFilters.name.trim()) {
// 				const searchRegex = new RegExp(appliedFilters.name.trim(), 'i');
// 				additionalMatches.$or = additionalMatches.$or ? [
// 					...additionalMatches.$or,
// 					{ '_candidate.name': searchRegex },
// 					{ '_candidate.mobile': searchRegex },
// 					{ '_candidate.email': searchRegex }
// 				] : [
// 					{ '_candidate.name': searchRegex },
// 					{ '_candidate.mobile': searchRegex },
// 					{ '_candidate.email': searchRegex }
// 				];
// 			}

// 			if (Object.keys(additionalMatches).length > 0) {
// 				basePipeline.push({ $match: additionalMatches });
// 			}

// 			// Get all leads count (without status filter)
// 			const allLeadsAggregation = await AppliedCourses.aggregate([
// 				...basePipeline,
// 				{ $count: "total" }
// 			]);

// 			const allLeadsCount = allLeadsAggregation[0]?.total || 0;
// 			counts.all += allLeadsCount;

// 			// Get status-wise counts with proper grouping
// 			const statusCountsAggregation = await AppliedCourses.aggregate([
// 				...basePipeline,
// 				// Add a stage to handle null leadStatus
// 				{
// 					$addFields: {
// 						leadStatusId: {
// 							$ifNull: ["$_leadStatus", null]
// 						}
// 					}
// 				},
// 				// Group by leadStatusId
// 				{
// 					$group: {
// 						_id: "$leadStatusId",
// 						count: { $sum: 1 }
// 					}
// 				}
// 			]);


// 			// Update counts
// 			statusCountsAggregation.forEach(statusGroup => {
// 				const statusId = statusGroup._id;
// 				const count = statusGroup.count;

// 				if (statusId) {
// 					const statusKey = statusId.toString();
// 					if (counts[statusKey]) {
// 						counts[statusKey].count += count;
// 					}
// 				} else {
// 					// Handle null status
// 					if (!counts['null']) {
// 						counts['null'] = {
// 							_id: null,
// 							name: 'No Status',
// 							milestone: null,
// 							count: 0
// 						};
// 					}
// 					counts['null'].count += count;
// 				}
// 			});
// 		}

// 		// Remove statuses with 0 count (optional)
// 		const finalCounts = {};
// 		Object.keys(counts).forEach(key => {
// 			if (key === 'all' || (counts[key].count && counts[key].count > 0)) {
// 				finalCounts[key] = counts[key];
// 			}
// 		});

// 		return finalCounts;

// 	} catch (error) {
// 		console.error('Error calculating CRM filter counts:', error);
// 		return { all: 0 };
// 	}
// }

router.route("/appliedCandidatesDetails").get(isCollege, async (req, res) => {
	try {
		const user = req.user;

		// Get the specific lead ID from request body
		let { leadId } = req.query;

		// console.log("leadId", leadId)

		if (!leadId) {
			return res.status(400).json({
				success: false,
				message: "Lead ID is required in request body"
			});
		}

		if (typeof leadId === 'string') {
			leadId = new mongoose.Types.ObjectId(leadId);
		}

		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		// Build aggregation pipeline
		let aggregationPipeline = [];

		// Base match stage - ONLY filter by specific leadId
		let baseMatchStage = {
			_id: new mongoose.Types.ObjectId(leadId)
		};

		// Add base match stage
		aggregationPipeline.push({ $match: baseMatchStage });

		// Lookup stages for all related collections
		aggregationPipeline.push(
			// Course lookup with sectors, vertical, project population
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{
							$lookup: {
								from: 'sectors',
								localField: 'sectors',
								foreignField: '_id',
								as: 'sectors'
							}
						},
						{
							$lookup: {
								from: 'verticals',
								localField: 'vertical',
								foreignField: '_id',
								as: 'verticalData'
							}
						},
						{
							$lookup: {
								from: 'projects',
								localField: 'project',
								foreignField: '_id',
								as: 'projectData'
							}
						},
						{
							$addFields: {
								projectInfo: { $arrayElemAt: ['$projectData', 0] },
								verticalInfo: { $arrayElemAt: ['$verticalData', 0] },
							}
						}
					]
				}
			},
			{ $unwind: '$_course' },

			// Lead Status lookup
			{
				$lookup: {
					from: 'status',
					localField: '_leadStatus',
					foreignField: '_id',
					as: '_leadStatus'
				}
			},
			{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } },

			// Center lookup
			{
				$lookup: {
					from: 'centers',
					localField: '_center',
					foreignField: '_id',
					as: '_center'
				}
			},
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: "users",         // First lookup for User
					localField: "registeredBy",
					foreignField: "_id",
					as: "registeredByUser"
				}
			},
			{
				$lookup: {
					from: "sources",       // Second lookup for Source
					localField: "registeredBy",
					foreignField: "_id",
					as: "registeredBySource"
				}
			},
			{
				$addFields: {
					// We merge the results, prefer User data if available
					registeredBy: {
						$ifNull: [{ $arrayElemAt: ["$registeredByUser", 0] }, { $arrayElemAt: ["$registeredBySource", 0] }]
					}
				}
			},
			{
				$project: {
					registeredByUser: 0,  // Removing intermediate fields
					registeredBySource: 0
				}
			},

			// Registered By lookup
			// {
			// 	$lookup: {
			// 		from: 'users',
			// 		localField: 'registeredBy',
			// 		foreignField: '_id',
			// 		as: 'registeredBy'
			// 	}
			// },
			// { $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },

			// Candidate lookup with applied courses
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: '_candidate',
					foreignField: '_id',
					as: '_candidate',
					pipeline: [
						{
							$lookup: {
								from: 'appliedcourses',
								localField: '_appliedCourses',
								foreignField: '_id',
								as: '_appliedCourses',
								pipeline: [
									{
										$lookup: {
											from: 'courses',
											localField: '_course',
											foreignField: '_id',
											as: '_course'
										}
									},
									// {
									// 	$lookup: {
									// 		from: 'users',
									// 		localField: 'registeredBy',
									// 		foreignField: '_id',
									// 		as: 'registeredBy'
									// 	}
									// },
									{
										$lookup: {
											from: "users",         // First lookup for User
											localField: "registeredBy",
											foreignField: "_id",
											as: "registeredByUser"
										}
									},
									{
										$lookup: {
											from: "sources",       // Second lookup for Source
											localField: "registeredBy",
											foreignField: "_id",
											as: "registeredBySource"
										}
									},
									{
										$addFields: {
											// We merge the results, prefer User data if available
											registeredBy: {
												$ifNull: [{ $arrayElemAt: ["$registeredByUser", 0] }, { $arrayElemAt: ["$registeredBySource", 0] }]
											}
										}
									},
									{
										$project: {
											registeredByUser: 0,  // Removing intermediate fields
											registeredBySource: 0
										}
									}
									,
									{
										$lookup: {
											from: 'centers',
											localField: '_center',
											foreignField: '_id',
											as: '_center'
										}
									},
									{
										$lookup: {
											from: 'status',
											localField: '_leadStatus',
											foreignField: '_id',
											as: '_leadStatus'
										}
									}
								]
							}
						}
					]
				}
			},
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

			// Logs lookup
			{
				$lookup: {
					from: 'users',
					localField: 'logs.user',
					foreignField: '_id',
					as: 'logUsers'
				}
			},
			{
				$addFields: {
					logs: {
						$map: {
							input: "$logs",
							as: "log",
							in: {
								$mergeObjects: [
									"$$log",
									{
										user: {
											$arrayElemAt: [
												{
													$filter: {
														input: "$logUsers",
														cond: { $eq: ["$$this._id", "$$log.user"] }
													}
												},
												0
											]
										}
									}
								]
							}
						}
					}
				}
			}
		);

		// Filter by college
		aggregationPipeline.push({
			$match: {
				'_course.college': college._id
			}
		});

		// Sort by creation date
		aggregationPipeline.push({
			$sort: { updatedAt: -1 }
		});

		// Execute aggregation
		const response = await AppliedCourses.aggregate(aggregationPipeline);

		for (let doc of response) {
			if (doc._candidate && doc._candidate.personalInfo) {
				if (doc._candidate.personalInfo.currentAddress && doc._candidate.personalInfo.currentAddress.state) {
					const state = await State.findById(doc._candidate.personalInfo.currentAddress.state);
					if (state) {
						doc._candidate.personalInfo.currentAddress.state = state.name;
					}
				}
				if (doc._candidate.personalInfo.currentAddress && doc._candidate.personalInfo.currentAddress.city) {
					const city = await City.findById(doc._candidate.personalInfo.currentAddress.city);
					if (city) {
						doc._candidate.personalInfo.currentAddress.city = city.name;
					}
				}
				if (doc._candidate.personalInfo.permanentAddress && doc._candidate.personalInfo.permanentAddress.state) {
					const state = await State.findById(doc._candidate.personalInfo.permanentAddress.state);
					if (state) {
						doc._candidate.personalInfo.permanentAddress.state = state.name;
					}
				}
				if (doc._candidate.personalInfo.permanentAddress && doc._candidate.personalInfo.permanentAddress.city) {
					const city = await City.findById(doc._candidate.personalInfo.permanentAddress.city);
					if (city) {
						doc._candidate.personalInfo.permanentAddress.city = city.name;
					}
				}
			}
		}
		// Process results for document counts and other formatting
		const results = response.map(doc => {
			let selectedSubstatus = null;

			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			// Process sectors to show first sector name
			const firstSectorName = doc._course?.sectors?.[0]?.name || 'N/A';
			if (doc._course) {
				doc._course.sectors = firstSectorName;
			}

			const requiredDocs = doc._course?.docsRequired || [];
			const uploadedDocs = doc.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});

			let combinedDocs = [];

			if (requiredDocs) {
				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = requiredDocs.map(reqDoc => {
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
			}

			// Prepare combined docs array for legacy compatibility
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					return {
						...uploadedDoc,
						Name: reqDoc.Name,
						mandatory: reqDoc.mandatory,
						_id: reqDoc._id
					};
				} else {
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
				...doc,
				selectedSubstatus,
				uploadedDocs: combinedDocs,
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


		const data = results[0]

		const followup = await B2cFollowup.findOne({ appliedCourseId: data._id, status: 'planned' })

		data.followup = followup

		// console.log("data", data)


		res.status(200).json({
			success: true,
			data: data || null, // Single object instead of array
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});

router.route("/appliedCandidates").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;
		const skip = (page - 1) * limit;

		// Extract filter parameters
		const {
			name, courseType, status, leadStatus,
			createdFromDate, createdToDate, modifiedFromDate, modifiedToDate,
			nextActionFromDate, nextActionToDate,
			projects, verticals, course, center, counselor, subStatuses
		} = req.query;

		// console.log("substautes", subStatuses)
		// Parse multi-select filters
		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];

		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		// Get team members
		let teamMembers = [req.user._id];

		if (projectsArray.length > 0) {
			teamMembers = [];
		}

		if (verticalsArray.length > 0) {
			teamMembers = [];
		}

		if (courseArray.length > 0) {
			teamMembers = [];
		}

		if (centerArray.length > 0) {
			teamMembers = [];
		}
		if (name && name.trim() !== '') {
			teamMembers = [];
		}
		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}


		let teamMemberIds = [];
		if (teamMembers?.length > 0) {
			teamMemberIds = teamMembers.map(member =>
				typeof member === 'string' ? new mongoose.Types.ObjectId(member) : member
			);
		}


		// Build optimized pipeline with only essential fields
		const pipeline = buildSimplifiedPipeline({
			teamMemberIds,
			college,
			filters: {
				name, courseType, status, leadStatus,
				createdFromDate, createdToDate,
				modifiedFromDate, modifiedToDate,
				nextActionFromDate, nextActionToDate,
				projectsArray, verticalsArray, courseArray, centerArray, subStatuses
			},
			pagination: { skip, limit }
		});


		// Execute queries in parallel
		const [results, totalCountResult] = await Promise.all([
			AppliedCourses.aggregate(pipeline),
			AppliedCourses.aggregate([
				...pipeline.slice(0, -2), // Remove sort and pagination
				{ $count: "total" }
			])
			// Calculate filter counts in parallel
			// calculateOptimizedFilterCounts(teamMemberIds, college._id, {
			//     name, courseType, 
			//     createdFromDate, createdToDate,
			//     modifiedFromDate, modifiedToDate,
			//     nextActionFromDate, nextActionToDate,
			//     projectsArray, verticalsArray, courseArray, centerArray
			// })
		]);

		const totalCount = totalCountResult[0]?.total || 0;

		// Process results - sirf essential fields return karenge
		const processedResults = results.map(doc => {
			// Calculate doc counts
			const docCounts = calculateSimpleDocCounts(
				doc._course?.docsRequired || [],
				doc.uploadedDocs || []
			);

			// Get substatus
			let selectedSubstatus = null;
			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			return {
				_id: doc._id,
				_candidate: {
					_id: (doc._candidate && doc._candidate._id) ? doc._candidate._id : null,
					mobile: (doc._candidate && doc._candidate.mobile) ? doc._candidate.mobile : 'N/A',
					name: (doc._candidate && doc._candidate.name) ? doc._candidate.name : 'N/A',
					email: (doc._candidate && doc._candidate.email) ? doc._candidate.email : 'N/A'
				},
				_leadStatus: {
					_id: doc._leadStatus?._id || null,
					title: doc._leadStatus?.title || 'No Status'
				},
				_leadSubStatus: selectedSubstatus ? selectedSubstatus._id : null,
				selectedSubstatus: {
					_id: selectedSubstatus ? selectedSubstatus._id : null,
					title: selectedSubstatus ? selectedSubstatus.title : 'No Sub Status',
					hasAttachment: selectedSubstatus ? selectedSubstatus.hasAttachment : false,
					hasFollowup: selectedSubstatus ? selectedSubstatus.hasFollowup : false,
					hasFollowup: selectedSubstatus ? selectedSubstatus.hasFollowup : false,
				},
				docCounts
			};
		});

		res.status(200).json({
			success: true,
			count: processedResults.length,
			totalCount,
			page,
			limit,
			totalPages: Math.ceil(totalCount / limit),
			data: processedResults,
			// crmFilterCounts
		});

	} catch (err) {
		console.error('API Error:', err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});

function buildSimplifiedPipeline({ teamMemberIds, college, filters, pagination }) {
	const pipeline = [];
	let baseMatch = {};
	filters.leadStatus = String(filters.leadStatus);
	if (filters.leadStatus === '6894825c9fc1425f4d5e2fc5') {
		baseMatch = {
			kycStage: { $in: [true] },
		};
	}

	else {
		// Base match with essential filters
		baseMatch = {
			kycStage: { $ne: true },
			kyc: { $ne: true },
			admissionDone: { $ne: true },
		};
	}





	if (teamMemberIds && teamMemberIds.length > 0) {
		baseMatch.$or = [
			{ registeredBy: { $in: teamMemberIds } },
			{ counsellor: { $in: teamMemberIds } }
		];
	}


	// Add date filters
	if (filters.createdFromDate || filters.createdToDate) {
		baseMatch.createdAt = {};
		if (filters.createdFromDate) baseMatch.createdAt.$gte = new Date(filters.createdFromDate);
		if (filters.createdToDate) {
			const toDate = new Date(filters.createdToDate);
			// Add 1 day (24 hours) to the date
			toDate.setDate(toDate.getDate() + 1);
			// Set time to 18:30:00.000 (6:30 PM)
			// Use this modified 'toDate' as the upper limit in the filter
			baseMatch.createdAt.$lte = toDate;
		}
	}

	if (filters.modifiedFromDate || filters.modifiedToDate) {
		baseMatch.updatedAt = {};
		if (filters.modifiedFromDate) baseMatch.updatedAt.$gte = new Date(filters.modifiedFromDate);
		if (filters.modifiedToDate) {
			const toDate = new Date(filters.modifiedToDate);
			toDate.setDate(toDate.getDate() + 1);

			baseMatch.updatedAt.$lte = toDate;
		}
	}

	if (filters.nextActionFromDate || filters.nextActionToDate) {
		baseMatch.followupDate = {};
		if (filters.nextActionFromDate) baseMatch.followupDate.$gte = new Date(filters.nextActionFromDate);
		if (filters.nextActionToDate) {
			const toDate = new Date(filters.nextActionToDate);
			toDate.setDate(toDate.getDate() + 1);

			baseMatch.followupDate.$lte = toDate;
		}
	}


	if (filters.leadStatus && filters.leadStatus !== 'undefined' && filters.leadStatus !== '6894825c9fc1425f4d5e2fc5') {
		// Only set _leadStatus if it's a valid ObjectId string
		if (mongoose.Types.ObjectId.isValid(filters.leadStatus)) {
			baseMatch._leadStatus = new mongoose.Types.ObjectId(filters.leadStatus);
		} else {
			console.log('Invalid leadStatus:', filters.leadStatus);
		}
	}
	if (filters.subStatuses && filters.subStatuses !== 'undefined') {

		baseMatch._leadSubStatus = new mongoose.Types.ObjectId(filters.subStatuses);

	}

	pipeline.push({ $match: baseMatch });

	// Essential lookups only - get minimal required data
	pipeline.push(
		// Course lookup with college filter
		{
			$lookup: {
				from: 'courses',
				localField: '_course',
				foreignField: '_id',
				as: '_course',
				pipeline: [
					{ $match: { college: college._id } },
					{
						$project: {
							courseFeeType: 1,
							college: 1,
							project: 1,
							vertical: 1,
							docsRequired: 1 // Only for doc counts
						}
					}
				]
			}
		},
		{ $unwind: '$_course' },

		// Candidate lookup - only essential fields
		{
			$lookup: {
				from: 'candidateprofiles',
				localField: '_candidate',
				foreignField: '_id',
				as: '_candidate',
				pipeline: [
					{
						$project: {
							_id: 1,
							name: 1,
							email: 1,
							mobile: 1
						}
					}
				]
			}
		},
		{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

		// Status lookup - only title and milestone
		{
			$lookup: {
				from: 'status',
				localField: '_leadStatus',
				foreignField: '_id',
				as: '_leadStatus',
				pipeline: [
					{
						$project: {
							title: 1,
							milestone: 1,
							substatuses: 1
						}
					}
				]
			}
		},
		{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } }
	);

	// Apply additional filters
	const additionalFilters = {};

	if (filters.courseType) {
		additionalFilters['_course.courseFeeType'] = { $regex: new RegExp(filters.courseType, 'i') };
	}
	if (filters.projectsArray.length > 0) {
		additionalFilters['_course.project'] = { $in: filters.projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
	}
	if (filters.verticalsArray.length > 0) {
		additionalFilters['_course.vertical'] = { $in: filters.verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
	}
	if (filters.courseArray.length > 0) {
		additionalFilters['_course._id'] = { $in: filters.courseArray.map(id => new mongoose.Types.ObjectId(id)) };
	}

	// Name search
	if (filters.name && filters.name.trim()) {
		const searchTerm = filters.name.trim();
		const searchRegex = new RegExp(filters.name.trim(), 'i');
		additionalFilters.$or = [
			{ '_candidate.name': searchRegex },
			{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
			{ '_candidate.email': searchRegex }
		];
	}

	if (Object.keys(additionalFilters).length > 0) {
		pipeline.push({ $match: additionalFilters });
	}

	// Project only essential fields
	pipeline.push({
		$project: {
			_id: 1,
			_candidate: 1,
			_leadStatus: 1,
			_leadSubStatus: 1,
			'_course.docsRequired': 1,
			uploadedDocs: 1,
			createdAt: 1,
			updatedAt: 1
		}
	});

	// Sort and pagination
	pipeline.push(
		{ $sort: { updatedAt: -1 } },
		{ $skip: pagination.skip },
		{ $limit: pagination.limit }
	);

	return pipeline;
}

function calculateSimpleDocCounts(requiredDocs, uploadedDocs) {
	if (!requiredDocs.length) {
		return {
			totalRequired: 0,
			uploaded: 0,
			verified: 0,
			pending: 0,
			rejected: 0,
			notUploaded: 0,
			uploadPercentage: 0
		};
	}

	const uploadedDocsMap = new Map();
	uploadedDocs.forEach(doc => {
		if (doc.docsId) {
			uploadedDocsMap.set(doc.docsId.toString(), doc.status);
		}
	});

	let verified = 0;
	let rejected = 0;
	let pending = 0;
	let notUploaded = 0;

	requiredDocs.forEach(reqDoc => {
		const uploadStatus = uploadedDocsMap.get(reqDoc._id.toString());

		switch (uploadStatus) {
			case "Verified":
				verified++;
				break;
			case "Rejected":
				rejected++;
				break;
			case "Pending":
				pending++;
				break;
			default:
				notUploaded++;
				break;
		}
	});

	const totalRequired = requiredDocs.length;
	const uploaded = totalRequired - notUploaded;
	const uploadPercentage = totalRequired > 0 ? Math.round((uploaded / totalRequired) * 100) : 0;

	return {
		totalRequired,
		uploaded,
		verified,
		pending,
		rejected,
		notUploaded,
		uploadPercentage
	};
}

router.route("/downloadleads").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});


		// Extract filter parameters
		const {
			name, courseType, status, leadStatus,
			createdFromDate, createdToDate, modifiedFromDate, modifiedToDate,
			nextActionFromDate, nextActionToDate,
			projects, verticals, course, center, counselor, subStatuses
		} = req.query;

		// Parse multi-select filters
		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];

		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		// Get team members
		let teamMembers = [req.user._id];

		if (projectsArray.length > 0) {
			teamMembers = [];
		}

		if (verticalsArray.length > 0) {
			teamMembers = [];
		}

		if (courseArray.length > 0) {
			teamMembers = [];
		}

		if (centerArray.length > 0) {
			teamMembers = [];
		}
		if (name && name.trim() !== '') {
			teamMembers = [];
		}
		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}


		let teamMemberIds = [];
		if (teamMembers?.length > 0) {
			teamMemberIds = teamMembers.map(member =>
				typeof member === 'string' ? new mongoose.Types.ObjectId(member) : member
			);
		}


		// Build optimized pipeline with only essential fields
		const pipeline = downloadPipeline({
			teamMemberIds,
			college,
			filters: {
				name, courseType, status, leadStatus,
				createdFromDate, createdToDate,
				modifiedFromDate, modifiedToDate,
				nextActionFromDate, nextActionToDate,
				projectsArray, verticalsArray, courseArray, centerArray, subStatuses
			}
		});


		// Execute queries in parallel
		const results = await AppliedCourses.aggregate(pipeline)

		// console.log("results", results.length)

		// ✅ CSV fields define karo
		const fields = [
			{ label: "Candidate Name", value: "_candidate.name" },
			{ label: "Email", value: "_candidate.email" },
			{ label: "Mobile", value: "_candidate.mobile" },
			{ label: "Course", value: "_course.name" },
			{ label: "Center", value: "_center.name" },

			{ label: "Status", value: "_leadStatus.title" },
			{ label: "Sub Status", value: "leadSubStatusTitle" },
			{ label: "Counsellor", value: "counsellor.name" },
			{ label: "Registered By", value: "registeredByName" },
			{ label: "Created At", value: "createdAt" },
			{ label: "Updated At", value: "updatedAt" }
		];

		const opts = { fields };
		const parser = new Parser(opts);

		// ✅ CSV banayo
		const csv = parser.parse(results);

		// ✅ Response headers set karo
		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", "attachment; filename=leads.csv");

		res.status(200).end(csv);




	} catch (err) {
		console.error('API Error:', err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});

function downloadPipeline({ teamMemberIds, college, filters }) {
	const pipeline = [];
	let baseMatch = {};
	filters.leadStatus = String(filters.leadStatus);
	if (filters.leadStatus === '6894825c9fc1425f4d5e2fc5') {
		baseMatch = {
			kycStage: { $in: [true] },
		};
	}

	else {
		// Base match with essential filters
		baseMatch = {
			kycStage: { $ne: true },
			kyc: { $ne: true },
			admissionDone: { $ne: true },
		};
	}





	if (teamMemberIds && teamMemberIds.length > 0) {
		baseMatch.$or = [
			{ registeredBy: { $in: teamMemberIds } },
			{ counsellor: { $in: teamMemberIds } }
		];
	}


	// Add date filters
	if (filters.createdFromDate || filters.createdToDate) {
		baseMatch.createdAt = {};
		if (filters.createdFromDate) baseMatch.createdAt.$gte = new Date(filters.createdFromDate);
		if (filters.createdToDate) {
			const toDate = new Date(filters.createdToDate);
			// Add 1 day (24 hours) to the date
			toDate.setDate(toDate.getDate() + 1);
			// Set time to 18:30:00.000 (6:30 PM)
			// Use this modified 'toDate' as the upper limit in the filter
			baseMatch.createdAt.$lte = toDate;
		}
	}

	if (filters.modifiedFromDate || filters.modifiedToDate) {
		baseMatch.updatedAt = {};
		if (filters.modifiedFromDate) baseMatch.updatedAt.$gte = new Date(filters.modifiedFromDate);
		if (filters.modifiedToDate) {
			const toDate = new Date(filters.modifiedToDate);
			toDate.setDate(toDate.getDate() + 1);

			baseMatch.updatedAt.$lte = toDate;
		}
	}

	if (filters.nextActionFromDate || filters.nextActionToDate) {
		baseMatch.followupDate = {};
		if (filters.nextActionFromDate) baseMatch.followupDate.$gte = new Date(filters.nextActionFromDate);
		if (filters.nextActionToDate) {
			const toDate = new Date(filters.nextActionToDate);
			toDate.setDate(toDate.getDate() + 1);

			baseMatch.followupDate.$lte = toDate;
		}
	}


	if (filters.leadStatus && filters.leadStatus !== 'undefined' && filters.leadStatus !== '6894825c9fc1425f4d5e2fc5') {
		// Only set _leadStatus if it's a valid ObjectId string
		if (mongoose.Types.ObjectId.isValid(filters.leadStatus)) {
			baseMatch._leadStatus = new mongoose.Types.ObjectId(filters.leadStatus);
		} else {
			console.log('Invalid leadStatus:', filters.leadStatus);
		}
	}
	if (filters.subStatuses && filters.subStatuses !== 'undefined') {

		baseMatch._leadSubStatus = new mongoose.Types.ObjectId(filters.subStatuses);

	}

	pipeline.push({ $match: baseMatch });

	// Essential lookups only - get minimal required data
	pipeline.push(
		{
			$lookup: {
				from: 'centers',
				localField: '_center',
				foreignField: '_id',
				as: '_center',
				pipeline: [
					{ $match: { college: college._id } },
					{
						$project: {
							name: 1
						}
					}
				]
			}
		},
		{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },

		//counselor lookup
		{
			$lookup: {
				from: 'users',
				localField: 'counsellor',
				foreignField: '_id',
				as: 'counsellor',
				pipeline: [
					{
						$project: {
							name: 1
						}
					}
				]
			}
		},
		{ $unwind: '$counsellor' },

		//registeredBy lookup
		// Lookup from users
		{
			$lookup: {
				from: 'users',
				localField: 'registeredBy',
				foreignField: '_id',
				as: 'registeredUser',
				pipeline: [
					{ $project: { name: 1 } }
				]
			}
		},
		// Lookup from sources
		{
			$lookup: {
				from: 'sources',
				localField: 'registeredBy',
				foreignField: '_id',
				as: 'registeredSource',
				pipeline: [
					{ $project: { name: 1 } }
				]
			}
		},
		// Add a common field "registeredByName"
		{
			$addFields: {
				registeredByName: {
					$cond: {
						if: { $gt: [{ $size: "$registeredUser" }, 0] },
						then: { $arrayElemAt: ["$registeredUser.name", 0] },
						else: { $arrayElemAt: ["$registeredSource.name", 0] }
					}
				}
			}
		},
		// Optionally remove extra arrays
		{
			$project: {
				registeredUser: 0,
				registeredSource: 0
			}
		},


		// Course lookup with college filter
		{
			$lookup: {
				from: 'courses',
				localField: '_course',
				foreignField: '_id',
				as: '_course',
				pipeline: [
					{ $match: { college: college._id } },
					{
						$project: {
							name: 1
						}
					}
				]
			}
		},
		{ $unwind: '$_course' },

		// Candidate lookup - only essential fields
		{
			$lookup: {
				from: 'candidateprofiles',
				localField: '_candidate',
				foreignField: '_id',
				as: '_candidate',
				pipeline: [
					{
						$project: {
							_id: 1,
							name: 1,
							email: 1,
							mobile: 1
						}
					}
				]
			}
		},
		{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

		// Status lookup - only title and milestone
		{
			$lookup: {
				from: 'status',
				localField: '_leadStatus',
				foreignField: '_id',
				as: '_leadStatus',
				pipeline: [
					{
						$project: {
							title: 1,
							substatuses: 1
						}
					}
				]
			}
		},
		{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } }
	);

	// Apply additional filters
	const additionalFilters = {};

	if (filters.courseType) {
		additionalFilters['_course.courseFeeType'] = { $regex: new RegExp(filters.courseType, 'i') };
	}
	if (filters.projectsArray.length > 0) {
		additionalFilters['_course.project'] = { $in: filters.projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
	}
	if (filters.verticalsArray.length > 0) {
		additionalFilters['_course.vertical'] = { $in: filters.verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
	}
	if (filters.courseArray.length > 0) {
		additionalFilters['_course._id'] = { $in: filters.courseArray.map(id => new mongoose.Types.ObjectId(id)) };
	}

	// Name search
	if (filters.name && filters.name.trim()) {
		const searchTerm = filters.name.trim();
		const searchRegex = new RegExp(filters.name.trim(), 'i');
		additionalFilters.$or = [
			{ '_candidate.name': searchRegex },
			{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
			{ '_candidate.email': searchRegex }
		];
	}

	if (Object.keys(additionalFilters).length > 0) {
		pipeline.push({ $match: additionalFilters });
	}

	pipeline.push({
		$addFields: {
			leadSubStatusTitle: {
				$let: {
					vars: {
						matched: {
							$first: {
								$filter: {
									input: "$_leadStatus.substatuses",
									cond: { $eq: ["$$this._id", "$_leadSubStatus"] }
								}
							}
						}
					},
					in: "$$matched.title"
				}
			}
		}
	});


	pipeline.push({
		$addFields: {
			leadSubStatusTitle: {
				$let: {
					vars: {
						matched: {
							$first: {
								$filter: {
									input: "$_leadStatus.substatuses",
									cond: { $eq: ["$$this._id", "$_leadSubStatus"] }
								}
							}
						}
					},
					in: "$$matched.title"
				}
			}
		}
	});


	// Project only essential fields
	pipeline.push({
		$project: {
			_id: 1,
			_candidate: 1,
			createdAt: 1,
			updatedAt: 1,
			_course: 1,
			_leadStatus: 1,
			_center: 1,
			registeredBy: 1,
			counsellor: 1,
			leadSubStatusTitle: 1,
			registeredByName: 1,
		}
	});

	return pipeline;
}





router.route('/registrationCrmFilterCounts').get(isCollege, async (req, res) => {
	try {

		const user = req.user;
		let teamMembers = [user._id];
		const collegeId = user.college._id;
		const {
			name, courseType, status, leadStatus,
			createdFromDate, createdToDate, modifiedFromDate, modifiedToDate,
			nextActionFromDate, nextActionToDate,
			projects, verticals, course, center, counselor,
			subStatuses
		} = req.query;


		// Parse multi-select filters
		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];

		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		const appliedFilters = {
			name, courseType, status, leadStatus,
			createdFromDate, createdToDate,
			modifiedFromDate, modifiedToDate,
			nextActionFromDate, nextActionToDate,
			projectsArray, verticalsArray, courseArray, centerArray,
			subStatuses
		}


		if (appliedFilters.projectsArray?.length > 0) {

			teamMembers = [];

		}
		if (appliedFilters.verticalsArray?.length > 0) {
			teamMembers = [];
		}
		if (appliedFilters.courseArray?.length > 0) {
			teamMembers = [];
		}
		if (appliedFilters.centerArray?.length > 0) {
			teamMembers = [];
		}

		if (name && name.trim() !== '') {
			teamMembers = [];
		}

		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}

		let teamMemberIds = [];
		if (teamMembers?.length > 0) {
			teamMemberIds = teamMembers.map(member =>
				typeof member === 'string' ? new mongoose.Types.ObjectId(member) : member
			);
		}


		// Get all statuses once
		const allStatuses = await Status.find({}).select('_id title milestone').lean();

		// Build base pipeline
		let basePipeline = [
			{
				$match: {
					kycStage: { $ne: true },
					kyc: { $ne: true },
					admissionDone: { $ne: true },
				}
			},
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{ $match: { college: collegeId } },
						{ $project: { courseFeeType: 1, college: 1, project: 1, vertical: 1 } }
					]
				}
			},
			{ $unwind: '$_course' }
		];

		let movedInKYCPipeline = [
			{
				$match: {
					kycStage: { $in: [true] },
				}
			},
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{ $match: { college: collegeId } },
						{ $project: { courseFeeType: 1, college: 1, project: 1, vertical: 1 } }
					]
				}
			},
			{ $unwind: '$_course' }
		];

		// if (appliedFilters.leadStatus === '6894825c9fc1425f4d5e2fc5') {
		// 	basePipeline[0].$match.kycStage = { $in: [true] };
		// }

		if (teamMemberIds && teamMemberIds.length > 0) {
			basePipeline[0].$match.$or = [
				{ registeredBy: { $in: teamMemberIds } },
				{ counsellor: { $in: teamMemberIds } }
			];
			movedInKYCPipeline[0].$match.$or = [
				{ registeredBy: { $in: teamMemberIds } },
				{ counsellor: { $in: teamMemberIds } }
			];
		}

		// Add date filters to base pipeline
		const dateFilters = {};

		if (appliedFilters.createdFromDate || appliedFilters.createdToDate) {
			dateFilters.createdAt = {};
			if (appliedFilters.createdFromDate) {
				dateFilters.createdAt.$gte = new Date(appliedFilters.createdFromDate);
			}
			if (appliedFilters.createdToDate) {
				const toDate = new Date(appliedFilters.createdToDate);
				toDate.setDate(toDate.getDate() + 1);
				// Set time to 18:30:00.000 (6:30 PM)
				// Use this modified 'toDate' as the upper limit in the filter
				dateFilters.createdAt.$lte = toDate;
			}
		}

		if (appliedFilters.modifiedFromDate || appliedFilters.modifiedToDate) {
			dateFilters.updatedAt = {};
			if (appliedFilters.modifiedFromDate) {
				dateFilters.updatedAt.$gte = new Date(appliedFilters.modifiedFromDate);
			}
			if (appliedFilters.modifiedToDate) {
				const toDate = new Date(appliedFilters.modifiedToDate);
				toDate.setDate(toDate.getDate() + 1);

				dateFilters.updatedAt.$lte = toDate;
			}
		}

		if (appliedFilters.nextActionFromDate || appliedFilters.nextActionToDate) {
			dateFilters.followupDate = {};
			if (appliedFilters.nextActionFromDate) {
				dateFilters.followupDate.$gte = new Date(appliedFilters.nextActionFromDate);
			}
			if (appliedFilters.nextActionToDate) {
				const toDate = new Date(appliedFilters.nextActionToDate);
				toDate.setDate(toDate.getDate() + 1);
				dateFilters.followupDate.$lte = toDate;
			}
		}

		if (appliedFilters.subStatuses && appliedFilters.subStatuses !== 'undefined') {
			basePipeline[0].$match._leadSubStatus = new mongoose.Types.ObjectId(appliedFilters.subStatuses);
			movedInKYCPipeline[0].$match._leadSubStatus = new mongoose.Types.ObjectId(appliedFilters.subStatuses);
		}

		if (Object.keys(dateFilters).length > 0) {
			basePipeline[0].$match = { ...basePipeline[0].$match, ...dateFilters };
			movedInKYCPipeline[0].$match = { ...movedInKYCPipeline[0].$match, ...dateFilters };
		}

		// Apply other filters if needed
		if (appliedFilters.courseType || appliedFilters.projectsArray?.length > 0 ||
			appliedFilters.verticalsArray?.length > 0 || appliedFilters.courseArray?.length > 0) {

			const filterMatch = {};
			if (appliedFilters.courseType) {
				filterMatch['_course.courseFeeType'] = { $regex: new RegExp(appliedFilters.courseType, 'i') };
			}
			if (appliedFilters.projectsArray?.length > 0) {
				filterMatch['_course.project'] = { $in: appliedFilters.projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
			}
			if (appliedFilters.verticalsArray?.length > 0) {
				filterMatch['_course.vertical'] = { $in: appliedFilters.verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
			}
			if (appliedFilters.courseArray?.length > 0) {
				filterMatch['_course._id'] = { $in: appliedFilters.courseArray.map(id => new mongoose.Types.ObjectId(id)) };
			}

			basePipeline.push({ $match: filterMatch });
			movedInKYCPipeline.push({ $match: filterMatch });
		}

		// Add candidate lookup for name search
		if (appliedFilters.name && appliedFilters.name.trim()) {
			basePipeline.push(
				{
					$lookup: {
						from: 'candidateprofiles',
						localField: '_candidate',
						foreignField: '_id',
						as: '_candidate',
						pipeline: [{ $project: { name: 1, email: 1, mobile: 1 } }]
					}
				},
				{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } }
			);
			movedInKYCPipeline.push(
				{
					$lookup: {
						from: 'candidateprofiles',
						localField: '_candidate',
						foreignField: '_id',
						as: '_candidate',
						pipeline: [{ $project: { name: 1, email: 1, mobile: 1 } }]
					}
				},
				{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } }
			);

			const searchTerm = appliedFilters.name.trim();
			const searchRegex = new RegExp(appliedFilters.name.trim(), 'i');
			basePipeline.push({
				$match: {
					$or: [
						{ '_candidate.name': searchRegex },
						{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
						{ '_candidate.email': searchRegex }
					]
				}
			});
			movedInKYCPipeline.push({
				$match: {
					$or: [
						{ '_candidate.name': searchRegex },
						{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
						{ '_candidate.email': searchRegex }
					]
				}
			});
		}







		// Single aggregation to get all counts
		const [allCount, statusCounts, movedInKYCCount] = await Promise.all([
			AppliedCourses.aggregate([...basePipeline, { $count: "total" }]),
			AppliedCourses.aggregate([
				...basePipeline,
				{
					$group: {
						_id: "$_leadStatus",
						count: { $sum: 1 }
					}
				}
			]),
			AppliedCourses.aggregate([...movedInKYCPipeline, { $count: "total" }])
		]);

		// Process results
		const counts = { all: allCount[0]?.total || 0 };


		allStatuses.forEach(status => {
			if (status._id.toString() === '6894825c9fc1425f4d5e2fc5') {
				counts[status._id.toString()] = {
					_id: status._id,
					name: status.title,
					milestone: status.milestone,
					count: movedInKYCCount[0]?.total || 0
				};
			} else {
				counts[status._id.toString()] = {
					_id: status._id,
					name: status.title,
					milestone: status.milestone,
					count: 0
				};
			}
		});

		statusCounts.forEach(({ _id, count }) => {
			if (_id) {
				const statusKey = _id.toString();
				if (counts[statusKey]) {
					counts[statusKey].count = count;
				}
			} else {
				counts['null'] = {
					_id: null,
					name: 'No Status',
					milestone: null,
					count
				};
			}
		});


		res.status(200).json({ success: true, crmFilterCount: counts });

	} catch (error) {
		console.error('Error calculating filter counts:', error);
		return { all: 0 };
	}
})

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
		if (extension !== "ods" && extension !== "xlsx" && extension !== "xls" && extension !== "xl") {
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
		await readXlsxFile(
			path.join(__dirname, "../../../public/" + filename)
		).then((rows) => {

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
						errorMessages.push(`User with mobile ${mobile} already exists for row ${index + 1}.`)
						continue;
					}

					let isExistCandidate = await Candidate.findOne({
						mobile
					});

					if (isExistCandidate) {
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

				await CandidateImport.create(imports);
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


		const newCenter = new Center({
			name,
			address: location,
			status: status,
			project: projectArray,
			createdBy: user ? user._id : null,
			college: collegeId,
		});

		const savedCenter = await newCenter.save();

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
		const collegeId = req.user.college._id;

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
		let lastFollowup = await B2cFollowup.findOne({ appliedCourseId: doc._id, status: 'planned' });
		if (lastFollowup) {
			lastFollowup.status = 'done'
		}

		// If followup date and time is set or updated, log the change and update the followup
		if (followup && lastFollowup?.followupDate?.toISOString() !== new Date(followup).toISOString()) {
			actionParts.push(`Followup updated to ${new Date(followup).toLocaleString()}`);
			// Push a new followup object
			const newFollowup = new B2cFollowup({
				appliedCourseId: doc._id,
				followupDate: new Date(followup),
				remarks: remarks,
				status: 'planned',
				createdBy: userId,
				collegeId: collegeId
			});
			await newFollowup.save();
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
		// Add a log entry for the update
		// Add a log entry for the update with proper validation
		const newLogEntry = {
			user: userId,
			action: actionParts.join('; '), // Combine all actions in one log message
			remarks: remarks || '', // Optional remarks in the log
			timestamp: new Date() // Add timestamp if your schema supports it
		};



		doc.logs.push(newLogEntry);

		// Save the updated document
		await doc.save();


		const newStatusLogs = await statusLogHelper(id, {
			_statusId: _leadStatus,
			_subStatusId: _leadSubStatus,
		});



		return res.json({ success: true, data: doc });
	} catch (error) {
		console.error('Error updating status and followup:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

router.put('/lead/bulk_status_change', [isCollege], async (req, res) => {
	try {
		const { selectedProfiles, _leadStatus, _leadSubStatus, remarks } = req.body;
		if (!selectedProfiles || !_leadStatus || !_leadSubStatus) {
			let missingFields = [];

			if (!selectedProfiles) missingFields.push('selectedProfiles');
			if (!_leadStatus) missingFields.push('_leadStatus');
			if (!_leadSubStatus) missingFields.push('_leadSubStatus');

			return res.status(500).json({
				success: false,
				message: `Missing required fields: ${missingFields.join(', ')}`
			});
		}
		const userId = req.user._id;

		// Fetch the new status document (including sub-statuses) only once
		const newStatusDoc = await Status.findById(_leadStatus).lean();
		const newStatusTitle = newStatusDoc ? newStatusDoc.title : 'Unknown';
		const newSubStatusTitle = newStatusDoc?.substatuses?.find(s => s._id.toString() === _leadSubStatus)?.title || 'Unknown';

		// Process profiles in parallel using Promise.all
		const updatePromises = selectedProfiles.map(async (id) => {
			// Find the AppliedCourse document by ID
			const doc = await AppliedCourses.findById(id);
			if (!doc) {
				throw new Error(`AppliedCourse with ID ${id} not found`);
			}

			let actionParts = [];

			// Fetch the old status document (including sub-statuses)
			const oldStatusDoc = await Status.findById(doc._leadStatus).lean();
			const oldStatusTitle = oldStatusDoc ? oldStatusDoc.title : 'Unknown';
			const oldSubStatusTitle = oldStatusDoc?.substatuses?.find(s => s._id.toString() === doc._leadSubStatus?.toString())?.title || 'Unknown';

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
					lastFollowup.status = 'Done';
				}
			}

			// Update remarks if provided
			if (remarks && doc.remarks !== remarks) {
				actionParts.push(`Remarks updated`);
				doc.remarks = remarks;
			}

			// If no changes were made
			if (actionParts.length === 0) {
				actionParts.push('No changes made to status or followup');
			}

			// Add a log entry for the update
			const newLogEntry = {
				user: userId,
				action: actionParts.join('; '),
				remarks: remarks || '',
				timestamp: new Date()
			};


			// Add log entry to the document
			doc.logs.push(newLogEntry);

			// Save the updated document
			const newDocDetails = await doc.save();
		});

		// Wait for all updates to complete
		await Promise.all(updatePromises);

		return res.json({ success: true, message: 'Status updated successfully' });

	} catch (error) {
		console.error('Error updating status and followup:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});



///courses

router.get('/all_courses', async (req, res) => {
	try {
		const courses = await Courses.find({ status: true })
			.populate('trainers', 'name email mobile')
			.sort({ createdAt: -1 });

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
		const courses = await Courses.find(filter)
			.populate('trainers', 'name email mobile')
			.populate('createdBy', 'name email')
			.sort({ createdAt: -1 });
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

		const batches = await Batch.find(filter)
			.populate('trainers', 'name email mobile')
			.populate('createdBy', 'name email')
			.sort({ createdAt: -1 });  // Sorting by createdAt

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
		const collegeId = user.college._id;
		const { id } = req.params;
		const updateData = req.body;

		const appliedCourse = await AppliedCourses.findById(id).populate('_course');
		if (!appliedCourse) {
			return res.status(404).json({ success: false, message: "Applied course not found" });
		}


		// Update fields
		Object.keys(updateData).forEach(key => {
			appliedCourse[key] = updateData[key];
		});

		if (updateData.dropout) {
			appliedCourse.dropoutBy = user._id;
			appliedCourse.dropoutDate = new Date();
		}


		if (typeof updateData.kycStage !== 'undefined' && updateData.kycStage === true) {
			appliedCourse.logs.push({
				user: user._id,
				timestamp: new Date(),
				action: 'Moved to KYC',
				remarks: 'Profile moved to KYC by College'
			});


			const newStatusLogs = await statusLogHelper(id, {
				kycStage: true
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


			const newStatusLogs = await statusLogHelper(id, {
				admissionStatus: true
			});



		}

		await appliedCourse.save();
		return res.json({ success: true, message: "Profile updated successfully" });
	} catch (err) {
		console.error("Error updating profile:", err);
		return res.status(500).json({ success: false, message: err.message });
	}
});

// missed followup api
router.post('/mark_complete_followup/:id', isCollege, async (req, res) => {
	try {
		const user = req.user;
		const { id } = req.params;
		const b2cFollowup = await B2cFollowup.findOneAndUpdate({
			_id: id,
			status: 'pending'
		},
			{ $set: { status: 'done', updatedBy: user, statusUpdatedAt: new Date() } }, { new: true }
		).sort({ createdAt: -1 });

		// console.log("b2cFollowup", b2cFollowup)

		if (!b2cFollowup) {
			return res.status(404).json({ success: false, message: 'Followup not found' });
		}

		const newLogEntry = {
			user: user._id,
			action: 'Followup Marked Complete',
			remarks: 'Followup completed successfully',
			timestamp: new Date()
		};

		const appliedcourse = await AppliedCourses.findOneAndUpdate({
			_id: b2cFollowup.appliedCourseId
		},
			{ $push: { logs: newLogEntry } }, { new: true }
		);
		// console.log("appliedcourse", appliedcourse)

		// const newStatusLogs = await statusLogHelper(id, {
		// 	followupCompleted: true
		// });

		return res.json({
			success: true,
			message: "Follow-up marked complete successfully",
			data: {
				b2cFollowup: b2cFollowup
			}
		});

	} catch (err) {
		console.error("Error updating follow-up:", err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: err.message
		});
	}
});

router.get('/followupcounts', isCollege, async (req, res) => {
	try {

		const user = req.user;

		let { fromDate, toDate, projects, verticals, course, center, counselor } = req.query;

		if (fromDate && fromDate !== 'null') {
			fromDate = new Date(fromDate);
			if (isNaN(fromDate.getTime())) {
				console.log('Invalid fromDate format')
				return res.status(400).json({ error: "Invalid fromDate format" });
			}
		} else {
			fromDate = new Date(new Date().setHours(0, 0, 0, 0));
		}
		if (toDate && toDate !== 'null') {
			toDate = new Date(toDate);
			if (isNaN(toDate.getTime())) {
				console.log('Invalid toDate format')
				return res.status(400).json({ error: "Invalid toDate format" });
			}
		} else {
			toDate = new Date(new Date().setHours(23, 59, 59, 999));
		}


		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];


		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}


		let aggregate = []

		let baseMatch = {}

		if (counselorArray.length > 0) {
			baseMatch.createdBy = { $in: counselorArray.map(id => new mongoose.Types.ObjectId(id)) };
		} else {
			baseMatch.createdBy = user._id;
		}

		let group = [{
			$group: {
				_id: "$status",
				count: { $sum: 1 }
			}
		},
		{
			$project: {
				k: "$_id",
				v: "$count",
				_id: 0
			}
		},
		{
			$group: {
				_id: null,
				counts: { $push: { k: "$k", v: "$v" } }
			}
		},
		{
			$replaceRoot: {
				newRoot: { $arrayToObject: "$counts" }
			}
		}]





		aggregate.push(
			{
				$match: {
					followupDate: { $gte: fromDate, $lte: toDate },
					...baseMatch
				}
			},
			{
				$lookup: {
					from: 'appliedcourses',
					localField: 'appliedCourseId',
					foreignField: '_id',
					as: "appliedCourseId"
				}
			},
			{
				$unwind: {
					path: '$appliedCourseId',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: 'appliedCourseId._candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},
			{
				$unwind: {
					path: '$candidate',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'courses',
					localField: 'appliedCourseId._course',
					foreignField: '_id',
					as: 'courseData'
				}
			},
			{
				$unwind: {
					path: '$courseData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'verticals',
					localField: 'courseData.vertical',
					foreignField: '_id',
					as: 'verticalData'
				}
			},
			{
				$unwind: {
					path: '$verticalData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'projects',
					localField: 'courseData.project',
					foreignField: '_id',
					as: 'projectData'
				}
			},
			{
				$unwind: {
					path: '$projectData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'centers',
					localField: 'appliedCourseId._center',
					foreignField: '_id',
					as: 'centerData'
				}
			},
			{
				$unwind: {
					path: '$centerData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'appliedCourseId._counsellor',
					foreignField: '_id',
					as: 'counselorData'
				}
			},
			{
				$unwind: {
					path: '$counselorData',
					preserveNullAndEmptyArrays: true
				}
			},

			{
				$group: {
					_id: '$_id',
					appliedCourseId: { $first: '$appliedCourseId._id' },
					followupDate: { $first: '$followupDate' },
					remarks: { $first: '$remarks' },
					_course: { $first: '$courseData' },
					center: { $first: '$centerData._id' },
					status: { $first: '$status' },
				}
			}

		)

		let additionalMatches = {}

		// Sector filter (multi-select - using projects array)
		if (projectsArray.length > 0) {
			additionalMatches['_course.project'] = { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Verticals filter (multi-select)
		if (verticalsArray.length > 0) {
			additionalMatches['_course.vertical'] = { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Course filter (multi-select)
		if (courseArray.length > 0) {
			additionalMatches['_course._id'] = { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Center filter (multi-select)
		if (centerArray.length > 0) {
			additionalMatches['center'] = { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (Object.keys(additionalMatches).length > 0) {
			aggregate.push({ $match: additionalMatches });
		}







		const followupCounts = await B2cFollowup.aggregate(aggregate
		);

		let doneCount = 0
		let plannedCount = 0
		let missedCount = 0

		followupCounts.forEach(item => {
			if (item.status == 'done') {
				doneCount++
			}
			if (item.status == 'planned') {
				plannedCount++
			}
			if (item.status == 'missed') {
				missedCount++
			}
		})

		let count = {
			'done': doneCount,
			'planned': plannedCount,
			'missed': missedCount
		}


		// console.log("followupCounts", followupCounts[0])
		return res.json({ success: true, data: count });


	}
	catch (err) {
		console.error("Error fetching followup counts:", err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: err.message
		});
	}
});



//KYC Leads

// router.route("/kycCandidates").get(isCollege, async (req, res) => {
// 	try {
// 		const user = req.user;
// 		let teamMembers = await getAllTeamMembers(user._id);

// 		const college = await College.findOne({
// 			'_concernPerson._id': user._id
// 		});

// 		const page = parseInt(req.query.page) || 1;
// 		const limit = parseInt(req.query.limit) || 50;
// 		const skip = (page - 1) * limit;

// 		// Extract ALL filter parameters from query (same as appliedCandidates)
// 		const {
// 			name,
// 			courseType,
// 			status,
// 			kyc,
// 			leadStatus,
// 			sector,
// 			createdFromDate,
// 			createdToDate,
// 			modifiedFromDate,
// 			modifiedToDate,
// 			nextActionFromDate,
// 			nextActionToDate,
// 			// Multi-select filters (these come as JSON strings)
// 			projects,
// 			verticals,
// 			course,
// 			center,
// 			counselor
// 		} = req.query;

// 		// Parse multi-select filter values
// 		let projectsArray = [];
// 		let verticalsArray = [];
// 		let courseArray = [];
// 		let centerArray = [];
// 		let counselorArray = [];

// 		try {
// 			if (projects) projectsArray = JSON.parse(projects);
// 			if (verticals) verticalsArray = JSON.parse(verticals);
// 			if (course) courseArray = JSON.parse(course);
// 			if (center) centerArray = JSON.parse(center);
// 			if (counselor) counselorArray = JSON.parse(counselor);
// 		} catch (parseError) {
// 			console.error('Error parsing filter arrays:', parseError);
// 		}

// 		if (counselorArray.length > 0) {
// 			teamMembers = counselorArray;
// 		}

// 		let allFilteredResults = [];

// 		for (let member of teamMembers) {
// 			// Build aggregation pipeline
// 			let aggregationPipeline = [];

// 			if (typeof member === 'string') {
// 				member = new mongoose.Types.ObjectId(member);
// 			}

// 			// Base match stage - Modified to handle KYC logic differently
// 			let baseMatchStage = {
// 				kycStage: { $in: [true] },
// 				$or: [
// 					{ registeredBy: member },
// 					{
// 						$expr: {
// 							$eq: [
// 								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
// 								member
// 							]
// 						}
// 					}
// 				]
// 			};

// 			// Add date filters to base match
// 			if (createdFromDate || createdToDate) {
// 				baseMatchStage.createdAt = {};
// 				if (createdFromDate) {
// 					baseMatchStage.createdAt.$gte = new Date(createdFromDate);
// 				}
// 				if (createdToDate) {
// 					const toDate = new Date(createdToDate);
// 					toDate.setHours(23, 59, 59, 999);
// 					baseMatchStage.createdAt.$lte = toDate;
// 				}
// 			}

// 			if (modifiedFromDate || modifiedToDate) {
// 				baseMatchStage.updatedAt = {};
// 				if (modifiedFromDate) {
// 					baseMatchStage.updatedAt.$gte = new Date(modifiedFromDate);
// 				}
// 				if (modifiedToDate) {
// 					const toDate = new Date(modifiedToDate);
// 					toDate.setHours(23, 59, 59, 999);
// 					baseMatchStage.updatedAt.$lte = toDate;
// 				}
// 			}

// 			if (nextActionFromDate || nextActionToDate) {
// 				baseMatchStage.followupDate = {};
// 				if (nextActionFromDate) {
// 					baseMatchStage.followupDate.$gte = new Date(nextActionFromDate);
// 				}
// 				if (nextActionToDate) {
// 					const toDate = new Date(nextActionToDate);
// 					toDate.setHours(23, 59, 59, 999);
// 					baseMatchStage.followupDate.$lte = toDate;
// 				}
// 			}


// 			if (leadStatus) {
// 				baseMatchStage._leadStatus = new mongoose.Types.ObjectId(leadStatus);
// 			}

// 			// Add base match stage
// 			aggregationPipeline.push({ $match: baseMatchStage });

// 			// Lookup stages for all related collections
// 			aggregationPipeline.push(
// 				// Course lookup with sectors, vertical, project population
// 				{
// 					$lookup: {
// 						from: 'courses',
// 						localField: '_course',
// 						foreignField: '_id',
// 						as: '_course',
// 						pipeline: [
// 							{
// 								$lookup: {
// 									from: 'sectors',
// 									localField: 'sectors',
// 									foreignField: '_id',
// 									as: 'sectors'
// 								}
// 							},
// 							{
// 								$lookup: {
// 									from: 'verticals',
// 									localField: 'vertical',
// 									foreignField: '_id',
// 									as: 'vertical'
// 								}
// 							},
// 							{
// 								$lookup: {
// 									from: 'projects',
// 									localField: 'project',
// 									foreignField: '_id',
// 									as: 'project'
// 								}
// 							}
// 						]
// 					}
// 				},
// 				{ $unwind: '$_course' },

// 				// Lead Status lookup
// 				{
// 					$lookup: {
// 						from: 'status',
// 						localField: '_leadStatus',
// 						foreignField: '_id',
// 						as: '_leadStatus'
// 					}
// 				},
// 				{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } },

// 				// Center lookup
// 				{
// 					$lookup: {
// 						from: 'centers',
// 						localField: '_center',
// 						foreignField: '_id',
// 						as: '_center'
// 					}
// 				},
// 				{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },

// 				// Registered By lookup
// 				{
// 					$lookup: {
// 						from: 'users',
// 						localField: 'registeredBy',
// 						foreignField: '_id',
// 						as: 'registeredBy'
// 					}
// 				},
// 				{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },

// 				// Candidate lookup with applied courses
// 				{
// 					$lookup: {
// 						from: 'candidateprofiles',
// 						localField: '_candidate',
// 						foreignField: '_id',
// 						as: '_candidate',
// 						pipeline: [
// 							{
// 								$lookup: {
// 									from: 'appliedcourses',
// 									localField: '_appliedCourses',
// 									foreignField: '_id',
// 									as: '_appliedCourses',
// 									pipeline: [
// 										{
// 											$lookup: {
// 												from: 'courses',
// 												localField: '_course',
// 												foreignField: '_id',
// 												as: '_course'
// 											}
// 										},
// 										{
// 											$lookup: {
// 												from: 'users',
// 												localField: 'registeredBy',
// 												foreignField: '_id',
// 												as: 'registeredBy'
// 											}
// 										},
// 										{
// 											$lookup: {
// 												from: 'centers',
// 												localField: '_center',
// 												foreignField: '_id',
// 												as: '_center'
// 											}
// 										},
// 										{
// 											$lookup: {
// 												from: 'status',
// 												localField: '_leadStatus',
// 												foreignField: '_id',
// 												as: '_leadStatus'
// 											}
// 										}
// 									]
// 								}
// 							}
// 						]
// 					}
// 				},
// 				{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

// 				// Logs lookup
// 				{
// 					$lookup: {
// 						from: 'users',
// 						localField: 'logs.user',
// 						foreignField: '_id',
// 						as: 'logUsers'
// 					}
// 				},
// 				{
// 					$addFields: {
// 						logs: {
// 							$map: {
// 								input: "$logs",
// 								as: "log",
// 								in: {
// 									$mergeObjects: [
// 										"$$log",
// 										{
// 											user: {
// 												$arrayElemAt: [
// 													{
// 														$filter: {
// 															input: "$logUsers",
// 															cond: { $eq: ["$$this._id", "$$log.user"] }
// 														}
// 													},
// 													0
// 												]
// 											}
// 										}
// 									]
// 								}
// 							}
// 						}
// 					}
// 				}
// 			);

// 			// Filter by college
// 			aggregationPipeline.push({
// 				$match: {
// 					'_course.college': college._id
// 				}
// 			});

// 			// NEW: Add KYC filter logic based on docs required
// 			if (kyc !== undefined && kyc !== '') {
// 				let kycMatchStage = {};

// 				if (kyc === 'true' || kyc === true) {
// 					// For kyc=true: Include all candidates (with or without required docs)
// 					kycMatchStage = {
// 						$or: [
// 							// Candidates with kyc=true
// 							{ kyc: true },
// 							// Candidates whose course has no required docs (regardless of kyc status)
// 							{
// 								$or: [
// 									{ '_course.docsRequired': { $exists: false } },
// 									{ '_course.docsRequired': { $size: 0 } },
// 									{ '_course.docsRequired': null }
// 								]
// 							}
// 						]
// 					};
// 				} else if (kyc === 'false' || kyc === false) {
// 					// For kyc=false: Only include candidates whose course has required docs and kyc=false
// 					kycMatchStage = {
// 						kyc: false,
// 						'_course.docsRequired': {
// 							$exists: true,
// 							$ne: null,
// 							$not: { $size: 0 }
// 						}
// 					};
// 				}

// 				aggregationPipeline.push({ $match: kycMatchStage });
// 			} else {
// 				// Default behavior when no kyc filter is specified
// 				aggregationPipeline.push({
// 					$match: {
// 						kyc: { $in: [false] }
// 					}
// 				});
// 			}

// 			// Apply additional filters based on populated data
// 			let additionalMatches = {};

// 			// Course type filter
// 			if (courseType) {
// 				additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(courseType, 'i') };
// 			}

// 			// Sector filter (multi-select - using projects array)
// 			if (projectsArray.length > 0) {
// 				additionalMatches['_course.sectors._id'] = { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
// 			}

// 			// Verticals filter (multi-select)
// 			if (verticalsArray.length > 0) {
// 				additionalMatches['_course.vertical._id'] = { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
// 			}

// 			// Course filter (multi-select)
// 			if (courseArray.length > 0) {
// 				additionalMatches['_course._id'] = { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) };
// 			}

// 			// Center filter (multi-select)
// 			if (centerArray.length > 0) {
// 				additionalMatches['_center._id'] = { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) };
// 			}

// 			// Name search filter
// 			if (name && name.trim()) {
// 				const searchTerm = name.trim();
// 				const searchRegex = new RegExp(searchTerm, 'i');

// 				additionalMatches.$or = additionalMatches.$or ? [
// 					...additionalMatches.$or,
// 					{ '_candidate.name': searchRegex },
// 					{ '_candidate.mobile': parseInt(searchTerm) || searchTerm }, // Try both number and string
// 					{ '_candidate.email': searchRegex }
// 				] : [
// 					{ '_candidate.name': searchRegex },
// 					{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
// 					{ '_candidate.email': searchRegex }
// 				];
// 			}

// 			// Add additional match stage if any filters are applied
// 			if (Object.keys(additionalMatches).length > 0) {
// 				aggregationPipeline.push({ $match: additionalMatches });
// 			}

// 			// Sort by creation date
// 			aggregationPipeline.push({
// 				$sort: { updatedAt: -1 }
// 			});

// 			// Execute aggregation
// 			const response = await AppliedCourses.aggregate(aggregationPipeline);

// 			// Add unique results to the main array
// 			response.forEach(doc => {
// 				if (!allFilteredResults.some(existingDoc => existingDoc._id.toString() === doc._id.toString())) {
// 					allFilteredResults.push(doc);
// 				}
// 			});
// 		}

// 		// Process results for document counts and other formatting
// 		const results = allFilteredResults.map(doc => {
// 			let selectedSubstatus = null;

// 			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
// 				selectedSubstatus = doc._leadStatus.substatuses.find(
// 					sub => sub._id.toString() === doc._leadSubStatus.toString()
// 				);
// 			}

// 			// Process sectors to show first sector name
// 			const firstSectorName = doc._course?.sectors?.[0]?.name || 'N/A';
// 			if (doc._course) {
// 				doc._course.sectors = firstSectorName;
// 			}

// 			const requiredDocs = doc._course?.docsRequired || [];
// 			const uploadedDocs = doc.uploadedDocs || [];

// 			// Map uploaded docs by docsId for quick lookup
// 			const uploadedDocsMap = {};
// 			uploadedDocs.forEach(d => {
// 				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
// 			});

// 			let combinedDocs = [];

// 			if (requiredDocs) {
// 				// Create a merged array with both required docs and uploaded docs info
// 				combinedDocs = requiredDocs.map(reqDoc => {
// 					// Convert Mongoose document to plain object
// 					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

// 					const isDocApproved = uploadedDocs.some(uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString() && uploadDoc.status === "Verified");

// 					// Find matching uploaded docs for this required doc
// 					const matchingUploads = uploadedDocs.filter(
// 						uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
// 					)

// 					return {
// 						_id: docObj._id,
// 						Name: docObj.Name || 'Document',
// 						mandatory: docObj.mandatory,
// 						status: isDocApproved,
// 						description: docObj.description || '',
// 						uploads: matchingUploads || []
// 					};
// 				});
// 			}

// 			// Prepare combined docs array for legacy compatibility
// 			const allDocs = requiredDocs.map(reqDoc => {
// 				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
// 				if (uploadedDoc) {
// 					return {
// 						...uploadedDoc,
// 						Name: reqDoc.Name,
// 						mandatory: reqDoc.mandatory,
// 						_id: reqDoc._id
// 					};
// 				} else {
// 					return {
// 						docsId: reqDoc._id,
// 						Name: reqDoc.Name,
// 						mandatory: reqDoc.mandatory,
// 						status: "Not Uploaded",
// 						fileUrl: null,
// 						reason: null,
// 						verifiedBy: null,
// 						verifiedDate: null,
// 						uploadedAt: null
// 					};
// 				}
// 			});

// 			// Count calculations
// 			let verifiedCount = 0;
// 			let RejectedCount = 0;
// 			let pendingVerificationCount = 0;
// 			let notUploadedCount = 0;
// 			let mandatoryCount = 0;

// 			allDocs.forEach(doc => {
// 				if (doc.status === "Verified") verifiedCount++;
// 				else if (doc.mandatory) mandatoryCount++;
// 				else if (doc.status === "Rejected") RejectedCount++;
// 				else if (doc.status === "Pending") pendingVerificationCount++;
// 				else if (doc.status === "Not Uploaded") notUploadedCount++;
// 			});

// 			const totalRequired = allDocs.length;
// 			const uploadedCount = allDocs.filter(doc => doc.status !== "Not Uploaded").length;
// 			const uploadPercentage = totalRequired > 0
// 				? Math.round((uploadedCount / totalRequired) * 100)
// 				: 0;

// 			return {
// 				...doc,
// 				selectedSubstatus,
// 				uploadedDocs: combinedDocs,
// 				docCounts: {
// 					totalRequired,
// 					mandatoryCount,
// 					RejectedCount,
// 					uploadedCount,
// 					verifiedCount,
// 					pendingVerificationCount,
// 					notUploadedCount,
// 					uploadPercentage
// 				}
// 			};
// 		});

// 		// Calculate KYC specific counts
// 		const totalCount = results.length;
// 		const pendingKycCount = results.filter(doc => doc.kycStage === true && doc.kyc === false).length;
// 		const doneKycCount = results.filter(doc => doc.kyc === true).length;

// 		// Calculate CRM filter counts (if needed for additional status filters)
// 		const crmFilterCounts = await calculateKycFilterCounts(teamMembers, college._id, {
// 			name,
// 			courseType,
// 			sector,
// 			createdFromDate,
// 			createdToDate,
// 			modifiedFromDate,
// 			modifiedToDate,
// 			nextActionFromDate,
// 			nextActionToDate,
// 			projectsArray,
// 			verticalsArray,
// 			courseArray,
// 			centerArray,
// 			counselorArray
// 		});

// 		// Apply pagination
// 		const paginatedResult = results.slice(skip, skip + limit);

// 		res.status(200).json({
// 			success: true,
// 			count: paginatedResult.length,
// 			page,
// 			limit,
// 			pendingKycCount,
// 			doneKycCount,
// 			totalCount,
// 			totalPages: Math.ceil(totalCount / limit),
// 			data: paginatedResult,
// 			crmFilterCounts
// 		});

// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({
// 			success: false,
// 			message: "Server Error"
// 		});
// 	}
// });

router.route("/kycCandidates").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		let teamMembers = [user._id];


		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const skip = (page - 1) * limit;

		// Extract ALL filter parameters from query (same as appliedCandidates)
		const {
			name,
			courseType,
			status,
			kyc,
			leadStatus,
			sector,
			createdFromDate,
			createdToDate,
			modifiedFromDate,
			modifiedToDate,
			nextActionFromDate,
			nextActionToDate,
			// Multi-select filters (these come as JSON strings)
			projects,
			verticals,
			course,
			center,
			counselor
		} = req.query;

		// Parse multi-select filter values
		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];

		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		if (projectsArray.length > 0) {

			teamMembers = [];
		}

		if (verticalsArray.length > 0) {
			teamMembers = [];
		}

		if (courseArray.length > 0) {
			teamMembers = [];
		}

		if (centerArray.length > 0) {
			teamMembers = [];
		}



		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}

		if (name && name.trim() !== '') {

			teamMembers = [];
		}

		// Build aggregation pipeline
		let aggregationPipeline = [];
		let teamMemberIds = [];


		if (teamMembers?.length > 0) {
			teamMemberIds = teamMembers.map(member =>
				typeof member === 'string' ? new mongoose.Types.ObjectId(member) : member
			);
		}


		// Base match stage - Modified to handle KYC logic differently
		let baseMatchStage = {
			kycStage: { $in: [true] },

		};

		if (teamMemberIds && teamMemberIds.length > 0) {

			baseMatchStage.$or = [
				{ registeredBy: { $in: teamMemberIds } },
				{ counsellor: { $in: teamMemberIds } }
			];
		}

		// Add date filters to base match
		if (createdFromDate || createdToDate) {
			baseMatchStage.createdAt = {};
			if (createdFromDate) {
				baseMatchStage.createdAt.$gte = new Date(createdFromDate);
			}
			if (createdToDate) {
				const toDate = new Date(createdToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.createdAt.$lte = toDate;
			}
		}
		if (modifiedFromDate || modifiedToDate) {
			baseMatchStage.updatedAt = {};
			if (modifiedFromDate) {
				baseMatchStage.updatedAt.$gte = new Date(modifiedFromDate);
			}
			if (modifiedToDate) {
				const toDate = new Date(modifiedToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.updatedAt.$lte = toDate;
			}
		}

		if (nextActionFromDate || nextActionToDate) {
			baseMatchStage.followupDate = {};
			if (nextActionFromDate) {
				baseMatchStage.followupDate.$gte = new Date(nextActionFromDate);
			}
			if (nextActionToDate) {
				const toDate = new Date(nextActionToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.followupDate.$lte = toDate;
			}
		}


		if (leadStatus) {
			baseMatchStage._leadStatus = new mongoose.Types.ObjectId(leadStatus);
		}

		// Add base match stage
		aggregationPipeline.push({ $match: baseMatchStage });

		// Lookup stages for all related collections
		aggregationPipeline.push(
			// Course lookup with sectors, vertical, project population
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{
							$lookup: {
								from: 'sectors',
								localField: 'sectors',
								foreignField: '_id',
								as: 'sectors'
							}
						},
						{
							$lookup: {
								from: 'verticals',
								localField: 'vertical',
								foreignField: '_id',
								as: 'vertical'
							}
						},
						{
							$lookup: {
								from: 'projects',
								localField: 'project',
								foreignField: '_id',
								as: 'project'
							}
						}
					]
				}
			},
			{ $unwind: '$_course' },
			{
				$lookup: {
					from: 'users',
					localField: 'counsellor',
					foreignField: '_id',
					as: 'counsellor'

				}
			},
			{ $unwind: { path: '$counsellor', preserveNullAndEmptyArrays: true } },
			// Lead Status lookup
			{
				$lookup: {
					from: 'status',
					localField: '_leadStatus',
					foreignField: '_id',
					as: '_leadStatus'
				}
			},
			{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } },

			// Center lookup
			{
				$lookup: {
					from: 'centers',
					localField: '_center',
					foreignField: '_id',
					as: '_center'
				}
			},
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },

			// Registered By lookup
			{
				$lookup: {
					from: 'users',
					localField: 'registeredBy',
					foreignField: '_id',
					as: 'registeredBy'
				}
			},
			{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },

			// Candidate lookup with applied courses
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: '_candidate',
					foreignField: '_id',
					as: '_candidate',
					pipeline: [
						{
							$lookup: {
								from: 'appliedcourses',
								localField: '_appliedCourses',
								foreignField: '_id',
								as: '_appliedCourses',
								pipeline: [
									{
										$lookup: {
											from: 'courses',
											localField: '_course',
											foreignField: '_id',
											as: '_course'
										}
									},
									{
										$lookup: {
											from: 'users',
											localField: 'registeredBy',
											foreignField: '_id',
											as: 'registeredBy'
										}
									},
									{
										$lookup: {
											from: 'centers',
											localField: '_center',
											foreignField: '_id',
											as: '_center'
										}
									},
									{
										$lookup: {
											from: 'status',
											localField: '_leadStatus',
											foreignField: '_id',
											as: '_leadStatus'
										}
									}
								]
							}
						}
					]
				}
			},
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

			// Logs lookup
			{
				$lookup: {
					from: 'users',
					localField: 'logs.user',
					foreignField: '_id',
					as: 'logUsers'
				}
			},
			{
				$addFields: {
					logs: {
						$map: {
							input: "$logs",
							as: "log",
							in: {
								$mergeObjects: [
									"$$log",
									{
										user: {
											$arrayElemAt: [
												{
													$filter: {
														input: "$logUsers",
														cond: { $eq: ["$$this._id", "$$log.user"] }
													}
												},
												0
											]
										}
									}
								]
							}
						}
					}
				}
			}
		);

		// Filter by college
		aggregationPipeline.push({
			$match: {
				'_course.college': college._id
			}
		});

		// NEW: Add KYC filter logic based on docs required
		if (kyc !== undefined && kyc !== '') {
			let kycMatchStage = {};

			if (kyc === 'true' || kyc === true) {
				// For kyc=true: Include all candidates (with or without required docs)
				kycMatchStage = {
					$or: [
						// Candidates with kyc=true
						{ kyc: true },
						// Candidates whose course has no required docs (regardless of kyc status)
						{
							$or: [
								{ '_course.docsRequired': { $exists: false } },
								{ '_course.docsRequired': { $size: 0 } },
								{ '_course.docsRequired': null }
							]
						}
					]
				};
			} else if (kyc === 'false' || kyc === false) {
				// For kyc=false: Only include candidates whose course has required docs and kyc=false
				kycMatchStage = {
					kyc: false,
					'_course.docsRequired': {
						$exists: true,
						$ne: null,
						$not: { $size: 0 }
					}
				};
			}

			aggregationPipeline.push({ $match: kycMatchStage });
		} else {
			// Default behavior when no kyc filter is specified - show all KYC candidates
			// No additional filter needed, will show all candidates with kycStage: true
		}

		// Apply additional filters based on populated data
		let additionalMatches = {};

		// Course type filter
		if (courseType) {
			additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(courseType, 'i') };
		}

		// Sector filter (multi-select - using projects array)
		if (projectsArray.length > 0) {
			additionalMatches['_course.project._id'] = { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Verticals filter (multi-select)
		if (verticalsArray.length > 0) {
			additionalMatches['_course.vertical._id'] = { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Course filter (multi-select)
		if (courseArray.length > 0) {
			additionalMatches['_course._id'] = { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Center filter (multi-select)
		if (centerArray.length > 0) {
			additionalMatches['_center._id'] = { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Name search filter
		if (name && name.trim()) {
			const searchTerm = name.trim();
			const searchRegex = new RegExp(searchTerm, 'i');

			additionalMatches.$or = additionalMatches.$or ? [
				...additionalMatches.$or,
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm }, // Try both number and string
				{ '_candidate.email': searchRegex }
			] : [
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
				{ '_candidate.email': searchRegex }
			];
		}

		// Add additional match stage if any filters are applied
		if (Object.keys(additionalMatches).length > 0) {
			aggregationPipeline.push({ $match: additionalMatches });
		}

		// Sort by creation date
		aggregationPipeline.push({
			$sort: { updatedAt: -1 }
		});

		// Execute aggregation



		const allFilteredResults = await AppliedCourses.aggregate(aggregationPipeline);

		// Process results for document counts and other formatting
		const results = allFilteredResults.map(doc => {
			let selectedSubstatus = null;

			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			// Process sectors to show first sector name
			const firstSectorName = doc._course?.sectors?.[0]?.name || 'N/A';
			if (doc._course) {
				doc._course.sectors = firstSectorName;
			}

			const requiredDocs = doc._course?.docsRequired || [];
			const uploadedDocs = doc.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});

			// console.log("requiredDocs", requiredDocs)

			// console.log("uploadedDocsMap", uploadedDocsMap)

			let combinedDocs = [];

			if (requiredDocs) {
				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = requiredDocs.map(reqDoc => {

					// Convert Mongoose document to plain object
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

					const isDocApproved = uploadedDocs.some(uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString() && uploadDoc.status === "Verified");

					// Find matching uploaded docs for this required doc
					const matchingUploads = uploadedDocs.filter(


						uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
					)

					return {
						_id: docObj._id,
						Name: docObj.Name || 'Document',
						mandatory: docObj.mandatory,
						status: isDocApproved,
						description: docObj.description || '',
						uploads: matchingUploads || []
					};
				});
			}


			// Prepare combined docs array for legacy compatibility
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					return {
						...uploadedDoc,
						Name: reqDoc.Name,
						mandatory: reqDoc.mandatory,
						_id: reqDoc._id
					};
				} else {
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

			// Count calculations
			let verifiedCount = 0;
			let RejectedCount = 0;
			let pendingVerificationCount = 0;
			let notUploadedCount = 0;
			let mandatoryCount = 0;

			allDocs.forEach(doc => {
				if (doc.status === "Verified") verifiedCount++;
				else if (doc.mandatory) mandatoryCount++;
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
				...doc,
				selectedSubstatus,
				uploadedDocs: combinedDocs,
				docCounts: {
					totalRequired,
					mandatoryCount,
					RejectedCount,
					uploadedCount,
					verifiedCount,
					pendingVerificationCount,
					notUploadedCount,
					uploadPercentage
				}
			};
		});

		// Calculate KYC specific counts
		const totalCount = results.length;
		const pendingKycCount = results.filter(doc => doc.kycStage === true && doc.kyc === false).length;
		const doneKycCount = results.filter(doc => doc.kyc === true).length;

		// Calculate CRM filter counts (if needed for additional status filters)
		const crmFilterCounts = await calculateKycFilterCounts(teamMembers, college._id, {
			name,
			courseType,
			sector,
			createdFromDate,
			createdToDate,
			modifiedFromDate,
			modifiedToDate,
			nextActionFromDate,
			nextActionToDate,
			projectsArray,
			verticalsArray,
			courseArray,
			centerArray,
			counselorArray
		});

		// Apply pagination
		const paginatedResult = results.slice(skip, skip + limit);

		for (const result of paginatedResult) {
			const followup = await B2cFollowup.findOne({ appliedCourseId: result._id, status: 'planned' })
			result.followup = followup
		}

		// console.log("paginatedResult", JSON.stringify(paginatedResult[0], null, 2))

		res.status(200).json({
			success: true,
			count: paginatedResult.length,
			page,
			limit,
			pendingKycCount,
			doneKycCount,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			data: paginatedResult,
			crmFilterCounts
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});

// Helper function to calculate KYC filter counts with applied filters
async function calculateKycFilterCounts(teamMembers, collegeId, appliedFilters = {}) {
	const counts = {
		all: 0,
		pendingKyc: 0,
		doneKyc: 0
	};

	try {

		// Build base aggregation pipeline
		let basePipeline = [];

		if (typeof member === 'string') {
			member = new mongoose.Types.ObjectId(member);
		}

		// Base match stage for KYC candidates
		let baseMatchStage = {
			kycStage: { $in: [true] },

		};

		if (teamMembers && teamMembers.length > 0) {
			baseMatchStage.$or = [
				{ registeredBy: { $in: teamMembers } },
				{ counsellor: { $in: teamMembers } }
			];
		}

		// Add date filters
		if (appliedFilters.createdFromDate || appliedFilters.createdToDate) {
			baseMatchStage.createdAt = {};
			if (appliedFilters.createdFromDate) {
				baseMatchStage.createdAt.$gte = new Date(appliedFilters.createdFromDate);
			}
			if (appliedFilters.createdToDate) {
				const toDate = new Date(appliedFilters.createdToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.createdAt.$lte = toDate;
			}
		}

		if (appliedFilters.modifiedFromDate || appliedFilters.modifiedToDate) {
			baseMatchStage.updatedAt = {};
			if (appliedFilters.modifiedFromDate) {
				baseMatchStage.updatedAt.$gte = new Date(appliedFilters.modifiedFromDate);
			}
			if (appliedFilters.modifiedToDate) {
				const toDate = new Date(appliedFilters.modifiedToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.updatedAt.$lte = toDate;
			}
		}

		if (appliedFilters.nextActionFromDate || appliedFilters.nextActionToDate) {
			baseMatchStage.followupDate = {};
			if (appliedFilters.nextActionFromDate) {
				baseMatchStage.followupDate.$gte = new Date(appliedFilters.nextActionFromDate);
			}
			if (appliedFilters.nextActionToDate) {
				const toDate = new Date(appliedFilters.nextActionToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.followupDate.$lte = toDate;
			}
		}

		basePipeline.push({ $match: baseMatchStage });

		// Add lookups
		basePipeline.push(
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{ $lookup: { from: 'sectors', localField: 'sectors', foreignField: '_id', as: 'sectors' } },
						{ $lookup: { from: 'verticals', localField: 'vertical', foreignField: '_id', as: 'vertical' } },
						{ $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'project' } }
					]
				}
			},
			{ $unwind: '$_course' },
			{ $lookup: { from: 'centers', localField: '_center', foreignField: '_id', as: '_center' } },
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'users', localField: 'registeredBy', foreignField: '_id', as: 'registeredBy' } },
			{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'candidateprofiles', localField: '_candidate', foreignField: '_id', as: '_candidate' } },
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } }
		);

		// Filter by college FIRST
		basePipeline.push({ $match: { '_course.college': collegeId } });

		// NEW: Add KYC filter logic based on docs required (same as main route)
		if (appliedFilters.kyc !== undefined && appliedFilters.kyc !== '') {
			let kycMatchStage = {};

			if (appliedFilters.kyc === 'true' || appliedFilters.kyc === true) {
				// For kyc=true: Include all candidates (with or without required docs)
				kycMatchStage = {
					$or: [
						// Candidates with kyc=true
						{ kyc: true },
						// Candidates whose course has no required docs (regardless of kyc status)
						{
							$or: [
								{ '_course.docsRequired': { $exists: false } },
								{ '_course.docsRequired': { $size: 0 } },
								{ '_course.docsRequired': null }
							]
						}
					]
				};
			} else if (appliedFilters.kyc === 'false' || appliedFilters.kyc === false) {
				// For kyc=false: Only include candidates whose course has required docs and kyc=false
				kycMatchStage = {
					kyc: false,
					'_course.docsRequired': {
						$exists: true,
						$ne: null,
						$not: { $size: 0 }
					}
				};
			}

			basePipeline.push({ $match: kycMatchStage });
		}

		// Apply additional filters
		let additionalMatches = {};

		if (appliedFilters.courseType) {
			additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(appliedFilters.courseType, 'i') };
		}

		if (appliedFilters.projectsArray && appliedFilters.projectsArray.length > 0) {
			additionalMatches['_course.project._id'] = { $in: appliedFilters.projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		if (appliedFilters.verticalsArray && appliedFilters.verticalsArray.length > 0) {
			additionalMatches['_course.vertical._id'] = { $in: appliedFilters.verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		if (appliedFilters.courseArray && appliedFilters.courseArray.length > 0) {
			additionalMatches['_course._id'] = { $in: appliedFilters.courseArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		if (appliedFilters.centerArray && appliedFilters.centerArray.length > 0) {
			additionalMatches['_center._id'] = { $in: appliedFilters.centerArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		if (appliedFilters.name && appliedFilters.name.trim()) {
			const searchTerm = appliedFilters.name.trim();
			const searchRegex = new RegExp(appliedFilters.name.trim(), 'i');
			additionalMatches.$or = additionalMatches.$or ? [
				...additionalMatches.$or,
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
				{ '_candidate.email': searchRegex }
			] : [
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
				{ '_candidate.email': searchRegex }
			];
		}

		if (Object.keys(additionalMatches).length > 0) {
			basePipeline.push({ $match: additionalMatches });
		}

		// Get all KYC leads count (total filtered candidates)
		const allKycAggregation = await AppliedCourses.aggregate([
			...basePipeline,
			{ $count: "total" }
		]);

		const allKycCount = allKycAggregation[0]?.total || 0;
		counts.all += allKycCount;

		// UPDATED: Get KYC status counts with new logic
		const kycStatusAggregation = await AppliedCourses.aggregate([
			...basePipeline,
			{
				$addFields: {
					// Calculate effective KYC status based on new logic
					effectiveKycStatus: {
						$cond: {
							if: {
								$or: [
									// If kyc is true
									{ $eq: ["$kyc", true] },
									// OR if course has no required docs
									{ $not: { $ifNull: ["$_course.docsRequired", []] } },
									{ $eq: [{ $size: { $ifNull: ["$_course.docsRequired", []] } }, 0] }
								]
							},
							then: "done",
							else: "pending"
						}
					}
				}
			},
			{
				$group: {
					_id: "$effectiveKycStatus",
					count: { $sum: 1 }
				}
			}
		]);

		// Update KYC counts based on effective status
		kycStatusAggregation.forEach(kycGroup => {
			if (kycGroup._id === "done") {
				counts.doneKyc += kycGroup.count;
			} else if (kycGroup._id === "pending") {
				counts.pendingKyc += kycGroup.count;
			}
		});


		// Return final counts
		const finalCounts = {
			all: counts.all,
			pendingKyc: counts.pendingKyc,
			doneKyc: counts.doneKyc
		};

		return finalCounts;

	} catch (error) {
		console.error('Error calculating KYC filter counts:', error);
		return { all: 0, pendingKyc: 0, doneKyc: 0 };
	}
}







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

			const key = `Documents for course/${appliedCourse._course._id}/${appliedCourse._candidate}/${docsId}/${uuid()}.${ext}`;

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

router.post("/b2c-set-followups", [isCollege], async (req, res) => {
	try {
		const user = req.user;
		const collegeId = req.college._id;
		// console.log("req", req.college._id);
		let { appliedCourseId, followupDate, remarks, folloupType, id } = req.body;


		if (!folloupType) {
			folloupType = 'new';
		}

		if (folloupType === 'new') {

			if (typeof appliedCourseId === 'string' && mongoose.Types.ObjectId.isValid(appliedCourseId)) {
				appliedCourseId = new mongoose.Types.ObjectId(appliedCourseId);
			}

			const existingFollowup = await B2cFollowup.findOne({ appliedCourseId, createdBy: user._id, status: 'planned' });

			if (existingFollowup) {
				return res.status(400).json({ status: false, message: "Followup already exists, Please update the followup" });
			}


			const followup = await B2cFollowup.create({ collegeId, followupDate, appliedCourseId, createdBy: user._id, remarks });

			if (!followup) {
				return res.status(400).json({ status: false, message: "Followup not created" });
			}

			let actionParts = [];
			actionParts.push(`Followup added to ${new Date(followupDate).toLocaleString()}`);


			if (remarks) {
				//   actionParts.push(`Remarks updated: "${remarks}"`);
				actionParts.push(`Remarks updated`);  // Remarks included 

			}


			const newLogEntry = {
				user: user._id,
				action: actionParts.join('; '), // Combine all actions in one log message
				remarks: remarks || '', // Optional remarks in the log
				timestamp: new Date() // Add timestamp if your schema supports it
			};

			const updateAppliedRemarks = await AppliedCourses.findOneAndUpdate({ _id: appliedCourseId }, {
				$set: { remarks: remarks },
				$push: { logs: newLogEntry }
			});

			if (!updateAppliedRemarks) {
				return res.status(400).json({ status: false, message: "Applied course remarks not updated" });
			}






			return res.status(200).json({ status: true, message: "Followup created successfully", data: followup });

		}
		else if (folloupType === 'update') {
			const existingFollowup = await B2cFollowup.findOne({ _id: id, status: 'planned' });

			if (!existingFollowup) {
				return res.status(400).json({ status: false, message: "Followup not found" });
			}


			existingFollowup.status = 'done';
			existingFollowup.updatedBy = user._id;
			existingFollowup.updatedAt = new Date();

			const updatedFollowup = await existingFollowup.save({ new: true });
			const newFollowup = await B2cFollowup.create({
				appliedCourseId: appliedCourseId,
				followupDate: followupDate,
				remarks: remarks,
				status: 'planned',
				createdBy: user._id,
				collegeId: collegeId
			});
			let actionParts = [];
			actionParts.push(`Followup updated to ${new Date(followupDate).toLocaleString()}`);
			if (remarks) {
				actionParts.push(`Remarks updated`);
			}

			const newLogEntry = {
				user: user._id,
				action: actionParts.join('; '),
				remarks: remarks || '',
				timestamp: new Date()
			};

			const updateAppliedRemarks = await AppliedCourses.findOneAndUpdate({ _id: appliedCourseId }, {
				$set: { remarks: remarks },
				$push: { logs: newLogEntry }
			});

			return res.status(200).json({ status: true, message: "Followup updated successfully", data: updatedFollowup });


		}


	} catch (err) {
		console.log(err);
		return res.status(500).send({ status: false, message: err.message });
	}
});

// router.get("/leads/my-followups", isCollege, async (req, res) => {
// 	try {
// 		const user = req.user;

// 		const { fromDate, toDate, page = 1, limit = 10, followupStatus } = req.query;

// 		// Add date validation
// 		let from, to;

// 		if (fromDate) {
// 			from = new Date(fromDate);
// 			if (isNaN(from.getTime())) {
// 				return res.status(400).json({ error: "Invalid fromDate format" });
// 			}
// 		} else {
// 			from = new Date(new Date().setHours(0, 0, 0, 0));
// 		}

// 		if (toDate) {
// 			to = new Date(toDate);
// 			if (isNaN(to.getTime())) {
// 				return res.status(400).json({ error: "Invalid toDate format" });
// 			}
// 		} else {
// 			to = new Date(new Date().setHours(23, 59, 59, 999));
// 		}

// 		const aggregate = [
// 			{
// 				$match: {
// 					createdBy: user._id,
// 					status: followupStatus,
// 					followupDate: { $gte: from, $lte: to }
// 				}
// 			},
// 			{
// 				$lookup: {
// 					from: 'appliedcourses',
// 					localField: 'appliedCourseId',
// 					foreignField: '_id',
// 					as: "appliedCourseId"
// 				}
// 			},
// 			{
// 				$unwind: {
// 					path: '$appliedCourseId',
// 					preserveNullAndEmptyArrays: true
// 				}
// 			},
// 			{
// 				$lookup: {
// 					from: 'candidateprofiles',
// 					localField: 'appliedCourseId._candidate',
// 					foreignField: '_id',
// 					as: 'candidate'
// 				}
// 			},
// 			{
// 				$unwind: {
// 					path: '$candidate',
// 					preserveNullAndEmptyArrays: true
// 				}
// 			},
// 			{
// 				$group: {
// 					_id: '$_id',
// 					name: { $first: '$candidate.name' },
// 					email: { $first: '$candidate.email' },
// 					mobile: { $first: '$candidate.mobile' },
// 					appliedCourseId: { $first: '$appliedCourseId._id' },
// 					followupDate: { $first: '$followupDate' },
// 					remarks: { $first: '$remarks' }

// 				}
// 			}
// 		]




// 		const followups = await B2cFollowup.aggregate(aggregate);
// 		// const followups = await B2cFollowup.aggregate(aggregate).populate({
// 		// 	path: 'appliedCourseId',
// 		// 	select: 'name mobile email'
// 		// });	



// 		if (!followups) {
// 			return res.status(400).json({ error: "No followups found" });
// 		}

// 		return res.status(200).json({ success: true, data: followups });

// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({ error: "Server Error" });
// 	}
// });

router.get("/leads/my-followups", isCollege, async (req, res) => {
	try {
		const user = req.user;
		let filter = {};
		const { fromDate, toDate, page = 1, limit = 10, followupStatus, projects, verticals, course, center, counselor } = req.query;

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


		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];

		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		let baseMatch = {}

		if (counselorArray.length > 0) {
			baseMatch.createdBy = { $in: counselorArray.map(id => new mongoose.Types.ObjectId(id)) };
		} else {
			baseMatch.createdBy = user._id;
		}


		const aggregate = [
			{
				$match: {
					...baseMatch,
					status: followupStatus,
					followupDate: { $gte: from, $lte: to },

				}
			},
			{
				$lookup: {
					from: 'appliedcourses',
					localField: 'appliedCourseId',
					foreignField: '_id',
					as: "appliedCourseId"
				}
			},
			{
				$unwind: {
					path: '$appliedCourseId',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: 'appliedCourseId._candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},
			{
				$unwind: {
					path: '$candidate',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'courses',
					localField: 'appliedCourseId._course',
					foreignField: '_id',
					as: 'courseData'
				}
			},
			{
				$unwind: {
					path: '$courseData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'verticals',
					localField: 'courseData.vertical',
					foreignField: '_id',
					as: 'verticalData'
				}
			},
			{
				$unwind: {
					path: '$verticalData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'projects',
					localField: 'courseData.project',
					foreignField: '_id',
					as: 'projectData'
				}
			},
			{
				$unwind: {
					path: '$projectData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'centers',
					localField: 'appliedCourseId._center',
					foreignField: '_id',
					as: 'centerData'
				}
			},
			{
				$unwind: {
					path: '$centerData',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'appliedCourseId._counsellor',
					foreignField: '_id',
					as: 'counselorData'
				}
			},
			{
				$unwind: {
					path: '$counselorData',
					preserveNullAndEmptyArrays: true
				}
			},

			{
				$group: {
					_id: '$_id',
					name: { $first: '$candidate.name' },
					email: { $first: '$candidate.email' },
					mobile: { $first: '$candidate.mobile' },
					appliedCourseId: { $first: '$appliedCourseId._id' },
					followupDate: { $first: '$followupDate' },
					remarks: { $first: '$remarks' },
					courseName: { $first: '$courseData.name' },
					verticalName: { $first: '$verticalData.name' },
					projectName: { $first: '$projectData.name' },
					centerName: { $first: '$centerData.name' },
					counselorName: { $first: '$counselorData.name' },
					_course: { $first: '$courseData' },
					center: { $first: '$centerData._id' },
				}
			}
		]

		// Apply additional filters based on populated data
		let additionalMatches = {};

		// Course type filter


		// Sector filter (multi-select - using projects array)
		if (projectsArray.length > 0) {
			additionalMatches['_course.project'] = { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Verticals filter (multi-select)
		if (verticalsArray.length > 0) {
			additionalMatches['_course.vertical'] = { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Course filter (multi-select)
		if (courseArray.length > 0) {
			additionalMatches['_course._id'] = { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) };
		}

		// Center filter (multi-select)
		if (centerArray.length > 0) {
			additionalMatches['center'] = { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) };
		}



		// Add additional match stage if any filters are applied
		if (Object.keys(additionalMatches).length > 0) {
			aggregate.push({ $match: additionalMatches });
		}




		const followups = await B2cFollowup.aggregate(aggregate);
		// const followups = await B2cFollowup.aggregate(aggregate).populate({
		// 	path: 'appliedCourseId',
		// 	select: 'name mobile email'
		// });	



		if (!followups) {
			return res.status(400).json({ error: "No followups found" });
		}

		return res.status(200).json({ success: true, data: followups });

	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Server Error" });
	}
});


router.get("/lead-history/:leadId", isCollege, async (req, res) => {
	try {
		const { leadId } = req.params;
		const lead = await AppliedCourses.findById(leadId)
			.select('logs')
			.populate({
				path: 'logs.user',
				select: 'name email role' // jo bhi fields chahiye
			})
			.lean();


		const logs = lead.logs;
		// console.log("logs", logs)

		// const logsData = logs.map(log => {
		// 	return {
		// 		action: log.action,
		// 		remarks: log.remarks,
		// 		timestamp: log.timestamp
		// 	};
		// });

		return res.status(200).json({ success: true, data: logs });


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

		const collegeId = req.user.college._id;

		const validProfileId = validateAndConvertId(profileId);
		const validUploadId = validateAndConvertId(uploadId);

		// Populate _course to get docsRequired
		const profile = await AppliedCourses.findById(validProfileId).populate('_course');
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		const docId = profile.uploadedDocs.find(doc => doc._id.toString() === validUploadId.toString()).docsId;


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





		const isCurrentDoccumentMandatory = !!combinedDocs?.find(doc => doc._id.toString() === docId.toString() && doc.mandatory === true);


		const requiredCount = combinedDocs?.filter(doc => doc.mandatory === true).length || 0;
		let verifiedCount = isCurrentDoccumentMandatory ? 1 : 0;




		// Count already verified docs (excluding the current one)
		for (const doc of combinedDocs || []) {

			if (doc._id.toString() !== docId.toString() && doc.uploads?.[doc.uploads.length - 1]?.status === 'Verified' && doc.mandatory === true) {
				verifiedCount++;
			}
		}


		// Find and update the current doc
		for (const doc of profile.uploadedDocs || []) {
			if (doc._id.toString() === validUploadId.toString()) {
				doc.status = status;
				if (status === 'Rejected') {
					doc.reason = rejectionReason;
					doc.verifiedBy = req.user._id;
					doc.verifiedDate = new Date();
				}
				if (status === 'Verified') {
					doc.verifiedBy = req.user._id;
					doc.verifiedDate = new Date();
				}
			}
		};


		await profile.save();

		// Check if all mandatory documents are verified after saving
		let allMandatoryDocsVerified = true;

		// Get the updated profile to check current status
		const updatedProfile = await AppliedCourses.findById(validProfileId).populate('_course');
		const updatedRequiredDocs = updatedProfile._course?.docsRequired || [];
		const updatedUploadedDocs = updatedProfile.uploadedDocs || [];

		// Create map of uploaded docs by docsId
		const updatedUploadedDocsMap = {};
		updatedUploadedDocs.forEach(d => {
			if (d.docsId) updatedUploadedDocsMap[d.docsId.toString()] = d;
		});

		// Check each mandatory document
		for (const reqDoc of updatedRequiredDocs) {
			if (reqDoc.mandatory) {
				const uploadedDoc = updatedUploadedDocsMap[reqDoc._id.toString()];
				// If mandatory doc is not uploaded or not verified, set flag to false
				if (!uploadedDoc || uploadedDoc.status !== 'Verified') {
					allMandatoryDocsVerified = false;
					break;
				}
			}
		}

		// If all mandatory docs are verified, update KYC status to true
		if (allMandatoryDocsVerified && !updatedProfile.kyc) {
			updatedProfile.kyc = true;
			await updatedProfile.save();


			const newStatusLogs = await statusLogHelper(id, {
				kycApproved: true
			});


		}

		return res.json({
			success: true,
			message: "Document status updated successfully",
			kycUpdated: profile.kyc === true,
			verifiedCount: verifiedCount + (status === 'Verified' ? 1 : 0),
			requiredCount,
			allMandatoryDocsVerified: allMandatoryDocsVerified
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
		let teamMembers = [user._id];
		const college = await College.findOne({ '_concernPerson._id': user._id });
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const skip = (page - 1) * limit;
		// Extract ALL filter parameters from query (same as kycCandidates)
		const {
			name,
			courseType,
			status,
			kyc,
			leadStatus,
			sector,
			createdFromDate,
			createdToDate,
			modifiedFromDate,
			modifiedToDate,
			nextActionFromDate,
			nextActionToDate,
			projects,
			verticals,
			course,
			center,
			counselor
		} = req.query;
		// Parse multi-select filter values


		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];
		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		if (projectsArray.length > 0) {
			teamMembers = [];
		}

		if (verticalsArray.length > 0) {
			teamMembers = [];
		}

		if (courseArray.length > 0) {
			teamMembers = [];
		}

		if (centerArray.length > 0) {
			teamMembers = [];
		}

		if (name && name.trim() !== '') {
			teamMembers = [];
		}



		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}

		let teamMemberIds = [];
		if (teamMembers?.length > 0) {
			teamMemberIds = teamMembers.map(member =>
				typeof member === 'string' ? new mongoose.Types.ObjectId(member) : member
			);
		}



		let aggregationPipeline = [];

		let baseMatchStage = {
			admissionDone: { $in: [true] },

		};

		if (teamMemberIds && teamMemberIds.length > 0) {

			baseMatchStage.$or = [
				{ registeredBy: { $in: teamMemberIds } },
				{ counsellor: { $in: teamMemberIds } }
			];
		}
		// Add date filters to base match
		if (createdFromDate || createdToDate) {
			baseMatchStage.createdAt = {};
			if (createdFromDate) {
				baseMatchStage.createdAt.$gte = new Date(createdFromDate);
			}
			if (createdToDate) {
				const toDate = new Date(createdToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.createdAt.$lte = toDate;
			}
		}
		if (modifiedFromDate || modifiedToDate) {
			baseMatchStage.updatedAt = {};
			if (modifiedFromDate) {
				baseMatchStage.updatedAt.$gte = new Date(modifiedFromDate);
			}
			if (modifiedToDate) {
				const toDate = new Date(modifiedToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.updatedAt.$lte = toDate;
			}
		}
		if (nextActionFromDate || nextActionToDate) {
			baseMatchStage.followupDate = {};
			if (nextActionFromDate) {
				baseMatchStage.followupDate.$gte = new Date(nextActionFromDate);
			}
			if (nextActionToDate) {
				const toDate = new Date(nextActionToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.followupDate.$lte = toDate;
			}
		}
		// Status filters
		if (status === 'pendingBatchAssign') {
			baseMatchStage.batch = { $in: [null] };
			baseMatchStage.dropOut = { $nin: [true] }
		}
		if (status === 'batchAssigned') {
			baseMatchStage.batch = { $ne: null };
			baseMatchStage.dropout = { $in: [false] };
		}
		if (status === 'zeroPeriod') {
			baseMatchStage.batch = { $ne: null };
			baseMatchStage.isZeroPeriodAssigned = { $in: [true] };
			baseMatchStage.dropout = { $in: [false] };
			baseMatchStage.isBatchFreeze = { $in: [false] };
		}
		if (status === 'dropout') {
			baseMatchStage.dropout = { $in: [true] };
		}
		if (status === 'batchFreeze') {
			baseMatchStage.batch = { $ne: null };
			baseMatchStage.isBatchFreeze = { $in: [true] };
			baseMatchStage.dropout = { $in: [false] };
		}
		aggregationPipeline.push({ $match: baseMatchStage });
		aggregationPipeline.push(
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{ $lookup: { from: 'sectors', localField: 'sectors', foreignField: '_id', as: 'sectors' } },
						{ $lookup: { from: 'verticals', localField: 'vertical', foreignField: '_id', as: 'vertical' } },
						{ $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'project' } }
					]
				}
			},
			{ $unwind: '$_course' },
			{ $lookup: { from: 'status', localField: '_leadStatus', foreignField: '_id', as: '_leadStatus' } },
			{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'centers', localField: '_center', foreignField: '_id', as: '_center' } },
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'users', localField: 'registeredBy', foreignField: '_id', as: 'registeredBy' } },
			{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: '_candidate',
					foreignField: '_id',
					as: '_candidate',
					pipeline: [
						{
							$lookup: {
								from: 'appliedcourses',
								localField: '_appliedCourses',
								foreignField: '_id',
								as: '_appliedCourses',
								pipeline: [
									{ $lookup: { from: 'courses', localField: '_course', foreignField: '_id', as: '_course' } },
									{ $lookup: { from: 'users', localField: 'registeredBy', foreignField: '_id', as: 'registeredBy' } },
									{ $lookup: { from: 'centers', localField: '_center', foreignField: '_id', as: '_center' } },
									{ $lookup: { from: 'status', localField: '_leadStatus', foreignField: '_id', as: '_leadStatus' } }
								]
							}
						}
					]
				}
			},
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'users', localField: 'logs.user', foreignField: '_id', as: 'logUsers' } },
			{
				$addFields: {
					logs: {
						$map: {
							input: "$logs",
							as: "log",
							in: {
								$mergeObjects: [
									"$$log",
									{
										user: {
											$arrayElemAt: [
												{
													$filter: {
														input: "$logUsers",
														cond: { $eq: ["$$this._id", "$$log.user"] }
													}
												},
												0
											]
										}
									}
								]
							}
						}
					}
				}
			}
		);
		aggregationPipeline.push({ $match: { '_course.college': college._id } });
		let additionalMatches = {};
		if (courseType) {
			additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(courseType, 'i') };
		}
		if (projectsArray.length > 0) {
			additionalMatches['_course.project._id'] = { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (verticalsArray.length > 0) {
			additionalMatches['_course.vertical._id'] = { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (courseArray.length > 0) {
			additionalMatches['_course._id'] = { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (centerArray.length > 0) {
			additionalMatches['_center._id'] = { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (name && name.trim()) {
			const searchTerm = name.trim();
			const searchRegex = new RegExp(searchTerm, 'i');

			additionalMatches.$or = additionalMatches.$or ? [
				...additionalMatches.$or,
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm }, // Try both number and string
				{ '_candidate.email': searchRegex }
			] : [
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
				{ '_candidate.email': searchRegex }
			];
		}
		if (Object.keys(additionalMatches).length > 0) {
			aggregationPipeline.push({ $match: additionalMatches });
		}
		aggregationPipeline.push({ $sort: { updatedAt: -1 } });
		const allFilteredResults = await AppliedCourses.aggregate(aggregationPipeline);

		const results = allFilteredResults.map(doc => {
			let selectedSubstatus = null;
			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}
			const firstSectorName = doc._course?.sectors?.[0]?.name || 'N/A';
			if (doc._course) {
				doc._course.sectors = firstSectorName;
			}
			const requiredDocs = doc._course?.docsRequired || [];
			const uploadedDocs = doc.uploadedDocs || [];
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});
			let combinedDocs = [];
			if (requiredDocs) {
				combinedDocs = requiredDocs.map(reqDoc => {
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;
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
			}
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					return {
						...uploadedDoc,
						Name: reqDoc.Name,
						_id: reqDoc._id
					};
				} else {
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
				...doc,
				selectedSubstatus,
				uploadedDocs: combinedDocs,
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
		const totalCount = results.length;
		// Example: You can add more status-based counts here as needed
		const crmFilterCounts = await calculateAdmissionFilterCounts(teamMembers, college._id, {
			name,
			courseType,
			sector,
			createdFromDate,
			createdToDate,
			modifiedFromDate,
			modifiedToDate,
			nextActionFromDate,
			nextActionToDate,
			projectsArray,
			verticalsArray,
			courseArray,
			centerArray,
			counselorArray
		});
		const paginatedResult = results.slice(skip, skip + limit);
		for (const result of paginatedResult) {
			const followup = await B2cFollowup.findOne({ appliedCourseId: result._id, status: 'planned' })
			result.followup = followup
		}
		// console.log("paginatedResult", JSON.stringify(paginatedResult[0], null, 2))

		res.status(200).json({
			success: true,
			count: paginatedResult.length,
			page,
			limit,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			data: paginatedResult,
			crmFilterCounts
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});

// Add this helper function after calculateKycFilterCounts
async function calculateAdmissionFilterCounts(teamMembers, collegeId, appliedFilters = {}) {
	const counts = {
		all: 0,
		pendingBatchAssign: 0,
		batchAssigned: 0,
		zeroPeriod: 0,
		batchFreeze: 0,
		dropout: 0
	};
	try {
		let basePipeline = [];



		let baseMatchStage = {
			admissionDone: { $in: [true] },

		};

		if (teamMembers && teamMembers.length > 0) {
			baseMatchStage.$or = [
				{ registeredBy: { $in: teamMembers } },
				{ counsellor: { $in: teamMembers } }
			];
		}
		// Add date filters
		if (appliedFilters.createdFromDate || appliedFilters.createdToDate) {
			baseMatchStage.createdAt = {};
			if (appliedFilters.createdFromDate) {
				baseMatchStage.createdAt.$gte = new Date(appliedFilters.createdFromDate);
			}
			if (appliedFilters.createdToDate) {
				const toDate = new Date(appliedFilters.createdToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.createdAt.$lte = toDate;
			}
		}
		if (appliedFilters.modifiedFromDate || appliedFilters.modifiedToDate) {
			baseMatchStage.updatedAt = {};
			if (appliedFilters.modifiedFromDate) {
				baseMatchStage.updatedAt.$gte = new Date(appliedFilters.modifiedFromDate);
			}
			if (appliedFilters.modifiedToDate) {
				const toDate = new Date(appliedFilters.modifiedToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.updatedAt.$lte = toDate;
			}
		}
		if (appliedFilters.nextActionFromDate || appliedFilters.nextActionToDate) {
			baseMatchStage.followupDate = {};
			if (appliedFilters.nextActionFromDate) {
				baseMatchStage.followupDate.$gte = new Date(appliedFilters.nextActionFromDate);
			}
			if (appliedFilters.nextActionToDate) {
				const toDate = new Date(appliedFilters.nextActionToDate);
				toDate.setHours(23, 59, 59, 999);
				baseMatchStage.followupDate.$lte = toDate;
			}
		}
		basePipeline.push({ $match: baseMatchStage });
		basePipeline.push(
			{ $lookup: { from: 'courses', localField: '_course', foreignField: '_id', as: '_course', pipeline: [{ $lookup: { from: 'sectors', localField: 'sectors', foreignField: '_id', as: 'sectors' } }, { $lookup: { from: 'verticals', localField: 'vertical', foreignField: '_id', as: 'vertical' } }, { $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'project' } }] } },
			{ $unwind: '$_course' },
			{ $lookup: { from: 'centers', localField: '_center', foreignField: '_id', as: '_center' } },
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'users', localField: 'registeredBy', foreignField: '_id', as: 'registeredBy' } },
			{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'candidateprofiles', localField: '_candidate', foreignField: '_id', as: '_candidate' } },
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } }
		);
		basePipeline.push({ $match: { '_course.college': collegeId } });
		// Apply additional filters
		let additionalMatches = {};
		if (appliedFilters.courseType) {
			additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(appliedFilters.courseType, 'i') };
		}
		if (appliedFilters.projectsArray && appliedFilters.projectsArray.length > 0) {
			additionalMatches['_course.project._id'] = { $in: appliedFilters.projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (appliedFilters.verticalsArray && appliedFilters.verticalsArray.length > 0) {
			additionalMatches['_course.vertical._id'] = { $in: appliedFilters.verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (appliedFilters.courseArray && appliedFilters.courseArray.length > 0) {
			additionalMatches['_course._id'] = { $in: appliedFilters.courseArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (appliedFilters.centerArray && appliedFilters.centerArray.length > 0) {
			additionalMatches['_center._id'] = { $in: appliedFilters.centerArray.map(id => new mongoose.Types.ObjectId(id)) };
		}
		if (appliedFilters.name && appliedFilters.name.trim()) {
			const searchTerm = appliedFilters.name.trim();
			const searchRegex = new RegExp(appliedFilters.name.trim(), 'i');
			additionalMatches.$or = additionalMatches.$or ? [
				...additionalMatches.$or,
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchRegex },
				{ '_candidate.email': searchRegex }
			] : [
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchRegex },
				{ '_candidate.email': searchRegex }
			];
		}
		if (Object.keys(additionalMatches).length > 0) {
			basePipeline.push({ $match: additionalMatches });
		}
		// Get all admissions for this member/college/filters
		const allAdmissions = await AppliedCourses.aggregate(basePipeline);
		// Calculate each status count
		counts.pendingBatchAssign += allAdmissions.filter(doc =>
			(!doc.batch || doc.batch === null) &&
			!doc.isZeroPeriodAssigned &&
			!doc.isBatchFreeze &&
			!doc.dropout
		).length;
		counts.batchAssigned += allAdmissions.filter(doc =>
			doc.batch &&
			!doc.dropout
		).length;
		counts.zeroPeriod += allAdmissions.filter(doc =>
			doc.batch &&
			doc.isZeroPeriodAssigned &&
			!doc.isBatchFreeze &&
			!doc.dropout
		).length;
		counts.batchFreeze += allAdmissions.filter(doc =>
			doc.batch &&
			doc.isBatchFreeze &&
			!doc.dropout
		).length;
		counts.dropout += allAdmissions.filter(doc =>
			doc.dropout
		).length;
		counts.all += allAdmissions.length;

		return counts;
	} catch (err) {
		console.error(err);
		return counts;
	}
}


router.get("/generate-application-form/:id", async (req, res) => {
	try {
		let { id } = req.params
		if (typeof id === 'string') {
			id = new mongoose.Types.ObjectId(id)
		}

		const getFinancialYear = () => {
			const today = new Date();
			const year = today.getFullYear();
			const month = today.getMonth() + 1; // 0-based

			if (month >= 4) {
				// FY starts from April
				return `${year}-${year + 1}`;
			} else {
				return `${year - 1}-${year}`;
			}
		};
		const fy = getFinancialYear();


		const getFinancialYearDates = () => {
			const today = new Date();
			const year = today.getFullYear();
			const month = today.getMonth() + 1;

			let startYear = month >= 4 ? year : year - 1;
			let endYear = startYear + 1;

			const startDate = new Date(`${startYear}-04-01T00:00:00.000Z`);
			const endDate = new Date(`${endYear}-03-31T23:59:59.999Z`);

			return { startDate, endDate };
		};

		const generateApplicationNumber = async () => {
			// "2024-25"
			const key = `Focalyt/${fy}`;
			const { startDate, endDate } = getFinancialYearDates();
			// Increment or create

			const count = await AppliedCourses.find({
				createdAt: { $gte: startDate, $lte: endDate }
			}).countDocuments()


			const paddedCount = count + 1
			return `${key}/${paddedCount}`; // e.g. "Focalyt/2024-25/00027"
		};
		const applicationNumber = await generateApplicationNumber()



		let data = await AppliedCourses.findById(id)
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
		if (!data._candidate?.personalInfo?.image || data._candidate.personalInfo.image.trim() === '') {
			return res.status(500).json({ status: false, message: "Profile pic required" });
		}



		const isDocsRequired = !!data?._course?.docsRequired?.length > 0

		if (isDocsRequired) {
			const requiredDocs = data._course?.docsRequired || [];
			const uploadedDocs = data.uploadedDocs || [];

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

				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = requiredDocs.map(reqDoc => {
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

		}

		const formatDate = (date) => {
			const d = new Date(date);
			const day = String(d.getDate()).padStart(2, '0');
			const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
			const year = d.getFullYear();
			return `${day}/${month}/${year}`;
		};

		const dobFormatted = formatDate(data._candidate.dob);

		const logoPath = path.join(__dirname, '../../../controllers/public/public_assets/images/newpage/logo-ha.svg');
		const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
		const imgTag = `<img src="data:image/svg+xml;base64,${logoBase64}" />`;
		const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Form ${fy}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
			
        }
        
        body {
            font-family: Arial, sans-serif;
            background-color:rgb(255, 255, 255);
            padding: 0px;
            height: 297mm;
            width: 210mm;
            min-width: 210mm;
            min-height: 297mm;

        }
        
        .form-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            border: 2px solid #ddd;
            padding: 5px;
        }
        
        .header {
            background-color: #4a5a8a;
            color: white;
            padding: 5px;
            font-weight: bold;
            font-size: 20px;
            position: relative;
        }
        
        .header-info {
            padding: 15px;
            border-bottom: 1px solid #ddd;
        }
        
        .header-info table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .header-info td {
            padding: 4px 0;
            font-size: 15px;
        }
        
        .header-info .label {
            font-weight: bold;
            width: 180px;
        }
        
        .logo {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .logo img {
            height: 40px;
            width: auto;
        }
        
        .section-header {
            background-color: #4a5a8a;
            color: white;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 14px;
            margin-top: 0;
        }
        
        .section-content {
            padding: 15px;
            position: relative;
        }
        
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .details-table td {
            padding: 6px 5px;
            font-size: 12px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }
        
        .details-table .label {
            font-weight: bold;
            width: 140px;
        }
        
        .details-table .value {
            padding-left: 10px;
        }
        
        .photo-section {
            position: absolute;
            right: 15px;
            top: 15px;
        }
        
        .photo-placeholder {
            width: 100px;
            height: 120px;
            border: 2px solid #ccc;
            background-color: #f9f9f9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #666;
        }
        
        .photo-img {
            width: 100px;
            height: 120px;
            border: 2px solid #ccc;
            object-fit: cover;
        }
        
        .address-row {
            display: flex;
            gap: 30px;
        }
        
        .address-col {
            flex: 1;
        }
        
        .documents-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .documents-table th,
        .documents-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-size: 12px;
        }
        
        .documents-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        
        .document-link {
            color: #0066cc;
            text-decoration: underline;
            font-size: 11px;
        }
        
        .declaration-content {
            font-size: 12px;
            line-height: 1.4;
            text-align: justify;
        }
        
        .signature-section {
            margin-top: 30px;
            text-align: right;
        }
        
        .signature-name {
            font-weight: bold;
            margin-top: 20px;
        }
        
        .clear {
            clear: both;
        }
        
        .personal-details-content {
            margin-right: 120px;
        }
        .div-1 , .div-2 {
            width:50%
        }
        .div-2{
            padding: 50px;
        }
        .section-1st{
            display: flex;
            align-items: center;
        }

        
    </style>
</head>
<body>
    <div class="form-container">
        <!-- Header -->
        <div class="section-1st">
            <div class="div-1">
                <!-- Header -->
                <div class="header">
                    APPLICATION FORM ${fy}

                </div>

                <!-- Header Information -->
                <div class="header-info">
                    <table>

                        <tr>
                            <td class="label">Project :</td>
                            <td>${data?._course?.project?.name || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Course :</td>
                            <td>${data?._course?.name || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Application Form Number:</td>
                            <td>${applicationNumber}</td>
                        </tr>
                        <tr>
                            <td class="label">Branch:</td>
                            <td>${data?._center?.name || ''}</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="div-2">
            ${imgTag}

            </div>
        </div>
        
        <!-- Personal Details -->
        <div class="section-header">
            PERSONAL DETAILS
        </div>
        
        <div class="section-content">
            <div class="photo-section">
                <div class="photo-placeholder">
				${data._candidate?.personalInfo?.image
				? `<img class="photo-img" src="${data._candidate.personalInfo.image}" />`
				: `<div class="photo-placeholder">Photo</div>`}
				  
                </div>
            </div>
            
            <div class="personal-details-content">
                <table class="details-table">
                    <tr>
                        <td class="label">Full Name:</td>
                        <td class="value">${data?._candidate?.name || ''}</td>
                    </tr>
					<tr>
                        <td class="label">Father Name:</td>
                        <td class="value">${data?._candidate?.personalInfo?.fatherName || ''}</td>
                    </tr>
                    <tr>
                        <td class="label">Mother Name:</td>
                        <td class="value">${data?._candidate?.personalInfo?.motherName || ''}</td>
                    </tr>
                    <tr>
                        <td class="label">Email:</td>
                        <td class="value">${data?._candidate?.email || ''}</td>
                    </tr>
                    <tr>
                        <td class="label">Mobile:</td>
                        <td class="value">${data?._candidate?.mobile || ''}</td>
                    </tr>
                    
                    <tr>
                        <td class="label">Date of Birth:</td>
                        <td class="value">${dobFormatted || ''}</td>
                    </tr>
                    <tr>
                        <td class="label">Gender:</td>
                        <td class="value">${data?._candidate?.sex || ''}</td>
                    </tr>
                </table>
            </div>
            
            <div class="clear"></div>
        </div>
        
        <!-- Permanent Address -->
        <div class="section-header">
            PERMANENT ADDRESS DETAILS
        </div>
        
        <div class="section-content">
            <div class="address-row">
                <div class="address-col">
                    <table class="details-table">
                        <tr>
                            <td class="label">Address Line 1:</td>
                            <td class="value">${data?._candidate?.personalInfo?.currentAddress?.fullAddress || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">State:</td>
                            <td class="value">${data?._candidate?.personalInfo?.currentAddress?.state || ''}</td>
                        </tr>
                        
                    </table>
                </div>
                <div class="address-col">
                    <table class="details-table">
					<tr>
                            <td class="label">City:</td>
                            <td class="value">${data?._candidate?.personalInfo?.currentAddress?.city || ''}</td>

                        </tr>
						<tr>
                            <td class="label">Country:</td>
                            <td class="value">Domestic (Indian Resident)</td>
                        </tr>                      
                        
                       
                    </table>
                </div>
            </div>
        </div>     
       
        
        <!-- Documents Upload -->

		${isDocsRequired ?
				`   <div class="section-header">
            DOCUMENTS UPLOAD
        </div>
        
        <div class="section-content">
            <table class="documents-table">
                <thead>
                    <tr>
                        <th>File Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
  ${combinedDocs.map(doc => `
    <tr>
      <td>${doc.Name} ${doc.mandatory ? '<span style="color:red">*</span>' : ''} </td>
     <td>${doc.uploads?.length ? doc.uploads[doc.uploads.length - 1].status : 'Not Uploaded'}</td>

    </tr>
  `).join('')}
</tbody>
            </table>
        </div>
		` : ''}
        

        
        <!-- Declaration -->
        <div class="section-header">
            DECLARATION
        </div>
        
        <div class="section-content">
            <div class="declaration-content">
                <p>I certify that the information submitted by me in support of this application, is true to the best of my knowledge and belief. I understand that in the event of any information being found false or incorrect, my admission is liable to be rejected / cancelled at any stage of the program. I undertake to abide by the disciplinary rules and regulations of Focal Skills Development.</p>
                
                <div class="signature-section">
                    <div class="signature-name">${data._candidate.name}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;

		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		const page = await browser.newPage();
		await page.setContent(htmlContent, { waitUntil: "networkidle0" });

		const pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
		});

		await browser.close();

		// Send PDF buffer as a downloadable file
		res.set({
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="application_form.pdf"`,
			"Content-Length": pdfBuffer.length,
		});

		return res.send(pdfBuffer);

	} catch (err) {
		console.error("PDF generation error:", err);
		res.status(500).send({ status: false, message: "Failed to generate PDF" });
	}

})


router.get('/dashbord-data', isCollege, async (req, res) => {
	try {
		const user = req.user;
		let teamMembers = await getAllTeamMembers(user._id);
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		// Extract ALL filter parameters from query
		const {
			name,
			courseType,
			status,
			leadStatus,
			sector,
			kyc,
			createdFromDate,
			createdToDate,
			modifiedFromDate,
			modifiedToDate,
			nextActionFromDate,
			nextActionToDate,
			// Multi-select filters (these come as JSON strings)
			projects,
			verticals,
			course,
			center,
			counselor
		} = req.query;


		// Parse multi-select filter values
		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];

		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		// If counselor filter is applied, override teamMembers
		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}

		// Build date filter
		let dateFilter = {};

		// If no date filter is provided, default to today
		if (!createdFromDate && !createdToDate && !modifiedFromDate && !modifiedToDate && !nextActionFromDate && !nextActionToDate) {
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			const todayEnd = new Date();
			todayEnd.setHours(23, 59, 59, 999);
			dateFilter.createdAt = { $gte: todayStart, $lte: todayEnd };
		} else {
			if (createdFromDate || createdToDate) {
				dateFilter.createdAt = {};
				if (createdFromDate) {
					dateFilter.createdAt.$gte = new Date(createdFromDate);
				}
				if (createdToDate) {
					const toDate = new Date(createdToDate);
					toDate.setHours(23, 59, 59, 999);
					dateFilter.createdAt.$lte = toDate;
				}
			}

			if (modifiedFromDate || modifiedToDate) {
				dateFilter.updatedAt = {};
				if (modifiedFromDate) {
					dateFilter.updatedAt.$gte = new Date(modifiedFromDate);
				}
				if (modifiedToDate) {
					const toDate = new Date(modifiedToDate);
					toDate.setHours(23, 59, 59, 999);
					dateFilter.updatedAt.$lte = toDate;
				}
			}

			if (nextActionFromDate || nextActionToDate) {
				dateFilter.followupDate = {};
				if (nextActionFromDate) {
					dateFilter.followupDate.$gte = new Date(nextActionFromDate);
				}
				if (nextActionToDate) {
					const toDate = new Date(nextActionToDate);
					toDate.setHours(23, 59, 59, 999);
					dateFilter.followupDate.$lte = toDate;
				}
			}
		}

		let appliedCourses = [];

		for (const member of teamMembers) {
			// Convert string member ID to ObjectId if needed
			let memberId = member;
			if (typeof member === 'string') {
				memberId = new mongoose.Types.ObjectId(member);
			}

			// Build base query
			const query = {
				$or: [
					{ registeredBy: memberId },
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
								memberId
							]
						}
					}
				],
				...dateFilter
			};

			// Add additional filters
			if (status && status !== 'true') {
				query._leadStatus = new mongoose.Types.ObjectId(status);
			}
			if (leadStatus) {
				query._leadStatus = new mongoose.Types.ObjectId(leadStatus);
			}
			if (kyc && kyc !== 'false') {
				if (kyc === 'true') {
					query.$or = [
						{ kycStage: true },
						{ kyc: true },
						{ admissionDone: true }
					];
				} else {
					query.kycStage = { $nin: [true] };
					query.kyc = { $nin: [true] };
					query.admissionDone = { $nin: [true] };
				}
			}

			const response = await AppliedCourses.find(query)
				.populate({
					path: '_course',
					populate: [
						{
							path: 'sectors',
							select: 'name'
						},
						{
							path: 'vertical',
							select: 'name'
						},
						{
							path: 'project',
							select: 'name'
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
				.sort({ createdAt: -1 });

			response.forEach(doc => {
				if (!appliedCourses.some(existingDoc => existingDoc._id.toString() === doc._id.toString())) {
					appliedCourses.push(doc);
				}
			});
		}

		// Filter by college
		const filteredAppliedCourses = appliedCourses.filter(doc => {
			return doc._course && String(doc._course.college) === String(college._id);
		});

		// Apply additional filters after population
		let finalFilteredCourses = filteredAppliedCourses.filter(doc => {
			// Course type filter
			if (courseType && doc._course) {
				const courseTypeMatch = new RegExp(courseType, 'i').test(doc._course.courseFeeType);
				if (!courseTypeMatch) return false;
			}

			// Sector/Projects filter (multi-select)
			if (projectsArray.length > 0 && doc._course && doc._course.sectors) {
				const sectorMatch = doc._course.sectors.some(sector =>
					projectsArray.includes(sector._id.toString())
				);
				if (!sectorMatch) return false;
			}

			// Verticals filter (multi-select)
			if (verticalsArray.length > 0 && doc._course && doc._course.vertical) {
				const verticalMatch = verticalsArray.includes(doc._course.vertical._id.toString());
				if (!verticalMatch) return false;
			}

			// Course filter (multi-select)
			if (courseArray.length > 0 && doc._course) {
				const courseMatch = courseArray.includes(doc._course._id.toString());
				if (!courseMatch) return false;
			}

			// Center filter (multi-select)
			if (centerArray.length > 0 && doc._center) {
				const centerMatch = centerArray.includes(doc._center._id.toString());
				if (!centerMatch) return false;
			}

			// Name search filter
			if (name && name.trim() && doc._candidate) {
				const searchRegex = new RegExp(name.trim(), 'i');
				const nameMatch = searchRegex.test(doc._candidate.name) ||
					searchRegex.test(doc._candidate.mobile) ||
					searchRegex.test(doc._candidate.email);
				if (!nameMatch) return false;
			}

			return true;
		});

		const results = finalFilteredCourses.map(doc => {
			let selectedSubstatus = null;

			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			const docObj = doc.toObject();

			const firstSectorName = docObj._course?.sectors?.[0]?.name || 'N/A';
			if (docObj._course) {
				docObj._course.sectors = firstSectorName;
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
					return {
						...uploadedDoc,
						Name: reqDoc.Name,
						mandatory: reqDoc.mandatory,
						_id: reqDoc._id
					};
				} else {
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

			let combinedDocs = [];
			if (requiredDocs) {
				combinedDocs = requiredDocs.map(reqDoc => {
					const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;
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
				uploadedDocs: combinedDocs,
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

		const totalCount = results.length;

		res.status(200).json({
			success: true,
			count: results.length,
			totalCount,
			data: results,
			allData: results,
			// Filter info for debugging
			appliedFilters: {
				dateFilters: {
					createdFromDate,
					createdToDate,
					modifiedFromDate,
					modifiedToDate,
					nextActionFromDate,
					nextActionToDate,
					appliedDateFilter: Object.keys(dateFilter).length > 0 ? dateFilter : 'No date filter applied'
				},
				otherFilters: {
					name,
					courseType,
					status,
					leadStatus,
					sector,
					kyc,
					projects: projectsArray,
					verticals: verticalsArray,
					course: courseArray,
					center: centerArray,
					counselor: counselorArray
				}
			}
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			success: false,
			message: "Server Error"
		});
	}
});

router.get('/filters-data', [isCollege], async (req, res) => {
	try {
		const user = req.user;
		// Find the college for the current user
		const college = await College.findOne({ '_concernPerson._id': user._id }).populate('_concernPerson._id');
		if (!college) {
			return res.status(404).json({ status: false, message: 'College not found' });
		}

		// Aggregation: Only applied courses for this college
		const appliedCourses = await AppliedCourses.aggregate([
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course'
				}
			},
			{ $unwind: '$_course' },
			{
				$match: {
					'_course.college': college._id
				}
			},
			{
				$lookup: {
					from: 'centers',
					localField: '_center',
					foreignField: '_id',
					as: '_center'
				}
			},
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'verticals',
					localField: '_course.vertical',
					foreignField: '_id',
					as: 'verticals'
				}
			},
			{
				$lookup: {
					from: 'projects',
					localField: '_course.project',
					foreignField: '_id',
					as: 'projects'
				}
			}
		]);

		// Unique sets
		const verticalSet = new Map();
		const projectSet = new Map();
		const courseSet = new Map();
		const centerSet = new Map();

		appliedCourses.forEach(ac => {
			// Verticals
			if (Array.isArray(ac.verticals)) {
				ac.verticals.forEach(v => {
					if (v && v._id && !verticalSet.has(v._id.toString())) {
						verticalSet.set(v._id.toString(), { _id: v._id, name: v.name });
					}
				});
			}
			// Projects
			if (Array.isArray(ac.projects)) {
				ac.projects.forEach(p => {
					if (p && p._id && !projectSet.has(p._id.toString())) {
						projectSet.set(p._id.toString(), { _id: p._id, name: p.name });
					}
				});
			}
			// Courses
			if (ac._course && ac._course._id && !courseSet.has(ac._course._id.toString())) {
				courseSet.set(ac._course._id.toString(), { _id: ac._course._id, name: ac._course.name });
			}
			// Centers
			if (ac._center && ac._center._id && !centerSet.has(ac._center._id.toString())) {
				centerSet.set(ac._center._id.toString(), { _id: ac._center._id, name: ac._center.name });
			}
			// Counselors (last assignment)

		});

		let counselors = []
		college._concernPerson.forEach(person => {
			let data = {
				_id: person?._id?._id || '',
				name: person?._id?.name || ''
			}
			counselors.push(data)

		})


		res.json({
			status: true,
			verticals: Array.from(verticalSet.values()),
			projects: Array.from(projectSet.values()),
			courses: Array.from(courseSet.values()),
			centers: Array.from(centerSet.values()),
			counselors
		});
	} catch (err) {
		console.error('Error in /filters-data:', err);
		res.status(500).json({ status: false, message: err.message });
	}
});

router.route("/admission-list/:courseId/:centerId").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		let { courseId, centerId } = req.params;
		if (!courseId || !centerId) {
			return res.status(400).json({ status: false, message: 'Course ID and center ID are required' });
		}
		// Convert string IDs to ObjectId for aggregation
		if (typeof courseId === 'string') {
			courseId = new mongoose.Types.ObjectId(courseId);
		}
		if (typeof centerId === 'string') {
			centerId = new mongoose.Types.ObjectId(centerId);
		}

		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const skip = (page - 1) * limit;

		// Extract filter parameters from query
		const { name, search } = req.query;

		// Build aggregation pipeline
		let aggregationPipeline = [];

		// Base match stage
		let baseMatchStage = {
			admissionDone: { $in: [true] },
			_course: courseId,
			_center: centerId
		};

		// Add date filters to base match
		if (req.query.fromDate) {
			baseMatchStage.createdAt = { $gte: new Date(req.query.fromDate) };
		}
		if (req.query.toDate) {
			baseMatchStage.createdAt = { ...baseMatchStage.createdAt, $lte: new Date(req.query.toDate) };
		}
		if (req.query.createdFromDate) {
			baseMatchStage.createdAt = { ...baseMatchStage.createdAt, $gte: new Date(req.query.createdFromDate) };
		}
		if (req.query.createdToDate) {
			baseMatchStage.createdAt = { ...baseMatchStage.createdAt, $lte: new Date(req.query.createdToDate) };
		}
		if (req.query.modifiedFromDate) {
			baseMatchStage.updatedAt = { $gte: new Date(req.query.modifiedFromDate) };
		}
		if (req.query.modifiedToDate) {
			baseMatchStage.updatedAt = { ...baseMatchStage.updatedAt, $lte: new Date(req.query.modifiedToDate) };
		}
		if (req.query.nextActionFromDate) {
			baseMatchStage.nextActionDate = { $gte: new Date(req.query.nextActionFromDate) };
		}
		if (req.query.nextActionToDate) {
			baseMatchStage.nextActionDate = { ...baseMatchStage.nextActionDate, $lte: new Date(req.query.nextActionToDate) };
		}

		// Status filters
		if (req.query.status && req.query.status !== 'all') {
			if (req.query.status === "admission") {
				baseMatchStage.admissionDone = { $in: [true] };
				baseMatchStage.isZeroPeriodAssigned = { $in: [false] };
				baseMatchStage.isBatchFreeze = { $in: [false] };
				baseMatchStage.dropout = { $in: [false] };
			}
			if (req.query.status === "dropout") {
				baseMatchStage.dropout = { $in: [true] };
			}
			if (req.query.status === "zeroPeriod") {
				baseMatchStage.isZeroPeriodAssigned = true;
				baseMatchStage.isBatchFreeze = { $in: [false] };
				baseMatchStage.dropout = { $in: [false] };
			}
			if (req.query.status === "batchFreeze") {
				baseMatchStage.isBatchFreeze = { $in: [true] };
				baseMatchStage.dropout = { $in: [false] };
			}
		}

		// Other filters
		if (req.query.courseType) {
			baseMatchStage.courseType = req.query.courseType;
		}
		if (req.query.leadStatus) {
			baseMatchStage._leadStatus = new mongoose.Types.ObjectId(req.query.leadStatus);
		}
		if (req.query.sector) {
			baseMatchStage.sector = req.query.sector;
		}

		// Add base match stage
		aggregationPipeline.push({ $match: baseMatchStage });


		// Lookup stages for all related collections
		aggregationPipeline.push(
			// Course lookup with sectors population
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{
							$lookup: {
								from: 'sectors',
								localField: 'sectors',
								foreignField: '_id',
								as: 'sectors'
							}
						}
					]
				}
			},
			{ $unwind: '$_course' },

			// Lead Status lookup
			{
				$lookup: {
					from: 'status',
					localField: '_leadStatus',
					foreignField: '_id',
					as: '_leadStatus'
				}
			},
			{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } },

			// Center lookup
			{
				$lookup: {
					from: 'centers',
					localField: '_center',
					foreignField: '_id',
					as: '_center'
				}
			},
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },

			// Batch lookup
			{
				$lookup: {
					from: 'batches',
					localField: 'batch',
					foreignField: '_id',
					as: 'batch'
				}
			},
			{ $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },

			// Registered By lookup
			{
				$lookup: {
					from: 'users',
					localField: 'registeredBy',
					foreignField: '_id',
					as: 'registeredBy'
				}
			},
			{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },

			// Candidate lookup with applied courses
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: '_candidate',
					foreignField: '_id',
					as: '_candidate',
					pipeline: [
						{
							$lookup: {
								from: 'appliedcourses',
								localField: '_appliedCourses',
								foreignField: '_id',
								as: '_appliedCourses',
								pipeline: [
									{ $lookup: { from: 'courses', localField: '_course', foreignField: '_id', as: '_course' } },
									{ $lookup: { from: 'users', localField: 'registeredBy', foreignField: '_id', as: 'registeredBy' } },
									{ $lookup: { from: 'centers', localField: '_center', foreignField: '_id', as: '_center' } },
									{ $lookup: { from: 'status', localField: '_leadStatus', foreignField: '_id', as: '_leadStatus' } }
								]
							}
						}
					]
				}
			},
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

			// Logs lookup
			{
				$lookup: {
					from: 'users',
					localField: 'logs.user',
					foreignField: '_id',
					as: 'logUsers'
				}
			},
			{
				$addFields: {
					logs: {
						$map: {
							input: "$logs",
							as: "log",
							in: {
								$mergeObjects: [
									"$$log",
									{
										user: {
											$arrayElemAt: [
												{
													$filter: {
														input: "$logUsers",
														cond: { $eq: ["$$this._id", "$$log.user"] }
													}
												},
												0
											]
										}
									}
								]
							}
						}
					}
				}
			}
		);

		// Test intermediate results before college filter
		const intermediateResults = await AppliedCourses.aggregate(aggregationPipeline);


		// Filter by college
		aggregationPipeline.push({
			$match: {
				'_course.college': college._id
			}
		});


		// Apply additional filters based on populated data
		let additionalMatches = {};

		// Name search filter (searches in name, mobile, email - same as /applied route)
		if (name && name.trim()) {
			const searchTerm = name.trim();
			const searchRegex = new RegExp(searchTerm, 'i');

			additionalMatches.$or = [
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
				{ '_candidate.email': searchRegex }
			];
		}

		// Legacy search filter (for backward compatibility)
		if (search && search.trim()) {
			const searchTerm = search.trim();
			const searchRegex = new RegExp(searchTerm, 'i');

			if (additionalMatches.$or) {
				// If already has $or from name filter, combine them
				additionalMatches.$and = [
					{ $or: additionalMatches.$or },
					{
						$or: [
							{ '_candidate.name': searchRegex },
							{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
							{ '_candidate.email': searchRegex }
						]
					}
				];
				delete additionalMatches.$or;
			} else {
				additionalMatches.$or = [
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
					{ '_candidate.email': searchRegex }
				];
			}
		}

		// Add additional match stage if any filters are applied
		if (Object.keys(additionalMatches).length > 0) {
			aggregationPipeline.push({ $match: additionalMatches });
		}

		// Sort by creation date
		aggregationPipeline.push({
			$sort: { createdAt: -1 }
		});

		// Execute aggregation for total count (without pagination)
		const totalResults = await AppliedCourses.aggregate(aggregationPipeline);


		const totalCount = totalResults.length;

		// Add pagination to pipeline
		aggregationPipeline.push(
			{ $skip: skip },
			{ $limit: limit }
		);

		// Execute aggregation with pagination
		const appliedCourses = await AppliedCourses.aggregate(aggregationPipeline);

		// Calculate filter counts (simplified version)
		const calculateFilterCounts = async () => {
			// Use base aggregation pipeline for counts (without status filter)
			let countPipeline = aggregationPipeline.slice(0, -2); // Remove skip and limit

			// Remove status filter from base match for counting
			let baseMatch = { ...baseMatchStage };
			delete baseMatch.admissionDone;
			delete baseMatch.isZeroPeriodAssigned;
			delete baseMatch.isBatchFreeze;
			delete baseMatch.dropout;
			baseMatch.admissionDone = { $in: [true] }; // Keep base admission filter

			countPipeline[0] = { $match: baseMatch };

			const allResults = await AppliedCourses.aggregate(countPipeline);

			const counts = {
				all: allResults.length,
				dropout: allResults.filter(doc => doc.dropout === true).length,
				zeroPeriod: allResults.filter(doc => (doc.isZeroPeriodAssigned === true && doc.isBatchFreeze === false && doc.dropout === false)).length,
				batchFreeze: allResults.filter(doc => (doc.isBatchFreeze === true && doc.dropout === false)).length,
				admission: allResults.filter(doc => (doc.admissionDone === true && doc.isZeroPeriodAssigned === false && doc.isBatchFreeze === false && doc.dropout === false)).length,
			};

			return counts;
		};

		const filterCounts = await calculateFilterCounts();
		// Process results for document counts and other formatting
		const result = appliedCourses.map(doc => {
			let selectedSubstatus = null;

			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			// Process sectors to show first sector name
			const firstSectorName = doc._course?.sectors?.[0]?.name || 'N/A';
			if (doc._course) {
				doc._course.sectors = firstSectorName;
			}

			const requiredDocs = doc._course?.docsRequired || [];
			const uploadedDocs = doc.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});

			let combinedDocs = [];

			if (requiredDocs) {
				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = requiredDocs.map(reqDoc => {
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
			}

			// Prepare combined docs array for legacy compatibility
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					return {
						...uploadedDoc,
						Name: reqDoc.Name,
						_id: reqDoc._id
					};
				} else {
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
				...doc,
				selectedSubstatus,
				uploadedDocs: combinedDocs,
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

		const pendingKycCount = result.filter(doc =>
			doc.kycStage === true && doc.kyc === false
		).length;
		const doneKycCount = result.length - pendingKycCount;

		res.status(200).json({
			success: true,
			filterCounts,
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

router.route("/admission-list/:batchId").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		let { batchId } = req.params;
		if (!batchId) {
			return res.status(400).json({ status: false, message: 'Batch ID is required' });
		}
		// Convert string IDs to ObjectId for aggregation

		if (typeof batchId === 'string') {
			batchId = new mongoose.Types.ObjectId(batchId);
		}

		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const skip = (page - 1) * limit;

		// Extract filter parameters from query
		const { name, search } = req.query;

		// Build aggregation pipeline
		let aggregationPipeline = [];

		// Base match stage
		let baseMatchStage = {
			admissionDone: { $in: [true] },
			batch: batchId
		};

		// Add date filters to base match
		if (req.query.fromDate) {
			baseMatchStage.createdAt = { $gte: new Date(req.query.fromDate) };
		}
		if (req.query.toDate) {
			baseMatchStage.createdAt = { ...baseMatchStage.createdAt, $lte: new Date(req.query.toDate) };
		}
		if (req.query.createdFromDate) {
			baseMatchStage.createdAt = { ...baseMatchStage.createdAt, $gte: new Date(req.query.createdFromDate) };
		}
		if (req.query.createdToDate) {
			baseMatchStage.createdAt = { ...baseMatchStage.createdAt, $lte: new Date(req.query.createdToDate) };
		}
		if (req.query.modifiedFromDate) {
			baseMatchStage.updatedAt = { $gte: new Date(req.query.modifiedFromDate) };
		}
		if (req.query.modifiedToDate) {
			baseMatchStage.updatedAt = { ...baseMatchStage.updatedAt, $lte: new Date(req.query.modifiedToDate) };
		}
		if (req.query.nextActionFromDate) {
			baseMatchStage.nextActionDate = { $gte: new Date(req.query.nextActionFromDate) };
		}
		if (req.query.nextActionToDate) {
			baseMatchStage.nextActionDate = { ...baseMatchStage.nextActionDate, $lte: new Date(req.query.nextActionToDate) };
		}

		// Status filters
		if (req.query.status && req.query.status !== 'all') {
			if (req.query.status === "admission") {
				baseMatchStage.admissionDone = { $in: [true] };
				baseMatchStage.isZeroPeriodAssigned = { $in: [false] };
				baseMatchStage.isBatchFreeze = { $in: [false] };
				baseMatchStage.dropout = { $in: [false] };
			}
			if (req.query.status === "dropout") {
				baseMatchStage.dropout = { $in: [true] };
			}
			if (req.query.status === "zeroPeriod") {
				baseMatchStage.isZeroPeriodAssigned = true;
				baseMatchStage.isBatchFreeze = { $in: [false] };
				baseMatchStage.dropout = { $in: [false] };
			}
			if (req.query.status === "batchFreeze") {
				baseMatchStage.isBatchFreeze = { $in: [true] };
				baseMatchStage.dropout = { $in: [false] };
			}
		}

		// Other filters
		if (req.query.courseType) {
			baseMatchStage.courseType = req.query.courseType;
		}
		if (req.query.leadStatus) {
			baseMatchStage._leadStatus = new mongoose.Types.ObjectId(req.query.leadStatus);
		}
		if (req.query.sector) {
			baseMatchStage.sector = req.query.sector;
		}

		// Add base match stage
		aggregationPipeline.push({ $match: baseMatchStage });


		// Lookup stages for all related collections
		aggregationPipeline.push(
			// Course lookup with sectors population
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course',
					pipeline: [
						{
							$lookup: {
								from: 'sectors',
								localField: 'sectors',
								foreignField: '_id',
								as: 'sectors'
							}
						}
					]
				}
			},
			{ $unwind: '$_course' },

			// Lead Status lookup
			{
				$lookup: {
					from: 'status',
					localField: '_leadStatus',
					foreignField: '_id',
					as: '_leadStatus'
				}
			},
			{ $unwind: { path: '$_leadStatus', preserveNullAndEmptyArrays: true } },

			// Center lookup
			{
				$lookup: {
					from: 'centers',
					localField: '_center',
					foreignField: '_id',
					as: '_center'
				}
			},
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },

			// Batch lookup
			{
				$lookup: {
					from: 'batches',
					localField: 'batch',
					foreignField: '_id',
					as: 'batch'
				}
			},
			{ $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },

			// Registered By lookup
			{
				$lookup: {
					from: 'users',
					localField: 'registeredBy',
					foreignField: '_id',
					as: 'registeredBy'
				}
			},
			{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },

			// Candidate lookup with applied courses
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: '_candidate',
					foreignField: '_id',
					as: '_candidate',
					pipeline: [
						{
							$lookup: {
								from: 'appliedcourses',
								localField: '_appliedCourses',
								foreignField: '_id',
								as: '_appliedCourses',
								pipeline: [
									{ $lookup: { from: 'courses', localField: '_course', foreignField: '_id', as: '_course' } },
									{ $lookup: { from: 'users', localField: 'registeredBy', foreignField: '_id', as: 'registeredBy' } },
									{ $lookup: { from: 'centers', localField: '_center', foreignField: '_id', as: '_center' } },
									{ $lookup: { from: 'status', localField: '_leadStatus', foreignField: '_id', as: '_leadStatus' } }
								]
							}
						}
					]
				}
			},
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

			// Logs lookup
			{
				$lookup: {
					from: 'users',
					localField: 'logs.user',
					foreignField: '_id',
					as: 'logUsers'
				}
			},
			{
				$addFields: {
					logs: {
						$map: {
							input: "$logs",
							as: "log",
							in: {
								$mergeObjects: [
									"$$log",
									{
										user: {
											$arrayElemAt: [
												{
													$filter: {
														input: "$logUsers",
														cond: { $eq: ["$$this._id", "$$log.user"] }
													}
												},
												0
											]
										}
									}
								]
							}
						}
					}
				}
			}
		);

		// Test intermediate results before college filter
		const intermediateResults = await AppliedCourses.aggregate(aggregationPipeline);


		// Filter by college
		aggregationPipeline.push({
			$match: {
				'_course.college': college._id
			}
		});


		// Apply additional filters based on populated data
		let additionalMatches = {};

		// Name search filter (searches in name, mobile, email - same as /applied route)
		if (name && name.trim()) {
			const searchTerm = name.trim();
			const searchRegex = new RegExp(searchTerm, 'i');

			additionalMatches.$or = [
				{ '_candidate.name': searchRegex },
				{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
				{ '_candidate.email': searchRegex }
			];
		}

		// Legacy search filter (for backward compatibility)
		if (search && search.trim()) {
			const searchTerm = search.trim();
			const searchRegex = new RegExp(searchTerm, 'i');

			if (additionalMatches.$or) {
				// If already has $or from name filter, combine them
				additionalMatches.$and = [
					{ $or: additionalMatches.$or },
					{
						$or: [
							{ '_candidate.name': searchRegex },
							{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
							{ '_candidate.email': searchRegex }
						]
					}
				];
				delete additionalMatches.$or;
			} else {
				additionalMatches.$or = [
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': parseInt(searchTerm) || searchTerm },
					{ '_candidate.email': searchRegex }
				];
			}
		}

		// Add additional match stage if any filters are applied
		if (Object.keys(additionalMatches).length > 0) {
			aggregationPipeline.push({ $match: additionalMatches });
		}

		// Sort by creation date
		aggregationPipeline.push({
			$sort: { createdAt: -1 }
		});

		// Execute aggregation for total count (without pagination)
		const totalResults = await AppliedCourses.aggregate(aggregationPipeline);


		const totalCount = totalResults.length;

		// Add pagination to pipeline
		aggregationPipeline.push(
			{ $skip: skip },
			{ $limit: limit }
		);

		// Execute aggregation with pagination
		const appliedCourses = await AppliedCourses.aggregate(aggregationPipeline);

		// Calculate filter counts (simplified version)
		const calculateFilterCounts = async () => {
			// Use base aggregation pipeline for counts (without status filter)
			let countPipeline = aggregationPipeline.slice(0, -2); // Remove skip and limit

			// Remove status filter from base match for counting
			let baseMatch = { ...baseMatchStage };
			delete baseMatch.admissionDone;
			delete baseMatch.isZeroPeriodAssigned;
			delete baseMatch.isBatchFreeze;
			delete baseMatch.dropout;
			baseMatch.admissionDone = { $in: [true] }; // Keep base admission filter

			countPipeline[0] = { $match: baseMatch };

			const allResults = await AppliedCourses.aggregate(countPipeline);

			const counts = {
				all: allResults.length,
				dropout: allResults.filter(doc => doc.dropout === true).length,
				zeroPeriod: allResults.filter(doc => (doc.isZeroPeriodAssigned === true && doc.isBatchFreeze === false && doc.dropout === false)).length,
				batchFreeze: allResults.filter(doc => (doc.isBatchFreeze === true && doc.dropout === false)).length,
				admission: allResults.filter(doc => (doc.admissionDone === true && doc.isZeroPeriodAssigned === false && doc.isBatchFreeze === false && doc.dropout === false)).length,
			};

			return counts;
		};

		const filterCounts = await calculateFilterCounts();
		// Process results for document counts and other formatting
		const result = appliedCourses.map(doc => {
			let selectedSubstatus = null;

			if (doc._leadStatus && doc._leadStatus.substatuses && doc._leadSubStatus) {
				selectedSubstatus = doc._leadStatus.substatuses.find(
					sub => sub._id.toString() === doc._leadSubStatus.toString()
				);
			}

			// Process sectors to show first sector name
			const firstSectorName = doc._course?.sectors?.[0]?.name || 'N/A';
			if (doc._course) {
				doc._course.sectors = firstSectorName;
			}

			const requiredDocs = doc._course?.docsRequired || [];
			const uploadedDocs = doc.uploadedDocs || [];

			// Map uploaded docs by docsId for quick lookup
			const uploadedDocsMap = {};
			uploadedDocs.forEach(d => {
				if (d.docsId) uploadedDocsMap[d.docsId.toString()] = d;
			});

			let combinedDocs = [];

			if (requiredDocs) {
				// Create a merged array with both required docs and uploaded docs info
				combinedDocs = requiredDocs.map(reqDoc => {
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
			}

			// Prepare combined docs array for legacy compatibility
			const allDocs = requiredDocs.map(reqDoc => {
				const uploadedDoc = uploadedDocsMap[reqDoc._id.toString()];
				if (uploadedDoc) {
					return {
						...uploadedDoc,
						Name: reqDoc.Name,
						_id: reqDoc._id
					};
				} else {
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
				...doc,
				selectedSubstatus,
				uploadedDocs: combinedDocs,
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

		const pendingKycCount = result.filter(doc =>
			doc.kycStage === true && doc.kyc === false
		).length;
		const doneKycCount = result.length - pendingKycCount;

		res.status(200).json({
			success: true,
			filterCounts,
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

router.route('/refer-leads')
	.get(isCollege, async (req, res) => {
		try {
			const user = req.user;
			const college = await College.findOne({ '_concernPerson._id': user._id }).populate('_concernPerson._id').select('_concernPerson');
			if (!college) {
				return res.status(404).json({ status: false, message: 'College not found' });
			}
			let counselors = []
			college._concernPerson.forEach(person => {
				counselors.filter(c => {
					if (c._id === person._id) {
						return
					} else {
						counselors.push(person._id)
					}
				})

			})

			res.status(200).json({
				success: true,
				data: counselors
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				success: false,
				message: "Server Error"
			});
		}
	})

	.post(isCollege, async (req, res) => {
		try {
			const user = req.user;
			let { counselorId, appliedCourseId, type } = req.body;
			counselorId = new mongoose.Types.ObjectId(counselorId);

			// If appliedCourseId is not an array, convert it to an array
			if (!Array.isArray(appliedCourseId)) {
				appliedCourseId = [appliedCourseId];
			}
			for (const id of appliedCourseId) {
				const counselor = await User.findById(counselorId);
				if (!counselor) {
					return res.status(404).json({ status: false, message: 'Counselor not found' });
				}


				const appliedCourse = await AppliedCourses.findById(id);
				if (!appliedCourse) {
					return res.status(404).json({ status: false, message: 'Applied course not found' });
				}
				const updateData = {
					_counsellor: counselorId,
					counsellorName: counselor.name,
					assignDate: new Date(),
					assignedBy: new mongoose.Types.ObjectId(user._id)
				}
				appliedCourse.leadAssignment.push(updateData);
				appliedCourse.counsellor = counselorId;
				await appliedCourse.save();
			}
			res.status(200).json({
				success: true,
				message: 'Lead referred successfully'
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				success: false,
				message: "Server Error"
			});
		}
	})




router.get('/counsellor-status-table', [isCollege], async (req, res) => {
	try {
		const user = req.user;
		// Find the college for the current user
		const college = await College.findOne({ '_concernPerson._id': user._id });
		if (!college) {
			return res.status(404).json({ status: false, message: 'College not found' });
		}

		// Get date filters from query parameters
		const { dateFrom, dateTo, allTime } = req.query;

		let dateFilter = {};
		let startDate, endDate;

		if (allTime === 'true') {
			// Show all time data - no date filter
			dateFilter = {};
		} else if (dateFrom && dateTo) {
			// Use provided date range
			startDate = moment(dateFrom).startOf('day').toDate();
			endDate = moment(dateTo).endOf('day').toDate();
		} else {
			// Default to today's date range
			startDate = moment().startOf('day').toDate();
			endDate = moment().endOf('day').toDate();
		}

		// Aggregate appliedCourses for this college, grouped by course, center, and counsellor
		const pipeline = [
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: '_course'
				}
			},
			{ $unwind: '$_course' },
			// Add project lookup
			{
				$lookup: {
					from: 'projects',
					localField: '_course.project',
					foreignField: '_id',
					as: 'projectObj'
				}
			},
			{ $addFields: { projectObj: { $arrayElemAt: ['$projectObj', 0] } } },
			{
				$lookup: {
					from: 'centers',
					localField: '_center',
					foreignField: '_id',
					as: '_center'
				}
			},
			{ $unwind: { path: '$_center', preserveNullAndEmptyArrays: true } },
			{
				$match: {
					'_course.college': college._id
				}
			},
			// Get latest counsellor assignment
			{
				$addFields: {
					latestAssignment: { $arrayElemAt: ['$leadAssignment', -1] }
				}
			},
			{
				$group: {
					_id: {
						projectId: '$projectObj._id',
						projectName: '$projectObj.name',
						courseId: '$_course._id',
						courseName: '$_course.name',
						centerId: '$_center._id',
						centerName: '$_center.name',
						counsellorId: '$latestAssignment._counsellor',
						counsellorName: '$latestAssignment.counsellorName'
					},
					// Total Leads - filtered by createdAt
					totalLeads: {
						$sum: {
							$cond: [
								allTime === 'true' || (startDate && endDate && {
									$and: [
										{ $gte: ['$createdAt', startDate] },
										{ $lte: ['$createdAt', endDate] }
									]
								}),
								1,
								0
							]
						}
					},
					totalLeadIds: {
						$push: {
							$cond: [
								allTime === 'true' || (startDate && endDate && {
									$and: [
										{ $gte: ['$createdAt', startDate] },
										{ $lte: ['$createdAt', endDate] }
									]
								}),
								'$_id',
								'$$REMOVE'
							]
						}
					},
					// Pending KYC - filtered by createdAt (when KYC stage is true but KYC is not done)
					pendingKYC: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$kyc', false] },
										{ $eq: ['$kycStage', true] },
										{
											$or: [
												{ $gt: [{ $size: '$_course.docsRequired' }, 0] },
												{ $ne: ['$_course.docsRequired', null] }
											]
										},
										// Date filter for pending KYC (createdAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$createdAt', startDate] },
												{ $lte: ['$createdAt', endDate] }
											]
										})
									]
								},
								1,
								0
							]
						}
					},
					pendingKYCIds: {
						$push: {
							$cond: [
								{
									$and: [
										{ $eq: ['$kyc', false] },
										{ $eq: ['$kycStage', true] },
										{
											$or: [
												{ $gt: [{ $size: '$_course.docsRequired' }, 0] },
												{ $ne: ['$_course.docsRequired', null] }
											]
										},
										// Date filter for pending KYC (createdAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$createdAt', startDate] },
												{ $lte: ['$createdAt', endDate] }
											]
										})
									]
								},
								'$_id',
								'$$REMOVE'
							]
						}
					},
					// KYC Done - filtered by kycDoneAt
					kycDone: {
						$sum: {
							$cond: [
								{
									$and: [
										{
											$or: [
												{ $eq: ['$kyc', true] },
												{
													$and: [
														{ $eq: ['$kyc', false] },
														{
															$or: [
																{ $eq: [{ $size: '$_course.docsRequired' }, 0] },
																{ $eq: ['$_course.docsRequired', null] }
															]
														}
													]
												}
											]
										},
										// Date filter for KYC done (kycDoneAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$kycDoneAt', startDate] },
												{ $lte: ['$kycDoneAt', endDate] }
											]
										})
									]
								},
								1,
								0
							]
						}
					},
					kycDoneIds: {
						$push: {
							$cond: [
								{
									$and: [
										{
											$or: [
												{ $eq: ['$kyc', true] },
												{
													$and: [
														{ $eq: ['$kyc', false] },
														{
															$or: [
																{ $eq: [{ $size: '$_course.docsRequired' }, 0] },
																{ $eq: ['$_course.docsRequired', null] }
															]
														}
													]
												}
											]
										},
										// Date filter for KYC done (kycDoneAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$kycDoneAt', startDate] },
												{ $lte: ['$kycDoneAt', endDate] }
											]
										})
									]
								},
								'$_id',
								'$$REMOVE'
							]
						}
					},
					// Admission Done - filtered by admissionDate
					admissionDone: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$admissionDone', true] },
										// Date filter for admission done (admissionDate)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$admissionDate', startDate] },
												{ $lte: ['$admissionDate', endDate] }
											]
										})
									]
								},
								1,
								0
							]
						}
					},
					admissionDoneIds: {
						$push: {
							$cond: [
								{
									$and: [
										{ $eq: ['$admissionDone', true] },
										// Date filter for admission done (admissionDate)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$admissionDate', startDate] },
												{ $lte: ['$admissionDate', endDate] }
											]
										})
									]
								},
								'$_id',
								'$$REMOVE'
							]
						}
					},
					// Batch Assigned - filtered by batchAssignedAt
					batchAssigned: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$isBatchAssigned', true] },
										{ $eq: ['$dropout', false] },
										// Date filter for batch assigned (batchAssignedAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$batchAssignedAt', startDate] },
												{ $lte: ['$batchAssignedAt', endDate] }
											]
										})
									]
								},
								1,
								0
							]
						}
					},
					batchAssignedIds: {
						$push: {
							$cond: [
								{
									$and: [
										{ $eq: ['$isBatchAssigned', true] },
										{ $eq: ['$dropout', false] },
										// Date filter for batch assigned (batchAssignedAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$batchAssignedAt', startDate] },
												{ $lte: ['$batchAssignedAt', endDate] }
											]
										})
									]
								},
								'$_id',
								'$$REMOVE'
							]
						}
					},
					// In Zero Period - filtered by zeroPeriodAssignedAt
					inZeroPeriod: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$isZeroPeriodAssigned', true] },
										{ $eq: ['$dropout', false] },
										// Date filter for zero period assigned (zeroPeriodAssignedAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$zeroPeriodAssignedAt', startDate] },
												{ $lte: ['$zeroPeriodAssignedAt', endDate] }
											]
										})
									]
								},
								1,
								0
							]
						}
					},
					inZeroPeriodIds: {
						$push: {
							$cond: [
								{
									$and: [
										{ $eq: ['$isZeroPeriodAssigned', true] },
										{ $eq: ['$dropout', false] },
										// Date filter for zero period assigned (zeroPeriodAssignedAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$zeroPeriodAssignedAt', startDate] },
												{ $lte: ['$zeroPeriodAssignedAt', endDate] }
											]
										})
									]
								},
								'$_id',
								'$$REMOVE'
							]
						}
					},
					// In Batch Freezed - filtered by batchFreezeAt
					inBatchFreezed: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$isBatchFreeze', true] },
										{ $eq: ['$dropout', false] },
										// Date filter for batch freeze (batchFreezeAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$batchFreezeAt', startDate] },
												{ $lte: ['$batchFreezeAt', endDate] }
											]
										})
									]
								},
								1,
								0
							]
						}
					},
					inBatchFreezedIds: {
						$push: {
							$cond: [
								{
									$and: [
										{ $eq: ['$isBatchFreeze', true] },
										{ $eq: ['$dropout', false] },
										// Date filter for batch freeze (batchFreezeAt)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$batchFreezeAt', startDate] },
												{ $lte: ['$batchFreezeAt', endDate] }
											]
										})
									]
								},
								'$_id',
								'$$REMOVE'
							]
						}
					},
					// DropOut - filtered by dropoutDate
					dropOut: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$dropout', true] },
										// Date filter for dropout (dropoutDate)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$dropoutDate', startDate] },
												{ $lte: ['$dropoutDate', endDate] }
											]
										})
									]
								},
								1,
								0
							]
						}
					},
					dropOutIds: {
						$push: {
							$cond: [
								{
									$and: [
										{ $eq: ['$dropout', true] },
										// Date filter for dropout (dropoutDate)
										allTime === 'true' || (startDate && endDate && {
											$and: [
												{ $gte: ['$dropoutDate', startDate] },
												{ $lte: ['$dropoutDate', endDate] }
											]
										})
									]
								},
								'$_id',
								'$$REMOVE'
							]
						}
					}
				}
			},
			{
				$project: {
					_id: 0,
					projectId: '$_id.projectId',
					projectName: '$_id.projectName',
					courseId: '$_id.courseId',
					courseName: '$_id.courseName',
					centerId: '$_id.centerId',
					centerName: '$_id.centerName',
					counsellorId: '$_id.counsellorId',
					counsellorName: '$_id.counsellorName',
					pendingKYC: 1,
					pendingKYCIds: 1,
					kycDone: 1,
					kycDoneIds: 1,
					admissionDone: 1,
					admissionDoneIds: 1,
					batchAssigned: 1,
					batchAssignedIds: 1,
					inZeroPeriod: 1,
					inZeroPeriodIds: 1,
					inBatchFreezed: 1,
					inBatchFreezedIds: 1,
					dropOut: 1,
					dropOutIds: 1,
					totalLeads: 1,
					totalLeadIds: 1
				}
			},
			{ $sort: { projectName: 1, courseName: 1, centerName: 1, counsellorName: 1 } }
		];

		const result = await AppliedCourses.aggregate(pipeline);

		res.json({ success: true, data: result });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: 'Server Error' });
	}
});
// ====== END: Course-Counsellor Status Table API ======

router.post('/lead-details-by-ids', [isCollege], async (req, res) => {
	try {
		let { ids } = req.body;
		if (!ids) return res.json({ success: true, data: [] });
		if (typeof ids === 'string') ids = JSON.parse(ids);
		if (!Array.isArray(ids) || ids.length === 0) return res.json({ success: true, data: [] });
		const objectIds = ids.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);
		const pipeline = [
			{ $match: { _id: { $in: objectIds } } },
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: '_candidate',
					foreignField: '_id',
					as: '_candidate'
				}
			},
			{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },
			{
				$project: {
					candidateName: '$_candidate.name',
					candidateMobile: '$_candidate.mobile',
					candidateEmail: '$_candidate.email'
				}
			}
		];
		const leads = await AppliedCourses.aggregate(pipeline);
		res.json({ success: true, data: leads });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: 'Server Error' });
	}
});




router.get('/counselor-performance-matrix', isCollege, async (req, res) => {
	try {

		let {
			startDate,
			endDate,
			centerId, // Add centerId from query parameters

			// Advanced filter parameters (matching frontend structure)
			courseType,
			projects,
			verticals,
			course,
			center,
			counselor
		} = req.query;

		// Build date filter
		let dateFilter = {};

		if (startDate && endDate) {

			// Create start date (beginning of day)
			const startDateObj = new Date(startDate);
			startDateObj.setHours(0, 0, 0, 0);

			// Create end date (end of day)
			const endDateObj = new Date(endDate);
			endDateObj.setHours(23, 59, 59, 999);


			dateFilter.createdAt = {
				$gte: startDateObj,
				$lte: endDateObj
			};
		} else {
			// If no date range provided, get today's data
			const todayStartTime = new Date();
			todayStartTime.setHours(0, 0, 0, 0);

			const todayEndTime = new Date();
			todayEndTime.setHours(23, 59, 59, 999);


			dateFilter.createdAt = {
				$gte: todayStartTime,
				$lte: todayEndTime
			};
		}

		// Parse multi-select filter values
		let projectsArray = [];
		let verticalsArray = [];
		let courseArray = [];
		let centerArray = [];
		let counselorArray = [];

		try {
			if (projects) projectsArray = JSON.parse(projects);
			if (verticals) verticalsArray = JSON.parse(verticals);
			if (course) courseArray = JSON.parse(course);
			if (center) centerArray = JSON.parse(center);
			if (counselor) counselorArray = JSON.parse(counselor);
		} catch (parseError) {
			console.error('Error parsing filter arrays:', parseError);
		}

		// First, find the college's untouch status ID
		const untouchStatus = await Status.findOne({
			college: req.user.college._id,
			title: { $regex: /untouch/i }
		});


		if (!untouchStatus) {
			const allStatuses = await Status.find({ college: req.user.college._id });
		}

		// Get total leads and untouch leads from AppliedCourses based on creation date and counselor
		const appliedCoursesLeads = await AppliedCourses.aggregate([
			{
				$match: {
					...dateFilter,
					...(centerId && centerId !== 'all' && { _center: new mongoose.Types.ObjectId(centerId) })
				}
			},
			{
				$lookup: {
					from: 'courses',
					localField: '_course',
					foreignField: '_id',
					as: 'courseInfo'
				}
			},
			{
				$unwind: {
					path: '$courseInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'centers',
					localField: '_center',
					foreignField: '_id',
					as: 'centerInfo'
				}
			},
			{
				$unwind: {
					path: '$centerInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'counsellor',
					foreignField: '_id',
					as: 'counselorInfo'
				}
			},
			{
				$unwind: {
					path: '$counselorInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			// Apply advanced filters
			{
				$match: {
					// Course type filter
					...(courseType && { 'courseInfo.courseType': { $regex: new RegExp(courseType, 'i') } }),
					// Multi-select filters
					...(projectsArray.length > 0 && { 'courseInfo.project': { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(verticalsArray.length > 0 && { 'courseInfo.vertical': { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(courseArray.length > 0 && { 'courseInfo._id': { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(centerArray.length > 0 && { 'centerInfo._id': { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(counselorArray.length > 0 && { counsellor: { $in: counselorArray.map(id => new mongoose.Types.ObjectId(id)) } })
				}
			},
			{
				$group: {
					_id: {
						counselorId: '$counsellor',
						counselorName: {
							$ifNull: [
								'$counselorInfo.name',
								{ $concat: ['Counselor-', { $substr: [{ $toString: '$counsellor' }, 0, 8] }] }
							]
						}
					},
					totalLeads: { $sum: 1 },
					untouchLeads: {
						$sum: {
							$cond: [
								{ $eq: ['$_leadStatus', untouchStatus ? untouchStatus._id : null] },
								1,
								0
							]
						}
					}
				}
			}
		]);

		// Aggregate statusLogs data for counselor performance
		const counselorMatrixData = await StatusLogs.aggregate([
			{
				$match: {
					...dateFilter,
				}
			},
			// First, group by appliedId to get the latest record for each applied course (deduplication)
			{
				$sort: { createdAt: -1 } // Sort by latest first
			},
			{
				$group: {
					_id: '$_appliedId',
					latestRecord: { $first: '$$ROOT' }
				}
			},
			{
				$replaceRoot: { newRoot: '$latestRecord' }
			},
			{
				$lookup: {
					from: 'appliedcourses',
					localField: '_appliedId',
					foreignField: '_id',
					as: 'appliedCourse'
				}
			},
			{
				$unwind: {
					path: '$appliedCourse',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'counsellor',
					foreignField: '_id',
					as: 'counselorInfo'
				}
			},
			{
				$lookup: {
					from: 'status',
					localField: '_statusId',
					foreignField: '_id',
					as: 'statusInfo'
				}
			},
			{
				$lookup: {
					from: 'status',
					localField: '_statusId',
					foreignField: '_id',
					as: 'statusWithSubStatus'
				}
			},
			{
				$lookup: {
					from: 'courses',
					localField: 'appliedCourse._course',
					foreignField: '_id',
					as: 'courseInfo'
				}
			},
			{
				$unwind: {
					path: '$courseInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'candidateprofiles',
					localField: 'appliedCourse._candidate',
					foreignField: '_id',
					as: 'candidateInfo'
				}
			},
			{
				$unwind: {
					path: '$candidateInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'centers',
					localField: 'appliedCourse._center',
					foreignField: '_id',
					as: 'centerInfo'
				}
			},
			{
				$unwind: {
					path: '$centerInfo',
					preserveNullAndEmptyArrays: true
				}
			},
			// Apply advanced filters
			{
				$match: {
					// Course type filter - use courseType field from courses schema
					...(courseType && { 'courseInfo.courseType': { $regex: new RegExp(courseType, 'i') } }),
					// Date filters - use dates from StatusLogs
					...(startDate && { createdAt: { $gte: new Date(startDate) } }),
					...(endDate && { createdAt: { $lte: new Date(endDate + 'T23:59:59.999Z') } }),
					// Multi-select filters
					...(projectsArray.length > 0 && { 'courseInfo.project': { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(verticalsArray.length > 0 && { 'courseInfo.vertical': { $in: verticalsArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(courseArray.length > 0 && { 'courseInfo._id': { $in: courseArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(centerArray.length > 0 && { 'centerInfo._id': { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) } }),
					...(counselorArray.length > 0 && { counsellor: { $in: counselorArray.map(id => new mongoose.Types.ObjectId(id)) } })
				}
			},
			{
				$group: {
					_id: {
						counselorId: '$counsellor',
						counselorName: {
							$ifNull: [
								{ $arrayElemAt: ['$counselorInfo.name', 0] },
								{ $concat: ['Counselor-', { $substr: [{ $toString: '$counsellor' }, 0, 8] }] }
							]
						},
						statusId: '$_statusId',
						statusTitle: {
							$ifNull: [
								{ $arrayElemAt: ['$statusInfo.title', 0] },
								'Unknown Status'
							]
						},
						subStatusId: '$_subStatusId',
						subStatusTitle: {
							$let: {
								vars: {
									statusDoc: { $arrayElemAt: ['$statusWithSubStatus', 0] },
									subStatusId: '$_subStatusId'
								},
								in: {
									$ifNull: [
										{
											$let: {
												vars: {
													subStatus: {
														$arrayElemAt: [
															{
																$filter: {
																	input: '$$statusDoc.substatuses',
																	cond: { $eq: ['$$this._id', '$$subStatusId'] }
																}
															},
															0
														]
													}
												},
												in: '$$subStatus.title'
											}
										},
										'Unknown SubStatus'
									]
								}
							}
						}
					},
					count: { $sum: 1 },
					// Count fields that are true (meaning they were set to true at some point)
					kycStage: { $sum: { $cond: ['$kycStage', 1, 0] } },
					kycApproved: { $sum: { $cond: ['$kycApproved', 1, 0] } },
					admissionStatus: { $sum: { $cond: ['$admissionStatus', 1, 0] } },
					batchAssigned: { $sum: { $cond: ['$batchAssigned', 1, 0] } },
					zeroPeriodAssigned: { $sum: { $cond: ['$zeroPeriodAssigned', 1, 0] } },
					batchFreezed: { $sum: { $cond: ['$batchFreezed', 1, 0] } },
					dropOut: { $sum: { $cond: ['$dropOut', 1, 0] } },
					appliedCourses: { $addToSet: '$_appliedId' }
				}
			},
			{
				$group: {
					_id: {
						counselorId: '$_id.counselorId',
						counselorName: '$_id.counselorName'
					},
					statuses: {
						$push: {
							statusId: '$_id.statusId',
							statusTitle: '$_id.statusTitle',
							subStatusId: '$_id.subStatusId',
							subStatusTitle: '$_id.subStatusTitle',
							count: '$count',
							kycStage: '$kycStage',
							kycApproved: '$kycApproved',
							admissionStatus: '$admissionStatus',
							batchAssigned: '$batchAssigned',
							zeroPeriodAssigned: '$zeroPeriodAssigned',
							batchFreezed: '$batchFreezed',
							dropOut: '$dropOut'
						}
					},
					totalLeads: { $sum: '$count' },
					totalKycStage: { $sum: '$kycStage' },
					totalKycApproved: { $sum: '$kycApproved' },
					totalAdmissions: { $sum: '$admissionStatus' },
					totalBatchAssigned: { $sum: '$batchAssigned' },
					totalZeroPeriodAssigned: { $sum: '$zeroPeriodAssigned' },
					totalBatchFreezed: { $sum: '$batchFreezed' },
					totalDropouts: { $sum: '$dropOut' },
					uniqueAppliedCourses: { $addToSet: { $toString: '$_appliedId' } }
				}
			},
			{
				$project: {
					_id: 0,
					counselorId: '$_id.counselorId',
					counselorName: '$_id.counselorName',
					statuses: 1,
					totalLeads: 1,
					totalKycStage: 1,
					totalKycApproved: 1,
					totalAdmissions: 1,
					totalBatchAssigned: 1,
					totalZeroPeriodAssigned: 1,
					totalBatchFreezed: 1,
					totalDropouts: 1,
					uniqueAppliedCourses: 1,
					conversionRate: {
						$cond: [
							{ $gt: ['$totalLeads', 0] },
							{ $multiply: [{ $divide: ['$totalAdmissions', '$totalLeads'] }, 100] },
							0
						]
					},
					dropoutRate: {
						$cond: [
							{ $gt: ['$totalLeads', 0] },
							{ $multiply: [{ $divide: ['$totalDropouts', '$totalLeads'] }, 100] },
							0
						]
					}
				}
			},
			{
				$sort: { counselorName: 1 }
			}
		]);

		// Create lookup maps for total leads and untouch leads
		const totalLeadsMap = {};
		const untouchLeadsMap = {};

		appliedCoursesLeads.forEach(item => {
			const counselorName = item._id.counselorName || 'Unknown';
			totalLeadsMap[counselorName] = item.totalLeads;
			untouchLeadsMap[counselorName] = item.untouchLeads || 0;
		});

		// Transform data to match frontend format - Counselor-wise with status and sub-status breakdowns
		const transformedData = {};

		counselorMatrixData.forEach(counselor => {
			const counselorName = counselor.counselorName || 'Unknown';
			const totalLeads = totalLeadsMap[counselorName] || 0;
			const untouchLeads = untouchLeadsMap[counselorName] || 0;

			// Initialize counselor data
			transformedData[counselorName] = {
				Leads: totalLeads, // Use total leads from AppliedCourses as 1st column
				Untouch: untouchLeads, // Add untouch leads count
				KYCDone: counselor.totalKycApproved,
				KYCStage: counselor.totalKycStage,
				Admissions: counselor.totalAdmissions,
				Dropouts: counselor.totalDropouts,
				BatchAssigned: counselor.totalBatchAssigned,
				BatchFreezed: counselor.totalBatchFreezed,
				ZeroPeriod: counselor.totalZeroPeriodAssigned,
				Paid: counselor.totalAdmissions, // Assuming admissions are paid
				Unpaid: totalLeads - counselor.totalAdmissions,
				ConversionRate: totalLeads > 0 ? parseFloat(((counselor.totalAdmissions / totalLeads) * 100).toFixed(1)) : 0,
				DropoutRate: totalLeads > 0 ? parseFloat(((counselor.totalDropouts / totalLeads) * 100).toFixed(1)) : 0
			};

			// Add status-wise data with sub-status breakdowns
			counselor.statuses.forEach(statusData => {
				const statusTitle = statusData.statusTitle || 'Unknown';
				const subStatusTitle = statusData.subStatusTitle || 'Unknown';

				// Initialize status if not exists
				if (!transformedData[counselorName][statusTitle]) {
					transformedData[counselorName][statusTitle] = {
						count: 0,
						substatuses: {}
					};
				}

				// Add to status count
				transformedData[counselorName][statusTitle].count += statusData.count;

				// Add to sub-status
				if (!transformedData[counselorName][statusTitle].substatuses[subStatusTitle]) {
					transformedData[counselorName][statusTitle].substatuses[subStatusTitle] = 0;
				}
				transformedData[counselorName][statusTitle].substatuses[subStatusTitle] += statusData.count;
			});
		});

		return res.json({
			status: true,
			message: 'Counselor Performance Matrix data fetched successfully',
			data: transformedData,
			summary: {
				totalCounselors: Object.keys(transformedData).length,
				totalLeads: Object.values(transformedData).reduce((sum, counselor) => sum + counselor.Leads, 0),
				totalAdmissions: Object.values(transformedData).reduce((sum, counselor) => sum + counselor.Admissions, 0),
				totalDropouts: Object.values(transformedData).reduce((sum, counselor) => sum + counselor.Dropouts, 0),
				averageConversionRate: Object.values(transformedData).reduce((sum, counselor) => sum + counselor.ConversionRate, 0) / Object.keys(transformedData).length || 0
			}
		});

	} catch (error) {
		console.error('Error fetching counselor performance matrix:', error);
		res.status(500).json({
			status: false,
			message: 'Error fetching counselor performance matrix data',
			error: error.message
		});
	}
});

router.delete('/delete-leads', async (req, res) => {
	try {
		const mobiles = req.body.mobiles;
		for (let mobile of mobiles) {
			// Ensure string type
			mobile = mobile.toString().trim();

			// Agar mobile "91" se start hota hai aur length > 10 hai
			if (mobile.startsWith("91") && mobile.length > 10) {
				mobile = mobile.substring(2); // Remove first 2 digits
			}

			// Agar mobile ki length abhi bhi 10 nahi hai to skip ya log kar do
			if (mobile.length !== 10) {
				continue;
			}

			// Delete User
			await User.deleteOne({ mobile });

			// Candidate find
			const candidate = await CandidateProfile.findOne({ mobile });

			if (candidate) {
				// AppliedCourses delete
				const applied = await AppliedCourses.deleteOne({ _candidate: candidate._id });


				// CandidateProfile delete
				await CandidateProfile.deleteOne({ _id: candidate._id });
			} else {
			}
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		res.json({ status: true, message: 'Leads deleted successfully' });
	} catch (error) {
		res.status(500).json({ status: false, message: 'Error deleting lead', error: error.message });
	}
});

router.post('/trainee/login', async (req, res) => {

	try {
		const { userInput, password } = req.body;

		console.log("req.body", req.body)
		const isMobile = /^\d{10}$/.test(userInput);
		const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput);

		let mobile;
		let email;
		let user;
		if (isMobile) {
			mobile = userInput;
			user = await User.findOne({ mobile: userInput, role: 4 });

		} else if (isEmail) {
			email = userInput;
			user = await User.findOne({ email: userInput, role: 4 });

		}

		if (!user) {
			return res.status(400).json({ status: false, error: "User not found" });
		}
		// console.log("user", user)

		const isMatch = await user.validPassword(password);
		if (!isMatch) {
			return res.status(400).json({ status: false, error: "Invalid password" });
		}
		// console.log("Is Match", isMatch)

		const token = await user.generateAuthToken();
		return res.status(200).json({ status: true, message: "Login successful", token, role: 4 });
		// console.log("Token" , token)

		// const isMatch = user.validPassword(password);
		// if (!isMatch) {
		//     return res.status(400).json({ status: false, error: "Invalid password" });
		// }
		// const token = await user.generateAuthToken();
		// return res.status(200).json({ status: true, message: "Login successful", token });

	} catch (err) {
		console.log('Error in POST /login:', err.message);
		return res.status(500).json({ status: false, error: err.message });
	}
})

router.post('/assigntrainerstocourse', isCollege, async (req, res) => {
	try {
		const { courseId, trainers } = req.body;
		const user = req.user;
		const collegeId = req.college._id;

		if (!courseId || !trainers) {
			return res.status(400).json({
				status: false,
				message: 'Course ID and trainers array are required'
			});
		}
		const course = await Courses.findOne({
			_id: courseId,
			college: collegeId
		});

		if (!course) {
			return res.status(404).json({
				status: false,
				message: 'Course not found'
			});
		}

		const trainee = await User.find({
			_id: { $in: trainers }, // array of trainers
			role: 4,
		});

		// console.log("trainee", trainee);

		course.trainers.push(...trainers);
		await course.save();

		return res.status(200).json({
			status: true,
			message: 'Trainers successfully assigned to the course'
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			status: false,
			message: 'Internal server error'
		});
	}
});

router.post('/assigntrainerstobatch', isCollege, async (req, res) => {

	try {
		const { batchId, trainers } = req.body
		const user = req.user;
		const collegeId = req.college._id;
		// console.log("req.body" , req.body)
		if (!batchId || !trainers) {
			return res.status(400).json({
				status: false,
				message: 'BatchId and trainers are required'
			})
		}

		const batch = await Batch.findOne({
			_id: batchId,
			college: collegeId
		})

		if (!batch) {
			return res.status(404).json({
				staus: false,
				message: 'Batch not found'
			})

		}
		const trainee = await User.find({
			_id: { $in: trainers },
			role: 4
		})
		batch.trainers.push(...trainers);
		await batch.save()

		return res.status(200).json({
			status: true,
			message: ' Trainers succesfully assign to the batch'
		})
	}
	catch (err) {
		comsole.log(err)
		return res.status({
			status: false,
			message: ''
		})
	}

})

router.get('/gettrainersbycourse', isTrainer, async (req, res) => {
	try {
		const { courseId } = req.query;
		const user = req.user;
		const collegeId = req.college._id;

		if (courseId) {
			const course = await Courses.findOne({ _id: courseId }).populate('trainers');

			if (!course) {
				return res.status(404).json({
					status: false,
					message: 'Course not found'
				});
			}

			return res.status(200).json({
				status: true,
				message: 'Trainers fetched successfully',
				data: [{
					_id: 'course-trainers',
					name: 'Course Trainers',
					assignedCourses: [{
						_id: course._id,
						name: course.name,
						image: course.image,
						description: course.description
					}]
				}]
			});
		}


		const courses = await Courses.find({
			college: collegeId,
			trainers: { $exists: true }
		}).select('trainers name _id image description');

		const trainerIds = [...new Set(
			courses.flatMap(course => course.trainers.map(id => id.toString()))
		)].map(id => new mongoose.Types.ObjectId(id));

		const trainers = await User.find({
			_id: { $in: trainerIds },
			role: 4
		}).select('name email mobile _id');


		const trainersWithCourses = trainers.map(trainer => {
			const assignedCourses = courses
				.filter(course => course.trainers.some(trainerId => trainerId.toString() === trainer._id.toString()))
				.map(course => ({
					_id: course._id,
					name: course.name,
					image: course.image,
					description: course.description
				}));

			return {
				_id: trainer._id,
				name: trainer.name,
				email: trainer.email,
				mobile: trainer.mobile,
				assignedCourses: assignedCourses
			};
		});

		return res.status(200).json({
			status: true,
			message: 'Trainers fetched successfully',
			data: trainersWithCourses,
			count: trainersWithCourses.length
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			status: false,
			message: 'Error while fetching trainers'
		});
	}
});

// router.get('/gettrainersbycourse', isTrainer , async(req, res)=>{
// 	try{
// 		const { courseId } = req.query;
// 		const user = req.user;
// 		const collegeId = req.college._id;
// console.log("courseId" , req.body)
// 		if (!courseId) {
// 			return res.status(400).json({
// 				status: false,
// 				message: "Course ID is required"
// 			});
// 		}
// 		console.log()
// 	}
// 	catch(err){
// 		console.log(err)
// 		return res.status.json({
// 			status: false,
// 			message: 'Errors while fetch trainers'			
// 		})
// 	}
// })

router.get('/getbatchesbytrainerandcourse', isTrainer, async (req, res) => {
	try {
		const { courseId } = req.query;
		const user = req.user;
		const collegeId = req.college._id;

		if (!courseId) {
			return res.status(400).json({
				status: false,
				message: 'Course ID is required'
			});
		}


		const batches = await Batch.find({
			courseId: courseId,
			college: collegeId,
			trainers: user._id
		})
			.populate('centerId', 'name address')
			.populate('trainers', 'name email mobile')
			.sort({ createdAt: -1 });


		const course = await Courses.findOne({ _id: courseId, college: collegeId })
			.select('name description image');

		if (!course) {
			return res.status(404).json({
				status: false,
				message: 'Course not found'
			});
		}

		return res.status(200).json({
			status: true,
			message: 'Batches fetched successfully',
			data: {
				course: course,
				batches: batches,
				totalBatches: batches.length
			}
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			status: false,
			message: 'Error while fetching batches'
		});
	}
});

router.get('/trainers', isTrainer, async (req, res) => {
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
router.post('/scheduledTimeTable', isTrainer, async (req, res) => {
	try {
		const { 
			batchId,
			batchName, 
			courseId,
			courseName, 
			subject, 
			date, 
			startTime, 
			endTime, 
			scheduleType, 
			weekTopics, 
			monthTopics, 
			title, 
			description,
			color,
			isRecurring,
			recurringType,
			recurringEndDate
		} = req.body;
		
		const trainerId = req.user._id;
		const collegeId = req.user.collegeId;

		console.log('Received schedule data:', req.body);
		if (!title || !subject || !date || !startTime || !endTime || !scheduleType) {
			return res.status(400).json({
				status: false,
				message: 'Title, subject, date, time, and schedule type are required'
			});
		}

		if (scheduleType === 'weekly' && (!weekTopics || Object.keys(weekTopics).length === 0)) {
			return res.status(400).json({
				status: false,
				message: 'Week topics are required for weekly schedule'
			});
		}

		if (scheduleType === 'monthly' && (!monthTopics || Object.keys(monthTopics).length === 0)) {
			return res.status(400).json({
				status: false,
				message: 'Month topics are required for monthly schedule'
			});
		}

		if (isRecurring && (!recurringType || !recurringEndDate)) {
			return res.status(400).json({
				status: false,
				message: 'Recurring type and end date are required for recurring sessions'
			});
		}

		const trainerTimeTable = new TrainerTimeTable({
			trainerId,
			collegeId,
			batchId,
			batchName,
			courseId,
			courseName,
			subject,
			date,
			startTime,
			endTime,
			scheduleType,
			title,
			description: description || '',
			color: color || '#3498db',
			isRecurring: isRecurring || false,
			recurringType: isRecurring ? recurringType : null,
			recurringEndDate: isRecurring ? recurringEndDate : null,
			createdBy: trainerId
		});

		if (scheduleType === 'weekly') {
			trainerTimeTable.weekTopics = weekTopics;
		} else if (scheduleType === 'monthly') {
			trainerTimeTable.monthTopics = monthTopics;
		}

		await trainerTimeTable.save();

		return res.status(200).json({
			status: true,
			message: 'Trainer time table created successfully',
			data: trainerTimeTable
		});

		
	}
	catch (err) {
		console.log('Error in POST /trainerTimeTable:', err.message);
		return res.status(500).json({
			status: false,
			message: "Internal server error",
			error: err.message
		});
	}
})
router.get('/trainerTimeTable', isTrainer, async (req, res) => {
	try {
		const user = req.user;
		const trainerId = req.user._id;
		if (!trainerId) {
			return res.status(400).json({
				status: false,
				message: 'trainer Id is required'
			})
		}
		const scheduledTimeTable = await TrainerTimeTable.find({
			trainerId: trainerId,
		}).populate('trainerId', 'name')

		return res.status(200).json({
			status: true,
			message: 'Timetable fetched successfully',
			data: scheduledTimeTable,
		});
	} catch (error) {
		console.error('Error fetching trainer timetable:', error);
		return res.status(500).json({
			status: false,
			message: 'Error fetching timetable',
			error: error.message
		});
	}
});

module.exports = router;