const express = require("express");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const moment = require("moment");
// const pdf = require('pdf-parse');
// const fs = require('fs');
// const multer = require('multer');
// const upload = multer();
// const OpenAI = require('openai');

const {
	Event,
	User,
	Company,
	College,
	Candidate,
	SkillTest,
	CareerObjective,
	CoverLetter,
	MockInterview,
	Vacancy,
	State,
	City,
	Qualification,
	Industry,
	Courses,
	CourseSectors,
	Contact, Post , StudentRegistration
} = require("../../models");
const Team = require('../../models/team'); // PostSchema import करें
const bcrypt = require("bcryptjs");
const router = express.Router();
const {
	bucketName,
	accessKeyId,
	secretAccessKey,
	region,
	mimetypes,
	bucketURL
} = require("../../../config");
const CompanyExecutive = require("../../models/companyExecutive");
const collegeRepresentative = require("../../models/collegeRepresentative");
const { generatePassword, sendMail } = require("../../../helpers");
const { Translate } = require('@google-cloud/translate').v2;
const { translateProjectId, translateKey } = require('../../../config')

AWS.config.update({ accessKeyId, secretAccessKey, region });
const s3 = new AWS.S3({ region, signatureVersion: "v4" });

const nodemailer = require("nodemailer");
const { ObjectId } = require("mongoose").Types;

var transporter = nodemailer.createTransport({
	service: '"gmail"',
	port: 587,
	secure: true,
	auth: {
		user: "lovepreetlavi697@gmail.com",
		pass: "blwwclfkawgmbwwk",
	},
});

