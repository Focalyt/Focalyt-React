const mongoose = require('mongoose');

const jobAssignmentRuleSchema = new mongoose.Schema({
  ruleName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },

  jobCategory: {
    type: {
      type: String,
      enum: ['includes', 'any'],
      default: 'includes'
    },
    values: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobCategory'
    }]
  },

  assignedHrs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

jobAssignmentRuleSchema.index({ status: 1, 'jobCategory.values': 1 });
jobAssignmentRuleSchema.index({ assignedHrs: 1 });

module.exports = mongoose.model('JobAssignmentRule', jobAssignmentRuleSchema);
