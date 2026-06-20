const uuid = require('uuid/v1');

/** Top-level folder for course registration / KYC documents on disk and in URLs. */
const COURSE_DOCUMENTS_ROOT = 'Documents for course';

/** Safe folder/file segment from human-readable text. */
function slugify(text, fallback = 'unknown') {
  if (!text && text !== 0) return fallback;
  const slug = String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}

/**
 * Candidate KYC / registration documents — easy to browse on disk.
 * Example:
 *   candidates/rahul-sharma-9876543210/courses/bca-degree/documents/aadhaar-card/20250609-uuid.pdf
 */
function buildCandidateDocumentKey({
  candidateName,
  candidateMobile,
  courseName,
  docName,
  ext,
}) {
  const mobilePart = candidateMobile
    ? `-${String(candidateMobile).replace(/\D/g, '').slice(-10)}`
    : '';
  const candidateFolder = `${slugify(candidateName, 'candidate')}${mobilePart}`;
  const courseFolder = slugify(courseName, 'course');
  const docFolder = slugify(docName, 'document');
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return `candidates/${candidateFolder}/courses/${courseFolder}/documents/${docFolder}/${stamp}-${uuid()}.${ext}`;
}

/**
 * Full storage key for course documents (served at /api/upload/Documents%20for%20course/...).
 * Example:
 *   Documents for course/candidates/rahul-sharma-9876543210/courses/bca-degree/documents/aadhaar-card/20250609-uuid.pdf
 */
function buildCourseDocumentKey(opts) {
  return `${COURSE_DOCUMENTS_ROOT}/${buildCandidateDocumentKey(opts)}`;
}

module.exports = {
  COURSE_DOCUMENTS_ROOT,
  slugify,
  buildCandidateDocumentKey,
  buildCourseDocumentKey,
};