router.get("/", async (req, res) => {
	try {
		const data = req.query
		const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
		console.log(fullUrl);

		// Modify script to run after DOM is loaded and escape quotes properly
		const storageScript = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        try {
		const storedurl = localStorage.getItem('entryUrl');
		if(!storedurl){
          // Store current URL immediately
          const data = {
            url: '${fullUrl.replace(/'/g, "\\'")}',
            timestamp: new Date().getTime()
          };
          localStorage.setItem('entryUrl', JSON.stringify(data));
          
          // Verify it was stored
          console.log('URL stored:', localStorage.getItem('entryUrl'))};
          
          // Function to check and clean expired URL
          function cleanExpiredUrl() {
            const stored = localStorage.getItem('entryUrl');
            if (stored) {
              const data = JSON.parse(stored);
              const now = new Date().getTime();
              const hours24 = 24 * 60 * 60 * 1000;
              
              if (now - data.timestamp > hours24) {
                localStorage.removeItem('entryUrl');
                console.log('Expired URL removed');
              }
            }
          }
          
          // Check for expired URLs
          cleanExpiredUrl();
          
        } catch (error) {
          console.error('Error storing URL:', error);
        }
      });
    </script>
  `;


		let { qualification, experience, industry, jobType, state, Salary } = req.query
		if (qualification && !ObjectId.isValid(qualification)) {
			qualification = ''
		}
		if (experience && isNaN(experience)) {
			experience = ''
		}
		if (industry && !ObjectId.isValid(industry)) {
			industry = ''
		}
		if (jobType && (jobType != 'Part Time' && jobType != 'Full Time')) {
			jobType = ''
		}
		if (state && !ObjectId.isValid(state)) {
			state = ''
		}
		if (Salary && isNaN(Salary)) {
			Salary = ''
		}
		let filter = { status: true, _company: { $ne: null }, validity: { $gte: moment().utcOffset('+05:30') }, verified: true }
		if (qualification) {
			filter._qualification = qualification
		}
		if (industry) {
			filter._industry = industry
		}
		if (jobType) {
			filter.jobType = jobType
		}
		if (experience) {
			experience == "0"
				? (filter["$or"] = [
					{ experience: { $lte: experience } },
				])
				: (filter["experience"] = { $lte: experience });
		}
		if (state) {
			filter.state = state
		}
		if (Salary) {
			filter["$or"] = [{ isFixed: true, amount: { $gte: Salary } }, { isFixed: false, max: { $gte: Salary } }]
		}

		const allQualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		const allIndustry = await Industry.find({ status: true })
		const allStates = await State.find({ countryId: '101', status: { $ne: false } })
		const countJobs = await Vacancy.find(filter).countDocuments()
		const perPage = 10;
		const p = parseInt(req.query.page);
		const page = p || 1;
		const totalPages = Math.ceil(countJobs / perPage);
		let recentJobs = await Vacancy.find(filter).populate([
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
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},]).sort({ sequence: 1, createdAt: -1 }).skip(perPage * page - perPage).limit(perPage);

		rePath = res.render(`${req.vPath}/front`, {
			recentJobs, allQualification, allIndustry, allStates, data, totalPages, page, storageScript: storageScript
		});
	} catch (err) {
		const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
		console.log('======================> 1', ipAddress, req.user?.mobile, req.user?.name, err)
		req.flash("error", err.message || "Something went wrong!");
		// return res.redirect("back");
	}
});

router.get("/corporate-pricing-plan", (req, res) => {
	rePath = res.render(`${req.vPath}/front/corporatePricingPlan`, {
	});
});
router.get("/labs", (req, res) => {
	rePath = res.render(`${req.vPath}/front/lab`, {
	});
});
router.get("/community", async (req, res) => {
	let filter = { status: true }
	// const countPosts = await Post.find(filter).countDocuments()
	// const perPage = 18;
	// const p = parseInt(req.query.page);
	// const page = p || 1;
	// const totalPages = Math.ceil(countPosts / perPage);
	let posts = await Post.find(filter).sort({ createdAt: -1 });
	return res.json({
		posts

	});
});

router.get("/employersTermsofService", (req, res) => {
	rePath = res.render(`${req.vPath}/front/employersTermsofService`, {
	});
});

router.get("/team", async (req, res) => {
	const seniorManagement = await Team.find({ status: true, position: "Senior Management" }).sort({ sequence: 1 });
	const management = await Team.find({ status: true, position: "Management" }).sort({ sequence: 1 });
	const staff = await Team.find({ status: true, position: "Staff" }).sort({ sequence: 1 });


	// **Render `about_us` पेज**
	return res.json({
		seniorManagement,
		management,
		staff
	});
});


router.get("/userAgreement", (req, res) => {
	rePath = res.render(`${req.vPath}/front/userAgreement`, {
	});
});
router.get("/joblisting", async (req, res) => {
	const data = req.query;
	let { experience, sector, salary } = req.query

	if (experience && isNaN(experience)) {
		experience = ''
	}

	if (salary && isNaN(salary)) {
		salary = ''
	}
	if (sector && isNaN(sector)) {
		sector = ''
	}

	let filter = { 
		status: true, 
		_company: { $ne: null }, 
		validity: { $gte: moment().utcOffset('+05:30') }, 
		verified: true,
		$or: [
			{ postingType: 'Public' },
			{ postingType: { $exists: false } }, 
			{ postingType: null }
		]
	}

	if (salary) {
		filter["$or"] = [{ isFixed: true, amount: { $gte: salary } }, { isFixed: false, max: { $gte: salary } }]
	}

	if (experience) {
		experience == "0"
			? (filter["$or"] = [
				{ experience: { $lte: experience } },
			])
			: (filter["experience"] = { $lte: experience });
	}

	let populate = [
		{
			path: '_company',
			select: "name logo stateId cityId thumbnail"
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
			path: "_courses",
			select: "name"
		},
		{
			path: "_qualification",
			select: ["name"],
		},
		{
			path: "state"
		},
		{
			path: "city",
			select: "name",
		}
	]

	const countJobs = await Vacancy.find(filter).countDocuments()
	const perPage = 100;
	const p = parseInt(req.query.page);
	const page = p || 1;
	const totalPages = Math.ceil(countJobs / perPage);

	const sectors = await CourseSectors.find({})
		.select("name image status")
		.sort({ createdAt: -1 })
		.skip(perPage * page - perPage)
		.limit(perPage);

	let recentJobs = await Vacancy.find(filter).populate(populate).sort({ sequence: 1, createdAt: -1 }).skip(perPage * page - perPage).limit(perPage);

	let testData = await Vacancy.findOne().select("_industry");
	console.log("Test Data:", testData);
	
	
	let uniqueSectors = await Vacancy.find(filter)
    .populate("_industry", "name") // Ensure industry name is populated
    .select("_industry")
    .then(data => {
        return data
            .filter(job => job._industry)  // Remove null values
            .map(job => ({
                _id: job._industry._id,
                name: job._industry.name
            }))
            .filter((v, i, a) => a.findIndex(t => (t._id.equals(v._id))) === i); // Unique values
    });




	rePath = res.json({
		recentJobs,
		totalPages,
		page,
		data,
		sectors,
		uniqueSectors
	});
});

router.get("/about_us", async (req, res) => {
	try {
		const seniorManagement = await Team.find({ status: true, position: "Senior Management" }).sort({ sequence: 1 });
		const management = await Team.find({ status: true, position: "Management" }).sort({ sequence: 1 });
		const staff = await Team.find({ status: true, position: "Staff" }).sort({ sequence: 1 });




		// **req.vPath undefined है या नहीं इसकी जाँच करें**
		if (!req.vPath) {
			console.error("⚠ Error: `req.vPath` is not defined!");
			return res.status(500).send({
				status: false,
				message: "Internal Server Error - `vPath` is missing.",
			});
		}

		// **Render `about_us` पेज**
		return res.render(`${req.vPath}/front/about_us`, {
			seniorManagement,
			management,
			staff
		});

	} catch (err) {
		console.error("❌ Error fetching team members:", err);
		return res.status(500).send({
			status: false,
			message: "Internal Server Error",
		});
	}
});
router.get("/futureTechnologyLabs", (req, res) => {

	rePath = res.render(`${req.vPath}/front/labs.ejs`, {
	});
});
router.get("/jobsearch", (req, res) => {

	rePath = res.render(`${req.vPath}/front/jobsearch`, {
	});
});
router.post("/jobsearch", (req, res) => {
	const { body } = req.body;

	rePath = res.render(`${req.vPath}/front/jobsearch`, {
	});
});
router.get("/courses", async (req, res) => {
	const todayDateString = moment().utcOffset('+05:30').startOf('day').format('YYYY-MM-DD');
	
	let filter = { 
		status: true,
		$or: [
			{ lastDateForApply: { $gte: todayDateString } },
			{ lastDateForApply: { $exists: false } },
			{ lastDateForApply: null },
			{ lastDateForApply: '' }
		]
	}

	const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

	// Modify script to run after DOM is loaded and escape quotes properly
	// const storageScript = `
	//   <script>
	// 	document.addEventListener('DOMContentLoaded', function() {
	// 	  try {
	// 		const storedurl = localStorage.getItem('entryUrl');
	// 		if(!storedurl){
	// 		  // Store current URL immediately
	// 		  const data = {
	// 			url: '${fullUrl.replace(/'/g, "\\'")}',
	// 			timestamp: new Date().getTime()
	// 		  };
	// 		  localStorage.setItem('entryUrl', JSON.stringify(data));
			  
	// 		  // Verify it was stored
	// 		  console.log('URL stored:', localStorage.getItem('entryUrl'))
	// 		};
			
	// 		// Function to check and clean expired URL
	// 		function cleanExpiredUrl() {
	// 		  const stored = localStorage.getItem('entryUrl');
	// 		  if (stored) {
	// 			const data = JSON.parse(stored);
	// 			const now = new Date().getTime();
	// 			const hours24 = 24 * 60 * 60 * 1000;
				
	// 			if (now - data.timestamp > hours24) {
	// 			  localStorage.removeItem('entryUrl');
	// 			  console.log('Expired URL removed');
	// 			}
	// 		  }
	// 		}
			
	// 		// Check for expired URLs
	// 		cleanExpiredUrl();
			
	// 	  } catch (error) {
	// 		console.error('Error storing URL:', error);
	// 	  }
	// 	});
	//   </script>
	// `;

	const countJobs = await Courses.find(filter).countDocuments()
	const contact = await Contact.find({ status: true, isDeleted: false }).sort({ createdAt: 1 })
	const perPage = 50;
	const p = parseInt(req.query.page);
	const page = p || 1;
	const totalPages = Math.ceil(countJobs / perPage);

	let courses = await Courses.aggregate([
		{ $match: filter },
		{ $unwind: "$sectors" },
		{
			$lookup: {
				from: "coursesectors",
				localField: "sectors",
				foreignField: "_id",
				as: "sectorDetails"
			}
		},
		{
			$unwind: "$sectorDetails"
		},
		{
			$group: {
				_id: "$_id",
				doc: { $first: "$$ROOT" },  // Keep the entire original document
				sectors: { $push: "$sectors" },
				sectorNames: { $push: "$sectorDetails.name" }
			}
		},
		{
			$addFields: {
				"doc.sectors": "$sectors",
				"doc.sectorNames": "$sectorNames"
			}
		},
		{
			$replaceRoot: { newRoot: "$doc" }
		},
		{ $sort: { updatedAt: -1 } },
		{ $skip: perPage * (page - 1) },
		{ $limit: perPage }
	]);

	// Extract unique sectors from the courses
	const uniqueSectors = await Courses.aggregate([
		{ $match: filter },
		{ $unwind: "$sectors" },
		{
			$lookup: {
				from: "coursesectors",
				localField: "sectors",
				foreignField: "_id",
				as: "sectorDetails"
			}
		},
		{ $unwind: "$sectorDetails" },
		{
			$group: {
				_id: "$sectorDetails._id",
				name: { $first: "$sectorDetails.name" }
			}
		},
		{ $sort: { name: 1 } }
	]);
	console.log("uniqueSectors", uniqueSectors)

	// Use res.json() to send JSON data, not res.send.json()
	return res.json({
		courses,
		// storageScript,
		phoneToCall: contact[0]?.mobile,
		totalPages,
		uniqueSectors,
		page
	});
});

