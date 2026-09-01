const express = require('express');
const router = express.Router();
const JobAssignmentRule = require('../../models/jobAssignmentRule');
const Vacancy = require('../../models/vacancy');
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

  body('jobName.type')
    .optional()
    .isIn(['includes', 'any'])
    .withMessage('Job name type must be either includes or any'),

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

function normalizeCriteria(criteria = {}, defaultType = 'includes') {
  const type = criteria.type === 'any' ? 'any' : (criteria.type === 'includes' ? 'includes' : defaultType);
  return {
    type,
    values: type === 'includes' ? (criteria.values || []) : []
  };
}

function populateRule(query) {
  return query
    .populate('jobCategory.values', 'name')
    .populate('jobName.values', 'title')
    .populate('assignedHrs', 'name email user_id')
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email');
}

// Job exists first, then the rule is created for that job.
// assignHr() only ran on vacancy create, so apply HR now to matching jobs that still have no hr.
async function applyRuleToMatchingVacancies(rule) {
  if (!rule || rule.status !== 'Active') return;

  const filter = {
    $or: [{ hr: { $exists: false } }, { hr: null }],
  };
  const and = [];
  const jobNameType = rule.jobName?.type || 'any';
  const categoryType = rule.jobCategory?.type || 'includes';
  const jobNameIds = (rule.jobName?.values || []).map((id) => id._id || id).filter(Boolean);
  const categoryIds = (rule.jobCategory?.values || []).map((id) => id._id || id).filter(Boolean);

  if (jobNameType === 'includes') {
    if (jobNameIds.length === 0) return;
    const selectedJobs = await Vacancy.find({ _id: { $in: jobNameIds } }).select('title').lean();
    const titles = [...new Set(selectedJobs.map((job) => job.title).filter(Boolean))];
    and.push({
      $or: [
        { _id: { $in: jobNameIds } },
        ...(titles.length ? [{ title: { $in: titles }, status: true }] : []),
      ],
    });
  } else if (categoryType === 'includes') {
    if (categoryIds.length === 0) return;
    and.push({ _jobCategory: { $in: categoryIds }, status: true });
  } else {
    return;
  }

  if (and.length) filter.$and = and;

  const vacancies = await Vacancy.find(filter);
  for (const vacancy of vacancies) {
    if (vacancy.hr) continue;
    await vacancy.assignHr();
    if (vacancy.hr) {
      await vacancy.save();
    }
  }
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

    const rules = await populateRule(JobAssignmentRule.find(filter))
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

router.get('/job-names', isCollege, async (req, res) => {
  try {
    const filter = { status: true };
    const categoryIds = String(req.query.categoryIds || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (categoryIds.length > 0) {
      filter._jobCategory = { $in: categoryIds };
    }

    const jobs = await Vacancy.find(filter)
      .select('_id title _jobCategory')
      .sort({ title: 1 })
      .lean();

    const jobOptions = (jobs || [])
      .filter((job) => job.title && String(job.title).trim())
      .map((job) => ({
        _id: job._id,
        id: job._id,
        name: job.title,
        title: job.title,
        _jobCategory: job._jobCategory
      }));

    res.json({
      status: true,
      data: jobOptions
    });
  } catch (error) {
    console.error('Error fetching job names:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch job names',
      error: error.message
    });
  }
});

router.get('/:id([0-9a-fA-F]{24})', [
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

    const rule = await populateRule(JobAssignmentRule.findById(req.params.id));

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
      jobName,
      assignedHrs,
      status = 'Active'
    } = req.body;

    const normalizedCategory = normalizeCriteria(jobCategory, 'includes');
    const normalizedJobName = normalizeCriteria(jobName, 'any');
    if (normalizedCategory.type === 'includes' && normalizedCategory.values.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Select at least one job category'
      });
    }
    if (normalizedJobName.type === 'includes' && normalizedJobName.values.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Select at least one job name'
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
      jobName: normalizedJobName,
      assignedHrs,
      status,
      createdBy: getActorId(req)
    });

    await newRule.save();
    await applyRuleToMatchingVacancies(newRule);

    const populatedRule = await populateRule(JobAssignmentRule.findById(newRule._id));

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
      jobName,
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

    const normalizedCategory = normalizeCriteria(jobCategory, 'includes');
    const normalizedJobName = normalizeCriteria(jobName, 'any');
    if (normalizedCategory.type === 'includes' && normalizedCategory.values.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Select at least one job category'
      });
    }
    if (normalizedJobName.type === 'includes' && normalizedJobName.values.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Select at least one job name'
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

    const updatedRule = await populateRule(JobAssignmentRule.findByIdAndUpdate(
      req.params.id,
      {
        ruleName,
        jobCategory: normalizedCategory,
        jobName: normalizedJobName,
        assignedHrs,
        status,
        modifiedBy: getActorId(req)
      },
      { new: true, runValidators: true }
    ));

    await applyRuleToMatchingVacancies(updatedRule);

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

    const updatedRule = await populateRule(JobAssignmentRule.findByIdAndUpdate(
      req.params.id,
      {
        status,
        modifiedBy: getActorId(req)
      },
      { new: true, runValidators: true }
    ));

    if (!updatedRule) {
      return res.status(404).json({
        status: false,
        message: 'Job assignment rule not found'
      });
    }

    await applyRuleToMatchingVacancies(updatedRule);

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
