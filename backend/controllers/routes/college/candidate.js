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

// const {getAllGoogleCalendarEvents, getGoogleAuthToken, getNewGoogleAccessToken, getGoogleCalendarEvents, createGoogleCalendarEvent, validateAndRefreshGoogleToken } = require("../../routes/services/googleservice");

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
	AppliedCourses,
	AppliedJobs,
	QuestionAnswer,
	CandidateVisitCalender,
	Center,
	StatusLogs,
	ReEnquire
} = require("../../models");
const Candidate = require("../../models/candidateProfile");
const { statusLogHelper } = require("../../../helpers/college");
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
			req.flash("error", "Excel format not matched.");
			return res.redirect("/panel/college/candidate/bulkUpload");
		}
		filename = new Date().getTime() + "_" + data1.name;

		const write = fs.writeFile("public/" + filename, data1.data, (err) => {
			if (err) {
				console.log(err);
			}
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
								if (ID != "") {
									tutorial._qualification = ID;
								}
								if (SQID != "") {
									tutorial._subQualification = SQID;
								}
								const candidate = await Candidate.create(tutorial);
								if (totalRows == recordCount + 1) {
									var imports = {
										name: req.files.filename.name,
										message: "success",
										status: "Completed",
										record: recordCount + 1,
										_college: collegedetail._id,
									};
									await Import.create(imports);
								}
								recordCount++;
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

			const user = req.user._id;
			const userName = req.user.name;



			let { mobile, selectedCenter } = req.body;
			if (!mobile) {
				return res.status(404).json({ status: false, msg: "mobile number required." });

			}
			// // Check if courseId is a string
			if (typeof courseId === "string") {

				//   // Validate if it's a valid ObjectId before converting
				if (mongoose.Types.ObjectId.isValid(courseId)) {
					courseId = new mongoose.Types.ObjectId(courseId); // Convert to ObjectId
				} else {
					return res.status(400).json({ error: "Invalid course ID" });
				}
			}



			if (typeof selectedCenter === "string") {

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

			if (!candidate) {
				return res.status(404).json({ status: false, msg: "Candidate not found." });
			}

			// // Check if already applied
			if (
				candidate.appliedCourses &&
				candidate.appliedCourses.some(applied =>
					applied.courseId && applied.courseId.toString() === courseId.toString()
				)
			) {
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



			return res.status(200).json({ status: true, msg: "Course applied successfully." });
		} catch (error) {
			console.error("Error applying for course:", error.message);
			return res.status(500).json({ status: false, msg: "Internal server error.", error: error.message });
		}
	});

router.route("/addleaddandcourseapply")
	.post(isCollege, async (req, res) => {
		try {

			let { name, mobile, email, address, state, city, sex, dob, whatsapp, highestQualification, courseId, selectedCenter, longitude, latitude, sourceType, source, sourceName, sourceContactName, } = req.body;
			// let { name, mobile, email, address, state, city, sex, dob, whatsapp, highestQualification, courseId, selectedCenter, longitude, latitude } = req.body;
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
				sourceInfo: {
					sourceType: sourceType || "",
					source: source || "",
					sourceName: sourceName || "",
					sourceContactName: sourceContactName || "",
				},
				verified: true
			};


			// ✅ Create CandidateProfile
			const candidate = await Candidate.create(candidateData);

			// ✅ Insert AppliedCourses Record
			const appliedCourseEntry = await AppliedCourses.create({
				_candidate: candidate._id,
				_course: courseId,
				_center: selectedCenter,
				registeredBy: userId
			});


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

			let { mobile, courseId } = req.body
			let candidate = await Candidate.findOne({ mobile: mobile })
			if (candidate) {
				if (candidate.status === false) {
					req.flash("Contact with admin!");

					return res.redirect("back");
				}
				else {

					// // Check if courseId is a string
					if (typeof courseId === "string") {

						//   // Validate if it's a valid ObjectId before converting
						if (mongoose.Types.ObjectId.isValid(courseId)) {
							courseId = new mongoose.Types.ObjectId(courseId); // Convert to ObjectId
						} else {
							return res.status(400).json({ error: "Invalid course ID" });
						}
					}
					// // Check if already applied
					if (candidate.appliedCourses && candidate.appliedCourses.some(appliedId => appliedId.equals(courseId))) {
						return res.status(200).json({ status: true, msg: "Course already applied.", appliedStatus: true });
					}
					else {



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

		const educations = await Qualification.find({ status: true });

		if (typeof id === 'String') {
			id = new mongoose.Types.ObjectId
		}

		const candidate = await Candidate.findById(id);

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
			isExperienced, showProfileForm
		} = req.body;


		if (name || email) {
			const updateUser = await User.findOneAndUpdate({ mobile: mobile, role: 3 }, { $set: { name: name, email: email } }, { new: true });
		}

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
			if (personalInfo.fatherName) updatePayload.personalInfo.fatherName = personalInfo.fatherName;
			if (personalInfo.motherName) updatePayload.personalInfo.motherName = personalInfo.motherName;
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


		// Final DB Update
		const updatedProfile = await Candidate.findOneAndUpdate(
			{ mobile: mobile },
			{ $set: updatePayload },
			{ new: true, runValidators: true }
		);



		return res.status(200).json({ status: true, message: 'Profile updated successfully', data: updatedProfile });
	} catch (error) {
		console.error('Error saving profile data:', error);
		return res.status(500).json({ status: false, message: 'Error saving profile data', error: error.message });
	}
});

router.patch('/updatefiles', [isCollege], async (req, res) => {
	try {
		// Step 1: Find dynamic key (should be only 1 key in body)

		const keys = Object.keys(req.body);
		if (keys.length !== 1) {
			return res.send({ status: false, message: 'Invalid request structure' });
		}

		const fieldName = keys[0];
		const fileData = req.body[fieldName];


		// Step 2: Validate allowed fields
		const arrayFields = ['resume', 'voiceIntro'];
		const singleFields = ['profilevideo', 'image', 'focalytProfile'];

		if (![...arrayFields, ...singleFields].includes(fieldName)) {
			return res.send({ status: false, message: 'Unauthorized field update' });
		}

		// Step 3: Create update object
		const updateQuery = arrayFields.includes(fieldName)
			? { $push: { [`personalInfo.${fieldName}`]: fileData } }
			: { [`personalInfo.${fieldName}`]: fileData.url }; // Assuming single fields hold only URL
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

router.post('/upload-profile-pic/:filename', [isCollege], async (req, res) => {
	try {
		const { name, mimetype: ContentType } = req.files.file;
		const { mobile } = req.body
		const ext = name.split('.').pop();
		const { filename } = req.params
		let userId = await Candidate.findOne({ mobile: mobile }).select('_id')
		const key = `uploads/${userId}/${filename}/${uuid()}.${ext}`;
		if (!mimetypes.includes(ext.toLowerCase())) throw new InvalidParameterError('File type not supported!');

		const data = req.files.file.data
		const params = {
			Bucket: bucketName, Body: data, Key: key, ContentType,
		};


		const url = await s3.upload(params).promise()




		const updatedProfile = await Candidate.findOneAndUpdate({ mobile: mobile }, { $set: { personalInfo: { image: url.Location } } }, { new: true })

		let newData = {
			Location: url.Location,
			updatedProfile: updatedProfile
		}

		return res.send({ status: true, message: 'Profile picture updated successfully', data: newData })

	} catch (err) { return req.errFunc(err); }
})

router.post('/assign-batch', [isCollege], async (req, res) => {
	try {
		const { batchId, appliedCourseId } = req.body
		if (!batchId || !appliedCourseId) {
			return res.send({ status: false, message: `${batchId ? 'batchId' : 'appliedCourseId'} is required` })
		}
		const appliedCourse = await AppliedCourses.findOneAndUpdate({ _id: appliedCourseId }, { $set: { batch: batchId, isBatchAssigned: true } }, { new: true })

		const newStatusLogs = await statusLogHelper(appliedCourseId, {
			batchAssigned: true
		});

		return res.send({ status: true, message: 'Batch assigned successfully', data: appliedCourse })
	} catch (err) {
		console.error('Error assigning batch:', err);
		return res.send({ status: false, message: 'Error assigning batch', error: err })
	}
})

// Attendance Management Routes
router.post('/mark-attendance', [isCollege], async (req, res) => {
	try {
		const { appliedCourseIds, date, status, period = 'regularPeriod', remarks = '' } = req.body;
		const markedBy = req.user._id;

		if (!appliedCourseIds || !Array.isArray(appliedCourseIds) || appliedCourseIds.length === 0) {
			return res.status(400).json({
				status: false,
				message: 'appliedCourseIds array is required and must not be empty'
			});
		}

		if (!date || !status) {
			return res.status(400).json({
				status: false,
				message: 'date and status are required'
			});
		}

		const results = [];
		const errors = [];

		// Mark attendance for each student
		for (const courseId of appliedCourseIds) {
			try {
				const appliedCourse = await AppliedCourses.findById(courseId);
				if (!appliedCourse) {
					errors.push({
						appliedCourseId: courseId,
						error: 'Applied course not found'
					});
					continue;
				}

				await appliedCourse.markAttendance(date, status, period, markedBy, remarks);

				results.push({
					appliedCourseId: courseId,
					status: 'success',
					data: {
						candidateId: appliedCourse._candidate,
						attendance: appliedCourse.attendance[period]
					}
				});
			} catch (error) {
				errors.push({
					appliedCourseId: courseId,
					error: error.message
				});
			}
		}

		const isSingle = appliedCourseIds.length === 1;
		const message = isSingle
			? (results.length > 0 ? 'Attendance marked successfully' : 'Failed to mark attendance')
			: `Bulk attendance marked successfully. ${results.length} successful, ${errors.length} failed`;

		return res.status(200).json({
			status: true,
			message: message,
			data: isSingle ? results[0]?.data : {
				successful: results,
				failed: errors,
				totalProcessed: appliedCourseIds.length,
				successCount: results.length,
				errorCount: errors.length
			}
		});
	} catch (error) {
		console.error('Error marking attendance:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error marking attendance'
		});
	}
});

router.get('/attendance-report/:appliedCourseId', [isCollege], async (req, res) => {
	try {
		const { appliedCourseId } = req.params;
		const { startDate, endDate, period } = req.query;

		const appliedCourse = await AppliedCourses.findById(appliedCourseId);
		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: 'Applied course not found'
			});
		}

		const report = appliedCourse.getAttendanceReport(startDate, endDate, period);

		return res.status(200).json({
			status: true,
			message: 'Attendance report generated successfully',
			data: report
		});
	} catch (error) {
		console.error('Error generating attendance report:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error generating attendance report'
		});
	}
});

