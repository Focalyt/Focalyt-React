const jwt = require('jsonwebtoken');
const Qualification = require('../controllers/models/qualification');
const SubQualification = require('../controllers/models/subQualification');
const User = require('../controllers/models/users');
const CandidateProfile = require('../controllers/models/candidateProfile');

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[./,&()+_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readLevel(qualification) {
  if (!qualification || qualification.level == null || qualification.level === '') return null;
  const level = Number(qualification.level);
  return Number.isFinite(level) ? level : null;
}

function parseQualificationLevel(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return { error: 'Please enter qualification level' };
  }
  const level = Number(value);
  if (!Number.isInteger(level) || level < 0) {
    return { error: 'Qualification level must be a whole number of 0 or more' };
  }
  return { level };
}

function qualificationTrack(name) {
  const normalized = normalizeName(name);
  if (!normalized) return 'general';
  const compact = normalized.replace(/\s+/g, '');
  if (normalized === 'iti' || compact === 'iti' || normalized.startsWith('iti ')) return 'iti';
  if (/\b(graduation|graduate|bachelor|bachelors|masters|master|post graduation|postgraduate|doctorate|phd|10th|12th)\b/.test(normalized)) {
    return 'general';
  }
  if (normalized === 'diploma' || compact === 'diploma' || /\bdiploma\b/.test(normalized)) return 'diploma';
  return 'general';
}

function idOf(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') return value.toHexString();
    if (value._id != null || value.id != null) return idOf(value._id != null ? value._id : value.id);
  }
  const text = String(value).trim();
  return /^[a-f\d]{24}$/i.test(text) ? text : '';
}

function collectCandidateQualificationRefs(candidate) {
  const ids = new Set();
  const names = new Set();
  const consider = (value) => {
    if (value == null || value === '') return;
    if (typeof value === 'object') {
      const id = idOf(value);
      if (id) ids.add(id);
      if (value.name) names.add(normalizeName(value.name));
      return;
    }
    const id = idOf(value);
    if (id) ids.add(id);
    else names.add(normalizeName(value));
  };

  consider(candidate?.highestQualification);
  const list = Array.isArray(candidate?.qualifications) ? candidate.qualifications : [];
  list.forEach((item) => {
    if (!item || typeof item !== 'object') {
      consider(item);
      return;
    }
    consider(item.education);
    consider(item.Qualification);
    consider(item.qualification);
    consider(item._qualification);
    if (item.educationName) names.add(normalizeName(item.educationName));
  });
  return { ids, names };
}

function emptyCourseRefs() {
  return { ids: new Set(), names: new Set(), courseIds: new Set() };
}

function collectCandidateCourseRefs(candidate) {
  const refs = emptyCourseRefs();
  const list = Array.isArray(candidate?.qualifications) ? candidate.qualifications : [];
  list.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    [item.subQualification, item._subQualification, item.stream].forEach((value) => {
      const id = idOf(value);
      if (id) refs.ids.add(id);
      else if (typeof value === 'string' && value.trim()) refs.names.add(normalizeName(value));
    });
    [item.course, item._course].forEach((value) => {
      const id = idOf(value);
      if (id) refs.courseIds.add(id);
      else if (value && typeof value === 'object' && value.name) refs.names.add(normalizeName(value.name));
    });
    [item.specialization, item.courseName, item.streamName, item.subStream].forEach((value) => {
      if (value == null || value === '') return;
      const id = idOf(value);
      if (id) refs.ids.add(id);
      else refs.names.add(normalizeName(value));
    });
  });
  return refs;
}

function highestLevel(qualifications) {
  let candidateLevel = null;
  (qualifications || []).forEach((qualification) => {
    const level = readLevel(qualification);
    if (level == null) return;
    candidateLevel = candidateLevel == null ? level : Math.max(candidateLevel, level);
  });
  return candidateLevel;
}

function hasTrack(qualifications, track) {
  return (qualifications || []).some((qualification) => {
    if (qualificationTrack(qualification?.name) === track) return true;
    if (track === 'diploma' && normalizeName(qualification?.name).includes('diploma')) return true;
    return false;
  });
}

function courseMatches(course, refs) {
  if (!course || !refs) return false;
  const id = idOf(course._id || course.id);
  const courseId = idOf(course._course);
  const name = normalizeName(course.name);
  if (id && refs.ids.has(id)) return true;
  if (courseId && refs.courseIds.has(courseId)) return true;
  if (name && refs.names.has(name)) return true;
  return false;
}

function evaluateQualificationEligibility({
  jobQualification,
  candidateQualifications = [],
  requiredCourses = [],
  candidateCourseRefs = emptyCourseRefs(),
  includeCourses = true,
} = {}) {
  const coursesRequired = includeCourses && Array.isArray(requiredCourses) && requiredCourses.length;
  if (!jobQualification && !coursesRequired) return '';

  if (jobQualification) {
    const jobLevel = readLevel(jobQualification);
    const candidateLevel = highestLevel(candidateQualifications);
    const track = qualificationTrack(jobQualification.name);
    const jobName = jobQualification.name || 'the required qualification';

    if (track === 'iti' && !hasTrack(candidateQualifications, 'iti')) {
      return `This job requires the ${jobName} qualification. A higher qualification does not replace it.`;
    }
    if (track === 'diploma' && !hasTrack(candidateQualifications, 'diploma')) {
      return `This job requires the ${jobName} qualification. A higher qualification does not replace it.`;
    }

    if (jobLevel != null && (candidateLevel == null || !(candidateLevel >= jobLevel))) {
      return `Your qualification is below this job. This job requires ${jobName} or a higher qualification.`;
    }
  }

  if (includeCourses && Array.isArray(requiredCourses) && requiredCourses.length) {
    const matched = requiredCourses.some((course) => courseMatches(course, candidateCourseRefs));
    if (!matched) {
      const label = requiredCourses.map((course) => course && course.name).filter(Boolean).slice(0, 3).join(', ');
      return label
        ? `This job requires the specific course ${label} for its qualification.`
        : 'This job requires a specific course that is not on your profile.';
    }
  }

  return '';
}

