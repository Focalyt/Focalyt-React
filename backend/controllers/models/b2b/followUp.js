const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const FollowUpSchema = new mongoose.Schema({
  leadId: { type: ObjectId, ref: 'B2BLead', required: true },
  followUpType: { type: String, required: true }, // Call, Email, Meeting, WhatsApp
  description: { type: String, required: true },
  status: { type: String, required: true, default: 'Pending' }, // Pending, Completed, Rescheduled
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  addedBy: { type: ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('FollowUp', FollowUpSchema); 