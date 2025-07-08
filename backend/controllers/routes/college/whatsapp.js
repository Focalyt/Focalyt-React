const express = require('express');
const router = express.Router();
const axios = require('axios');
const { College, WhatsAppMessage } = require('../../models');

// Middleware to check if college is authenticated
const authenticateCollege = async (req, res, next) => {
  try {
    if (!req.session.college) {
      return res.status(401).json({ status: false, message: 'College not authenticated' });
    }
    req.collegeId = req.session.college._id;
    next();
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Authentication error' });
  }
};

// Get WhatsApp connection status
router.get('/status', authenticateCollege, async (req, res) => {
  try {
    const college = await College.findById(req.collegeId);
    
    const status = {
      connected: !!(college.whatsappConfig?.accessToken),
      businessAccountId: college.whatsappConfig?.businessAccountId || null,
      phoneNumber: college.whatsappConfig?.phoneNumber || null,
      lastConnected: college.whatsappConfig?.lastConnected || null,
      messageCount: college.whatsappConfig?.messageCount || 0,
      
      // Facebook status
      facebookConnected: !!(college.whatsappConfig?.facebookAccessToken),
      facebookUserInfo: college.whatsappConfig?.facebookUserInfo || null,
      facebookBusinessAccounts: college.whatsappConfig?.facebookBusinessAccounts || []
    };

    res.json({ status: true, data: status });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    res.status(500).json({ status: false, message: 'Failed to get status' });
  }
});

// Get saved Facebook data
router.get('/facebook-data', authenticateCollege, async (req, res) => {
  try {
    const college = await College.findById(req.collegeId);
    
    if (!college.whatsappConfig?.facebookAccessToken) {
      return res.json({ 
        status: true, 
        data: { 
          connected: false,
          message: 'No Facebook data found'
        } 
      });
    }

    res.json({
      status: true,
      data: {
        connected: true,
        accessToken: college.whatsappConfig.facebookAccessToken,
        userInfo: college.whatsappConfig.facebookUserInfo,
        businessAccounts: college.whatsappConfig.facebookBusinessAccounts,
        lastConnected: college.whatsappConfig.lastConnected
      }
    });
  } catch (error) {
    console.error('Get Facebook data error:', error);
    res.status(500).json({ status: false, message: 'Failed to get Facebook data' });
  }
});

