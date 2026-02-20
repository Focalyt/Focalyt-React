const express = require("express");
const path = require("path");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
const Razorpay = require("razorpay");
const moment = require("moment");
const apiKey = process.env.MIPIE_RAZORPAY_KEY;
const razorSecretKey = process.env.MIPIE_RAZORPAY_SECRET;

router.use(isAdmin);

const {PaymentDetails,Company,Candidate,coinsOffers,AppliedCourses} = require("../../models");

router.get("/", async (req, res) => {
    try {
        return res.render(`${req.vPath}/admin/referamount/referAmount`, {
            menu: 'referAmount'
        });
    } catch (err) {
        req.flash("error", err.message || "Something went wrong!");
        return res.redirect("back");
    }
});

module.exports = router;
