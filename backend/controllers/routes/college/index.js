const express = require("express");
const { isCollege, auth1, authenti } = require("../../../helpers");
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
const statusRoutes = require("./status");
const skillTestRoutes = require("./skillTest");
const careerObjectiveRoutes = require("../college/careerObjective");
const todoRoutes = require("./todo");
const smsRoutes = require("./sms");
const roleManagementRoutes = require("./roleManagement");
const coverLetterRoutes = require("./coverLetter");
const mockInterviewRoutes = require("./mockInterview");
const coursesRoutes = require("./courses");
const router = express.Router();
const moment = require('moment')
router.use("/todo", isCollege, todoRoutes);
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
			console.log('body data', req.body)

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

			console.log('query', query)

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
			console.log('college', college)

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
			console.log('recieved data', req.body)
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
						password
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
router.route("/appliedCandidates").get(async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;      // Default page 1
		const limit = parseInt(req.query.limit) || 50;   // Default limit 50
		const skip = (page - 1) * limit;

		const totalCount = await AppliedCourses.countDocuments();

		const appliedCourses = await AppliedCourses.find({
			kycStage: { $nin: [true] },
			kyc: { $nin: [true] },
			admissionDone: { $nin: [true] }
		})
			.populate({
				path: '_course',
				select: 'name description docsRequired', // Select the necessary fields
				populate: {
					path: 'sectors',
					select: 'name'
				}
			})
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

			


		const result = appliedCourses.map(doc => {
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
			const combinedDocs = requiredDocs.map(reqDoc => {
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

			// Count calculations
			let verifiedCount = 0;
			let RejectedCount = 0;
			let pendingVerificationCount = 0;
			let notUploadedCount = 0;

			combinedDocs.forEach(doc => {
				if (doc.status === "Verified") verifiedCount++;
				else if (doc.status === "Rejected") RejectedCount++;
				else if (doc.status === "Pending") pendingVerificationCount++;
				else if (doc.status === "Not Uploaded") notUploadedCount++;
			});

			const totalRequired = combinedDocs.length;
			const uploadedCount = combinedDocs.filter(doc => doc.status !== "Not Uploaded").length;
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
	console.log('User', req.user)
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
			).populate({ path: '_concernPerson' }); console.log(collegeUpdate)

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
						console.log(addCandidate)
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
			console.log(email, name, id);

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
router.post("/courses/add", async (req, res) => {
	try {
		const body = req.body;
		console.log("Incoming course data:", req.body);

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


		const verticals = await Vertical.find().sort({ createdAt: -1 });

		console.log(verticals)

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
		console.log("📥 Incoming vertical data:", formData);
		console.log("📥 Incoming user data:", user);

		// Default value handling
		const newVertical = new Vertical({
			name: formData.name,
			description: formData.description,
			status: formData.status !== undefined ? formData.status : true,
			createdBy: user._id,
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

		console.log("📝 Editing vertical:", verticalId);
		console.log("📦 Updated data:", formData);

		const updated = await Vertical.findByIdAndUpdate(
			verticalId,
			{
				name: formData.name,
				description: formData.description,
				status: formData.status
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

		console.log("🗑 Deleting vertical:", verticalId);

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


		// Basic validation
		if (!name || !vertical) {

			return res.status(400).json({ success: false, message: 'Name and verticalId are required.' });
		}
		// Create new project document
		const newProject = new Project({
			name,
			description,
			vertical,
			createdBy: user._id,
			status: status !== undefined ? status : 'active',
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




router.get('/list-projects', async (req, res) => {
	try {
		let filter = {};
		const vertical = req.query.vertical;

		if (vertical) {
			if (mongoose.Types.ObjectId.isValid(vertical)) {
				filter.vertical = new mongoose.Types.ObjectId(vertical);
			} else {
				// Agar vertical string ObjectId nahi hai, toh error ya empty filter kar sakte hain
				return res.status(400).json({ success: false, message: 'Invalid vertical id' });
			}
		}

		const projects = await Project.find(filter).sort({ createdAt: -1 });
		res.json({ success: true, data: projects });
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/list_all_projects', async (req, res) => {
	try {


		const projects = await Project.find({ status: 'active' }).sort({ createdAt: -1 });
		console.log('projects', projects)
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
		const { name, location, status, project } = req.body;
		const user = req.user; // agar aap authentication middleware laga rahe hain

		// Validation
		if (!name || !project) {
			return res.status(400).json({ success: false, message: 'Name and project are required.' });
		}

		// Ensure project is an array
		const projectArray = Array.isArray(project) ? project : [project];

		const newCenter = new Center({
			name,
			address: location,
			status: status || 'active',
			project: projectArray,
			createdBy: user ? user._id : null,
		});

		const savedCenter = await newCenter.save();

		res.status(201).json({ success: true, message: 'Center added successfully', data: savedCenter });
	} catch (error) {
		console.error('Error adding center:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});



router.put('/edit_center/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

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

router.put('/asign_center/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { projectId } = req.body; // extract projectId from body

		if (!projectId) {
			return res.status(400).json({ success: false, message: 'Project ID is required' });
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




router.get('/list-centers', async (req, res) => {
	try {
		const projectId = req.query.projectId;
		if (projectId) {
			if (!mongoose.Types.ObjectId.isValid(projectId)) {
				return res.status(400).json({ success: false, message: 'Invalid Project ID' });
			}
			const centers = await Center.find({ projects: new mongoose.Types.ObjectId(projectId) }).sort({ createdAt: -1 });
			console.log('centers', centers)
			return res.json({ success: true, data: centers });
		}
		else {
			const centers = await Center.find({ status: 'active' }).sort({ createdAt: -1 });
			console.log('centers', centers)
			return res.json({ success: true, data: centers });
		}


	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.get('/list_all_centers', async (req, res) => {
	try {


		const centers = await Center.find({ status: 'active' }).sort({ createdAt: -1 });
		console.log('centers', centers)

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
		console.log('api hitting')
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

		// If followup date and time is set or updated, log the change and update the followup
		if (followup && doc.followup?.toISOString() !== new Date(followup).toISOString()) {
			actionParts.push(`Followup updated to ${new Date(followup).toLocaleString()}`);
			doc.followupDate = new Date(followup); // Update followup date and time
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
		doc.logs.push({
			user: userId,
			action: actionParts.join('; '), // Combine all actions in one log message
			remarks: remarks || '' // Optional remarks in the log
		});

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
		console.log('centers', courses)

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
		console.log('req.params', req.params)
		if (!centerId || !projectId) {
			return res.status(400).json({ success: false, message: 'centerId and projectId are required.' });

		}
		const courses = await Courses.find(filter).sort({ createdAt: -1 });
		// Update the 'status' field based on the boolean value

		console.log('centers', courses)

		res.json({ success: true, data: courses });
	} catch (error) {
		console.error('Error fetching centers by project:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

//Batch APi

router.post('/add_batch', async (req, res) => {
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
			createdBy
		} = req.body;

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
			createdBy
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

router.put('/update/:id', async (req, res) => {
	try {
		const { id } = req.params; // Extract the ID from URL parameters
		const updatedData = req.body; // Get the data to update from the request body

		console.log('updatedData', updatedData)

		// Find the document by ID and update it with the provided data
		const updatedDocument = await AppliedCourses.findByIdAndUpdate(
			id,
			updatedData, // Dynamically pass the updated fields
			{ new: true, runValidators: true } // Return the updated document and validate the update
		);

		console.log('updatedDocument', updatedDocument)

		if (!updatedDocument) {
			return res.status(404).json({ success: false, message: 'Document not found' });
		}

		// Return the updated document as a response
		res.json({ success: true, data: updatedDocument });
	} catch (error) {
		console.error('Error updating document:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

//KYC Leads

router.route("/kycCandidates").get(async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;      // Default page 1
		const limit = parseInt(req.query.limit) || 50;   // Default limit 50
		const skip = (page - 1) * limit;



		const appliedCourses = await AppliedCourses.find({
			kycStage: { $in: [true] },
			admissionDone: { $nin: [true] }
		})
			.populate({
				path: '_course',
				select: 'name description docsRequired', // Select the necessary fields
				populate: {
					path: 'sectors',
					select: 'name'
				}
			})
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

		const totalCount = appliedCourses.length
		const pendingKycCount = await AppliedCourses.countDocuments({
			kycStage: { $in: [true] },
			kyc: { $in: [false] },

		});


		const result = appliedCourses.map(doc => {
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
			const combinedDocs = requiredDocs.map(reqDoc => {
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

			// Count calculations
			let verifiedCount = 0;
			let RejectedCount = 0;
			let pendingVerificationCount = 0;
			let notUploadedCount = 0;

			combinedDocs.forEach(doc => {
				if (doc.status === "Verified") verifiedCount++;
				else if (doc.status === "Rejected") RejectedCount++;
				else if (doc.status === "Pending") pendingVerificationCount++;
				else if (doc.status === "Not Uploaded") notUploadedCount++;
			});

			const totalRequired = combinedDocs.length;
			const uploadedCount = combinedDocs.filter(doc => doc.status !== "Not Uploaded").length;
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

		console.log('result', result)

		res.status(200).json({
			success: true,
			count: result.length,
			page,
			pendingKycCount,
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








module.exports = router;
