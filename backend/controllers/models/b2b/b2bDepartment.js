const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const B2BDepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true
});

module.exports = mongoose.model('B2BDepartment', B2BDepartmentSchema);
