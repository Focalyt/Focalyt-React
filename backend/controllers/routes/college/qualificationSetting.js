const express = require('express');
const { Qualification, QualificationCourse, SubQualification } = require('../../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    if (req.query.page) {
      const perPage = 5;
      const page = parseInt(req.query.page, 10) || 1;
      const count = await Qualification.countDocuments({});
      const qualifications = await Qualification.find({})
        .select('name status basic')
        .sort({ createdAt: -1 })
        .skip(perPage * (page - 1))
        .limit(perPage)
        .lean();

      return res.json({
        status: true,
        data: qualifications,
        totalPages: Math.ceil(count / perPage) || 1,
        page,
      });
    }

    const qualifications = await Qualification.find({ status: true })
      .select('name status basic')
      .sort({ name: 1 })
      .lean();

    return res.json({ status: true, data: qualifications });
  } catch (err) {
    console.error('Error fetching qualifications:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to fetch qualifications',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ status: false, message: 'Please enter qualification' });
    }

    const existing = await Qualification.findOne({ name });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Qualification already exists.' });
    }

    const qualification = await Qualification.create({ name, status: true });
    return res.json({
      status: true,
      message: 'Qualification added successfully!',
      data: qualification,
    });
  } catch (err) {
    console.error('Error adding qualification:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'Qualification already exists.' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to add qualification',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ status: false, message: 'Please enter qualification' });
    }

    const existing = await Qualification.findOne({
      _id: { $ne: req.params.id },
      name,
    });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Qualification already exists.' });
    }

    const qualification = await Qualification.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    if (!qualification) {
      return res.status(404).json({ status: false, message: 'Qualification not found' });
    }

    return res.json({
      status: true,
      message: 'Qualification updated successfully!',
      data: qualification,
    });
  } catch (err) {
    console.error('Error updating qualification:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'Qualification already exists.' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to update qualification',
    });
  }
});

router.get('/course', async (req, res) => {
  try {
    const perPage = 5;
    const page = parseInt(req.query.page, 10) || 1;
    const count = await QualificationCourse.countDocuments({});
    const courses = await QualificationCourse.find()
      .populate('_qualification', 'name')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    return res.json({
      status: true,
      data: courses,
      totalPages: Math.ceil(count / perPage) || 1,
      page,
    });
  } catch (err) {
    console.error('Error fetching qualification courses:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to fetch courses',
    });
  }
});

router.post('/course', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const qualificationId = req.body._qualification;

    if (!qualificationId) {
      return res.status(400).json({ status: false, message: 'Please select education' });
    }
    if (!name) {
      return res.status(400).json({ status: false, message: 'Please enter course name' });
    }

    const existing = await QualificationCourse.findOne({ name });
    if (existing) {
      return res.status(400).json({ status: false, message: 'This Course already exists.' });
    }

    const course = await QualificationCourse.create({
      _qualification: qualificationId,
      name,
    });

    return res.json({ status: true, message: 'Course added successfully!', data: course });
  } catch (err) {
    console.error('Error adding qualification course:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'This Course already exists.' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to add course',
    });
  }
});

router.put('/course/:id', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const qualificationId = req.body._qualification;

    if (!qualificationId || !name) {
      return res.status(400).json({ status: false, message: 'Fields are missing!' });
    }

    const existing = await QualificationCourse.findOne({
      _id: { $ne: req.params.id },
      name,
    });
    if (existing) {
      return res.status(400).json({ status: false, message: 'This Course already exists.' });
    }

    const course = await QualificationCourse.findByIdAndUpdate(
      req.params.id,
      { name, _qualification: qualificationId },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ status: false, message: 'Course not found' });
    }

    return res.json({ status: true, message: 'Course updated successfully!', data: course });
  } catch (err) {
    console.error('Error updating qualification course:', err);
    if (err.code === 11000) {
      return res.status(400).json({ status: false, message: 'This Course already exists.' });
    }
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to update course',
    });
  }
});

router.post('/course/qualificationCourses', async (req, res) => {
  try {
    const courses = await QualificationCourse.find({
      _qualification: req.body._qualification,
    })
      .select('name')
      .sort({ name: 1 })
      .lean();

    return res.json(courses);
  } catch (err) {
    console.error('Error fetching courses for qualification:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to fetch courses',
    });
  }
});

router.get('/course/stream', async (req, res) => {
  try {
    const perPage = 5;
    const page = parseInt(req.query.page, 10) || 1;
    const count = await SubQualification.countDocuments({});
    const streams = await SubQualification.find()
      .populate('_qualification', 'name')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    const courseIds = streams.map((stream) => stream._course).filter(Boolean);
    const courseDocs = await QualificationCourse.find({ _id: { $in: courseIds } })
      .select('name')
      .lean();
    const courseById = new Map(courseDocs.map((course) => [String(course._id), course]));

    const data = streams.map((stream) => ({
      ...stream,
      _course: stream._course
        ? (courseById.get(String(stream._course)) || { _id: stream._course })
        : null,
    }));

    return res.json({
      status: true,
      data,
      totalPages: Math.ceil(count / perPage) || 1,
      page,
    });
  } catch (err) {
    console.error('Error fetching streams:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to fetch streams',
    });
  }
});

router.post('/course/stream', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const qualificationId = req.body._qualification;
    const courseId = req.body._course || undefined;

    if (!qualificationId || !name) {
      return res.status(400).json({ status: false, message: 'Please fill all required fields' });
    }

    const existing = await SubQualification.findOne({
      name,
      _qualification: qualificationId,
      _course: courseId,
    });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Stream already exists.' });
    }

    const stream = await SubQualification.create({
      name,
      _qualification: qualificationId,
      _course: courseId,
    });

    return res.json({ status: true, message: 'Stream added successfully!', data: stream });
  } catch (err) {
    console.error('Error adding stream:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to add stream',
    });
  }
});

router.put('/course/stream/:id', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const qualificationId = req.body._qualification;
    const courseId = req.body._course || undefined;

    if (!qualificationId || !name) {
      return res.status(400).json({ status: false, message: 'Please fill all required fields' });
    }

    const existing = await SubQualification.findOne({
      _id: { $ne: req.params.id },
      name,
      _qualification: qualificationId,
      _course: courseId,
    });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Stream already exists.' });
    }

    const stream = await SubQualification.findByIdAndUpdate(
      req.params.id,
      { name, _qualification: qualificationId, _course: courseId },
      { new: true }
    );

    if (!stream) {
      return res.status(404).json({ status: false, message: 'Stream not found' });
    }

    return res.json({ status: true, message: 'Stream updated successfully!', data: stream });
  } catch (err) {
    console.error('Error updating stream:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to update stream',
    });
  }
});

async function changeStatus(req, res) {
  try {
    const modelName = String(req.body.model || '').toLowerCase();
    const recordModel = modelName === 'qualification'
      ? Qualification
      : modelName === 'subqualification'
        ? SubQualification
        : QualificationCourse;
    const data = await recordModel.findByIdAndUpdate(
      req.body.id,
      { $set: { status: req.body.status } },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ status: false, message: 'Record not found' });
    }

    return res.json({ status: true, message: 'Status updated successfully!', data });
  } catch (err) {
    console.error('Error changing qualification status:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Failed to update status',
    });
  }
}

router.post('/changestatus', changeStatus);

module.exports = router;
