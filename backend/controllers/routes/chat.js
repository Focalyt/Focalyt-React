const express = require("express");
const moment = require("moment");
const crypto = require("crypto");
const axios = require("axios")
// const ObjectId = require("mongodb").ObjectId;
const mongoose = require('mongoose');
require('dotenv').config()
const { extraEdgeAuthToken, extraEdgeUrl, env, fbConversionAccessToken, fbConversionPixelId } = require("../../config");

const router = express.Router();
const Razorpay = require("razorpay");
const apiKey = process.env.MIPIE_RAZORPAY_KEY;
const razorSecretKey = process.env.MIPIE_RAZORPAY_SECRET;

const {
	coinsOffers, PaymentDetails, CoinsAlgo, Vacancy, Courses, Company, AppliedJobs, AppliedCourses, User, CandidateCashBack, FAQ
} = require("../models");

const Candidate = require('../models/candidateProfile');
const {msg91WelcomeTemplate} = require('../../config')
const {sendSms, sendMail} = require('../../helpers')

const { sendNotification } = require('./services/notification');
const { CandidateValidators } = require('../../helpers/validators')
const { updateSpreadSheetValues } = require("./services/googleservice")
const { candidateProfileCashBack, candidateVideoCashBack, candidateApplyCashBack, checkCandidateCashBack, candidateReferalCashBack } = require('./services/cashback')

const chatRoutes = express.Router();
const commonRoutes = express.Router();



// Helper function to extract Meta parameters from cookies and URL


commonRoutes.post("/registration", async (req, res) => {
	try {
		console.log("Received data from frontend:", req.body); 
		
		const { name, mobile, sex} = req.body;
  
		
		const dataCheck = await Candidate.findOne({ mobile: mobile });
		if (dataCheck) {
		  return res.send({
			status: "failure",
			error: "Candidate mobile already registered",
		  });
		}
  
		const datacheck2 = await User.findOne({ mobile, role: "3" });
  
		if (datacheck2) {
		  return res.send({
			status: "failure",
			error: "User mobile already exist!",
		  });
		}
  
		
  
		const usr = await User.create({
		  name,
		  sex,
		  mobile,
		  role: 3,
		});
		if (!usr) {
		  console.log("usr not created");
		  throw req.ykError("candidate user not create!");
		}
  
		let coins = await CoinsAlgo.findOne();
		let candidateBody = {
		  name,
		  sex,
		  mobile,
		  
		};
  
		console.log("Candidate Data", candidateBody)
		
		const candidate = await Candidate.create(candidateBody);
  
		if (!candidate) {
		  console.log("candidate not created");
		  throw req.ykError("Candidate not create!");
		}
		
		
	   
  
		let phone = "91" + mobile.toString();
		let num = parseInt(phone);
  
		let body = {
		  flow_id: msg91WelcomeTemplate,
		  recipients: [
			{
			  mobiles: num,
			  var: name,
			},
		  ],
		};
  
		const data = sendSms(body);
		
		let notificationData = {
		  title: 'Signup',
		  message: `Complete your profile to get your dream job.`,
		  _candidate: candidate._id,
		  source: "System"
		}
		await sendNotification(notificationData)
		return res.send({
		  status: "success",
		  error: "Candidate added successfully!",
		});
	  } catch (err) {
		console.log("error is ", err);
		req.flash("error", err.message || "Something went wrong!");
		return res.send({ status: "failure", error: "Something went wrong!" });
	  }
	});

commonRoutes.post("/userverification", async (req, res) => {
	try {
		let { mobile } = req.body; // Request se mobile number le rahe hain

		// Validate mobile number
		let candidateMobile = { mobile };
		let { value, error } = await CandidateValidators.userMobile(candidateMobile);
		if (error) {
			console.log(error);
			return res.send({ status: "failure", error: "Something went wrong!", details: error });
		}

		// Database se candidate ki puri details fetch karna
		let candidateDetails = await Candidate.findOne({ mobile: mobile });

		if (!candidateDetails) {
			return res.send({ status: "failure", message: "Candidate not found" });
		}

		// Candidate details bhejna
		res.send({ status: true, CandidateDetails: candidateDetails });
	} catch (err) {
		console.log(err);
		return res.send({ status: false, error: err.message });
	}
});

