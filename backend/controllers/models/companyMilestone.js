const mongoose = require('mongoose');

const CompanyMilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  index: { type: Number, default: 0 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
}, { timestamps: true });

CompanyMilestoneSchema.index({ company: 1, title: 1 });

module.exports = mongoose.model('CompanyMilestone', CompanyMilestoneSchema);
