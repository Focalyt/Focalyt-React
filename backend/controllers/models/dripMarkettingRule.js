// ==============================================
// DRIP MARKETING RULE SCHEMA (CORRECTED STRUCTURE)
// ==============================================

const mongoose = require('mongoose');

const DripMarketingRuleSchema = new mongoose.Schema({
  // Rule Basic Info
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  

  // Scheduling
  startDate: {
    type: Date,
    required: true
  },
  
  
  // IF CONDITIONS
  // Structure: Multiple condition blocks (Add Condition button creates these)
  conditionBlocks: [{
    // Main condition (always present in each block)
    conditions: [{
      activityType: {
        type: String,
        required: true,
        enum: ['state', 'status', 'subStatus', 'leadOwner', 'registeredBy', 
               'courseName', 'jobName', 'project', 'vertical', 'center', 'course', 'batch']
      },
      operator: {
        type: String,
        required: true,
        enum: ['equals', 'not_equals']
      },
      values: [mongoose.Schema.Types.Mixed] // Array for multiselect support
    }],
    
    // Logic operator within this block (between main + sub conditions)
    // This corresponds to your "subLogicOperator" state
    intraBlockLogicOperator: {
      type: String,
      enum: ['and', 'or'],
      default: 'and'
    }
  }],
  
  // Logic operator between different condition blocks
  // This corresponds to your main "logicOperator" state
  interBlockLogicOperator: {
    type: String,
    enum: ['and', 'or'],
    default: 'and'
  },

  // THEN ACTIONS
  // First action (thenFirst + thenShouldBe)
  primaryAction: {
    activityType: {
      type: String,
      required: true,
      enum: ['state', 'status', 'subStatus', 'leadOwner', 'registeredBy',
             'courseName', 'jobName', 'project', 'vertical', 'center', 'course', 'batch']
    },
    values: {
      type: [mongoose.Schema.Types.Mixed],
      required: true
    }
  },

  // Additional actions (handleAddThenCondition creates these)
  additionalActions: [{
    activityType: {
      type: String,
      required: true,
      enum: ['state', 'status', 'subStatus', 'leadOwner', 'registeredBy',
             'courseName', 'jobName', 'project', 'vertical', 'center', 'course', 'batch']
    },
    values: {
      type: [mongoose.Schema.Types.Mixed],
      required: true
    }
  }],

  // Communication Settings (corresponds to the final communication block)
  communication: {
    executionType: {
      type: String,
      required: true,
      enum: ['immediate', 'occurrences'],
      default: 'immediate'
    },
    
    // For immediate execution
    mode: {
      type: String,
      enum: ['email', 'whatsapp', 'sms'],
      required: function() {
        return this.executionType === 'immediate';
      }
    },

    communications: [{
      templateId: String,
      timing: String,
      order: Number
    }],
    recipient: {
      type: String,
      default: ''
    },
    // recipient: {
    //   type: String,
    //   enum: ['email', 'whatsapp', 'sms'],
    //   required: function() {
    //     return this.executionType === 'immediate';
    //   }
    // },
    
    // For occurrence-based execution  
    occurrenceCount: {
      type: Number,
      min: 1,
      required: function() {
        return this.executionType === 'occurrences';
      }
    },
    
 
    
    // Advanced settings
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    
    retrySettings: {
      maxRetries: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 300 } // seconds
    }
  },

  // Rule Status & Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Rule State Storage (to match your component states)
  uiState: {
    // Store the current tab state
    activeTab: { type: Number, default: 0 },
    
    // Store condition selections state
    conditionSelections: [[String]], // Maps to your conditionSelections state
    conditionOperators: [[String]], // Maps to your conditionOperators state  
    conditionValues: [[mongoose.Schema.Types.Mixed]], // Maps to your conditionValues state
    
    // Store sub-condition selections state
    subConditionSelections: [[[String]]], // Maps to your subConditionSelections state
    subConditionOperators: [[[String]]], // Maps to your subConditionOperators state
    subConditionValues: [[[mongoose.Schema.Types.Mixed]]], // Maps to your subConditionValues state
    
    // Store THEN section states
    thenFirst: String, // Maps to your thenFirst state
    thenShouldBe: [mongoose.Schema.Types.Mixed], // Maps to your thenShouldBe state
    thenExecType: String, // Maps to your thenExecType state
    thenMode: String, // Maps to your thenMode state
    thenCount: String, // Maps to your thenCount state
    
    // Store condition states arrays
    thenConditionSelections: [[String]], // Maps to your thenConditionSelections state
    thenSubConditionSelections: [[[String]]] // Maps to your thenSubConditionSelections state
  },

  // Execution Statistics
  stats: {
    totalExecutions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    lastExecutedAt: Date,
    averageExecutionTime: Number
  },

  // Rule Configuration
  config: {
    maxExecutionsPerLead: { type: Number, default: 1 },
    cooldownPeriod: { type: Number, default: 24 }, // hours
    priority: { type: Number, default: 5, min: 1, max: 10 },
    isTestMode: { type: Boolean, default: false },
    autoDeactivateAt: Date
  },

  // Execution Logs (for tracking)
  executionLogs: [{
    leadId: mongoose.Schema.Types.ObjectId,
    executedAt: { type: Date, default: Date.now },
    
    // Condition evaluation results
    conditionEvaluation: {
      // Results for each condition block
      blockResults: [{
        blockIndex: Number,
        mainConditionResult: Boolean,
        subConditionResults: [Boolean],
        blockFinalResult: Boolean, // After applying intraBlockLogicOperator
        evaluationDetails: {
          mainCondition: {
            activityType: String,
            operator: String,
            expectedValues: [mongoose.Schema.Types.Mixed],
            actualValue: mongoose.Schema.Types.Mixed,
            matched: Boolean
          },
          subConditions: [{
            activityType: String,
            operator: String,
            expectedValues: [mongoose.Schema.Types.Mixed],
            actualValue: mongoose.Schema.Types.Mixed,
            matched: Boolean
          }]
        }
      }],
      
      // Overall result after applying interBlockLogicOperator
      overallResult: Boolean
    },
    
    // Actions performed
    actionsPerformed: {
      primaryAction: {
        activityType: String,
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        success: Boolean,
        error: String
      },
      additionalActions: [{
        activityType: String,
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        success: Boolean,
        error: String
      }]
    },
    
    // Communication status
    communicationResult: {
      attempted: Boolean,
      mode: String,
      success: Boolean,
      messageId: String,
      recipient: {
        email: String,
        phone: String,
        name: String
      },
      error: String,
      timestamps: {
        sentAt: Date,
        deliveredAt: Date,
        openedAt: Date,
        clickedAt: Date
      }
    },
    
    // Overall execution status
    status: {
      type: String,
      enum: ['completed', 'failed', 'skipped', 'partial'],
      default: 'completed'
    },
    
    executionTime: Number, // milliseconds
    error: String,
    
    // Environment info
    executedBy: String,
    ruleVersion: Number
  }],

  // Version control
  version: { type: Number, default: 1 },
  
  // Tags and notes
  tags: [String],
  notes: String
  
}, {
  timestamps: true
});

