const MetaAd = require('../../controllers/models/metaAd');
const MetaForm = require('../../controllers/models/metaForm');
const MetaSyncRun = require('../../controllers/models/metaSyncRun');
const { MetaConfigError, assertGraphVersion } = require('./metaConfig');
const { MetaApiError, SAFE_MESSAGES } = require('./metaApi');
const { toPublicMetaError } = require('./metaConnection');
const { discoverFromCreative, creativeNeedsLookup, isNumericId } = require('./metaCreative');

const MAX_PAGES = 25;
const DISCOVERY_FILTER = /^(lead_form_found|not_lead_ad|form_unresolved)$/;
const STATUS_FILTER = /^(ACTIVE|PAUSED|ARCHIVED|DELETED|CAMPAIGN_PAUSED|ADSET_PAUSED|PENDING_REVIEW|DISAPPROVED|PREAPPROVED|WITH_ISSUES|IN_PROCESS)$/;
const FORBIDDEN_SYNC_FIELDS = [
  'accessToken',
  'access_token',
  'pageAccessToken',
  'appSecret',
  'url',
  'graphUrl',
  'graph_url',
];

class MetaSyncBusyError extends Error {
  constructor() {
    super('A Meta ad sync is already running.');
    this.name = 'MetaSyncBusyError';
    this.code = 'META_SYNC_IN_PROGRESS';
    this.status = 409;
  }
}

class MetaRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MetaRequestError';
    this.code = 'META_BAD_REQUEST';
    this.status = 400;
  }
}

function emptyStats() {
  return {
    adsFetched: 0,
    activeAds: 0,
    leadFormsDiscovered: 0,
    unresolvedForms: 0,
    inserted: 0,
    updated: 0,
    failedLookups: 0,
    pagesRead: 0,
    truncated: false,
    formMetadata: 'unavailable',
  };
}

function publicFailure(error) {
  const mapped = toPublicMetaError(error);
  return {
    category: mapped.payload.code || 'graph_error',
    message: mapped.payload.message || SAFE_MESSAGES.graph_error,
  };
}

function logLookup(details) {
  // eslint-disable-next-line no-console
  console.error('[meta] ad discovery lookup failed', details);
}

function textValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sourceTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function publicAd(doc) {
  return {
    adAccountId: doc.adAccountId || '',
    adId: doc.adId || '',
    adName: doc.adName || '',
    campaignId: doc.campaignId || '',
    adSetId: doc.adSetId || '',
    pageId: doc.pageId || '',
    formId: doc.formId || '',
    creativeId: doc.creativeId || '',
    adStatus: doc.adStatus || '',
    effectiveStatus: doc.effectiveStatus || '',
    formName: doc.formName || '',
    formStatus: doc.formStatus || '',
    discoveryStatus: doc.discoveryStatus,
    formMetadataStatus: doc.formMetadataStatus || 'not_applicable',
    sourceUpdatedTime: doc.sourceUpdatedTime || null,
    lastSyncedAt: doc.lastSyncedAt,
  };
}

function publicForm(doc) {
  return {
    pageId: doc.pageId || '',
    formId: doc.formId || '',
    formName: doc.formName || '',
    formStatus: doc.formStatus || '',
    metadataStatus: doc.metadataStatus || 'unavailable',
    lastSyncedAt: doc.lastSyncedAt,
  };
}

function parseSyncOptions(body) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const blocked = FORBIDDEN_SYNC_FIELDS.filter(key => (
    Object.prototype.hasOwnProperty.call(source, key)
  ));
  if (blocked.length) {
    throw new MetaRequestError('Sync requests cannot include access tokens or Graph URLs.');
  }
  let maxPages = 10;
  if (source.maxPages != null && source.maxPages !== '') {
    const parsed = Number(source.maxPages);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGES) {
      throw new MetaRequestError('maxPages must be an integer from 1 to 25.');
    }
    maxPages = parsed;
  }
  return { includeInactive: source.includeInactive === true, maxPages };
}

