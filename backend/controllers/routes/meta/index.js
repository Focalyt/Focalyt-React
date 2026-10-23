const express = require('express');
const { isCollege } = require('../../../helpers');
const { getHealth, getConfigStatus, logStartupStatus } = require('../../../services/meta');
const { startMetaLeadWorker } = require('../../../services/meta/metaLeadWorker');
const {
  requireCrmAdmin,
  testAdAccount,
  testPage,
  testPermissions,
  connectionStatus,
  syncDiscoveredAds,
  discoveredAds,
  discoveredForms,
  adSyncStatus,
} = require('./handlers');
const {
  verifyMetaWebhook,
  receiveMetaWebhook,
} = require('./webhookHandlers');
const {
  listFormMappings,
  unmappedFormMappings,
  formMappingOptions,
  createFormMapping,
  getFormMapping,
  updateFormMapping,
  deactivateFormMapping,
} = require('./mappingHandlers');

const router = express.Router();

router.get('/webhook', verifyMetaWebhook);
router.post('/webhook', receiveMetaWebhook);

router.get('/health', isCollege, requireCrmAdmin, (_req, res) => res.status(200).json(getHealth()));

router.get('/config/status', isCollege, requireCrmAdmin, (_req, res) => (
  res.status(200).json(getConfigStatus())
));

router.get('/test/ad-account', isCollege, requireCrmAdmin, testAdAccount);
router.get('/test/page', isCollege, requireCrmAdmin, testPage);
router.get('/test/permissions', isCollege, requireCrmAdmin, testPermissions);
router.get('/connection-status', isCollege, requireCrmAdmin, connectionStatus);
router.post('/ads/sync', isCollege, requireCrmAdmin, syncDiscoveredAds);
router.get('/ads/sync-status', isCollege, requireCrmAdmin, adSyncStatus);
router.get('/ads', isCollege, requireCrmAdmin, discoveredAds);
router.get('/forms', isCollege, requireCrmAdmin, discoveredForms);
router.get('/mappings/options', isCollege, requireCrmAdmin, formMappingOptions);
router.get('/mappings/unmapped', isCollege, requireCrmAdmin, unmappedFormMappings);
router.get('/mappings', isCollege, requireCrmAdmin, listFormMappings);
router.post('/mappings', isCollege, requireCrmAdmin, createFormMapping);
router.get('/mappings/:id', isCollege, requireCrmAdmin, getFormMapping);
router.patch('/mappings/:id', isCollege, requireCrmAdmin, updateFormMapping);
router.delete('/mappings/:id', isCollege, requireCrmAdmin, deactivateFormMapping);

logStartupStatus();

startMetaLeadWorker();

module.exports = router;
