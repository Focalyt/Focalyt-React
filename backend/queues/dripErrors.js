/**
 * Classify a WhatsApp send failure AFTER sendAttemptedAt was recorded.
 *
 * Retry only when the provider cannot have accepted the message:
 * - DNS failure or connection refused (the request never reached Meta)
 * - HTTP 429 (Graph rejected the call; no message id)
 *
 * Timeouts, connection resets, and 5xx/gateway responses may mean Meta
 * already accepted the message. Those are reconciliation, not retries.
 */

class RetryableDripError extends Error {
  constructor(message, info) {
    super(message);
    this.name = 'RetryableDripError';
    this.info = info || null;
  }
}

class PermanentDripError extends Error {
  constructor(message, info) {
    super(message);
    this.name = 'PermanentDripError';
    this.info = info || null;
  }
}

const LOCAL_PERMANENT = [
  /credentials missing/i,
  /invalid phone/i,
  /template .* not found/i,
  /not found/i,
  /missing media/i,
  /media file/i,
  /too small/i,
  /header media/i,
  /not implemented/i,
  /lead not found/i,
  /no mobile/i
];

function errorText(err) {
  if (!err) return 'send_failed';
  if (err.response && err.response.data) {
    try {
      const body = JSON.stringify(err.response.data);
      return body.length > 500 ? body.slice(0, 500) : body;
    } catch (stringifyErr) {
      return err.message || 'send_failed';
    }
  }
  return err.message || 'send_failed';
}

function classifySendError(err) {
  const status = err && err.response ? err.response.status : undefined;
  const code = err && err.code ? String(err.code) : '';
  const message = err && err.message ? String(err.message) : '';

  if (!status && LOCAL_PERMANENT.some((pattern) => pattern.test(message))) {
    return { kind: 'permanent', reason: message };
  }

  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'ECONNREFUSED') {
    return { kind: 'retry', reason: code };
  }

  if (status === 429) {
    return { kind: 'retry', reason: 'http_429' };
  }

  if (['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNABORTED', 'ERR_CANCELED'].includes(code)) {
    return { kind: 'reconciliation', reason: code };
  }

  if (status && [408, 500, 502, 503, 504].includes(status)) {
    return { kind: 'reconciliation', reason: `http_${status}` };
  }

  if (status && status >= 400 && status < 500) {
    return { kind: 'permanent', reason: `http_${status}` };
  }

  if (!status && /timeout/i.test(message)) {
    return { kind: 'reconciliation', reason: 'timeout' };
  }

  if (!status && code) {
    return { kind: 'reconciliation', reason: code };
  }

  return { kind: 'permanent', reason: message || 'send_failed' };
}

module.exports = {
  RetryableDripError,
  PermanentDripError,
  classifySendError,
  errorText
};
