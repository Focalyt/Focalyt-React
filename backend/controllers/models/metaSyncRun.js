const mongoose = require('mongoose');

const { Schema } = mongoose;

const metaSyncRunSchema = new Schema({
  startedAt: { type: Date, required: true },
  finishedAt: { type: Date, required: true },
  result: {
    type: String,
    enum: ['success', 'partial', 'error'],
    required: true,
  },
  stats: { type: Schema.Types.Mixed, default: {} },
  syncErrors: {
    type: [{
      category: { type: String, default: '' },
      message: { type: String, default: '' },
    }],
    default: [],
  },
}, { timestamps: true, collection: 'meta_sync_runs' });

metaSyncRunSchema.index({ finishedAt: -1 });

module.exports = mongoose.model('MetaSyncRun', metaSyncRunSchema);
