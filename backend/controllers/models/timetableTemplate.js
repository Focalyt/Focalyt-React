const { Schema, model } = require('mongoose');

const timetableTemplateSchema = new Schema({
  college: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  name: { type: String, required: true, trim: true },
  track: {
    type: String,
    enum: ['course', 'placement', 'club'],
    default: 'course',
  },
  mode: {
    type: String,
    enum: ['period', 'full'],
    default: 'period',
  },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  periodCount: { type: Number, required: true },
  periodMinutes: { type: Number, required: true },
  lunchStart: { type: String, default: '', trim: true },
  lunchEnd: { type: String, default: '', trim: true },
  center: { type: Schema.Types.ObjectId, ref: 'Center', default: null },
  course: { type: Schema.Types.ObjectId, ref: 'courses', default: null },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

timetableTemplateSchema.index({ college: 1, isDeleted: 1, isDefault: 1 });

module.exports = model('TimetableTemplate', timetableTemplateSchema);
