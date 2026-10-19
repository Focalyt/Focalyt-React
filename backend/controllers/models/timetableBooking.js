const { Schema, model } = require('mongoose');

const timetableBookingSchema = new Schema({
  timetableDay: {
    type: Schema.Types.ObjectId,
    ref: 'TimetableDay',
    required: true,
    index: true,
  },
  batchSessionAssignment: {
    type: Schema.Types.ObjectId,
    ref: 'BatchSessionAssignment',
    required: true,
  },
  slotKeys: { type: [String], required: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['active', 'cleared'],
    default: 'active',
    index: true,
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  clearedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  clearedAt: { type: Date, default: null },
}, { timestamps: true });

// One active booking may hold several period keys. The multikey index rejects
// a second active booking that reuses any of those keys on the same day.
timetableBookingSchema.index(
  { timetableDay: 1, slotKeys: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

timetableBookingSchema.index(
  { batchSessionAssignment: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = model('TimetableBooking', timetableBookingSchema);
