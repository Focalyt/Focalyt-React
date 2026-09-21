const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const uuid = require('uuid/v1');
const { isCollege } = require('../../../helpers');
const { SessionPlan, SessionActivityType, College, Courses, CoursesCopy, CourseActivity, Batch } = require('../../models');
const { normalizeCourseStructure } = require('../../../helpers/courseStructure');
const { bucketName } = require('../../../config');
const s3 = require('../../../helpers/objectStorage');

const router = express.Router();
const { ObjectId } = mongoose.Types;

const toObjectId = (value) => {
  if (!value) return null;
  const str = String(value);
  if (str.startsWith('course:')) return null;
  if (!ObjectId.isValid(str)) return null;
  return new ObjectId(str);
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeActivities = (items = []) =>
  (Array.isArray(items) ? items : [])
    .filter((item) => item && (item.id || item.key) && item.name)
    .map((item) => ({
      id: String(item.id || item.key),
      key: String(item.key || item.id || ''),
      name: String(item.name || '').trim(),
      color: item.color || '#2563eb',
    }));

const normalizeMaterials = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    id: item.id || '',
    name: item.name || '',
    description: item.description || '',
    type: item.type || '',
    requirement: item.requirement || '',
    requirementLabel: item.requirementLabel || '',
    status: item.status || '',
    fileUrl: item.fileUrl || '',
    fileName: item.fileName || '',
    uploadedBy: toObjectId(item.uploadedBy),
    uploadedAt: toDate(item.uploadedAt),
  }));

const mergeMaterialUploads = (incoming = [], existing = []) => {
  const existingList = Array.isArray(existing) ? existing : [];
  return (Array.isArray(incoming) ? incoming : []).map((item, index) => {
    const match = existingList.find((old) => {
      const incomingId = String(item.id || item._id || '');
      if (incomingId && (String(old.id || '') === incomingId || String(old._id || '') === incomingId)) return true;
      return false;
    }) || existingList[index];
    if (!match) return item;
    return {
      ...item,
      fileUrl: item.fileUrl || match.fileUrl || '',
      fileName: item.fileName || match.fileName || '',
      status: item.status || match.status || '',
      uploadedBy: item.uploadedBy || match.uploadedBy || null,
      uploadedAt: item.uploadedAt || match.uploadedAt || null,
    };
  });
};

const findMaterialItem = (items, itemId) => {
  const id = String(itemId || '');
  if (!id || !items) return null;
  try {
    const bySubId = typeof items.id === 'function' ? items.id(id) : null;
    if (bySubId) return bySubId;
  } catch (_) { /* non-ObjectId keys fall through */ }
  return [...items].find((item) => String(item._id) === id || String(item.id) === id) || null;
};

const inferTlmTypeFromFile = (fileName = '', mimeType = '') => {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  const mime = String(mimeType || '').toLowerCase();
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'Image';
  if (mime.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'].includes(ext)) return 'Video';
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  return 'Document';
};

const getUploadedTlmFile = (req) => {
  const uploaded = req.file || req.files?.file;
  if (!uploaded) return null;
  const buffer = uploaded.buffer || uploaded.data;
  if (!buffer || !buffer.length) return null;
  return {
    buffer,
    originalName: uploaded.originalname || uploaded.name || 'tlm-file',
    mimeType: uploaded.mimetype || 'application/octet-stream',
  };
};

const TOT_PASS_PERCENT_DEFAULT = 40;

const normalizeQuestions = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => {
    const marks = Number(item.marks);
    return {
      question: item.question || '',
      options: Array.isArray(item.options) ? item.options : [],
      correctIndex: Number(item.correctIndex) || 0,
      marks: Number.isFinite(marks) && marks > 0 ? marks : 1,
    };
  });

const normalizePassPercentage = (value, fallback = TOT_PASS_PERCENT_DEFAULT) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, Math.round(n)));
};

const getQuestionMarks = (question) => {
  const marks = Number(question?.marks);
  return Number.isFinite(marks) && marks > 0 ? marks : 1;
};

const getQuestionId = (question, index) => String(question?._id || question?.id || `tot-q-${index}`);

