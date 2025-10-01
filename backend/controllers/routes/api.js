const express = require("express");
const { google } = require('googleapis')

const multer  = require('multer')
var multipleUpload = multer().array('file');
const { authenti, authCollege, authCommon, isCandidate, isAdmin, authentiAdmin, auth1 } = require("../../helpers");
const { User } = require("../models");
const {
	commonFunc,
	educationlist,
	imageFunc,
	candidateFunc,
	collegeTodoFunc,
	collegeCandidateFunc,
	collegeCompanyFunc,
	smsTemplateFunc,
	qualificationFunc,
	qualificationAdminFunc,
	subQualificationAdminFunc,
	careerFunc,
	projectFunc,
	referenceFunc,
	postFunc,
	teamFunc
} = require("./functions");

const {getAllGoogleCalendarEvents, getGoogleAuthToken, getNewGoogleAccessToken, getGoogleCalendarEvents, createGoogleCalendarEvent, validateAndRefreshGoogleToken } = require("./services/googleservice");

const apiRoutes = express.Router();
const commonRoutes = express.Router();
const imageRoutes = express.Router();
const candidateRoutes = express.Router();
const collegeTodoRoutes = express.Router();
const collegeCandidateRoutes = express.Router();
const collegeCompanyRoutes = express.Router();
const careerRoutes = express.Router();
const projectRoutes = express.Router();
const qualificationRoutes = express.Router();
const qualificationAdminRoutes = express.Router();
const subQualificationAdminRoutes = express.Router();
const referenceRoutes = express.Router();
const smsTemplateRoutes = express.Router();
const educationRoutes = express.Router();

educationRoutes.get("/educationlist", educationlist.educationlist);

commonRoutes.post("/sendOtptoAddLead", commonFunc.sendOtptoAddLead);
commonRoutes.post("/otpCollegeLogin", commonFunc.loginAsCollege);
commonRoutes.post("/otpTrainerLogin", commonFunc.loginAsTrainer);
commonRoutes.post("/sendCandidateOtp", commonFunc.sendCandidateOtp);
commonRoutes.get("/sectorList", commonFunc.sectorList);
commonRoutes.get("/centerList", commonFunc.centerList);
commonRoutes.get("/boards", commonFunc.educationBoardList);
commonRoutes.get("/educationslist", commonFunc.education);
commonRoutes.get("/courselist/:qualificationId", commonFunc.educationCoursesList);
commonRoutes.get("/specializations/:courseId", commonFunc.courseSpecializationsList);

