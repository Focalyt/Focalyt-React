import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RotateCcw, Shield, Sparkles, UserCheck, AlertTriangle, X, Home } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';

export const DemoTopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetDemoData } = useClub();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAdmin = location.pathname.startsWith('/club/admin');

  const handleSwitchMode = (target) => {
    if (target === 'admin' && !isAdmin) {
      navigate('/club/admin/clubs');
    } else if (target === 'student' && isAdmin) {
      navigate('/club/discover');
    }
  };

  const handleConfirmReset = () => {
    resetDemoData();
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="demo-topbar" role="region" aria-label="Demo environment controls">
        <div className="club-container demo-topbar-inner">
          <div className="demo-topbar-left">
            <Link
              to="/"
              className="fc-btn fc-btn-outline fc-btn-sm demo-home-btn"
              title="Back to Focalyt Main Home"
            >
              <Home size={13} /> <span>Focalyt Home</span>
            </Link>
            <span className="demo-badge">
              <Sparkles size={12} />
              <span>Interactive UI Demo</span>
            </span>
            <span className="demo-topbar-desc">
              Local browser state only — changes in Admin appear live in Student view.
            </span>
          </div>

          <div className="demo-topbar-right">
            <div className="demo-view-control">
              <span className="demo-view-label">Demo view:</span>
              <div className="demo-switch-group" role="group" aria-label="Switch between Student and Admin demo views">
                <button
                  type="button"
                  className={`demo-switch-btn ${!isAdmin ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('student')}
                  aria-pressed={!isAdmin}
                >
                  <UserCheck size={13} />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  className={`demo-switch-btn ${isAdmin ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('admin')}
                  aria-pressed={isAdmin}
                >
                  <Shield size={13} />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              className="fc-btn fc-btn-outline fc-btn-sm demo-reset-btn"
              onClick={() => setConfirmOpen(true)}
            >
              <RotateCcw size={13} />
              <span className="demo-reset-text">Reset demo data</span>
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-demo-title"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="fc-modal-panel"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--bg-pink-light)',
                    color: 'var(--primary-rose)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} />
                </span>
                <h2 id="reset-demo-title" style={{ fontSize: '1.1rem' }}>
                  Reset demo data?
                </h2>
              </div>
              <button
                type="button"
                className="fc-btn fc-btn-ghost fc-btn-sm"
                aria-label="Close dialog"
                onClick={() => setConfirmOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="fc-modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                This will restore all sample institutions, clubs, memberships, activities, registrations, and submitted club ideas back to their initial defaults.
              </p>
            </div>
            <div className="fc-modal-footer">
              <button
                type="button"
                className="fc-btn fc-btn-outline fc-btn-sm"
                onClick={() => setConfirmOpen(false)}
              >
                Keep Current State
              </button>
              <button
                type="button"
                className="fc-btn fc-btn-primary fc-btn-sm"
                onClick={handleConfirmReset}
              >
                <RotateCcw size={14} />
                Yes, Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
