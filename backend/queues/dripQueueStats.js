const { getEvaluateQueue, getSendQueue } = require('./dripQueues');

async function countQueue(queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);

  return { waiting, active, completed, failed, delayed };
}

async function getDripQueueCounts() {
  const [evaluate, send] = await Promise.all([
    countQueue(getEvaluateQueue()),
    countQueue(getSendQueue())
  ]);

  return { evaluate, send };
}

module.exports = { getDripQueueCounts };
