import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Can } from '../Components/cms/Can';
import { CertificateSheet } from '../Components/CertificateSheet';
import { CertificateTemplatePicker } from '../Components/CertificateTemplatePicker';
import { downloadCertificateDocument } from '../Components/certificateDocument';
import { useClub } from '../../../../contexts/ClubContext';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';
import {
  DEFAULT_CERTIFICATE_TEMPLATE_ID,
  certificateSerial,
  getCertificateTemplate,
  resolveCertificateTemplateId,
} from '../../../../config/club/certificateTemplates';

const formatClubDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const CertificatesStaffPage = () => {
  const { state, generateCertificate, assignedColleges } = useClub();
  const knownStudents = state.eligibleStudents || [];
  const manageableClubs = staffManageableClubs(state.clubs);
  const campusName = assignedColleges?.[0]?.name || '';
  const [templateId, setTemplateId] = useState(DEFAULT_CERTIFICATE_TEMPLATE_ID);
  const [form, setForm] = useState({
    title: 'Participation certificate',
    studentName: knownStudents[0]?.studentName || state.currentStudent.name || '',
    studentId: knownStudents[0]?.studentId || state.currentStudent.id || '',
    clubId: manageableClubs[0]?.id || '',
    activityId: '',
  });

  useEffect(() => {
    setForm((prev) => {
      const firstStudent = (state.eligibleStudents || [])[0];
      const firstClubId = staffManageableClubs(state.clubs)[0]?.id;
      const next = { ...prev };
      let changed = false;
      if (!next.clubId && firstClubId) {
        next.clubId = firstClubId;
        changed = true;
      }
      if (!next.studentId && firstStudent?.studentId) {
        next.studentId = firstStudent.studentId;
        next.studentName = firstStudent.studentName || next.studentName;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [state.eligibleStudents, state.clubs]);

  const selectedClub = state.clubs.find((club) => club.id === form.clubId);
  const selectedActivity = state.activities.find((activity) => activity.id === form.activityId);
  const selectedTemplate = getCertificateTemplate(templateId);
  const preview = useMemo(
    () => ({
      title: form.title,
      studentName: form.studentName,
      clubName: selectedClub?.name || campusName,
      activityName: selectedActivity?.title,
      issuedAt: formatClubDate(new Date().toISOString().slice(0, 10)),
      serial: 'FC-PREVIEW',
    }),
    [form.title, form.studentName, selectedClub?.name, selectedActivity?.title, campusName]
  );

  const extrasFor = (cert) => ({
    studentName: cert.studentName,
    clubName: state.clubs.find((club) => club.id === cert.clubId)?.name || campusName,
    activityName: state.activities.find((activity) => activity.id === cert.activityId)?.title,
    templateId,
    issuedAt: formatClubDate(cert.issuedAt),
    serial: certificateSerial(cert.id),
  });

  return (
    <div className="club-dash club-cert-page">
      <header className="club-dash-hero">
        <div>
          <p className="club-dash-hero__eyebrow">Recognition</p>
          <h1>Certificates</h1>
          <p className="club-dash-hero__sub">Pick stationery, fill the details, issue. Download uses the same template.</p>
        </div>
      </header>

      <div className="club-cert-workspace">
        <section className="club-cert-workspace__paper">
          <CertificateTemplatePicker value={templateId} onChange={setTemplateId} />
          <div className="club-cert-stage">
            <CertificateSheet templateId={templateId} {...preview} />
          </div>
        </section>

        <Can permission="certificates.generate">
          <form
            className="club-cert-workspace__issue"
            onSubmit={(e) => {
              e.preventDefault();
              generateCertificate({ ...form, templateId: resolveCertificateTemplateId(templateId) });
            }}
          >
            <h2>Issue</h2>
            <label className="form-field">
              <span className="form-label">Student</span>
              {knownStudents.length > 0 ? (
                <select
                  className="form-select"
                  value={form.studentId}
                  required
                  onChange={(e) => {
                    const student = knownStudents.find((item) => item.studentId === e.target.value);
                    setForm({
                      ...form,
                      studentId: e.target.value,
                      studentName: student?.studentName || form.studentName,
                    });
                  }}
                >
                  <option value="">Select student</option>
                  {knownStudents.map((student) => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.studentName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="form-input"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  required
                />
              )}
            </label>
            <label className="form-field">
              <span className="form-label">For</span>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-label">Club</span>
              <select
                className="form-select"
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value, activityId: '' })}
              >
                <option value="">Select club</option>
                {manageableClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Activity</span>
              <select
                className="form-select"
                value={form.activityId}
                onChange={(e) => {
                  const activityId = e.target.value;
                  const activity = state.activities.find((item) => item.id === activityId);
                  setForm({ ...form, activityId });
                  if (activity?.certificateTemplateId) {
                    setTemplateId(resolveCertificateTemplateId(activity.certificateTemplateId));
                  }
                }}
              >
                <option value="">Optional</option>
                {state.activities
                  .filter((activity) => !form.clubId || activity.clubId === form.clubId)
                  .map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title}
                    </option>
                  ))}
              </select>
            </label>
            <button type="submit" className="fc-btn fc-btn-primary">
              Issue {selectedTemplate.label}
            </button>
          </form>
        </Can>
      </div>

      <section className="club-dash-panel club-cert-issued-panel">
        <div className="club-dash-panel__head">
          <div className="club-dash-panel__title">
            <h2>Issued</h2>
            {(state.certificates || []).length > 0 ? (
              <span className="club-dash-chip">{state.certificates.length}</span>
            ) : null}
          </div>
        </div>
        {(state.certificates || []).length === 0 ? (
          <p className="club-dash-empty">Nothing issued yet.</p>
        ) : (
          <div className="club-dash-rows">
            {state.certificates.map((cert) => (
              <div key={cert.id} className="club-dash-row">
                <div className="club-dash-row__body">
                  <strong>{cert.studentName || '—'}</strong>
                  <span>
                    {cert.title}
                    {' · '}
                    {formatClubDate(cert.issuedAt)}
                    {' · '}
                    {certificateSerial(cert.id)}
                  </span>
                </div>
                <div className="club-dash-row__actions">
                  <Can permission="certificates.download">
                    <button
                      type="button"
                      className="fc-btn fc-btn-outline fc-btn-sm"
                      onClick={() => downloadCertificateDocument(cert, extrasFor(cert))}
                    >
                      <Download size={14} strokeWidth={2.2} />
                      Download
                    </button>
                  </Can>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CertificatesStaffPage;
