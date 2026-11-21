const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  startMetaLeadWorker,
  stopMetaLeadWorker,
} = require('../services/meta/metaLeadWorker');

function createLogger() {
  const lines = [];
  const record = (level, args) => {
    lines.push(`${level} ${args.map(item => String(item)).join(' ')}`);
  };
  return {
    lines,
    info(...args) { record('info', args); },
    warn(...args) { record('warn', args); },
    error(...args) { record('error', args); },
  };
}

function createFakeTimers() {
  const intervals = [];
  return {
    intervals,
    setInterval(fn, ms) {
      const handle = {
        fn,
        ms,
        unref() { return this; },
      };
      intervals.push(handle);
      return handle;
    },
    clearInterval(handle) {
      const index = intervals.indexOf(handle);
      if (index >= 0) intervals.splice(index, 1);
    },
  };
}

function workerOptions(overrides = {}) {
  const timers = overrides.timers || createFakeTimers();
  const logger = overrides.logger || createLogger();
  const calls = overrides.calls || [];
  const options = {
    isDbReady: () => true,
    isEnabled: () => true,
    intervalMs: 15000,
    batchSize: 5,
    setIntervalFn: timers.setInterval,
    clearIntervalFn: timers.clearInterval,
    logger,
    createProcessor: overrides.createProcessor || (() => ({
      async processDue() {
        calls.push('processDue');
        return overrides.results || [];
      },
    })),
  };
  return { timers, logger, calls, options };
}

