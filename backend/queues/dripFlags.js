/**
 * Drip queue feature flag and the cron/queue ownership check.
 * Default is off: an empty or unrecognized value keeps node-cron as the sender.
 */

function isDripQueueEnabled() {
  const raw = String(process.env.DRIP_QUEUE_ENABLED || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

/**
 * Jobs the legacy cron sender is allowed to pick up.
 * Queue-owned, in-flight, already submitted, and already accepted rows are excluded
 * so cron cannot resume a campaign BullMQ still owns.
 */
function isCronSendable(job) {
  if (!job) return false;
  if (job.status !== 'pending') return false;
  if (job.queueOwned === true) return false;
  if (job.sendAttemptedAt) return false;
  if (job.messageId) return false;
  return true;
}

function intEnv(name, fallback) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

module.exports = {
  isDripQueueEnabled,
  isCronSendable,
  intEnv
};
