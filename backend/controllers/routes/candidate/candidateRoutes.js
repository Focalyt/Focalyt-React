// const ObjectId = require("mongodb").ObjectId;
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const express = require("express");
const uuid = require('uuid/v1');
require('dotenv').config()
const axios = require("axios")
const fs = require('fs')
const path = require("path");
const puppeteer = require("puppeteer");
const { ykError, headerAuthKey, extraEdgeAuthToken, extraEdgeUrl, env, fbConversionPixelId,
  fbConversionAccessToken,
  baseUrl } = require("../../../config");
const { updateSpreadSheetValues } = require("../services/googleservice")

const CandidateDoc = require('../../models/candidatedoc');
const UploadCandidates = require('../../models/uploadCandidates');
const bizSdk = require('facebook-nodejs-business-sdk');
const Content = bizSdk.Content;
const CustomData = bizSdk.CustomData;
const DeliveryCategory = bizSdk.DeliveryCategory;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const ServerEvent = bizSdk.ServerEvent;
const {
  User,
  AppliedEvent,
  Event,
  CandidateRegister,
  Center,
  State,
  City,
  Qualification,
  University,
  SubIndustry,
  SubQualification,
  Industry,
  Skill,

  Vacancy,
  HiringStatus,
  coinsOffers,
  PaymentDetails,
  CoinsAlgo,
  AppliedJobs,
  CandidateCashBack,
  CashBackRequest,
  CashBackLogic,
  KycDocument,
  InterestedCompanies,
  Vouchers,
  VoucherUses,
  Notification,
  Company,
  VideoData,
  Referral,
  Contact,
  LoanEnquiry,
  Review,
  Courses,
  AppliedCourses,
  CandidateProfile,
  ReEnquire, Curriculum,
  AssignmentQuestions,
  AssignmentSubmission,
  JobOffer,
  RewardStatus,
  RewardClaim,
  Placement,
  PlacementStatus
} = require("../../models");

const Candidate = require("../../models/candidateProfile")
const users = require("../../models/users");
const AWS = require("aws-sdk");
const multer = require('multer');
const crypto = require("crypto");
const {
  getTotalExperience,
  getTechSkills,
  getNonTechSkills,
  authenti,
  isCandidate,
  getDistanceFromLatLonInKm,
  sendSms,
  isAdmin,
  sendMail,
} = require("../../../helpers");
const router = express.Router();
const {
  accessKeyId,
  secretAccessKey,
  bucketName,
  region,
  authKey,
  msg91WelcomeTemplate,
} = require("../../../config");
const Razorpay = require("razorpay");
const apiKey = process.env.MIPIE_RAZORPAY_KEY;
const razorSecretKey = process.env.MIPIE_RAZORPAY_SECRET;
const moment = require("moment");
const { candidateProfileCashBack, candidateVideoCashBack, candidateApplyCashBack, checkCandidateCashBack, candidateReferalCashBack } = require('../services/cashback')
const { candidateCashbackEventName, cashbackEventType, cashbackRequestStatus, referalStatus, loanEnquiryPurpose, loanEnquiryStatus } = require('../../db/constant');
const cashBackLogic = require("../../models/cashBackLogic");
const { sendNotification } = require('../services/notification');
const kycDocument = require("../../models/kycDocument");
const { CandidateValidators } = require('../../../helpers/validators');


// Facebook API Configuration
const FB_API_VERSION = 'v21.0';
const FB_GRAPH_API = `https://graph.facebook.com/${FB_API_VERSION}/${fbConversionPixelId}/events`;

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});
// Define the custom error
class InvalidParameterError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidParameterError';
  }
}

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

// Function to hash a value using SHA-256
// const hashValue = (value) => {
//   if (value === undefined || value === null) {
//     console.error("Invalid value passed to hashValue:", value);
//     return null;
//   }

//   try {
//     const stringValue = value.toString().trim().toLowerCase(); // Ensure it's a string
//     return crypto.createHash('sha256').update(stringValue).digest('hex');
//   } catch (error) {
//     console.error("Error hashing value:", error.message);
//     return null;
//   }
// };


class MetaConversionAPI {
  constructor() {
    // Validate Meta Pixel ID
    const pixelId = fbConversionPixelId;
    if (!pixelId) {
      throw new Error('META_PIXEL_ID environment variable is not set');
    }

    // Validate Access Token
    const accessToken = fbConversionAccessToken;
    if (!accessToken) {
      throw new Error('META_ACCESS_TOKEN environment variable is not set');
    }

    this.accessToken = accessToken;
    this.pixelId = pixelId;
    this.apiVersion = 'v21.0';

    // Add validation to ensure baseUrl is properly constructed
    if (!this.pixelId || this.pixelId === 'undefined') {
      throw new Error('Invalid Meta Pixel ID');
    }

    this.metaAPIUrl = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;

    // Log configuration (without sensitive data)
    // console.log('Meta Conversion API Configuration:', {
    //   pixelIdExists: !!this.pixelId,
    //   accessTokenExists: !!this.accessToken,
    //   apiVersion: this.apiVersion,
    //   metaAPIUrl: this.metaAPIUrl
    // });
  }

  _hashData(data) {
    if (!data) return null;
    // Convert to string and handle non-string inputs
    const stringData = String(data);
    return crypto.createHash('sha256').update(stringData.toLowerCase().trim()).digest('hex');
  }

  async trackCourseApplication(courseData, userData, metaParams) {
    try {
      console.log(courseData, userData, metaParams)
      const eventData = {
        data: [{
          event_name: 'Course Apply',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: {
            em: this._hashData(userData.email),
            ph: this._hashData(userData.phone),
            fn: this._hashData(userData.firstName),
            ln: this._hashData(userData.lastName),
            ct: this._hashData(userData.city),
            st: this._hashData(userData.state),
            db: this._hashData(userData.dob),
            ge: this._hashData(userData.gender),
            country: this._hashData('in'),
            client_ip_address: userData.ipAddress,
            client_user_agent: userData.userAgent,
            external_id: this._hashData(userData.phone),
            fbc: metaParams.fbc, // Facebook Click ID
            fbp: metaParams.fbp  // Facebook Browser ID
          },
          custom_data: {
            content_name: courseData.courseName,
            content_category: 'Course',
            currency: 'INR',
            value: courseData.courseValue
          },
          event_source_url: courseData.sourceUrl
        }],
        access_token: this.accessToken
      };

      const response = await axios.post(this.metaAPIUrl, eventData);
      console.log('Course application event tracked successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('Meta Conversion API Error:', error.response?.data || error.message);
      return null;
    }
  }
}


// Helper function to extract Meta parameters from cookies and URL
const getMetaParameters = (req) => {
  // Extract fbclid from URL
  const fbclid = req.query.fbclid;

  // Get cookies
  const cookies = req.cookies || {};

  // Construct fbc (Facebook Click ID) with proper format
  let fbc = cookies._fbc;
  if (fbclid) {
    // Format should be: fb.1.${timestamp}.${fbclid}
    // The '1' represents the version number
    const timestamp = Date.now();
    fbc = `fb.1.${timestamp}.${fbclid}`;
  }

  // Get fbp (Facebook Browser ID) from cookies
  // fbp format should be: fb.1.${timestamp}.${random}
  let fbp = cookies._fbp;
  if (!fbp) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000000);
    fbp = `fb.1.${timestamp}.${random}`;
  }

  // Get ad specific parameters
  const adId = req.query.ad_id || null;
  const campaignId = req.query.campaign_id || null;
  const adsetId = req.query.adset_id || null;

  return {
    fbc,      // Only included if fbclid exists or _fbc cookie is present
    fbp,      // Always included, generated if not present
    adId,     // Ad ID from URL parameters
    campaignId, // Campaign ID from URL parameters
    adsetId    // Ad Set ID from URL parameters
  };
};




router.post("/course/:courseId/apply", [isCandidate, authenti], async (req, res) => {
  try {
    let { courseId } = req.params;
    // console.log("course appling")
    // Validate if it's a valid ObjectId before converting
    if (typeof courseId === "string" && mongoose.Types.ObjectId.isValid(courseId)) {
      courseId = new mongoose.Types.ObjectId(courseId); // Convert to ObjectId
    } else {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const validation = { mobile: req.user.mobile };
   


    let selectedCenter = req.body.selectedCenter;
    if (!selectedCenter) {
      selectedCenter = ""

    }

    else if (typeof selectedCenter === 'string') {
      try {
        selectedCenter = new mongoose.Types.ObjectId(selectedCenter);
      } catch (error) {
        return res.status(400).send({ status: false, msg: 'Invalid Center ID format' });
      }
    }



    const { value, error } = await CandidateValidators.userMobile(validation);
    if (error) {
      return res.status(400).json({ status: false, msg: "Invalid mobile number.", error });
    }

    const candidateMobile = value.mobile;



    // Fetch course and candidate
    const course = await Courses.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ status: false, msg: "Course not found." });
    }

    const candidate = await Candidate.findOne({ mobile: candidateMobile }).lean();

    if (!candidate) {
      return res.status(404).json({ status: false, msg: "Candidate not found." });
    }

    const alreadyApplied = await AppliedCourses.findOne({ _candidate: candidate._id, _course: courseId }).lean();

    // Check if already applied
    if (alreadyApplied) {

      const reEnquire = await ReEnquire.create({
        candidate: candidate._id,
        appliedCourse: alreadyApplied._id,
        course: courseId,
        reEnquireDate: new Date(),
        counselorName:  alreadyApplied.counsellor
      });

     

      return res.status(400).json({ status: false, msg: "Already applied." });
    };

    const updateData = {
      $addToSet: {
        appliedCourses: { courseId }
      }
    };

    if (selectedCenter) {
      updateData.$addToSet.selectedCenter = {
        courseId: courseId,
        centerId: selectedCenter
      };
    }

    const apply = await Candidate.findOneAndUpdate(
      { mobile: candidateMobile },
      updateData,
      { new: true, upsert: true }
    );

    let data = {
      _candidate: candidate._id,
      _course: courseId,
    };

    if (selectedCenter) {
      data._center = selectedCenter
    }



    const appliedData = await new AppliedCourses(data).save();


    // Capitalize every word's first letter
    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

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
      'Lead From Portal',
      course?.courseFeeType,
      course?.typeOfProject,
      course?.projectName,
      "Self"


    ];
    await updateSpreadSheetValues(sheetData);

    let candidateMob = candidate.mobile;

    // Check if the mobile number already has the country code
    if (typeof candidateMob !== "string") {
      candidateMob = String(candidateMob); // Convert to string
    }

    if (!candidateMob.startsWith("91") && candidateMob.length === 10) {
      candidateMob = "91" + candidateMob; // Add country code if missing and the length is 10
    }


    console.log(candidateMob);
    return res.status(200).json({ status: true, msg: "Course applied successfully." });
  } catch (error) {
    console.error("Error applying for course:", error.message);
    return res.status(500).json({ status: false, msg: "Internal server error.", error: error.message });
  }
});

// Modified sendEventToFacebook function
// const sendEventToFacebook = async (event_name, user_data, custom_data) => {
//   const event_id = crypto.createHash('sha256').update(`${user_data.em}-${event_name}-${Date.now()}`).digest('hex');
//   const payload = {
//     data: [
//       {
//         event_name,
//         event_time: Math.floor(Date.now() / 1000),
//         action_source: "website",
//         event_id,
//         user_data,
//         custom_data
//       }
//     ]
//   };

//   try {
//     const response = await axios.post(`${FB_GRAPH_API}?access_token=${fbConversionAccessToken}`, payload, {
//       headers: { 'Content-Type': 'application/json' }
//     });
//     console.log("Facebook Event Sent Successfully:", response.data);
//     return true; // Event sent successfully
//   } catch (error) {
//     console.error("Error sending event to Facebook:", error.response ? error.response.data : error.message);
//     return false; // Event failed
//   }
// };








router.route('/')
  .get(async (req, res) => {
    let user = req.session.user
    if (user && user.role === 3) {
      res.redirect("/candidate/dashboard");
    }
    else {
      res.redirect("/candidate/login");
    }
  })

