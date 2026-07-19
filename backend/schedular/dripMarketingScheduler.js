const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const {
  DripMarketingRule,
  DripMarketingJob,
  AppliedCourses,
  Courses,
  WhatsAppTemplate
} = require('../controllers/models');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const BATCH_LEADS_PER_RULE = 100;
const JOBS_PER_TICK = 50;
let isRunning = false;

function toIdString(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

function normalizeValues(values = []) {
  return (Array.isArray(values) ? values : [values])
    .filter((v) => v !== undefined && v !== null && v !== '')
    .map((v) => toIdString(v));
}

function valuesMatch(actual, expectedValues, operator = 'equals') {
  const expected = normalizeValues(expectedValues);
  if (!expected.length) return false;

  const actualList = Array.isArray(actual)
    ? actual.map(toIdString)
    : [toIdString(actual)];

  const hit = expected.some((exp) => actualList.includes(exp));
  return operator === 'not_equals' ? !hit : hit;
}

/** Parse UI timing strings: 1hrs, 2days, etc. → milliseconds */
function parseTimingToMs(timing) {
  if (!timing || timing === 'immediate') return 0;
  const raw = String(timing).trim().toLowerCase();
  const match = raw.match(/^(\d+)\s*(hrs?|hours?|days?|mins?|minutes?)$/);
  if (!match) return 0;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  if (unit.startsWith('min')) return amount * 60 * 1000;
  if (unit.startsWith('hour') || unit.startsWith('hr')) return amount * 60 * 60 * 1000;
  if (unit.startsWith('day')) return amount * 24 * 60 * 60 * 1000;
  return 0;
}

function formatPhoneNumber(number) {
  if (!number) return null;
  let phone = number.toString().replace(/\D/g, '');
  if (!phone) return null;
  if (phone.startsWith('91') && phone.length === 12) return `+${phone}`;
  if (phone.length === 10) return `+91${phone}`;
  if (phone.startsWith('+')) return phone;
  return `+${phone}`;
}

function getLeadFieldValue(lead, activityType) {
  const course = lead._course || {};
  const candidate = lead._candidate || {};

  switch (activityType) {
    case 'status':
      return lead._leadStatus;
    case 'subStatus':
      return lead._leadSubStatus;
    case 'course':
    case 'courseName':
      return lead._course?._id || lead._course;
    case 'center':
      return lead._center?._id || lead._center;
    case 'batch':
      return lead.batch?._id || lead.batch;
    case 'leadOwner':
      return lead.counsellor?._id || lead.counsellor;
    case 'registeredBy':
      return lead.registeredBy?._id || lead.registeredBy;
    case 'vertical':
      return course.vertical?._id || course.vertical;
    case 'project':
      return course.project?._id || course.project;
    case 'state': {
      const addr = candidate.address || candidate.permanentAddress || {};
      return addr.state || candidate.state || '';
    }
    case 'jobName':
      return null;
    default:
      return null;
  }
}

function evaluateCondition(lead, condition) {
  const actual = getLeadFieldValue(lead, condition.activityType);
  const matched = valuesMatch(actual, condition.values, condition.operator || 'equals');
  return {
    matched,
    activityType: condition.activityType,
    operator: condition.operator,
    expectedValues: condition.values,
    actualValue: actual
  };
}

function evaluateConditionBlocks(lead, rule) {
  const blocks = rule.conditionBlocks || [];
  if (!blocks.length) return { overallResult: false, blockResults: [] };

  const blockResults = blocks.map((block, blockIndex) => {
    const conditions = block.conditions || [];
    const details = conditions.map((c) => evaluateCondition(lead, c));
    const results = details.map((d) => d.matched);
    const op = (block.intraBlockLogicOperator || 'and').toLowerCase();
    const blockFinalResult = op === 'or'
      ? results.some(Boolean)
      : results.every(Boolean);

    return {
      blockIndex,
      blockFinalResult,
      mainConditionResult: results[0] || false,
      subConditionResults: results.slice(1),
      evaluationDetails: {
        mainCondition: details[0] || null,
        subConditions: details.slice(1)
      }
    };
  });

  const interOp = (rule.interBlockLogicOperator || 'and').toLowerCase();
  const overallResult = interOp === 'or'
    ? blockResults.some((b) => b.blockFinalResult)
    : blockResults.every((b) => b.blockFinalResult);

  return { overallResult, blockResults };
}

function buildActionUpdate(action) {
  if (!action?.activityType || !action.values?.length) return null;
  const value = action.values[0];
  const updates = {};

  switch (action.activityType) {
    case 'status':
      updates._leadStatus = value;
      break;
    case 'subStatus':
      updates._leadSubStatus = value;
      break;
    case 'leadOwner':
      updates.counsellor = value;
      break;
    case 'registeredBy':
      updates.registeredBy = value;
      updates.registeredByModel = 'User';
      break;
    case 'center':
      updates._center = value;
      break;
    case 'batch':
      updates.batch = value;
      break;
    case 'course':
    case 'courseName':
      updates._course = value;
      break;
    default:
      return null;
  }

  return { updates, activityType: action.activityType, newValue: value };
}

async function applyActions(lead, rule) {
  const performed = {
    primaryAction: null,
    additionalActions: []
  };

  const primary = buildActionUpdate(rule.primaryAction);
  if (primary) {
    const previousValue = getLeadFieldValue(lead, primary.activityType);
    try {
      await AppliedCourses.findByIdAndUpdate(lead._id, { $set: primary.updates });
      performed.primaryAction = {
        activityType: primary.activityType,
        previousValue,
        newValue: primary.newValue,
        success: true
      };
    } catch (err) {
      performed.primaryAction = {
        activityType: primary.activityType,
        previousValue,
        newValue: primary.newValue,
        success: false,
        error: err.message
      };
    }
  }

  for (const action of rule.additionalActions || []) {
    const built = buildActionUpdate(action);
    if (!built) continue;
    const previousValue = getLeadFieldValue(lead, built.activityType);
    try {
      await AppliedCourses.findByIdAndUpdate(lead._id, { $set: built.updates });
      performed.additionalActions.push({
        activityType: built.activityType,
        previousValue,
        newValue: built.newValue,
        success: true
      });
    } catch (err) {
      performed.additionalActions.push({
        activityType: built.activityType,
        previousValue,
        newValue: built.newValue,
        success: false,
        error: err.message
      });
    }
  }

  return performed;
}

async function enqueueCommunications(lead, rule, matchedAt = new Date()) {
  const communication = rule.communication || {};
  const mode = communication.mode || 'whatsapp';
  if (mode !== 'whatsapp') {
    console.warn(`[Drip] Skipping non-whatsapp mode "${mode}" for rule ${rule._id}`);
    return [];
  }

  const items = Array.isArray(communication.communications)
    ? communication.communications
    : [];

  const created = [];
  for (const item of items) {
    if (!item?.templateId) continue;

    let delayMs = parseTimingToMs(item.timing);
    if (communication.executionType === 'immediate' && !item.timing) {
      delayMs = 0;
    }

    const scheduledAt = new Date(matchedAt.getTime() + delayMs);

    try {
      const job = await DripMarketingJob.findOneAndUpdate(
        {
          ruleId: rule._id,
          leadId: lead._id,
          order: item.order || 1
        },
        {
          $setOnInsert: {
            collegeId: rule.collegeId,
            mode,
            templateId: item.templateId,
            timing: item.timing || '',
            recipient: communication.recipient || 'sender',
            scheduledAt,
            status: 'pending'
          }
        },
        { upsert: true, new: true }
      );
      created.push(job);
    } catch (err) {
      // Duplicate key on race — ignore
      if (err.code !== 11000) {
        console.error('[Drip] Failed to enqueue job:', err.message);
      }
    }
  }

  return created;
}

async function alreadyExecutedForLead(rule, leadId) {
  const maxExec = rule.config?.maxExecutionsPerLead ?? 1;
  const logs = (rule.executionLogs || []).filter(
    (log) => toIdString(log.leadId) === toIdString(leadId)
  );
  if (logs.length >= maxExec) return true;

  const cooldownHours = rule.config?.cooldownPeriod ?? 24;
  if (logs.length > 0 && cooldownHours > 0) {
    const last = logs[logs.length - 1];
    const lastAt = last.executedAt ? new Date(last.executedAt).getTime() : 0;
    if (Date.now() - lastAt < cooldownHours * 60 * 60 * 1000) return true;
  }

  // Also skip if jobs already exist for this rule+lead
  const existingJob = await DripMarketingJob.exists({ ruleId: rule._id, leadId });
  return Boolean(existingJob);
}

async function appendExecutionLog(ruleId, logEntry) {
  await DripMarketingRule.findByIdAndUpdate(ruleId, {
    $push: { executionLogs: logEntry },
    $inc: {
      'stats.totalExecutions': 1,
      'stats.successfulExecutions': logEntry.status === 'completed' || logEntry.status === 'partial' ? 1 : 0,
      'stats.failedExecutions': logEntry.status === 'failed' ? 1 : 0
    },
    $set: { 'stats.lastExecutedAt': new Date() }
  });
}

async function getCollegeCourseIds(collegeId) {
  const courses = await Courses.find({ college: collegeId }).select('_id').lean();
  return courses.map((c) => c._id);
}

async function findCandidateLeads(rule) {
  const courseIds = await getCollegeCourseIds(rule.collegeId);
  if (!courseIds.length) return [];

  const leads = await AppliedCourses.find({
    _course: { $in: courseIds },
    admissionDone: { $ne: true },
    dropout: { $ne: true }
  })
    .populate('_candidate', 'name mobile email address permanentAddress state')
    .populate('_course', 'name vertical project college')
    .populate('counsellor', 'name mobile email')
    .populate('registeredBy', 'name mobile email')
    .limit(BATCH_LEADS_PER_RULE * 5)
    .lean();

  return leads;
}

async function processRule(rule) {
  const now = new Date();
  if (rule.startDate && new Date(rule.startDate) > now) {
    return { matched: 0, skipped: 'not_started' };
  }

  const leads = await findCandidateLeads(rule);
  let matched = 0;

  for (const lead of leads) {
    if (matched >= BATCH_LEADS_PER_RULE) break;

    const { overallResult, blockResults } = evaluateConditionBlocks(lead, rule);
    if (!overallResult) continue;

    if (await alreadyExecutedForLead(rule, lead._id)) continue;

    const started = Date.now();
    const actionsPerformed = await applyActions(lead, rule);
    const jobs = await enqueueCommunications(lead, rule, now);

    const primaryOk = !actionsPerformed.primaryAction || actionsPerformed.primaryAction.success;
    const status = primaryOk ? (jobs.length ? 'completed' : 'partial') : 'failed';

    await appendExecutionLog(rule._id, {
      leadId: lead._id,
      executedAt: now,
      conditionEvaluation: { blockResults, overallResult },
      actionsPerformed,
      communicationResult: {
        attempted: jobs.length > 0,
        mode: rule.communication?.mode || '',
        success: jobs.length > 0,
        recipient: {
          phone: lead._candidate?.mobile || '',
          name: lead._candidate?.name || '',
          email: lead._candidate?.email || ''
        }
      },
      status,
      executionTime: Date.now() - started,
      executedBy: 'dripMarketingScheduler',
      ruleVersion: rule.version || 1
    });

    matched += 1;
    console.log(
      `[Drip] Rule "${rule.name}" matched lead ${lead._id} (${lead._candidate?.name || 'unknown'}) — ${jobs.length} job(s) queued`
    );
  }

  return { matched };
}

async function sendWhatsAppTemplate(to, templateName, collegeId) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp credentials missing');
  }

  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) throw new Error(`Invalid phone: ${to}`);

  let template = await WhatsAppTemplate.findOne({
    collegeId,
    templateName
  });
  if (!template) {
    template = await WhatsAppTemplate.findOne({ templateName });
  }
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: template.templateName,
      language: { code: template.language || 'en' }
    }
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  return {
    messageId: response.data?.messages?.[0]?.id || null,
    phone: formattedPhone,
    raw: response.data
  };
}

