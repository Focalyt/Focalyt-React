const { getEvaluateQueue, getSendQueue, sendJobOptions } = require('../dripQueues');
const { dripLog } = require('../dripLogger');

function sendJobId(dripJobId) {
  return `drip-${dripJobId}`;
}

function isDuplicateJobError(err) {
  const message = err && err.message ? String(err.message) : '';
  return /already exists|jobid.*exists|duplicate/i.test(message);
}

/**
 * Add one send job. The custom job id blocks a second waiting job for the same Mongo id.
 * A custom id does not make WhatsApp delivery exactly-once; the Mongo claim does that.
 */
async function enqueueSendJob(dripJobId, options = {}) {
  const queue = getSendQueue();
  const jobId = sendJobId(dripJobId);
  const existing = await queue.getJob(jobId);

  if (existing) {
    const state = await existing.getState();
    const finished = state === 'completed' || state === 'failed';
    if (!(finished && options.replaceFinished)) {
      dripLog('drip.send.duplicate_skipped', {
        dripJobId: String(dripJobId),
        bullJobId: jobId,
        state
      });
      return { jobId, duplicate: true, state };
    }
    await existing.remove();
    dripLog('drip.send.finished_job_replaced', {
      dripJobId: String(dripJobId),
      bullJobId: jobId,
      state
    });
  }

  try {
    const job = await queue.add(
      'send-whatsapp',
      { dripJobId: String(dripJobId) },
      {
        ...sendJobOptions(),
        jobId
      }
    );
    dripLog('drip.send.enqueued', {
      dripJobId: String(dripJobId),
      bullJobId: job.id
    });
    return { jobId: job.id, duplicate: false };
  } catch (err) {
    if (!isDuplicateJobError(err)) throw err;
    dripLog('drip.send.duplicate_skipped', {
      dripJobId: String(dripJobId),
      bullJobId: jobId,
      state: 'race'
    });
    return { jobId, duplicate: true, state: 'race' };
  }
}

async function enqueueEvaluation(data = {}) {
  const queue = getEvaluateQueue();
  const job = await queue.add(
    'evaluate-drip-campaigns',
    { source: data.source || 'manual', requestedAt: new Date().toISOString() },
    {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 1
    }
  );
  dripLog('drip.evaluate.enqueued', { bullJobId: job.id, source: data.source || 'manual' });
  return job;
}

module.exports = {
  sendJobId,
  enqueueSendJob,
  enqueueEvaluation
};
