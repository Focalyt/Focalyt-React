const { getEvaluateQueue, DRIP_EVALUATE_SCHEDULER_ID } = require('./dripQueues');
const { dripLog } = require('./dripLogger');
const { isDripQueueEnabled } = require('./dripFlags');

/**
 * Idempotent every-minute evaluation scheduler.
 * upsertJobScheduler updates the same id, so process restarts do not add a second schedule.
 * Call this only from the worker process, and only while the feature flag is on.
 */
async function registerDripEvaluationScheduler() {
  if (!isDripQueueEnabled()) {
    dripLog('drip.scheduler.not_registered', { reason: 'DRIP_QUEUE_ENABLED is off' });
    return null;
  }

  const queue = getEvaluateQueue();
  const nextJob = await queue.upsertJobScheduler(
    DRIP_EVALUATE_SCHEDULER_ID,
    { every: 60000 },
    {
      name: 'evaluate-drip-campaigns',
      data: { source: 'scheduler' },
      opts: {
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: 200
      }
    }
  );

  dripLog('drip.scheduler.registered', {
    schedulerId: DRIP_EVALUATE_SCHEDULER_ID,
    everyMs: 60000,
    nextJobId: nextJob && nextJob.id ? String(nextJob.id) : null
  });

  return nextJob;
}

module.exports = { registerDripEvaluationScheduler };
