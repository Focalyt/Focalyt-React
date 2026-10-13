const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// A B2C lead milestone. Global until it is aligned to projects through B2cMilestoneAssignment.
// index is only the order the milestone was created in. Flow position is assignment.index on each project.
const B2cMilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  index: { type: Number, default: 0 },
  college: { type: ObjectId, ref: 'College', required: true },
  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

B2cMilestoneSchema.index({ college: 1, index: 1 });

module.exports = mongoose.model('B2cMilestone', B2cMilestoneSchema);
