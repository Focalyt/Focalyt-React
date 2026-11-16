import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { CertificateSheet } from '../Components/CertificateSheet';
import { CertificateTemplatePicker } from '../Components/CertificateTemplatePicker';
import { downloadCertificateDocument, printCertificateDocument } from '../Components/certificateDocument';
import { useClub } from '../../../../contexts/ClubContext';
import {
  DEFAULT_CERTIFICATE_TEMPLATE_ID,
  certificateSerial,
} from '../../../../config/club/certificateTemplates';

const formatClubDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const CertificatesStudentPage = () => {
  const { state, assignedColleges } = useClub();
  const mine = state.certificates.filter((c) => c.studentId === state.currentStudent.id);
  const [activeId, setActiveId] = useState(mine[0]?.id || '');
  const [templateId, setTemplateId] = useState(mine[0]?.templateId || DEFAULT_CERTIFICATE_TEMPLATE_ID);
  const campusName = assignedColleges?.[0]?.name || '';
  const active = mine.find((cert) => cert.id === activeId) || mine[0];

  const extrasFor = (cert) => ({
    studentName: state.currentStudent.name,
    clubName: state.clubs.find((c) => c.id === cert.clubId)?.name || campusName,
    activityName: state.activities.find((a) => a.id === cert.activityId)?.title,
    templateId,
    issuedAt: formatClubDate(cert.issuedAt),
    serial: certificateSerial(cert.id),
  });

  return (
    <div className="club-dash club-cert-page">
      <header className="club-dash-hero">
        <div>
          <p className="club-dash-hero__eyebrow">Your records</p>
          <h1>Certificates</h1>
          <p className="club-dash-hero__sub">Choose a template, then download or print the official copy.</p>
        </div>
      </header>

      {mine.length === 0 ? (
        <section className="club-dash-panel">
          <p className="club-dash-empty">No certificates yet. They appear here after your campus issues one.</p>
        </section>
      ) : (
        <div className="club-cert-workspace club-cert-workspace--solo">
          <section className="club-cert-workspace__paper">
            {mine.length > 1 ? (
              <div className="club-cert-chips">
                {mine.map((cert) => (
                  <button
                    key={cert.id}
                    type="button"
                    className={`club-cert-chip ${active?.id === cert.id ? 'is-on' : ''}`}
                    onClick={() => {
                      setActiveId(cert.id);
                      setTemplateId(cert.templateId || templateId);
                    }}
                  >
                    <span>
                      <strong>{cert.title}</strong>
                      <em>{formatClubDate(cert.issuedAt)}</em>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            <CertificateTemplatePicker value={templateId} onChange={setTemplateId} />
            <div className="club-cert-stage">
              <CertificateSheet
                templateId={templateId}
                title={active.title}
                studentName={state.currentStudent.name}
                clubName={state.clubs.find((c) => c.id === active.clubId)?.name || campusName}
                activityName={state.activities.find((a) => a.id === active.activityId)?.title}
                issuedAt={formatClubDate(active.issuedAt)}
                certificateId={active.id}
              />
            </div>
            <div className="club-cert-issued__actions">
              <button
                type="button"
                className="fc-btn fc-btn-outline fc-btn-sm"
                onClick={() => printCertificateDocument(active, extrasFor(active))}
              >
                Print
              </button>
              <button
                type="button"
                className="fc-btn fc-btn-primary fc-btn-sm"
                onClick={() => downloadCertificateDocument(active, extrasFor(active))}
              >
                <Download size={14} strokeWidth={2.2} />
                Download
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CertificatesStudentPage;
