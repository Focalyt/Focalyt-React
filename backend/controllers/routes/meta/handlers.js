const {
  testAdAccountConnection,
  testPageConnection,
  inspectPermissions,
  getConnectionStatus,
  toPublicMetaError,
  syncAds,
  listDiscoveredAds,
  listDiscoveredForms,
  getAdSyncStatus,
  parseSyncOptions,
  parseAdQuery,
} = require('../../../services/meta');

function requireCrmAdmin(req, res, next) {
  if (req.user && req.user.permissions && req.user.permissions.permission_type === 'Admin') {
    return next();
  }
  return res.status(403).json({
    status: false,
    message: 'CRM admin permission is required',
  });
}

function sendMetaResult(res, error, toError) {
  const mapped = toError(error);
  return res.status(mapped.statusCode).json(mapped.payload);
}

function sendSyncError(res, error, service) {
  if (error && error.code === 'META_SYNC_IN_PROGRESS') {
    return res.status(409).json({
      success: false,
      code: 'sync_in_progress',
      message: error.message,
    });
  }
  if (error && error.code === 'META_BAD_REQUEST') {
    return res.status(400).json({
      success: false,
      code: 'bad_request',
      message: error.message,
    });
  }
  return sendMetaResult(res, error, service.toPublicMetaError);
}

function createMetaHandlers(service) {
  async function testAdAccount(_req, res) {
    try {
      const result = await service.testAdAccountConnection();
      return res.status(200).json(result);
    } catch (error) {
      return sendMetaResult(res, error, service.toPublicMetaError);
    }
  }

  async function testPage(_req, res) {
    try {
      const result = await service.testPageConnection();
      return res.status(200).json(result);
    } catch (error) {
      return sendMetaResult(res, error, service.toPublicMetaError);
    }
  }

  async function testPermissions(_req, res) {
    try {
      const result = await service.inspectPermissions();
      return res.status(200).json(result);
    } catch (error) {
      return sendMetaResult(res, error, service.toPublicMetaError);
    }
  }

  function connectionStatus(_req, res) {
    try {
      return res.status(200).json(service.getConnectionStatus());
    } catch (error) {
      return sendMetaResult(res, error, service.toPublicMetaError);
    }
  }

  async function syncDiscoveredAds(req, res) {
    try {
      const options = service.parseSyncOptions(req.body);
      const result = await service.syncAds(options);
      return res.status(200).json(result);
    } catch (error) {
      return sendSyncError(res, error, service);
    }
  }

  async function discoveredAds(req, res) {
    try {
      const result = await service.listDiscoveredAds(req.query);
      return res.status(200).json(result);
    } catch (error) {
      return sendSyncError(res, error, service);
    }
  }

  async function discoveredForms(_req, res) {
    try {
      const result = await service.listDiscoveredForms();
      return res.status(200).json(result);
    } catch (error) {
      return sendSyncError(res, error, service);
    }
  }

  async function adSyncStatus(_req, res) {
    try {
      const result = await service.getAdSyncStatus();
      return res.status(200).json(result);
    } catch (error) {
      return sendSyncError(res, error, service);
    }
  }

  return {
    testAdAccount,
    testPage,
    testPermissions,
    connectionStatus,
    syncDiscoveredAds,
    discoveredAds,
    discoveredForms,
    adSyncStatus,
  };
}

module.exports = {
  requireCrmAdmin,
  createMetaHandlers,
  ...createMetaHandlers({
    testAdAccountConnection,
    testPageConnection,
    inspectPermissions,
    getConnectionStatus,
    toPublicMetaError,
    syncAds,
    listDiscoveredAds,
    listDiscoveredForms,
    getAdSyncStatus,
    parseSyncOptions,
    parseAdQuery,
  }),
};
