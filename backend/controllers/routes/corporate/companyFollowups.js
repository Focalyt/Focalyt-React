const mongoose = require('mongoose');
const { Company, AppliedJobs } = require('../../models');

function serializeApplication(application) {
  return {
    id: String(application._id), jobTitle: application._job?.title || 'Job unavailable',
    followups: (application.companyFollowups || []).map(item => ({
      id: String(item._id), type: item.type, followupDate: item.followupDate,
      remarks: item.remarks || '',
      status: item.status === 'planned' && new Date(item.followupDate) < new Date() ? 'missed' : item.status,
      createdAt: item.createdAt, completedAt: item.completedAt || null,
    })),
  };
}

async function companyFor(req) {
  return Company.findOne({ _concernPerson: req.companyUser, status: { $ne: false }, isDeleted: { $ne: true } })
    .select('_id').lean();
}
function validId(value) { return typeof value === 'string' && mongoose.isValidObjectId(value); }

exports.list = async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  if (!validId(req.params.candidateId)) return res.status(400).json({ message: 'Invalid candidate.' });
  try {
    const company = await companyFor(req);
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const applications = await AppliedJobs.find({ _company: company._id, _candidate: req.params.candidateId, isDeleted: { $ne: true } })
      .select('_id _job companyFollowups')
      .populate({ path: '_job', match: { _company: company._id }, select: 'title' }).lean();
    return res.json({ applications: applications.filter(application => application._job).map(serializeApplication) });
  } catch (_) { return res.status(500).json({ message: 'Unable to load follow-ups. Please try again.' }); }
};

exports.create = async (req, res) => {
  const { candidateId } = req.params;
  const { applicationId, type, followupDate, remarks = '' } = req.body || {};
  if (!validId(candidateId) || !validId(applicationId) || !['Call', 'Visit'].includes(type)
    || typeof remarks !== 'string' || remarks.length > 2000
    || typeof followupDate !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(followupDate)) {
    return res.status(400).json({ message: 'Choose an application, follow-up type and valid date.' });
  }
  const date = new Date(followupDate);
  if (!Number.isFinite(date.getTime()) || date <= new Date()) return res.status(400).json({ message: 'Choose a future follow-up date and time.' });
  try {
    const company = await companyFor(req);
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const application = await AppliedJobs.findOneAndUpdate({ _id: applicationId, _company: company._id, _candidate: candidateId, isDeleted: { $ne: true } }, {
      $push: { companyFollowups: { _id: new mongoose.Types.ObjectId(), type, followupDate: date, remarks: remarks.trim(), status: 'planned', createdBy: req.companyUser, createdAt: new Date() } },
    }, { new: true, runValidators: true }).select('_id _job companyFollowups')
      .populate({ path: '_job', match: { _company: company._id }, select: 'title' }).lean();
    if (!application) return res.status(404).json({ message: 'Application not found.' });
    return res.status(201).json({ application: serializeApplication(application) });
  } catch (_) { return res.status(500).json({ message: 'Unable to save follow-up. Please try again.' }); }
};

exports.complete = async (req, res) => {
  const { candidateId, followupId } = req.params;
  const { applicationId } = req.body || {};
  if (!validId(candidateId) || !validId(applicationId) || !validId(followupId)) return res.status(400).json({ message: 'Invalid follow-up.' });
  try {
    const company = await companyFor(req);
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const application = await AppliedJobs.findOneAndUpdate({
      _id: applicationId, _company: company._id, _candidate: candidateId, isDeleted: { $ne: true },
      companyFollowups: { $elemMatch: { _id: followupId, status: { $in: ['planned', 'missed'] } } },
    }, { $set: { 'companyFollowups.$.status': 'done', 'companyFollowups.$.completedAt': new Date(), 'companyFollowups.$.completedBy': req.companyUser } },
    { new: true, runValidators: true }).select('_id _job companyFollowups')
      .populate({ path: '_job', match: { _company: company._id }, select: 'title' }).lean();
    if (!application) return res.status(409).json({ message: 'Follow-up is unavailable or already completed. Reopen the panel to refresh.' });
    return res.json({ application: serializeApplication(application) });
  } catch (_) { return res.status(500).json({ message: 'Unable to complete follow-up. Please try again.' }); }
};