// Send WhatsApp message
router.post('/send-message', authenticateCollege, async (req, res) => {
  try {
    const { recipientPhone, message, templateId, variables, messageType = 'text' } = req.body;

    if (!recipientPhone || !message) {
      return res.status(400).json({ status: false, message: 'Recipient phone and message are required' });
    }

    const college = await College.findById(req.collegeId);
    
    if (!college.whatsappConfig?.accessToken) {
      return res.status(400).json({ status: false, message: 'WhatsApp not connected. Please setup first.' });
    }

    const accessToken = college.whatsappConfig.accessToken;
    const businessAccountId = college.whatsappConfig.businessAccountId;

    let messagePayload;

    if (messageType === 'template' && templateId) {
      // Template message
      messagePayload = {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
          name: templateId,
          language: {
            code: "en"
          },
          components: variables ? [{
            type: "body",
            parameters: variables.map(v => ({
              type: "text",
              text: v.value
            }))
          }] : []
        }
      };
    } else {
      // Text message
      messagePayload = {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "text",
        text: {
          body: message
        }
      };
    }

    // Send message via WhatsApp Business API
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${businessAccountId}/messages`,
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

          if (response.data.messages && response.data.messages[0]) {
        const messageId = response.data.messages[0].id;
        
        // Save message to database
        const whatsappMessage = new WhatsAppMessage({
          collegeId: req.collegeId,
          recipientPhone,
          message,
          messageType,
          templateId,
          variables,
          whatsappMessageId: messageId,
          status: 'sent',
          sentBy: req.session.college._id,
          sentAt: new Date()
        });
        await whatsappMessage.save();
        
        // Update college message count
        await College.findByIdAndUpdate(req.collegeId, {
          $inc: { 'whatsappConfig.messageCount': 1 },
          $set: { 'whatsappConfig.lastMessageSent': new Date() }
        });

        // Send WebSocket notification
        if (global.wsServer) {
          global.wsServer.sendWhatsAppNotification(req.collegeId, {
            type: 'message_sent',
            messageId,
            recipientPhone,
            status: 'sent',
            timestamp: new Date().toISOString()
          });
        }

        res.json({
          status: true,
          message: 'Message sent successfully',
          data: {
            messageId,
            status: 'sent'
          }
        });
      } else {
        throw new Error('Failed to send message');
      }

  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    
    // Send WebSocket error notification
    if (global.wsServer) {
      global.wsServer.sendWhatsAppNotification(req.collegeId, {
        type: 'message_error',
        error: error.message,
        recipientPhone: req.body.recipientPhone,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({ 
      status: false, 
      message: 'Failed to send message',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Send bulk messages
router.post('/send-bulk-messages', authenticateCollege, async (req, res) => {
  try {
    const { recipients, message, templateId, variables, messageType = 'text' } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ status: false, message: 'Recipients array is required' });
    }

    if (!message) {
      return res.status(400).json({ status: false, message: 'Message is required' });
    }

    const college = await College.findById(req.collegeId);
    
    if (!college.whatsappConfig?.accessToken) {
      return res.status(400).json({ status: false, message: 'WhatsApp not connected. Please setup first.' });
    }

    const results = [];
    const accessToken = college.whatsappConfig.accessToken;
    const businessAccountId = college.whatsappConfig.businessAccountId;

    // Send messages to each recipient
    for (const recipientPhone of recipients) {
      try {
        let messagePayload;

        if (messageType === 'template' && templateId) {
          messagePayload = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "template",
            template: {
              name: templateId,
              language: {
                code: "en"
              },
              components: variables ? [{
                type: "body",
                parameters: variables.map(v => ({
                  type: "text",
                  text: v.value
                }))
              }] : []
            }
          };
        } else {
          messagePayload = {
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "text",
            text: {
              body: message
            }
          };
        }

        const response = await axios.post(
          `https://graph.facebook.com/v18.0/${businessAccountId}/messages`,
          messagePayload,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.messages && response.data.messages[0]) {
          results.push({
            recipientPhone,
            status: 'success',
            messageId: response.data.messages[0].id
          });
        } else {
          results.push({
            recipientPhone,
            status: 'failed',
            error: 'No message ID returned'
          });
        }

      } catch (error) {
        results.push({
          recipientPhone,
          status: 'failed',
          error: error.response?.data?.error?.message || error.message
        });
      }
    }

    // Update college message count
    const successCount = results.filter(r => r.status === 'success').length;
    await College.findByIdAndUpdate(req.collegeId, {
      $inc: { 'whatsappConfig.messageCount': successCount },
      $set: { 'whatsappConfig.lastBulkMessageSent': new Date() }
    });

    // Send WebSocket notification
    if (global.wsServer) {
      global.wsServer.sendWhatsAppNotification(req.collegeId, {
        type: 'bulk_message_completed',
        totalRecipients: recipients.length,
        successCount,
        failedCount: recipients.length - successCount,
        results,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: true,
      message: `Bulk messages sent. ${successCount} successful, ${recipients.length - successCount} failed.`,
      data: {
        totalRecipients: recipients.length,
        successCount,
        failedCount: recipients.length - successCount,
        results
      }
    });

  } catch (error) {
    console.error('Send bulk WhatsApp messages error:', error);
    res.status(500).json({ 
      status: false, 
      message: 'Failed to send bulk messages',
      error: error.message
    });
  }
});

