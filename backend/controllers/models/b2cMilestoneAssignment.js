const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// One row per project and milestone: this milestone is used in this B2C project.
const B2cMilestoneAssignmentSchema = new mongoose.Schema({
  college: { type: ObjectId, ref: 'College', required: true },
  // The project's department (vertical), stored for filtering
  department: { type: ObjectId, ref: 'Vertical', required: true },
  project: { type: ObjectId, ref: 'Project', required: true },
  milestone: { type: ObjectId, ref: 'B2cMilestone', required: true },
  // Position of this milestone in this project. Same value across a department until that project is ordered on its own.
  index: { type: Number },
  // True after this project is ordered on its own. Department reorders leave it alone.
  customOrder: { type: Boolean, default: false },
  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

B2cMilestoneAssignmentSchema.index({ college: 1, project: 1, milestone: 1 }, { unique: true });
B2cMilestoneAssignmentSchema.index({ college: 1, project: 1, index: 1 });
B2cMilestoneAssignmentSchema.index({ milestone: 1 });

module.exports = mongoose.model('B2cMilestoneAssignment', B2cMilestoneAssignmentSchema);