router.get('/batch-attendance/:batchId', [isCollege], async (req, res) => {
	try {
		const { batchId } = req.params;
		const { date, period = 'regularPeriod' } = req.query;

		if (!date) {
			return res.status(400).json({
				status: false,
				message: 'Date parameter is required'
			});
		}

		// Find all applied courses for this batch
		const appliedCourses = await AppliedCourses.find({
			batch: batchId,
			isBatchAssigned: true
		}).populate('_candidate', 'name mobile email');

		const attendanceData = [];

		for (const appliedCourse of appliedCourses) {
			const attendanceDate = new Date(date);
			const session = appliedCourse.attendance[period].sessions.find(
				s => s.date.toDateString() === attendanceDate.toDateString()
			);

			attendanceData.push({
				appliedCourseId: appliedCourse._id,
				candidate: appliedCourse._candidate,
				attendance: session ? session.status : 'Not Marked',
				remarks: session ? session.remarks : '',
				markedAt: session ? session.markedAt : null
			});
		}

		return res.status(200).json({
			status: true,
			message: 'Batch attendance retrieved successfully',
			data: {
				batchId,
				date,
				period,
				totalStudents: attendanceData.length,
				attendanceData
			}
		});
	} catch (error) {
		console.error('Error retrieving batch attendance:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error retrieving batch attendance'
		});
	}
});

