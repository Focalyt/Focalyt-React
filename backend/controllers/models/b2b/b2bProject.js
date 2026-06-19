const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const { getProjectDepartmentIds } = require('./b2bProjectHelpers');

const B2BProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  departments: [{ type: ObjectId, ref: 'B2BDepartment' }],
  /** @deprecated use departments — kept for legacy reads */
  department: { type: ObjectId, ref: 'B2BDepartment' },
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true
});

B2BProjectSchema.index({ name: 1 }, { unique: true });
B2BProjectSchema.index({ departments: 1 });
B2BProjectSchema.index({ department: 1 });

B2BProjectSchema.pre('save', function syncDepartments(next) {
  const ids = getProjectDepartmentIds(this);
  if (ids.length) {
    this.departments = ids.map((id) => new mongoose.Types.ObjectId(id));
    this.department = this.departments[0];
  }
  next();
});

module.exports = mongoose.model('B2BProject', B2BProjectSchema);