commonRoutes.get("/joblist", async (req, res) => {
	try {
		let recentJobs = await Vacancy.find({ 
			status: true, 
			_company: { $ne: null }, 
			validity: { $gte: moment().utcOffset('+05:30') }, 
			verified: true,
			$or: [
				{ postingType: 'Public' },
				{ postingType: { $exists: false } }, // For backward compatibility
				{ postingType: null }
			]
		}).populate([
			{
				path: '_company',
				select: "name logo stateId cityId"
			},
			{
				path: "_industry",
				select: "name",
			},
			{
				path: "_jobCategory",
				select: "name",
			},
			{
				path: "_qualification",
				select: "name",
			},
			{
				path: "_subQualification",
				select: "name"
			},
			{
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},]).sort({ sequence: 1, createdAt: -1 });

		return res.send({ status: true, activeJobs: recentJobs });
	} catch (err) {
		return res.send({ status: false, err })
	}
})
commonRoutes.get("/courselist", async (req, res) => {
	try {
		const { courseType } = req.query;
		const COURSE_TYPES = ['coursejob', 'course'];

		let query = { 
			status: true,
			$or: [
				{ lastDateForApply: { $gte: moment().utcOffset('+05:30').startOf('day').toDate() } },
				{ lastDateForApply: { $exists: false } },
				{ lastDateForApply: null },
				{ lastDateForApply: '' }
			]
		};

		if (courseType && COURSE_TYPES.includes(courseType)) {
			query.courseType = courseType;
		} else {
			query.courseType = { $in: COURSE_TYPES };
		}

		let recentCourses = await Courses.find(query).populate({
			path: "sectors",
			select: "name id"
		})
			.sort({ createdAt: -1 });

		return res.send({ status: true, activeCourses: recentCourses });
	} catch (err) {
		return res.send({ status: false, err });
	}
});


commonRoutes.get("/jobDetails/:id", async (req, res) => {
	try {
		const { id } = req.params;

		let job = await Vacancy.findOne({ _id: id })
			.populate([
				{
					path: '_company',
					select: "name logo stateId cityId"
				},
				{
					path: "_industry",
					select: "name",
				},
				{
					path: "_jobCategory",
					select: "name",
				},
				{
					path: "_qualification",
					select: "name",
				},
				{
					path: "_subQualification",
					select: "name"
				},
				{
					path: "state",
					select: "name",
				},
				{
					path: "city",
					select: "name",
				}
			]);

		if (!job) {
			return res.status(404).send({ status: false, message: "Job not found" });
		}

		return res.send({ status: true, jobdetails: job });
	} catch (err) {
		return res.send({ status: false, err })
	}

})

commonRoutes.get("/coursedetails/:id", async (req, res) => {
	try {
		const { id } = req.params;
		let course = await Courses.findOne({ _id: id }).populate({
			path: "sectors",
			select: "name id"
		})

		return res.send({ status: true, courseDetails: course })
	}
	catch (err) {
		return res.send({ status: false, err })
	}
})

