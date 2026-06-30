const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const DocumentSchema = new Schema(
  {
    name: { type: String, trim: true },
    type: {
      type: String,
      enum: ['Document', 'Image', 'Video', 'PDF'],
      default: 'Document',
    },
    status: {
      type: String,
      enum: ['Pending', 'Uploaded'],
      default: 'Pending',
    },
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
  },
  { _id: true }
);

const trainingSessionSchema = new Schema(
  {
    batch: { type: ObjectId, ref: 'Batch', required: true },
    college: { type: ObjectId, ref: 'College', required: true },
    course: { type: ObjectId, ref: 'courses' },
    center: { type: ObjectId, ref: 'Center' },

    title: { type: String, required: true, trim: true },
    topicCovered: { type: String, trim: true, default: '' },
    trainingMethod: { type: String, trim: true, default: '' },
    sessionDate: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    notes: { type: String, trim: true, default: '' },
    evidenceDocs: [DocumentSchema],

    totalCandidates: { type: Number, default: 0 },
    presentCandidates: { type: Number, default: 0 },
    absentCandidates: { type: Number, default: 0 },
    attendancePercent: { type: Number, default: 0 },

    trainer: { type: ObjectId, ref: 'User' },
    createdBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

trainingSessionSchema.index({ batch: 1, sessionDate: -1 });
trainingSessionSchema.index({ college: 1, sessionDate: -1 });
trainingSessionSchema.index({ trainer: 1, sessionDate: -1 });

module.exports = model('TrainingSession', trainingSessionSchema);
