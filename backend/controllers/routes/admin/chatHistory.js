const express = require("express");
const router = express.Router();
const { ChatHistory, Candidate } = require("../../models");
const { isAdmin } = require("../../../helpers");

/**
 * GET /admin/chatHistory
 * View all chat histories
 */
router.get("/", isAdmin, async (req, res) => {
  try {
    return res.render(`${req.vPath}/admin/chatHistory`, {
      menu: 'chatHistory',
      currentUser: req.session.user,
      title: "Chat History",
    });
  } catch (error) {
    console.error("Chat history view error:", error);
    req.flash("error", "Failed to load chat history page");
    return res.redirect("/admin");
  }
});

/**
 * GET /admin/chatHistory/data
 * Get chat history data (AJAX)
 */
router.get("/data", isAdmin, async (req, res) => {
  try {
    const { mobile, sessionId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (mobile) {
      query.mobile = mobile.trim();
    }
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const chatHistories = await ChatHistory.find(query)
      .populate('candidateId', 'name mobile email')
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const chatHistoriesWithUserCount = chatHistories.map(history => {
      const userMessagesCount = history.messages 
        ? history.messages.filter(msg => msg.role === 'user').length 
        : 0;
      return {
        ...history,
        userMessagesCount
      };
    });

    const total = await ChatHistory.countDocuments(query);

    res.json({
      status: true,
      data: chatHistoriesWithUserCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch chat history",
      error: error.message,
    });
  }
});

/**
 * GET /admin/chatHistory/session/:sessionId
 * View specific chat session
 */
router.get("/session/:sessionId", isAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest' || req.query.ajax === 'true';

    const chatHistory = await ChatHistory.findOne({ sessionId })
      .populate('candidateId', 'name mobile email')
      .select('+messages') // Ensure messages field is included
      .lean();

    if (!chatHistory) {
      if (isAjax) {
        return res.json({
          status: false,
          message: "Chat session not found",
        });
      }
      req.flash("error", "Chat session not found");
      return res.redirect("/admin/chatHistory");
    }

    // If AJAX request, return JSON for modal
    if (isAjax) {
      return res.json({
        status: true,
        data: chatHistory,
      });
    }

    // If direct URL access, redirect to list page with sessionId parameter
    // The list page will auto-open modal
    return res.redirect(`/admin/chatHistory?session=${sessionId}`);
  } catch (error) {
    console.error("Get chat session error:", error);
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.query.ajax === 'true') {
      return res.json({
        status: false,
        message: "Failed to load chat session",
        error: error.message,
      });
    }
    req.flash("error", "Failed to load chat session");
    return res.redirect("/admin/chatHistory");
  }
});

module.exports = router;

