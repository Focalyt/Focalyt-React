const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const sessionAttendanceSchema = new Schema(
  {
    session: { type: ObjectId, ref: 'TrainingSession', required: true },
    batch: { type: ObjectId, ref: 'Batch', required: true },
    appliedCourse: { type: ObjectId, ref: 'AppliedCourses', required: true },
    candidate: { type: ObjectId, ref: 'CandidateProfile' },

    status: {
      type: String,
      enum: ['Present', 'Absent', 'Not Marked'],
      default: 'Not Marked',
    },

    remarks: { type: String, trim: true, default: '' },

    markedBy: { type: ObjectId, refPath: 'markedByModel' },
    markedByModel: {
      type: String,
      enum: ['User', 'CandidateProfile'],
    },
    markedByRole: {
      type: String,
      enum: ['trainer', 'student'],
    },
    markedAt: { type: Date },

    // Date-only field for same-day uniqueness (time stripped)
    attendanceDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// One student = one record per session
sessionAttendanceSchema.index({ session: 1, appliedCourse: 1 }, { unique: true });

// Same student = one marked attendance per batch per day
sessionAttendanceSchema.index(
  { batch: 1, appliedCourse: 1, attendanceDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Present', 'Absent'] } },
  }
);

sessionAttendanceSchema.index({ batch: 1, attendanceDate: -1 });
sessionAttendanceSchema.index({ appliedCourse: 1, attendanceDate: -1 });
sessionAttendanceSchema.index({ candidate: 1, attendanceDate: -1 });

module.exports = model('SessionAttendance', sessionAttendanceSchema);