// Get message status
router.get('/message-status/:messageId', authenticateCollege, async (req, res) => {
  try {
    const { messageId } = req.params;
    const college = await College.findById(req.collegeId);
    
    if (!college.whatsappConfig?.accessToken) {
      return res.status(400).json({ status: false, message: 'WhatsApp not connected' });
    }

    const accessToken = college.whatsappConfig.accessToken;

    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    res.json({
      status: true,
      data: response.data
    });

  } catch (error) {
    console.error('Get message status error:', error);
    res.status(500).json({ 
      status: false, 
      message: 'Failed to get message status',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Save Facebook token and user info
router.post('/save-facebook-token', authenticateCollege, async (req, res) => {
  try {
    const { accessToken, userInfo, businessAccounts } = req.body;

    if (!accessToken) {
      return res.status(400).json({ status: false, message: 'Access token is required' });
    }

    // Update college with Facebook token and user info
    const updateData = {
      'whatsappConfig.facebookAccessToken': accessToken,
      'whatsappConfig.facebookUserInfo': userInfo,
      'whatsappConfig.facebookBusinessAccounts': businessAccounts,
      'whatsappConfig.lastConnected': new Date(),
      'whatsappConfig.isActive': true
    };

    await College.findByIdAndUpdate(req.collegeId, updateData);

    // Send WebSocket notification
    if (global.wsServer) {
      global.wsServer.sendWhatsAppNotification(req.collegeId, {
        type: 'facebook_connected',
        message: 'Facebook account connected successfully',
        userInfo: userInfo,
        businessAccounts: businessAccounts,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: true,
      message: 'Facebook token saved successfully',
      data: {
        userInfo,
        businessAccountsCount: businessAccounts?.length || 0
      }
    });

  } catch (error) {
    console.error('Save Facebook token error:', error);
    res.status(500).json({ status: false, message: 'Failed to save Facebook token' });
  }
});

// Clear Facebook data
router.post('/clear-facebook-data', authenticateCollege, async (req, res) => {
  try {
    // Clear Facebook data from college
    const updateData = {
      'whatsappConfig.facebookAccessToken': null,
      'whatsappConfig.facebookUserInfo': null,
      'whatsappConfig.facebookBusinessAccounts': [],
      'whatsappConfig.isActive': false
    };

    await College.findByIdAndUpdate(req.collegeId, updateData);

    // Send WebSocket notification
    if (global.wsServer) {
      global.wsServer.sendWhatsAppNotification(req.collegeId, {
        type: 'facebook_disconnected',
        message: 'Facebook account disconnected',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: true,
      message: 'Facebook data cleared successfully'
    });

  } catch (error) {
    console.error('Clear Facebook data error:', error);
    res.status(500).json({ status: false, message: 'Failed to clear Facebook data' });
  }
});

// Save WhatsApp configuration
router.post('/save-config', authenticateCollege, async (req, res) => {
  try {
    const { accessToken, businessAccountId, phoneNumber } = req.body;

    if (!accessToken || !businessAccountId) {
      return res.status(400).json({ status: false, message: 'Access token and business account ID are required' });
    }

    const updateData = {
      'whatsappConfig.accessToken': accessToken,
      'whatsappConfig.businessAccountId': businessAccountId,
      'whatsappConfig.lastConnected': new Date()
    };

    if (phoneNumber) {
      updateData['whatsappConfig.phoneNumber'] = phoneNumber;
    }

    await College.findByIdAndUpdate(req.collegeId, updateData);

    // Send WebSocket notification
    if (global.wsServer) {
      global.wsServer.sendWhatsAppNotification(req.collegeId, {
        type: 'config_updated',
        message: 'WhatsApp configuration saved successfully',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: true,
      message: 'WhatsApp configuration saved successfully'
    });

  } catch (error) {
    console.error('Save WhatsApp config error:', error);
    res.status(500).json({ status: false, message: 'Failed to save configuration' });
  }
});

// Get message history
router.get('/message-history', authenticateCollege, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get messages from database
    const messages = await WhatsAppMessage.find({ collegeId: req.collegeId })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sentBy', 'name email');

    const total = await WhatsAppMessage.countDocuments({ collegeId: req.collegeId });

    res.json({
      status: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get message history error:', error);
    res.status(500).json({ status: false, message: 'Failed to get message history' });
  }
});

// Get connected clients (for debugging)
router.get('/connected-clients', authenticateCollege, async (req, res) => {
  try {
    if (!global.wsServer) {
      return res.json({ status: true, data: { clients: [], rooms: [] } });
    }

    const clients = global.wsServer.getConnectedClients();
    const collegeRoom = global.wsServer.getRoomInfo(req.collegeId);

    res.json({
      status: true,
      data: {
        clients,
        collegeRoom
      }
    });

  } catch (error) {
    console.error('Get connected clients error:', error);
    res.status(500).json({ status: false, message: 'Failed to get connected clients' });
  }
});

module.exports = router; 