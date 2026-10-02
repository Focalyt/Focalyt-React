const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * One course session referred into one batch.
 * Created from Batch Monitoring → Refer Session, not when a batch team is assigned.
 * The SessionPlan document stays the shared course session.
 */
const batchSessionAssignmentSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'courses',
    required: true,
  },
  batch: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'SessionPlan',
    required: true,
  },
  seniorTrainer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  trainer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

batchSessionAssignmentSchema.index({ batch: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('BatchSessionAssignment', batchSessionAssignmentSchema);