router.put('/update-attendance/:appliedCourseId', [isCollege], async (req, res) => {
	try {
		const { appliedCourseId } = req.params;
		const { date, status, period = 'regularPeriod', remarks = '' } = req.body;
		const markedBy = req.user._id;

		if (!date || !status) {
			return res.status(400).json({
				status: false,
				message: 'Date and status are required'
			});
		}

		const appliedCourse = await AppliedCourses.findById(appliedCourseId);
		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: 'Applied course not found'
			});
		}

		await appliedCourse.markAttendance(date, status, period, markedBy, remarks);

		return res.status(200).json({
			status: true,
			message: 'Attendance updated successfully',
			data: appliedCourse
		});
	} catch (error) {
		console.error('Error updating attendance:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error updating attendance'
		});
	}
});

// Mark attendance for entire batch
router.post('/batch-mark-attendance', [isCollege], async (req, res) => {
	try {
		const { batchId, date, status, period = 'regularPeriod', remarks = '' } = req.body;
		const markedBy = req.user._id;

		if (!batchId || !date || !status) {
			return res.status(400).json({
				status: false,
				message: 'batchId, date, and status are required'
			});
		}

		// Find all applied courses for this batch
		const appliedCourses = await AppliedCourses.find({
			batch: batchId,
			isBatchAssigned: true
		});

		if (appliedCourses.length === 0) {
			return res.status(404).json({
				status: false,
				message: 'No students found for this batch'
			});
		}

		const results = [];
		const errors = [];

		// Mark attendance for each student in the batch
		for (const appliedCourse of appliedCourses) {
			try {
				await appliedCourse.markAttendance(date, status, period, markedBy, remarks);

				results.push({
					appliedCourseId: appliedCourse._id,
					candidateId: appliedCourse._candidate,
					status: 'success'
				});
			} catch (error) {
				errors.push({
					appliedCourseId: appliedCourse._id,
					candidateId: appliedCourse._candidate,
					error: error.message
				});
			}
		}

		return res.status(200).json({
			status: true,
			message: `Batch attendance marked successfully. ${results.length} successful, ${errors.length} failed`,
			data: {
				batchId,
				date,
				period,
				successful: results,
				failed: errors,
				totalStudents: appliedCourses.length,
				successCount: results.length,
				errorCount: errors.length
			}
		});
	} catch (error) {
		console.error('Error marking batch attendance:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error marking batch attendance'
		});
	}
});


// API to move student to zero period
router.post('/move-candidate-status/:appliedCourseId', [isCollege], async (req, res) => {
	try {
		let { appliedCourseId } = req.params;
		const { status, dropoutReason } = req.body;

		const markedBy = req.user._id;

		if (typeof appliedCourseId === 'string') {
			appliedCourseId = new mongoose.Types.ObjectId(appliedCourseId);
		}

		// Find the applied course
		const appliedCourse = await AppliedCourses.findById(appliedCourseId);
		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: 'Applied course not found'
			});
		}
		if (status === 'Move in Zero Period') {

			// Check if student is already in zero period
			if (appliedCourse.isZeroPeriodAssigned) {
				return res.status(400).json({
					status: false,
					message: 'Student is already in zero period'
				});
			}

			// Move student to zero period
			appliedCourse.isZeroPeriodAssigned = true;
			appliedCourse.zeroPeriodAssignedBy = markedBy;
			appliedCourse.zeroPeriodAssignedAt = new Date();


			await appliedCourse.save();


			const newStatusLogs = await statusLogHelper(appliedCourseId, {
				zeroPeriodAssigned: true
			});


			return res.status(200).json({
				status: true,
				message: 'Student moved to zero period successfully',

			});
		}
		else if (status === 'Move in Batch Freeze') {
			// Check if student is already in batch freeze
			if (appliedCourse.isBatchFreeze) {
				return res.status(400).json({
					status: false,
					message: 'Student is already in batch freeze'
				});
			}

			// Move student to batch freeze
			appliedCourse.isBatchFreeze = true;
			appliedCourse.batchFreezeBy = markedBy;
			appliedCourse.batchFreezeAt = new Date();


			await appliedCourse.save();

			const newStatusLogs = await statusLogHelper(appliedCourseId, {
				batchFreezed: true
			});



			return res.status(200).json({
				status: true,
				message: 'Student moved to batch freeze successfully',

			});



		} else if (status === 'Dropout') {
			// Check if student is already in dropout
			if (appliedCourse.dropout) {
				return res.status(400).json({
					status: false,
					message: 'Student is already in dropout'
				});
			}

			// Move student to dropout
			appliedCourse.dropout = true;
			appliedCourse.dropoutBy = markedBy;
			appliedCourse.dropoutDate = new Date();
			appliedCourse.dropoutReason = dropoutReason;

			await appliedCourse.save();


			const newStatusLogs = await statusLogHelper(appliedCourseId, {
				dropOut: true
			});



			return res.status(200).json({
				status: true,
				message: 'Student moved to dropout successfully',

			});
		}
		else if (status === 'Move to Placements') {
			if (appliedCourse.movetoplacementstatus) {
				return res.status(400).json({
					status: false,
					message: 'Student is already moved to placements'
				});
			}

			// Move student to placements
			appliedCourse.movetoplacementstatus = true;

			await appliedCourse.save();

			const newStatusLogs = await statusLogHelper(appliedCourseId, {
				movedToPlacement: true
			});

			return res.status(200).json({
				status: true,
				message: 'Student moved to placements successfully',

			});
		}

	} catch (error) {
		console.error('Error moving student:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error moving student'
		});
	}

});

