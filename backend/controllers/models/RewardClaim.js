const mongoose = require('mongoose');

const RewardClaimSchema = new mongoose.Schema({
  _candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  _rewardStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RewardStatus',
    required: true
  },
  rewardType: {
    type: String,
    enum: ['money', 'gift', 'trophy', 'voucher', 'other'],
    required: true
  },
  // Claim details based on reward type
  upiNumber: {
    type: String,
    trim: true,
    default: null
  },
  upiId: {
    type: String,
    trim: true,
    default: null
  },
  address: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  // Dynamic documents uploaded by candidate
  documents: [{
    documentName: {
      type: String,
      required: true
    },
    documentKey: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Feedback if required
  feedback: {
    type: String,
    trim: true,
    default: null
  },
  // Achievement image uploaded by candidate
  achievementImage: {
    type: String,
    trim: true,
    default: null
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Admin remarks
  adminRemarks: {
    type: String,
    trim: true,
    default: null
  },
  // Timestamps
  claimedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  disbursedAt: {
    type: Date,
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
RewardClaimSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RewardClaim', RewardClaimSchema);


