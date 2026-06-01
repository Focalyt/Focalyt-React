import { useEffect, useState } from 'react';
import axios from 'axios';
import './AppDownloadBanner.css';

/**
 * Latest APK from admin App Release — GET /api/app/download
 */
export default function AppDownloadBanner({ variant = 'footer' }) {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [appDownload, setAppDownload] = useState(null);
  const [loading, setLoading] = useState(true);

  const apkHref = backendUrl
    ? `${backendUrl.replace(/\/$/, '')}/api/app/download/apk?platform=android`
    : null;

  useEffect(() => {
    const fetchAppDownload = async () => {
      if (!backendUrl) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${backendUrl}/api/app/download`, {
          params: { platform: 'android' },
        });
        if (res.data?.status && res.data?.data?.available) {
          setAppDownload(res.data.data);
        } else {
          setAppDownload(null);
        }
      } catch (err) {
        console.error('App download info:', err);
        setAppDownload(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAppDownload();
  }, [backendUrl]);

  if (!apkHref) {
    return null;
  }

  const sizeLabel = appDownload?.fileSizeBytes
    ? ` · ${(appDownload.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
    : '';

  const rootClass =
    variant === 'footer'
      ? 'foc-app-download foc-app-download--footer'
      : 'foc-app-download';

  return (
    <div className={rootClass}>
      <div className="foc-app-download__icon" aria-hidden="true">
        <i className="fa-brands fa-android" />
      </div>
      <div className="foc-app-download__text">
        <span className="foc-app-download__title">Download Android App</span>
        <span className="foc-app-download__meta">
          {appDownload?.versionName ? `v${appDownload.versionName}${sizeLabel}` : 'Latest version'}
        </span>
      </div>
      <a
        href={apkHref}
        className="foc-app-download__btn"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="fa-solid fa-download" aria-hidden="true" /> APK
      </a>
    </div>
  );
}
