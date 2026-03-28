const express = require("express");
const mongoose = require("mongoose");

const { LRP, Lead, LeadCategory, TypeOfB2B, College, StatusB2b, User } = require("../../models");
const { uploadSinglefile } = require("../functions/images");

const router = express.Router();

const toNumberOrUndefined = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return n;
};

/** Extract last 10 digits for Indian mobile (optional leading 91) */
const extractMobile10 = (body) => {
  const explicit = (body.b2bMobile || "").replace(/\D/g, "");
  if (explicit.length >= 10) return explicit.slice(-10);
  const fromCoord = String(body.coordinatorNameContact || "").replace(/\D/g, "");
  if (fromCoord.length >= 10) return fromCoord.slice(-10);
  return "";
};

const isValidIndianMobile = (m) => /^[6-9]\d{9}$/.test(m);

async function createLinkedB2BLead(req, body) {
  try {
    let leadCategoryId = body.leadCategory && mongoose.Types.ObjectId.isValid(body.leadCategory)
      ? body.leadCategory
      : null;
    let typeOfB2BId = body.typeOfB2B && mongoose.Types.ObjectId.isValid(body.typeOfB2B)
      ? body.typeOfB2B
      : null;

    if (!leadCategoryId) {
      const cat = await LeadCategory.findOne({ isActive: true }).sort({ createdAt: 1 });
      if (cat) leadCategoryId = cat._id;
    }
    if (!typeOfB2BId) {
      const typ = await TypeOfB2B.findOne({ isActive: true }).sort({ createdAt: 1 });
      if (typ) typeOfB2BId = typ._id;
    }

    if (!leadCategoryId || !typeOfB2BId) {
      return {
        created: false,
        message: "B2B lead skipped: set Lead category & Type of B2B on the form, or add active items in Settings.",
      };
    }

    const mobile = extractMobile10(body);
    if (!isValidIndianMobile(mobile)) {
      return {
        created: false,
        message:
          "B2B lead skipped: valid 10-digit mobile required (use Coordinator field or B2B mobile).",
      };
    }

    const email = (body.schoolEmail || "").trim().toLowerCase();
    if (email) {
      const existingLead = await Lead.findOne({
        email,
        leadAddedBy: req.user._id,
      });
      if (existingLead) {
        return {
          created: false,
          message: "B2B lead skipped: a lead with this email already exists for your user.",
        };
      }
    }

    let leadOwnerId = null;
    const lo = body.leadOwner && String(body.leadOwner).trim();
    if (lo) {
      let owner = null;
      if (mongoose.Types.ObjectId.isValid(lo)) {
        owner = await User.findById(lo);
      }
      if (!owner) {
        owner = await User.findOne({
          name: { $regex: new RegExp(`^${lo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });
      }
      if (owner) leadOwnerId = owner._id;
    }

    const college = await College.findOne({ "_concernPerson._id": req.user._id });

    let defaultStatusId = null;
    let defaultSubStatusId = null;

    if (college) {
      const untouchStatus = await StatusB2b.findOne({
        college: college._id,
        title: { $regex: /^Untouch Leads$/i },
      });

      if (untouchStatus) {
        defaultStatusId = untouchStatus._id;
        if (untouchStatus.substatuses && untouchStatus.substatuses.length > 0) {
          const untouchSub = untouchStatus.substatuses.find(
            (sub) => sub.title && /^Untouch Leads$/i.test(sub.title)
          );
          defaultSubStatusId = untouchSub
            ? untouchSub._id
            : untouchStatus.substatuses[0]._id;
        }
      }
    }

    const businessName = String(body.schoolNameAddress || "School").trim().slice(0, 200);
    const concernPersonName = String(body.decisionMaker || body.coordinatorNameContact || "Contact").trim().slice(0, 200);

    const userRemark = String(body.otherRemarks || "").trim();

    const leadData = {
      leadCategory: leadCategoryId,
      typeOfB2B: typeOfB2BId,
      businessName,
      address: String(body.schoolNameAddress || "").trim(),
      city: String(body.district || "").trim(),
      state: String(body.state || "").trim(),
      concernPersonName,
      designation: "",
      email: email || undefined,
      mobile,
      leadAddedBy: req.user._id,
      remark: userRemark,
      landlineNumber: body.landlineNumber,
    };

    if (defaultStatusId) {
      leadData.status = defaultStatusId;
      if (defaultSubStatusId) leadData.subStatus = defaultSubStatusId;
    }
    if (leadOwnerId) leadData.leadOwner = leadOwnerId;

    const newLead = new Lead(leadData);
    let savedLead = await newLead.save();

    if (savedLead) {
      savedLead.logs.push({
        user: req.user._id,
        timestamp: new Date(),
        action: "Lead added from LRP form",
        remarks: userRemark || "",
      });
      await savedLead.save();
    }

    return { created: true, lead: savedLead };
  } catch (err) {
    console.error("[LRP] createLinkedB2BLead error:", err);
    return {
      created: false,
      message: err?.message || "B2B lead creation failed",
    };
  }
}

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    let geoTaggedPhoto = body.geoTaggedPhoto;
    if (req.files && req.files.file) {
      try {
        geoTaggedPhoto = await uploadSinglefile(req.files.file, "lrp");
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: e?.message || "Image upload failed",
        });
      }
    }

    if (!geoTaggedPhoto) {
      return res.status(400).json({
        success: false,
        message: "geoTaggedPhoto is required",
      });
    }

    const doc = {
      partnerType: body.partnerType,
      implementationPartnerName: body.implementationPartnerName,
      visitDate: body.visitDate ? new Date(body.visitDate) : body.visitDate,
      geoTaggedPhoto,

      state: body.state,
      district: body.district,

      schoolNameAddress: body.schoolNameAddress,
      schoolType: body.schoolType,
      schoolTypeOther: body.schoolTypeOther,
      schoolEmail: body.schoolEmail,
      coordinatorNameContact: body.coordinatorNameContact,
      decisionMaker: body.decisionMaker,
      studentsClass2to12: toNumberOrUndefined(body.studentsClass2to12),
      hasLabs: body.hasLabs,
      interestedWorkshop: body.interestedWorkshop,
      avgStudentsPerClass: toNumberOrUndefined(body.avgStudentsPerClass),
      preferredPlan: body.preferredPlan,
      managementReadyApprove: body.managementReadyApprove,
      meetingWithSeniorStaff: body.meetingWithSeniorStaff,
      nextMeetingDate: body.nextMeetingDate ? new Date(body.nextMeetingDate) : body.nextMeetingDate,
      hasComputerLab: body.hasComputerLab,
      computersAvailable: toNumberOrUndefined(body.computersAvailable),

      fftlClasses: body.fftlClasses,
      openForPartnership: body.openForPartnership,
      teachersAvailable: body.teachersAvailable,
      proposalExplainedSubmitted: body.proposalExplainedSubmitted,
      poExpectedTimeline: body.poExpectedTimeline,
      leadStatus: body.leadStatus,
      lockLead: body.lockLead,
      otherRemarks: body.otherRemarks,
    };

    const created = await LRP.create(doc);

    const b2b = await createLinkedB2BLead(req, body);

    return res.status(201).json({
      success: true,
      data: created,
      b2b,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err?.message || "Unable to save LRP lead",
    });
  }
});

module.exports = router;
