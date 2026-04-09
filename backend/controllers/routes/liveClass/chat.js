const { ClassChatMessage, LiveClass } = require("../../models");

/**
 * Get chat history for a class
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    // Verify class exists
    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return res.status(404).json({
        status: false,
        message: "Live class not found"
      });
    }

    const messages = await ClassChatMessage.find({
      classId: classId,
      isDeleted: false
    })
      .populate('userId', 'name email')
      .sort({ sentAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      status: true,
      data: messages
    });
  } catch (error) {
    console.error("Error getting chat history:", error);
    res.status(500).json({
      status: false,
      message: "Error getting chat history",
      error: error.message
    });
  }
};