commonRoutes.post("/applyjob/:id", async (req, res) => {
	try {
		let { id } = req.params;
		let jobId = id;

		let validation = { mobile: req.body.mobile }
		let { value, error } = CandidateValidators.userMobile(validation)
		if (error) {
			return res.send({ status: "failure", error: "Something went wrong!", error });
		}
		let candidateMobile = value.mobile;
		let vacancy = await Vacancy.findOne({ _id: jobId });

		if (!vacancy) {
			return res.send({ status: false, msg: "Vacancy not Found!" });
		}

		let candidate = await Candidate.findOne({ mobile: candidateMobile });

		if (!candidate) {
			return res.send({ status: false, msg: "Candidate not found!" });
		}
		if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
			return res.send({ status: false, msg: "Already Applied" });
		} else {
			let alreadyApplied = await AppliedJobs.findOne({
				_candidate: candidate._id,
				_job: jobId,
			});
			if (alreadyApplied) {
				return res.send({ status: false, msg: "Already Applied" });
			};
			let apply = await Candidate.findOneAndUpdate(
				{ mobile: candidateMobile },
				{
					$addToSet: { appliedJobs: jobId }
				},
				{ new: true, upsert: true }
			);

			let data = {};
			data["_job"] = jobId;
			data["_candidate"] = candidate._id;
			data["_company"] = vacancy._company;

			const appliedData = await AppliedJobs.create(data);

			let sheetData = [candidate?.name, candidate?.mobile, candidate?.email, candidate?.sex, candidate?.dob ? moment(candidate?.dob).format('DD MMM YYYY') : '', candidate?.state?.name, candidate.city?.name, 'Job', `${process.env.BASE_URL}/jobdetailsmore/${jobId}`, "", "", moment(appliedData?.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm')]

			await updateSpreadSheetValues(sheetData)

			if (!apply) {
				return res.status(400).send({ status: false, msg: "Applied Failed!" });
			}
			let companyDetails = await Company.findOne({ _id: vacancy._company })
			let notificationData = {
				title: 'Applied Jobs',
				message: `You have applied to a job in ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} Keep applying to get a dream Job.__बधाई हो! आपने ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} में नौकरी के लिए आवेदन किया है |`,
				_candidate: candidate._id,
				source: 'System'
			}
			await sendNotification(notificationData);
			let newData = {
				title: 'New Applied',
				message: `${candidate.name} has recently applied for your job for ${vacancy.title}`,
				_company: vacancy._company
				, source: 'System'
			}
			await sendNotification(newData)
			
			// Send email to company when candidate applies
			console.log('=== JOB APPLICATION EMAIL PROCESS START (CHAT ROUTE) ===');
			console.log('Company Details:', {
				companyId: vacancy._company,
				companyName: companyDetails?.name,
				companyEmail: companyDetails?.email
			});
			console.log('Candidate Details:', {
				candidateId: candidate._id,
				candidateName: candidate.name,
				candidateMobile: candidate.mobile,
				candidateEmail: candidate.email
			});
			console.log('Job Details:', {
				jobId: jobId,
				jobTitle: vacancy.title,
				companyName: vacancy.displayCompanyName || companyDetails?.name
			});
			
			if (companyDetails && companyDetails.email) {
				try {
					const subject = `New Job Application - ${candidate.name} applied for ${vacancy.title}`;
					console.log('📧 Preparing to send email...');
					console.log('Email To:', companyDetails.email);
					console.log('Email Subject:', subject);
					const message = `
						<!DOCTYPE html>
						<html>
						<head>
							<meta charset="UTF-8">
							<style>
								body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
								.container { max-width: 600px; margin: 0 auto; padding: 20px; }
								.header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
								.content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
								.info-section { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
								.info-row { margin: 10px 0; }
								.label { font-weight: bold; color: #555; }
								.value { color: #333; }
								.footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
								.button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
							</style>
						</head>
						<body>
							<div class="container">
								<div class="header">
									<h2>New Job Application Received</h2>
								</div>
								<div class="content">
									<p>Dear ${companyDetails.name},</p>
									<p>You have received a new job application. Please find the details below:</p>
									
									<div class="info-section">
										<h3 style="margin-top: 0; color: #4CAF50;">Job Details</h3>
										<div class="info-row">
											<span class="label">Job Title:</span>
											<span class="value">${vacancy.title || 'N/A'}</span>
										</div>
										<div class="info-row">
											<span class="label">Company:</span>
											<span class="value">${vacancy.displayCompanyName || companyDetails.name || 'N/A'}</span>
										</div>
									</div>
									
									<div class="info-section">
										<h3 style="margin-top: 0; color: #4CAF50;">Candidate Details</h3>
										<div class="info-row">
											<span class="label">Name:</span>
											<span class="value">${candidate.name || 'N/A'}</span>
										</div>
										<div class="info-row">
											<span class="label">Mobile:</span>
											<span class="value">${candidate.mobile || 'N/A'}</span>
										</div>
										<div class="info-row">
											<span class="label">Email:</span>
											<span class="value">${candidate.email || 'N/A'}</span>
										</div>
										${candidate.sex ? `<div class="info-row">
											<span class="label">Gender:</span>
											<span class="value">${candidate.sex}</span>
										</div>` : ''}
										${candidate.dob ? `<div class="info-row">
											<span class="label">Date of Birth:</span>
											<span class="value">${moment(candidate.dob).format('DD MMM YYYY')}</span>
										</div>` : ''}
										${candidate.state?.name ? `<div class="info-row">
											<span class="label">State:</span>
											<span class="value">${candidate.state.name}</span>
										</div>` : ''}
										${candidate.city?.name ? `<div class="info-row">
											<span class="label">City:</span>
											<span class="value">${candidate.city.name}</span>
										</div>` : ''}
									</div>
									
									<div class="info-section">
										<div class="info-row">
											<span class="label">Application Date:</span>
											<span class="value">${moment(appliedData.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm A')}</span>
										</div>
									</div>
									
									<p style="margin-top: 20px;">
										<a href="${process.env.BASE_URL || 'https://focalyt.com'}/jobdetailsmore/${jobId}" class="button">View Job Details</a>
									</p>
									
									<p style="margin-top: 20px;">Please review this application and take appropriate action.</p>
								</div>
								<div class="footer">
									<p>This is an automated email from Focalyt Portal.</p>
									<p>Please do not reply to this email.</p>
								</div>
							</div>
						</body>
						</html>
					`;
					
					await sendMail(subject, message, companyDetails.email);
					console.log('✅ Email sent successfully!');
					console.log('Email Details:', {
						to: companyDetails.email,
						subject: subject,
						candidateName: candidate.name,
						jobTitle: vacancy.title,
						timestamp: new Date().toISOString()
					});
					console.log('=== JOB APPLICATION EMAIL PROCESS END ===');
				} catch (emailError) {
					console.error('❌ Error sending email to company:', emailError);
					console.error('Error Details:', {
						companyEmail: companyDetails.email,
						error: emailError.message,
						stack: emailError.stack
					});
					// Don't fail the application if email fails
				}
			} else {
				console.log('⚠️ Email not sent - Company email not found');
				console.log('Company Details Check:', {
					companyExists: !!companyDetails,
					hasEmail: !!(companyDetails && companyDetails.email),
					companyId: vacancy._company
				});
				console.log('=== JOB APPLICATION EMAIL PROCESS END (NO EMAIL) ===');
			}
			
			await checkCandidateCashBack(candidate)
			await candidateApplyCashBack(candidate)
		}
		res.status(200).send({ status: true, msg: "Success" });
	}
	catch (err) {
		return res.send({ status: false, err: err })
	}
})

commonRoutes.post("/applycourse/:id", async (req, res) => {
	try {
		let { id } = req.params;
		let courseId = id;

		if(typeof courseId === 'string'){
			courseId = new mongoose.Types.ObjectId(courseId);
		}

		let validation = { mobile: req.body.mobile }

		let { value, error } = await CandidateValidators.userMobile(validation)
		if (error) {
			return res.send({ status: "failure", error: "Something went wrong!", error });
		}
		let candidateMobile = value.mobile;

		let course = await Courses.findOne({ _id: courseId });

		if (!course) {
			return res.send({ status: false, msg: "Course not Found!" });
		}

		let candidate = await Candidate.findOne({ mobile: candidateMobile })

		if (!candidate) {
			return res.send({ status: false, msg: "Candidate not found!" });
		}

		if (candidate.appliedCourses && candidate.appliedCourses.includes(courseId)) {
			req.flash("error", "Already Applied");
			return res.send({ status: false, msg: "Already Applied" });
		} else {
			let apply = await Candidate.findOneAndUpdate({ mobile: candidateMobile },
				{ $addToSet: { appliedCourses: courseId } },
				{ new: true, upsert: true });
			const appliedData = await AppliedCourses({
				_candidate: candidate._id,
				_course: courseId
			}).save();

			// Update Spreadsheet
			const sheetData = [
				moment(appliedData.createdAt).utcOffset('+05:30').format('DD MMM YYYY'),
				moment(appliedData.createdAt).utcOffset('+05:30').format('hh:mm A'),
				capitalizeWords(course?.name), // Apply the capitalizeWords function
				candidate?.name,
				candidate?.mobile,
				candidate?.email,
				candidate?.sex === 'Male' ? 'M' : candidate?.sex === 'Female' ? 'F' : '',
				candidate?.dob ? moment(candidate.dob).format('DD MMM YYYY') : '',
				candidate?.state?.name,
				candidate?.city?.name,
				'Course',
				`${process.env.BASE_URL}/coursedetails/${courseId}`,
				course?.registrationCharges,
				appliedData?.registrationFee,
				"Leads From ChatBot",
				course?.courseFeeType,
				course?.typeOfProject,
				course?.projectName
			];
			await updateSpreadSheetValues(sheetData);

			

			// Capitalize every word's first letter
			function capitalizeWords(str) {
				if (!str) return '';
				return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
			}



			if (!apply) {
				req.flash("error", "Already failed");
				return res.status(400).send({ status: false, msg: "Applied Failed!" });
			}
		}

		res.status(200).send({ status: true, msg: "Success" });
	}
	catch (err) {
		console.log(err)
		return res.send({ status: false, err })
	}
})

commonRoutes.post("/updateprofile", async (req, res) => {
	try {
		let validation = { mobile: req.body.mobile }
		let { value, error } = await CandidateValidators.userMobile(validation)
		if (error) {
			console.log(error)
			return res.send({ status: "failure", error: "Something went wrong!", error });
		}
		const {
			personalInfo,
			qualifications,
			technicalskills,
			nontechnicalskills,
			locationPreferences,
			experiences,
			totalExperience,
			isExperienced,
			highestQualification,
			yearOfPassing,
		} = req.body;
		const updatedFields = { isProfileCompleted: true };
		const userInfo = {};
		Object.keys(personalInfo).forEach((key) => {
			if (personalInfo[key] !== "") {
				updatedFields[key] = personalInfo[key];
			}
		});

		const user = await Candidate.findOne({ mobile: value.mobile });
		if (qualifications?.length > 0) {
			qualifications.forEach((i) => {
				if (i.collegeLatitude && i.collegeLongitude) {
					i['location'] = {
						type: 'Point',
						coordinates: [i.collegeLongitude, i.collegeLatitude]
					}
				}
			})

			updatedFields['qualifications'] = qualifications;
		}
		if (experiences?.length > 0) {
			updatedFields["experiences"] = experiences;
		}
		if (locationPreferences?.length > 0) {
			updatedFields["locationPreferences"] = locationPreferences;
		}
		if (technicalskills?.length > 0) {
			let technicalSkill = await getTechSkills(technicalskills);
			updatedFields["techSkills"] = technicalSkill;
		}
		if (nontechnicalskills?.length > 0) {
			let nonTechnicalSkill = await getNonTechSkills(nontechnicalskills);
			updatedFields["nonTechSkills"] = nonTechnicalSkill;
		}

		updatedFields["totalExperience"] = totalExperience;
		updatedFields["isExperienced"] = isExperienced;
		updatedFields["highestQualification"] = highestQualification;
		if (yearOfPassing) {
			updatedFields["yearOfPassing"] = yearOfPassing;
		}
		if (updatedFields.latitude && updatedFields.longitude) {
			updatedFields["location"] = { type: 'Point', coordinates: [updatedFields.longitude, updatedFields.latitude] }
		}
		if (user?.referredBy && user?.referredBy && user.isProfileCompleted == false) {
			const cashback = await CashBackLogic.findOne().select("Referral")
			const referral = await Referral.findOneAndUpdate(
				{ referredBy: user.referredBy, referredTo: user._id },
				{ status: referalStatus.Active, earning: cashback.Referral, new: true })

			await checkCandidateCashBack({ _id: user.referrefBy })
			await candidateReferalCashBack(referral)
		}
		const candidateUpdate = await Candidate.findByIdAndUpdate(
			user._id,
			updatedFields
		);
		if (personalInfo.name) {
			userInfo["name"] = personalInfo.name;
		}
		if (personalInfo.email) {
			userInfo["email"] = personalInfo.email;
		}

		await User.findOneAndUpdate({ mobile: user.mobile, role: 3 }, userInfo);

		if (!candidateUpdate) {
			req.flash("error", "Candidate update failed!");
			return res.send({ status: false, message: "Profile Update failed" });
		}


		await checkCandidateCashBack(candidateUpdate)
		await candidateProfileCashBack(candidateUpdate)
		await candidateVideoCashBack(candidateUpdate)
		let totalCashback = await CandidateCashBack.aggregate([
			{ $match: { candidateId: new mongoose.Types.ObjectId(user._id) } },
			{ $group: { _id: "", totalAmount: { $sum: "$amount" } } },
		]);
		let isVideoCompleted = ''
		if (personalInfo.profilevideo !== '') {
			isVideoCompleted = personalInfo.profilevideo
		}
		const isProfileCompleted = candidateUpdate.isProfileCompleted
		res.send({ status: true, message: "Profile Updated Successfully", isVideoCompleted: isVideoCompleted, isProfileCompleted: isProfileCompleted, totalCashback });
	}
	catch (err) {
		console.log(err)
		return res.send({ status: false, err })
	}
})

/* List of applied course */
commonRoutes.post("/appliedCourses", async (req, res) => {
	try {
		let validation = { mobile: req.body.mobile }
		let { value, error } = CandidateValidators.userMobile(validation)

		if (error) {
			console.log(error)
			return res.send({ status: "failure", error: "Something went wrong!", error });
		}
		let candidate = await Candidate.findOne({
			mobile: value.mobile,
			isDeleted: false, status: true
		})
		let courses = [];
		let count = 0;
		if (candidate?.appliedCourses?.length > 0) {
			courses = await AppliedCourses.find({
				_candidate: candidate._id
			}).populate({ path: '_course', populate: { path: 'sectors' } });

			count = await Courses.countDocuments({
				_id: {
					$in: candidate.appliedCourses
				},
				isDeleted: false,
				status: true
			});

		}

		res.send({ status: true, message: "List of applied courses", courses: courses, count: count });
	}
	catch (err) {
		return res.send({ status: false, err })
	}
});

/* List of applied jobs */
commonRoutes.post("/appliedJobs", async (req, res) => {
	try {
		let validation = { mobile: req.body.mobile }
		let { value, error } = await CandidateValidators.userMobile(validation)
		if (error) {
			console.log(error)
			return res.send({ status: "failure", error: "Something went wrong!", error });
		}
		let candidate = await Candidate.findOne({
			mobile: value.mobile,
			isDeleted: false, status: true
		})

		const appliedJobs = await AppliedJobs.find({
			_candidate: candidate._id
		})

		res.send({ status: true, message: "List of applied jobs", jobs: appliedJobs, count: appliedJobs.length });
	}
	catch (err) {
		return res.send({ status: false, err })
	}
});
commonRoutes.post("/payment", async (req, res) => {
	let { offerId, amount } = req.body;
	console.log(offerId, "candidate's offerId for the coins")

	if (!offerId || !amount) {
		return res.status(400).send({ status: false, msg: 'Incorrect Data.' })
	}

	let validation = { mobile: req.body.mobile }
	let { value, error } = await CandidateValidators.userMobile(validation)
	if (error) {
		console.log(error)
		return res.send({ status: "failure", error: "Something went wrong!", error });
	}

	let candidate = await Candidate.findOne({
		mobile: value.mobile,
		status: true,
		isDeleted: false,
	}).select("name mobile email");
	let instance = new Razorpay({
		key_id: apiKey,
		key_secret: razorSecretKey,
	});
	let options = {
		amount: amount * 100,
		currency: "INR",
		notes: { candidate: `${candidate._id}`, offer: `${offerId}`, name: `${candidate.name}`, mobile: `${value.mobile}` },
	};
	console.log(options.notes, 'notes to be saved in the razorpay details')
	console.log(options, 'options to be saved in the razorpay details')

	const paymentLink = await instance.paymentLink.create(options, async function (err, paymentLink) {

		console.log(paymentLink.short_url, '<<<<<<<<<<<<<<<< order details')
		res.status(200).send({
			status: true,
			paymentLink: paymentLink.short_url
		});
	});
});

commonRoutes.post("/coursepayment", async (req, res) => {
	let courseId = req.body.courseId;
	let userId = req.body.userId;

	if (!courseId) {
		return res.status(400).send({ status: false, msg: 'Incorrect Data.' })
	}

	let validation = { mobile: req.body.mobile }
	let { value, error } = CandidateValidators.userMobile(validation)
	if (error) {
		console.log(error)
		return res.send({ status: "failure", error: "Something went wrong!", error });
	}

	let course = await Courses.findById(courseId).lean();
	if (!course) {
		res.send({ status: false, message: "Course not available" })
		return
	}
	if (course.status === false) {
		res.send({ status: false, message: "Course expired" })
		return
	}

	let candidate = await Candidate.findOne({
		mobile: value.mobile,
		status: true,
		isDeleted: false,
	}).select("name mobile email");
	let instance = new Razorpay({
		key_id: apiKey,
		key_secret: razorSecretKey,
	});
	let options = {

		amount: Number(course.registrationCharges) * 100,
		currency: "INR",
		notes: { candidate: `${candidate._id}`, course: `${courseId}`, name: `${candidate.name}`, mobile: `${value.mobile}` },
		callback_url: `https://connect.helloyubo.com/payments/focalyt_bot/${userId}`, // Replace with your actual callback URL

	};
	console.log(options.notes, 'notes to be saved in the razorpay details')
	console.log(options, 'options to be saved in the razorpay details')

	instance.paymentLink.create(options, async function (err, paymentLink) {
		if (err) {
			console.log('Error>>>>>>>>>>>>>>>>', err)
			return res.send({ message: err.description })
		}
		console.log(paymentLink.short_url, '<<<<<<<<<<<<<<<< order details')
		res.send({ paymentLink: paymentLink.short_url, candidate: candidate });
	});




});

commonRoutes.post("/paymentStatus", async (req, res) => {
	let { paymentId, _candidate, _offer, orderId, amount, voucher } = req.body;
	console.log(_offer, '<<<<<<<< offerId in the payment status')
	let offerDetails = await coinsOffers.findOne({ _id: _offer });
	console.log(offerDetails, '<<<<<<<<<<<<<<<<< offerDetails')

	let validation = { mobile: req.body.mobile }
	let { value, error } = await CandidateValidators.userMobile(validation)
	if (error) {
		console.log(error)
		return res.send({ status: "failure", error: "Something went wrong!", error });
	}

	let candidate = await Candidate.findOne({
		mobile: value.mobile,
		status: true,
		isDeleted: false,
	}).select("_id")
	let addPayment = {
		paymentId,
		orderId,
		amount,
		coins: offerDetails.getCoins,
		_candidate,
		_offer,
	};

	let alreadyAllocated = await PaymentDetails.findOne({ $and: [{ $or: [{ paymentId }, { orderId }] }, { _candidate }] })
	if (alreadyAllocated) {
		return res.status(400).send({ status: false, msg: 'Already Allocated!' })
	}
	console.log('coins allocation start', addPayment)

	let voucherId = await Vouchers.findOne({ code: voucher, status: true, isDeleted: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } }).select("_id")

	let instance = new Razorpay({
		key_id: apiKey,
		key_secret: razorSecretKey,
	});
	instance.payments
		.fetch(paymentId, { "expand[]": "offers" })
		.then(async (data) => {
			await PaymentDetails.create({
				...addPayment,
				paymentStatus: data.status,
			});
			if (data.status == "captured") {
				await Candidate.findOneAndUpdate(
					{ _id: _candidate },
					{
						$inc: {
							availableCredit: offerDetails.getCoins,
							creditLeft: offerDetails.getCoins,
						},
					}
				);
				await coinsOffers.findOneAndUpdate(
					{ _id: _offer },
					{ $inc: { availedCount: 1 } }
				);
				if (voucherId) {
					const voucherUsed = await VoucherUses.create({ _candidate: candidate._id, _voucher: voucherId._id })
					if (!voucherUsed) {
						return res.send({ status: false, message: "Unable to apply Voucher" })
					}
					let updateVoucher = await Vouchers.findOneAndUpdate({ _id: voucherId._id, status: true, isDeleted: false }, { $inc: { availedCount: 1 } }, { new: true })
				}
				res.send({ status: true, msg: "Success" });
			} else {
				res.send({ status: false, msg: "Failed" });
			}
		});
});

