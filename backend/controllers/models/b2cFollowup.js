const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const B2cFollowupSchema = new Schema({
  appliedCourseId: { type: Types.ObjectId, ref: 'AppliedCourses', required: true },
  collegeId: { type: Types.ObjectId, ref: 'College', required: true },
  followupDate: { type: Date, required: true },

  status: { type: String, enum: ['planned', 'missed', 'done'], default: 'planned' },
  updatedBy: { type: Types.ObjectId, ref: 'User' },
  statusUpdatedAt: { type: Date },
  counsellorId: { type: Types.ObjectId, ref: 'User' },
  remarks : { type: String },
  createdBy: { type: Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('B2cFollowup', B2cFollowupSchema);
