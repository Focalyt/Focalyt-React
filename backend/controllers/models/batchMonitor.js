const mongoose = require('mongoose');
const { Schema, Types } = mongoose;


const BatchMonitorSchema = new Schema(
  {
    batchId: { type: Types.ObjectId, ref: 'Batch', required: false, index: true },
    batchName: { type: String, trim: true },

    component: { type: String, required: true, trim: true },
    task: { type: String, required: true, trim: true },
    owner: { type: String, trim: true, default: '' },
    support: { type: String, trim: true, default: '' },

    level: { type: String, enum: ['Critical', 'Medium', 'Normal'], default: 'Critical' },
    status: { type: String, enum: ['Pending', 'Done'], default: 'Pending' },

    remarks: { type: String, trim: true, default: '' },

    createdBy: { type: Types.ObjectId, ref: 'User' },
    updatedBy: { type: Types.ObjectId, ref: 'User' },

    collegeId: { type: Types.ObjectId, ref: 'College', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BatchMonitor', BatchMonitorSchema);

