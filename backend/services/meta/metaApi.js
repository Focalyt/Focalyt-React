const crypto = require('crypto');
const axios = require('axios');
const {
  GRAPH_HOST,
  MetaConfigError,
  readSettings,
  assertGraphVersion,
} = require('./metaConfig');

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_AD_PAGE_LIMIT = 50;
const AD_SYNC_FIELDS = [
  'id',
  'name',
  'campaign_id',
  'adset_id',
  'status',
  'effective_status',
  'updated_time',
  'creative{id,object_story_spec,asset_feed_spec,object_story_id}',
].join(',');
const TOKEN_CODES = new Set([102, 190, 463, 467]);
const TOKEN_SUBCODES = new Set([458, 459, 460, 463, 467]);
const RATE_CODES = new Set([4, 17, 32, 613, 80000, 80004]);
const PERMISSION_CODES = new Set([10, 200, 294]);

const SAFE_MESSAGES = {
  timeout: 'The Meta Graph API request timed out.',
  network: 'The Meta Graph API could not be reached.',
  invalid_token: 'Meta rejected the access token. It may be invalid, expired, or revoked.',
  permission_denied: 'Meta denied the request because a required permission is missing.',
  rate_limited: 'Meta rate-limited the request. Try again later.',
  graph_error: 'The Meta Graph API request failed.',
};

class MetaApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MetaApiError';
    this.code = 'META_API_ERROR';
    this.category = details.category || 'graph_error';
    this.status = details.status || 502;
    this.graphCode = details.graphCode || null;
    this.graphType = details.graphType || null;
    this.fbtraceId = details.fbtraceId || null;
  }
}

function redactSecrets(text, secrets) {
  let output = String(text || '');
  output = output.replace(/access_token=[^&\s]+/gi, 'access_token=[redacted]');
  output = output.replace(/input_token=[^&\s]+/gi, 'input_token=[redacted]');
  output = output.replace(/appsecret_proof=[^&\s]+/gi, 'appsecret_proof=[redacted]');
  secrets.filter(secret => secret && String(secret).length >= 4).forEach((secret) => {
    output = output.split(String(secret)).join('[redacted]');
  });
  return output;
}

function assertMetaId(value, label) {
  const id = value == null ? '' : String(value).trim();
  if (!/^(act_)?\d+$/.test(id)) {
    throw new MetaConfigError(`${label} must be a numeric Meta id. No request was sent.`);
  }
  return id;
}

function assertPageId(value) {
  const id = value == null ? '' : String(value).trim();
  if (!/^\d+$/.test(id)) {
    throw new MetaConfigError('Page id must be a numeric Meta id. No request was sent.', ['META_PAGE_ID']);
  }
  return id;
}

function normalizeAdAccountId(value) {
  const id = assertMetaId(value, 'Ad account id');
  return id.startsWith('act_') ? id : `act_${id}`;
}

function classifyFailure(error, graphError) {
  const code = graphError && Number(graphError.code);
  const subcode = graphError && Number(graphError.error_subcode);
  const httpStatus = error && error.response ? error.response.status : null;
  const errCode = error && error.code;
  const rawMessage = (error && error.message) || '';
  const graphMessage = (graphError && graphError.message) || '';

  if (
    errCode === 'ECONNABORTED'
    || errCode === 'ETIMEDOUT'
    || errCode === 'ESOCKETTIMEDOUT'
    || /timeout/i.test(rawMessage)
  ) {
    return { category: 'timeout', status: 504 };
  }

  if (TOKEN_CODES.has(code) || TOKEN_SUBCODES.has(subcode)) {
    return { category: 'invalid_token', status: 401 };
  }

  if (RATE_CODES.has(code) || httpStatus === 429) {
    return { category: 'rate_limited', status: 429 };
  }

  if (
    PERMISSION_CODES.has(code)
    || (code >= 200 && code <= 299)
    || httpStatus === 403
    || (/permission/i.test(graphMessage) && !TOKEN_CODES.has(code))
  ) {
    return { category: 'permission_denied', status: 403 };
  }

  if (!error || !error.response) {
    return { category: 'network', status: 502 };
  }

  return { category: 'graph_error', status: 502 };
}