commonRoutes.post("/postfiles", postFunc.uploadPostFiles);
commonRoutes.post("/editpost", postFunc.editPost);
commonRoutes.post("/uploadPostVideoFile", postFunc.uploadPostVideoFile);
commonRoutes.post("/sendCompanyOtp",commonFunc.sendCompanyOtp);
commonRoutes.post("/sendOtp",commonFunc.sendOtp);
commonRoutes.post("/sendOtptoRegisterCandidate", commonFunc.sendOtptoRegisterCandidate);
commonRoutes.post("/sendOtptoRegisterCompany", commonFunc.sendOtptoRegisterCompany);
commonRoutes.post("/sendOtptoRegister", commonFunc.sendOtptoRegister);
commonRoutes.post("/verifyOtp", commonFunc.verifyOtp);
commonRoutes.post("/verifyInstituteOtp", commonFunc.verifyInstituteOtp);
commonRoutes.post("/verifyPass", commonFunc.verifyPass);
commonRoutes.get("/resendOTP",commonFunc.resendOTP);
commonRoutes.post("/resendOTP",commonFunc.resendOTP);
commonRoutes.get("/currentUserWebapp", commonFunc.getProfileDetail);
commonRoutes.get("/logout", commonFunc.logout);
commonRoutes.get("/streams", authenti, commonFunc.streams);
commonRoutes.post("/loginCommon", commonFunc.loginCommon);
commonRoutes.post("/loginAs", isAdmin, commonFunc.loginAs)
commonRoutes.post("/loginAsCandidate", isAdmin, commonFunc.loginAsCandidate)
commonRoutes.post("/otpCandidateLogin",commonFunc.otpCandidateLogin);
commonRoutes.post("/otpCompanyLogin",commonFunc.otpCompanyLogin);
commonRoutes.post("/otpLogin",commonFunc.otpLogin);
commonRoutes.get("/subStreams/:id", authenti, commonFunc.subStreams);
commonRoutes.get("/skills", authenti, commonFunc.getAllSkills);
commonRoutes.get("/university", authenti, commonFunc.university);
commonRoutes.get("/country", commonFunc.country);
commonRoutes.get("/state", commonFunc.state);
commonRoutes.get("/city", commonFunc.city);
commonRoutes.post("/getUploadUrl", [authenti, isCandidate], imageFunc.getUploadUrl);
commonRoutes.post("/uploadSingleFile", [authenti], imageFunc.uploadSingleImage);
commonRoutes.post("/uploadSingleFile/:filename", [authenti], imageFunc.uploadSingleImage);
commonRoutes.post("/uploadAdminFile", [auth1], imageFunc.uploadSingleImage);
commonRoutes.post("/uploadMultipleFiles", [authenti], imageFunc.uploadMultipleFiles);
commonRoutes.post("/uploadMultiFiles", [auth1], imageFunc.uploadAdminMultipleFiles);
commonRoutes.post("/uploadVideo", [authenti], imageFunc.uploadVideoFile);
commonRoutes.post("/uploadJD", [authenti], imageFunc.uploadJd);
commonRoutes.post("/deleteSingleFile", [authenti], imageFunc.deleteSingleFile);
commonRoutes.post("/deletefile", [auth1], imageFunc.deleteSingleFile);
commonRoutes.get(
	"/getDashboardWidgets",
	authCommon,
	commonFunc.getDashboardData
);

// Google OAuth Token Route
commonRoutes.post("/getgoogleauth", async (req, res) => {
  try {
    const { code, redirectUri, user } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        error: 'Authorization code is required' 
      });
    }

	console.log(req.body,'req.body');

    const userData = await getGoogleAuthToken(req.body);
	console.log(userData,'userData');

	if (userData.error) {
		return res.status(400).json({ 
			error: userData.error 
		});
	}
	

	

    res.json({ 
      success: true, 
      data: userData 
    });
    
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.status(500).json({ 
      error: 'Failed to exchange authorization code',
      message: error.message 
    });
  }
});



commonRoutes.post("/getgooglecalendarevents", async (req, res) => {
	try {
		const { user,accessToken, startDate, endDate } = req.body;

		if (!accessToken) {
			return res.status(400).json({ 
				success: false,
				error: 'Access token is required' 
			});
		}

		// Set default date range if not provided
		const timeMin = startDate ? new Date(startDate) : new Date();
		const timeMax = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

		const events = await getAllGoogleCalendarEvents({
			user,
			timeMin: timeMin.toISOString(),
			timeMax: timeMax.toISOString()
		});

		if (events.error) {
			return res.status(400).json({ 
				success: false,
				error: events.error 
			});
		}

		res.json({ 
			success: true, 
			data: events 
		});
	} catch (error) {
		console.error('Google Calendar Events Error:', error);
		res.status(500).json({ 
			success: false,
			error: 'Failed to get Google calendar events',
			message: error.message 
		});
	}
});

commonRoutes.post("/creategooglecalendarevent", async (req, res) => {
	try {
		const { user, event } = req.body;

		// Check if access token and event exist
		if (!user || !event) {
			return res.status(400).json({ 
				success: false,
				error: 'Access token and event are required' 
			});
		}

				// Create data object for Google service
				const calendarData = {
					user: user,
					event: event
				};

		const newEvent = await createGoogleCalendarEvent(calendarData);
		console.log(newEvent, 'newEvent');

		if (newEvent.error) {
			return res.status(400).json({ 
				success: false,
				error: newEvent.error 
			});
		}

		res.json({ 
			success: true, 
			data: newEvent 
		});
	} catch (error) {
		console.error('Google Calendar Event Error:', error);
		res.status(500).json({ 
			success: false,
			error: 'Failed to create Google calendar event',
			message: error.message 
		});
	}
});

