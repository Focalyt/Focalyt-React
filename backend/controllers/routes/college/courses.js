const express = require("express");
const { ObjectId } = require("mongodb");
const uuid = require('uuid/v1');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require("path");
const { auth1, isAdmin } = require("../../../helpers");
const moment = require("moment");
const { Courses, Country, Qualification, CourseSectors, Candidate, AppliedCourses, Center } = require("../../models");
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
		console.log('file name', file.name)
		console.log('allowedExtensions', allowedExtensions)
		console.log('folder', folder)
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
		// ✅ Role 11 specific filtering
		if (user.role === 11) {
			const userDetails = req.session.user;
			let courseIds = userDetails.access.courseAccess.map(id => id.toString());
			let centerIds = userDetails.access.centerAccess.map(id => id.toString());

			const allCourses = await Courses.find(fields).populate("sectors");

			console.log("All courses before filter =>");
			allCourses.forEach(course => {
				console.log({
					courseId: course._id.toString(),
					centerId: course.center?.toString()
				});
			});


			let filteredCourses = allCourses.filter(course => {
				const courseId = course._id?.toString();
				const courseCenterIds = Array.isArray(course.center)
					? course.center.map(c => c.toString())
					: [];

				const hasMatchingCenter = courseCenterIds.some(cid => centerIds.includes(cid));
				const hasMatchingCourse = courseIds.includes(courseId);

				return hasMatchingCenter && hasMatchingCourse;
			});




			courses = filteredCourses;
		} else {
			courses = await Courses.find(fields).populate("sectors");
		}



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
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			console.log('edit api');
			const { id } = req.params;
			let course = await Courses.findById(id);
			console.log('course', course)
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




			console.log('body', body)
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





router
	.route("/edit/:id/add-doc")
	.patch(async (req, res) => {
		try {
			const { id } = req.params;
			const { Name } = req.body; // Example body: { "Name": "PAN Card" }

			if (!Name) return res.status(400).json({ message: 'Document Name is required' });

			const update = await Courses.findByIdAndUpdate(
				id,
				{ $push: { docsRequired: { Name } } }, // Push new doc object
				{ new: true }  // Return updated document
			);

			if (!update) return res.status(404).json({ message: 'Course not found' });

			res.status(200).json({ message: 'Document added successfully', data: update.docsRequired });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Internal Server Error' });
		}

	});
