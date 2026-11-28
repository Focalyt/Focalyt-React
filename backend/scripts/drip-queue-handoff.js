/**
 * Check or release BullMQ ownership so node-cron cannot send jobs that are
 * still queued or in flight.
 *
 *   node scripts/drip-queue-handoff.js
 *   node scripts/drip-queue-handoff.js --release
 *
 * --release changes Mongo only when Redis has no active send jobs.
 * It never starts cron and never sends WhatsApp.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { mongodbUri } = require('../config');
const { DripMarketingJob } = require('../controllers/models');
const { getSendQueue, closeDripQueues } = require('../queues/dripQueues');
const { intEnv } = require('../queues/dripFlags');
const { createRedisConnection } = require('../queues/redisConnection');
const { runDripHandoff } = require('../queues/dripHandoff');

const release = process.argv.includes('--release');

async function main() {
  if (!mongodbUri) throw new Error('MIPIE_MONGODB_URI is not set');

  const ping = createRedisConnection();
  await ping.ping();
  await ping.quit();

  await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 15000 });
  const result = await runDripHandoff({
    model: DripMarketingJob,
    queue: getSendQueue(),
    release,
    claimTtlMs: intEnv('DRIP_CLAIM_TTL_MS', 120000),
    ambiguousAfterMs: intEnv('DRIP_SEND_LOCK_MS', 300000)
  });

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    component: 'drip',
    event: 'drip.handoff.report',
    ...result.report
  }));

  if (!result.ok) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      component: 'drip',
      event: 'drip.handoff.refused',
      reason: result.reason || 'queue ownership is still in flight',
      dripJobId: result.dripJobId || null
    }));
  } else if (release) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      component: 'drip',
      event: 'drip.handoff.released',
      reconciled: result.reconciled,
      reverted: result.reverted,
      released: result.released
    }));
  }

  await closeDripQueues();
  await mongoose.connection.close();
  process.exit(result.ok ? 0 : 1);
}

main().catch(async (err) => {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    component: 'drip',
    event: 'drip.handoff.failed',
    error: err.message
  }));
  try {
    await closeDripQueues();
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  } catch (closeErr) {
    // The original error is the one the operator needs.
  }
  process.exit(1);
});