commonRoutes.post("/coursepaymentStatus", async (req, res) => {
	try {
		let { paymentId, orderId, amount, courseId, _candidate } = req.body;
		console.log(courseId, _candidate, '<<<<<< Debug courseId and _candidate');

		let courseDetails = await AppliedCourses.findOne({ _candidate, _course: courseId });
		if (!courseDetails) {
			console.error('No course details found for the given candidate and course!');
			return res.status(400).send({ status: false, msg: 'Course details not found!' });
		}

		console.log(courseDetails, '<<<<<<<<<<<<<<<<< courseDetails');
		let course = await Courses.findById(courseId).lean();
		if (!course) {
			return res.status(400).send({ status: false, msg: 'Course not found!' });
		}

		let validation = { mobile: req.body.mobile };
		let { value, error } = CandidateValidators.userMobile(validation);
		if (error) {
			console.log(error);
			return res.send({ status: "failure", error: "Something went wrong!", error });
		}

		let candidate = await Candidate.findOne({
			mobile: value.mobile,
			status: true,
			isDeleted: false,
		}).select("_id");
		if (!candidate) {
			return res.status(400).send({ status: false, msg: 'Candidate not found!' });
		}

		let addPayment = {
			paymentId,
			orderId,
			amount: course.registrationCharges,
			coins: 0,
			_candidate,
			_course: courseId,
		};

		let alreadyAllocated = await PaymentDetails.findOne({
			$and: [{ $or: [{ paymentId }, { orderId }] }, { _candidate }],
		});
		if (alreadyAllocated) {
			console.log('=========== In alreadyAllocated ', alreadyAllocated);
			return res.status(400).send({ status: false, msg: 'Already Allocated!' });
		}

		let instance = new Razorpay({
			key_id: apiKey,
			key_secret: razorSecretKey,
		});
		instance.payments
			.fetch(paymentId, { "expand[]": "offers" })
			.then(async (data) => {
				await PaymentDetails.create({
					...addPayment,
					paymentStatus: data.status,
				});
				if (data.status == "captured") {
					await AppliedCourses.findOneAndUpdate(
						{ _id: courseDetails._id },
						{ registrationFee: 'Paid' }
					);
					res.send({ status: true, msg: "Success" });
				} else {
					res.send({ status: false, msg: "Failed" });
				}
			})
			.catch((err) => {
				console.error('Error in Razorpay fetch:', err);
				res.status(500).send({ status: false, msg: 'Payment verification failed!' });
			});
	} catch (error) {
		console.error('Unhandled Error:', error);
		res.status(500).send({ status: false, msg: 'Internal Server Error', error });
	}
});

