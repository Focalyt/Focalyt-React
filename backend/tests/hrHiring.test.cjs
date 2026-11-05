const test = require('node:test');
const assert = require('node:assert/strict');
const createHrHiring = require('../controllers/routes/college/hrHiring');

const ids = { application: '111111111111111111111111', candidate: '222222222222222222222222',
  company: '333333333333333333333333', job: '444444444444444444444444',
  college: '555555555555555555555555', person: '666666666666666666666666' };

function setup(options = {}) {
  const calls = [];
  let record = options.empty ? null : { _id: ids.application, company: ids.company, candidate: ids.candidate,
    status: 'interview due', eventDate: '2099-01-01T09:00:00Z', comment: 'Company interview note', job: { _id: ids.job, title: 'Sales' } };
  const loaded = { apply: { _id: ids.application, _company: ids.company, isDeleted: options.deleted || false },
    candidate: { _id: ids.candidate }, job: { _id: ids.job, _company: options.wrongCompany || ids.company, title: 'Sales' } };
  const chain = value => ({ select() { return this; }, sort() { return this; }, populate() { return this; }, async lean() { return value; } });
  const service = createHrHiring({
    async loadAppliedLead(id, collegeId) { calls.push({ load: { id, collegeId } }); return options.denied ? null : loaded; },
    Company: { findOne(filter) { calls.push({ companyFilter: filter }); return chain({ _id: ids.company, name: 'Company', companyExecutives: [{ _id: ids.person, name: 'Recruiter' }] }); } },
    HiringStatus: {
      findOne(filter) { calls.push({ read: filter }); return chain(record); },
      find(filter) { calls.push({ batch: filter }); return chain(record ? [record] : []); },
      async findOneAndUpdate(filter, update, settings) { calls.push({ filter, update, settings }); record = { _id: ids.application, ...update.$set }; },
    },
  });
  return { service, calls, async run(action, body, user = { college: { _id: ids.college } }) {
    const output = { code: 200 };
    const response = { set() {}, status(code) { output.code = code; return this; }, json(data) { output.data = data; return this; } };
    await service[action]({ params: { id: ids.application }, user, body }, response);
    return output;
  } };
}

test('reads the existing corporate hiring record using the authorized application', async () => {
  const app = setup();
  const result = await app.run('get');
  assert.equal(result.code, 200);
  assert.equal(result.data.data.hiring.status, 'interview due');
  assert.equal(result.data.data.executives[0].id, ids.person);
  assert.deepEqual(app.calls.find(item => item.read).read, { company: ids.company, candidate: ids.candidate, isDeleted: false });
  assert.equal(app.calls[0].load.collegeId, ids.college);
});

test('foreign, deleted, missing-college and company-mismatched applications cannot be updated', async () => {
  for (const option of [{ denied: true }, { deleted: true }, { wrongCompany: ids.college }]) {
    const app = setup(option);
    assert.equal((await app.run('update', { status: 'shortlisted' })).code, 404);
    assert.ok(!app.calls.some(item => item.update));
  }
  const app = setup();
  assert.equal((await app.run('get', undefined, {})).code, 404);
  assert.equal(app.calls.length, 0);
});

test('rejects invalid stages, invalid dates, past interviews and foreign executives without writes', async () => {
  for (const body of [
    { status: 'confirmed' }, { status: 'shortlisted', eventDate: 'garbage' },
    { status: 'interview due' }, { status: 'interview due', eventDate: '2020-01-01T10:00:00Z' },
    { status: 'interview due', eventDate: '2099-01-01T10:00' },
    { status: 'shortlisted', concernedPerson: ids.college },
    { status: 'shortlisted', comment: 'x'.repeat(2001) },
  ]) {
    const app = setup();
    assert.equal((await app.run('update', body)).code, 400);
    assert.ok(!app.calls.some(item => item.update));
  }
});

test('persists to the shared record and derives company, candidate and job from the application', async () => {
  const app = setup();
  const result = await app.run('update', { status: 'interview due', comment: ' Meet recruiter ',
    concernedPerson: ids.person, eventDate: '2099-01-01T14:30:00+05:30', company: ids.college, candidate: ids.college, job: ids.college });
  assert.equal(result.code, 200);
  const write = app.calls.find(item => item.update);
  assert.equal(write.filter.company, ids.company);
  assert.equal(write.filter.candidate, ids.candidate);
  assert.equal(write.update.$set.job, ids.job);
  assert.equal(write.update.$set.comment, 'Meet recruiter');
  assert.equal(write.update.$set.eventDate.toISOString(), '2099-01-01T09:00:00.000Z');
  assert.equal(write.update.$set.isRejected, false);
  assert.equal(write.settings.runValidators, true);
});

test('rejection flag resets when the candidate is moved back into the hiring process', async () => {
  const app = setup();
  await app.run('update', { status: 'rejected' });
  await app.run('update', { status: 'shortlisted', comment: '', eventDate: null, concernedPerson: '' });
  const writes = app.calls.filter(item => item.update);
  assert.equal(writes[0].update.$set.isRejected, true);
  assert.equal(writes[1].update.$set.isRejected, false);
  assert.equal(writes[1].update.$set.eventDate, null);
});

test('batch card summaries match both candidate and company and preserve lead performance', async () => {
  const app = setup();
  const rows = await app.service.attach([
    { _id: ids.application, candidate: ids.candidate, companyId: ids.company, statusTitle: 'Untouch' },
    { _id: ids.college, candidate: ids.candidate, companyId: ids.college },
  ]);
  assert.equal(rows[0].corporateHiringStatus.status, 'interview due');
  assert.equal(rows[0].statusTitle, 'Untouch');
  assert.equal(rows[1].corporateHiringStatus, null);
  assert.equal(app.calls.filter(item => item.batch).length, 1);
});
