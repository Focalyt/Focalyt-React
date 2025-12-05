const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const jobOfferSchema = new mongoose.Schema({
  college: { type: ObjectId, ref: 'College', required: true },
  createdBy: { type: ObjectId, ref: 'User', required: true },
  placement: { type: ObjectId, ref: 'Placement' },
  _candidate: { type: ObjectId, ref: 'CandidateProfile' },
  _job: { type: ObjectId, ref: 'Vacancy' },
  _company: { type: ObjectId, ref: 'Company' },
  _course: { type: ObjectId, ref: 'Course' },

  title: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  displayCompanyName: { type: String, trim: true },
  _qualification: { type: ObjectId, ref: 'Qualification' },
  _industry: { type: ObjectId, ref: 'Industry' },
  state: { type: ObjectId, ref: 'State' },
  city: { type: ObjectId, ref: 'City' },
  validity: { type: Date },
  jobDescription: { type: String, trim: true },
  requirement: { type: String, trim: true },
  noOfPosition: { type: Number, default: 1 },
  _jobCategory: { type: ObjectId, ref: 'JobCategory' },

  status: { type: String, default: 'draft', enum: ['draft', 'offered', 'active', 'closed'] },
  isActive: { type: Boolean, default: true },
  remarks: { type: String, trim: true },
  candidateResponse: { type: String, enum: ['accepted', 'rejected', null], default: null },
  respondedAt: { type: Date },

  // Activity log
  logs: [{
    user: { type: ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    action: { type: String, trim: true },
    remarks: { type: String, trim: true }
  }]
}, { timestamps: true })

module.exports = mongoose.model('JobOffer', jobOfferSchema);

