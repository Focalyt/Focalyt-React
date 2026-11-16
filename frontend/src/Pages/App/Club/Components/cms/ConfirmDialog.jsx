import React from 'react';

export const ConfirmDialog = ({ open, title, body, confirmLabel = 'Confirm', onConfirm, onClose }) => {
  if (!open) return null;
  return (
    <div className="fc-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="fc-modal-panel" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="fc-modal-header">
          <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
          <button type="button" className="fc-btn fc-btn-ghost fc-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="fc-modal-body">
          <p style={{ color: 'var(--text-secondary)' }}>{body}</p>
        </div>
        <div className="fc-modal-footer">
          <button type="button" className="fc-btn fc-btn-outline fc-btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="fc-btn fc-btn-primary fc-btn-sm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
