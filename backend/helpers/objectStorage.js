const fs = require('fs');
const path = require('path');
const { getBucketBaseUrl, normalizeStorageKey } = require('./s3Storage');

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR
  || path.resolve(__dirname, '..', 'public', 'upload');
// console.log("Upload Dir", UPLOAD_DIR)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function getUploadDir() {
  return UPLOAD_DIR;
}

function resolveLocalPath(key) {
  const normalized = normalizeStorageKey(key);
  if (!normalized) throw new Error('Invalid storage key');

  const fullPath = path.join(UPLOAD_DIR, normalized);
  const resolved = path.resolve(fullPath);
  const root = path.resolve(UPLOAD_DIR);

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Invalid storage key');
  }

  return resolved;
}

function buildUploadResult(key) {
  const normalizedKey = normalizeStorageKey(key);
  const base = getBucketBaseUrl();
  return {
    Key: normalizedKey,
    Location: base ? `${base}/${normalizedKey}` : normalizedKey,
    Bucket: process.env.AWS_BUCKET_NAME || 'local',
  };
}

async function writeObject(params) {
  const filePath = resolveLocalPath(params.Key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const body = Buffer.isBuffer(params.Body) ? params.Body : Buffer.from(params.Body);
  await fs.promises.writeFile(filePath, body);

  return buildUploadResult(params.Key);
}

function upload(params, callback) {
  const run = () => writeObject(params);

  if (typeof callback === 'function') {
    run()
      .then((data) => callback(null, data))
      .catch((err) => callback(err));
  }

  const promise = run();

  return {
    promise: () => promise,
    then(onFulfilled, onRejected) {
      return promise.then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return promise.catch(onRejected);
    },
  };
}

function putObject(params, callback) {
  if (typeof callback === 'function') {
    writeObject(params)
      .then((data) => callback(null, data))
      .catch((err) => callback(err));
    return;
  }

  return {
    promise: () => writeObject(params),
  };
}

function getObject(params) {
  return {
    promise: async () => {
      const filePath = resolveLocalPath(params.Key);
      const Body = await fs.promises.readFile(filePath);
      return { Body };
    },
  };
}

function deleteObject(params, callback) {
  const filePath = resolveLocalPath(params.Key);

  fs.unlink(filePath, (err) => {
    if (err && err.code === 'ENOENT') {
      if (callback) callback(null, {});
      return;
    }
    if (callback) callback(err, err ? null : {});
  });
}

function buildPublicUrl(key) {
  const normalizedKey = normalizeStorageKey(key);
  const base = getBucketBaseUrl();
  return base ? `${base}/${normalizedKey}` : `/${normalizedKey}`;
}

function getSignedUrl(_operation, params, callback) {
  const url = buildPublicUrl(params.Key);

  if (typeof callback === 'function') {
    callback(null, url);
    return url;
  }

  return url;
}

function getSignedUrlPromise(operation, params) {
  return Promise.resolve(buildPublicUrl(params.Key));
}

module.exports = {
  upload,
  putObject,
  getObject,
  deleteObject,
  getSignedUrl,
  getSignedUrlPromise,
  getUploadDir,
  buildPublicUrl,
};
