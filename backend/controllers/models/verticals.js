const { Schema, model } = require('mongoose');

const verticalSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  description: {
    type: String,
  },  
  status: {
    type: Boolean,
    default: true,
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

module.exports = model('Vertical', verticalSchema);