// API to remove student from zero period
router.post('/remove-from-zero-period/:appliedCourseId', [isCollege], async (req, res) => {
	try {
		let { appliedCourseId } = req.params;
		const { remarks } = req.body;
		const markedBy = req.user._id;
		if (typeof appliedCourseId === 'string') {
			appliedCourseId = new mongoose.Types.ObjectId(appliedCourseId);
		}

		// Find the applied course
		const appliedCourse = await AppliedCourses.findById(appliedCourseId);
		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: 'Applied course not found'
			});
		}

		// Check if student is not in zero period
		if (!appliedCourse.isZeroPeriodAssigned) {
			return res.status(400).json({
				status: false,
				message: 'Student is not in zero period'
			});
		}

		// Remove student from zero period
		appliedCourse.isZeroPeriodAssigned = false;
		appliedCourse.zeroPeriodAssignedBy = null;
		appliedCourse.zeroPeriodAssignedAt = null;

		// Add to attendance record if remarks provided
		if (remarks && remarks.trim()) {
			const today = new Date();
			const todayString = today.toDateString();

			// Initialize zero period attendance if not exists
			if (!appliedCourse.attendance.zeroPeriod) {
				appliedCourse.attendance.zeroPeriod = {
					sessions: []
				};
			}

			// Find today's session or create new one
			let todaySession = appliedCourse.attendance.zeroPeriod.sessions.find(
				session => session.date.toDateString() === todayString
			);

			if (!todaySession) {
				todaySession = {
					date: today,
					status: 'absent',
					markedBy: markedBy,
					remarks: remarks.trim()
				};
				appliedCourse.attendance.zeroPeriod.sessions.push(todaySession);
			} else {
				todaySession.status = 'absent';
				todaySession.markedBy = markedBy;
				todaySession.remarks = remarks.trim();
			}
		}

		await appliedCourse.save();

		return res.status(200).json({
			status: true,
			message: 'Student removed from zero period successfully',
			data: {
				appliedCourseId: appliedCourse._id,
				candidateId: appliedCourse._candidate,
				isZeroPeriodAssigned: appliedCourse.isZeroPeriodAssigned
			}
		});

	} catch (error) {
		console.error('Error removing student from zero period:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error removing student from zero period'
		});
	}
});

// API to get zero period students for a batch
router.get('/zero-period-students/:batchId', [isCollege], async (req, res) => {
	try {
		const { batchId } = req.params;

		// Find all students in zero period for this batch
		const zeroPeriodStudents = await AppliedCourses.find({
			batch: batchId,
			isBatchAssigned: true,
			isZeroPeriodAssigned: true
		}).populate('_candidate', 'name mobile email')
			.populate('zeroPeriodAssignedBy', 'name')
			.select('_candidate zeroPeriodAssignedBy zeroPeriodAssignedAt attendance.zeroPeriod');

		return res.status(200).json({
			status: true,
			message: 'Zero period students retrieved successfully',
			data: {
				batchId,
				students: zeroPeriodStudents,
				count: zeroPeriodStudents.length
			}
		});

	} catch (error) {
		console.error('Error fetching zero period students:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error fetching zero period students'
		});
	}
});

router.post('/questionAnswer', [isCollege], async (req, res) => {
	try {
		const { appliedcourse, responses, visitDate } = req.body;

		if (!appliedcourse || !responses || !Array.isArray(responses) || responses.length === 0) {
			return res.status(400).json({
				status: false,
				message: 'Applied course ID and a non-empty responses array are required'
			});
		}

		const courseExists = await AppliedCourses.findById(appliedcourse);
		if (!courseExists) {
			return res.status(404).json({
				status: false,
				message: 'Applied course not found'
			});
		}


		const response = responses.map(response => {
			if (response.question === 'Are you Going to Attend Center for Physical Counselling' && visitDate) {
				return {
					...response,
					visitDate: visitDate
				};
			}
			return response;
		});

		// Check if question answer already exists for this applied course
		const existingQuestionAnswer = await QuestionAnswer.findOne({ appliedcourse });
		if (existingQuestionAnswer) {
			// Update existing record
			existingQuestionAnswer.responses = responses;
			await existingQuestionAnswer.save();

			return res.status(200).json({
				status: true,
				message: 'Question answer updated successfully',
				data: existingQuestionAnswer
			});
		}


		// Create new question answer entry
		const questionAnswer = new QuestionAnswer({
			appliedcourse,
			responses: response
		});

		await questionAnswer.save();

		return res.status(201).json({
			status: true,
			message: 'Question answer created successfully',
			data: questionAnswer
		});
	} catch (error) {
		console.error('Error creating question answer:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error creating question answer'
		});
	}
});


// Get question answers for an applied course

router.get('/questionAnswer/:appliedcourseId', [isCollege], async (req, res) => {
	try {
		const { appliedcourseId } = req.params;
		// console.log("appliedcourseId", appliedcourseId)

		if (!appliedcourseId) {
			return res.status(400).json({
				status: false,
				message: 'Applied course ID is required'
			});
		}

		const questionAnswer = await QuestionAnswer.findOne({ appliedcourse: appliedcourseId });

		if (!questionAnswer) {
			return res.status(404).json({
				status: false,
				message: 'No question answers found for this applied course'
			});
		}

		// Get visit dates for this applied course
		const visitDates = await CandidateVisitCalender.find({
			appliedCourse: appliedcourseId
		}).sort({ visitDate: 1 });

		return res.status(200).json({
			status: true,
			message: 'Question answers retrieved successfully',
			data: {
				...questionAnswer.toObject(),
				visitDates: visitDates
			}
		});
	} catch (error) {
		console.error('Error fetching question answers:', error);
		return res.status(500).json({
			status: false,
			message: error.message || 'Error fetching question answers'
		});
	}
});

