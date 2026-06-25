import React, { useState, useMemo, useCallback } from 'react';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

/* ─── Theme tokens ─── */
const PINK = '#fa5579';
const BLUE = '#2563eb';

const FILTER_OPTIONS = {
  department: ['Skill Development', 'Placement Cell', 'Training Operations'],
  project: ['PMKVY 4.0', 'DDU-GKY', 'State Skill Mission'],
  center: ['Delhi Centre – Rohini', 'Noida Centre – Sector 62', 'Gurgaon Centre – Udyog Vihar'],
  course: ['Retail Sales Associate', 'Data Entry Operator', 'Beauty & Wellness'],
  batch: ['BATCH-RS-2024-01', 'BATCH-DEO-2024-03', 'BATCH-BW-2024-02'],
};

const TRAINER_INFO = {
  name: 'Rajesh Kumar Sharma',
  mobile: '9876543210',
  email: 'rajesh.trainer@focalyt.in',
  batchCode: 'BATCH-RS-2024-01',
  course: 'Retail Sales Associate',
  center: 'Delhi Centre – Rohini',
};

const BASIC_DETAILS_INIT = {
  centerName: 'Delhi Centre – Rohini',
  trainerName: 'Rajesh Kumar Sharma',
  projectName: 'PMKVY 4.0',
  courseTrade: 'Retail Sales Associate',
  reportingPerson: 'Priya Singh – Centre Manager',
  batchCode: 'BATCH-RS-2024-01',
  totalPointsTillDate: '1245',
  totalDaysTillDate: '42',
};

const MAIN_TABS = [
  { id: 'session', label: 'Sessions' },
  { id: 'student', label: 'Students' },
];

const DEFAULT_EVIDENCE_DOCS = [
  { id: 'EV001', name: 'Class photo', type: 'Image', status: 'Uploaded', fileName: 'class-photo.jpg' },
  { id: 'EV002', name: 'Attendance sheet', type: 'Document', status: 'Pending', fileName: '' },
  { id: 'EV003', name: 'Training clip', type: 'Video', status: 'Uploaded', fileName: 'training-clip.mp4' },
];

const DUMMY_SESSIONS = [
  { id: 'S001', title: 'Morning Batch – Retail Sales', date: '22/06/2026', status: 'Completed' },
  { id: 'S002', title: 'Practical – Customer Handling', date: '22/06/2026', status: 'Pending' },
  { id: 'S003', title: 'Assessment Review', date: '21/06/2026', status: 'Completed' },
];

const getTodayInputValue = () => new Date().toISOString().slice(0, 10);
const formatSessionDate = (dateValue) => {
  if (!dateValue) return new Date().toLocaleDateString('en-IN');
  return new Date(dateValue).toLocaleDateString('en-IN');
};
const createEvidenceDocs = (status = 'Pending') =>
  DEFAULT_EVIDENCE_DOCS.map((doc) => ({ ...doc, status, fileName: status === 'Uploaded' ? doc.fileName : '' }));
const createSessionDraft = (sessionNumber, basicDetails) => ({
  id: `S${String(sessionNumber).padStart(3, '0')}`,
  title: 'New Session',
  topicCovered: 'Basics of Retail & Customer Service',
  trainingMethod: 'Interactive Learning',
  sessionDate: getTodayInputValue(),
  startTime: '10:00',
  endTime: '12:00',
  status: 'Pending',
  totalCandidates: '30',
  presentCandidates: '26',
  absentCandidates: '4',
  courseTrade: basicDetails.courseTrade,
  batchCode: basicDetails.batchCode,
  trainerName: basicDetails.trainerName,
  notes: 'Covered basics of customer service and communication skills.',
  evidenceDocs: createEvidenceDocs('Pending'),
});
const hydrateSession = (session, index, basicDetails) => ({
  ...createSessionDraft(index + 1, basicDetails),
  ...session,
  topicCovered: session.topicCovered || (index === 1 ? 'Customer handling practical' : 'Basics of Retail & Customer Service'),
  trainingMethod: session.trainingMethod || (index === 2 ? 'Assessment Discussion' : 'Interactive Learning'),
  totalCandidates: session.totalCandidates || '30',
  presentCandidates: session.presentCandidates || '26',
  absentCandidates: session.absentCandidates || '4',
  attendance: session.attendance || '86.7%',
  notes: session.notes || 'Covered basics of customer service and communication skills.',
  evidenceDocs: session.evidenceDocs || createEvidenceDocs(session.status === 'Completed' ? 'Uploaded' : 'Pending'),
});
const normalizeSessionDraft = (draft, basicDetails) => {
  const total = Number(draft.totalCandidates) || 0;
  const present = Number(draft.presentCandidates) || 0;
  const attendance = total > 0 ? `${((present / total) * 100).toFixed(1)}%` : (draft.attendance || '0%');
  const evidenceDocs = (draft.evidenceDocs || [])
    .filter((doc) => doc.name?.trim())
    .map((doc, index) => ({
      id: doc.id || `EV${Date.now()}-${index}`,
      name: doc.name.trim(),
      type: doc.type || 'Document',
      status: doc.status || 'Pending',
      fileName: doc.fileName || '',
    }));

  return {
    ...draft,
    title: draft.title?.trim() || 'New Session',
    topicCovered: draft.topicCovered?.trim() || draft.title?.trim() || 'Session topic',
    trainingMethod: draft.trainingMethod?.trim() || 'Interactive Learning',
    date: formatSessionDate(draft.sessionDate),
    courseTrade: draft.courseTrade || basicDetails.courseTrade,
    batchCode: draft.batchCode || basicDetails.batchCode,
    trainerName: draft.trainerName || basicDetails.trainerName,
    attendance,
    evidenceDocs,
  };
};

const DUMMY_STUDENTS = [
  { id: 'ST01', name: 'Akash Gaurav', mobile: '6280484211', attendance: '92%', status: 'Active' },
  { id: 'ST02', name: 'Priya Verma', mobile: '9876512340', attendance: '88%', status: 'Active' },
  { id: 'ST03', name: 'Rohit Singh', mobile: '9123456780', attendance: '76%', status: 'At Risk' },
];

const mkPoint = (id, name, priority, weightage) => ({ id, name, priority, weightage });

const ATTENDANCE_POINTS = [
  mkPoint('1.1', 'Total enrolled candidates', 'High', 5),
  mkPoint('1.2', 'Present candidates', 'High', 10),
  mkPoint('1.3', 'Absent candidates', 'High', 10),
  mkPoint('1.4', 'Attendance percentage', 'High', 10),
  mkPoint('1.5', 'New admissions', 'Medium', 5),
  mkPoint('1.6', 'Dropout / inactive candidates', 'High', 8),
  mkPoint('1.7', 'Follow-up done with absent candidates', 'Medium', 7),
  mkPoint('1.8', 'Student attendance below 40%', 'High', 8),
];

const TRAINING_POINTS = [
  mkPoint('2.1', 'Topic covered today', 'High', 10),
  mkPoint('2.2', 'Pending topic', 'Medium', 5),
  mkPoint('2.3', 'Training hours completed today', 'High', 10),
  mkPoint('2.4', 'Practical / activity conducted', 'High', 8),
  mkPoint('2.5', 'Name of activity / practical', 'Medium', 5),
  mkPoint('2.6', 'Teaching method used', 'Medium', 5),
];

const STUDENT_POINTS = [
  mkPoint('3.1', 'Student participation in class', 'High', 8),
  mkPoint('3.2', 'Doubt-clearing done', 'Medium', 6),
  mkPoint('3.3', 'Engagement activity completed', 'Medium', 6),
  mkPoint('3.4', 'Counseling / motivation session conducted', 'Low', 4),
  mkPoint('3.5', 'Placement / career discussion done', 'Low', 4),
  mkPoint('3.6', 'Candidates guided for job role / career path', 'Medium', 5),
  mkPoint('3.7', 'Internal assessment performance', 'High', 10),
  mkPoint('3.8', 'Classroom participation', 'Medium', 7),
];

const DOCUMENT_POINTS = [
  mkPoint('4.1', 'Attendance updated', 'High', 8),
  mkPoint('4.2', 'DTR updated', 'High', 8),
  mkPoint('4.3', 'MIS updated', 'High', 8),
  mkPoint('4.4', 'Lesson plan followed', 'Medium', 6),
  mkPoint('4.5', 'ACLP / day-wise lesson plan updated', 'Medium', 6),
  mkPoint('4.6', 'Batch calendar updated', 'Medium', 5),
  mkPoint('4.7', 'Batch file updated', 'Medium', 5),
  mkPoint('4.8', 'Daily report submitted on time', 'High', 10),
];

const ISSUE_POINTS = [
  { id: '5.1', name: 'Attendance issue', type: 'Attendance', priority: 'High' },
  { id: '5.2', name: 'Student engagement issue', type: 'Engagement', priority: 'Medium' },
  { id: '5.3', name: 'Documentation issue', type: 'Documentation', priority: 'Medium' },
  { id: '5.4', name: 'Infrastructure / center issue', type: 'Infrastructure', priority: 'High' },
  { id: '5.5', name: 'Pending work for tomorrow', type: 'Action Item', priority: 'Medium' },
];

const emptyPointValue = () => ({
  value: '', status: 'Pending', evidence: '', remarks: '', selfScore: '',
});
const emptyIssueValue = () => ({
  actionTaken: '', responsible: '', targetDate: '', status: 'Open', remarks: '',
});
const buildPointMap = (points) =>
  Object.fromEntries(points.map((p) => [p.id, emptyPointValue()]));

const priorityClass = (p) => {
  if (p === 'High') return 'dbr-priority--high';
  if (p === 'Medium') return 'dbr-priority--medium';
  return 'dbr-priority--low';
};

/* ─── Small reusable pieces ─── */

const FilterSelect = ({ label, icon, options, value, onChange }) => (
  <div className="dbr-filter-pill">
    <label className="dbr-filter-label">
      <i className={`fas ${icon}`} /> {label}
    </label>
    <select className="dbr-filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const PointFieldCard = ({ point, data, onChange }) => (
  <div className="dbr-point-card">
    <div className="dbr-point-card__top">
      <span className="dbr-point-id">{point.id}</span>
      <span className={`dbr-priority ${priorityClass(point.priority)}`}>{point.priority}</span>
      <span className="dbr-weight">Wt {point.weightage}</span>
    </div>
    <h6 className="dbr-point-name">{point.name}</h6>
    <div className="dbr-point-fields">
      <input type="text" className="dbr-input" placeholder="Enter value..." value={data.value} onChange={(e) => onChange('value', e.target.value)} />
      <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
        <option>Completed</option><option>Pending</option><option>Not Applicable</option>
      </select>
      <input type="text" className="dbr-input" placeholder="Evidence / link..." value={data.evidence} onChange={(e) => onChange('evidence', e.target.value)} />
      <input type="text" className="dbr-input" placeholder="Remarks..." value={data.remarks} onChange={(e) => onChange('remarks', e.target.value)} />
    </div>
  </div>
);

const IssueCard = ({ issue, data, onChange }) => (
  <div className="dbr-point-card dbr-issue-card">
    <div className="dbr-point-card__top">
      <span className="dbr-point-id">{issue.id}</span>
      <span className={`dbr-priority ${priorityClass(issue.priority)}`}>{issue.priority}</span>
      <span className="dbr-issue-type">{issue.type}</span>
    </div>
    <h6 className="dbr-point-name">{issue.name}</h6>
    <div className="dbr-point-fields">
      <input className="dbr-input" placeholder="Action taken..." value={data.actionTaken} onChange={(e) => onChange('actionTaken', e.target.value)} />
      <input className="dbr-input" placeholder="Responsible person..." value={data.responsible} onChange={(e) => onChange('responsible', e.target.value)} />
      <input type="date" className="dbr-input" value={data.targetDate} onChange={(e) => onChange('targetDate', e.target.value)} />
      <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
        <option>Open</option><option>In Progress</option><option>Resolved</option>
      </select>
      <input className="dbr-input" placeholder="Remarks..." value={data.remarks} onChange={(e) => onChange('remarks', e.target.value)} />
    </div>
  </div>
);