async function processDueJobs() {
  const now = new Date();
  const jobs = await DripMarketingJob.find({
    status: 'pending',
    scheduledAt: { $lte: now }
  })
    .sort({ scheduledAt: 1 })
    .limit(JOBS_PER_TICK);

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const lead = await AppliedCourses.findById(job.leadId)
        .populate('_candidate', 'name mobile email')
        .lean();

      if (!lead) {
        job.status = 'skipped';
        job.error = 'Lead not found';
        await job.save();
        continue;
      }

      const phone = lead._candidate?.mobile;
      if (!phone) {
        job.status = 'failed';
        job.error = 'Lead has no mobile number';
        job.attempts += 1;
        await job.save();
        failed += 1;
        continue;
      }

      if (job.mode === 'whatsapp') {
        const result = await sendWhatsAppTemplate(phone, job.templateId, job.collegeId);
        job.status = 'sent';
        job.messageId = result.messageId;
        job.phone = result.phone;
        job.sentAt = new Date();
        job.attempts += 1;
        job.error = undefined;
        await job.save();
        sent += 1;
        console.log(`[Drip] WhatsApp sent to ${result.phone} template=${job.templateId} job=${job._id}`);
      } else {
        job.status = 'skipped';
        job.error = `Mode ${job.mode} not implemented`;
        await job.save();
      }
    } catch (err) {
      job.status = 'failed';
      job.error = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      job.attempts += 1;
      await job.save();
      failed += 1;
      console.error(`[Drip] Job ${job._id} failed:`, job.error);
    }
  }

  return { sent, failed, checked: jobs.length };
}