// Get B2B followup events from Google Calendar
commonRoutes.post("/getb2bcalendarevents", async (req, res) => {
	try {
		const {user, accessToken, startDate, endDate } = req.body;

		console.log(startDate, endDate,'startDate, endDate');
		

		if (!accessToken) {
			return res.status(400).json({ 
				success: false,
				error: 'Access token is required' 
			});
		}

		// Set default date range if not provided
		const timeMin = startDate ? new Date(startDate) : new Date();
		const timeMax = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

		const b2bEvents = await getAllGoogleCalendarEvents(req.body);
		
		if (b2bEvents.error) {
			return res.status(400).json({ 
				success: false,
				error: b2bEvents.error 
			});
		}

		// Filter events that are B2B related
		const filteredB2BEvents = b2bEvents.events?.filter(event => {
			const summary = event.summary?.toLowerCase() || '';
			const description = event.description?.toLowerCase() || '';
			return summary.includes('b2b') || 
				   summary.includes('follow-up') || 
				   summary.includes('followup') ||
				   description.includes('b2b') ||
				   description.includes('follow-up') ||
				   description.includes('followup');
		}) || [];

		res.json({ 
			success: true, 
			data: {
				events: filteredB2BEvents,
				totalEvents: filteredB2BEvents.length,
				dateRange: {
					start: timeMin,
					end: timeMax
				}
			}
		});
	} catch (error) {
		console.error('B2B Calendar Events Error:', error);
		res.status(500).json({ 
			success: false,
			error: 'Failed to get B2B calendar events',
			message: error.message 
		});
	}
});

// Update calendar event (complete/reschedule)
commonRoutes.post("/updatecalendarevent", async (req, res) => {
	try {
		const { user, eventId, action, newStartTime, newEndTime, notes } = req.body;

		if (!user || !eventId || !action) {
			return res.status(400).json({ 
				success: false,
				error: 'Missing required parameters (user, eventId, action)' 
			});
		}

		// Validate that user has Google auth token
		if (!user.googleAuthToken) {
			return res.status(400).json({ 
				success: false,
				error: 'User does not have Google authentication token' 
			});
		}

		// Validate environment variables
		if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
			console.error('Missing Google OAuth environment variables');
			return res.status(500).json({ 
				success: false,
				error: 'Google OAuth configuration missing' 
			});
		}

		// Use the validateAndRefreshGoogleToken function to handle token refresh
		let tokenData;
		try {
			tokenData = await validateAndRefreshGoogleToken(user);
		} catch (error) {
			console.error('Token validation/refresh error:', error);
			return res.status(401).json({ 
				success: false,
				error: 'Failed to validate or refresh Google token: ' + error.message 
			});
		}

		// Create OAuth2 client
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);

		// Set credentials with refreshed token data
		const credentials = {
			access_token: tokenData.accessToken,
			refresh_token: tokenData.refreshToken,
		};

		// Add expiry_date if we have a valid timestamp
		if (tokenData.expiresAt && tokenData.expiresAt > 0) {
			credentials.expiry_date = tokenData.expiresAt;
		}

		oauth2Client.setCredentials(credentials);

		const calendar = google.calendar({ 
			version: 'v3', 
			auth: oauth2Client
		});

		if (action === 'complete') {
			// Mark event as completed by updating description
			const event = await calendar.events.get({
				calendarId: 'primary',
				eventId: eventId
			});

			const updatedDescription = event.data.description 
				? `${event.data.description}\n\n✅ COMPLETED: ${notes || 'Marked as completed'}`
				: `✅ COMPLETED: ${notes || 'Marked as completed'}`;

			await calendar.events.update({
				calendarId: 'primary',
				eventId: eventId,
				resource: {
					...event.data,
					description: updatedDescription,
					colorId: '9' // Green color for completed events
				}
			});

			res.json({ 
				success: true, 
				message: 'Event marked as completed successfully' 
			});

		} else if (action === 'reschedule') {
			// Reschedule event
			if (!newStartTime || !newEndTime) {
				return res.status(400).json({ 
					success: false,
					error: 'New start and end times are required for rescheduling' 
				});
			}

			const event = await calendar.events.get({
				calendarId: 'primary',
				eventId: eventId
			});

			const updatedDescription = event.data.description 
				? `${event.data.description}\n\n🔄 RESCHEDULED: ${notes || 'Event rescheduled'}`
				: `🔄 RESCHEDULED: ${notes || 'Event rescheduled'}`;

			await calendar.events.update({
				calendarId: 'primary',
				eventId: eventId,
				resource: {
					...event.data,
					start: {
						dateTime: newStartTime,
						timeZone: 'Asia/Kolkata'
					},
					end: {
						dateTime: newEndTime,
						timeZone: 'Asia/Kolkata'
					},
					description: updatedDescription
				}
			});

			res.json({ 
				success: true, 
				message: 'Event rescheduled successfully' 
			});

		} else {
			res.status(400).json({ 
				success: false,
				error: 'Invalid action. Use "complete" or "reschedule"' 
			});
		}

	} catch (error) {
		console.error('Update Calendar Event Error:', error);
		res.status(500).json({ 
			success: false,
			error: 'Failed to update calendar event',
			message: error.message 
		});
	}
});

