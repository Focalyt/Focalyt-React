const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const B2BDepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  project: { type: ObjectId, ref: 'B2BProject', required: true },
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true
});

B2BDepartmentSchema.index({ name: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('B2BDepartment', B2BDepartmentSchema);