commonRoutes.post("/updatecoursepaymentStatus", async (req, res) => {
	try {
		const { paymentId } = req.body;
		let instance = new Razorpay({
			key_id: apiKey,
			key_secret: razorSecretKey,
		});

		// Validate Input
		if (!paymentId) {
			return res.status(400).send({
				status: "failure",
				msg: "Either Order ID or Payment ID is required",
			});
		}

		// Fetch Payment Details using Payment ID
		if (paymentId) {
			const existingPayment = await PaymentDetails.findOne({ paymentId });

			if (existingPayment) {


				const appliedCourse = await AppliedCourses.findOne({
					_candidate: existingPayment._candidate,
					_course: existingPayment._course,
				});

				if (appliedCourse) {
					if (appliedCourse.registrationFee === "Unpaid") {
						// Update registrationFee to Paid
						appliedCourse.registrationFee = "Paid";
						await appliedCourse.save();
						return res.status(200).send({
							status: "exists",
							msg: "Payment details already exist and Applied Course updated to Paid",
							paymentDetails: existingPayment,
							appliedCourse,
						});
					}
					// If registrationFee is already Paid
					return res.status(200).send({
						status: "exists",
						msg: "Payment details already exist, and registrationFee is already Paid",
						paymentDetails: existingPayment,
						appliedCourse,
					});
				}




				return res.status(404).send({
					status: "failure",
					msg: "Payment exists but no matching AppliedCourses record found",
					paymentDetails: existingPayment,
				});
			}
			const paymentDetails = await instance.payments.fetch(paymentId);
			console.log(paymentDetails)
			// Step 1: Check if Payment ID already exists in PaymentDetails

			if (paymentDetails.status === "captured") {
				// Create a new record in the PaymentDetails collection
				const newPayment = await PaymentDetails.create({
					paymentId: paymentDetails.id,
					orderId: paymentDetails.order_id,
					amount: paymentDetails.amount / 100, // Convert from paise to rupees
					coins: 0, // Assuming this field is needed
					_course: paymentDetails.notes.course,
					paymentStatus: paymentDetails.status,
					_candidate: paymentDetails.notes.candidate,
					updatedAt: new Date(),
				});

				return res.status(201).send({
					status: "success",
					msg: "Payment details created successfully",
					newPayment,
				});
			}
		}

	} catch (error) {
		console.error("Error fetching Razorpay details:", error);
		res.status(500).send({
			status: "failure",
			msg: "Error fetching Razorpay details",
			error: error.message,
		});
	}
});

