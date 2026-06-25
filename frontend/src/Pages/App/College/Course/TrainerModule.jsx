import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

/* ─── Theme tokens ─── */
const PINK = '#fa5579';
const BLUE = '#2563eb';

const FILTER_OPTIONS = {
  department: [],
  project: [],
  center: [],
  course: [],
  batch: [],
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
  { id: 'session', label: 'Sessions', icon: 'fa-chalkboard-teacher' },
  { id: 'student', label: 'Students', icon: 'fa-user-graduate' },
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
const getEvidenceTypeFromFile = (file) => {
  const mime = file?.type || '';
  const name = file?.name?.toLowerCase() || '';

  if (mime.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg)$/i.test(name)) return 'Image';
  if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(name)) return 'Video';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'PDF';
  return 'Document';
};
const getEvidenceDisplayName = (fileName = '') =>
  fileName.replace(/\.[^/.]+$/, '') || 'Evidence document';
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
const createEmptySessionDraft = (sessionNumber) => ({
  id: `S${String(sessionNumber).padStart(3, '0')}`,
  title: '',
  topicCovered: '',
  trainingMethod: '',
  sessionDate: '',
  startTime: '',
  endTime: '',
  status: '',
  totalCandidates: '',
  presentCandidates: '',
  absentCandidates: '',
  courseTrade: '',
  batchCode: '',
  trainerName: '',
  notes: '',
  evidenceDocs: [],
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
    .filter((doc) => doc.name?.trim() || doc.fileName || doc.file?.name)
    .map((doc, index) => {
      const fileName = doc.fileName || doc.file?.name || '';

      return {
        id: doc.id || `EV${Date.now()}-${index}`,
        name: doc.name?.trim() || getEvidenceDisplayName(fileName),
        type: doc.type || (fileName ? getEvidenceTypeFromFile({ name: fileName }) : 'Document'),
        status: fileName ? 'Uploaded' : (doc.status || 'Pending'),
        fileName,
      };
    });

  return {
    ...draft,
    title: draft.title?.trim() || 'New Session',
    topicCovered: draft.topicCovered?.trim() || draft.title?.trim() || 'Session topic',
    trainingMethod: draft.trainingMethod?.trim() || 'Interactive Learning',
    status: draft.status || 'Pending',
    date: draft.sessionDate ? formatSessionDate(draft.sessionDate) : formatSessionDate(getTodayInputValue()),
    sessionDate: draft.sessionDate || getTodayInputValue(),
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

const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Not Marked'];
const attendanceTone = (status) => {
  if (status === 'Present') return 'present';
  if (status === 'Absent') return 'absent';
  return 'not-marked';
};
const createSessionAttendanceRows = (session, students = DUMMY_STUDENTS) => {
  const totalCandidates = Math.max(Number(session?.totalCandidates) || students.length, students.length);
  const presentCount = Math.min(Number(session?.presentCandidates) || 0, totalCandidates);
  const absentCount = Math.min(Number(session?.absentCandidates) || 0, totalCandidates - presentCount);

  return Array.from({ length: totalCandidates }, (_, index) => {
    const student = students[index];
    const status = index < presentCount
      ? 'Present'
      : index < presentCount + absentCount
        ? 'Absent'
        : 'Not Marked';

    return {
      id: student?.id || `${session?.id || 'SESSION'}-ST${String(index + 1).padStart(2, '0')}`,
      name: student?.name || `Candidate ${String(index + 1).padStart(2, '0')}`,
      mobile: student?.mobile || '-',
      status,
      remarks: '',
      attendancePercent: student?.attendance || '-',
    };
  });
};
const summarizeAttendanceRows = (rows = []) => {
  const present = rows.filter((row) => row.status === 'Present').length;
  const absent = rows.filter((row) => row.status === 'Absent').length;
  const notMarked = rows.filter((row) => row.status === 'Not Marked').length;
  const total = rows.length;
  const attendance = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  return { present, absent, notMarked, total, attendance };
};
const getStudentOverallAttendance = (studentId, students = DUMMY_STUDENTS) =>
  students.find((student) => student.id === studentId)?.attendance || '-';
const AttendancePercentCell = ({ row }) => (
  <td className="attendance-percent-col">
    <span className="attendance-percent-value">
      {row.attendancePercent || getStudentOverallAttendance(row.id)}
    </span>
  </td>
);
const AttendanceStudentCell = ({ row, index }) => (
  <td className="attendance-student-col">
    <div className="attendance-student">
      <span className="attendance-avatar">{index + 1}</span>
      <span>
        <strong>{row.name}</strong>
        <small>{row.mobile}</small>
      </span>
    </div>
  </td>
);

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

const DAILY_REPORT_SECTIONS = [
  { id: 'attendance', label: 'Attendance', icon: 'fa-user-check' },
  { id: 'training', label: 'Training', icon: 'fa-book-reader' },
  { id: 'documents', label: 'Documentation', icon: 'fa-folder-open' },
  { id: 'issues', label: 'Issues & Actions', icon: 'fa-exclamation-circle', isIssues: true },
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

const FilterSelect = ({ label, icon, options = [], value, onChange }) => {
  const normalizedOptions = options.map((option) => (
    typeof option === 'string' ? { value: option, label: option } : option
  ));

  return (
    <div className="dbr-filter-pill">
      <label className="dbr-filter-label">
        <i className={`fas ${icon}`} /> {label}
      </label>
      <select className="dbr-filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

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

const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'T';

const TrainerHero = ({ reportDate, onDateChange, basicDetails, sessionCount, studentCount }) => (
  <section className="tm-hero">
    <div className="tm-hero__content">
      <nav className="tm-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>Training Module</span>
        <span>/</span>
        <span className="tm-breadcrumb--active">Daily Report Card</span>
      </nav>
      <div className="tm-hero__main">
        <div className="tm-hero__identity">
          <div className="tm-avatar tm-avatar--lg">{getInitials(TRAINER_INFO.name)}</div>
          <div>
            <h1 className="tm-hero__title">Trainer Daily Report</h1>
            <p className="tm-hero__subtitle">
              {TRAINER_INFO.name} · {basicDetails.batchCode} · {basicDetails.centerName}
            </p>
          </div>
        </div>
        <div className="tm-hero__date">
          <label className="tm-hero__date-label">
            <i className="fas fa-calendar-alt" /> Report Date
          </label>
          <DatePicker value={reportDate} onChange={onDateChange} format="dd/MM/yyyy" clearIcon={null} />
        </div>
      </div>
      <div className="tm-hero__stats">
        <div className="tm-stat-pill">
          <i className="fas fa-chalkboard" />
          <span><strong>{sessionCount}</strong> Sessions</span>
        </div>
        <div className="tm-stat-pill">
          <i className="fas fa-users" />
          <span><strong>{studentCount}</strong> Students</span>
        </div>
        <div className="tm-stat-pill">
          <i className="fas fa-star" />
          <span><strong>{basicDetails.totalPointsTillDate}</strong> Points</span>
        </div>
        <div className="tm-stat-pill">
          <i className="fas fa-calendar-check" />
          <span><strong>{basicDetails.totalDaysTillDate}</strong> Days</span>
        </div>
      </div>
    </div>
  </section>
);

const FilterPanel = ({ filters, onFilterChange, collapsed, onToggle }) => (
  <section className={`tm-filters${collapsed ? ' tm-filters--collapsed' : ''}`}>
    <button type="button" className="tm-filters__toggle" onClick={onToggle}>
      <span><i className="fas fa-sliders-h" /> Context Filters</span>
      <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} />
    </button>
    {!collapsed && (
      <div className="tm-filters__grid">
        <FilterSelect label="Department" icon="fa-sitemap" options={FILTER_OPTIONS.department} value={filters.department} onChange={(v) => onFilterChange('department', v)} />
        <FilterSelect label="Project" icon="fa-project-diagram" options={FILTER_OPTIONS.project} value={filters.project} onChange={(v) => onFilterChange('project', v)} />
        <FilterSelect label="Center" icon="fa-building" options={FILTER_OPTIONS.center} value={filters.center} onChange={(v) => onFilterChange('center', v)} />
        <FilterSelect label="Course" icon="fa-graduation-cap" options={FILTER_OPTIONS.course} value={filters.course} onChange={(v) => onFilterChange('course', v)} />
        <FilterSelect label="Batch" icon="fa-users" options={FILTER_OPTIONS.batch} value={filters.batch} onChange={(v) => onFilterChange('batch', v)} />
      </div>
    )}
  </section>
);

const SessionListItem = ({ session, active, onSelect }) => {
  const tone = session.status === 'Completed' ? 'green' : 'amber';
  return (
    <button
      type="button"
      className={`tm-session-item${active ? ' tm-session-item--active' : ''}`}
      onClick={() => onSelect(session.id)}
    >
      <div className="tm-session-item__top">
        <span className={`tm-session-item__status tm-session-item__status--${tone}`}>{session.status}</span>
        <span className="tm-session-item__id">{session.id}</span>
      </div>
      <strong className="tm-session-item__title">{session.title}</strong>
      <span className="tm-session-item__meta">
        <i className="fas fa-calendar-alt" /> {session.date || formatSessionDate(session.sessionDate)}
      </span>
      <span className="tm-session-item__meta">
        <i className="fas fa-percentage" /> {session.attendance || '—'}
      </span>
    </button>
  );
};

const TrainerSidebar = ({ sessions, selectedSessionId, onSelectSession, onAddSession, basicDetails }) => (
  <aside className="tm-sidebar">
    <div className="tm-profile-card">
      <div className="tm-profile-card__banner" />
      <div className="tm-profile-card__body">
        <div className="tm-avatar tm-avatar--md">{getInitials(TRAINER_INFO.name)}</div>
        <h3>{TRAINER_INFO.name}</h3>
        <p>{basicDetails.reportingPerson}</p>
        <div className="tm-profile-card__details">
          <div><i className="fas fa-phone" /><span>{TRAINER_INFO.mobile}</span></div>
          <div><i className="fas fa-envelope" /><span>{TRAINER_INFO.email}</span></div>
          <div><i className="fas fa-graduation-cap" /><span>{basicDetails.courseTrade}</span></div>
          <div><i className="fas fa-building" /><span>{basicDetails.projectName}</span></div>
        </div>
      </div>
    </div>

    <div className="tm-session-panel">
      <div className="tm-session-panel__head">
        <h4><i className="fas fa-list" /> Sessions</h4>
        <button type="button" className="tm-icon-btn tm-icon-btn--primary" onClick={onAddSession} title="Add session">
          <i className="fas fa-plus" />
        </button>
      </div>
      <div className="tm-session-panel__list">
        {sessions.length === 0 ? (
          <div className="tm-empty">
            <i className="fas fa-inbox" />
            <p>No sessions match your search.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionListItem
              key={session.id}
              session={session}
              active={session.id === selectedSessionId}
              onSelect={onSelectSession}
            />
          ))
        )}
      </div>
    </div>
  </aside>
);

const ActionToolbar = ({ quickSearch, onSearchChange, onSearch, onAddSession, notify }) => {
  const [showMore, setShowMore] = useState(false);
  const secondaryActions = [
    { icon: 'fa-download', label: 'Download Report', action: () => notify('Downloading report...') },
    { icon: 'fa-cloud-upload-alt', label: 'Bulk Upload Evidence', action: () => notify('Bulk upload opened') },
    { icon: 'fa-plus', label: 'Add Daily Report', action: () => notify('Add daily report') },
    { icon: 'fa-share-alt', label: 'Refer to HO', action: () => notify('Referred to HO') },
    { icon: 'fa-tasks', label: 'Bulk Action', action: () => notify('Bulk action') },
    { icon: 'fa-share-alt', label: 'Refer Session', action: () => notify('Refer Session') },
    { icon: 'fa-cloud-upload-alt', label: 'Bulk Upload Session', action: () => notify('Bulk Upload Session') },
  ];

  return (
    <div className="tm-toolbar">
      <div className="tm-toolbar__primary">
        <button type="button" className="tm-btn tm-btn--primary" onClick={onAddSession}>
          <i className="fas fa-plus" /> New Session
        </button>
        <div className="tm-search">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={quickSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
      </div>
      <div className="tm-toolbar__secondary">
        <button type="button" className="tm-btn tm-btn--ghost" onClick={() => setShowMore((v) => !v)}>
          <i className="fas fa-ellipsis-h" /> More Actions
        </button>
        {showMore && (
          <div className="tm-toolbar__menu">
            {secondaryActions.map(({ icon, label, action }) => (
              <button key={label} type="button" onClick={() => { action(); setShowMore(false); }}>
                <i className={`fas ${icon}`} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



const StudentCard = ({ student, onView }) => {
  const tone = student.status === 'Active' ? 'green' : 'orange';
  const attendanceNum = parseFloat(student.attendance) || 0;

  return (
    <article className="tm-student-card">
      <div className="tm-student-card__header">
        <div className="tm-avatar">{getInitials(student.name)}</div>
        <div>
          <h4>{student.name}</h4>
          <span className="tm-student-card__id">{student.id}</span>
        </div>
        <span className={`dbr-chip dbr-chip--${tone}`}>{student.status}</span>
      </div>
      <div className="tm-student-card__progress">
        <div className="tm-student-card__progress-head">
          <span>Attendance</span>
          <strong>{student.attendance}</strong>
        </div>
        <div className="tm-progress-bar">
          <div className="tm-progress-bar__fill" style={{ width: `${Math.min(attendanceNum, 100)}%` }} />
        </div>
      </div>
      <div className="tm-student-card__info">
        <span><i className="fas fa-phone" /> {student.mobile}</span>
      </div>
      <button type="button" className="tm-btn tm-btn--outline tm-btn--block" onClick={() => onView(student.name)}>
        <i className="fas fa-eye" /> View Profile
      </button>
    </article>
  );
};

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

  const ph = (text) => (isEdit ? undefined : text);

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
              <input className="dbr-input" placeholder={ph('Enter session title')} value={draft.title} onChange={(e) => onFieldChange('title', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Topic covered</span>
              <input className="dbr-input" placeholder={ph('Enter topic covered')} value={draft.topicCovered} onChange={(e) => onFieldChange('topicCovered', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Training method</span>
              <input className="dbr-input" placeholder={ph('Enter training method')} value={draft.trainingMethod} onChange={(e) => onFieldChange('trainingMethod', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Status</span>
              <select className="dbr-select" value={draft.status} onChange={(e) => onFieldChange('status', e.target.value)}>
                {!isEdit && <option value="">Select status</option>}
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
              <input className="dbr-input" placeholder={ph('Enter course / trade')} value={draft.courseTrade} onChange={(e) => onFieldChange('courseTrade', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Batch code</span>
              <input className="dbr-input" placeholder={ph('Enter batch code')} value={draft.batchCode} onChange={(e) => onFieldChange('batchCode', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Trainer name</span>
              <input className="dbr-input" placeholder={ph('Enter trainer name')} value={draft.trainerName} onChange={(e) => onFieldChange('trainerName', e.target.value)} />
            </label>
            <label className="session-field">
              <span>Total candidates</span>
              <input type="number" min="0" className="dbr-input" placeholder={ph('0')} value={draft.totalCandidates} onChange={(e) => onFieldChange('totalCandidates', e.target.value)} />
            </label>
            
          </div>

          <label className="session-field session-field--full">
            <span>Additional notes</span>
            <textarea className="dbr-textarea" rows="3" placeholder={ph('Enter additional notes...')} value={draft.notes} onChange={(e) => onFieldChange('notes', e.target.value)} />
          </label>

          <div className="session-evidence-builder">
            <div className="session-evidence-builder__head">
              <h6>Documents</h6>
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

const AttendanceManagementModal = ({
  session,
  rows,
  view,
  onViewChange,
  onStatusChange,
  onRemarksChange,
  onClose,
  onSave,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    if (!rows?.length) return;
    if (!selectedStudentId || !rows.find((row) => row.id === selectedStudentId)) {
      setSelectedStudentId(rows[0].id);
    }
  }, [rows, selectedStudentId]);

  if (!session) return null;

  const activeStudentId = selectedStudentId || rows[0]?.id || '';
  const selectedStudent = rows.find((row) => row.id === activeStudentId) || rows[0] || {};

  const stats = summarizeAttendanceRows(rows);
  const sessionDate = session.date || formatSessionDate(session.sessionDate);
  const sessionTime = `${session.startTime || '10:00'} - ${session.endTime || '12:00'}`;
  const sessionDetails = [
    { label: 'Session ID', value: session.id },
    { label: 'Topic covered', value: session.topicCovered || session.title },
    { label: 'Training method', value: session.trainingMethod || 'Interactive Learning' },
    { label: 'Session date', value: sessionDate },
    { label: 'Time', value: sessionTime },
    { label: 'Batch code', value: session.batchCode || TRAINER_INFO.batchCode },
    { label: 'Course / trade', value: session.courseTrade || TRAINER_INFO.course },
    { label: 'Trainer', value: session.trainerName || TRAINER_INFO.name },
    { label: 'Status', value: session.status || 'Pending' },
  ];

  return (
    <div className="attendance-modal-backdrop">
      <div className="attendance-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-dashboard-title">
        <div className="attendance-modal__head">
          <div>
            <h3 id="attendance-dashboard-title">
              <i className="fas fa-chart-line" /> Attendance Management Dashboard
            </h3>
            <p>{session.title} · {sessionDate} · {sessionTime}</p>
          </div>
          <button type="button" className="attendance-close-btn" onClick={onClose} aria-label="Close attendance dashboard">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="attendance-modal__body">
          <div className="attendance-session-details">
            <h4><i className="fas fa-info-circle" /> Session Details</h4>
            <div className="attendance-session-details__grid">
              {sessionDetails.map(({ label, value }) => (
                <div key={label} className="attendance-session-details__item">
                  <span>{label}</span>
                  <strong>{value || '-'}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="attendance-control-panel">
            <div className="attendance-view-toggle" role="group" aria-label="Attendance view type">
              <button
                type="button"
                className={view === 'register' ? 'attendance-toggle attendance-toggle--active' : 'attendance-toggle'}
                onClick={() => onViewChange('register')}
              >
                <i className="fas fa-clipboard-list" /> Attendance Register
              </button>
              <button
                type="button"
                className={view === 'summary' ? 'attendance-toggle attendance-toggle--active' : 'attendance-toggle'}
                onClick={() => onViewChange('summary')}
              >
                <i className="fas fa-calendar-day" /> Summary View
              </button>
            </div>
          </div>

          <div className="attendance-selected-student">
            <div className="attendance-selected-student__header">
              <strong>Trace specific student</strong>
              <select
                className="attendance-status-select"
                value={activeStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
              >
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} · {row.mobile}
                  </option>
                ))}
              </select>
            </div>
            <div className="attendance-selected-student__card">
              <div>
                <span>Name</span>
                <strong>{selectedStudent.name || '-'}</strong>
              </div>
              <div>
                <span>Mobile</span>
                <strong>{selectedStudent.mobile || '-'}</strong>
              </div>
              <div>
                <span>Current status</span>
                <strong>{selectedStudent.status || '-'}</strong>
              </div>
              <div>
                <span>Remarks</span>
                <strong>{selectedStudent.remarks || '-'}</strong>
              </div>
              <div>
                <span>Overall attendance</span>
                <strong>{getStudentOverallAttendance(activeStudentId)}</strong>
              </div>
            </div>
          </div>

          <div className="attendance-stat-grid">
            <div className="attendance-stat-card attendance-stat-card--blue">
              <strong>{stats.total}</strong>
              <span>Total Students</span>
            </div>
            <div className="attendance-stat-card attendance-stat-card--green">
              <strong>{stats.present}</strong>
              <span>Present</span>
            </div>
            <div className="attendance-stat-card attendance-stat-card--red">
              <strong>{stats.absent}</strong>
              <span>Absent</span>
            </div>
            <div className="attendance-stat-card attendance-stat-card--amber">
              <strong>{stats.attendance}%</strong>
              <span>Attendance</span>
            </div>
          </div>

          {view === 'register' ? (
            <div className="attendance-register">
              <div className="attendance-register__title">
                <h4>
                  <i className="fas fa-clipboard-list" /> Attendance Register
                </h4>
                <span>{stats.total} students - {session.batchCode || TRAINER_INFO.batchCode}</span>
              </div>
              <div className="attendance-table-wrap">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th className="attendance-student-col">Student Information</th>
                      <th className="attendance-date-col">
                        <span>{sessionDate}</span>
                        <small>Session Date</small>
                      </th>
                      <th>Attendance (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                      key={row.id}
                      className={selectedStudentId === row.id ? 'attendance-row attendance-row--active' : 'attendance-row'}
                      onClick={() => setSelectedStudentId(row.id)}
                    >
                        <AttendanceStudentCell row={row} index={index} />
                        <td>
                          <select
                            className={`attendance-status-select attendance-status-select--${attendanceTone(row.status)}`}
                            value={row.status}
                            onChange={(event) => onStatusChange(row.id, event.target.value)}
                          >
                            {ATTENDANCE_STATUSES.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Daily Summary</td>
                      <td>
                        P: {stats.present} - A: {stats.absent} - NM: {stats.notMarked}
                      </td>
                      <td>{stats.attendance}%</td>
                      <td>-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="attendance-summary-view">
              <div className="attendance-summary-head">
                <h4>
                  <i className="fas fa-calendar-day" /> Summary View
                </h4>
                <span>{stats.total} students - {session.batchCode || TRAINER_INFO.batchCode}</span>
              </div>
              <div className="attendance-table-wrap">
                <table className="attendance-table attendance-table--summary">
                  <thead>
                    <tr>
                      <th className="attendance-student-col">Student Information</th>
                      <th className="attendance-date-col">
                        <span>{sessionDate}</span>
                        <small>Session Date</small>
                      </th>
                      <th>Status</th>
                      <th>Attendance (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={selectedStudentId === row.id ? 'attendance-row attendance-row--active' : 'attendance-row'}
                        onClick={() => setSelectedStudentId(row.id)}
                      >
                        <AttendanceStudentCell row={row} index={index} />
                        <td>
                          <span className="attendance-day-label">{sessionDate}</span>
                        </td>
                        <td>
                          <span className={`attendance-pill attendance-pill--${attendanceTone(row.status)}`}>
                            {row.status}
                          </span>
                        </td> 
                        <AttendancePercentCell row={row} />
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Daily Summary</td>
                      <td>{sessionDate}</td>
                      <td>
                        P: {stats.present} - A: {stats.absent} - NM: {stats.notMarked}
                      </td>
                      <td>-</td>
                      <td>{stats.attendance}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="attendance-modal__foot">
          <button type="button" className="sc-btn" onClick={onClose}>Close</button>
          <button type="button" className="sc-btn sc-btn--primary" onClick={onSave}>
            <i className="fas fa-save" /> Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionCard = ({ basicDetails, session, notify, onStatusChange, onEvidenceUpload, onEditSession, onOpenAttendance }) => {
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
    <article className="sc-wrap">
      <div className="sc-head">
        <div className="sc-head-left">
          <div className="sc-avatar">
            <i className="fas fa-user" />
          </div>
          <div className="sc-head-text">
            <div className="sc-trainer-name">{activeSession.title}</div>
            
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
          <nav className="sc-tabs" aria-label="Session sections">
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
          </nav>

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

          <footer className="sc-foot">
            <button type="button" className="sc-btn" onClick={() => onEditSession(activeSession)}>
              <i className="far fa-edit" /> Edit Session
            </button>
            <div className="sc-foot-right">
              <button type="button" className="sc-btn sc-btn--outline" onClick={() => onOpenAttendance(activeSession, 'register')}>
                <i className="fas fa-user-check" /> Mark Attendance
              </button>
              <button type="button" className="sc-btn sc-btn--primary" onClick={() => onOpenAttendance(activeSession, 'summary')}>
                <i className="fas fa-chart-bar" /> View Attendance
              </button>
            </div>
          </footer>
        </>
      )}
    </article>
  );
};

/* ─── Main page ─── */
const TrainerModule = () => {
  const userData = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
  const token = userData.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

  const [reportDate, setReportDate] = useState(new Date());
  const [filters, setFilters] = useState({
    department: '',
    project: '',
    center: '',
    course: '',
    batch: '',
  });
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [allCoursesMeta, setAllCoursesMeta] = useState([]);
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
  const [attendanceModal, setAttendanceModal] = useState({ isOpen: false, view: 'register', sessionId: '' });
  const [attendanceRecordsBySession, setAttendanceRecordsBySession] = useState({});
  const [toast, setToast] = useState('');

  const [attendanceData, setAttendanceData] = useState(() => buildPointMap(ATTENDANCE_POINTS));
  const [trainingData, setTrainingData] = useState(() => buildPointMap(TRAINING_POINTS));
  const [documentData, setDocumentData] = useState(() => buildPointMap(DOCUMENT_POINTS));
  const [studentData, setStudentData] = useState(() => buildPointMap(STUDENT_POINTS));
  const [issueData, setIssueData] = useState(() =>
    Object.fromEntries(ISSUE_POINTS.map((p) => [p.id, emptyIssueValue()]))
  );

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const updateMap = useCallback((setter, id, field, val) => {
    setter((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }, []);

  const filterProjectOptions = useMemo(() => {
    if (!filters.department) return projectOptions;
    const projectIds = new Set(
      allCoursesMeta
        .filter((course) => String(course.vertical?._id || course.vertical) === String(filters.department))
        .map((course) => String(course.project?._id || course.project))
    );
    return projectOptions.filter((project) => projectIds.has(String(project.value)));
  }, [filters.department, projectOptions, allCoursesMeta]);

  const filterCourseOptions = useMemo(() => {
    let list = courseOptions;
    if (filters.department) {
      const courseIds = new Set(
        allCoursesMeta
          .filter((course) => String(course.vertical?._id || course.vertical) === String(filters.department))
          .map((course) => String(course._id))
      );
      list = list.filter((course) => courseIds.has(String(course.value)));
    }
    if (filters.project) {
      const courseIds = new Set(
        allCoursesMeta
          .filter((course) => String(course.project?._id || course.project) === String(filters.project))
          .map((course) => String(course._id))
      );
      list = list.filter((course) => courseIds.has(String(course.value)));
    }
    return list;
  }, [filters.department, filters.project, courseOptions, allCoursesMeta]);

  useEffect(() => {
    if (!token) return undefined;

    const fetchFilterOptions = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/filters-data`, {
          headers: { 'x-auth': token },
        });
        if (res.data.status) {
          setVerticalOptions(res.data.verticals.map((v) => ({ value: v._id, label: v.name })));
          setProjectOptions(res.data.projects.map((p) => ({ value: p._id, label: p.name })));
          setCourseOptions(res.data.courses.map((c) => ({ value: c._id, label: c.name })));

          try {
            const centersRes = await axios.get(`${backendUrl}/college/list_all_centers`, {
              headers: { 'x-auth': token },
            });
            if (centersRes.data.success && centersRes.data.data) {
              setCenterOptions(centersRes.data.data.map((c) => ({ value: c._id, label: c.name })));
            } else {
              setCenterOptions(res.data.centers.map((c) => ({ value: c._id, label: c.name })));
            }
          } catch (centerErr) {
            console.error('Failed to fetch all centers, using filters-data centers:', centerErr);
            setCenterOptions(res.data.centers.map((c) => ({ value: c._id, label: c.name })));
          }
        }

        try {
          const coursesMetaRes = await axios.get(`${backendUrl}/college/all_courses`, {
            headers: { 'x-auth': token },
          });
          if (coursesMetaRes.data?.success) {
            setAllCoursesMeta(coursesMetaRes.data.data || []);
          }
        } catch (metaErr) {
          console.error('Failed to fetch courses meta:', metaErr);
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };

    fetchFilterOptions();
    return undefined;
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token) return undefined;

    const fetchBatches = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.center) params.set('centerId', filters.center);
        if (filters.course) params.set('courseId', filters.course);
        const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
          headers: { 'x-auth': token },
        });
        if (res.data?.success) {
          setBatchOptions((res.data.data || []).map((b) => ({ value: b._id, label: b.name })));
        } else {
          setBatchOptions([]);
        }
      } catch (err) {
        console.error('Failed to fetch batches:', err);
        setBatchOptions([]);
      }
    };

    fetchBatches();
    return undefined;
  }, [filters.center, filters.course, token, backendUrl]);

  const handleFilterChange = (key, value) => {
    if (key === 'department') {
      setFilters({ department: value, project: '', center: '', course: '', batch: '' });
      return;
    }
    if (key === 'project') {
      setFilters((prev) => ({ ...prev, project: value, center: '', course: '', batch: '' }));
      return;
    }
    if (key === 'center') {
      setFilters((prev) => ({ ...prev, center: value, batch: '' }));
      return;
    }
    if (key === 'course') {
      setFilters((prev) => ({ ...prev, course: value, batch: '' }));
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || sessions[0],
    [sessions, selectedSessionId]
  );
  const filteredSessions = useMemo(() => {
    const query = quickSearch.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) =>
      session.title?.toLowerCase().includes(query)
      || session.id?.toLowerCase().includes(query)
      || session.topicCovered?.toLowerCase().includes(query)
      || session.date?.toLowerCase().includes(query)
    );
  }, [sessions, quickSearch]);
  const attendanceSession = useMemo(
    () => sessions.find((session) => session.id === attendanceModal.sessionId) || selectedSession,
    [sessions, attendanceModal.sessionId, selectedSession]
  );
  const attendanceRows = attendanceRecordsBySession[attendanceModal.sessionId] || [];

  const openAddSessionModal = () => {
    const nextSessionNumber = sessions.length + 1;
    setEditingSessionId(null);
    setSessionDraft(createEmptySessionDraft(nextSessionNumber));
    setIsSessionModalOpen(true);
  };
  const openEditSessionModal = (session) => {
    setEditingSessionId(session.id);
    setSessionDraft({
      ...session,
      sessionDate: session.sessionDate || getTodayInputValue(),
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
  const openAttendanceModal = (session, view = 'register') => {
    setAttendanceRecordsBySession((prev) => (
      prev[session.id]
        ? prev
        : { ...prev, [session.id]: createSessionAttendanceRows(session, DUMMY_STUDENTS) }
    ));
    setAttendanceModal({ isOpen: true, view, sessionId: session.id });
  };
  const closeAttendanceModal = () => {
    setAttendanceModal((prev) => ({ ...prev, isOpen: false }));
  };
  const setAttendanceView = (view) => {
    setAttendanceModal((prev) => ({ ...prev, view }));
  };
  const updateAttendanceRow = (studentId, field, value) => {
    setAttendanceRecordsBySession((prev) => ({
      ...prev,
      [attendanceModal.sessionId]: (prev[attendanceModal.sessionId] || []).map((row) => (
        row.id === studentId ? { ...row, [field]: value } : row
      )),
    }));
  };
  const saveAttendanceRows = () => {
    const stats = summarizeAttendanceRows(attendanceRows);
    setSessions((prev) => prev.map((session) => (
      session.id === attendanceModal.sessionId
        ? {
          ...session,
          totalCandidates: String(stats.total),
          presentCandidates: String(stats.present),
          absentCandidates: String(stats.absent),
          attendance: `${stats.attendance}%`,
        }
        : session
    )));
    notify('Attendance saved');
    closeAttendanceModal();
  };

  return (
    <div className="dbr-portal">
      <style>{PORTAL_CSS}</style>

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

      <div className="dbr-filters">
        <FilterSelect label="Department" icon="fa-sitemap" options={verticalOptions} value={filters.department} onChange={(v) => handleFilterChange('department', v)} />
        <FilterSelect label="Project" icon="fa-project-diagram" options={filterProjectOptions} value={filters.project} onChange={(v) => handleFilterChange('project', v)} />
        <FilterSelect label="Center" icon="fa-building" options={centerOptions} value={filters.center} onChange={(v) => handleFilterChange('center', v)} />
        <FilterSelect label="Course" icon="fa-graduation-cap" options={filterCourseOptions} value={filters.course} onChange={(v) => handleFilterChange('course', v)} />
        <FilterSelect label="Batch" icon="fa-users" options={batchOptions} value={filters.batch} onChange={(v) => handleFilterChange('batch', v)} />
      </div>

      <div className="dbr-main-tabs">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`dbr-main-tab${mainTab === tab.id ? ' dbr-main-tab--active' : ''}`}
            onClick={() => setMainTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === 'session' && (
        <>
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
              type="text"
              className="dbr-search"
              placeholder="Quick search..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
            <button type="button" className="dbr-btn dbr-btn--pink" onClick={() => notify(`Searching: ${quickSearch || 'all'}`)}>
              <i className="fas fa-search" /> Search
            </button>
            <button type="button" className="dbr-btn dbr-btn--outline">
              <i className="fas fa-filter" /> More
            </button>
          </div>

          <SessionCard
            basicDetails={basicDetails}
            session={selectedSession}
            notify={notify}
            onStatusChange={updateSessionStatus}
            onEvidenceUpload={uploadEvidenceFile}
            onEditSession={openEditSessionModal}
            onOpenAttendance={openAttendanceModal}
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
                <PointFieldCard
                  key={p.id}
                  point={p}
                  data={studentData[p.id]}
                  onChange={(field, value) => updateMap(setStudentData, p.id, field, value)}
                />
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

      {attendanceModal.isOpen && (
        <AttendanceManagementModal
          session={attendanceSession}
          rows={attendanceRows}
          view={attendanceModal.view}
          onViewChange={setAttendanceView}
          onStatusChange={(studentId, status) => updateAttendanceRow(studentId, 'status', status)}
          onRemarksChange={(studentId, remarks) => updateAttendanceRow(studentId, 'remarks', remarks)}
          onClose={closeAttendanceModal}
          onSave={saveAttendanceRows}
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
  .dbr-portal, .tm-portal {
    min-height: 100vh;
    background: linear-gradient(180deg, #fff5f7 0%, #f4f6f9 120px, #f4f6f9 100%);
    padding: 16px 20px 100px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #1e293b;
  }

  /* Header */
  .dbr-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px 22px; box-shadow: 0 18px 40px rgba(15,23,42,0.08); }
  .dbr-title { font-size: 1.55rem; font-weight: 900; margin: 0 0 6px; color: #0f172a; letter-spacing: -0.02em; }
  .dbr-breadcrumb { font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .dbr-breadcrumb a { color: ${PINK}; text-decoration: none; font-weight: 700; }
  .dbr-breadcrumb--active { color: ${BLUE}; font-weight: 700; }
  .dbr-header-date { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; }
  .dbr-header-date i { color: ${BLUE}; }
  .dbr-header-date .react-date-picker { border: none; font-size: 13px; }
  .dbr-header-date .react-date-picker__wrapper { border: none; background: transparent; }

  /* Filters */
  .dbr-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 14px; box-shadow: inset 0 0 0 1px rgba(226,232,240,0.6); }
  .dbr-filter-pill { background: #f8fafc; border: none; border-radius: 14px; padding: 10px 14px; min-width: 160px; flex: 1; max-width: 230px; box-shadow: inset 0 1px 2px rgba(15,23,42,0.05); }
  .dbr-filter-label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 0.06em; }
  .dbr-filter-label i { color: ${PINK}; margin-right: 6px; }
  .dbr-filter-select { width: 100%; border: none; background: transparent; font-size: 13px; font-weight: 700; outline: none; cursor: pointer; color: #0f172a; }

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

  /* Session picker (horizontal, replaces sidebar) */
  .dbr-session-picker {
    display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;
  }
  .dbr-session-picker__item {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
    min-width: 200px; max-width: 280px; flex: 1;
    padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px;
    background: #fff; cursor: pointer; text-align: left; transition: 0.15s;
  }
  .dbr-session-picker__item:hover { border-color: #bfdbfe; background: #f8fbff; }
  .dbr-session-picker__item--active {
    border-color: ${BLUE}; background: #eff6ff;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.12);
  }
  .dbr-session-picker__status {
    font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase;
  }
  .dbr-session-picker__status--green { background: #d1fae5; color: #059669; }
  .dbr-session-picker__status--amber { background: #fef3c7; color: #d97706; }
  .dbr-session-picker__item strong { font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.35; }
  .dbr-session-picker__item small { font-size: 11px; color: #64748b; font-weight: 600; }

  /* Actions row */
  .dbr-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 18px; }
  .dbr-search { flex: 1; min-width: 180px; max-width: 280px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; font-size: 13px; background: #fff; color: #0f172a; }
  .dbr-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 800; border: 1.5px solid transparent; cursor: pointer; transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease; white-space: nowrap; }
  .dbr-btn:hover { transform: translateY(-1px); }
  .dbr-btn--outline { background: #fff; color: ${BLUE}; border-color: rgba(37,99,235,0.18); box-shadow: 0 8px 20px rgba(37,99,235,0.08); }
  .dbr-btn--outline:hover { background: #eff6ff; }
  .dbr-btn--pink { background: ${PINK}; color: #fff; border-color: ${PINK}; box-shadow: 0 10px 28px rgba(250,85,121,0.18); }
  .dbr-btn--pink:hover { filter: brightness(0.96); }
  .dbr-btn--block { width: 100%; justify-content: center; }

  /* Students */
  .dbr-student-view { margin-bottom: 20px; }
  .dbr-student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 14px; }
  .dbr-student-card { background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; box-shadow: 0 10px 26px rgba(15,23,42,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .dbr-student-card:hover { transform: translateY(-2px); box-shadow: 0 18px 32px rgba(15,23,42,0.1); }
  .dbr-student-card__head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .dbr-student-card__head i { color: ${PINK}; background: rgba(250,85,121,0.12); border-radius: 12px; padding: 8px; font-size: 14px; }
  .dbr-student-card__head h6 { margin: 0; flex: 1; font-size: 14px; font-weight: 800; color: #0f172a; }
  .dbr-info-line { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid #eff6ff; font-size: 12px; color: #475569; }
  .dbr-info-line:first-of-type { border-top: 0; }
  .dbr-info-line i { width: 18px; color: ${BLUE}; font-size: 12px; }

  /* Shared */
  .dbr-chip { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
  .dbr-chip--green { background: #d1fae5; color: #059669; }
  .dbr-chip--orange { background: #ffedd5; color: #ea580c; }
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
  .dbr-section-card { position: relative; background: #fff; border: 1px solid #dee2e6; border-radius: 10px; padding: 20px 16px 16px; }
  .dbr-section-card__label { position: absolute; top: -10px; left: 14px; background: #fff; padding: 0 8px; font-size: 13px; font-weight: 700; color: #334155; }
  .dbr-points-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .dbr-toast { position: fixed; bottom: 20px; right: 20px; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 500; display: flex; align-items: center; gap: 8px; }
  .me-2 { margin-right: 8px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 12px; }
  .pt-2 { padding-top: 8px; }

  .tm-portal {
    min-height: 100vh;
    background: #f0f4f8;
    padding: 20px 24px 100px;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1e293b;
  }

  /* ── Hero ── */
  .tm-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 45%, #2563eb 100%);
    border-radius: 20px;
    padding: 24px 28px;
    margin-bottom: 20px;
    box-shadow: 0 20px 50px rgba(15,23,42,0.18);
    color: #fff;
  }
  .tm-breadcrumb {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    font-size: 12px; color: rgba(255,255,255,0.65); margin-bottom: 16px;
  }
  .tm-breadcrumb a { color: #fda4af; text-decoration: none; font-weight: 600; }
  .tm-breadcrumb a:hover { text-decoration: underline; }
  .tm-breadcrumb--active { color: #fff; font-weight: 700; }
  .tm-hero__main {
    display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 20px;
    margin-bottom: 20px;
  }
  .tm-hero__identity { display: flex; align-items: center; gap: 16px; }
  .tm-hero__title { margin: 0 0 6px; font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; }
  .tm-hero__subtitle { margin: 0; font-size: 14px; color: rgba(255,255,255,0.78); }
  .tm-hero__date {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 14px;
    padding: 12px 16px;
    backdrop-filter: blur(8px);
  }
  .tm-hero__date-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: rgba(255,255,255,0.7); margin-bottom: 8px;
  }
  .tm-hero__date .react-date-picker { border: none; color: #fff; }
  .tm-hero__date .react-date-picker__wrapper { border: none; background: transparent; }
  .tm-hero__date .react-date-picker__inputGroup__input { color: #fff; }
  .tm-hero__stats { display: flex; flex-wrap: wrap; gap: 10px; }
  .tm-stat-pill {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
    color: rgba(255,255,255,0.85);
  }
  .tm-stat-pill i { color: #fda4af; font-size: 14px; }
  .tm-stat-pill strong { color: #fff; font-size: 15px; }

  /* ── Avatars ── */
  .tm-avatar {
    display: flex; align-items: center; justify-content: center;
    border-radius: 14px; font-weight: 800; color: #fff;
    background: linear-gradient(135deg, ${PINK}, #fb7185);
    flex-shrink: 0;
  }
  .tm-avatar--lg { width: 56px; height: 56px; font-size: 18px; border-radius: 16px; }
  .tm-avatar--md { width: 48px; height: 48px; font-size: 16px; margin: -32px auto 12px; border: 3px solid #fff; box-shadow: 0 8px 20px rgba(15,23,42,0.12); }

  /* ── Filters ── */
  .tm-filters {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(15,23,42,0.04);
  }
  .tm-filters__toggle {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border: none; background: #fff; cursor: pointer;
    font-size: 13px; font-weight: 700; color: #334155;
  }
  .tm-filters__toggle span { display: flex; align-items: center; gap: 10px; }
  .tm-filters__toggle i.fa-sliders-h { color: ${PINK}; }
  .tm-filters__grid {
    display: flex; flex-wrap: wrap; gap: 10px;
    padding: 0 14px 14px;
    border-top: 1px solid #f1f5f9;
  }
  .tm-filters--collapsed .tm-filters__grid { display: none; }

  /* ── Page tabs ── */
  .tm-tabs {
    display: inline-flex; gap: 6px;
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 14px; padding: 5px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.04);
  }
  .tm-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border: none; border-radius: 10px;
    background: transparent; font-size: 13px; font-weight: 700;
    color: #64748b; cursor: pointer; transition: 0.15s;
  }
  .tm-tab:hover { color: ${BLUE}; background: #f8fafc; }
  .tm-tab--active { background: linear-gradient(135deg, ${PINK}, #fb7185); color: #fff; box-shadow: 0 6px 16px rgba(250,85,121,0.28); }
  .tm-tab--active:hover { color: #fff; }

  /* ── Workspace layout ── */
  .tm-workspace {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .tm-sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }
  .tm-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

  /* ── Profile card ── */
  .tm-profile-card {
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 8px 24px rgba(15,23,42,0.06);
    text-align: center;
  }
  .tm-profile-card__banner {
    height: 72px;
    background: linear-gradient(135deg, ${BLUE}, #60a5fa);
  }
  .tm-profile-card__body { padding: 0 18px 18px; }
  .tm-profile-card__body h3 { margin: 0 0 4px; font-size: 15px; font-weight: 800; color: #0f172a; }
  .tm-profile-card__body > p { margin: 0 0 14px; font-size: 12px; color: #64748b; }
  .tm-profile-card__details { text-align: left; display: flex; flex-direction: column; gap: 8px; }
  .tm-profile-card__details div {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; color: #475569;
    padding: 8px 10px; background: #f8fafc; border-radius: 10px;
  }
  .tm-profile-card__details i { width: 16px; color: ${BLUE}; flex-shrink: 0; }
  .tm-profile-card__details span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── Session panel ── */
  .tm-session-panel {
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 8px 24px rgba(15,23,42,0.06);
  }
  .tm-session-panel__head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px; border-bottom: 1px solid #f1f5f9;
  }
  .tm-session-panel__head h4 {
    margin: 0; font-size: 13px; font-weight: 800; color: #334155;
    display: flex; align-items: center; gap: 8px;
  }
  .tm-session-panel__head h4 i { color: ${PINK}; }
  .tm-session-panel__list {
    max-height: 420px; overflow-y: auto; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .tm-session-item {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
    width: 100%; text-align: left;
    padding: 12px 14px; border: 1px solid #e2e8f0;
    border-radius: 12px; background: #fafbfc; cursor: pointer;
    transition: 0.15s;
  }
  .tm-session-item:hover { border-color: #bfdbfe; background: #eff6ff; }
  .tm-session-item--active {
    border-color: ${BLUE}; background: #eff6ff;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.12);
  }
  .tm-session-item__top { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px; }
  .tm-session-item__status {
    font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase;
  }
  .tm-session-item__status--green { background: #d1fae5; color: #059669; }
  .tm-session-item__status--amber { background: #fef3c7; color: #d97706; }
  .tm-session-item__id { font-size: 10px; font-weight: 700; color: #94a3b8; }
  .tm-session-item__title { font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.35; }
  .tm-session-item__meta { font-size: 11px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .tm-session-item__meta i { color: ${BLUE}; font-size: 10px; }

  /* ── Toolbar ── */
  .tm-toolbar {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 14px 16px; box-shadow: 0 4px 16px rgba(15,23,42,0.04);
  }
  .tm-toolbar__primary { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; flex: 1; }
  .tm-toolbar__secondary { position: relative; }
  .tm-toolbar__menu {
    position: absolute; top: calc(100% + 8px); right: 0; z-index: 50;
    min-width: 220px; background: #fff; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 6px;
    box-shadow: 0 16px 40px rgba(15,23,42,0.14);
  }
  .tm-toolbar__menu button {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border: none; background: transparent;
    border-radius: 8px; font-size: 12px; font-weight: 700;
    color: #334155; cursor: pointer; text-align: left;
  }
  .tm-toolbar__menu button:hover { background: #f8fafc; color: ${BLUE}; }
  .tm-toolbar__menu button i { width: 16px; color: ${PINK}; }

  /* ── Buttons & search ── */
  .tm-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700;
    border: 1.5px solid transparent; cursor: pointer; transition: 0.15s; white-space: nowrap;
  }
  .tm-btn:hover { transform: translateY(-1px); }
  .tm-btn--primary { background: ${BLUE}; color: #fff; border-color: ${BLUE}; box-shadow: 0 8px 20px rgba(37,99,235,0.22); }
  .tm-btn--primary:hover { background: #1d4ed8; }
  .tm-btn--outline { background: #fff; color: ${BLUE}; border-color: #bfdbfe; }
  .tm-btn--outline:hover { background: #eff6ff; }
  .tm-btn--ghost { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
  .tm-btn--ghost:hover { background: #f1f5f9; }
  .tm-btn--block { width: 100%; }
  .tm-icon-btn {
    width: 34px; height: 34px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 13px;
  }
  .tm-icon-btn--primary { background: ${PINK}; color: #fff; border-color: ${PINK}; }
  .tm-icon-btn--primary:hover { filter: brightness(0.95); }
  .tm-search {
    display: flex; align-items: center; gap: 10px;
    flex: 1; min-width: 200px; max-width: 360px;
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 0 14px;
  }
  .tm-search i { color: #94a3b8; font-size: 13px; }
  .tm-search input {
    flex: 1; border: none; background: transparent; outline: none;
    padding: 10px 0; font-size: 13px; color: #0f172a;
  }
  .tm-search--compact { max-width: 280px; }

  /* ── Empty states ── */
  .tm-empty {
    text-align: center; padding: 28px 16px; color: #94a3b8;
  }
  .tm-empty i { font-size: 28px; margin-bottom: 10px; display: block; }
  .tm-empty p { margin: 0; font-size: 13px; }
  .tm-empty--card {
    background: #fff; border: 2px dashed #e2e8f0; border-radius: 18px;
    padding: 48px 24px;
  }
  .tm-empty--card h4 { margin: 0 0 8px; color: #334155; font-size: 16px; }
  .tm-empty--card p { margin-bottom: 20px; }

  /* ── Daily report ── */
  .tm-report {
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 8px 24px rgba(15,23,42,0.06);
  }
  .tm-report__head {
    padding: 18px 20px; border-bottom: 1px solid #f1f5f9;
    background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
  }
  .tm-report__head h3 {
    margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;
    display: flex; align-items: center; gap: 10px;
  }
  .tm-report__head h3 i { color: ${PINK}; }
  .tm-report__head span { font-size: 12px; color: #64748b; }
  .tm-report__tabs {
    display: flex; flex-wrap: wrap; gap: 8px;
    padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
    background: #fafbfc;
  }
  .tm-report-tab {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 999px;
    background: #fff; font-size: 12px; font-weight: 700;
    color: #64748b; cursor: pointer; transition: 0.15s;
  }
  .tm-report-tab:hover { border-color: #bfdbfe; color: ${BLUE}; }
  .tm-report-tab--active {
    background: ${BLUE}; color: #fff; border-color: ${BLUE};
    box-shadow: 0 4px 12px rgba(37,99,235,0.2);
  }
  .tm-report__body { padding: 16px; }
  .tm-report--student { margin-top: 0; }

  /* ── Student view ── */
  .tm-student-view { display: flex; flex-direction: column; gap: 20px; }
  .tm-student-view__head {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
    padding: 18px 20px; box-shadow: 0 4px 16px rgba(15,23,42,0.04);
  }
  .tm-student-view__head h3 {
    margin: 0 0 4px; font-size: 18px; font-weight: 800; color: #0f172a;
    display: flex; align-items: center; gap: 10px;
  }
  .tm-student-view__head h3 i { color: ${PINK}; }
  .tm-student-view__head p { margin: 0; font-size: 13px; color: #64748b; }
  .tm-student-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;
  }
  .tm-student-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
    padding: 18px; box-shadow: 0 8px 24px rgba(15,23,42,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .tm-student-card:hover { transform: translateY(-3px); box-shadow: 0 16px 36px rgba(15,23,42,0.1); }
  .tm-student-card__header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  }
  .tm-student-card__header .tm-avatar {
    width: 42px; height: 42px; font-size: 14px; border-radius: 12px;
  }
  .tm-student-card__header h4 { margin: 0; flex: 1; font-size: 14px; font-weight: 800; color: #0f172a; }
  .tm-student-card__id { font-size: 11px; color: #94a3b8; font-weight: 600; }
  .tm-student-card__progress { margin-bottom: 14px; }
  .tm-student-card__progress-head {
    display: flex; justify-content: space-between; margin-bottom: 6px;
    font-size: 12px; color: #64748b;
  }
  .tm-student-card__progress-head strong { color: ${BLUE}; }
  .tm-progress-bar {
    height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;
  }
  .tm-progress-bar__fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, ${BLUE}, #60a5fa);
    transition: width 0.3s;
  }
  .tm-student-card__info { margin-bottom: 14px; font-size: 12px; color: #475569; }
  .tm-student-card__info i { color: ${BLUE}; margin-right: 8px; }

  /* ── Toast ── */
  .tm-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 400;
    display: flex; align-items: center; gap: 10px;
    background: #0f172a; color: #fff; padding: 14px 20px;
    border-radius: 14px; font-size: 13px; font-weight: 600;
    box-shadow: 0 16px 40px rgba(15,23,42,0.3);
    animation: tm-toast-in 0.3s ease;
  }
  .tm-toast i { color: #34d399; }
  @keyframes tm-toast-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Filter pills (shared) ── */
  .dbr-filter-pill { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 14px; min-width: 160px; flex: 1; max-width: 230px; }
  .dbr-filter-label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 0.06em; }
  .dbr-filter-label i { color: ${PINK}; margin-right: 6px; }
  .dbr-filter-select { width: 100%; border: none; background: transparent; font-size: 13px; font-weight: 700; outline: none; cursor: pointer; color: #0f172a; }

  /* ════════════════════════════════════════
     SESSION CARD
  ════════════════════════════════════════ */
  .sc-wrap {
    background: #fff; border: 1px solid #bfdbfe;
    border-radius: 14px; overflow: hidden;
    margin-bottom: 14px;
    box-shadow: 0 8px 22px rgba(37,99,235,0.12);
  }

  /* Head — single line */
  .sc-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 14px 16px; flex-wrap: nowrap; overflow: visible;
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
  .sc-head-right {
    display: flex; align-items: center; gap: 6px;
    flex-shrink: 0; flex-wrap: nowrap;
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
  .sc-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 800; padding: 7px 12px;
    border-radius: 9px; white-space: nowrap; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.35);
    box-shadow: inset 0 -1px 0 rgba(255,255,255,0.18);
  }
  .sc-badge--green { background: rgba(16,185,129,0.9); color: #fff; }
  .sc-badge--amber { background: rgba(245,158,11,0.92); color: #fff; }
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
  .sc-toggle-btn {
    border: 0; background: #fff; border-radius: 50%;
    width: 38px; height: 38px; cursor: pointer; color: ${BLUE}; font-size: 14px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 5px 14px rgba(15,23,42,0.14);
  }
  .sc-toggle-btn:hover { background: #eff6ff; }
  .sc-stats {
    display: flex; align-items: stretch; gap: 8px;
    flex-shrink: 0;
  }
  .sc-stat {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 8px 10px; gap: 3px; text-align: center;
    min-height: 68px; min-width: 72px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.16);
    box-shadow: inset 0 -1px 0 rgba(255,255,255,0.16);
  }
  .sc-stat__icon {
    width: 26px; height: 26px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; margin-bottom: 1px;
  }
  .sc-stat__icon--blue  { background: rgba(219,234,254,0.95); color: #1d4ed8; }
  .sc-stat__icon--green { background: rgba(209,250,229,0.95); color: #059669; }
  .sc-stat__icon--red   { background: rgba(254,226,226,0.95); color: #dc2626; }
  .sc-stat__icon--amber { background: rgba(254,243,199,0.95); color: #d97706; }
  .sc-stat__val { font-size: 18px; font-weight: 900; color: #fff; line-height: 1; }
  .sc-stat__lbl { font-size: 9px; color: rgba(255,255,255,0.86); font-weight: 700; white-space: nowrap; }
  .sc-tabs {
    display: flex; gap: 0; padding: 0 20px; border-bottom: 1px solid #e2e8f0; background: #fafbfc;
  }
  .sc-tab {
    display: inline-flex; align-items: center; gap: 7px; height: 48px;
    border: none; background: none; font-size: 13px; font-weight: 700;
    color: #64748b; cursor: pointer; padding: 0 4px; margin-right: 24px; position: relative;
  }
  .sc-tab--active { color: ${BLUE}; }
  .sc-tab--active::after {
    content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
    height: 3px; border-radius: 3px 3px 0 0; background: ${BLUE};
  }
  .sc-body { padding: 22px 22px 18px; }
  .sc-detail-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px 28px; margin-bottom: 18px;
  }
  .sc-detail-item small {
    font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8;
    display: block; margin-bottom: 6px; letter-spacing: 0.04em;
  }
  .sc-detail-item strong {
    font-size: 13px; font-weight: 700; color: #1e293b;
    display: flex; align-items: center; gap: 8px;
  }
  .sc-detail-icon {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .sc-detail-icon--blue { background: #dbeafe; color: #1d4ed8; }
  .sc-detail-icon--pink { background: #fce7ef; color: ${PINK}; }
  .sc-notes {
    border-top: 1px dashed #e2e8f0; padding-top: 16px;
    display: flex; align-items: flex-start; gap: 12px;
    background: #fafbfc; margin: 0 -22px -18px; padding: 16px 22px 18px;
  }
  .sc-notes small { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 4px; }
  .sc-notes p { font-size: 13px; color: #334155; line-height: 1.6; margin: 0; }
  .sc-evidence-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .sc-evidence-card {
    border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;
    display: flex; flex-direction: column; gap: 8px; background: #fafbfc;
    transition: border-color 0.15s;
  }
  .sc-evidence-card:hover { border-color: #bfdbfe; }
  .sc-evidence-icon {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .sc-evidence-icon--amber { background: #fef3c7; color: #d97706; }
  .sc-evidence-icon--green { background: #d1fae5; color: #059669; }
  .sc-evidence-card strong { font-size: 13px; font-weight: 700; color: #1e293b; }
  .sc-evidence-card small { font-size: 11px; font-weight: 600; }
  .ev-uploaded { color: #059669; }
  .ev-pending  { color: #d97706; }
  .sc-file-name { font-size: 11px; color: #64748b; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sc-file-input { display: none; }
  .sc-upload-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 4px; padding: 8px 12px; border-radius: 10px;
    border: 1px solid #bfdbfe; background: #eff6ff; color: ${BLUE};
    font-size: 11px; font-weight: 800; cursor: pointer;
  }
  .sc-upload-btn:hover { background: #dbeafe; }
  .sc-foot {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 14px 22px; flex-wrap: wrap;
    border-top: 1px solid #f1f5f9; background: #fafbfc;
  }
  .sc-foot-right { display: flex; gap: 10px; flex-wrap: wrap; }
  .sc-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; border-radius: 12px; font-size: 12px; font-weight: 700;
    cursor: pointer; border: 1.5px solid #e2e8f0; background: #fff; color: #334155; transition: 0.15s;
  }
  .sc-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .sc-btn--outline { background: #fff; color: ${BLUE}; border-color: #bfdbfe; }
  .sc-btn--outline:hover { background: #eff6ff; }
  .sc-btn--primary { background: ${BLUE}; color: #fff; border-color: ${BLUE}; box-shadow: 0 4px 14px rgba(37,99,235,0.22); }
  .sc-btn--primary:hover { background: #1d4ed8; }

  /* Session modal */
  .session-modal-backdrop {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(15,23,42,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 18px;
  }
  .session-modal {
    width: min(920px, 100%); max-height: 92vh; overflow: hidden;
    background: #fff; border-radius: 20px;
    box-shadow: 0 28px 80px rgba(15,23,42,0.28);
    display: flex; flex-direction: column;
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
  .session-file-input { display: none; }
  .session-file-picker {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 7px;
    min-width: 0;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #475569;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
    padding: 7px 10px;
  }
  .session-file-picker:hover { border-color: ${BLUE}; color: ${BLUE}; background: #eff6ff; }
  .session-file-picker--selected {
    border-style: solid;
    border-color: #bbf7d0;
    background: #f0fdf4;
    color: #15803d;
  }
  .session-file-picker span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Attendance dashboard modal */
  .attendance-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    background: rgba(15,23,42,0.58);
  }
  .attendance-modal {
    width: min(1180px, 100%);
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 28px 80px rgba(15,23,42,0.18);
  }
  .attendance-session-details {
    margin-bottom: 16px;
    padding: 14px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
  }
  .attendance-session-details h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }
  .attendance-session-details h4 i { color: ${BLUE}; }
  .attendance-session-details__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  .attendance-session-details__item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
  }
  .attendance-session-details__item span {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 4px;
  }
  .attendance-session-details__item strong {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    word-break: break-word;
  }
  .attendance-selected-student {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
  }
  .attendance-selected-student__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .attendance-selected-student__header strong {
    font-size: 13px;
    color: #0f172a;
  }
  .attendance-selected-student__header select {
    min-width: 220px;
    max-width: 100%;
  }
  .attendance-selected-student__card {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
  .attendance-selected-student__card div {
    background: #f8fafc;
    border-radius: 12px;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
  }
  .attendance-selected-student__card span {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 6px;
  }
  .attendance-selected-student__card strong {
    display: block;
    font-size: 14px;
    color: #0f172a;
    font-weight: 800;
    word-break: break-word;
  }
  .attendance-modal__head,
  .attendance-modal__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 18px 20px;
    border-bottom: 1px solid #e2e8f0;
  }
  .attendance-modal__head h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    color: #0f172a;
    font-size: 18px;
    font-weight: 900;
  }
  .attendance-modal__foot {
    justify-content: flex-end;
    border-top: 1px solid #e2e8f0;
    border-bottom: 0;
    background: #fafbfc;
  }
  .attendance-close-btn {
    width: 36px;
    height: 36px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #64748b;
    cursor: pointer;
  }
  .attendance-close-btn:hover { background: #f8fafc; color: #0f172a; }
  .attendance-modal__body {
    overflow-y: auto;
    padding: 18px;
    background: #f8fafc;
  }
  .attendance-control-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
  }
  .attendance-view-toggle {
    display: inline-flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .attendance-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 36px;
    border: 1.5px solid #bfdbfe;
    border-radius: 8px;
    background: #fff;
    color: ${BLUE};
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }
  .attendance-toggle--active {
    background: ${BLUE};
    color: #fff;
    border-color: ${BLUE};
    box-shadow: 0 8px 18px rgba(37,99,235,0.18);
  }
  .attendance-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }
  .attendance-stat-card {
    min-height: 92px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    border-radius: 10px;
    padding: 14px;
    color: #fff;
    box-shadow: 0 12px 28px rgba(15,23,42,0.08);
  }
  .attendance-stat-card strong { font-size: 25px; font-weight: 900; line-height: 1; }
  .attendance-stat-card span { font-size: 12px; font-weight: 800; opacity: 0.92; }
  .attendance-stat-card--blue { background: #2563eb; }
  .attendance-stat-card--green { background: #059669; }
  .attendance-stat-card--red { background: #dc2626; }
  .attendance-stat-card--amber { background: #d97706; }
  .attendance-register,
  .attendance-summary-view {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }
  .attendance-register__title,
  .attendance-summary-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
  }
  .attendance-register__title h4,
  .attendance-summary-head h4 {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 900;
  }
  .attendance-register__title span,
  .attendance-summary-head span {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }
  .attendance-table-wrap {
    max-height: 520px;
    overflow: auto;
  }
  .attendance-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 760px;
    font-size: 12px;
  }
  .attendance-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #1e293b;
    color: #fff;
    padding: 11px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .attendance-table th small {
    display: block;
    margin-top: 2px;
    color: rgba(255,255,255,0.76);
    font-size: 10px;
    text-transform: none;
  }
  .attendance-table td {
    border-bottom: 1px solid #eef2f7;
    padding: 10px 12px;
    vertical-align: middle;
    color: #334155;
    font-weight: 700;
  }
  .attendance-table tbody tr:hover { background: #f8fafc; cursor: pointer; }
  .attendance-row--active { background: #eef7ff; }

  .attendance-table tfoot td {
    position: sticky;
    bottom: 0;
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 900;
  }
  .attendance-student-col { min-width: 240px; }
  .attendance-date-col { min-width: 170px; text-align: center; }
  .attendance-percent-col { min-width: 120px; text-align: center; }
  .attendance-percent-value {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    border-radius: 8px;
    padding: 6px 10px;
    background: #fff7ed;
    color: #c2410c;
    font-size: 12px;
    font-weight: 900;
  }
  .attendance-student {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .attendance-avatar {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 36px;
    border-radius: 999px;
    background: #dbeafe;
    color: ${BLUE};
    font-size: 12px;
    font-weight: 900;
  }
  .attendance-student strong {
    display: block;
    color: #0f172a;
    font-size: 13px;
    font-weight: 900;
  }
  .attendance-student small {
    display: block;
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
  }
  .attendance-status-select,
  .attendance-remarks-input {
    min-height: 36px;
    width: 100%;
    border: 1px solid #dbe4ef;
    border-radius: 8px;
    background: #fff;
    padding: 7px 10px;
    color: #0f172a;
    font-size: 12px;
    font-weight: 800;
    outline: none;
  }
  .attendance-remarks-input:focus,
  .attendance-status-select:focus {
    border-color: ${BLUE};
    box-shadow: 0 0 0 2px rgba(37,99,235,0.12);
  }
  .attendance-status-select--present { background: #ecfdf5; color: #047857; border-color: #bbf7d0; }
  .attendance-status-select--absent { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
  .attendance-status-select--not-marked { background: #f8fafc; color: #64748b; border-color: #cbd5e1; }
  .attendance-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 900;
  }
  .attendance-pill--present { background: #dcfce7; color: #047857; }
  .attendance-pill--absent { background: #fee2e2; color: #b91c1c; }
  .attendance-pill--not-marked { background: #e2e8f0; color: #475569; }
  .attendance-day-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    border-radius: 8px;
    padding: 6px 10px;
    background: #eff6ff;
    color: ${BLUE};
    font-size: 11px;
    font-weight: 900;
  }

  /* Students */
  .dbr-student-view { margin-bottom: 20px; }
  .dbr-student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-bottom: 14px; }
  .dbr-student-card { background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; box-shadow: 0 10px 26px rgba(15,23,42,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .dbr-student-card:hover { transform: translateY(-2px); box-shadow: 0 18px 32px rgba(15,23,42,0.1); }
  .dbr-student-card__head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .dbr-student-card__head i { color: ${PINK}; background: rgba(250,85,121,0.12); border-radius: 12px; padding: 8px; font-size: 14px; }
  .dbr-student-card__head h6 { margin: 0; flex: 1; font-size: 14px; font-weight: 800; color: #0f172a; }
  .dbr-info-line { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid #eff6ff; font-size: 12px; color: #475569; }
  .dbr-info-line:first-of-type { border-top: 0; }
  .dbr-info-line i { width: 18px; color: ${BLUE}; font-size: 12px; }

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
    .dbr-portal, .tm-portal { padding: 12px 12px 100px; }
    .dbr-filter-pill { max-width: 100%; }
    .dbr-session-picker__item { min-width: 100%; max-width: 100%; }
    .dbr-points-grid { grid-template-columns: 1fr; }
    .tm-hero { padding: 18px; border-radius: 16px; }
    .tm-hero__title { font-size: 1.35rem; }
    .tm-hero__stats { gap: 8px; }
    .tm-stat-pill { padding: 6px 12px; font-size: 12px; }
    .tm-workspace { grid-template-columns: 1fr; }
    .tm-sidebar { position: static; }
    .tm-session-panel__list { max-height: 240px; }
    .tm-tabs { width: 100%; }
    .tm-tab { flex: 1; justify-content: center; padding: 10px 12px; }
    .tm-toolbar { flex-direction: column; align-items: stretch; }
    .tm-search { max-width: none; }
    .tm-student-grid { grid-template-columns: 1fr; }
    .dbr-filter-pill { max-width: 100%; }
    .dbr-points-grid { grid-template-columns: 1fr; }
    .sc-stats { display: none; }
    .sc-head { flex-wrap: wrap; }
    .sc-head-right { flex-wrap: wrap; }
    .sc-detail-grid { grid-template-columns: 1fr; gap: 14px; }
    .sc-evidence-grid { grid-template-columns: 1fr; }
    .sc-foot { flex-direction: column; }
    .sc-foot-right { width: 100%; flex-direction: column; }
    .sc-btn { width: 100%; justify-content: center; }
    .session-form-grid { grid-template-columns: 1fr; }
    .session-evidence-row { grid-template-columns: 1fr; }
    .session-remove-btn { width: 100%; }
    .attendance-modal-backdrop { padding: 10px; align-items: flex-start; }
    .attendance-modal { max-height: calc(100vh - 20px); }
    .attendance-modal__head,
    .attendance-register__title,
    .attendance-summary-head {
      align-items: flex-start;
      flex-direction: column;
    }
    .attendance-close-btn { position: absolute; top: 12px; right: 12px; }
    .attendance-modal__head { position: relative; padding-right: 58px; }
    .attendance-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .attendance-control-panel,
    .attendance-view-toggle { width: 100%; }
    .attendance-toggle { flex: 1 1 150px; }
    .attendance-table { min-width: 700px; }
   
  }

  @media (min-width: 641px) and (max-width: 1100px) {
    .tm-workspace { grid-template-columns: 260px minmax(0, 1fr); }
    .sc-detail-grid { grid-template-columns: repeat(2, 1fr); }
    .sc-evidence-grid { grid-template-columns: repeat(2, 1fr); }
    .session-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .attendance-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
   
  }
`;

export default TrainerModule;
