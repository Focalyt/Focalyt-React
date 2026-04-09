const express = require("express");
const router = express.Router();
const { isTrainer, auth1, authenti } = require("../../../helpers");
const classManagement = require("./classManagement");
const attendance = require("./attendance");
const recording = require("./recording");
const chat = require("./chat");

// Class Management Routes
router.post("/create", auth1, isTrainer, classManagement.createClass);
router.get("/:classId", auth1, classManagement.getClass);
router.put("/:classId", auth1, isTrainer, classManagement.updateClass);
router.delete("/:classId", auth1, isTrainer, classManagement.deleteClass);
router.get("/batch/:batchId", auth1, classManagement.getClassesByBatch);

// Attendance Routes
router.get("/:classId/attendance", auth1, attendance.getAttendance);
router.get("/:classId/attendance/:userId", auth1, attendance.getUserAttendance);
router.post("/:classId/attendance/manual", auth1, isTrainer, attendance.manualAttendance);
router.get("/:classId/attendance/export", auth1, isTrainer, attendance.exportAttendance);

// Recording Routes
router.get("/:classId/recordings", auth1, recording.getRecordings);
router.get("/recording/:recordingId", auth1, recording.getRecording);
router.delete("/recording/:recordingId", auth1, isTrainer, recording.deleteRecording);

// Chat Routes
router.get("/:classId/chat", auth1, chat.getChatHistory);

module.exports = router;
