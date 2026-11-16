import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';

export const ToastViewport = () => {
  const { toasts, dismissToast } = useClub();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ color: 'var(--foc-cyan)', marginTop: 2 }}>
              {toast.tone === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.86rem' }}>
                {toast.title}
              </div>
              {toast.description && (
                <div style={{ fontSize: '0.82rem', color: '#DFF1FF', marginTop: 2 }}>
                  {toast.description}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#DFF1FF',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
