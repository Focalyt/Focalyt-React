const { Schema, model } = require('mongoose');

const projectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  centers: {
    type: Number,
    default: 0,
  },
  verticalId: {
    type: Schema.Types.ObjectId,
    ref: 'Vertical',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

module.exports = model('Project', projectSchema);
