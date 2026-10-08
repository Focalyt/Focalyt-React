import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  formatDocDate,
  formatDocTime,
  getTrainerDocFileType,
  mapStandardTlmItems,
  getTlmPreviewUrl,
} from './seniorTrainerShared';

const SeniorTlmPanel = ({ session, token, backendUrl, onUpdated }) => {
  const planItems = useMemo(() => mapStandardTlmItems(session), [session]);
  const [uploadsById, setUploadsById] = useState({});

  useEffect(() => {
    setUploadsById({});
  }, [session?.id]);

  const items = useMemo(
    () => planItems.map((item) => ({ ...item, ...(uploadsById[item.id] || {}) })),
    [planItems, uploadsById]
  );

  const uploadToItem = async (id, file) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setUploadsById((prev) => ({
      ...prev,
      [id]: {
        fileName: file.name,
        fileUrl: localUrl,
        uploadedAt: new Date().toISOString(),
        uploading: true,
        error: '',
      },
    }));

    if (!token || !backendUrl || !session?.id) {
      setUploadsById((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), uploading: false, error: 'Unable to save this file' },
      }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(
        `${backendUrl}/college/session-plans/${session.id}/standard-tlm/${encodeURIComponent(id)}`,
        formData,
        { headers: { 'x-auth': token } }
      );
      if (!res.data?.status) {
        throw new Error(res.data?.message || 'Failed to upload study material');
      }
      onUpdated?.(res.data.data);
      setUploadsById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setUploadsById((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          uploading: false,
          error: err.response?.data?.message || err.message || 'Failed to upload',
        },
      }));
    }
  };

  if (!items.length) {
    return (
      <div className="st-tlm">
        <div className="st-tlm__head">
          <div>
            <strong>Standard TLM</strong>
            <span>Upload study material here. Assigned trainers will see these files on their session tab.</span>
          </div>
        </div>
        <div className="sc-evidence-empty">
          <i className="far fa-folder-open" />
          <p>No Standard TLM items in this session plan yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="st-tlm">
      <div className="st-tlm__head">
        <div>
          <strong>Standard TLM</strong>
          <span>Upload the file for each name. After you assign this session, the trainer can study these documents.</span>
        </div>
      </div>

      <div className="st-reg-docs-grid">
        {items.map((item) => {
          const inputId = `tlm-upload-${item.id}`;
          const previewUrl = getTlmPreviewUrl(item.fileUrl);
          const hasFile = Boolean(previewUrl || item.fileName);
          const fileType = getTrainerDocFileType(previewUrl || item.fileName, item.type);
          const uploadDate = formatDocDate(item.uploadedAt);
          const uploadTime = formatDocTime(item.uploadedAt);
          return (
            <div key={item.id} className="st-reg-doc-card">
              <div className="st-reg-doc-card__preview">
                {hasFile ? (
                  fileType === 'image' && previewUrl ? (
                    <img src={previewUrl} alt={item.name} className="st-reg-doc-card__image" />
                  ) : fileType === 'pdf' ? (
                    <div className="st-reg-doc-card__icon">
                      <i className="fa-solid fa-file" style={{ fontSize: 100, color: '#dc3545' }} />
                      <p>PDF Document</p>
                    </div>
                  ) : (
                    <div className="st-reg-doc-card__icon">
                      <i className={`fas ${fileType === 'video' ? 'fa-video' : 'fa-file'}`} />
                      <p>{fileType === 'video' ? 'Video' : 'Document'}</p>
                    </div>
                  )
                ) : (
                  <div className="st-reg-doc-card__empty">
                    <i className="fas fa-file-upload" />
                    <p>No Document</p>
                  </div>
                )}
              </div>
              <div className="st-reg-doc-card__info">
                <div className="st-reg-doc-card__header">
                  <div>
                    <h4>{item.name}</h4>
                    <small className="st-tlm__type">{item.type || 'PDF'}</small>
                  </div>
                  {item.uploading ? (
                    <span className="st-reg-pill st-reg-pill--verify">Saving...</span>
                  ) : hasFile ? (
                    <label htmlFor={inputId} className="st-reg-pill st-reg-pill--verify">
                      <i className="fas fa-sync-alt" />
                      REPLACE
                    </label>
                  ) : (
                    <label htmlFor={inputId} className="st-reg-pill st-reg-pill--upload">
                      <i className="fas fa-cloud-upload-alt" />
                      UPLOAD
                    </label>
                  )}
                </div>
                <div className="st-reg-doc-card__meta">
                  <span>
                    <i className="fas fa-calendar-alt" />
                    {item.uploading ? 'Uploading...' : (uploadDate || 'Not uploaded')}
                  </span>
                  {uploadTime ? (
                    <span>
                      <i className="fas fa-clock" />
                      {uploadTime}
                    </span>
                  ) : null}
                </div>
                {item.error ? <p className="st-tlm__error">{item.error}</p> : null}
              </div>
              <input
                id={inputId}
                type="file"
                className="sc-file-input"
                disabled={item.uploading}
                onChange={(e) => {
                  uploadToItem(item.id, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeniorTlmPanel;