async function runDripMarketingTick() {
  if (isRunning) {
    console.log('[Drip] Previous tick still running — skip');
    return { skipped: true };
  }

  isRunning = true;
  const started = Date.now();

  try {
    const rules = await DripMarketingRule.find({
      isActive: true,
      startDate: { $lte: new Date() }
    }).lean();

    let totalMatched = 0;
    for (const rule of rules) {
      try {
        const result = await processRule(rule);
        totalMatched += result.matched || 0;
      } catch (err) {
        console.error(`[Drip] Error processing rule ${rule._id}:`, err.message);
      }
    }

    const jobResult = await processDueJobs();

    console.log(
      `[Drip] Tick done in ${Date.now() - started}ms — rules=${rules.length} matched=${totalMatched} jobsSent=${jobResult.sent} jobsFailed=${jobResult.failed}`
    );

    return { rules: rules.length, matched: totalMatched, ...jobResult };
  } finally {
    isRunning = false;
  }
}

function dripMarketingScheduler() {
  // Every minute — evaluate rules + send due WhatsApp jobs
  cron.schedule('* * * * *', async () => {
    try {
      await runDripMarketingTick();
    } catch (err) {
      console.error('[Drip] Scheduler tick error:', err.message);
    }
  });

  console.log('[Drip] Marketing scheduler started (every 1 minute)');
}

module.exports = dripMarketingScheduler;
module.exports.runDripMarketingTick = runDripMarketingTick;
