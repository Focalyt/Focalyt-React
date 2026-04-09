const { LiveClass, Batch, Courses, User } = require("../../models");
const { ObjectId } = require("mongoose").Types;

/**
 * Create a new live class
 */
exports.createClass = async (req, res) => {
  try {
    const {
      title,
      description,
      batchId,
      courseId,
      centerId,
      scheduledDate,
      scheduledDuration,
      maxParticipants,
      allowStudentVideo,
      allowStudentAudio,
      allowScreenShare,
      recordingEnabled,
      chatEnabled,
      notes
    } = req.body;

    const userId = req.user._id;

    // Verify batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        status: false,
        message: "Batch not found"
      });
    }

    // Verify course exists
    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: false,
        message: "Course not found"
      });
    }

    // Create live class
    const liveClass = new LiveClass({
      title,
      description,
      batchId,
      courseId,
      centerId,
      trainerId: userId,
      scheduledDate: new Date(scheduledDate),
      scheduledDuration: scheduledDuration || 60,
      maxParticipants: maxParticipants || 100,
      allowStudentVideo: allowStudentVideo || false,
      allowStudentAudio: allowStudentAudio !== false,
      allowScreenShare: allowScreenShare !== false,
      recordingEnabled: recordingEnabled || false,
      chatEnabled: chatEnabled !== false,
      notes,
      status: 'scheduled',
      createdBy: userId
    });

    await liveClass.save();

    res.status(201).json({
      status: true,
      message: "Live class created successfully",
      data: liveClass
    });
  } catch (error) {
    console.error("Error creating live class:", error);
    res.status(500).json({
      status: false,
      message: "Error creating live class",
      error: error.message
    });
  }
};

/**
 * Get live class details
 */
exports.getClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const liveClass = await LiveClass.findById(classId)
      .populate('batchId', 'name startDate endDate')
      .populate('courseId', 'name description')
      .populate('trainerId', 'name email')
      .populate('centerId', 'name')
      .populate('createdBy', 'name');

    if (!liveClass) {
      return res.status(404).json({
        status: false,
        message: "Live class not found"
      });
    }

    res.json({
      status: true,
      data: liveClass
    });
  } catch (error) {
    console.error("Error getting live class:", error);
    res.status(500).json({
      status: false,
      message: "Error getting live class",
      error: error.message
    });
  }
};

/**
 * Update live class
 */
exports.updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user._id;

    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return res.status(404).json({
        status: false,
        message: "Live class not found"
      });
    }

    // Only trainer who created or admin can update
    if (liveClass.trainerId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: false,
        message: "Unauthorized to update this class"
      });
    }

    // Don't allow updating if class is live or ended
    if (liveClass.status === 'live' || liveClass.status === 'ended') {
      return res.status(400).json({
        status: false,
        message: `Cannot update class with status: ${liveClass.status}`
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'scheduledDate', 'scheduledDuration',
      'maxParticipants', 'allowStudentVideo', 'allowStudentAudio',
      'allowScreenShare', 'recordingEnabled', 'chatEnabled', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        liveClass[field] = req.body[field];
      }
    });

    liveClass.updatedBy = userId;
    await liveClass.save();

    res.json({
      status: true,
      message: "Live class updated successfully",
      data: liveClass
    });
  } catch (error) {
    console.error("Error updating live class:", error);
    res.status(500).json({
      status: false,
      message: "Error updating live class",
      error: error.message
    });
  }
};

/**
 * Delete live class
 */
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user._id;

    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return res.status(404).json({
        status: false,
        message: "Live class not found"
      });
    }

    // Only trainer who created or admin can delete
    if (liveClass.trainerId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: false,
        message: "Unauthorized to delete this class"
      });
    }

    // Don't allow deleting if class is live
    if (liveClass.status === 'live') {
      return res.status(400).json({
        status: false,
        message: "Cannot delete live class. Please end the class first."
      });
    }

    liveClass.isDeleted = true;
    await liveClass.save();

    res.json({
      status: true,
      message: "Live class deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting live class:", error);
    res.status(500).json({
      status: false,
      message: "Error deleting live class",
      error: error.message
    });
  }
};

/**
 * Get all live classes for a batch
 */
exports.getClassesByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const liveClasses = await LiveClass.find({
      batchId: batchId,
      isDeleted: false
    })
      .populate('courseId', 'name')
      .populate('trainerId', 'name email')
      .sort({ scheduledDate: -1 });

    res.json({
      status: true,
      data: liveClasses
    });
  } catch (error) {
    console.error("Error getting classes by batch:", error);
    res.status(500).json({
      status: false,
      message: "Error getting classes",
      error: error.message
    });
  }
};
