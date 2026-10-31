const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Load just the service against database doubles, without booting the app,
// connecting to MongoDB, or loading production configuration.
function fixture() {
  const queries = {};
  const data = {
    Batch: [{ _id: 'b8', name: 'Batch B8' }, { _id: 'b9', name: 'Batch B9' }],
    BatchSessionAssignment: [
      { _id: 'a8', batch: 'b8', session: { _id: 'shared', title: 'AI', topicCovered: 'Basics', sessionDate: 'wrong-date', startTime: '23:00' } },
      { _id: 'a9', batch: 'b9', session: { _id: 'shared', title: 'AI' } },
      { _id: 'deleted', batch: 'b8', session: null },
    ],
    TimetableDay: [
      { _id: 'd8', batch: 'b8', dateKey: '2026-10-30', track: 'course', slots: [{ key: 'p1', label: 'Period 1' }] },
      { _id: 'd9', batch: 'b9', dateKey: '2026-10-31', track: 'course', slots: [{ key: 'p2', label: 'Period 2' }] },
    ],
    TimetableBooking: [
      { _id: 'booking9', batchSessionAssignment: 'a9', timetableDay: 'd9', startTime: '14:00', endTime: '15:00', slotKeys: ['p2'] },
      { _id: 'booking8', batchSessionAssignment: 'a8', timetableDay: 'd8', startTime: '09:00', endTime: '10:00', slotKeys: ['p1'] },
    ],
  };
  const models = Object.fromEntries(Object.keys(data).map((name) => [name, {
    find(filter) {
      queries[name] = filter;
      const query = {
        select() { return query; }, populate(options) { queries.populate = options; return query; },
        sort() { return query; }, lean: async () => data[name],
      };
      return query;
    },
  }]));
  const context = {
    module: { exports: {} },
    require(name) {
      if (name === '../controllers/models') return models;
      if (name === './trainingTeam') return {};
      if (name === './timetableSchedule') return require('./timetableSchedule');
      if (name === 'mongoose') return {};
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'timetableService.js'), 'utf8'), context);
  return { service: context.module.exports, queries };
}

test('my timetable requires user and college; validates and bounds the date range', async () => {
  const { service } = fixture();
  await assert.rejects(service.listMyBookings({}), /Sign in/);
  const context = { college: { _id: 'college' }, user: { _id: 'trainer' } };
  for (const [from, to] of [['2026-02-30', '2026-03-01'], ['2026-11-01', '2026-10-01'], ['2026-01-01', '2026-03-01']]) {
    await assert.rejects(service.listMyBookings({ ...context, from, to }));
  }
});

test('scopes bookings to authenticated trainer and college, using batch booking timing', async () => {
  const { service, queries } = fixture();
  const rows = await service.listMyBookings({ college: { _id: 'college' }, user: { _id: 'trainer' }, from: '2026-10-26', to: '2026-11-01' });
  assert.equal(queries.Batch.college, 'college');
  assert.equal(queries.BatchSessionAssignment.trainer, 'trainer');
  assert.equal(queries.populate.match.college, 'college');
  assert.equal(queries.populate.match.isDeleted, false);
  assert.equal(queries.TimetableDay.college, 'college');
  assert.equal(queries.TimetableDay.dateKey.$gte, '2026-10-26');
  assert.equal(queries.TimetableDay.dateKey.$lte, '2026-11-01');
  assert.equal(queries.TimetableBooking.status, 'active');
  assert.equal(queries.TimetableBooking.batchSessionAssignment.$in.includes('deleted'), false);
  assert.equal(rows[0].assignmentId, 'a8');
  assert.equal(rows[0].dateKey, '2026-10-30');
  assert.equal(rows[0].startTime, '09:00');
  assert.equal(rows[0].period, 'Period 1');
  assert.equal(rows[1].assignmentId, 'a9');
  assert.equal(rows[1].dateKey, '2026-10-31');
  assert.equal(rows[1].startTime, '14:00');
});
