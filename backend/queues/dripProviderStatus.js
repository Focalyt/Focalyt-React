const { DripMarketingJob } = require('../controllers/models');

/**
 * Store a webhook delivery state without changing API-acceptance status.
 * Repeated webhooks for the same message id only refresh providerStatus.
 */
async function recordDripProviderStatus(messageId, statusValue, timestamp) {
  if (!messageId || !statusValue) return { matched: 0 };

  const providerStatusAt = timestamp
    ? new Date(parseInt(timestamp, 10) * 1000)
    : new Date();

  const result = await DripMarketingJob.updateMany(
    { messageId: String(messageId) },
    { $set: { providerStatus: statusValue, providerStatusAt } }
  );

  return {
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0
  };
}

module.exports = { recordDripProviderStatus };
