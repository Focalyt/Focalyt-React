const { Schema, model } = require('mongoose');

const centerSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
  },
 
  status: {
    type: Boolean,
    default: true,
  },
  projects: [{
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  }],
  college: {
    type: Schema.Types.ObjectId,
    ref: 'College',
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

module.exports = model('Center', centerSchema);
