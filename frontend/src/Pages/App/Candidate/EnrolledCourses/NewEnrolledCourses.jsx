import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import feather from 'feather-icons';

const PINK = '#fa5579';
const BLUE = '#2563eb';

const SESSIONS_STORAGE_PREFIX = 'trainerModuleSessions:';
const ATTENDANCE_STORAGE_PREFIX = 'trainerModuleAttendance:';
const FEEDBACK_STORAGE_PREFIX = 'necSessionFeedback:';
const SELF_ATTENDANCE_PREFIX = 'necSelfAttendance:';

const loadSelfAttendanceMap = (batchId) => {
  if (!batchId) return {};
  try {
    const raw = localStorage.getItem(`${SELF_ATTENDANCE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveSelfAttendance = (batchId, sessionId, enrollmentId, status, studentName = 'Student') => {
  if (!batchId || !sessionId || !enrollmentId || !status) return;

  const selfMap = loadSelfAttendanceMap(batchId);
  selfMap[`${sessionId}:${enrollmentId}`] = status;
  localStorage.setItem(`${SELF_ATTENDANCE_PREFIX}${batchId}`, JSON.stringify(selfMap));

  const records = loadStoredAttendance(batchId);
  const rows = [...(records[sessionId] || [])];
  const index = rows.findIndex((entry) => String(entry.id) === String(enrollmentId));
  const nextRow = {
    ...(index >= 0 ? rows[index] : {}),
    id: enrollmentId,
    name: studentName,
    mobile: rows[index]?.mobile || '-',
    status,
    remarks: rows[index]?.remarks || '',
    attendancePercent: rows[index]?.attendancePercent || '-',
  };

  if (index >= 0) rows[index] = nextRow;
  else rows.push(nextRow);

  localStorage.setItem(
    `${ATTENDANCE_STORAGE_PREFIX}${batchId}`,
    JSON.stringify({ ...records, [sessionId]: rows })
  );
};

const loadMySessionFeedback = (sessionId, enrollmentId) => {
  if (!sessionId || !enrollmentId) return null;
  try {
    const raw = localStorage.getItem(`${FEEDBACK_STORAGE_PREFIX}${sessionId}:${enrollmentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveMySessionFeedback = (sessionId, enrollmentId, feedback) => {
  if (!sessionId || !enrollmentId) return;
  localStorage.setItem(`${FEEDBACK_STORAGE_PREFIX}${sessionId}:${enrollmentId}`, JSON.stringify(feedback));
};

const formatSessionDate = (dateValue) => {
  if (!dateValue) return new Date().toLocaleDateString('en-IN');
  return new Date(dateValue).toLocaleDateString('en-IN');
};

const loadStoredSessions = (batchId) => {
  if (!batchId) return [];
  try {
    const raw = localStorage.getItem(`${SESSIONS_STORAGE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadStoredAttendance = (batchId) => {
  if (!batchId) return {};
  try {
    const raw = localStorage.getItem(`${ATTENDANCE_STORAGE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const getCandidateSessionAttendance = (attendanceRecordsBySession, selfAttendanceMap, sessionId, enrollmentId) => {
  if (!sessionId || !enrollmentId) return 'Not Marked';

  const selfStatus = selfAttendanceMap[`${sessionId}:${enrollmentId}`];
  if (selfStatus === 'Present' || selfStatus === 'Absent') return selfStatus;

  const rows = attendanceRecordsBySession[sessionId];
  if (!rows?.length) return 'Not Marked';

  const row = rows.find((entry) => String(entry.id) === String(enrollmentId));
  return row?.status || 'Not Marked';
};

const computeCandidateAttendanceSummary = (sessions, attendanceRecordsBySession, selfAttendanceMap, enrollmentId) => {
  let marked = 0;
  let present = 0;
  let absent = 0;

  sessions.forEach((session) => {
    const status = getCandidateSessionAttendance(
      attendanceRecordsBySession,
      selfAttendanceMap,
      session.id,
      enrollmentId
    );
    if (status === 'Not Marked') return;
    marked += 1;
    if (status === 'Present') present += 1;
    if (status === 'Absent') absent += 1;
  });

  const percentage = marked > 0 ? ((present / marked) * 100).toFixed(1) : null;

  return { marked, present, absent, totalSessions: sessions.length, percentage };
};

const DEFAULT_EVIDENCE_DOCS = [
  { id: 'EV001', name: 'Class photo', type: 'Image', status: 'Pending', fileName: '' },
  { id: 'EV002', name: 'Attendance sheet', type: 'Document', status: 'Pending', fileName: '' },
  { id: 'EV003', name: 'Training clip', type: 'Video', status: 'Uploaded', fileName: 'training-clip.mp4' },
];

const buildDummySessions = (basicDetails) => ([
  {
    id: 'DEMO-S001',
    title: 'Telecom Session',
    topicCovered: 'What is Telecom',
    trainingMethod: 'Offline',
    sessionDate: new Date().toISOString().slice(0, 10),
    date: formatSessionDate(new Date()),
    startTime: '12:30',
    endTime: '13:30',
    status: 'Pending',
    departmentName: basicDetails.departmentName || 'B2G',
    projectName: basicDetails.projectName || 'OSDA',
    centerName: basicDetails.centerName || 'Nobel college',
    courseTrade: basicDetails.courseTrade || 'Telecom Grameen Udyami',
    batchCode: basicDetails.batchCode || 'PLTS2526CTCTGUB0095',
    trainerName: basicDetails.trainerName || 'RahulSharma',
    totalCandidates: '1',
    presentCandidates: '0',
    absentCandidates: '0',
    attendance: '0%',
    notes: 'No notes added.',
    evidenceDocs: DEFAULT_EVIDENCE_DOCS,
    isDemo: true,
  },
]);

const SessionFeedbackModal = ({ session, initialRating = 0, initialComment = '', onClose, onSubmit }) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const starGroupId = String(session?.id || 'session').replace(/[^a-zA-Z0-9_-]/g, '');

  const handleSubmit = () => {
    if (!rating) return;
    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <div className="modal fade show nec-feedback-modal" style={{ display: 'block' }} id="feedback">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content review-border">
          <div className="modal-header">
            <h5 className="modal-title text-white text-uppercase">Feedback</h5>
            <button type="button" className="close" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body py-3" id="popup-body">
            <p className="text-center mb-2 nec-feedback-session-title">{session?.title || 'Session'}</p>
            <div className="row vfg">
              <div className="space-ex mb-2">
                <div className="col-12" style={{ display: 'flex', justifyContent: 'center', flexDirection: 'row-reverse' }}>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <React.Fragment key={star}>
                      <input
                        className={`star star-${star}`}
                        id={`star-${star}-${starGroupId}`}
                        type="radio"
                        name={`rating-${starGroupId}`}
                        value={star}
                        checked={rating === star}
                        onChange={() => setRating(star)}
                      />
                      <label className={`star star-${star}`} htmlFor={`star-${star}-${starGroupId}`} />
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="col-12 text-center">
                <textarea
                  rows="2"
                  name="comment"
                  className="w-75 my-3"
                  placeholder="Share your feedback about this session..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary text-white" onClick={handleSubmit} disabled={!rating}>
              Send Feedback/ प्रतिक्रिया भेजें
            </button>
            <button type="button" className="btn btn-danger py-2" onClick={onClose}>
              <i className="fas fa-times d-block d-lg-none" />
              <span className="d-none d-lg-block">Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentStarDisplay = ({ myRating, onClick }) => {
  const filledStars = myRating ? Math.round(myRating) : 0;

  return (
    <button type="button" className="tm-star-display" onClick={onClick}>
      <div className="tm-star-display__stars" aria-label={myRating ? `${myRating} out of 5` : 'No rating yet'}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={
              myRating && star <= filledStars
                ? 'fas fa-star tm-star-display__star tm-star-display__star--filled'
                : 'far fa-star tm-star-display__star'
            }
          />
        ))}
      </div>
      {myRating ? (
        <span className="tm-star-display__meta">Your rating: {myRating} · Tap to update</span>
      ) : (
        <span className="tm-star-display__meta tm-star-display__meta--empty">Tap to give your feedback</span>
      )}
    </button>
  );
};

const SessionViewModal = ({ session, batchSummary, myAttendance, onClose }) => {
  if (!session) return null;

  return (
    <div className="session-modal-backdrop">
      <div className="session-modal" role="dialog" aria-modal="true">
        <div className="session-modal__head">
          <div>
            <h5>Session Details</h5>
            <span>{session.title || session.id}</span>
          </div>
          <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="session-modal__body">
          {batchSummary && <div className="session-modal__context">{batchSummary}</div>}
          <div className="session-form-grid">
            {[
              ['Session Title', session.title],
              ['Topic Covered', session.topicCovered],
              ['Training Method', session.trainingMethod],
              ['Date', session.date || formatSessionDate(session.sessionDate)],
              ['Start Time', session.startTime],
              ['End Time', session.endTime],
              ['Trainer Name', session.trainerName],
              ['My Attendance', myAttendance],
            ].map(([label, value]) => (
              <label key={label} className="session-form-field">
                <span>{label}</span>
                {label === 'My Attendance' ? (
                  <div className="session-form-field__attendance">
                    <MyAttendanceBadge status={myAttendance || 'Not Marked'} />
                  </div>
                ) : (
                  <input type="text" value={value || '-'} readOnly />
                )}
              </label>
            ))}
          </div>
        </div>
        <div className="session-modal__foot">
          <button type="button" className="sc-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const MarkMyAttendanceModal = ({ session, myAttendance, onClose, onSave }) => {
  const [status, setStatus] = useState(
    myAttendance === 'Present' || myAttendance === 'Absent' ? myAttendance : ''
  );

  if (!session) return null;

  return (
    <div className="session-modal-backdrop">
      <div className="session-modal session-modal--sm" role="dialog" aria-modal="true">
        <div className="session-modal__head">
          <div>
            <h5>Mark My Attendance</h5>
            <span>{session.title} · {session.date || formatSessionDate(session.sessionDate)}</span>
          </div>
          <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="session-modal__body nec-attendance-modal">
          <div className="nec-attendance-modal__current">
            <span>Current status</span>
            <MyAttendanceBadge status={myAttendance || 'Not Marked'} />
          </div>
          <label className="nec-attendance-field">
            <span>Select your status</span>
            <select
              className={`nec-attendance-select nec-attendance-select--${attendanceTone(status || 'Not Marked')}`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Choose status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </label>
          <p>Mark whether you attended this training session.</p>
        </div>
        <div className="session-modal__foot">
          <button type="button" className="sc-btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="sc-btn sc-btn--primary"
            disabled={!status}
            onClick={() => onSave(status)}
          >
            <i className="fas fa-save" /> Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

const attendanceTone = (status) => {
  if (status === 'Present') return 'green';
  if (status === 'Absent') return 'red';
  return 'amber';
};

const attendanceIcon = (status) => {
  if (status === 'Present') return 'fa-check-circle';
  if (status === 'Absent') return 'fa-times-circle';
  return 'fa-clock';
};

const MyAttendanceBadge = ({ status, size = 'md', onClick }) => {
  const tone = attendanceTone(status);
  const icon = attendanceIcon(status);
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`nec-attendance-pill nec-attendance-pill--${tone}${size === 'sm' ? ' nec-attendance-pill--sm' : ''}${onClick ? ' nec-attendance-pill--btn' : ''}`}
      onClick={onClick}
    >
      <i className={`fas ${icon}`} /> {status}
    </Tag>
  );
};

const MyAttendanceTable = ({ sessions, getMyAttendance }) => {
  if (!sessions.length) {
    return <p className="nec-attendance-table__empty">No sessions available yet.</p>;
  }

  return (
    <div className="nec-attendance-table-wrap">
      <table className="nec-attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Session</th>
            <th>Topic</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, index) => {
            const status = getMyAttendance(session.id);
            return (
              <tr key={session.id} className={`nec-attendance-table__row--${attendanceTone(status)}`}>
                <td>{index + 1}</td>
                <td>
                  <strong>{session.title || 'Session'}</strong>
                </td>
                <td>{session.topicCovered || '-'}</td>
                <td>{session.date || formatSessionDate(session.sessionDate)}</td>
                <td>
                  {session.startTime && session.endTime
                    ? `${session.startTime} - ${session.endTime}`
                    : '-'}
                </td>
                <td><MyAttendanceBadge status={status} size="sm" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const MyAttendanceOverview = ({ summary, onViewDetails }) => (
  <div className="nec-attendance-overview">
    <div className="nec-attendance-overview__head">
      <div>
        <span className="nec-attendance-overview__lbl">My Attendance</span>
        <h3 className="nec-attendance-overview__title">
          {summary.percentage != null ? `${summary.percentage}% present` : 'No sessions marked yet'}
        </h3>
      </div>
      <button type="button" className="sc-btn sc-btn--outline" onClick={onViewDetails}>
        <i className="fas fa-table" /> View Attendance Details
      </button>
    </div>
    <div className="nec-attendance-overview__stats">
      <div className="nec-attendance-overview__stat nec-attendance-overview__stat--green">
        <strong>{summary.present}</strong>
        <span>Present</span>
      </div>
      <div className="nec-attendance-overview__stat nec-attendance-overview__stat--red">
        <strong>{summary.absent}</strong>
        <span>Absent</span>
      </div>
      <div className="nec-attendance-overview__stat nec-attendance-overview__stat--amber">
        <strong>{summary.totalSessions - summary.marked}</strong>
        <span>Not marked</span>
      </div>
      <div className="nec-attendance-overview__stat nec-attendance-overview__stat--blue">
        <strong>{summary.marked}/{summary.totalSessions}</strong>
        <span>Sessions marked</span>
      </div>
    </div>
  </div>
);

const MyAttendanceDetailsModal = ({ summary, sessions, getMyAttendance, onClose }) => (
  <div className="session-modal-backdrop">
    <div className="session-modal session-modal--lg" role="dialog" aria-modal="true">
      <div className="session-modal__head">
        <div>
          <h5>Attendance Details</h5>
          <span>
            {summary.percentage != null ? `${summary.percentage}% present` : 'No sessions marked yet'}
            {' · '}{summary.present} present · {summary.absent} absent · {summary.totalSessions - summary.marked} not marked
          </span>
        </div>
        <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="session-modal__body nec-attendance-details-modal">
        <div className="nec-attendance-overview__stats nec-attendance-overview__stats--modal">
          <div className="nec-attendance-overview__stat nec-attendance-overview__stat--green">
            <strong>{summary.present}</strong>
            <span>Present</span>
          </div>
          <div className="nec-attendance-overview__stat nec-attendance-overview__stat--red">
            <strong>{summary.absent}</strong>
            <span>Absent</span>
          </div>
          <div className="nec-attendance-overview__stat nec-attendance-overview__stat--amber">
            <strong>{summary.totalSessions - summary.marked}</strong>
            <span>Not marked</span>
          </div>
          <div className="nec-attendance-overview__stat nec-attendance-overview__stat--blue">
            <strong>{summary.marked}/{summary.totalSessions}</strong>
            <span>Sessions marked</span>
          </div>
        </div>
        <div className="nec-attendance-overview__table-head">
          <span>View Attendance</span>
          <small>{sessions.length} session{sessions.length === 1 ? '' : 's'}</small>
        </div>
        <MyAttendanceTable sessions={sessions} getMyAttendance={getMyAttendance} />
      </div>
      <div className="session-modal__foot">
        <button type="button" className="sc-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const getStudentDisplayName = () => (
  localStorage.getItem('name') || localStorage.getItem('candidate') || 'Student'
);

const resolveBatchId = (appliedCourse) => {
  const batch = appliedCourse?.batch;
  if (!batch) return '';
  return batch._id ? String(batch._id) : String(batch);
};

const filterSessionsForEnrollment = (sessions, appliedCourse) => {
  const batchId = resolveBatchId(appliedCourse);
  const courseId = appliedCourse?._course?._id ? String(appliedCourse._course._id) : '';

  return sessions.filter((session) => {
    if (batchId && session.batch && String(session.batch) !== batchId) return false;
    if (courseId && session.course && String(session.course) !== courseId) return false;
    return true;
  });
};

const CandidateSessionCard = ({
  session,
  basicDetails,
  enrollmentId,
  batchId,
  studentName,
  myAttendance,
  onViewSession,
  onAttendanceChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [myReview, setMyReview] = useState(() => loadMySessionFeedback(session?.id, enrollmentId));
  const [toast, setToast] = useState('');
  const timeRange = `${session.startTime || '10:00'} - ${session.endTime || '12:00'}`;
  const tone = attendanceTone(myAttendance);
  const attendanceHint = myAttendance === 'Not Marked' ? 'Tap to mark' : 'Tap to update';

  useEffect(() => {
    setMyReview(loadMySessionFeedback(session?.id, enrollmentId));
  }, [session?.id, enrollmentId]);

  const handleFeedbackSubmit = ({ rating, comment }) => {
    const feedback = {
      rating,
      comment,
      submittedAt: new Date().toISOString(),
    };
    saveMySessionFeedback(session.id, enrollmentId, feedback);
    setMyReview(feedback);
    setFeedbackOpen(false);
    setToast('Feedback saved successfully');
    setTimeout(() => setToast(''), 2500);
  };

  const handleAttendanceSave = (status) => {
    saveSelfAttendance(batchId, session.id, enrollmentId, status, studentName);
    setAttendanceOpen(false);
    onAttendanceChange();
    setToast('Attendance saved successfully');
    setTimeout(() => setToast(''), 2500);
  };

  const detailItems = [
    ['fa-sitemap', 'Department', session.departmentName || basicDetails.departmentName || '-', 'blue'],
    ['fa-project-diagram', 'Project', session.projectName || basicDetails.projectName || '-', 'blue'],
    ['fa-building', 'Center', session.centerName || basicDetails.centerName || '-', 'blue'],
    ['fa-book-open', 'Topic covered', session.topicCovered || session.title, 'blue'],
    ['fa-chalkboard', 'Training method', session.trainingMethod || 'Interactive Learning', 'blue'],
    ['fa-calendar-alt', 'Session date', session.date || formatSessionDate(session.sessionDate), 'blue'],
    ['fa-clock', 'Time', timeRange, 'blue'],
    ['fa-graduation-cap', 'Course / trade', session.courseTrade || basicDetails.courseTrade, 'pink'],
    ['fa-hashtag', 'Batch code', session.batchCode || basicDetails.batchCode, 'pink'],
    ['fa-user', 'Trainer', session.trainerName || basicDetails.trainerName, 'pink'],
  ];

  const statItems = [
    { icon: 'fa-users', val: session.totalCandidates || '0', lbl: 'Total Candidates', cls: 'blue' },
    { icon: 'fa-check-circle', val: session.presentCandidates || '0', lbl: 'Present', cls: 'green' },
    { icon: 'fa-times-circle', val: session.absentCandidates || '0', lbl: 'Absent', cls: 'red' },
    { icon: 'fa-percentage', val: session.attendance || '0%', lbl: 'Attendance', cls: 'amber' },
  ];

  const evidenceDocs = session.evidenceDocs?.length ? session.evidenceDocs : DEFAULT_EVIDENCE_DOCS;

  return (
    <article className="sc-wrap">
      <div className="sc-head">
        <div className="sc-head-left">
          <div className="sc-avatar">
            <i className="fas fa-user" />
          </div>
          <div className="sc-head-text">
            <div className="sc-trainer-name">{session.title || 'Session'}</div>
            <div className="sc-my-attendance">
              <MyAttendanceBadge status={myAttendance} size="sm" onClick={() => setAttendanceOpen(true)} />
            </div>
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
              <i className="far fa-image" /> Documents
            </button>
          </nav>

          {activeTab === 'details' ? (
            <div className="sc-body">
              <div className="sc-detail-grid">
                {detailItems.map(([icon, label, value, colorTone]) => (
                  <div key={label} className="sc-detail-item">
                    <small>{label}</small>
                    <strong>
                      <span className={`sc-detail-icon sc-detail-icon--${colorTone}`}>
                        <i className={`fas ${icon}`} />
                      </span>
                      <span className="sc-detail-value">{value || '-'}</span>
                    </strong>
                  </div>
                ))}
                <div className="sc-detail-item">
                  <small>Student Feedback</small>
                  <StudentStarDisplay
                    myRating={myReview?.rating}
                    onClick={() => setFeedbackOpen(true)}
                  />
                </div>
                <div className="sc-detail-item">
                  <small>My Attendance</small>
                  <button
                    type="button"
                    className={`nec-attendance-pill nec-attendance-pill--${tone} nec-attendance-pill--btn`}
                    onClick={() => setAttendanceOpen(true)}
                  >
                    <i className={`fas ${attendanceIcon(myAttendance)}`} /> {myAttendance} · {attendanceHint}
                  </button>
                </div>
              </div>

              <div className="sc-notes">
                <span className="sc-detail-icon sc-detail-icon--blue">
                  <i className="far fa-edit" />
                </span>
                <div>
                  <small>Additional notes</small>
                  <p>{session.notes || 'No notes added.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="sc-body">
              <div className="sc-evidence-grid">
                {evidenceDocs.map((doc) => {
                  const icon = doc.type === 'Image' ? 'fa-image' : doc.type === 'Video' ? 'fa-video' : 'fa-file-alt';
                  const docTone = doc.status === 'Uploaded' ? 'green' : 'amber';
                  return (
                    <div key={doc.id} className="sc-evidence-card">
                      <div className={`sc-evidence-icon sc-evidence-icon--${docTone}`}>
                        <i className={`fas ${icon}`} />
                      </div>
                      <strong>{doc.name}</strong>
                      <small className={doc.status === 'Uploaded' ? 'ev-uploaded' : 'ev-pending'}>
                        <i className={`fas ${doc.status === 'Uploaded' ? 'fa-check-circle' : 'fa-clock'}`} />
                        &nbsp;{doc.status}
                      </small>
                      {doc.fileName && <span className="sc-file-name">{doc.fileName}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <footer className="sc-foot">
            <button type="button" className="sc-btn" onClick={() => onViewSession(session)}>
              <i className="far fa-eye" /> View Session
            </button>
            <div className="sc-foot-right">
              <button type="button" className="sc-btn sc-btn--outline" onClick={() => setAttendanceOpen(true)}>
                <i className="fas fa-user-check" /> Mark Attendance
              </button>
              <button
                type="button"
                className={`sc-btn sc-btn--primary${session.status === 'Completed' ? '' : ''}`}
                onClick={() => onViewSession(session)}
              >
                <i className="fas fa-chart-bar" /> View Details
              </button>
            </div>
          </footer>
        </>
      )}

      {attendanceOpen && (
        <MarkMyAttendanceModal
          session={session}
          myAttendance={myAttendance}
          onClose={() => setAttendanceOpen(false)}
          onSave={handleAttendanceSave}
        />
      )}

      {feedbackOpen && (
        <SessionFeedbackModal
          session={session}
          initialRating={myReview?.rating || 0}
          initialComment={myReview?.comment || ''}
          onClose={() => setFeedbackOpen(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {toast && (
        <div className="nec-toast">
          <i className="fas fa-check-circle me-2" />{toast}
        </div>
      )}
    </article>
  );
};

const EnrolledCourseList = ({ courses, loading }) => {
  if (loading) {
    return (
      <div className="nec-empty">
        <i className="fas fa-spinner fa-spin" />
        <p>Loading enrolled courses...</p>
      </div>
    );
  }

  if (!courses.length) {
    return <h4 className="text-center">No Enrolled Courses Found</h4>;
  }

  return courses.map((appliedCourse) => {
    const course = appliedCourse._course;
    const batch = appliedCourse.batch;
    const batchId = resolveBatchId(appliedCourse);
    const storedCount = batchId ? loadStoredSessions(batchId).length : 0;
    const sessionCount = storedCount || 1;

    return (
      <div className="card mb-2" key={appliedCourse._id}>
        <div className="card-body">
          <div className="row pointer">
            <div className="col-lg-8 col-md-7 column">
              <div className="job-single-sec mt-xl-0">
                <div className="job-single-head border-0 pb-0">
                  <div>
                    <h6 className="text-capitalize font-weight-bolder">
                      {course?.name || 'NA'}
                    </h6>
                    <span className="text-capitalize set-lineh">
                      {course?.sectors?.length > 0 ? course.sectors[0].name : ''}
                    </span>
                  </div>
                </div>
                <Link to={`/candidate/newEnrolledCourses/${appliedCourse._id}`}>
                  <div className="job-overview mt-4">
                    <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                      <li style={{ display: 'inline' }}>
                        <i className="la la-calendar" />
                        <h3 className="jobDetails-wrap">{batch?.name || 'N/A'}</h3>
                        <span className="jobDetails-wrap">Batch Name</span>
                      </li>
                      <li style={{ display: 'inline' }}>
                        <i className="la la-user" />
                        <h3 className="jobDetails-wrap">{batch?.instructor || 'N/A'}</h3>
                        <span className="jobDetails-wrap">Instructor</span>
                      </li>
                      <li style={{ display: 'inline', float: 'right', width: '35.334%' }}>
                        <i className="la la-chalkboard" />
                        <h3 className="jobDetails-wrap">{sessionCount}</h3>
                        <span className="jobDetails-wrap">Training Sessions</span>
                      </li>
                    </ul>
                  </div>
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-md-5 column mt-xl-1 mt-lg-1 mt-md-1 mt-sm-3 mt-0">
              <div className="add--documents mt-1">
                <Link
                  to={`/candidate/reqDocs/${course?._id}`}
                  className="btn btn-success text-white waves-effect waves-light"
                >
                  <i className="fas fa-upload" /> Upload Documents
                </Link>
                <Link
                  to={`/candidate/newEnrolledCourses/${appliedCourse._id}`}
                  className="btn btn-primary text-white waves-effect waves-light mt-2"
                >
                  <i className="fas fa-chalkboard-teacher" /> View Sessions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });
};

const EnrolledCourseSessions = ({ enrollmentId, courses, loading, onRefresh, refreshKey }) => {
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState('');
  const [viewSession, setViewSession] = useState(null);
  const [attendanceDetailsOpen, setAttendanceDetailsOpen] = useState(false);
  const studentName = useMemo(() => getStudentDisplayName(), []);

  const enrollment = useMemo(
    () => courses.find((item) => String(item._id) === String(enrollmentId)),
    [courses, enrollmentId]
  );

  const batchId = useMemo(() => resolveBatchId(enrollment), [enrollment]);

  const basicDetails = useMemo(() => ({
    courseTrade: enrollment?._course?.name || '-',
    batchCode: enrollment?.batch?.name || enrollment?.batch?.code || '-',
    trainerName: enrollment?.batch?.instructor || '-',
    centerName: enrollment?._center?.name || '-',
    departmentName: 'B2G',
    projectName: 'OSDA',
  }), [enrollment]);

  const storedSessions = useMemo(() => {
    if (!batchId || !enrollment) return [];
    return filterSessionsForEnrollment(loadStoredSessions(batchId), enrollment);
  }, [batchId, enrollment, refreshKey]);

  const usingDemoSessions = storedSessions.length === 0;

  const sessions = useMemo(
    () => (storedSessions.length ? storedSessions : buildDummySessions(basicDetails)),
    [storedSessions, basicDetails]
  );

  const attendanceRecordsBySession = useMemo(
    () => (batchId ? loadStoredAttendance(batchId) : {}),
    [batchId, refreshKey]
  );

  const selfAttendanceMap = useMemo(
    () => (batchId ? loadSelfAttendanceMap(batchId) : {}),
    [batchId, refreshKey]
  );

  const batchSummary = useMemo(
    () => [
      basicDetails.departmentName,
      basicDetails.projectName,
      basicDetails.centerName,
      basicDetails.courseTrade,
      basicDetails.batchCode,
    ].filter(Boolean).join(' · '),
    [basicDetails]
  );

  const attendanceSummary = useMemo(
    () => computeCandidateAttendanceSummary(sessions, attendanceRecordsBySession, selfAttendanceMap, enrollmentId),
    [sessions, attendanceRecordsBySession, selfAttendanceMap, enrollmentId]
  );

  const filteredSessions = useMemo(() => {
    const query = quickSearch.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) =>
      session.title?.toLowerCase().includes(query)
      || session.topicCovered?.toLowerCase().includes(query)
      || session.date?.toLowerCase().includes(query)
      || session.batchCode?.toLowerCase().includes(query)
    );
  }, [sessions, quickSearch]);

  const getMyAttendance = useCallback((sessionId) => (
    getCandidateSessionAttendance(attendanceRecordsBySession, selfAttendanceMap, sessionId, enrollmentId)
  ), [attendanceRecordsBySession, selfAttendanceMap, enrollmentId]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key?.startsWith('trainerModule') && !event.key?.startsWith('necSelfAttendance')) return;
      onRefresh();
    };
    const handleFocus = () => onRefresh();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [onRefresh]);

  if (loading) {
    return (
      <div className="nec-empty">
        <i className="fas fa-spinner fa-spin" />
        <p>Loading course sessions...</p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="nec-empty">
        <i className="fas fa-exclamation-circle" />
        <p>Enrollment not found.</p>
        <button type="button" className="nec-btn nec-btn--ghost" onClick={() => navigate('/candidate/newEnrolledCourses')}>
          Back to courses
        </button>
      </div>
    );
  }

  if (!batchId) {
    return (
      <div className="nec-empty">
        <i className="fas fa-layer-group" />
        <p>Batch is not assigned yet. Sessions will appear after batch assignment.</p>
        <button type="button" className="nec-btn nec-btn--ghost" onClick={() => navigate('/candidate/newEnrolledCourses')}>
          Back to courses
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="nec-header">
        <div>
          <button type="button" className="nec-back-link" onClick={() => navigate('/candidate/newEnrolledCourses')}>
            <i className="fas fa-arrow-left" /> Back to Enrolled Courses
          </button>
          <h1 className="nec-title">{enrollment._course?.name || 'Course Sessions'}</h1>
        </div>
      </div>

      <div className="dbr-session-bar">
        <div className="dbr-session-summary">
          <span className="dbr-session-summary__lbl">Selected path</span>
          <span className="dbr-session-summary__count">{batchSummary}</span>
          <span className="dbr-session-summary__count">
            <strong>{filteredSessions.length}</strong> sessions
            {usingDemoSessions && ' · Demo preview'}
          </span>
          
        </div>
      </div>

      <MyAttendanceOverview
        summary={attendanceSummary}
        onViewDetails={() => setAttendanceDetailsOpen(true)}
      />


      <div className="nec-search-wrap">
        <input
          type="text"
          className="nec-search"
          placeholder="Search sessions by title, topic, date..."
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
        />
      </div>

      <div className="nec-session-list">
        {filteredSessions.map((session) => (
          <CandidateSessionCard
            key={session.id}
            session={session}
            basicDetails={basicDetails}
            enrollmentId={enrollmentId}
            batchId={batchId}
            studentName={studentName}
            myAttendance={getMyAttendance(session.id)}
            onViewSession={setViewSession}
            onAttendanceChange={onRefresh}
          />
        ))}
      </div>

      {viewSession && (
        <SessionViewModal
          session={viewSession}
          batchSummary={batchSummary}
          myAttendance={getMyAttendance(viewSession.id)}
          onClose={() => setViewSession(null)}
        />
      )}

      {attendanceDetailsOpen && (
        <MyAttendanceDetailsModal
          summary={attendanceSummary}
          sessions={filteredSessions}
          getMyAttendance={getMyAttendance}
          onClose={() => setAttendanceDetailsOpen(false)}
        />
      )}
    </>
  );
};

const NewEnrolledCourses = () => {
  const { enrollmentId } = useParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const fetchEnrolledCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/candidate/enrolledCourses`, {
        headers: { 'x-auth': localStorage.getItem('token') },
      });

      if (response.data.status) {
        setCourses(response.data.data.courses || []);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    feather.replace();
  }, [courses, enrollmentId]);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [fetchEnrolledCourses, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <>
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12 my-auto">
              <h3 className="content-header-title float-left mb-0">
                {enrollmentId ? 'Training Sessions' : 'My Enrolled Courses'}
              </h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted" />
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/candidate/newEnrolledCourses">Enrolled Courses</Link>
                  </li>
                  {enrollmentId && (
                    <>
                      <li className="breadcrumb-separator">
                        <i className="fas fa-angle-right mx-1 text-muted" />
                      </li>
                      <li className="breadcrumb-item active">Sessions</li>
                    </>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="searchCourses" className="mb-2">
        <div className="container">
          <ul className="nav nav-tabs justify-content-center d-md-none d-sm-block" role="tablist">
            <li className="nav-item" role="presentation">
              <Link className="nav-link" to="/candidate/searchcourses">Search Courses</Link>
            </li>
            <li className="nav-item" role="presentation">
              <Link className="nav-link" to="/candidate/pendingFee">Pending for Fee</Link>
            </li>
            <li className="nav-item" role="presentation">
              <Link className="nav-link" to="/candidate/appliedCourses">Applied Courses</Link>
            </li>
            <li className="nav-item" role="presentation">
              <Link className="nav-link active" to="/candidate/newEnrolledCourses">Enrolled Courses</Link>
            </li>
          </ul>
        </div>
      </section>

      <section className={`searchjobspage${enrollmentId ? ' nec-portal' : ''}`}>
        <div className="pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
          {enrollmentId ? (
            <EnrolledCourseSessions
              enrollmentId={enrollmentId}
              courses={courses}
              loading={loading}
              onRefresh={handleRefresh}
              refreshKey={refreshKey}
            />
          ) : (
            <EnrolledCourseList courses={courses} loading={loading} />
          )}
        </div>
      </section>

      <style>{SESSION_CARD_CSS}</style>
      <style>{FEEDBACK_MODAL_CSS}</style>
      <style>{LIST_CSS}</style>
    </>
  );
};

const LIST_CSS = `
.breadcrumb-item a { color: #FC2B5A; }
.job-overview h3 { color: #2c2c2c; }
.font-weight-bolder { font-weight: bolder !important; }
.btn {
  display: inline-block; font-weight: 400; color: #626262; text-align: center;
  vertical-align: middle; user-select: none; border: 0 solid transparent;
  padding: 0.9rem 2rem; font-size: 1rem; line-height: 1; border-radius: 0.4285rem;
}
.job-single-sec { float: left; width: 100%; }
.job-single-head { float: left; width: 100%; display: block !important; width: 100% !important; overflow-wrap: break-word; }
.job-overview { float: left; width: 100%; }
.job-overview ul>li { position: relative; margin: 15px 0!important; float: left; width: 100%; padding-left: 67px; }
.job-overview ul { float: left; width: 100%; border: 2px solid #e8ecec; border-radius: 8px; padding:15px !important; transition:.3s; }
.job-single-sec .job-overview ul li { float: left; width: 32.334%; padding-left: 50px!important; }
.job-overview ul > li h3 { float: left; width: 100%; font-size: 13px; margin: 0; }
.job-overview ul > li span { float: left; width: 100%; font-size: 13px; color: #888888; margin-top: 7px; }
.job-overview ul>li i { position: absolute; top: 5px; font-size: 30px; color: #FC2B5A; }
.job-overview ul:hover { border-color: #FC2B5A; box-shadow: 4px 4px 0px 0px rgba(241, 117, 37, 0.75); cursor: pointer; }
.set-lineh { overflow-wrap: break-word; width: 100% !important; padding: 2px !important; }
.btn-primary { background-color: #7367f0; border-color: #7367f0; }
@media(max-width:768px){
  .job-overview > ul { display: flex; flex-direction: column; }
  .job-single-sec .job-overview ul li { width: 100%!important; }
}
`;

const SESSION_CARD_CSS = `
.nec-portal {
  padding: 0 4px 40px;
  background: linear-gradient(180deg, #fff5f7 0%, #f4f6f9 120px, #f4f6f9 100%);
  min-height: 60vh;
}
.nec-header { margin-bottom: 16px; }
.nec-back-link {
  border: none; background: transparent; color: ${PINK}; font-size: 13px; font-weight: 700;
  cursor: pointer; padding: 0; margin-bottom: 10px; display: inline-flex; align-items: center; gap: 8px;
}
.nec-title { font-size: 1.5rem; font-weight: 900; margin: 0 0 6px; color: #0f172a; }
.nec-demo-banner {
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  padding: 12px 14px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe;
  color: #1d4ed8; font-size: 12px; font-weight: 700;
}
.dbr-session-bar {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px; margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(15,23,42,0.06);
}
.dbr-session-summary { display: flex; flex-direction: column; gap: 4px; }
.dbr-session-summary__lbl {
  font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;
}
.dbr-session-summary__count { font-size: 12px; font-weight: 700; color: #334155; line-height: 1.45; }
.nec-search-wrap { margin-bottom: 14px; }
.nec-search {
  width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;
  font-size: 13px; outline: none; background: #fff;
}
.nec-search:focus { border-color: ${BLUE}; box-shadow: 0 0 0 2px rgba(37,99,235,0.12); }
.nec-session-list { display: flex; flex-direction: column; gap: 10px; }
.nec-empty { text-align: center; padding: 48px 20px; color: #64748b; }
.nec-empty i { font-size: 28px; color: #cbd5e1; margin-bottom: 12px; display: block; }
.nec-btn { border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
.nec-btn--ghost { border: 1px solid #e2e8f0; background: #fff; color: #475569; }
.nec-attendance-pill {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 800;
}
.nec-attendance-pill--sm { padding: 3px 8px; font-size: 10px; }
.nec-attendance-pill--lg { padding: 10px 16px; font-size: 14px; }
.nec-attendance-pill--green { background: #dcfce7; color: #047857; }
.nec-attendance-pill--red { background: #fee2e2; color: #b91c1c; }
.nec-attendance-pill--amber { background: #fef3c7; color: #b45309; }
.nec-attendance-pill--btn {
  border: none; cursor: pointer; font-family: inherit;
}
.nec-attendance-pill--btn:hover { filter: brightness(0.97); }
.nec-attendance-overview {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px;
  margin-bottom: 14px; box-shadow: 0 8px 24px rgba(15,23,42,0.06);
}
.nec-attendance-overview__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px;
}
.nec-attendance-overview__lbl {
  font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;
}
.nec-attendance-overview__title { margin: 4px 0 0; font-size: 18px; font-weight: 900; color: #0f172a; }
.nec-attendance-overview__stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px;
}
.nec-attendance-overview__stat {
  border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px;
}
.nec-attendance-overview__stat strong { font-size: 18px; font-weight: 900; line-height: 1; }
.nec-attendance-overview__stat span { font-size: 11px; font-weight: 700; }
.nec-attendance-overview__stat--green { background: #ecfdf5; color: #047857; }
.nec-attendance-overview__stat--red { background: #fef2f2; color: #b91c1c; }
.nec-attendance-overview__stat--amber { background: #fffbeb; color: #b45309; }
.nec-attendance-overview__stat--blue { background: #eff6ff; color: #1d4ed8; }
.nec-attendance-overview__stats--modal { margin-bottom: 14px; }
.nec-attendance-details-modal { padding-top: 8px; }
.nec-attendance-overview__table-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px;
}
.nec-attendance-overview__table-head span {
  font-size: 12px; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.04em;
}
.nec-attendance-overview__table-head small { font-size: 11px; font-weight: 700; color: #64748b; }
.nec-attendance-table-wrap {
  overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
}
.nec-attendance-table {
  width: 100%; border-collapse: collapse; font-size: 12px; min-width: 640px;
}
.nec-attendance-table th,
.nec-attendance-table td {
  padding: 11px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: middle;
}
.nec-attendance-table th {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;
  background: #f8fafc; font-weight: 800; white-space: nowrap;
}
.nec-attendance-table tbody tr:last-child td { border-bottom: none; }
.nec-attendance-table tbody tr:nth-child(even) { background: #fafbfc; }
.nec-attendance-table tbody tr:hover { background: #f1f5f9; }
.nec-attendance-table td:first-child { color: #64748b; font-weight: 700; width: 40px; }
.nec-attendance-table td strong { font-size: 12px; color: #0f172a; font-weight: 800; }
.nec-attendance-table__empty {
  text-align: center; color: #64748b; padding: 20px 12px; margin: 0;
  border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; font-size: 13px;
}
.nec-attendance-table__row--green td:last-child { background: rgba(236,253,245,0.45); }
.nec-attendance-table__row--red td:last-child { background: rgba(254,242,242,0.45); }
.nec-attendance-table__row--amber td:last-child { background: rgba(255,251,235,0.55); }
.nec-attendance-modal__current {
  display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px;
}
.nec-attendance-modal__current span { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
.session-form-field__attendance { padding-top: 4px; }
.sc-my-attendance { margin-top: 4px; }
.sc-head-text .nec-attendance-pill--sm {
  background: rgba(255,255,255,0.92); box-shadow: 0 2px 8px rgba(15,23,42,0.12);
}
.nec-attendance-field {
  display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 4px;
}
.nec-attendance-field span { font-size: 12px; font-weight: 700; color: #475569; }
.nec-attendance-select {
  min-width: 180px; padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0;
  font-size: 13px; font-weight: 700; color: #334155; background: #fff; cursor: pointer;
}
.nec-attendance-select--green { border-color: #86efac; background: #f0fdf4; color: #047857; }
.nec-attendance-select--red { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; }
.nec-attendance-select--amber { border-color: #fcd34d; background: #fffbeb; color: #b45309; }
.nec-attendance-modal { text-align: center; }
.nec-attendance-modal p { margin: 12px 0 0; color: #64748b; font-size: 13px; }

.sc-wrap {
  background: #fff; border: 1px solid #bfdbfe; border-radius: 10px; overflow: hidden;
  margin-bottom: 10px; box-shadow: 0 4px 14px rgba(37,99,235,0.08);
}
.sc-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 12px; flex-wrap: nowrap;
  background: linear-gradient(105deg, #1264dc 0%, #1b8def 48%, #2bd2e9 100%);
}
.sc-head-left {
  display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 0; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.35); border-radius: 8px; padding: 5px 8px;
  background: rgba(255,255,255,0.13); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
}
.sc-avatar {
  width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  background: rgba(255,255,255,0.22); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.sc-head-text { min-width: 0; overflow: hidden; }
.sc-trainer-name {
  font-size: 12px; font-weight: 800; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sc-toggle-btn {
  border: 0; background: #fff; border-radius: 50%; width: 30px; height: 30px;
  cursor: pointer; color: ${BLUE}; font-size: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(15,23,42,0.12);
}
.sc-stats { display: flex; align-items: stretch; gap: 5px; flex-shrink: 0; }
.sc-stat {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 4px 7px; gap: 2px; text-align: center; min-height: 50px; min-width: 56px;
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.28); background: rgba(255,255,255,0.16);
}
.sc-stat__icon {
  width: 20px; height: 20px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; font-size: 10px;
}
.sc-stat__icon--blue { background: rgba(219,234,254,0.95); color: #1d4ed8; }
.sc-stat__icon--green { background: rgba(209,250,229,0.95); color: #059669; }
.sc-stat__icon--red { background: rgba(254,226,226,0.95); color: #dc2626; }
.sc-stat__icon--amber { background: rgba(254,243,199,0.95); color: #d97706; }
.sc-stat__val { font-size: 14px; font-weight: 900; color: #fff; line-height: 1; }
.sc-stat__lbl { font-size: 8px; color: rgba(255,255,255,0.86); font-weight: 700; white-space: nowrap; }
.sc-tabs { display: flex; gap: 0; padding: 0 12px; border-bottom: 1px solid #e2e8f0; background: #fafbfc; }
.sc-tab {
  display: inline-flex; align-items: center; gap: 5px; height: 36px; border: none; background: none;
  font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; padding: 0 2px; margin-right: 16px; position: relative;
}
.sc-tab--active { color: ${BLUE}; }
.sc-tab--active::after {
  content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
  height: 2px; border-radius: 2px 2px 0 0; background: ${BLUE};
}
.sc-body { padding: 12px 14px 10px; }
.sc-detail-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px 14px; margin-bottom: 10px; }
.sc-detail-item small {
  font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8;
  display: block; margin-bottom: 4px; letter-spacing: 0.03em;
}
.sc-detail-item strong {
  font-size: 11px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px; min-width: 0;
}
.sc-detail-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.sc-detail-icon {
  width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center; font-size: 10px;
}
.sc-detail-icon--blue { background: #dbeafe; color: #1d4ed8; }
.sc-detail-icon--pink { background: #fce7ef; color: ${PINK}; }
.sc-notes {
  border-top: 1px dashed #e2e8f0; display: flex; align-items: flex-start; gap: 8px;
  background: #fafbfc; margin: 0 -14px -10px; padding: 10px 14px 12px;
}
.sc-notes small { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 2px; }
.sc-notes p { font-size: 11px; color: #334155; line-height: 1.45; margin: 0; }
.sc-evidence-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.sc-evidence-card {
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px;
  display: flex; flex-direction: column; gap: 5px; background: #fafbfc;
}
.sc-evidence-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.sc-evidence-icon--amber { background: #fef3c7; color: #d97706; }
.sc-evidence-icon--green { background: #d1fae5; color: #059669; }
.sc-evidence-card strong { font-size: 11px; font-weight: 700; color: #1e293b; }
.sc-evidence-card small { font-size: 10px; font-weight: 600; }
.ev-uploaded { color: #059669; }
.ev-pending { color: #d97706; }
.sc-file-name { font-size: 11px; color: #64748b; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 22px; flex-wrap: wrap; border-top: 1px solid #f1f5f9; background: #fafbfc;
}
.sc-foot-right { display: flex; gap: 10px; flex-wrap: wrap; }
.sc-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 18px; border-radius: 12px; font-size: 12px; font-weight: 700;
  cursor: pointer; border: 1.5px solid #e2e8f0; background: #fff; color: #334155;
}
.sc-btn--outline { background: #fff; color: ${BLUE}; border-color: #bfdbfe; }
.sc-btn--primary { background: ${BLUE}; color: #fff; border-color: ${BLUE}; box-shadow: 0 4px 14px rgba(37,99,235,0.22); }

.tm-star-display {
  display: inline-flex; flex-direction: column; align-items: flex-start; gap: 2px;
  padding: 0; border: none; background: transparent; cursor: pointer; text-align: left;
}
.tm-star-display__stars { display: flex; align-items: center; gap: 1px; }
.tm-star-display__star { font-size: 13px; color: #cbd5e1; line-height: 1; }
.tm-star-display__star--filled { color: #fbbf24; }
.tm-star-display__meta { font-size: 10px; font-weight: 700; color: #64748b; }
.tm-feedback__rating-summary {
  margin: 0; font-size: 14px; font-weight: 800; color: #0f172a;
  display: flex; align-items: center; gap: 8px;
}
.tm-feedback__rating-summary i { color: #f59e0b; }

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
.session-modal--sm { width: min(520px, 100%); }
.session-modal--lg { width: min(760px, 100%); }
.session-modal__head, .session-modal__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid #e2e8f0;
}
.session-modal__foot { border-top: 1px solid #e2e8f0; border-bottom: 0; justify-content: flex-end; }
.session-modal__head h5 { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; }
.session-modal__head span { color: #64748b; font-size: 12px; font-weight: 800; }
.session-modal__close {
  width: 34px; height: 34px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 8px; color: #64748b; cursor: pointer;
}
.session-modal__body { padding: 18px; overflow-y: auto; }
.session-modal__context {
  margin-bottom: 16px; padding: 12px 14px; border: 1px solid #e2e8f0;
  border-radius: 10px; background: #f8fafc; font-size: 12px; font-weight: 700; color: #475569;
}
.session-form-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;
}
.session-form-field { display: flex; flex-direction: column; gap: 6px; }
.session-form-field span {
  font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em;
}
.session-form-field input {
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;
  font-size: 13px; font-weight: 600; color: #0f172a; background: #f8fafc;
}

@media (max-width: 992px) {
  .sc-detail-grid { grid-template-columns: repeat(3, 1fr); }
  .sc-evidence-grid { grid-template-columns: repeat(2, 1fr); }
  .session-form-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .sc-head { flex-wrap: wrap; }
  .sc-detail-grid { grid-template-columns: 1fr; }
  .sc-stats { flex-wrap: wrap; }
  .sc-evidence-grid { grid-template-columns: 1fr; }
  .session-form-grid { grid-template-columns: 1fr; }
  .sc-foot { flex-direction: column; align-items: stretch; }
  .sc-foot-right { width: 100%; }
  .sc-foot-right .sc-btn { flex: 1; justify-content: center; }
  .nec-attendance-overview__stats { grid-template-columns: repeat(2, 1fr); }
  .nec-attendance-overview__head { flex-direction: column; align-items: stretch; }
}
`;

const FEEDBACK_MODAL_CSS = `
.nec-feedback-modal {
  position: fixed; inset: 0; z-index: 9999;
  background-color: rgba(0, 0, 0, 0.5);
  overflow-y: auto;
}
.nec-feedback-session-title {
  font-size: 13px; font-weight: 700; color: #475569; margin: 0;
}
.nec-toast {
  position: fixed; bottom: 20px; right: 20px; z-index: 10000;
  background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.nec-toast .me-2 { margin-right: 8px; }

.nec-feedback-modal .modal-content {
  border-radius: 8px;
}
.nec-feedback-modal .modal-header {
  background-color: #7367f0;
  color: #fff;
}
.nec-feedback-modal .review-border .modal-header {
  background-color: #28a745;
}
.nec-feedback-modal .modal-title {
  font-weight: 600;
}
.nec-feedback-modal .close {
  color: #fff; opacity: 1; background: transparent; border: none; font-size: 1.5rem;
}
.nec-feedback-modal .btn-primary {
  background-color: #7367f0;
  border-color: #7367f0;
}
.nec-feedback-modal .btn-primary:hover {
  background-color: #5e50ee;
  border-color: #5e50ee;
}
.nec-feedback-modal .btn-primary:disabled {
  opacity: 0.6; cursor: not-allowed;
}

input.star { display: none; }
label.star {
  float: right;
  padding: 10px;
  font-size: 30px !important;
  color: #444;
  transition: all .2s;
  cursor: pointer;
  margin: 0;
}
label.star:before {
  content: '\\f006';
  font-family: FontAwesome;
}
input.star:hover ~ label.star:before {
  content: '\\f005';
  color: #ffd100;
  transition: all .25s;
}
input.star:checked ~ label.star:before {
  content: '\\f005';
  color: #ffd100;
  transition: all .25s;
}
input.star-5:hover ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}
input.star-5:checked ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}
label.star:hover {
  transform: rotate(-15deg) scale(1.3);
}
`;

export default NewEnrolledCourses;