router.get("/event", async (req, res) => {
	let filter = { status: true }
	const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;	

	const countEvents = await Event.find(filter).countDocuments()
	const events = await Event.find(filter)
	console.log('events......' , events)
	console.log('events......length' , events.length)
	const perPage = 50;
	const p = parseInt(req.query.page);
	const page = p || 1;
	const totalPages = Math.ceil(countEvents / perPage);
	console.log("events",events)
	// Use res.json() to send JSON data, not res.send.json()
	return res.json({
		events,
		totalPages,
	    page
	});
});



router.get("/coursedetails/:id", async (req, res) => {
	const { id } = req.params
	let course = await Courses.findOne({ _id: id })
	const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	console.log(fullUrl);

	// Modify script to run after DOM is loaded and escape quotes properly
	const storageScript = `
	  <script>
		document.addEventListener('DOMContentLoaded', function() {
		  try {
		  const storedurl = localStorage.getItem('entryUrl');
		  if(!storedurl){
			// Store current URL immediately
			const data = {
			  url: '${fullUrl.replace(/'/g, "\\'")}',
			  timestamp: new Date().getTime()
			};
			localStorage.setItem('entryUrl', JSON.stringify(data));
			
			// Verify it was stored
			console.log('URL stored:', localStorage.getItem('entryUrl'))};
			
			// Function to check and clean expired URL
			function cleanExpiredUrl() {
			  const stored = localStorage.getItem('entryUrl');
			  if (stored) {
				const data = JSON.parse(stored);
				const now = new Date().getTime();
				const hours24 = 24 * 60 * 60 * 1000;
				
				if (now - data.timestamp > hours24) {
				  localStorage.removeItem('entryUrl');
				  console.log('Expired URL removed');
				}
			  }
			}
			
			// Check for expired URLs
			cleanExpiredUrl();
			
		  } catch (error) {
			console.error('Error storing URL:', error);
		  }
		});
	  </script>
	`;
	return res.json({
		course,
		storageScript: storageScript,
	});
});
router.get("/contact", (req, res) => {
	rePath = res.render(`${req.vPath}/front/contact`, {
	});
});
router.get("/contactt", (req, res) => {
	rePath = res.render(`${req.vPath}/front/contactUs`, {
	});
});
router.get("/sampleVideoProfile", (req, res) => {
	rePath = res.render(`${req.vPath}/front/sampleVideoProfile`, {
	});
});
router.get("/coursedetailmore", (req, res) => {
	console.log('=========== reached')
	rePath = res.render(`${req.vPath}/front/coursedetailmore`, {
	});
});
router.get("/jobdetailsmore/:jobId", async (req, res) => {
	// Immediate log - should appear first when route is hit
	// console.log("\n\n🚀🚀🚀 ========== ROUTE HIT: /jobdetailsmore/:jobId ========== 🚀🚀🚀");
	// console.log("📅 Timestamp:", new Date().toISOString());
	// console.log("🚀🚀🚀 ======================================================== 🚀🚀🚀\n");
	try {
		// console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		// console.log("🌐 BACKEND: /jobdetailsmore/:jobId route accessed");
		// console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		
		let jobId = req.params.jobId;
		// console.log("📋 Job ID:", jobId);
		// console.log("📋 Job ID Type:", typeof jobId);
		// console.log("🔗 Request URL:", req.protocol + "://" + req.get('host') + req.originalUrl);
		// console.log("📍 Method:", req.method);
		// console.log("👤 User-Agent:", req.get('User-Agent') || 'Not provided');
		// console.log("📥 Accept Header:", req.headers.accept || 'Not provided');

		if (!jobId) {
			console.error("❌ Invalid Job ID provided");
			return res.status(400).json({ status: false, message: "Invalid Job Id" });
		}
		const populate = [
			{
				path: '_company',
				select: "name description logo stateId cityId mediaGallery mediaGalaryVideo thumbnail"
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
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},
			{
				path: "_techSkills",
				select: "name",
			},
			{
				path: "_nonTechSkills",
				select: "name",
			},

		];
		const job = await Vacancy.findOne({ _id: jobId }).populate(populate)
		
		if (!job) {
			console.error("❌ Job not found with ID:", jobId);
			return res.status(404).json({ status: false, message: "Job not found" });
		}
		
		// console.log("✅ Job found:");
		// console.log("   - Title:", job.title || job.name || 'N/A');
		// console.log("   - Company:", job._company?.name || 'N/A');
		// console.log("   - Job Video Thumbnail:", job.jobVideoThumbnail || '❌ Not present');
		// console.log("   - Thumbnail:", job.thumbnail || '❌ Not present');
		// console.log("   - Company Logo:", job._company?.logo || '❌ Not present');
		// console.log("   - Company Thumbnail:", job._company?.thumbnail || '❌ Not present');

		let state = '';
		let city = '';
		if (job._company?.stateId && job._company?.cityId) {
			state = await State.findOne({ _id: job._company.stateId, status: true })
			city = await City.findOne({ _id: job._company.cityId, status: true, stateId: job._company.stateId })
		}
		const recentJobs = await Vacancy.find({ status: true, _id: { $ne: jobId } }).populate([
			{
				path: '_company',
				select: "name logo"
			},
			{
				path: "city",
				select: "name",
			}]).sort({ createdAt: -1 }).limit(5)

		const courses = await Courses.find({ status: true }).sort({ createdAt: -1 }).limit(10)

		// Check if request is from social media crawler or browser (not API call)
		const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
		const userAgent = req.get('User-Agent') || '';
		// Enhanced crawler detection - WhatsApp uses Facebook's crawler (facebookexternalhit)
		// Also check for WhatsApp-specific patterns and other social media bots
		const isCrawler = /facebookexternalhit|WhatsApp|whatsapp|WhatsAppBot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|SkypeUriPreview|Discordbot|bot|crawler|spider|facebook|Facebot|Googlebot|Applebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|ia_archiver/i.test(userAgent);
		
		console.log("🔍 Request Analysis:");
		console.log("   - User-Agent:", userAgent);
		console.log("   - Accepts JSON:", acceptsJson);
		console.log("   - Is Crawler:", isCrawler);
		if (isCrawler) {
			console.log("   🤖 Detected as Social Media Crawler (WhatsApp/Facebook/etc.)");
		} else {
			console.log("   🌐 Detected as Regular Browser");
		}
		
		// Get frontend URL from environment or default to localhost:3000
		const frontendUrl = process.env.FRONTEND_URL || (process.env.BASE_URL ? process.env.BASE_URL.replace(':8080', ':3000').replace(':443', '').replace(':80', '') : 'http://localhost:3000');
		
		// Logic:
		// 1. Social media crawler → HTML with meta tags (for rich preview card)
		// 2. React app (JSON request) → JSON response
		// 3. Regular browser (non-JSON, non-crawler) → Redirect to frontend joblisting page
		if (isCrawler) {
			// Social media crawler - serve HTML with meta tags for rich preview
			console.log("📄 Serving HTML response with Open Graph meta tags (for social media rich preview)");
			// Return HTML with meta tags for social media crawlers and browsers
			const baseUrl = `${req.protocol}://${req.get('host')}`;
			const jobUrl = `${baseUrl}/jobdetailsmore/${jobId}`;
			const companyName = job._company?.name || 'Focalyt';
			const jobTitle = (job.title || job.name || 'Job Opening').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
			// Create description with company name prominently
			let jobDescription = '';
			if (job.jobDescription) {
				// Include company name at the start, then job description
				const descText = job.jobDescription.substring(0, 150).replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
				jobDescription = `${companyName} - ${descText}`;
			} else {
				jobDescription = `Apply for ${jobTitle} at ${companyName}`;
			}
			jobDescription = jobDescription.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
			if (jobDescription.length > 197) {
				jobDescription = jobDescription.substring(0, 197) + '...';
			}
			
			// Create title with company name for better preview
			const previewTitle = `${jobTitle} - ${companyName}`;
			
			// Get absolute image URL - MUST be absolute for social media
			// Priority: jobVideoThumbnail > thumbnail > _company?.logo > default image
			let thumbnailUrl = '';
			if (job.jobVideoThumbnail) {
				console.log("✅ Using jobVideoThumbnail for rich preview");
				// jobVideoThumbnail is usually already an absolute URL from S3
				if (job.jobVideoThumbnail.startsWith('http://') || job.jobVideoThumbnail.startsWith('https://')) {
					thumbnailUrl = job.jobVideoThumbnail;
					console.log("   - jobVideoThumbnail is already absolute URL");
				} else {
					// If relative, make it absolute using bucket URL
					if (process.env.MIPIE_BUCKET_URL) {
						const bucketUrl = process.env.MIPIE_BUCKET_URL.endsWith('/') 
							? process.env.MIPIE_BUCKET_URL.slice(0, -1) 
							: process.env.MIPIE_BUCKET_URL;
						const thumbPath = job.jobVideoThumbnail.startsWith('/') 
							? job.jobVideoThumbnail.slice(1) 
							: job.jobVideoThumbnail;
						thumbnailUrl = `${bucketUrl}/${thumbPath}`;
						console.log("   - Converted relative jobVideoThumbnail to absolute using bucket URL");
					} else {
						const thumbPath = job.jobVideoThumbnail.startsWith('/') 
							? job.jobVideoThumbnail.slice(1) 
							: job.jobVideoThumbnail;
						thumbnailUrl = `${baseUrl}/${thumbPath}`;
						console.log("   - Converted relative jobVideoThumbnail to absolute using base URL");
					}
				}
			} else if (job.thumbnail) {
				console.log("⚠️ jobVideoThumbnail not found, using thumbnail field");
				// thumbnail might be absolute or relative
				if (job.thumbnail.startsWith('http://') || job.thumbnail.startsWith('https://')) {
					thumbnailUrl = job.thumbnail;
					console.log("   - thumbnail is already absolute URL");
				} else {
					// If relative, make it absolute using bucket URL or base URL
					if (process.env.MIPIE_BUCKET_URL) {
						const bucketUrl = process.env.MIPIE_BUCKET_URL.endsWith('/') 
							? process.env.MIPIE_BUCKET_URL.slice(0, -1) 
							: process.env.MIPIE_BUCKET_URL;
						const thumbPath = job.thumbnail.startsWith('/') 
							? job.thumbnail.slice(1) 
							: job.thumbnail;
						thumbnailUrl = `${bucketUrl}/${thumbPath}`;
						console.log("   - Converted relative thumbnail to absolute using bucket URL");
					} else {
						const thumbPath = job.thumbnail.startsWith('/') 
							? job.thumbnail 
							: `/${job.thumbnail}`;
						thumbnailUrl = `${baseUrl}${thumbPath}`;
						console.log("   - Converted relative thumbnail to absolute using base URL");
					}
				}
			} else if (job._company?.logo) {
				console.log("⚠️ jobVideoThumbnail and thumbnail not found, using company logo");
				// company logo might be absolute or relative
				if (job._company.logo.startsWith('http://') || job._company.logo.startsWith('https://')) {
					thumbnailUrl = job._company.logo;
					console.log("   - company logo is already absolute URL");
				} else {
					// If relative, make it absolute using bucket URL or base URL
					if (process.env.MIPIE_BUCKET_URL) {
						const bucketUrl = process.env.MIPIE_BUCKET_URL.endsWith('/') 
							? process.env.MIPIE_BUCKET_URL.slice(0, -1) 
							: process.env.MIPIE_BUCKET_URL;
						const logoPath = job._company.logo.startsWith('/') 
							? job._company.logo.slice(1) 
							: job._company.logo;
						thumbnailUrl = `${bucketUrl}/${logoPath}`;
						console.log("   - Converted relative company logo to absolute using bucket URL");
					} else {
						const logoPath = job._company.logo.startsWith('/') 
							? job._company.logo 
							: `/${job._company.logo}`;
						thumbnailUrl = `${baseUrl}${logoPath}`;
						console.log("   - Converted relative company logo to absolute using base URL");
					}
				}
			} else {
				// Default image - use absolute URL
				console.log("⚠️ jobVideoThumbnail, thumbnail, and company logo not found, using default image");
				thumbnailUrl = `${baseUrl}/Assets/public_assets/images/newjoblisting/course_img.svg`;
				console.log("   - Using default image: /Assets/public_assets/images/newjoblisting/course_img.svg");
			}

			console.log("🖼️  Thumbnail URL for meta tags:", thumbnailUrl);
			console.log("📝 Meta Tags Generated:");
			console.log("   - og:title:", previewTitle);
			console.log("   - Company Name:", companyName);
			console.log("   - og:description:", jobDescription.substring(0, 50) + "...");
			console.log("   - og:image:", thumbnailUrl);
			console.log("   - og:url:", jobUrl);

			const htmlContent = `<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	
	<!-- Primary Meta Tags -->
	<title>${previewTitle}</title>
	<meta name="title" content="${previewTitle}">
	<meta name="description" content="${jobDescription}">
	
	<!-- Open Graph / Facebook / WhatsApp -->
	<meta property="og:type" content="website">
	<meta property="og:url" content="${jobUrl}">
	<meta property="og:title" content="${previewTitle}">
	<meta property="og:description" content="${jobDescription}">
	<meta property="og:image" content="${thumbnailUrl}">
	<meta property="og:image:secure_url" content="${thumbnailUrl}">
	<meta property="og:image:width" content="1200">
	<meta property="og:image:height" content="630">
	<meta property="og:image:type" content="image/jpeg">
	<meta property="og:site_name" content="Focalyt">
	<meta property="og:locale" content="en_US">
	
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:url" content="${jobUrl}">
	<meta name="twitter:title" content="${previewTitle}">
	<meta name="twitter:description" content="${jobDescription}">
	<meta name="twitter:image" content="${thumbnailUrl}">
	<meta name="twitter:image:src" content="${thumbnailUrl}">
	
	<!-- Additional Meta -->
	<meta name="author" content="Focalyt">
	<link rel="canonical" href="${jobUrl}">
	
	<!-- NO REDIRECT FOR CRAWLERS - They need to see the meta tags -->
</head>
<body>
	<div style="padding: 20px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
		<h1 style="color: #333; margin-bottom: 10px;">${jobTitle}</h1>
		<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${jobDescription}</p>
		<img src="${thumbnailUrl}" alt="${jobTitle}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
		<p><a href="${jobUrl}" style="color: #FC2B5A; text-decoration: none; font-weight: 600;">View Job Details →</a></p>
	</div>
</body>
</html>`;

			// Set proper headers for HTML response
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
			res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
			console.log("✅ Sending HTML response with meta tags");
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			return res.send(htmlContent);
		} else if (acceptsJson) {
			// React app requesting JSON - serve JSON response
			console.log("📦 Serving JSON response for React app");
			
			// Log thumbnail info for debugging (even for JSON responses)
			console.log("🖼️  Thumbnail Info for Frontend:");
			if (job.jobVideoThumbnail) {
				console.log("   ✅ Using: jobVideoThumbnail");
				console.log("   📍 URL:", job.jobVideoThumbnail);
			} else if (job.thumbnail) {
				console.log("   ✅ Using: thumbnail");
				console.log("   📍 URL:", job.thumbnail);
			} else if (job._company?.logo) {
				console.log("   ✅ Using: company logo");
				console.log("   📍 URL:", job._company.logo);
			} else {
				console.log("   ⚠️  No thumbnail found - frontend will use default image");
			}
			
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			return res.json({
				status: true,
				job,
				recentJobs,
				state,
				city,
				courses
			});
		} else {
			// Regular browser accessing backend URL directly - redirect to frontend joblisting page
			console.log("🔄 Regular browser detected - redirecting to frontend joblisting page");
			console.log("   Redirect URL:", `${frontendUrl}/joblisting`);
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			return res.redirect(302, `${frontendUrl}/joblisting`);
		}
	} catch (err) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ ERROR in /jobdetailsmore/:jobId route");
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("Error:", err.message);
		console.error("Stack:", err.stack);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		return res.status(500).json({ status: false, message: err.message || "Failed to load job details" });
	}
});
router.get("/contact", (req, res) => {
	rePath = res.render(`${req.vPath}/front/contact`, {
	});
});

