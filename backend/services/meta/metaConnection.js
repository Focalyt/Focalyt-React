const crypto = require('crypto');
const { MetaApiError, SAFE_MESSAGES } = require('./metaApi');
const {
  MetaConfigError,
  assertGraphVersion,
  buildReport,
  isGraphVersionValid,
} = require('./metaConfig');

const ADS_SCOPES = ['ads_read', 'leads_retrieval'];
const PAGE_SCOPES = ['pages_show_list', 'pages_manage_metadata', 'leads_retrieval'];
const AD_ACCOUNT_ENV = ['META_GRAPH_API_VERSION', 'META_AD_ACCOUNT_ID', 'META_ADS_ACCESS_TOKEN'];
const PAGE_ENV = ['META_GRAPH_API_VERSION', 'META_PAGE_ID', 'META_PAGE_ACCESS_TOKEN'];

const processMemory = {
  adAccount: null,
  page: null,
  permissions: null,
};

function fingerprint(value) {
  if (!value) return '';
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function publicName(value) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function toPublicMetaError(error) {
  if (error && error.name === 'MetaConfigError') {
    const invalidId = /numeric Meta id/.test(error.message || '');
    return {
      statusCode: invalidId ? 400 : (error.status || 503),
      payload: {
        success: false,
        connected: false,
        code: invalidId ? 'invalid_id' : 'not_configured',
        message: error.message,
        missing: error.missing || [],
      },
    };
  }
  if (error && error.name === 'MetaApiError') {
    const category = error.category || 'graph_error';
    return {
      statusCode: error.status || 502,
      payload: {
        success: false,
        connected: false,
        code: category,
        message: SAFE_MESSAGES[category] || SAFE_MESSAGES.graph_error,
      },
    };
  }
  return {
    statusCode: 500,
    payload: {
      success: false,
      connected: false,
      code: 'unexpected',
      message: 'The Meta connection test failed.',
    },
  };
}

function failureRecord(error, token) {
  const invalidId = error && error.name === 'MetaConfigError' && /numeric Meta id/.test(error.message || '');
  if (!error || (error.name === 'MetaConfigError' && !invalidId)) return null;
  const mapped = toPublicMetaError(error);
  return {
    fingerprint: fingerprint(token),
    status: 'error',
    checkedAt: new Date().toISOString(),
    message: mapped.payload.message,
    code: mapped.payload.code,
  };
}

function configurationMessage(settings, envNames) {
  const report = buildReport(settings);
  if (settings.graphApiVersion && report.graphApiVersionValid === false) {
    return 'META_GRAPH_API_VERSION must use the form v21.0.';
  }
  const missing = envNames.filter(name => report.missing.includes(name));
  if (!missing.length) return 'Required Meta credentials are not configured.';
  return `Set ${missing.join(', ')}.`;
}

function describeConnection(ready, message, record, token, detailKey) {
  if (!ready) {
    return {
      credentials: 'not_configured',
      status: 'not_configured',
      checkedAt: null,
      message,
    };
  }
  if (!record || record.fingerprint !== fingerprint(token)) {
    return {
      credentials: 'configured',
      status: 'not_tested',
      checkedAt: null,
      message: 'Credentials are present, but this connection has not been tested in this server process. Configured values are not treated as a successful connection.',
    };
  }
  const result = {
    credentials: 'configured',
    status: record.status,
    checkedAt: record.checkedAt,
    message: record.message,
  };
  if (detailKey && record[detailKey]) result[detailKey] = record[detailKey];
  if (record.code) result.code = record.code;
  return result;
}

function blankPermission(inspection, explanation) {
  return {
    inspection,
    tokenValid: null,
    available: [],
    missing: [],
    explanation,
  };
}

function summarizeScopes(scopeNames, required, explanation) {
  const granted = new Set(scopeNames);
  return {
    inspection: 'checked',
    tokenValid: true,
    available: required.filter(name => granted.has(name)),
    missing: required.filter(name => !granted.has(name)),
    explanation,
  };
}

function invalidTokenPermission() {
  return {
    inspection: 'error',
    tokenValid: false,
    available: [],
    missing: [],
    code: 'invalid_token',
    explanation: `${SAFE_MESSAGES.invalid_token} Permissions were not inferred from an invalid token.`,
  };
}

function scopeNamesFromDebug(info) {
  if (!info || (!Array.isArray(info.scopes) && !Array.isArray(info.granular_scopes))) return null;
  const names = [];
  (info.scopes || []).forEach((name) => {
    if (name) names.push(String(name));
  });
  (info.granular_scopes || []).forEach((entry) => {
    if (entry && entry.scope) names.push(String(entry.scope));
  });
  return names;
}

function permissionNamesFromRows(payload) {
  const rows = payload && Array.isArray(payload.data) ? payload.data : null;
  if (!rows) return null;
  return rows
    .filter(row => row && row.status === 'granted' && row.permission)
    .map(row => String(row.permission));
}

function unknownFrom(error) {
  if (error && error.name === 'MetaApiError') {
    const summary = SAFE_MESSAGES[error.category] || SAFE_MESSAGES.graph_error;
    return blankPermission('unknown', `${summary} Permissions could not be determined.`);
  }
  if (error && error.name === 'MetaConfigError') {
    return blankPermission('unknown', error.message);
  }
  return blankPermission('unknown', 'Permissions could not be determined from this token type.');
}

function createConnectionService(api, state = processMemory) {
  const memory = state;

  async function inspectToken(audience, settings) {
    const isAds = audience === 'ads';
    const token = isAds ? settings.adsAccessToken : settings.pageAccessToken;
    const required = isAds ? ADS_SCOPES : PAGE_SCOPES;
    const envName = isAds ? 'META_ADS_ACCESS_TOKEN' : 'META_PAGE_ACCESS_TOKEN';

    if (!settings.graphApiVersion || !isGraphVersionValid(settings.graphApiVersion)) {
      return blankPermission(
        'unknown',
        'META_GRAPH_API_VERSION must be an explicit value such as v21.0 before permissions can be inspected. No request was sent.',
      );
    }
    if (!token) {
      return blankPermission('not_configured', `Set ${envName} before inspecting this token. No request was sent.`);
    }

    let debugError = null;
    if (settings.appId && settings.appSecret) {
      try {
        const payload = await api.graphRequest({
          authToken: `${settings.appId}|${settings.appSecret}`,
          path: 'debug_token',
          params: { input_token: token },
        });
        const info = payload && payload.data ? payload.data : null;
        if (info && info.is_valid === false) return invalidTokenPermission();
        const scopes = scopeNamesFromDebug(info);
        if (info && info.is_valid === true && scopes) {
          return summarizeScopes(
            scopes,
            required,
            'Scopes were read with debug_token. A valid token does not confirm Page Lead Access.',
          );
        }
      } catch (error) {
        if (error && error.category === 'invalid_token') return invalidTokenPermission();
        debugError = error;
      }
    }

    try {
      const payload = await api.graphRequest({ audience, path: 'me/permissions' });
      const granted = permissionNamesFromRows(payload);
      if (!granted) {
        return blankPermission('unknown', 'Meta did not return a permission list for this token.');
      }
      return summarizeScopes(
        granted,
        required,
        'Permissions were read from /me/permissions. A granted scope does not confirm Page Lead Access.',
      );
    } catch (error) {
      return unknownFrom(debugError || error);
    }
  }

  function visiblePermission(stored, token) {
    if (!stored || stored.fingerprint !== fingerprint(token)) return null;
    return stored.result;
  }

  function rollupPermissions(ads, page) {
    const inspections = [ads.inspection, page.inspection];
    if (inspections.every(value => value === 'not_configured')) return 'not_configured';
    if (inspections.includes('error')) return 'error';
    if (inspections.includes('unknown')) return 'unknown';
    if (inspections.includes('not_tested')) return 'not_tested';
    return 'checked';
  }

  async function testAdAccountConnection() {
    const settings = api.readActiveSettings();
    const missing = AD_ACCOUNT_ENV.filter((envName) => {
      if (envName === 'META_GRAPH_API_VERSION') return !settings.graphApiVersion;
      if (envName === 'META_AD_ACCOUNT_ID') return !settings.adAccountId;
      return !settings.adsAccessToken;
    });
    if (missing.length) {
      throw new MetaConfigError(
        `Set ${missing.join(', ')} before testing the Meta ad account. No request was sent.`,
        missing,
      );
    }

    try {
      assertGraphVersion(settings);
      const data = await api.getAdAccount(settings.adAccountId);
      if (!data || !data.id) {
        throw new MetaApiError(SAFE_MESSAGES.graph_error, { category: 'graph_error', status: 502 });
      }
      const adAccount = {
        id: api.normalizeAdAccountId(data.id),
        name: publicName(data.name),
      };
      memory.adAccount = {
        fingerprint: fingerprint(settings.adsAccessToken),
        status: 'connected',
        checkedAt: new Date().toISOString(),
        message: null,
        code: null,
        adAccount,
      };
      return { success: true, connected: true, adAccount };
    } catch (error) {
      const record = failureRecord(error, settings.adsAccessToken);
      if (record) memory.adAccount = record;
      throw error;
    }
  }

  async function testPageConnection() {
    const settings = api.readActiveSettings();
    const missing = PAGE_ENV.filter((envName) => {
      if (envName === 'META_GRAPH_API_VERSION') return !settings.graphApiVersion;
      if (envName === 'META_PAGE_ID') return !settings.pageId;
      return !settings.pageAccessToken;
    });
    if (missing.length) {
      throw new MetaConfigError(
        `Set ${missing.join(', ')} before testing the Facebook Page. No request was sent.`,
        missing,
      );
    }

    try {
      assertGraphVersion(settings);
      const data = await api.getPage(settings.pageId);
      if (!data || !/^\d+$/.test(String(data.id || ''))) {
        throw new MetaApiError(SAFE_MESSAGES.graph_error, { category: 'graph_error', status: 502 });
      }
      const page = {
        id: String(data.id),
        name: publicName(data.name),
      };
      memory.page = {
        fingerprint: fingerprint(settings.pageAccessToken),
        status: 'connected',
        checkedAt: new Date().toISOString(),
        message: null,
        code: null,
        page,
      };
      return { success: true, connected: true, page };
    } catch (error) {
      const record = failureRecord(error, settings.pageAccessToken);
      if (record) memory.page = record;
      throw error;
    }
  }

  async function inspectPermissions() {
    const settings = api.readActiveSettings();
    const adsToken = await inspectToken('ads', settings);
    const pageToken = await inspectToken('page', settings);
    memory.permissions = {
      checkedAt: new Date().toISOString(),
      ads: { fingerprint: fingerprint(settings.adsAccessToken), result: adsToken },
      page: { fingerprint: fingerprint(settings.pageAccessToken), result: pageToken },
    };
    return {
      success: true,
      note: 'Permission results list token scopes only. They do not change Meta permissions, and they do not confirm Page Lead Access.',
      adsToken,
      pageToken,
    };
  }

  function getConnectionStatus() {
    const settings = api.readActiveSettings();
    const report = buildReport(settings);
    const adsStored = visiblePermission(
      memory.permissions && memory.permissions.ads,
      settings.adsAccessToken,
    );
    const pageStored = visiblePermission(
      memory.permissions && memory.permissions.page,
      settings.pageAccessToken,
    );
    const adsInspection = adsStored || blankPermission(
      settings.adsAccessToken ? 'not_tested' : 'not_configured',
      settings.adsAccessToken
        ? 'Ad account permissions have not been inspected in this server process.'
        : 'Set META_ADS_ACCESS_TOKEN before inspecting ad account permissions. No request was sent.',
    );
    const pageInspection = pageStored || blankPermission(
      settings.pageAccessToken ? 'not_tested' : 'not_configured',
      settings.pageAccessToken
        ? 'Page permissions have not been inspected in this server process.'
        : 'Set META_PAGE_ACCESS_TOKEN before inspecting page permissions. No request was sent.',
    );

    return {
      success: true,
      persistence: 'process_memory',
      note: 'Connection results live in this server process only. A restart reports not_tested until the test endpoints run again. Credentials alone are never reported as connected.',
      adAccount: describeConnection(
        report.readyForAdAccountRequests,
        configurationMessage(settings, AD_ACCOUNT_ENV),
        memory.adAccount,
        settings.adsAccessToken,
        'adAccount',
      ),
      page: describeConnection(
        report.readyForPageDetails,
        configurationMessage(settings, PAGE_ENV),
        memory.page,
        settings.pageAccessToken,
        'page',
      ),
      permissions: {
        status: rollupPermissions(adsInspection, pageInspection),
        checkedAt: (adsStored || pageStored) ? memory.permissions.checkedAt : null,
        adsToken: adsInspection,
        pageToken: pageInspection,
      },
      optional: {
        businessIdConfigured: report.configured.businessId,
      },
    };
  }

  return {
    testAdAccountConnection,
    testPageConnection,
    inspectPermissions,
    getConnectionStatus,
    toPublicMetaError,
  };
}

module.exports = {
  createConnectionService,
  toPublicMetaError,
  ADS_SCOPES,
  PAGE_SCOPES,
};
