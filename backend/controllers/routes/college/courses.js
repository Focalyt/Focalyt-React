const express = require("express");
const { ObjectId } = require("mongodb");
const uuid = require('uuid/v1');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require("path");
const { auth1, isAdmin, isCollege } = require("../../../helpers");
const { resolveB2cProjectIds } = require("../../../helpers/b2cAccess");
const moment = require("moment");
const { Courses, College, Country, User, Qualification, CourseSectors, AppliedCourses, Center, Source } = require("../../models");
const Candidate = require("../../models/candidateProfile");
const readXlsxFile = require("read-excel-file/node");
const CandidateVisitCalender = require("../../models/candidateVisitCalender");
const candidateServices = require('../services/candidate')
const { candidateCashbackEventName } = require('../../db/constant');
const router = express.Router();
// router.use(isAdmin);

const multer = require('multer');
const {
	bucketName,
	authKey,
	msg91WelcomeTemplate,
} = require("../../../config");

const s3 = require("../../../helpers/objectStorage");
const { normalizeStorageKey } = require('../../../helpers/s3Storage');
const { buildCourseDocumentKey } = require('../../../helpers/storagePaths');
const { normalizeCourseStructure } = require('../../../helpers/courseStructure');
const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const allowedDocumentExtensions = ['pdf', 'doc', 'docx']; // ✅ PDF aur DOC types allow karein

const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, ...allowedDocumentExtensions];
const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');

if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const B2C_BULK_HEADER_MAP = {
	name: 'name',
	candidatename: 'name',
	fullname: 'name',
	studentname: 'name',
	leadname: 'name',
	mobile: 'mobile',
	mobilenumber: 'mobile',
	phone: 'mobile',
	phonenumber: 'mobile',
	contact: 'mobile',
	contactnumber: 'mobile',
	email: 'email',
	emailaddress: 'email',
	mail: 'email',
	whatsapp: 'whatsapp',
	whatsappnumber: 'whatsapp',
	wa: 'whatsapp',
	address: 'address',
	fulladdress: 'address',
	currentaddress: 'address',
	dateofbirth: 'dob',
	dob: 'dob',
	birthdate: 'dob',
	birthday: 'dob',
	gender: 'gender',
	sex: 'gender',
};

const normalizeB2cHeaderKey = (header) =>
	String(header || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

const normalizeB2cPhone = (value) => {
	if (value === null || value === undefined || value === '') return '';
	let raw = value;
	if (typeof raw === 'number') {
		raw = (raw >= 1e9 || raw < -1e9) ? raw.toFixed(0) : String(raw);
		raw = raw.replace(/\.0+$/, '').replace('.', '');
	} else {
		raw = String(raw).trim();
		if (/[eE][+\-]/.test(raw)) {
			const num = parseFloat(raw);
			if (!Number.isNaN(num)) raw = num.toFixed(0);
		}
	}
	let digits = String(raw).replace(/\D/g, '');
	if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
	if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
	return digits;
};

const normalizeB2cGender = (value) => {
	const raw = String(value || '').trim().toLowerCase();
	if (['male', 'm', 'man', 'boy'].includes(raw)) return 'male';
	if (['female', 'f', 'woman', 'girl', 'w'].includes(raw)) return 'female';
	if (['other', 'o', 'others', 'prefernottosay'].includes(raw)) return 'other';
	return '';
};

const parseB2cExcelDob = (value) => {
	if (value === null || value === undefined || value === '') return null;
	let parsedDate = null;
	if (value instanceof Date) {
		parsedDate = value;
	} else if (
		typeof value === 'number' ||
		(
			!Number.isNaN(parseFloat(value)) &&
			parseFloat(value) > 0 &&
			parseFloat(value) < 100000 &&
			!String(value).includes('-') &&
			!String(value).includes('/')
		)
	) {
		const excelSerialNumber = typeof value === 'number' ? value : parseFloat(value);
		const excelEpoch = new Date(1899, 11, 30);
		parsedDate = new Date(excelEpoch.getTime() + excelSerialNumber * 24 * 60 * 60 * 1000);
	} else {
		const dobStr = String(value).trim();
		const ddmmyyyy = dobStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
		if (ddmmyyyy) {
			parsedDate = new Date(
				parseInt(ddmmyyyy[3], 10),
				parseInt(ddmmyyyy[2], 10) - 1,
				parseInt(ddmmyyyy[1], 10)
			);
		} else {
			const yyyymmdd = dobStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
			if (yyyymmdd) {
				parsedDate = new Date(
					parseInt(yyyymmdd[1], 10),
					parseInt(yyyymmdd[2], 10) - 1,
					parseInt(yyyymmdd[3], 10)
				);
			} else {
				parsedDate = new Date(dobStr);
			}
		}
	}
	if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;
	const year = parsedDate.getFullYear();
	const currentYear = new Date().getFullYear();
	if (year < 1950 || year > currentYear + 1) return null;
	return parsedDate;
};

const mapB2cExcelRows = (excelData) => {
	const headers = excelData[0] || [];
	const normalizedHeaders = headers.map((h) => (h ? String(h).trim() : ''));
	return excelData.slice(1).map((row) => {
		const obj = {};
		normalizedHeaders.forEach((header, index) => {
			if (!header) return;
			const normalizedKey = normalizeB2cHeaderKey(header);
			let mappedKey = B2C_BULK_HEADER_MAP[normalizedKey];
			if (!mappedKey) {
				for (const [key, value] of Object.entries(B2C_BULK_HEADER_MAP)) {
					if (normalizedKey.startsWith(key) || key.startsWith(normalizedKey)) {
						mappedKey = value;
						break;
					}
				}
			}
			if (!mappedKey) return;
			const value = row[index];
			if (value === null || value === undefined) return;
			if (mappedKey === 'mobile' || mappedKey === 'whatsapp') {
				const phone = normalizeB2cPhone(value);
				if (phone) obj[mappedKey] = phone;
				return;
			}
			if (mappedKey === 'gender') {
				const gender = normalizeB2cGender(value);
				if (gender) obj[mappedKey] = gender;
				return;
			}
			if (mappedKey === 'dob') {
				obj[mappedKey] = value;
				return;
			}
			const stringValue = String(value).trim();
			if (stringValue && stringValue !== 'undefined' && stringValue !== 'null') {
				obj[mappedKey] = stringValue;
			}
		});
		return obj;
	});
};

const resolveOptionalCoOwnerUser = async (rawValue, label) => {
	const coOwnerRaw = rawValue != null ? String(rawValue).trim() : '';
	if (!coOwnerRaw) return null;
	if (!mongoose.Types.ObjectId.isValid(coOwnerRaw)) {
		const err = new Error(`Invalid ${label} selected in the upload form. Please choose again.`);
		err.statusCode = 400;
		throw err;
	}
	const coOwnerUser = await User.findById(coOwnerRaw).select('_id').lean();
	if (!coOwnerUser) {
		const err = new Error(`${label} not found. Please choose again.`);
		err.statusCode = 400;
		throw err;
	}
	return coOwnerUser._id;
};

const storage = multer.diskStorage({
	destination,
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const basename = path.basename(file.originalname, ext);
		cb(null, `${basename}-${Date.now()}${ext}`);
	},
});

const upload = multer({ storage }).single('file');

