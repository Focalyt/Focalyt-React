const MetaLeadEvent = require('../../controllers/models/metaLeadEvent');
const { createMetaApi } = require('./metaApi');
const { resolveMetaFormMapping } = require('./metaMapping');
const { createCrmInserter, normalizePhone } = require('./metaLeadInsert');

const MAX_TRANSIENT_RETRIES = 5;
const RETRY_MINUTES = [2, 5, 15, 30, 60];

function fieldValue(fieldData, names) {
  const wanted = new Set(names);
  const row = (fieldData || []).find(item => (
    item && wanted.has(String(item.name || '').toLowerCase())
  ));
  if (!row || !Array.isArray(row.values) || row.values[0] === undefined || row.values[0] === null) {
    return '';
  }
  return String(row.values[0]).trim();
}

function parseLead(graphLead) {
  const fields = graphLead && (graphLead.field_data || graphLead.fieldData);
  const first = fieldValue(fields, ['first_name']);
  const last = fieldValue(fields, ['last_name']);
  const full = fieldValue(fields, ['full_name', 'name']);
  const phone = normalizePhone(fieldValue(fields, ['phone_number', 'phone', 'mobile']));
  const whatsapp = normalizePhone(fieldValue(fields, ['whatsapp', 'whatsapp_number'])) || phone;
  const email = fieldValue(fields, ['email']).toLowerCase();
  const gender = fieldValue(fields, ['gender', 'sex']).toLowerCase();
  let sex = '';
  if (gender === 'male' || gender === 'm') sex = 'Male';
  if (gender === 'female' || gender === 'f') sex = 'Female';
  return {
    name: full || [first, last].filter(Boolean).join(' '),
    mobile: phone ? Number(phone) : null,
    whatsapp: whatsapp ? Number(whatsapp) : null,
    email,
    sex,
    formId: graphLead && (graphLead.form_id || graphLead.formId) ? String(graphLead.form_id || graphLead.formId) : '',
  };
}

function nextRetryAt(retryCount) {
  const minutes = RETRY_MINUTES[Math.min(retryCount, RETRY_MINUTES.length - 1)];
  return new Date(Date.now() + minutes * 60 * 1000);
}

function createEventRepository() {
  return {
    async claimDue(limit) {
      const claimed = [];
      const now = new Date();
      for (let index = 0; index < limit; index += 1) {
        // Each claim must finish before the next so one event is not taken twice.
        // eslint-disable-next-line no-await-in-loop
        const doc = await MetaLeadEvent.findOneAndUpdate(
          {
            processingStatus: { $in: ['pending', 'mapping_pending'] },
            $or: [
              { nextRetryAt: null },
              { nextRetryAt: { $exists: false } },
              { nextRetryAt: { $lte: now } },
            ],
          },
          { $set: { processingStatus: 'processing' } },
          { sort: { receivedAt: 1 }, new: true },
        ).lean();
        if (!doc) break;
        claimed.push(doc);
      }
      return claimed;
    },
    async update(id, patch) {
      return MetaLeadEvent.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    },
  };
}

function createLeadProcessor({
  events = createEventRepository(),
  fetchLead,
  resolveMapping = resolveMetaFormMapping,
  insertLead,
} = {}) {
  const api = fetchLead ? null : createMetaApi();
  const loadLead = fetchLead || (event => api.getLead(event.metaLeadId));
  const saveLead = insertLead || createCrmInserter().insertMappedLead;

  async function mark(event, patch) {
    return events.update(event._id, patch);
  }

  async function scheduleRetry(event, message) {
    const retryCount = Number(event.retryCount || 0) + 1;
    if (retryCount >= MAX_TRANSIENT_RETRIES) {
      return mark(event, {
        processingStatus: 'failed',
        retryCount,
        lastError: message,
        processedAt: new Date(),
        nextRetryAt: null,
      });
    }
    return mark(event, {
      processingStatus: 'pending',
      retryCount,
      lastError: message,
      nextRetryAt: nextRetryAt(retryCount),
    });
  }

  async function scheduleMapping(event, message) {
    const retryCount = Number(event.retryCount || 0) + 1;
    return mark(event, {
      processingStatus: 'mapping_pending',
      retryCount,
      lastError: message,
      nextRetryAt: nextRetryAt(retryCount),
    });
  }

  async function processOne(event) {
    let graphLead;
    try {
      graphLead = await loadLead(event);
    } catch (error) {
      return scheduleRetry(event, 'The Meta lead could not be retrieved.');
    }
    const lead = parseLead(graphLead || {});
    if (lead.formId && lead.formId !== String(event.formId)) {
      return mark(event, {
        processingStatus: 'failed',
        lastError: 'The retrieved lead belongs to a different form.',
        processedAt: new Date(),
        nextRetryAt: null,
      });
    }
    let resolved;
    try {
      resolved = await resolveMapping(event.pageId, event.formId);
    } catch (error) {
      return scheduleRetry(event, 'The form mapping could not be read.');
    }
    if (!resolved || !resolved.ok) {
      return scheduleMapping(event, (resolved && resolved.message) || 'No active form mapping exists.');
    }
    let saved;
    try {
      saved = await saveLead({ mapping: resolved.mapping, lead });
    } catch (error) {
      return scheduleRetry(event, 'The CRM lead could not be saved.');
    }
    if (saved && saved.ok) {
      return mark(event, {
        processingStatus: 'completed',
        crmLeadId: saved.crmLeadId,
        lastError: '',
        processedAt: new Date(),
        nextRetryAt: null,
      });
    }
    if (saved && saved.retry) return scheduleRetry(event, saved.message || 'The CRM lead could not be saved.');
    return mark(event, {
      processingStatus: 'failed',
      lastError: (saved && saved.message) || 'The CRM lead was not created.',
      processedAt: new Date(),
      nextRetryAt: null,
    });
  }

  async function processDue(limit = 5) {
    const claimed = await events.claimDue(limit);
    const results = [];
    for (let index = 0; index < claimed.length; index += 1) {
      // One lead is saved before the next starts, matching the CRM's sequential import.
      // eslint-disable-next-line no-await-in-loop
      results.push(await processOne(claimed[index]));
    }
    return results;
  }

  return { processDue, processOne, parseLead };
}

module.exports = { createLeadProcessor, parseLead };
