const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// A B2B lead milestone. Global until it is aligned to projects through B2bMilestoneAssignment.
const B2bMilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  index: { type: Number, default: 0 },
  college: { type: ObjectId, ref: 'College', required: true },
  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

B2bMilestoneSchema.index({ college: 1, index: 1 });

module.exports = mongoose.model('B2bMilestone', B2bMilestoneSchema);
