const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// One row per project and milestone: this milestone is used in this B2B project.
const B2bMilestoneAssignmentSchema = new mongoose.Schema({
  college: { type: ObjectId, ref: 'College', required: true },
  // The project's first department, stored for filtering
  department: { type: ObjectId, ref: 'B2BDepartment', default: null },
  project: { type: ObjectId, ref: 'B2BProject', required: true },
  milestone: { type: ObjectId, ref: 'B2bMilestone', required: true },
  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

B2bMilestoneAssignmentSchema.index({ college: 1, project: 1, milestone: 1 }, { unique: true });
B2bMilestoneAssignmentSchema.index({ milestone: 1 });

module.exports = mongoose.model('B2bMilestoneAssignment', B2bMilestoneAssignmentSchema);