commonRoutes.get("/fetchPaymentByCourseAndCandidate", async (req, res) => {
	try {
		const { courseId, candidateId } = req.body;

		// Validate Input
		if (!courseId || !candidateId) {
			return res.status(400).send({
				status: "failure",
				msg: "Both courseId and candidateId are required.",
			});
		}

		// Initialize Razorpay Instance
		const instance = new Razorpay({
			key_id: apiKey,
			key_secret: razorSecretKey,
		});

		// Step 1: Fetch Payments from Razorpay
		const allPayments = await instance.payments.all({ count: 100 });

		// Filter Payments by courseId and candidateId in Razorpay notes
		const matchingPayments = allPayments.items.filter((payment) => {
			return (
				payment.notes &&
				payment.notes.course === courseId &&
				payment.notes.candidate === candidateId
			);
		});

		// If no matching payments found, return immediately
		if (matchingPayments.length === 0) {
			return res.status(404).send({
				status: "failure",
				msg: "No payments found in Razorpay for the given courseId and candidateId.",
			});
		}

		const paymentDetails = matchingPayments[0]; // Use the first matching payment
		console.log("Fetched Payment Details from Razorpay:", paymentDetails);

		// Step 2: Check if Payment Already Exists in Your Database
		const existingPayment = await PaymentDetails.findOne({
			paymentId: paymentDetails.id,
		});

		if (existingPayment) {
			// Step 3: Check and Update AppliedCourses if Necessary
			const appliedCourse = await AppliedCourses.findOne({
				_candidate: existingPayment._candidate,
				_course: existingPayment._course,
			});

			if (appliedCourse) {
				if (appliedCourse.registrationFee === "Unpaid") {
					// Update registrationFee to Paid
					appliedCourse.registrationFee = "Paid";
					await appliedCourse.save();
					return res.status(200).send({
						status: "exists",
						msg: "Payment details already exist and Applied Course updated to Paid.",
						paymentDetails: existingPayment,
						appliedCourse,
					});
				}

				// If registrationFee is already Paid
				return res.status(200).send({
					status: "exists",
					msg: "Payment details already exist, and registrationFee is already Paid.",
					paymentDetails: existingPayment,
					appliedCourse,
				});
			}

			// If no AppliedCourses record found
			return res.status(404).send({
				status: "failure",
				msg: "Payment exists but no matching AppliedCourses record found.",
				paymentDetails: existingPayment,
			});
		}

		// Step 4: Create a New Record in PaymentDetails
		if (paymentDetails.status === "captured") {
			const newPayment = await PaymentDetails.create({
				paymentId: paymentDetails.id,
				orderId: paymentDetails.order_id,
				amount: paymentDetails.amount / 100, // Convert from paise to rupees
				coins: 0,
				_course: paymentDetails.notes.course,
				paymentStatus: paymentDetails.status,
				_candidate: paymentDetails.notes.candidate,
				updatedAt: new Date(),
			});

			return res.status(201).send({
				status: "success",
				msg: "Payment details created successfully.",
				newPayment,
			});
		}

		// If payment is not captured
		return res.status(400).send({
			status: "failure",
			msg: "Payment found in Razorpay but not captured.",
			paymentDetails,
		});
	} catch (error) {
		console.error("Error fetching Razorpay payments:", error);
		res.status(500).send({
			status: "failure",
			msg: "Error fetching payments from Razorpay.",
			error: error.message,
		});
	}
});