imageRoutes.post("/uploadFile", authenti, imageFunc.uploadImageAndroid);

candidateRoutes.get("/profileDetail", authenti, candidateFunc.getProfileDetail);
candidateRoutes.post("/register", authenti, candidateFunc.register);
candidateRoutes.post("/changeMobile", authenti, candidateFunc.changeMobile);
candidateRoutes.post("/changeImage", authenti, candidateFunc.changeImage);
candidateRoutes.post(
	"/completeProfile",
	authenti,
	candidateFunc.completeProfile
);
candidateRoutes.get("/profile", authenti, candidateFunc.profileDetail);
candidateRoutes.get(
	"/getCareerObjective",
	authenti,
	candidateFunc.getCareerObjective
);
candidateRoutes.post(
	"/updateCareerObjective",
	authenti,
	candidateFunc.updateCareerObjective
);
candidateRoutes.get("/getSkill", authenti, candidateFunc.getSkill);
candidateRoutes.post("/updateSkill", authenti, candidateFunc.updateSkill);
candidateRoutes.get("/getInterest", authenti, candidateFunc.getInterest);
candidateRoutes.post("/updateInterest", authenti, candidateFunc.updateInterest);

collegeTodoRoutes.get("/", authCollege, collegeTodoFunc.getList);
collegeTodoRoutes.get("/:id", authCollege, collegeTodoFunc.todoData);
collegeTodoRoutes.post("/", authCollege, collegeTodoFunc.addTodo);
collegeTodoRoutes.put("/", authCollege, collegeTodoFunc.updateTodo);

smsTemplateRoutes.get("/", authCollege, smsTemplateFunc.getList);
smsTemplateRoutes.get("/:id", authCollege, smsTemplateFunc.smsData);
smsTemplateRoutes.post("/", authCollege, smsTemplateFunc.addSms);
smsTemplateRoutes.put("/", authCollege, smsTemplateFunc.updateSms);
smsTemplateRoutes.patch("/", authCollege, smsTemplateFunc.updateStatus);

qualificationAdminRoutes.get("/", authCommon, qualificationAdminFunc.getList);
qualificationAdminRoutes.get(
	"/:id",
	authCommon,
	qualificationAdminFunc.qualificationData
);
qualificationAdminRoutes.post(
	"/",
	authCommon,
	qualificationAdminFunc.addQualification
);
qualificationAdminRoutes.put(
	"/",
	authCommon,
	qualificationAdminFunc.updateQualification
);
qualificationAdminRoutes.patch(
	"/",
	authCommon,
	qualificationAdminFunc.updateStatus
);

