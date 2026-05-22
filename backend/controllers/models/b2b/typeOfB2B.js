const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const TypeOfB2BSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  department: { type: ObjectId, ref: 'B2BDepartment' },
  isActive: { type: Boolean, default: true },
  addedBy: { type: ObjectId, ref: 'User' },
}, {
  timestamps: true
});

TypeOfB2BSchema.index({ name: 1, department: 1 }, { unique: true, partialFilterExpression: { department: { $type: 'objectId' } } });

module.exports = mongoose.model('TypeOfB2B', TypeOfB2BSchema);