// Indexes for performance
DripMarketingRuleSchema.index({ isActive: 1 });
DripMarketingRuleSchema.index({ createdBy: 1 });
DripMarketingRuleSchema.index({ startDate: 1, startTime: 1 });
DripMarketingRuleSchema.index({ 'executionLogs.leadId': 1 });
DripMarketingRuleSchema.index({ 'config.priority': -1 });
DripMarketingRuleSchema.index({ tags: 1 });

// Middleware
DripMarketingRuleSchema.pre('save', function(next) {
  // Update version on modification
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  // Validate condition blocks structure
  if (!this.conditionBlocks || this.conditionBlocks.length === 0) {
    return next(new Error('At least one condition block is required'));
  }
  
  // Ensure each block has a main condition
  for (let block of this.conditionBlocks) {
    if (!block.conditions || block.conditions.length === 0) {
      return next(new Error('Each condition block must have at least one condition'));
    }
    
    // Check if any condition has activityType
    const hasValidCondition = block.conditions.some(condition => condition.activityType);
    if (!hasValidCondition) {
      return next(new Error('Each condition block must have a condition with activityType'));
    }
  }
  
  // Validate primary action
  if (!this.primaryAction || !this.primaryAction.activityType) {
    return next(new Error('Primary action is required'));
  }
  
  // Communication validation
  if (this.communication.executionType === 'immediate' && !this.communication.mode) {
    return next(new Error('Communication mode is required for immediate execution'));
  }
  
  if (this.communication.executionType === 'occurrences' && !this.communication.occurrenceCount) {
    return next(new Error('Occurrence count is required for occurrence-based execution'));
  }
  
  next();
});

// Export model
const DripMarketingRule = mongoose.model('DripMarketingRule', DripMarketingRuleSchema);

module.exports = DripMarketingRule;