subQualificationAdminRoutes.get(
	"/",
	authCommon,
	subQualificationAdminFunc.getList
);
subQualificationAdminRoutes.get(
	"/:id",
	authCommon,
	subQualificationAdminFunc.subQualificationData
);
subQualificationAdminRoutes.post(
	"/",
	authCommon,
	subQualificationAdminFunc.addSubQualification
);
subQualificationAdminRoutes.put(
	"/",
	authCommon,
	subQualificationAdminFunc.updateSubQualification
);
subQualificationAdminRoutes.patch(
	"/",
	authCommon,
	subQualificationAdminFunc.updateStatus
);

collegeCandidateRoutes.post(
	"/add",
	authCollege,
	collegeCandidateFunc.addCandidate
);
collegeCandidateRoutes.get(
	"/",
	authCollege,
	collegeCandidateFunc.getActiveCandidate
);
collegeCandidateRoutes.patch(
	"/",
	authCollege,
	collegeCandidateFunc.candidateStatus
);
collegeCandidateRoutes.get(
	"/:id",
	authCollege,
	collegeCandidateFunc.candidateData
);
collegeCandidateRoutes.get(
	"/InactiveCandidate",
	authCollege,
	collegeCandidateFunc.getInactiveCandidate
);
collegeCandidateRoutes.put(
	"/",
	authCollege,
	collegeCandidateFunc.candidateUpdate
);

collegeCompanyRoutes.get("/", authCollege, collegeCompanyFunc.allCompanies);

qualificationRoutes.get("/", authenti, qualificationFunc.getQualification);
qualificationRoutes.post("/add", authenti, qualificationFunc.addQualification);
qualificationRoutes.get(
	"/:id",
	authenti,
	qualificationFunc.qualificationDetail
);
qualificationRoutes.post(
	"/update",
	authenti,
	qualificationFunc.qualificationUpdate
);
qualificationRoutes.delete(
	"/delete/:id",
	authenti,
	qualificationFunc.qualificationDelete
);

careerRoutes.get("/", authenti, careerFunc.getCareers);
careerRoutes.post("/add", authenti, careerFunc.addCareer);
careerRoutes.get("/:id", authenti, careerFunc.careerDetail);
careerRoutes.post("/update", authenti, careerFunc.careerUpdate);
careerRoutes.delete("/delete/:id", authenti, careerFunc.careerDelete);
careerRoutes.get("/all/careerObjectives", authenti, careerFunc.getAllCareer);

projectRoutes.get("/", authenti, projectFunc.getProjects);
projectRoutes.post("/add", authenti, projectFunc.addProject);
projectRoutes.get("/:id", authenti, projectFunc.projectDetail);
projectRoutes.post("/update", authenti, projectFunc.projectUpdate);
projectRoutes.delete("/delete/:id", authenti, projectFunc.projectDelete);

referenceRoutes.get("/", authenti, referenceFunc.getReferences);
referenceRoutes.post("/add", authenti, referenceFunc.addReference);
referenceRoutes.get("/:id", authenti, referenceFunc.referenceDetail);
referenceRoutes.post("/update", authenti, referenceFunc.referenceUpdate);
referenceRoutes.delete("/delete/:id", authenti, referenceFunc.referenceDelete);

apiRoutes.use("/", commonRoutes);
apiRoutes.use("/image", imageRoutes);
apiRoutes.use("/candidate", candidateRoutes);
apiRoutes.use("/career", careerRoutes);
apiRoutes.use("/project", projectRoutes);
apiRoutes.use("/reference", referenceRoutes);
apiRoutes.use("/collegeTodo", collegeTodoRoutes);
apiRoutes.use("/collegeCandidate", collegeCandidateRoutes);
apiRoutes.use("/collegeCompanies", collegeCompanyRoutes);
apiRoutes.use("/qualification", qualificationRoutes);
apiRoutes.use("/qualificationAdmin", qualificationAdminRoutes);
apiRoutes.use("/subQualificationAdmin", subQualificationAdminRoutes);
apiRoutes.use("/smsTemplates", smsTemplateRoutes);

module.exports = apiRoutes;