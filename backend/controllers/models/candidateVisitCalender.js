const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const CandidateVisitCalenderSchema = new Schema({
  appliedCourse: { type: Types.ObjectId, ref: 'AppliedCourse', required: true },
  visitDate: { type: Date, required: true },

  visitType: { type: String, enum: ['Visit', 'Joining', 'Both'], default: 'Visit' },

  status: { type: String, enum: ['pending', 'reached', 'cancelled'], default: 'pending' },
  updatedBy: { type: Types.ObjectId, ref: 'User' },
  statusUpdatedAt: { type: Date },
  remarks : { type: String },
  createdBy: { type: Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CandidateVisitCalender', CandidateVisitCalenderSchema);
