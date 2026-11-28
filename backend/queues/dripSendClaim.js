const { dripLog } = require('./dripLogger');
const { intEnv } = require('./dripFlags');
const {
  RetryableDripError,
  classifySendError,
  errorText
} = require('./dripErrors');

/**
 * Decide whether this worker may call WhatsApp for the current Mongo row.
 * bullJobId is the BullMQ job id (`drip-<mongoId>`), not proof of delivery.
 */
function decideClaim(job, { bullJobId, now, claimTtlMs, ambiguousAfterMs }) {
  if (!job) return { action: 'missing', reason: 'missing' };
  if (job.messageId || job.status === 'sent') {
    return { action: 'skip', reason: 'already_accepted' };
  }
  if (job.status === 'failed' || job.status === 'skipped' || job.status === 'reconciliation') {
    return { action: 'skip', reason: job.status };
  }

  const submittedAt = job.sendAttemptedAt ? new Date(job.sendAttemptedAt).getTime() : 0;
  if (submittedAt && !job.messageId) {
    const age = now - submittedAt;
    const sameDelivery = job.bullJobId && job.bullJobId === bullJobId;
    // The same BullMQ job is being redelivered. The request may already have
    // reached Meta, so this execution must not call the API again.
    if (sameDelivery || age >= ambiguousAfterMs) {
      return { action: 'reconcile', reason: 'ambiguous_outcome_after_submit' };
    }
    return { action: 'skip', reason: 'submit_in_progress' };
  }

  if (job.status === 'pending') {
    return { action: 'claim' };
  }

  if (job.status === 'processing') {
    const claimedAt = job.claimedAt ? new Date(job.claimedAt).getTime() : 0;
    const age = now - claimedAt;
    const ownsClaim = job.bullJobId && job.bullJobId === bullJobId;
    if (ownsClaim || age >= claimTtlMs) return { action: 'claim' };
    return { action: 'skip', reason: 'claimed_by_other' };
  }

  return { action: 'skip', reason: 'unknown_status' };
}

function recordedOutcome(doc) {
  if (!doc) return null;
  if (doc.messageId || doc.status === 'sent') {
    return { action: 'skip', reason: 'already_accepted' };
  }
  if (doc.status === 'reconciliation') {
    return { action: 'reconcile', reason: doc.reconciliationReason || 'ambiguous_outcome_after_submit' };
  }
  return null;
}

function timingOptions() {
  return {
    claimTtlMs: intEnv('DRIP_CLAIM_TTL_MS', 120000),
    ambiguousAfterMs: intEnv('DRIP_SEND_LOCK_MS', 300000)
  };
}

function createMongoRepo() {
  const { DripMarketingJob } = require('../controllers/models');

  function plain(doc) {
    if (!doc) return null;
    return typeof doc.toObject === 'function' ? doc.toObject() : doc;
  }

  function casFilter(doc) {
    const filter = {
      _id: doc._id,
      status: doc.status
    };
    if (doc.queueOwned === true) filter.queueOwned = true;
    else filter.queueOwned = { $ne: true };
    filter.sendAttemptedAt = doc.sendAttemptedAt || null;
    filter.messageId = doc.messageId || null;
    filter.claimedAt = doc.claimedAt || null;
    filter.bullJobId = doc.bullJobId || null;
    return filter;
  }

  return {
    async get(id) {
      const doc = await DripMarketingJob.findById(id);
      return plain(doc);
    },
    async cas(id, predicate, buildSet) {
      const current = await DripMarketingJob.findById(id);
      const doc = plain(current);
      if (!doc || !predicate(doc)) return { ok: false, doc };
      const updated = await DripMarketingJob.findOneAndUpdate(
        casFilter(doc),
        { $set: buildSet(doc) },
        { new: true }
      );
      if (!updated) {
        const again = await DripMarketingJob.findById(id);
        return { ok: false, doc: plain(again) };
      }
      return { ok: true, doc: plain(updated) };
    }
  };
}

