const mongoose = require('mongoose');

const leadAssignmentRuleSchema = new mongoose.Schema({
  ruleName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  
  // Center criteria
  center: {
    type: {
      type: String,
      enum: ['includes', 'any'],
      default: 'includes'
    },
    values: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Center'
    }]
  },
  
  // Course criteria  
  course: {
    type: {
      type: String,
      enum: ['includes', 'any'],
      default: 'any'
    },
    values: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'courses'
    }]
  },
  
  // Assigned counselors
  assignedCounselors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Rule status
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  
  
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Last modified by
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});



module.exports = mongoose.model('LeadAssignmentRule', leadAssignmentRuleSchema);