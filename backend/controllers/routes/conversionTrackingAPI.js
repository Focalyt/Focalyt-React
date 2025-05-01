const express = require("express");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const moment = require("moment");
require('dotenv').config();


const {
    CandidateProfile
} = require("../../controllers/models");
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
const { generatePassword, sendMail,isCandidate } = require("../../helpers");
const { Translate } = require('@google-cloud/translate').v2;
const { translateProjectId, translateKey } = require('../../../config')

AWS.config.update({ accessKeyId, secretAccessKey, region });
const s3 = new AWS.S3({ region, signatureVersion: "v4" });

const nodemailer = require("nodemailer");
const { ObjectId } = require("mongoose").Types;


// Hash helper
function hash(value) {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

// POST /meta/track-conversion
router.post('/meta/track-conversion',[isCandidate], async (req, res) => {
    try {
        const {
             // 📱 Only mobile is sent from frontend
            eventName,
            eventSourceUrl, 
            value,          // 💰 optional
            currency,
            fbc,
            fbp       // 💵 optional
        } = req.body;

        const mobile = req.user.mobile



        const userAgent = req.headers['user-agent'];
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // 🔍 Find candidate
        const candidate = await CandidateProfile.findOne({ mobile }).lean();
        if (!candidate) {
            return res.status(404).json({ status: false, message: "Candidate not found" });
        }

        const nameParts = candidate.name?.split(" ") || [];
        const firstName = nameParts[0];
        const lastName = nameParts[1] || "";

        const dob = candidate.dob; // ensure it's in "YYYY-MM-DD" format
        let doby, dobm, dobd;
        if (dob && dob.includes("-")) {
            [doby, dobm, dobd] = dob.split("-");
        }

        const accessToken = process.env.FB_CONVERSION_ACCESS_TOKEN;
        const pixelId = process.env.FB_CONVERSION_PIXEL_ID;

        const payload = {
            data: [
                {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_source_url: eventSourceUrl,
                    action_source: "website",
                    value: value || undefined,
                    currency: currency || undefined,
                    user_data: {
                        ph: hash(candidate.mobile || ''),
                        em: candidate.email ? hash(candidate.email) : undefined,
                        fn: firstName ? hash(firstName) : undefined,
                        ln: lastName ? hash(lastName) : undefined,
                        ge: candidate.sex ? hash(candidate.sex) : undefined,
                        ct: candidate?.personalInfo?.currentAddress?.city ? hash(candidate.personalInfo.currentAddress.city) : undefined,
                        st: candidate?.personalInfo?.currentAddress?.state ? hash(candidate.personalInfo.currentAddress.state) : undefined,
                        country: hash("IN"),
                        doby: doby ? hash(doby) : undefined,
                        dobm: dobm ? hash(dobm) : undefined,
                        dobd: dobd ? hash(dobd) : undefined,
                        client_user_agent: userAgent,
                        client_ip_address: ip,
                        fbp: req.body.fbp || undefined,
                        fbc: req.body.fbc || undefined
                    }
                }
            ],
            access_token: accessToken
        };

        const cleanPayload = JSON.parse(JSON.stringify(payload)); // remove undefined
        const fbRes = await axios.post(`https://graph.facebook.com/v18.0/${pixelId}/events`, cleanPayload);

        return res.status(200).json({ status: true, message: "Conversion sent successfully", data: fbRes.data });
    } catch (error) {
        console.error("Meta Conversion API Error:", error.response?.data || error.message);
        return res.status(500).json({ status: false, message: "Meta conversion failed", error: error.message });
    }
});





module.exports = router;
