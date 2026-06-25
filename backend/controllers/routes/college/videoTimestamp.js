const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const { isCollege } = require('../../../helpers');

const router = express.Router();
router.use(isCollege);

const FONT_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'fonts');
const FONT_FILE = 'fonts/arial.ttf';

const pad2 = (n) => String(n).padStart(2, '0');

const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad2(hours)}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${ampm}`;
};

const parseDirectionBase = (val) => {
  const n = parseInt(String(val).replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

const getFluctuatedDirectionDegrees = (baseValue, elapsedSeconds) => {
  const base = parseDirectionBase(baseValue);
  const bucket = Math.floor(elapsedSeconds * 2.5);
  const pattern = [0, 1, 0, -1, 0, 0, 1, -1, 0, -1, 0, 1, 0, 0, -1, 1];
  return `${base + pattern[bucket % pattern.length]}°`;
};

const getDirectionDisplayLine = (directionDegrees, compass, elapsedSeconds = 0) => {
  const deg = getFluctuatedDirectionDegrees(directionDegrees, elapsedSeconds);
  const comp = String(compass || '').trim();
  return comp ? `${deg} ${comp}` : deg;
};

const escapeDrawText = (text) => String(text || '')
  .replace(/\\/g, '\\\\')
  .replace(/:/g, '\\:')
  .replace(/'/g, "'\\''")
  .replace(/,/g, '\\,')
  .replace(/%/g, '\\%');

const buildDrawtextFilter = (config, duration) => {
  const smallFs = Number(config.fontSizeSmall) || 13;
  const largeFs = Number(config.fontSizeLarge) || 28;
  const xPct = Number(config.overlayLeftPercent) / 100;
  const yPct = Number(config.overlayTopPercent) / 100;
  const startUnix = Math.floor(new Date(config.startDateTime).getTime() / 1000);
  const yBase = `h*${yPct}`;
  const xExpr = `w*${xPct}-tw`;
  const filters = [];

  filters.push(
    `drawtext=fontfile=${FONT_FILE}:fontsize=${smallFs}:fontcolor=white:borderw=2:bordercolor=black@0.5:x=${xExpr}:y=${yBase}:text='%{pts\\:localtime\\:${startUnix}\\:%b %d\\, %Y %I\\\\:%M\\\\:%S %p}'`
  );

  const dirCap = Math.min(Math.max(1, Math.ceil(Number(duration) || 1)), 60);
  for (let sec = 0; sec < dirCap; sec += 1) {
    const dirText = escapeDrawText(getDirectionDisplayLine(config.directionDegrees, config.compass, sec));
    filters.push(
      `drawtext=fontfile=${FONT_FILE}:fontsize=${largeFs}:fontcolor=white:borderw=2:bordercolor=black@0.5:x=${xExpr}:y=${yBase}+${Math.round(largeFs * 1.1)}:text='${dirText}':enable='between(t\\,${sec}\\,${sec + 0.99})'`
    );
  }

  if ((Number(duration) || 0) > dirCap) {
    const dirText = escapeDrawText(getDirectionDisplayLine(config.directionDegrees, config.compass, dirCap));
    filters.push(
      `drawtext=fontfile=${FONT_FILE}:fontsize=${largeFs}:fontcolor=white:borderw=2:bordercolor=black@0.5:x=${xExpr}:y=${yBase}+${Math.round(largeFs * 1.1)}:text='${dirText}':enable='gte(t\\,${dirCap})'`
    );
  }

  if (config.indexNumber) {
    filters.push(
      `drawtext=fontfile=${FONT_FILE}:fontsize=${smallFs}:fontcolor=white:borderw=2:bordercolor=black@0.5:x=${xExpr}:y=${yBase}+${Math.round(largeFs * 2.3)}:text='${escapeDrawText(`Index number: ${config.indexNumber}`)}'`
    );
  }

  if (config.location) {
    const locY = Math.round(largeFs * 2.3 + (config.indexNumber ? smallFs * 1.3 : 0));
    filters.push(
      `drawtext=fontfile=${FONT_FILE}:fontsize=${smallFs}:fontcolor=white:borderw=2:bordercolor=black@0.5:x=${xExpr}:y=${yBase}+${locY}:text='${escapeDrawText(config.location)}'`
    );
  }

  return filters.join(',');
};

const probeVideo = (inputPath) => new Promise((resolve, reject) => {
  const args = [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-show_entries', 'format=duration',
    '-of', 'json',
    inputPath,
  ];
  const proc = spawn(ffprobePath, args, { windowsHide: true });
  let out = '';
  proc.stdout.on('data', (d) => { out += d; });
  proc.on('close', (code) => {
    if (code !== 0) {
      reject(new Error('Video metadata read failed'));
      return;
    }
    try {
      const data = JSON.parse(out);
      const stream = data.streams?.[0] || {};
      resolve({
        width: stream.width || 1280,
        height: stream.height || 720,
        duration: parseFloat(data.format?.duration) || 0,
      });
    } catch (err) {
      reject(err);
    }
  });
});

const runFfmpeg = (args, cwd) => new Promise((resolve, reject) => {
  const proc = spawn(ffmpegPath, args, { windowsHide: true, cwd });
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('close', (code) => {
    if (code === 0) resolve(stderr);
    else reject(new Error(stderr.slice(-1200) || 'FFmpeg processing failed'));
  });
});

const cleanupDir = (dir) => {
  try {
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) { /* ignore */ }
};

const encodeVideo = async (workDir, inputName, vf) => {
  const baseArgs = [
    '-y',
    '-i', inputName,
    '-vf', vf,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
  ];

  try {
    await runFfmpeg([
      ...baseArgs,
      '-c:a', 'copy',
      '-movflags', '+faststart',
      'output.mp4',
    ], workDir);
  } catch (copyErr) {
    console.warn('Audio copy failed, re-encoding audio:', copyErr.message?.slice(0, 200));
    await runFfmpeg([
      ...baseArgs,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4',
    ], workDir);
  }
};

router.post('/apply', async (req, res) => {
  let workDir = '';

  try {
    if (!ffmpegPath) {
      return res.status(500).json({ status: false, message: 'FFmpeg not available on server' });
    }

    const upload = req.files?.video;
    if (!upload) {
      return res.status(400).json({ status: false, message: 'Video file required' });
    }

    let config = {};
    try {
      config = JSON.parse(req.body?.config || '{}');
    } catch (_) {
      return res.status(400).json({ status: false, message: 'Invalid config JSON' });
    }

    if (!config.startDateTime) {
      return res.status(400).json({ status: false, message: 'startDateTime required' });
    }

    const fontSrc = path.join(FONT_DIR, 'Arial-Bold.ttf');
    if (!fs.existsSync(fontSrc)) {
      return res.status(500).json({ status: false, message: 'Font file missing on server' });
    }

    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-ts-'));
    const ext = path.extname(upload.name || '') || '.mp4';
    const inputName = `input${ext}`;
    const inputPath = path.join(workDir, inputName);
    const outputPath = path.join(workDir, 'output.mp4');
    const fontsWorkDir = path.join(workDir, 'fonts');

    fs.mkdirSync(fontsWorkDir, { recursive: true });
    fs.copyFileSync(fontSrc, path.join(fontsWorkDir, 'arial.ttf'));
    fs.writeFileSync(inputPath, upload.data);

    let meta = { width: 1280, height: 720, duration: 0 };
    try {
      meta = await probeVideo(inputPath);
    } catch (_) {
      meta.duration = 10;
    }

    const vf = buildDrawtextFilter(config, meta.duration || 10);
    await encodeVideo(workDir, inputName, vf);

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
      throw new Error('Processed video empty');
    }

    const baseName = path.basename(upload.name || 'video', ext);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="timestamped_${baseName}.mp4"`);
    res.sendFile(outputPath, (err) => {
      cleanupDir(workDir);
      if (err && !res.headersSent) {
        res.status(500).json({ status: false, message: 'Download failed' });
      }
    });
  } catch (err) {
    cleanupDir(workDir);
    console.error('video-timestamp error:', err);
    return res.status(500).json({
      status: false,
      message: err.message || 'Video processing failed',
    });
  }
});

module.exports = router;
