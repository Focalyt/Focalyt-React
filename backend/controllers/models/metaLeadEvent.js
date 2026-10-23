const mongoose = require('mongoose');

const { Schema } = mongoose;

const STATUSES = ['pending', 'processing', 'mapping_pending', 'completed', 'failed'];

const metaLeadEventSchema = new Schema({
  metaLeadId: { type: String, required: true, trim: true },
  pageId: { type: String, required: true, trim: true },
  formId: { type: String, required: true, trim: true },
  adId: { type: String, default: '', trim: true },
  eventTime: { type: Date, default: null },
  processingStatus: { type: String, enum: STATUSES, default: 'pending' },
  retryCount: { type: Number, default: 0 },
  nextRetryAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  crmLeadId: { type: Schema.Types.ObjectId, ref: 'AppliedCourses', default: null },
  receivedAt: { type: Date, required: true },
  processedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'meta_lead_events' });

metaLeadEventSchema.index({ metaLeadId: 1 }, { unique: true });
metaLeadEventSchema.index({ processingStatus: 1, nextRetryAt: 1 });

module.exports = mongoose.model('MetaLeadEvent', metaLeadEventSchema);
