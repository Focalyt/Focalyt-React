/**
 * Drip queue worker process. Start this separately from the Express API.
 *
 * Refuses to register the scheduler or open workers unless DRIP_QUEUE_ENABLED=true.
 * Does not send WhatsApp by itself when the flag is off.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const { isDripQueueEnabled } = require('./queues/dripFlags');
const { dripLog } = require('./queues/dripLogger');
const { createRedisConnection } = require('./queues/redisConnection');
const { registerDripEvaluationScheduler } = require('./queues/dripScheduler');
const { closeDripQueues } = require('./queues/dripQueues');
const { startDripEvaluateWorker } = require('./workers/dripEvaluate.worker');
const { startDripSendWorker } = require('./workers/dripSend.worker');

if (!isDripQueueEnabled()) {
  dripLog('drip.worker.disabled', {
    reason: 'DRIP_QUEUE_ENABLED is off. node-cron remains the sender. This process will not register a scheduler.'
  });
  process.exit(0);
}

const { mongodbUri } = require('./config');

let evaluateWorker;
let sendWorker;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  dripLog('drip.worker.shutdown', { signal });

  try {
    if (evaluateWorker) await evaluateWorker.close();
    if (sendWorker) await sendWorker.close();
    await closeDripQueues();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (err) {
    dripLog('drip.worker.shutdown_failed', { signal, error: err.message });
    process.exit(1);
  }
}

async function start() {
  if (!mongodbUri) {
    dripLog('drip.worker.mongo_missing', { error: 'MIPIE_MONGODB_URI is not set' });
    process.exit(1);
  }

  await mongoose.connect(mongodbUri, {
    socketTimeoutMS: 300000,
    serverSelectionTimeoutMS: 15000
  });
  dripLog('drip.worker.mongo_ready', {});

  const ping = createRedisConnection();
  try {
    const reply = await ping.ping();
    dripLog('drip.worker.redis_ready', { reply });
  } finally {
    await ping.quit();
  }

  await registerDripEvaluationScheduler();
  evaluateWorker = startDripEvaluateWorker();
  sendWorker = startDripSendWorker();
  dripLog('drip.worker.ready', {});
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => {
  dripLog('drip.worker.unhandled_rejection', {
    error: err && err.message ? err.message : 'unknown'
  });
});

start().catch((err) => {
  dripLog('drip.worker.start_failed', { error: err.message });
  process.exit(1);
});