commonRoutes.get("/Coins", async (req, res) => {
	let validation = { mobile: req.body.mobile }
	let { value, error } = await CandidateValidators.userMobile(validation)
	if (error) {
		console.log(error)
		return res.send({ status: "failure", error: "Something went wrong!", error });
	}

	let candidate = await Candidate.findOne({
		mobile: value.mobile,
		status: true,
		isDeleted: false,
	}).select("_id creditLeft");
	let populate = {
		path: "_offer",
		select: "displayOffer",
	};
	let count = await PaymentDetails.countDocuments({ _candidate: candidate._id })
	const totalPages = Math.ceil(count / perPage);
	let latestTransactions = await PaymentDetails.find({
		_candidate: candidate._id,
	})
		.populate(populate)
		.skip(perPage * page - perPage)
		.limit(perPage)
		.sort({ createdAt: -1 });
	let coinOffers = await coinsOffers.find({
		forCandidate: true,
		isDeleted: false,
		status: true,
		activeTill: { $gte: moment().startOf("day") },
	});
	res.render(`${req.vPath}/app/candidate/miPieCoins`, {
		menu: "miPieCoins",
		latestTransactions,
		coinOffers,
		candidate,
		totalPages,
		count,
		page
	});
});





commonRoutes.get("/getCreditCount", async (req, res) => {
	try {
		let validation = { mobile: req.body.mobile }
		let { value, error } = await CandidateValidators.userMobile(validation)
		if (error) {
			console.log(error)
			return res.send({ status: "failure", error: "Something went wrong!", error });
		}
		let candidate = await Candidate.findOne({
			mobile: value.mobile,
			status: true,
			isDeleted: false,
		});
		if (!candidate) {
			return res.status(400).send({ status: false, msg: "Candidate not found!" });
		}
		res.status(200).send({ status: true, credit: candidate.creditLeft });
	} catch (error) {
		console.log('error: ', error);
	}
});

commonRoutes.get("/chatbotfaq", async (req, res) => {
	try {

		const filter = {
			status: true
		}

		const Que = await FAQ.find(filter)
		return res.status(200).send({
			Que
		});
	} catch (err) {
		res.status(500).send({
			status: "failure",
			msg: "Error fetching faqs from server.",
			error: err.message,
		});
	}
});



chatRoutes.use("/", commonRoutes);

module.exports = chatRoutes;
