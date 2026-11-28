const { Worker } = require('bullmq');
const { createRedisConnection, queuePrefix } = require('../queues/redisConnection');
const { DRIP_EVALUATE_QUEUE } = require('../queues/dripQueues');
const { isDripQueueEnabled, intEnv } = require('../queues/dripFlags');
const { dripLog } = require('../queues/dripLogger');

function startDripEvaluateWorker() {
  const lockMs = intEnv('DRIP_EVALUATE_LOCK_MS', 600000);
  const connection = createRedisConnection();
  const lockConnection = createRedisConnection();

  const worker = new Worker(
    DRIP_EVALUATE_QUEUE,
    async (job) => {
      if (!isDripQueueEnabled()) {
        dripLog('drip.evaluate.skipped_flag_off', { bullJobId: job.id });
        return { skipped: true, reason: 'queue_disabled' };
      }

      const lockKey = `${queuePrefix()}:drip-evaluate-lock`;
      const locked = await lockConnection.set(lockKey, String(job.id), 'PX', lockMs, 'NX');
      if (locked !== 'OK') {
        dripLog('drip.evaluate.skipped_lock', { bullJobId: job.id });
        return { skipped: true, reason: 'locked' };
      }

      dripLog('drip.evaluate.start', { bullJobId: job.id, source: job.data && job.data.source });
      try {
        const { runDripMarketingTick } = require('../schedular/dripMarketingScheduler');
        const result = await runDripMarketingTick({ enqueueOnly: true });
        dripLog('drip.evaluate.done', {
          bullJobId: job.id,
          matched: result && result.matched,
          enqueued: result && result.enqueued,
          skipped: Boolean(result && result.skipped)
        });
        return result;
      } finally {
        try {
          const owner = await lockConnection.get(lockKey);
          if (owner === String(job.id)) await lockConnection.del(lockKey);
        } catch (unlockErr) {
          dripLog('drip.evaluate.unlock_failed', { bullJobId: job.id, error: unlockErr.message });
        }
      }
    },
    {
      connection,
      prefix: queuePrefix(),
      concurrency: 1
    }
  );

  worker.on('failed', (job, err) => {
    dripLog('drip.evaluate.failed', {
      bullJobId: job && job.id,
      error: err && err.message
    });
  });

  worker.on('error', (err) => {
    dripLog('drip.evaluate.worker_error', { error: err.message });
  });

  const close = worker.close.bind(worker);
  worker.close = async (...args) => {
    const result = await close(...args);
    await lockConnection.quit();
    return result;
  };

  return worker;
}

module.exports = { startDripEvaluateWorker };
