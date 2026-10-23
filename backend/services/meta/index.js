const { createMetaApi, MetaApiError } = require('./metaApi');
const {
  getHealth,
  getConfigStatus,
  logStartupStatus,
  MetaConfigError,
} = require('./metaConfig');
const { createConnectionService, toPublicMetaError } = require('./metaConnection');
const { createAdSyncService } = require('./metaAdSync');
const { createMappingService, resolveMetaFormMapping } = require('./metaMapping');

const metaApi = createMetaApi();
const connection = createConnectionService(metaApi);
const adSync = createAdSyncService(metaApi);

module.exports = {
  createMetaApi,
  createConnectionService,
  toPublicMetaError,
  MetaApiError,
  MetaConfigError,
  getHealth,
  getConfigStatus,
  logStartupStatus,
  metaApi,
  testAdAccountConnection: connection.testAdAccountConnection,
  testPageConnection: connection.testPageConnection,
  inspectPermissions: connection.inspectPermissions,
  getConnectionStatus: connection.getConnectionStatus,
  createAdSyncService,
  syncAds: adSync.syncAds,
  listDiscoveredAds: adSync.listDiscoveredAds,
  listDiscoveredForms: adSync.listDiscoveredForms,
  getAdSyncStatus: adSync.getAdSyncStatus,
  parseSyncOptions: adSync.parseSyncOptions,
  parseAdQuery: adSync.parseAdQuery,
  createMappingService,
  resolveMetaFormMapping,
};
