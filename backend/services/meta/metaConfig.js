const path = require('path');

// config.js skips dotenv when NODE_ENV is already production, then snapshots
// META_* before routes load backend/.env. Read the file here and copy values
// from process.env on each call so webhook verification sees the live token.
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function currentMetaSettings() {
  return {
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    graphApiVersion: process.env.META_GRAPH_API_VERSION,
    adAccountId: process.env.META_AD_ACCOUNT_ID,
    adsAccessToken: process.env.META_ADS_ACCESS_TOKEN,
    pageId: process.env.META_PAGE_ID,
    pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN,
    verifyToken: process.env.META_VERIFY_TOKEN,
    businessId: process.env.META_BUSINESS_ID,
  };
}

const GRAPH_HOST = 'https://graph.facebook.com';

const REQUIRED_FIELDS = [
  { field: 'appId', env: 'META_APP_ID' },
  { field: 'appSecret', env: 'META_APP_SECRET' },
  { field: 'graphApiVersion', env: 'META_GRAPH_API_VERSION' },
  { field: 'adAccountId', env: 'META_AD_ACCOUNT_ID' },
  { field: 'adsAccessToken', env: 'META_ADS_ACCESS_TOKEN' },
  { field: 'pageId', env: 'META_PAGE_ID' },
  { field: 'pageAccessToken', env: 'META_PAGE_ACCESS_TOKEN' },
  { field: 'verifyToken', env: 'META_VERIFY_TOKEN' },
];

class MetaConfigError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = 'MetaConfigError';
    this.code = 'META_CONFIG_MISSING';
    this.status = 503;
    this.missing = missing;
  }
}

function clean(value) {
  if (value == null) return '';
  return String(value).trim();
}

function isGraphVersionValid(version) {
  return /^v\d+\.\d+$/.test(version);
}

function readSettings(override) {
  const source = override || currentMetaSettings();
  return {
    appId: clean(source.appId),
    appSecret: clean(source.appSecret),
    graphApiVersion: clean(source.graphApiVersion),
    adAccountId: clean(source.adAccountId),
    adsAccessToken: clean(source.adsAccessToken),
    pageId: clean(source.pageId),
    pageAccessToken: clean(source.pageAccessToken),
    verifyToken: clean(source.verifyToken),
    businessId: clean(source.businessId),
  };
}

function buildReport(settings) {
  const configured = {};
  const missing = [];

  REQUIRED_FIELDS.forEach(({ field, env }) => {
    const present = Boolean(settings[field]);
    configured[field] = present;
    if (!present) missing.push(env);
  });
  configured.businessId = Boolean(settings.businessId);

  const version = settings.graphApiVersion;
  let graphApiVersionValid = null;
  if (version) graphApiVersionValid = isGraphVersionValid(version);

  const versionReady = Boolean(configured.graphApiVersion && graphApiVersionValid);
  const readyForPageRequests = Boolean(versionReady && configured.pageAccessToken);
  const readyForAdAccountRequests = Boolean(
    versionReady && configured.adAccountId && configured.adsAccessToken,
  );
  const readyForPageDetails = Boolean(
    versionReady && configured.pageId && configured.pageAccessToken,
  );
  const configurationComplete = missing.length === 0 && graphApiVersionValid === true;

  return {
    configured,
    missing,
    graphApiVersionValid,
    graphApiHost: GRAPH_HOST,
    readyForGraphRequests: readyForPageRequests,
    readyForAdAccountRequests,
    readyForPageDetails,
    configurationComplete,
  };
}

