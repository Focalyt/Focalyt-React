const express = require("express");
const { ObjectId } = require("mongodb");
const uuid = require('uuid/v1');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require("path");
const { auth1, isAdmin, isCollege } = require("../../../helpers");
const moment = require("moment");
const { Courses, College, Country, Qualification, CourseSectors, AppliedCourses, Center } = require("../../models");
const Candidate = require("../../models/candidateProfile");
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
		if(!user){
			return res.json({
				status: false,
				message: "You are not authorized to access this page"
			})
		}


		const college = await College.findOne({
			'_concernPerson._id': user._id
		});
		if(!college){
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

			const courseName = body.name || 'unnamed';
			const bucketName = process.env.AWS_BUCKET_NAME;

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
				// If the first element is a string (ObjectId in string format), convert each element in the array to an ObjectId
				body.sectors = body.sectors.map(id => new mongoose.Types.ObjectId(id));
			}




			const bucketName = process.env.AWS_BUCKET_NAME;

			// Find existing course
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
				body.photos = photoUrls;
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
				body.videos = videoUrls;
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
				body.testimonialvideos = testimonialVideoUrls;
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
			

			if(typeof courseId === 'string' && mongoose.Types.ObjectId.isValid(courseId)){
				courseId = new mongoose.Types.ObjectId(courseId);
			}	

			if(typeof docsId === 'string' && mongoose.Types.ObjectId.isValid(docsId)){
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






module.exports = router;