// Visit Calendar APIs
router.post('/visit-calendar', [isCollege], async (req, res) => {
	try {
		const { visitDate, visitType, appliedCourseId, includeQuestionAnswers } = req.body;

		if (!visitDate || !visitType || !appliedCourseId) {
			return res.status(400).json({
				status: false,
				message: 'Missing required fields: visitDate, visitType, appliedCourseId'
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
			status: true,
			message: 'Visit scheduled successfully',
			data: newVisit
		});

	} catch (error) {
		console.error('Error creating visit calendar:', error);
		res.status(500).json({
			status: false,
			message: 'Internal server error'
		});
	}
});

router.get('/visit-calendar/:appliedCourseId', [isCollege], async (req, res) => {
	try {
		const { appliedCourseId } = req.params;

		if (!appliedCourseId) {
			return res.status(400).json({
				status: false,
				message: 'Applied course ID is required'
			});
		}

		const visits = await CandidateVisitCalender.find({
			appliedCourse: appliedCourseId
		})
			.populate('appliedCourse')
			.populate('createdBy', 'name email')
			.sort({ visitDate: 1 });

		res.json({
			status: true,
			data: visits
		});
	} catch (error) {
		console.error('Error fetching visit calendar:', error);
		res.status(500).json({
			status: false,
			message: 'Internal server error'
		});
	}
});

router.put('/visit-calendar/:visitId', [isCollege], async (req, res) => {
	try {
		const { visitId } = req.params;
		const { status, remarks } = req.body;

		if (!visitId) {
			return res.status(400).json({
				status: false,
				message: 'Visit ID is required'
			});
		}

		const visit = await CandidateVisitCalender.findByIdAndUpdate(
			visitId,
			{
				status,
				remarks,
				updatedBy: req.user._id,
				statusUpdatedAt: new Date()
			},
			{ new: true }
		).populate('appliedCourse')
			.populate('createdBy', 'name email')
			.populate('updatedBy', 'name email');

		if (!visit) {
			return res.status(404).json({
				status: false,
				message: 'Visit not found'
			});
		}

		res.json({
			status: true,
			message: 'Visit status updated successfully',
			data: visit
		});
	} catch (error) {
		console.error('Error updating visit calendar:', error);
		res.status(500).json({
			status: false,
			message: 'Internal server error'
		});
	}
});

router.get("/appliedCourses/:candidateId", async (req, res) => {
	try {
		const { candidateId } = req.params;
		// console.log("candidateId", candidateId)

		// Find candidate
		const candidate = await Candidate.findOne({
			_id: candidateId,
			isDeleted: false,
			status: true
		});

		if (!candidate || !candidate?.appliedCourses?.length) {
			return res.json({
				courses: [],
			});
		}
		// console.log("candidate1", candidate)

		//   // Get paginated applied course entries
		const courses = await AppliedCourses.find({ _candidate: candidate._id })
			.populate({ path: '_course', populate: { path: 'sectors' } })
			.sort({ createdAt: -1 })
		// .skip((page - 1) * perPage)
		// .limit(perPage);

		//   const count = await AppliedCourses.countDocuments({ _candidate: candidate._id });

		//   const totalPages = Math.ceil(count / perPage);

		// console.log('courses', courses)

		return res.json({
			courses,
		});

	} catch (err) {
		console.log("Caught error:", err);
		return res.status(500).json({ status: "failure", message: "Internal Server Error" });
	}
});

router.get("/appliedJobs/:candidateId", async (req, res) => {
	try {

		// console.log('applied jobs...')
		let { candidateId } = req.params;
		// console.log("candidateId", candidateId)

		if(!candidateId){
			return res.json({
				jobs: []
			});
		}

		if(typeof candidateId === 'string' && mongoose.Types.ObjectId.isValid(candidateId)){
			candidateId = new mongoose.Types.ObjectId(candidateId);
		}


		const jobHistory = await AppliedJobs.find({ _candidate: candidateId }).populate({ path: '_job' })
		// console.log('jobHistory', jobHistory)
		// 	  if(!candidate || !candidate?.appliedJobs?.length){
		// 		return res.json({
		// 			jobs: []
		// 		});
		// 	  }
		// 	  console.log('candidate_new' , candidate)

		// 	  const agg = [
		// 		{ $match: { _candidate: candidate._id } },
		// 		{
		// 		  $lookup: {
		// 			from: "companies",
		// 			localField: "_company",
		// 			foreignField: "_id",
		// 			as: "_company"
		// 		  }
		// 		},
		// 		{ $unwind: "$_company" },
		// 		{
		// 		  $match: {
		// 			"_company.isDeleted": false,
		// 			"_company.status": true
		// 		  }
		// 		},
		// 		{
		// 		  $lookup: {
		// 			from: "vacancies",
		// 			localField: "_job",
		// 			foreignField: "_id",
		// 			as: "vacancy"
		// 		  }
		// 		},
		// 		{ $unwind: "$vacancy" },
		// 		{
		// 		  $match: {
		// 			"vacancy.status": true,
		// 			"vacancy.validity": { $gte: new Date() }
		// 		  }
		// 		},
		// 		{
		// 		  $lookup: {
		// 			from: "qualifications",
		// 			localField: "vacancy._qualification",
		// 			foreignField: "_id",
		// 			as: "qualifications"
		// 		  }
		// 		},
		// 		{
		// 		  $lookup: {
		// 			from: "industries",
		// 			localField: "vacancy._industry",
		// 			foreignField: "_id",
		// 			as: "industry"
		// 		  }
		// 		},
		// 		{
		// 		  $lookup: {
		// 			from: "cities",
		// 			localField: "vacancy.city",
		// 			foreignField: "_id",
		// 			as: "city"
		// 		  }
		// 		},
		// 		{
		// 		  $lookup: {
		// 			from: "states",
		// 			localField: "vacancy.state",
		// 			foreignField: "_id",
		// 			as: "state"
		// 		  }
		// 		},
		// 		{
		// 		  $sort: {
		// 			"vacancy.sequence": 1,
		// 			"vacancy.createdAt": -1
		// 		  }
		// 		},
		// 		// {
		// 		//   $facet: {
		// 		// 	metadata: [{ $count: "total" }],
		// 		// 	data: [
		// 		// 	  { $skip: (parseInt(page) - 1) * parseInt(perPage) },
		// 		// 	  { $limit: parseInt(perPage) }
		// 		// 	]
		// 		//   }
		// 		// }
		// 	  ];
		//   console.log('agg' , agg)
		// 	  const appliedJobs = await AppliedJobs.aggregate(agg);
		// 	//   const count = appliedJobs[0].metadata[0]?.total || 0;
		// 	//   const jobs = appliedJobs[0].data || [];
		// 	//   const totalPages = Math.ceil(count / parseInt(perPage));

		// console.log('appliedJobs' , appliedJobs)

		// 	  return res.json({
		// 		jobs
		// 	  });
		return res.json({
			jobs: jobHistory
		});

	} catch (err) {
		console.log("Caught error:", err);
		return res.status(500).json({ status: "failure", message: "Internal Server Error" });
	}
});

router.get('/calendar-visit-data', [isCollege], async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		// console.log("Query params:", req.query);

		const collegeId = req.college?._id;
		// console.log("collegeId", collegeId)
		if (!collegeId) {
			return res.status(400).json({
				status: false,
				message: 'College information not found'
			});
		}

		// console.log("College ID:", collegeId);

		// Get ALL CandidateVisitCalender data (for debugging)
		const allVisits = await CandidateVisitCalender.find({}).populate({
			path: 'appliedCourse',
			model: 'AppliedCourses',
			populate: [
				{
					path: '_candidate',
					model: 'CandidateProfile',
					select: 'name mobile email'
				},
				{
					path: '_course',
					model: 'courses',
					select: 'name'
				},
				{
					path: '_center',
					model: 'Center',
					select: 'name'
				},
				{
					path: 'batch',
					model: 'Batch',
					select: 'name'
				}
			]
		}).populate('updatedBy');

		// console.log("allVisits", allVisits)

		// ✅ Apply date filtering if startDate and endDate are provided
		let filteredVisits = allVisits;
		if (startDate && endDate) {
			// console.log("🔍 Filtering by date range:", { startDate, endDate });
			filteredVisits = allVisits.filter(visit => {
				const visitDate = new Date(visit.visitDate);
				const start = new Date(startDate);
				const end = new Date(endDate);
				const isInRange = visitDate >= start && visitDate <= end;
				// console.log(`Visit ${visit._id}: ${visit.visitDate} - In range: ${isInRange}`);
				return isInRange;
			});
			// console.log(`📊 Filtered visits: ${filteredVisits.length} out of ${allVisits.length}`);
		}

		// Format data for frontend calendar
		const calendarData = filteredVisits.map(visit => {
			const appliedCourse = visit.appliedCourse;
			const candidate = appliedCourse._candidate;
			const course = appliedCourse._course;
			const center = appliedCourse._center;
			const batch = appliedCourse.batch;

			return {
				id: visit._id,
				title: `${candidate?.name || 'Unknown'} - ${visit.visitType}`,
				start: visit.visitDate,
				end: visit.visitDate,
				visitType: visit.visitType,
				visitDate: visit.visitDate,
				status: visit.status,
				appliedCourseId: appliedCourse._id,
				candidateId: appliedCourse._candidate,
				candidateName: candidate?.name || 'Unknown',
				candidateMobile: candidate?.mobile || 'Unknown',
				candidateEmail: candidate?.email || 'Unknown',
				courseId: appliedCourse._course,
				courseName: course?.name || 'Unknown Course',
				centerName: center?.name || 'Unknown Center',
				batchName: batch?.name || 'No Batch',
				createdAt: visit.createdAt,
				updatedAt: visit.updatedAt,
				remarks: visit.remarks,
				updatedBy: visit.updatedBy?.name || 'Unknown',
				statusUpdatedAt: visit.statusUpdatedAt
			};
		});

		// console.log("Formatted Calendar Data:", calendarData);


		return res.json({
			status: true,
			message: 'Calendar visit data fetched successfully',
			data: calendarData,
			totalVisits: calendarData.length
		});

	} catch (error) {
		console.error('Error fetching calendar visit data:', error);
		res.status(500).json({
			status: false,
			message: 'Error fetching calendar visit data'
		});
	}
});

