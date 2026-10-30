const express = require('express');
const service = require('../../../helpers/timetableService');

const router = express.Router();

const send = (res, data, message) => res.json({
  status: true,
  success: true,
  message: message || 'OK',
  data,
});

const wrap = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode === 500) console.error('Timetable route error:', err);
    res.status(statusCode).json({
      status: false,
      success: false,
      message: err.message || 'Server error',
    });
  }
};

const context = (req) => ({
  college: req.college,
  user: req.user,
});

router.get('/templates', wrap(async (req, res) => {
  const data = await service.listTemplates({
    ...context(req),
    batchId: req.query.batchId,
    courseId: req.query.courseId,
    centerId: req.query.centerId,
  });
  send(res, data, 'Templates loaded');
}));

router.post('/templates', wrap(async (req, res) => {
  const data = await service.createTemplate({ ...context(req), body: req.body || {} });
  res.status(201).json({ status: true, success: true, message: 'Template saved', data });
}));

router.put('/templates/:id', wrap(async (req, res) => {
  const data = await service.updateTemplate({
    ...context(req),
    templateId: req.params.id,
    body: req.body || {},
  });
  send(res, data, 'Template updated');
}));

router.delete('/templates/:id', wrap(async (req, res) => {
  const data = await service.deleteTemplate({ ...context(req), templateId: req.params.id });
  send(res, data, 'Template deleted');
}));

router.post('/templates/:id/default', wrap(async (req, res) => {
  const data = await service.setDefaultTemplate({ ...context(req), templateId: req.params.id });
  send(res, data, 'Default template updated');
}));

router.get('/days', wrap(async (req, res) => {
  const data = await service.listDays({
    ...context(req),
    batchId: req.query.batchId,
    from: req.query.from,
    to: req.query.to,
    track: req.query.track,
  });
  send(res, data, 'Timetable days loaded');
}));

router.post('/days', wrap(async (req, res) => {
  const data = await service.ensureDay({ ...context(req), body: req.body || {} });
  send(res, data, 'Timetable day ready');
}));

router.put('/days/:id', wrap(async (req, res) => {
  const data = await service.updateDay({
    ...context(req),
    dayId: req.params.id,
    body: req.body || {},
  });
  send(res, data, 'Timetable day updated');
}));

router.post('/days/:id/rebuild', wrap(async (req, res) => {
  const data = await service.rebuildDay({
    ...context(req),
    dayId: req.params.id,
    body: req.body || {},
  });
  send(res, data, 'Timetable day rebuilt');
}));

router.get('/bookings', wrap(async (req, res) => {
  const data = await service.listBookings({
    ...context(req),
    batchId: req.query.batchId,
    from: req.query.from,
    to: req.query.to,
    date: req.query.date,
    track: req.query.track,
  });
  send(res, data, 'Bookings loaded');
}));

router.get('/my-bookings', wrap(async (req, res) => {
  const data = await service.listMyBookings({
    ...context(req), from: req.query.from, to: req.query.to,
  });
  send(res, data, 'Your timetable loaded');
}));

router.post('/bookings', wrap(async (req, res) => {
  const data = await service.createBooking({ ...context(req), body: req.body || {} });
  res.status(201).json({ status: true, success: true, message: 'Session booked', data });
}));

router.patch('/bookings/:id', wrap(async (req, res) => {
  const data = await service.updateBookingSlots({
    ...context(req),
    bookingId: req.params.id,
    body: req.body || {},
  });
  send(res, data, 'Booking updated');
}));

router.delete('/bookings/:id', wrap(async (req, res) => {
  const data = await service.clearBooking({ ...context(req), bookingId: req.params.id });
  send(res, data, 'Booking cleared');
}));

router.get('/batches/:batchId/sessions', wrap(async (req, res) => {
  const data = await service.listBatchSessions({
    ...context(req),
    batchId: req.params.batchId,
    track: req.query.track,
  });
  send(res, data, 'Batch sessions loaded');
}));

module.exports = router;
