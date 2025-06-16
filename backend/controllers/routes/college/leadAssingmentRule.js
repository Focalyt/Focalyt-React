// routes/leadAssignmentRules.js
const express = require('express');
const router = express.Router();
const LeadAssignmentRule = require('../../models/leadAssignmentRule');
const { isCollege } = require('../../../helpers/index');
const { body, validationResult, param } = require('express-validator');

// Validation middleware
const validateRule = [
  body('ruleName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Rule name is required and must be less than 100 characters'),
  
  body('center.type')
    .isIn(['includes', 'any'])
    .withMessage('Center type must be either includes or any'),
  
  body('course.type')
    .isIn(['includes', 'any'])
    .withMessage('Course type must be either includes or any'),
  
  body('assignedCounselors')
    .isArray({ min: 1 })
    .withMessage('At least one counselor must be assigned'),
  
  body('assignedCounselors.*')
    .isMongoId()
    .withMessage('Invalid counselor ID'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
];

// GET /api/lead-assignment-rules - Get all rules
router.get('/', isCollege, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;


    // Build filter object
    const filter = {};
    
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    if (search) {
      filter.ruleName = { $regex: search, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const rules = await LeadAssignmentRule.find(filter)
      .populate('center.values', 'name')
      .populate('course.values', 'name')
      .populate('assignedCounselors', 'name email user_id')
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await LeadAssignmentRule.countDocuments(filter);

    res.json({
      status: true,
      data: rules,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch assignment rules',
      error: error.message
    });
  }
});

// GET /api/lead-assignment-rules/:id - Get single rule
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid rule ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const rule = await LeadAssignmentRule.findById(req.params.id)
      .populate('center.values', 'name')
      .populate('course.values', 'name')
      .populate('assignedCounselors', 'name email user_id')
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email');

    if (!rule) {
      return res.status(404).json({
        status: false,
        message: 'Assignment rule not found'
      });
    }

    res.json({
      status: true,
      data: rule
    });

  } catch (error) {
    console.error('Error fetching rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch assignment rule',
      error: error.message
    });
  }
});

// POST /api/lead-assignment-rules - Create new rule
router.post('/', [validateRule, isCollege], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      ruleName,
      center,
      course,
      assignedCounselors,
      status = 'Active'
    } = req.body;

    // Check for duplicate rule name
    const existingRule = await LeadAssignmentRule.findOne({ 
      ruleName: { $regex: new RegExp(`^${ruleName}$`, 'i') }
    });

    if (existingRule) {
      return res.status(400).json({
        status: false,
        message: 'Rule with this name already exists'
      });
    }

    // Create new rule
    const newRule = new LeadAssignmentRule({
      ruleName,
      center: {
        type: center.type,
        values: center.type === 'includes' ? center.values : []
      },
      course: {
        type: course.type,
        values: course.type === 'includes' ? course.values : []
      },
      assignedCounselors,
      status,
      createdBy: req.user.id // Assuming user is attached to request via auth middleware
    });

    await newRule.save();

    // Populate and return the created rule
    const populatedRule = await LeadAssignmentRule.findById(newRule._id)
      .populate('center.values', 'name')
      .populate('course.values', 'name')
      .populate('assignedCounselors', 'name email user_id')
      .populate('createdBy', 'name email');

    res.status(201).json({
      status: true,
      message: 'Assignment rule created statusfully',
      data: populatedRule
    });

  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to create assignment rule',
      error: error.message
    });
  }
});

// PUT /api/lead-assignment-rules/:id - Update rule
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid rule ID'),
  ...validateRule
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      ruleName,
      center,
      course,
      assignedCounselors,
      status
    } = req.body;

    // Check if rule exists
    const existingRule = await LeadAssignmentRule.findById(req.params.id);
    if (!existingRule) {
      return res.status(404).json({
        status: false,
        message: 'Assignment rule not found'
      });
    }

    // Check for duplicate rule name (excluding current rule)
    const duplicateRule = await LeadAssignmentRule.findOne({
      _id: { $ne: req.params.id },
      ruleName: { $regex: new RegExp(`^${ruleName}$`, 'i') }
    });

    if (duplicateRule) {
      return res.status(400).json({
        status: false,
        message: 'Rule with this name already exists'
      });
    }

    // Update rule
    const updatedRule = await LeadAssignmentRule.findByIdAndUpdate(
      req.params.id,
      {
        ruleName,
        center: {
          type: center.type,
          values: center.type === 'includes' ? center.values : []
        },
        course: {
          type: course.type,
          values: course.type === 'includes' ? course.values : []
        },
        assignedCounselors,
        status,
        modifiedBy: req.user.id
      },
      { new: true, runValidators: true }
    )
      .populate('center.values', 'name')
      .populate('course.values', 'name')
      .populate('assignedCounselors', 'name email user_id')
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email');

    res.json({
      status: true,
      message: 'Assignment rule updated statusfully',
      data: updatedRule
    });

  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to update assignment rule',
      error: error.message
    });
  }
});

// PATCH /api/lead-assignment-rules/:id/status - Update rule status only
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid rule ID'),
  body('status').isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status } = req.body;

    const updatedRule = await LeadAssignmentRule.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        modifiedBy: req.user.id
      },
      { new: true, runValidators: true }
    )
      .populate('center.values', 'name')
      .populate('course.values', 'name')
      .populate('assignedCounselors', 'name email user_id');

    if (!updatedRule) {
      return res.status(404).json({
        status: false,
        message: 'Assignment rule not found'
      });
    }

    res.json({
      status: true,
      message: `Rule ${status.toLowerCase()} statusfully`,
      data: updatedRule
    });

  } catch (error) {
    console.error('Error updating rule status:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to update rule status',
      error: error.message
    });
  }
});

// DELETE /api/lead-assignment-rules/:id - Delete rule
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid rule ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const deletedRule = await LeadAssignmentRule.findByIdAndDelete(req.params.id);

    if (!deletedRule) {
      return res.status(404).json({
        status: false,
        message: 'Assignment rule not found'
      });
    }

    res.json({
      status: true,
      message: 'Assignment rule deleted statusfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to delete assignment rule',
      error: error.message
    });
  }
});

module.exports = router;

// Example usage in your main app.js
/*
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample auth middleware (replace with your actual auth)
app.use('/api', (req, res, next) => {
  // For testing purposes - replace with actual auth
  req.user = { id: '507f1f77bcf86cd799439011' };
  next();
});

// Routes
app.use('/api/lead-assignment-rules', require('./routes/leadAssignmentRules'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/