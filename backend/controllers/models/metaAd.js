const mongoose = require('mongoose');

const { Schema } = mongoose;

const metaAdSchema = new Schema({
  adAccountId: { type: String, required: true, trim: true },
  adId: { type: String, required: true, trim: true },
  adName: { type: String, default: '', trim: true },
  campaignId: { type: String, default: '', trim: true },
  adSetId: { type: String, default: '', trim: true },
  pageId: { type: String, default: '', trim: true },
  formId: { type: String, default: '', trim: true },
  creativeId: { type: String, default: '', trim: true },
  adStatus: { type: String, default: '', trim: true },
  effectiveStatus: { type: String, default: '', trim: true },
  formName: { type: String, default: '', trim: true },
  formStatus: { type: String, default: '', trim: true },
  discoveryStatus: {
    type: String,
    enum: ['lead_form_found', 'not_lead_ad', 'form_unresolved'],
    required: true,
  },
  formMetadataStatus: {
    type: String,
    enum: ['available', 'unavailable', 'not_applicable'],
    default: 'not_applicable',
  },
  sourceUpdatedTime: { type: Date, default: null },
  lastSyncedAt: { type: Date, required: true },
}, { timestamps: true, collection: 'meta_ads' });

metaAdSchema.index({ adAccountId: 1, adId: 1 }, { unique: true });

module.exports = mongoose.model('MetaAd', metaAdSchema);
