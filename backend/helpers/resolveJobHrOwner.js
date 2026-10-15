const mongoose = require('mongoose');

require('../controllers/models/vacancy');
require('../controllers/models/users');

const {
  toIdString,
  resolveWinningHr,
  writeHrOntoVacancy,
  reapplyActiveJobRulesOnce,
} = require('./jobRuleMatch');

const exactInsensitive = (value) =>
  new RegExp(`^${String(value || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const VACANCY_FIELDS = '_id title hr _jobCategory collegeAcNo';

// Lead owner comes from the active job assignment rule for this job.
// A sheet job id is kept. Vacancy.hr is only the fallback when no rule matches.
const resolveJobHrOwner = async ({ applyingFor, jobId } = {}) => {
  const Vacancy = mongoose.model('Vacancy');

  const rawJobId = jobId != null && String(jobId).trim() !== '' ? String(jobId).trim() : '';
  const id = toIdString(jobId);
  let vacancy = null;

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
    vacancy = await Vacancy.findById(id).select(VACANCY_FIELDS).lean();
    if (!vacancy) {
      return {
        error: 'job_not_found',
        hrId: null,
        hrName: null,
        jobId: null,
        jobTitle: null,
      };
    }
  }

  await reapplyActiveJobRulesOnce();

  if (vacancy) {
    vacancy = await Vacancy.findById(vacancy._id).select(VACANCY_FIELDS).lean();
  } else {
    const title = String(applyingFor || '').trim();
    if (title) {
      vacancy = await Vacancy.findOne({
        title: exactInsensitive(title),
        status: true,
      })
        .select(VACANCY_FIELDS)
        .sort({ createdAt: -1 })
        .lean();
    }
  }

  const jobTitle = vacancy?.title || applyingFor || null;
  if (!vacancy) {
    return {
      hrId: null,
      hrName: null,
      jobId: null,
      jobTitle,
    };
  }

  const selected = await resolveWinningHr(vacancy);
  if (selected.hrId && toIdString(vacancy.hr) !== selected.hrId) {
    await writeHrOntoVacancy(vacancy._id, selected.hrId, selected.hrName);
  }

  console.log('[JobHrOwner] resolve', {
    applyingFor: String(applyingFor || jobTitle || '').trim(),
    jobId: id,
    matchedJobId: String(vacancy._id),
    matchedTitle: vacancy.title || null,
    hrId: selected.hrId,
    hrName: selected.hrName,
    source: selected.source,
    ruleId: selected.ruleId,
  });

  return {
    hrId: selected.hrId,
    hrName: selected.hrName,
    jobId: vacancy._id,
    jobTitle,
  };
};

module.exports = { resolveJobHrOwner };
