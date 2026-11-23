const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedClubMediaUrl, isValidObjectId } = require('./clubSocketAuth');

describe('clubSocketAuth media URL allowlist', () => {
  it('allows empty and relative upload paths', () => {
    assert.equal(isAllowedClubMediaUrl(''), true);
    assert.equal(isAllowedClubMediaUrl('/uploads/club/photo.jpg'), true);
    assert.equal(isAllowedClubMediaUrl('/club-media/a.png'), true);
  });

  it('rejects javascript and data URLs', () => {
    assert.equal(isAllowedClubMediaUrl('javascript:alert(1)'), false);
    assert.equal(isAllowedClubMediaUrl('data:image/png;base64,abc'), false);
  });

  it('allows known storage hosts and rejects unknown hosts', () => {
    assert.equal(isAllowedClubMediaUrl('https://my-bucket.s3.amazonaws.com/a.jpg'), true);
    assert.equal(isAllowedClubMediaUrl('https://cdn.focalyt.com/a.jpg'), true);
    assert.equal(isAllowedClubMediaUrl('https://evil.example.com/a.jpg'), false);
  });

  it('allows custom hosts when provided', () => {
    assert.equal(isAllowedClubMediaUrl('https://media.partner.test/x.png', ['partner.test']), true);
  });
});

describe('clubSocketAuth object id check', () => {
  it('accepts only 24-hex ids', () => {
    assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true);
    assert.equal(isValidObjectId('not-an-id'), false);
    assert.equal(isValidObjectId(''), false);
  });
});