// router.get('/testverification', [isCollege], async (req, res) => {
// 	try {
// 		const { startDate, endDate } = req.query;
// 		const filter = {
// 			createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
// 		};
// 		const statusLogFilter = {
// 			createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
// 			kycStage: true
// 		};

// 		// Get status logs and total leads in parallel
// 		const [statusLogs, totalLeads] = await Promise.all([
// 			StatusLogs.find(statusLogFilter),
// 			AppliedCourses.countDocuments(filter)
// 		]);

// 		// Extract applied IDs from status logs
// 		const appliedIds = statusLogs.map(log => log._appliedId);

// 		// Get question answers for these specific applied IDs
// 		const questionAnswers = await QuestionAnswer.find({
// 			appliedcourse: { $in: appliedIds }
// 		});

// 		// Create set for fast lookup
// 		const verifiedAppliedIds = new Set(
// 			questionAnswers.map(qa => qa.appliedcourse.toString())
// 		);

// 		// Calculate counts
// 		let verifiedCount = 0;
// 		let unverifiedCount = 0;

// 		statusLogs.forEach(statusLog => {
// 			const appliedId = statusLog._appliedId.toString();
// 			if (verifiedAppliedIds.has(appliedId)) {
// 				verifiedCount++;
// 			} else {
// 				unverifiedCount++;
// 			}
// 		});

// 		// Use totalLeads (AppliedCourses count) as the main total
// 		const totalCount = totalLeads;

// 		// console.log("totalCount (totalLeads)", totalCount);
// 		// console.log("statusLogsCount", statusLogs.length);
// 		// console.log("unverifiedCount", unverifiedCount);
// 		// console.log("verifiedCount", verifiedCount);

// 		return res.json({
// 			success: true,
// 			data: {
// 				totalCount: totalCount,
// 				unverifiedCount: unverifiedCount,
// 				verifiedCount: verifiedCount
// 			}
// 		});

// 	} catch (err) {
// 		console.error('Error in testverification endpoint:', err);
// 		res.status(500).json({
// 			success: false,
// 			message: 'Error fetching statistics',
// 			error: err.message
// 		});
// 	}
// });

