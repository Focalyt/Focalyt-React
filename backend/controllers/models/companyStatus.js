const mongoose = require('mongoose');

const CompanySubstatusSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  hasRemarks: { type: Boolean, default: false },
  hasFollowup: { type: Boolean, default: false },
  hasAttachment: { type: Boolean, default: false },
}, { timestamps: true });

const CompanyStatusSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  index: { type: Number, default: 0 },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyMilestone', default: null },
  substatuses: { type: [CompanySubstatusSchema], default: [] },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
}, { timestamps: true });

CompanyStatusSchema.index({ company: 1, title: 1 });

module.exports = mongoose.model('CompanyStatus', CompanyStatusSchema);
