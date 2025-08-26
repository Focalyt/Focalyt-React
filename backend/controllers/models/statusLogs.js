// models/Status.js
const mongoose = require('mongoose');



// Status Schema
const StatusLogsSchema = new mongoose.Schema({
  _appliedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppliedCourses',
    required: true
  },
  _statusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
  },
  _subStatusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubStatus',
  },
  _collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  counsellor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counsellor',
    required: true
  },
  kycStage: {
    type: Boolean,
    default: false
  },
  kycApproved: {
    type: Boolean,
    default: false
  },
  admissionStatus: {
    type: Boolean,
    default: false
  },
  batchAssigned: {
    type: Boolean,
    default: false
  },
  zeroPeriodAssigned: {
    type: Boolean,
    default: false
  },
  batchFreezed: {
    type: Boolean,
    default: false
  },
  dropOut: {
    type: Boolean,
    default: false
  },
 
}, { timestamps: true });

module.exports = mongoose.model('StatusLogs', StatusLogsSchema);