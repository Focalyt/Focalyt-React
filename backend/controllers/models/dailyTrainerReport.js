const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const fileSchema = new Schema({
  fileName: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
}, { _id: true });

const answerSchema = new Schema({
  key: { type: String, default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  value: { type: String, default: '' },
  files: { type: [fileSchema], default: [] },
}, { _id: false });

const dailyTrainerReportSchema = new Schema({
  college: { type: ObjectId, ref: 'College', index: true },
  trainer: { type: ObjectId, ref: 'User', index: true },
  trainerName: { type: String, default: '' },
  template: { type: ObjectId, ref: 'DailyReportSetting', default: null },
  reportDateKey: { type: String, default: '' },
  reportDate: { type: Date, default: null },
  batch: { type: ObjectId, ref: 'Batch', default: null },
  batchCode: { type: String, default: '' },
  course: { type: ObjectId, ref: 'courses', default: null },
  courseName: { type: String, default: '' },
  jobRole: { type: String, default: '' },
  project: { type: ObjectId, ref: 'Project', default: null },
  projectName: { type: String, default: '' },
  verticalName: { type: String, default: '' },
  center: { type: ObjectId, ref: 'Center', default: null },
  centerName: { type: String, default: '' },
  answers: { type: [answerSchema], default: [] },
  inTime: { type: String, default: '' },
  outTime: { type: String, default: '' },
  batchSize: { type: Number, default: 0 },
  totalPresent: { type: Number, default: 0 },
  totalAbsent: { type: Number, default: 0 },
  manualAttendanceUpdated: { type: String, default: 'No' },
  topic: { type: String, default: '' },
  softSkillTopic: { type: String, default: '' },
  internalAssessment: { type: String, default: 'No' },
  activityTopic: { type: String, default: '' },
  manualAttendanceFiles: { type: [fileSchema], default: [] },
  morningPhotos: { type: [fileSchema], default: [] },
  morningVideo: { type: [fileSchema], default: [] },
  afternoonPhotos: { type: [fileSchema], default: [] },
  afternoonVideo: { type: [fileSchema], default: [] },
  eveningPhotos: { type: [fileSchema], default: [] },
  eveningGroupPhoto: { type: [fileSchema], default: [] },
  assessmentFiles: { type: [fileSchema], default: [] },
  activityProofs: { type: [fileSchema], default: [] },
}, { timestamps: true });

dailyTrainerReportSchema.index({ trainer: 1, batch: 1, reportDateKey: 1 }, { unique: true });

module.exports = model('DailyTrainerReport', dailyTrainerReportSchema);
