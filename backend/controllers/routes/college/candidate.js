const express = require("express");
const axios = require("axios");
const moment = require("moment");
let fs = require("fs");
let path = require("path");
const { auth1, isCollege } = require("../../../helpers");
const fileupload = require("express-fileupload");
const readXlsxFile = require("read-excel-file/node");
const mongoose = require("mongoose");
// const csv = require("csv-parser");
const csv = require("fast-csv");
const uuid = require('uuid/v1');
const multer = require('multer');
const AWS = require('aws-sdk');

const {
	accessKeyId,
	
	secretAccessKey,
	region,
	bucketName,
	mimetypes,
  } = require('../../../config');
  
  
  AWS.config.update({
	accessKeyId,
	secretAccessKey,
	region,
  });
  
  const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
  
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



const {
	Import,
	Qualification,
	Skill,
	Country,
	User,
	State,
	City,
	College,
	SubQualification,
	Courses,
	AppliedCourses
} = require("../../models");
const Candidate = require("../../models/candidateProfile");

const { generatePassword, sendMail } = require("../../../helpers");
const users = require("../../models/users");

const router = express.Router();
// router.use(isAdmin);

router.route("/").get(auth1, async (req, res) => {
	try {
		// for archieve data
		if (req.query.isDeleted == undefined) {
			var isDeleted = false;
			var isChecked = "false";
		} else if (req.query.isDeleted.toString() == "true") {
			var isDeleted = req.query.isDeleted;
			var isChecked = "true";
		} else if (req.query.isDeleted.toString() == "false") {
			var isDeleted = false;
			var isChecked = "false";
		}
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await Candidate.countDocuments({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		});
		const populate = [
			{
				path: "_qualification",
				select: "name",
			},
			{
				path: "_subQualification",
				select: "name",
			},
		];
		const candidates = await Candidate.find({
			_college: req.session.college._id,
			isDeleted: isDeleted,
		})
			.populate(populate)
			.select("name image session mobile email semester status")
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);
		// console.log(candidates);
		return res.render(`${req.vPath}/college/candidate`, {
			candidates,
			perPage,
			totalPages,
			page,
			isChecked,
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

router.route("/listing").get(auth1, async (req, res) => {
	try {
		const perPage = 5;
		const p = parseInt(req.query.page, 10);
		const page = p || 1;
		const count = await Import.countDocuments({});
		const imports = await Import.find({})
			.sort({ createdAt: -1 })
			.skip(perPage * page - perPage)
			.limit(perPage);
		const totalPages = Math.ceil(count / perPage);

		return res.render(`${req.vPath}/college/candidate/listing`, {
			imports,
			perPage,
			totalPages,
			page,
		});
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("/college/candidate/listing");
	}
});

router
	.route("/bulkUpload")
	.get(auth1, async (req, res) => {
		try {
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");

			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;

			const collegedetail = await College.findOne({
				_concernPerson: req.session.user._id,
			});
			if (!collegedetail) throw req.ykError("College detail not found!");

			const count = await Import.countDocuments({
				_college: collegedetail._id,
			});
			const imports = await Import.find({ _college: collegedetail._id })
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);

			return res.render(`${req.vPath}/college/candidate/bulkUpload`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				imports,
				perPage,
				totalPages,
				page,
				collegedetail,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
	})
	.post(auth1, async (req, res) => {
		if (req.files == undefined) {
			req.flash("error", "Please select file ");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		var data1 = req.files.filename;
		const collegedetail = await College.findOne({
			_concernPerson: req.session.user._id,
		});

		if (!req.files.filename) {
			req.flash("error", "Please select file ");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		if (req.files.filenameta1 == "") {
			req.flash("error", "Please select file ");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		var checkFileError = true;

		let extension = req.files.filename.name.split(".").pop();
		if (extension !== "xlsx" && extension !== "xls" && extension !== "xl") {
			console.log("upload excel file only");
			req.flash("error", "Excel format not matched.");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		filename = new Date().getTime() + "_" + data1.name;

		const write = fs.writeFile("public/" + filename, data1.data, (err) => {
			if (err) {
				console.log(err);
			}
			console.log("********* File Upload successfully!");
		});

		// const dirPath = path.join(__dirname, "../../../public/") + filename;

		//try {
		let message = "";
		await readXlsxFile(
			path.join(__dirname, "../../../public/" + filename)
		).then((rows) => {
			if (
				rows[0][0] !== "S. no." ||
				rows[0][1] !== "College Roll No." ||
				rows[0][2] !== "First Name" ||
				rows[0][3] !== "Last Name" ||
				rows[0][4] !== "Gender(M/F/Not Disclose)" ||
				rows[0][5] !== "College Official Email ID" ||
				rows[0][6] !== "Registered Mobile no." ||
				rows[0][7] !==
				"Courses(Doctorate, Certificate, Post Graduation, Diploma, PhD etc.)" ||
				rows[0][8] !==
				"Streams(Computer Course, Pharmacy,Phd In English etc.)" ||
				rows[0][9] !== "Aggregate CGPA till last Semester on 10 point scale"
			) {
				checkFileError = false;
			} else {
				checkFileError = true;
			}
		});
		console.log("checkFileError1", checkFileError);
		if (checkFileError == false) {
			req.flash("error", "Please upload right pattern file");
			return res.redirect("/panel/college/candidate/bulkUpload");
		} else {
			//check qualification in database
			if (checkFileError == true) {
				await readXlsxFile(
					path.join(__dirname, "../../../public/" + filename)
				).then(async (rowss) => {
					var index = 0;
					for (var i = 0; i < rowss.length; i++) {
						for (var j = 0; j < rowss[i].length; j++) {
							if (
								rowss[i][5] === null ||
								rowss[i][2] === null ||
								rowss[i][3] === null ||
								rowss[i][6] === null ||
								rowss[i][7] === null ||
								rowss[i][8] === null
							) {
								// console.log(rowss[i][j]);
								message =
									// " Please fill " + rowss[0][j] + " at row " + i + "</br>";
									"There is an error occurred while uploading file";
								checkFileError = false;
							}
						}

						if (rowss[i][7] !== null && rowss[i][8] !== null && i !== 0) {
							var checkQ = await Qualification.findOne({
								name: rowss[i][7],
							});
							var checkSQ = await SubQualification.findOne({
								name: rowss[i][8],
								_qualification: checkQ,
							});
						}

						if (checkQ == null && i !== 0) {
							//find courses
							const course = await Qualification.find({});

							let courseString = [];

							course.forEach((data) => {
								// console.log(data.name, "---------------");
								courseString.push(data.name);
							});


							// stream.forEach((data1) => {
							// 	console.log(data1.name, "---------------");
							// });
							message += ` Please fill correct Course
								at row ${i}. Courses such as (${courseString.toString()}) .`;

							checkFileError = false;
						}
						if (checkSQ == null && i !== 0) {
							//find stream
							const stream = await SubQualification.find({});
							let streamString = [];
							stream.forEach((data1) => {
								// console.log(data.name, "---------------");
								streamString.push(data1.name);
							});

							message += ` Please fill correct Stream
								at row ${i}. Streams such as (${streamString.toString()}).`;
							checkFileError = false;
						}

						var imports = {
							name: req.files.filename.name,
							message: message,
							status: "Failed",
							record: 0,
							_college: collegedetail._id,
						};
					}
					if (checkFileError == false) {
						const data = await Import.create(imports);
						// console.log(data);
						req.flash("error", message);
						fs.unlinkSync(
							path.join(__dirname, "../../../public/" + filename)
						);
						return res.redirect("/panel/college/candidate/bulkUpload");
					}
				});
			}

			var recordCount = 0;
			// console.log("checkFileError", checkFileError);
			if (checkFileError == true) {
				await readXlsxFile(
					path.join(__dirname, "../../../public/" + filename)
				).then(async (rows) => {
					rows.shift();
					var totalRows = rows.length;
					rows.forEach(async (rows) => {
						var fullName = rows[2] + " " + rows[3];
						//qualifications
						let ID = "";
						let SQID = "";

						if (rows[7] != null) {
							var qualification = await Qualification.findOne({
								name: rows[7],
							});
							ID = qualification ? qualification._id : "";
							if (ID != "") {
								var subQualification = await SubQualification.findOne({
									_qualification: qualification._id,
									name: rows[8],
								});
								SQID = subQualification ? subQualification._id : "";
							}
						}
						let FullName = fullName ? fullName : "";
						let Email = rows[5] ? rows[5] : "";
						let Mobile = rows[6] ? rows[6] : "";
						let CGPA = rows[9] ? rows[9] : "";
						let SNO = rows[0] ? rows[0] : "";
						let SUBQ = rows[8] ? rows[8] : "";
						let CNO = rows[1] ? rows[1] : "";
						let GENDER = rows[4] ? rows[4] : "";
						let checkEmail = await users.findOne({
							email: Email,
							isDeleted: false,
						});
						let checkNumber = await users.findOne({
							mobile: Mobile,
							isDeleted: false,
						});
						if (checkEmail && checkNumber) {
							let update = await users.findOneAndUpdate(
								{
									mobile: Mobile,
									isDeleted: false,
								},
								{
									name: FullName,
									email: Email,
									mobile: Mobile,
								}
							);
							let Update = {
								sNo: SNO,
								collegeRollno: CNO,
								name: FullName,
								gender: GENDER,
								email: Email,
								mobile: Mobile,
								cgpa: rows[9],
							};
							if (ID != "") {
								Update._qualification = ID;
							}
							if (SQID != "") {
								Update._subQualification = SQID;
							}
							// console.log(Update, "Update");
							let update1 = await Candidate.findOneAndUpdate(
								{
									mobile: Mobile,
									isDeleted: false,
								},
								Update
							);
							// console.log(update1, "update1");
							// console.log(recordCount, "- recordCount IF" + totalRows);
							if (totalRows == recordCount + 1) {
								var imports = {
									name: req.files.filename.name,
									message: "success",
									status: "Updated",
									record: recordCount + 1,
									_college: collegedetail._id,
								};
								console.log(
									"--------------------- REcord INSERTED ---------------------------"
								);
								console.log(imports);
								await Import.create(imports);
							}
							recordCount++;

							// console.log(update1, "update", ID, SQID);
						}

						if (!checkEmail) {
							let checkMobile = await users.findOne({
								mobile: Mobile,
								isDeleted: false,
							});
							if (!checkMobile) {
								let usr = await User.create({
									name: FullName,
									email: Email,
									mobile: Mobile,
									role: 3,
								});
								let tutorial = {
									sNo: SNO,
									collegeRollno: CNO,
									name: FullName,
									gender: GENDER,
									email: Email,
									mobile: Mobile,
									cgpa: rows[9],
									_concernPerson: usr._id,
									_college: collegedetail._id,
									session: "2022-2022",
								};
								console.log(tutorial, "tutorial");
								if (ID != "") {
									tutorial._qualification = ID;
								}
								if (SQID != "") {
									tutorial._subQualification = SQID;
								}
								const candidate = await Candidate.create(tutorial);
								console.log(candidate);
								if (totalRows == recordCount + 1) {
									var imports = {
										name: req.files.filename.name,
										message: "success",
										status: "Completed",
										record: recordCount + 1,
										_college: collegedetail._id,
									};
									console.log(
										"--------------------- REcord INSERTED ---------------------------"
									);
									console.log(imports);
									await Import.create(imports);
								}
								recordCount++;
								console.log(recordCount, "- recordCount");
							}
							// req.flash("success", "Data uploaded successfully");
						}
					});
				});
				req.flash("success", "Data uploaded successfully");
				fs.unlinkSync(path.join(__dirname, "../../../public/" + filename));
				return res.redirect("/panel/college/candidate/bulkUpload");
			}
		}
	});
router
	.route("/add")
	.get(auth1, async (req, res) => {
		try {
			let formData = {};
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			return res.render(`${req.vPath}/college/candidate/add`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				formData,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			let formData = req.body;
			const { mobile, email } = req.body;
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			const dataCheck = await Candidate.findOne({ mobile: mobile });
			if (dataCheck) {
				//throw req.ykError("Mobile number already exist!");
				// req.flash("Error", "Mobile number already exist!");
				return res.render(`${req.vPath}/college/candidate/add`, {
					formData,
					country,
					qualification,
					skill,
					techSkill,
					nonTechSkill,
					error: "Mobile number already exist!",
				});
			}

			const datacheck2 = await User.findOne({ email: email });
			if (datacheck2) {
				return res.render(`${req.vPath}/college/candidate/add`, {
					formData,
					country,
					qualification,
					skill,
					techSkill,
					nonTechSkill,
					error: "Candidate email already exist!",
				});
			}

			const dataCheck1 = await Candidate.findOne({ email: email });
			if (dataCheck1) {
				//throw req.ykError("Mobile number already exist!");
				// req.flash("Error", "Email already exist!");

				return res.render(`${req.vPath}/college/candidate/add`, {
					formData,
					country,
					qualification,
					skill,
					techSkill,
					nonTechSkill,
					error: "Email already exist!",
				});
			}
			//return res.redirect("/college/candidate");


			const session = req.body.sessionStart
				.concat("-")
				.concat(req.body.sessionEnd);
			const collegedetail = await College.findOne({
				_concernPerson: req.session.user._id,
			});
			// if (!req.body._subQualification) {
			//   req.body._subQualification = '[]';
			// }

			// _subqualification check if no substream selected  eg: BCA
			// console.log(req.body._subQualification);
			let unset = {};
			if (
				req.body._subQualification == undefined ||
				req.body._subQualification == "Select Option"
			) {
				delete req.body._subQualification;
			}
			// console.log(req.body);

			// const candidate = await Candidate.create({
			// 	...req.body,
			// 	session,
			// });

			const password = await generatePassword();

			const { name } = req.body;

			const usr = await User.create({
				name,
				email,
				mobile,
				password,
				role: 3,
			});
			if (!usr) throw req.ykError("candidate user not create!");

			const candidate = await Candidate.create({
				...req.body,
				session,
				_concernPerson: collegedetail._concernPerson,
				_college: collegedetail._id,
			});

			if (!candidate) throw req.ykError("Candidate not create!");
			req.flash("success", "Candidate added successfully!");
			return res.redirect("/panel/college/candidate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router
	.route("/edit/:id")
	.get(auth1, async (req, res) => {
		try {
			const { id } = req.params;
			const country = await Country.find({});
			const qualification = await Qualification.find({ status: true });
			const skill = await Skill.find({ status: true });
			const techSkill = skill.filter((x) => x.type === "technical");
			const nonTechSkill = skill.filter((x) => x.type === "non technical");
			const candidate = await Candidate.findById(id);
			if (!candidate) throw req.ykError("Candidate not found!");
			const state = await State.find({ countryId: candidate.countryId });
			const city = await City.find({ stateId: candidate.stateId });
			const subqual = await SubQualification.find({
				_qualification: candidate._qualification,
			});
			return res.render(`${req.vPath}/college/candidate/edit`, {
				country,
				qualification,
				techSkill,
				nonTechSkill,
				state,
				city,
				subqual,
				candidate,
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const { mobile } = req.body;
			const { id } = req.params;
			const dataCheck = await Candidate.findOne({
				_id: { $ne: id },
				mobile,
			});
			if (dataCheck) throw req.ykError("Mobile number already exist!");
			const session = req.body.sessionStart
				.concat("-")
				.concat(req.body.sessionEnd);

			// _subqualification check if no substream selected  eg: BCA
			let unset = {};
			if (req.body._subQualification == undefined) {
				unset = { $unset: { _subQualification: "" } };
				const remove = await Candidate.findByIdAndUpdate(id, unset);
			}
			const candidateUpdate = await Candidate.findByIdAndUpdate(
				id,
				{ ...req.body, session },
				unset
			);

			if (!candidateUpdate) throw req.ykError("Candidate not updated!");

			await User.findOneAndUpdate(
				{ email: req.body.email },
				{
					email: req.body.email,
					mobile: req.body.mobile,
				}
			);

			req.flash("success", "Candidate updated successfully!");
			return res.redirect("/panel/college/candidate");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.route("/course/:courseId/apply")

	.post(isCollege, async (req, res) => {
		try {
			let { courseId } = req.params;
			console.log("courseId", courseId);

			const user = req.user._id;
			const userName = req.user.name;



			let { mobile, selectedCenter } = req.body;
			if (!mobile) {
				console.log("mobile number not found.");
				return res.status(404).json({ status: false, msg: "mobile number required." });

			}
			// // Check if courseId is a string
			if (typeof courseId === "string") {
				console.log("courseId is a string:", courseId);

				//   // Validate if it's a valid ObjectId before converting
				if (mongoose.Types.ObjectId.isValid(courseId)) {
					courseId = new mongoose.Types.ObjectId(courseId); // Convert to ObjectId
				} else {
					return res.status(400).json({ error: "Invalid course ID" });
				}
			}


			console.log("selectedCenter", selectedCenter)

			if (typeof selectedCenter === "string") {
				console.log("selectedCenter is a string:", selectedCenter);

				//   // Validate if it's a valid ObjectId before converting
				if (mongoose.Types.ObjectId.isValid(selectedCenter)) {
					selectedCenter = new mongoose.Types.ObjectId(selectedCenter); // Convert to ObjectId
				} else {
					return res.status(400).json({ error: "Invalid selectedCenter ID" });
				}
			}

			// // Fetch course and candidate
			const course = await Courses.findById(courseId);
			if (!course) {
				return res.status(404).json({ status: false, msg: "Course not found." });
			}

			const candidate = await Candidate.findOne({ mobile: mobile }).lean();
			console.log("candidate", candidate)

			if (!candidate) {
				return res.status(404).json({ status: false, msg: "Candidate not found." });
				console.log("Candidate not found.")
			}

			// // Check if already applied
			if (
				candidate.appliedCourses &&
				candidate.appliedCourses.some(applied =>
					applied.courseId && applied.courseId.toString() === courseId.toString()
				)
			) {
				console.log("Already applied");
				return res.status(400).json({ status: false, msg: "Course already applied." });
			}

			const apply = await Candidate.findOneAndUpdate(
				{ mobile: mobile },
				{
					$addToSet: {
						appliedCourses: courseId,
						selectedCenter: {
							courseId: courseId,
							centerId: selectedCenter
						}
					}
				},
				{ new: true, upsert: true }
			);


			const appliedData = await new AppliedCourses({
				_candidate: candidate._id,
				_course: courseId,
				_center: selectedCenter,
				registeredBy: user
			}).save();


			// // Capitalize every word's first letter
			function capitalizeWords(str) {
				if (!str) return '';
				return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
			}

			// // Update Spreadsheet
			// const sheetData = [
			// 	moment(appliedData.createdAt).utcOffset('+05:30').format('DD MMM YYYY'),
			// 	moment(appliedData.createdAt).utcOffset('+05:30').format('hh:mm A'),
			// 	capitalizeWords(course?.name), // Apply the capitalizeWords function
			// 	candidate?.name,
			// 	candidate?.mobile,
			// 	candidate?.email,
			// 	candidate?.sex === 'Male' ? 'M' : candidate?.sex === 'Female' ? 'F' : '',
			// 	candidate?.dob ? moment(candidate.dob).format('DD MMM YYYY') : '',
			// 	candidate?.state?.name,
			// 	candidate?.city?.name,
			// 	'Course',
			// 	`${process.env.BASE_URL}/coursedetails/${courseId}`,
			// 	course?.registrationCharges,
			// 	appliedData?.registrationFee,
			// 	'Lead From Portal',
			// 	course?.courseFeeType,
			// 	course?.typeOfProject,
			// 	course?.projectName,
			// 	userName



			// ];
			// await updateSpreadSheetValues(sheetData);

			let candidateMob = candidate.mobile;

			// Check if the mobile number already has the country code
			if (typeof candidateMob !== "string") {
				candidateMob = String(candidateMob); // Convert to string
			}

			if (!candidateMob.startsWith("91") && candidateMob.length === 10) {
				candidateMob = "91" + candidateMob; // Add country code if missing and the length is 10
			}


			console.log("Candidate Mobile", candidateMob);

			return res.status(200).json({ status: true, msg: "Course applied successfully." });
		} catch (error) {
			console.error("Error applying for course:", error.message);
			return res.status(500).json({ status: false, msg: "Internal server error.", error: error.message });
		}
	});

router.route("/addleaddandcourseapply")
	.post(isCollege, async (req, res) => {
		console.log("req.body");
		try {
			console.log("Incoming body:", req.body);

			let { name, mobile, email, address, state, city, sex, dob, whatsapp, highestQualification, courseId, selectedCenter, longitude, latitude } = req.body;

			if (mongoose.Types.ObjectId.isValid(highestQualification)) highestQualification = new mongoose.Types.ObjectId(highestQualification);
			if (mongoose.Types.ObjectId.isValid(courseId)) courseId = new mongoose.Types.ObjectId(courseId);
			if (mongoose.Types.ObjectId.isValid(selectedCenter)) selectedCenter = new mongoose.Types.ObjectId(selectedCenter);

			if (dob) dob = new Date(dob); // Date field

			// Fetch course
			const course = await Courses.findById(courseId);
			if (!course) {
				return res.status(400).json({ status: false, msg: "Course not found" });
			}

			const userId = req.user._id;
			const userName = req.user.name;

			// ✅ Build CandidateProfile Data
			let candidateData = {
				name,
				mobile,
				email,
				sex,
				dob,
				whatsapp,
				highestQualification,
				personalInfo: {
					currentAddress: {
						city: city || "",
						state: state || "",
						fullAddress: address || "",
						latitude: latitude || "",
						longitude: longitude || "",
						coordinates: latitude && longitude ? [parseFloat(longitude), parseFloat(latitude)] : [0, 0]

					}
				},
				appliedCourses: [
					{
						courseId: courseId,
						centerId: selectedCenter
					}
				],
				verified: true
			};

			console.log("Final Candidate Data:", candidateData);

			// ✅ Create CandidateProfile
			const candidate = await Candidate.create(candidateData);

			console.log('selectedCenter', typeof selectedCenter)
			// ✅ Insert AppliedCourses Record
			const appliedCourseEntry = await AppliedCourses.create({
				_candidate: candidate._id,
				_course: courseId,
				_center: selectedCenter,
				registeredBy: userId
			});

			console.log("Candidate Profile created and Course Applied.");

			// ✅ Optional: Update your Google Spreadsheet
			const capitalizeWords = (str) => {
				if (!str) return '';
				return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
			};

			// const sheetData = [
			// 	moment(appliedCourseEntry.createdAt).utcOffset('+05:30').format('DD MMM YYYY'),
			// 	moment(appliedCourseEntry.createdAt).utcOffset('+05:30').format('hh:mm A'),
			// 	capitalizeWords(course?.name),
			// 	candidate?.name,
			// 	candidate?.mobile,
			// 	candidate?.email,
			// 	candidate?.sex === 'Male' ? 'M' : candidate?.sex === 'Female' ? 'F' : '',
			// 	candidate?.dob ? moment(candidate.dob).format('DD MMM YYYY') : '',
			// 	state,
			// 	city,
			// 	'Course',
			// 	`${process.env.BASE_URL}/coursedetails/${courseId}`,
			// 	course?.registrationCharges,
			// 	appliedCourseEntry?.registrationFee,
			// 	'Lead From Portal',
			// 	course?.courseFeeType,
			// 	course?.typeOfProject,
			// 	course?.projectName,
			// 	userName
			// ];

			// await updateSpreadSheetValues(sheetData);

			res.send({ status: true, msg: "Candidate added and course applied successfully", data: candidate });

		} catch (err) {
			console.error(err);
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});


router.route("/verifyuser")
	.post(async (req, res) => {
		try {
			console.log("body data", req.body)

			let { mobile, courseId } = req.body
			let candidate = await Candidate.findOne({ mobile: mobile })
			if (candidate) {
				if (candidate.status === false) {
					console.log("user status flase by admin")
					req.flash("Contact with admin!");

					return res.redirect("back");
				}
				else {

					// // Check if courseId is a string
					if (typeof courseId === "string") {
						console.log("courseId is a string:", courseId);

						//   // Validate if it's a valid ObjectId before converting
						if (mongoose.Types.ObjectId.isValid(courseId)) {
							courseId = new mongoose.Types.ObjectId(courseId); // Convert to ObjectId
						} else {
							return res.status(400).json({ error: "Invalid course ID" });
						}
					}
					console.log("checking apply")
					// // Check if already applied
					if (candidate.appliedCourses && candidate.appliedCourses.some(appliedId => appliedId.equals(courseId))) {
						console.log("course already applied")
						return res.status(200).json({ status: true, msg: "Course already applied.", appliedStatus: true });
					}
					else {

						console.log("Course already not applied.")


						return res.status(200).json({ status: true, msg: "Course already not applied.", appliedStatus: false });

					}

				}
			}
			else {
				console.log("user not found:")
				return res.send({ status: false, message: "Candidate not found" })

			}


		} catch (err) {
			console.log(err)
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})

router.route("/createResume/:id").get(auth1, async (req, res) => {
	try {
		const dataObj = {
			id: req.params.id,
			reCreate: !!req.query.reCreate,
			url: `${req.protocol}://${req.get("host")}/candidateForm/${req.params.id
				}`,
		};

		const candidate = await Candidate.findById(req.params.id);
		if (!candidate || !candidate._id)
			throw req.ykError("No candidate found!");
		const { data } = await axios.post(
			"http://15.206.9.185:3027/pdfFromUrl",
			dataObj
		);

		if (!data || !data.status || !data.data || !data.data.bucketFileName)
			throw req.ykError("Unable to create pdf!");
		const { bucketFileName: enrollmentFormPdfLink } = data.data;
		const cand = await Candidate.findByIdAndUpdate(req.params.id, {
			enrollmentFormPdfLink,
		});
		if (!cand) throw req.ykError("Unable to create pdf!");
		req.flash("success", "Create pdf successfully!");
		return res.redirect("/college/candidate");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.route("/single").get(auth1, function (req, res) {
	res.download("public/CollegeStudentsDataTemplate.xlsx", function (err) {
		if (err) {
			console.log(err);
		}
	});
});
router.route("/clearlog").post(auth1, async function (req, res) {
	const college = await College.findOne({
		_concernPerson: req.session.user._id,
	});
	const clearlogs = await Import.deleteMany({
		_college: college._id,
	});
	return res.json({ status: true });
});

router.get('/getCandidateProfile/:id', [isCollege], async (req, res) => {
	try {
		const user = req.user;
		let { id } = req.params
		console.log('id',id)

		const educations = await Qualification.find({ status: true });

		if (typeof id === 'String') {
			id = new mongoose.Types.ObjectId
		}

		const candidate = await Candidate.findById(id);
		console.log(candidate, 'candidate')

		if (!candidate) {
			return res.status(404).json({ status: false, message: "Candidate not found" });
		}


		res.status(200).json({
			status: true,
			message: "Profile fetched successfully",
			data: { candidate, educations }
		});
	} catch (error) {
		console.error('Error fetching profile:', error);
		res.status(500).json({ status: false, message: "Error fetching profile data" });
	}
});

router.post('/saveProfile', [isCollege], async (req, res) => {
	try {
		console.log("save profile...")
	  const user = req.user;
  
	  const {
		name,
		email,
		mobile,
		sex,
		dob,
		whatsapp,
		personalInfo,
		experiences,
		qualifications,
		declaration,
		isExperienced,showProfileForm
	  } = req.body;
  
	  console.log('experiences from frontend',experiences)
  
	  // Build dynamic update object
	  const updatePayload = {
		
	  };
  
	  // Root level fields (only if present)
	  if (showProfileForm) updatePayload.showProfileForm = showProfileForm;
	  if (name) updatePayload.name = name;
	  if (email) updatePayload.email = email;
	  if (typeof isExperienced !== 'undefined') {
		updatePayload.isExperienced = isExperienced;
	  }
	  
	  if (sex) updatePayload.sex = sex;
	  if (dob) updatePayload.dob = dob;
	  if (whatsapp) updatePayload.whatsapp = whatsapp;
  
	  // personalInfo: Only non-empty fields
	  if (personalInfo) {
		updatePayload.personalInfo = {};
  
		if (personalInfo.professionalTitle) updatePayload.personalInfo.professionalTitle = personalInfo.professionalTitle;
		if (personalInfo.declaration) updatePayload.personalInfo.declaration = personalInfo.declaration;
		if (personalInfo.totalExperience) updatePayload.personalInfo.totalExperience = personalInfo.totalExperience;
		if (personalInfo.professionalSummary) updatePayload.personalInfo.professionalSummary = personalInfo.professionalSummary;
		if (personalInfo.image) updatePayload.personalInfo.image = personalInfo.image;
		if (personalInfo.resume) updatePayload.personalInfo.resume = personalInfo.resume;
		if (personalInfo.permanentAddress) updatePayload.personalInfo.permanentAddress = personalInfo.permanentAddress;
		if (personalInfo.currentAddress) updatePayload.personalInfo.currentAddress = personalInfo.currentAddress;
  
		if (Array.isArray(personalInfo.voiceIntro) && personalInfo.voiceIntro.length > 0) {
		  updatePayload.personalInfo.voiceIntro = personalInfo.voiceIntro;
		}
		if (Array.isArray(personalInfo.skills) && personalInfo.skills.length > 0) updatePayload.personalInfo.skills = personalInfo.skills;
		if (Array.isArray(personalInfo.certifications) && personalInfo.certifications.length > 0) updatePayload.personalInfo.certifications = personalInfo.certifications;
		if (Array.isArray(personalInfo.languages) && personalInfo.languages.length > 0) {
		  updatePayload.personalInfo.languages = personalInfo.languages
			.filter(lang => lang.name && typeof lang.level === 'number')
			.map(lang => ({
			  name: lang.name,
			  level: lang.level
			}));
		}
  
		if (Array.isArray(personalInfo.projects) && personalInfo.projects.length > 0) updatePayload.personalInfo.projects = personalInfo.projects;
		if (Array.isArray(personalInfo.interest) && personalInfo.interest.length > 0) updatePayload.personalInfo.interest = personalInfo.interest;
  
	  }
  
	 
	  // Work experience
  if (Array.isArray(experiences) && experiences.length > 0) {
	updatePayload.experiences = experiences.map(exp => ({
	  jobTitle: exp.jobTitle || '',
	  companyName: exp.companyName || '',
	  jobDescription: exp.jobDescription || '',
	  currentlyWorking: exp.currentlyWorking || false,
	  from: exp.from ? new Date(exp.from) : null,
	  to: exp.to ? new Date(exp.to) : null,
	  location: exp.location || {
		type: 'Point',
		coordinates: [0, 0],
		city: '',
		state: '',
		fullAddress: ''
	  }
	}));
  }
  
  
	  // Qualifications (sanitize and only if non-empty)
	  if (Array.isArray(qualifications) && qualifications.length > 0) {
		updatePayload.qualifications = qualifications
		  .filter(q => q.education)
		  .map(q => ({
			education: q.education,
			boardName: q.boardName || '',
			schoolName: q.schoolName || '',
			collegeName: q.collegeName || '',
			universityName: q.universityName || '',
			passingYear: q.passingYear || '',
			marks: q.marks || '',
			course: q.course || undefined,
			specialization: q.specialization || '',
			universityLocation: q.universityLocation || {
			  type: 'Point',
			  coordinates: [0, 0],
			  city: '',
			  state: '',
			  fullAddress: ''
			},
			collegeLocation: q.collegeLocation || {
			  type: 'Point',
			  coordinates: [0, 0],
			  city: '',
			  state: '',
			  fullAddress: ''
			},
			schoolLocation: q.schoolLocation || {
			  type: 'Point',
			  coordinates: [0, 0],
			  city: '',
			  state: '',
			  fullAddress: ''
			}
		  }));
	  }
	  console.log('updatePayload', updatePayload)
	  console.log('Incoming Data:', req.body);
	
	  // Final DB Update
	  const updatedProfile = await Candidate.findOneAndUpdate(
		{ mobile: mobile },
		{ $set: updatePayload },
		{ new: true, runValidators: true }
	  );
  
	  console.log('updatedProfile', updatedProfile)
  
  
	  return res.status(200).json({ status: true, message: 'Profile updated successfully', data: updatedProfile });
	} catch (error) {
	  console.error('Error saving profile data:', error);
	  return res.status(500).json({ status: false, message: 'Error saving profile data', error: error.message });
	}
  });

  router.patch('/updatefiles', [isCollege], async (req, res) => {
	try {
	  // Step 1: Find dynamic key (should be only 1 key in body)
  
	  console.log('updatefiles')
	  const keys = Object.keys(req.body);
	  if (keys.length !== 1) {
		return res.send({ status: false, message: 'Invalid request structure' });
	  }
  
	  const fieldName = keys[0];
	  const fileData = req.body[fieldName];
  
	  console.log('fieldName',fieldName,'fileData',fileData)
  
	  // Step 2: Validate allowed fields
	  const arrayFields = ['resume', 'voiceIntro'];
	  const singleFields = ['profilevideo', 'image','focalytProfile'];
  
	  if (![...arrayFields, ...singleFields].includes(fieldName)) {
		return res.send({ status: false, message: 'Unauthorized field update' });
	  }
  
	  // Step 3: Create update object
	  const updateQuery = arrayFields.includes(fieldName)
		? { $push: { [`personalInfo.${fieldName}`]: fileData } }
		: { [`personalInfo.${fieldName}`]: fileData.url }; // Assuming single fields hold only URL
  console.log('updateQuery',updateQuery)
	  // Step 4: Execute update
	  const candidate = await Candidate.findOneAndUpdate(
		{ mobile: req.user.mobile },
		updateQuery
	  );
  
  
	  return res.send({ status: true, message: `${fieldName} updated successfully` });
  
	} catch (err) {
	  console.error("❌ Error updating file in profile:", err);
	  return res.send({ status: false, message: 'Error updating file in profile' });
	}
  });

  router.post('/upload-profile-pic/:filename',[isCollege],async(req,res)=>{
	try {
		console.log('api hiting upload file')
		const { name, mimetype: ContentType } = req.files.file;
		const {mobile} = req.body
		console.log('body',req.body)
		const ext = name.split('.').pop();
		const { filename } = req.params
		let userId = await Candidate.findOne({mobile:mobile}).select('_id')
		console.log('userId',userId)
		const key = `uploads/${userId}/${filename}/${uuid()}.${ext}`;
		console.log('key',key)
		if (!mimetypes.includes(ext.toLowerCase())) throw new InvalidParameterError('File type not supported!');
	
		const data = req.files.file.data
		const params = {
		  Bucket: bucketName, Body: data, Key: key, ContentType,
		};

		console.log('params',params)
	
		const url = await s3.upload(params).promise()
		console.log('url',url)
		

		const updatedProfile = await Candidate.findOneAndUpdate({mobile:mobile},{$set:{personalInfo:{image:url.Location}}},{new:true})
		console.log('updatedProfile',updatedProfile)
		return res.send({status:true,message:'Profile picture updated successfully',data:updatedProfile})
	
	  } catch (err) { return req.errFunc(err); }
  })

  router.post('/assign-batch', [isCollege], async (req, res) => {
	try {
		console.log('assign-batch')
		const { batchId, appliedCourseId } = req.body
		console.log('batchId',batchId)
		console.log('appliedCourseId',appliedCourseId)
		const appliedCourse = await AppliedCourses.findOneAndUpdate({_id:appliedCourseId},{$set:{batch:batchId,isBatchAssigned:true}},{new:true})
		console.log('appliedCourse',appliedCourse)
		return res.send({status:true,message:'Batch assigned successfully',data:appliedCourse})
	} catch (err) {
		console.error('Error assigning batch:', err);
		return res.send({status:false,message:'Error assigning batch',error:err})
	}
  })
module.exports = router;
