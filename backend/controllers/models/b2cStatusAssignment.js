const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// One row per project and status: in this project, show this status with these substatuses.
const B2cStatusAssignmentSchema = new mongoose.Schema({
  college: { type: ObjectId, ref: 'College', required: true },
  // The project's department (vertical), stored for filtering
  department: { type: ObjectId, ref: 'Vertical', required: true },
  project: { type: ObjectId, ref: 'Project', required: true },
  status: { type: ObjectId, ref: 'Status', required: true },
  // _ids of substatuses embedded in the status
  substatuses: { type: [ObjectId], default: [] },
  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

B2cStatusAssignmentSchema.index({ college: 1, project: 1, status: 1 }, { unique: true });
B2cStatusAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model('B2cStatusAssignment', B2cStatusAssignmentSchema);
