// models/Status.js
const mongoose = require('mongoose');



// Status Schema
const StatusLogsSchema = new mongoose.Schema({
  _appliedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppliedCourses',
    required: true
  },
  _courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  vertical: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vertical',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  _centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
  },
  _batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  _statusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
  },
  _subStatusId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  _collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  counsellor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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