function defaultSend(phone, templateId, collegeId, context) {
  if (process.env.DRIP_WHATSAPP_MOCK === '1') {
    throw new Error('DRIP_WHATSAPP_MOCK=1 refuses a real WhatsApp send');
  }
  const { sendWhatsAppTemplate } = require('../schedular/dripMarketingScheduler');
  return sendWhatsAppTemplate(phone, templateId, collegeId, context);
}

function defaultSaveOutgoing(payload) {
  const { saveDripOutgoingMessage } = require('../schedular/dripMarketingScheduler');
  return saveDripOutgoingMessage(payload);
}

async function defaultLoadDelivery(job) {
  const {
    DripMarketingRule,
    AppliedCourses,
    Lead
  } = require('../controllers/models');

  const rule = await DripMarketingRule.findById(job.ruleId).select('isActive endDate').lean();
  const now = new Date();
  const ruleActive = Boolean(
    rule
    && rule.isActive
    && (!rule.endDate || new Date(rule.endDate) >= now)
  );

  const leadType = job.leadType === 'b2b' ? 'b2b' : 'b2c';
  let lead = null;
  let phone = null;

  if (leadType === 'b2b') {
    lead = await Lead.findById(job.leadId)
      .populate('leadOwner', 'name')
      .populate('b2bProject', 'name')
      .lean();
    phone = lead ? (lead.whatsapp || lead.mobile) : null;
  } else {
    lead = await AppliedCourses.findById(job.leadId)
      .populate('_candidate', 'name mobile email gender')
      .populate('_course', 'name')
      .populate('counsellor', 'name')
      .populate('registeredBy', 'name')
      .populate('batch', 'name')
      .lean();
    phone = lead && lead._candidate ? lead._candidate.mobile : null;
  }

  return { ruleActive, lead, phone, leadType };
}

let testHooks = null;

function setDripSendTestHooks(hooks) {
  if (hooks && process.env.DRIP_WHATSAPP_MOCK !== '1') {
    throw new Error('Drip send test hooks require DRIP_WHATSAPP_MOCK=1');
  }
  testHooks = hooks || null;
}

