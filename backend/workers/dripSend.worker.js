const { Worker, UnrecoverableError } = require('bullmq');
const { createRedisConnection, queuePrefix } = require('../queues/redisConnection');
const { DRIP_SEND_QUEUE } = require('../queues/dripQueues');
const { isDripQueueEnabled, intEnv } = require('../queues/dripFlags');
const { dripLog } = require('../queues/dripLogger');
const { claimAndSendDripJob } = require('../queues/dripSendClaim');
const { RetryableDripError } = require('../queues/dripErrors');

function startDripSendWorker() {
  const connection = createRedisConnection();
  const concurrency = intEnv('DRIP_SEND_CONCURRENCY', 5);
  const limiterMax = intEnv('DRIP_SEND_RATE_MAX', 10);
  const limiterDuration = intEnv('DRIP_SEND_RATE_DURATION', 1000);
  const lockDuration = intEnv('DRIP_SEND_LOCK_MS', 300000);

  const worker = new Worker(
    DRIP_SEND_QUEUE,
    async (job) => {
      if (!isDripQueueEnabled()) {
        dripLog('drip.send.skipped_flag_off', { bullJobId: job.id });
        return { skipped: true, reason: 'queue_disabled' };
      }

      const dripJobId = job.data && job.data.dripJobId;
      if (!dripJobId) {
        throw new UnrecoverableError('send job is missing dripJobId');
      }

      dripLog('drip.send.start', {
        bullJobId: job.id,
        dripJobId: String(dripJobId),
        attempt: job.attemptsMade + 1
      });

      try {
        const result = await claimAndSendDripJob(dripJobId, {
          bullJobId: job.id,
          attempt: job.attemptsMade + 1
        });

        if (result.action === 'failed') {
          throw new UnrecoverableError(result.reason || 'permanent_failure');
        }
        if (result.action === 'skip' && result.reason === 'submit_in_progress') {
          throw new RetryableDripError('submit_in_progress');
        }

        dripLog('drip.send.finished', {
          bullJobId: job.id,
          dripJobId: String(dripJobId),
          action: result.action,
          reason: result.reason || null
        });
        return result;
      } catch (err) {
        if (err instanceof RetryableDripError) throw err;
        if (err instanceof UnrecoverableError) throw err;
        dripLog('drip.send.worker_exception', {
          bullJobId: job.id,
          dripJobId: String(dripJobId),
          error: err.message
        });
        throw err;
      }
    },
    {
      connection,
      prefix: queuePrefix(),
      concurrency,
      lockDuration,
      stalledInterval: intEnv('DRIP_STALLED_INTERVAL_MS', 30000),
      maxStalledCount: intEnv('DRIP_MAX_STALLED_COUNT', 1),
      limiter: {
        max: limiterMax,
        duration: limiterDuration
      }
    }
  );

  worker.on('failed', (job, err) => {
    dripLog('drip.send.job_failed', {
      bullJobId: job && job.id,
      dripJobId: job && job.data && job.data.dripJobId,
      attempt: job && job.attemptsMade,
      error: err && err.message
    });
  });

  worker.on('error', (err) => {
    dripLog('drip.send.worker_error', { error: err.message });
  });

  dripLog('drip.send.worker_started', {
    concurrency,
    rateMax: limiterMax,
    rateDurationMs: limiterDuration,
    lockMs: lockDuration
  });

  return worker;
}

module.exports = { startDripSendWorker };
