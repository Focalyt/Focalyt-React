const mongoose = require('mongoose');

require('../controllers/models/vacancy');
require('../controllers/models/users');

const exactInsensitive = (value) =>
  new RegExp(`^${String(value || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const toIdString = (value) => {
  if (!value) return null;
  const id = typeof value === 'object' ? (value._id || value.id) : value;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
  return String(id);
};

// Copy Vacancy.hr onto the career lead. Match by job id or exact job title.
// When jobId is sent, it must exist; applyingFor is then taken from that vacancy title.
const resolveJobHrOwner = async ({ applyingFor, jobId } = {}) => {
  const Vacancy = mongoose.model('Vacancy');
  const User = mongoose.model('User');

  const rawJobId = jobId != null && String(jobId).trim() !== '' ? String(jobId).trim() : '';
  let vacancy = null;
  const id = toIdString(jobId);
  let jobTitleFromId = null;

  if (rawJobId) {
    if (!id) {
      return {
        error: 'invalid_job_id',
        hrId: null,
        hrName: null,
        jobId: null,
        jobTitle: null,
      };
    }
    vacancy = await Vacancy.findById(id).select('_id title hr').lean();
    if (!vacancy) {
      return {
        error: 'job_not_found',
        hrId: null,
        hrName: null,
        jobId: null,
        jobTitle: null,
      };
    }
    jobTitleFromId = vacancy.title || null;
  }

  const title = String(applyingFor || jobTitleFromId || '').trim();
  if ((!vacancy || !vacancy.hr) && title) {
    const matches = await Vacancy.find({
      title: exactInsensitive(title),
      status: true,
    })
      .select('_id title hr')
      .sort({ createdAt: -1 })
      .lean();

    vacancy = matches.find((job) => job.hr) || matches[0] || vacancy || null;
  }

  const hrId = toIdString(vacancy?.hr);
  console.log('[JobHrOwner] resolve', {
    applyingFor: title,
    jobId: id,
    matchedJobId: vacancy?._id ? String(vacancy._id) : null,
    matchedTitle: vacancy?.title || null,
    hrId,
  });

  const jobTitle = jobTitleFromId || vacancy?.title || applyingFor || null;

  if (!hrId) {
    return {
      hrId: null,
      hrName: null,
      jobId: vacancy?._id || null,
      jobTitle,
    };
  }

  const hrDetails = await User.findById(hrId).select('name').lean();
  return {
    hrId,
    hrName: hrDetails?.name || 'Unknown',
    jobId: vacancy._id,
    jobTitle,
  };
};

module.exports = { resolveJobHrOwner };
