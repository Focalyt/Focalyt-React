import React, { useState } from 'react';
import { Link2, MapPin, Mail, X, Check } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';

export const ProfileAndConfigModal = ({ open, onClose }) => {
  const { state, updateExternalLinks } = useClub();
  const { currentStudent, institutions, externalLinks } = state;

  const [coursesUrl, setCoursesUrl] = useState(externalLinks.coursesUrl);
  const [placementsUrl, setPlacementsUrl] = useState(externalLinks.placementsUrl);

  if (!open) return null;

  const studentInstitution = institutions.find(
    (inst) => inst.id === currentStudent.institutionId
  );

  const handleSaveLinks = (e) => {
    e.preventDefault();
    updateExternalLinks({
      coursesUrl: coursesUrl.trim() || '/courses',
      placementsUrl: placementsUrl.trim() || '/joblisting',
    });
    onClose();
  };

  return (
    <div
      className="fc-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-profile-modal-title"
      onClick={onClose}
    >
      <div className="fc-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="fc-modal-header">
          <h2 id="student-profile-modal-title" style={{ fontSize: '1.25rem' }}>
            Student Profile & Navigation Destinations
          </h2>
          <button
            type="button"
            className="fc-btn fc-btn-ghost fc-btn-sm"
            onClick={onClose}
            aria-label="Close profile dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="fc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              background: 'var(--bg-pink-light)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--primary-rose)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              AS
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.15rem' }}>{currentStudent.name}</h3>
                <span className="pill pill-blush">{currentStudent.year}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                {currentStudent.department}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginTop: 8,
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} /> {currentStudent.email}
                </span>
                {studentInstitution && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={14} /> {studentInstitution.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveLinks} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={17} color="var(--primary-rose)" />
                Configurable Header Destinations (Courses & Placements)
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Customize where the header’s <strong>Courses</strong> and <strong>Placements</strong> links point.
              </p>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="config-courses-url">
                Courses Link Destination URL
              </label>
              <input
                id="config-courses-url"
                type="text"
                className="form-input"
                value={coursesUrl}
                onChange={(e) => setCoursesUrl(e.target.value)}
                placeholder="/courses or /candidate/searchcourses"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="config-placements-url">
                Placements Link Destination URL
              </label>
              <input
                id="config-placements-url"
                type="text"
                className="form-input"
                value={placementsUrl}
                onChange={(e) => setPlacementsUrl(e.target.value)}
                placeholder="/joblisting or /candidate/nearbyJobs"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 6 }}>
              <button type="button" className="fc-btn fc-btn-outline fc-btn-sm" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm">
                <Check size={15} />
                Save Destinations
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