function getConfigStatus() {
  const report = buildReport(readSettings());
  return {
    status: true,
    module: 'meta',
    graphApiHost: report.graphApiHost,
    configured: {
      appId: report.configured.appId,
      appSecret: report.configured.appSecret,
      graphApiVersion: report.configured.graphApiVersion,
      adAccountId: report.configured.adAccountId,
      adsAccessToken: report.configured.adsAccessToken,
      pageId: report.configured.pageId,
      pageAccessToken: report.configured.pageAccessToken,
      verifyToken: report.configured.verifyToken,
      businessId: report.configured.businessId,
    },
    optional: {
      businessId: 'META_BUSINESS_ID',
    },
    graphApiVersionValid: report.graphApiVersionValid,
    missing: report.missing,
    readyForGraphRequests: report.readyForGraphRequests,
    readyForAdAccountRequests: report.readyForAdAccountRequests,
    readyForPageDetails: report.readyForPageDetails,
    configurationComplete: report.configurationComplete,
  };
}

function getHealth() {
  const report = buildReport(readSettings());
  return {
    status: true,
    module: 'meta',
    loaded: true,
    graphApiHost: report.graphApiHost,
    configurationPresent: {
      META_APP_ID: report.configured.appId,
      META_APP_SECRET: report.configured.appSecret,
      META_GRAPH_API_VERSION: report.configured.graphApiVersion,
      META_AD_ACCOUNT_ID: report.configured.adAccountId,
      META_ADS_ACCESS_TOKEN: report.configured.adsAccessToken,
      META_PAGE_ID: report.configured.pageId,
      META_PAGE_ACCESS_TOKEN: report.configured.pageAccessToken,
      META_VERIFY_TOKEN: report.configured.verifyToken,
      META_BUSINESS_ID: report.configured.businessId,
    },
    graphApiVersionValid: report.graphApiVersionValid,
    configurationComplete: report.configurationComplete,
    readyForGraphRequests: report.readyForGraphRequests,
    readyForAdAccountRequests: report.readyForAdAccountRequests,
    readyForPageDetails: report.readyForPageDetails,
    routesCallGraphApi: false,
    connectionTestsCallGraphApi: true,
  };
}

function logStartupStatus() {
  try {
    const report = buildReport(readSettings());
    if (report.configurationComplete) {
      // eslint-disable-next-line no-console
      console.info('[meta] Lead Ads module loaded. Required configuration is present. No Graph API call was made.');
      return;
    }

    const missingText = report.missing.length ? report.missing.join(', ') : 'none';
    const versionText = report.graphApiVersionValid === false
      ? ' META_GRAPH_API_VERSION is set but is not in the v21.0 format.'
      : '';
    // eslint-disable-next-line no-console
    console.warn(
      `[meta] Lead Ads module loaded with incomplete configuration. Missing: ${missingText}.${versionText} The CRM server will continue to run. META_BUSINESS_ID is optional. Each connection test stays disabled until its own required values are present.`,
    );
  } catch (_startupError) {
    // eslint-disable-next-line no-console
    console.warn('[meta] Lead Ads module loaded, but configuration could not be read. The CRM server will continue to run.');
  }
}

function assertGraphVersion(settings) {
  if (!settings.graphApiVersion) {
    throw new MetaConfigError(
      'Set META_GRAPH_API_VERSION before calling the Meta Graph API. No request was sent.',
      ['META_GRAPH_API_VERSION'],
    );
  }
  if (!isGraphVersionValid(settings.graphApiVersion)) {
    throw new MetaConfigError(
      'META_GRAPH_API_VERSION must use the form v21.0. No request was sent.',
      ['META_GRAPH_API_VERSION'],
    );
  }
}

function assertGraphReady(settings) {
  const report = buildReport(settings);
  assertGraphVersion(settings);
  if (!report.configured.pageAccessToken) {
    throw new MetaConfigError(
      'Set META_PAGE_ACCESS_TOKEN before calling the Meta Graph API with the page token. No request was sent.',
      ['META_PAGE_ACCESS_TOKEN'],
    );
  }
}

module.exports = {
  GRAPH_HOST,
  MetaConfigError,
  readSettings,
  buildReport,
  getConfigStatus,
  getHealth,
  logStartupStatus,
  assertGraphReady,
  assertGraphVersion,
  isGraphVersionValid,
};
