const cron = require("node-cron");
const b2cFollowup = require("../controllers/models/b2cFollowup");
const AppliedCourses = require("../controllers/models/appliedCourses");
const User = require("../controllers/models/users");
const { sendWhatsAppTextMessage } = require("../services/whatsappClient");

async function buildFollowupMeta(followups) {
  const appliedCourseIds = [
    ...new Set(
      followups
        .map((f) => f.appliedCourseId?.toString())
        .filter((id) => Boolean(id))
    ),
  ];
  const creatorIds = [
    ...new Set(
      followups
        .map((f) => f.createdBy?.toString())
        .filter((id) => Boolean(id))
    ),
  ];

  const [appliedCourses, creators] = await Promise.all([
    appliedCourseIds.length
      ? AppliedCourses.find({ _id: { $in: appliedCourseIds } })
          .select("_candidate _course _center")
          .populate("_candidate", "name whatsapp mobile")
          .populate("_course", "name")
          .lean()
      : [],
    creatorIds.length
      ? User.find({
          _id: { $in: creatorIds },
          role: 2, // College users
        })
          .select("name whatsapp mobile email")
          .lean()
      : [],
  ]);

  const appliedCourseMap = new Map(
    appliedCourses.map((course) => [course._id.toString(), course])
  );
  const creatorMap = new Map(
    creators.map((creator) => [creator._id.toString(), creator])
  );

  return { appliedCourseMap, creatorMap };
}

function formatFollowupMessage(user, followup, appliedCourse) {
  const candidateName =
    appliedCourse?._candidate?.name || "the assigned candidate";
  const courseName = appliedCourse?._course?.name;
  const followupDate = followup.followupDate
    ? new Date(followup.followupDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    : "the scheduled time";

  const header = `Hi ${user?.name || "there"},`;
  const body = [
    `Your follow-up scheduled for ${candidateName}${
      courseName ? ` (${courseName})` : ""
    } on ${followupDate} was just marked as missed.`,
    "Please review the lead and reschedule a new follow-up if required.",
  ]
    .filter(Boolean)
    .join(" ");

  return `${header}\n${body}`;
}

async function notifyMissedFollowups(followups) {
  if (!followups.length) return;

  const { appliedCourseMap, creatorMap } = await buildFollowupMeta(followups);

  for (const followup of followups) {
    const creatorId = followup.createdBy?.toString();
    if (!creatorId) continue;

    const recipient = creatorMap.get(creatorId);
    if (!recipient || (!recipient.whatsapp && !recipient.mobile)) {
      continue;
    }

    const appliedCourse = followup.appliedCourseId
      ? appliedCourseMap.get(followup.appliedCourseId.toString())
      : null;

    const message = formatFollowupMessage(recipient, followup, appliedCourse);
    const phone = recipient.whatsapp || recipient.mobile;

    await sendWhatsAppTextMessage(phone, message);
  }
}

function missedFollowupSchedular() {
  cron.schedule("* * * * *", async () => {
    try {
      const followups = await b2cFollowup.find({
        status: "planned",
        followupDate: { $lt: new Date() },
      }).lean();

      if (followups.length > 0) {
        const result = await b2cFollowup.updateMany(
          { status: "planned", followupDate: { $lt: new Date() } },
          { $set: { status: "missed", statusUpdatedAt: new Date() } }
        );

        console.log(
          `[Cron] Marked ${result.modifiedCount} followups as missed`
        );

        await notifyMissedFollowups(followups);

        const ids = followups
          .map((f) => f.createdBy?.toString())
          .filter(Boolean);

        ids.forEach((id) => {
          const socketIds = global.userSockets?.[id] || [];
          socketIds.forEach((socketId) => {
            global.io.to(socketId).emit("missedFollowup", { followupId: id });
          });
        });
      }
    } catch (err) {
      console.error("[Cron] Error updating missed followups:", err);
    }
  }, { timezone: "Asia/Kolkata" });
}

module.exports = missedFollowupSchedular;