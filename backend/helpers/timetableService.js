const mongoose = require('mongoose');
const {
  Batch,
  SessionPlan,
  BatchSessionAssignment,
  TimetableTemplate,
  TimetableDay,
  TimetableBooking,
} = require('../controllers/models');
const {
  isSeniorTrainer,
  seesAllTrainingBatches,
  userCanAccessBatch,
} = require('./trainingTeam');
const {
  TimetableError,
  buildDaySchedule,
  assertConsecutive,
} = require('./timetableSchedule');

const fail = (message, statusCode = 400) => {
  throw new TimetableError(message, statusCode);
};

const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || '').trim());

const toObjectId = (value, label) => {
  const text = String(value || '').trim();
  if (!isObjectId(text)) fail(`Invalid ${label}`);
  return new mongoose.Types.ObjectId(text);
};

const toOptionalId = (value, label) => {
  if (value == null || String(value).trim() === '') return null;
  return toObjectId(value, label);
};

const sameId = (left, right) => String(left || '') === String(right || '');

const plain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const assertDateKey = (value) => {
  const text = String(value || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) fail('Date must be YYYY-MM-DD');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    fail('Date is not a real calendar day');
  }
  return text;
};

const assertTrack = (value) => {
  const track = String(value || '').trim();
  if (!['course', 'placement', 'club'].includes(track)) fail('Track must be course, placement, or club');
  return track;
};

const assertTimetableUser = (user) => {
  if (!user?._id) fail('Authentication required', 401);
  if (!seesAllTrainingBatches(user) && !isSeniorTrainer(user)) {
    fail('You need Senior Trainer or Admin access', 403);
  }
};

const loadBatch = async (college, user, batchId) => {
  assertTimetableUser(user);
  if (!college?._id) fail('College not found', 403);
  const batch = await Batch.findOne({
    _id: toObjectId(batchId, 'batch'),
    college: college._id,
  });
  if (!batch) fail('Batch not found', 404);
  if (!userCanAccessBatch(batch, user)) fail('You are not assigned to this batch', 403);
  return batch;
};

const scheduleFromTemplate = (template) => buildDaySchedule({
  mode: template.mode,
  dayStart: template.startTime,
  dayEnd: template.endTime,
  periodCount: template.periodCount,
  periodMinutes: template.periodMinutes,
  lunchStart: template.lunchStart,
  lunchEnd: template.lunchEnd,
});

const templatePayload = (body, existing = null) => {
  const schedule = buildDaySchedule({
    mode: body.mode != null ? body.mode : existing?.mode,
    dayStart: body.startTime != null ? body.startTime : existing?.startTime,
    dayEnd: body.endTime != null ? body.endTime : existing?.endTime,
    periodCount: body.periodCount != null ? body.periodCount : existing?.periodCount,
    periodMinutes: body.periodMinutes != null ? body.periodMinutes : existing?.periodMinutes,
    lunchStart: body.lunchStart != null ? body.lunchStart : existing?.lunchStart,
    lunchEnd: body.lunchEnd != null ? body.lunchEnd : existing?.lunchEnd,
  });
  const name = String(body.name != null ? body.name : existing?.name || '').trim();
  if (!name) fail('Template name is required');
  return {
    name,
    track: assertTrack(body.track != null ? body.track : existing?.track || 'course'),
    mode: schedule.mode,
    startTime: schedule.dayStart,
    endTime: schedule.dayEnd,
    periodCount: schedule.periodCount,
    periodMinutes: schedule.periodMinutes,
    lunchStart: schedule.lunchStart,
    lunchEnd: schedule.lunchEnd,
  };
};

const templateScope = async (college, body, existing = null) => {
  const center = body.center !== undefined ? toOptionalId(body.center, 'center') : (existing?.center || null);
  const course = body.course !== undefined ? toOptionalId(body.course, 'course') : (existing?.course || null);
  const batchId = body.batch !== undefined ? toOptionalId(body.batch, 'batch') : (existing?.batch || null);
  if (batchId) {
    const batch = await Batch.findOne({ _id: batchId, college: college._id }).select('courseId centerId');
    if (!batch) fail('Batch not found', 404);
    if (course && !sameId(course, batch.courseId)) fail('Template course does not match the batch');
    if (center && !sameId(center, batch.centerId)) fail('Template center does not match the batch');
  }
  return { center, course, batch: batchId };
};

