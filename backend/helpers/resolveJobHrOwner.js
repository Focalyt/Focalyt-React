const mongoose = require('mongoose');

require('../controllers/models/vacancy');
require('../controllers/models/users');

const toIdString = (value) => {
  if (!value) return null;
  const id = typeof value === 'object' ? (value._id || value.id) : value;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
  return String(id);
};

// Job is always created after an active Job Rule, so Vacancy.hr is already set.
// Applicant flow only copies that HR — it does not re-run rules.
const resolveJobHrOwner = async ({ jobId } = {}) => {
  const Vacancy = mongoose.model('Vacancy');
  const User = mongoose.model('User');
  const id = toIdString(jobId);

  if (!id) {
    return { hrId: null, hrName: null, jobId: null, jobTitle: null };
  }

  const vacancy = await Vacancy.findById(id).select('_id title hr');
  const hrId = toIdString(vacancy?.hr);

  if (!hrId) {
    return {
      hrId: null,
      hrName: null,
      jobId: vacancy?._id || id,
      jobTitle: vacancy?.title || null,
    };
  }

  const hrDetails = await User.findById(hrId).select('name');
  return {
    hrId,
    hrName: hrDetails?.name || 'Unknown',
    jobId: vacancy._id,
    jobTitle: vacancy.title || null,
  };
};

module.exports = { resolveJobHrOwner };