function parseAdQuery(query) {
  const source = query || {};
  const page = Math.max(parseInt(source.page, 10) || 1, 1);
  let limit = parseInt(source.limit, 10) || 20;
  if (limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  const filter = {};
  if (source.effectiveStatus) {
    if (!STATUS_FILTER.test(String(source.effectiveStatus))) {
      throw new MetaRequestError('effectiveStatus is not a supported ad status.');
    }
    filter.effectiveStatus = String(source.effectiveStatus);
  }
  if (source.discoveryStatus) {
    if (!DISCOVERY_FILTER.test(String(source.discoveryStatus))) {
      throw new MetaRequestError('discoveryStatus is not supported.');
    }
    filter.discoveryStatus = String(source.discoveryStatus);
  }
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    filter,
  };
}

function assertAdsReady(settings) {
  const missing = [];
  if (!settings.graphApiVersion) missing.push('META_GRAPH_API_VERSION');
  if (!settings.adAccountId) missing.push('META_AD_ACCOUNT_ID');
  if (!settings.adsAccessToken) missing.push('META_ADS_ACCESS_TOKEN');
  if (missing.length) {
    throw new MetaConfigError(
      `Set ${missing.join(', ')} before syncing Meta ads. No request was sent.`,
      missing,
    );
  }
  assertGraphVersion(settings);
}

function metadataFor(discovery, catalog) {
  if (discovery.discoveryStatus !== 'lead_form_found') {
    return {
      pageId: discovery.pageId,
      formName: '',
      formStatus: '',
      formMetadataStatus: 'not_applicable',
    };
  }
  const matches = catalog.filter(form => form.formId === discovery.formId);
  const scoped = discovery.pageId
    ? matches.filter(form => form.pageId === discovery.pageId)
    : matches;
  if (scoped.length === 1) {
    return {
      pageId: discovery.pageId || scoped[0].pageId,
      formName: scoped[0].formName,
      formStatus: scoped[0].formStatus,
      formMetadataStatus: 'available',
    };
  }
  return {
    pageId: discovery.pageId,
    formName: '',
    formStatus: '',
    formMetadataStatus: 'unavailable',
  };
}

function createDefaultRepository() {
  function wasInserted(result) {
    if (!result) return false;
    if (result.upsertedCount > 0) return true;
    return Boolean(result.upserted && result.upserted.length);
  }

  return {
    async upsertAd(doc) {
      const result = await MetaAd.updateOne(
        { adAccountId: doc.adAccountId, adId: doc.adId },
        { $set: doc },
        { upsert: true },
      );
      return { inserted: wasInserted(result) };
    },
    async listAds({ filter, skip, limit }) {
      const [total, rows] = await Promise.all([
        MetaAd.countDocuments(filter),
        MetaAd.find(filter).sort({ lastSyncedAt: -1, adId: 1 }).skip(skip).limit(limit)
          .lean(),
      ]);
      return { total, ads: rows.map(publicAd) };
    },
    async upsertForm(doc) {
      await MetaForm.updateOne(
        { pageId: doc.pageId, formId: doc.formId },
        { $set: doc },
        { upsert: true },
      );
    },
    async listForms() {
      const rows = await MetaForm.find().sort({ formName: 1, formId: 1 }).lean();
      return rows.map(publicForm);
    },
    async saveSyncRun(run) {
      await MetaSyncRun.create({
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        result: run.result,
        stats: run.stats,
        syncErrors: run.errors || [],
      });
    },
    async latestSyncRun() {
      const run = await MetaSyncRun.findOne().sort({ finishedAt: -1 }).lean();
      if (!run) return null;
      return {
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        result: run.result,
        stats: run.stats || null,
        errors: run.syncErrors || [],
      };
    },
  };
}

