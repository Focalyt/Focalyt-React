const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const sessionFeedbackSchema = new Schema(
  {
    session: { type: ObjectId, ref: 'TrainingSession', required: true },
    batch: { type: ObjectId, ref: 'Batch', required: true },
    appliedCourse: { type: ObjectId, ref: 'AppliedCourses', required: true },
    candidate: { type: ObjectId, ref: 'CandidateProfile' },
    college: { type: ObjectId, ref: 'College' },
    studentName: { type: String, trim: true, default: 'Student' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

sessionFeedbackSchema.index({ session: 1, appliedCourse: 1 }, { unique: true });
sessionFeedbackSchema.index({ batch: 1, session: 1 });
sessionFeedbackSchema.index({ candidate: 1, session: 1 });

module.exports = model('SessionFeedback', sessionFeedbackSchema);
