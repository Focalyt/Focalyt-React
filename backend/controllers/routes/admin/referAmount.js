const express = require("express");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
const moment = require("moment");

router.use(isAdmin);

const { ReferralShareOffer , PaymentDetails,Company,Candidate,coinsOffers,AppliedCourses} = require("../../models");

router.get("/", async (req, res) => {
    try {
        const offers = await ReferralShareOffer.find({}).sort({ createdAt: -1 }).lean();
        const jobOffers = offers.filter((x) => x.offerType === "JOB");
        const courseOffers = offers.filter((x) => x.offerType === "COURSE");

        return res.render(`${req.vPath}/admin/referamount/referAmount`, {
            menu: 'referAmount',
            jobOffers,
            courseOffers,
            moment
        });
    } catch (err) {
        req.flash("error", err.message || "Something went wrong!");
        return res.redirect("back");
    }
});

router.post("/jobOffer", async (req, res) => {
    try {
        const { referrerAmount, referredAmount, note, isActive } = req.body;
        const referrerAmountNum = Number(referrerAmount);
        const referredAmountNum = Number(referredAmount);
        const noteText = (note || "").toString().trim();
        const isActiveBool = isActive === "on" || isActive === true || isActive === "true";

        if (!Number.isFinite(referrerAmountNum) || referrerAmountNum < 0 || !Number.isFinite(referredAmountNum) || referredAmountNum < 0) {
            req.flash("error", "Please enter valid amounts (>= 0).");
            return res.redirect("back");
        }

        if (isActiveBool) {
            await ReferralShareOffer.updateMany({ offerType: "JOB" }, { $set: { isActive: false } });
        }

        await ReferralShareOffer.create({
            offerType: "JOB",
            referrerAmount: referrerAmountNum,
            referredAmount: referredAmountNum,
            note: noteText,
            isActive: isActiveBool,
            createdBy: req.session?.user?._id,
        });

        req.flash("success", "Job offer created successfully.");
        return res.redirect("back");
    } catch (err) {
        req.flash("error", err.message || "Something went wrong!");
        return res.redirect("back");
    }
});

router.post("/courseOffer", async (req, res) => {
    try {
        const { referrerAmount, referredAmount, note, isActive } = req.body;
        const referrerAmountNum = Number(referrerAmount);
        const referredAmountNum = Number(referredAmount);
        const noteText = (note || "").toString().trim();
        const isActiveBool = isActive === "on" || isActive === true || isActive === "true";

        if (!Number.isFinite(referrerAmountNum) || referrerAmountNum < 0 || !Number.isFinite(referredAmountNum) || referredAmountNum < 0) {
            req.flash("error", "Please enter valid amounts (>= 0).");
            return res.redirect("back");
        }

        if (isActiveBool) {
            await ReferralShareOffer.updateMany({ offerType: "COURSE" }, { $set: { isActive: false } });
        }

        await ReferralShareOffer.create({
            offerType: "COURSE",
            referrerAmount: referrerAmountNum,
            referredAmount: referredAmountNum,
            note: noteText,
            isActive: isActiveBool,
            createdBy: req.session?.user?._id,
        });

        req.flash("success", "Course offer created successfully.");
        return res.redirect("back");
    } catch (err) {
        req.flash("error", err.message || "Something went wrong!");
        return res.redirect("back");
    }
});


router.put("/:id/toggleStatus", async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, offerType } = req.body;
        
        const offer = await ReferralShareOffer.findById(id);
        if (!offer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Offer not found' 
            });
        }

        const isActiveBool = isActive === true || isActive === "true" || isActive === true;

        if (isActiveBool) {
            await ReferralShareOffer.updateMany(
                { 
                    _id: { $ne: id },
                    offerType: offerType || offer.offerType 
                }, 
                { $set: { isActive: false } }
            );
        }

        offer.isActive = isActiveBool;
        await offer.save();

        return res.status(200).json({
            success: true,
            message: `Offer ${isActiveBool ? 'activated' : 'deactivated'} successfully`,
            data: offer
        });
    } catch (err) {
        console.error('Error toggling offer status:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Server Error', 
            error: err.message 
        });
    }
});

module.exports = router;
