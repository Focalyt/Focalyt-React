const mongoose = require('mongoose');

require('../controllers/models/jobAssignmentRule');
require('../controllers/models/vacancy');
require('../controllers/models/users');
require('../controllers/models/college');

const toIdString = (value) => {
  if (value == null || value === '') return null;
  const id = typeof value === 'object' ? (value._id || value.id) : value;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
  return String(id);
};

const idList = (values) => (values || []).map(toIdString).filter(Boolean);

// 3 = this job id, 2 = this category, 1 = any job. 0 = rule does not apply.
const ruleScore = (rule, vacancy) => {
  if (!rule || rule.status === 'Inactive') return 0;

  const vacancyId = toIdString(vacancy?._id);
  const categoryId = toIdString(vacancy?._jobCategory);
  const jobNameType = rule.jobName?.type || 'any';
  const categoryType = rule.jobCategory?.type || 'includes';
  const nameIds = idList(rule.jobName?.values);
  const categoryIds = idList(rule.jobCategory?.values);

  const nameOk = jobNameType === 'includes'
    ? Boolean(vacancyId && nameIds.includes(vacancyId))
    : true;
  const categoryOk = categoryType === 'includes'
    ? Boolean(categoryId && categoryIds.includes(categoryId))
    : true;

  if (!nameOk || !categoryOk) return 0;
  if (jobNameType === 'includes') return 3;
  if (categoryType === 'includes') return 2;
  return 1;
};

const pickWinningRule = (rules, vacancy) => {
  let best = null;
  let bestScore = 0;
  let bestTime = 0;

  (rules || []).forEach((rule) => {
    const score = ruleScore(rule, vacancy);
    if (!score) return;
    const time = new Date(rule.updatedAt || rule.createdAt || 0).getTime();
    if (score > bestScore || (score === bestScore && time >= bestTime)) {
      best = rule;
      bestScore = score;
      bestTime = time;
    }
  });

  return best;
};

const loadActiveRules = async () => {
  const JobAssignmentRule = mongoose.model('JobAssignmentRule');
  return JobAssignmentRule.find({ status: 'Active' }).lean();
};

const pickRoundRobinHr = async (hrIds, usage) => {
  const unique = [...new Set((hrIds || []).map(toIdString).filter(Boolean))];
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];

  const Vacancy = mongoose.model('Vacancy');
  let best = unique[0];
  let bestScore = Infinity;

  for (const hrId of unique) {
    const used = usage?.get(hrId) || 0;
    const lastAssignment = await Vacancy.findOne({ 'hrAssignment._hr': hrId })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();
    const stamp = lastAssignment?.createdAt ? new Date(lastAssignment.createdAt).getTime() : 0;
    const score = used * 1e15 + stamp;
    if (score < bestScore) {
      best = hrId;
      bestScore = score;
    }
  }

  return best;
};

const collegeFallbackHr = async (vacancy) => {
  const collegeId = Array.isArray(vacancy?.collegeAcNo) && vacancy.collegeAcNo.length
    ? toIdString(vacancy.collegeAcNo[0])
    : null;
  if (!collegeId) return null;

  const College = mongoose.model('College');
  const college = await College.findById(collegeId).select('_concernPerson').lean();
  if (!college?._concernPerson?.length) return null;

  const defaultAdmin = college._concernPerson.find((person) => person.defaultAdmin === true);
  const fallback = defaultAdmin || college._concernPerson[0];
  return toIdString(fallback?._id);
};

const hrNameFor = async (hrId) => {
  if (!hrId) return null;
  const User = mongoose.model('User');
  const hrDetails = await User.findById(hrId).select('name').lean();
  return hrDetails?.name || 'Unknown';
};

const resolveWinningHr = async (vacancy, rules, usage = new Map()) => {
  const activeRules = rules || await loadActiveRules();
  const winner = pickWinningRule(activeRules, vacancy);

  if (winner) {
    const hrIds = idList(winner.assignedHrs);
    const current = toIdString(vacancy?.hr);
    const hrId = current && hrIds.includes(current)
      ? current
      : await pickRoundRobinHr(hrIds, usage);

    if (hrId) usage.set(hrId, (usage.get(hrId) || 0) + 1);

    return {
      hrId,
      hrName: await hrNameFor(hrId),
      source: 'rule',
      ruleId: winner._id ? String(winner._id) : null,
    };
  }

  const stored = toIdString(vacancy?.hr);
  if (stored) {
    return {
      hrId: stored,
      hrName: await hrNameFor(stored),
      source: 'vacancy',
      ruleId: null,
    };
  }

  const fallback = await collegeFallbackHr(vacancy);
  if (fallback) {
    return {
      hrId: fallback,
      hrName: await hrNameFor(fallback),
      source: 'defaultAdmin',
      ruleId: null,
    };
  }

  return { hrId: null, hrName: null, source: 'none', ruleId: null };
};

