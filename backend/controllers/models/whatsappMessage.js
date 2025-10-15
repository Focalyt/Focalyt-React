const mongoose = require('mongoose');

const whatsappMessageSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  to: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'template', 'image', 'video', 'document'],
    default: 'text'
  },
  templateName: {
    type: String,
    default: null
  },
  templateData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  whatsappMessageId: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    default: null
  },
  candidateName: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
whatsappMessageSchema.index({ collegeId: 1, to: 1, sentAt: -1 });
whatsappMessageSchema.index({ status: 1 });
whatsappMessageSchema.index({ messageType: 1 });

module.exports = mongoose.model('WhatsAppMessage', whatsappMessageSchema);
