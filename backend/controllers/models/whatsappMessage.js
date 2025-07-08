const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const whatsappMessageSchema = new Schema({
  collegeId: { 
    type: ObjectId, 
    ref: 'College', 
    required: true 
  },
  
  // Message details
  recipientPhone: { 
    type: String, 
    required: true 
  },
  
  message: { 
    type: String, 
    required: true 
  },
  
  messageType: { 
    type: String, 
    enum: ['text', 'template', 'media'], 
    default: 'text' 
  },
  
  templateId: { 
    type: String 
  },
  
  variables: [{ 
    name: String, 
    value: String 
  }],
  
  // WhatsApp API response
  whatsappMessageId: { 
    type: String 
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'], 
    default: 'pending' 
  },
  
  // Error details if failed
  error: { 
    code: String, 
    message: String 
  },
  
  // Metadata
  sentBy: { 
    type: ObjectId, 
    ref: 'User' 
  },
  
  sentAt: { 
    type: Date, 
    default: Date.now 
  },
  
  deliveredAt: { 
    type: Date 
  },
  
  readAt: { 
    type: Date 
  },
  
  // For bulk messages
  bulkMessageId: { 
    type: String 
  },
  
  isBulkMessage: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
whatsappMessageSchema.index({ collegeId: 1, sentAt: -1 });
whatsappMessageSchema.index({ recipientPhone: 1 });
whatsappMessageSchema.index({ status: 1 });
whatsappMessageSchema.index({ whatsappMessageId: 1 });

module.exports = model('WhatsAppMessage', whatsappMessageSchema); 