/** Legacy folder prefix only — do NOT use /^upload/ (breaks keys like uploads/...) */
const UPLOAD_DOC_FOLDER_PREFIX = /^Documents for course\/?/i;

const normalizeStorageKey = (path) =>
  String(path)
    .trim()
    .replace(/\{\s*_id:\s*new ObjectId\('([a-f0-9]{24})'\)\s*\}/gi, '$1')
    .replace(UPLOAD_DOC_FOLDER_PREFIX, '');

function getMediaBaseUrl(explicitBucketUrl) {
  const fromEnv = (explicitBucketUrl || process.env.REACT_APP_MIPIE_BUCKET_URL || '').replace(/\/$/, '');
  if (fromEnv && !fromEnv.includes('localhost:3000')) {
    return fromEnv;
  }
  const backend = (process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');
  return `${backend}/upload`;
}

function extractStorageKey(path, bucketUrl) {
  if (!path) return '';
  let key = String(path).trim();
  if (key.startsWith('blob:')) return key;

  const base = getMediaBaseUrl(bucketUrl);
  const bases = [
    base,
    (process.env.REACT_APP_MIPIE_BUCKET_URL || '').replace(/\/$/, ''),
    `${(process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '')}/upload`,
  ].filter(Boolean);

  if (/^https?:\/\//i.test(key)) {
    let stripped = false;
    for (const b of bases) {
      if (key.startsWith(b)) {
        key = key.slice(b.length);
        stripped = true;
        break;
      }
    }
    if (!stripped) {
      const s3Match = key.match(/amazonaws\.com\/(.+)$/i);
      if (s3Match) {
        key = decodeURIComponent(s3Match[1]);
      } else {
        const uploadMatch = key.match(/\/upload\/(.+)$/i);
        if (uploadMatch) {
          key = decodeURIComponent(uploadMatch[1]);
        } else {
          return key;
        }
      }
    }
  }

  return normalizeStorageKey(key).replace(/^\//, '');
}


export function resolveMediaUrl(bucketUrl, path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = String(path).trim();
  if (trimmed.startsWith('blob:')) return trimmed;

  const key = extractStorageKey(trimmed, bucketUrl);
  if (!key || key.startsWith('blob:')) return key;
  if (/^https?:\/\//i.test(key)) return key;

  const base = getMediaBaseUrl(bucketUrl);
  return base ? `${base}/${key}` : key;
}

export default resolveMediaUrl;
