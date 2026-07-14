const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const LeadRankingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadRanking', LeadRankingSchema);
