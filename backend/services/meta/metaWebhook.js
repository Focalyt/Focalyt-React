const crypto = require('crypto');
const MetaLeadEvent = require('../../controllers/models/metaLeadEvent');
const { readSettings } = require('./metaConfig');

function tokensMatch(received, expected) {
  const left = Buffer.from(String(received || ''));
  const right = Buffer.from(String(expected || ''));
  if (!expected || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function signaturesMatch(rawBody, signature, secret) {
  if (!secret || !signature || !rawBody) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expected = Buffer.from(`sha256=${digest}`);
  const received = Buffer.from(String(signature));
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

function eventTime(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isMetaId(value) {
  return /^\d{1,32}$/.test(String(value || ''));
}

function extractLeadgens(payload) {
  const entries = payload && Array.isArray(payload.entry) ? payload.entry : [];
  const events = [];
  entries.forEach((entry) => {
    const changes = entry && Array.isArray(entry.changes) ? entry.changes : [];
    changes.forEach((change) => {
      if (!change || change.field !== 'leadgen' || !change.value) return;
      const { value } = change;
      const metaLeadId = String(value.leadgen_id || '');
      const pageId = String(value.page_id || (entry && entry.id) || '');
      const formId = String(value.form_id || '');
      if (!isMetaId(metaLeadId) || !isMetaId(pageId) || !isMetaId(formId)) return;
      events.push({
        metaLeadId,
        pageId,
        formId,
        adId: value.ad_id ? String(value.ad_id) : '',
        eventTime: eventTime(value.created_time),
      });
    });
  });
  return events;
}

function createEventStore() {
  return {
    async insert(event) {
      try {
        const saved = await MetaLeadEvent.create(event);
        return { inserted: true, event: saved.toObject() };
      } catch (error) {
        if (error && error.code === 11000) return { inserted: false, duplicate: true };
        throw error;
      }
    },
  };
}

function createWebhookService({
  settings = readSettings,
  store = createEventStore(),
} = {}) {
  function verifySubscription({ mode, token, challenge }) {
    const current = settings() || {};
    const challengeText = challenge === undefined || challenge === null ? '' : String(challenge);
    if (mode !== 'subscribe' || !challengeText || !tokensMatch(token, current.verifyToken)) {
      return { ok: false, status: 403 };
    }
    return { ok: true, status: 200, challenge: challengeText };
  }

  async function receive({ rawBody, signature }) {
    const current = settings() || {};
    if (!current.appSecret) {
      return {
        status: 503,
        body: {
          success: false,
          code: 'not_configured',
          message: 'Set META_APP_SECRET before accepting Meta webhooks.',
        },
      };
    }
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      return {
        status: 400,
        body: { success: false, code: 'invalid_body', message: 'The webhook body could not be verified.' },
      };
    }
    if (!signaturesMatch(rawBody, signature, current.appSecret)) {
      return {
        status: 403,
        body: { success: false, code: 'invalid_signature', message: 'The webhook signature is not valid.' },
      };
    }
    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch (error) {
      return {
        status: 400,
        body: { success: false, code: 'invalid_body', message: 'The webhook body is not valid JSON.' },
      };
    }
    const events = extractLeadgens(payload);
    const receivedAt = new Date();
    await Promise.all(events.map(async (event) => {
      try {
        await store.insert({
          ...event,
          processingStatus: 'pending',
          retryCount: 0,
          nextRetryAt: null,
          lastError: '',
          crmLeadId: null,
          receivedAt,
          processedAt: null,
        });
      } catch (error) {
        if (!error || error.code !== 11000) throw error;
      }
    }));
    return { status: 200, body: { success: true } };
  }

  return { verifySubscription, receive, extractLeadgens };
}

module.exports = {
  createWebhookService,
  extractLeadgens,
  signaturesMatch,
};