const templateAppliesToBatch = (template, batch) => {
  if (template.isDeleted) return false;
  if (!sameId(template.college, batch.college)) return false;
  if (template.batch && !sameId(template.batch, batch._id)) return false;
  if (template.course && !sameId(template.course, batch.courseId)) return false;
  if (template.center && !sameId(template.center, batch.centerId)) return false;
  return true;
};

const listTemplates = async ({ college, user, batchId, courseId, centerId }) => {
  assertTimetableUser(user);
  if (!college?._id) fail('College not found', 403);
  const filter = { college: college._id, isDeleted: false };
  const rows = await TimetableTemplate.find(filter).sort({ isDefault: -1, name: 1 });
  return rows.filter((row) => {
    if (batchId && row.batch && !sameId(row.batch, batchId)) return false;
    if (courseId && row.course && !sameId(row.course, courseId)) return false;
    if (centerId && row.center && !sameId(row.center, centerId)) return false;
    return true;
  }).map(plain);
};

const createTemplate = async ({ college, user, body }) => {
  assertTimetableUser(user);
  if (!college?._id) fail('College not found', 403);
  const fields = templatePayload(body);
  const scope = await templateScope(college, body);
  const existingCount = await TimetableTemplate.countDocuments({ college: college._id, isDeleted: false });
  const isDefault = body.isDefault === true || existingCount === 0;
  if (isDefault) {
    await TimetableTemplate.updateMany(
      { college: college._id, isDeleted: false, isDefault: true },
      { $set: { isDefault: false } }
    );
  }
  const created = await TimetableTemplate.create({
    college: college._id,
    ...fields,
    ...scope,
    isDefault,
    createdBy: user._id,
  });
  return plain(created);
};

const loadTemplate = async (college, templateId) => {
  const template = await TimetableTemplate.findOne({
    _id: toObjectId(templateId, 'template'),
    college: college._id,
    isDeleted: false,
  });
  if (!template) fail('Template not found', 404);
  return template;
};

const updateTemplate = async ({ college, user, templateId, body }) => {
  assertTimetableUser(user);
  const template = await loadTemplate(college, templateId);
  const fields = templatePayload(body, template);
  const scope = await templateScope(college, body, template);
  Object.assign(template, fields, scope);
  await template.save();
  return plain(template);
};

const deleteTemplate = async ({ college, user, templateId }) => {
  assertTimetableUser(user);
  const template = await loadTemplate(college, templateId);
  template.isDeleted = true;
  template.isDefault = false;
  await template.save();
  const remaining = await TimetableTemplate.findOne({ college: college._id, isDeleted: false }).sort({ createdAt: 1 });
  if (remaining && !await TimetableTemplate.exists({ college: college._id, isDeleted: false, isDefault: true })) {
    remaining.isDefault = true;
    await remaining.save();
  }
  return { deleted: true };
};

const setDefaultTemplate = async ({ college, user, templateId }) => {
  assertTimetableUser(user);
  const template = await loadTemplate(college, templateId);
  await TimetableTemplate.updateMany(
    { college: college._id, isDeleted: false, isDefault: true },
    { $set: { isDefault: false } }
  );
  template.isDefault = true;
  await template.save();
  return plain(template);
};

const scheduleFromBody = (body, fallback) => buildDaySchedule({
  mode: body.mode != null ? body.mode : fallback.mode,
  dayStart: body.dayStart != null ? body.dayStart : fallback.dayStart,
  dayEnd: body.dayEnd != null ? body.dayEnd : fallback.dayEnd,
  periodCount: body.periodCount != null ? body.periodCount : fallback.periodCount,
  periodMinutes: body.periodMinutes != null ? body.periodMinutes : fallback.periodMinutes,
  lunchStart: body.lunchStart != null ? body.lunchStart : fallback.lunchStart,
  lunchEnd: body.lunchEnd != null ? body.lunchEnd : fallback.lunchEnd,
});

const assignSchedule = (day, schedule) => {
  day.mode = schedule.mode;
  day.dayStart = schedule.dayStart;
  day.dayEnd = schedule.dayEnd;
  day.periodCount = schedule.periodCount;
  day.periodMinutes = schedule.periodMinutes;
  day.lunchStart = schedule.lunchStart;
  day.lunchEnd = schedule.lunchEnd;
  day.totalStudyMinutes = schedule.totalStudyMinutes;
  day.slots = schedule.slots;
  day.markModified('slots');
};