const uploadFilesToS3 = async ({ files, folder, courseName, s3, bucketName, allowedExtensions }) => {
	if (!files) return [];

	const filesArray = Array.isArray(files) ? files : [files];
	const uploaded = [];

	const promises = filesArray.map((file) => {
		const ext = file.name.split('.').pop().trim().toLowerCase();

		if (!allowedExtensions.includes(ext)) {
			throw new Error(`Unsupported file format: ${ext}`);
		}
		const fileType = allowedImageExtensions.includes(ext)
			? 'image'
			: allowedVideoExtensions.includes(ext)
				? 'video'
				: allowedDocumentExtensions.includes(ext)
					? 'document'
					: null;
		const key = `upload/${folder}/${courseName}/${fileType}s/${uuid()}.${ext}`;

		const params = {
			Bucket: bucketName,
			Key: key,
			Body: file.data,
			ContentType: file.mimetype,
		};

		return s3.upload(params).promise().then(() => {
			uploaded.push(key);
		});
	});

	await Promise.all(promises);
	return uploaded;
};

const normalizeCourseMedia = (body) => {
	if (body.photos) body.photos = body.photos.map(normalizeStorageKey);
	if (body.videos) body.videos = body.videos.map(normalizeStorageKey);
	if (body.testimonialvideos) body.testimonialvideos = body.testimonialvideos.map(normalizeStorageKey);
	if (body.thumbnail) body.thumbnail = normalizeStorageKey(body.thumbnail);
	if (body.brochure) body.brochure = normalizeStorageKey(body.brochure);
	return body;
};

// Fields shown only when Course Fee Type is Paid (hidden for Free on addcoursecopy)
const PAID_ONLY_FIELDS = [
	'registrationCharges',
	'courseFee',
	'cutPrice',
	'examFee',
	'otherFee',
	'emiOptionAvailable',
	'maxEMITenure',
];

// Fields shown only when Course Type is course+job
const COURSE_JOB_ONLY_FIELDS = ['ojt', 'stipendDuringTraining'];

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

/**
 * Mirror addcoursecopy UI: hide/clear paid fields for Free, require EMI for Paid.
 */
const applyCourseFeeTypeRules = (body) => {
	const feeType = String(body.courseFeeType || '').trim();
	if (!['Paid', 'Free'].includes(feeType)) {
		const err = new Error('Course Fee Type is required and must be Paid or Free');
		err.statusCode = 400;
		throw err;
	}
	body.courseFeeType = feeType;

	if (feeType === 'Free') {
		PAID_ONLY_FIELDS.forEach((field) => {
			body[field] = '';
		});
	} else if (isBlank(body.emiOptionAvailable)) {
		const err = new Error('EMI Option Available is required for paid courses');
		err.statusCode = 400;
		throw err;
	}

	if (body.courseType !== 'coursejob') {
		COURSE_JOB_ONLY_FIELDS.forEach((field) => {
			body[field] = '';
		});
	} else if (isBlank(body.ojt)) {
		const err = new Error('OJT is required when Course Type is Course + Job');
		err.statusCode = 400;
		throw err;
	}

	return body;
};

