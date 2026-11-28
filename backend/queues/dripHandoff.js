const { sendJobId } = require('./producers/dripProducer');

function ageMs(value, now) {
  if (!value) return Number.POSITIVE_INFINITY;
  return now - new Date(value).getTime();
}

async function removeBullJobIfIdle(queue, dripJobId) {
  const bullJob = await queue.getJob(sendJobId(dripJobId));
  if (!bullJob) return 'absent';
  const state = await bullJob.getState();
  if (state === 'active') return 'active';
  await bullJob.remove();
  return state;
}

/**
 * Move queue-owned drip rows back to cron only when no send is in flight.
 * Rows already submitted to WhatsApp become reconciliation and are not released for resend.
 */
async function runDripHandoff({
  model,
  queue,
  release = false,
  claimTtlMs = 120000,
  ambiguousAfterMs = 300000,
  now = Date.now()
}) {
  const active = await queue.getActiveCount();
  const processing = await model.find({ status: 'processing' })
    .select('_id claimedAt sendAttemptedAt messageId')
    .lean();
  const queueOwnedPending = await model.countDocuments({
    status: 'pending',
    queueOwned: true,
    sendAttemptedAt: null,
    messageId: null
  });
  const reconciliation = await model.countDocuments({ status: 'reconciliation' });
  const freshProcessing = processing.filter((job) => {
    if (job.messageId) return false;
    if (job.sendAttemptedAt) return ageMs(job.sendAttemptedAt, now) < ambiguousAfterMs;
    return ageMs(job.claimedAt, now) < claimTtlMs;
  });

  const report = {
    mode: release ? 'release' : 'check',
    activeBullSendJobs: active,
    processing: processing.length,
    freshProcessing: freshProcessing.length,
    queueOwnedPending,
    reconciliation
  };

  const blocked = active > 0 || freshProcessing.length > 0 || queueOwnedPending > 0 || processing.length > 0;
  if (!release) {
    return { ok: !blocked, refused: blocked, report, reconciled: 0, reverted: 0, released: 0 };
  }

  if (active > 0) {
    return { ok: false, refused: true, reason: 'active send jobs are still running', report, reconciled: 0, reverted: 0, released: 0 };
  }
  if (freshProcessing.length > 0) {
    return { ok: false, refused: true, reason: 'processing claims are still inside the lock window', report, reconciled: 0, reverted: 0, released: 0 };
  }

  let reconciled = 0;
  let reverted = 0;
  for (const job of processing) {
    if (job.messageId) continue;
    if (job.sendAttemptedAt) {
      await model.updateOne(
        { _id: job._id, status: 'processing', messageId: null },
        {
          $set: {
            status: 'reconciliation',
            reconciliationReason: 'abandoned_after_submit',
            lastProcessedAt: new Date(now)
          }
        }
      );
      reconciled += 1;
      continue;
    }

    const removed = await removeBullJobIfIdle(queue, job._id);
    if (removed === 'active') {
      return {
        ok: false,
        refused: true,
        reason: 'a send job became active during release',
        dripJobId: String(job._id),
        report,
        reconciled,
        reverted,
        released: 0
      };
    }

    await model.updateOne(
      { _id: job._id, status: 'processing', sendAttemptedAt: null, messageId: null },
      {
        $set: {
          status: 'pending',
          queueOwned: false,
          bullJobId: null,
          claimedAt: null,
          lastProcessedAt: new Date(now)
        }
      }
    );
    reverted += 1;
  }

  const pending = await model.find({
    status: 'pending',
    queueOwned: true,
    sendAttemptedAt: null,
    messageId: null
  }).select('_id').lean();

  let released = 0;
  for (const job of pending) {
    const removed = await removeBullJobIfIdle(queue, job._id);
    if (removed === 'active') {
      return {
        ok: false,
        refused: true,
        reason: 'a send job became active during release',
        dripJobId: String(job._id),
        report,
        reconciled,
        reverted,
        released
      };
    }
    await model.updateOne(
      { _id: job._id, status: 'pending', queueOwned: true, sendAttemptedAt: null, messageId: null },
      { $set: { queueOwned: false, bullJobId: null } }
    );
    released += 1;
  }

  return { ok: true, refused: false, report, reconciled, reverted, released };
}

module.exports = { runDripHandoff };
