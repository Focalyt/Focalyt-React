const { Schema, model } = require('mongoose');
const { ObjectId } = Schema.Types;

const courseActivitySchema = new Schema(
  {
    college: { type: ObjectId, ref: 'College', required: true, index: true },
    course: { type: ObjectId, ref: 'coursescopy', required: true, index: true },
    name: { type: String, trim: true, required: true },
    color: { type: String, trim: true, default: '#2563eb' },
    createdBy: { type: ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseActivitySchema.index({ college: 1, course: 1, isDeleted: 1, name: 1 });

module.exports = model('CourseActivity', courseActivitySchema);