/* ─── Redesigned Session Card ─── */
const AddSessionModal = ({
  draft,
  isEdit,
  onClose,
  onSave,
  onFieldChange,
  onEvidenceChange,
  onAddEvidence,
  onRemoveEvidence,
}) => {
  if (!draft) return null;

  return (
    <div className="session-modal-backdrop">
      <div className="session-modal" role="dialog" aria-modal="true">
        <div className="session-modal__head">
          <div>
            <h5>{isEdit ? 'Edit Session' : 'Add Session'}</h5>
            <span>{draft.id}</span>
          </div>
          <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="session-modal__body">
          <div className="session-form-grid">
            <label className="session-field">
              <span>Session title</span>
              <input className="dbr-input" value={draft.title} onChange={(e) => onFieldChange('title', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Topic covered</span>
              <input className="dbr-input" value={draft.topicCovered} onChange={(e) => onFieldChange('topicCovered', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Training method</span>
              <input className="dbr-input" value={draft.trainingMethod} onChange={(e) => onFieldChange('trainingMethod', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Status</span>
              <select className="dbr-select" value={draft.status} onChange={(e) => onFieldChange('status', e.target.value)}>
                <option>Pending</option>
                <option>Completed</option>
              </select>
            </label>
            <label className="session-field">
              <span>Date</span>
              <input type="date" className="dbr-input" value={draft.sessionDate} onChange={(e) => onFieldChange('sessionDate', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Start time</span>
              <input type="time" className="dbr-input" value={draft.startTime} onChange={(e) => onFieldChange('startTime', e.target.value)} />
            </label>
            <label className="session-field">
              <span>End time</span>
              <input type="time" className="dbr-input" value={draft.endTime} onChange={(e) => onFieldChange('endTime', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Course / trade</span>
              <input className="dbr-input" value={draft.courseTrade} onChange={(e) => onFieldChange('courseTrade', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Batch code</span>
              <input className="dbr-input" value={draft.batchCode} onChange={(e) => onFieldChange('batchCode', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Total candidates</span>
              <input type="number" min="0" className="dbr-input" value={draft.totalCandidates} onChange={(e) => onFieldChange('totalCandidates', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Present</span>
              <input type="number" min="0" className="dbr-input" value={draft.presentCandidates} onChange={(e) => onFieldChange('presentCandidates', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Absent</span>
              <input type="number" min="0" className="dbr-input" value={draft.absentCandidates} onChange={(e) => onFieldChange('absentCandidates', e.target.value)} />
            </label>
          </div>

          <label className="session-field session-field--full">
            <span>Additional notes</span>
            <textarea className="dbr-textarea" rows="3" value={draft.notes} onChange={(e) => onFieldChange('notes', e.target.value)} />
          </label>

          <div className="session-evidence-builder">
            <div className="session-evidence-builder__head">
              <h6>Evidence documents</h6>
              <button type="button" className="session-mini-btn" onClick={onAddEvidence}>
                <i className="fas fa-plus" /> Add document
              </button>
            </div>

            {(draft.evidenceDocs || []).map((doc, index) => (
              <div key={doc.id || index} className="session-evidence-row">
                <input
                  className="dbr-input"
                  placeholder="Document name"
                  value={doc.name}
                  onChange={(e) => onEvidenceChange(index, 'name', e.target.value)}
                />
                <select className="dbr-select" value={doc.type} onChange={(e) => onEvidenceChange(index, 'type', e.target.value)}>
                  <option>Document</option>
                  <option>Image</option>
                  <option>Video</option>
                  <option>PDF</option>
                </select>
                <button type="button" className="session-remove-btn" onClick={() => onRemoveEvidence(index)} aria-label="Remove document">
                  <i className="fas fa-trash" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="session-modal__foot">
          <button type="button" className="sc-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="sc-btn sc-btn--primary" onClick={onSave}>
            <i className="fas fa-save" /> Save Session
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionCard = ({ basicDetails, session, notify, onStatusChange, onEvidenceUpload, onEditSession }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const activeSession = session || hydrateSession(DUMMY_SESSIONS[0], 0, basicDetails);
  const statusTone = activeSession.status === 'Completed' ? 'green' : 'amber';
  const statusIcon = activeSession.status === 'Completed' ? 'fa-check-circle' : 'fa-clock';
  const timeRange = `${activeSession.startTime || '10:00'} - ${activeSession.endTime || '12:00'}`;
  const detailItems = useMemo(() => ([
    ['fa-book-open', 'Topic covered', activeSession.topicCovered || activeSession.title, 'blue'],
    ['fa-chalkboard', 'Training method', activeSession.trainingMethod || 'Interactive Learning', 'blue'],
    ['fa-calendar-alt', 'Session date', activeSession.date || formatSessionDate(activeSession.sessionDate), 'blue'],
    ['fa-clock', 'Time', timeRange, 'blue'],
    ['fa-graduation-cap', 'Course / trade', activeSession.courseTrade || basicDetails.courseTrade, 'pink'],
    ['fa-hashtag', 'Batch code', activeSession.batchCode || basicDetails.batchCode, 'pink'],
    ['fa-user', 'Trainer', activeSession.trainerName || basicDetails.trainerName, 'pink'],
  ]), [activeSession, basicDetails, timeRange]);
  const statItems = useMemo(() => ([
    { icon: 'fa-users', val: activeSession.totalCandidates || '0', lbl: 'Total Candidates', cls: 'blue' },
    { icon: 'fa-check-circle', val: activeSession.presentCandidates || '0', lbl: 'Present', cls: 'green' },
    { icon: 'fa-times-circle', val: activeSession.absentCandidates || '0', lbl: 'Absent', cls: 'red' },
    { icon: 'fa-percentage', val: activeSession.attendance || '0%', lbl: 'Attendance', cls: 'amber' },
  ]), [activeSession]);
  const evidenceDocs = activeSession.evidenceDocs?.length ? activeSession.evidenceDocs : createEvidenceDocs('Pending');

  return (
    <div className="sc-wrap">
      {/* ── Header bar ── */}
      <div className="sc-head">
        <div className="sc-head-left">
          <div className="sc-avatar">
            <i className="fas fa-user" />
          </div>
          <div className="sc-head-text">
            <div className="sc-trainer-name">{activeSession.title}</div>
            <div className="sc-trainer-sub">
              {basicDetails.centerName}&nbsp;·&nbsp;{activeSession.id}&nbsp;·&nbsp;{TRAINER_INFO.mobile}
            </div>
          </div>
           
        </div>
        <div className="sc-head-right">
          <div className="sc-status-control">
            <span className={`sc-badge sc-badge--${statusTone}`}>
              <i className={`fas ${statusIcon}`} /> {activeSession.status}
            </span>
            <button
              type="button"
              className="sc-status-edit"
              title="Edit status"
              onClick={() => setStatusMenuOpen((open) => !open)}
            >
              <i className="fas fa-pencil-alt" />
            </button>
            {statusMenuOpen && (
              <div className="sc-status-menu">
                {['Completed', 'Pending'].map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={activeSession.status === status ? 'sc-status-menu__item sc-status-menu__item--active' : 'sc-status-menu__item'}
                    onClick={() => {
                      onStatusChange(activeSession.id, status);
                      setStatusMenuOpen(false);
                    }}
                  >
                    <i className={`fas ${status === 'Completed' ? 'fa-check-circle' : 'fa-clock'}`} />
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* <span className="sc-badge sc-badge--blue">
            <i className="fas fa-fingerprint" />&nbsp;
            <code>S-20240622-01</code>
          </span> */}
          {/* <button
            type="button"
            className="sc-copy-btn"
            title="Copy session ID"
            onClick={() => notify('Session ID copied')}
          >
            <i className="far fa-copy" />
          </button> */}
        
        </div>

       

          <div className="sc-stats">
            {statItems.map(({ icon, val, lbl, cls }) => (
              <div key={lbl} className="sc-stat">
                <div className={`sc-stat__icon sc-stat__icon--${cls}`}>
                  <i className={`fas ${icon}`} />
                </div>
                <div className="sc-stat__val">{val}</div>
                <div className="sc-stat__lbl">{lbl}</div>
              </div>
            ))}
          </div>

            <button
            type="button"
            className="sc-toggle-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand card' : 'Collapse card'}
          >
            <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} />
          </button>
      </div>

      {!collapsed && (
        <>
          

          <div className="sc-tabs">
            <button
              type="button"
              className={`sc-tab${activeTab === 'details' ? ' sc-tab--active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <i className="far fa-list-alt" /> Session Details
            </button>
            <button
              type="button"
              className={`sc-tab${activeTab === 'evidence' ? ' sc-tab--active' : ''}`}
              onClick={() => setActiveTab('evidence')}
            >
              <i className="far fa-image" /> Evidence
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="sc-body">
              <div className="sc-detail-grid">
                {detailItems.map(([icon, label, value, tone]) => (
                  <div key={label} className="sc-detail-item">
                    <small>{label}</small>
                    <strong>
                      <span className={`sc-detail-icon sc-detail-icon--${tone}`}>
                        <i className={`fas ${icon}`} />
                      </span>
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
          
              <div className="sc-notes">
                <span className="sc-detail-icon sc-detail-icon--blue">
                  <i className="far fa-edit" />
                </span>
                <div>
                  <small>Additional notes</small>
                  <p>{activeSession.notes || 'No notes added.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="sc-body">
              <div className="sc-evidence-grid">
                {evidenceDocs.map((doc) => {
                  const icon = doc.type === 'Image' ? 'fa-image' : doc.type === 'Video' ? 'fa-video' : 'fa-file-alt';
                  const tone = doc.status === 'Uploaded' ? 'green' : 'amber';
                  return (
                    <div key={doc.id} className="sc-evidence-card">
                      <div className={`sc-evidence-icon sc-evidence-icon--${tone}`}>
                        <i className={`fas ${icon}`} />
                      </div>
                      <strong>{doc.name}</strong>
                      <small className={doc.status === 'Uploaded' ? 'ev-uploaded' : 'ev-pending'}>
                        <i className={`fas ${doc.status === 'Uploaded' ? 'fa-check-circle' : 'fa-clock'}`} />
                        &nbsp;{doc.status}
                      </small>
                      {doc.fileName && <span className="sc-file-name">{doc.fileName}</span>}
                      <input
                        id={`${activeSession.id}-${doc.id}`}
                        type="file"
                        className="sc-file-input"
                        onChange={(e) => onEvidenceUpload(activeSession.id, doc.id, e.target.files?.[0])}
                      />
                      <label className="sc-upload-btn" htmlFor={`${activeSession.id}-${doc.id}`}>
                        <i className="fas fa-upload" /> Upload
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="sc-foot">
            <button type="button" className="sc-btn" onClick={() => onEditSession(activeSession)}>
              <i className="far fa-edit" /> Edit Session
            </button>
            <div className="sc-foot-right">
              <button type="button" className="sc-btn btn btn-primary" data-bs-toggle="modal" data-bs-target="#markAttendance">
                <i className="fas fa-user-check" /> Mark Attendance
              </button>
              <button type="button" className="sc-btn sc-btn--primary" data-bs-toggle="modal" data-bs-target="#viewAttendance">
                <i className="fas fa-chart-bar" /> View Attendance
              </button>
            </div>
          </div>
        </>
      )}


{/* modal  */}

<div class="modal fade" id="markAttendance" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="staticBackdropLabel">Mark Attendance</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        ...
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Understood</button>
      </div>
    </div>
  </div>
</div>

{/* modal */}

{/* view attendance */}
<div class="modal fade" id="viewAttendance" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="staticBackdropLabel">View Attendance</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        ...
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Understood</button>
      </div>
    </div>
  </div>
</div>
    </div>



  );
};

/* ─── Main page ─── */
const TrainerModule = () => {
  const [reportDate, setReportDate] = useState(new Date());
  const [filters, setFilters] = useState({
    department: 'Skill Development', project: 'PMKVY 4.0', center: 'Delhi Centre – Rohini',
    course: 'Retail Sales Associate', batch: 'BATCH-RS-2024-01',
  });
  const [quickSearch, setQuickSearch] = useState('');
  const [mainTab, setMainTab] = useState('session');
  const [basicDetails] = useState(BASIC_DETAILS_INIT);
  const [sessions, setSessions] = useState(() =>
    DUMMY_SESSIONS.map((session, index) => hydrateSession(session, index, BASIC_DETAILS_INIT))
  );
  const [selectedSessionId, setSelectedSessionId] = useState(DUMMY_SESSIONS[0]?.id || '');
  const [sessionDraft, setSessionDraft] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  const [attendanceData, setAttendanceData] = useState(() => buildPointMap(ATTENDANCE_POINTS));
  const [trainingData, setTrainingData] = useState(() => buildPointMap(TRAINING_POINTS));
  const [studentData, setStudentData] = useState(() => buildPointMap(STUDENT_POINTS));
  const [issueData, setIssueData] = useState(() =>
    Object.fromEntries(ISSUE_POINTS.map((p) => [p.id, emptyIssueValue()]))
  );

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const updateMap = useCallback((setter, id, field, val) => {
    setter((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }, []);
  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || sessions[0],
    [sessions, selectedSessionId]
  );

  const openAddSessionModal = () => {
    const nextSessionNumber = sessions.length + 1;
    setEditingSessionId(null);
    setSessionDraft(createSessionDraft(nextSessionNumber, basicDetails));
    setIsSessionModalOpen(true);
  };
  const openEditSessionModal = (session) => {
    setEditingSessionId(session.id);
    setSessionDraft({
      ...createSessionDraft(sessions.length + 1, basicDetails),
      ...session,
      evidenceDocs: session.evidenceDocs?.length ? session.evidenceDocs : createEvidenceDocs('Pending'),
    });
    setIsSessionModalOpen(true);
  };
  const closeSessionModal = () => {
    setIsSessionModalOpen(false);
    setSessionDraft(null);
    setEditingSessionId(null);
  };
  const updateSessionDraft = (field, value) => {
    setSessionDraft((prev) => ({ ...prev, [field]: value }));
  };
  const updateDraftEvidence = (index, field, value) => {
    setSessionDraft((prev) => ({
      ...prev,
      evidenceDocs: prev.evidenceDocs.map((doc, docIndex) =>
        docIndex === index ? { ...doc, [field]: value } : doc
      ),
    }));
  };
  const addDraftEvidence = () => {
    setSessionDraft((prev) => ({
      ...prev,
      evidenceDocs: [
        ...prev.evidenceDocs,
        { id: `EV${Date.now()}`, name: '', type: 'Document', status: 'Pending', fileName: '' },
      ],
    }));
  };
  const removeDraftEvidence = (index) => {
    setSessionDraft((prev) => ({
      ...prev,
      evidenceDocs: prev.evidenceDocs.filter((_, docIndex) => docIndex !== index),
    }));
  };
  const saveSessionDraft = () => {
    const normalizedSession = normalizeSessionDraft(sessionDraft, basicDetails);

    if (editingSessionId) {
      setSessions((prev) => prev.map((session) => (
        session.id === editingSessionId ? { ...normalizedSession, id: editingSessionId } : session
      )));
      setSelectedSessionId(editingSessionId);
      notify('Session updated');
    } else {
      setSessions((prev) => [...prev, normalizedSession]);
      setSelectedSessionId(normalizedSession.id);
      notify('Session added');
    }

    closeSessionModal();
  };
  const updateSessionStatus = (sessionId, status) => {
    setSessions((prev) => prev.map((session) => (
      session.id === sessionId ? { ...session, status } : session
    )));
    notify(`Session marked ${status}`);
  };
  const uploadEvidenceFile = (sessionId, docId, file) => {
    if (!file) return;
    setSessions((prev) => prev.map((session) => (
      session.id === sessionId
        ? {
          ...session,
          evidenceDocs: session.evidenceDocs.map((doc) => (
            doc.id === docId ? { ...doc, status: 'Uploaded', fileName: file.name } : doc
          )),
        }
        : session
    )));
    notify('Evidence uploaded');
  };

  return (
    <div className="dbr-portal">
      <style>{PORTAL_CSS}</style>

      {/* ── Header ── */}
      <header className="dbr-header">
        <div>
          <h1 className="dbr-title">Trainer Report Card</h1>
          <nav className="dbr-breadcrumb">
            <a href="/">Home</a><span>/</span>
            <span>Training Module</span><span>/</span>
            <span className="dbr-breadcrumb--active">Daily Report Card</span>
          </nav>
        </div>
        <div className="dbr-header-date">
          <i className="fas fa-calendar-alt" />
          <DatePicker value={reportDate} onChange={setReportDate} format="dd/MM/yyyy" clearIcon={null} />
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="dbr-filters">
        <FilterSelect label="Department" icon="fa-sitemap" options={FILTER_OPTIONS.department} value={filters.department} onChange={(v) => setFilter('department', v)} />
        <FilterSelect label="Project" icon="fa-project-diagram" options={FILTER_OPTIONS.project} value={filters.project} onChange={(v) => setFilter('project', v)} />
        <FilterSelect label="Center" icon="fa-building" options={FILTER_OPTIONS.center} value={filters.center} onChange={(v) => setFilter('center', v)} />
        <FilterSelect label="Course" icon="fa-graduation-cap" options={FILTER_OPTIONS.course} value={filters.course} onChange={(v) => setFilter('course', v)} />
        <FilterSelect label="Batch" icon="fa-users" options={FILTER_OPTIONS.batch} value={filters.batch} onChange={(v) => setFilter('batch', v)} />
      </div>

      {/* ── Main tabs ── */}
      <div className="dbr-main-tabs">
        {MAIN_TABS.map((t) => (
          <button
            key={t.id} type="button"
            className={`dbr-main-tab${mainTab === t.id ? ' dbr-main-tab--active' : ''}`}
            onClick={() => setMainTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'session' && (
        <>
          {/* ── Session summary bar ── */}
          <div className="dbr-session-bar">
            <div className="dbr-session-summary">
              <span className="dbr-session-summary__lbl">Summary</span>
              <span className="dbr-session-summary__count">
                No. of Session: <strong>{sessions.length}</strong>
              </span>
            </div>
            <div className="dbr-session-actions">
              <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={openAddSessionModal}>
                <i className="fas fa-plus" /> Add Session
              </button>
              <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={() => notify('Refer Session')}>
                <i className="fas fa-share-alt" /> Refer Session
              </button>
              <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={() => notify('Bulk Upload Session')}>
                <i className="fas fa-cloud-upload-alt" /> Bulk Upload Session
              </button>
            </div>
          </div>

          {/* ── Action row ── */}
          <div className="dbr-actions">
            <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Downloading report...')}>
              <i className="fas fa-download" /> Download Report
            </button>
            <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Bulk upload opened')}>
              <i className="fas fa-cloud-upload-alt" /> Bulk Upload Evidence
            </button>
            <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Add daily report')}>
              <i className="fas fa-plus" /> Add Daily Report
            </button>
            <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Referred to HO')}>
              <i className="fas fa-share-alt" /> Refer to HO
            </button>
            <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Bulk action')}>
              <i className="fas fa-tasks" /> Bulk Action
            </button>
            <input
              type="text" className="dbr-search" placeholder="Quick search..."
              value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)}
            />
            <button type="button" className="dbr-btn dbr-btn--pink" onClick={() => notify(`Searching: ${quickSearch || 'all'}`)}>
              <i className="fas fa-search" /> Search
            </button>
            <button type="button" className="dbr-btn dbr-btn--outline">
              <i className="fas fa-filter" /> More
            </button>
          </div>

          {/* ── Redesigned Session Card ── */}
          <SessionCard
            basicDetails={basicDetails}
            session={selectedSession}
            notify={notify}
            onStatusChange={updateSessionStatus}
            onEvidenceUpload={uploadEvidenceFile}
            onEditSession={openEditSessionModal}
          />
        </>
      )}

      {mainTab === 'student' && (
        <div className="dbr-student-view">
          <div className="dbr-session-bar">
            <div className="dbr-session-summary">
              <span className="dbr-session-summary__lbl">Summary</span>
              <span className="dbr-session-summary__count">
                No. of Students: <strong>{DUMMY_STUDENTS.length}</strong>
              </span>
            </div>
          </div>
          <div className="dbr-student-grid">
            {DUMMY_STUDENTS.map((st) => (
              <div key={st.id} className="dbr-student-card">
                <div className="dbr-student-card__head">
                  <i className="fas fa-user-graduate" />
                  <h6>{st.name}</h6>
                  <span className={`dbr-chip ${st.status === 'Active' ? 'dbr-chip--green' : 'dbr-chip--orange'}`}>{st.status}</span>
                </div>
                <div className="dbr-info-line"><i className="fas fa-phone" /><span>{st.mobile}</span></div>
                <div className="dbr-info-line"><i className="fas fa-percent" /><span>Attendance: {st.attendance}</span></div>
                <button type="button" className="dbr-btn dbr-btn--outline dbr-btn--block mt-2" onClick={() => notify(`View ${st.name}`)}>
                  <i className="fas fa-eye" /> View Details
                </button>
              </div>
            ))}
          </div>
          <div className="dbr-section-card mt-3">
            <div className="dbr-section-card__label">Student Metrics</div>
            <div className="dbr-points-grid pt-2">
              {STUDENT_POINTS.map((p) => (
                <PointFieldCard key={p.id} point={p} data={studentData[p.id]}
                  onChange={(f, v) => updateMap(setStudentData, p.id, f, v)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {isSessionModalOpen && (
        <AddSessionModal
          draft={sessionDraft}
          isEdit={Boolean(editingSessionId)}
          onClose={closeSessionModal}
          onSave={saveSessionDraft}
          onFieldChange={updateSessionDraft}
          onEvidenceChange={updateDraftEvidence}
          onAddEvidence={addDraftEvidence}
          onRemoveEvidence={removeDraftEvidence}
        />
      )}

      {toast && (
        <div className="dbr-toast">
          <i className="fas fa-check-circle me-2" />{toast}
        </div>
      )}
    </div>
  );
};

/* ─── CSS ─── */
const PORTAL_CSS = `
  .dbr-portal {
    min-height: 100vh;
    background: linear-gradient(180deg, #fff5f7 0%, #f4f6f9 120px, #f4f6f9 100%);
    padding: 16px 20px 100px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #1e293b;
  }

  /* Header */
  .dbr-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .dbr-title { font-size: 1.35rem; font-weight: 800; margin: 0 0 4px; color: #0f172a; }
  .dbr-breadcrumb { font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .dbr-breadcrumb a { color: ${PINK}; text-decoration: none; font-weight: 600; }
  .dbr-breadcrumb--active { color: ${BLUE}; font-weight: 600; }
  .dbr-header-date { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; }
  .dbr-header-date .react-date-picker { border: none; font-size: 13px; }
  .dbr-header-date .react-date-picker__wrapper { border: none; }

  /* Filters */
  .dbr-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .dbr-filter-pill { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; min-width: 130px; flex: 1; max-width: 190px; }
  .dbr-filter-label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; }
  .dbr-filter-label i { color: ${PINK}; margin-right: 4px; }
  .dbr-filter-select { width: 100%; border: none; background: transparent; font-size: 12px; font-weight: 600; outline: none; cursor: pointer; }

  /* Main tabs */
  .dbr-main-tabs { display: flex; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 12px; max-width: 360px; }
  .dbr-main-tab { flex: 1; padding: 10px 16px; border: none; background: #fff; font-size: 13px; font-weight: 700; color: ${BLUE}; cursor: pointer; transition: 0.15s; }
  .dbr-main-tab:not(:last-child) { border-right: 1px solid #e2e8f0; }
  .dbr-main-tab--active { background: ${PINK}; color: #fff; }

  /* Session bar */
  .dbr-session-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
  .dbr-session-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
  .dbr-session-summary__lbl { font-size: 13px; font-weight: 800; color: #334155; }
  .dbr-session-summary__count { font-size: 12px; color: #64748b; font-weight: 600; }
  .dbr-session-summary__count strong { color: ${BLUE}; font-size: 14px; }
  .dbr-session-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .dbr-btn--session-pill { background: #fff; color: ${PINK}; border: 1.5px solid ${PINK}; border-radius: 999px; padding: 7px 16px; font-size: 11px; font-weight: 700; }
  .dbr-btn--session-pill:hover { background: #fff5f7; }

  /* Actions row */
  .dbr-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
  .dbr-search { flex: 1; min-width: 140px; max-width: 220px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 12px; background: #fff; }
  .dbr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; transition: 0.15s; white-space: nowrap; }
  .dbr-btn--outline { background: #fff; color: ${PINK}; border: 1.5px solid ${PINK}; }
  .dbr-btn--outline:hover { background: #fff5f7; }
  .dbr-btn--pink { background: ${PINK}; color: #fff; }
  .dbr-btn--pink:hover { filter: brightness(0.95); }
  .dbr-btn--block { width: 100%; justify-content: center; }

  /* ════════════════════════════════════════
     REDESIGNED SESSION CARD
  ════════════════════════════════════════ */
  .sc-wrap {
    background: #fff;
    border: 1px solid #bfdbfe;
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 14px;
    box-shadow: 0 8px 22px rgba(37,99,235,0.12);
  }

  /* Head — always one line */
  .sc-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 14px 16px 8px; flex-wrap: nowrap; overflow: visible;
    border-bottom: 0;
    background: linear-gradient(105deg, #1264dc 0%, #1b8def 48%, #2bd2e9 100%);
  }
  .sc-head-left {
    display: flex; align-items: center; gap: 10px;
    min-width: 0; flex: 1 1 0; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 9px;
    padding: 8px 10px;
    background: rgba(255,255,255,0.13);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  }
  .sc-avatar {
    width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
    background: rgba(255,255,255,0.22); color: #fff;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
  }
  .sc-head-text { min-width: 0; overflow: hidden; }
  .sc-trainer-name {
    font-size: 13px; font-weight: 800; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sc-trainer-sub {
    font-size: 11px; color: rgba(255,255,255,0.86); margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sc-head-right {
    display: flex; align-items: center; gap: 6px;
    flex-shrink: 0; flex-wrap: nowrap;
  }

  .sc-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 800; padding: 7px 12px;
    border-radius: 9px; white-space: nowrap; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.35);
    box-shadow: inset 0 -1px 0 rgba(255,255,255,0.18);
  }
  .sc-badge--green { background: rgba(16,185,129,0.9); color: #fff; }
  .sc-badge--amber { background: rgba(245,158,11,0.92); color: #fff; }
  .sc-badge--blue { background: rgba(255,255,255,0.18); color: #fff; }
  .sc-badge--blue code {
    font-family: monospace; font-size: 11px; color: #fff; font-weight: 800;
  }
  .sc-status-control { position: relative; display: inline-flex; align-items: center; gap: 6px; }
  .sc-status-edit {
    border: 1px solid rgba(255,255,255,0.38);
    background: rgba(255,255,255,0.16);
    color: #fff;
    width: 31px;
    height: 31px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
  }
  .sc-status-edit:hover { background: rgba(255,255,255,0.26); }
  .sc-status-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 150px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 18px 40px rgba(15,23,42,0.18);
    padding: 6px;
    z-index: 30;
  }
  .sc-status-menu__item {
    width: 100%;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #334155;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 800;
    padding: 9px 10px;
    text-align: left;
  }
  .sc-status-menu__item:hover,
  .sc-status-menu__item--active { background: #eff6ff; color: ${BLUE}; }

  .sc-copy-btn {
    border: 1px solid rgba(255,255,255,0.36); background: rgba(255,255,255,0.12);
    cursor: pointer; color: #fff;
    font-size: 13px; width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .sc-copy-btn:hover { background: rgba(255,255,255,0.22); color: #fff; }

  .sc-toggle-btn {
    border: 0; background: #fff; border-radius: 50%;
    width: 38px; height: 38px; cursor: pointer; color: ${BLUE}; font-size: 14px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 5px 14px rgba(15,23,42,0.14);
  }
  .sc-toggle-btn:hover { background: #eff6ff; }

  /* Meta row */
  .sc-meta {
    display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap;
    padding: 0 16px 10px; border-bottom: 0;
    background: linear-gradient(105deg, #1264dc 0%, #1b8def 48%, #2bd2e9 100%);
  }
  .sc-meta-item {
    display: flex; align-items: center; gap: 7px; font-size: 12px; color: #fff;
    min-height: 36px; padding: 7px 10px; border-radius: 8px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.28);
    min-width: 0;
  }
  .sc-meta-item i { font-size: 13px; color: rgba(255,255,255,0.92); }
  .sc-meta-item span { font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Stat strip */
  .sc-stats {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    padding: 0 16px 14px;
    border-bottom: 0;
    background: linear-gradient(105deg, #1264dc 0%, #1b8def 48%, #2bd2e9 100%);
  }
  .sc-stat {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 10px 8px; gap: 4px; text-align: center;
    position: relative;
    min-height: 78px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.16);
    box-shadow: inset 0 -1px 0 rgba(255,255,255,0.16);
  }
  .sc-stat + .sc-stat::before {
    content: none;
  }
  .sc-stat__icon {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; margin-bottom: 1px;
  }
  .sc-stat__icon--blue  { background: rgba(219,234,254,0.95); color: #1d4ed8; }
  .sc-stat__icon--green { background: rgba(209,250,229,0.95); color: #059669; }
  .sc-stat__icon--red   { background: rgba(254,226,226,0.95); color: #dc2626; }
  .sc-stat__icon--amber { background: rgba(254,243,199,0.95); color: #d97706; }
  .sc-stat__val { font-size: 20px; font-weight: 900; color: #fff; line-height: 1; }
  .sc-stat__lbl { font-size: 11px; color: rgba(255,255,255,0.86); font-weight: 700; }

  /* Tab bar */
  .sc-tabs {
    display: flex; gap: 0; padding: 0 20px;
    border-bottom: 1px solid #e2e8f0;
  }
  .sc-tab {
    display: inline-flex; align-items: center; gap: 7px; height: 44px;
    border: none; background: none; font-size: 13px; font-weight: 700;
    color: #64748b; cursor: pointer; padding: 0 4px; margin-right: 20px;
    position: relative;
  }
  .sc-tab--active { color: ${BLUE}; }
  .sc-tab--active::after {
    content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
    height: 2px; border-radius: 2px 2px 0 0; background: ${BLUE};
  }

  /* Body */
  .sc-body { padding: 20px 20px 16px; }

  .sc-detail-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 18px 28px; margin-bottom: 16px;
  }
  .sc-detail-item small {
    font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8;
    display: block; margin-bottom: 5px; letter-spacing: 0.04em;
  }
  .sc-detail-item strong {
    font-size: 13px; font-weight: 700; color: #1e293b;
    display: flex; align-items: center; gap: 8px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sc-detail-icon {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .sc-detail-icon--blue { background: #dbeafe; color: #1d4ed8; }
  .sc-detail-icon--pink { background: #fce7ef; color: ${PINK}; }

  .sc-notes {
    border-top: 1px dashed #e2e8f0; padding-top: 14px;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .sc-notes small { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 4px; letter-spacing: 0.04em; }
  .sc-notes p { font-size: 13px; color: #334155; line-height: 1.6; margin: 0; }

  /* Evidence */
  .sc-evidence-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .sc-evidence-card {
    border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;
    display: flex; flex-direction: column; gap: 7px; background: #fafbfc;
  }
  .sc-evidence-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
  }
  .sc-evidence-icon--blue  { background: #dbeafe; color: #1d4ed8; }
  .sc-evidence-icon--amber { background: #fef3c7; color: #d97706; }
  .sc-evidence-icon--green { background: #d1fae5; color: #059669; }
  .sc-evidence-card strong { font-size: 13px; font-weight: 700; color: #1e293b; }
  .sc-evidence-card small { font-size: 11px; font-weight: 600; }
  .ev-uploaded { color: #059669; }
  .ev-pending  { color: #d97706; }
  .sc-file-name {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sc-file-input { display: none; }
  .sc-upload-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 2px;
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: ${BLUE};
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }
  .sc-upload-btn:hover { background: #dbeafe; }

  /* Footer */
  .sc-foot {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 12px 20px; flex-wrap: wrap;
    border-top: 1px solid #f1f5f9; background: #fafbfc;
  }
  .sc-foot-right { display: flex; gap: 10px; flex-wrap: wrap; }
  .sc-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
    cursor: pointer; border: 1.5px solid #e2e8f0;
    background: #fff; color: #334155; transition: 0.15s;
  }
  .sc-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .sc-btn--primary {
    background: ${BLUE}; color: #fff; border-color: ${BLUE};
    box-shadow: 0 4px 12px rgba(37,99,235,0.22);
  }
  .sc-btn--primary:hover { background: #1d4ed8; border-color: #1d4ed8; }

  /* Session modal */
  .session-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(15,23,42,0.52);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
  }
  .session-modal {
    width: min(920px, 100%);
    max-height: 92vh;
    overflow: hidden;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 24px 70px rgba(15,23,42,0.26);
    display: flex;
    flex-direction: column;
  }
  .session-modal__head,
  .session-modal__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid #e2e8f0;
  }
  .session-modal__foot { border-top: 1px solid #e2e8f0; border-bottom: 0; justify-content: flex-end; }
  .session-modal__head h5 { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; }
  .session-modal__head span { color: #64748b; font-size: 12px; font-weight: 800; }
  .session-modal__close {
    width: 34px;
    height: 34px;
    border: 1px solid #e2e8f0;
    background: #fff;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
  }
  .session-modal__close:hover { background: #f8fafc; color: #0f172a; }
  .session-modal__body { overflow-y: auto; padding: 18px; }
  .session-form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .session-field { display: flex; flex-direction: column; gap: 6px; margin: 0; }
  .session-field span {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #64748b;
  }
  .session-field--full { margin-top: 12px; }
  .session-evidence-builder {
    margin-top: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px;
    background: #fafbfc;
  }
  .session-evidence-builder__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }
  .session-evidence-builder__head h6 { margin: 0; font-size: 13px; font-weight: 900; color: #1e293b; }
  .session-mini-btn,
  .session-remove-btn {
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: ${BLUE};
    border-radius: 8px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
    padding: 7px 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .session-remove-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border-color: #fecdd3;
    background: #fff1f2;
    color: #e11d48;
  }
  .session-evidence-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 150px 36px;
    gap: 8px;
    align-items: center;
    margin-top: 8px;
  }

  /* Students */
  .dbr-student-view { margin-bottom: 20px; }
  .dbr-student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; margin-bottom: 14px; }
  .dbr-student-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .dbr-student-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
  .dbr-student-card__head i { color: ${PINK}; }
  .dbr-student-card__head h6 { margin: 0; flex: 1; font-size: 13px; font-weight: 700; }
  .dbr-info-line { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; }
  .dbr-info-line i { width: 16px; color: ${BLUE}; font-size: 11px; }

  /* Shared */
  .dbr-chip { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
  .dbr-chip--green { background: #d1fae5; color: #059669; }
  .dbr-chip--orange { background: #ffedd5; color: #ea580c; }
  .dbr-chip--blue { background: #dbeafe; color: #1d4ed8; }
  .dbr-priority { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; }
  .dbr-priority--high { background: #fee2e2; color: #dc2626; }
  .dbr-priority--medium { background: #ffedd5; color: #ea580c; }
  .dbr-priority--low { background: #dbeafe; color: #2563eb; }
  .dbr-point-id { background: ${BLUE}; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
  .dbr-weight { font-size: 9px; font-weight: 700; color: #94a3b8; margin-left: auto; }
  .dbr-point-name { font-size: 12px; font-weight: 700; margin: 0 0 8px; line-height: 1.35; color: #1e293b; }
  .dbr-point-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .dbr-point-card__top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
  .dbr-point-fields { display: flex; flex-direction: column; gap: 6px; }
  .dbr-issue-type { font-size: 9px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; font-weight: 600; }
  .dbr-input, .dbr-select, .dbr-textarea { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; font-size: 12px; background: #f8fafc; outline: none; width: 100%; }
  .dbr-input:focus, .dbr-select:focus { border-color: ${BLUE}; box-shadow: 0 0 0 2px rgba(37,99,235,0.12); background: #fff; }
  .dbr-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
  .dbr-section-card { position: relative; background: #fff; border: 1px solid #dee2e6; border-radius: 10px; padding: 20px 16px 16px; }
  .dbr-section-card__label { position: absolute; top: -10px; left: 14px; background: #fff; padding: 0 8px; font-size: 13px; font-weight: 700; color: #334155; }
  .dbr-points-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .dbr-toast { position: fixed; bottom: 20px; right: 20px; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 200; display: flex; align-items: center; gap: 8px; }
  .me-2 { margin-right: 8px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 12px; }
  .pt-2 { padding-top: 8px; }

  @media (max-width: 640px) {
    .dbr-portal { padding: 12px 12px 100px; }
    .dbr-filter-pill { max-width: 100%; }
    .dbr-points-grid { grid-template-columns: 1fr; }
    .sc-stats { grid-template-columns: repeat(2, 1fr); }
    .sc-detail-grid { grid-template-columns: 1fr; gap: 14px; }
    .sc-evidence-grid { grid-template-columns: 1fr; }
    .sc-foot { flex-direction: column; }
    .sc-foot-right { width: 100%; flex-direction: column; }
    .sc-btn { width: 100%; justify-content: center; }
    .sc-meta { gap: 10px; flex-wrap: wrap; }
    .sc-head { flex-wrap: wrap; }
    .sc-head-right { flex-wrap: wrap; }
    .sc-badge--blue { display: none; }
    .session-form-grid { grid-template-columns: 1fr; }
    .session-evidence-row { grid-template-columns: 1fr; }
    .session-remove-btn { width: 100%; }
  }

  @media (min-width: 641px) and (max-width: 1100px) {
    .sc-detail-grid { grid-template-columns: repeat(2, 1fr); }
    .sc-evidence-grid { grid-template-columns: repeat(2, 1fr); }
    .session-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`;

export default TrainerModule;

// import React, { useState, useMemo, useCallback } from 'react';
// import DatePicker from 'react-date-picker';
// import 'react-date-picker/dist/DatePicker.css';
// import 'react-calendar/dist/Calendar.css';

// /* ─── Theme tokens (FOCALYT portal pink + blue) ─── */
// const PINK = '#fa5579';
// const BLUE = '#2563eb';

// const FILTER_OPTIONS = {
//   department: ['Skill Development', 'Placement Cell', 'Training Operations'],
//   project: ['PMKVY 4.0', 'DDU-GKY', 'State Skill Mission'],
//   center: ['Delhi Centre – Rohini', 'Noida Centre – Sector 62', 'Gurgaon Centre – Udyog Vihar'],
//   course: ['Retail Sales Associate', 'Data Entry Operator', 'Beauty & Wellness'],
//   batch: ['BATCH-RS-2024-01', 'BATCH-DEO-2024-03', 'BATCH-BW-2024-02'],
// };

// const TRAINER_INFO = {
//   name: 'Rajesh Kumar Sharma',
//   mobile: '9876543210',
//   email: 'rajesh.trainer@focalyt.in',
//   batchCode: 'BATCH-RS-2024-01',
//   course: 'Retail Sales Associate',
//   center: 'Delhi Centre – Rohini',
// };

// const BASIC_DETAILS_INIT = {
//   centerName: 'Delhi Centre – Rohini',
//   trainerName: 'Rajesh Kumar Sharma',
//   projectName: 'PMKVY 4.0',
//   courseTrade: 'Retail Sales Associate',
//   reportingPerson: 'Priya Singh – Centre Manager',
//   batchCode: 'BATCH-RS-2024-01',
//   totalPointsTillDate: '1245',
//   totalDaysTillDate: '42',
// };

// const TAB_NAV = [
//   { id: 'attendance', label: 'Attendance' },
//   { id: 'training', label: 'Training Delivery' },
//   { id: 'studentPoints', label: 'Student Metrics' },
//   { id: 'documents', label: 'Documents' },
//   { id: 'reviewers', label: 'Reviewers' },
//   { id: 'issues', label: 'Issue / Action' },
//   { id: 'summary', label: 'Final Summary' },
// ];

// const MAIN_TABS = [
//   { id: 'session', label: 'Sessions' },
//   { id: 'student', label: 'Students' },
// ];

// const DUMMY_SESSIONS = [
//   { id: 'S001', title: 'Morning Batch – Retail Sales', date: '22/06/2026', status: 'Completed' },
//   { id: 'S002', title: 'Practical – Customer Handling', date: '22/06/2026', status: 'Pending' },
//   { id: 'S003', title: 'Assessment Review', date: '21/06/2026', status: 'Completed' },
// ];

// const DUMMY_STUDENTS = [
//   { id: 'ST01', name: 'Akash Gaurav', mobile: '6280484211', attendance: '92%', status: 'Active' },
//   { id: 'ST02', name: 'Priya Verma', mobile: '9876512340', attendance: '88%', status: 'Active' },
//   { id: 'ST03', name: 'Rohit Singh', mobile: '9123456780', attendance: '76%', status: 'At Risk' },
// ];

// const mkPoint = (id, name, priority, weightage) => ({ id, name, priority, weightage });

// const ATTENDANCE_POINTS = [
//   mkPoint('1.1', 'Total enrolled candidates', 'High', 5),
//   mkPoint('1.2', 'Present candidates', 'High', 10),
//   mkPoint('1.3', 'Absent candidates', 'High', 10),
//   mkPoint('1.4', 'Attendance percentage', 'High', 10),
//   mkPoint('1.5', 'New admissions', 'Medium', 5),
//   mkPoint('1.6', 'Dropout / inactive candidates', 'High', 8),
//   mkPoint('1.7', 'Follow-up done with absent candidates', 'Medium', 7),
//   mkPoint('1.8', 'Student attendance below 40%', 'High', 8),
// ];

// const TRAINING_POINTS = [
//   mkPoint('2.1', 'Topic covered today', 'High', 10),
//   mkPoint('2.2', 'Pending topic', 'Medium', 5),
//   mkPoint('2.3', 'Training hours completed today', 'High', 10),
//   mkPoint('2.4', 'Practical / activity conducted', 'High', 8),
//   mkPoint('2.5', 'Name of activity / practical', 'Medium', 5),
//   mkPoint('2.6', 'Teaching method used', 'Medium', 5),
// ];

// const STUDENT_POINTS = [
//   mkPoint('3.1', 'Student participation in class', 'High', 8),
//   mkPoint('3.2', 'Doubt-clearing done', 'Medium', 6),
//   mkPoint('3.3', 'Engagement activity completed', 'Medium', 6),
//   mkPoint('3.4', 'Counseling / motivation session conducted', 'Low', 4),
//   mkPoint('3.5', 'Placement / career discussion done', 'Low', 4),
//   mkPoint('3.6', 'Candidates guided for job role / career path', 'Medium', 5),
//   mkPoint('3.7', 'Internal assessment performance', 'High', 10),
//   mkPoint('3.8', 'Classroom participation', 'Medium', 7),
// ];

// const DOCUMENT_POINTS = [
//   mkPoint('4.1', 'Attendance updated', 'High', 8),
//   mkPoint('4.2', 'DTR updated', 'High', 8),
//   mkPoint('4.3', 'MIS updated', 'High', 8),
//   mkPoint('4.4', 'Lesson plan followed', 'Medium', 6),
//   mkPoint('4.5', 'ACLP / day-wise lesson plan updated', 'Medium', 6),
//   mkPoint('4.6', 'Batch calendar updated', 'Medium', 5),
//   mkPoint('4.7', 'Batch file updated', 'Medium', 5),
//   mkPoint('4.8', 'Daily report submitted on time', 'High', 10),
// ];

// const ISSUE_POINTS = [
//   { id: '5.1', name: 'Attendance issue', type: 'Attendance', priority: 'High' },
//   { id: '5.2', name: 'Student engagement issue', type: 'Engagement', priority: 'Medium' },
//   { id: '5.3', name: 'Documentation issue', type: 'Documentation', priority: 'Medium' },
//   { id: '5.4', name: 'Infrastructure / center issue', type: 'Infrastructure', priority: 'High' },
//   { id: '5.5', name: 'Pending work for tomorrow', type: 'Action Item', priority: 'Medium' },
// ];

// const emptyPointValue = () => ({
//   value: '', status: 'Pending', evidence: '', remarks: '', selfScore: '',
// });

// const emptyIssueValue = () => ({
//   actionTaken: '', responsible: '', targetDate: '', status: 'Open', remarks: '',
// });

// const emptyDocValue = () => ({
//   status: 'Pending', reviewerRemark: '', fileName: '',
// });

// const buildPointMap = (points) =>
//   Object.fromEntries(points.map((p) => [p.id, emptyPointValue()]));

// const priorityClass = (p) => {
//   if (p === 'High') return 'dbr-priority--high';
//   if (p === 'Medium') return 'dbr-priority--medium';
//   return 'dbr-priority--low';
// };

// const statusChip = (s) => {
//   if (s === 'Completed' || s === 'Done' || s === 'Approved') return 'dbr-chip--green';
//   if (s === 'Missed' || s === 'Returned') return 'dbr-chip--red';
//   if (s === 'Not Applicable') return 'dbr-chip--gray';
//   return 'dbr-chip--orange';
// };

// /* ─── Small reusable pieces ─── */

// const FilterSelect = ({ label, icon, options, value, onChange }) => (
//   <div className="dbr-filter-pill">
//     <label className="dbr-filter-label">
//       <i className={`fas ${icon}`} /> {label}
//     </label>
//     <select className="dbr-filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
//       <option value="">All</option>
//       {options.map((o) => <option key={o} value={o}>{o}</option>)}
//     </select>
//   </div>
// );

// const MiniStat = ({ label, value, bg }) => (
//   <div className="dbr-mini-stat" style={{ background: bg }}>
//     <span>{label}</span>
//     <strong>{value}</strong>
//   </div>
// );

// const ModuleCardShell = ({ title, icon, children, onEdit, extra }) => (
//   <div className="dbr-module-card">
//     <div className="dbr-module-card__head">
//       <span className="dbr-module-card__title">
//         <i className={`fas ${icon}`} /> {title}
//       </span>
//       {extra}
//       {onEdit && (
//         <button type="button" className="dbr-icon-btn" onClick={onEdit} title="Edit">
//           <i className="fas fa-pen" />
//         </button>
//       )}
//     </div>
//     <div className="dbr-module-card__body">{children}</div>
//   </div>
// );

// const PointFieldCard = ({ point, data, onChange }) => (
//   <div className="dbr-point-card">
//     <div className="dbr-point-card__top">
//       <span className="dbr-point-id">{point.id}</span>
//       <span className={`dbr-priority ${priorityClass(point.priority)}`}>{point.priority}</span>
//       <span className="dbr-weight">Wt {point.weightage}</span>
//     </div>
//     <h6 className="dbr-point-name">{point.name}</h6>
//     <div className="dbr-point-fields">
//       <input
//         type="text"
//         className="dbr-input"
//         placeholder="Enter value..."
//         value={data.value}
//         onChange={(e) => onChange('value', e.target.value)}
//       />
//       <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
//         <option>Completed</option>
//         <option>Pending</option>
//         <option>Not Applicable</option>
//       </select>
//       <input
//         type="text"
//         className="dbr-input"
//         placeholder="Evidence / link..."
//         value={data.evidence}
//         onChange={(e) => onChange('evidence', e.target.value)}
//       />
//       <input
//         type="text"
//         className="dbr-input"
//         placeholder="Remarks..."
//         value={data.remarks}
//         onChange={(e) => onChange('remarks', e.target.value)}
//       />
//     </div>
//   </div>
// );

// const DocumentCard = ({ point, data, onChange }) => (
//   <div className="dbr-point-card dbr-doc-card">
//     <div className="dbr-point-card__top">
//       <span className="dbr-point-id">{point.id}</span>
//       <span className={`dbr-chip ${statusChip(data.status)}`}>{data.status}</span>
//     </div>
//     <h6 className="dbr-point-name">{point.name}</h6>
//     <div className="dbr-doc-actions">
//       <button type="button" className="dbr-btn dbr-btn--outline-sm">
//         <i className="fas fa-upload" /> Upload
//       </button>
//       <button type="button" className="dbr-btn dbr-btn--link-sm">View</button>
//     </div>
//     <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
//       <option>Completed</option>
//       <option>Pending</option>
//       <option>Not Applicable</option>
//     </select>
//     <input
//       type="text"
//       className="dbr-input"
//       placeholder="Reviewer remark..."
//       value={data.reviewerRemark}
//       onChange={(e) => onChange('reviewerRemark', e.target.value)}
//     />
//   </div>
// );

// const IssueCard = ({ issue, data, onChange }) => (
//   <div className="dbr-point-card dbr-issue-card">
//     <div className="dbr-point-card__top">
//       <span className="dbr-point-id">{issue.id}</span>
//       <span className={`dbr-priority ${priorityClass(issue.priority)}`}>{issue.priority}</span>
//       <span className="dbr-issue-type">{issue.type}</span>
//     </div>
//     <h6 className="dbr-point-name">{issue.name}</h6>
//     <div className="dbr-point-fields">
//       <input className="dbr-input" placeholder="Action taken..." value={data.actionTaken} onChange={(e) => onChange('actionTaken', e.target.value)} />
//       <input className="dbr-input" placeholder="Responsible person..." value={data.responsible} onChange={(e) => onChange('responsible', e.target.value)} />
//       <input type="date" className="dbr-input" value={data.targetDate} onChange={(e) => onChange('targetDate', e.target.value)} />
//       <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
//         <option>Open</option>
//         <option>In Progress</option>
//         <option>Resolved</option>
//       </select>
//       <input className="dbr-input" placeholder="Remarks..." value={data.remarks} onChange={(e) => onChange('remarks', e.target.value)} />
//     </div>
//   </div>
// );

// const ReviewerPanel = ({ title, reviewerKey, data, onChange, onApprove, onReturn }) => (
//   <div className="dbr-reviewer-card">
//     <div className="dbr-reviewer-card__head">
//       <i className="fas fa-user-shield" />
//       <h6>{title}</h6>
//     </div>
//     <div className="dbr-reviewer-fields">
//       <label className="dbr-lbl">Reviewer Name</label>
//       <input className="dbr-input dbr-input--ro" readOnly value={data.reviewerName} />
//       <label className="dbr-lbl">Review Status</label>
//       <select className="dbr-select" value={data.status} onChange={(e) => onChange('status', e.target.value)}>
//         <option>Pending</option>
//         <option>Approved</option>
//         <option>Returned</option>
//       </select>
//       <label className="dbr-lbl">Score</label>
//       <input type="number" className="dbr-input" min="0" max="100" value={data.score} onChange={(e) => onChange('score', e.target.value)} />
//       <label className="dbr-lbl">Review Date</label>
//       <input type="date" className="dbr-input" value={data.reviewDate} onChange={(e) => onChange('reviewDate', e.target.value)} />
//       <label className="dbr-lbl">Remarks</label>
//       <textarea className="dbr-textarea" rows={3} value={data.remarks} onChange={(e) => onChange('remarks', e.target.value)} />
//     </div>
//     <div className="dbr-reviewer-btns">
//       <button type="button" className="dbr-btn dbr-btn--green" onClick={onApprove}>
//         <i className="fas fa-check" /> Approve
//       </button>
//       <button type="button" className="dbr-btn dbr-btn--orange" onClick={onReturn}>
//         <i className="fas fa-undo" /> Return for Correction
//       </button>
//     </div>
//   </div>
// );

// /* ─── Main page ─── */

// const TrainerModule = () => {
//   const [reportDate, setReportDate] = useState(new Date());
//   const [filters, setFilters] = useState({
//     department: 'Skill Development', project: 'PMKVY 4.0', center: 'Delhi Centre – Rohini',
//     course: 'Retail Sales Associate', batch: 'BATCH-RS-2024-01',
//   });
//   const [quickSearch, setQuickSearch] = useState('');
//   const [cardsExpanded, setCardsExpanded] = useState(true);
//   const [mainTab, setMainTab] = useState('session');
//   const [sessions, setSessions] = useState(DUMMY_SESSIONS);
//   const [activeTab, setActiveTab] = useState('details');
//   const [reportStatus, setReportStatus] = useState('Draft');
//   const [basicDetails, setBasicDetails] = useState(BASIC_DETAILS_INIT);
//   const [finalRemarks, setFinalRemarks] = useState('');
//   const [finalStatus, setFinalStatus] = useState('Pending');
//   const [toast, setToast] = useState('');

//   const [attendanceData, setAttendanceData] = useState(() => buildPointMap(ATTENDANCE_POINTS));
//   const [trainingData, setTrainingData] = useState(() => buildPointMap(TRAINING_POINTS));
//   const [studentData, setStudentData] = useState(() => buildPointMap(STUDENT_POINTS));
//   const [documentData, setDocumentData] = useState(() => buildPointMap(DOCUMENT_POINTS));
//   const [issueData, setIssueData] = useState(() =>
//     Object.fromEntries(ISSUE_POINTS.map((p) => [p.id, emptyIssueValue()]))
//   );

//   const [reviewers, setReviewers] = useState({
//     centreManager: { reviewerName: 'Priya Singh', status: 'Pending', score: '', remarks: '', reviewDate: '' },
//     batchCoordinator: { reviewerName: 'Vikram Mehta', status: 'Pending', score: '', remarks: '', reviewDate: '' },
//     misQa: { reviewerName: 'HO – QA Team', status: 'Pending', score: '', remarks: '', reviewDate: '' },
//   });

//   const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

//   const allPointMaps = useMemo(() => ({
//     ...attendanceData, ...trainingData, ...studentData,
//   }), [attendanceData, trainingData, studentData]);

//   const totalWeightage = [...ATTENDANCE_POINTS, ...TRAINING_POINTS, ...STUDENT_POINTS, ...DOCUMENT_POINTS]
//     .reduce((s, p) => s + p.weightage, 0);

//   const totalSelfScore = useMemo(
//     () => Object.values(allPointMaps).reduce((s, d) => s + (parseFloat(d.selfScore) || parseFloat(d.value) || 0), 0),
//     [allPointMaps]
//   );

//   const averageScore = basicDetails.averageScore;

//   const updateMap = useCallback((setter, id, field, val) => {
//     setter((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
//   }, []);

//   const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

//   const approvalPillClass = {
//     Draft: 'dbr-approval--draft',
//     Submitted: 'dbr-approval--submitted',
//     Approved: 'dbr-approval--approved',
//     Returned: 'dbr-approval--returned',
//   }[reportStatus] || 'dbr-approval--draft';

//   return (
//     <div className="dbr-portal">
//       <style>{PORTAL_CSS}</style>

//       {/* ── Header ── */}
//       <header className="dbr-header">
//         <div>
//           <h1 className="dbr-title">Trainer Report Card</h1>
//           <nav className="dbr-breadcrumb">  
//             <a href="/">Home</a>
//             <span>/</span>
//             <span>Training Module</span>
//             <span>/</span>
//             <span className="dbr-breadcrumb--active">Daily Report Card</span>
//           </nav>
//         </div>
//         <div className="dbr-header-date">
//           <i className="fas fa-calendar-alt" />
//           <DatePicker value={reportDate} onChange={setReportDate} format="dd/MM/yyyy" clearIcon={null} />
//         </div>
//       </header>

//       {/* ── Filters ── */}
//       <div className="dbr-filters">
//         <FilterSelect label="Department" icon="fa-sitemap" options={FILTER_OPTIONS.department} value={filters.department} onChange={(v) => setFilter('department', v)} />
//         <FilterSelect label="Project" icon="fa-project-diagram" options={FILTER_OPTIONS.project} value={filters.project} onChange={(v) => setFilter('project', v)} />
//         <FilterSelect label="Center" icon="fa-building" options={FILTER_OPTIONS.center} value={filters.center} onChange={(v) => setFilter('center', v)} />
//         <FilterSelect label="Course" icon="fa-graduation-cap" options={FILTER_OPTIONS.course} value={filters.course} onChange={(v) => setFilter('course', v)} />
//         <FilterSelect label="Batch" icon="fa-users" options={FILTER_OPTIONS.batch} value={filters.batch} onChange={(v) => setFilter('batch', v)} />
//       </div>

//       {/* ── Main tabs: Sessions | Students ── */}
//       <div className="dbr-main-tabs">
//         {MAIN_TABS.map((t) => (
//           <button
//             key={t.id}
//             type="button"
//             className={`dbr-main-tab${mainTab === t.id ? ' dbr-main-tab--active' : ''}`}
//             onClick={() => setMainTab(t.id)}
//           >
//             {t.label}
//           </button>
//         ))}
//       </div>

//       {mainTab === 'session' && (
//         <>
//       {/* ── Session summary + action buttons ── */}
//       <div className="dbr-session-bar">
//         <div className="dbr-session-summary">
//           <span className="dbr-session-summary__lbl">Summary</span>
//           <span className="dbr-session-summary__count">
//             No. of Session: <strong>{sessions.length}</strong>
//           </span>
//         </div>
//         <div className="dbr-session-actions">
//           <button
//             type="button"
//             className="dbr-btn dbr-btn--session-pill"
//             onClick={() => {
//               const n = sessions.length + 1;
//               setSessions((prev) => [
//                 ...prev,
//                 { id: `S${String(n).padStart(3, '0')}`, title: 'New Session', date: new Date().toLocaleDateString('en-IN'), status: 'Pending' },
//               ]);
//               notify('Session added');
//             }}
//           >
//             <i className="fas fa-plus" /> Add Session
//           </button>
//           <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={() => notify('Refer Session')}>
//             <i className="fas fa-share-alt" /> Refer Session
//           </button>
//           <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={() => notify('Bulk Upload Session')}>
//             <i className="fas fa-cloud-upload-alt" /> Bulk Upload Session
//           </button>
//         </div>
//       </div>

//       {/* ── Action row ── */}
//       <div className="dbr-actions">
//         <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Downloading report...')}>
//           <i className="fas fa-download" /> Download Report
//         </button>
//         <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Bulk upload opened')}>
//           <i className="fas fa-cloud-upload-alt" /> Bulk Upload Evidence
//         </button>
//         <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => { setActiveTab('details'); notify('Add daily report'); }}>
//           <i className="fas fa-plus" /> Add Daily Report
//         </button>
//         <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Referred to HO')}>
//           <i className="fas fa-share-alt" /> Refer to HO
//         </button>
//         <button type="button" className="dbr-btn dbr-btn--outline" onClick={() => notify('Bulk action')}>
//           <i className="fas fa-tasks" /> Bulk Action
//         </button>
//         <input
//           type="text"
//           className="dbr-search"
//           placeholder="Quick search..."
//           value={quickSearch}
//           onChange={(e) => setQuickSearch(e.target.value)}
//         />
//         <button type="button" className="dbr-btn dbr-btn--pink" onClick={() => notify(`Searching: ${quickSearch || 'all'}`)}>
//           <i className="fas fa-search" /> Search
//         </button>
//         <button type="button" className="dbr-btn dbr-btn--outline">
//           <i className="fas fa-filter" /> More
//         </button>
//       </div>

//       {/* ── Lead-style hero banner + detail card ── */}
//       <div className="tm-hero-wrap">
//         <div className="tm-session-card">
//               <div className="tm-session-card__identity">
//                 <div className="tm-person-line">
//                   <span className="tm-person-line__icon"><i className="far fa-user-circle" /></span>
//                   <span>
//                     <strong>{basicDetails.trainerName}</strong>
//                     <small>Trainer</small>
//                   </span>
//                 </div>
//                 <div className="tm-person-line">
//                   <span className="tm-person-line__icon"><i className="far fa-building" /></span>
//                   <span>
//                     <strong>{basicDetails.centerName}</strong>
//                     <small>Training Centre</small>
//                   </span>
//                 </div>
//                 <div className="tm-person-line">
//                   <span className="tm-person-line__icon"><i className="fas fa-phone-alt" /></span>
//                   <span>
//                     <strong>{TRAINER_INFO.mobile}</strong>
//                     <small>Contact Number</small>
//                   </span>
//                 </div>
//               </div>

//               <div className="tm-session-card__meta">
//                 <div>
//                   <span className="tm-overline">Session Status</span>
//                   <span className="tm-status-pill">Completed</span>
//                 </div>
//                 <div>
//                   <span className="tm-overline">Session ID</span>
//                   <strong className="tm-session-id">
//                     S-20240622-01
//                     <button type="button" className="tm-copy-btn" title="Copy session id" onClick={() => notify('Session ID copied')}>
//                       <i className="far fa-copy" />
//                     </button>
//                   </strong>
//                 </div>
//               </div>

//               <div className="tm-session-card__stats">
//                 {[
//                   ['fa-user-friends', 'Total Candidates', '30', 'blue'],
//                   ['fa-check', 'Present', '26', 'green'],
//                   ['fa-times', 'Absent', '4', 'red'],
//                   ['fa-percent', 'Attendance %', '86.7%', 'orange'],
//                 ].map(([icon, label, value, tone]) => (
//                   <div key={label} className={`tm-stat-card tm-stat-card--${tone}`}>
//                     <span className="tm-stat-card__icon"><i className={`fas ${icon}`} /></span>
//                     <strong>{value}</strong>
//                     <span>{label}</span>
//                   </div>
//                 ))}
//               </div>

//               <div className="tm-session-card__schedule">
//                 <div><i className="far fa-calendar" /> <span>22 Jun 2026</span></div>
//                 <div><i className="far fa-clock" /> <span>10:00 AM - 12:00 PM</span></div>
//                 <div><i className="fas fa-hourglass-half" /> <span>2 hrs</span></div>
//               </div>
//           <button
//             type="button"
//             className="tm-session-card__toggle"
//             onClick={() => setCardsExpanded((e) => !e)}
//             title={cardsExpanded ? 'Collapse' : 'Expand'}
//           >
//             <i className={`fas fa-chevron-${cardsExpanded ? 'up' : 'down'}`} />
//           </button>
//         </div>

//       </div>

//       {cardsExpanded && (
//       <section className="tm-session-body">
//         <div className="tm-session-body__tabs">
//           <button
//             type="button"
//             className={`tm-body-tab${activeTab === 'details' ? ' tm-body-tab--active' : ''}`}
//             onClick={() => setActiveTab('details')}
//           >
//             <i className="far fa-list-alt" /> Session Details
//           </button>
//           <button
//             type="button"
//             className={`tm-body-tab${activeTab === 'evidence' ? ' tm-body-tab--active' : ''}`}
//             onClick={() => setActiveTab('evidence')}
//           >
//             <i className="far fa-image" /> Evidence
//           </button>
//         </div>

//         {activeTab === 'details' ? (
//           <div className="tm-session-body__content">
//             <div className="tm-detail-grid">
//               {[
//                 ['fa-book-open', 'Topic', 'Basics of Retail & Customer Service', 'blue'],
//                 ['fa-graduation-cap', 'Course / Trade', basicDetails.courseTrade, 'blue'],
//                 ['fa-hashtag', 'Batch Code', basicDetails.batchCode, 'pink'],
//                 ['fa-chalkboard', 'Training Method', 'Interactive Learning', 'blue'],
//                 ['fa-clock', 'Duration', '2 hrs', 'blue'],
//                 ['fa-user-friends', 'Trainer', basicDetails.trainerName, 'pink'],
//               ].map(([icon, label, value, tone]) => (
//                 <div key={label} className="tm-detail-item">
//                   <span className={`tm-detail-item__icon tm-detail-item__icon--${tone}`}>
//                     <i className={`fas ${icon}`} />
//                   </span>
//                   <span>
//                     <small>{label}</small>
//                     <strong>{value}</strong>
//                   </span>
//                 </div>
//               ))}
//             </div>

//             <div className="tm-notes-row">
//               <span className="tm-detail-item__icon tm-detail-item__icon--blue">
//                 <i className="far fa-edit" />
//               </span>
//               <span>
//                 <small>Additional Notes</small>
//                 <strong>Covered basics of customer service and communication skills.</strong>
//               </span>
//             </div>
//           </div>
//         ) : (
//           <div className="tm-session-body__content">
//             <div className="tm-evidence-grid">
//               {[
//                 ['fa-image', 'Class Photo', 'Uploaded'],
//                 ['fa-file-alt', 'Attendance Sheet', 'Pending'],
//                 ['fa-video', 'Training Clip', 'Uploaded'],
//               ].map(([icon, title, status]) => (
//                 <div key={title} className="tm-evidence-card">
//                   <span><i className={`fas ${icon}`} /></span>
//                   <strong>{title}</strong>
//                   <small className={status === 'Uploaded' ? 'text-success' : 'text-warning'}>{status}</small>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         <div className="tm-session-body__actions">
//           <button type="button" className="tm-action-btn tm-action-btn--outline" onClick={() => notify('Edit session')}>
//             <i className="far fa-edit" /> Edit Session
//           </button>
//           <div className="tm-session-body__action-group">
//             <button type="button" className="tm-action-btn tm-action-btn--outline" onClick={() => notify('Mark attendance')}>
//               <i className="fas fa-user-check" /> Mark Attendance
//             </button>
//             <button type="button" className="tm-action-btn tm-action-btn--solid" onClick={() => notify('View attendance')}>
//               <i className="far fa-chart-bar" /> View Attendance
//             </button>
//           </div>
//         </div>
//       </section>
//       )}


  
//         </>
//       )}

//       {mainTab === 'student' && (
//         <div className="dbr-student-view">
//           <div className="dbr-session-bar">
//             <div className="dbr-session-summary">
//               <span className="dbr-session-summary__lbl">Summary</span>
//               <span className="dbr-session-summary__count">
//                 No. of Students: <strong>{DUMMY_STUDENTS.length}</strong>
//               </span>
//             </div>
//           </div>

//           <div className="dbr-student-grid">
//             {DUMMY_STUDENTS.map((st) => (
//               <div key={st.id} className="dbr-student-card">
//                 <div className="dbr-student-card__head">
//                   <i className="fas fa-user-graduate" />
//                   <h6>{st.name}</h6>
//                   <span className={`dbr-chip ${st.status === 'Active' ? 'dbr-chip--green' : 'dbr-chip--orange'}`}>{st.status}</span>
//                 </div>
//                 <div className="dbr-info-line"><i className="fas fa-phone" /><span>{st.mobile}</span></div>
//                 <div className="dbr-info-line"><i className="fas fa-percent" /><span>Attendance: {st.attendance}</span></div>
//                 <button type="button" className="dbr-btn dbr-btn--outline dbr-btn--block mt-2" onClick={() => notify(`View ${st.name}`)}>
//                   <i className="fas fa-eye" /> View Details
//                 </button>
//               </div>
//             ))}
//           </div>

//           <div className="dbr-section-card mt-3">
//             <div className="dbr-section-card__label">Student Metrics</div>
//             <div className="dbr-points-grid pt-2">
//               {STUDENT_POINTS.map((p) => (
//                 <PointFieldCard
//                   key={p.id}
//                   point={p}
//                   data={studentData[p.id]}
//                   onChange={(f, v) => updateMap(setStudentData, p.id, f, v)}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {toast && <div className="dbr-toast"><i className="fas fa-check-circle me-2" />{toast}</div>}
//     </div>
//   );
// };

// /* ─── Portal CSS (Tailwind-like utility layer, scoped) ─── */
// const PORTAL_CSS = `
//   .dbr-portal {
//     min-height: 100vh;
//     background: linear-gradient(180deg, #fff5f7 0%, #f4f6f9 120px, #f4f6f9 100%);
//     padding: 16px 20px 100px;
//     font-family: 'Segoe UI', system-ui, sans-serif;
//     color: #1e293b;
//   }
//   .dbr-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
//   .dbr-title { font-size: 1.35rem; font-weight: 800; margin: 0 0 4px; color: #0f172a; }
//   .dbr-breadcrumb { font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
//   .dbr-breadcrumb a { color: ${PINK}; text-decoration: none; font-weight: 600; }
//   .dbr-breadcrumb--active { color: ${BLUE}; font-weight: 600; }
//   .dbr-header-date { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; }
//   .dbr-header-date .react-date-picker { border: none; font-size: 13px; }
//   .dbr-header-date .react-date-picker__wrapper { border: none; }

//   .dbr-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
//   .dbr-filter-pill { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; min-width: 130px; flex: 1; max-width: 190px; }
//   .dbr-filter-label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; }
//   .dbr-filter-label i { color: ${PINK}; margin-right: 4px; }
//   .dbr-filter-select { width: 100%; border: none; background: transparent; font-size: 12px; font-weight: 600; outline: none; cursor: pointer; }

//   .dbr-main-tabs { display: flex; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 12px; max-width: 360px; }
//   .dbr-main-tab { flex: 1; padding: 10px 16px; border: none; background: #fff; font-size: 13px; font-weight: 700; color: ${BLUE}; cursor: pointer; transition: 0.15s; }
//   .dbr-main-tab:not(:last-child) { border-right: 1px solid #e2e8f0; }
//   .dbr-main-tab--active { background: ${PINK}; color: #fff; }

//   .dbr-session-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
//   .dbr-session-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
//   .dbr-session-summary__lbl { font-size: 13px; font-weight: 800; color: #334155; }
//   .dbr-session-summary__count { font-size: 12px; color: #64748b; font-weight: 600; }
//   .dbr-session-summary__count strong { color: ${BLUE}; font-size: 14px; }
//   .dbr-session-actions { display: flex; flex-wrap: wrap; gap: 8px; }
//   .dbr-btn--session-pill { background: #fff; color: ${PINK}; border: 1.5px solid ${PINK}; border-radius: 999px; padding: 7px 16px; font-size: 11px; font-weight: 700; }
//   .dbr-btn--session-pill:hover { background: #fff5f7; }

//   .dbr-student-view { margin-bottom: 20px; }
//   .dbr-student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; margin-bottom: 14px; }
//   .dbr-student-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
//   .dbr-student-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
//   .dbr-student-card__head i { color: ${PINK}; }
//   .dbr-student-card__head h6 { margin: 0; flex: 1; font-size: 13px; font-weight: 700; }

//   .dbr-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
//   .dbr-search { flex: 1; min-width: 140px; max-width: 220px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 12px; background: #fff; }

//   .dbr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; transition: 0.15s; white-space: nowrap; }
//   .dbr-btn--outline { background: #fff; color: ${PINK}; border: 1.5px solid ${PINK}; }
//   .dbr-btn--outline:hover { background: #fff5f7; }
//   .dbr-btn--pink { background: ${PINK}; color: #fff; }
//   .dbr-btn--pink:hover { filter: brightness(0.95); }
//   .dbr-btn--blue { background: ${BLUE}; color: #fff; }
//   .dbr-btn--green { background: #10b981; color: #fff; flex: 1; justify-content: center; }
//   .dbr-btn--orange { background: #fff; color: #ea580c; border: 1.5px solid #fdba74; flex: 1; justify-content: center; }
//   .dbr-btn--danger { background: #fff; color: #dc2626; border: 1.5px solid #fecaca; }
//   .dbr-btn--block { width: 100%; justify-content: center; }
//   .dbr-btn--link-sm { background: none; border: none; color: ${BLUE}; font-size: 11px; font-weight: 600; cursor: pointer; }

//   .dbr-card-row-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; overflow: hidden; }
//   .dbr-card-row-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
//   .dbr-section-lbl { font-size: 12px; font-weight: 700; color: #475569; }
//   .dbr-card-row-wrap--collapsed .dbr-card-row { display: none; }
//   .dbr-card-row { display: flex; gap: 10px; overflow-x: auto; padding: 12px; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }
//   .dbr-card-row::-webkit-scrollbar { height: 6px; }
//   .dbr-card-row::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

//   .dbr-module-card { flex: 0 0 210px; background: #fff; border: 1px solid #e8edf2; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); min-height: 170px; }
//   .dbr-module-card__head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px dashed #e2e8f0; background: #fafbfc; border-radius: 12px 12px 0 0; }
//   .dbr-module-card__title { font-size: 11px; font-weight: 700; color: #334155; }
//   .dbr-module-card__title i { color: ${PINK}; margin-right: 4px; }
//   .dbr-module-card__body { padding: 10px; font-size: 11px; }
//   .dbr-icon-btn { background: none; border: none; color: ${BLUE}; cursor: pointer; padding: 4px; font-size: 12px; }

//   .dbr-info-line { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f8fafc; }
//   .dbr-info-line i { width: 16px; color: ${BLUE}; font-size: 11px; }
//   .dbr-info-line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

//   .dbr-kv { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 11px; }
//   .dbr-kv span:first-child { color: #64748b; font-weight: 600; }
//   .dbr-kv strong { color: #0f172a; }

//   .dbr-mini-row { display: flex; gap: 4px; }
//   .dbr-mini-stat { flex: 1; border-radius: 8px; color: #fff; text-align: center; padding: 6px 4px; font-size: 9px; font-weight: 600; }
//   .dbr-mini-stat strong { display: block; font-size: 14px; margin-top: 2px; }

//   .dbr-att-pct { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-weight: 700; }

//   .dbr-chip { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
//   .dbr-chip--green { background: #d1fae5; color: #059669; }
//   .dbr-chip--orange { background: #ffedd5; color: #ea580c; }
//   .dbr-chip--red { background: #fee2e2; color: #dc2626; }
//   .dbr-chip--blue { background: #dbeafe; color: #1d4ed8; }
//   .dbr-chip--gray { background: #f1f5f9; color: #64748b; }

//   .dbr-approval-pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px; }
//   .dbr-approval--draft { background: #f1f5f9; color: #64748b; }
//   .dbr-approval--submitted { background: #dbeafe; color: #1d4ed8; }
//   .dbr-approval--approved { background: #d1fae5; color: #059669; }
//   .dbr-approval--returned { background: #fee2e2; color: #dc2626; }

//   .dbr-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
//   .dbr-tab { background: #fff; border: 1px solid #e2e8f0; color: ${BLUE}; font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px; cursor: pointer; }
//   .dbr-tab--active { background: ${PINK}; color: #fff; border-color: ${PINK}; box-shadow: 0 2px 8px rgba(250,85,121,0.35); }

//   .dbr-tab-panel { margin-bottom: 20px; }
//   .dbr-section-card, .dbr-summary-card { position: relative; background: #fff; border: 1px solid #dee2e6; border-radius: 10px; padding: 20px 16px 16px; }
//   .dbr-section-card__label { position: absolute; top: -10px; left: 14px; background: #fff; padding: 0 8px; font-size: 13px; font-weight: 700; color: #334155; }

//   .dbr-basic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
//   .dbr-field { display: flex; flex-direction: column; gap: 4px; }
//   .dbr-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
//   .dbr-input, .dbr-select, .dbr-textarea { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; font-size: 12px; background: #f8fafc; outline: none; width: 100%; }
//   .dbr-input:focus, .dbr-select:focus, .dbr-textarea:focus { border-color: ${BLUE}; box-shadow: 0 0 0 2px rgba(37,99,235,0.12); background: #fff; }
//   .dbr-input--ro { background: #f1f5f9; color: #64748b; }

//   .dbr-points-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
//   .dbr-point-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
//   .dbr-point-card__top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
//   .dbr-point-id { background: ${BLUE}; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
//   .dbr-priority { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; }
//   .dbr-priority--high { background: #fee2e2; color: #dc2626; }
//   .dbr-priority--medium { background: #ffedd5; color: #ea580c; }
//   .dbr-priority--low { background: #dbeafe; color: #2563eb; }
//   .dbr-weight { font-size: 9px; font-weight: 700; color: #94a3b8; margin-left: auto; }
//   .dbr-point-name { font-size: 12px; font-weight: 700; margin: 0 0 8px; line-height: 1.35; color: #1e293b; }
//   .dbr-point-fields { display: flex; flex-direction: column; gap: 6px; }
//   .dbr-issue-type { font-size: 9px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; font-weight: 600; }
//   .dbr-doc-actions { display: flex; gap: 8px; margin-bottom: 8px; }
//   .dbr-btn--outline-sm { background: #eff6ff; color: ${BLUE}; border: 1px dashed #93c5fd; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; }

//   .dbr-reviewers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
//   .dbr-reviewer-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid ${PINK}; padding: 14px; }
//   .dbr-reviewer-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: ${PINK}; }
//   .dbr-reviewer-card__head h6 { margin: 0; font-weight: 800; font-size: 13px; color: #1e293b; }
//   .dbr-reviewer-fields { display: flex; flex-direction: column; gap: 6px; }
//   .dbr-reviewer-btns { display: flex; gap: 8px; margin-top: 12px; }

//   .dbr-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 8px; }
//   .dbr-summary-stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
//   .dbr-summary-stat small { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
//   .dbr-summary-stat strong { font-size: 18px; color: #0f172a; }

//   .dbr-footer { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 2px solid ${PINK}; padding: 10px 20px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; z-index: 100; box-shadow: 0 -4px 16px rgba(0,0,0,0.06); }
//   .dbr-toast { position: fixed; bottom: 70px; right: 20px; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 200; }

//   /* Session overview card */
//   .tm-session-card {
//     position: relative;
//     display: grid;
//     grid-template-columns: minmax(220px, 1.2fr) minmax(130px, 0.7fr) minmax(300px, 1.45fr) minmax(170px, 0.85fr);
//     gap: 14px;
//     align-items: stretch;
//     min-height: 148px;
//     margin-bottom: 14px;
//     padding: 20px 64px 20px 20px;
//     border: 1px solid #dbe4ef;
//     border-radius: 16px;
//     background: #ffffff;
//     box-shadow: 0 12px 30px rgba(15,23,42,0.06);
//   }
//   .tm-session-card--collapsed { min-height: 54px; padding: 12px 70px 12px 18px; }
//   .tm-session-card__identity {
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//     gap: 10px;
//     padding: 16px;
//     border-radius: 12px;
//     background: #f5f8ff;
//     border: 1px solid #e4ebf7;
//   }
//   .tm-person-line { display: flex; align-items: center; gap: 12px; min-width: 0; }
//   .tm-person-line__icon {
//     width: 36px; height: 36px;
//     display: inline-flex; align-items: center; justify-content: center;
//     flex: 0 0 36px;
//     border-radius: 10px;
//     background: #e5edff;
//     color: #1d4ed8;
//     font-size: 15px;
//     box-shadow: inset 0 0 0 1px rgba(37,99,235,0.08);
//   }
//   .tm-person-line span:last-child { min-width: 0; }
//   .tm-person-line strong {
//     display: block;
//     color: #0f172a;
//     font-size: 13px;
//     line-height: 1.25;
//     font-weight: 800;
//     overflow: hidden;
//     text-overflow: ellipsis;
//     white-space: nowrap;
//   }
//   .tm-person-line small {
//     display: block;
//     margin-top: 2px;
//     color: #64748b;
//     font-size: 11px;
//     font-weight: 700;
//   }
//   .tm-session-card__meta {
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//     gap: 24px;
//     min-width: 0;
//   }
//   .tm-overline {
//     display: block;
//     margin-bottom: 7px;
//     color: #64748b;
//     font-size: 10px;
//     font-weight: 800;
//     letter-spacing: 0.09em;
//     text-transform: uppercase;
//   }
//   .tm-status-pill {
//     display: inline-flex;
//     align-items: center;
//     min-height: 30px;
//     padding: 5px 14px;
//     border-radius: 999px;
//     background: #d8f7e6;
//     color: #059669;
//     font-size: 13px;
//     font-weight: 800;
//   }
//   .tm-session-id {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     min-width: 0;
//     color: #111827;
//     font-size: 13px;
//     font-weight: 800;
//     line-height: 1.2;
//   }
//   .tm-copy-btn {
//     width: 22px; height: 22px;
//     display: inline-flex; align-items: center; justify-content: center;
//     border: none;
//     background: transparent;
//     color: #64748b;
//     cursor: pointer;
//   }
//   .tm-copy-btn:hover { color: ${BLUE}; }
//   .tm-session-card__stats {
//     display: grid;
//     grid-template-columns: repeat(4, minmax(68px, 1fr));
//     gap: 10px;
//     align-content: stretch;
//   }
//   .tm-stat-card {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     gap: 7px;
//     min-height: 120px;
//     padding: 12px 8px;
//     border: 1px solid #dce5f0;
//     border-radius: 12px;
//     text-align: center;
//   }
//   .tm-stat-card--blue { background: linear-gradient(180deg, #f3f6ff 0%, #eef4ff 100%); }
//   .tm-stat-card--green { background: linear-gradient(180deg, #f1fbf6 0%, #ecfdf5 100%); }
//   .tm-stat-card--red { background: linear-gradient(180deg, #fff5f4 0%, #feeef0 100%); }
//   .tm-stat-card--orange { background: linear-gradient(180deg, #fff8ed 0%, #fff3df 100%); }
//   .tm-stat-card__icon {
//     width: 46px; height: 46px;
//     display: inline-flex; align-items: center; justify-content: center;
//     border-radius: 13px;
//     font-size: 18px;
//   }
//   .tm-stat-card--blue .tm-stat-card__icon { background: #dbe7ff; color: #2563eb; }
//   .tm-stat-card--green .tm-stat-card__icon { background: #cff7df; color: #059669; }
//   .tm-stat-card--red .tm-stat-card__icon { background: #ffe0e3; color: #dc2626; }
//   .tm-stat-card--orange .tm-stat-card__icon { background: #ffead1; color: #d97706; }
//   .tm-stat-card strong {
//     color: #0f172a;
//     font-size: 24px;
//     font-weight: 800;
//     line-height: 1;
//   }
//   .tm-stat-card span:last-child {
//     color: #111827;
//     font-size: 11px;
//     font-weight: 750;
//     line-height: 1.2;
//   }
//   .tm-session-card__schedule {
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//     gap: 15px;
//     min-width: 0;
//     padding-left: 6px;
//   }
//   .tm-session-card__schedule div {
//     display: flex;
//     align-items: center;
//     gap: 10px;
//     color: #334155;
//     font-size: 13px;
//     font-weight: 750;
//     min-width: 0;
//   }
//   .tm-session-card__schedule i {
//     width: 22px;
//     color: #475569;
//     font-size: 16px;
//     text-align: center;
//     flex-shrink: 0;
//   }
//   .tm-session-card__schedule span {
//     overflow: hidden;
//     text-overflow: ellipsis;
//     white-space: nowrap;
//   }
//   .tm-session-card__toggle {
//     position: absolute;
//     top: 20px; right: 20px;
//     width: 40px; height: 40px;
//     border: 1px solid #e2e8f0;
//     border-radius: 999px;
//     background: #fff;
//     color: ${BLUE};
//     display: inline-flex; align-items: center; justify-content: center;
//     cursor: pointer;
//     box-shadow: 0 8px 18px rgba(15,23,42,0.08);
//     transition: 0.15s;
//   }
//   .tm-session-card__toggle:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(15,23,42,0.12); }

//   /* Session body card */
//   .tm-session-body {
//     overflow: hidden;
//     margin-bottom: 18px;
//     border: 1px solid #dbe4ef;
//     border-radius: 16px;
//     background: #fff;
//     box-shadow: 0 12px 30px rgba(15,23,42,0.055);
//   }
//   .tm-session-body__tabs {
//     display: flex;
//     align-items: center;
//     gap: 24px;
//     min-height: 58px;
//     padding: 0 24px;
//     border-bottom: 1px solid #e5ebf3;
//   }
//   .tm-body-tab {
//     position: relative;
//     display: inline-flex;
//     align-items: center;
//     gap: 9px;
//     height: 58px;
//     border: none;
//     background: transparent;
//     color: #475569;
//     font-size: 13px;
//     font-weight: 800;
//     cursor: pointer;
//   }
//   .tm-body-tab i { color: #64748b; }
//   .tm-body-tab--active { color: ${BLUE}; }
//   .tm-body-tab--active i { color: ${BLUE}; }
//   .tm-body-tab--active::after {
//     content: '';
//     position: absolute;
//     left: 0; right: 0; bottom: -1px;
//     height: 2px;
//     border-radius: 999px 999px 0 0;
//     background: ${BLUE};
//   }
//   .tm-session-body__content { padding: 30px 36px 26px; }
//   .tm-detail-grid {
//     display: grid;
//     grid-template-columns: repeat(3, minmax(190px, 1fr));
//     gap: 30px 48px;
//   }
//   .tm-detail-item,
//   .tm-notes-row {
//     display: flex;
//     align-items: flex-start;
//     gap: 12px;
//     min-width: 0;
//   }
//   .tm-detail-item__icon {
//     width: 36px; height: 36px;
//     display: inline-flex; align-items: center; justify-content: center;
//     flex: 0 0 36px;
//     border-radius: 9px;
//     font-size: 15px;
//   }
//   .tm-detail-item__icon--blue { background: #eef4ff; color: #1d4ed8; }
//   .tm-detail-item__icon--pink { background: #fff1f3; color: #8a3c3c; }
//   .tm-detail-item span:last-child,
//   .tm-notes-row span:last-child { min-width: 0; }
//   .tm-detail-item small,
//   .tm-notes-row small {
//     display: block;
//     margin-bottom: 4px;
//     color: #64748b;
//     font-size: 12px;
//     font-weight: 750;
//   }
//   .tm-detail-item strong,
//   .tm-notes-row strong {
//     display: block;
//     color: #111827;
//     font-size: 13px;
//     font-weight: 800;
//     line-height: 1.35;
//   }
//   .tm-detail-item strong {
//     overflow: hidden;
//     text-overflow: ellipsis;
//     white-space: nowrap;
//   }
//   .tm-notes-row {
//     margin-top: 28px;
//     padding-top: 22px;
//     border-top: 1px dashed #d7dee8;
//   }
//   .tm-evidence-grid {
//     display: grid;
//     grid-template-columns: repeat(3, minmax(160px, 1fr));
//     gap: 14px;
//   }
//   .tm-evidence-card {
//     min-height: 112px;
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//     gap: 7px;
//     padding: 18px;
//     border: 1px solid #dbe4ef;
//     border-radius: 12px;
//     background: #fbfcfe;
//   }
//   .tm-evidence-card span {
//     width: 36px; height: 36px;
//     display: inline-flex; align-items: center; justify-content: center;
//     border-radius: 10px;
//     background: #eef4ff;
//     color: ${BLUE};
//   }
//   .tm-evidence-card strong { color: #111827; font-size: 13px; font-weight: 800; }
//   .tm-evidence-card small { font-size: 12px; font-weight: 800; }
//   .tm-session-body__actions {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     gap: 18px;
//     padding: 20px 36px;
//     border-top: 1px solid #e5ebf3;
//   }
//   .tm-session-body__action-group { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 14px; }
//   .tm-action-btn {
//     min-height: 44px;
//     display: inline-flex;
//     align-items: center;
//     justify-content: center;
//     gap: 10px;
//     border-radius: 8px;
//     padding: 0 24px;
//     font-size: 13px;
//     font-weight: 800;
//     cursor: pointer;
//     transition: 0.15s;
//     white-space: nowrap;
//   }
//   .tm-action-btn--outline {
//     border: 1.5px solid #2563eb;
//     background: #fff;
//     color: ${BLUE};
//   }
//   .tm-action-btn--outline:hover { background: #eff6ff; }
//   .tm-action-btn--solid {
//     border: 1.5px solid ${BLUE};
//     background: ${BLUE};
//     color: #fff;
//     box-shadow: 0 10px 18px rgba(37,99,235,0.22);
//   }
//   .tm-action-btn--solid:hover { filter: brightness(0.96); transform: translateY(-1px); }

//   /* ── Lead-style hero banner ── */
//   .tm-hero-wrap { margin-bottom: 14px; }
//   .tm-hero {
//     position: relative;
//     display: flex;
//     align-items: stretch;
//     gap: 12px;
//     flex-wrap: wrap;
//     background: linear-gradient(90deg, #0b5ed7 0%, #1aa3ff 55%, #2dd4ff 100%);
//     border-radius: 14px;
//     padding: 12px 56px 12px 12px;
//     box-shadow: 0 6px 20px rgba(11,94,215,0.25);
//   }

//   .tm-hero__details {
//     flex: 1 1 auto;
//     display: grid;
//     grid-template-columns: repeat(6, minmax(0, 1fr));
//     gap: 10px 14px;
//     align-content: center;
//   }
//   .tm-hero__detail { min-width: 0; }
//   .tm-hero__detail-label {
//     font-size: 11px;
//     font-weight: 800;
//     color: rgba(255,255,255,0.9);
//     margin-bottom: 3px;
//     white-space: nowrap;
//     overflow: hidden;
//     text-overflow: ellipsis;
//   }
//   .tm-hero__detail-label i { margin-right: 5px; opacity: 0.9; }
//   .tm-hero__detail-value {
//     font-size: 14px;
//     font-weight: 800;
//     color: #fff;
//     line-height: 1.2;
//     white-space: nowrap;
//     overflow: hidden;
//     text-overflow: ellipsis;
//   }

//   .tm-hero__identity {
//     display: flex;
//     flex-direction: column;
//     gap: 8px;
//     min-width: 200px;
//     flex: 0 0 auto;
//     border: 1px solid rgba(255,255,255,0.35);
//     border-radius: 12px;
//     padding: 10px;
//     background: rgba(255,255,255,0.14);
//     backdrop-filter: blur(6px);
//   }
//   .tm-hero__field {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     background: rgba(255,255,255,0.18);
//     border: 1px solid rgba(255,255,255,0.35);
//     border-radius: 10px;
//     padding: 6px 9px;
//   }
//   .tm-hero__field-icon { font-size: 13px; color: #fff; opacity: 0.95; width: 16px; text-align: center; flex-shrink: 0; }
//   .tm-hero__input {
//     width: 100%; border: none; outline: none; background: transparent;
//     color: #fff; font-weight: 700; font-size: 13px; line-height: 1.1; min-width: 0;
//     text-overflow: ellipsis;
//   }
//   .tm-hero__input::placeholder { color: rgba(255,255,255,0.85); font-weight: 600; }

//   .tm-hero__approval {
//     position: relative;
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//     gap: 8px;
//     flex: 0 0 auto;
//     padding: 14px 12px 10px;
//     border-radius: 12px;
//     background: rgba(255,255,255,0.14);
//     border: 1px solid rgba(255,255,255,0.28);
//     backdrop-filter: blur(6px);
//   }
//   .tm-hero__approval-label {
//     position: absolute;
//     top: -10px;
//     left: 10px;
//     padding: 0 8px;
//     border-radius: 999px;
//     background: rgba(11,94,215,0.95);
//     border: 1px solid rgba(255,255,255,0.35);
//     color: #fff;
//     font-size: 11px;
//     font-weight: 900;
//     line-height: 18px;
//     white-space: nowrap;
//   }
//   .tm-approval__row { display: flex; align-items: center; gap: 8px; }
//   .tm-approval__pill {
//     border: 1px solid rgba(255,255,255,0.35);
//     color: #fff;
//     border-radius: 999px;
//     padding: 6px 14px;
//     height: 34px;
//     font-size: 12px;
//     font-weight: 900;
//     letter-spacing: 0.02em;
//     background: rgba(255,255,255,0.18);
//     text-transform: uppercase;
//     min-width: 110px;
//     cursor: default;
//   }
//   .tm-approval__pill--draft { background: rgba(148,163,184,0.32); border-color: rgba(148,163,184,0.55); }
//   .tm-approval__pill--submitted { background: rgba(245,158,11,0.30); border-color: rgba(245,158,11,0.55); }
//   .tm-approval__pill--approved { background: rgba(16,185,129,0.30); border-color: rgba(16,185,129,0.55); }
//   .tm-approval__pill--returned { background: rgba(239,68,68,0.28); border-color: rgba(239,68,68,0.55); }
//   .tm-approval__iconbtn {
//     width: 34px; height: 34px;
//     display: inline-flex; align-items: center; justify-content: center;
//     border-radius: 10px;
//     border: 1px solid rgba(255,255,255,0.35);
//     background: rgba(255,255,255,0.16);
//     color: #fff;
//     cursor: pointer;
//     transition: 0.12s;
//   }
//   .tm-approval__iconbtn:hover { background: rgba(255,255,255,0.28); transform: translateY(-1px); }

//   .tm-hero__pills {
//     display: flex;
//     flex-direction: column;
//     gap: 8px;
//     justify-content: center;
//     flex: 0 0 auto;
//   }
//   .tm-hero__pill {
//     width: 40px; height: 40px;
//     border: none;
//     border-radius: 999px;
//     background: #fa5579;
//     color: #fff;
//     display: inline-flex; align-items: center; justify-content: center;
//     cursor: pointer;
//     box-shadow: 0 6px 14px rgba(250,85,121,0.35);
//     transition: 0.12s;
//   }
//   .tm-hero__pill:hover { filter: brightness(0.96); transform: translateY(-1px); }

//   .tm-hero__float-icon {
//     position: absolute;
//     top: 12px; right: 12px;
//     width: 34px; height: 34px;
//     border-radius: 999px;
//     border: 1px solid rgba(255,255,255,0.85);
//     background: rgba(255,255,255,0.92);
//     color: #0b5ed7;
//     display: inline-flex; align-items: center; justify-content: center;
//     cursor: pointer;
//     box-shadow: 0 6px 16px rgba(0,0,0,0.18);
//   }
//   .tm-hero__float-icon:hover { background: #fff; }

//   /* Detail card */
//   .tm-detail {
//     position: relative;
//     border: 1px solid #dbe1e8;
//     border-radius: 12px;
//     background: #fff;
//     padding: 22px 16px 14px;
//     margin-top: 10px;
//     box-shadow: 0 2px 8px rgba(0,0,0,0.04);
//   }
//   .tm-detail__title {
//     position: absolute;
//     top: -12px; left: 50%;
//     transform: translateX(-50%);
//     background: #fff;
//     padding: 0 12px;
//     font-weight: 900;
//     color: #111827;
//     font-size: 15px;
//     white-space: nowrap;
//   }
//   .tm-detail__grid {
//     display: grid;
//     grid-template-columns: repeat(5, minmax(0, 1fr));
//     gap: 12px 18px;
//   }
//   .tm-detail__item { min-width: 0; }
//   .tm-detail__label { font-size: 12px; color: #fa5579; font-weight: 700; margin-bottom: 3px; }
//   .tm-detail__value {
//     font-size: 14px; font-weight: 800; color: #111827; line-height: 1.2;
//     white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
//   }
//   .tm-detail__foot { display: flex; justify-content: flex-end; margin-top: 12px; }
//   .tm-detail__history {
//     display: inline-flex; align-items: center; gap: 6px;
//     background: #fff; border: 1px solid #cbd5e1; color: #475569;
//     border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
//   }
//   .tm-detail__history:hover { background: #f8fafc; }

//   .mt-1 { margin-top: 4px; }
//   .mt-2 { margin-top: 8px; }
//   .mt-3 { margin-top: 12px; }
//   .text-success { color: #10b981; }
//   .text-warning { color: #f59e0b; }

//   @media (max-width: 768px) {
//     .dbr-portal { padding: 12px 12px 100px; }
//     .dbr-module-card { flex: 0 0 85%; }
//     .dbr-filter-pill { max-width: 100%; }
//     .dbr-points-grid { grid-template-columns: 1fr; }
//     .dbr-basic-grid { grid-template-columns: 1fr; }
//     .tm-session-card {
//       grid-template-columns: 1fr;
//       gap: 14px;
//       padding: 16px 16px 76px;
//     }
//     .tm-session-card--collapsed { padding: 12px 68px 12px 16px; }
//     .tm-session-card__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
//     .tm-stat-card { min-height: 116px; }
//     .tm-session-card__schedule { padding-left: 0; gap: 12px; }
//     .tm-session-card__toggle { top: auto; right: 16px; bottom: 16px; }
//     .tm-session-body__tabs { gap: 18px; padding: 0 18px; overflow-x: auto; }
//     .tm-body-tab { height: 58px; font-size: 13px; flex: 0 0 auto; }
//     .tm-session-body__content { padding: 24px 18px; }
//     .tm-detail-grid,
//     .tm-evidence-grid { grid-template-columns: 1fr; gap: 20px; }
//     .tm-detail-item strong { white-space: normal; }
//     .tm-notes-row { margin-top: 24px; padding-top: 20px; }
//     .tm-session-body__actions { align-items: stretch; flex-direction: column; padding: 18px; }
//     .tm-session-body__action-group { flex-direction: column; }
//     .tm-action-btn { width: 100%; min-height: 46px; padding: 0 16px; }
//     .tm-hero { padding: 12px 48px 12px 12px; }
//     .tm-hero__identity { min-width: 100%; flex: 1 1 100%; }
//     .tm-hero__details { grid-template-columns: 1fr 1fr; }
//     .tm-detail__grid { grid-template-columns: 1fr 1fr; }
//   }
//   @media (min-width: 769px) and (max-width: 1100px) {
//     .tm-session-card { grid-template-columns: 1fr 1fr; padding-right: 70px; }
//     .tm-session-card__stats { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
//     .tm-detail-grid { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
//     .tm-evidence-grid { grid-template-columns: repeat(2, minmax(160px, 1fr)); }
//     .tm-hero__details { grid-template-columns: repeat(3, minmax(0, 1fr)); }
//     .tm-detail__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
//   }
// `;

// export default TrainerModule;
