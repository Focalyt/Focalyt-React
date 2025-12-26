// models/Status.js
const mongoose = require('mongoose');

// Substatus Schema
const SubstatusSchema = new mongoose.Schema({
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

// Status Schema
const StatusSchema = new mongoose.Schema({
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
  index: {
    type: Number,
    required: true
  },
  substatuses: [SubstatusSchema],
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
StatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Status', StatusSchema);