const mongoose = require('mongoose');
const Status = require('../controllers/models/status');
const { ReEnquire, User } = require('../controllers/models');

const FALLBACK_UNTOUCH_STATUS_ID = new mongoose.Types.ObjectId('64ab1234abcd5678ef901234');
const FALLBACK_DUPLICATE_SUBSTATUS_ID = new mongoose.Types.ObjectId('6a48e6b7d668a7671542801a');

function mobileLookupValues(mobile) {
  const raw = String(mobile || '').trim();
  const digits = raw.replace(/\D/g, '').slice(-10);
  const values = [];
  if (raw) values.push(raw);
  if (digits) values.push(digits);
  const asNum = Number(digits);
  if (digits && Number.isFinite(asNum)) values.push(asNum);
  return [...new Set(values)];
}

async function resolveDuplicateStatusIds(collegeId) {
  const filters = [];
  if (collegeId && mongoose.Types.ObjectId.isValid(collegeId)) {
    filters.push({ college: collegeId });
  }
  filters.push({ $or: [{ college: null }, { college: { $exists: false } }] });

  for (const filter of filters) {
    const statuses = await Status.find(filter).lean();
    for (const status of statuses) {
      const sub = (status.substatuses || []).find((item) =>
        /duplicate/i.test(String(item.title || '').trim())
      );
      if (sub) {
        return { statusId: status._id, subStatusId: sub._id };
      }
    }
  }

  return {
    statusId: FALLBACK_UNTOUCH_STATUS_ID,
    subStatusId: FALLBACK_DUPLICATE_SUBSTATUS_ID,
  };
}

async function ensureCandidateUser(candidate, source) {
  if (!candidate) return null;
  const mobileValues = mobileLookupValues(candidate.mobile);
  const existing = await User.findOne({
    mobile: { $in: mobileValues },
    role: { $in: [3, '3'] },
    isDeleted: { $ne: true },
  });
  if (existing) return existing;

  const digits = String(candidate.mobile || '').replace(/\D/g, '').slice(-10);
  const payload = {
    name: candidate.name,
    mobile: Number(digits),
    role: 3,
    status: true,
    source: source || candidate.source || 'Website Apply',
  };
  if (candidate.email) payload.email = candidate.email;

  try {
    return await User.create(payload);
  } catch (err) {
    const retry = await User.findOne({
      mobile: { $in: mobileValues },
      role: { $in: [3, '3'] },
      isDeleted: { $ne: true },
    });
    if (retry) return retry;
    if (payload.email) {
      delete payload.email;
      return User.create(payload);
    }
    throw err;
  }
}

async function markLeadDuplicateOnReapply(alreadyApplied, source, collegeId) {
  if (!alreadyApplied) return alreadyApplied;
  const { statusId, subStatusId } = await resolveDuplicateStatusIds(collegeId);
  alreadyApplied._leadStatus = statusId;
  alreadyApplied._leadSubStatus = subStatusId;
  if (!Array.isArray(alreadyApplied.logs)) alreadyApplied.logs = [];
  alreadyApplied.logs.push({
    action: 'Lead marked Duplicate on reapply (same mobile)',
    remarks: source || 'Website Apply',
    timestamp: new Date(),
  });
  await alreadyApplied.save();
  return alreadyApplied;
}

async function recordDuplicateReapply({ candidate, applied, courseId, source, collegeId }) {
  await ReEnquire.create({
    candidate: candidate._id,
    appliedCourse: applied._id,
    course: courseId,
    reEnquireDate: new Date(),
    counselorName: applied.counsellor,
    source: source || 'Website Apply',
  });
  await markLeadDuplicateOnReapply(applied, source, collegeId);
  return applied;
}

module.exports = {
  mobileLookupValues,
  resolveDuplicateStatusIds,
  ensureCandidateUser,
  markLeadDuplicateOnReapply,
  recordDuplicateReapply,
  FALLBACK_UNTOUCH_STATUS_ID,
  FALLBACK_DUPLICATE_SUBSTATUS_ID,
};
