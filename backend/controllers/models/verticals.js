const { Schema, model } = require('mongoose');

const verticalSchema = new Schema({
  name: {
    type: String,
    required: true,
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
  },
  college: {
    type: Schema.Types.ObjectId,
    ref: 'College',
  },
  isApproved:{
    type:Boolean,
    default:false
  }
}, { timestamps: true });

module.exports = model('Vertical', verticalSchema);
