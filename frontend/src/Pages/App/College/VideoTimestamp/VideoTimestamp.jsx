import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

const pad2 = (n) => String(n).padStart(2, '0');

const toDateTimeLocalValue = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad2(hours)}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${ampm}`;
};

const getVideoTimestamp = (startDateTime, elapsedSeconds) => {
  const start = new Date(startDateTime);
  return formatDateTime(new Date(start.getTime() + elapsedSeconds * 1000));
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

const formatVideoTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${pad2(s)}`;
};

const formatAssTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
};

const escapeAssText = (text) => String(text || '').replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/\n/g, '\\N');

const generateAssSubtitles = (config, width, height, duration) => {
  const smallFs = config.fontSizeSmall ?? 13;
  const largeFs = config.fontSizeLarge ?? 28;
  const posX = Math.round((config.overlayLeftPercent / 100) * width);
  const posY = Math.round((config.overlayTopPercent / 100) * height);
  const totalSeconds = Math.max(1, Math.ceil(duration));

  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'WrapStyle: 0',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Small,Arial,${smallFs},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,9,10,10,10,1`,
    `Style: Large,Arial,${largeFs},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,9,10,10,10,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const events = [];
  for (let sec = 0; sec < totalSeconds; sec += 1) {
    const start = formatAssTime(sec);
    const end = formatAssTime(sec + 1);
    const timeLine = escapeAssText(getVideoTimestamp(config.startDateTime, sec));
    const dirLine = escapeAssText(getDirectionDisplayLine(config.directionDegrees, config.compass, sec));
    const indexLine = config.indexNumber
      ? escapeAssText(`Index number: ${config.indexNumber}`)
      : '';
    const locLine = config.location ? escapeAssText(`📍 ${config.location}`) : '';

    const posTag = `{\\an9\\pos(${posX},${posY})}`;
    const lines = [
      `${posTag}{\\rSmall}${timeLine}`,
      `{\\rLarge}${dirLine}`,
    ];
    if (indexLine) lines.push(`{\\rSmall}${indexLine}`);
    if (locLine) lines.push(`{\\rSmall}${locLine}`);

    events.push(`Dialogue: 0,${start},${end},Small,,0,0,0,,${lines.join('\\N')}`);
  }

  return [...header, ...events].join('\n');
};

const overlayLineStyle = {
  whiteSpace: 'nowrap',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 700,
  lineHeight: 1.25,
};

const VideoPreview = ({ config, videoUrl, overlayTopPercent, overlayLeftPercent }) => {
  const videoRef = useRef(null);
  const [displayTime, setDisplayTime] = useState(() => formatDateTime(new Date(config.startDateTime)));
  const [displayDirection, setDisplayDirection] = useState(() =>
    getDirectionDisplayLine(config.directionDegrees, config.compass, 0)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setDisplayTime(formatDateTime(new Date(config.startDateTime)));
    setDisplayDirection(getDirectionDisplayLine(config.directionDegrees, config.compass, 0));
  }, [videoUrl, config.startDateTime, config.directionDegrees, config.compass]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return undefined;

    const sync = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      setDuration(video.duration || 0);
      setDisplayTime(getVideoTimestamp(config.startDateTime, t));
      setDisplayDirection(getDirectionDisplayLine(config.directionDegrees, config.compass, t));
    };

    video.addEventListener('timeupdate', sync);
    video.addEventListener('loadedmetadata', sync);
    video.addEventListener('seeked', sync);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
    video.addEventListener('ended', () => setIsPlaying(false));
    sync();

    return () => {
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('loadedmetadata', sync);
      video.removeEventListener('seeked', sync);
    };
  }, [videoUrl, config.startDateTime, config.directionDegrees, config.compass]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
  };

  const restartPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
  };

  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          background: '#2a2a2a',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
              playsInline
              onClick={togglePlay}
            />
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  fontSize: 28,
                  cursor: 'pointer',
                  zIndex: 5,
                }}
              >
                ▶
              </button>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            Upload a video to preview
          </div>
        )}

        {videoUrl && (
          <div
            style={{
              position: 'absolute',
              top: `${overlayTopPercent}%`,
              left: `${overlayLeftPercent}%`,
              transform: 'translateX(-100%)',
              textAlign: 'right',
              color: '#fff',
              width: 'max-content',
              pointerEvents: 'none',
              padding: config.enableBackground ? '10px 14px' : 0,
              borderRadius: 6,
              background: config.enableBackground ? 'rgba(30,30,30,0.75)' : 'transparent',
            }}
          >
            <div style={{ ...overlayLineStyle, fontSize: config.fontSizeSmall ?? 13, marginBottom: 4 }}>{displayTime}</div>
            <div style={{ ...overlayLineStyle, fontSize: config.fontSizeLarge ?? 28, lineHeight: 1.1, marginBottom: 4 }}>
              {displayDirection}
            </div>
            {config.indexNumber && (
              <div style={{ ...overlayLineStyle, fontSize: config.fontSizeSmall ?? 13, marginBottom: 2 }}>
                Index number: {config.indexNumber}
              </div>
            )}
            {config.location && (
              <div style={{ ...overlayLineStyle, fontSize: config.fontSizeSmall ?? 13 }}>
                <span style={{ color: '#e74c3c' }}>📍</span> {config.location}
              </div>
            )}
          </div>
        )}
      </div>

      {videoUrl && (
        <div className="mt-3">
          <label className="form-label text-white fw-bold mb-2">Preview Controls</label>
          <div className="d-flex align-items-center gap-2 flex-wrap" style={{ background: '#f8f9fa', borderRadius: 8, padding: '10px 12px', border: '1px solid #dee2e6' }}>
            <button type="button" className="btn btn-sm btn-primary" onClick={togglePlay}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={restartPreview}>↺ Restart</button>
            <span className="text-dark small fw-semibold">{formatVideoTime(currentTime)}</span>
            <input type="range" className="form-range flex-grow-1" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={handleSeek} disabled={!duration} />
            <span className="text-muted small">{formatVideoTime(duration)}</span>
          </div>
          <small className="text-white-50 d-block mt-2">
            Preview normal speed par chalega. Timestamp video ki length ke hisaab se sync hai — frame-by-frame nahi.
          </small>
        </div>
      )}
    </div>
  );
};