function createAdSyncService(api, repository) {
  const store = repository || createDefaultRepository();
  let running = false;

  async function resolveOne(ad, failures) {
    let creative = ad && ad.creative;
    if (creativeNeedsLookup(creative)) {
      try {
        creative = await api.getAdCreative(creative.id);
      } catch (error) {
        failures.push(publicFailure(error));
        logLookup({
          category: error && error.category ? error.category : 'graph_error',
          adId: ad && ad.id ? String(ad.id) : '',
          graphCode: error && error.graphCode ? error.graphCode : null,
        });
        creative = null;
      }
    }
    const discovery = discoverFromCreative(creative);
    if (!discovery.creativeId && creative && isNumericId(creative.id)) {
      discovery.creativeId = String(creative.id);
    }
    if (!discovery.creativeId && ad && ad.creative && isNumericId(ad.creative.id)) {
      discovery.creativeId = String(ad.creative.id);
    }
    return { ad, discovery };
  }

  async function resolveAll(rawAds, failures) {
    const resolved = [];
    for (let index = 0; index < rawAds.length; index += 1) {
      // Creative lookups must stay sequential so one failure does not cancel the rest.
      // eslint-disable-next-line no-await-in-loop
      resolved.push(await resolveOne(rawAds[index], failures));
    }
    return resolved;
  }

  async function loadForms(settings, pageIds, maxPages, failures) {
    if (!settings.pageAccessToken) {
      return { catalog: [], formMetadata: 'unavailable' };
    }
    const ids = pageIds.filter(isNumericId);
    if (settings.pageId && isNumericId(settings.pageId)) ids.push(settings.pageId);
    const unique = [...new Set(ids)];
    if (!unique.length) return { catalog: [], formMetadata: 'unavailable' };

    const catalog = [];
    let failed = 0;
    for (let index = 0; index < unique.length; index += 1) {
      const pageId = unique[index];
      try {
        // eslint-disable-next-line no-await-in-loop
        const page = await api.listAllLeadForms(pageId, { maxPages });
        (page.data || []).forEach((form) => {
          if (!form || !isNumericId(form.id)) return;
          catalog.push({
            pageId,
            formId: String(form.id).trim(),
            formName: textValue(form.name),
            formStatus: textValue(form.status),
          });
        });
      } catch (error) {
        failed += 1;
        failures.push(publicFailure(error));
        logLookup({
          category: error && error.category ? error.category : 'graph_error',
          pageId,
          graphCode: error && error.graphCode ? error.graphCode : null,
        });
      }
    }
    let formMetadata = 'available';
    if (failed === unique.length) formMetadata = 'unavailable';
    else if (failed > 0) formMetadata = 'partial';
    return { catalog, formMetadata };
  }

  function buildAdDoc(accountId, item, catalog, syncedAt) {
    const meta = metadataFor(item.discovery, catalog);
    const source = item.ad || {};
    return {
      adAccountId: accountId,
      adId: String(source.id),
      adName: textValue(source.name),
      campaignId: textValue(source.campaign_id),
      adSetId: textValue(source.adset_id),
      pageId: meta.pageId || '',
      formId: item.discovery.formId || '',
      creativeId: item.discovery.creativeId || '',
      adStatus: textValue(source.status),
      effectiveStatus: textValue(source.effective_status),
      formName: meta.formName,
      formStatus: meta.formStatus,
      discoveryStatus: item.discovery.discoveryStatus,
      formMetadataStatus: meta.formMetadataStatus,
      sourceUpdatedTime: sourceTime(source.updated_time),
      lastSyncedAt: syncedAt,
    };
  }

  async function saveForms(docs, catalog, syncedAt) {
    const seen = new Set();
    const rows = [];
    catalog.forEach((form) => {
      const key = `${form.pageId}:${form.formId}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        pageId: form.pageId,
        formId: form.formId,
        formName: form.formName,
        formStatus: form.formStatus,
        metadataStatus: 'available',
        lastSyncedAt: syncedAt,
      });
    });
    docs.forEach((doc) => {
      if (!doc.pageId || !doc.formId) return;
      const key = `${doc.pageId}:${doc.formId}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        pageId: doc.pageId,
        formId: doc.formId,
        formName: doc.formName,
        formStatus: doc.formStatus,
        metadataStatus: 'unavailable',
        lastSyncedAt: syncedAt,
      });
    });
    for (let index = 0; index < rows.length; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await store.upsertForm(rows[index]);
    }
  }

  async function saveAds(docs) {
    let inserted = 0;
    let updated = 0;
    for (let index = 0; index < docs.length; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      const result = await store.upsertAd(docs[index]);
      if (result && result.inserted) inserted += 1;
      else updated += 1;
    }
    return { inserted, updated };
  }

  async function performSync(settings, options) {
    const startedAt = new Date();
    const failures = [];
    const accountId = api.normalizeAdAccountId(settings.adAccountId);
    const listed = await api.listAllAds({
      adAccountId: accountId,
      includeInactive: options.includeInactive,
      maxPages: options.maxPages,
    });
    const rawAds = (listed.data || []).filter(ad => ad && isNumericId(ad.id));
    const resolved = await resolveAll(rawAds, failures);
    const pageIds = resolved.map(item => item.discovery.pageId).filter(Boolean);
    const forms = await loadForms(settings, pageIds, options.maxPages, failures);
    const syncedAt = new Date();
    const docs = resolved.map(item => buildAdDoc(accountId, item, forms.catalog, syncedAt));
    const counts = await saveAds(docs);
    await saveForms(docs, forms.catalog, syncedAt);

    const formIds = new Set(docs.filter(doc => doc.formId).map(doc => doc.formId));
    if (listed.hasMore) {
      failures.push({
        category: 'truncated',
        message: 'More ads remain beyond the configured page limit.',
      });
    }
    const stats = {
      adsFetched: docs.length,
      activeAds: docs.filter(doc => doc.effectiveStatus === 'ACTIVE').length,
      leadFormsDiscovered: formIds.size,
      unresolvedForms: docs.filter(doc => doc.discoveryStatus === 'form_unresolved').length,
      inserted: counts.inserted,
      updated: counts.updated,
      failedLookups: failures.length,
      pagesRead: listed.pagesRead || 0,
      truncated: Boolean(listed.hasMore),
      formMetadata: forms.formMetadata,
    };
    const result = failures.length ? 'partial' : 'success';
    await store.saveSyncRun({
      startedAt,
      finishedAt: syncedAt,
      result,
      stats,
      errors: failures,
    });
    return {
      success: true,
      result,
      ...stats,
      errors: failures,
    };
  }

  async function syncAds(options) {
    const settings = api.readActiveSettings();
    assertAdsReady(settings);
    if (running) throw new MetaSyncBusyError();
    running = true;
    const startedAt = new Date();
    try {
      return await performSync(settings, options || { includeInactive: false, maxPages: 10 });
    } catch (error) {
      const graphError = error instanceof MetaApiError || error.name === 'MetaConfigError';
      try {
        await store.saveSyncRun({
          startedAt,
          finishedAt: new Date(),
          result: 'error',
          stats: emptyStats(),
          errors: [graphError
            ? publicFailure(error)
            : { category: 'database', message: 'The discovered ads could not be saved.' }],
        });
      } catch (_saveError) {
        logLookup({ category: 'database' });
      }
      throw error;
    } finally {
      running = false;
    }
  }

  async function listDiscoveredAds(query) {
    const options = parseAdQuery(query);
    const page = await store.listAds(options);
    return {
      success: true,
      page: options.page,
      limit: options.limit,
      total: page.total,
      ads: page.ads,
    };
  }

  async function listDiscoveredForms() {
    const forms = await store.listForms();
    return { success: true, forms };
  }

  async function getAdSyncStatus() {
    const run = await store.latestSyncRun();
    if (!run) {
      return {
        success: true,
        status: 'not_synced',
        lastSyncedAt: null,
        startedAt: null,
        stats: null,
        errors: [],
      };
    }
    return {
      success: true,
      status: run.result,
      lastSyncedAt: run.finishedAt,
      startedAt: run.startedAt,
      stats: run.stats || null,
      errors: run.errors || [],
    };
  }

  return {
    syncAds,
    listDiscoveredAds,
    listDiscoveredForms,
    getAdSyncStatus,
    parseSyncOptions,
    parseAdQuery,
    toPublicMetaError,
  };
}

module.exports = {
  createAdSyncService,
  createDefaultRepository,
  parseSyncOptions,
  parseAdQuery,
  MetaSyncBusyError,
  MetaRequestError,
  publicAd,
  publicForm,
};
