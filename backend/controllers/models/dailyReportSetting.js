const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const fieldSchema = new Schema({
  key: { type: String, default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  options: { type: [String], default: [] },
  portalKey: { type: String, default: '' },
  fileKind: { type: String, default: 'image' },
  maxFiles: { type: Number, default: 1 },
}, { _id: false });

const dailyReportSettingSchema = new Schema({
  college: { type: ObjectId, ref: 'College', index: true },
  name: { type: String, default: 'Daily trainer report' },
  enabled: { type: Boolean, default: true },
  attachedFields: { type: [String], default: [] },
  vertical: { type: ObjectId, ref: 'Vertical', default: null },
  verticalName: { type: String, default: '' },
  verticals: { type: [ObjectId], ref: 'Vertical', default: [] },
  verticalNames: { type: [String], default: [] },
  project: { type: ObjectId, ref: 'Project', default: null },
  projectName: { type: String, default: '' },
  projects: { type: [ObjectId], ref: 'Project', default: [] },
  projectNames: { type: [String], default: [] },
  center: { type: ObjectId, ref: 'Center', default: null },
  centerName: { type: String, default: '' },
  centers: { type: [ObjectId], ref: 'Center', default: [] },
  centerNames: { type: [String], default: [] },
  course: { type: ObjectId, ref: 'courses', default: null },
  courseName: { type: String, default: '' },
  courses: { type: [ObjectId], ref: 'courses', default: [] },
  courseNames: { type: [String], default: [] },
  batches: { type: [ObjectId], ref: 'Batch', default: [] },
  batchNames: { type: [String], default: [] },
  trainers: { type: [ObjectId], ref: 'User', default: [] },
  trainerNames: { type: [String], default: [] },
  fields: { type: [fieldSchema], default: [] },
}, { timestamps: true });

dailyReportSettingSchema.index({ college: 1, course: 1 });

module.exports = model('DailyReportSetting', dailyReportSettingSchema);
