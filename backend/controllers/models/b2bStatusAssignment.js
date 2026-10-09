const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// One row per project and status: in this B2B project, show this status with these substatuses.
const B2bStatusAssignmentSchema = new mongoose.Schema({
  college: { type: ObjectId, ref: 'College', required: true },
  // The project's primary department, stored for filtering (a B2B project can list several departments)
  department: { type: ObjectId, ref: 'B2BDepartment', default: null },
  project: { type: ObjectId, ref: 'B2BProject', required: true },
  status: { type: ObjectId, ref: 'StatusB2b', required: true },
  // _ids of substatuses embedded in the status
  substatuses: { type: [ObjectId], default: [] },
  createdBy: { type: ObjectId, ref: 'User' },
  updatedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

B2bStatusAssignmentSchema.index({ college: 1, project: 1, status: 1 }, { unique: true });
B2bStatusAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model('B2bStatusAssignment', B2bStatusAssignmentSchema);
