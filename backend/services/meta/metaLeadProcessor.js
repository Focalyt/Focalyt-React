const MetaLeadEvent = require('../../controllers/models/metaLeadEvent');
const { createMetaApi } = require('./metaApi');
const { resolveMetaFormMapping } = require('./metaMapping');
const { createCrmInserter, normalizePhone } = require('./metaLeadInsert');

const MAX_TRANSIENT_RETRIES = 5;
const RETRY_MINUTES = [2, 5, 15, 30, 60];

const NAME_KEYS = ['full_name', 'fullname', 'name'];
const FIRST_NAME_KEYS = ['first_name', 'firstname'];
const LAST_NAME_KEYS = ['last_name', 'lastname'];
const PHONE_KEYS = ['phone_number', 'phonenumber', 'phone', 'mobile', 'mobile_number', 'mobilenumber'];
const WHATSAPP_KEYS = ['whatsapp', 'whatsapp_number', 'whatsappnumber'];
const EMAIL_KEYS = ['email'];
const GENDER_KEYS = ['gender', 'sex'];

function normalizeFieldKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function firstText(values) {
  if (!Array.isArray(values) || values[0] === undefined || values[0] === null) return '';
  return String(values[0]).trim();
}

function indexFields(fieldData) {
  const foundKeys = [];
  const byKey = new Map();
  (fieldData || []).forEach((item) => {
    if (!item) return;
    const key = normalizeFieldKey(item.name);
    if (!key) return;
    foundKeys.push(key);
    if (byKey.has(key)) return;
    const value = firstText(item.values);
    if (value) byKey.set(key, value);
  });
  return { foundKeys, byKey };
}

function pickField(byKey, aliases) {
  for (let index = 0; index < aliases.length; index += 1) {
    const alias = aliases[index];
    if (byKey.get(alias)) return byKey.get(alias);
    const compact = alias.replace(/_/g, '');
    if (compact !== alias && byKey.get(compact)) return byKey.get(compact);
  }
  return '';
}

function safeLogKey(key) {
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(key)) return '';
  return key;
}

function summarizeLeadFields(fieldData, lead) {
  const indexed = indexFields(fieldData);
  return {
    fieldKeys: indexed.foundKeys.map(safeLogKey).filter(Boolean),
    recognized: {
      name: Boolean(lead && lead.name),
      mobile: Boolean(lead && lead.mobile),
      email: Boolean(lead && lead.email),
      whatsapp: Boolean(lead && lead.whatsapp),
      sex: Boolean(lead && lead.sex),
    },
  };
}

function logLeadFieldCheck(logger, event, graphLead, lead) {
  try {
    const fields = graphLead && (graphLead.field_data || graphLead.fieldData);
    const summary = summarizeLeadFields(fields, lead);
    const keys = summary.fieldKeys.length ? summary.fieldKeys.join(',') : 'none';
    const flags = summary.recognized;
    logger.info(
      `[meta] Lead field check. formId=${String((event && event.formId) || '')} keys=${keys} name=${flags.name} mobile=${flags.mobile} email=${flags.email} whatsapp=${flags.whatsapp} sex=${flags.sex}`,
    );
  } catch (_error) {
    // Field diagnostics must not stop lead processing.
  }
}

function parseLead(graphLead) {
  const fields = graphLead && (graphLead.field_data || graphLead.fieldData);
  const { byKey } = indexFields(fields);
  const first = pickField(byKey, FIRST_NAME_KEYS);
  const last = pickField(byKey, LAST_NAME_KEYS);
  const full = pickField(byKey, NAME_KEYS);
  const phone = normalizePhone(pickField(byKey, PHONE_KEYS));
  const whatsapp = normalizePhone(pickField(byKey, WHATSAPP_KEYS)) || phone;
  const email = pickField(byKey, EMAIL_KEYS).toLowerCase();
  const gender = pickField(byKey, GENDER_KEYS).toLowerCase();
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
  logger = console,
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
    logLeadFieldCheck(logger, event, graphLead, lead);
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

module.exports = {
  createLeadProcessor,
  parseLead,
  normalizeFieldKey,
  summarizeLeadFields,
};
