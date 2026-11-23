const { createLeadProcessor } = require('./metaLeadProcessor');

const DEFAULT_INTERVAL_MS = 15000;
const DEFAULT_BATCH_SIZE = 5;

let timer = null;
let started = false;
let ticking = false;
let stopRequested = false;
let activeTick = null;
let initialRun = Promise.resolve();
let clearTimer = clearInterval;
let logger = console;

function isDesignatedWorkerProcess() {
  const instance = process.env.NODE_APP_INSTANCE;
  if (instance === undefined || instance === null || String(instance).trim() === '') return true;
  return String(instance) === '0';
}

function defaultDbReady() {
  const mongoose = require('mongoose');
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}

function safeErrorMessage(error) {
  const raw = error && error.message ? String(error.message) : 'unknown error';
  return raw
    .replace(/access_token=[^&\s]+/gi, 'access_token=[redacted]')
    .replace(/appsecret_proof=[^&\s]+/gi, 'appsecret_proof=[redacted]')
    .replace(/input_token=[^&\s]+/gi, 'input_token=[redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b\d{10,}\b/g, '[redacted-number]')
    .slice(0, 240);
}

function summarize(results) {
  const counts = {
    completed: 0,
    failed: 0,
    pending: 0,
    mapping_pending: 0,
    processing: 0,
  };
  results.forEach((doc) => {
    const status = doc && doc.processingStatus;
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  });
  return counts;
}

function idleHandle(reason) {
  return {
    started: false,
    duplicate: false,
    reason,
    initialRun: Promise.resolve(),
    stop: stopMetaLeadWorker,
  };
}

function stopMetaLeadWorker() {
  const wasRunning = started || Boolean(timer) || Boolean(activeTick);
  stopRequested = true;
  if (timer) {
    clearTimer(timer);
    timer = null;
  }
  const pending = activeTick || Promise.resolve();
  if (wasRunning) logger.info('[meta] Lead worker stopped.');
  return pending.finally(() => {
    started = false;
    ticking = false;
    stopRequested = false;
    activeTick = null;
  });
}

function startMetaLeadWorker(options = {}) {
  logger = options.logger || console;
  const isEnabled = options.isEnabled || isDesignatedWorkerProcess;
  const isDbReady = options.isDbReady || defaultDbReady;
  const intervalMs = Number(options.intervalMs) > 0 ? Number(options.intervalMs) : DEFAULT_INTERVAL_MS;
  const batchSize = Number(options.batchSize) > 0 ? Number(options.batchSize) : DEFAULT_BATCH_SIZE;
  const setIntervalFn = options.setIntervalFn || setInterval;
  const clearIntervalFn = options.clearIntervalFn || clearInterval;
  const createProcessor = options.createProcessor || (() => createLeadProcessor());

  if (!isEnabled()) {
    const instance = process.env.NODE_APP_INSTANCE;
    logger.info(`[meta] Lead worker skipped. This PM2 instance is not the designated worker. instance=${instance}`);
    return idleHandle('not-designated');
  }

  if (!isDbReady()) {
    logger.warn('[meta] Lead worker not started. MongoDB is not connected.');
    return idleHandle('database-not-ready');
  }

  if (started) {
    logger.info('[meta] Lead worker already running. Duplicate start ignored.');
    return {
      started: true,
      duplicate: true,
      reason: 'already-running',
      initialRun,
      stop: stopMetaLeadWorker,
    };
  }

  let processor;
  try {
    processor = createProcessor();
  } catch (error) {
    logger.error(`[meta] Lead worker failed to start. reason=${safeErrorMessage(error)}`);
    return idleHandle('start-failed');
  }

  async function tick(source) {
    if (stopRequested || ticking) return null;
    ticking = true;
    const run = (async () => {
      try {
        if (source === 'startup') {
          logger.info('[meta] Lead worker processing startup batch of pending events.');
        }
        const results = await processor.processDue(batchSize);
        const list = Array.isArray(results) ? results : [];
        const counts = summarize(list);
        if (source === 'startup' || list.length > 0) {
          logger.info(
            `[meta] Lead worker batch complete. source=${source} claimed=${list.length} completed=${counts.completed} failed=${counts.failed} pending=${counts.pending} mapping_pending=${counts.mapping_pending}`,
          );
        }
        return list;
      } catch (error) {
        logger.error(`[meta] Lead worker batch failed. source=${source} reason=${safeErrorMessage(error)}`);
        return null;
      } finally {
        ticking = false;
        activeTick = null;
      }
    })();
    activeTick = run;
    return run;
  }

  started = true;
  stopRequested = false;
  clearTimer = clearIntervalFn;
  initialRun = tick('startup');

  try {
    timer = setIntervalFn(() => tick('interval'), intervalMs);
    if (timer && typeof timer.unref === 'function') timer.unref();
  } catch (error) {
    started = false;
    logger.error(`[meta] Lead worker failed to start. reason=${safeErrorMessage(error)}`);
    return idleHandle('start-failed');
  }

  const instanceLabel = process.env.NODE_APP_INSTANCE;
  const instanceText = instanceLabel === undefined || String(instanceLabel).trim() === ''
    ? ''
    : ` instance=${instanceLabel}`;
  logger.info(`[meta] Lead worker started after MongoDB connection. intervalMs=${intervalMs}${instanceText}`);
  return {
    started: true,
    duplicate: false,
    reason: 'started',
    initialRun,
    stop: stopMetaLeadWorker,
  };
}

module.exports = {
  startMetaLeadWorker,
  stopMetaLeadWorker,
  isDesignatedWorkerProcess,
};