const writeHrOntoVacancy = async (vacancyId, hrId, name) => {
  if (!vacancyId || !hrId) return;
  const Vacancy = mongoose.model('Vacancy');
  const hrName = name || await hrNameFor(hrId);
  await Vacancy.updateOne(
    { _id: vacancyId },
    {
      $set: {
        hr: hrId,
        hrAssignmentStatus: 1,
      },
      $push: {
        hrAssignment: {
          _hr: hrId,
          hrName,
          assignDate: new Date(),
        },
      },
    }
  );
};

const vacancyFilterForRule = (rule) => {
  const jobNameType = rule?.jobName?.type || 'any';
  const jobNameIds = idList(rule?.jobName?.values);
  const categoryIds = idList(rule?.jobCategory?.values);

  if (jobNameType === 'includes') {
    if (jobNameIds.length === 0) return null;
    return { _id: { $in: jobNameIds } };
  }
  if (rule?.jobCategory?.type === 'includes') {
    if (categoryIds.length === 0) return null;
    return { _jobCategory: { $in: categoryIds }, status: true };
  }
  return { status: true };
};

const applyRulesToVacancies = async (vacancies, rules) => {
  const activeRules = rules || await loadActiveRules();
  const usage = new Map();
  let updated = 0;

  for (const vacancy of vacancies) {
    const selected = await resolveWinningHr(vacancy, activeRules, usage);
    if (!selected.hrId || toIdString(vacancy.hr) === selected.hrId) continue;
    await writeHrOntoVacancy(vacancy._id, selected.hrId, selected.hrName);
    vacancy.hr = selected.hrId;
    updated += 1;
  }

  return updated;
};

const applyRuleScope = async (rule) => {
  if (!rule) return { updated: 0, checked: 0 };

  const filter = vacancyFilterForRule(rule);
  if (!filter) return { updated: 0, checked: 0 };

  const Vacancy = mongoose.model('Vacancy');
  const rules = await loadActiveRules();
  const vacancies = await Vacancy.find(filter)
    .select('_id title hr _jobCategory collegeAcNo')
    .lean();
  const updated = await applyRulesToVacancies(vacancies, rules);

  console.log('[JobRule] assigned HR onto vacancies', {
    ruleId: String(rule._id || ''),
    status: rule.status,
    checked: vacancies.length,
    updated,
  });

  return { updated, checked: vacancies.length };
};

const reapplyActiveJobRules = async () => {
  const rules = await loadActiveRules();
  if (!rules.length) return { updated: 0, checked: 0 };

  const Vacancy = mongoose.model('Vacancy');
  const hasCatchAll = rules.some((rule) => ruleScore(rule, { _id: null, _jobCategory: null }) === 1);
  let filter;

  if (hasCatchAll) {
    filter = { status: true };
  } else {
    const ids = [];
    const categories = [];
    rules.forEach((rule) => {
      if ((rule.jobName?.type || 'any') === 'includes') {
        ids.push(...idList(rule.jobName?.values));
      } else if (rule.jobCategory?.type === 'includes') {
        categories.push(...idList(rule.jobCategory?.values));
      }
    });
    const or = [];
    if (ids.length) or.push({ _id: { $in: ids } });
    if (categories.length) or.push({ _jobCategory: { $in: categories }, status: true });
    if (!or.length) return { updated: 0, checked: 0 };
    filter = or.length === 1 ? or[0] : { $or: or };
  }

  const vacancies = await Vacancy.find(filter)
    .select('_id title hr _jobCategory collegeAcNo')
    .lean();
  const updated = await applyRulesToVacancies(vacancies, rules);

  console.log('[JobRule] reapplied active rules', {
    rules: rules.length,
    checked: vacancies.length,
    updated,
  });

  return { updated, checked: vacancies.length };
};

let reapplyOnce = null;

const reapplyActiveJobRulesOnce = () => {
  if (!reapplyOnce) {
    reapplyOnce = reapplyActiveJobRules().catch((error) => {
      reapplyOnce = null;
      console.error('[JobRule] reapply failed:', error);
      return { updated: 0, checked: 0, error };
    });
  }
  return reapplyOnce;
};

module.exports = {
  toIdString,
  resolveWinningHr,
  writeHrOntoVacancy,
  applyRuleScope,
  reapplyActiveJobRules,
  reapplyActiveJobRulesOnce,
};
