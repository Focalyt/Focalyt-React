const express = require('express');
const { Industry, SubIndustry } = require('../../models');

const router = express.Router();

const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9&\s]*$/;

function cleanName(value, { pattern } = {}) {
  const name = String(value || '').trim();
  if (!name) return { error: 'Please enter a name' };
  if (name.length > 50) return { error: 'Name must be 50 characters or fewer' };
  if (pattern && !pattern.test(name)) {
    return { error: 'Name must start with a letter and can include letters, numbers, spaces, and &' };
  }
  return { name };
}

router.get('/', async (req, res) => {
  try {
    if (req.query.page) {
      const perPage = 5;
      const page = parseInt(req.query.page, 10) || 1;
      const count = await Industry.countDocuments({});
      const industry = await Industry.find({})
        .select('name image status')
        .sort({ createdAt: -1 })
        .skip(perPage * (page - 1))
        .limit(perPage)
        .lean();

      return res.json({
        status: true,
        data: industry,
        totalPages: Math.ceil(count / perPage) || 1,
        page,
      });
    }

    const industry = await Industry.find({ status: true })
      .select('name status')
      .sort({ name: 1 })
      .lean();

    return res.json({ status: true, data: industry });
  } catch (err) {
    console.error('Error fetching industries:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to fetch industries',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = cleanName(req.body.name, { pattern: NAME_PATTERN });
    if (parsed.error) {
      return res.status(400).json({ status: false, message: parsed.error });
    }

    const existing = await Industry.findOne({ name: parsed.name });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Industry already exist!' });
    }

    const industry = await Industry.create({
      name: parsed.name,
      image: String(req.body.image || '').trim(),
      status: true,
    });

    return res.json({
      status: true,
      message: 'Industry added successfully!',
      data: industry,
    });
  } catch (err) {
    console.error('Error adding industry:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'Industry already exist!' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to add industry',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const parsed = cleanName(req.body.name, { pattern: NAME_PATTERN });
    if (parsed.error) {
      return res.status(400).json({ status: false, message: parsed.error });
    }

    const existing = await Industry.findOne({
      _id: { $ne: req.params.id },
      name: parsed.name,
    });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Industry already exist!' });
    }

    const industry = await Industry.findByIdAndUpdate(
      req.params.id,
      { name: parsed.name, image: String(req.body.image || '').trim() },
      { new: true }
    );

    if (!industry) {
      return res.status(404).json({ status: false, message: 'Industry not found' });
    }

    return res.json({
      status: true,
      message: 'Industry updated successfully!',
      data: industry,
    });
  } catch (err) {
    console.error('Error updating industry:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'Industry already exist!' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to update industry',
    });
  }
});

router.get('/sub', async (req, res) => {
  try {
    const perPage = 5;
    const page = parseInt(req.query.page, 10) || 1;
    const count = await SubIndustry.countDocuments({});
    const subIndustry = await SubIndustry.find({})
      .populate({ path: '_industry', select: 'name' })
      .select('name status _industry')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    return res.json({
      status: true,
      data: subIndustry,
      totalPages: Math.ceil(count / perPage) || 1,
      page,
    });
  } catch (err) {
    console.error('Error fetching sub industries:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to fetch sub industries',
    });
  }
});

router.post('/sub', async (req, res) => {
  try {
    const parsed = cleanName(req.body.name);
    const industryId = String(req.body._industry || '').trim();
    if (parsed.error) {
      return res.status(400).json({ status: false, message: parsed.error });
    }
    if (!industryId) {
      return res.status(400).json({ status: false, message: 'Please select industry' });
    }

    const existing = await SubIndustry.findOne({ name: parsed.name });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Sub industry already exist!' });
    }

    const subIndustry = await SubIndustry.create({
      name: parsed.name,
      _industry: industryId,
      status: true,
    });

    return res.json({
      status: true,
      message: 'SubIndustry added successfully!',
      data: subIndustry,
    });
  } catch (err) {
    console.error('Error adding sub industry:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'Sub industry already exist!' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to add sub industry',
    });
  }
});

router.put('/sub/:id', async (req, res) => {
  try {
    const parsed = cleanName(req.body.name);
    const industryId = String(req.body._industry || '').trim();
    if (parsed.error || !industryId) {
      return res.status(400).json({ status: false, message: parsed.error || 'Please select industry' });
    }

    const existing = await SubIndustry.findOne({
      _id: { $ne: req.params.id },
      name: parsed.name,
    });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Sub industry already exist!' });
    }

    const subIndustry = await SubIndustry.findByIdAndUpdate(
      req.params.id,
      { name: parsed.name, _industry: industryId },
      { new: true }
    );

    if (!subIndustry) {
      return res.status(404).json({ status: false, message: 'Sub industry not found' });
    }

    return res.json({
      status: true,
      message: 'Sub industry updated successfully!',
      data: subIndustry,
    });
  } catch (err) {
    console.error('Error updating sub industry:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'Sub industry already exist!' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to update sub industry',
    });
  }
});

router.post('/changestatus', async (req, res) => {
  try {
    const modelName = String(req.body.model || '');
    const recordModel = modelName === 'industry'
      ? Industry
      : modelName === 'subIndustry'
        ? SubIndustry
        : null;

    if (!recordModel) {
      return res.status(400).json({ status: false, message: 'Invalid model' });
    }

    const data = await recordModel.findByIdAndUpdate(
      req.body.id,
      { $set: { status: req.body.status === true || req.body.status === 'true' } },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ status: false, message: 'Record not found' });
    }

    return res.json({ status: true, message: 'Status updated successfully!', data });
  } catch (err) {
    console.error('Error changing industry status:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to update status',
    });
  }
});

module.exports = router;
