const mongoose = require('mongoose');

const { Schema } = mongoose;

const metaFormSchema = new Schema({
  pageId: { type: String, required: true, trim: true },
  formId: { type: String, required: true, trim: true },
  formName: { type: String, default: '', trim: true },
  formStatus: { type: String, default: '', trim: true },
  metadataStatus: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'unavailable',
  },
  lastSyncedAt: { type: Date, required: true },
}, { timestamps: true, collection: 'meta_forms' });

metaFormSchema.index({ pageId: 1, formId: 1 }, { unique: true });

module.exports = mongoose.model('MetaForm', metaFormSchema);