const activeBookingsForDay = (dayId) => TimetableBooking.find({
  timetableDay: dayId,
  status: 'active',
});

const releaseSlots = async (dayId, slotKeys) => {
  if (!slotKeys?.length) return;
  await TimetableDay.updateOne(
    { _id: dayId },
    { $pullAll: { occupiedSlots: slotKeys } }
  );
};

const reserveSlots = async (dayId, slotKeys) => {
  if (!slotKeys.length) return;
  const filter = {
    _id: dayId,
    $and: slotKeys.map((key) => ({ occupiedSlots: { $ne: key } })),
  };
  const update = { $addToSet: { occupiedSlots: { $each: slotKeys } } };
  let updated = await TimetableDay.findOneAndUpdate(filter, update, { new: true });
  if (updated) return;

  const holders = await TimetableBooking.countDocuments({
    timetableDay: dayId,
    status: 'active',
    slotKeys: { $in: slotKeys },
  });
  if (holders) fail('That period is already booked', 409);

  await TimetableDay.updateOne({ _id: dayId }, { $pullAll: { occupiedSlots: slotKeys } });
  updated = await TimetableDay.findOneAndUpdate(filter, update, { new: true });
  if (!updated) fail('That period is already booked', 409);
};

const dateLabelFor = (dateKey) => {
  const [, month, day] = dateKey.split('-');
  return `${Number(day)}/${Number(month)}/${dateKey.slice(0, 4)}`;
};

const sessionHasOtherActiveBooking = async (sessionId, exceptBookingId) => {
  const related = await BatchSessionAssignment.find({ session: sessionId }).select('_id');
  if (!related.length) return false;
  const other = await TimetableBooking.findOne({
    status: 'active',
    _id: { $ne: exceptBookingId },
    batchSessionAssignment: { $in: related.map((row) => row._id) },
  }).select('_id');
  return Boolean(other);
};

