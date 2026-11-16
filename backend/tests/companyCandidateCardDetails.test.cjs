const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const candidateId = '111111111111111111111111';
const companyId = '222222222222222222222222';
const applicationId = '333333333333333333333333';
const userId = '444444444444444444444444';
const handlerPath = path.resolve(__dirname, '../controllers/routes/corporate/candidateCardDetails.js');

function setup(overrides = {}) {
  const state = {
    company: { _id: companyId, unmasked: [] },
    applications: [], hiring: null,
    candidate: { name: 'Candidate', highestQualification: { name: 'B.Tech' }, personalInfo: { resume: [{ name: 'Resume', url: 'resumes/private.pdf' }] } },
    ...overrides,
  };
  const calls = [];
  function query(model, value, filter) {
    calls.push({ model, filter });
    return {
      select() { return this; },
      populate(options) { calls.push({ model, populate: options }); return this; },
      lean() { return Promise.resolve(value); },
    };
  }
  const models = {
    Company: { findOne: filter => query('Company', state.company, filter) },
    AppliedJobs: { find: filter => query('AppliedJobs', state.applications, filter) },
    HiringStatus: { findOne: filter => query('HiringStatus', state.hiring, filter) },
    Candidate: { findOne: filter => query('Candidate', state.candidate, filter) },
    CandidateProfile: { findOne: filter => query('CandidateProfile', state.candidate, filter) },
  };
  const sandbox = {
    module: { exports: {} }, URL,
    require(name) {
      if (name === 'mongoose') return require('mongoose');
      if (name === '../../models') return models;
      if (name === '../../../helpers/s3Storage') return { getBucketBaseUrl: () => 'https://files.example.test' };
      throw new Error('Unexpected dependency: ' + name);
    },
  };
  vm.runInNewContext(fs.readFileSync(handlerPath, 'utf8'), sandbox, { filename: handlerPath });
  return {
    calls,
    async run(query = {}, id = candidateId) {
      const result = { code: 200, headers: {} };
      const response = {
        set(name, value) { result.headers[name] = value; return this; },
        status(code) { result.code = code; return this; },
        json(body) { result.body = body; return this; },
      };
      await sandbox.module.exports({ params: { candidateId: id }, query, companyUser: userId }, response);
      return result;
    },
  };
}

test('invalid identifiers are rejected before querying records', async () => {
  const app = setup();
  assert.equal((await app.run({}, 'invalid')).code, 400);
  assert.equal((await app.run({ applicationId: 'invalid' })).code, 400);
  assert.equal(app.calls.length, 0);
});

test('a company record is required for document access', async () => {
  const app = setup({ company: null });
  assert.equal((await app.run()).code, 404);
  assert.equal(app.calls.length, 1);
});

test('another company application cannot fall back to candidate-wide documents', async () => {
  const app = setup({ hiring: { status: 'shortlisted' } });
  const result = await app.run({ applicationId, source: 'profile' });
  assert.equal(result.code, 404);
  const filter = app.calls.find(call => call.model === 'AppliedJobs' && call.filter).filter;
  assert.equal(filter._company, companyId);
  assert.equal(filter._candidate, candidateId);
  assert.equal(filter._id, applicationId);
  assert.ok(!app.calls.some(call => call.model === 'CandidateProfile'));
});

test('masked candidates never return resume URLs or application documents', async () => {
  const app = setup({ applications: [{ _id: applicationId, _job: { title: 'Job' }, documents: [{ name: 'ID', fileUrl: 'private-id.pdf' }] }] });
  const result = await app.run({ source: 'profile' });
  assert.equal(result.code, 200);
  assert.equal(result.body.documentsLocked, true);
  assert.equal(result.body.documents.length, 0);
  assert.ok(!JSON.stringify(result.body).includes('private'));
  assert.equal(result.headers['Cache-Control'], 'private, no-store');
});

test('unlocked candidates return own application uploads and missing required documents', async () => {
  const app = setup({
    hiring: { status: 'interview due' },
    applications: [{
      _id: applicationId,
      _job: { title: 'Sales', docsRequired: [{ _id: 'd1', Name: 'Degree', mandatory: true }, { _id: 'd2', Name: 'Certificate', mandatory: true }] },
      documents: [{ key: 'd1', name: 'Degree', fileUrl: 'job-docs/degree.pdf' }],
    }, { _id: 'foreign-job', _job: null, documents: [{ name: 'Foreign file', fileUrl: 'foreign.pdf' }] }],
  });
  const result = await app.run({ applicationId, source: 'profile' });
  assert.equal(result.body.documentsLocked, false);
  assert.ok(result.body.documents.some(doc => doc.url === 'https://files.example.test/resumes/private.pdf'));
  assert.ok(result.body.documents.some(doc => doc.name === 'Degree' && doc.status === 'Uploaded'));
  assert.ok(result.body.documents.some(doc => doc.name === 'Certificate' && doc.status === 'Not uploaded' && doc.mandatory));
  assert.ok(!JSON.stringify(result.body).includes('foreign.pdf'));
  assert.equal(app.calls.find(call => call.model === 'AppliedJobs' && call.populate).populate.match._company, companyId);
});

test('unsafe document URLs are never returned as clickable files', async () => {
  const app = setup({
    company: { _id: companyId, unmasked: [candidateId] },
    candidate: { name: 'Candidate', resume: 'javascript:alert(1)', personalInfo: { resume: [{ url: '../secret.pdf' }, { url: '//evil.example/file.pdf' }] } },
  });
  const result = await app.run();
  assert.equal(result.code, 200);
  assert.ok(result.body.documents.every(doc => doc.url === '' && doc.status === 'Not uploaded'));
});

test('hidden candidates without a company relationship are not returned', async () => {
  const app = setup({ candidate: { name: 'Hidden candidate', visibility: false } });
  const result = await app.run();
  assert.equal(result.code, 404);
});

