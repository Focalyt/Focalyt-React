const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const B2cFollowupSchema = new Schema({
  appliedCourseId: { type: Types.ObjectId, ref: 'AppliedCourses', required: true },
  collegeId: { type: Types.ObjectId, ref: 'College', required: true },
  followupDate: { type: Date, required: true },
  followUpType: { type: String, enum: ['Call', 'Visit'], default: 'Call' },

  status: { type: String, enum: ['planned', 'missed', 'done'], default: 'planned' },
  updatedBy: { type: Types.ObjectId, ref: 'User' },
  statusUpdatedAt: { type: Date },
  counsellorId: { type: Types.ObjectId, ref: 'User' },
  googleCalendarEventId: { type: String },
  remarks : { type: String },
  createdBy: { type: Types.ObjectId, ref: 'User' },
}, { timestamps: true });

B2cFollowupSchema.index({ appliedCourseId: 1, status: 1, followupDate: -1 });
B2cFollowupSchema.index({ counsellorId: 1, status: 1 });
B2cFollowupSchema.index({ createdBy: 1, status: 1 });
B2cFollowupSchema.index({ collegeId: 1, status: 1 });

module.exports = mongoose.model('B2cFollowup', B2cFollowupSchema);
