const IORedis = require('ioredis');

function redisUrl() {
  return process.env.REDIS_URL || 'redis://127.0.0.1:6379';
}

function queuePrefix() {
  return process.env.QUEUE_PREFIX || 'focalyt-local';
}

/**
 * BullMQ requires maxRetriesPerRequest: null on blocking connections.
 * Each Queue and Worker gets its own connection.
 */
function createRedisConnection() {
  return new IORedis(redisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });
}

module.exports = {
  redisUrl,
  queuePrefix,
  createRedisConnection
};
