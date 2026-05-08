const express = require("express");
const { CertificateIssue } = require("../../models");

const router = express.Router();

// Public: list certificates for frontend list page
router.get("/", async (req, res) => {
  try {
    const items = await CertificateIssue.find({
      isDeleted: { $ne: true },
      status: { $ne: false },
    })
      .select("name course dateFrom dateEnd createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({ success: true, data: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
});

// Public: fetch a single issued certificate for frontend card
router.get("/:id", async (req, res) => {
  try {
    const issue = await CertificateIssue.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
      status: { $ne: false },
    }).lean();

    if (!issue) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    return res.json({ success: true, certificate: issue });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
});

module.exports = router;