async function claimAndSendDripJob(dripJobId, options = {}) {
  const hooked = testHooks || {};
  if (process.env.DRIP_WHATSAPP_MOCK === '1' && !options.send && !hooked.send) {
    throw new Error('DRIP_WHATSAPP_MOCK=1 requires an injected send function');
  }

  const repo = options.repo || createMongoRepo();
  const send = options.send || hooked.send || defaultSend;
  const saveOutgoing = options.saveOutgoing || hooked.saveOutgoing || defaultSaveOutgoing;
  const loadDelivery = options.loadDelivery || hooked.loadDelivery || defaultLoadDelivery;
  const bullJobId = String(options.bullJobId || `drip-${dripJobId}`);
  const attempt = Number(options.attempt || 1);
  const maxAttempts = intEnv('DRIP_SEND_ATTEMPTS', 3);
  const { claimTtlMs, ambiguousAfterMs } = timingOptions();
  const nowMs = options.now ? options.now().getTime() : Date.now();
  const decisionContext = () => ({
    bullJobId,
    now: Date.now(),
    claimTtlMs,
    ambiguousAfterMs
  });

  const existing = await repo.get(dripJobId);
  const initial = decideClaim(existing, { ...decisionContext(), now: nowMs });

  if (initial.action === 'missing') {
    dripLog('drip.send.missing', { dripJobId: String(dripJobId), bullJobId });
    return { action: 'missing' };
  }

  if (initial.action === 'reconcile') {
    await repo.cas(
      dripJobId,
      (doc) => decideClaim(doc, decisionContext()).action === 'reconcile',
      () => ({
        status: 'reconciliation',
        reconciliationReason: initial.reason,
        lastProcessedAt: new Date(),
        bullJobId
      })
    );
    dripLog('drip.send.reconciliation', {
      dripJobId: String(dripJobId),
      bullJobId,
      reason: initial.reason
    });
    return { action: 'reconcile', reason: initial.reason };
  }

  if (initial.action !== 'claim') {
    dripLog('drip.send.skip', {
      dripJobId: String(dripJobId),
      bullJobId,
      reason: initial.reason
    });
    return { action: 'skip', reason: initial.reason };
  }

  const claimed = await repo.cas(
    dripJobId,
    (doc) => decideClaim(doc, decisionContext()).action === 'claim',
    () => ({
      status: 'processing',
      claimedAt: new Date(),
      lastProcessedAt: new Date(),
      bullJobId,
      queueOwned: true
    })
  );

  if (!claimed.ok) {
    dripLog('drip.send.claim_lost', { dripJobId: String(dripJobId), bullJobId });
    return { action: 'skip', reason: 'claim_lost' };
  }

  let delivery;
  try {
    delivery = await loadDelivery(claimed.doc);
  } catch (err) {
    await repo.cas(
      dripJobId,
      (doc) => doc.status === 'processing' && doc.bullJobId === bullJobId && !doc.sendAttemptedAt && !doc.messageId,
      (doc) => ({
        status: 'pending',
        queueOwned: true,
        error: errorText(err),
        attempts: doc.attempts || 0,
        lastProcessedAt: new Date()
      })
    );
    dripLog('drip.send.retry', {
      dripJobId: String(dripJobId),
      bullJobId,
      reason: 'load_failed'
    });
    throw new RetryableDripError(errorText(err));
  }

  async function finishWithoutSubmit(setFields) {
    return repo.cas(
      dripJobId,
      (doc) => doc.status === 'processing' && doc.bullJobId === bullJobId && !doc.sendAttemptedAt && !doc.messageId,
      () => ({ ...setFields, lastProcessedAt: new Date(), bullJobId })
    );
  }

  if (!delivery.ruleActive) {
    await finishWithoutSubmit({
      status: 'skipped',
      error: 'Rule is inactive, deleted, or ended'
    });
    dripLog('drip.send.skipped_inactive', { dripJobId: String(dripJobId), bullJobId });
    return { action: 'skipped', reason: 'inactive_rule' };
  }

  if (!delivery.lead) {
    await finishWithoutSubmit({ status: 'skipped', error: 'Lead not found' });
    dripLog('drip.send.skipped_lead', { dripJobId: String(dripJobId), bullJobId });
    return { action: 'skipped', reason: 'lead_not_found' };
  }

  if (!delivery.phone) {
    await finishWithoutSubmit({
      status: 'failed',
      error: 'Lead has no mobile number',
      attempts: (claimed.doc.attempts || 0) + 1
    });
    dripLog('drip.send.permanent_failure', {
      dripJobId: String(dripJobId),
      bullJobId,
      reason: 'no_mobile'
    });
    return { action: 'failed', reason: 'no_mobile' };
  }

  if (claimed.doc.mode && claimed.doc.mode !== 'whatsapp') {
    await finishWithoutSubmit({
      status: 'skipped',
      error: `Mode ${claimed.doc.mode} not implemented`
    });
    dripLog('drip.send.skipped_mode', {
      dripJobId: String(dripJobId),
      bullJobId,
      mode: claimed.doc.mode
    });
    return { action: 'skipped', reason: 'mode' };
  }

  const marked = await repo.cas(
    dripJobId,
    (doc) => doc.status === 'processing' && doc.bullJobId === bullJobId && !doc.sendAttemptedAt && !doc.messageId,
    () => ({
      sendAttemptedAt: new Date(),
      lastProcessedAt: new Date()
    })
  );

  if (!marked.ok) {
    dripLog('drip.send.skip', {
      dripJobId: String(dripJobId),
      bullJobId,
      reason: 'submit_marker_lost'
    });
    return { action: 'skip', reason: 'submit_marker_lost' };
  }

  try {
    const result = await send(delivery.phone, claimed.doc.templateId, claimed.doc.collegeId, {
      lead: delivery.lead,
      leadType: delivery.leadType
    });
    const messageId = result && result.messageId ? result.messageId : null;
    if (!messageId) {
      await repo.cas(
        dripJobId,
        (doc) => !doc.messageId && (doc.status === 'processing' || doc.status === 'reconciliation'),
        (doc) => ({
          status: 'reconciliation',
          reconciliationReason: 'response_without_message_id',
          error: 'WhatsApp response did not include a message id',
          attempts: (doc.attempts || 0) + 1,
          lastProcessedAt: new Date()
        })
      );
      dripLog('drip.send.reconciliation', {
        dripJobId: String(dripJobId),
        bullJobId,
        reason: 'response_without_message_id'
      });
      return { action: 'reconcile', reason: 'response_without_message_id' };
    }

    const saved = await repo.cas(
      dripJobId,
      (doc) => !doc.messageId && (doc.status === 'processing' || doc.status === 'reconciliation'),
      (doc) => ({
        status: 'sent',
        messageId,
        phone: result.phone || null,
        sentAt: new Date(),
        error: null,
        attempts: (doc.attempts || 0) + 1,
        lastProcessedAt: new Date()
      })
    );

    if (saved.ok) {
      try {
        await saveOutgoing({
          collegeId: claimed.doc.collegeId,
          phone: result.phone,
          templateName: result.templateName || claimed.doc.templateId,
          messageId,
          lead: delivery.lead,
          leadType: delivery.leadType
        });
      } catch (saveErr) {
        dripLog('drip.send.history_write_failed', {
          dripJobId: String(dripJobId),
          bullJobId,
          error: saveErr.message
        });
      }
    }

    dripLog('drip.send.accepted', {
      dripJobId: String(dripJobId),
      bullJobId,
      hasMessageId: true
    });
    return { action: 'sent', messageId };
  } catch (err) {
    const classified = classifySendError(err);
    const detail = errorText(err);

    if (classified.kind === 'retry' && attempt < maxAttempts) {
      const retried = await repo.cas(
        dripJobId,
        (doc) => doc.status === 'processing' && doc.bullJobId === bullJobId && !doc.messageId,
        (doc) => ({
          status: 'pending',
          queueOwned: true,
          sendAttemptedAt: null,
          error: detail,
          attempts: (doc.attempts || 0) + 1,
          lastProcessedAt: new Date()
        })
      );
      const recorded = recordedOutcome(retried.ok ? null : retried.doc);
      if (recorded) return recorded;
      dripLog('drip.send.retry', {
        dripJobId: String(dripJobId),
        bullJobId,
        attempt,
        reason: classified.reason
      });
      throw new RetryableDripError(classified.reason);
    }

    if (classified.kind === 'reconciliation') {
      await repo.cas(
        dripJobId,
        (doc) => !doc.messageId && (doc.status === 'processing' || doc.status === 'reconciliation'),
        (doc) => ({
          status: 'reconciliation',
          reconciliationReason: classified.reason,
          error: detail,
          attempts: (doc.attempts || 0) + 1,
          lastProcessedAt: new Date()
        })
      );
      dripLog('drip.send.reconciliation', {
        dripJobId: String(dripJobId),
        bullJobId,
        reason: classified.reason
      });
      return { action: 'reconcile', reason: classified.reason };
    }

    const failedWrite = await repo.cas(
      dripJobId,
      (doc) => doc.status === 'processing' && doc.bullJobId === bullJobId && !doc.messageId,
      (doc) => ({
        status: 'failed',
        error: detail,
        attempts: (doc.attempts || 0) + 1,
        lastProcessedAt: new Date()
      })
    );
    const recorded = recordedOutcome(failedWrite.ok ? null : failedWrite.doc);
    if (recorded) return recorded;
    dripLog('drip.send.permanent_failure', {
      dripJobId: String(dripJobId),
      bullJobId,
      attempt,
      reason: classified.reason
    });
    return { action: 'failed', reason: classified.reason };
  }
}

module.exports = {
  decideClaim,
  claimAndSendDripJob,
  createMongoRepo,
  setDripSendTestHooks
};
