const express = require("express");
const AWS = require("aws-sdk");
const uuid = require("uuid/v1");
const moment = require("moment");
const crypto = require("crypto");
require('dotenv').config();
const axios = require('axios');

const {
    CandidateProfile
} = require("../../controllers/models");// PostSchema import करें
const bcrypt = require("bcryptjs");
const router = express.Router();


const { generatePassword, sendMail, isCandidate } = require("../../helpers");


const nodemailer = require("nodemailer");
const { ObjectId } = require("mongoose").Types;


// Hash helper
function hash(value) {
    if (typeof value !== 'string') value = String(value || '');
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}


// POST /meta/track-conversion
router.post('/meta/track-conversion', [isCandidate], async (req, res) => {
    try {
        console.log("Meta api triger")
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

        const dob = candidate.dob;
        // Format DOB correctly
        let normalizedDob;
        if (dob instanceof Date && !isNaN(dob)) {
            const isoDob = dob.toISOString().split("T")[0]; // "1997-02-16"
            normalizedDob = isoDob.replace(/-/g, ""); // "19970216"
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
                        db: normalizedDob ? hash(normalizedDob) : undefined, // ✅ Updated DOB
                        client_user_agent: userAgent,
                        client_ip_address: ip,
                        fbp: fbp || undefined,
                        fbc: fbc || undefined
                    }
                }
            ],
            access_token: accessToken
        };

        console.log("user_data", payload.data[0].user_data);



        const cleanPayload = JSON.parse(JSON.stringify(payload)); // remove undefined
        const fbRes = await axios.post(`https://graph.facebook.com/v18.0/${pixelId}/events`, cleanPayload);
        console.log("meta response", fbRes.data)
        console.log(`${eventName} event tracked successfully`);
   

        return res.status(200).json({ status: true, message: "Conversion sent successfully", data: fbRes.data });
    } catch (error) {
        console.error("Meta Conversion API Error:", error.response?.data || error.message);
        return res.status(500).json({ status: false, message: "Meta conversion failed", error: error.message });
    }
});





module.exports = router;
