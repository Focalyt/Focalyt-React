const express = require("express");
const router = express.Router();
const { ChatHistory } = require("../../models");

/**
 * POST /api/chat/init
 * Initialize a new chat session
 */
router.post("/init", async (req, res) => {
  try {
    const { mobile, email, sessionId } = req.body;

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({
        status: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    // Step 1: Check if provided sessionId exists
    let chatHistory = null;
    if (sessionId) {
      chatHistory = await ChatHistory.findOne({ sessionId: sessionId });
    }

    // Step 2: Check if user has existing chat history (same mobile)
    // Priority: Find most recent active chat history for this mobile
    let existingChatHistory = null;
    if (!chatHistory) {
      try {
        existingChatHistory = await ChatHistory.findOne({ 
          mobile: mobile.trim(),
          status: 'active'
        }).sort({ lastMessageAt: -1, createdAt: -1 });
        
        if (existingChatHistory) {
          console.log(`✅ Found existing chat history: ${existingChatHistory.sessionId}`);
        }
      } catch (e) {
        console.error("Error searching existing chat history:", e);
      }
    }

    // Step 3: Decision logic
    if (chatHistory) {
      // Update existing session with new user info
      chatHistory.mobile = mobile.trim();
      chatHistory.email = email?.trim() || chatHistory.email || '';
      chatHistory.status = 'active';
      await chatHistory.save();
      
      // Return existing messages if available
      const previousMessages = chatHistory.messages && chatHistory.messages.length > 0 
        ? chatHistory.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        : [];
      
      return res.json({
        status: true,
        message: "Chat session initialized (existing session reused)",
        sessionId: chatHistory.sessionId,
        chatHistoryId: chatHistory._id,
        isExistingSession: true,
        messages: previousMessages,
      });
    } else if (existingChatHistory) {
      // User has previous chat - reuse existing session
      console.log(`🔄 Reusing existing chat history for mobile: ${mobile.trim()}`);
      chatHistory = existingChatHistory;
      chatHistory.mobile = mobile.trim();
      chatHistory.email = email?.trim() || chatHistory.email || '';
      chatHistory.status = 'active';
      await chatHistory.save();
      
      // Return existing messages if available
      const previousMessages = chatHistory.messages && chatHistory.messages.length > 0 
        ? chatHistory.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        : [];
      
      return res.json({
        status: true,
        message: "Chat session initialized (existing history reused)",
        sessionId: chatHistory.sessionId,
        chatHistoryId: chatHistory._id,
        isExistingSession: true,
        messages: previousMessages,
      });
    } else {
      // Create new chat session
      chatHistory = await ChatHistory.create({
        mobile: mobile.trim(),
        email: email?.trim() || '',
        candidateId: null,
        sessionId: sessionId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messages: [],
        totalMessages: 0,
        status: 'active',
        metadata: {
          userAgent: req.headers['user-agent'] || '',
          ipAddress: req.ip || req.connection.remoteAddress || '',
          referrer: req.headers.referer || '',
        },
      });
    }

    res.json({
      status: true,
      message: "Chat session initialized",
      sessionId: chatHistory.sessionId,
      chatHistoryId: chatHistory._id,
      isExistingSession: false,
      messages: [],
    });
  } catch (error) {
    console.error("Chat initialization error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to initialize chat",
      error: error.message,
    });
  }
});

/**
 * POST /api/chat/message
 * Save a chat message
 */
router.post("/message", async (req, res) => {
  try {
    const { sessionId, mobile, message } = req.body;

    if (!sessionId || !mobile || !message) {
      return res.status(400).json({
        status: false,
        message: "sessionId, mobile, and message are required",
      });
    }

    // Find chat history by sessionId
    let chatHistory = await ChatHistory.findOne({ sessionId: sessionId });

    if (!chatHistory) {
      // If session not found, check for existing chat history by mobile
      let existingChatHistory = null;
      try {
        existingChatHistory = await ChatHistory.findOne({ 
          mobile: mobile.trim(),
          status: 'active'
        }).sort({ lastMessageAt: -1, createdAt: -1 });
      } catch (e) {
        console.error("Error searching existing chat history:", e);
      }

      // If user has existing chat, reuse it
      if (existingChatHistory) {
        console.log(`🔄 Reusing existing chat history for mobile: ${mobile.trim()}`);
        chatHistory = existingChatHistory;
        // Update sessionId to match the one being used
        chatHistory.sessionId = sessionId;
        await chatHistory.save();
      } else {
        // Create new session if not found
        chatHistory = await ChatHistory.create({
          mobile: mobile.trim(),
          email: '',
          candidateId: null,
          sessionId: sessionId,
          messages: [],
          totalMessages: 0,
          status: 'active',
          metadata: {
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || req.connection.remoteAddress || '',
            referrer: req.headers.referer || '',
          },
        });
      }
    }

    // Add message to array
    chatHistory.messages.push({
      role: message.role,
      content: message.content,
      isQA: message.isQA || false,
      jobs: message.jobs || [],
      timestamp: message.timestamp || new Date(),
    });

    // Update counters
    chatHistory.totalMessages = chatHistory.messages.length;
    chatHistory.lastMessageAt = new Date();
    chatHistory.status = 'active';

    await chatHistory.save();

    res.json({
      status: true,
      message: "Message saved successfully",
    });
  } catch (error) {
    console.error("Save message error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to save message",
      error: error.message,
    });
  }
});

/**
 * GET /api/chat/history
 * Get chat history for admin
 */
router.get("/history", async (req, res) => {
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

    const total = await ChatHistory.countDocuments(query);

    res.json({
      status: true,
      data: chatHistories,
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
 * GET /api/chat/session/:sessionId
 * Get specific chat session details
 */
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatHistory = await ChatHistory.findOne({ sessionId })
      .populate('candidateId', 'name mobile email')
      .lean();

    if (!chatHistory) {
      return res.status(404).json({
        status: false,
        message: "Chat session not found",
      });
    }

    res.json({
      status: true,
      data: chatHistory,
    });
  } catch (error) {
    console.error("Get chat session error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch chat session",
      error: error.message,
    });
  }
});

module.exports = router;

