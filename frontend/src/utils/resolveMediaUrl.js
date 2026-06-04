/** Legacy folder prefix only — do NOT use /^upload/ (breaks keys like uploads/...) */
const UPLOAD_DOC_FOLDER_PREFIX = /^Documents for course\/?/i;

const normalizeStorageKey = (path) =>
  String(path)
    .trim()
    .replace(/\{\s*_id:\s*new ObjectId\('([a-f0-9]{24})'\)\s*\}/gi, '$1')
    .replace(UPLOAD_DOC_FOLDER_PREFIX, '');
/**
 * Resolve a stored S3 key (or legacy full URL) to a browser-loadable URL.
 * @param {string} bucketUrl - REACT_APP_MIPIE_BUCKET_URL
 * @param {string} path - S3 key or full https URL
 */
export function resolveMediaUrl(bucketUrl, path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = normalizeStorageKey(path);
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const base = (bucketUrl || '').replace(/\/$/, '');
  const key = trimmed.replace(/^\//, '');
  return base ? `${base}/${key}` : key;
}

export default resolveMediaUrl;
