const express = require("express");
const TempLrpLead = require("../models/tempLrpLead");

const router = express.Router();

const PREFILLED_COURSE = "Telecom Grameen Udyami";
const PREFILLED_CENTER = "Biswabharati,Bhadrak";
const LEAD_SOURCES = ["LRP", "FO"];

const tenDigit = (value) => String(value || "").replace(/\D/g, "").slice(0, 10);

router.post("/lrp-lead", async (req, res) => {
  try {
    const body = req.body || {};
    const candidateName = String(body.candidateName || "").trim();
    const candidateNumber = tenDigit(body.candidateNumber);
    const whatsapp = tenDigit(body.whatsapp);
    const address = String(body.address || "").trim();
    const gender = String(body.gender || "").trim().toLowerCase();
    const highestQualification = String(body.highestQualification || "").trim();
    const counsellorName = String(body.counsellorName || "").trim();
    const source = String(body.source || "").trim();

    const errors = [];
    if (!candidateName) errors.push("Please enter candidate name");
    if (!/^\d{10}$/.test(candidateNumber)) errors.push("Candidate number must be 10 digits");
    if (!/^\d{10}$/.test(whatsapp)) errors.push("WhatsApp number must be 10 digits");
    if (!address) errors.push("Please enter address");
    if (!["male", "female", "other"].includes(gender)) errors.push("Please select gender");
    if (!highestQualification) errors.push("Please select highest qualification");
    if (!counsellorName) errors.push("Please enter counsellor name");
    if (!LEAD_SOURCES.includes(source)) errors.push("Please select lead source");

    if (errors.length) {
      return res.status(400).json({ status: false, message: errors.join(". ") });
    }

    const lead = await TempLrpLead.create({
      candidateName,
      candidateNumber,
      whatsapp,
      course: PREFILLED_COURSE,
      center: PREFILLED_CENTER,
      address,
      gender,
      highestQualification,
      counsellorName,
      source,
    });

    return res.status(201).json({
      status: true,
      message: "Details submitted successfully",
      data: { id: lead._id },
    });
  } catch (error) {
    console.error("public lrp lead error", error);
    return res.status(500).json({
      status: false,
      message: "Failed to save details",
    });
  }
});

module.exports = router;
