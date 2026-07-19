const mongoose = require('mongoose');

/**
 * Queued drip communications (WhatsApp / email / sms).
 * Created when a lead matches a rule; sent when scheduledAt <= now.
 */
const DripMarketingJobSchema = new mongoose.Schema({
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DripMarketingRule',
    required: true,
    index: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppliedCourses',
    required: true,
    index: true
  },
  mode: {
    type: String,
    enum: ['whatsapp', 'email', 'sms'],
    default: 'whatsapp'
  },
  templateId: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 1
  },
  timing: {
    type: String,
    default: ''
  },
  recipient: {
    type: String,
    default: 'sender'
  },
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'skipped'],
    default: 'pending',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  messageId: String,
  error: String,
  sentAt: Date,
  phone: String
}, {
  timestamps: true
});

DripMarketingJobSchema.index(
  { ruleId: 1, leadId: 1, order: 1 },
  { unique: true }
);
DripMarketingJobSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('DripMarketingJob', DripMarketingJobSchema);
