const { ClassRecording, LiveClass } = require("../../models");

/**
 * Get all recordings for a class
 */
exports.getRecordings = async (req, res) => {
  try {
    const { classId } = req.params;

    const recordings = await ClassRecording.find({
      classId: classId,
      isDeleted: false
    })
      .populate('trainerId', 'name email')
      .sort({ startedAt: -1 });

    res.json({
      status: true,
      data: recordings
    });
  } catch (error) {
    console.error("Error getting recordings:", error);
    res.status(500).json({
      status: false,
      message: "Error getting recordings",
      error: error.message
    });
  }
};

/**
 * Get recording details
 */
exports.getRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await ClassRecording.findOne({
      recordingId: recordingId,
      isDeleted: false
    })
      .populate('trainerId', 'name email')
      .populate('classId')
      .populate('batchId', 'name')
      .populate('courseId', 'name');

    if (!recording) {
      return res.status(404).json({
        status: false,
        message: "Recording not found"
      });
    }

    res.json({
      status: true,
      data: recording
    });
  } catch (error) {
    console.error("Error getting recording:", error);
    res.status(500).json({
      status: false,
      message: "Error getting recording",
      error: error.message
    });
  }
};

/**
 * Delete recording
 */
exports.deleteRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.user._id;

    const recording = await ClassRecording.findOne({
      recordingId: recordingId,
      isDeleted: false
    });

    if (!recording) {
      return res.status(404).json({
        status: false,
        message: "Recording not found"
      });
    }

    // Only trainer or admin can delete
    if (recording.trainerId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: false,
        message: "Unauthorized to delete this recording"
      });
    }

    recording.isDeleted = true;
    recording.deletedAt = new Date();
    await recording.save();

    // TODO: Delete actual file from storage

    res.json({
      status: true,
      message: "Recording deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting recording:", error);
    res.status(500).json({
      status: false,
      message: "Error deleting recording",
      error: error.message
    });
  }
};
