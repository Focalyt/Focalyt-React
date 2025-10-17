const express = require("express");
const { ObjectId } = require("mongodb");
const uuid = require('uuid/v1');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require("path");
const { auth1, isAdmin, isCollege } = require("../../../helpers");
const moment = require("moment");
const { Courses, College, Country, User, Qualification, CourseSectors, AppliedCourses, Center } = require("../../models");
const Candidate = require("../../models/candidateProfile");
const CandidateVisitCalender = require("../../models/candidateVisitCalender");
const candidateServices = require('../services/candidate')
const { candidateCashbackEventName } = require('../../db/constant');
const router = express.Router();
// router.use(isAdmin);

const AWS = require("aws-sdk");
const multer = require('multer');
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

		return s3.upload(params).promise().then((result) => {
			uploaded.push(result.Location);
		});
	});

	await Promise.all(promises);
	return uploaded;
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

		courses = await Courses.find({
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
			body.questionAnswers = JSON.parse(body.questionAnswers || '[]');
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

		// Save course
		const newCourse = await Courses.create(body);
			res.json({ status: true, message: "Record added!", data: newCourse });

		} catch (err) {
			console.error("Error in course upload:", err);
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
		const course = await Courses.findById(courseId);
		// console.log(course, 'course');
		if (!course) {
			console.log('course not found');
			return res.status(404).json({ status: false, message: "Course not found" });
		}
		if (fileType === 'photo') {
			course.photos = course.photos.filter(photo => photo !== fileUrl);
		}
		if (fileType === 'video') {
			course.videos = course.videos.filter(video => video !== fileUrl);
		}
		if (fileType === 'testimonialvideo') {
			course.testimonialvideos = course.testimonialvideos.filter(testimonialvideo => testimonialvideo !== fileUrl);
		}
		if (fileType === 'brochure') {
			course.brochure = '';
		}
		if (fileType === 'thumbnail') {
			course.thumbnail = '';
		}
		if (fileType === 'testimonial') {
			course.testimonialvideos = course.testimonialvideos.filter(testimonial => testimonial !== fileUrl);
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
			});

			if (!candidate) {
				return res.status(400).json({ error: "You have not applied for this course." });
			}

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

				const key = `Documents for course/${courseId}/${candidateId}/${docsId}/${uuid()}.${ext}`;
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
		const { courseId, candidateData, centerId, counselorId, registeredBy } = req.body;

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
		const appliedCourse = await AppliedCourses.create({
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
		});

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
