const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const B2BProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  /** @deprecated Prefer `departments`. Kept synced to departments[0] for legacy reads. */
  department: { type: ObjectId, ref: 'B2BDepartment' },
  /** Many-to-many: one project can belong to multiple departments */
  departments: [{ type: ObjectId, ref: 'B2BDepartment' }],
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true
});

B2BProjectSchema.pre('validate', function syncPrimaryDepartment(next) {
  const list = Array.isArray(this.departments)
    ? this.departments.filter(Boolean)
    : [];
  if (list.length > 0) {
    this.departments = list;
    this.department = list[0];
  } else if (this.department) {
    this.departments = [this.department];
  }
  next();
});

B2BProjectSchema.index({ name: 1 });
B2BProjectSchema.index({ departments: 1 });
B2BProjectSchema.index({ department: 1 });

module.exports = mongoose.model('B2BProject', B2BProjectSchema);
