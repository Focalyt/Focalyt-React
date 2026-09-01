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

// Job is created after an active Job Rule, so Vacancy.hr is already set.
// CareerApplication just copies that HR onto leadOwner.
const resolveJobHrOwner = async ({ applyingFor, jobId, collegeId } = {}) => {
  const Vacancy = mongoose.model('Vacancy');
  const User = mongoose.model('User');

  let vacancy = null;
  const id = toIdString(jobId);
  if (id) {
    vacancy = await Vacancy.findById(id).select('_id title hr');
  }

  const title = String(applyingFor || '').trim();
  if (!vacancy && title) {
    const filter = {
      title: exactInsensitive(title),
      status: true,
      hr: { $ne: null },
    };
    if (collegeId) {
      filter.$or = [
        { collegeAcNo: String(collegeId) },
        { collegeAcNo: { $exists: false } },
        { collegeAcNo: { $size: 0 } },
      ];
    }
    vacancy = await Vacancy.findOne(filter).sort({ createdAt: -1 }).select('_id title hr');
  }

  const hrId = toIdString(vacancy?.hr);
  if (!hrId) {
    return {
      hrId: null,
      hrName: null,
      jobId: vacancy?._id || null,
      jobTitle: vacancy?.title || applyingFor || null,
    };
  }

  const hrDetails = await User.findById(hrId).select('name');
  return {
    hrId,
    hrName: hrDetails?.name || 'Unknown',
    jobId: vacancy._id,
    jobTitle: vacancy.title || applyingFor || null,
  };
};

module.exports = { resolveJobHrOwner };