router.get("/jobdetails/:jobId", async (req, res) => {
	try {
		let jobId = req.params.jobId //63d8cb2e421777708eaed0d8
		if (jobId && !ObjectId.isValid(jobId)) {
			throw req.ykError("Invalid Job Id");
		}
		const populate = [
			{
				path: '_company',
				select: "name logo stateId cityId mediaGallery mediaGalaryVideo"
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
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},
			{
				path: "_techSkills",
				select: "name",
			},
			{
				path: "_nonTechSkills",
				select: "name",
			},

		];
		const job = await Vacancy.findOne({ _id: jobId }).populate(populate)
		let state = '';
		let city = '';
		if (job._company?.stateId && job._company?.cityId) {
			state = await State.findOne({ _id: job._company.stateId, status: true })
			city = await City.findOne({ _id: job._company.cityId, status: true, stateId: job._company.stateId })
		}
		const recentJobs = await Vacancy.find({ status: true, _id: { $ne: jobId } }).populate([
			{
				path
					: '_company',
				select: "name logo"
			},
			{
				path: "city",
				select: "name",
			}]).sort({ createdAt: -1 }).limit(5)

		return res.render(`${req.vPath}/front/jobdetails`, { job, recentJobs, state, city });
	} catch (err) {
		const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
		console.log('======================> 2', ipAddress, req.user?.mobile, req.user?.name, err)
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});
router.get("/jobdetails", async (req, res) => {
	try {
		const data = req.query
		let { qualification, experience, industry, jobType, state, Salary } = req.query
		if (qualification && !ObjectId.isValid(qualification)) {
			qualification = ''
		}
		if (experience && isNaN(experience)) {
			experience = ''
		}
		if (industry && !ObjectId.isValid(industry)) {
			industry = ''
		}
		if (jobType && (jobType != 'Part Time' && jobType != 'Full Time')) {
			jobType = ''
		}
		if (state && !ObjectId.isValid(state)) {
			state = ''
		}
		if (Salary && isNaN(Salary)) {
			Salary = ''
		}
		let populate = [
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
				select: ["name"],
			},
			{
				path: "state"
			},
			{
				path: "city",
				select: "name",
			}
		]

		let filter = { status: true, _company: { $ne: null }, validity: { $gte: moment().utcOffset('+05:30') } }
		if (qualification) {
			filter._qualification = qualification
		}
		if (industry) {
			filter._industry = industry
		}
		if (jobType) {
			filter.jobType = jobType
		}
		if (experience) {
			experience == "0"
				? (filter["$or"] = [
					{ experience: { $lte: experience } },
				])
				: (filter["experience"] = { $lte: experience });
		}
		if (state) {
			filter.state = state
		}
		if (Salary) {
			filter["$or"] = [{ isFixed: true, amount: { $gte: Salary } }, { isFixed: false, min: { $gte: Salary } }]
		}
		const allQualification = await Qualification.find({ status: true }).sort({ basic: -1 })
		const allIndustry = await Industry.find({ status: true })
		const allStates = await State.find({ countryId: '101', status: { $ne: false } })
		const countJobs = await Vacancy.find(filter).countDocuments()
		const perPage = 10;
		const p = parseInt(req.query.page);
		const page = p || 1;
		const totalPages = Math.ceil(countJobs / perPage);
		let recentJobs = await Vacancy.find(filter).populate(populate).sort({ sequence: 1, createdAt: -1 }).skip(perPage * page - perPage).limit(perPage)
		return res.render(`${req.vPath}/front/joblist`, {
			recentJobs,
			totalPages,
			page,
			data,
			allQualification,
			allIndustry,
			allStates
		});
	} catch (err) {
		const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
		console.log('======================> 3', ipAddress, req.user?.mobile, req.user?.name, err)
		req.flash("error", err.message || "Something went wrong!");
		// return res.redirect("back");
	}
});
router.get("/jobdetailslist", async (req, res) => {
	try {
		let recentJobs = await Vacancy.find({ status: true, _company: { $ne: null } }).populate([
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
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},]).sort({ sequence: 1, createdAt: -1 }).limit(5);
		recentJobs.forEach((item) => {
			if (item.displayCompanyName) {
				item._company.name = item.displayCompanyName
			}
			if (item._company.logo && item._company.logo.indexOf(bucketURL) < 0) {
				item._company.logo = bucketURL + "/" + item._company.logo
			}
			if (item.updatedAt) {
				item.updatedAt = moment(item.updatedAt).utcOffset('+05:30').format('DD MMM YYYY')
			}
		})
		return res.send({ status: true, recentJobs });
	} catch (err) {
		return res.send({ status: false, err })
	}
});
router
	.route("/admin/login")
	.get(async (req, res) => {
		let rePath;
		if (req.session.user && req.session.user.status) {
			rePath = res.render(`${req.vPath}/front/login`);
		} else {
			if (req.session.user && req.session.user.role === 0) {
				rePath = res.redirect("/admin");
			} else if (req.session.user && req.session.user.role === 1) {
				rePath = res.redirect("/company/dashboard");
			} else if (req.session.user && req.session.user.role === 3) {
				rePath = res.redirect("/candidate/dashboard");
			} else if (req.session.user && req.session.user.role === 2) {
				rePath = res.redirect("/college/dashboard");
			} else {
				rePath = res.render(`${req.vPath}/front/login`);
			}
		}
		return rePath;
	})
	.post(async (req, res) => {
		try {
			const user = await User.findOne({
				email: req.body.email,
				role: { $in: [0, 10] },
				status: true,
			});
			// if (!user || user === null)
			// 	throw req.ykError("You are blocked by super admin");

			if (!user || user === null)
				throw req.ykError("User not found. Enter a valid credentials");

			if (user && user.status == false)
				throw req.ykError("Please Contact With Your Admin");

			if (!user.validPassword(req.body.password))
				throw req.ykError("Enter a valid password");

			if (user) {
				if (user.role === 10 || user.role === 0) {
					let userData = { role: user.role, name: user.name, _id: user._id, email: user.email }
					req.session.user = userData;
					return res.redirect("/admin");
				}
			}
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.get("/admin/logout", async (req, res) => {
	try {
		req.session.user = null;
		return res.redirect("/admin/login");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

router.post("/admin/changestatus", async (req, res) => {
	try {
		const Model = require(`../../models/` + req.body.model); // eslint-disable-line
		const updata = { $set: { status: req.body.status } };
		const data = await Model.findByIdAndUpdate(req.body.id, updata);
		if (req.body.model == "company" || req.body.model == "college") {
			const user = await User.findByIdAndUpdate(data._concernPerson, updata);
			if (req.body.status == 'false') {
				const updateJobs = await Vacancy.updateMany({ _company: data._id }, updata)
			}
		}
		return res.send(data);
	} catch (err) {
		console.log('err is ', err)
		req.flash("error", "Something went wrong!");
		return res.redirect("back");
	}
});

// Delete user : Nitin sehgal
router.post("/admin/deleteRecord", async (req, res) => {
	try {
		const Model = require(`../../models/` + req.body.model); // eslint-disable-line
		const updata = { $set: { isDeleted: true } };
		const data = await Model.findByIdAndUpdate(req.body.id, updata);
		if (req.body.model == "candidate") {
			const user0 = await User.findByIdAndUpdate(
				{ _id: data._concernPerson },
				updata
			);
		}

		if (req.body.model == "company" || req.body.model == "college") {
			const user = await User.findByIdAndUpdate(data._concernPerson, updata);

			if (req.body.model == "company") {
				const user0 = await CompanyExecutive.updateMany(
					{ _company: data._id },
					updata
				);
			}
			if (req.body.model == "college") {
				//	console.log("innn", data);
				const user1 = await collegeRepresentative.updateMany(
					{
						_college: data._id,
					},
					updata
				);
			}
			//console.log(user1, "seconndddd");
		}
		return res.send(data);
	} catch (err) {
		req.flash("error", "Something went wrong!");
		return res.redirect("back");
	}
});

router.post("/admin/deleteArchieve", async (req, res) => {
	try {
		if (req.body.model == "college") {
			// console.log("data.id = ", data._id);
			const user3 = await College.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "company") {
			// console.log("data.id = ", data._id);
			const user3 = await Company.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "candidate") {
			// console.log("data.id = ", data._id);
			const user3 = await Candidate.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "skillTest") {
			// console.log("data.id = ", data._id);
			const user3 = await SkillTest.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "careerObjective") {
			// console.log("data.id = ", data._id);
			const user3 = await CareerObjective.findOneAndDelete({
				_id: req.body.id,
			});
		}

		if (req.body.model == "coverLetter") {
			// console.log("data.id = ", data._id);
			const user3 = await CoverLetter.findOneAndDelete({ _id: req.body.id });
		}

		if (req.body.model == "mockInterview") {
			// console.log("data.id = ", data._id);
			const user3 = await MockInterview.findOneAndDelete({
				_id: req.body.id,
			});
		}

		if (req.body.model == "vacancy") {
			// console.log("data.id = ", data._id);
			const user3 = await Vacancy.findOneAndDelete({ _id: req.body.id });
		}

		return res.send(data);
	} catch (err) {
		req.flash("error", "Something went wrong!");
		return res.redirect("back");
	}
});

router.get("/admin/s3upload", async (req, res) => {
	try {
		const { user } = req.session;
		const { type, ext } = req.query;

		if (!user || !user._id) throw req.ykError("You are not authorized!");
		if (!type || !ext || !mimetypes.includes(ext))
			throw req.ykError("Invalid or unsupported file!");

		const key = `uploads/${user._id}/${uuid()}.${ext}`;
		const params = {
			Bucket: bucketName,
			ContentType: type,
			Key: key,
		};
		return s3.getSignedUrl("putObject", params, (err, url) => {
			if (err) throw err;
			if (!url) throw req.ykError();
			return res.send({ status: true, data: { url, key } });
		});
	} catch (err) {
		return req.errFunc(err);
	}
});

router.post("/admin/uploadVideo", (req, res) => {
	try {
		const { name, mimetype: ContentType } = req.files.file;
		const ext = name.split(".").pop();
		const key = `uploads/${uuid()}.${ext}`;
		const data = req.files.file.data;
		const params = {
			Bucket: bucketName,
			Body: data,
			Key: key,
			ContentType
		};
		s3.upload(params, function (err, data) {
			return res.send({ status: true, data });
		})
	}
	catch (err) {
		console.log(err);
		res.status(500).send({ status: false, message: err })
	}
})

//forget password

router
	.route("/admin/forgotpassword")
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/forPass`);
		return rePath;
	})
	.post(async (req, res) => {
		try {
			const email = req.body.email;
			const tempPassword = await generatePassword();
			const userData = await User.findOne({ email: email });
			if (!userData)
				throw req.ykError(
					"Invalid email, please enter your registered email"
				);

			if (userData.role == "3") throw req.ykError("You are not registered");

			bcrypt.hash(tempPassword, 10, async function (err, hash) {
				let user = await User.findOneAndUpdate(
					{ email: email },
					{
						password: hash,
					}
				);
			});

			var subject = "Focalyt - Forgot Password!";
			var message = `
			<html lang="en">
			<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			</head>
			<body>
			<div>
			<table border="0" cellpadding="0" cellspacing="0" style="height: 100%; width: 100%;">
                <tbody> 
                    <tr>
                        <td align="center" valign="top">
                            <table border="0" cellspacing="0" style="width: 600px; ">
                                <tbody>
                                    <tr>
                                        <td align="center" valign="top" style="font-family:'Manrope',sans-serif!important">
                                            <table border="0" cellspacing="0" cellpadding="0 ="
                                                style="background-color: #F4F3F3; border-radius: 4px; overflow: hidden; text-align: center; width: 620px;">
                                                <tbody>
                                                    <tr>
                                                        <td style="background-color:#FC2B5A;color:#ffffff!important"
                                                            valign="top">
                                                            <a>
                                                                <img src="http://35.160.1.29:8004/images/logo/logo.png" alt="pic"
                                                                    style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                            </a>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="font-family:'Manrope',sans-serif!important;text-align:left;padding-left:65px;padding-top:70px" >
														<p style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
														Hi ${userData.name},<br/><br/>				
														Your Temporary  Password : ${tempPassword}<br/>  <br/> 
														</p>
														<p style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
														Thank you,<br/> 
														Focalyt Group<br/> <br/> 
														Please contact mentory@support.com if you have any questions.
														</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="font-family: 'manrope',sans-serif!important;text-align:left">
                                                            <ul style="list-style-type: none;padding-left: 0px;margin: 20px 50px!important;">
                                                                <li style="padding-top:0px">
                                                                    <span style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                        Sincerely, <br/> Focalyt Group 
                                                                    </span>
                                                                </li>                                                                
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
		</div>
		</body>
		</html>
			`;

			sendMail(subject, message, email);

			req.flash(
				"success",
				"Your new password has been sent to your registered email. Please check your email."
			);
			res.redirect("/admin/forgotpassword");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

//change password
router
	.route("/admin/changepassword")
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/admin/setting/changePass`, { menu: 'dashboard' });
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(async (req, res) => {
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
	.route("/admin/editprofile")
	.get(async (req, res) => {
		var user = req.session.user;
		rePath = res.render(`${req.vPath}/admin/setting/editProfile`, {
			user,
			menu: 'dashboard'
		});
		// rePath = res.render(`${req.vPath}/front/login`);
		return rePath;
	})
	.post(async (req, res) => {
		try {
			const email = req.body.email;
			const name = req.body.name;
			var id = req.session.user._id;

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


router.route('/about')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/about`, {
		});
	})
router.route('/about-us')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/aboutUs`, {
		});
	})

router.route('/termsandconditions')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/termsAndConditions`, {
		});
	})

router.route('/privacy-policy')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/privacyPolicy`, {
		});
	})

router.route('/return-and-refund-policy')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/returnAndRefundPolicy`, {
		});
	})

router.route('/contact-us')
	.get(async (req, res) => {
		rePath = res.render(`${req.vPath}/front/contactUs`, {
		});
	})

router.route('/signs')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");
		rePath = res.render(`${req.vPath}/front/signs`, {
		});
	})

router.route('/signConverter')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");

		rePath = res.render(`${req.vPath}/front/signConverter`, {
		});
	})

router.route('/voice')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");
		rePath = res.render(`${req.vPath}/front/voice`, {
		});
	})

router.route('/translate')
	.post(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");
		const lang = req.body.lang ? req.body.lang : 'hi'
		const message = req.body.message?.toLowerCase();
		console.log('I received this message ', message)
		const translate = new Translate({ projectId: translateProjectId, key: translateKey });

		translate.translate(message, lang).then(result => {
			return res.send({ status: true, message: result[0] });
		})
			.catch(err => {
				console.log('=========> Err', err)
				return res.send({ status: false, message: 'caught an error' });
			});

	})

router.route('/parser')
	.get(async (req, res) => {
		res.setHeader('X-FRAME-OPTIONS', 'ALLOW-FROM *');
		res.setHeader('Content-Security-Policy', "frame-ancestors *");

		rePath = res.render(`${req.vPath}/front/parser`, {
		});
	})
	router.post("/studentRegistration", async (req, res) => {
		try {
		  const studentData = req.body;
	  
		  const newStudent = new StudentRegistration(studentData);
		  const savedStudent = await newStudent.save();
	  
		  res.status(201).json({
			status: "success",
			message: "Student registered successfully",
			data: savedStudent,
		  });
		} catch (error) {
		  console.error("Error during student registration:", error);
		  res.status(500).json({
			status: "error",
			message: "Failed to register student",
			error: error.message,
		  });
		}
	  });

module.exports = router;
