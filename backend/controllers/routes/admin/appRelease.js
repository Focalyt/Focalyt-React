const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const { AppRelease } = require('../../models');
const { isAdmin } = require('../../../helpers');
const { bucketName, bucketURL } = require('../../../config');

const router = express.Router();
router.use(isAdmin);

const ANDROID_GRADLE_PATH = path.join(
  __dirname,
  '../../../../androidApp/android/app/build.gradle',
);

function readAppSourceVersion() {
  try {
    if (!fs.existsSync(ANDROID_GRADLE_PATH)) {
      return null;
    }
    const gradle = fs.readFileSync(ANDROID_GRADLE_PATH, 'utf8');
    const codeMatch = gradle.match(/versionCode\s+(\d+)/);
    const nameMatch = gradle.match(/versionName\s+"([^"]+)"/);
    if (!codeMatch && !nameMatch) {
      return null;
    }
    return {
      versionCode: codeMatch ? parseInt(codeMatch[1], 10) : null,
      versionName: nameMatch ? nameMatch[1] : null,
    };
  } catch {
    return null;
  }
}

function resolveUploadVersion(lastRelease) {
  const autoVersion = readAppSourceVersion();
  const lastCode = lastRelease?.versionCode ?? 0;

  if (!autoVersion?.versionCode || !autoVersion?.versionName) {
    return {
      autoVersion,
      canUpload: false,
      uploadBlockedReason:
        'build.gradle me versionCode / versionName nahi mila. Pehle androidApp/android/app/build.gradle update karein.',
    };
  }

  if (autoVersion.versionCode <= lastCode) {
    return {
      autoVersion,
      canUpload: false,
      uploadBlockedReason: `build.gradle ka versionCode ${autoVersion.versionCode} hai, lekin last upload ${lastCode} hai. build.gradle me versionCode ${lastCode + 1} (ya zyada) set karke APK dubara build karein.`,
    };
  }

  return {
    autoVersion,
    canUpload: true,
    uploadBlockedReason: null,
  };
}

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION_NAME,
});

router.route('/').get(async (req, res) => {
  try {
    const releases = await AppRelease.find({ platform: 'android' })
      .sort({ versionCode: -1 })
      .limit(20)
      .lean();

    const lastRelease = releases[0] || null;
    const { autoVersion, canUpload, uploadBlockedReason } =
      resolveUploadVersion(lastRelease);

    return res.render(`${req.vPath}/admin/appRelease`, {
      menu: 'appRelease',
      releases,
      lastRelease,
      autoVersion,
      canUpload,
      uploadBlockedReason,
      form: {
        releaseNotes: '',
        forceUpdate: true,
      },
    });
  } catch (err) {
    req.flash('error', err.message || 'Something went wrong!');
    return res.redirect('/admin');
  }
});

router.post('/upload', async (req, res) => {
  try {
    const releaseNotes = String(req.body.releaseNotes || '').trim();
    const forceUpdate = req.body.forceUpdate === 'on' || req.body.forceUpdate === 'true';

    const lastRelease = await AppRelease.findOne({ platform: 'android' })
      .sort({ versionCode: -1 })
      .lean();
    const { autoVersion, canUpload, uploadBlockedReason } =
      resolveUploadVersion(lastRelease);

    if (!canUpload || !autoVersion) {
      throw new Error(uploadBlockedReason || 'Version auto-detect failed');
    }

    const versionCode = autoVersion.versionCode;
    const versionName = autoVersion.versionName;

    const file = req.files?.apk;
    if (!file) {
      throw new Error('APK file is required');
    }

    const originalName = file.name || 'app-release.apk';
    const ext = path.extname(originalName).toLowerCase() || '.apk';
    if (ext !== '.apk') {
      throw new Error('Only .apk files are allowed');
    }

    const key = `app-releases/android/focalyt-v${versionCode}-${uuidv4()}${ext}`;
    const uploadResult = await s3
      .upload({
        Bucket: bucketName,
        Key: key,
        Body: file.data,
        ContentType: 'application/vnd.android.package-archive',
      })
      .promise();

    const apkUrl = key;

    await AppRelease.updateMany(
      { platform: 'android', isActive: true },
      { $set: { isActive: false } },
    );

    await AppRelease.create({
      platform: 'android',
      versionCode,
      versionName,
      apkKey: key,
      apkUrl,
      releaseNotes,
      forceUpdate,
      isActive: true,
      fileSizeBytes: file.size,
      uploadedBy: req.session.user?._id,
    });

    req.flash(
      'success',
      `Android v${versionName} (code ${versionCode}) published. Users on older versions will be prompted to update.`,
    );
    return res.redirect('/admin/appRelease');
  } catch (err) {
    console.error('APK upload error:', err);
    req.flash('error', err.message || 'Failed to upload APK');
    return res.redirect('/admin/appRelease');
  }
});

router.post('/:id/toggle', async (req, res) => {
  try {
    const release = await AppRelease.findById(req.params.id);
    if (!release) {
      req.flash('error', 'Release not found');
      return res.redirect('/admin/appRelease');
    }

    if (!release.isActive) {
      await AppRelease.updateMany(
        { platform: 'android', isActive: true },
        { $set: { isActive: false } },
      );
      release.isActive = true;
    } else {
      release.isActive = false;
    }
    await release.save();

    req.flash('success', 'Release status updated');
    return res.redirect('/admin/appRelease');
  } catch (err) {
    req.flash('error', err.message || 'Update failed');
    return res.redirect('/admin/appRelease');
  }
});

module.exports = router;