router.route("/").get(async (req, res) => {

	try {

		let view = false
		let canEdit = false
		const user = req.user
		if (!user) {
			return res.json({
				status: false,
				message: "You are not authorized to access this page"
			})
		}


		const college = await College.findOne({
			'_concernPerson._id': user._id
		});
		if (!college) {
			return res.json({
				status: false,
				message: "College not found"
			})
		}

		const data = req.query;
		const fields = {
			isDeleted: false
		}
		if (data['name'] != '' && data.hasOwnProperty('name')) {
			fields["name"] = { "$regex": data['name'], "$options": "i" }
		}
		if (data.FromDate && data.ToDate) {
			let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate()
			let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
			fields["createdAt"] = {
				$gte: fdate,
				$lte: tdate
			}
		}

		if (req.query.status == undefined) {
			var status = true;
			var isChecked = "false";
		} else if (req.query.status.toString() == "true") {
			var status = true;
			var isChecked = "false";
		} else if (req.query.status.toString() == "false") {
			var status = false;
			var isChecked = "true";
		}
		fields["status"] = status;
		let courses;

		const courseQuery = {
			...fields,
			college: college._id
		};
		const linked = await resolveB2cProjectIds(user);
		if (linked.scoped) {
			if (!linked.projectObjectIds.length) {
				return res.json({
					view,
					courses: [],
					isChecked,
					data,
					canEdit,
					status
				});
			}
			courseQuery.project = { $in: linked.projectObjectIds };
		}

		courses = await Courses.find(courseQuery).populate("sectors");



		return res.json({

			view,
			courses,
			isChecked,
			data,
			canEdit,
			status
		});

	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router
	.route("/add")
	.get(async (req, res) => {
		try {
			const sectors = await CourseSectors.find({ status: true })
			const center = await Center.find({ status: true })

			return res.render(`${req.vPath}/College/Course`, {
				menu: 'addCourse',
				sectors,
				center
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { files } = req;
			let body = req.body;
			// console.log(body, 'body')

			const courseName = body.name || 'unnamed';
			const bucketName = process.env.AWS_BUCKET_NAME;

			if (body.trainingCenter?.length > 0) {
				body.center = JSON.parse(body.trainingCenter);
			}

			// Parse JSON fields
			body.docsRequired = JSON.parse(body.docsRequired || '[]');
			body.classResourcesRequired = JSON.parse(body.classResourcesRequired || '[]');
			body.labResourcesRequired = JSON.parse(body.labResourcesRequired || '[]');
			body.questionAnswers = JSON.parse(body.questionAnswers || '[]');
			body.courseStructure = normalizeCourseStructure(body.courseStructure);
			body.createdBy = JSON.parse(body.createdBy || '{}');

			// Upload files
			if (files?.photos) {
				const photoUrls = await uploadFilesToS3({
					files: files.photos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.photos = photoUrls;
			}

			if (files?.videos) {
				const videoUrls = await uploadFilesToS3({
					files: files.videos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.videos = videoUrls;
			}

			if (files?.testimonialvideos) {
				const testimonialVideoUrls = await uploadFilesToS3({
					files: files.testimonialvideos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.testimonialvideos = testimonialVideoUrls;
			}

			if (files?.thumbnail) {
				const [thumbnailUrl] = await uploadFilesToS3({
					files: files.thumbnail,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.thumbnail = thumbnailUrl;
			}

			if (files?.brochure) {
				const [brochureUrl] = await uploadFilesToS3({
					files: files.brochure,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedDocumentExtensions
				});
				body.brochure = brochureUrl;
			}
		if (typeof body.createdBy.id === 'string') {
			// Convert the string ID to an ObjectId
			body.createdBy = new mongoose.Types.ObjectId(body.createdBy.id); // Directly assign the ObjectId
		}

		// Convert the string ID to an ObjectId
		body.createdByType = 'college'

		// Parse sectors field - handle if it comes as array from FormData
		if (body.sectors) {
			if (typeof body.sectors === 'string') {
				try {
					body.sectors = JSON.parse(body.sectors);
				} catch (e) {
					body.sectors = body.sectors.replace(/[\[\]'"\s]/g, '').split(',').filter(id => id);
				}
			}
			if (Array.isArray(body.sectors)) {
				body.sectors = body.sectors.map(id => new mongoose.Types.ObjectId(id));
			}
		}

		// Parse center field - handle if it comes as array from FormData  
		if (body.center) {
			if (typeof body.center === 'string') {
				try {
					body.center = JSON.parse(body.center);
				} catch (e) {
					body.center = body.center.replace(/[\[\]'"\s]/g, '').split(',').filter(id => id);
				}
			}
			if (Array.isArray(body.center)) {
				body.center = body.center.map(id => new mongoose.Types.ObjectId(id));
			}
		}

		normalizeCourseMedia(body);

		// Save course
		const newCourse = await Courses.create(body);
			res.json({ status: true, message: "Record added!", data: newCourse });

		} catch (err) {
			console.error("Error in course upload:", err);
			res.status(400).json({ status: false, message: err.message || "Something went wrong!" });
		}

	});
	router
	.route("/addcoursecopy")
	.get(async (req, res) => {
		try {
			const sectors = await CourseSectors.find({ status: true })
			const center = await Center.find({ status: true })

			return res.render(`${req.vPath}/College/Course`, {
				menu: 'addCourse',
				sectors,
				center
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { files } = req;
			let body = req.body;

			const courseName = body.name || 'unnamed';
			const bucketName = process.env.AWS_BUCKET_NAME;

			if (body.trainingCenter?.length > 0) {
				body.center = JSON.parse(body.trainingCenter);
			}

			// Parse JSON fields
			body.docsRequired = JSON.parse(body.docsRequired || '[]');
			body.classResourcesRequired = JSON.parse(body.classResourcesRequired || '[]');
			body.labResourcesRequired = JSON.parse(body.labResourcesRequired || '[]');
			body.questionAnswers = JSON.parse(body.questionAnswers || '[]');
			body.courseStructure = normalizeCourseStructure(body.courseStructure);
			body.createdBy = JSON.parse(body.createdBy || '{}');

			if (files?.photos) {
				const photoUrls = await uploadFilesToS3({
					files: files.photos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.photos = photoUrls;
			}

			if (files?.videos) {
				const videoUrls = await uploadFilesToS3({
					files: files.videos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.videos = videoUrls;
			}

			if (files?.testimonialvideos) {
				const testimonialVideoUrls = await uploadFilesToS3({
					files: files.testimonialvideos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.testimonialvideos = testimonialVideoUrls;
			}

			if (files?.thumbnail) {
				const [thumbnailUrl] = await uploadFilesToS3({
					files: files.thumbnail,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.thumbnail = thumbnailUrl;
			}

			if (files?.brochure) {
				const [brochureUrl] = await uploadFilesToS3({
					files: files.brochure,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedDocumentExtensions
				});
				body.brochure = brochureUrl;
			}

			if (typeof body.createdBy.id === 'string') {
				body.createdBy = new mongoose.Types.ObjectId(body.createdBy.id);
			}

			body.createdByType = 'college';

			if (body.sectors) {
				if (typeof body.sectors === 'string') {
					try {
						body.sectors = JSON.parse(body.sectors);
					} catch (e) {
						body.sectors = body.sectors.replace(/[\[\]'"\s]/g, '').split(',').filter(id => id);
					}
				}
				if (Array.isArray(body.sectors)) {
					body.sectors = body.sectors.map(id => new mongoose.Types.ObjectId(id));
				}
			}

			if (body.center) {
				if (typeof body.center === 'string') {
					try {
						body.center = JSON.parse(body.center);
					} catch (e) {
						body.center = body.center.replace(/[\[\]'"\s]/g, '').split(',').filter(id => id);
					}
				}
				if (Array.isArray(body.center)) {
					body.center = body.center.map(id => new mongoose.Types.ObjectId(id));
				}
			}

			applyCourseFeeTypeRules(body);
			normalizeCourseMedia(body);

			const newCourse = await Courses.create(body);
			res.json({ status: true, message: "Record added!", data: newCourse });

		} catch (err) {
			console.error("Error in course upload:", err);
			res.status(400).json({ status: false, message: err.message || "Something went wrong!" });
		}

	});

	router
	.route("/listcoursecopy")
	.get(async (req, res) => {
		try {
			const view = true;
			const canEdit = true;
			const user = req.user;
			if (!user) {
				return res.json({
					status: false,
					message: "You are not authorized to access this page"
				});
			}

			const college = await College.findOne({
				'_concernPerson._id': user._id
			});
			if (!college) {
				return res.json({
					status: false,
					message: "College not found"
				});
			}

			const data = req.query;
			const fields = {
				isDeleted: false
			};
			if (data['name'] != '' && data.hasOwnProperty('name')) {
				fields["name"] = { "$regex": data['name'], "$options": "i" };
			}
			if (data.FromDate && data.ToDate) {
				let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate();
				let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate();
				fields["createdAt"] = {
					$gte: fdate,
					$lte: tdate
				};
			}

			let status = true;
			let isChecked = "false";
			if (req.query.status !== undefined && req.query.status.toString() === "false") {
				status = false;
				isChecked = "true";
			}
			fields["status"] = status;

			const courses = await Courses.find({
				...fields,
				college: college._id
			}).populate("sectors");

			return res.json({
				view,
				courses,
				isChecked,
				data,
				canEdit,
				status
			});
		} catch (err) {
			console.error("Error listing coursecopy:", err);
			return res.status(400).json({ status: false, message: err.message || "Something went wrong!" });
		}
	});

	router.put('/update_coursecopy_status/:courseId', async (req, res) => {
		try {
			const { courseId } = req.params;
			const course = await Courses.findOne({ _id: courseId });
			if (!course) {
				return res.status(404).json({ status: false, message: "Course not found" });
			}
			course.status = req.body.status;
			await course.save();
			return res.json({ status: true, message: "Course status updated!", data: course });
		} catch (err) {
			console.error("Error updating coursecopy status:", err);
			return res.status(400).json({ status: false, message: err.message || "Something went wrong!" });
		}
	});

	router.post('/:courseId/duplicatecoursecopy', async (req, res) => {
		try {
			const { courseId } = req.params;
			const course = await Courses.findById(courseId).lean();
			if (!course) {
				return res.status(404).json({ success: false, message: 'Course not found' });
			}

			const duplicateData = { ...course };
			delete duplicateData._id;
			delete duplicateData.createdAt;
			delete duplicateData.updatedAt;

			if (typeof duplicateData.name === 'string') {
				const copySuffix = ' (Copy)';
				if (!duplicateData.name.endsWith(copySuffix)) {
					duplicateData.name = `${duplicateData.name}${copySuffix}`;
				} else {
					duplicateData.name = `${duplicateData.name} ${Date.now()}`;
				}
			}

			const newCourse = await Courses.create(duplicateData);
			return res.status(201).json({ success: true, message: 'Course duplicated successfully', data: newCourse });
		} catch (err) {
			console.error('Failed to duplicate coursecopy:', err);
			return res.status(500).json({ success: false, message: 'Failed to duplicate course' });
		}
	});

	router
	.route("/editcoursecopy/:id")
	.get(async (req, res) => {
		try {
			const { id } = req.params;
			let course = await Courses.findById(id);
			if (!course) throw req.ykError("course not found!");
			const sectors = await CourseSectors.find({
				status: true, _id: {
					$nin: course.sectors
				}
			})
			const center = await Center.find({
				status: true, _id: {
					$nin: course.center
				}
			})
			course = await Courses.findById(id).populate('sectors').populate('center');
			course.docsRequired = (course.docsRequired || []).filter(doc => doc.status === true);
			course.classResourcesRequired = (course.classResourcesRequired || []).filter(doc => doc.status !== false);
			course.labResourcesRequired = (course.labResourcesRequired || []).filter(doc => doc.status !== false);

			return res.json({
				course,
				sectors,
				id,
				center,
				menu: 'course'
			})

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.put(async (req, res) => {
		try {
		const courseId = req.params.id;
		const { files } = req;
		let body = req.body;
		if (Array.isArray(body.sectors)) {
			body.sectors = body.sectors.map(id => new mongoose.Types.ObjectId(id));
		}
		
		if (body.center) {
			if (typeof body.center === 'string') {
				try {
					body.center = JSON.parse(body.center);
				} catch (e) {
					body.center = body.center.replace(/[\[\]'"\s]/g, '').split(',').filter(id => id);
				}
			}
			if (Array.isArray(body.center)) {
				body.center = body.center.map(id => new mongoose.Types.ObjectId(id));
			}
		}

			const bucketName = process.env.AWS_BUCKET_NAME;

			const existingCourse = await Courses.findById(courseId);
			if (!existingCourse) {
				return res.status(404).json({ status: false, message: "Course not found" });
			}

			if (Object.keys(body).length === 1 && body.status !== undefined) {
				existingCourse.status = body.status;
				await existingCourse.save();
				return res.json({ status: true, message: "Course status updated!", data: existingCourse });
			}

			const courseName = body.name || existingCourse.name || 'unnamed';

			if (body.docsRequired) {
				body.docsRequired = typeof body.docsRequired === 'string'
					? JSON.parse(body.docsRequired)
					: body.docsRequired;
			}
			if (body.classResourcesRequired) {
				body.classResourcesRequired = typeof body.classResourcesRequired === 'string'
					? JSON.parse(body.classResourcesRequired)
					: body.classResourcesRequired;
			}
			if (body.labResourcesRequired) {
				body.labResourcesRequired = typeof body.labResourcesRequired === 'string'
					? JSON.parse(body.labResourcesRequired)
					: body.labResourcesRequired;
			}
			if (body.questionAnswers) {
				body.questionAnswers = typeof body.questionAnswers === 'string'
					? JSON.parse(body.questionAnswers)
					: body.questionAnswers;
			}
			if (body.courseStructure !== undefined) {
				body.courseStructure = normalizeCourseStructure(body.courseStructure);
			}
			if (body.createdBy) {
				body.createdBy = typeof body.createdBy === 'string'
					? JSON.parse(body.createdBy)
					: body.createdBy;
				if (body.createdBy?.id && typeof body.createdBy.id === 'string') {
					body.createdBy = new mongoose.Types.ObjectId(body.createdBy.id);
				} else if (typeof body.createdBy === 'object' && !body.createdBy._bsontype) {
					delete body.createdBy;
				}
			}

			// Avoid CastError on Number fields when empty strings are sent from FormData
			['counslerphonenumber', 'counslerwhatsappnumber'].forEach((field) => {
				if (body[field] === '' || body[field] === null || body[field] === undefined) {
					delete body[field];
				}
			});
			if (body.addressInput !== undefined) {
				delete body.addressInput;
			}
			if (body.isContact !== undefined) {
				delete body.isContact;
			}

			if (files?.photos) {
				const photoUrls = await uploadFilesToS3({
					files: files.photos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.photos = [...(existingCourse.photos || []), ...photoUrls];
			} else {
				body.photos = existingCourse.photos;
			}

			if (files?.videos) {
				const videoUrls = await uploadFilesToS3({
					files: files.videos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.videos = [...(existingCourse.videos || []), ...videoUrls];
			} else {
				body.videos = existingCourse.videos;
			}

			if (files?.testimonialvideos) {
				const testimonialVideoUrls = await uploadFilesToS3({
					files: files.testimonialvideos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.testimonialvideos = [...(existingCourse.testimonialvideos || []), ...testimonialVideoUrls];
			} else {
				body.testimonialvideos = existingCourse.testimonialvideos;
			}

			if (files?.thumbnail) {
				const [thumbnailUrl] = await uploadFilesToS3({
					files: files.thumbnail,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.thumbnail = thumbnailUrl;
			} else {
				body.thumbnail = existingCourse.thumbnail;
			}

			if (files?.brochure) {
				const [brochureUrl] = await uploadFilesToS3({
					files: files.brochure,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedDocumentExtensions
				});
				body.brochure = brochureUrl;
			} else {
				body.brochure = existingCourse.brochure;
			}

			normalizeCourseMedia(body);

			applyCourseFeeTypeRules(body);

			const updatedCourse = await Courses.findByIdAndUpdate(courseId, body, { new: true, runValidators: true });

			res.json({ status: true, message: "Record updated!", data: updatedCourse });
		} catch (err) {
			console.error("Error in course update:", err);
			res.status(400).json({ status: false, message: err.message || "Something went wrong!" });
		}
	});
router.route("/changeStatus").patch(async (req, res) => {
	try {
		const updata = { $set: { status: req.body.status } };

		const data = await Courses.findByIdAndUpdate(req.body.id, updata);

		if (!data) {
			return res.status(500).send({
				status: false,
				message: "Can't update status of this course",
			});
		}

		return res.status(200).send({ status: true, data: data });
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.status(500).send({ status: false, message: err.message });
	}
});

router
	.route("/course-details/:id")
	.get(isCollege, async (req, res) => {
		try {
			const { id } = req.params;
			let course = await Courses.findById(id);
			if (!course) throw req.ykError("course not found!");


			course = await Courses.findById(id).populate('sectors').populate('center');
			course.docsRequired = course.docsRequired.filter(doc => doc.status === true);
			const highestQualification = await Qualification.find({ status: true })


			return res.status(200).json({
				status: true,
				course,

				highestQualification,
				menu: 'course'
			})

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})

router.patch('/:courseId/disable-doc/:docId', async (req, res) => {
	const { courseId, docId } = req.params;

	// console.log("courseId", courseId, "docId", docId)

	try {
		const course = await Courses.findOneAndUpdate(
			{ _id: courseId, 'docsRequired._id': docId },
			{ $set: { 'docsRequired.$.status': false } },
			{ new: true }
		);

		if (!course) {
			return res.status(404).json({ status: false, message: "Document or Course not found" });
		}

		res.status(200).json({ status: true, message: "Document disabled successfully", data: course });
	} catch (error) {
		console.error(error);
		res.status(500).json({ status: false, message: "Server Error" });
	}
});


router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			const { id } = req.params;
			let course = await Courses.findById(id);
			if (!course) throw req.ykError("course not found!");
			const sectors = await CourseSectors.find({
				status: true, _id: {
					$nin: course.sectors
				}
			})
			const center = await Center.find({
				status: true, _id: {
					$nin: course.center
				}
			})
			course = await Courses.findById(id).populate('sectors').populate('center');
			course.docsRequired = course.docsRequired.filter(doc => doc.status === true);;

			return res.json({
				course,
				sectors,
				id,
				center,
				menu: 'course'
			})

		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.put(async (req, res) => {
		try {
		const courseId = req.params.id;
		const { files } = req;
		let body = req.body;
		if (Array.isArray(body.sectors)) {
			body.sectors = body.sectors.map(id => new mongoose.Types.ObjectId(id));
		}
		
		if (body.center) {
			if (typeof body.center === 'string') {
				try {
					body.center = JSON.parse(body.center);
				} catch (e) {
					body.center = body.center.replace(/[\[\]'"\s]/g, '').split(',').filter(id => id);
				}
			}
			if (Array.isArray(body.center)) {
				body.center = body.center.map(id => new mongoose.Types.ObjectId(id));
			}
		}




			const bucketName = process.env.AWS_BUCKET_NAME;

			// Find existing course
			const existingCourse = await Courses.findById(courseId);
			if (!existingCourse) {
				return res.status(404).json({ status: false, message: "Course not found" });
			}
			// console.log(body, 'body 1');


			if (Object.keys(body).length === 1 && body.status !== undefined) {
				existingCourse.status = body.status;
				await existingCourse.save();
				return res.json({ status: true, message: "Course status updated!", data: existingCourse });
			}

			const courseName = body.name || existingCourse.name || 'unnamed';



			// Parse JSON fields (if present in body)
			if (body.docsRequired) {
				body.docsRequired = JSON.parse(body.docsRequired);
			}
			if (body.questionAnswers) {
				body.questionAnswers = JSON.parse(body.questionAnswers);
			}
			if (body.createdBy) {
				body.createdBy = JSON.parse(body.createdBy);
			}

			// Upload new files if provided, else keep old
			if (files?.photos) {
				const photoUrls = await uploadFilesToS3({
					files: files.photos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.photos = [...existingCourse.photos, ...photoUrls];
			} else {
				body.photos = existingCourse.photos;
			}

			if (files?.videos) {
				const videoUrls = await uploadFilesToS3({
					files: files.videos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.videos = [...existingCourse.videos, ...videoUrls];
			} else {
				body.videos = existingCourse.videos;
			}

			if (files?.testimonialvideos) {
				const testimonialVideoUrls = await uploadFilesToS3({
					files: files.testimonialvideos,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedVideoExtensions
				});
				body.testimonialvideos = [...existingCourse.testimonialvideos, ...testimonialVideoUrls];
			} else {
				body.testimonialvideos = existingCourse.testimonialvideos;
			}

			if (files?.thumbnail) {
				const [thumbnailUrl] = await uploadFilesToS3({
					files: files.thumbnail,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedImageExtensions
				});
				body.thumbnail = thumbnailUrl;
			} else {
				body.thumbnail = existingCourse.thumbnail;
			}

			if (files?.brochure) {
				const [brochureUrl] = await uploadFilesToS3({
					files: files.brochure,
					folder: 'Courses',
					courseName,
					s3,
					bucketName,
					allowedExtensions: allowedDocumentExtensions
				});
				body.brochure = brochureUrl;
			} else {
				body.brochure = existingCourse.brochure;
			}


			normalizeCourseMedia(body);

			// Update the course
			const updatedCourse = await Courses.findByIdAndUpdate(courseId, body, { new: true });

			res.json({ status: true, message: "Record updated!", data: updatedCourse });
		} catch (err) {
			console.error("Error in course update:", err);
			res.status(400).json({ status: false, message: err.message || "Something went wrong!" });
		}
	});
router.put('/remove_course_media/:courseId', async (req, res) => {
	try {
		const { courseId } = req.params;
		const { fileType, fileUrl } = req.body;
		const normalizedFileUrl = normalizeStorageKey(fileUrl);
		const course = await Courses.findById(courseId);
		// console.log(course, 'course');
		if (!course) {
			console.log('course not found');
			return res.status(404).json({ status: false, message: "Course not found" });
		}
		if (fileType === 'photo') {
			course.photos = course.photos.filter(photo => normalizeStorageKey(photo) !== normalizedFileUrl);
		}
		if (fileType === 'video') {
			course.videos = course.videos.filter(video => normalizeStorageKey(video) !== normalizedFileUrl);
		}
		if (fileType === 'testimonialvideo') {
			course.testimonialvideos = course.testimonialvideos.filter(testimonialvideo => normalizeStorageKey(testimonialvideo) !== normalizedFileUrl);
		}
		if (fileType === 'brochure') {
			course.brochure = '';
		}
		if (fileType === 'thumbnail') {
			course.thumbnail = '';
		}
		if (fileType === 'testimonial') {
			course.testimonialvideos = course.testimonialvideos.filter(testimonial => normalizeStorageKey(testimonial) !== normalizedFileUrl);
		}
		await course.save();
		return res.status(200).json({ status: true, message: `${fileType} removed successfully` });
	} catch (err) {
		console.error("Error removing media:", err);
		res.status(500).json({ status: false, message: err.message || "Something went wrong!" });
	}
})

router.put('/update_course_status/:courseId', async (req, res) => {
	try {
		const { courseId } = req.params;

		// Find the course by ID
		const course = await Courses.findOne({ _id: courseId });
		if (!course) {
			return res.status(404).json({ success: false, message: 'Course not found' });
		}
		// Toggle the course status
		let newStatus = course.status === true ? false : true;

		// Find the course and update its status
		const updatedCourse = await Courses.findByIdAndUpdate(
			courseId,
			{ status: newStatus }, // Set the new status
			{ new: true } // Return the updated document
		);

		if (!updatedCourse) {
			return res.status(404).json({ success: false, message: 'Course update failed' });
		}

		// Return the updated course data
		res.json({ success: true, data: updatedCourse });
	} catch (error) {
		console.error('Error updating course status:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/:courseId/duplicate', async (req, res) => {
	try {
		const { courseId } = req.params;
		const course = await Courses.findById(courseId).lean();

		if (!course) {
			return res.status(404).json({ success: false, message: 'Course not found' });
		}

		const duplicateData = { ...course };
		delete duplicateData._id;
		delete duplicateData.createdAt;
		delete duplicateData.updatedAt;

		if (typeof duplicateData.name === 'string') {
			const copySuffix = ' Copy';
			if (!duplicateData.name.endsWith(copySuffix)) {
				duplicateData.name = `${duplicateData.name}${copySuffix}`;
			} else {
				duplicateData.name = `${duplicateData.name} ${Date.now()}`;
			}
		}

		// Preserve arrays and string fields as-is
		const newCourse = await Courses.create(duplicateData);

		return res.status(201).json({ success: true, message: 'Course duplicated successfully', data: newCourse });
	} catch (error) {
		console.error('Error duplicating course:', error);
		return res.status(500).json({ success: false, message: 'Failed to duplicate course' });
	}
});

// add leads 
router.route('/:courseId/candidate/addleads')
	.get(async (req, res) => {

		try {
			let { courseId } = req.params
			const country = await Country.find({});
			const highestQualification = await Qualification.find({ status: true })

			if (typeof courseId === 'string' && mongoose.Types.ObjectId.isValid(courseId)) {
				courseId = new mongoose.Types.ObjectId(courseId);
			}
			let course = await Courses.findById(courseId).populate('center');


			res.render('admin/course/addleads', { menu: 'course', courseId, course, country, highestQualification });
		} catch (err) {
			console.log("Error rendering addleads page:", err);
			res.redirect('back');
		}
	});

router.route('/:courseId/candidate/upload-docs')
	.post(isCollege, async (req, res) => {
		try {
			let { docsName, courseId, docsId } = req.body;


			if (typeof courseId === 'string' && mongoose.Types.ObjectId.isValid(courseId)) {
				courseId = new mongoose.Types.ObjectId(courseId);
			}

			if (typeof docsId === 'string' && mongoose.Types.ObjectId.isValid(docsId)) {
				docsId = new mongoose.Types.ObjectId(docsId);
			}



			if (!mongoose.Types.ObjectId.isValid(docsId)) {
				return res.status(400).json({ error: "Invalid document ID format." });
			}

			const candidateMobile = req.body.mobile;

			if (!candidateMobile) {
				return res.status(400).json({ error: "mobile number required." });
			}

			const candidate = await Candidate.findOne({
				mobile: candidateMobile
			});


			const appliedCourse = await AppliedCourses.findOne({
				_candidate: candidate._id,
				_course: courseId
			}).populate({ path: '_course', select: 'name docsRequired' });

			if (!candidate) {
				return res.status(400).json({ error: "You have not applied for this course." });
			}

			const docName = appliedCourse?._course?.docsRequired?.find(d => d._id.toString() === docsId.toString())?.Name || docsName || 'Unknown Document';

			let files = req.files?.file;
			if (!files) {
				return res.status(400).send({ status: false, message: "No files uploaded" });
			}


			const filesArray = Array.isArray(files) ? files : [files];
			const uploadedFiles = [];
			const uploadPromises = [];
			const candidateId = candidate._id;

			filesArray.forEach((item) => {
				const { name, mimetype } = item;
				const ext = name?.split('.').pop().toLowerCase();


				if (!allowedExtensions.includes(ext)) {
					console.log("File type not supported")
					throw new Error(`File type not supported: ${ext}`);
				}

				let fileType = "document";
				if (allowedImageExtensions.includes(ext)) {
					fileType = "image";
				} else if (allowedVideoExtensions.includes(ext)) {
					fileType = "video";
				}

				const key = buildCourseDocumentKey({
					candidateName: candidate.name,
					candidateMobile: candidate.mobile,
					courseName: appliedCourse?._course?.name,
					docName,
					ext,
				});
				const params = {
					Bucket: bucketName,
					Key: key,
					Body: item.data,
					ContentType: mimetype,
				};

				uploadPromises.push(
					s3.upload(params).promise().then(() => {
						uploadedFiles.push({
							fileURL: key,
							fileType,
						});
					})
				);
			});

			await Promise.all(uploadPromises);

			const fileUrl = uploadedFiles[0].fileURL;

			appliedCourse.uploadedDocs.push({
				docsId: new mongoose.Types.ObjectId(docsId),
				fileUrl: fileUrl,
				status: "Pending",
				uploadedAt: new Date()
			});

			await appliedCourse.save();

			const existingCourseDoc = await Candidate.findOne({
				mobile: candidateMobile,
				"docsForCourses.courseId": courseId
			});

			if (existingCourseDoc) {
				const updatedCandidate = await Candidate.findOneAndUpdate(
					{ mobile: candidateMobile, "docsForCourses.courseId": courseId },
					{
						$push: {
							"docsForCourses.$.uploadedDocs": {
								docsId: new mongoose.Types.ObjectId(docsId),
								fileUrl: fileUrl,
								status: "Pending",
								uploadedAt: new Date()
							}
						}
					},
					{ new: true }
				);

				return res.status(200).json({
					status: true,
					message: "Document uploaded successfully",
					data: updatedCandidate
				});
			} else {
				const updatedCandidate = await Candidate.findOneAndUpdate(
					{ mobile: candidateMobile },
					{
						$push: {
							"docsForCourses": {
								courseId: new mongoose.Types.ObjectId(courseId),
								uploadedDocs: [{
									docsId: new mongoose.Types.ObjectId(docsId),
									fileUrl: fileUrl,
									status: "Pending",
									uploadedAt: new Date()
								}]
							}
						}
					},
					{ new: true }
				);

				return res.status(200).json({
					status: true,
					message: "Document uploaded successfully",
					data: updatedCandidate
				});
			}

		} catch (err) {
			console.log("Error rendering addleads page:", err);
			res.redirect('back');
		}
	});

router.route('/crm')
	.get(async (req, res) => {

		try {
			res.render(`admin/course/crm`, { menu: 'course' });
		} catch (err) {
			console.log("Error rendering addleads page:", err);
			res.redirect('back');
		}
	});

router.route('/leadStatus')
	.post(async (req, res) => {

		try {
			const user = req.session.user;
			const { appliedId } = req.body



			return res.status(200).json({
				status: true,
				message: "Status updated successfully"

			});
		} catch (err) {
			console.log("Error rendering addleads page:", err);
			res.redirect('back');
		}
	});


router.route('/get-branches')
	.get(async (req, res) => {
		try {
			const { courseId } = req.query;
			const branches = await Courses.findById(courseId).populate('center').select('center');

			// console.log("branches", branches)

			res.status(200).json({ status: true, data: branches.center });
		} catch (err) {
			console.log("Error rendering addleads page:", err);
			res.redirect('back');
		}
	});


router.put('/update-branch/:profileId', async (req, res) => {
	// console.log("api hitting....")
	try {
		const { profileId } = req.params;
		const { centerId } = req.body;
		// console.log("profileId", profileId)
		// console.log(req.body, 'req.body')
		// Find the course
		const appliedCourse = await AppliedCourses.findById(profileId);
		if (!appliedCourse) {
			return res.status(404).json({ success: false, message: 'Applied course not found' });
		}
		appliedCourse._center = centerId;
		const updatedAppliedCourse = await appliedCourse.save();

		// console.log("updatedAppliedCourse", updatedAppliedCourse)

		res.json({ success: true, data: updatedAppliedCourse });
	} catch (error) {
		console.error('Error updating center:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});


router.post('/addleadsb2c', isCollege, async (req, res) => {
	try {
		const user = req.user;
		// console.log("API hitting....");
		const { courseId, candidateData, centerId, counselorId, registeredBy, leadCoOwner, leadCoOwner2 } = req.body;

		const existingUser = await User.find({ mobile: candidateData.mobile, role: 3 });
		if (!existingUser) {
			const newUser = await User.create({
				role: 3,
				mobile: candidateData.mobile,
				name: candidateData.name,
				email: candidateData.email,
				status: true,
			});
		}
	
		// console.log("existingUser", existingUser)
		// console.log("centerId from req.body", req.body)
		const existingCandidate = await Candidate.findOne({ mobile: candidateData.mobile });
		if (existingCandidate) {
			return res.status(400).json({
				status: false,
				message: "Candidate already exists"
			});
		}

		const candidate = await Candidate.create(candidateData);
		// console.log("candidate", candidate)

		const counselor = await User.findById(counselorId);
		if (!counselor) {
			return res.status(404).json({
				status: false,
				message: "Counselor not found"
			});
		}

		const resolveOptionalCoOwner = async (rawValue, label) => {
			const coOwnerRaw = rawValue != null ? String(rawValue).trim() : '';
			if (!coOwnerRaw) return null;
			if (!mongoose.Types.ObjectId.isValid(coOwnerRaw)) {
				const err = new Error(`Invalid ${label}`);
				err.statusCode = 400;
				throw err;
			}
			const coOwnerUser = await User.findById(coOwnerRaw).select('_id').lean();
			if (!coOwnerUser) {
				const err = new Error(`${label} not found`);
				err.statusCode = 404;
				throw err;
			}
			return coOwnerUser._id;
		};

		let leadCoOwnerId = null;
		let leadCoOwner2Id = null;
		try {
			leadCoOwnerId = await resolveOptionalCoOwner(leadCoOwner, 'Lead co-owner 1');
			leadCoOwner2Id = await resolveOptionalCoOwner(leadCoOwner2, 'Lead co-owner 2');
		} catch (coOwnerErr) {
			return res.status(coOwnerErr.statusCode || 400).json({
				status: false,
				message: coOwnerErr.message || 'Invalid co-owner'
			});
		}

		const appliedCoursePayload = {
			_candidate: candidate._id,
			_course: courseId,
			_center: centerId,
			counsellor: counselorId,
			registeredBy: registeredBy,
			leadAssignment: [{
				_counsellor: counselorId,
				counsellorName: counselor.name,
				assignDate: new Date(),
				assignedBy: user._id
			}]
		};
		if (leadCoOwnerId) {
			appliedCoursePayload.leadCoOwner = leadCoOwnerId;
		}
		if (leadCoOwner2Id) {
			appliedCoursePayload.leadCoOwner2 = leadCoOwner2Id;
		}

		const appliedCourse = await AppliedCourses.create(appliedCoursePayload);

		// console.log("appliedCourse", appliedCourse)

		candidate.appliedCourses.push(appliedCourse._id);
		await candidate.save();

		res.status(200).json({
			status: true,
			message: "Lead added successfully",
			data: appliedCourse
		});


	} catch (err) {
		console.log("Error adding lead:", err);
		res.status(500).json({
			status: false,
			message: "Internal server error",
			error: err.message
		});
	}
});

// Bulk import B2C leads from Excel. Screen fields apply to every row.
router.post('/leads/import', isCollege, async (req, res) => {
	let filePath;
	try {
		const user = req.user;
		const courseId = req.body?.courseId ? String(req.body.courseId).trim() : '';
		const centerId = req.body?.centerId ? String(req.body.centerId).trim() : '';
		const counselorId = req.body?.counselorId ? String(req.body.counselorId).trim() : '';
		const registeredBy = req.body?.registeredBy ? String(req.body.registeredBy).trim() : '';
		const highestQualification = req.body?.highestQualification ? String(req.body.highestQualification).trim() : '';
		const bodyLeadCoOwner = req.body?.leadCoOwner ? String(req.body.leadCoOwner).trim() : '';
		const bodyLeadCoOwner2 = req.body?.leadCoOwner2 ? String(req.body.leadCoOwner2).trim() : '';

		if (!courseId || !centerId || !counselorId || !registeredBy || !highestQualification) {
			return res.status(400).json({
				status: false,
				message: 'Please select Course, Training Center, Counselor, Source, and Highest Qualification before importing.'
			});
		}

		const validIds = [courseId, centerId, counselorId, registeredBy, highestQualification];
		if (validIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
			return res.status(400).json({
				status: false,
				message: 'One or more selected fields are invalid. Please choose again.'
			});
		}

		const [course, center, counselor, source, qualification] = await Promise.all([
			Courses.findById(courseId).select('center name').lean(),
			Center.findById(centerId).select('_id name').lean(),
			User.findById(counselorId).select('_id name').lean(),
			Source.findById(registeredBy).select('_id name').lean(),
			Qualification.findById(highestQualification).select('_id name').lean(),
		]);

		if (!course) {
			return res.status(400).json({ status: false, message: 'Selected course was not found. Please choose again.' });
		}
		if (!center) {
			return res.status(400).json({ status: false, message: 'Selected training center was not found. Please choose again.' });
		}
		const courseCenterIds = (course.center || []).map((c) => String(c._id || c));
		if (courseCenterIds.length && !courseCenterIds.includes(String(centerId))) {
			return res.status(400).json({
				status: false,
				message: 'Selected training center does not belong to the selected course.'
			});
		}
		if (!counselor) {
			return res.status(400).json({ status: false, message: 'Selected counselor was not found. Please choose again.' });
		}
		if (!source) {
			return res.status(400).json({ status: false, message: 'Selected source was not found. Please choose again.' });
		}
		if (!qualification) {
			return res.status(400).json({ status: false, message: 'Selected highest qualification was not found. Please choose again.' });
		}

		let leadCoOwnerId = null;
		let leadCoOwner2Id = null;
		try {
			leadCoOwnerId = await resolveOptionalCoOwnerUser(bodyLeadCoOwner, 'Co-owner 1');
			leadCoOwner2Id = await resolveOptionalCoOwnerUser(bodyLeadCoOwner2, 'Co-owner 2');
		} catch (coOwnerErr) {
			return res.status(coOwnerErr.statusCode || 400).json({
				status: false,
				message: coOwnerErr.message || 'Invalid co-owner'
			});
		}

		let uploadedFile;
		let fileExtension;
		if (req.files && req.files.file) {
			uploadedFile = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
			fileExtension = path.extname(uploadedFile.name).toLowerCase();
			const tempFileName = `${path.basename(uploadedFile.name, fileExtension)}-${Date.now()}${fileExtension}`;
			filePath = path.join(destination, tempFileName);
			await new Promise((resolve, reject) => {
				uploadedFile.mv(filePath, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		} else if (req.file) {
			uploadedFile = req.file;
			filePath = req.file.path;
			fileExtension = path.extname(req.file.originalname).toLowerCase();
		} else {
			return res.status(400).json({
				status: false,
				message: 'Please upload a file'
			});
		}

		if (fileExtension !== '.xlsx' && fileExtension !== '.xls') {
			return res.status(400).json({
				status: false,
				message: 'Unsupported file format. Please upload an Excel file (.xlsx or .xls)'
			});
		}

		const excelData = await readXlsxFile(filePath);
		if (!excelData || excelData.length < 2) {
			return res.status(400).json({
				status: false,
				message: 'Excel file has no data rows. Please use the sample file and add leads.'
			});
		}

		let leads = mapB2cExcelRows(excelData).filter((row) => {
			if (!row || typeof row !== 'object') return false;
			const hasName = row.name != null && String(row.name).trim() !== '';
			const hasMobile = row.mobile != null && String(row.mobile).trim() !== '';
			return hasName || hasMobile;
		});

		if (!leads.length) {
			return res.status(400).json({
				status: false,
				message: 'No valid rows found. Required Excel columns: Name, Mobile, WhatsApp, Gender.'
			});
		}

		const phoneRegex = /^\d{10}$/;
		const normalizeEmail = (v) => String(v || '').trim().toLowerCase();
		const errors = [];
		const fileMobiles = [];
		const fileEmails = [];

		for (const row of leads) {
			const m = normalizeB2cPhone(row.mobile);
			if (m) fileMobiles.push(m);
			const e = normalizeEmail(row.email);
			if (e) fileEmails.push(e);
		}

		const existingMobileSet = new Set();
		const existingEmailSet = new Set();
		if (fileMobiles.length || fileEmails.length) {
			const mobileNumbers = fileMobiles.map((m) => Number(m)).filter((n) => !Number.isNaN(n));
			const existing = await Candidate.find({
				$or: [
					...(mobileNumbers.length ? [{ mobile: { $in: mobileNumbers } }] : []),
					...(fileEmails.length ? [{ email: { $in: fileEmails } }] : []),
				],
			})
				.select('mobile email')
				.lean();

			for (const doc of existing || []) {
				if (doc?.mobile != null) existingMobileSet.add(String(doc.mobile));
				if (doc?.email) existingEmailSet.add(normalizeEmail(doc.email));
			}
		}

		const seenMobileInFile = new Set();
		const seenEmailInFile = new Set();
		let insertedCount = 0;

		for (let i = 0; i < leads.length; i++) {
			const row = leads[i];
			const excelRow = i + 2;
			try {
				const name = row.name != null ? String(row.name).trim() : '';
				const cleanMobile = normalizeB2cPhone(row.mobile);
				const cleanWhatsapp = normalizeB2cPhone(row.whatsapp);
				const gender = normalizeB2cGender(row.gender);
				const email = normalizeEmail(row.email);
				const address = row.address != null ? String(row.address).trim() : '';

				if (!name || !cleanMobile || !cleanWhatsapp || !gender) {
					errors.push(`Row ${excelRow}: Missing required fields (Name, Mobile, WhatsApp, Gender are required)`);
					continue;
				}
				if (!phoneRegex.test(cleanMobile)) {
					errors.push(`Row ${excelRow}: Invalid mobile number format (should be 10 digits)`);
					continue;
				}
				if (!phoneRegex.test(cleanWhatsapp)) {
					errors.push(`Row ${excelRow}: Invalid WhatsApp number format (should be 10 digits)`);
					continue;
				}
				if (email && !/^\S+@\S+\.\S+$/.test(email)) {
					errors.push(`Row ${excelRow}: Invalid email address`);
					continue;
				}

				if (seenMobileInFile.has(cleanMobile)) {
					errors.push(`Row ${excelRow}: Mobile ${cleanMobile} is duplicate in the uploaded file`);
					continue;
				}
				seenMobileInFile.add(cleanMobile);

				if (email) {
					if (seenEmailInFile.has(email)) {
						errors.push(`Row ${excelRow}: Email ${email} is duplicate in the uploaded file`);
						continue;
					}
					seenEmailInFile.add(email);
				}

				if (existingMobileSet.has(cleanMobile)) {
					errors.push(`Row ${excelRow}: Mobile ${cleanMobile} already exists`);
					continue;
				}
				if (email && existingEmailSet.has(email)) {
					errors.push(`Row ${excelRow}: Email ${email} already exists`);
					continue;
				}

				const dob = parseB2cExcelDob(row.dob);

				try {
					const existingUser = await User.findOne({
						mobile: Number(cleanMobile),
						role: { $in: [3, '3'] },
					}).select('_id').lean();
					if (!existingUser) {
						await User.create({
							role: 3,
							mobile: Number(cleanMobile),
							name,
							email: email || undefined,
							status: true,
						});
					}
				} catch (userErr) {
					console.log(`B2C bulk upload: user create skipped for row ${excelRow}:`, userErr.message);
				}

				const candidateData = {
					name,
					mobile: Number(cleanMobile),
					whatsapp: Number(cleanWhatsapp),
					sex: gender,
					highestQualification,
					isImported: true,
					source: 'bulk_upload',
					personalInfo: {
						currentAddress: {
							type: 'Point',
							coordinates: [0, 0],
							fullAddress: address,
						},
					},
				};
				if (email) candidateData.email = email;
				if (dob) candidateData.dob = dob;

				const candidate = await Candidate.create(candidateData);

				try {
					const appliedCoursePayload = {
						_candidate: candidate._id,
						_course: courseId,
						_center: centerId,
						counsellor: counselorId,
						registeredBy,
						_leadStatus: new mongoose.Types.ObjectId('64ab1234abcd5678ef901234'),
						_leadSubStatus: new mongoose.Types.ObjectId('64ab1234abcd5678ef901235'),
						_aiLeadStatus: new mongoose.Types.ObjectId('64ab1234abcd5678ef901234'),
						_aiLeadSubStatus: new mongoose.Types.ObjectId('64ab1234abcd5678ef901235'),
						leadAssignment: [{
							_counsellor: counselorId,
							counsellorName: counselor.name,
							assignDate: new Date(),
							assignedBy: user._id,
						}],
					};
					if (leadCoOwnerId) appliedCoursePayload.leadCoOwner = leadCoOwnerId;
					if (leadCoOwner2Id) appliedCoursePayload.leadCoOwner2 = leadCoOwner2Id;

					const appliedCourse = await AppliedCourses.create(appliedCoursePayload);
					await Candidate.updateOne(
						{ _id: candidate._id },
						{
							$addToSet: { _appliedCourses: appliedCourse._id },
							$push: { appliedCourses: { courseId, centerId } },
						}
					);
				} catch (applyErr) {
					await Candidate.deleteOne({ _id: candidate._id });
					throw applyErr;
				}

				existingMobileSet.add(cleanMobile);
				if (email) existingEmailSet.add(email);
				insertedCount += 1;
			} catch (rowErr) {
				if (rowErr && rowErr.code === 11000) {
					errors.push(`Row ${excelRow}: Mobile already exists`);
					continue;
				}
				errors.push(`Row ${excelRow}: ${rowErr.message || 'Failed to import lead'}`);
			}
		}

		res.json({
			status: true,
			data: {
				inserted: insertedCount,
				errors: errors.length,
				errorDetails: errors,
			},
			message: `Import completed. ${insertedCount} leads imported successfully${errors.length > 0 ? `, ${errors.length} errors found` : ''}`,
		});
	} catch (error) {
		console.error('Error importing B2C leads:', error);
		res.status(500).json({
			status: false,
			message: 'Failed to import leads',
			error: error.message,
		});
	} finally {
		if (filePath && fs.existsSync(filePath)) {
			try {
				fs.unlinkSync(filePath);
			} catch (unlinkErr) {
				console.log('Error deleting B2C bulk upload temp file:', unlinkErr.message);
			}
		}
	}
});

router.get('/course_centers', async (req, res) => {
	try {
		const { courseId } = req.query;

		if (!courseId) {
			return res.status(400).json({
				status: false,
				message: "Course ID is required"
			});
		}

		const course = await Courses.findById(courseId).populate('center').select('center');

		if (!course) {
			return res.status(404).json({
				status: false,
				message: "Course not found"
			});
		}

		// console.log("course.center", course.center);
		res.status(200).json({
			status: true,
			data: course.center || []
		});
	} catch (err) {
		console.log("Error adding lead:", err);
	}
});

router.post('/candidate-visit-calendar', async (req, res) => {
	try {
		// console.log('req.body123')
		const { visitDate, visitType, appliedCourseId } = req.body;

		// console.log('req.body123', req.body)
		// console.log('visitType received:', visitType);

		if (!visitDate || !visitType || !appliedCourseId) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Validate visitType enum values
		const validVisitTypes = ['Visit', 'Joining', 'Both'];
		if (!validVisitTypes.includes(visitType)) {
			return res.status(400).json({
				error: `Invalid visitType: "${visitType}". Must be one of: ${validVisitTypes.join(', ')}. If you're sending a question answer, please map it correctly to the visitType field.`
			});
		}


		const newVisit = new CandidateVisitCalender({
			appliedCourse: appliedCourseId,
			visitDate: new Date(visitDate),
			visitType: visitType,
			createdBy: req.user._id,
			status: 'pending'
		});

		await newVisit.save();

		res.status(201).json({
			message: 'Visit scheduled successfully',
			visitId: newVisit._id
		});

	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});


//   router.get('/candidate-visit-calendar', async (req, res) => {
// 	try {
// 	  const { appliedCourseId } = req.query;

// 	  const visits = await CandidateVisitCalender.find({ 
// 		appliedCourse: appliedCourseId 
// 	  })
// 	  .populate('appliedCourse')
// 	  .populate('createdBy', 'name email')
// 	  .sort({ visitDate: 1 });

// 	  res.json({ status: true, data: visits });
// 	} catch (error) {
// 	  res.status(500).json({ error: 'Internal server error' });
// 	}
//   });

//   router.put('/candidate-visit-calendar/:visitId', async (req, res) => {
// 	try {
// 	  const { visitId } = req.params;
// 	  const { status, remarks } = req.body;

// 	  const visit = await CandidateVisitCalender.findByIdAndUpdate(
// 		visitId,
// 		{
// 		  status,
// 		  remarks,
// 		  updatedBy: req.user._id,
// 		  statusUpdatedAt: new Date()
// 		},
// 		{ new: true }
// 	  );

// 	  res.json({ status: true, data: visit });
// 	} catch (error) {
// 	  res.status(500).json({ error: 'Internal server error' });
// 	}
//   });

module.exports = router;
