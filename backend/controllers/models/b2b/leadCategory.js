const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const LeadCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadCategory', LeadCategorySchema); 