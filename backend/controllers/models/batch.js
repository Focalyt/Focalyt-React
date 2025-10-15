const mongoose = require('mongoose');
const { Schema, Types, ObjectId } = mongoose;

const BatchSchema = new Schema({
  name: { type: String, required: true },
  instructor :{ type: String, required: true },
  description : { type: String},
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  zeroPeriodStartDate: { type: Date, required: true },
  zeroPeriodEndDate: { type: Date, required: true },
  maxStudents: { type: Number, default: 0 },
  trainers: [ { type: ObjectId, ref: 'User' } ],
  status: { type: String, enum: ['active', 'completed', 'inactive'], default: 'active' },
  courseId: { type: Types.ObjectId, ref: 'Course', required: true },
  centerId: { type: Types.ObjectId, ref: 'Center', required: true },
  createdBy: { type: Types.ObjectId, ref: 'User' },
  approvedBy: { type: Types.ObjectId, ref: 'User' },
  college: { type: Types.ObjectId, ref: 'College' }
}, { timestamps: true });

module.exports = mongoose.model('Batch', BatchSchema);
