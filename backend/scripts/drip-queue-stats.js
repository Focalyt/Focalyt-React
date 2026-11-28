/**
 * Print waiting, active, completed, failed, and delayed counts.
 * Does not send WhatsApp and does not change jobs.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { getDripQueueCounts } = require('../queues/dripQueueStats');
const { closeDripQueues } = require('../queues/dripQueues');
const { createRedisConnection, queuePrefix } = require('../queues/redisConnection');

async function main() {
  const ping = createRedisConnection();
  await ping.ping();
  await ping.quit();

  const counts = await getDripQueueCounts();
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    component: 'drip',
    event: 'drip.queue.counts',
    prefix: queuePrefix(),
    ...counts
  }));
  await closeDripQueues();
}

main().catch(async (err) => {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    component: 'drip',
    event: 'drip.queue.counts_failed',
    error: err.message
  }));
  try { await closeDripQueues(); } catch (closeErr) { /* ignore */ }
  process.exit(1);
});