router.patch('/:courseId/disable-doc/:docId', async (req, res) => {
	const { courseId, docId } = req.params;

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




router.route("/getCourseViaSector").get(async (req, res) => {
	try {
		const { sectorId } = req.query;
		const courses = await Courses.find({
			sectors: {
				$in: [new mongoose.Types.ObjectId(sectorId)]
			},
			isDeleted: false
		});
		return res.status(200).json({ status: true, data: courses });
	} catch (error) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
})
router.route("/getCourseDetailById").get(async (req, res) => {
	try {
		const { courseId } = req.query;
		const courses = await Courses.findOne({
			_id: {
				$in: [new mongoose.Types.ObjectId(courseId)]
			},
			isDeleted: false
		});
		return res.status(200).json({ status: true, data: [courses] });
	} catch (error) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.route("/registrations")
	.get(auth1, async (req, res) => {
		try {
			const user = req.session.user

			let candidates;
			let count;
			let view = false;
			let data = req.query
			let perPage = 20
			let p = parseInt(req.query.page, 10);
			let page = p || 1;
			let totalPages

			let { value, order } = req.query
			let sorting = {};
			let numberCheck;
			let filter = {};

			// Parsing courseIds and centerIds
			let courseIds = [];
			let centerIds = [];

			
			
				if (req.session.user.role === 10) {
					view = true
				}

				numberCheck = isNaN(data?.name);
				if (data['name'] != '' && data.hasOwnProperty('name')) {
					const regex = new RegExp(data['name'], 'i');
					filter["name"] = regex;
				}
				if (data['name'] && !numberCheck) {
					filter["$or"] = [
						{ "name": { "$regex": data['name'], "$options": "i" } },
						{ "mobile": Number(data['mobile']) },
						{ "whatsapp": Number(data['whatsapp']) }
					];
				}

				count = await AppliedCourses.countDocuments(filter)

				if (value && order) {
					sorting[value] = Number(order)
				} else {
					sorting = { createdAt: -1 }
				};

				let agg = candidateServices.candidateCourseList(sorting, perPage, page, filter);
				candidates = await AppliedCourses.aggregate(agg);
				totalPages = Math.ceil(count / perPage);

			if (Array.isArray(candidates)) {

				for (let candidate of candidates) {
					const courseDocsRequired = candidate.docsRequired || [];

					const candidateDocSet = candidate.docsForCourses?.find(
						(d) => d.courseId.toString() === candidate.courseId.toString()
					);

					console.log('candidateDocSet', candidate.docsForCourses)

					let totalRequired = courseDocsRequired.length;
					let verified = 0;
					let pending = 0;
					let pendingForUpload = 0;

					if (candidateDocSet && Array.isArray(candidateDocSet.uploadedDocs)) {
						for (let reqDoc of courseDocsRequired) {
							const uploadedDoc = candidateDocSet.uploadedDocs.find(
								(doc) => doc.docsId.toString() === reqDoc._id.toString()
							);

							if (uploadedDoc) {
								if (uploadedDoc.status === "Verified") {
									verified++;
								} else if (uploadedDoc.status === "Pending") {
									pending++;
								}
							} else {
								pendingForUpload++;
							}
						}
					} else {
						// अगर uploadedDocs ही नहीं है तो सब pending माने
						pendingForUpload = totalRequired;
					}

					const uploaded = verified + pending;
					const percent = courseDocsRequired.length > 0
						? Math.round((uploaded / courseDocsRequired.length) * 100)
						: 0;
					// Candidate में result embed करो
					candidate.docProgress = {
						totalRequired,
						verified,
						pending,
						percent,
						pendingForUpload
					};
				}

			} else {
				console.error("❌ candidates is not an array:", candidates);
			}
			console.log("candidates", candidates)
			return res.render(`${req.vPath}/admin/course/registration`, {
				candidates,
				perPage,
				totalPages,
				page,
				count,
				data,
				menu: 'courseRegistrations',
				view,
				sortingValue: Object.keys(sorting),
				sortingOrder: Object.values(sorting),
			});
		} catch (err) {
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});
router.route("/:courseId/:candidateId/docsview")
	.get(auth1, async (req, res) => {
		try {
			const { candidateId } = req.params;
			const { courseId } = req.params;
			const candidate = await Candidate.findById(candidateId);

			if (!candidate) {
				console.log("You have not applied for this course.")
				res.redirect("/candidate/searchcourses");
			};
			const course = await Courses.findById(courseId);
			let docsRequired = null
			if (course) {
				docsRequired = course.docsRequired; // requireDocs array fetch ho jayega

			} else {
				console.log("Course not found");
			};

			let uploadedDocs = [];
			if (candidate.docsForCourses && candidate.docsForCourses.length > 0) {
				const courseEntry = candidate.docsForCourses.find(
					entry => entry.courseId.toString() === courseId.toString()
				);
				if (courseEntry && courseEntry.uploadedDocs) {
					uploadedDocs = courseEntry.uploadedDocs;
				}
			}
			let mergedDocs = [];

			if (course && course.docsRequired) {
				docsRequired = course.docsRequired;

				// Create a merged array with both required docs and uploaded docs info
				mergedDocs = docsRequired.map(reqDoc => {
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



			// ✅ Fix: Use candidate.docsForCourses instead of undefined docsForCourses
			const countDocsByCourseId = (docsForCourses, targetCourseId) => {
				const courseEntry = docsForCourses.find(course => course.courseId.toString() === targetCourseId.toString());

				let courseDocCount = 0;
				let pendingCount = 0;
				let rejectedCount = 0;
				let approvedCount = 0;

				if (courseEntry && courseEntry.uploadedDocs) {
					courseDocCount = courseEntry.uploadedDocs.length;
					approvedCount = courseEntry.uploadedDocs.filter(doc => doc.status === "Verified").length;
					pendingCount = courseEntry.uploadedDocs.filter(doc => doc.status === "Pending").length;
					rejectedCount = courseEntry.uploadedDocs.filter(doc => doc.status === "Rejected").length;
				}

				return {
					totalDocs: courseDocCount,
					pendingDocs: pendingCount,
					rejectedDocs: rejectedCount,
					verifiedDocs: approvedCount
				};
			};

			// ✅ Fix Applied: Use candidate.docsForCourses
			const courseWiseDocumentCounts = countDocsByCourseId(candidate.docsForCourses || [], courseId);


			return res.render(`${req.vPath}/admin/course/listview`, {
				menu: 'listview',
				mergedDocs,
				courseWiseDocumentCounts,
				candidate, course, courseId
			});
		} catch (err) {
			console.log("Error:", err);
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}


	})
	.put(async (req, res) => {
		try {
			const { candidateId, courseId, objectId, status, reason } = req.body;

			const verifiedBy = req.session?.user?._id; // Fetch logged-in user ID from session
			console.log(verifiedBy)
			if (!verifiedBy) {
				return console.log("message:", "Missing verifiedBy fields");
			}
			console.log("body data", req.body);

			if (!candidateId || !courseId || !objectId || !status) {
				return res.status(400).json({ message: "Missing required fields" });
			}

			if (status === "Rejected" && !reason) {
				return res.status(400).json({ message: "Rejection reason is required when status is 'Rejected'" });
			}

			// 🔍 Step 1: Find the candidate
			const candidate = await Candidate.findById(candidateId);
			if (!candidate) {
				return res.status(404).json({ message: "Candidate not found" });
			}

			// 🔍 Step 2: Find the course inside `docsForCourses`
			const course = candidate.docsForCourses.find(course => course.courseId.toString() === courseId);
			if (!course) {
				return res.status(404).json({ message: "Course not found in candidate's docsForCourses" });
			}

			// 🔍 Step 3: Find the document inside `uploadedDocs` using `_id`
			const document = course.uploadedDocs.find(doc => doc._id.toString() === objectId);
			if (!document) {
				return res.status(404).json({ message: "Document not found in uploadedDocs" });
			}

			// ✅ Step 4: Update the document fields
			document.status = status;
			document.verifiedBy = verifiedBy || null; // Set verifiedBy from session or null
			document.verifiedDate = new Date(); // Update timestamp

			if (status === "Rejected") {
				document.reason = reason; // Set rejection reason if status is "Rejected"
			} else {
				document.reason = undefined; // Clear reason for other statuses
			}

			// ✅ Step 5: Save the updated candidate document
			await candidate.save();

			return res.status(200).json({
				message: `Document status updated successfully to ${status}`,
				updatedDocument: document
			});

		} catch (error) {
			console.error("Error updating document status:", error);
			return res.status(500).json({ message: "Internal server error", error });
		}
	})


router.route("/assignCourses/:id")
	.put(async (req, res) => {
		try {
			const { id } = req.params;
			const { url, remarks, assignDate } = req.body;

			const updateFields = {
				courseStatus: 1
			};
			if (url) updateFields.url = url;
			if (remarks) updateFields.remarks = remarks;
			if (assignDate) updateFields.assignDate = assignDate;
			const updateCourse = await AppliedCourses.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
			if (updateCourse) {
				return res.status(200).json({ status: true, data: updateCourse });
			} else {
				return res.json({ status: false, message: "Record not found!" });
			}
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.post("/removetestimonial", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	let gallery = course.testimonialvideos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ testimonialvideos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});
router.post("/removevideo", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	let gallery = course.videos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ videos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removebrochure", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Company doesn't exist!");

	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ brochure: '' }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removethumbnail", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("course doesn't exist!");

	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ thumbnail: '' }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
});

router.post("/removephoto", isAdmin, async (req, res) => {
	const { courseId, key } = req.body;
	let course = await Courses.findById(courseId);
	if (!course) throw req.ykError("Course doesn't exist!");

	let gallery = course.photos.filter((i) => i !== key);
	const courseUpdate = await Courses.findOneAndUpdate(
		{ _id: courseId },
		{ photos: gallery }
	);
	if (!courseUpdate) throw req.ykError("Course not updated!");
	req.flash("success", "Course updated successfully!");
	res.send({ status: 200, message: "Course Updated Successfully" });
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
	.post(async (req, res) => {

		try {
			const { docsName, courseId, docsId } = req.body;
			console.log("docsId:", docsId, "Type:", typeof docsId, "Valid:", mongoose.Types.ObjectId.isValid(docsId));

			if (!mongoose.Types.ObjectId.isValid(docsId)) {
				return res.status(400).json({ error: "Invalid document ID format." });
			}


			const candidateMobile = req.body.mobile;

			if (!candidateMobile) {

				return res.status(400).json({ error: "mobile number required." });

			}

			const candidate = await Candidate.findOne({
				mobile: candidateMobile,
				appliedCourses: courseId
			});

			if (!candidate) {
				return res.status(400).json({ error: "You have not applied for this course." });
			}

			let files = req.files?.file;
			if (!files) {
				return res.status(400).send({ status: false, message: "No files uploaded" });
			}

			console.log("Files", files)

			const filesArray = Array.isArray(files) ? files : [files];
			const uploadedFiles = [];
			const uploadPromises = [];
			const candidateId = candidate._id;

			filesArray.forEach((item) => {
				const { name, mimetype } = item;
				const ext = name?.split('.').pop().toLowerCase();

				console.log(`Processing File: ${name}, Extension: ${ext}`);

				if (!allowedExtensions.includes(ext)) { // ✅ Now includes PDFs
					console.log("File type not supported")
					throw new Error(`File type not supported: ${ext}`);
				}

				let fileType = "document"; // ✅ Default to "document"
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
			console.log(uploadedFiles)

			const fileUrl = uploadedFiles[0].fileURL;

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


			console.log('user', user)
			console.log('appliedId', appliedId);

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
