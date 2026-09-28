const express = require("express");
const moment = require("moment");
const { isAdmin } = require("../../../helpers");
const { Courses } = require("../../models");

const router = express.Router();
router.use(isAdmin);

router.get("/", async (req, res) => {
  try {
    const todayDateString = moment().utcOffset("+05:30").startOf("day").format("YYYY-MM-DD");
    const filter = {
      status: true,
      $or: [
        { lastDateForApply: { $gte: todayDateString } },
        { lastDateForApply: { $exists: false } },
        { lastDateForApply: null },
        { lastDateForApply: "" },
      ],
    };

    const courses = await Courses.find(filter)
      .populate("sectors", "name")
      .select("name sequence courseFeeType sectors city state updatedAt");

    courses.sort((a, b) => {
      const seqA = Number.isFinite(Number(a.sequence)) ? Number(a.sequence) : 50;
      const seqB = Number.isFinite(Number(b.sequence)) ? Number(b.sequence) : 50;
      if (seqA !== seqB) return seqA - seqB;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return res.render(`${req.vPath}/admin/landing/index`, {
      courses,
      menu: "landing",
    });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

module.exports = router;