router
  .route(["/register", "/signup"])
  .get(async (req, res) => {
    res.redirect("/candidate/login");
  })
  .post(async (req, res) => {
    try {
      // console.log("Received data from frontend:", req.body); 
      let { value, error } = await CandidateValidators.register(req.body)
      if (error) {
        console.log('====== register error ', error, value)
        return res.send({ status: "failure", error: value });
      }
      let formData = value;
      const { name, mobile, sex, personalInfo ,highestQualification , email, dob, isExperienced, fatherName, motherName} = formData;

      if (formData?.refCode && formData?.refCode !== '') {
        let referredBy = await CandidateProfile.findOne({ _id: formData.refCode, status: true, isDeleted: false })
        if (!referredBy) {
          req.flash("error", "Enter a valid referral code.");
          return res.send({ status: 'failure', error: "Enter a valid referral code." })
        }
      }
      const dataCheck = await Candidate.findOne({ mobile: mobile });
      if (email && email.trim() !== '') {
        const dataCheck1 = await Candidate.findOne({ email });
        if (dataCheck1) {
          return res.send({
            status: "failure",
            error: "Candidate email already exist!",
          });
        }
      }
      if (dataCheck) {
        return res.send({
          status: "failure",
          error: "Candidate mobile already registered",
        });
      }

      const datacheck2 = await User.findOne({ mobile, role: "3" });
      let datacheck3 = null;
      if (email && email.trim() !== '') {
        datacheck3 = await User.findOne({ email, role: "3" });
      }

      if (datacheck2 || datacheck3) {
        return res.send({
          status: "failure",
          error: "User mobile or email already exist!",
        });
      }

     

      const usr = await User.create({
        name,
        sex,
        mobile,
        email: email && email.trim() !== '' ? email : undefined,
        role: 3,
      });
      if (!usr) {
        console.log("usr not created");
        throw req.ykError("candidate user not create!");
      }

      let coins = await CoinsAlgo.findOne();
      let candidateBody = {
        name,
        email: email && email.trim() !== '' ? email : undefined,
        dob: dob && dob.trim() !== '' ? dob : undefined,
        sex,
        mobile,
        fatherName,
        motherName,
        verified: true,
        availableCredit: coins?.candidateCoins,
        creditLeft: coins?.candidateCoins,
        personalInfo,
        highestQualification: highestQualification && highestQualification.trim() !== '' ? highestQualification : undefined,
        isExperienced: isExperienced !== undefined && isExperienced !== null ? isExperienced : undefined
        
      };

      // console.log("Candidate Data", candidateBody)
      if (formData?.refCode && formData?.refCode !== '') {
        candidateBody["referredBy"] = formData?.refCode
      }
      const candidate = await CandidateProfile.create(candidateBody);

      if (!candidate) {
        console.log("candidate not created");
        throw req.ykError("Candidate not create!");
      }
      if (formData?.refCode && formData?.refCode !== '') {
        const referral = await Referral.create({
          referredBy: formData?.refCode,
          referredTo: candidate._id,
          status: referalStatus.Inactive
        })

      }
      let candName = candidate.name.split(" ")
      let firstName = candName[0], surName = ''
      if (candName.length >= 2) {
        surName = candName[candName.length - 1]
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
      // if (env.toLowerCase() === 'production') {
      //   let dataFormat = {
      //     Source: "mipie",
      //     FirstName: name,
      //     MobileNumber: mobile,
      //     LeadSource: "Website",
      //     LeadType: "Online",
      //     LeadName: "app",
      //     Course: "Mipie general",
      //     Center: "Padget",
      //     Location: "Technician",
      //     Country: "India",
      //     LeadStatus: "Signed Up",
      //     ReasonCode: "27",
      //     City: city[0],
      //     State: city[1],
      //     AuthToken: extraEdgeAuthToken
      //   }
      //   let edgeBody = JSON.stringify(dataFormat)
      //   let header = { "Content-Type": "multipart/form-data" }
      //   let extraEdge = await axios.post(extraEdgeUrl, edgeBody, header).then(res => {
      //     console.log(res.data)
      //     req.flash("success", "Candidate added successfully!");
      //   }).catch(err => {
      //     console.log(err)
      //     return err
      //   })
      // }
      let notificationData = {
        title: 'Signup',
        message: `Complete your profile to get your dream job.`,
        _candidate: candidate._id,
        source: "System"
      }
      await sendNotification(notificationData)
       
      try {
      
        const cleanMobile = String(mobile).replace(/^\+91/, '').replace(/^91/, '').replace(/\s/g, '');
        
        await UploadCandidates.updateMany(
          {
            $or: [
              { contactNumber: mobile },
              { contactNumber: cleanMobile },
              { contactNumber: `+91${cleanMobile}` },
              { contactNumber: `91${cleanMobile}` },
              { contactNumber: parseInt(cleanMobile) }
            ],
            status: 'inactive'
          },
          {
            $set: {
              status: 'active',
              user: usr._id 
            }
          }
        );
        // console.log(`✅ Updated UploadCandidates status to 'active' for mobile: ${mobile}`);
      } catch (uploadCandidatesError) {
        // Don't fail registration if UploadCandidates update fails
        console.error('⚠️ Failed to update UploadCandidates status:', uploadCandidatesError.message);
      }
      
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

// router.get("/login", async (req, res) => {
//   let user = req.session.user
//   let { returnUrl } = req.query


//   const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
//   console.log(fullUrl);

//   // Modify script to run after DOM is loaded and escape quotes properly
 

//   if (user && user.role == 3 && returnUrl && returnUrl.trim() !== '') {
//     return res.redirect(returnUrl)
//   }
//   else if (user && user.role == 3) {
//     return res.redirect("/candidate/dashboard");
//   }
//   return res.render(`${req.vPath}/app/candidate/login`, { apikey: process.env.AUTH_KEY_GOOGLE });
// });
// router.get("/searchjob", [isCandidate], async (req, res) => {
//   const data = req.query;
//   let validation = { mobile: req.session.user.mobile }
//   let { value, error } = await CandidateValidators.userMobile(validation)
//   if (error) {
//     console.log(error)
//     return res.send({ status: "failure", error: "Something went wrong!", error });
//   }
//   const candidate = await Candidate.findOne({
//     mobile: value.mobile,
//   });
//   const candidateLat = Number(candidate.latitude);
//   const candidateLong = Number(candidate.longitude);
//   let {
//     qualification,
//     experience,
//     industry,
//     state,
//     jobType,
//     minSalary,
//     techSkills,
//     name,
//     distance
//   } = req.query;

//   let filter = { status: true, validity: { $gte: new Date() }, verified: true };
//   if (qualification) {
//     filter['_qualification'] = new mongoose.Types.ObjectId(`${qualification}`)
//   }
//   if (industry) {
//     filter._industry = new mongoose.Types.ObjectId(`${industry}`);
//   }
//   if (state) {
//     filter['state.0._id'] = new mongoose.Types.ObjectId(`${state}`);
//   }
//   if (jobType) {
//     filter.jobType = jobType;
//   }
//   if (experience) {
//     experience = +(experience)
//     experience == "0"
//       ? (filter["$or"] = [{ experience: { $lte: experience } }])
//       : (filter["experience"] = { $lte: experience });
//   }
//   if (techSkills) {
//     filter._techSkills = new mongoose.Types.ObjectId(`${techSkills}`);
//   }
//   if (minSalary) {
//     filter["$or"] = [
//       { isFixed: true, amount: { $gte: minSalary } },
//       { isFixed: false, min: { $gte: minSalary } },
//     ];
//   }
//   if (name) {
//     filter["$or"] = [
//       { 'displayCompanyName': { "$regex": name, "$options": "i" } },
//       { 'company.0.name': { "$regex": name, "$options": "i" } }
//     ]
//   }

//   const allQualification = await Qualification.find({ status: true }).sort({
//     basic: -1,
//   });
//   const allIndustry = await Industry.find({ status: true });
//   const allStates = await State.find({
//     countryId: "101",
//     status: { $ne: false },
//   });
//   const perPage = 10;
//   const p = parseInt(req.query.page);
//   const page = p || 1;

//   let jobDistance = Infinity

//   if (distance && distance != 'all' && distance != '0') {
//     jobDistance = Number(distance) * 1000
//   }

//   const agg = [
//     {
//       '$geoNear': {
//         near: { type: "Point", coordinates: [candidateLong, candidateLat] },
//         distanceField: "distance",
//         maxDistance: jobDistance,
//         distanceMultiplier: 0.001
//       }
//     },
//     {
//       '$lookup': {
//         from: 'companies',
//         localField: '_company',
//         foreignField: '_id',
//         as: '_company'
//       }
//     },
//     {
//       '$match': {
//         '_company.0.isDeleted': false,
//         '_company.0.status': true,
//         '_id': { "$nin": candidate.appliedJobs }
//       }
//     },
//     {
//       '$lookup': {
//         from: 'qualifications',
//         localField: '_qualification',
//         foreignField: '_id',
//         as: 'qualifications'
//       }
//     },
//     {
//       '$lookup': {
//         from: 'industries',
//         localField: '_industry',
//         foreignField: '_id',
//         as: 'industry'
//       }
//     },
//     {
//       '$lookup': {
//         from: 'cities',
//         localField: 'city',
//         foreignField: '_id',
//         as: 'city'
//       }
//     },
//     {
//       '$lookup': {
//         from: 'states',
//         localField: 'state',
//         foreignField: '_id',
//         as: 'state'
//       }
//     },
//     {
//       '$lookup': {
//         from: 'skills',
//         localField: '_techSkills',
//         foreignField: '_id',
//         as: '_techSkill'
//       }
//     },
//     {
//       '$lookup': {
//         from: 'jobcategories',
//         localField: '_jobCategory',
//         foreignField: '_id',
//         as: '_jobCategory'
//       }
//     },
//     {
//       '$lookup': {
//         from: 'users',
//         localField: '_company.0._concernPerson',
//         foreignField: '_id',
//         as: 'user'
//       }
//     },
//     {
//       '$match': filter
//     },
//     {
//       '$sort': {
//         'sequence': 1,
//         'createdAt': -1
//       }
//     },
//     {
//       '$facet': {
//         metadata: [{ '$count': "total" }],
//         data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
//       }
//     }
//   ]
//   const allJobs = await Vacancy.aggregate(agg)
//   let count = allJobs[0].metadata[0]?.total
//   if (!count) {
//     count = 0
//   }

//   const totalPages = Math.ceil(count / perPage);
//   let jobs = allJobs[0].data
//   // console.log(jobs[0])
//   // jobs.forEach((item) => {
//   //   if (item.latitude && item.longitude && candidateLat && candidateLong) {
//   //     let distance = getDistanceFromLatLonInKm(
//   //       { lat1: candidateLat, long1: candidateLong },
//   //       { lat2: Number(item.latitude), long2: Number(item.longitude) }
//   //     );
//   //     item.distance = distance.toFixed(0);
//   //   } else {
//   //     let distance = 0;
//   //     item.distance = distance;
//   //   }
//   // });
//   let skills = await Skill.find({ status: true });
//   res.render(`${req.vPath}/app/candidate/search-job`, {
//     menu: "Jobs",
//     jobs,
//     allQualification,
//     allIndustry,
//     allStates,
//     data,
//     skills,
//     totalPages,
//     page
//   });
// });

router.get("/searchjob", [isCandidate], async (req, res) => {
  const data = req.query;
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;

  let {
    qualification,
    experience,
    industry,
    state,
    jobType,
    minSalary,
    techSkills,
    name,
  } = req.query;

  // Step 1: Get the logged-in candidate using mobile from token
  const candidate = await Candidate.findOne({ mobile: req.user.mobile });

  // Step 2: Build base filter
  let filter = { status: true, validity: { $gte: new Date() }, verified: true };

  // Step 3: Exclude applied jobs
  if (candidate?.appliedJobs?.length > 0) {
    const appliedJobIds = candidate.appliedJobs.map(j => j.jobId || j._id); // adjust key as needed
    filter._id = { $nin: appliedJobIds };
  }

  // Step 4: Additional filters
  if (qualification) filter['_qualification'] = qualification;
  if (industry) filter['_industry'] = industry;
  if (state) filter['state.0._id'] = state;
  if (jobType) filter['jobType'] = jobType;
  if (experience) {
    const exp = Number(experience);
    if (exp === 0) {
      filter['$or'] = [{ experience: { $lte: 0 } }];
    } else {
      filter['experience'] = { $lte: exp };
    }
  }
  if (techSkills) filter['_techSkills'] = techSkills;
  if (minSalary) {
    filter['$or'] = [
      { isFixed: true, amount: { $gte: minSalary } },
      { isFixed: false, min: { $gte: minSalary } },
    ];
  }
  if (name) {
    filter['$or'] = [
      { displayCompanyName: { $regex: name, $options: 'i' } },
      { 'company.0.name': { $regex: name, $options: 'i' } }
    ];
  }

  // Reference data
  const [allQualification, allIndustry, allStates, skills] = await Promise.all([
    Qualification.find({ status: true }).sort({ basic: -1 }),
    Industry.find({ status: true }),
    State.find({ countryId: "101", status: { $ne: false } }),
    Skill.find({ status: true })
  ]);

  // Get jobs
  const jobs = await Vacancy.find(filter)
    .populate("_company _qualification _industry city state _techSkills _jobCategory")
    .sort({ sequence: 1, createdAt: -1 })
    .skip(perPage * (page - 1))
    .limit(perPage);

  const count = await Vacancy.countDocuments(filter);
  const totalPages = Math.ceil(count / perPage);

  return res.json({
    menu: "Jobs",
    jobs,
    allQualification,
    allIndustry,
    allStates,
    data,
    skills,
    totalPages,
    page
  });
});

router.get("/job/:jobId", [isCandidate], async (req, res) => {
  // router.get("/job/:jobId", async (req, res) => {
  let jobId = req.params.jobId;
  console.log('jobId', jobId)
  if (typeof jobId === 'string' && mongoose.Types.ObjectId.isValid(jobId)) {
    console.log('converting id')
    jobId = new mongoose.Types.ObjectId(jobId);
  }
  const contact = await Contact.find({ status: true, isDeleted: false }).sort({ createdAt: 1 })
  const highestQualification = await Qualification.find({ status: true });

  const userMobile = req.user.mobile;
  let validation = { mobile: userMobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const populate = [
    { path: "_qualification" },
    { path: "_industry" },
    { path: "city" },
    { path: "state" },
    { path: "_jobCategory" },
    { path: "_company", populate: "_concernPerson" },
    { path: "_techSkills" },
    { path: "_nonTechSkills" },
  ];
  const jobDetails = await Vacancy.findById(jobId).populate(populate);
  if (jobDetails.status == false) {
    return res.redirect("/candidate/searchJob");
  }

  const candidate = await Candidate.findOne({ mobile: userMobile }).populate('highestQualification').lean();

  let canApply = false;
  if (candidate.name && candidate.mobile && candidate.sex && candidate.personalInfo.currentAddress && candidate.highestQualification) {
    canApply = true;
  
}



  let isRegisterInterview = false;
  const checkJobRegister = await AppliedJobs.findOne({
    _candidate: candidate._id,
    _job: new mongoose.Types.ObjectId(jobId)
  });
  if (checkJobRegister && checkJobRegister?.isRegisterInterview) {
    isRegisterInterview = true;
  }
  let isApplied = false;

  if (candidate.appliedJobs && candidate.appliedJobs.length > 0) {
    const applied = candidate.appliedJobs.find(c => {
      return c.jobId && c.jobId.toString() === jobId.toString();
    })

    if (applied) {
      isApplied = true;
    }
  }


  let hasCredit = true;
  let coins = await CoinsAlgo.findOne({});
  if (!candidate.creditLeft || candidate.creditLeft < coins.job) {
    hasCredit = false;
  }
  let mobileNumber = jobDetails.phoneNumberof ? jobDetails.phoneNumberof : contact[0]?.mobile
  let reviewed = await Review.findOne({ _job: jobId, _user: candidate._id });
  let course = [];
  const recomCo = await Vacancy.distinct('_courses.courseLevel', {
    "_id": new mongoose.Types.ObjectId(jobId), "_courses.isRecommended": true
  });
  console.log(recomCo, "recomCorecomCorecomCorecomCo");
  if (recomCo.length > 0) {
    const fields = {
      status: true,
      isDeleted: false,
      _id: {
        $in: recomCo
      }
    };
    // if (candidate?.appliedCourses.length > 0) {
    //   fields._id = {
    //     $nin: candidate.appliedCourses
    //   }
    // }
    course = await Courses.find(fields).populate("sectors");
  }

  return res.json({
    highestQualification,
    jobDetails,
    candidate,
    isApplied,
    isRegisterInterview,
    canApply,
    hasCredit,
    coins,
    mobileNumber,
    reviewed: reviewed ? true : false,
    course,
    // page,
    // totalPages
  });

});

// router.get("/job/:jobId", [isCandidate], async (req, res) => {
//   const jobId = req.params.jobId;
//   const contact = await Contact.find({ status: true, isDeleted: false }).sort({ createdAt: 1 })
//   const userMobile = req.session.user.mobile;
//   let validation = { mobile: userMobile }
//   let { value, error } = await CandidateValidators.userMobile(validation)
//   if (error) {
//     return res.send({ status: "failure", error: "Something went wrong!", error });
//   }

//   const perPage = 10;
//   const page = parseInt(req.query.page) || 1;
//   const populate = [
//     { path: "_qualification" },
//     { path: "_industry" },
//     { path: "city" },
//     { path: "state" },
//     { path: "_jobCategory" },
//     { path: "_company", populate: "_concernPerson" },
//     { path: "_techSkills" },
//     { path: "_nonTechSkills" },
//   ];
//   const jobDetails = await Vacancy.findById(jobId).populate(populate);
//   if (jobDetails.status == false) {
//     return res.redirect("/candidate/searchJob");
//   }

//   const candidate = await Candidate.findOne({ mobile: userMobile });
//   let canApply = false;
//   if (candidate.name && candidate.mobile && candidate.sex && candidate.whatsapp && candidate.city && candidate.state && candidate.highestQualification) {
//     if (candidate.isExperienced == false || candidate.isExperienced == true) {
//       canApply = true;
//     }
//   }
//   let isRegisterInterview = false;
//   const checkJobRegister = await AppliedJobs.findOne({
//     _candidate: candidate._id,
//     _job: new mongoose.Types.ObjectId(jobId)
//   });
//   if (checkJobRegister && checkJobRegister?.isRegisterInterview) {
//     isRegisterInterview = true;
//   }
//   let isApplied = false;
//   if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
//     isApplied = true;
//   }
//   let hasCredit = true;
//   let coins = await CoinsAlgo.findOne({});
//   if (!candidate.creditLeft || candidate.creditLeft < coins.job) {
//     hasCredit = false;
//   }
//   let mobileNumber = jobDetails.phoneNumberof ? jobDetails.phoneNumberof : contact[0]?.mobile
//   let reviewed = await Review.findOne({ _job: jobId, _user: candidate._id });
//   let course = [];
//   const recomCo = await Vacancy.distinct('_courses.courseLevel', {
//     "_id": new mongoose.Types.ObjectId(jobId), "_courses.isRecommended": true
//   });
//   console.log(recomCo, "recomCorecomCorecomCorecomCo");
//   if (recomCo.length > 0) {
//     const fields = {
//       status: true,
//       isDeleted: false,
//       _id: {
//         $in: recomCo
//       }
//     };
//     // if (candidate?.appliedCourses.length > 0) {
//     //   fields._id = {
//     //     $nin: candidate.appliedCourses
//     //   }
//     // }
//     course = await Courses.find(fields).populate("sectors");
//   }

//   res.render(`${req.vPath}/app/candidate/view-job`, {
//     menu: "Jobs",
//     jobDetails,
//     candidate,
//     isApplied,
//     isRegisterInterview,
//     canApply,
//     hasCredit,
//     coins,
//     mobileNumber,
//     reviewed: reviewed ? true : false,
//     course,
//     // page,
//     // totalPages
//   });

// });

/* Document route */
router.get("/document", [isCandidate], async (req, res) => {
  try {
    let validation = { mobile: req.user.mobile };
    let { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({ mobile: value.mobile }).lean();
    if (!candidate) {
      return res.send({ status: false, msg: "Candidate not found!" });
    }

    const documents = await CandidateDoc.findOne({ _candidate: candidate._id }).lean();



    res.render(`${req.vPath}/app/candidate/document`, {
      menu: 'document',
      candidate,
      documents: documents || {},
    });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});


router.post("/document", [isCandidate], async (req, res) => {
  try {
    const documentsData = req.body;
    const userMobile = req.session.user.mobile;
    console.log(documentsData, "this is document data");

    const candidate = await Candidate.findOne({ mobile: userMobile }).lean();
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const existingDocument = await CandidateDoc.findOne({ _candidate: candidate._id });
    console.log(existingDocument, "data find successfully??>><<>")
    if (existingDocument) {
      existingDocument.Photograph = documentsData.Photograph || existingDocument.Photograph;
      existingDocument.AadharCardFront = documentsData.AadharCardFront || existingDocument.AadharCardFront;
      existingDocument.AadharCardBack = documentsData.AadharCardBack || existingDocument.AadharCardBack;
      existingDocument.ResidenceCertificate = documentsData.ResidenceCertificate || existingDocument.ResidenceCertificate;
      existingDocument.CasteCertificate = documentsData.CasteCertificate || existingDocument.CasteCertificate;
      existingDocument.RationCard = documentsData.RationCard || existingDocument.RationCard;
      existingDocument['10thMarksheet'] = documentsData['10thMarksheet'] || existingDocument['10thMarksheet'];
      existingDocument['12thMarksheet'] = documentsData['12thMarksheet'] || existingDocument['12thMarksheet'];
      existingDocument.DiplomaMarksheet = documentsData.DiplomaMarksheet || existingDocument.DiplomaMarksheet;
      existingDocument.BachelorDegreeMarkSheets = documentsData.BachelorDegreeMarkSheets || existingDocument.BachelorDegreeMarkSheets;
      existingDocument.DegreePassingCertificate = documentsData.DegreePassingCertificate || existingDocument.DegreePassingCertificate;
      existingDocument.PassportNationalityCertificate = documentsData.PassportNationalityCertificate || existingDocument.PassportNationalityCertificate;
      existingDocument.MigrationCertificateTransferCertificate = documentsData.MigrationCertificateTransferCertificate || existingDocument.MigrationCertificateTransferCertificate;
      existingDocument.GapCertificate = documentsData.GapCertificate || existingDocument.GapCertificate;
      existingDocument.ProfessionalExperienceCertificate = documentsData.ProfessionalExperienceCertificate || existingDocument.ProfessionalExperienceCertificate;
      existingDocument.AdditionalDocuments = documentsData.AdditionalDocuments || existingDocument.AdditionalDocuments;
      existingDocument.Signature = documentsData.Signature || existingDocument.Signature

      await existingDocument.save();
      // console.log("Document updated:", existingDocument);
    } else {
      const newDocument = new CandidateDoc({
        _candidate: candidate._id,
        Photograph: documentsData.Photograph,
        AadharCardFront: documentsData.AadharCardFront,
        AadharCardBack: documentsData.AadharCardBack,
        ResidenceCertificate: documentsData.ResidenceCertificate,
        CasteCertificate: documentsData.CasteCertificate,
        RationCard: documentsData.RationCard,
        '10thMarksheet': documentsData['10thMarksheet'],
        '12thMarksheet': documentsData['12thMarksheet'],
        DiplomaMarksheet: documentsData.DiplomaMarksheet,
        BachelorDegreeMarkSheets: documentsData.BachelorDegreeMarkSheets,
        DegreePassingCertificate: documentsData.DegreePassingCertificate,
        PassportNationalityCertificate: documentsData.PassportNationalityCertificate,
        MigrationCertificateTransferCertificate: documentsData.MigrationCertificateTransferCertificate,
        GapCertificate: documentsData.GapCertificate,
        ProfessionalExperienceCertificate: documentsData.ProfessionalExperienceCertificate,
        AdditionalDocuments: documentsData.AdditionalDocuments,
        Signature: documentsData.Signature
      });

      await newDocument.save();
      // console.log("New document created:", newDocument);
    }

    // Fetch the updated documents for rendering
    const documents = await CandidateDoc.findOne({ _candidate: candidate._id }).lean();
    console.log(documents, "this is data");
    res.render(`${req.vPath}/app/candidate/document`, {
      menu: 'document',
      candidate,
      documents: documents || {},
      message: "Success"
    });

  } catch (error) {
    console.error("Error saving documents:", error);
    req.flash("error", error.message || "Something went wrong!");
    return res.redirect("back");
  }
});


router.delete('/document', [isCandidate], async (req, res) => {
  try {
    const documentName = req.query.documentName;
    const id = req.query.id
    console.log(documentName, "this is document name");

    const userMobile = req.session.user.mobile;
    const candidate = await Candidate.findOne({ mobile: userMobile }).lean();

    if (!candidate) {
      return res.status(404).send({ success: false, message: "Candidate not found!" });
    }

    const updateResult = await CandidateDoc.updateOne(
      { _id: id, [documentName]: { $exists: true } },
      { $set: { [documentName]: "" } }
    );

    const updateadditionaldoc = await CandidateDoc.updateOne(
      { _id: id },
      { $pull: { AdditionalDocuments: documentName } }
    );
    const documents = await CandidateDoc.findOne({ _candidate: candidate._id }).lean();
    console.log(documents, "documents after delete");

    res.render(`${req.vPath}/app/candidate/document`, {
      menu: 'document',
      candidate,
      success: true,
      documents: documents || {},
      message: "Document deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting document", error);
    req.flash("error", error.message || "Something Went Wrong!");
    return res.status(500).send({ success: false, message: error.message || "Something went wrong!" });
  }
});


/* List of courses */
router.get("/searchcourses", [isCandidate], async (req, res) => {
  try {
    const data = req.query;


    const perPage = 10;
    const p = parseInt(req.query.page);
    const page = p || 1;
    let validation = { mobile: req.user.mobile }
    let mobile = req.user.mobile
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    const candidate = await Candidate.findOne({
      mobile: mobile,
    });
    const fields = {
      status: true,
      isDeleted: false,
      $or: [
        { lastDateForApply: { $gte: moment().utcOffset('+05:30').startOf('day').toDate() } },
        { lastDateForApply: { $exists: false } },
        { lastDateForApply: null },
        { lastDateForApply: '' }
      ]
    }
    if (candidate?.appliedCourses?.length > 0) {
      fields._id = {
        $nin: candidate.appliedCourses.map(c => new mongoose.Types.ObjectId(c.courseId))
      };

    }
    console.log('data: ', data);
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
    let count = 0;
    console.log('fields: ', JSON.stringify(fields));
    let courses = await Courses.find(fields).populate("sectors");
    count = await Courses.countDocuments(fields);
    const totalPages = Math.ceil(count / perPage);

    return res.json({
      courses,
      data,
      totalPages,
      page,
    });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
});
/* course by id*/
// router.get("/course/:courseId/", [isCandidate], async (req, res) => {
router.get("/course/:courseId/", isCandidate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const contact = await Contact.find({ status: true, isDeleted: false }).sort({ createdAt: 1 });
    const userMobile = req.user.mobile;

    let validation = { mobile: userMobile };
    let { value, error } = CandidateValidators.userMobile(validation);
    if (error) {
      return res.status(400).json({ status: false, message: "Invalid user" });
    }

    let course = await Courses.findById(courseId).populate('sectors').populate('center').lean();


    if (!course || course?.status === false) {
      return res.status(404).json({ status: false, message: "Course not found" });
    }

    const candidate = await Candidate.findOne({ mobile: userMobile }).populate('highestQualification').lean();
    const highestQualification = await Qualification.find({ status: true });



    let docsRequired = false;
    let centerRequired = false;

    const requiredCenter = course.center ? course.center.length : 0;

    const requiredDocs = course.docsRequired ? course.docsRequired.length : 0;

    

    if (requiredCenter > 0) {
      centerRequired = true
    };

    if (requiredDocs > 0) {
      docsRequired = true
    };




    let canApply = false;
    if (candidate.name && candidate.mobile && candidate.sex &&  candidate.personalInfo.currentAddress && candidate.highestQualification) {
        canApply = true;
      
    }

    console.log('canApply', canApply)
    

    let isApplied = false;
    let assignedCourseData = null;

    if (candidate.appliedCourses && candidate.appliedCourses.length > 0) {
      const applied = candidate.appliedCourses.find(c => {
        return c.courseId && c.courseId.toString() === courseId.toString();
      });

      console.log('applied', applied) 


      if (applied) {
        isApplied = true;

        assignedCourseData = await AppliedCourses.findOne({
          _candidate: candidate._id,
          _course: new mongoose.Types.ObjectId(courseId)
        }).lean();

        if (course?.registrationCharges) {
          course.registrationCharges = course.registrationCharges.toString().replace(/,/g, '');
        }

        if (assignedCourseData) {
          course.remarks = assignedCourseData.remarks;
          course.assignDate = assignedCourseData.assignDate
            ? moment(assignedCourseData.assignDate).format('DD MMM YYYY')
            : "";
          course.registrationStatus = assignedCourseData.registrationFee || 'Unpaid';
          // Add batchId from assignedCourseData (field name is 'batch' in model)
          course.batchId = assignedCourseData.batch || null;
          console.log('Batch ID assigned to course:', course.batchId);
        }
      }
    }


    let mobileNumber = course.phoneNumberof ? course.phoneNumberof : contact[0]?.mobile;


    return res.json({
      status: true,
      course,
      docsRequired,
      isApplied,
      mobileNumber,
      canApply,
      highestQualification,
      requiredCenter,
      centerRequired, candidate

    });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
});
router.get("/api/highestQualifications", async (req, res) => {
  try {
    const qualifications = await Qualification.find({ status: true }).select("_id name").sort({ name: 1 });

    return res.json({
      status: true,
      message: "Highest qualifications fetched successfully.",
      data: qualifications
    });
  } catch (error) {
    console.error("Error fetching highest qualifications:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

/* course apply */
// router.post("/course/:courseId/apply", [isCandidate, authenti], async (req, res) => {
//   let courseId = req.params.courseId;
//   let validation = { mobile: req.session.user.mobile }
//   let { value, error } = await CandidateValidators.userMobile(validation)
//   if (error) {
//     return res.send({ status: "failure", error: "Something went wrong!", error });
//   }
//   let candidateMobile = value.mobile;
//   let course = await Courses.findById(courseId);
//   if (!course) {
//     return res.send({ status: false, msg: "Course not Found!" });
//   }
//   let candidate = await Candidate.findOne({ mobile: candidateMobile }).populate([{
//     path: 'state',
//     select: "name"
//   }, {
//     path: 'city',
//     select: "name"
//   }]).lean();
//   if (!candidate) {
//     return res.send({ status: false, msg: "Candidate not found!" });
//   }

//   if (candidate.appliedCourses && candidate.appliedCourses.includes(courseId)) {
//     req.flash("error", "Already Applied");
//     return res.send({ status: false, msg: "Already Applied" });
//   } else {



//     let apply = await Candidate.findOneAndUpdate({ mobile: candidateMobile },
//       { $addToSet: { appliedCourses: courseId } },
//       { new: true, upsert: true });
//    const appliedData = await AppliedCourses({
//       _candidate: candidate._id,
//       _course: courseId
//     }).save();

//     let sheetData = [candidate?.name, candidate?.mobile,candidate?.email, candidate?.sex, candidate?.dob ? moment(candidate?.dob).format('DD MMM YYYY'): '', candidate?.state?.name, candidate.city?.name, 'Course', `${process.env.BASE_URL}/coursedetails/${courseId}`, course?.registrationCharges, appliedData?.registrationFee, moment(appliedData?.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm')]

//       await updateSpreadSheetValues(sheetData);
//       //Extract UTM Parameters from query
//       const sanitizeInput = (value) => typeof value === 'string' ? value.replace(/[^a-zA-Z0-9-_]/g, '') : value;
//       //Extract UTM Parameters from query
//       let utm_params = {
//         utm_source: sanitizeInput(req.query.utm_source || 'unknown'),
//         utm_medium: sanitizeInput(req.query.utm_medium || 'unknown'),
//         utm_campaign: sanitizeInput(req.query.utm_campaign || 'unknown'),
//         utm_term: sanitizeInput(req.query.utm_term || ''),
//         utm_content: sanitizeInput(req.query.utm_content || ''),
//     };
//     //Extract fbp and fbc values
//     let fbp = req.cookies?._fbp || '';
//     let fbc = req.cookies?._fbc || '';
//     if (!fbc && req.query.fbclid) {
//         fbc = `fb.${Date.now()}.${req.query.fbclid}`; // Construct fbc from fbclid query parameter
//     }

//     //Prepare user data with hashing
//     const user_data = {
//       em: [hashValue(candidate.email)],
//       ph: [hashValue(candidate.mobile)],
//       fn: hashValue(candidate.name?.split(" ")[0]),
//       ln: hashValue(candidate.name?.split(" ")[1] || ""),
//       country: hashValue("India"),
//       client_ip_address: req.ip || '',
//       fbp,
//       fbc
//   };
//     //Prepare custom data, including UTM parameters
//     const custom_data = {
//       currency: "INR",
//       value: course.registrationCharges || 0,
//       content_ids: [courseId],
//       content_type: "course",
//       num_items: 1,
//       order_id: appliedData._id.toString(),
//       ...utm_params // Add UTM parameters to custom_data
//   };
//     console.log(user_data, custom_data)

//     // Send event to Facebook
//     await sendEventToFacebook("Course Apply", user_data, custom_data);



//     if (!apply) {
//       req.flash("error", "Already failed");
//       return res.status(400).send({ status: false, msg: "Applied Failed!" });
//     }
//   }


//   res.status(200).send({ status: true, msg: "Success" });
// });


/* List of applied course */

router.get("/appliedCourses", [isCandidate], async (req, res) => {
  try {
    // console.log("API hitting");
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;

    // Validate token and get mobile
    const validation = { mobile: req.user.mobile };
    const { value, error } = CandidateValidators.userMobile(validation);

    if (error) {
      console.log(error);
      return res.send({ status: "failure", error: "Something went wrong!" });
    }

    // Find candidate
    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate || !candidate?.appliedCourses?.length) {
      return res.json({
        courses: [],
        totalPages: 0,
        page
      });
    }

    // Get paginated applied course entries
    const courses = await AppliedCourses.find({ _candidate: candidate._id })
      .populate({ path: '_course', populate: { path: 'sectors' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const count = await AppliedCourses.countDocuments({ _candidate: candidate._id });

    const totalPages = Math.ceil(count / perPage);

    console.log('courses', courses)

    return res.json({
      courses,
      totalPages,
      page
    });

  } catch (err) {
    console.log("Caught error:", err);
    return res.status(500).json({ status: "failure", message: "Internal Server Error" });
  }
});


// router.get("/appliedCourses", [isCandidate], async (req, res) => {
//   try {
//     console.log("api hitting")
//   const p = parseInt(req.query.page);
//   const page = p || 1;
//   const perPage = 10;
//   let validation = { mobile: req.user.mobile }
//   let { value, error } = CandidateValidators.userMobile(validation)
//   if (error) {
//     console.log(error)
//     return res.send({ status: "failure", error: "Something went wrong!", error });
//   }
//   let candidate = await Candidate.findOne({
//     mobile: value.mobile,
//     isDeleted: false, status: true
//   })
//   let courses = [];
//   let count = 0;
//   if (candidate?.appliedCourses?.length > 0) {
//     courses = await AppliedCourses.find({
//       _candidate: candidate._id
//     }).populate({ path: '_course', populate: { path: 'sectors' } });

//     console.log('=================>  ', courses)
//     count = await Courses.countDocuments({
//       _id: {
//         $in: candidate.appliedCourses
//       },
//       isDeleted: false,
//       status: true
//     });
//     console.log(courses, "appplid coursessss loisttt")
//   }
//   console.log('courses',courses)
//   const totalPages = Math.ceil(count / perPage);
//   return res.json({
//     courses,
//     totalPages,
//     page
//   });
// } catch (err) {
//   console.log("caught error ", err);
// }
// });

router.get("/dashboard", isCandidate, async (req, res) => {
  try {
    const menu = "dashboard";

    const appliedJobs = [
      {
        path: "appliedJobs",
        select: ["_industry city state _company"],
        options: { limit: 4, sort: { createdAt: -1 } },
        populate: [
          { path: "_industry", select: ["name"] },
          { path: "city", select: ["name"] },
          { path: "state", select: ["name"] },
          { path: "_company", select: ["name"] },
        ],
      },
    ];
    // console.log("candidate verifying")

    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    const candidate = await Candidate.findOne(
      { mobile: value.mobile },
      [
        "name",
        "mobile",
        "email",
        "sex",
        "whatsapp",
        "address",
        "state",
        "city",
        "pincode",
        "image",
        "resume",
        "highestQualification",
        "yearOfPassing",
        "qualifications",
        "appliedJobs",
        "isExperienced",
        "experiences",
        "techSkills",
        "nonTechSkills",
        "locationPreferences",
        "availableCredit",
        "creditLeft"
      ]
    ).populate(appliedJobs);

    if (!candidate || candidate === null)
      throw req.ykError("candidate not found");

    const hiringStatus = await HiringStatus.find({ candidate: candidate._id, isDeleted: false }, 'status company updatedAt').sort({ updatedAt: -1 }).limit(4)
      .populate(
        [
          {
            path: "company", select: ["_industry", "cityId", "name"],
            populate: [{ path: "_industry", select: "name" }]
          }]
      )
    const shortlistedCount = await HiringStatus.countDocuments({ candidate: candidate._id, isDeleted: false, status: { '$ne': 'rejected' } })
    const jobsCount = await Vacancy.countDocuments({ status: false })

    let totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: new mongoose.Types.ObjectId(candidate._id) } },
      { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
    ]);
    let cityArray = []
    hiringStatus.forEach(status => {
      cityArray.push(status.company?.cityId)
    })

    const cities = await City.find({ _id: { $in: cityArray } }).select("name");

    const profile = {
      profiledetails:
        candidate.name &&
        candidate.mobile &&
        candidate.sex &&
        candidate.whatsapp &&
        candidate.state &&
        candidate.city,
      qualification: candidate.highestQualification,
      experience: candidate.isExperienced != null,
      skills:
        candidate.techSkills.length > 0 && candidate.nonTechSkills.length > 0,
      location:
        candidate.locationPreferences &&
        candidate.locationPreferences.length > 0,
    };

    res.render(`${req.vPath}/app/candidate/dashboard`, {
      menu,
      profile,
      candidate,
      hiringStatus,
      cities,
      shortlistedCount,
      jobsCount,
      totalCashback
    });
  } catch (err) {
    console.log("caught error ", err);
  }
});
router.get("/pendingFee", isCandidate, async (req, res) => {
  try {
    const menu = "pendingFee";

    res.render(`${req.vPath}/app/candidate/pendingFee`, {
      menu,
    });
  } catch (err) {
    console.log("caught error ", err);
  }
});
router.get("/learn", isCandidate, async (req, res) => {
  try {
    const menu = "learn";

    res.render(`${req.vPath}/app/candidate/learn`, {
      menu,
    });
  } catch (err) {
    console.log("caught error ", err);
  }
});
router
  .route("/myprofile")
  .get(isCandidate, async (req, res) => {
    try {

      console.log(req.user)

      let validation = { mobile: req.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }
      const candidate = await Candidate.findOne({
        mobile: value.mobile,
      }).populate([
        { path: "experiences.Company_State", select: ["name", "stateId"] },
        {
          path: "experiences.Company_City",
          select: ["name", "stateId", "cityId"],
        },
        { path: "experiences.Industry_Name", select: ["name"] },
        { path: "experiences.SubIndustry_Name", select: ["name"] },
        { path: "state", select: ["name", "stateId"] },
        { path: "locationPreferences.state", select: ["name", "stateId"] },
        {
          path: "locationPreferences.city",
          select: ["name", "stateId", "cityId"],
        },
      ]);
      const isProfileCompleted = candidate.isProfileCompleted;
      const isVideoCompleted = candidate.profilevideo
      const cashback = await CashBackLogic.findOne({})
      if (!candidate || candidate === null)
        throw req.ykError("candidate not found");
      const state = await State.find({
        countryId: "101",
        status: { $ne: false },
      });
      let totalCashback = await CandidateCashBack.aggregate([
        { $match: { candidateId: new mongoose.Types.ObjectId(candidate._id) } },
        { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
      ]);
      let city = [];
      let statefilter = { status: { $ne: false } };
      if (candidate.state) {
        statefilter["stateId"] = candidate.state?.stateId;
        city = await City.find(statefilter);
      }
      let stateIds = state.map((s) => s.stateId);
      const allcities = await City.find({
        status: { $ne: false },
        stateId: { $in: stateIds },
      });
      const Qualifications = await Qualification.find({ status: true }).sort({
        basic: -1,
      });
      const subQualification = await SubQualification.find({ status: true });
      const industry = await Industry.find({ status: true });
      const subIndustry = await SubIndustry.find({ status: true });
      const Universities = await University.find({ status: true });
      const techinalSkill = await Skill.find({
        type: "technical",
        status: true,
      });
      const nonTechnicalSkill = await Skill.find({
        type: "non technical",
        status: true,
      });
      return res.json({
        status: true,
        candidate,
        state,
        city,
        cashback,
        Qualifications,
        subQualification,
        industry,
        subIndustry,
        Universities,
        techinalSkill,
        nonTechnicalSkill,
        allcities,
        isVideoCompleted: isVideoCompleted,
        isProfileCompleted: isProfileCompleted,
        totalCashback
      });
    } catch (err) {
      console.log("Err-============>", err)
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("/candidate/login");
    }
  })
  .post(isCandidate, async (req, res) => {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);
    if (error) {
      return res.status(400).json({ status: "failure", message: "Validation failed", error });
    }

    let {
      personalInfo,
      qualifications,
      experiences,
      highestQualification,
      isExperienced,
      yearOfPassing,
      technicalskills,
      nontechnicalskills,
      locationPreferences,
      sex,
      dob
    } = req.body;

    const updatedFields = {
      isProfileCompleted: true,
      

      isExperienced,
      yearOfPassing
    };
    
    if (highestQualification) {
      // If it's an empty string, set it to null
      if (highestQualification === "") {
          highestQualification = null;
      }
      // If it's a valid ObjectId string, convert it to ObjectId
      else if (typeof highestQualification === 'string' && mongoose.Types.ObjectId.isValid(highestQualification)) {
          highestQualification =new mongoose.Types.ObjectId(highestQualification);
      } else {
          highestQualification = null; // Invalid value, set to null
      }

      // Only add to updatedFields if it's valid (not null)
      if (highestQualification) {
          updatedFields.highestQualification = highestQualification;
      }
  }


    // ✅ Add root-level fields
    if (sex) updatedFields.sex = sex;
    if (dob) updatedFields.dob = dob;

    const user = await Candidate.findOne({ mobile: value.mobile });

    // ✅ Handle personalInfo
    if (personalInfo && typeof personalInfo === 'object') {
      Object.entries(personalInfo).forEach(([key, val]) => {
        if (val !== "") {
          if (key !== "location") {
            updatedFields[`personalInfo.${key}`] = val;
          }
        }
      });

      // ✅ Handle Geo Location
      if (personalInfo.latitude && personalInfo.longitude) {
        updatedFields["personalInfo.location"] = {
          type: "Point",
          coordinates: [
            parseFloat(personalInfo.longitude || 0),
            parseFloat(personalInfo.latitude || 0)
          ],
          fullAddress: personalInfo.fullAddress || "",
          state: personalInfo.state || "",
          city: personalInfo.city || ""
        };
      }
    }

    // ✅ Qualifications with location
    if (Array.isArray(qualifications)) {
      qualifications.forEach((q) => {
        if (q.collegeLatitude && q.collegeLongitude) {
          q.location = {
            type: 'Point',
            coordinates: [parseFloat(q.collegeLongitude), parseFloat(q.collegeLatitude)],
            city: q.city || "",
            state: q.state || "",
            fullAddress: q.fullAddress || ""
          };
        }
      });
      updatedFields.qualifications = qualifications;
    }



    // ✅ Technical Skills
    if (technicalskills?.length) {
      const techSkills = await getTechSkills(technicalskills);
      updatedFields.techSkills = techSkills;
    }

    // ✅ Non-Technical Skills
    if (nontechnicalskills?.length) {
      const nonTechSkills = await getNonTechSkills(nontechnicalskills);
      updatedFields.nonTechSkills = nonTechSkills;
    }

    // ✅ Location Preferences
    if (locationPreferences?.length) {
      updatedFields.locationPreferences = locationPreferences;
    }
    // ✅ Handle Voice Introduction
    if (personalInfo?.voiceIntro) {
      updatedFields["personalInfo.voiceIntro"] = Array.isArray(personalInfo.voiceIntro)
        ? personalInfo.voiceIntro
        : [personalInfo.voiceIntro];
      // console.log("📥 Voice Intro Received from Frontend:", personalInfo.voiceIntro);
    }


    // ✅ Referral Cashback logic
    if (user?.referredBy && user.isProfileCompleted === false) {
      const cashback = await CashBackLogic.findOne().select("Referral");
      const referral = await Referral.findOneAndUpdate(
        { referredBy: user.referredBy, referredTo: user._id },
        {
          status: referalStatus.Active,
          earning: cashback?.Referral || 0,
          new: true
        }
      );
      await checkCandidateCashBack({ _id: user.referredBy });
      await candidateReferalCashBack(referral);
    }

    // ✅ Update Candidate
    const updatedCandidate = await Candidate.findByIdAndUpdate(user._id, updatedFields, { new: true });

    // ✅ Update in User model also
    const userInfo = {};
    if (personalInfo?.name) userInfo.name = personalInfo.name;
    if (personalInfo?.email) userInfo.email = personalInfo.email;
    await User.findOneAndUpdate({ mobile: user.mobile, role: 3 }, userInfo);

    // ✅ ExtraEdge CRM push
    if (!user.isProfileCompleted && process.env.NODE_ENV === 'production') {
      try {
        const crmPayload = {
          Source: "mipie",
          FirstName: user.name,
          MobileNumber: user.mobile,
          LeadSource: "Website",
          LeadType: "Online",
          LeadName: "app",
          Course: "Mipie general",
          Center: "Padget",
          Location: "Technician",
          Country: "India",
          LeadStatus: "Profile Completed",
          ReasonCode: "27",
          AuthToken: extraEdgeAuthToken
        };

        await axios.post(extraEdgeUrl, JSON.stringify(crmPayload), {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } catch (err) {
        console.error("ExtraEdge API error", err);
      }
    }

    // ✅ Cashback tracking
    await checkCandidateCashBack(updatedCandidate);
    await candidateProfileCashBack(updatedCandidate);
    await candidateVideoCashBack(updatedCandidate);

    // ✅ Calculate Total Cashback
    const totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: new mongoose.Types.ObjectId(user._id) } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);

    // ✅ Final response
    res.status(200).json({
      status: true,
      message: "Profile Updated Successfully",
      isVideoCompleted: personalInfo?.profilevideo || "",
      isProfileCompleted: updatedCandidate.isProfileCompleted,
      totalCashback: totalCashback?.[0]?.totalAmount || 0
    });
  });


router.post("/removelogo", isCandidate, async (req, res) => {
  let validation = { mobile: req.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  const candidate = await Candidate.findOne({
    mobile: value.mobile,
  });
  if (!candidate) throw req.ykError("candidate doesn't exist!");

  const candidateUpdate = await Candidate.findOneAndUpdate(
    { mobile: value.mobile },
    { image: "" }
  );
  if (!candidateUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "candidate updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});
router.post("/removeKYCImage", isCandidate, async (req, res) => {
  const { type } = req.body
  let validation = { mobile: req.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  console.log(type)
  const candidate = await Candidate.findOne({
    mobile: value.mobile,
  });
  if (!candidate) throw req.ykError("candidate doesn't exist!");
  let kycAadharUpdate, kycPanUpdate
  if (type === 'aadhar') {
    kycAadharUpdate = await kycDocument.findOneAndUpdate(
      { _candidate: candidate._id },
      { aadharCardImage: '' }
    );
  }
  if (type === 'pan') {
    kycPanUpdate = await kycDocument.findOneAndUpdate(
      { _candidate: candidate._id },
      { panCardImage: '' }
    );

  }
  console.log(kycPanUpdate, kycAadharUpdate)
  res.send({ status: true, message: 'File deleted successfully' })
})

router.get("/getcities", async (req, res) => {
  const { stateId } = req.query;
  const cityValues = await City.find({ stateId, status: true });
  res.status(200).send({ cityValues });
});

router.get("/getcitiesbyId", async (req, res) => {
  const { stateId } = req.query;
  const state = await State.findOne({ _id: stateId });

  const cityValues = await City.find({
    stateId: state.stateId,
    status: { $ne: false },
  });
  res.status(200).send({ cityValues });
});

router.get("/getSubQualification", async (req, res) => {
  const { qualificationId } = req.query;
  const subQualification = await SubQualification.find({
    status: true,
    _qualification: qualificationId,
  });
  if (!subQualification) {
    res
      .status(200)
      .send({ status: false, message: "No Subqualifications present" });
  }
  res.status(200).send({ status: true, subQualification });
});

async function getUploadedURL() {
  let regionName = region;
  let bucket = bucketName;
  let accessKey = accessKeyId;
  let secretKey = secretAccessKey;
  const s = new AWS.S3({
    regionName,
    accessKey,
    secretKey,
    signatureVersion: "v4",
  });
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex");
  const params = {
    Bucket: bucket,
    Key: imageName,
    Expires: 60,
  };
  const uploadURL = await s.getSignedUrlPromise("putObject", params);
  return uploadURL;
}
router.post("/job/:jobId/apply", [isCandidate, authenti], async (req, res) => {
  let jobId = req.params.jobId;
  console.log('jobId', jobId)
  let validation = { mobile: req.user.mobile }
  let { value, error } = CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  let candidateMobile = value.mobile;
  let vacancy = await Vacancy.findOne({ _id: jobId });
  if (!vacancy) {
    return res.send({ status: false, msg: "Vacancy not Found!" });
  }
  let candidate = await Candidate.findOne({ mobile: candidateMobile })


  if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
    // console.log("Already Applied")
    req.flash("error", "Already Applied");
    return res.send({ status: false, msg: "Already Applied" });
  } else {
    // console.log("Checking Applied")
    let alreadyApplied = await AppliedJobs.findOne({
      _candidate: candidate._id,
      _job: vacancy._id,
    });
    // console.log("alreadyApplied checking", alreadyApplied)
    if (alreadyApplied) {
      req.flash("error", "Already Applied");
      return res.send({ status: false, msg: "Already Applied" });
    };
    // console.log("Appling job")
    if (typeof jobId === 'string' && mongoose.Types.ObjectId.isValid(jobId)) {
      console.log('converting id')
      jobId = new mongoose.Types.ObjectId(jobId);
    }
    let apply = await Candidate.findOneAndUpdate(
      { mobile: candidateMobile },
      {
        $addToSet: {
          appliedJobs: { jobId }

        },
        // $inc: { creditLeft: -coinsDeducted },
      },
      { new: true, upsert: true }
    );
    let data = {};
    data["_job"] = jobId;
    data["_candidate"] = candidate._id;
    data["_company"] = vacancy._company;
    // data["coinsDeducted"] = coinsDeducted
   
    const appliedData = await AppliedJobs.create(data);

    // let sheetData = [candidate?.name, candidate?.mobile, candidate?.email, candidate?.sex, candidate?.dob ? moment(candidate?.dob).format('DD MMM YYYY') : '', candidate?.state?.name, candidate.city?.name, 'Job', `${process.env.BASE_URL}/jobdetailsmore/${jobId}`, "", "", moment(appliedData?.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm')]


    // Capitalize every word's first letter
    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    // Update Spreadsheet
    const sheetData = [
      moment(appliedData.createdAt).utcOffset('+05:30').format('DD MMM YYYY'),
      moment(appliedData.createdAt).utcOffset('+05:30').format('hh:mm A'),
      capitalizeWords(vacancy?.title), // Apply the capitalizeWords function
      candidate?.name,
      candidate?.mobile,
      candidate?.email,
      candidate?.sex === 'Male' ? 'M' : candidate?.sex === 'Female' ? 'F' : '',
      candidate?.dob ? moment(candidate.dob).format('DD MMM YYYY') : '',
      candidate?.state?.name,
      candidate?.city?.name,
      'Job',
      `${process.env.BASE_URL}/jobdetailsmore/${jobId}`,
      "",
      ""


    ];
    await updateSpreadSheetValues(sheetData);


    // Extract UTM Parameters
    const sanitizeInput = (value) => typeof value === 'string' ? value.replace(/[^a-zA-Z0-9-_]/g, '') : value;

    if (!apply) {
      req.flash("error", "Already failed");
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
    console.log('=== JOB APPLICATION EMAIL PROCESS START ===');
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
});
router.get("/appliedJobs", [isCandidate], async (req, res) => {
  try {

    console.log('applied jobs')
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;

    // Validate candidate from token
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);
    if (error) {
      console.log(error);
      return res.send({ status: "failure", error: "Something went wrong!" });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.render(`${req.vPath}/app/candidate/appliedJobs`, {
        menu: "appliedJobs",
        jobs: [],
        totalPages: 0,
        page
      });
    }

    const agg = [
      { $match: { _candidate: candidate._id } },
      {
        $lookup: {
          from: "companies",
          localField: "_company",
          foreignField: "_id",
          as: "_company"
        }
      },
      { $unwind: "$_company" },
      {
        $match: {
          "_company.isDeleted": false,
          "_company.status": true
        }
      },
      {
        $lookup: {
          from: "vacancies",
          localField: "_job",
          foreignField: "_id",
          as: "vacancy"
        }
      },
      { $unwind: "$vacancy" },
      {
        $match: {
          "vacancy.status": true,
          "vacancy.validity": { $gte: new Date() }
        }
      },
      {
        $lookup: {
          from: "qualifications",
          localField: "vacancy._qualification",
          foreignField: "_id",
          as: "qualifications"
        }
      },
      {
        $lookup: {
          from: "industries",
          localField: "vacancy._industry",
          foreignField: "_id",
          as: "industry"
        }
      },
      {
        $lookup: {
          from: "cities",
          localField: "vacancy.city",
          foreignField: "_id",
          as: "city"
        }
      },
      {
        $lookup: {
          from: "states",
          localField: "vacancy.state",
          foreignField: "_id",
          as: "state"
        }
      },
      {
        $sort: {
          "vacancy.sequence": 1,
          "vacancy.createdAt": -1
        }
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: (page - 1) * perPage },
            { $limit: perPage }
          ]
        }
      }
    ];

    const appliedJobs = await AppliedJobs.aggregate(agg);
    const count = appliedJobs[0].metadata[0]?.total || 0;
    const jobs = appliedJobs[0].data || [];
    const totalPages = Math.ceil(count / perPage);

    return res.json({
      jobs,
      totalPages,
      page
    });

  } catch (err) {
    console.error("Error in /appliedJobs:", err);
    return res.render(`${req.vPath}/app/candidate/appliedJobs`, {
      menu: "appliedJobs",
      jobs: [],
      totalPages: 0,
      page: 1
    });
  }
});

//register for interview 
// router.post("/job/:jobId/registerInterviews", [isCandidate], async (req, res) => {
//   let jobId = req.params.jobId;
//   let validation = { mobile: req.session.user.mobile }
//   let { value, error } = await CandidateValidators.userMobile(validation)
//   if (error) {
//     console.log(error)
//     return res.send({ status: "failure", error: "Something went wrong!", error });
//   }
//   let candidateMobile = value.mobile;
//   let vacancy = await Vacancy.findOne({ _id: jobId });
//   if (!vacancy) {
//     return res.send({ status: false, msg: "Vacancy not Found!" });
//   }
//   let candidate = await Candidate.findOne({ mobile: candidateMobile });
//   let coins = await CoinsAlgo.findOne({});
//   let coinsDeducted
//   coinsDeducted = vacancy.applyReduction > 0 ? vacancy.applyReduction : coins.job
//   if (!candidate.creditLeft || candidate.creditLeft < coinsDeducted) {
//     req.flash("error", "You don't have sufficient coins to register for interview!");
//     return res
//       .status(200)
//       .send({ status: false, msg: "Please Subscribe to Apply Now!" });
//   } /* else if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
//     req.flash("error", "Already registered for the interview");
//     return res.send({ status: false, msg: "Already registered for the interview" });
//   } */ else {
//     let alreadyApplied = await AppliedJobs.findOne({
//       _candidate: candidate._id,
//       _job: jobId,
//       isRegisterInterview: true
//     });
//     if (alreadyApplied) {
//       req.flash("error", "Already Applied");
//       return res.send({ status: false, msg: "Already Applied" });
//     };
//     await AppliedJobs.findOneAndUpdate({
//       '_candidate': candidate._id,
//       _job: jobId
//     }, {
//       $set: {
//         isRegisterInterview: true
//       }
//     });
//     let apply = await Candidate.findOneAndUpdate(
//       { mobile: candidateMobile },
//       {
//         $addToSet: { appliedJobs: jobId, },
//         $inc: { creditLeft: -coinsDeducted },
//       },
//       { new: true, upsert: true }
//     );
//     if (!apply) {
//       req.flash("error", "Already failed");
//       return res.status(400).send({ status: false, msg: "Applied Failed!" });
//     }
//     let companyDetails = await Company.findOne({ _id: vacancy._company })
//     let notificationData = {
//       title: 'Applied Jobs',
//       message: `You have register for interview in ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} Keep register for interview to get a dream Job.__बधाई हो! आपने ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} में साक्षात्कार के लिए पंजीकृत किया है |`,
//       _candidate: candidate._id,
//       source: 'System'
//     }
//     await sendNotification(notificationData);
//     let newData = {
//       title: 'New Register',
//       message: `${candidate.name} has recently registered for your interview for ${vacancy.title}`,
//       _company: vacancy._company
//       , source: 'System'
//     }
//     await sendNotification(newData)
//     await checkCandidateCashBack(candidate)
//     await candidateApplyCashBack(candidate)
//   }
//   res.status(200).send({ status: true, msg: "Success" });
// });

// router.post("/job/:jobId/registerInterviews", [isCandidate], async (req, res) => {
router.post("/job/:jobId/registerInterviews", [isCandidate], async (req, res) => {
  let jobId = req.params.jobId;

  if (typeof jobId === 'string' && mongoose.Types.ObjectId.isValid(jobId)) {
    console.log('converting id')
    jobId = new mongoose.Types.ObjectId(jobId);
  }
  let validation = { mobile: req.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  let candidateMobile = value.mobile;
  let vacancy = await Vacancy.findOne({ _id: jobId });
  if (!vacancy) {
    return res.send({ status: false, msg: "Vacancy not Found!" });
  }
  let candidate = await Candidate.findOne({ mobile: candidateMobile });
  let coins = await CoinsAlgo.findOne({});
  let coinsDeducted
  coinsDeducted = vacancy.applyReduction > 0 ? vacancy.applyReduction : coins.job
  if (!candidate.creditLeft || candidate.creditLeft < coinsDeducted) {
    req.flash("error", "You don't have sufficient coins to register for interview!");
    return res
      .status(200)
      .send({ status: false, msg: "Please Subscribe to Apply Now!" });
  } /* else if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
    req.flash("error", "Already registered for the interview");
    return res.send({ status: false, msg: "Already registered for the interview" });
  } */ else {
    let alreadyApplied = await AppliedJobs.findOne({
      _candidate: candidate._id,
      _job: jobId,
      isRegisterInterview: true
    });
    if (alreadyApplied) {
      req.flash("error", "Already Applied");
      return res.send({ status: false, msg: "Already Applied" });
    };
    await AppliedJobs.findOneAndUpdate({
      '_candidate': candidate._id,
      _job: jobId
    }, {
      $set: {
        isRegisterInterview: true
      }
    });
    let apply = await Candidate.findOneAndUpdate(
      { mobile: candidateMobile },
      {
        $addToSet: { appliedJobs: jobId, },
        $inc: { creditLeft: -coinsDeducted },
      },
      { new: true, upsert: true }
    );
    if (!apply) {
      req.flash("error", "Already failed");
      return res.status(400).send({ status: false, msg: "Applied Failed!" });
    }
    let companyDetails = await Company.findOne({ _id: vacancy._company })
    let notificationData = {
      title: 'Applied Jobs',
      message: `You have register for interview in ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} Keep register for interview to get a dream Job.__बधाई हो! आपने ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} में साक्षात्कार के लिए पंजीकृत किया है |`,
      _candidate: candidate._id,
      source: 'System'
    }
    await sendNotification(notificationData);
    let newData = {
      title: 'New Register',
      message: `${candidate.name} has recently registered for your interview for ${vacancy.title}`,
      _company: vacancy._company
      , source: 'System'
    }
    await sendNotification(newData)
    await checkCandidateCashBack(candidate)
    await candidateApplyCashBack(candidate)
  }
  res.status(200).send({ status: true, msg: "Success",coinsDeducted });
});

//list of register for interview
router.get("/registerInterviewsList", [isCandidate], async (req, res) => {
  try {
    console.log('api hitting')
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    let candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    })
    const agg = [
      {
        '$match': {
          '_candidate': candidate._id,
          isRegisterInterview: true
        }
      },
      {
        '$lookup': {
          from: 'companies',
          localField: '_company',
          foreignField: '_id',
          as: '_company'
        }
      },
      {
        '$match': {
          '_company.0.isDeleted': false,
          '_company.0.status': true
        }
      },
      {
        '$lookup': {
          from: 'vacancies',
          localField: '_job',
          foreignField: '_id',
          as: 'vacancy'
        }
      },
      {
        '$match': {
          'vacancy.0.status': true,
          'vacancy.0.validity': { $gte: new Date() }
        }
      },
      {
        '$lookup': {
          from: 'qualifications',
          localField: 'vacancy.0._qualification',
          foreignField: '_id',
          as: 'qualifications'
        }
      },
      {
        '$lookup': {
          from: 'industries',
          localField: 'vacancy.0._industry',
          foreignField: '_id',
          as: 'industry'
        }
      },
      {
        '$lookup': {
          from: 'cities',
          localField: 'vacancy.0.city',
          foreignField: '_id',
          as: 'city'
        }
      },
      {
        '$lookup': {
          from: 'states',
          localField: 'vacancy.0.state',
          foreignField: '_id',
          as: 'state'
        }
      },
      {
        '$sort': {
          'sequence': 1,
          'createdAt': -1
        }
      },
      {
        '$facet': {
          metadata: [{ '$count': "total" }],
          data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
        }
      }
    ]
    // console.log("Aggregation pipeline:", JSON.stringify(agg, null, 2));

    const appliedJobs = await AppliedJobs.aggregate(agg);
    if (!appliedJobs || !appliedJobs.length || !appliedJobs[0].data) {
      return res.status(404).json({ status: "failure", error: "No jobs found" });
    }

    const { data, metadata } = appliedJobs[0];
    const count = metadata[0]?.total || 0;
    const totalPages = Math.ceil(count / perPage);

    res.json({
      jobs: data,
      totalPages,
      page: p
    });
    

    // res.render(`${req.vPath}/app/candidate/registerInterviews`, {
    //   menu: "registerInterviews",
    //   jobs: data,
    //   totalPages,
    //   page: p
    // });

  } catch (error) {
    console.error("Error fetching register interviews list:", error);
    res.status(500).json({ status: "failure", error: "Something went wrong!" });
  }

  //   console.log(appliedJobs, "check register list agg data")
  //   const data = appliedJobs[0].data; // Accessing the data property of the first element
  // console.log(data);
  //   let count = appliedJobs[0].metadata[0]?.total
  //   if(!count){
  //     count = 0
  //   }
  //   let jobs=appliedJobs[0].data
  //   const totalPages = Math.ceil(count / perPage);
  //   res.render(`${req.vPath}/app/candidate/registerInterviews`, {
  //     menu: "registerInterviews",
  //     jobs,
  //     totalPages,
  //     page
  //   });


});

router.post("/removeResume", isCandidate, async (req, res) => {
  let validation = { mobile: req.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  const candidate = await Candidate.findOne({
    mobile: value.mobile,
  });
  if (!candidate) throw req.ykError("Candidate Doesn't Exist!");
  const candidateUpdate = await Candidate.findOneAndUpdate(
    { mobile: value.mobile },
    { resume: "" }
  );
  if (!candidateUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "candidate updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});

router.post("/removeVideo", [isCandidate, authenti], async (req, res) => {
  let validation = { mobile: req.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  const candidateUpdate = await Candidate.findOneAndUpdate(
    { mobile: value.mobile },
    { profilevideo: "" }
  );
  if (!candidateUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "candidate updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});

router.get("/getCreditCount", [isCandidate, authenti], async (req, res) => {
  try {
    let validation = { mobile: req.user.mobile }
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

router.get("/getCoinOffers", [isCandidate, authenti], async (req, res) => {
  try {
    let offers = await coinsOffers
      .find({
        forCandidate: true,
        status: true,
        isDeleted: false,
        activeTill: { $gte: moment().startOf("day") },
      })
      .select("displayOffer payAmount")
      .sort({ payAmount: -1 })
      .limit(3);
    res.status(200).send(offers);
  } catch (err) {
    console.log("her comes Error =============> ", err);
  }
});
router.post("/updateprofilestatus", [isCandidate], async (req, res) => {
  try {
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const { status } = req.body;
    let candidateUpdate = await Candidate.findOneAndUpdate({ mobile: value.mobile }, { visibility: status });
    if (!candidateUpdate) {
      return res.send({ status: false, message: "Unable to update status" })
    }
    return res.send({ status: true, message: 'Status updated successfully' })
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", message: "Unable to update status" });
  }
})
router.post("/payment", [isCandidate, authenti], async (req, res) => {
  let { offerId, amount } = req.body;
  console.log(offerId, "candidate's offerId for the coins")

  if (!offerId || !amount) {
    return res.status(400).send({ status: false, msg: 'Incorrect Data.' })
  }

  let validation = { mobile: req.user.mobile }
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

  instance.orders.create(options, async function (err, order) {
    if (err) {
      console.log('Error>>>>>>>>>>>>>>>>', err)
      return res.send({ message: err.description })
    }
    console.log(order, '<<<<<<<<<<<<<<<< order details')
    res.send({ order: order, candidate: candidate });
  });
});

router.post("/coursepayment", [isCandidate, authenti], async (req, res) => {
  let { courseId } = req.body;

  if (!courseId) {
    return res.status(400).send({ status: false, msg: 'Incorrect Data.' })
  }

  let validation = { mobile: req.user.mobile }
  let { value, error } = CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  let course = await Courses.findById(courseId).lean();

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
  };
  console.log(options.notes, 'notes to be saved in the razorpay details')
  console.log(options, 'options to be saved in the razorpay details')

  instance.orders.create(options, async function (err, order) {
    if (err) {
      console.log('Error>>>>>>>>>>>>>>>>', err)
      return res.send({ message: err.description })
    }
    console.log(order, '<<<<<<<<<<<<<<<< order details')
    res.send({ order: order, candidate: candidate });
  });
});

router.post("/paymentStatus", [isCandidate, authenti], async (req, res) => {
  let { paymentId, _candidate, _offer, orderId, amount, voucher } = req.body;
  console.log(_offer, '<<<<<<<< offerId in the payment status')
  let offerDetails = await coinsOffers.findOne({ _id: _offer });
  console.log(offerDetails, '<<<<<<<<<<<<<<<<< offerDetails')

  let validation = { mobile: req.user.mobile }
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

router.post("/coursepaymentStatus", [isCandidate, authenti], async (req, res) => {
  let { paymentId, orderId, amount, courseId, _candidate } = req.body;
  console.log(courseId, _candidate, '<<<<<<<< courseId in the payment status')
  let courseDetails = await AppliedCourses.findOne({ _candidate, _course: courseId });
  console.log(courseDetails, '<<<<<<<<<<<<<<<<< courseDetails')
  let course = await Courses.findById(courseId).lean();
  let validation = { mobile: req.user.mobile }
  let { value, error } = CandidateValidators.userMobile(validation)
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
    amount: course.registrationCharges,
    coins: 0,
    _candidate,
    _course: courseId
  };

  let alreadyAllocated = await PaymentDetails.findOne({ $and: [{ $or: [{ paymentId }, { orderId }] }, { _candidate }] })
  if (alreadyAllocated) {
    console.log('=========== In alreadyAllocated ', alreadyAllocated)
    return res.status(400).send({ status: false, msg: 'Already Allocated!' })
  }
  // console.log('coins allocation start', addPayment)

  // let voucherId = await Vouchers.findOne({ code: voucher, status: true, isDeleted: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } }).select("_id")

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
          {
            registrationFee: 'Paid'
          }
        );

        res.send({ status: true, msg: "Success" });
      } else {
        res.send({ status: false, msg: "Failed" });
      }
    });
});

router.get("/Coins", [isCandidate], async (req, res) => {
  const p = parseInt(req.query.page);
  const page = p || 1;
  const perPage = 10;
  let validation = { mobile: req.user.mobile }
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
router.get("/coins", [isCandidate], async (req, res) => {
  
  try {
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;
    
    if (!req.user || !req.user.mobile) {
      console.log("ERROR: No user or mobile in request");
      return res.json({ status: false, error: "User not authenticated", message: "Please login again" });
    }
    
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log("Validation error:", error)
      return res.json({ status: false, error: "Something went wrong!", message: error });
    }

    // console.log("Finding candidate with mobile:", value.mobile);
    let candidate = await Candidate.findOne({
      mobile: value.mobile,
      status: true,
      isDeleted: false,
    }).select("_id creditLeft");
    
    if (!candidate) {
      console.log("ERROR: Candidate not found");
      return res.json({ status: false, error: "Candidate not found" });
    }

    // console.log("Candidate found:", candidate._id);
    
    let populate = {
      path: "_offer",
      select: "displayOffer",
    };
    let count = await PaymentDetails.countDocuments({ _candidate: candidate._id })
    const totalPages = Math.ceil(count / perPage);
    // console.log("Total transactions count:", count, "Total pages:", totalPages);
    
    let latestTransactions = await PaymentDetails.find({
      _candidate: candidate._id,
    })
      .populate(populate)
      .skip(perPage * page - perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    
    // console.log("Latest transactions found:", latestTransactions.length);
    
    let coinOffers = await coinsOffers.find({
      forCandidate: true,
      isDeleted: false,
      status: true,
      activeTill: { $gte: moment().startOf("day") },
    }).sort({ createdAt: -1 });
    
    // console.log("Coin offers found:", coinOffers.length);
    // console.log("Coin offers data:", JSON.stringify(coinOffers, null, 2));

    const responseData = {
      status: true,
      candidate,
      coinOffers,
      latestTransactions,
      totalPages,
      count,
      page,
      perPage
    };
    
    // console.log("Sending response with", coinOffers.length, "coin offers");
    return res.json(responseData);
    
  } catch (error) {
    console.error("=== ERROR in /coins route ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return res.json({ status: false, error: "Internal server error", message: error.message });
  }
});

router.get("/completeProfile", [isCandidate, authenti], async (req, res) => {
  try {
    let highestQualification = await Qualification.find({ status: true });
    let state = await State.find({ status: true, countryId: "101" });
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne(
      { mobile: value.mobile },
      " sex dob address state city location pincode highestQualification isExperienced totalExperience location latitude longitude place mobile whatsapp"
    );
    let city = [];

    if (candidate.state) {
      let st = await State.findOne({ _id: candidate.state }, "stateId");
      city = await City.find({ status: { $ne: false }, stateId: st.stateId });
    }
    dob = moment(candidate.dob).utcOffset("+05:30").format("YYYY-MM-DD");

    res.status(200).send({ highestQualification, state, city, candidate, dob });
  } catch (err) {
    res.status(500).send({ status: false, err });
  }
});
router.get("/getcandidatestatus", [isCandidate], async (req, res) => {
  let validation = { mobile: req.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  const candidate = await Candidate.findOne({ mobile: value.mobile });
  // res.send({ status: true, visibility: candidate.visibility })
  res.json({ status: true, visibility: candidate.visibility })
})
router.get("/nearbyJobs", [isCandidate], async (req, res) => {
  try {
    const allQualification = await Qualification.find({ status: true }).sort({
      basic: -1,
    });
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    const userMobile = value.mobile;
    const candidate = await Candidate.find({ status: true, isDeleted: false, mobile: userMobile });
    if (!candidate.length) {
      req.flash("error", "Your are disabled");
      return res.redirect("back");
    }
    const allIndustry = await Industry.find({ status: true });
    const allStates = await State.find({
      countryId: "101",
      status: { $ne: false },
    });
    let latitude = candidate[0].latitude
    let longitude = candidate[0].longitude
    let skills = await Skill.find({ status: true, type: 'technical' });
    res.render(`${req.vPath}/app/candidate/nearbyJobs`, {
      menu: "nearbyJobs",
      allQualification,
      allIndustry,
      allStates,
      skills,
      candidate,
      latitude,
      longitude
    });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

router.get(
  "/getNearbyJobsForMap",
  [isCandidate, authenti],
  async (req, res) => {
    const userMobile = req.user.mobile;
    const candidate = await Candidate.findOne({ mobile: userMobile });
    if (!candidate.latitude || !candidate.longitude) {
      req.flash("error", "Add Your Current Location!");
      return res.send({ jobs: [], nearest: {}, status: false })
    }
    const lat = Number(candidate.latitude);
    const long = Number(candidate.longitude);
    let {
      qualification,
      experience,
      industry,
      state,
      jobType,
      minSalary,
      techSkills,
      name,
      distance
    } = req.query;
    let filter = { 'status': true, validity: { $gte: new Date() }, verified: true }
    if (qualification) {
      filter['_qualification'] = new mongoose.Types.ObjectId(qualification)
    }
    if (industry) {
      filter['_industry'] = new mongoose.Types.ObjectId(industry)
    }
    if (jobType) {
      filter['jobType'] = jobType
    }
    if (state) {
      filter['state'] = new mongoose.Types.ObjectId(state)
    }
    if (experience) {
      filter['experience'] = { $lte: Number(experience) }
    }
    if (techSkills) {
      filter['_techSkills'] = new mongoose.Types.ObjectId(techSkills);
    }
    if (minSalary) {
      filter["$or"] = [
        { isFixed: true, amount: { $gte: Number(minSalary) } },
        { isFixed: false, min: { $gte: Number(minSalary) } },
      ];
    }
    if (name) {
      filter["$or"] = [
        { 'displayCompanyName': { "$regex": name, "$options": "i" } },
        { 'company.0.name': { "$regex": name, "$options": "i" } }
      ]
    }
    let jobDistance = Infinity
    if (distance && distance != 'all' && distance != '0') {
      jobDistance = Number(distance) * 1000
    }

    let jobs = await Vacancy.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [long, lat] },
          distanceField: "distance",
          maxDistance: jobDistance,
          query: { location: { $exists: true } },
        },
      },
      {
        $match: filter
      },
      {
        $lookup: {
          from: "companies",
          localField: "_company",
          foreignField: "_id",
          as: "_company",
        }
      },
      {
        '$match': {
          '_company.0.isDeleted': false,
          '_company.0.status': true,
          '_id': { "$nin": candidate.appliedJobs }
        }
      },
      {
        $lookup: {
          from: 'states',
          localField: 'state',
          foreignField: '_id',
          as: 'state'
        }
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'city'
        }
      },
      {
        $lookup: {
          from: 'industries',
          localField: '_industry',
          foreignField: '_id',
          as: '_industry'
        }
      },
      {
        $lookup: {
          from: 'qualifications',
          localField: '_qualification',
          foreignField: '_id',
          as: '_qualification'
        }
      }
    ]);
    let nearest = jobs[0]

    if (jobs.length < 1) {
      nearest = {
        location: {
          coordinates: [long, lat]
        }
      }
    }

    res.send({ jobs, nearest });
  }
);

router.get('/backfill/location', [isCandidate], async (req, res) => {
  let candidates = await Candidate.find({ latitude: { $exists: true }, longitude: { $exists: true } })
  let count = 0
  for (candidate of candidates) {
    let upd = await Candidate.findOneAndUpdate({ _id: candidate._id }, {
      location: {
        type: 'Point',
        coordinates: [Number(candidate.longitude), Number(candidate.latitude)]
      }
    }, { new: true })
    count++
    console.log(upd)
  }
  console.log(count)
  res.send({ count: count })
})

router.get("/myEarnings", [isCandidate], async (req, res) => {
  try {
    const perPage = 20;
    const p = parseInt(req.query.page, 10);
    const page = p || 1;
    let canRedeem = false
    let limit = 3
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne({ mobile: value.mobile });
    if (!candidate) {
      req.flash("error", err.message || "Candidate not found!");
      return res.send({ status: false, message: "Candidate not found!" });
    }
    await checkCandidateCashBack(candidate)
    let candidateEarning = await CandidateCashBack.find({ candidateId: candidate._id, eventType: cashbackEventType.credit })
      .sort({ createdAt: -1 }).limit(limit)
    let count = await CandidateCashBack.find({ candidateId: candidate._id }).countDocuments()
    const totalPages = Math.ceil(count / perPage);

    let totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: new mongoose.Types.ObjectId(candidate._id) } },
      { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
    ]);
    let thresholdCashback = await CashBackLogic.findOne({});
    let documents = await KycDocument.findOne({ _candidate: candidate._id })
    if (totalCashback[0]?.totalAmount && totalCashback[0]?.totalAmount >= thresholdCashback.threshold && documents?.kycCompleted == true) {
      canRedeem = true
    }
    let activeRequest = await CashBackRequest.find({ _candidate: candidate._id }).sort({ createdAt: -1 }).limit(limit)
    res.render(`${req.vPath}/app/candidate/myearnings`, {
      menu: "myEarnings", totalCashback: totalCashback ? totalCashback[0]?.totalAmount : 0, documents, upi: candidate.upi,
      canRedeem, threshold: thresholdCashback.threshold, totalPages, page, perPage, count, candidateEarning, activeRequest
    });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

router.post("/requestCashback", [isCandidate], async (req, res) => {
  try {
    let { amount } = req.body
    amount = Number(amount)
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne({ mobile: value.mobile });
    if (!candidate) {
      return res.status(400).send({ status: false, msg: 'User not found!' })
    }
    let kyc = await KycDocument.findOne({ _candidate: candidate._id, kycCompleted: false })
    if (kyc) {
      return res.status(400).send({ status: false, msg: 'KYC not completed!' })
    }
    let cashbackDetails = await CashBackLogic.findOne({});
    if (amount < cashbackDetails.threshold) {
      return res.send({ status: false, msg: 'Not enough money to redeem!' })
    }
    let add = {
      candidateId: candidate._id,
      eventType: cashbackEventType.debit,
      eventName: candidateCashbackEventName.cashbackrequested,
      amount: amount * -1,
      isPending: true,
    };
    let addEntry = await CandidateCashBack.create(add)
    let addRequest = await CashBackRequest.create(
      { _candidate: candidate._id, amount: amount, isAccepted: false, status: cashbackRequestStatus.pending, _cashback: addEntry._id })
    let updatePreviousRecords = await CandidateCashBack.updateMany({ candidateId: candidate._id, eventType: cashbackEventType.credit }, { isPending: false });
    if (!addRequest || !addEntry || !updatePreviousRecords) {
      return res.status(400).send({ status: false, msg: 'Cashback Request failed!' })
    }
    return res.status(201).send({ status: true, msg: 'Cashback Request sent!' })
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

// router.route('/cashback')
//   .get([isCandidate], async (req, res) => {
//     try {
//       let validation = { mobile: req.session.user.mobile }
//       let { value, error } = await CandidateValidators.userMobile(validation)
//       if (error) {
//         console.log(error)
//         return res.send({ status: "failure", error: "Something went wrong!", error });
//       }

//       const candidate = await Candidate.findOne({ mobile: value.mobile }).select("name")
//       if (!candidate) {
//         console.log("Candidate doesn't exists")
//         req.flash("error", "Candidate doesn't exists!");
//       }
//       let thresholdCashback = await CashBackLogic.findOne({});
//       res.render(`${req.vPath}/app/candidate/cashback`, {
//         thresholdCashback, candidate, menu: 'cashback'
//       });
//     }
//     catch (err) {
//       console.log(err);
//       req.flash("error", err.message || "Something went wrong!");
//       return res.status(500).send({ status: false, message: err.message })
//     }
//   })

router.route('/cashback')
  // .get([isCandidate], async (req, res) => {
  .get(async (req, res) => {
    try {
      // let validation = { mobile: req.session.user.mobile }
      // let { value, error } = await CandidateValidators.userMobile(validation)
      // if (error) {
      //   console.log(error)
      //   return res.send({ status: "failure", error: "Something went wrong!", error });
      // }

      // const candidate = await Candidate.findOne({ mobile: value.mobile }).select("name")
      // if (!candidate) {
      //   console.log("Candidate doesn't exists")
      //   req.flash("error", "Candidate doesn't exists!");
      // }
      // let thresholdCashback = await CashBackLogic.findOne({});
      res.json({
        thresholdCashback, candidate, menu: 'cashback'
      });
    }
    catch (err) {
      console.log(err);
      req.flash("error", err.message || "Something went wrong!");
      return res.status(500).send({ status: false, message: err.message })
    }
  })

router.route('/kycDocument')
  .post([isCandidate], async (req, res) => {
    try {
      let validation = { mobile: req.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      let candidate = await Candidate.findOne({ mobile: value.mobile })
      if (!candidate) {
        req.flash("error", "Candidate doesn't exists!");
        return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
      }
      let { aadharCard, aadharCardImage, panCard, panCardImage, upi } = req.body
      let add = {}
      if (aadharCard || aadharCard == '') {
        add['aadharCard'] = aadharCard
      }
      if (aadharCardImage || aadharCardImage == '') {
        add['aadharCardImage'] = aadharCardImage
      }
      if (panCard || panCard == '') {
        add['panCard'] = panCard
      }
      if (panCardImage || panCardImage == '') {
        add['panCardImage'] = panCardImage
      }
      if (upi) {
        let updateUpi = await Candidate.findOneAndUpdate({ _id: candidate._id }, { upi })
        if (!updateUpi) {
          req.flash("error", "UPI Id not updated!");
          return res.status(404).send({ status: false, message: "UPI Id not updated!" })
        }
      }
      let alreadyUploaded = await KycDocument.findOne({ _candidate: candidate._id })
      if (alreadyUploaded && alreadyUploaded.kycCompleted == false) {
        add['kycCompleted'] = false
        add['status'] = ''
        add['comment'] = ''
        let updateDocument = await KycDocument.findOneAndUpdate({ _candidate: candidate._id }, add)
        if (!updateDocument) {
          req.flash("error", "Unable to upload Documents!");
          return res.status(400).send({ status: false, message: "Unable to upload Documents!" })
        }
        req.flash("success", "Documents uploaded Successfully!");
        return res.redirect("back");
      } else if (!alreadyUploaded) {
        add['_candidate'] = candidate._id
        let uploadDocument = await KycDocument.create(add)
        if (!uploadDocument) {
          req.flash("error", "Unable to upload Documents!");
          return res.status(400).send({ status: false, message: "Unable to upload Documents!" })
        }
        req.flash("success", "Documents uploaded Successfully!");
        return res.redirect("back");
      } else {
        req.flash("success", "Documents uploaded Successfully!");
        return res.redirect("back");
      }
    }
    catch (err) {
      console.log(err);
      req.flash("error", err.message || "Something went wrong!");
      return res.status(500).send({ status: false, message: err.message })
    }
  })
router.route('/InterestedCompanies').get([isCandidate], async (req, res) => {
  try {

    const menu = 'InterestedCompanies'
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    }).populate([
      { path: "experiences.Company_State", select: ["name", "stateId"] },
      {
        path: "experiences.Company_City",
        select: ["name", "stateId", "cityId"],
      },
      { path: "experiences.Industry_Name", select: ["name"] },
      { path: "experiences.SubIndustry_Name", select: ["name"] },
      { path: "state", select: ["name", "stateId"] },
      { path: "locationPreferences.state", select: ["name", "stateId"] },
      {
        path: "locationPreferences.city",
        select: ["name", "stateId", "cityId"],
      },
    ]);
    const count = await HiringStatus.find({ candidate: candidate._id, isDeleted: false }).countDocuments()
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;
    const totalPages = Math.ceil(count / perPage);
    const hiringStatus = await HiringStatus.find({ candidate: candidate._id, isDeleted: false }, 'status company updatedAt comment').sort({ updatedAt: -1 })
      .populate(
        [
          {
            path: "company", select: ["_industry", "cityId", "name"],
            populate: [{ path: "_industry", select: "name" }],
          }]
      ).skip(perPage * page - perPage)
      .limit(perPage);
    let cityArray = []
    hiringStatus.forEach(status => {
      cityArray.push(status.company?.cityId)
    })
    const cities = await City.find({ _id: { $in: cityArray } }).select("name");
    return res.status(200).render('app/candidate/InterestedCompanies', { menu, hiringStatus, candidate, cities, page, totalPages, count })
  }
  catch (err) {
    console.log("err", err)
  }
})

router.route('/notifications').get([isCandidate], async (req, res) => {
  try {
    const menu = 'Notifications'
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    })
    if (!candidate) {
      req.flash("error", "Candidate doesn't exists!");
      return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
    }
    const notificationsms = await Notification.find({ _candidate: candidate._id });
    const notificationsUpdate = await Notification.updateMany({ _candidate: candidate._id, isRead: false }, { $set: { isRead: true } })
    return res.status(200).render('app/candidate/Notifications', { menu, notificationsms })
  }
  catch (err) {
    console.log("err", err)
  }
})
router.get("/watchVideos", [isCandidate], async (req, res) => {
  try {
    const videos = await VideoData.find({ status: true })
    res.render(`${req.vPath}/app/candidate/watchVideos.ejs`, { menu: 'videos', videos })
  } catch (err) {

    return res.status(500).send({ status: false, message: err.message })
  }
})
router.get('/notificationCount', [isCandidate, authenti], async (req, res) => {
  try {
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {

      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    })
    if (!candidate) {
      return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
    }
    const notifications = await Notification.countDocuments({ _candidate: candidate._id, isRead: false });
    res.send({ status: true, count: notifications })
  }
  catch (err) {

    return res.status(500).send({ status: false, message: err.message })
  }
})
router.put('/applyVoucher', [isCandidate, authenti], async (req, res) => {
  try {
    let { amount, code, offerId } = req.body;

    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne({ mobile: value.mobile, status: true, isDeleted: false })
    let voucher = await Vouchers.findOne({ code, status: true, isDeleted: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } })
    if (!voucher) {
      return res.send({ status: false, message: `Voucher does not exists` })
    }

    let isUsedVoucher = await VoucherUses.findOne({ _candidate: candidate._id, _voucher: voucher._id, status: true, isDeleted: false })
    if (isUsedVoucher) {
      return res.send({ status: false, message: `Voucher already used` })
    }

    if (voucher.voucherType.toLowerCase() === 'amount')
      amount = amount - voucher.value

    else
      amount = amount - (amount * voucher.value) / 100

    if (amount < 0)
      return res.send({ status: false, message: "Invalid Voucher" })

    if (amount == 0) {
      let offerDetails = await coinsOffers.findOne({ _id: offerId });
      let candidateUpdate = await Candidate.findByIdAndUpdate(
        { _id: candidate._id },
        {
          $inc: {
            availableCredit: offerDetails.getCoins,
            creditLeft: offerDetails.getCoins,
          },
        }
      );
      await PaymentDetails.create({
        paymentId: new mongoose.Types.ObjectId(),
        orderId: new mongoose.Types.ObjectId(),
        amount,
        coins: offerDetails.getCoins,
        _candidate: candidate._id,
        _offer: offerId,
        comments: "free offer availed",
        paymentStatus: 'captured',
      });
      await coinsOffers.findOneAndUpdate(
        { _id: offerId },
        { $inc: { availedCount: 1 } }
      );
      if (voucher._id) {
        const voucherUsed = await VoucherUses.create({ _candidate: candidate._id, _voucher: voucher._id })
        if (!voucherUsed) {
          return res.send({ status: false, message: "Unable to apply Voucher" })
        }
        let updateVoucher = await Vouchers.findOneAndUpdate({ _id: voucher._id, status: true, isDeleted: false }, { $inc: { availedCount: 1 } }, { new: true })
        return res.status(200).send({ status: true, message: 'Voucher Applied', amount })
      }
    }
    res.status(200).send({ status: true, message: 'Voucher Applied', amount })
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/notificationCount', [isCandidate, authenti], async (req, res) => {
  try {
    let validation = { mobile: req.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    })
    if (!candidate) {
      return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
    }
    const notifications = await Notification.countDocuments({ _candidate: candidate._id, isRead: false });
    res.send({ status: true, count: notifications })
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})
router.get('/referral', isCandidate, async (req, res) => {
  try {
    const user = req.session.user
    const { fromDate, toDate, status } = req.query
    let filter = {}
    if (fromDate && toDate) {
      let fdate = moment(fromDate).utcOffset("+05:30").startOf('day').toDate()
      let tdate = moment(toDate).utcOffset("+05:30").endOf('day').toDate()
      filter["createdAt"] = { $gte: fdate, $lte: tdate }
    } else if (fromDate) {
      let fdate = moment(fromDate).utcOffset("+05:30").startOf('day').toDate()
      filter["createdAt"] = { $gte: fdate }
    } else if (toDate) {
      let tdate = moment(toDate).utcOffset("+05:30").endOf('day').toDate()
      filter["createdAt"] = { $lte: tdate }
    }
    if (status) {
      filter["status"] = status
    }
    const candidate = await Candidate.findOne({ mobile: user.mobile, status: true, isDeleted: false })
    if (!candidate) {
      req.flash("error", "Your are disabled");
      return res.redirect("back");
    }
    const cashback = await CashBackLogic.findOne().select("Referral")
    const count = await Referral.countDocuments({ referredBy: candidate._id, ...filter })
    const p = parseInt(req.query.page);
    const page = p || 1;
    let perPage = 10
    const totalPages = Math.ceil(count / perPage);
    const referral = await Referral.find({ referredBy: candidate._id, ...filter })
      .populate([{ path: 'referredTo', select: 'name mobile ' }])
      .skip(perPage * page - perPage)
      .limit(perPage)

    res.render(`${req.vPath}/app/candidate/referral`, { menu: 'referral', candidate, cashback, referral, totalPages, page, count, data: req.query });
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/shareCV', isCandidate, async (req, res) => {
  try {
    res.render(`${req.vPath}/app/candidate/shareCV`, { menu: 'shareCV' });
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/createResume', isCandidate, authenti, async (req, res) => {
  try {
    const user = req.session.user
    const candidate = await Candidate.findOne({ mobile: user.mobile, isDeleted: false })
    if (!candidate) {
      return res.status(400).send({ status: false, message: "No such candidate found" })
    }

    let url = `${req.protocol}://${req.get("host")}/candidateForm/${candidate._id}`
    let params = {};
    if (process.env.NODE_ENV !== "development") {
      params = {
        executablePath: "/usr/bin/chromium-browser",
      };
    }
    const logo = fs.readFileSync(path.join(__dirname, '../../../public/images/elements/mipie-footer.png'), { encoding: 'base64' });
    const browser = await puppeteer.launch(params);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const data = await page.pdf({
      path: path.join(__dirname, `../../../public/documents/output${candidate._id}.pdf`),
      format: 'A4',
      displayHeaderFooter: true,
      preferCSSPageSize: true,
      headerTemplate: `
     <div style="display:flex;width:90%;font-size: 10px;padding: 5px 0;margin:auto;">
       <div style="width:25%;text-align:right"></div>
     </div>`,
      footerTemplate: `<footer style="margin: auto; width: 100%; border-top:1px solid #666;">
     <a href = "${baseUrl}">
     <img width="70%" height="auto" style="float: right; padding-right: 20px; padding-left: 36px; width: 25%" src="data:image/png;base64,${logo}" alt="Pivohub" />
     </a>
     </footer>`,
      margin: {
        top: '30px',
        bottom: '50px',
        right: '30px',
        left: '30px',
      },
    });
    await browser.close();

    if (!data) {
      throw req.ykError("Unable to create pdf1");
    }

    req.flash("success", "Create pdf successfully!");

    res.send({ status: 200, uploadData: `${req.protocol}://${req.get("host")}/documents/output${candidate._id}.pdf` });
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, message: err.message })
  }
})
router.route('/verification')
  .get(isCandidate, authenti, async (req, res) => {
    try {
      let validation = { mobile: req.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      const userMobile = value.mobile;
      const candidate = await Candidate.findOne({ mobile: userMobile }).select("verified mobile")
      if (!candidate) {
        return res.send({ status: false, message: "No such user found" })
      }
      return res.send({ status: true, data: candidate })
    }
    catch (err) {
      console.log(err);
      return res.send({ status: false, message: err.message })
    }
  })
  .post(isCandidate, authenti, async (req, res) => {
    try {
      const { mobile, verified } = req.body;
      let candidate = await Candidate.findOne({ mobile });
      if (!candidate) {
        return res.send({ status: false, message: "No such user found" })
      }
      let updatedData = await Candidate.findOneAndUpdate({ mobile }, { verified }, { new: true })
      // console.log('updated Verification============', updatedData)
      if (!updatedData) {
        return res.send({ status: false, message: "Verification failed" })
      }
      return res.send({ status: true, data: updatedData, messsage: 'Verification successful' })
    }
    catch (err) {
      console.log('error while updating the verification status========', err);
      return res.send({ status: false, message: err.message })
    }
  })
router.route('/requestLoan')
  .get(isCandidate, async (req, res) => {
    try {
      let validation = { mobile: req.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      let mobile = value.mobile;
      let errMessage;
      let candidate = await Candidate.findOne({ isDeleted: false, mobile })
      if (!candidate) {
        req.flash("error", "No such user Exists");
        return res.redirect("back")
      }
      if (!candidate.isProfileCompleted) {
        errMessage = 'Please complete your Profile / कृपया अपना प्रोफाइल पूरा करें।';
        return res.render(`${req.vPath}/app/candidate/requestLoan`, { menu: 'requestLoan', loanpurpose: loanEnquiryPurpose, errMessage })
      }
      let loanDue = await LoanEnquiry.findOne({ _candidate: candidate._id, status: loanEnquiryStatus.Due })
      if (loanDue) {
        errMessage = 'You have already submitted the Loan request. We will update you soon. / आपने पहले ही ऋण अनुरोध सबमिट कर दिया है। हम आपको जल्द ही अपडेट करेंगे।';
        return res.render(`${req.vPath}/app/candidate/requestLoan`, { menu: 'requestLoan', loanpurpose: loanEnquiryPurpose, errMessage })
      }

      return res.render(`${req.vPath}/app/candidate/requestLoan`, { menu: 'requestLoan', loanpurpose: loanEnquiryPurpose, errMessage })
    }
    catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, message: err.message })
    }
  })
  .post(isCandidate, authenti, async (req, res) => {
    try {
      const body = req.body;
      let validation = { mobile: req.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      const candidate = await Candidate.findOne({ mobile: value.mobile, isDeleted: false, status: true })
      if (!candidate) {
        return res.send({ status: false, message: 'No such user found' })
      }
      let loanDue = await LoanEnquiry.findOne({ _candidate: candidate._id, status: loanEnquiryStatus.Due })
      if (loanDue) {
        return res.send({ status: false, message: 'You have already submitted the Loan request. We will update you soon.' })
      }
      body["_candidate"] = candidate._id
      body["status"] = loanEnquiryStatus.Due
      const loan = await LoanEnquiry.create(body)
      if (!loan) {
        return res.send({ status: false, message: 'Something went wrong' })
      }
      return res.status(200).send({ status: true, message: 'Loan request sent successfully' })
    }
    catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, message: err.message })
    }
  })

router.route('/review/:job')
  .post([isCandidate, authenti], async (req, res) => {
    try {
      let validation = { mobile: req.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }
      const candidate = await Candidate.findOne({ mobile: value.mobile, isDeleted: false, status: true })
      if (!candidate) {
        return res.send({ status: false, message: 'No such user found' })
      }
      const jobId = req.params.job
      const { rating, comment } = req.body;
      if (!rating || !jobId) {
        return res.status(400).send({ status: false, msg: 'Missing Data.' })
      }
      let reviewDetails = {
        _job: jobId,
        _user: candidate._id,
        rating
      }
      if (comment) reviewDetails.comment = comment
      const alreadyReviewed = await Review.findOne({ _job: jobId, _user: candidate._id })
      if (alreadyReviewed) {
        return res.status(400).send({ status: false, msg: 'Already Reviewed' })
      }
      const createReview = await Review.create(reviewDetails)
      if (!createReview) {
        return res.status(400).send({ status: false, msg: 'Review not created.' })
      }
      return res.status(200).send({ status: true, msg: 'Review created Successfully.' })
    }
    catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, message: err.message })
    }
  });

router.route('/reqDocs/:courseId')
.get(isCandidate, async (req, res) => {
  try {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.status(400).json({ status: false, msg: "Invalid mobile number.", error });
    }

    const candidateMobile = value.mobile;
    console.log('mobile', candidateMobile);

    let { courseId } = req.params;
    if (typeof courseId === 'string' && mongoose.Types.ObjectId.isValid(courseId)) {
      courseId = new mongoose.Types.ObjectId(courseId);
    }

    // ✅ Candidate find karo
    const candidate = await Candidate.findOne({ mobile: candidateMobile });

    if (!candidate) {
      console.log("You have not applied for this course.");
      return res.redirect("/candidate/searchcourses");
    }

    const candidateId = candidate._id;

    // ✅ AppliedCourses se uploadedDocs fetch karo
    const appliedCourse = await AppliedCourses.findOne({
      _candidate: candidateId,
      _course: courseId
    });

    let uploadedDocs = [];
    if (appliedCourse && appliedCourse.uploadedDocs && appliedCourse.uploadedDocs.length > 0) {
      uploadedDocs = appliedCourse.uploadedDocs;
    }

    // ✅ Course ke docsRequired bhi fetch karo
    const course = await Courses.findById(courseId);

    let docsRequired = [];
    if (course) {
      docsRequired = course.docsRequired || [];
    } else {
      console.log("Course not found");
    }

    // ✅ Merge karo docsRequired + uploadedDocs
    let mergedDocs = [];

    if (docsRequired.length > 0) {
      mergedDocs = docsRequired.map(reqDoc => {
        const docObj = reqDoc.toObject ? reqDoc.toObject() : reqDoc;

        const matchingUploads = uploadedDocs.filter(
          uploadDoc => uploadDoc.docsId.toString() === docObj._id.toString()
        );

        return {
          _id: docObj._id,
          Name: docObj.Name,
          description: docObj.description || '',
          uploads: matchingUploads || []
        };
      });
    }

    // console.log("mergedDocs", mergedDocs);

    res.json({
      docsRequired,
      courseId,
      uploadedDocs,
      mergedDocs: mergedDocs || []
    });

  } catch (err) {
    console.log("caught error ", err);
    res.status(500).send({ status: false, message: "Something went wrong", error: err.message });
  }
})

.post(isCandidate, async (req, res) => {
    try {
      let { docsName, courseId, docsId } = req.body;
  
      if (typeof docsId === 'string' && mongoose.Types.ObjectId.isValid(docsId)) {
        docsId = new mongoose.Types.ObjectId(docsId);
      }
  
      const validation = { mobile: req.user.mobile };
      const { value, error } = await CandidateValidators.userMobile(validation);
      if (error) {
        return res.status(400).json({ status: false, msg: "Invalid mobile number.", error });
      }
  
      const candidateMobile = value.mobile;
  
      const candidate = await Candidate.findOne({
        mobile: candidateMobile
      });
  
      if (!candidate) {
        return res.status(400).json({ error: "Candidate not found." });
      }
  
      const files = req.files?.file;
      if (!files) {
        return res.status(400).send({ status: false, message: "No files uploaded" });
      }
  
      const candidateId = candidate._id;
      const filesArray = Array.isArray(files) ? files : [files];
      const uploadedFiles = [];
      const uploadPromises = [];
  
      filesArray.forEach((item) => {
        const { name, mimetype } = item;
        const ext = name?.split('.').pop().toLowerCase();
  
        if (!allowedExtensions.includes(ext)) {
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
  
      // ✅ Ab update hoga AppliedCourses ke andar
      const appliedCourse = await AppliedCourses.findOne({
        _candidate: candidate._id,
        _course: courseId
      });
  
      if (!appliedCourse) {
        return res.status(400).json({ error: "You have not applied for this course." });
      }
  
      appliedCourse.uploadedDocs.push({
        docsId: new mongoose.Types.ObjectId(docsId),
        fileUrl: fileUrl,
        status: "Pending",
        uploadedAt: new Date()
      });
  
      await appliedCourse.save();
  
      return res.status(200).json({
        status: true,
        message: "Document uploaded successfully",
        data: appliedCourse
      });
  
    } catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, message: err.message });
    }
  })
  
// Backend (Node.js with Express)
router.post('/saveProfile', [isCandidate, authenti], async (req, res) => {
  try {
    const user = req.user;
    console.log('user', user)

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
    if (mobile) updatePayload.mobile = mobile;
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
      { mobile: user.mobile },
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

router.patch('/updatefiles', [isCandidate, authenti], async (req, res) => {
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




router.get('/getProfile', [isCandidate, authenti], async (req, res) => {
  try {
    const user = req.user;

    const educations = await Qualification.find({ status: true });



    const candidate = await Candidate.findOne({ mobile: user.mobile });

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




router.route('/apply-event')
.post(isCandidate, async (req, res) => {

  try {
    let { eventId } = req.body;

    const mobile = req.user.mobile;
 const candidate = await Candidate.findOne({mobile:mobile})
 const candidateId = candidate._id
    

    if (!candidateId || !eventId ) {
      return res.status(400).json({ status: false, message: "Missing required fields" });
    }

    // ✅ Step 1: Check if already applied
    const alreadyApplied = await AppliedEvent.findOne({
      _candidate: candidateId,
      _event: eventId
    });

    if (alreadyApplied) {
      return res.status(409).json({ status: false, message: "Already applied to this event" });
    }

    // ✅ Step 2: Create AppliedEvent
    const applied = await AppliedEvent.create({
      _candidate: candidateId,
      _event: eventId,
      
    });

    // ✅ Step 3: Update Candidate profile
    await Candidate.findByIdAndUpdate(candidateId, {
      $push: {
        appliedEvents: {
          EventId: eventId,
          appliedEventId: applied._id
        }
      }
    });

    return res.status(200).json({
      status: true,
      message: "Event applied successfully",
      data: applied
    });

  } catch (error) {
    console.error("Error in applyToEvent:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

router.get("/event", [isCandidate, authenti], async (req, res) => {
  try {
    const mobile = req.user.mobile;
    const candidate = await Candidate.findOne({ mobile });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Get all applied event IDs for this candidate
    const appliedEvents = await AppliedEvent.find({ _candidate: candidate._id }).select("_event");
    const appliedEventIds = appliedEvents.map(app => app._event.toString());

    // Prepare filter to exclude already applied events
    const filter = {
      status: true,
      _id: { $nin: appliedEventIds }
    };

    const perPage = 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;

    const countEvents = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(countEvents / perPage);

    console.log('events',events.length)

    return res.json({
      events,
      totalPages,
      page
    });
  } catch (err) {
    console.error("Error in /event route:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/applied-events", [isCandidate, authenti], async (req, res) => {
  try {
    const mobile = req.user.mobile;
    const candidate = await Candidate.findOne({ mobile });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Get all applied event IDs for this candidate
    const appliedEvents = await AppliedEvent.find({ _candidate: candidate._id }).select("_event");
    const appliedEventIds = appliedEvents.map(app => app._event.toString());

    // Prepare filter to exclude already applied events
    const filter = {
      status: true,
      _id: { $in: appliedEventIds }
    };

    const perPage = 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;

    const countEvents = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(countEvents / perPage);

    return res.json({
      events,
      totalPages,
      page
    });
  } catch (err) {
    console.error("Error in /event route:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/curriculum/:courseId', [isCandidate, authenti], async (req, res) => {
  try {
    const { courseId } = req.params; 
    console.log('courseId:', courseId);
    
    if (!courseId) {
      return res.status(400).json({ 
        status: false, 
        message: "courseId is required" 
      });
    }
    
    const curriculum = await Curriculum.find({ courseId });
    console.log('curriculum found:', curriculum.length, 'items');
    
    return res.status(200).json(curriculum);
  } catch (err) {
    console.error("Error in /curriculum route:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


router.get('/enrolledCourses', [isCandidate, authenti], async (req, res) => {
  try {
  
    let validation = { mobile: req.user.mobile };
    let { value, error } = await CandidateValidators.userMobile(validation);
    
    if (error) {
      console.log(error);
      return res.send({ status: "failure", error: "Something went wrong!" });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        status: false,
        message: "Candidate not found"
      });
    }

    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;

    const appliedCourses = await AppliedCourses.find({
      _candidate: candidate._id,
      batch: { $exists: true, $ne: null },
      isBatchAssigned: true
    })
      .populate({
        path: '_course',
        select: 'name code description registrationCharges courseFeeType'
      })
      .populate({
        path: '_center',
        select: 'name code address'
      })
      .populate({
        path: 'batch',
        select: 'name code startDate endDate mode status instructor maxStudents enrolledStudents'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const count = await AppliedCourses.countDocuments({
      _candidate: candidate._id,
      batch: { $exists: true, $ne: null },
      isBatchAssigned: true
    });

    const totalPages = Math.ceil(count / perPage);

    return res.status(200).json({
      status: true,
      message: "Batch assigned students fetched successfully",
      data: {
        courses: appliedCourses,
        pagination: {
          page,
          perPage,
          totalPages,
          totalCount: count
        }
      }
    });

  } catch (err) {
    console.error("Error in /batch-assigned-students route:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
});

router.get('/assignments', isCandidate, async (req, res) => {
  try {
    const courseId = (req.params && req.params.courseId) || req.query?.courseId || null;
    const filter = {
      isPublished: true,
      title: { $ne: 'Question Bank' }
    };
    if (courseId) {
      filter.$or = [
        { 'questions.course': courseId },
        { courseId: courseId },
        { 'meta.courseId': courseId },
        { 'meta.course': courseId }
      ];
    }
    const assignments = await AssignmentQuestions.find(filter)
      .select('-owner -createdAt -updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    const user = req.user;
    let candidate = null;
    if (user && user.mobile) {
      candidate = await Candidate.findOne({ mobile: user.mobile }).lean();
    }

    if (!candidate) {
    
      return res.status(200).json({ status: true, message: 'Assignments fetched', data: assignments });
    }

   
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({ assignment: { $in: assignmentIds }, candidate: candidate._id })
      .select('assignment')
      .lean();

    const submittedSet = new Set(submissions.map(s => s.assignment.toString()));

    
    const annotated = assignments.map(a => ({
      ...a,
      submitted: submittedSet.has(a._id.toString())
    }));

    return res.status(200).json({ status: true, message: 'Assignments fetched successfully', data: annotated });
  } catch (err) {
    console.error('Get assignments error:', err);
    return res.status(500).json({ status: false, message: err.message || 'Failed to fetch assignments', error: err.message });
  }
});


router.get('/assignment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const assignment = await AssignmentQuestions.findOne({
      _id: id,
      isPublished: true,
      title: { $ne: 'Question Bank' }
    })
      .select('-owner -createdAt -updatedAt') 
      .lean();

    if (!assignment) {
      return res.status(404).json({ 
        status: false, 
        message: 'Assignment not found or not published' 
      });
    }

    return res.status(200).json({ 
      status: true, 
      message: 'Assignment fetched successfully', 
      data: assignment 
    });

  } catch (err) {
    console.error('Get assignment error:', err);
    return res.status(500).json({ 
      status: false, 
      message: err.message || 'Failed to fetch assignment',
      error: err.message
    });
  }
});


router.post('/assignment/:id/submit', isCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeStarted, timeTakenSeconds } = req.body;
    const user = req.user;

    if (!user || !user.mobile) {
      return res.status(401).json({ status: false, message: 'Unauthorized: candidate not authenticated' });
    }
    const candidateProfile = await Candidate.findOne({ mobile: user.mobile }).lean();
    if (!candidateProfile) {
      return res.status(404).json({ 
        status: false, 
        message: 'Candidate profile not found' 
      });
    }

    const assignment = await AssignmentQuestions.findOne({
      _id: id,
      isPublished: true,
      title: { $ne: 'Question Bank' }
    }).lean();

    if (!assignment) {
      return res.status(404).json({ 
        status: false, 
        message: 'Assignment not found or not published' 
      });
    }

    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: id,
      candidate: candidateProfile._id
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        status: false, 
        message: 'You have already submitted this assignment' 
      });
    }

  const { questions, totalMarks, passPercent } = assignment;
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let attemptedCount = 0;
    let marksFromCorrect = 0;
  const negEach = 0;

    const answerDetails = questions.map((q) => {
      const questionIdStr = q._id?.toString();
      let selectedOption = -1;
      
      if (answers[questionIdStr] !== undefined) {
        selectedOption = Number(answers[questionIdStr]);
      } else {
        Object.keys(answers).forEach(key => {
          if (key.includes(questionIdStr) || answers[key] !== undefined) {
            selectedOption = Number(answers[key]);
          }
        });
      }
      
      let isCorrect = false;
      let marksObtained = 0;

      if (selectedOption !== -1 && selectedOption >= 0) {
        attemptedCount++;
        if (selectedOption === q.correctIndex) {
          isCorrect = true;
          marksObtained = Number(q.marks || 0);
          score += marksObtained;
          marksFromCorrect += marksObtained;
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      return {
        questionId: questionIdStr,
        selectedOption,
        isCorrect,
        marksObtained
      };
    });

    if (score < 0) score = 0;

    const percentage = totalMarks ? Math.round((score / totalMarks) * 10000) / 100 : 0;
    const pass = percentage >= Number(passPercent || 40);
    const unattemptedCount = questions.length - attemptedCount;
  const negativeDeducted = 0;

    const submission = new AssignmentSubmission({
      assignment: id,
      candidate: candidateProfile._id,
      answers: answerDetails,
      score,
      totalMarks,
      percentage,
      pass,
      correctCount,
      wrongCount,
      attemptedCount,
      unattemptedCount,
      marksFromCorrect,
      negativeDeducted,
      timeStarted: timeStarted ? new Date(timeStarted) : new Date(),
      timeSubmitted: new Date(),
      timeTakenSeconds: timeTakenSeconds || 0
    });

    await submission.save();

    return res.status(200).json({ 
      status: true, 
      message: 'Assignment submitted successfully', 
      data: {
        submissionId: submission._id,
        score,
        totalMarks,
        percentage,
        pass,
        correctCount,
        wrongCount,
        attemptedCount,
        unattemptedCount,
        marksFromCorrect,
        negativeDeducted
      }
    });

  } catch (err) {
    console.error('Submit assignment error:', err);
    return res.status(500).json({ 
      status: false, 
      message: err.message || 'Failed to submit assignment',
      error: err.message
    });
  }
});


router.get("/job-offers", [isCandidate], async (req, res) => {
  try {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);
    if (error) {
      console.log(error);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid candidate data" 
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    // Only show job offers that were specifically sent via "send offer" button
    // These offers have _candidate set and status = 'offered'
    const jobOfferQuery = {
      isActive: true,
      _candidate: candidate._id,  // Only job offers directly sent to this candidate
      status: { $in: ['offered', 'active'] }  // Show both pending and accepted offers
    };

    // console.log('=== Fetching Job Offers ===');
    // console.log('Candidate ID:', candidate._id);
    // console.log('Candidate Mobile:', candidate.mobile);
    // console.log('Query:', JSON.stringify(jobOfferQuery, null, 2));

    const jobOffers = await JobOffer.find(jobOfferQuery)
      .populate([
        { path: '_job', select: '_id title' },
        { path: '_qualification', select: 'name' },
        { path: '_industry', select: 'name' },
        { path: '_jobCategory', select: 'name' },
        { path: 'state', select: 'name' },
        { path: 'city', select: 'name' },
        { path: '_company', select: 'name displayCompanyName' }
      ])
      .sort({ createdAt: -1 })
      .lean();

   

    // Format job offers with company details
    const formattedJobOffers = jobOffers.map(offer => ({
      ...offer,
      displayCompanyName: offer.displayCompanyName || offer._company?.displayCompanyName || offer._company?.name || offer.companyName || 'N/A',
      companyName: offer.companyName || offer._company?.name || offer.displayCompanyName || 'N/A'
    }));

    // console.log('Returning formatted job offers:', formattedJobOffers.length);
    return res.status(200).json({
      success: true,
      message: 'Job offers fetched successfully',
      data: formattedJobOffers || []
    });
  } catch (err) {
    console.error('Error fetching job offers:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Accept job offer
router.post("/job-offers/:jobOfferId/accept", [isCandidate], async (req, res) => {
  try {
    const { jobOfferId } = req.params;
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);
    
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid candidate data" 
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const jobOffer = await JobOffer.findById(jobOfferId);

    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: "Job offer not found"
      });
    }

    // Verify that the job offer belongs to this candidate
    if (jobOffer._candidate.toString() !== candidate._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This job offer does not belong to you."
      });
    }

    // Update job offer with acceptance
    jobOffer.candidateResponse = 'accepted';
    jobOffer.respondedAt = new Date();
    jobOffer.status = 'active';
    jobOffer.logs.push({
      user: candidate._id,
      timestamp: new Date(),
      action: 'Accepted',
      remarks: 'Candidate accepted the job offer'
    });
    await jobOffer.save();

    // Mark placement as "placed" when candidate accepts the job offer
    if (jobOffer.placement) {
      const placement = await Placement.findById(jobOffer.placement);
      if (placement) {
        // Find "placed" status for the college
        const placedStatus = await PlacementStatus.findOne({
          $or: [
            { college: placement.college, title: { $regex: /placed/i } },
            { college: null, title: { $regex: /placed/i } }
          ]
        });

        if (placedStatus) {
          placement.status = placedStatus._id;
          placement.logs.push({
            user: candidate._id,
            timestamp: new Date(),
            action: 'Placed',
            remarks: `Candidate accepted job offer: ${jobOffer.title || 'Job Offer'}`
          });
          await placement.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Job offer accepted successfully',
      data: jobOffer
    });
  } catch (err) {
    console.error('Error accepting job offer:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Reject job offer
router.post("/job-offers/:jobOfferId/reject", [isCandidate], async (req, res) => {
  try {
    const { jobOfferId } = req.params;
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);
    
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid candidate data" 
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const jobOffer = await JobOffer.findById(jobOfferId);

    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: "Job offer not found"
      });
    }

    // Verify that the job offer belongs to this candidate
    if (jobOffer._candidate.toString() !== candidate._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This job offer does not belong to you."
      });
    }

    // Update job offer with rejection
    jobOffer.candidateResponse = 'rejected';
    jobOffer.respondedAt = new Date();
    jobOffer.logs.push({
      user: candidate._id,
      timestamp: new Date(),
      action: 'Rejected',
      remarks: 'Candidate rejected the job offer'
    });
    await jobOffer.save();

    return res.status(200).json({
      success: true,
      message: 'Job offer rejected successfully',
      data: jobOffer
    });
  } catch (err) {
    console.error('Error rejecting job offer:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Reward Statuses (for Candidate app)
router.get('/rewardStatuses', [isCandidate], async (req, res) => {
  try {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate data'
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Backward compatible: candidate-specific + global + legacy-global
    const statuses = await RewardStatus.find({
      $or: [
        { candidate: candidate._id },
        { candidate: null },
        { candidate: { $exists: false } },
        { college: null },
        { college: { $exists: false } }
      ]
    })
      .sort({ index: 1 })
      .lean()
      .select('title description milestone rewardType substatuses index candidate college requiredDocuments requiresFeedback feedbackLabel');
    
    // Check which statuses have been claimed by this candidate
    const claims = await RewardClaim.find({ _candidate: candidate._id })
      .select('_rewardStatus status adminRemarks rejectedAt')
      .lean();
    
    const claimedStatusIds = new Set(claims.map(c => c._rewardStatus.toString()));
    
    // Add claim status to each reward status
    const statusesWithClaimInfo = statuses.map(status => {
      const claim = claims.find(c => c._rewardStatus.toString() === status._id.toString());
      return {
        ...status,
        isClaimed: claimedStatusIds.has(status._id.toString()),
        claimStatus: claim?.status || null,
        adminRemarks: claim?.adminRemarks || null,
        rejectedAt: claim?.rejectedAt || null,
        claimId: claim?._id || null
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Reward statuses fetched successfully',
      data: statusesWithClaimInfo
    });
  } catch (err) {
    console.error('Error fetching reward statuses:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Claim Reward API
router.post('/claimReward', [isCandidate], async (req, res) => {
  try {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate data'
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const { rewardStatusId, upiNumber, upiId, address, email, documents, feedback } = req.body;

    if (!rewardStatusId) {
      return res.status(400).json({
        success: false,
        message: 'Reward status ID is required'
      });
    }

    // Check if reward status exists
    const rewardStatus = await RewardStatus.findById(rewardStatusId);
    if (!rewardStatus) {
      return res.status(404).json({
        success: false,
        message: 'Reward status not found'
      });
    }

    // Check if reward is eligible for this candidate
    // Reward should be either global (candidate: null) or specifically assigned to this candidate
    if (rewardStatus.candidate && rewardStatus.candidate.toString() !== candidate._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to claim this reward'
      });
    }

    // Check if already claimed
    const existingClaim = await RewardClaim.findOne({
      _candidate: candidate._id,
      _rewardStatus: rewardStatusId
    });

    if (existingClaim && existingClaim.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Reward already claimed',
        data: existingClaim
      });
    }

    // Validate based on reward type
    if (rewardStatus.rewardType === 'money') {
      if (!upiNumber && !upiId) {
        return res.status(400).json({
          success: false,
          message: 'UPI Number or UPI ID is required for money reward'
        });
      }
      // Validate UPI format
      if (upiNumber && upiNumber.trim() !== '') {
        const upiNumberRegex = /^[0-9]{10}$/;
        if (!upiNumberRegex.test(upiNumber.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid UPI number format. Must be 10 digits'
          });
        }
      }
      if (upiId && upiId.trim() !== '') {
        const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
        if (!upiIdRegex.test(upiId.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid UPI ID format. Example: name@paytm'
          });
        }
      }
    }

    if (rewardStatus.rewardType === 'gift' || rewardStatus.rewardType === 'trophy') {
      if (!address || address.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Address is required for ' + rewardStatus.rewardType + ' reward'
        });
      }
      // Validate address length
      if (address.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Address must be at least 10 characters long'
        });
      }
    }

    // Validate voucher type - require email for digital voucher delivery
    if (rewardStatus.rewardType === 'voucher') {
      const hasEmail = email && email.trim() !== '';
      
      if (!hasEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email ID is required for voucher reward'
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format. Please provide a valid email address'
        });
      }
    }

    // Validate 'other' reward - require address for fulfillment / review
    if (rewardStatus.rewardType === 'other') {
      if (!address || address.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Address is required for other reward'
        });
      }
      if (address.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Address must be at least 10 characters long'
        });
      }
    }

    // Validate required documents
    if (rewardStatus.requiredDocuments && rewardStatus.requiredDocuments.length > 0) {
      const mandatoryDocs = rewardStatus.requiredDocuments.filter(doc => doc.mandatory && doc.status);
      if (mandatoryDocs.length > 0) {
        const uploadedDocNames = (documents || []).map(doc => doc.documentName);
        const missingDocs = mandatoryDocs.filter(doc => !uploadedDocNames.includes(doc.name));
        if (missingDocs.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Missing required documents: ' + missingDocs.map(d => d.name).join(', ')
          });
        }
      }
    }

    // Validate feedback if required
    if (rewardStatus.requiresFeedback && (!feedback || feedback.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required for this reward'
      });
    }

    // Process and validate documents
    let processedDocuments = [];
    if (documents && Array.isArray(documents) && documents.length > 0) {
      processedDocuments = documents.map(doc => ({
        documentName: doc.documentName || doc.name || 'Unknown',
        documentKey: doc.documentKey || doc.key || doc.Key,
        uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date()
      })).filter(doc => doc.documentKey); // Only include documents with valid keys
    }

    console.log('Processing reward claim with documents:', processedDocuments); // Debug log

    // If existing rejected claim exists, update it; otherwise create new
    let savedClaim;
    if (existingClaim && existingClaim.status === 'rejected') {
      // Resubmit rejected claim - update with new data
      existingClaim.status = 'pending';
      existingClaim.rejectedAt = null;
      existingClaim.adminRemarks = null;
      existingClaim.claimedAt = new Date();
      existingClaim.upiNumber = (rewardStatus.rewardType === 'money' || rewardStatus.rewardType === 'voucher') ? 
        ((upiNumber && upiNumber.trim() !== '') ? upiNumber.trim() : null) : null;
      existingClaim.upiId = (rewardStatus.rewardType === 'money' || rewardStatus.rewardType === 'voucher') ? 
        ((upiId && upiId.trim() !== '') ? upiId.trim() : null) : null;
      existingClaim.address = (rewardStatus.rewardType === 'gift' || 
                rewardStatus.rewardType === 'trophy' || 
                rewardStatus.rewardType === 'other' ||
                (rewardStatus.rewardType === 'voucher' && address && address.trim() !== '')) ? 
        (address ? address.trim() : null) : null;
      existingClaim.email = (rewardStatus.rewardType === 'voucher' && email && email.trim() !== '') ? 
        (email.trim().toLowerCase()) : null;
      existingClaim.documents = processedDocuments;
      existingClaim.feedback = rewardStatus.requiresFeedback ? (feedback || null) : null;
      
      savedClaim = await existingClaim.save();
      
      return res.status(200).json({
        success: true,
        message: 'Reward claim resubmitted successfully',
        data: savedClaim
      });
    } else {
      // Create new reward claim
      const newClaim = new RewardClaim({
        _candidate: candidate._id,
        _rewardStatus: rewardStatusId,
        rewardType: rewardStatus.rewardType,
        // For money and voucher (if UPI provided), store UPI details
        upiNumber: (rewardStatus.rewardType === 'money' || rewardStatus.rewardType === 'voucher') ? 
          ((upiNumber && upiNumber.trim() !== '') ? upiNumber.trim() : null) : null,
        upiId: (rewardStatus.rewardType === 'money' || rewardStatus.rewardType === 'voucher') ? 
          ((upiId && upiId.trim() !== '') ? upiId.trim() : null) : null,
        // For gift, trophy, voucher (if provided), and other, store address
        address: (rewardStatus.rewardType === 'gift' || 
                  rewardStatus.rewardType === 'trophy' || 
                  rewardStatus.rewardType === 'other' ||
                  (rewardStatus.rewardType === 'voucher' && address && address.trim() !== '')) ? 
          (address ? address.trim() : null) : null,
        // For voucher (if email provided), store email
        email: (rewardStatus.rewardType === 'voucher' && email && email.trim() !== '') ? 
          (email.trim().toLowerCase()) : null,
        documents: processedDocuments,
        feedback: rewardStatus.requiresFeedback ? (feedback || null) : null,
        status: 'pending'
      });

      savedClaim = await newClaim.save();

      return res.status(201).json({
        success: true,
        message: 'Reward claim submitted successfully',
        data: savedClaim
      });
    }
  } catch (err) {
    console.error('Error claiming reward:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Get All Reward Claims for Candidate (Pending, Approved, Rejected)
router.get('/allRewardClaims', [isCandidate], async (req, res) => {
  try {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate data'
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Fetch all claims (pending, approved, rejected)
    const claims = await RewardClaim.find({
      _candidate: candidate._id
    })
      .populate('_rewardStatus', 'title description rewardType milestone requiredDocuments')
      .sort({ createdAt: -1 })
      .lean();

    // Format claims with delivery timeline information
    const formattedClaims = claims.map(claim => {
      let deliveryMessage = '';
      let deliveryDays = 0;
      
      if (claim.status === 'approved') {
        if (claim.rewardType === 'money') {
          deliveryMessage = 'Reward will be transferred within 3 working days';
          deliveryDays = 3;
        } else if (claim.rewardType === 'gift' || claim.rewardType === 'trophy') {
          deliveryMessage = 'Will be delivered within 7 working days';
          deliveryDays = 7;
        } else {
          deliveryMessage = 'Will be processed within 5 working days';
          deliveryDays = 5;
        }
      }

      return {
        _id: claim._id,
        rewardTitle: claim._rewardStatus?.title || 'N/A',
        rewardDescription: claim._rewardStatus?.description || '',
        rewardType: claim.rewardType,
        milestone: claim._rewardStatus?.milestone || '',
        status: claim.status,
        approvedAt: claim.approvedAt,
        rejectedAt: claim.rejectedAt,
        disbursedAt: claim.disbursedAt,
        adminRemarks: claim.adminRemarks,
        deliveryMessage: deliveryMessage,
        deliveryDays: deliveryDays,
        claimedAt: claim.claimedAt,
        createdAt: claim.createdAt,
        achievementImage: claim.achievementImage || null,
        documents: claim.documents || [],
        upiNumber: claim.upiNumber,
        upiId: claim.upiId,
        address: claim.address,
        email: claim.email,
        feedback: claim.feedback
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Reward claims fetched successfully',
      data: formattedClaims
    });
  } catch (err) {
    console.error('Error fetching reward claims:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Get Approved Reward Claims for Candidate (My Achievements)
router.get('/approvedRewardClaims', [isCandidate], async (req, res) => {
  try {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate data'
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Fetch approved or disbursed claims
    const claims = await RewardClaim.find({
      _candidate: candidate._id,
      status: { $in: ['approved', 'rejected'] } // Show both approved and rejected for transparency
    })
      .populate('_rewardStatus', 'title description rewardType milestone')
      .sort({ approvedAt: -1, createdAt: -1 })
      .lean();

    // Format claims with delivery timeline information
    const formattedClaims = claims.map(claim => {
      let deliveryMessage = '';
      let deliveryDays = 0;
      
      if (claim.status === 'approved') {
        if (claim.rewardType === 'money') {
          deliveryMessage = 'Reward will be transferred within 3 working days';
          deliveryDays = 3;
        } else if (claim.rewardType === 'gift' || claim.rewardType === 'trophy') {
          deliveryMessage = 'Will be delivered within 7 working days';
          deliveryDays = 7;
        } else {
          deliveryMessage = 'Will be processed within 5 working days';
          deliveryDays = 5;
        }
      }

      return {
        _id: claim._id,
        rewardTitle: claim._rewardStatus?.title || 'N/A',
        rewardDescription: claim._rewardStatus?.description || '',
        rewardType: claim.rewardType,
        milestone: claim._rewardStatus?.milestone || '',
        status: claim.status,
        approvedAt: claim.approvedAt,
        rejectedAt: claim.rejectedAt,
        disbursedAt: claim.disbursedAt,
        adminRemarks: claim.adminRemarks,
        deliveryMessage: deliveryMessage,
        deliveryDays: deliveryDays,
        claimedAt: claim.claimedAt,
        createdAt: claim.createdAt,
        achievementImage: claim.achievementImage || null
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Approved reward claims fetched successfully',
      data: formattedClaims
    });
  } catch (err) {
    console.error('Error fetching approved reward claims:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Update Achievement Image for Reward Claim
router.put('/rewardClaim/:claimId/updateImage', [isCandidate], async (req, res) => {
  try {
    const validation = { mobile: req.user.mobile };
    const { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate data'
      });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const { claimId } = req.params;
    const { achievementImage } = req.body;

    if (!achievementImage) {
      return res.status(400).json({
        success: false,
        message: 'Achievement image URL is required'
      });
    }

    // Find the claim and verify it belongs to this candidate
    const claim = await RewardClaim.findOne({
      _id: claimId,
      _candidate: candidate._id
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Reward claim not found or you do not have permission to update it'
      });
    }

    // Update the achievement image
    claim.achievementImage = achievementImage.trim();
    await claim.save();

    return res.status(200).json({
      success: true,
      message: 'Achievement image updated successfully',
      data: {
        _id: claim._id,
        achievementImage: claim.achievementImage
      }
    });
  } catch (err) {
    console.error('Error updating achievement image:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

module.exports = router;
