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



//b2b routes
const b2bRoutes = require("./b2b/b2b");
const statusB2bRoutes = require("./b2b/statusB2b");
const router = express.Router();
const moment = require('moment')

router.use("/b2b", isCollege, b2bRoutes);
router.use("/statusB2b", statusB2bRoutes);

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
		let teamMembers = await getAllTeamMembers(user._id);

		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const skip = (page - 1) * limit;

		// Extract ALL filter parameters from query
		const {
			name,
			courseType,
			status,
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

		if (counselorArray.length > 0) {
			teamMembers = counselorArray
		}




		let allFilteredResults = [];

		for (let member of teamMembers) {
			// Build aggregation pipeline
			let aggregationPipeline = [];

			if (typeof member === 'string') {
				member = new mongoose.Types.ObjectId(member)

			}


			// Base match stage
			let baseMatchStage = {
				kycStage: { $nin: [true] },
				kyc: { $nin: [true] },
				admissionDone: { $nin: [true] },
				$or: [
					{ registeredBy: member },
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
								member
							]
						}
					}
				]
			};

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
			if (status && status !== 'true') {
				baseMatchStage._leadStatus = new mongoose.Types.ObjectId(status);
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
									as: 'verticalData'
								}
							},
							{
								$lookup: {
									from: 'projects',
									localField: 'project',
									foreignField: '_id',
									as: 'projectData'  // ← Different name
								}
							},
							{
								$addFields: {
									projectInfo: { $arrayElemAt: ['$projectData', 0] },  // ← Single object
									// Keep original 'project' field as ObjectId
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

			// Apply additional filters based on populated data
			let additionalMatches = {};

			// Course type filter
			if (courseType) {
				additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(courseType, 'i') };
			}

			// Sector filter (multi-select)
			if (projectsArray.length > 0) {
				additionalMatches['_course.project'] = {
					$in: projectsArray.map(id => new mongoose.Types.ObjectId(id))
				};
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
				additionalMatches['_center._id'] = { $in: centerArray.map(id => new mongoose.Types.ObjectId(id)) };
			}


			// Name search filter
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

			// Add additional match stage if any filters are applied
			if (Object.keys(additionalMatches).length > 0) {
				aggregationPipeline.push({ $match: additionalMatches });
			}

			// Sort by creation date
			aggregationPipeline.push({
				$sort: { updatedAt: 1 }
			});

			// Execute aggregation
			const response = await AppliedCourses.aggregate(aggregationPipeline);

			// Add unique results to the main array
			response.forEach(doc => {
				if (!allFilteredResults.some(existingDoc => existingDoc._id.toString() === doc._id.toString())) {
					allFilteredResults.push(doc);
				}
			});
		}

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

		// Calculate CRM filter counts
		const crmFilterCounts = await calculateCrmFilterCounts(teamMembers, college._id, {
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
		const totalCount = results.length;
		const paginatedResult = results.slice(skip, skip + limit);


		res.status(200).json({
			success: true,
			count: paginatedResult.length,
			page,
			limit,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			data: paginatedResult,
			allData: results,
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

// Helper function to calculate CRM filter counts with applied filters
async function calculateCrmFilterCounts(teamMembers, collegeId, appliedFilters = {}) {
	const counts = { all: 0 };

	try {
		const allStatuses = await Status.find({}).select('_id title milestone');

		// Initialize counts for each status
		allStatuses.forEach(status => {
			counts[status._id.toString()] = {
				_id: status._id,
				name: status.title,
				milestone: status.milestone,
				count: 0
			};
		});

		for (let member of teamMembers) {
			// Build base aggregation pipeline
			let basePipeline = [];

			if (typeof member === 'string') {
				member = new mongoose.Types.ObjectId(member)
			}

			// Base match stage
			let baseMatchStage = {
				kycStage: { $nin: [true] },
				kyc: { $nin: [true] },
				admissionDone: { $nin: [true] },
				$or: [
					{ registeredBy: member },
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
								member
							]
						}
					}
				]
			};

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
									as: 'projectData'  // ← Changed from 'project' to 'projectData'
								}
							},
							{
								$addFields: {
									projectInfo: { $arrayElemAt: ['$projectData', 0] },  // ← Single object
									// Keep original 'project' field as ObjectId
									verticalInfo: { $arrayElemAt: ['$verticalData', 0] },
								}
							}
						]
					}
				},
				{ $unwind: '$_course' },
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
						from: 'users',
						localField: 'registeredBy',
						foreignField: '_id',
						as: 'registeredBy'
					}
				},
				{ $unwind: { path: '$registeredBy', preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: 'candidateprofiles',
						localField: '_candidate',
						foreignField: '_id',
						as: '_candidate'
					}
				},
				{ $unwind: { path: '$_candidate', preserveNullAndEmptyArrays: true } },

			);

			// Filter by college FIRST
			basePipeline.push({
				$match: {
					'_course.college': collegeId
				}
			});

			// Apply additional filters
			let additionalMatches = {};

			if (appliedFilters.courseType) {
				additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(appliedFilters.courseType, 'i') };
			}

			if (appliedFilters.projectsArray.length > 0) {
				additionalMatches['_course.project'] = {
					$in: appliedFilters.projectsArray.map(id => new mongoose.Types.ObjectId(id))
				};
			}

			if (appliedFilters.verticalsArray && appliedFilters.verticalsArray.length > 0) {
				additionalMatches['_course.vertical'] = { $in: appliedFilters.verticalsArray.map(id => new mongoose.Types.ObjectId(id)) };
			}

			if (appliedFilters.courseArray && appliedFilters.courseArray.length > 0) {
				additionalMatches['_course._id'] = { $in: appliedFilters.courseArray.map(id => new mongoose.Types.ObjectId(id)) };
			}

			if (appliedFilters.centerArray && appliedFilters.centerArray.length > 0) {
				additionalMatches['_center._id'] = { $in: appliedFilters.centerArray.map(id => new mongoose.Types.ObjectId(id)) };
			}



			if (appliedFilters.name && appliedFilters.name.trim()) {
				const searchRegex = new RegExp(appliedFilters.name.trim(), 'i');
				additionalMatches.$or = additionalMatches.$or ? [
					...additionalMatches.$or,
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
					{ '_candidate.email': searchRegex }
				] : [
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
					{ '_candidate.email': searchRegex }
				];
			}

			if (Object.keys(additionalMatches).length > 0) {
				basePipeline.push({ $match: additionalMatches });
			}

			// Get all leads count (without status filter)
			const allLeadsAggregation = await AppliedCourses.aggregate([
				...basePipeline,
				{ $count: "total" }
			]);

			const allLeadsCount = allLeadsAggregation[0]?.total || 0;
			counts.all += allLeadsCount;

			// Get status-wise counts with proper grouping
			const statusCountsAggregation = await AppliedCourses.aggregate([
				...basePipeline,
				// Add a stage to handle null leadStatus
				{
					$addFields: {
						leadStatusId: {
							$ifNull: ["$_leadStatus", null]
						}
					}
				},
				// Group by leadStatusId
				{
					$group: {
						_id: "$leadStatusId",
						count: { $sum: 1 }
					}
				}
			]);


			// Update counts
			statusCountsAggregation.forEach(statusGroup => {
				const statusId = statusGroup._id;
				const count = statusGroup.count;

				if (statusId) {
					const statusKey = statusId.toString();
					if (counts[statusKey]) {
						counts[statusKey].count += count;
					}
				} else {
					// Handle null status
					if (!counts['null']) {
						counts['null'] = {
							_id: null,
							name: 'No Status',
							milestone: null,
							count: 0
						};
					}
					counts['null'].count += count;
				}
			});
		}

		// Remove statuses with 0 count (optional)
		const finalCounts = {};
		Object.keys(counts).forEach(key => {
			if (key === 'all' || (counts[key].count && counts[key].count > 0)) {
				finalCounts[key] = counts[key];
			}
		});

		return finalCounts;

	} catch (error) {
		console.error('Error calculating CRM filter counts:', error);
		return { all: 0 };
	}
}

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
		let teamMembers = await getAllTeamMembers(user._id);

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

		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}


		let allFilteredResults = [];

		for (let member of teamMembers) {
			// Build aggregation pipeline
			let aggregationPipeline = [];

			if (typeof member === 'string') {
				member = new mongoose.Types.ObjectId(member);
			}

			// Base match stage
			let baseMatchStage = {
				kycStage: { $in: [true] },
				$or: [
					{ registeredBy: member },
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
								member
							]
						}
					}
				]
			};

			// Add KYC filter if specified
			if (kyc !== undefined && kyc !== '') {
				if (kyc === 'true' || kyc === true) {
					baseMatchStage.kyc = true;
				} else if (kyc === 'false' || kyc === false) {
					baseMatchStage.kyc = false;
				}
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
			if (status && status !== 'true') {
				baseMatchStage._leadStatus = new mongoose.Types.ObjectId(status);
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

			// Apply additional filters based on populated data
			let additionalMatches = {};

			// Course type filter
			if (courseType) {
				additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(courseType, 'i') };
			}

			// Sector filter (multi-select - using projects array)
			if (projectsArray.length > 0) {
				additionalMatches['_course.sectors._id'] = { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
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

			// Add additional match stage if any filters are applied
			if (Object.keys(additionalMatches).length > 0) {
				aggregationPipeline.push({ $match: additionalMatches });
			}

			// Sort by creation date
			aggregationPipeline.push({
				$sort: { createdAt: -1 }
			});

			// Execute aggregation
			const response = await AppliedCourses.aggregate(aggregationPipeline);

			// Add unique results to the main array
			response.forEach(doc => {
				if (!allFilteredResults.some(existingDoc => existingDoc._id.toString() === doc._id.toString())) {
					allFilteredResults.push(doc);
				}
			});
		}

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
			kyc,
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
		// First get all statuses from the database

		for (let member of teamMembers) {
			// Build base aggregation pipeline
			let basePipeline = [];

			if (typeof member === 'string') {
				member = new mongoose.Types.ObjectId(member);
			}

			// Base match stage for KYC candidates
			let baseMatchStage = {
				kycStage: { $in: [true] },
				$or: [
					{ registeredBy: member },
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
								member
							]
						}
					}
				]
			};

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

			// Apply additional filters
			let additionalMatches = {};

			if (appliedFilters.courseType) {
				additionalMatches['_course.courseFeeType'] = { $regex: new RegExp(appliedFilters.courseType, 'i') };
			}

			if (appliedFilters.projectsArray && appliedFilters.projectsArray.length > 0) {
				additionalMatches['_course.sectors._id'] = { $in: appliedFilters.projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
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
				const searchRegex = new RegExp(appliedFilters.name.trim(), 'i');
				additionalMatches.$or = additionalMatches.$or ? [
					...additionalMatches.$or,
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
					{ '_candidate.email': searchRegex }
				] : [
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
					{ '_candidate.email': searchRegex }
				];
			}

			if (Object.keys(additionalMatches).length > 0) {
				basePipeline.push({ $match: additionalMatches });
			}

			// Get all KYC leads count
			const allKycAggregation = await AppliedCourses.aggregate([
				...basePipeline,
				{ $count: "total" }
			]);

			const allKycCount = allKycAggregation[0]?.total || 0;
			counts.all += allKycCount;

			// Get KYC status counts
			const kycStatusAggregation = await AppliedCourses.aggregate([
				...basePipeline,
				{
					$group: {
						_id: "$kyc",
						count: { $sum: 1 }
					}
				}
			]);

			// Update KYC counts
			kycStatusAggregation.forEach(kycGroup => {
				if (kycGroup._id === true) {
					counts.doneKyc += kycGroup.count;
				} else {
					counts.pendingKyc += kycGroup.count;
				}
			});

			// Get status-wise counts
			const statusCountsAggregation = await AppliedCourses.aggregate([
				...basePipeline,
				{
					$addFields: {
						leadStatusId: {
							$ifNull: ["$_leadStatus", null]
						}
					}
				},
				{
					$group: {
						_id: "$leadStatusId",
						count: { $sum: 1 }
					}
				}
			]);


		}

		// Remove statuses with 0 count (optional)
		const finalCounts = {};
		Object.keys(counts).forEach(key => {
			if (key === 'all' || key === 'pendingKyc' || key === 'doneKyc') {
				finalCounts[key] = counts[key];
			}
		});


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
		let teamMembers = await getAllTeamMembers(user._id);
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
		if (counselorArray.length > 0) {
			teamMembers = counselorArray;
		}
		let allFilteredResults = [];
		for (let member of teamMembers) {
			let aggregationPipeline = [];
			if (typeof member === 'string') {
				member = new mongoose.Types.ObjectId(member);
			}
			let baseMatchStage = {
				admissionDone: { $in: [true] },
				$or: [
					{ registeredBy: member },
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
								member
							]
						}
					}
				]
			};
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
			}
			if (status === 'batchAssigned') {
				baseMatchStage.batch = { $ne: null };
				baseMatchStage.isZeroPeriodAssigned = { $in: [false] };
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
				additionalMatches['_course.sectors._id'] = { $in: projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
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
				const searchRegex = new RegExp(name.trim(), 'i');
				additionalMatches.$or = additionalMatches.$or ? [
					...additionalMatches.$or,
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
					{ '_candidate.email': searchRegex }
				] : [
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
					{ '_candidate.email': searchRegex }
				];
			}
			if (Object.keys(additionalMatches).length > 0) {
				aggregationPipeline.push({ $match: additionalMatches });
			}
			aggregationPipeline.push({ $sort: { createdAt: -1 } });
			const response = await AppliedCourses.aggregate(aggregationPipeline);
			response.forEach(doc => {
				if (!allFilteredResults.some(existingDoc => existingDoc._id.toString() === doc._id.toString())) {
					allFilteredResults.push(doc);
				}
			});
		}
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
		for (let member of teamMembers) {
			let basePipeline = [];
			if (typeof member === 'string') {
				member = new mongoose.Types.ObjectId(member);
			}
			let baseMatchStage = {
				admissionDone: { $in: [true] },
				$or: [
					{ registeredBy: member },
					{
						$expr: {
							$eq: [
								{ $arrayElemAt: ["$leadAssignment._counsellor", -1] },
								member
							]
						}
					}
				]
			};
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
				additionalMatches['_course.sectors._id'] = { $in: appliedFilters.projectsArray.map(id => new mongoose.Types.ObjectId(id)) };
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
				const searchRegex = new RegExp(appliedFilters.name.trim(), 'i');
				additionalMatches.$or = additionalMatches.$or ? [
					...additionalMatches.$or,
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
					{ '_candidate.email': searchRegex }
				] : [
					{ '_candidate.name': searchRegex },
					{ '_candidate.mobile': searchRegex },
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
				!doc.isZeroPeriodAssigned &&
				!doc.isBatchFreeze &&
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
		}
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
				_id: person._id._id,
				name: person._id.name
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
		if (typeof courseId !== 'string' || typeof centerId !== 'string') {
			courseId = new mongoose.Types.ObjectId(courseId);
			centerId = new mongoose.Types.ObjectId(centerId);
		}
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		const page = parseInt(req.query.page) || 1;      // Default page 1
		const limit = parseInt(req.query.limit) || 50;   // Default limit 50
		const skip = (page - 1) * limit;

		// Build query object
		let query = {
			admissionDone: { $in: [true] },
			_course: courseId,
			_center: centerId
		};

		// Add search filter
		if (req.query.search) {
			query.$or = [
				{ 'candidateName': { $regex: req.query.search, $options: 'i' } },
				{ 'candidateEmail': { $regex: req.query.search, $options: 'i' } },
				{ 'candidatePhone': { $regex: req.query.search, $options: 'i' } }
			];
		}

		// Add status filter
		if (req.query.status && req.query.status !== 'all') {

			if (req.query.status === "admission") {
				query.admissionDone = { $in: [true] };
				query.isZeroPeriodAssigned = { $in: [false] };
				query.isBatchFreeze = { $in: [false] };
				query.dropout = { $in: [false] };
			}
			if (req.query.status === "dropout") {
				query.dropout = { $in: [true] };
			}
			if (req.query.status === "zeroPeriod") {
				query.isZeroPeriodAssigned = true;
				query.isBatchFreeze = { $in: [false] };
				query.dropout = { $in: [false] };
			}
			if (req.query.status === "batchFreeze") {
				query.isBatchFreeze = { $in: [true] };
				query.dropout = { $in: [false] };
			}

		}

		// Add date range filters
		if (req.query.fromDate) {
			query.createdAt = { $gte: new Date(req.query.fromDate) };
		}
		if (req.query.toDate) {
			query.createdAt = { ...query.createdAt, $lte: new Date(req.query.toDate) };
		}

		// Add course type filter
		if (req.query.courseType) {
			query.courseType = req.query.courseType;
		}

		// Add lead status filter
		if (req.query.leadStatus) {
			query._leadStatus = req.query.leadStatus;
		}

		// Add sector filter
		if (req.query.sector) {
			query.sector = req.query.sector;
		}

		// Add created date range filters
		if (req.query.createdFromDate) {
			query.createdAt = { ...query.createdAt, $gte: new Date(req.query.createdFromDate) };
		}
		if (req.query.createdToDate) {
			query.createdAt = { ...query.createdAt, $lte: new Date(req.query.createdToDate) };
		}

		// Add modified date range filters
		if (req.query.modifiedFromDate) {
			query.updatedAt = { $gte: new Date(req.query.modifiedFromDate) };
		}
		if (req.query.modifiedToDate) {
			query.updatedAt = { ...query.updatedAt, $lte: new Date(req.query.modifiedToDate) };
		}

		// Add next action date range filters
		if (req.query.nextActionFromDate) {
			query.nextActionDate = { $gte: new Date(req.query.nextActionFromDate) };
		}
		if (req.query.nextActionToDate) {
			query.nextActionDate = { ...query.nextActionDate, $lte: new Date(req.query.nextActionToDate) };
		}

		// Calculate filter counts before applying pagination
		const calculateFilterCounts = async () => {
			// Base query without status filter for counting all statuses
			const baseQuery = {
				admissionDone: { $in: [true] },
				_course: courseId,
				_center: centerId
			};

			// Add search filter to base query
			if (req.query.search) {
				baseQuery.$or = [
					{ 'candidateName': { $regex: req.query.search, $options: 'i' } },
					{ 'candidateEmail': { $regex: req.query.search, $options: 'i' } },
					{ 'candidatePhone': { $regex: req.query.search, $options: 'i' } }
				];
			}

			// Add other filters to base query (excluding status)
			if (req.query.fromDate) {
				baseQuery.createdAt = { $gte: new Date(req.query.fromDate) };
			}
			if (req.query.toDate) {
				baseQuery.createdAt = { ...baseQuery.createdAt, $lte: new Date(req.query.toDate) };
			}
			if (req.query.courseType) {
				baseQuery.courseType = req.query.courseType;
			}
			if (req.query.leadStatus) {
				baseQuery._leadStatus = req.query.leadStatus;
			}
			if (req.query.sector) {
				baseQuery.sector = req.query.sector;
			}
			if (req.query.createdFromDate) {
				baseQuery.createdAt = { ...baseQuery.createdAt, $gte: new Date(req.query.createdFromDate) };
			}
			if (req.query.createdToDate) {
				baseQuery.createdAt = { ...baseQuery.createdAt, $lte: new Date(req.query.createdToDate) };
			}
			if (req.query.modifiedFromDate) {
				baseQuery.updatedAt = { $gte: new Date(req.query.modifiedFromDate) };
			}
			if (req.query.modifiedToDate) {
				baseQuery.updatedAt = { ...baseQuery.updatedAt, $lte: new Date(req.query.modifiedToDate) };
			}
			if (req.query.nextActionFromDate) {
				baseQuery.nextActionDate = { $gte: new Date(req.query.nextActionFromDate) };
			}
			if (req.query.nextActionToDate) {
				baseQuery.nextActionDate = { ...baseQuery.nextActionDate, $lte: new Date(req.query.nextActionToDate) };
			}


			// Get all records for this college (without pagination)
			const allAppliedCourses = await AppliedCourses.find(baseQuery)
				.populate({
					path: '_course',
					select: 'name description docsRequired college',
					populate: {
						path: 'sectors',
						select: 'name'
					}
				})
				.sort({ createdAt: -1 });

			const allFilteredAppliedCourses = allAppliedCourses.filter(doc => {
				return doc._course && String(doc._course.college) === String(college._id);
			});

			// Calculate counts for different statuses
			const counts = {
				all: allFilteredAppliedCourses.length,
				dropout: allFilteredAppliedCourses.filter(doc => doc.dropout === true).length,
				zeroPeriod: allFilteredAppliedCourses.filter(doc => (doc.isZeroPeriodAssigned === true && doc.isBatchFreeze === false && doc.dropout === false)).length,
				batchFreeze: allFilteredAppliedCourses.filter(doc => (doc.isBatchFreeze === true && doc.dropout === false)).length,
				admission: allFilteredAppliedCourses.filter(doc => (doc.admissionDone === true && doc.isZeroPeriodAssigned === false && doc.isBatchFreeze === false && doc.dropout === false)).length,
			};

			return counts;
		};

		const filterCounts = await calculateFilterCounts();

		const appliedCourses = await AppliedCourses.find(query)
			.populate({
				path: '_course',
				select: 'name description docsRequired college', // Select the necessary fields
				populate: {
					path: 'sectors',
					select: 'name'
				}
			})
			.populate('_center')
			.populate('batch')
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

router.post('/fix-counselor-names', async (req, res) => {
	try {
		//   const { counselors } = req.body;
		const college = await College.findById('684ff35edc197327bc92deca').populate('_concernPerson._id')
		const teams = college._concernPerson
		let counselors = []
		teams.forEach(team => {
			counselors.push({id:team._id._id, name:team._id.name})
		})
		console.log(counselors, 'counselors')
	
		// Validation
		if (!counselors || !Array.isArray(counselors) || counselors.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'counselors array is required and cannot be empty'
			});
		}

		// Validate counselor data
		for (let i = 0; i < counselors.length; i++) {
			const counselor = counselors[i];
			if (!counselor.id || !counselor.name) {
				return res.status(400).json({
					success: false,
					message: `counselors[${i}] must have both 'id' and 'name' fields`
				});
			}

			if (!mongoose.Types.ObjectId.isValid(counselor.id)) {
				return res.status(400).json({
					success: false,
					message: `counselors[${i}].id is not a valid ObjectId: ${counselor.id}`
				});
			}
		}

		console.log(`Starting counselor ID assignment for courses with names but missing IDs...`);

		// Create a map for quick lookup: counselorName -> counselorId
		const counselorNameMap = {};
		counselors.forEach(counselor => {
			counselorNameMap[counselor.name.toLowerCase().trim()] = counselor.id;
		});

		console.log('Counselor name mapping created:', Object.keys(counselorNameMap).length, 'entries');

		// Find applied courses where counsellor name exists but _counsellor ID is missing
		const appliedCourses = await AppliedCourses.find({
			'leadAssignment.0': { $exists: true }, // leadAssignment array exists and has at least one element
			'leadAssignment.counsellorName': { $exists: true, $ne: null, $ne: '' }, // counsellor name exists and is not empty
			$or: [
			  { 'leadAssignment._counsellor': { $exists: false } }, // _counsellor field doesn't exist
			  { 'leadAssignment._counsellor': null }, // _counsellor is null
			]
		  });

		console.log(`Found ${appliedCourses.length} applied courses with counsellor names but missing IDs`);

		let totalProcessed = 0;
		let totalAssigned = 0;
		let totalFailed = 0;
		const assignmentDetails = [];

		for (const appliedCourse of appliedCourses) {
			try {
				totalProcessed++;
				let hasUpdates = false;
				const courseAssignments = [];

				// Check each assignment in the leadAssignment array
				for (let i = 0; i < appliedCourse.leadAssignment.length; i++) {
					const assignment = appliedCourse.leadAssignment[i];

					// Check if assignment has counsellor name but missing _counsellor ID
					if (assignment.counsellorName &&
						assignment.counsellorName.trim() !== '' &&
						(!assignment._counsellor || assignment._counsellor === null)) {

						const counsellorName = assignment.counsellorName.toLowerCase().trim();

						// Find matching counselor ID from provided list
						if (counselorNameMap[counsellorName]) {
							const counselorId = counselorNameMap[counsellorName];
							console.log(counselorId, 'counselorId')

							// Assign the _counsellor ID
							assignment._counsellor = new mongoose.Types.ObjectId(counselorId);
							hasUpdates = true;

							courseAssignments.push({
								assignmentIndex: i,
								counsellorName: assignment.counsellorName,
								assignedCounselorId: counselorId,
								action: 'ID_assigned'
							});

							console.log(`Assigned ID to ${appliedCourse._id}: ${assignment.counsellorName} -> ${counselorId}`);
						} else {
							courseAssignments.push({
								assignmentIndex: i,
								counsellorName: assignment.counsellorName,
								action: 'no_match_found',
								error: 'No matching counselor found in provided list'
							});
							console.log(`No match found for: ${assignment.counsellorName} in ${appliedCourse._id}`);
						}
					}
				}

				// Save if there are updates
				if (hasUpdates) {
					await appliedCourse.save();
					totalAssigned++;

					assignmentDetails.push({
						appliedCourseId: appliedCourse._id,
						assignments: courseAssignments
					});
				}

			} catch (error) {
				console.error(`Error processing ${appliedCourse._id}:`, error.message);
				totalFailed++;
			}
		}

		console.log('Counselor assignment completed');

		// Response with summary
		res.status(200).json({
			success: true,
			message: `Counselor assignment completed successfully!`,
			data: {
				providedCounselors: counselors.length,
				totalProcessed: totalProcessed,
				totalAssigned: totalAssigned,
				totalFailed: totalFailed,
				summary: `Assigned counselors to ${totalAssigned} out of ${totalProcessed} unassigned courses. ${totalFailed} failed.`,
				assignmentDetails: assignmentDetails.slice(0, 10) // Show first 10 assignments for reference
			}
		});

	} catch (error) {
		console.error('Error in counselor assignment:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
});








module.exports = router;
