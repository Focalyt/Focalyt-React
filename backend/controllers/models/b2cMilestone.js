const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// One B2C milestone for one project. Another project gets its own document, even with the same title.
// index is unused for the flow. Position is B2cMilestoneAssignment.index on that project.
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