function ownedQualifications(catalog, candidate) {
  const refs = collectCandidateQualificationRefs(candidate);
  return (catalog || []).filter((qualification) => (
    refs.ids.has(String(qualification._id)) || refs.names.has(normalizeName(qualification.name))
  ));
}

function eligibleQualificationIds(catalog, owned) {
  return (catalog || [])
    .filter((qualification) => evaluateQualificationEligibility({
      jobQualification: qualification,
      candidateQualifications: owned,
      requiredCourses: [],
      includeCourses: false,
    }) === '')
    .map((qualification) => qualification._id);
}

function eligibilityQuery(eligibleIds, subIds) {
  const courseMatch = [
    { _subQualification: { $exists: false } },
    { _subQualification: null },
    { _subQualification: { $size: 0 } },
  ];
  if (subIds && subIds.length) {
    courseMatch.push({ _subQualification: { $in: subIds } });
  }
  return {
    $and: [
      {
        $or: [
          { _qualification: { $in: eligibleIds || [] } },
          { _qualification: null },
          { _qualification: { $exists: false } },
        ],
      },
      { $or: courseMatch },
    ],
  };
}

async function qualificationCatalog() {
  return Qualification.find({}).select('_id name level').lean();
}

async function satisfiedSubQualificationIds(candidate) {
  const refs = collectCandidateCourseRefs(candidate);
  const qualificationIds = [...collectCandidateQualificationRefs(candidate).ids];
  if (!refs.ids.size && !refs.names.size && !refs.courseIds.size && !qualificationIds.length) return [];

  const clauses = [];
  if (qualificationIds.length) clauses.push({ _qualification: { $in: qualificationIds } });
  if (refs.ids.size) clauses.push({ _id: { $in: [...refs.ids] } });
  if (refs.courseIds.size) clauses.push({ _course: { $in: [...refs.courseIds] } });
  [...refs.names].forEach((name) => {
    clauses.push({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  });
  if (!clauses.length) return [];

  const docs = await SubQualification.find({ $or: clauses }).select('_id name _course').lean();
  return docs.filter((doc) => courseMatches(doc, refs)).map((doc) => doc._id);
}

async function buildJobEligibilityFilter(candidate) {
  const catalog = await qualificationCatalog();
  const owned = ownedQualifications(catalog, candidate);
  const eligibleIds = eligibleQualificationIds(catalog, owned);
  const subIds = await satisfiedSubQualificationIds(candidate);
  return eligibilityQuery(eligibleIds, subIds);
}

async function applyCandidateEligibility(filter, candidate) {
  if (!candidate) return filter;
  const eligibilityFilter = await buildJobEligibilityFilter(candidate);
  return { $and: [filter, eligibilityFilter] };
}

async function candidateFromAuthHeader(req) {
  const token = req && req.header ? req.header('x-auth') : '';
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.MIPIE_JWT_SECRET);
    const user = await User.findById(decoded.id).select('mobile role').lean();
    if (!user || Number(user.role) !== 3 || user.mobile == null || user.mobile === '') return null;
    return CandidateProfile.findOne({ mobile: user.mobile })
      .select('highestQualification qualifications')
      .lean();
  } catch (err) {
    return null;
  }
}

function requiredCourseIds(vacancy) {
  const values = Array.isArray(vacancy?._subQualification) ? vacancy._subQualification : [];
  return values.map((value) => idOf(value)).filter(Boolean);
}

async function qualificationEligibilityMessage(vacancy, candidate, options = {}) {
  const includeCourses = options.includeCourses !== false;
  const jobQualificationId = idOf(vacancy?._qualification);
  const catalog = await qualificationCatalog();
  const owned = ownedQualifications(catalog, candidate);
  const jobQualification = jobQualificationId
    ? catalog.find((qualification) => String(qualification._id) === jobQualificationId)
    : null;

  let requiredCourses = [];
  const courseIds = requiredCourseIds(vacancy);
  if (includeCourses && courseIds.length) {
    requiredCourses = await SubQualification.find({ _id: { $in: courseIds } })
      .select('_id name _course')
      .lean();
  }

  if (!jobQualification && !requiredCourses.length) return '';

  return evaluateQualificationEligibility({
    jobQualification,
    candidateQualifications: owned,
    requiredCourses,
    candidateCourseRefs: collectCandidateCourseRefs(candidate),
    includeCourses,
  });
}

module.exports = {
  normalizeName,
  readLevel,
  parseQualificationLevel,
  qualificationTrack,
  collectCandidateQualificationRefs,
  collectCandidateCourseRefs,
  highestLevel,
  evaluateQualificationEligibility,
  ownedQualifications,
  eligibleQualificationIds,
  eligibilityQuery,
  buildJobEligibilityFilter,
  applyCandidateEligibility,
  candidateFromAuthHeader,
  qualificationEligibilityMessage,
};
