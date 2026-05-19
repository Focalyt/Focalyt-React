const express = require("express");
const { isAdmin } = require("../../../helpers");
const { CertificateIssue } = require("../../models");

const router = express.Router();
router.use(isAdmin);

router.get("/", async (req, res) => {
  try {
    const issues = await CertificateIssue.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.REACT_APP_FOCALYT_BASE_URL ||
      "http://localhost:3000";

    return res.render(`${req.vPath}/admin/certificates/index`, {
      menu: "certificates",
      issues,
      frontendUrl: frontendUrl.replace(/\/$/, ""),
    });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

router.post("/add", async (req, res) => {
  try {
    const {
      name,
      course,
      dateFrom,
      dateEnd,
    } = req.body || {};

    if (!name || !course) {
      req.flash("error", "Student name and course are required");
      return res.redirect("back");
    }

    const issue = await CertificateIssue.create({
      name,
      course,
      dateFrom: dateFrom || "",
      dateEnd: dateEnd || "",
    });

    req.flash("success", "Certificate added successfully");
    return res.redirect("/admin/certificates");
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

module.exports = router;

