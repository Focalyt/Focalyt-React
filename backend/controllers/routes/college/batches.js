const express = require("express");
const { ObjectId } = require("mongodb");
const uuid = require('uuid/v1');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require("path");
const { auth1, isAdmin, isCollege } = require("../../../helpers");
const moment = require("moment");
const { Courses,Batch, College,Country, Qualification, CourseSectors, AppliedCourses, Center } = require("../../models");
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
		// console.log('file name', file.name)
		// console.log('allowedExtensions', allowedExtensions)
		// console.log('folder', folder)
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
		
		const user = req.user
		if(!user){
			console.log('user not found')
			return res.json({
				status: false,
				message: "You are not authorized to access this page"
			})
		}

		const college = await College.findOne({
			'_concernPerson._id': user._id
		});
		if(!college){
			console.log('college not found')
			return res.json({
				status: false,
				message: "College not found"
			})
		}


		const batches = await Batch.find({
			status:'active',
			college:college._id
		});

		if(!batches){
			console.log('batches not found')
			return res.json({
				status: false,
				message: "Batches not found"
			})
		}



		return res.json({

			batches
		});

	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});


module.exports = router;
