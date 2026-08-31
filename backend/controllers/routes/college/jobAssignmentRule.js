const express = require('express');
const router = express.Router();
const JobAssignmentRule = require('../../models/jobAssignmentRule');
const { isCollege } = require('../../../helpers/index');
const { body, validationResult, param } = require('express-validator');

const validateRule = [
  body('ruleName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Rule name is required and must be less than 100 characters'),

  body('jobCategory.type')
    .isIn(['includes', 'any'])
    .withMessage('Job category type must be either includes or any'),

  body('assignedHrs')
    .isArray({ min: 1 })
    .withMessage('At least one HR must be assigned'),

  body('assignedHrs.*')
    .isMongoId()
    .withMessage('Invalid HR ID'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
];

function getActorId(req) {
  return req.user && (req.user._id || req.user.id);
}

function normalizeJobCategory(jobCategory = {}) {
  const type = jobCategory.type === 'any' ? 'any' : 'includes';
  return {
    type,
    values: type === 'includes' ? (jobCategory.values || []) : []
  };
}

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

    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.ruleName = { $regex: search, $options: 'i' };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const rules = await JobAssignmentRule.find(filter)
      .populate('jobCategory.values', 'name')
      .populate('assignedHrs', 'name email user_id')
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await JobAssignmentRule.countDocuments(filter);

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
    console.error('Error fetching job assignment rules:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch job assignment rules',
      error: error.message
    });
  }
});

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

    const rule = await JobAssignmentRule.findById(req.params.id)
      .populate('jobCategory.values', 'name')
      .populate('assignedHrs', 'name email user_id')
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email');

    if (!rule) {
      return res.status(404).json({
        status: false,
        message: 'Job assignment rule not found'
      });
    }

    res.json({
      status: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching job assignment rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch job assignment rule',
      error: error.message
    });
  }
});

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
      jobCategory,
      assignedHrs,
      status = 'Active'
    } = req.body;

    const normalizedCategory = normalizeJobCategory(jobCategory);
    if (normalizedCategory.type === 'includes' && normalizedCategory.values.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Select at least one job category'
      });
    }

    const existingRule = await JobAssignmentRule.findOne({
      ruleName: { $regex: new RegExp(`^${ruleName}$`, 'i') }
    });

    if (existingRule) {
      return res.status(400).json({
        status: false,
        message: 'Rule with this name already exists'
      });
    }

    const newRule = new JobAssignmentRule({
      ruleName,
      jobCategory: normalizedCategory,
      assignedHrs,
      status,
      createdBy: getActorId(req)
    });

    await newRule.save();

    const populatedRule = await JobAssignmentRule.findById(newRule._id)
      .populate('jobCategory.values', 'name')
      .populate('assignedHrs', 'name email user_id')
      .populate('createdBy', 'name email');

    res.status(201).json({
      status: true,
      message: 'Job assignment rule created successfully',
      data: populatedRule
    });
  } catch (error) {
    console.error('Error creating job assignment rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to create job assignment rule',
      error: error.message
    });
  }
});

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
      jobCategory,
      assignedHrs,
      status
    } = req.body;

    const existingRule = await JobAssignmentRule.findById(req.params.id);
    if (!existingRule) {
      return res.status(404).json({
        status: false,
        message: 'Job assignment rule not found'
      });
    }

    const normalizedCategory = normalizeJobCategory(jobCategory);
    if (normalizedCategory.type === 'includes' && normalizedCategory.values.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Select at least one job category'
      });
    }

    const duplicateRule = await JobAssignmentRule.findOne({
      _id: { $ne: req.params.id },
      ruleName: { $regex: new RegExp(`^${ruleName}$`, 'i') }
    });

    if (duplicateRule) {
      return res.status(400).json({
        status: false,
        message: 'Rule with this name already exists'
      });
    }

    const updatedRule = await JobAssignmentRule.findByIdAndUpdate(
      req.params.id,
      {
        ruleName,
        jobCategory: normalizedCategory,
        assignedHrs,
        status,
        modifiedBy: getActorId(req)
      },
      { new: true, runValidators: true }
    )
      .populate('jobCategory.values', 'name')
      .populate('assignedHrs', 'name email user_id')
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email');

    res.json({
      status: true,
      message: 'Job assignment rule updated successfully',
      data: updatedRule
    });
  } catch (error) {
    console.error('Error updating job assignment rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to update job assignment rule',
      error: error.message
    });
  }
});

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

    const updatedRule = await JobAssignmentRule.findByIdAndUpdate(
      req.params.id,
      {
        status,
        modifiedBy: getActorId(req)
      },
      { new: true, runValidators: true }
    )
      .populate('jobCategory.values', 'name')
      .populate('assignedHrs', 'name email user_id');

    if (!updatedRule) {
      return res.status(404).json({
        status: false,
        message: 'Job assignment rule not found'
      });
    }

    res.json({
      status: true,
      message: `Rule ${status.toLowerCase()} successfully`,
      data: updatedRule
    });
  } catch (error) {
    console.error('Error updating job assignment rule status:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to update rule status',
      error: error.message
    });
  }
});

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

    const deletedRule = await JobAssignmentRule.findByIdAndDelete(req.params.id);

    if (!deletedRule) {
      return res.status(404).json({
        status: false,
        message: 'Job assignment rule not found'
      });
    }

    res.json({
      status: true,
      message: 'Job assignment rule deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting job assignment rule:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to delete job assignment rule',
      error: error.message
    });
  }
});

module.exports = router;
