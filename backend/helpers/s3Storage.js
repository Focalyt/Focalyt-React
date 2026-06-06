const { fileURL, bucketURL } = require('../config');

/** Public CDN / bucket base URL (no trailing slash). */
function getBucketBaseUrl() {
  return (process.env.MIPIE_BUCKET_URL || fileURL || bucketURL || '').replace(/\/$/, '');
}

/**
 * Normalize any stored media value to an S3 object key (relative path).
 * Accepts full https URLs, bucket-prefixed paths, or keys.
 */
function normalizeStorageKey(value) {
  if (!value || typeof value !== 'string') return value;
  let key = value.trim();
  const bucketUrl = getBucketBaseUrl();
  if (bucketUrl && key.startsWith(bucketUrl)) {
    key = key.slice(bucketUrl.length).replace(/^\//, '');
  }
  const s3Match = key.match(/amazonaws\.com\/(.+)$/i);
  if (s3Match) key = s3Match[1];
  return key.replace(/^\//, '');
}

/** Prefer explicit key, then upload result Key, else derive key from Location. */
function storageKeyFromUpload(uploadResult, explicitKey) {
  if (explicitKey) return normalizeStorageKey(explicitKey);
  if (uploadResult?.Key) return normalizeStorageKey(uploadResult.Key);
  if (uploadResult?.Location) return normalizeStorageKey(uploadResult.Location);
  return '';
}

/** Build a public URL for external APIs (WhatsApp, email links). DB should store keys only. */
function resolvePublicUrl(storageKeyOrUrl) {
  if (!storageKeyOrUrl || typeof storageKeyOrUrl !== 'string') return '';
  if (/^https?:\/\//i.test(storageKeyOrUrl.trim())) {
    return storageKeyOrUrl.trim();
  }
  const key = normalizeStorageKey(storageKeyOrUrl);
  if (!key) return '';
  const base = getBucketBaseUrl();
  return base ? `${base}/${key}` : key;
}

module.exports = {
  getBucketBaseUrl,
  normalizeStorageKey,
  storageKeyFromUpload,
  resolvePublicUrl,
};
