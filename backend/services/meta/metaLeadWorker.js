const { createLeadProcessor } = require('./metaLeadProcessor');

let started = false;

function startMetaLeadWorker() {
  if (started) return;
  started = true;
  const processor = createLeadProcessor();
  const timer = setInterval(() => {
    processor.processDue(5).catch(() => {
      // eslint-disable-next-line no-console
      console.error('[meta] Lead event processing failed.');
    });
  }, 15000);
  if (typeof timer.unref === 'function') timer.unref();
}

module.exports = { startMetaLeadWorker };
