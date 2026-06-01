/**
 * Resolve a stored S3 key (or legacy full URL) to a browser-loadable URL.
 * @param {string} bucketUrl - REACT_APP_MIPIE_BUCKET_URL
 * @param {string} path - S3 key or full https URL
 */
export function resolveMediaUrl(bucketUrl, path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const base = (bucketUrl || '').replace(/\/$/, '');
  const key = trimmed.replace(/^\//, '');
  return base ? `${base}/${key}` : key;
}

export default resolveMediaUrl;