function VideoTimestamp() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoMeta, setVideoMeta] = useState({ width: 1280, height: 720, duration: 0 });
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const ffmpegRef = useRef(null);

  const [config, setConfig] = useState({
    startDateTime: toDateTimeLocalValue(new Date()),
    directionDegrees: '52',
    compass: 'NE',
    indexNumber: '1167',
    location: 'Roorkee, Uttarakhand',
    enableBackground: false,
    overlayTopPercent: 3,
    overlayLeftPercent: 97,
    fontSizeSmall: 13,
    fontSizeLarge: 28,
  });

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const loadFfmpeg = useCallback(async () => {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress: p }) => {
      setProgress(Math.min(99, Math.round(p * 100)));
    });

    const baseURL = `${window.location.origin}${process.env.PUBLIC_URL || ''}/ffmpeg`;
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    });

    ffmpegRef.current = ffmpeg;
    setFfmpegReady(true);
    return ffmpeg;
  }, []);

  const invalidateOutput = () => {
    setRecordedBlob(null);
    setProgress(0);
  };

  const updateConfig = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    invalidateOutput();
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    invalidateOutput();
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.src = url;
    probe.onloadedmetadata = () => {
      setVideoMeta({
        width: probe.videoWidth || 1280,
        height: probe.videoHeight || 720,
        duration: probe.duration || 0,
      });
    };
  };

  const processVideo = async () => {
    if (!videoFile || !videoUrl) {
      toast.error('Pehle video upload karein');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = await loadFfmpeg();
      const inputName = `input${videoFile.name.includes('.') ? videoFile.name.slice(videoFile.name.lastIndexOf('.')) : '.mp4'}`;
      const assContent = generateAssSubtitles(
        config,
        videoMeta.width,
        videoMeta.height,
        videoMeta.duration
      );

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      await ffmpeg.writeFile('overlay.ass', new TextEncoder().encode(assContent));

      await ffmpeg.exec([
        '-i', inputName,
        '-vf', 'ass=overlay.ass',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        'output.mp4',
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      setRecordedBlob(blob);
      setProgress(100);
      toast.success('Video ready! Ab download turant hoga — normal speed par.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Video process failed');
    } finally {
      setProcessing(false);
    }
  };

  const downloadVideo = () => {
    if (!recordedBlob || !videoFile) {
      toast.error('Pehle "Apply Timestamp" dabao');
      return;
    }
    saveAs(recordedBlob, `timestamped_${videoFile.name.replace(/\.[^.]+$/, '')}.mp4`);
    toast.success('Video downloaded!');
  };

  return (
    <div className="content-wrapper container-xxl p-0">
      <div className="content-body">
        <div className="row">
          <div className="col-12">
            <h4 className="mb-2">Video Timestamp Editor</h4>
            <p className="text-muted mb-3">
              Video normal speed par preview karein. Timestamp video timeline par sync hoke lagta hai (FFmpeg).
            </p>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12">
            <div className="card" style={{ background: '#1e1e1e', border: '1px solid #333' }}>
              <div className="card-body">
                <label className="form-label text-white fw-bold">Upload Video</label>
                <input type="file" className="form-control" accept="video/*" onChange={handleVideoUpload} disabled={processing} />
                {videoFile && (
                  <small className="text-muted d-block mt-1">
                    Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    {videoMeta.duration > 0 && ` · ${formatVideoTime(videoMeta.duration)}`}
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card" style={{ background: '#1e1e1e', border: '1px solid #333' }}>
              <div className="card-body">
                <h5 className="text-white mb-3">Preview</h5>
                <VideoPreview
                  config={config}
                  videoUrl={videoUrl}
                  overlayTopPercent={config.overlayTopPercent}
                  overlayLeftPercent={config.overlayLeftPercent}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card" style={{ background: '#1e1e1e', border: '1px solid #333' }}>
              <div className="card-body">
                <h5 className="text-white mb-3">Edit overlay</h5>

                <div className="mb-3">
                  <label className="form-label text-white-50 small">Start Date &amp; Time</label>
                  <input type="datetime-local" step="1" className="form-control bg-dark text-white border-secondary" value={config.startDateTime} onChange={(e) => updateConfig('startDateTime', e.target.value)} disabled={processing} />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small d-flex justify-content-between">
                    <span>Vertical Position</span><span className="text-white">{config.overlayTopPercent}%</span>
                  </label>
                  <input type="range" className="form-range" min={0} max={85} value={config.overlayTopPercent} onChange={(e) => updateConfig('overlayTopPercent', Number(e.target.value))} disabled={processing} />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small d-flex justify-content-between">
                    <span>Horizontal Position</span><span className="text-white">{config.overlayLeftPercent}%</span>
                  </label>
                  <input type="range" className="form-range" min={5} max={100} value={config.overlayLeftPercent} onChange={(e) => updateConfig('overlayLeftPercent', Number(e.target.value))} disabled={processing} />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small d-flex justify-content-between">
                    <span>Small Text Size</span><span className="text-white">{config.fontSizeSmall}px</span>
                  </label>
                  <input type="range" className="form-range" min={8} max={36} value={config.fontSizeSmall} onChange={(e) => updateConfig('fontSizeSmall', Number(e.target.value))} disabled={processing} />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small d-flex justify-content-between">
                    <span>Large Text Size</span><span className="text-white">{config.fontSizeLarge}px</span>
                  </label>
                  <input type="range" className="form-range" min={16} max={80} value={config.fontSizeLarge} onChange={(e) => updateConfig('fontSizeLarge', Number(e.target.value))} disabled={processing} />
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label text-white-50 small">Direction (°)</label>
                    <input type="number" className="form-control bg-dark text-white border-secondary" value={parseDirectionBase(config.directionDegrees)} onChange={(e) => updateConfig('directionDegrees', e.target.value)} min={0} max={360} disabled={processing} />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-white-50 small">Compass</label>
                    <input type="text" className="form-control bg-dark text-white border-secondary" value={config.compass} onChange={(e) => updateConfig('compass', e.target.value)} disabled={processing} />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small">Index number</label>
                  <input type="text" className="form-control bg-dark text-white border-secondary" value={config.indexNumber} onChange={(e) => updateConfig('indexNumber', e.target.value)} disabled={processing} />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50 small">Location</label>
                  <input type="text" className="form-control bg-dark text-white border-secondary" value={config.location} onChange={(e) => updateConfig('location', e.target.value)} disabled={processing} />
                </div>

                {processing && (
                  <div className="mb-3">
                    <div className="progress" style={{ height: 8 }}>
                      <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${progress}%` }} />
                    </div>
                    <small className="text-white-50">{ffmpegReady ? `Processing... ${progress}%` : 'FFmpeg load ho raha hai...'}</small>
                  </div>
                )}

                {recordedBlob && !processing && (
                  <div className="alert alert-success py-2 small mb-3">✓ Video ready — normal speed, turant download</div>
                )}

                <button type="button" className="btn btn-warning w-100 mb-2" onClick={processVideo} disabled={!videoFile || processing}>
                  {processing ? 'Processing...' : 'Apply Timestamp'}
                </button>
                <button type="button" className="btn btn-success w-100" onClick={downloadVideo} disabled={!recordedBlob || processing}>
                  ⬇ Download Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoTimestamp;