const mirrorBookingOntoSession = async (booking, day) => {
  const assignment = await BatchSessionAssignment.findById(booking.batchSessionAssignment)
    .select('session batch');
  if (!assignment?.session) return;
  if (await sessionHasOtherActiveBooking(assignment.session, booking._id)) return;
  await SessionPlan.updateOne(
    {
      _id: assignment.session,
      isDeleted: false,
      $or: [{ batch: assignment.batch }, { batch: null }],
    },
    {
      $set: {
        sessionDate: new Date(`${day.dateKey}T00:00:00.000Z`),
        dateLabel: dateLabelFor(day.dateKey),
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
    }
  );
};

const clearMirror = async (booking, day) => {
  const assignment = await BatchSessionAssignment.findById(booking.batchSessionAssignment)
    .select('session batch');
  if (!assignment?.session) return;
  if (await sessionHasOtherActiveBooking(assignment.session, booking._id)) return;
  await SessionPlan.updateOne(
    {
      _id: assignment.session,
      isDeleted: false,
      sessionDate: new Date(`${day.dateKey}T00:00:00.000Z`),
      startTime: booking.startTime,
      endTime: booking.endTime,
      $or: [{ batch: assignment.batch }, { batch: null }],
    },
    { $set: { sessionDate: null, dateLabel: '', startTime: '', endTime: '' } }
  );
};

const markBookingCleared = async (booking, day, user) => {
  if (booking.status !== 'active') return booking;
  booking.status = 'cleared';
  booking.clearedAt = new Date();
  booking.clearedBy = user?._id || null;
  await booking.save();
  await releaseSlots(day._id, booking.slotKeys);
  await clearMirror(booking, day);
  return booking;
};

const applyScheduleToDay = async (day, schedule, { clearBookings, user }) => {
  const bookings = await activeBookingsForDay(day._id);
  if (bookings.length && !clearBookings) {
    bookings.forEach((booking) => {
      try {
        assertConsecutive(schedule.slots, booking.slotKeys);
      } catch (err) {
        fail('Clear the booked periods before changing this day', 409);
      }
    });
  }

  if (bookings.length && clearBookings) {
    for (const booking of bookings) {
      await markBookingCleared(booking, day, user);
    }
    day.occupiedSlots = [];
  }

  assignSchedule(day, schedule);
  await day.save();

  if (!clearBookings) {
    for (const booking of bookings) {
      const span = assertConsecutive(schedule.slots, booking.slotKeys);
      booking.slotKeys = span.slotKeys;
      booking.startTime = span.startTime;
      booking.endTime = span.endTime;
      await booking.save();
      await mirrorBookingOntoSession(booking, day);
    }
  }
  return day;
};

const loadOwnedDay = async (college, user, dayId) => {
  const day = await TimetableDay.findOne({
    _id: toObjectId(dayId, 'timetable day'),
    college: college._id,
  });
  if (!day) fail('Timetable day not found', 404);
  await loadBatch(college, user, day.batch);
  return day;
};

const ensureDay = async ({ college, user, body }) => {
  const batch = await loadBatch(college, user, body.batchId || body.batch);
  const dateKey = assertDateKey(body.date || body.dateKey);
  const track = assertTrack(body.track);
  const template = await loadTemplate(college, body.templateId || body.template);
  if (!templateAppliesToBatch(template, batch)) {
    fail('This template is not available for the selected batch');
  }

  const existing = await TimetableDay.findOne({ batch: batch._id, dateKey, track });
  if (existing) return plain(existing);

  const schedule = scheduleFromTemplate(template);
  try {
    const created = await TimetableDay.create({
      college: college._id,
      batch: batch._id,
      template: template._id,
      dateKey,
      track,
      ...schedule,
      occupiedSlots: [],
      createdBy: user._id,
    });
    return plain(created);
  } catch (err) {
    if (err?.code === 11000) {
      const raced = await TimetableDay.findOne({ batch: batch._id, dateKey, track });
      if (raced) return plain(raced);
    }
    throw err;
  }
};

const updateDay = async ({ college, user, dayId, body }) => {
  const day = await loadOwnedDay(college, user, dayId);
  const schedule = scheduleFromBody(body, day);
  const saved = await applyScheduleToDay(day, schedule, {
    clearBookings: body.clearBookings === true,
    user,
  });
  return plain(saved);
};

const rebuildDay = async ({ college, user, dayId, body }) => {
  const day = await loadOwnedDay(college, user, dayId);
  let schedule;
  if (body.applyTemplate === true) {
    const templateId = body.templateId || body.template || day.template;
    const template = await loadTemplate(college, templateId);
    const batch = await loadBatch(college, user, day.batch);
    if (!templateAppliesToBatch(template, batch)) {
      fail('This template is not available for the selected batch');
    }
    schedule = scheduleFromTemplate(template);
    day.template = template._id;
  } else {
    schedule = scheduleFromBody({}, day);
  }
  const saved = await applyScheduleToDay(day, schedule, {
    clearBookings: body.clearBookings === true,
    user,
  });
  return plain(saved);
};

const listDays = async ({ college, user, batchId, from, to, track }) => {
  const batch = await loadBatch(college, user, batchId);
  const filter = { college: college._id, batch: batch._id };
  if (from || to) {
    filter.dateKey = {};
    if (from) filter.dateKey.$gte = assertDateKey(from);
    if (to) filter.dateKey.$lte = assertDateKey(to);
  }
  if (track) filter.track = assertTrack(track);
  const rows = await TimetableDay.find(filter).sort({ dateKey: 1, track: 1 });
  return rows.map(plain);
};

const presentBooking = (booking) => {
  const row = plain(booking);
  const assignment = row.batchSessionAssignment && row.batchSessionAssignment._id
    ? row.batchSessionAssignment
    : null;
  const session = assignment?.session && assignment.session._id ? assignment.session : null;
  const day = row.timetableDay && row.timetableDay._id ? row.timetableDay : null;
  const trainer = assignment?.trainer && assignment.trainer._id ? assignment.trainer : null;
  return {
    _id: row._id,
    timetableDay: day?._id || row.timetableDay,
    batchSessionAssignment: assignment?._id || row.batchSessionAssignment,
    slotKeys: row.slotKeys || [],
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    dateKey: day?.dateKey || '',
    track: day?.track || '',
    batchId: day?.batch ? String(day.batch) : '',
    sessionId: session?._id ? String(session._id) : '',
    title: session?.title || '',
    unitNumber: session?.unitNumber || '',
    unitName: session?.unitName || '',
    chapterNumber: session?.chapterNumber || '',
    chapterName: session?.chapterName || '',
    sessionNumber: session?.sessionNumber || '',
    timetableType: session?.timetableType || 'course',
    fieldTrainerName: trainer?.name || trainer?.email || '',
  };
};

const bookingQuery = () => ({
  path: 'batchSessionAssignment',
  populate: [
    {
      path: 'session',
      select: 'title unitNumber unitName chapterNumber chapterName sessionNumber timetableType',
    },
    { path: 'trainer', select: 'name email' },
  ],
});

const listBookings = async ({ college, user, batchId, from, to, track, date }) => {
  const batch = await loadBatch(college, user, batchId);
  const dayFilter = { college: college._id, batch: batch._id };
  if (date) {
    dayFilter.dateKey = assertDateKey(date);
  } else if (from || to) {
    dayFilter.dateKey = {};
    if (from) dayFilter.dateKey.$gte = assertDateKey(from);
    if (to) dayFilter.dateKey.$lte = assertDateKey(to);
  }
  if (track) dayFilter.track = assertTrack(track);
  const days = await TimetableDay.find(dayFilter).select('_id');
  const rows = await TimetableBooking.find({
    timetableDay: { $in: days.map((day) => day._id) },
    status: 'active',
  })
    .populate('timetableDay', 'dateKey track batch')
    .populate(bookingQuery())
    .sort({ startTime: 1 });
  return rows.map(presentBooking);
};

const loadAssignmentForDay = async (day, assignmentId) => {
  const assignment = await BatchSessionAssignment.findById(toObjectId(assignmentId, 'batch session'))
    .populate('session');
  if (!assignment) fail('Batch session not found', 404);
  if (!sameId(assignment.batch, day.batch)) fail('Session is not assigned to this batch');
  const session = assignment.session;
  if (!session || session.isDeleted) fail('Session not found', 404);
  if (!sameId(session.college, day.college)) fail('Session is not in this college', 403);
  const track = session.timetableType || 'course';
  if (track !== day.track) fail('Session track does not match this timetable');
  return assignment;
};

const duplicateMessage = (err) => {
  const text = String(err?.message || '');
  if (text.includes('batchSessionAssignment')) return 'This session is already booked';
  return 'That period is already booked';
};

const createBooking = async ({ college, user, body }) => {
  const day = await loadOwnedDay(college, user, body.timetableDayId || body.timetableDay);
  const assignment = await loadAssignmentForDay(day, body.batchSessionAssignmentId || body.batchSessionAssignment);
  const span = assertConsecutive(day.slots, body.slotKeys);
  await reserveSlots(day._id, span.slotKeys);
  let created;
  try {
    created = await TimetableBooking.create({
      timetableDay: day._id,
      batchSessionAssignment: assignment._id,
      slotKeys: span.slotKeys,
      startTime: span.startTime,
      endTime: span.endTime,
      status: 'active',
      createdBy: user._id,
    });
  } catch (err) {
    await releaseSlots(day._id, span.slotKeys);
    if (err?.code === 11000) fail(duplicateMessage(err), 409);
    throw err;
  }
  try {
    await mirrorBookingOntoSession(created, day);
  } catch (err) {
    console.error('Timetable session mirror failed:', err.message);
  }
  const saved = await TimetableBooking.findById(created._id)
    .populate('timetableDay', 'dateKey track batch')
    .populate(bookingQuery());
  return presentBooking(saved);
};

const updateBookingSlots = async ({ college, user, bookingId, body }) => {
  const booking = await TimetableBooking.findOne({
    _id: toObjectId(bookingId, 'booking'),
    status: 'active',
  });
  if (!booking) fail('Booking not found', 404);
  const day = await loadOwnedDay(college, user, booking.timetableDay);
  const span = assertConsecutive(day.slots, body.slotKeys);
  const previous = new Set(booking.slotKeys);
  const next = new Set(span.slotKeys);
  const added = span.slotKeys.filter((key) => !previous.has(key));
  const removed = booking.slotKeys.filter((key) => !next.has(key));
  await reserveSlots(day._id, added);
  try {
    booking.slotKeys = span.slotKeys;
    booking.startTime = span.startTime;
    booking.endTime = span.endTime;
    await booking.save();
  } catch (err) {
    await releaseSlots(day._id, added);
    if (err?.code === 11000) fail(duplicateMessage(err), 409);
    throw err;
  }
  await releaseSlots(day._id, removed);
  await mirrorBookingOntoSession(booking, day);
  const saved = await TimetableBooking.findById(booking._id)
    .populate('timetableDay', 'dateKey track batch')
    .populate(bookingQuery());
  return presentBooking(saved);
};

const clearBooking = async ({ college, user, bookingId }) => {
  const booking = await TimetableBooking.findOne({
    _id: toObjectId(bookingId, 'booking'),
    status: 'active',
  });
  if (!booking) fail('Booking not found', 404);
  const day = await loadOwnedDay(college, user, booking.timetableDay);
  await markBookingCleared(booking, day, user);
  return { cleared: true, _id: booking._id };
};

const listBatchSessions = async ({ college, user, batchId, track }) => {
  const batch = await loadBatch(college, user, batchId);
  const rows = await BatchSessionAssignment.find({ batch: batch._id })
    .populate('session')
    .populate('trainer', 'name email')
    .populate('seniorTrainer', 'name email');
  const assignmentIds = rows.map((row) => row._id);
  const active = assignmentIds.length
    ? await TimetableBooking.find({
      batchSessionAssignment: { $in: assignmentIds },
      status: 'active',
    }).select('batchSessionAssignment')
    : [];
  const booked = new Set(active.map((row) => String(row.batchSessionAssignment)));
  const selectedTrack = track ? assertTrack(track) : '';

  return rows
    .filter((row) => row.session && !row.session.isDeleted && sameId(row.session.college, college._id))
    .filter((row) => !selectedTrack || (row.session.timetableType || 'course') === selectedTrack)
    .map((row) => ({
      assignmentId: String(row._id),
      sessionId: String(row.session._id),
      title: row.session.title || '',
      sessionNumber: row.session.sessionNumber || '',
      unitNumber: row.session.unitNumber || '',
      unitName: row.session.unitName || '',
      chapterNumber: row.session.chapterNumber || '',
      chapterName: row.session.chapterName || '',
      timetableType: row.session.timetableType || 'course',
      includeTot: row.session.includeTot !== false,
      fieldTrainerName: row.trainer?.name || row.trainer?.email || '',
      seniorTrainerName: row.seniorTrainer?.name || row.seniorTrainer?.email || '',
      hasActiveBooking: booked.has(String(row._id)),
    }));
};

// Read the authenticated trainer's bookings directly, never the shared plan's
// mirrored date/time (the same plan can be taught in several batches).
const listMyBookings = async ({ college, user, from, to }) => {
  if (!college?._id || !user?._id) fail('Sign in to view your timetable', 403);
  const start = assertDateKey(from);
  const end = assertDateKey(to);
  const span = (new Date(end) - new Date(start)) / 86400000;
  if (span < 0 || span > 31) fail('Choose a date range of up to 31 days');
  const batches = await Batch.find({ college: college._id }).select('_id name').lean();
  const batchNames = new Map(batches.map((batch) => [String(batch._id), batch.name || '']));
  const assignments = await BatchSessionAssignment.find({
    trainer: user._id,
    batch: { $in: batches.map((batch) => batch._id) },
  }).populate({ path: 'session', match: { college: college._id, isDeleted: false } }).lean();
  const valid = assignments.filter((row) => row.session);
  const byId = new Map(valid.map((row) => [String(row._id), row]));
  const days = await TimetableDay.find({
    college: college._id,
    batch: { $in: batches.map((batch) => batch._id) },
    dateKey: { $gte: start, $lte: end },
  }).select('_id dateKey batch track slots').lean();
  const daysById = new Map(days.map((day) => [String(day._id), day]));
  const rows = await TimetableBooking.find({
    status: 'active',
    timetableDay: { $in: days.map((day) => day._id) },
    batchSessionAssignment: { $in: valid.map((row) => row._id) },
  }).sort({ startTime: 1 }).lean();
  return rows.map((row) => {
    const assignment = byId.get(String(row.batchSessionAssignment));
    const day = daysById.get(String(row.timetableDay));
    const session = assignment.session;
    return {
      _id: String(row._id), assignmentId: String(assignment._id),
      sessionId: String(session._id), title: session.title || '',
      topic: session.topicCovered || session.title || '',
      batchId: String(assignment.batch), batchName: batchNames.get(String(assignment.batch)),
      dateKey: day.dateKey, startTime: row.startTime, endTime: row.endTime,
      track: day.track,
      period: day.slots.filter((slot) => row.slotKeys.includes(slot.key)).map((slot) => slot.label).join(' + '),
    };
  }).sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.startTime.localeCompare(b.startTime));
};

module.exports = {
  TimetableError,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  ensureDay,
  updateDay,
  rebuildDay,
  listDays,
  listBookings,
  listMyBookings,
  createBooking,
  updateBookingSlots,
  clearBooking,
  listBatchSessions,
};
