const express = require("express");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
const moment = require("moment");
const mongoose = require("mongoose");

router.use(isAdmin);

const {
  CandidateCashBack,
  ReferralShareOffer,
  Referral,
} = require("../../models");
const Candidate = require("../../models/candidateProfile");
const KycDocument = require("../../models/kycDocument");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const { type, from, to, search } = req.query;

    const referralEventNames = [
      "referrer_job_apply",
      "referee_job_apply",
      "referrer_course_apply",
      "referee_course_apply",
    ];

    const matchStage = {
      eventName: { $in: referralEventNames },
    };

    if (type === "JOB") {
      matchStage.eventName = { $in: ["referrer_job_apply", "referee_job_apply"] };
    } else if (type === "COURSE") {
      matchStage.eventName = { $in: ["referrer_course_apply", "referee_course_apply"] };
    }

    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = moment(from, "YYYY-MM-DD").startOf("day").toDate();
      if (to) matchStage.createdAt.$lte = moment(to, "YYYY-MM-DD").endOf("day").toDate();
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$comment",
          entries: { $push: "$$ROOT" },
          createdAt: { $min: "$createdAt" },
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const allGroups = await CandidateCashBack.aggregate(pipeline);

    const transactions = [];
    for (const group of allGroups) {
      const commentKey = group._id || "";
      const parts = commentKey.split(":");
      const offerType = parts[1] || "N/A";
      const itemId = parts[2] || null;
      // some comment keys (refApply) also encode the referred candidate id as the fourth segment
      const candidateIdFromKey = parts[3] || null;

      let referrerEntry = null;
      let refereeEntry = null;

      for (const entry of group.entries) {
        if (entry.eventName.startsWith("referrer_")) {
          referrerEntry = entry;
        } else if (entry.eventName.startsWith("referee_")) {
          refereeEntry = entry;
        }
      }

      // primary ids come from cashback entries, but if the referee entry is missing
      // (e.g. when referred reward is zero) we can fall back to the id embedded in
      // the comment key so that the candidate details still show up in the table.
      let referrerId = referrerEntry?.candidateId || null;
      let refereeId = refereeEntry?.candidateId || null;
      if (!refereeId && candidateIdFromKey && mongoose.Types.ObjectId.isValid(candidateIdFromKey)) {
        refereeId = candidateIdFromKey;
      }

      const [referrer, referee, referrerKyc, refereeKyc] = await Promise.all([
        referrerId ? Candidate.findById(referrerId).select("name mobile").lean() : null,
        refereeId ? Candidate.findById(refereeId).select("name mobile").lean() : null,
        referrerId ? KycDocument.findOne({ _candidate: referrerId }).lean() : null,
        refereeId ? KycDocument.findOne({ _candidate: refereeId }).lean() : null,
      ]);

      if (search) {
        const s = search.toLowerCase();
        const referrerMatch =
          referrer?.name?.toLowerCase().includes(s) ||
          referrer?.mobile?.includes(s);
        const refereeMatch =
          referee?.name?.toLowerCase().includes(s) ||
          referee?.mobile?.includes(s);
        if (!referrerMatch && !refereeMatch) continue;
      }

      const computePending = (refEntry, reedEntry) => {
        if (refEntry && reedEntry) {
          return refEntry.isPending !== false || reedEntry.isPending !== false;
        } else if (refEntry) {
          return refEntry.isPending !== false;
        } else if (reedEntry) {
          return reedEntry.isPending !== false;
        }
        return false;
      };

     
      let referrerAmount = referrerEntry?.amount ?? 0;
      let refereeAmount = refereeEntry?.amount ?? 0;

      if ((referrerAmount === 0 || refereeAmount === 0) && offerType === 'JOB') {
        let jobOffer = await ReferralShareOffer.findOne({ offerType: 'JOB', isActive: true }).sort({ createdAt: -1 }).lean();
        if (!jobOffer) {
          jobOffer = await ReferralShareOffer.findOne({ offerType: 'JOB' }).sort({ createdAt: -1 }).lean();
        }
        if (jobOffer) {
          if (referrerAmount === 0) {
            referrerAmount = Number(jobOffer.referrerAmount ?? jobOffer.amount ?? 0);
          }
          if (refereeAmount === 0) {
            refereeAmount = Number(jobOffer.referredAmount ?? 0);
          }
        }
      }

      transactions.push({
        commentKey,
        offerType,
        itemId,
        referrer: referrer || { name: "N/A", mobile: "N/A" },
        referrerId,
        referee: referee || { name: "N/A", mobile: "N/A" },
        refereeId,
        referrerKyc: referrerKyc || null,
        refereeKyc: refereeKyc || null,
        referrerAmount,
        refereeAmount,
        date: group.createdAt,
        referrerEntryId: referrerEntry?._id,
        refereeEntryId: refereeEntry?._id,
        isPending: computePending(referrerEntry, refereeEntry),
      });
    }

    const totalCount = transactions.length;
    const totalPages = Math.ceil(totalCount / perPage);
    const paginatedTxns = transactions.slice((page - 1) * perPage, page * perPage);

    const summaryPipeline = [
      { $match: { eventName: { $in: referralEventNames } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalEntries: { $sum: 1 },
          uniqueComments: { $addToSet: "$comment" },
        },
      },
    ];
    const summaryResult = await CandidateCashBack.aggregate(summaryPipeline);
    
    // Calculate pending and approved stats using already fetched allGroups
    let pendingCount = 0;
    let approvedCount = 0;
    
    for (const group of allGroups) {
      let referrerEntry = null;
      let refereeEntry = null;
      
      for (const entry of group.entries) {
        if (entry.eventName.startsWith("referrer_")) {
          referrerEntry = entry;
        } else if (entry.eventName.startsWith("referee_")) {
          refereeEntry = entry;
        }
      }
      
      const computePending = (refEntry, reedEntry) => {
        if (refEntry && reedEntry) {
          return refEntry.isPending !== false || reedEntry.isPending !== false;
        } else if (refEntry) {
          return refEntry.isPending !== false;
        } else if (reedEntry) {
          return reedEntry.isPending !== false;
        }
        return false;
      };
      const isPending = computePending(referrerEntry, refereeEntry);
      if (isPending) {
        pendingCount++;
      } else {
        approvedCount++;
      }
    }
    
    const summary = {
      totalRewardsPaid: summaryResult[0]?.totalAmount || 0,
      totalTransactions: summaryResult[0]?.uniqueComments?.length || 0,
      totalEntries: summaryResult[0]?.totalEntries || 0,
      pending: pendingCount,
      approved: approvedCount,
    };

    const activeJobOffer = await ReferralShareOffer.findOne({ offerType: "JOB", isActive: true }).lean();
    const activeCourseOffer = await ReferralShareOffer.findOne({ offerType: "COURSE", isActive: true }).lean();

    return res.render(`${req.vPath}/admin/referralTracking/referralTracking`, {
      menu: "referralTracking",
      transactions: paginatedTxns,
      summary,
      activeJobOffer,
      activeCourseOffer,
      page,
      totalPages,
      totalCount,
      perPage,
      filters: { type: type || "", from: from || "", to: to || "", search: search || "" },
      moment,
    });
  } catch (err) {
    console.error("Referral tracking error:", err);
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

// API route to approve referral transaction
router.put("/approve", async (req, res) => {
  try {
    const { commentKey } = req.body;
    
    if (!commentKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment key is required' 
      });
    }

    // Update all CandidateCashBack entries with this commentKey
    const result = await CandidateCashBack.updateMany(
      { comment: commentKey },
      { $set: { isPending: false } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No transactions found with this comment key' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction approved successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error approving transaction:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

// API route to reject referral transaction
router.put("/reject", async (req, res) => {
  try {
    const { commentKey } = req.body;
    
    if (!commentKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment key is required' 
      });
    }

    // Update all CandidateCashBack entries with this commentKey
    const result = await CandidateCashBack.updateMany(
      { comment: commentKey },
      { $set: { isPending: true } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No transactions found with this comment key' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction rejected successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error rejecting transaction:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: err.message 
    });
  }
});

module.exports = router;
