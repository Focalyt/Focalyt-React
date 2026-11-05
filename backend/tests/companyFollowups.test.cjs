const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const candidateId = '111111111111111111111111';
const companyId = '222222222222222222222222';
const applicationId = '333333333333333333333333';
const followupId = '444444444444444444444444';
const userId = '555555555555555555555555';

function setup(options = {}) {
  const calls = [];
  const record = { _id: applicationId, _job: { title: 'Sales Engineer' }, followups: [{ remarks: 'Private HR note' }], companyFollowups: [
    { _id: followupId, type: 'Call', followupDate: '2020-01-01T10:00:00.000Z', status: 'planned', remarks: 'Company note' },
  ] };
  function chain(value) { return { select() { return this; }, populate(options) { calls.push({ populate: options }); return this; }, lean: async () => value }; }
  const models = {
    Company: { findOne(filter) { calls.push({ model: 'Company', filter }); return chain(options.noCompany ? null : { _id: companyId }); } },
    AppliedJobs: {
      find(filter) { calls.push({ model: 'AppliedJobs', filter }); return chain([record, { _id: 'foreign-job', _job: null, companyFollowups: [] }]); },
      findOneAndUpdate(filter, update, settings) { calls.push({ model: 'AppliedJobs', filter, update, settings }); return chain(options.notFound ? null : record); },
    },
  };
  const sandbox = { module: { exports: {} }, exports: {}, require(name) {
    if (name === 'mongoose') return require('mongoose');
    if (name === '../../models') return models;
    throw Error(name);
  } };
  sandbox.exports = sandbox.module.exports;
  const filename = path.resolve(__dirname, '../controllers/routes/corporate/companyFollowups.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return { calls, async run(action, body) {
    const result = { code: 200 };
    const res = { set() { return this; }, status(code) { result.code = code; return this; }, json(body) { result.body = body; return this; } };
    await sandbox.module.exports[action]({ params: { candidateId, followupId }, body, companyUser: userId }, res);
    return result;
  } };
}

test('follow-up list is scoped to the company and does not reveal HR notes', async () => {
  const app = setup();
  const result = await app.run('list');
  assert.equal(result.code, 200);
  assert.equal(result.body.applications.length, 1);
  assert.equal(result.body.applications[0].followups[0].status, 'missed');
  assert.ok(!JSON.stringify(result.body).includes('Private HR note'));
  const filter = app.calls.find(call => call.model === 'AppliedJobs').filter;
  assert.equal(filter._company, companyId);
  assert.equal(filter._candidate, candidateId);
});

test('past dates and invalid follow-up types are rejected before writing', async () => {
  const app = setup();
  assert.equal((await app.run('create', { applicationId, type: 'Call', followupDate: '2020-01-01T10:00:00Z' })).code, 400);
  assert.equal((await app.run('create', { applicationId, type: 'Other', followupDate: '2099-01-01T10:00:00Z' })).code, 400);
  assert.equal((await app.run('create')).code, 400);
  assert.equal(app.calls.length, 0);
});

test('scheduling writes only company follow-ups with creator and application ownership', async () => {
  const app = setup();
  const result = await app.run('create', { applicationId, type: 'Visit', followupDate: '2099-01-01T10:00:00Z', remarks: ' Visit office ' });
  assert.equal(result.code, 201);
  const call = app.calls.find(item => item.update);
  assert.equal(call.filter._company, companyId);
  assert.equal(call.filter._candidate, candidateId);
  assert.equal(call.filter._id, applicationId);
  assert.equal(call.update.$push.companyFollowups.createdBy, userId);
  assert.equal(call.update.$push.companyFollowups.remarks, 'Visit office');
  assert.equal(call.update.$push.followups, undefined);
});

test('another company application cannot be scheduled', async () => {
  const result = await setup({ notFound: true }).run('create', { applicationId, type: 'Call', followupDate: '2099-01-01T10:00:00Z' });
  assert.equal(result.code, 404);
});

test('completion uses an atomic pending-state check and records who completed it', async () => {
  const app = setup();
  assert.equal((await app.run('complete', { applicationId })).code, 200);
  const call = app.calls.find(item => item.update);
  assert.equal(call.filter._company, companyId);
  assert.equal(call.filter.companyFollowups.$elemMatch._id, followupId);
  assert.equal(call.update.$set['companyFollowups.$.status'], 'done');
  assert.equal(call.update.$set['companyFollowups.$.completedBy'], userId);
  assert.equal((await setup({ notFound: true }).run('complete', { applicationId })).code, 409);
});

test('missing company cannot read or create follow-ups', async () => {
  assert.equal((await setup({ noCompany: true }).run('list')).code, 404);
  assert.equal((await setup({ noCompany: true }).run('create', { applicationId, type: 'Call', followupDate: '2099-01-01T10:00:00Z' })).code, 404);
});
