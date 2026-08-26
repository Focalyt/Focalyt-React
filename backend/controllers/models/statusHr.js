// models/statusHr.js
const mongoose = require('mongoose');

const HrSubstatusSchema = new mongoose.Schema({
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

const StatusHrSchema = new mongoose.Schema({
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
  substatuses: [HrSubstatusSchema],
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
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

StatusHrSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StatusHr', StatusHrSchema);