router.get('/preVerifieedCount', [isCollege], async (req, res) => {
	try {
		// console.log('verified api..')
		let { startDate, endDate } = req.query;



		if (!startDate) {
			startDate = new Date().setHours(0, 0, 0, 0)

		}

		if (!endDate) {
			endDate = new Date().setHours(23, 59, 59, 999)
		}


		const startDateObj = new Date(startDate);
		startDateObj.setHours(0, 0, 0, 0);

		const endDateObj = new Date(endDate);
		endDateObj.setHours(23, 59, 59, 999);

		const filter = {
			createdAt: { $gte: startDateObj, $lte: endDateObj }
		};

		const statusLogFilter = {
			createdAt: { $gte: startDateObj, $lte: endDateObj },
			kycStage: true
		};

		// Get status logs and total leads in parallel
		const [statusLogs, verified] = await Promise.all([
			StatusLogs.find(statusLogFilter),
			QuestionAnswer.find(filter)
		]);



		let unVerified = []

		statusLogs.forEach(qa => {

			const unverifiedlog = verified.find(log => {
				log.appliedcourse.toString() === qa._appliedId.toString()

			})

			if (!unverifiedlog || unverifiedlog.length === 0) {
				unVerified.push(qa._appliedId)
			}

		})

		// console.log("unVerified", unVerified)

		  return res.json({
			success: true,
			data: {			 
			  unverifiedCount:unVerified.length,
			  verifiedCount:verified.length
			}
		  });

	} catch (err) {
		console.error('Error in testverification endpoint:', err);
		res.status(500).json({
			success: false,
			message: 'Error fetching statistics',
			error: err.message
		});
	}
});


// router.get('/testverification', [isCollege], async (req, res) => {
// 	try {
// 		const { startDate, endDate } = req.query
// 		const filter = {
// 			createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
// 		}
// 		const statusLogFilter = {
// 			createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
// 			, kycStage: true
// 		}
// 		const statusLogs = await StatusLogs.find(statusLogFilter);
// 		const verified = await QuestionAnswer.find(filter);
// 		const unverified = [];


// 		const totalLeads = await AppliedCourses.countDocuments(filter);
// 		statusLogs.forEach(async (statusLog) => {
// 			const _appliedId = statusLog._appliedId;
// 			const questionAnswer = await QuestionAnswer.find({ appliedcourse: _appliedId });
// 			if(questionAnswer.length === 0){
// 				unverified.push(_appliedId);
// 			}
// 		})


// 		const totalCount = statusLogs.length
// 		const unverifiedCount = unverified.length
// 		const verifiedCount = verified.length
// console.log("totalCount", totalLeads)
// console.log("unverifiedCount", unverifiedCount)
// console.log("verifiedCount", verifiedCount)

// 		return res.json({
// 			success: true,
// 			data: {
// 				totalCount: totalCount,
// 				unverifiedCount: unverifiedCount,
// 				verifiedCount: verifiedCount
// 			}
// 		})



// 	}
// 	catch (err) {
// 		res.status(500).json({
// 			success: false,
// 			message: 'Error fetching statistics',
// 			error: err.message
// 		});
// 	}
// })

router.get('/pre-verification-stats', [isCollege], async (req, res) => {
	try {

		const { date, startDate, endDate } = req.query;

		let query = {};
		// If a single date is provided
		if (date) {
			const startOfDay = new Date(date);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(date);
			endOfDay.setHours(23, 59, 59, 999);

			query.createdAt = { $gte: startOfDay, $lte: endOfDay };
		}
		// If a date range is provided
		else if (startDate && endDate) {
			const start = new Date(startDate);
			start.setHours(0, 0, 0, 0);
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);

			query.createdAt = { $gte: start, $lte: end };
		}

		// Count based on filters (or all if no filters)
		const totalCount = await QuestionAnswer.countDocuments(query);

		if (!date && !startDate && !endDate) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);

			const todayCount = await QuestionAnswer.countDocuments({
				createdAt: { $gte: today, $lt: tomorrow }
			});

			return res.json({
				success: true,
				data: {
					today: todayCount,
					total: totalCount
				}
			});
		}

		// If specific date or range is provided
		return res.json({
			success: true,
			data: {
				count: totalCount,
				date: date || `${startDate} to ${endDate}`
			}
		});

	} catch (error) {
		console.error('Error fetching pre-verification stats:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching statistics',
			error: error.message
		});
	}
});

