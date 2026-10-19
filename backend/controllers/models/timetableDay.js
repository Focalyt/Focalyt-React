const { Schema, model } = require('mongoose');

const slotSchema = new Schema({
  key: { type: String, required: true },
  type: { type: String, enum: ['period', 'lunch'], required: true },
  label: { type: String, default: '' },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  minutes: { type: Number, required: true },
}, { _id: false });

const timetableDaySchema = new Schema({
  college: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  template: { type: Schema.Types.ObjectId, ref: 'TimetableTemplate', required: true },
  dateKey: { type: String, required: true, trim: true },
  track: {
    type: String,
    enum: ['course', 'placement', 'club'],
    required: true,
  },
  mode: {
    type: String,
    enum: ['period', 'full'],
    required: true,
  },
  dayStart: { type: String, required: true, trim: true },
  dayEnd: { type: String, required: true, trim: true },
  periodCount: { type: Number, required: true },
  periodMinutes: { type: Number, required: true },
  lunchStart: { type: String, default: '', trim: true },
  lunchEnd: { type: String, default: '', trim: true },
  totalStudyMinutes: { type: Number, required: true },
  slots: { type: [slotSchema], default: [] },
  occupiedSlots: { type: [String], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

timetableDaySchema.index({ batch: 1, dateKey: 1, track: 1 }, { unique: true });
timetableDaySchema.index({ college: 1, batch: 1, dateKey: 1 });

module.exports = model('TimetableDay', timetableDaySchema);
