const mongoose = require('mongoose');

const ApprovalRequestSchema = new mongoose.Schema({
  type: { 
    type: String,
    required: true
  },

  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },

  requestDate: { 
    type: Date, 
    default: Date.now 
  },

  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },

  requestDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedDate: { type: Date },

  rejectedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  rejectedDate: { type: Date },
  rejectionReason: { type: String },

  comments: { type: String }
});

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);
