import React, { useState } from 'react';
import {
  getDocFileUrl,
  formatDocDate,
  getTrainerDocFileType,
} from './seniorTrainerShared';

const TrainerDocumentReviewModal = ({ doc, status, onClose, onAccept, onReject }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const fileUrl = doc?.fileUrl ? getDocFileUrl(doc.fileUrl) : '';
  const fileType = getTrainerDocFileType(fileUrl || doc?.fileName, doc?.type);
  const canReview = Boolean(doc?.uploaded) && status === 'Pending';

  if (!doc) return null;

  const renderPreview = () => {
    if (!fileUrl) {
      return (
        <div className="st-reg-modal__empty">
          <span>Not found</span>
        </div>
      );
    }
    if (fileType === 'image') {
      return <img src={fileUrl} alt={doc.name} />;
    }
    if (fileType === 'pdf') {
      return (
        <iframe
          src={`${fileUrl}#navpanes=0&toolbar=0`}
          title={doc.name}
        />
      );
    }
    if (fileType === 'video') {
      return <video src={fileUrl} controls />;
    }
    return (
      <div className="st-reg-modal__empty">
        <p>Click download to view this file</p>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">Download & View</a>
      </div>
    );
  };

  return (
    <div
      className="st-reg-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="st-reg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="st-reg-modal__head">
          <h3>{doc.name} Verification</h3>
          <button type="button" className="st-reg-modal__close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="st-reg-modal__body">
          <div className="st-reg-modal__preview">
            <div className="st-reg-modal__preview-box">
              {renderPreview()}
            </div>
          </div>

          <div className="st-reg-modal__side">
            <div className="st-reg-info-card">
              <h4>Document Information</h4>
              <div className="st-reg-info-row">
                <strong>Document Name:</strong>
                <span>{doc.name}</span>
              </div>
              <div className="st-reg-info-row">
                <strong>Upload Date:</strong>
                <span>{formatDocDate(doc.uploadedAt) || 'N/A'}</span>
              </div>
              <div className="st-reg-info-row">
                <strong>Status:</strong>
                <span>{status}</span>
              </div>
            </div>

            {canReview && (
              !showRejectForm ? (
                <div className="st-reg-modal__actions">
                  <button type="button" className="st-reg-btn st-reg-btn--approve" onClick={() => onAccept(doc)}>
                    <i className="fas fa-check" /> Approve Document
                  </button>
                  <button type="button" className="st-reg-btn st-reg-btn--reject" onClick={() => setShowRejectForm(true)}>
                    <i className="fas fa-times" /> Reject Document
                  </button>
                </div>
              ) : (
                <div className="st-reg-reject">
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection..."
                  />
                  <div className="st-reg-reject__btns">
                    <button
                      type="button"
                      className="st-reg-btn st-reg-btn--reject"
                      disabled={!rejectionReason.trim()}
                      onClick={() => onReject(doc, rejectionReason.trim())}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      type="button"
                      className="st-reg-btn st-reg-btn--ghost"
                      onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDocumentReviewModal;