test.describe('meta lead worker', { concurrency: false }, () => {
  test.afterEach(async () => {
    await stopMetaLeadWorker();
    delete process.env.NODE_APP_INSTANCE;
  });

  test('starts only after MongoDB is connected and processes pending events immediately', async () => {
    const pending = workerOptions();
    const early = startMetaLeadWorker({
      ...pending.options,
      isDbReady: () => false,
    });
    assert.equal(early.started, false);
    assert.equal(early.reason, 'database-not-ready');
    assert.equal(pending.timers.intervals.length, 0);
    assert.equal(pending.calls.length, 0);
    assert.match(pending.logger.lines.join('\n'), /MongoDB is not connected/);

    const ready = startMetaLeadWorker({
      ...pending.options,
      isDbReady: () => true,
      results: undefined,
      createProcessor: () => ({
        async processDue() {
          pending.calls.push('processDue');
          return [
            { processingStatus: 'completed' },
            { processingStatus: 'failed' },
          ];
        },
      }),
    });
    assert.equal(ready.started, true);
    assert.equal(ready.duplicate, false);
    await ready.initialRun;

    assert.equal(pending.calls.length, 1);
    assert.equal(pending.timers.intervals.length, 1);
    assert.equal(pending.timers.intervals[0].ms, 15000);
    const logs = pending.logger.lines.join('\n');
    assert.match(logs, /Lead worker started after MongoDB connection/);
    assert.match(logs, /processing startup batch of pending events/);
    assert.match(logs, /source=startup claimed=2 completed=1 failed=1 pending=0 mapping_pending=0/);
  });

  test('ignores a second start so only one interval can claim events', async () => {
    let active = 0;
    let maxActive = 0;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const calls = [];
    const { timers, logger, options } = workerOptions({
      createProcessor: () => ({
        async processDue() {
          calls.push('processDue');
          active += 1;
          maxActive = Math.max(maxActive, active);
          try {
            await gate;
            return [{ processingStatus: 'completed' }];
          } finally {
            active -= 1;
          }
        },
      }),
    });

    const first = startMetaLeadWorker(options);
    const second = startMetaLeadWorker(options);
    assert.equal(second.duplicate, true);
    assert.equal(second.started, true);
    assert.equal(timers.intervals.length, 1);
    assert.equal(calls.length, 1);

    const overlapped = timers.intervals[0].fn();
    assert.equal(calls.length, 1);
    assert.equal(maxActive, 1);
    release();
    await first.initialRun;
    await overlapped;
    assert.equal(maxActive, 1);
    assert.match(logger.lines.join('\n'), /Duplicate start ignored/);

    await stopMetaLeadWorker();
    assert.equal(timers.intervals.length, 0);
    assert.match(logger.lines.join('\n'), /Lead worker stopped/);
  });

  test('does not start a second worker on a non-zero PM2 instance', async () => {
    const { timers, calls, logger, options } = workerOptions();
    process.env.NODE_APP_INSTANCE = '1';
    const skipped = startMetaLeadWorker({
      ...options,
      isEnabled: undefined,
    });
    delete options.isEnabled;
    const handled = startMetaLeadWorker({
      isDbReady: () => true,
      intervalMs: 15000,
      setIntervalFn: timers.setInterval,
      clearIntervalFn: timers.clearInterval,
      logger,
      createProcessor: options.createProcessor,
    });
    assert.equal(handled.started, false);
    assert.equal(handled.reason, 'not-designated');
    assert.equal(timers.intervals.length, 0);
    assert.equal(calls.length, 0);
    assert.match(logger.lines.join('\n'), /not the designated worker/);
    assert.equal(skipped.started, false);
  });

  test('runs the designated PM2 instance and redacts secrets from failure logs', async () => {
    const { timers, logger } = workerOptions();
    process.env.NODE_APP_INSTANCE = '0';
    const started = startMetaLeadWorker({
      isDbReady: () => true,
      setIntervalFn: timers.setInterval,
      clearIntervalFn: timers.clearInterval,
      logger,
      createProcessor: () => ({
        async processDue() {
          throw new Error('save failed for user@example.com mobile 9998887777 access_token=secret-value');
        },
      }),
    });
    assert.equal(started.started, true);
    await started.initialRun;
    const logs = logger.lines.join('\n');
    assert.match(logs, /\[redacted-email\]/);
    assert.match(logs, /\[redacted-number\]/);
    assert.match(logs, /access_token=\[redacted\]/);
    assert.equal(logs.includes('user@example.com'), false);
    assert.equal(logs.includes('9998887777'), false);
    assert.equal(logs.includes('secret-value'), false);
    assert.match(logs, /Lead worker batch failed/);
  });

  test('claims pending events with an atomic status update', async () => {
    const MetaLeadEvent = require('../controllers/models/metaLeadEvent');
    const { createLeadProcessor } = require('../services/meta/metaLeadProcessor');
    const calls = [];
    const original = MetaLeadEvent.findOneAndUpdate;
    MetaLeadEvent.findOneAndUpdate = function findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return { lean: async () => null };
    };
    try {
      const processor = createLeadProcessor();
      const results = await processor.processDue(5);
      assert.deepEqual(results, []);
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0].filter.processingStatus, { $in: ['pending', 'mapping_pending'] });
      assert.deepEqual(calls[0].update, { $set: { processingStatus: 'processing' } });
      assert.equal(calls[0].options.new, true);
      assert.deepEqual(calls[0].options.sort, { receivedAt: 1 });
      const uniqueLeadIndex = MetaLeadEvent.schema.indexes().some(([fields, indexOptions]) => (
        fields.metaLeadId === 1 && indexOptions && indexOptions.unique === true
      ));
      assert.equal(uniqueLeadIndex, true);
    } finally {
      MetaLeadEvent.findOneAndUpdate = original;
    }
  });

  test('the API entry point starts the worker after MongoDB connects and stops it on shutdown', () => {
    const entry = fs.readFileSync(path.join(__dirname, '../mmt.js'), 'utf8');
    const routes = fs.readFileSync(path.join(__dirname, '../controllers/routes/meta/index.js'), 'utf8');
    const connectAt = entry.indexOf('await mongoose.connect');
    const startAt = entry.indexOf('startMetaLeadWorker()');
    const stopAt = entry.indexOf('await stopMetaLeadWorker()');
    const shutdownAt = entry.indexOf('const gracefulShutdown');
    assert.ok(connectAt > -1);
    assert.ok(startAt > connectAt);
    assert.ok(shutdownAt > -1);
    assert.ok(stopAt > shutdownAt);
    assert.equal(routes.includes('startMetaLeadWorker'), false);
  });
});