function safeGraphError(error, secrets) {
  const graphError = error && error.response && error.response.data && error.response.data.error;
  const classification = classifyFailure(error, graphError);
  return new MetaApiError(SAFE_MESSAGES[classification.category], {
    category: classification.category,
    status: classification.status,
    graphCode: graphError && graphError.code,
    graphType: graphError && graphError.type,
    fbtraceId: graphError && graphError.fbtrace_id,
    redactedMessage: redactSecrets((graphError && graphError.message) || '', secrets),
  });
}

function logGraphFailure(metaError) {
  // eslint-disable-next-line no-console
  console.error('[meta] Graph API request failed', {
    category: metaError.category,
    status: metaError.status,
    graphCode: metaError.graphCode,
    graphType: metaError.graphType,
    fbtraceId: metaError.fbtraceId,
  });
}

function createMetaApi({ settings, http } = {}) {
  const client = http || axios;

  function currentSettings() {
    return readSettings(settings);
  }

  function buildGraphUrl(path) {
    const active = currentSettings();
    assertGraphVersion(active);
    const cleanPath = String(path || '').replace(/^\/+/, '');
    if (!cleanPath || cleanPath.includes('..') || /access_token|appsecret|input_token/i.test(cleanPath)) {
      throw new MetaConfigError('Invalid Graph API path. No request was sent.');
    }
    return `${GRAPH_HOST}/${active.graphApiVersion}/${cleanPath}`;
  }

  function resolveToken(active, audience, authToken) {
    if (authToken) return String(authToken).trim();
    if (audience === 'ads') return active.adsAccessToken;
    if (audience === 'page') return active.pageAccessToken;
    throw new MetaConfigError('Choose an ads or page token before calling the Meta Graph API. No request was sent.');
  }

  async function graphRequest({
    method = 'GET',
    path,
    params = {},
    audience,
    authToken,
    timeout = DEFAULT_TIMEOUT_MS,
  } = {}) {
    const active = currentSettings();
    assertGraphVersion(active);
    const token = resolveToken(active, audience, authToken);
    if (!token) {
      const missingEnv = audience === 'ads' ? 'META_ADS_ACCESS_TOKEN' : 'META_PAGE_ACCESS_TOKEN';
      throw new MetaConfigError(
        `Set ${missingEnv} before calling the Meta Graph API. No request was sent.`,
        [missingEnv],
      );
    }

    const url = buildGraphUrl(path);
    const appToken = active.appId && active.appSecret ? `${active.appId}|${active.appSecret}` : '';
    const secrets = [
      token,
      active.adsAccessToken,
      active.pageAccessToken,
      active.appSecret,
      active.verifyToken,
      appToken,
    ];
    const secretInUrl = secrets.some(secret => (
      secret && secret.length >= 4 && url.includes(secret)
    ));
    if (secretInUrl || /access_token=|input_token=/i.test(url)) {
      throw new MetaConfigError('Refusing to put an access token in the Graph API URL. No request was sent.');
    }
    if (Object.prototype.hasOwnProperty.call(params, 'access_token')) {
      throw new MetaConfigError('Refusing to send access_token as a query parameter. No request was sent.');
    }

    const query = { ...params };
    if (active.appSecret) {
      query.appsecret_proof = crypto.createHmac('sha256', active.appSecret).update(token).digest('hex');
    }

    try {
      const response = await client({
        method,
        url,
        params: query,
        timeout,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      return response && response.data;
    } catch (error) {
      if (error instanceof MetaConfigError || error instanceof MetaApiError) throw error;
      const metaError = safeGraphError(error, secrets);
      logGraphFailure(metaError);
      throw metaError;
    }
  }

  async function graphGetAll({
    audience,
    path,
    params = {},
    maxPages = 10,
  } = {}) {
    const items = [];
    let after;
    let pagesRead = 0;
    let hasMore = false;

    while (pagesRead < maxPages) {
      const query = { ...params };
      if (after) query.after = after;
      // paging.next embeds the access token, so later pages use the cursor only.
      // eslint-disable-next-line no-await-in-loop
      const page = await graphRequest({
        method: 'GET',
        audience,
        path,
        params: query,
      });
      pagesRead += 1;
      if (page && Array.isArray(page.data)) items.push(...page.data);

      const cursors = page && page.paging && page.paging.cursors;
      const nextAfter = cursors && cursors.after;
      const hasNext = Boolean(page && page.paging && page.paging.next);
      if (!hasNext || !nextAfter || nextAfter === after) {
        hasMore = Boolean(hasNext && !nextAfter);
        break;
      }
      if (pagesRead >= maxPages) {
        hasMore = true;
        break;
      }
      after = nextAfter;
    }

    return { data: items, pagesRead, hasMore };
  }

  function listAdAccounts() {
    return graphRequest({
      audience: 'ads',
      path: 'me/adaccounts',
      params: { fields: 'id,name,account_status' },
    });
  }

  async function getAdAccount(adAccountId) {
    const active = currentSettings();
    const accountId = normalizeAdAccountId(adAccountId || active.adAccountId);
    return graphRequest({
      audience: 'ads',
      path: accountId,
      params: { fields: 'id,name,account_status' },
    });
  }

  async function getPage(pageId) {
    const active = currentSettings();
    const id = assertPageId(pageId || active.pageId);
    return graphRequest({
      audience: 'page',
      path: id,
      params: { fields: 'id,name' },
    });
  }

  async function listAds(adAccountId) {
    const active = currentSettings();
    const accountId = adAccountId || active.adAccountId;
    if (!accountId) {
      throw new MetaConfigError(
        'Set META_AD_ACCOUNT_ID or pass an ad account id before listing ads. No request was sent.',
        ['META_AD_ACCOUNT_ID'],
      );
    }
    return graphRequest({
      audience: 'ads',
      path: `${normalizeAdAccountId(accountId)}/ads`,
      params: { fields: 'id,name,status,effective_status,creative{id}' },
    });
  }

  async function getAdCreative(creativeId) {
    return graphRequest({
      audience: 'ads',
      path: assertMetaId(creativeId, 'Creative id'),
      params: { fields: 'id,object_story_spec,asset_feed_spec,object_story_id' },
    });
  }

  async function listAllAds({
    adAccountId,
    includeInactive = false,
    maxPages = 10,
    limit = DEFAULT_AD_PAGE_LIMIT,
  } = {}) {
    const active = currentSettings();
    const accountId = adAccountId || active.adAccountId;
    if (!accountId) {
      throw new MetaConfigError(
        'Set META_AD_ACCOUNT_ID before listing ads. No request was sent.',
        ['META_AD_ACCOUNT_ID'],
      );
    }
    const params = { fields: AD_SYNC_FIELDS, limit };
    if (!includeInactive) params.effective_status = JSON.stringify(['ACTIVE']);
    return graphGetAll({
      audience: 'ads',
      path: `${normalizeAdAccountId(accountId)}/ads`,
      params,
      maxPages,
    });
  }

  async function listAllLeadForms(pageId, { maxPages = 10, limit = 100 } = {}) {
    return graphGetAll({
      audience: 'page',
      path: `${assertPageId(pageId)}/leadgen_forms`,
      params: { fields: 'id,name,status', limit },
      maxPages,
    });
  }

  async function listLeadForms(pageId) {
    return graphRequest({
      audience: 'page',
      path: `${assertPageId(pageId)}/leadgen_forms`,
      params: { fields: 'id,name,status,leads_count' },
    });
  }

  async function getLeadForm(formId) {
    return graphRequest({
      audience: 'page',
      path: assertMetaId(formId, 'Lead form id'),
      params: { fields: 'id,name,status,leads_count,questions' },
    });
  }

  async function getLead(leadId) {
    return graphRequest({
      audience: 'page',
      path: assertMetaId(leadId, 'Lead id'),
      params: { fields: 'id,created_time,ad_id,form_id,field_data' },
    });
  }

  return {
    buildGraphUrl,
    graphRequest,
    graphGetAll,
    listAdAccounts,
    getAdAccount,
    getPage,
    listAds,
    listAllAds,
    getAdCreative,
    listLeadForms,
    listAllLeadForms,
    getLeadForm,
    getLead,
    readActiveSettings: currentSettings,
    normalizeAdAccountId,
  };
}

module.exports = {
  MetaApiError,
  createMetaApi,
  SAFE_MESSAGES,
  normalizeAdAccountId,
  assertPageId,
};
