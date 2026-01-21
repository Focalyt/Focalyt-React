const mongoose = require('mongoose');

// Reward Document Requirement Schema
const RewardDocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mandatory: {
    type: Boolean,
    default: false
  },
  status: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Reward Substatus Schema
const RewardSubstatusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  hasRemarks: {
    type: Boolean,
    default: false
  },
  hasFollowup: {
    type: Boolean,
    default: false
  },
  hasAttachment: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Reward Status Schema
const RewardStatusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  milestone: {
    type: String,
    trim: true
  },
  rewardType: {
    type: String,
    enum: ['money', 'gift', 'trophy', 'voucher', 'other'],
    default: 'other',
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  substatuses: [RewardSubstatusSchema],
  // Dynamic requirements for reward claim
  requiredDocuments: [RewardDocumentSchema],
  requiresFeedback: {
    type: Boolean,
    default: false
  },
  feedbackLabel: {
    type: String,
    trim: true,
    default: 'Feedback'
  },
  // NOTE: Keep legacy `college` for backward compatibility with existing data.
  // New targeting should use `candidate`. Older docs may only have `college`.
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: false,
    default: null
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field on save
RewardStatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RewardStatus', RewardStatusSchema);