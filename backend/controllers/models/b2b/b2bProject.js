const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const B2BProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  department: { type: ObjectId, ref: 'B2BDepartment', required: true },
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true
});

B2BProjectSchema.index({ name: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('B2BProject', B2BProjectSchema);
