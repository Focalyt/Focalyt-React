const { ClassAttendance, LiveClass, User } = require("../../models");
const { Parser } = require("json2csv");
const moment = require("moment");

/**
 * Get attendance list for a class
 */
exports.getAttendance = async (req, res) => {
  try {
    const { classId } = req.params;

    const attendance = await ClassAttendance.find({ classId: classId })
      .populate('userId', 'name email mobile')
      .sort({ joinTime: -1 });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      late: attendance.filter(a => a.status === 'late').length,
      leftEarly: attendance.filter(a => a.status === 'left_early').length,
      partial: attendance.filter(a => a.status === 'partial').length,
      absent: attendance.filter(a => a.status === 'absent').length
    };

    res.json({
      status: true,
      data: {
        attendance,
        stats
      }
    });
  } catch (error) {
    console.error("Error getting attendance:", error);
    res.status(500).json({
      status: false,
      message: "Error getting attendance",
      error: error.message
    });
  }
};

/**
 * Get attendance for a specific user
 */
exports.getUserAttendance = async (req, res) => {
  try {
    const { classId, userId } = req.params;

    const attendance = await ClassAttendance.findOne({
      classId: classId,
      userId: userId
    })
      .populate('userId', 'name email mobile')
      .populate('markedBy', 'name');

    if (!attendance) {
      return res.status(404).json({
        status: false,
        message: "Attendance record not found"
      });
    }

    res.json({
      status: true,
      data: attendance
    });
  } catch (error) {
    console.error("Error getting user attendance:", error);
    res.status(500).json({
      status: false,
      message: "Error getting user attendance",
      error: error.message
    });
  }
};

/**
 * Manual attendance marking (for trainers)
 */
exports.manualAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { userId, status, notes } = req.body;
    const trainerId = req.user._id;

    // Verify class exists
    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return res.status(404).json({
        status: false,
        message: "Live class not found"
      });
    }

    // Find or create attendance
    let attendance = await ClassAttendance.findOne({
      classId: classId,
      userId: userId
    });

    if (attendance) {
      // Update existing
      attendance.status = status || attendance.status;
      attendance.notes = notes || attendance.notes;
      attendance.markedBy = trainerId;
      attendance.markReason = 'Manual adjustment';
      await attendance.save();
    } else {
      // Create new
      attendance = new ClassAttendance({
        classId: classId,
        userId: userId,
        batchId: liveClass.batchId,
        courseId: liveClass.courseId,
        status: status || 'present',
        joinTime: new Date(),
        notes: notes,
        markedBy: trainerId,
        markReason: 'Manual marking'
      });
      await attendance.save();
    }

    res.json({
      status: true,
      message: "Attendance updated successfully",
      data: attendance
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      status: false,
      message: "Error marking attendance",
      error: error.message
    });
  }
};

/**
 * Export attendance as CSV
 */
exports.exportAttendance = async (req, res) => {
  try {
    const { classId } = req.params;

    const attendance = await ClassAttendance.find({ classId: classId })
      .populate('userId', 'name email mobile')
      .populate('markedBy', 'name')
      .sort({ joinTime: -1 });

    if (attendance.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No attendance records found"
      });
    }

    // Format data for CSV
    const csvData = attendance.map(a => ({
      'Student Name': a.userId?.name || 'N/A',
      'Email': a.userId?.email || 'N/A',
      'Mobile': a.userId?.mobile || 'N/A',
      'Status': a.status,
      'Join Time': moment(a.joinTime).format('YYYY-MM-DD HH:mm:ss'),
      'Leave Time': a.leaveTime ? moment(a.leaveTime).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
      'Duration (minutes)': a.duration || 'N/A',
      'Valid Attendance': a.isValidAttendance ? 'Yes' : 'No',
      'IP Address': a.ipAddress || 'N/A',
      'Device': a.deviceInfo?.deviceType || 'N/A',
      'Notes': a.notes || 'N/A'
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${classId}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting attendance:", error);
    res.status(500).json({
      status: false,
      message: "Error exporting attendance",
      error: error.message
    });
  }
};
