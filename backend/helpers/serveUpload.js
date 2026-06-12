const fs = require('fs');
const path = require('path');
const { getUploadDir } = require('./objectStorage');
const { normalizeStorageKey } = require('./s3Storage');

let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;
  const accessKeyId = process.env.AWS_ACCESS_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION_NAME;
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!accessKeyId || !secretAccessKey || !region || !bucketName) return null;

  const AWS = require('aws-sdk');
  s3Client = new AWS.S3({
    accessKeyId,
    secretAccessKey,
    region,
    signatureVersion: 'v4',
  });
  return s3Client;
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

async function fetchFromS3(key) {
  const s3 = getS3Client();
  if (!s3) return null;
  const bucketName = process.env.AWS_BUCKET_NAME;

  try {
    const obj = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
    return obj;
  } catch (err) {
    if (err.code !== 'NoSuchKey' && err.code !== 'NotFound') {
      console.warn('[serveUpload] S3 fallback failed:', key, err.message);
    }
    return null;
  }
}

/**
 * Serve /upload/* — local disk first, optional S3 fallback for legacy files.
 * Mount before express.static so missing local files can still load from S3.
 */
function serveUploadMiddleware(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const rawKey = decodeURIComponent(req.path.replace(/^\//, '').split('?')[0]);
  const key = normalizeStorageKey(rawKey);
  if (!key) return res.status(404).send('Not found');

  const localPath = path.join(getUploadDir(), key);

  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    res.set('Cache-Control', 'public, max-age=86400');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.sendFile(localPath);
  }

  fetchFromS3(key)
    .then((obj) => {
      if (!obj) return res.status(404).send('Not found');
      res.set('Content-Type', obj.ContentType || guessContentType(key));
      res.set('Cache-Control', 'public, max-age=3600');
      if (req.method === 'HEAD') return res.status(200).end();
      return res.send(obj.Body);
    })
    .catch(() => res.status(404).send('Not found'));
}

module.exports = serveUploadMiddleware;