router.get('/pre-verification-weekly-stats', [isCollege], async (req, res) => {
	try {
		const { weeks = 4 } = req.query;
		const stats = [];

		for (let i = 0; i < parseInt(weeks); i++) {
			const endDate = new Date();
			endDate.setDate(endDate.getDate() - (i * 7));
			const startDate = new Date(endDate);
			startDate.setDate(startDate.getDate() - 6);

			const count = await QuestionAnswer.countDocuments({
				createdAt: { $gte: startDate, $lte: endDate }
			});

			stats.push({
				week: i + 1,
				startDate: startDate.toISOString().split('T')[0],
				endDate: endDate.toISOString().split('T')[0],
				count: count
			});
		}

		res.json({
			success: true,
			data: stats.reverse()
		});

	} catch (error) {
		console.error('Error fetching weekly stats:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching weekly statistics'
		});
	}
});
// API for Counselor Performance Matrix using statusLogs
router.get('/counselor-performance-matrix', isCollege, async (req, res) => {
	try {
		const { startDate, endDate, centerId } = req.query;

		// Build date filter
		let dateFilter = {};
		if (startDate && endDate) {
			dateFilter.createdAt = {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			};
		}

		// Build center filter
		let centerFilter = {};
		if (centerId && centerId !== 'all') {
			centerFilter._collegeId = centerId;
		}

		// Aggregate statusLogs data for counselor performance
		const counselorMatrixData = await StatusLogs.aggregate([
			{
				$match: {
					...dateFilter,
					...centerFilter
				}
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
				$unwind: '$appliedCourse'
			},
			{
				$lookup: {
					from: 'counsellors',
					localField: 'counsellor',
					foreignField: '_id',
					as: 'counselorInfo'
				}
			},
			{
				$unwind: '$counselorInfo'
			},
			{
				$lookup: {
					from: 'statuses',
					localField: '_statusId',
					foreignField: '_id',
					as: 'statusInfo'
				}
			},
			{
				$lookup: {
					from: 'substatuses',
					localField: '_subStatusId',
					foreignField: '_id',
					as: 'subStatusInfo'
				}
			},
			{
				$group: {
					_id: {
						counselorId: '$counsellor',
						counselorName: '$counselorInfo.name',
						statusId: '$_statusId',
						statusTitle: { $arrayElemAt: ['$statusInfo.title', 0] },
						subStatusId: '$_subStatusId',
						subStatusTitle: { $arrayElemAt: ['$subStatusInfo.title', 0] }
					},
					count: { $sum: 1 },
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
					uniqueAppliedCourses: { $addToSet: { $concat: ['$_id.counselorId', '-', { $toString: '$_appliedId' }] } }
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

		// Transform data to match frontend format
		const transformedData = {};

		counselorMatrixData.forEach(counselor => {
			const counselorName = counselor.counselorName || 'Unknown';

			transformedData[counselorName] = {
				Total: counselor.totalLeads,
				KYCDone: counselor.totalKycApproved,
				KYCStage: counselor.totalKycStage,
				Admissions: counselor.totalAdmissions,
				Dropouts: counselor.totalDropouts,
				Paid: counselor.totalAdmissions, // Assuming admissions are paid
				Unpaid: counselor.totalLeads - counselor.totalAdmissions,
				ConversionRate: parseFloat(counselor.conversionRate.toFixed(1)),
				DropoutRate: parseFloat(counselor.dropoutRate.toFixed(1))
			};

			// Add status-wise data
			counselor.statuses.forEach(statusData => {
				const statusTitle = statusData.statusTitle || 'Unknown';
				const subStatusTitle = statusData.subStatusTitle;

				if (!transformedData[counselorName][statusTitle]) {
					transformedData[counselorName][statusTitle] = {
						count: 0,
						substatuses: {}
					};
				}

				transformedData[counselorName][statusTitle].count += statusData.count;

				if (subStatusTitle) {
					if (!transformedData[counselorName][statusTitle].substatuses[subStatusTitle]) {
						transformedData[counselorName][statusTitle].substatuses[subStatusTitle] = 0;
					}
					transformedData[counselorName][statusTitle].substatuses[subStatusTitle] += statusData.count;
				}
			});
		});

		return res.json({
			status: true,
			message: 'Counselor Performance Matrix data fetched successfully',
			data: transformedData,
			summary: {
				totalCounselors: Object.keys(transformedData).length,
				totalLeads: Object.values(transformedData).reduce((sum, counselor) => sum + counselor.Total, 0),
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


router.patch('/updatecalendarevent', [isCollege], async (req, res) => {
	try {
		const { eventId, status, remarks } = req.body;
		const user = req.user;

		// console.log("eventId", req.body)

		const candidateVisitCalender = await CandidateVisitCalender.findById(eventId)
		if (!candidateVisitCalender) {
			return res.status(404).json({
				status: false,
				message: 'Candidate visit calender not found'
			})
		}

		const updatedBy = user._id;
		const statusUpdatedAt = new Date();

		candidateVisitCalender.status = status;
		candidateVisitCalender.updatedBy = updatedBy;
		candidateVisitCalender.statusUpdatedAt = statusUpdatedAt;
		candidateVisitCalender.remarks = remarks;
		await candidateVisitCalender.save();

		// console.log("candidateVisitCalender", candidateVisitCalender)

		return res.status(200).json({
			status: true,
			message: 'Candidate visit calender updated successfully'
		})



	}
	catch (err) {
		console.error('Error in updatecalendarevent:', err);
	}
})


router.get('/misreport/:batchId', [isCollege], async (req, res) => {
	try {
		// console.log("misreport api hitting..");

		const { batchId } = req.params;

		if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
			return res.status(400).json({
				status: false,
				message: 'Valid Batch ID is required'
			});
		}

		const appliedCourses = await AppliedCourses.aggregate([
			{
				$match: {
					batch: new mongoose.Types.ObjectId(batchId),
					isBatchFreeze: true,
					dropout: false
				}
			},
			{
				$lookup: {
					from: "courses",
					localField: "_course",
					foreignField: "_id",
					as: "course"
				}
			},
			{ $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },

			{
				$lookup: {
					from: "coursesectors",
					localField: "course.sectors",
					foreignField: "_id",
					as: "sector"
				}
			},
			{ $unwind: { path: '$sector', preserveNullAndEmptyArrays: true } },

			{
				$lookup: {
					from: 'batches',
					localField: 'batch',
					foreignField: '_id',
					as: 'batch'
				}
			},
			{ $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },

			{
				$lookup: {
					from: 'candidateprofiles',
					localField: '_candidate',
					foreignField: '_id',
					as: 'candidate'
				}
			},
			{ $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },

			{
				$group: {
					_id: '$_id',
					course: { $first: '$course.name' },
					sector: { $first: '$sector.name' },
					batch: { $first: '$batch.name' },
					startDate: { $first: '$batch.startDate' },
					endDate: { $first: '$batch.endDate' },
					candidateName: { $first: '$candidate.name' },
					mobile: { $first: '$candidate.mobile' },
					email: { $first: '$candidate.email' },
					dob: { $first: '$candidate.dob' },
					gender: { $first: '$candidate.sex' },
					address: { $first: '$candidate.personalInfo.currentAddress' }
				}
			}
		]);

		// console.log("appliedCourses:", appliedCourses);
		res.status(200).json({
			status: true,
			message: 'MIS report fetched successfully',
			data: appliedCourses,
			totalCount: appliedCourses.length
		});

	} catch (err) {
		console.error('Error in misreport:', err);
		res.status(500).json({
			status: false,
			message: 'Error in fetching misreport',
			error: err.message
		});
	}
});

router.get('/reEnquireData', async(req , res)=>{
    try{

        const reEnquireData = await ReEnquire.find();
        // console.log("reEnquireData...", reEnquireData);
        res.status(200).json({
            status: true,
            msg: "ReEnquire data retrieved successfully",
            data: reEnquireData
        });
    }
    catch(err){
        res.status(500).json({
            status: false,
            msg: "Failed to get reEnquire data",
            error: err.message
        });
    }
})

// router.get('/calender-visit-data', [isCollege], async (req, res) => {
// 	try{}
// 	catch(err){}
// })
module.exports = router;
