const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const TypeOfB2BSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  addedBy:{type:ObjectId, ref:'User'},
}, {
  timestamps: true
});

module.exports = mongoose.model('TypeOfB2B', TypeOfB2BSchema); 