const scoreTotAssignment = (questions = [], selectedAnswers = [], passPercentage = TOT_PASS_PERCENT_DEFAULT) => {
  const answersById = new Map(
    (Array.isArray(selectedAnswers) ? selectedAnswers : []).map((item) => [
      String(item.questionId || item.id || ''),
      item,
    ])
  );

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let attemptedCount = 0;
  const totalMarks = questions.reduce((sum, question) => sum + getQuestionMarks(question), 0);

  const answers = questions.map((question, index) => {
    const questionId = getQuestionId(question, index);
    const marks = getQuestionMarks(question);
    const chosen = answersById.get(questionId);
    const selectedIndex = chosen?.selectedIndex;
    const hasAnswer = selectedIndex !== undefined && selectedIndex !== null && selectedIndex !== '';
    if (!hasAnswer) {
      return {
        questionId,
        selectedIndex: null,
        isCorrect: false,
        marksObtained: 0,
      };
    }

    attemptedCount += 1;
    const isCorrect = Number(selectedIndex) === Number(question.correctIndex);
    if (isCorrect) {
      score += marks;
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    return {
      questionId,
      selectedIndex: Number(selectedIndex),
      isCorrect,
      marksObtained: isCorrect ? marks : 0,
    };
  });

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
  const passPercent = normalizePassPercentage(passPercentage);

  return {
    answers,
    score,
    totalMarks,
    percentage,
    pass: percentage >= passPercent,
    correctCount,
    wrongCount,
    attemptedCount,
    unattemptedCount: Math.max(questions.length - attemptedCount, 0),
  };
};

const toPlainTotSubmission = (item) => {
  if (!item) return null;
  return typeof item.toObject === 'function' ? item.toObject() : { ...item };
};

const collectTotSubmissions = (session = {}) => {
  const list = [];
  const seen = new Set();
  const push = (item) => {
    const plain = toPlainTotSubmission(item);
    if (!plain) return;
    if (!plain.submittedAt && !(plain.answers || []).length) return;
    const key = plain.submittedAt
      ? new Date(plain.submittedAt).toISOString()
      : `${plain.percentage}:${(plain.answers || []).length}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push(plain);
  };
  (session.totAssignmentSubmissions || []).forEach(push);
  push(session.totAssignmentSubmission);
  return list.sort((a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0));
};

const answeredQuestionIds = (session = {}) => {
  const ids = new Set();
  collectTotSubmissions(session).forEach((submission) => {
    (submission.answers || []).forEach((answer) => {
      if (answer?.questionId) ids.add(String(answer.questionId));
    });
  });
  return ids;
};

const pendingTotQuestions = (session = {}) => {
  const answered = answeredQuestionIds(session);
  return (session.totQuestionBank || []).filter((question, index) => (
    !answered.has(getQuestionId(question, index))
  ));
};

const normalizeSubSessions = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      name: String(item.name || item.topic || '').trim(),
      duration: String(item.duration || ''),
    }))
    .filter((item) => item.name);

const mapSessionToClient = (doc) => {
  const session = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const sessionDate = session.sessionDate
    ? new Date(session.sessionDate).toISOString().slice(0, 10)
    : '';

  return {
    id: String(session._id),
    _id: String(session._id),
    college: session.college ? String(session.college) : '',
    department: session.vertical ? String(session.vertical) : '',
    vertical: session.vertical ? String(session.vertical) : '',
    project: session.project ? String(session.project) : '',
    center: session.center ? String(session.center) : '',
    course: session.course ? String(session.course) : '',
    batch: session.batch ? String(session.batch) : '',
    departmentName: session.verticalName || '',
    verticalName: session.verticalName || '',
    projectName: session.projectName || '',
    centerName: session.centerName || '',
    courseName: session.courseName || '',
    courseTrade: session.courseName || '',
    batchCode: session.batchCode || '',
    studentCount: session.studentCount || 0,
    presentCandidates: session.presentCandidates || 0,
    absentCandidates: session.absentCandidates || 0,
    attendancePercent: session.attendancePercent || 0,
    title: session.title || '',
    sessionType: session.sessionType || 'student',
    sessionNumber: session.sessionNumber || '',
    hours: session.hours || '',
    subSessions: session.subSessions || '',
    subSessionName: session.subSessionName || '',
    duration: session.duration || '',
    subSessionItems: session.subSessionItems || [],
    unitNumber: session.unitNumber || '',
    unitName: session.unitName || '',
    chapterNumber: session.chapterNumber || '',
    chapterName: session.chapterName || '',
    subTopics: session.subTopics || '',
    topicCovered: session.topicCovered || '',
    trainingMethod: session.trainingMethod || '',
    classroomLabResources: session.classroomLabResources || '',
    standardTlm: session.standardTlm || [],
    trainerBasedTlm: session.trainerBasedTlm || [],
    notes: session.notes || '',
    sessionDate,
    date: session.dateLabel || '',
    dateLabel: session.dateLabel || '',
    startTime: session.startTime || '',
    endTime: session.endTime || '',
    sessionActivities: normalizeActivities(session.sessionActivities),
    activityIds: (session.activityIds || []).map((id) => String(id)).filter(Boolean),
    evidenceDocs: session.evidenceDocs || [],
    learningMaterials: session.learningMaterials || [],
    preSessionRequirements: session.preSessionRequirements || [],
    includeTot: session.includeTot !== false,
    totUseSameTopics: session.totUseSameTopics !== false,
    totTopicCovered: session.totTopicCovered || '',
    totTrainingMethod: session.totTrainingMethod || '',
    totMaterials: session.totMaterials || [],
    totTrainingProofs: session.totTrainingProofs || [],
    totCompletionProofs: session.totCompletionProofs || [],
    requireTotCompletionProofs: session.requireTotCompletionProofs === true,
    totStatus: session.totStatus || '',
    totQuestionBank: session.totQuestionBank || [],
    totQuestionBankLastUpdated: session.totQuestionBankLastUpdated || null,
    totPassPercentage: normalizePassPercentage(session.totPassPercentage),
    totAssignmentSubmission: session.totAssignmentSubmission || null,
    totAssignmentSubmissions: collectTotSubmissions(session),
    workflowStatus: session.workflowStatus || 'Scheduled',
    seniorTrainerId: session.seniorTrainer ? String(session.seniorTrainer) : '',
    seniorTrainerName: session.seniorTrainerName || '',
    fieldTrainerId: session.fieldTrainer ? String(session.fieldTrainer) : '',
    fieldTrainerName: session.fieldTrainerName || '',
    totTrainerId: session.totTrainer ? String(session.totTrainer) : '',
    totTrainerName: session.totTrainerName || '',
    referredAt: session.referredAt || null,
    assignedAt: session.assignedAt || null,
    completedAt: session.completedAt || null,
    completionRemark: session.completionRemark || '',
    completedByName: session.completedByName || '',
    status: session.workflowStatus === 'Completed' ? 'Completed' : 'Pending',
    createdAt: session.createdAt || null,
    updatedAt: session.updatedAt || null,
    courseStructure: normalizeCourseStructure(session.courseStructure),
  };
};

const buildSessionPayload = (body = {}, collegeId, userId, existing = null) => {
  const courseId = toObjectId(body.course);

  const title = String(body.title || '').trim();
  if (!title && !existing?.title) {
    throw new Error('Session title is required');
  }

  const payload = {
    college: collegeId,
    vertical: toObjectId(body.department || body.vertical) ?? existing?.vertical ?? null,
    project: toObjectId(body.project) ?? existing?.project ?? null,
    center: toObjectId(body.center) ?? existing?.center ?? null,
    course: courseId || existing?.course || null,
    batch: toObjectId(body.batch) ?? existing?.batch ?? null,

    verticalName: body.departmentName || body.verticalName || existing?.verticalName || '',
    projectName: body.projectName || existing?.projectName || '',
    centerName: body.centerName || existing?.centerName || '',
    courseName: body.courseTrade || body.courseName || existing?.courseName || '',
    batchCode: body.batchCode || existing?.batchCode || '',
    studentCount: Number(body.studentCount) || existing?.studentCount || 0,

    title: title || existing.title,
    sessionType: body.sessionType || existing?.sessionType || 'student',
    sessionNumber: body.sessionNumber != null ? String(body.sessionNumber) : (existing?.sessionNumber || ''),
    hours: body.hours != null ? String(body.hours) : (existing?.hours || ''),
    subSessions: body.subSessions != null ? String(body.subSessions) : (existing?.subSessions || ''),
    subSessionName: body.subSessionName || existing?.subSessionName || '',
    duration: body.duration || existing?.duration || '',
    subSessionItems: body.subSessionItems
      ? normalizeSubSessions(body.subSessionItems)
      : (existing?.subSessionItems || []),

    unitNumber: body.unitNumber != null ? String(body.unitNumber) : (existing?.unitNumber || ''),
    unitName: body.unitName || existing?.unitName || '',
    chapterNumber: body.chapterNumber != null ? String(body.chapterNumber) : (existing?.chapterNumber || ''),
    chapterName: body.chapterName || existing?.chapterName || '',
    subTopics: body.subTopics || existing?.subTopics || '',
    topicCovered: body.topicCovered || existing?.topicCovered || '',
    trainingMethod: body.trainingMethod || existing?.trainingMethod || '',
    classroomLabResources: body.classroomLabResources || existing?.classroomLabResources || '',

    standardTlm: body.standardTlm
      ? mergeMaterialUploads(normalizeMaterials(body.standardTlm), existing?.standardTlm)
      : (existing?.standardTlm || []),
    trainerBasedTlm: body.trainerBasedTlm
      ? mergeMaterialUploads(normalizeMaterials(body.trainerBasedTlm), existing?.trainerBasedTlm)
      : (existing?.trainerBasedTlm || []),
    notes: body.notes || existing?.notes || '',

    sessionDate: body.sessionDate !== undefined ? toDate(body.sessionDate) : (existing?.sessionDate || null),
    dateLabel: body.date || body.dateLabel || existing?.dateLabel || '',
    startTime: body.startTime || existing?.startTime || '',
    endTime: body.endTime || existing?.endTime || '',

    sessionActivities: body.sessionActivities
      ? normalizeActivities(body.sessionActivities)
      : (existing?.sessionActivities || []),
    activityIds: body.activityIds !== undefined
      ? (Array.isArray(body.activityIds) ? body.activityIds : [])
      : (existing?.activityIds || []),

    evidenceDocs: body.evidenceDocs ? normalizeMaterials(body.evidenceDocs) : (existing?.evidenceDocs || []),
    learningMaterials: body.learningMaterials
      ? normalizeMaterials(body.learningMaterials)
      : (existing?.learningMaterials || []),
    preSessionRequirements: body.preSessionRequirements
      ? normalizeMaterials(body.preSessionRequirements)
      : (existing?.preSessionRequirements || []),

    includeTot: body.includeTot !== undefined ? body.includeTot !== false : (existing?.includeTot !== false),
    totUseSameTopics: body.totUseSameTopics !== undefined
      ? body.totUseSameTopics !== false
      : (existing?.totUseSameTopics !== false),
    totTopicCovered: body.totTopicCovered ?? existing?.totTopicCovered ?? '',
    totTrainingMethod: body.totTrainingMethod ?? existing?.totTrainingMethod ?? '',
    totMaterials: body.totMaterials ? normalizeMaterials(body.totMaterials) : (existing?.totMaterials || []),
    totTrainingProofs: body.totTrainingProofs
      ? normalizeMaterials(body.totTrainingProofs)
      : (existing?.totTrainingProofs || []),
    totCompletionProofs: body.totCompletionProofs
      ? normalizeMaterials(body.totCompletionProofs)
      : (existing?.totCompletionProofs || []),
    requireTotCompletionProofs: body.requireTotCompletionProofs !== undefined
      ? body.requireTotCompletionProofs === true
      : (existing?.requireTotCompletionProofs === true),
    totStatus: body.totStatus || existing?.totStatus || '',
    totQuestionBank: body.totQuestionBank
      ? normalizeQuestions(body.totQuestionBank)
      : (existing?.totQuestionBank || []),
    totQuestionBankLastUpdated: body.totQuestionBankLastUpdated
      ? toDate(body.totQuestionBankLastUpdated)
      : (existing?.totQuestionBankLastUpdated || null),
    totPassPercentage: body.totPassPercentage !== undefined
      ? normalizePassPercentage(body.totPassPercentage)
      : normalizePassPercentage(existing?.totPassPercentage),

    workflowStatus: body.workflowStatus || existing?.workflowStatus || 'Scheduled',

    seniorTrainer: body.seniorTrainerId !== undefined
      ? toObjectId(body.seniorTrainerId)
      : (existing?.seniorTrainer || null),
    seniorTrainerName: body.seniorTrainerName !== undefined
      ? (body.seniorTrainerName || '')
      : (existing?.seniorTrainerName || ''),
    fieldTrainer: body.fieldTrainerId !== undefined
      ? toObjectId(body.fieldTrainerId)
      : (existing?.fieldTrainer || null),
    fieldTrainerName: body.fieldTrainerName !== undefined
      ? (body.fieldTrainerName || '')
      : (existing?.fieldTrainerName || ''),
    totTrainer: body.totTrainerId !== undefined
      ? toObjectId(body.totTrainerId)
      : (existing?.totTrainer || null),
    totTrainerName: body.totTrainerName !== undefined
      ? (body.totTrainerName || '')
      : (existing?.totTrainerName || ''),

    referredAt: body.referredAt ? toDate(body.referredAt) : (existing?.referredAt || null),
    assignedAt: body.assignedAt ? toDate(body.assignedAt) : (existing?.assignedAt || null),
    completedAt: body.completedAt ? toDate(body.completedAt) : (existing?.completedAt || null),
  };

  if (!existing) {
    payload.createdBy = userId;
  }

  return payload;
};

const applyCourseStructureToSession = async (payload, existing = null) => {
  let structure = payload.courseStructure || existing?.courseStructure || null;

  if (payload.course) {
    const course = await Courses.findById(payload.course).select('courseStructure').lean()
      || await CoursesCopy.findById(payload.course).select('courseStructure').lean();
    if (course?.courseStructure) {
      structure = course.courseStructure;
    }
  }

  payload.courseStructure = normalizeCourseStructure(structure);

  if (!payload.courseStructure.unit) {
    payload.unitNumber = '';
    payload.unitName = '';
  }
  if (!payload.courseStructure.chapter) {
    payload.chapterNumber = '';
    payload.chapterName = '';
  }

  return payload;
};

const collectActivityIds = (payload = {}) => {
  const fromIds = Array.isArray(payload.activityIds) ? payload.activityIds : [];
  const fromSnapshots = Array.isArray(payload.sessionActivities) ? payload.sessionActivities : [];
  const merged = [
    ...fromIds,
    ...fromSnapshots.map((item) => item.id || item._id || item.key),
  ];
  const unique = [];
  const seen = new Set();
  merged.forEach((value) => {
    const id = toObjectId(value);
    if (!id) return;
    const key = String(id);
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(id);
  });
  return unique;
};

const applyCourseActivitiesToSession = async (payload, collegeId) => {
  const requestedIds = collectActivityIds(payload);
  if (!requestedIds.length) {
    payload.activityIds = [];
    payload.sessionActivities = payload.sessionActivities?.length
      ? normalizeActivities(payload.sessionActivities)
      : [];
    return payload;
  }

  if (!payload.course) {
    throw new Error('Select a course before attaching activities to a session');
  }

  const activities = await CourseActivity.find({
    _id: { $in: requestedIds },
    college: collegeId,
    course: payload.course,
    isDeleted: false,
  }).lean();

  const byId = new Map(activities.map((item) => [String(item._id), item]));
  const ordered = requestedIds
    .map((id) => byId.get(String(id)))
    .filter(Boolean);

  payload.activityIds = ordered.map((item) => item._id);
  payload.sessionActivities = ordered.map((item) => ({
    id: String(item._id),
    key: String(item._id),
    name: item.name,
    color: item.color || '#2563eb',
  }));
  return payload;
};

const resolveCollege = async (req) => {
  if (req.college?._id) return req.college;
  const college = await College.findOne({ '_concernPerson._id': req.user._id });
  if (!college) throw new Error('College not found');
  return college;
};

router.use(isCollege);

// ─── Activity Types ───────────────────────────────────────────────

// GET /college/session-plans/activity-types
router.get('/activity-types', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const doc = await SessionActivityType.findOne({ college: college._id });
    return res.json({ status: true, data: doc?.types || [] });
  } catch (err) {
    console.error('GET /college/session-plans/activity-types', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to load activity types' });
  }
});

// PUT /college/session-plans/activity-types
router.put('/activity-types', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const incoming = Array.isArray(req.body?.types) ? req.body.types : [];
    const types = incoming
      .filter((item) => item?.id && item?.name?.trim())
      .map((item) => ({
        id: String(item.id),
        name: String(item.name).trim(),
        color: item.color || '#2563eb',
      }));

    const doc = await SessionActivityType.findOneAndUpdate(
      { college: college._id },
      { types, updatedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ status: true, message: 'Activity types saved', data: doc.types });
  } catch (err) {
    console.error('PUT /college/session-plans/activity-types', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to save activity types' });
  }
});

// ─── Session Plans ────────────────────────────────────────────────

// GET /college/session-plans
router.get('/', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const filter = { college: college._id, isDeleted: false };

    if (req.query.batch) {
      const batchId = toObjectId(req.query.batch);
      if (batchId) {
        const courseId = toObjectId(req.query.course);
        if (req.query.includeCoursePlans === 'true' && courseId) {
          filter.$or = [
            { batch: batchId },
            { batch: null, course: courseId },
          ];
        } else {
          filter.batch = batchId;
        }
      } else if (String(req.query.batch).startsWith('course:')) {
        const courseId = toObjectId(String(req.query.batch).replace(/^course:/, ''));
        if (courseId) {
          filter.course = courseId;
          filter.batch = null;
        }
      }
    }
    if (req.query.course && !filter.$or && filter.course == null) {
      const courseId = toObjectId(req.query.course);
      if (courseId) filter.course = courseId;
    }
    if (req.query.workflowStatus) {
      filter.workflowStatus = req.query.workflowStatus;
    }
    if (req.query.excludeScheduled === 'true') {
      filter.workflowStatus = { $ne: 'Scheduled' };
    }
    if (req.query.fieldTrainerId) {
      const trainerId = toObjectId(req.query.fieldTrainerId);
      if (trainerId) filter.fieldTrainer = trainerId;
    }
    if (req.query.seniorTrainerId) {
      const trainerId = toObjectId(req.query.seniorTrainerId);
      if (trainerId) filter.seniorTrainer = trainerId;
    }

    const sessions = await SessionPlan.find(filter).sort({ sessionNumber: 1, createdAt: 1 });
    return res.json({ status: true, data: sessions.map(mapSessionToClient) });
  } catch (err) {
    console.error('GET /college/session-plans', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to load sessions' });
  }
});

// GET /college/session-plans/:id
router.get('/:id', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const session = await SessionPlan.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!session) {
      return res.status(404).json({ status: false, message: 'Session not found' });
    }
    return res.json({ status: true, data: mapSessionToClient(session) });
  } catch (err) {
    console.error('GET /college/session-plans/:id', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to load session' });
  }
});

// POST /college/session-plans
router.post('/', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const payload = buildSessionPayload(req.body, college._id, req.user._id);
    await applyCourseStructureToSession(payload);
    await applyCourseActivitiesToSession(payload, college._id);
    const created = await SessionPlan.create(payload);
    return res.status(201).json({
      status: true,
      message: 'Session created',
      data: mapSessionToClient(created),
    });
  } catch (err) {
    console.error('POST /college/session-plans', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to create session' });
  }
});

// PUT /college/session-plans/:id
router.put('/:id', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const existing = await SessionPlan.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!existing) {
      return res.status(404).json({ status: false, message: 'Session not found' });
    }

    const payload = buildSessionPayload(req.body, college._id, req.user._id, existing);
    await applyCourseStructureToSession(payload, existing);
    await applyCourseActivitiesToSession(payload, college._id);
    Object.assign(existing, payload);
    await existing.save();

    return res.json({
      status: true,
      message: 'Session updated',
      data: mapSessionToClient(existing),
    });
  } catch (err) {
    console.error('PUT /college/session-plans/:id', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to update session' });
  }
});

// PATCH /college/session-plans/:id
router.patch('/:id', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const existing = await SessionPlan.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!existing) {
      return res.status(404).json({ status: false, message: 'Session not found' });
    }

    const body = req.body || {};

    if (body.workflowStatus !== undefined) existing.workflowStatus = body.workflowStatus;
    if (body.seniorTrainerId !== undefined) {
      existing.seniorTrainer = toObjectId(body.seniorTrainerId);
      existing.seniorTrainerName = body.seniorTrainerName || '';
      if (body.seniorTrainerId) existing.referredAt = new Date();
    }
    if (body.fieldTrainerId !== undefined) {
      existing.fieldTrainer = toObjectId(body.fieldTrainerId);
      existing.fieldTrainerName = body.fieldTrainerName || '';
      existing.assignedAt = body.fieldTrainerId ? new Date() : null;
    }
    if (body.center !== undefined) {
      existing.center = toObjectId(body.center);
      if (body.centerName !== undefined) existing.centerName = body.centerName || '';
    }
    if (body.course !== undefined) {
      existing.course = toObjectId(body.course);
      if (body.courseName !== undefined || body.courseTrade !== undefined) {
        existing.courseName = body.courseName || body.courseTrade || '';
      }
    }
    if (body.batch !== undefined) {
      existing.batch = toObjectId(body.batch);
      if (body.batchCode !== undefined) existing.batchCode = body.batchCode || '';
    }
    if (body.centerName !== undefined && body.center === undefined) existing.centerName = body.centerName || '';
    if (body.courseName !== undefined && body.course === undefined) existing.courseName = body.courseName || '';
    if (body.batchCode !== undefined && body.batch === undefined) existing.batchCode = body.batchCode || '';
    if (body.sessionDate !== undefined) {
      existing.sessionDate = toDate(body.sessionDate);
    }
    if (body.date !== undefined || body.dateLabel !== undefined) {
      existing.dateLabel = body.date || body.dateLabel || '';
    }
    if (body.totTrainerId !== undefined) {
      existing.totTrainer = toObjectId(body.totTrainerId);
      existing.totTrainerName = body.totTrainerName || '';
    }
    if (body.totStatus !== undefined) existing.totStatus = body.totStatus;

    if (existing.batch && existing.fieldTrainer) {
      await Batch.updateOne(
        { _id: existing.batch },
        { $addToSet: { trainers: existing.fieldTrainer } }
      );
    }

    await existing.save();
    return res.json({
      status: true,
      message: 'Session updated',
      data: mapSessionToClient(existing),
    });
  } catch (err) {
    console.error('PATCH /college/session-plans/:id', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to update session' });
  }
});

// POST /college/session-plans/:id/tot-assignment
router.post('/:id/tot-assignment', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const session = await SessionPlan.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!session) {
      return res.status(404).json({ status: false, message: 'Session not found' });
    }

    const questions = pendingTotQuestions(session);
    if (!questions.length) {
      const alreadySubmitted = Boolean(session.totAssignmentSubmission?.submittedAt)
        || collectTotSubmissions(session).length > 0;
      return res.status(alreadySubmitted ? 409 : 400).json({
        status: false,
        message: alreadySubmitted
          ? 'Assignment already submitted. Retake is not allowed until new questions are added.'
          : 'No TOT MCQ questions are attached to this session',
        data: mapSessionToClient(session),
      });
    }

    const scored = scoreTotAssignment(
      questions,
      req.body?.answers,
      session.totPassPercentage
    );
    if (!scored.attemptedCount) {
      return res.status(400).json({ status: false, message: 'Select at least one answer before submitting' });
    }

    const history = collectTotSubmissions(session);
    const submission = {
      trainer: req.user?._id || null,
      trainerName: req.user?.name || '',
      answers: scored.answers,
      score: scored.score,
      totalMarks: scored.totalMarks,
      percentage: scored.percentage,
      pass: scored.pass,
      correctCount: scored.correctCount,
      wrongCount: scored.wrongCount,
      attemptedCount: scored.attemptedCount,
      unattemptedCount: scored.unattemptedCount,
      submittedAt: new Date(),
    };
    session.totAssignmentSubmissions = [...history, submission];
    session.totAssignmentSubmission = submission;
    session.totStatus = scored.pass ? 'Passed' : 'Failed';
    await session.save();

    return res.json({
      status: true,
      message: scored.pass ? 'Assignment submitted. You passed.' : 'Assignment submitted. You did not pass.',
      data: mapSessionToClient(session),
    });
  } catch (err) {
    console.error('POST /college/session-plans/:id/tot-assignment', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to submit assignment' });
  }
});

// POST /college/session-plans/:id/tot-questions — append only, never deletes existing MCQs
router.post('/:id/tot-questions', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const session = await SessionPlan.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!session) {
      return res.status(404).json({ status: false, message: 'Session not found' });
    }

    const incoming = Array.isArray(req.body?.questions)
      ? req.body.questions
      : (req.body?.question || req.body?.options ? [req.body] : []);
    const additions = incoming
      .map((item) => ({
        question: String(item.question || '').trim(),
        options: Array.isArray(item.options) ? item.options.map((option) => String(option || '')) : ['', '', '', ''],
        correctIndex: Number(item.correctIndex) || 0,
        marks: Number(item.marks) > 0 ? Number(item.marks) : 1,
      }))
      .filter((item) => item.question && item.options.some((option) => option.trim()));

    const passProvided = req.body?.totPassPercentage !== undefined && req.body?.totPassPercentage !== null && req.body?.totPassPercentage !== '';
    if (!additions.length && !passProvided) {
      return res.status(400).json({ status: false, message: 'Enter a question and at least one option' });
    }

    if (additions.length) {
      session.totQuestionBank = [...(session.totQuestionBank || []), ...additions];
      session.totQuestionBankLastUpdated = new Date();
      session.includeTot = true;
    }
    if (passProvided) {
      session.totPassPercentage = normalizePassPercentage(req.body.totPassPercentage);
    }
    await session.save();

    return res.json({
      status: true,
      message: additions.length
        ? (additions.length === 1 ? 'MCQ added' : `${additions.length} MCQs added`)
        : 'Passing percentage updated',
      data: mapSessionToClient(session),
    });
  } catch (err) {
    console.error('POST /college/session-plans/:id/tot-questions', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to add MCQ' });
  }
});

// POST /college/session-plans/:id/standard-tlm/:itemId — senior trainer uploads study material
router.post('/:id/standard-tlm/:itemId', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const session = await SessionPlan.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!session) {
      return res.status(404).json({ status: false, message: 'Session not found' });
    }

    const itemId = String(req.params.itemId || req.body?.itemId || req.query?.itemId || '').trim();
    const file = getUploadedTlmFile(req);
    if (!itemId) {
      return res.status(400).json({ status: false, message: 'itemId is required' });
    }
    if (!file) {
      return res.status(400).json({ status: false, message: 'File is required' });
    }

    const tlmItem = findMaterialItem(session.standardTlm, itemId);
    if (!tlmItem) {
      return res.status(404).json({ status: false, message: 'Standard TLM item not found in this session' });
    }

    const key = `TrainingSession/${session._id}/standard-tlm/${itemId}/${uuid()}-${file.originalName}`;
    await s3.upload({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimeType,
    }).promise();

    tlmItem.status = 'Uploaded';
    tlmItem.fileName = file.originalName;
    tlmItem.fileUrl = key;
    tlmItem.type = inferTlmTypeFromFile(file.originalName, file.mimeType) || tlmItem.type || 'Document';
    tlmItem.uploadedBy = req.user?._id || null;
    tlmItem.uploadedAt = new Date();
    await session.save();

    return res.json({
      status: true,
      message: 'Study material uploaded',
      data: mapSessionToClient(session),
    });
  } catch (err) {
    console.error('POST /college/session-plans/:id/standard-tlm', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to upload study material' });
  }
});

// DELETE /college/session-plans/:id
router.delete('/:id', async (req, res) => {
  try {
    const college = await resolveCollege(req);
    const existing = await SessionPlan.findOne({
      _id: req.params.id,
      college: college._id,
      isDeleted: false,
    });
    if (!existing) {
      return res.status(404).json({ status: false, message: 'Session not found' });
    }

    existing.isDeleted = true;
    existing.status = false;
    await existing.save();

    return res.json({ status: true, message: 'Session deleted' });
  } catch (err) {
    console.error('DELETE /college/session-plans/:id', err);
    return res.status(400).json({ status: false, message: err.message || 'Failed to delete session' });
  }
});

module.exports = router;
