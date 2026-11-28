const { Queue } = require('bullmq');
const { createRedisConnection, queuePrefix } = require('./redisConnection');
const { intEnv } = require('./dripFlags');

const DRIP_EVALUATE_QUEUE = 'drip-evaluate';
const DRIP_SEND_QUEUE = 'drip-send';
const DRIP_EVALUATE_SCHEDULER_ID = 'drip-evaluation-scheduler';

let evaluateQueue;
let sendQueue;

function queueOptions() {
  return {
    connection: createRedisConnection(),
    prefix: queuePrefix()
  };
}

function sendJobOptions() {
  return {
    attempts: intEnv('DRIP_SEND_ATTEMPTS', 3),
    backoff: {
      type: 'exponential',
      delay: intEnv('DRIP_SEND_BACKOFF_MS', 5000)
    },
    removeOnComplete: false,
    removeOnFail: false
  };
}

function getEvaluateQueue() {
  if (!evaluateQueue) {
    evaluateQueue = new Queue(DRIP_EVALUATE_QUEUE, queueOptions());
  }
  return evaluateQueue;
}

function getSendQueue() {
  if (!sendQueue) {
    sendQueue = new Queue(DRIP_SEND_QUEUE, queueOptions());
  }
  return sendQueue;
}

async function closeDripQueues() {
  const queues = [evaluateQueue, sendQueue].filter(Boolean);
  evaluateQueue = null;
  sendQueue = null;
  await Promise.all(queues.map(async (queue) => {
    try {
      await Promise.race([
        queue.close(),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
    } catch (err) {
      // A stuck Redis close must not keep the process alive.
    }
    try {
      queue.disconnect();
    } catch (err) {
      // The connection may already be closed.
    }
  }));
}

module.exports = {
  DRIP_EVALUATE_QUEUE,
  DRIP_SEND_QUEUE,
  DRIP_EVALUATE_SCHEDULER_ID,
  getEvaluateQueue,
  getSendQueue,
  closeDripQueues,
  sendJobOptions
};
