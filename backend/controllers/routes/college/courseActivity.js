const express = require('express');
const mongoose = require('mongoose');
const { isCollege } = require('../../../helpers');
const { CourseActivity, CoursesCopy, College, SessionPlan } = require('../../models');

const router = express.Router();
const { ObjectId } = mongoose.Types;

const toObjectId = (value) => {
  if (!value) return null;
  const str = String(value);
  if (!ObjectId.isValid(str)) return null;
  return new ObjectId(str);
};

const resolveCollege = async (req) => {
  if (req.college?._id) return req.college;
  const college = await College.findOne({ '_concernPerson._id': req.user._id });
  if (!college) throw new Error('College not found');
  return college;
};

const mapActivity = (doc, sessionCount = 0) => {
  const item = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(item._id),
    _id: String(item._id),
    course: item.course ? String(item.course) : '',
    name: item.name || '',
    color: item.color || '#2563eb',
    sessionCount,
  };
};

const assertCourse = async (collegeId, courseId) => {
  const course = await CoursesCopy.findOne({
    _id: courseId,
    isDeleted: { $ne: true },
    $or: [{ college: collegeId }, { college: null }, { college: { $exists: false } }],
  }).select('_id name').lean();
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }
  return course;
};

const sessionCountsForCourse = async (collegeId, courseId) => {
  const rows = await SessionPlan.aggregate([
    {
      $match: {
        college: collegeId,
        course: courseId,
        isDeleted: false,
        activityIds: { $exists: true, $ne: [] },
      },
    },
    { $unwind: '$activityIds' },
    { $group: { _id: '$activityIds', count: { $sum: 1 } } },
  ]);
  const map = {};
  rows.forEach((row) => {
    map[String(row._id)] = row.count;
  });
  return map;
};

router.use(isCollege);

// GET /college/course-activities?courseId=
router.get('/', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const courseId = toObjectId(req.query.courseId);
    if (!courseId) {
      return res.status(400).json({ status: false, message: 'courseId is required' });
    }
    await assertCourse(college._id, courseId);

    const activities = await CourseActivity.find({
      college: college._id,
      course: courseId,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    const counts = await sessionCountsForCourse(college._id, courseId);
    return res.json({
      status: true,
      data: activities.map((item) => mapActivity(item, counts[String(item._id)] || 0)),
    });
  } catch (err) {
    console.error('GET /college/course-activities', err);
    return res.status(err.statusCode || 400).json({ status: false, message: err.message || 'Failed to load activities' });
  }
});

// POST /college/course-activities
router.post('/', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const courseId = toObjectId(req.body.courseId);
    const name = String(req.body.name || '').trim();
    if (!courseId) {
      return res.status(400).json({ status: false, message: 'courseId is required' });
    }
    if (!name) {
      return res.status(400).json({ status: false, message: 'Activity name is required' });
    }
    await assertCourse(college._id, courseId);

    const created = await CourseActivity.create({
      college: college._id,
      course: courseId,
      name,
      color: req.body.color || '#2563eb',
      createdBy: req.user._id,
    });

    return res.status(201).json({
      status: true,
      message: 'Activity created',
      data: mapActivity(created, 0),
    });
  } catch (err) {
    console.error('POST /college/course-activities', err);
    return res.status(err.statusCode || 400).json({ status: false, message: err.message || 'Failed to create activity' });
  }
});

// PUT /college/course-activities  — bulk replace for a course (unused activities stay until removed)
router.put('/', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const courseId = toObjectId(req.body.courseId);
    if (!courseId) {
      return res.status(400).json({ status: false, message: 'courseId is required' });
    }
    await assertCourse(college._id, courseId);

    const incoming = Array.isArray(req.body.types) ? req.body.types : [];
    const existing = await CourseActivity.find({
      college: college._id,
      course: courseId,
      isDeleted: false,
    });
    const existingById = new Map(existing.map((item) => [String(item._id), item]));
    const keepIds = [];
    const saved = [];

    for (const item of incoming) {
      const name = String(item?.name || '').trim();
      if (!name) continue;
      const color = item.color || '#2563eb';
      const existingDoc = item?.id ? existingById.get(String(item.id)) : null;

      if (existingDoc) {
        existingDoc.name = name;
        existingDoc.color = color;
        await existingDoc.save();
        keepIds.push(String(existingDoc._id));
        saved.push(existingDoc);
      } else {
        const created = await CourseActivity.create({
          college: college._id,
          course: courseId,
          name,
          color,
          createdBy: req.user._id,
        });
        keepIds.push(String(created._id));
        saved.push(created);
      }
    }

    const toRemove = existing.filter((item) => !keepIds.includes(String(item._id)));
    if (toRemove.length) {
      const removeIds = toRemove.map((item) => item._id);
      await CourseActivity.updateMany(
        { _id: { $in: removeIds } },
        { $set: { isDeleted: true, status: false } }
      );
      await SessionPlan.updateMany(
        { college: college._id, course: courseId, activityIds: { $in: removeIds } },
        { $pull: { activityIds: { $in: removeIds } } }
      );
    }

    const counts = await sessionCountsForCourse(college._id, courseId);
    return res.json({
      status: true,
      message: 'Course activities saved',
      data: saved.map((item) => mapActivity(item, counts[String(item._id)] || 0)),
    });
  } catch (err) {
    console.error('PUT /college/course-activities', err);
    return res.status(err.statusCode || 400).json({ status: false, message: err.message || 'Failed to save activities' });
  }
});

// PUT /college/course-activities/:id
router.put('/:id', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const activity = await CourseActivity.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!activity) {
      return res.status(404).json({ status: false, message: 'Activity not found' });
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name || '').trim();
      if (!name) {
        return res.status(400).json({ status: false, message: 'Activity name is required' });
      }
      activity.name = name;
    }
    if (req.body.color !== undefined) activity.color = req.body.color || activity.color;
    await activity.save();

    const counts = await sessionCountsForCourse(college._id, activity.course);
    return res.json({
      status: true,
      message: 'Activity updated',
      data: mapActivity(activity, counts[String(activity._id)] || 0),
    });
  } catch (err) {
    console.error('PUT /college/course-activities/:id', err);
    return res.status(err.statusCode || 400).json({ status: false, message: err.message || 'Failed to update activity' });
  }
});

// DELETE /college/course-activities/:id
router.delete('/:id', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const activity = await CourseActivity.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!activity) {
      return res.status(404).json({ status: false, message: 'Activity not found' });
    }

    activity.isDeleted = true;
    activity.status = false;
    await activity.save();

    await SessionPlan.updateMany(
      { college: college._id, course: activity.course, activityIds: activity._id },
      { $pull: { activityIds: activity._id } }
    );

    return res.json({ status: true, message: 'Activity deleted' });
  } catch (err) {
    console.error('DELETE /college/course-activities/:id', err);
    return res.status(err.statusCode || 400).json({ status: false, message: err.message || 'Failed to delete activity' });
  }
});

module.exports = router;
