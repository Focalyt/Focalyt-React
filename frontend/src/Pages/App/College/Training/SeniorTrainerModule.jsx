import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-date-picker';
import Calendar from 'react-calendar';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const PINK = '#fa5579';
const BLUE = '#2563eb';
const AMBER = '#d97706';
const GREEN = '#059669';

const AC_SESSIONS_STORAGE_PREFIX = 'acCoordinatorSessions:'; // legacy
const SESSION_TYPE = { TOT: 'tot', STUDENT: 'student' };

const WORKFLOW_STATUS = {
  SCHEDULED: 'Scheduled',
  SENT_TO_SENIOR: 'Sent to Senior Trainer',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const STATUS_TONE = {
  [WORKFLOW_STATUS.SCHEDULED]: 'blue',
  [WORKFLOW_STATUS.SENT_TO_SENIOR]: 'amber',
  [WORKFLOW_STATUS.ASSIGNED]: 'purple',
  [WORKFLOW_STATUS.IN_PROGRESS]: 'teal',
  [WORKFLOW_STATUS.COMPLETED]: 'green',
};

const getOptionLabel = (options = [], value) =>
  options.find((option) => String(option.value) === String(value))?.label || '';

const mapApiOptions = (items = []) =>
  (items || [])
    .filter((item) => item && item._id && item.name)
    .map((item) => ({ value: String(item._id), label: item.name }));

const getLinkedCourseOptions = (centerId, courseOptions = [], allCentersMeta = [], allCoursesMeta = []) => {
  if (!centerId) return [];
  const centerMeta = allCentersMeta.find((item) => String(item._id) === String(centerId));
  const projectIds = new Set(
    (centerMeta?.projects || []).map((project) => String(project._id || project))
  );
  if (!projectIds.size) return courseOptions;
  const linked = courseOptions.filter((course) => {
    const meta = allCoursesMeta.find((item) => String(item._id) === String(course.value));
    const projectId = String(meta?.project?._id || meta?.project || '');
    return projectIds.has(projectId);
  });
  return linked.length ? linked : courseOptions;
};

const formatSessionDate = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-IN');
};

const authHeaders = (token) => ({ 'x-auth': token });

const fetchCoordinatorSessionsApi = async (backendUrl, token, options = {}) => {
  const {
    batchId = '',
    courseId = '',
    seniorTrainerId = '',
    includeCoursePlans = false,
  } = options;
  const params = new URLSearchParams();
  if (batchId) params.set('batch', batchId);
  if (courseId) params.set('course', courseId);
  if (seniorTrainerId) params.set('seniorTrainerId', seniorTrainerId);
  if (includeCoursePlans) params.set('includeCoursePlans', 'true');
  params.set('excludeScheduled', 'true');
  const res = await axios.get(`${backendUrl}/college/session-plans?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const patchCoordinatorSessionApi = async (backendUrl, token, sessionId, payload) => {
  const res = await axios.patch(`${backendUrl}/college/session-plans/${sessionId}`, payload, {
    headers: authHeaders(token),
  });
  if (!res.data?.status) throw new Error(res.data?.message || 'Failed to update session');
  return res.data.data;
};

const addTotQuestionApi = async (backendUrl, token, sessionId, payload) => {
  const res = await axios.post(
    `${backendUrl}/college/session-plans/${sessionId}/tot-questions`,
    payload,
    { headers: authHeaders(token) }
  );
  if (!res.data?.status) throw new Error(res.data?.message || 'Failed to add MCQ');
  return res.data.data;
};

const getTotSubmissionHistory = (session = {}) => {
  const list = [];
  const seen = new Set();
  const push = (item) => {
    if (!item) return;
    if (!item.submittedAt && !(item.answers || []).length) return;
    const key = item.submittedAt
      ? new Date(item.submittedAt).toISOString()
      : `${item.percentage}:${(item.answers || []).length}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push(item);
  };
  (session.totAssignmentSubmissions || []).forEach(push);
  push(session.totAssignmentSubmission);
  return list.sort((a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0));
};

const getSessionActivities = (session = {}) => {
  if (Array.isArray(session.sessionActivities) && session.sessionActivities.length) {
    return session.sessionActivities;
  }
  if (session.activityTypeId) {
    return [{
      id: session.activityTypeId,
      name: session.activityTypeName,
      color: session.activityColor || BLUE,
    }];
  }
  return [];
};

const buildActivityHeadStyle = (activities = []) => {
  if (!activities.length) return undefined;
  if (activities.length === 1) {
    const color = activities[0].color || BLUE;
    return { background: `linear-gradient(105deg, ${color} 0%, ${color}cc 55%, ${color}99 100%)` };
  }
  const stops = activities
    .map((activity, index) => {
      const percent = Math.round((index / (activities.length - 1)) * 100);
      return `${activity.color || BLUE} ${percent}%`;
    })
    .join(', ');
  return { background: `linear-gradient(105deg, ${stops})` };
};

const countMaterials = (items = []) => {
  const mandatory = (items || []).filter((item) => item.requirement !== 'non_mandatory').length;
  return { total: (items || []).length, mandatory, optional: (items || []).length - mandatory };
};

const DOC_BUCKET_URL = (process.env.REACT_APP_MIPIE_BUCKET_URL || '').replace(/\/$/, '');
const getDocFileUrl = (fileUrl) => resolveMediaUrl(DOC_BUCKET_URL, fileUrl);

const formatDocDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDocTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const getTotQuestionId = (question, index) => String(question?._id || question?.id || `tot-q-${index}`);
const getTotQuestionMarks = (question) => {
  const marks = Number(question?.marks);
  return Number.isFinite(marks) && marks > 0 ? marks : 1;
};
const TOT_PASS_PERCENT_DEFAULT = 40;
const TOT_MARKS_MAX = 100;
const toPositiveMarks = (value, emptyValue = 0) => {
  if (value === '' || value == null) return emptyValue;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : emptyValue;
};
const toPassPercentage = (value, emptyValue = TOT_PASS_PERCENT_DEFAULT) => {
  if (value === '' || value == null) return emptyValue;
  const n = Number(value);
  if (!Number.isFinite(n)) return emptyValue;
  return Math.min(100, Math.max(1, Math.round(n)));
};
const sumTotMarks = (questions = []) =>
  (questions || []).reduce((sum, question) => sum + toPositiveMarks(question?.marks, 0), 0);
const getTotPassPercentage = (session) => toPassPercentage(session?.totPassPercentage, TOT_PASS_PERCENT_DEFAULT);

const isUploadedMaterial = (item = {}) => (
  Boolean(item.fileUrl || item.fileName)
  || String(item.status || '').toLowerCase() === 'uploaded'
);

const collectTrainerSubmittedDocs = (session = {}) => {
  const groups = [
    { label: 'TOT completion proof', items: session.totCompletionProofs },
    { label: 'TOT training proof', items: session.totTrainingProofs },
    { label: 'Session document', items: session.evidenceDocs },
  ];
  return groups.flatMap(({ label, items }) => (
    (items || []).map((item, index) => ({
      id: String(item._id || item.id || `${label}-${index}`),
      name: item.name || item.fileName || 'Untitled document',
      type: item.type || 'Document',
      fileUrl: item.fileUrl || '',
      fileName: item.fileName || '',
      group: label,
      uploaded: isUploadedMaterial(item),
      status: item.status || (isUploadedMaterial(item) ? 'Pending' : 'Not Uploaded'),
      uploadedAt: item.uploadedAt || item.updatedAt || item.createdAt || item.uploadDate || null,
    }))
  ));
};

const getTrainerDocFileType = (fileUrl = '', docType = '') => {
  const url = String(fileUrl).split('?')[0].toLowerCase();
  const type = String(docType || '').toLowerCase();
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/.test(url) || type === 'image') return 'image';
  if (url.endsWith('.pdf') || type.includes('pdf')) return 'pdf';
  if (/\.(mp4|mov|avi|mkv|webm)$/.test(url) || type === 'video') return 'video';
  return 'file';
};

const normalizeDocReviewStatus = (status, uploaded) => {
  const value = String(status || '').toLowerCase();
  if (value === 'verified' || value === 'accepted' || value === 'approved') return 'Verified';
  if (value === 'rejected') return 'Rejected';
  if (uploaded || value === 'pending' || value === 'uploaded') return 'Pending';
  return 'Not Uploaded';
};

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

const getTrainerMcqReview = (session = {}) => {
  const questions = Array.isArray(session.totQuestionBank) ? session.totQuestionBank : [];
  const history = getTotSubmissionHistory(session);
  const submission = history[history.length - 1] || session.totAssignmentSubmission || null;
  const answersById = new Map(
    (submission?.answers || []).map((answer) => [String(answer.questionId), answer])
  );
  const reviewed = questions.map((question, index) => {
    const id = getTotQuestionId(question, index);
    const answer = answersById.get(id);
    const selectedIndex = answer?.selectedIndex;
    const hasAnswer = selectedIndex !== undefined && selectedIndex !== null && selectedIndex !== '';
    return {
      id,
      question: question.question || 'Untitled question',
      options: Array.isArray(question.options) ? question.options : [],
      correctIndex: Number(question.correctIndex) || 0,
      marks: getTotQuestionMarks(question),
      selectedIndex: hasAnswer ? Number(selectedIndex) : null,
      isCorrect: hasAnswer ? Number(selectedIndex) === Number(question.correctIndex) : false,
      attempted: answersById.has(id),
    };
  }).filter((item) => item.attempted);
  const totalMarks = Number(submission?.totalMarks) || reviewed.reduce((sum, item) => sum + item.marks, 0);
  const score = Number(submission?.score);
  const computedScore = reviewed.filter((item) => item.isCorrect).reduce((sum, item) => sum + item.marks, 0);
  const finalScore = Number.isFinite(score) ? score : computedScore;
  const percentage = Number(submission?.percentage);
  const passPercent = getTotPassPercentage(session);
  const computedPercentage = Number.isFinite(percentage)
    ? percentage
    : (totalMarks > 0 ? Math.round((finalScore / totalMarks) * 10000) / 100 : 0);
  return {
    questions: reviewed,
    submitted: Boolean(submission?.submittedAt) || (submission?.answers || []).length > 0,
    score: finalScore,
    totalMarks,
    percentage: computedPercentage,
    passPercent,
    pass: submission?.pass ?? (computedPercentage >= passPercent),
    trainerName: submission?.trainerName || session.fieldTrainerName || session.totTrainerName || '',
    submittedAt: submission?.submittedAt || null,
  };
};

const loadCoordinatorSessions = (batchId) => {
  if (!batchId) return [];
  try {
    const raw = localStorage.getItem(`${AC_SESSIONS_STORAGE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const filterSessionsForSeniorTrainer = (sessions = [], userId = '') => {
  // Show every plan that AC has referred (not still in Scheduled).
  // Optional assignee check is only used when caller wants strict ownership.
  return sessions.filter((session) => session.workflowStatus !== WORKFLOW_STATUS.SCHEDULED);
};

const applyPathFilters = (sessions = [], filters = {}) => {
  let list = sessions;
  if (filters.center) {
    list = list.filter((session) => String(session.center || '') === String(filters.center));
  }
  if (filters.course) {
    list = list.filter((session) => String(session.course || '') === String(filters.course));
  }
  if (filters.batch) {
    if (String(filters.batch).startsWith('course:')) {
      const courseId = String(filters.batch).replace(/^course:/, '');
      list = list.filter((session) => (
        String(session.course || '') === courseId
        && (!session.batch || session.batch === 'null')
      ));
    } else {
      list = list.filter((session) => (
        String(session.batch || '') === String(filters.batch)
        || (
          (!session.batch || session.batch === 'null')
          && filters.course
          && String(session.course || '') === String(filters.course)
        )
      ));
    }
  }
  return list;
};

const persistCoordinatorSessions = () => {
  // no-op: sessions persist via /college/session-plans API
};

const parseSessionDateKey = (session) => {
  if (session?.sessionDate) {
    const raw = String(session.sessionDate);
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  }
  if (session?.date) {
    const parsed = new Date(session.date);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return '';
};

const isTotSession = (session) => (
  session?.includeTot === true || session?.sessionType === SESSION_TYPE.TOT
);

const appearsOnStudentCalendar = (session) => session?.sessionType !== SESSION_TYPE.TOT;

const getTotDisplayTitle = (session = {}) => (
  session.totTitle?.trim() || `TOT – ${session.title || 'Session'}`
);

const getTotDisplayTopic = (session = {}) => (
  session.totUseSameTopics !== false
    ? (session.topicCovered || '')
    : (session.totTopicCovered || session.topicCovered || '')
);

const mapSessionForTotCalendar = (session = {}) => ({
  ...session,
  id: `${session.id}-tot`,
  sourceSessionId: session.id,
  title: getTotDisplayTitle(session),
  topicCovered: getTotDisplayTopic(session),
  trainingMethod: session.totUseSameTopics !== false
    ? (session.trainingMethod || '')
    : (session.totTrainingMethod || session.trainingMethod || ''),
});

const resolveSessionSelectionId = (sessionId) => (
  String(sessionId).endsWith('-tot') ? String(sessionId).replace(/-tot$/, '') : sessionId
);

const getSessionChipColor = (session) => {
  const activities = getSessionActivities(session);
  if (activities.length) return activities[0].color || BLUE;
  return session?.sessionType === SESSION_TYPE.TOT ? BLUE : GREEN;
};

const getSessionDateValue = (session) => {
  const key = parseSessionDateKey(session);
  if (!key) return null;
  const date = new Date(`${key}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSessionTypeLabel = (session) => {
  if (session.sessionType === SESSION_TYPE.TOT && session.includeTot !== true) return 'TOT';
  if (session.includeTot === true) return 'Student + TOT';
  return 'Student';
};

const getSessionTypeBadgeKind = (session) => {
  if (session.sessionType === SESSION_TYPE.TOT && session.includeTot !== true) return 'tot';
  if (session.includeTot === true) return 'linked';
  return 'student';
};

const TRAINER_SESSIONS_STORAGE_PREFIX = 'trainerModuleSessions:';

const formatDoneAt = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const mergeTrainerDoneDetails = (session = {}) => {
  const sid = String(session.id || session._id || '');
  let overlay = {};
  if (sid) {
    try {
      const doneRaw = localStorage.getItem(`trainerSessionDone:${sid}`);
      if (doneRaw) overlay = JSON.parse(doneRaw) || {};
    } catch {
      overlay = {};
    }
  }
  const batchId = session.batch || session.batchId;
  if (batchId) {
    try {
      const raw = localStorage.getItem(`${TRAINER_SESSIONS_STORAGE_PREFIX}${batchId}`);
      if (raw) {
        const list = JSON.parse(raw);
        const match = Array.isArray(list)
          ? list.find((item) => String(item.id || item._id) === sid)
          : null;
        if (match) {
          overlay = {
            status: match.status || overlay.status,
            completionRemark: match.completionRemark || overlay.completionRemark,
            completedAt: match.completedAt || overlay.completedAt,
            completedByName: match.completedByName || overlay.completedByName,
          };
        }
      }
    } catch {
      /* ignore */
    }
  }
  return {
    ...session,
    status: overlay.status || session.status,
    completionRemark: overlay.completionRemark || session.completionRemark,
    completedAt: overlay.completedAt || session.completedAt,
    completedByName: overlay.completedByName || session.completedByName,
  };
};

const DUMMY_SESSION_DONE = {
  isDone: true,
  remark: 'Session completed. Attendance marked, topic covered, and students practiced the assigned activity.',
  markedAt: formatDoneAt(new Date().toISOString()),
  markedBy: 'Rahul Sharma',
};

const DUMMY_SESSION_ATTENDANCE = {
  marked: true,
  total: 30,
  present: 22,
  absent: 8,
  percentage: '73.3%',
};

const getSessionAttendanceView = (session = {}) => {
  const total = Number(session.studentCount ?? session.totalCandidates ?? 0);
  const present = Number(session.presentCandidates ?? 0);
  const absent = Number(session.absentCandidates ?? 0);
  const percentRaw = session.attendance || (session.attendancePercent != null ? `${session.attendancePercent}%` : '');
  const hasReal = total > 0 || present > 0 || absent > 0 || Boolean(percentRaw && percentRaw !== '0%');
  if (!hasReal) return { ...DUMMY_SESSION_ATTENDANCE };
  const safeTotal = total || present + absent || DUMMY_SESSION_ATTENDANCE.total;
  const pct = percentRaw && percentRaw !== '0%'
    ? percentRaw
    : `${((present / safeTotal) * 100).toFixed(1)}%`;
  return {
    marked: true,
    total: safeTotal,
    present: present || DUMMY_SESSION_ATTENDANCE.present,
    absent: absent || Math.max(0, safeTotal - present) || DUMMY_SESSION_ATTENDANCE.absent,
    percentage: pct,
    remark: session.attendanceRemark || DUMMY_SESSION_ATTENDANCE.remark,
  };
};

const getSessionDoneDetails = (session = {}) => {
  const merged = mergeTrainerDoneDetails(session);
  const remark = String(merged.completionRemark || merged.doneRemark || '').trim();
  const status = String(merged.status || merged.workflowStatus || '').toLowerCase();
  const isDone = Boolean(remark) || status === 'completed';
  if (!isDone) {
    return {
      ...DUMMY_SESSION_DONE,
      markedBy: merged.fieldTrainerName || merged.trainerName || DUMMY_SESSION_DONE.markedBy,
    };
  }
  return {
    isDone: true,
    remark: remark || DUMMY_SESSION_DONE.remark,
    markedAt: formatDoneAt(merged.completedAt || merged.doneAt) || DUMMY_SESSION_DONE.markedAt,
    markedBy: merged.completedByName || merged.fieldTrainerName || merged.trainerName || DUMMY_SESSION_DONE.markedBy,
  };
};

const getSessionActivityLabel = (session) => {
  const activities = getSessionActivities(session);
  if (activities.length) return activities.map((activity) => activity.name).join(', ');
  if (isTotSession(session) && session.totUseSameTopics === false && session.totTopicCovered) {
    return session.totTopicCovered;
  }
  return getSessionTypeLabel(session);
};

const sortSessionsByDate = (list = []) => [...list].sort((a, b) => {
  const dateA = getSessionDateValue(a)?.getTime() || 0;
  const dateB = getSessionDateValue(b)?.getTime() || 0;
  if (dateA !== dateB) return dateA - dateB;
  return (a.startTime || '').localeCompare(b.startTime || '');
});

const TOTAL_SESSION_SLOTS = 30;

/** Builds enough fixed slots to hold every session, in pages of `pageSize`.
 *  Page 1 = sessions 1-30, page 2 = 31-60, etc. Nothing gets silently dropped. */
const buildPagedSessionSlots = (sessions = [], pageSize = TOTAL_SESSION_SLOTS) => {
  const byNumber = {};
  const unnumbered = [];
  let maxNumber = 0;

  sessions.forEach((session) => {
    const num = parseInt(String(session.sessionNumber ?? ''), 10);
    if (Number.isFinite(num) && num >= 1) {
      if (!byNumber[num]) {
        byNumber[num] = session;
        if (num > maxNumber) maxNumber = num;
      } else {
        unnumbered.push(session);
      }
      return;
    }
    unnumbered.push(session);
  });

  const totalPages = Math.max(1, Math.ceil(Math.max(maxNumber, sessions.length, 1) / pageSize));
  const total = totalPages * pageSize;

  let freeSlot = 1;
  unnumbered.forEach((session) => {
    while (freeSlot <= total && byNumber[freeSlot]) freeSlot += 1;
    if (freeSlot > total) return;
    byNumber[freeSlot] = session;
    freeSlot += 1;
  });

  const slots = Array.from({ length: total }, (_, index) => {
    const sessionNumber = index + 1;
    return {
      key: `slot-${sessionNumber}`,
      sessionNumber: String(sessionNumber),
      session: byNumber[sessionNumber] || null,
    };
  });

  return { slots, totalPages, pageSize };
};

const SESSION_PALETTE = [
  '#2563eb', '#059669', '#d97706', '#db2777', '#7c3aed',
  '#0891b2', '#ea580c', '#4f46e5', '#16a34a', '#e11d48',
  '#0d9488', '#c026d3', '#ca8a04', '#1d4ed8', '#be123c',
];

const toLocalDateKey = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.slice(0, 10);
  }
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSessionAssignDateKey = (session = {}, assignmentDrafts = {}) => {
  const sourceId = resolveSessionSelectionId(session.id);
  const draft = assignmentDrafts[sourceId] || assignmentDrafts[session.id];
  return draft?.assignDate || parseSessionDateKey(session) || '';
};

const getTimetableSessionColor = (session, index = 0) => {
  const activities = getSessionActivities(session);
  if (activities[0]?.color) return activities[0].color;
  const seed = String(session.id || session.title || index);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return SESSION_PALETTE[Math.abs(hash) % SESSION_PALETTE.length];
};

const TrainingCalendar = ({
  title,
  icon,
  accent = GREEN,
  sessions,
  selectedSessionId,
  onSelectSession,
}) => {
  const { slots, totalPages, pageSize } = useMemo(
    () => buildPagedSessionSlots(sessions),
    [sessions]
  );
  const [page, setPage] = useState(0);

  // Keep the current page in range if the session count (and so totalPages) shrinks.
  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const pageStart = page * pageSize;
  const pageCells = slots.slice(pageStart, pageStart + pageSize);
  const rangeLabel = `${pageStart + 1}–${pageStart + pageCells.length}`;

  return (
    <div className="st-calendar" style={{ '--calendar-accent': accent }}>
      <div className="st-calendar__title-bar">
        <div className="st-calendar__title">
          <i className={`fas ${icon}`} />
          <span>{title}</span>
        </div>
        <span className="st-calendar__count">{sessions.length} / {slots.length} plan(s)</span>
      </div>
      <div className="st-calendar__head">
        <h3>Session plans</h3>
        <div className="st-calendar__head-right">
          <span className="st-calendar__head-hint">Session {rangeLabel} · dates assigned later</span>
          {totalPages > 1 && (
            <div className="st-calendar__pager" role="group" aria-label={`${title} pages`}>
              <button
                type="button"
                className="st-calendar__pager-btn"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Previous 30 sessions"
              >
                <i className="fas fa-chevron-left" />
              </button>
              <span className="st-calendar__pager-count">{page + 1} / {totalPages}</span>
              <button
                type="button"
                className="st-calendar__pager-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label="Next 30 sessions"
              >
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="st-calendar__weekdays" aria-hidden="true">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="st-calendar__grid">
        {pageCells.map((cell) => {
          const { session, sessionNumber } = cell;
          if (!session) {
            return (
              <div
                key={cell.key}
                className="st-calendar__day st-calendar__day--slot"
              >
                <span className="st-calendar__day-num">{sessionNumber}</span>
                <span className="st-calendar__session-title st-calendar__session-title--muted">Not planned</span>
              </div>
            );
          }

          const color = getSessionChipColor(session);
          const isSelected = resolveSessionSelectionId(selectedSessionId) === resolveSessionSelectionId(session.id);

          return (
            <button
              key={cell.key}
              type="button"
              className={`st-calendar__day st-calendar__day--session${isSelected ? ' st-calendar__day--selected' : ''}`}
              style={{ '--event-color': color }}

              onClick={() => onSelectSession(session.id)}
              title={`Session ${sessionNumber}: ${session.title || 'Untitled'}`}
            >
              <span className="st-calendar__day-num">{sessionNumber}</span>
              <span className="st-calendar__session-title">{session.title || 'Untitled session'}</span>
              {session.topicCovered ? (
                <span className="st-calendar__session-topic">{session.topicCovered}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Month timetable: see how many sessions fall on each day, each in a distinct color */
const SessionDayTimetable = ({
  sessions = [],
  assignmentDrafts = {},
  selectedSessionId,
  onSelectSession,
}) => {
  const [activeMonth, setActiveMonth] = useState(() => new Date());
  const [focusedDateKey, setFocusedDateKey] = useState('');

  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((session, index) => {
      const dateKey = getSessionAssignDateKey(session, assignmentDrafts);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({
        ...session,
        _timetableColor: getTimetableSessionColor(session, index),
      });
    });
    Object.keys(map).forEach((key) => {
      map[key] = sortSessionsByDate(map[key]);
    });
    return map;
  }, [sessions, assignmentDrafts]);

  const datedCount = useMemo(
    () => Object.values(sessionsByDate).reduce((sum, list) => sum + list.length, 0),
    [sessionsByDate]
  );

  const focusedSessions = focusedDateKey ? (sessionsByDate[focusedDateKey] || []) : [];

  const tileContent = useCallback(({ date, view }) => {
    if (view !== 'month') return null;
    const dateKey = toLocalDateKey(date);
    const daySessions = sessionsByDate[dateKey] || [];
    if (!daySessions.length) return null;

    return (
      <div className="st-day-tt__events">
        <span className="st-day-tt__badge">{daySessions.length} session{daySessions.length > 1 ? 's' : ''}</span>
        {daySessions.slice(0, 4).map((session) => {
          const isSelected = resolveSessionSelectionId(selectedSessionId) === resolveSessionSelectionId(session.id);
          return (
            <button
              key={session.id}
              type="button"
              className={`st-day-tt__chip${isSelected ? ' st-day-tt__chip--selected' : ''}`}
              style={{ '--event-color': session._timetableColor }}
              title={`${session.title || 'Session'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectSession(session.id);
              }}
            >
              <span className="st-day-tt__chip-dot" style={{ background: session._timetableColor }} />
              
              <span className="st-day-tt__chip-title">{session.title || 'Untitled'}</span>
            </button>
          );
        })}
        {daySessions.length > 4 ? (
          <span className="st-day-tt__more">+{daySessions.length - 4} more</span>
        ) : null}
      </div>
    );
  }, [sessionsByDate, selectedSessionId, onSelectSession]);

  const tileClassName = useCallback(({ date, view }) => {
    if (view !== 'month') return null;
    const dateKey = toLocalDateKey(date);
    const daySessions = sessionsByDate[dateKey] || [];
    const classes = [];
    if (daySessions.length) classes.push('st-day-tt__tile--busy');
    if (focusedDateKey && dateKey === focusedDateKey) classes.push('st-day-tt__tile--focused');
    if (daySessions.some((s) => resolveSessionSelectionId(s.id) === resolveSessionSelectionId(selectedSessionId))) {
      classes.push('st-day-tt__tile--selected');
    }
    return classes.length ? classes.join(' ') : null;
  }, [sessionsByDate, focusedDateKey, selectedSessionId]);

  return (
    <section className="st-day-tt">
      <div className="st-day-tt__title-bar">
        <div className="st-day-tt__title">
          <i className="fas fa-calendar-week" />
          <span>Session Timetable</span>
        </div>
        <span className="st-day-tt__count">
          {datedCount} dated · {sessions.length} total plan(s)
        </span>
      </div>
      

      <div className="st-day-tt__layout">
        <div className="st-day-tt__calendar">
          <Calendar
            activeStartDate={activeMonth}
            onActiveStartDateChange={({ activeStartDate }) => {
              if (activeStartDate) setActiveMonth(activeStartDate);
            }}
            onClickDay={(value) => {
              const dateKey = toLocalDateKey(value);
              setFocusedDateKey(dateKey);
              const daySessions = sessionsByDate[dateKey] || [];
              if (daySessions.length === 1) onSelectSession(daySessions[0].id);
            }}
            tileContent={tileContent}
            tileClassName={tileClassName}
            prev2Label={null}
            next2Label={null}
            showNeighboringMonth={false}
          />
        </div>

        <aside className="st-day-tt__side">
          <div className="st-day-tt__side-head">
            
            <span>
              {focusedDateKey
                ? `${focusedSessions.length} session${focusedSessions.length === 1 ? '' : 's'}`
                : 'Click a date'}
            </span>
          </div>

          {!focusedDateKey ? (
            <p className="st-day-tt__side-empty">Select a date on the calendar to see that day’s sessions.</p>
          ) : focusedSessions.length === 0 ? (
            <p className="st-day-tt__side-empty">No sessions on this day.</p>
          ) : (
            <ul className="st-day-tt__side-list">
              {focusedSessions.map((session) => {
                const isSelected = resolveSessionSelectionId(selectedSessionId) === resolveSessionSelectionId(session.id);
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      className={`st-day-tt__side-item${isSelected ? ' st-day-tt__side-item--selected' : ''}`}
                      style={{ '--event-color': session._timetableColor }}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <span className="st-day-tt__side-swatch" style={{ background: session._timetableColor }} />
                      <span className="st-day-tt__side-meta">
                        <strong>{session.title || 'Untitled session'}</strong>
                        <small>{getSessionTypeLabel(session)}{session.sessionNumber ? ` · #${session.sessionNumber}` : ''}</small>
                        {(() => {
                          const done = getSessionDoneDetails(session);
                          const attendance = getSessionAttendanceView(session);
                          return (
                            <>
                              {attendance.marked && (
                                <>
                                  <em className="st-day-tt__att-flag">
                                    <i className="fas fa-user-check" /> Attendance {attendance.percentage}
                                  </em>
                                  <span className="st-day-tt__att-counts">
                                    P {attendance.present} · A {attendance.absent} · Total {attendance.total}
                                  </span>
                                 
                                </>
                              )}
                              {done.isDone && (
                                <>
                                  <em className="st-day-tt__done-flag">
                                    <i className="fas fa-check-circle" /> Session done
                                  </em>
                                  {done.remark ? (
                                    <span className="st-day-tt__done-remark" title={done.remark}>
                                      Remark: {done.remark}
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </>
                          );
                        })()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {datedCount === 0 ? (
            <p className="st-day-tt__side-empty st-day-tt__side-empty--warn">
              No assign dates yet. Use the session list below to set dates.
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
};

const getDayNameFromDate = (dateValue) => {
  if (!dateValue) return '—';
  const date = typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T12:00:00`)
    : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { weekday: 'long' });
};

const SessionTable = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  filters,
  centerOptions,
  courseOptions,
  batchOptions,
  loadingCenters,
  loadingCourses,
  loadingBatches,
  onFilterChange,
  onFilterReset,
  assignmentDrafts = {},
  trainerOptions = [],
  loadingTrainers = false,
  onEditSession,
}) => (
  <section className="st-sessions-table-wrap">
    <div className="st-sessions-table__head">
      <h3><i className="fas fa-table" /> Session List</h3>
      <span>{sessions.length} session(s)</span>
    </div>

    <div className="st-sessions-table__filters">
      <div className="st-filters__grid">
        <label className="st-filter-field">
          <span>Center</span>
          <select
            className="st-filter-select"
            value={filters.center}
            disabled={loadingCenters}
            onChange={(e) => onFilterChange('center', e.target.value)}
          >
            <option value="">{loadingCenters ? 'Loading centers...' : 'Select center'}</option>
            {centerOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="st-filter-field">
          <span>Course</span>
          <select
            className="st-filter-select"
            value={filters.course}
            disabled={!filters.center || loadingCourses}
            onChange={(e) => onFilterChange('course', e.target.value)}
          >
            <option value="">
              {!filters.center
                ? 'Select center first'
                : loadingCourses
                  ? 'Loading courses...'
                  : 'Select course'}
            </option>
            {courseOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="st-filter-field">
          <span>Batch</span>
          <select
            className="st-filter-select"
            value={filters.batch}
            disabled={!filters.center || !filters.course || loadingBatches}
            onChange={(e) => onFilterChange('batch', e.target.value)}
          >
            <option value="">
              {!filters.center || !filters.course
                ? 'Select center & course first'
                : loadingBatches
                  ? 'Loading batches...'
                  : 'Select batch'}
            </option>
            {batchOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      {(filters.center || filters.course || filters.batch) && (
        <button type="button" className="st-btn st-btn--ghost st-sessions-table__clear" onClick={onFilterReset}>
          <i className="fas fa-times" /> Clear filters
        </button>
      )}
    </div>

    {sessions.length === 0 ? (
      <p className="st-sessions-table__empty">
        No referred sessions found. Ask Academic Coordinator to refer a plan to this Senior Trainer account.
        Path filters above are optional and only narrow the list.
      </p>
    ) : (
      <div className="st-sessions-table-scroll">
        <table className="st-sessions-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Session</th>
              <th>Type</th>
              <th>Assign Date</th>
              <th>Day</th>
              <th>Trainer Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => {
              const isSelected = resolveSessionSelectionId(selectedSessionId) === resolveSessionSelectionId(session.id);
              const typeBadge = getSessionTypeBadgeKind(session);
              const draft = assignmentDrafts[session.id] || { assignDate: '', trainerId: '' };
              const assignDate = draft.assignDate || parseSessionDateKey(session);

              return (
                <tr
                  key={session.id}
                  className={`st-sessions-table__row${isSelected ? ' st-sessions-table__row--selected' : ''}`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <td>{index + 1}</td>
                  <td>
                    <strong>{session.title || 'Untitled session'}</strong>
                  </td>
                  <td>
                    <span className={`st-table-type st-table-type--${typeBadge}`}>
                      {getSessionTypeLabel(session)}
                    </span>
                    <small>{getSessionActivityLabel(session)}</small>
                  </td>
                  <td>{assignDate ? new Date(`${assignDate}T12:00:00`).toLocaleDateString('en-IN') : '—'}</td>
                  <td>{getDayNameFromDate(assignDate)}</td>
                  <td>
                    {getOptionLabel(trainerOptions, draft.trainerId) || session.fieldTrainerName || '—'}
                  </td>
                  <td className="st-table-cell--control" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="st-btn st-btn--edit"
                      onClick={() => onEditSession?.(session.id)}
                    >
                      <i className="fas fa-user-edit" /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const SessionAssignModal = ({
  session,
  centerOptions = [],
  courseOptions = [],
  allCentersMeta = [],
  allCoursesMeta = [],
  trainerOptions = [],
  loadingTrainers = false,
  backendUrl,
  token,
  onClose,
  onSave,
}) => {
  const [center, setCenter] = useState(session?.center ? String(session.center) : '');
  const [course, setCourse] = useState(session?.course ? String(session.course) : '');
  const [batch, setBatch] = useState(
    session?.batch && session.batch !== 'null' ? String(session.batch) : ''
  );
  const [assignDate, setAssignDate] = useState(parseSessionDateKey(session) || '');
  const [trainerId, setTrainerId] = useState(session?.fieldTrainerId ? String(session.fieldTrainerId) : '');
  const [batchOptions, setBatchOptions] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [saving, setSaving] = useState(false);

  const linkedCourseOptions = useMemo(
    () => getLinkedCourseOptions(center, courseOptions, allCentersMeta, allCoursesMeta),
    [center, courseOptions, allCentersMeta, allCoursesMeta]
  );

  useEffect(() => {
    if (!token || !center || !course) {
      setBatchOptions([]);
      return undefined;
    }
    let cancelled = false;
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const params = new URLSearchParams();
        params.set('centerId', center);
        params.set('courseId', course);
        const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        if (res.data?.success) {
          setBatchOptions((res.data.data || []).map((batchItem) => ({
            value: String(batchItem._id),
            label: batchItem.name,
          })));
        } else {
          setBatchOptions([]);
        }
      } catch {
        if (!cancelled) setBatchOptions([]);
      } finally {
        if (!cancelled) setLoadingBatches(false);
      }
    };
    fetchBatches();
    return () => { cancelled = true; };
  }, [center, course, token, backendUrl]);

  if (!session) return null;

  const handleCenterChange = (value) => {
    setCenter(value);
    setCourse('');
    setBatch('');
  };

  const handleCourseChange = (value) => {
    setCourse(value);
    setBatch('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(session.id, { center, course, batch, assignDate, trainerId });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className="st-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="st-modal__header">
          <h3><i className="fas fa-user-edit" /> Assign Session</h3>
          <button type="button" className="st-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="st-modal__body">
          <p className="st-modal__session-title">{session.title || 'Untitled session'}</p>

          <label className="st-modal-field">
            <span>Center</span>
            <select
              className="st-filter-select"
              value={center}
              onChange={(e) => handleCenterChange(e.target.value)}
            >
              <option value="">Select center</option>
              {centerOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="st-modal-field">
            <span>Course</span>
            <select
              className="st-filter-select"
              value={course}
              disabled={!center}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">{!center ? 'Select center first' : 'Select course'}</option>
              {linkedCourseOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="st-modal-field">
            <span>Batch</span>
            <select
              className="st-filter-select"
              value={batch}
              disabled={!center || !course || loadingBatches}
              onChange={(e) => setBatch(e.target.value)}
            >
              <option value="">
                {!center || !course
                  ? 'Select center & course first'
                  : loadingBatches
                    ? 'Loading batches...'
                    : 'Select batch'}
              </option>
              {batchOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="st-modal-field">
            <span>Assign Date</span>
            <input
              type="date"
              className="st-table-input"
              value={assignDate}
              onChange={(e) => setAssignDate(e.target.value)}
            />
          </label>

          <label className="st-modal-field">
            <span>Trainer Name</span>
            <select
              className="st-filter-select"
              value={trainerId}
              disabled={loadingTrainers}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">{loadingTrainers ? 'Loading...' : 'Select trainer'}</option>
              {trainerOptions.map((trainer) => (
                <option key={trainer.value} value={trainer.value}>{trainer.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="st-modal__footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="st-btn st-btn--primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

const createSeniorMcqDraft = () => ({
  id: `st-mcq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  marks: 1,
});

const SeniorAddMcqForm = ({ session, token, backendUrl, onAdded }) => {
  const existingCount = Array.isArray(session?.totQuestionBank) ? session.totQuestionBank.length : 0;
  const [drafts, setDrafts] = useState([createSeniorMcqDraft()]);
  const [passPercentage, setPassPercentage] = useState(TOT_PASS_PERCENT_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDrafts([createSeniorMcqDraft()]);
    setPassPercentage(TOT_PASS_PERCENT_DEFAULT);
    setError('');
  }, [session?.id, existingCount]);

  const totMarksTotal = sumTotMarks(drafts);
  const totPassPercentValue = toPassPercentage(passPercentage, 0);
  const totPassMarks = totMarksTotal > 0 && totPassPercentValue > 0
    ? Math.ceil((totMarksTotal * totPassPercentValue) / 100)
    : 0;

  const bumpPassPercentage = (delta) => {
    setPassPercentage((prev) => Math.min(100, Math.max(1, toPassPercentage(prev) + delta)));
  };

  const handlePassPercentageChange = (raw) => {
    if (raw === '') {
      setPassPercentage('');
      return;
    }
    setPassPercentage(toPassPercentage(raw));
  };

  const updateDraft = (index, field, value) => {
    setDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const updateDraftOption = (questionIndex, optionIndex, value) => {
    setDrafts((prev) => prev.map((item, i) => {
      if (i !== questionIndex) return item;
      const options = [...item.options];
      options[optionIndex] = value;
      return { ...item, options };
    }));
  };

  const handleMarksChange = (index, raw) => {
    if (raw === '') {
      updateDraft(index, 'marks', '');
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    updateDraft(index, 'marks', Math.min(TOT_MARKS_MAX, Math.max(1, Math.round(n))));
  };

  const bumpMarks = (index, delta) => {
    setDrafts((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const next = Math.min(TOT_MARKS_MAX, Math.max(1, toPositiveMarks(item.marks, 1) + delta));
      return { ...item, marks: next };
    }));
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, createSeniorMcqDraft()]);
    setError('');
  };

  const removeDraft = (index) => {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSave = async () => {
    if (saving) return;
    const additions = drafts
      .map((item) => ({
        question: String(item.question || '').trim(),
        options: Array.isArray(item.options) ? item.options : ['', '', '', ''],
        correctIndex: Number(item.correctIndex) || 0,
        marks: toPositiveMarks(item.marks, 1),
      }))
      .filter((item) => item.question && item.options.some((option) => option.trim()));

    if (!additions.length) {
      setError('Add a question with at least one option');
      return;
    }
    if (!token || !backendUrl || !session?.id) {
      setError('Unable to save these questions');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = await addTotQuestionApi(backendUrl, token, session.id, {
        questions: additions,
        totPassPercentage: toPassPercentage(passPercentage),
      });
      if (typeof onAdded === 'function') onAdded(saved);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add MCQ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="st-add-mcq">
      <div className="st-add-mcq__head">
        <div>
          <strong>New MCQ</strong>
          <span>These questions are separate from the trainer’s previous attempt. Set marks and pass % for this new set only.</span>
        </div>
      </div>

      <div className="st-add-mcq__meta">
        <div className="st-add-mcq__stepper-wrap">
          <span>Pass %</span>
          <div className="st-add-mcq__stepper">
            <button type="button" onClick={() => bumpPassPercentage(-1)}>−</button>
            <input
              type="number"
              min={1}
              max={100}
              value={passPercentage === '' ? '' : toPassPercentage(passPercentage)}
              onChange={(e) => handlePassPercentageChange(e.target.value)}
            />
            <button type="button" onClick={() => bumpPassPercentage(1)}>+</button>
          </div>
        </div>
        <span className="st-add-mcq__chip">{drafts.length} question{drafts.length === 1 ? '' : 's'}</span>
        <span className="st-add-mcq__chip st-add-mcq__chip--mint">Total {totMarksTotal} mark{totMarksTotal === 1 ? '' : 's'}</span>
        {totMarksTotal > 0 && totPassPercentValue > 0 && (
          <span className="st-add-mcq__chip st-add-mcq__chip--amber">Pass {totPassMarks}+ ({totPassPercentValue}%)</span>
        )}
      </div>

      <div className="st-add-mcq__list">
        {drafts.map((question, questionIndex) => (
          <div key={question.id} className="st-add-mcq__card">
            <div className="st-add-mcq__card-head">
              <strong>Q{questionIndex + 1}</strong>
              <div className="st-add-mcq__card-tools">
                <div className="st-add-mcq__stepper-wrap">
                  <span>Marks</span>
                  <div className="st-add-mcq__stepper">
                    <button type="button" onClick={() => bumpMarks(questionIndex, -1)}>−</button>
                    <input
                      type="number"
                      min={1}
                      max={TOT_MARKS_MAX}
                      value={question.marks === '' ? '' : toPositiveMarks(question.marks, 1)}
                      onChange={(e) => handleMarksChange(questionIndex, e.target.value)}
                    />
                    <button type="button" onClick={() => bumpMarks(questionIndex, 1)}>+</button>
                  </div>
                </div>
                {drafts.length > 1 && (
                  <button type="button" className="st-add-mcq__remove" onClick={() => removeDraft(questionIndex)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              className="st-add-mcq__input"
              value={question.question}
              onChange={(e) => updateDraft(questionIndex, 'question', e.target.value)}
              placeholder="Type the question"
            />
            {(question.options || ['', '', '', '']).map((option, optionIndex) => (
              <label key={`${question.id}-opt-${optionIndex}`} className="st-add-mcq__option">
                <input
                  type="radio"
                  name={`st-mcq-correct-${question.id}`}
                  checked={Number(question.correctIndex) === optionIndex}
                  onChange={() => updateDraft(questionIndex, 'correctIndex', optionIndex)}
                />
                <input
                  className="st-add-mcq__input"
                  value={option}
                  onChange={(e) => updateDraftOption(questionIndex, optionIndex, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                />
              </label>
            ))}
          </div>
        ))}
      </div>

      <button type="button" className="st-add-mcq__add" onClick={addDraft}>
        + Add MCQ question
      </button>

      {error && <div className="st-add-mcq__error">{error}</div>}
      <div className="st-add-mcq__actions">
        <button type="button" className="sc-btn sc-btn--primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save new MCQ'}
        </button>
      </div>
    </div>
  );
};

const createTlmItem = (overrides = {}) => ({
  id: `tlm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: 'Standard TLM',
  type: 'PDF',
  fileName: '',
  fileUrl: '',
  uploadedAt: '',
  ...overrides,
});

const SeniorTlmPanel = ({ session }) => {
  const [items, setItems] = useState(() => {
    const existing = Array.isArray(session?.standardTlm) ? session.standardTlm : [];
    if (existing.length) {
      return existing.map((item, index) => ({
        id: String(item.id || item._id || `tlm-${index}`),
        name: item.name || 'Standard TLM',
        type: item.type || 'PDF',
        fileName: item.fileName || '',
        fileUrl: item.fileUrl || '',
        uploadedAt: item.uploadedAt || '',
      }));
    }
    return [createTlmItem({ name: 'pdf' })];
  });

  const typeFromFile = (file) => {
    const name = file?.name?.toLowerCase() || '';
    const mime = file?.type || '';
    if (mime.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(name)) return 'Image';
    if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(name)) return 'Video';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'PDF';
    return 'Document';
  };

  const uploadToItem = (id, file) => {
    if (!file) return;
    setItems((prev) => prev.map((item) => (
      item.id === id
        ? {
          ...item,
          name: file.name.replace(/\.[^/.]+$/, '') || item.name || 'Standard TLM',
          type: typeFromFile(file),
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
        }
        : item
    )));
  };

  const addSlot = () => {
    setItems((prev) => [...prev, createTlmItem({ name: 'pdf' })]);
  };

  const removeItem = (id) => {
    setItems((prev) => (prev.length <= 1 ? [createTlmItem({ name: 'pdf' })] : prev.filter((item) => item.id !== id)));
  };

  return (
    <div className="st-tlm">
      

      <div className="st-reg-docs-grid">
        {items.map((item) => {
          const inputId = `tlm-upload-${item.id}`;
          const hasFile = Boolean(item.fileUrl || item.fileName);
          const fileType = getTrainerDocFileType(item.fileUrl || item.fileName, item.type);
          const uploadDate = formatDocDate(item.uploadedAt);
          const uploadTime = formatDocTime(item.uploadedAt);
          return (
            <div key={item.id} className="st-reg-doc-card">
              <div className="st-reg-doc-card__preview">
                {hasFile ? (
                  fileType === 'image' && item.fileUrl ? (
                    <img src={item.fileUrl} alt={item.name} className="st-reg-doc-card__image" />
                  ) : fileType === 'pdf' ? (
                    <div className="st-reg-doc-card__icon">
                      <i className="fa-solid fa-file" style={{ fontSize: 100, color: '#dc3545' }} />
                      <p>PDF Document</p>
                    </div>
                  ) : (
                    <div className="st-reg-doc-card__icon">
                      <i className={`fas ${fileType === 'video' ? 'fa-video' : 'fa-file'}`} />
                      <p>{fileType === 'video' ? 'Video' : 'Document'}</p>
                    </div>
                  )
                ) : (
                  <div className="st-reg-doc-card__empty">
                    <i className="fas fa-file-upload" />
                    <p>No Document</p>
                  </div>
                )}
              </div>
              <div className="st-reg-doc-card__info">
                <div className="st-reg-doc-card__header">
                  <h4>{item.name || 'pdf'}</h4>
                  {hasFile ? (
                    <label htmlFor={inputId} className="st-reg-pill st-reg-pill--verify">
                      <i className="fas fa-sync-alt" />
                      REPLACE
                    </label>
                  ) : (
                    <label htmlFor={inputId} className="st-reg-pill st-reg-pill--upload">
                      <i className="fas fa-cloud-upload-alt" />
                      UPLOAD
                    </label>
                  )}
                </div>
                <div className="st-reg-doc-card__meta">
                  <span>
                    <i className="fas fa-calendar-alt" />
                    {uploadDate || 'Not uploaded'}
                  </span>
                  {uploadTime ? (
                    <span>
                      <i className="fas fa-clock" />
                      {uploadTime}
                    </span>
                  ) : null}
                  <button type="button" className="st-tlm__remove" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
              <input
                id={inputId}
                type="file"
                className="sc-file-input"
                onChange={(e) => {
                  uploadToItem(item.id, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SeniorSessionCard = ({ session, token, backendUrl, onSessionUpdated }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [mcqModal, setMcqModal] = useState(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const moreBtnRef = useRef(null);
  const menuRef = useRef(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docStatuses, setDocStatuses] = useState({});
  const totSession = isTotSession(session);
  const sessionDone = getSessionDoneDetails(session);
  const sessionAttendance = getSessionAttendanceView(session);
  const trainerDocs = collectTrainerSubmittedDocs(session);
  const evidenceDocs = session.evidenceDocs || [];
  const displayDocs = trainerDocs.length
    ? trainerDocs
    : evidenceDocs.map((doc, index) => ({
      id: String(doc._id || doc.id || index),
      name: doc.name || 'Untitled document',
      type: doc.type || 'Document',
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || '',
      group: 'Session document',
      uploaded: Boolean(doc.fileUrl) || String(doc.status || '').toLowerCase() === 'uploaded',
      status: doc.status || (doc.fileUrl ? 'Pending' : 'Not Uploaded'),
      uploadedAt: doc.uploadedAt || doc.updatedAt || doc.createdAt || doc.uploadDate || null,
    }));
  const getDocStatus = (doc) => docStatuses[doc.id] || normalizeDocReviewStatus(doc.status, doc.uploaded);
  const uploadedTrainerDocs = displayDocs.filter((doc) => getDocStatus(doc) !== 'Not Uploaded');
  const mcqReview = getTrainerMcqReview(session);

  useEffect(() => {
    if (!actionsMenuOpen) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (moreBtnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setActionsMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [actionsMenuOpen]);
  const timeRange = `${session.startTime || '10:00'} - ${session.endTime || '12:00'}`;
  const detailItems = [
    ['fa-sitemap', 'Department', session.departmentName || session.verticalName || '-', 'blue'],
    ['fa-project-diagram', 'Project', session.projectName || '-', 'blue'],
    ['fa-building', 'Center', session.centerName || '-', 'blue'],
    ['fa-book-open', 'Topic covered', session.topicCovered || session.title || '-', 'blue'],
    ['fa-chalkboard', 'Training method', session.trainingMethod || 'Interactive Learning', 'blue'],
    ['fa-calendar-alt', 'Assign date', session.date || formatSessionDate(session.sessionDate) || '-', 'blue'],
    ['fa-graduation-cap', 'Course / trade', session.courseTrade || session.courseName || '-', 'pink'],
    ['fa-hashtag', 'Batch code', session.batchCode || '-', 'pink'],
    ['fa-user', 'Trainer', session.fieldTrainerName || session.trainerName || '-', 'pink'],
  ];
  const statItems = [
    { icon: 'fa-users', val: String(session.studentCount ?? session.totalCandidates ?? 0), lbl: 'Total Candidates', cls: 'blue' },
    { icon: 'fa-check-circle', val: String(session.presentCandidates ?? 0), lbl: 'Present', cls: 'green' },
    { icon: 'fa-times-circle', val: String(session.absentCandidates ?? 0), lbl: 'Absent', cls: 'red' },
    { icon: 'fa-percentage', val: session.attendance || `${session.attendancePercent ?? 0}%`, lbl: 'Attendance', cls: 'amber' },
  ];

  return (
    <article className={`sc-wrap${actionsMenuOpen ? ' sc-wrap--menu' : ''}`}>
      <div className="sc-head">
        <div className="sc-head-left">
          <div className="sc-avatar">
            <i className="fas fa-user" />
          </div>
          <div className="sc-head-text">
            <div className="sc-trainer-name">{session.title}</div>
            <span className="sc-session-badge sc-session-badge--plan">Academic Coordinator plan</span>
            {sessionDone.isDone && (
              <span className="sc-session-badge sc-session-badge--done">Session done</span>
            )}
            {totSession && session.includeTot === true && (
              <span className="sc-session-badge sc-session-badge--plan">TOT Linked</span>
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

        <div className="sc-head-controls">
          <button
            ref={moreBtnRef}
            type="button"
            className="sc-toggle-btn"
            title="More actions"
            aria-label="More actions"
            aria-expanded={actionsMenuOpen}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActionsMenuOpen((open) => !open);
            }}
          >
            <i className="fas fa-ellipsis-v" aria-hidden="true" />
          </button>
          {actionsMenuOpen && (
            <div ref={menuRef} className="sc-actions-dropdown" role="menu">
              <button
                type="button"
                className="sc-actions-item"
                role="menuitem"
                onClick={() => {
                  setActionsMenuOpen(false);
                  setMcqModal('response');
                }}
              >
                <i className="fas fa-user-check" aria-hidden="true" />
                Trainer Response
                {mcqReview.submitted && mcqReview.questions.length > 0 ? ` (${mcqReview.questions.length})` : ''}
              </button>
              <button
                type="button"
                className="sc-actions-item"
                role="menuitem"
                onClick={() => {
                  setActionsMenuOpen(false);
                  setMcqModal('new');
                }}
              >
                <i className="fas fa-plus" aria-hidden="true" />
                Re ToT
              </button>
            </div>
          )}
          <button
            type="button"
            className="sc-toggle-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand card' : 'Collapse card'}
          >
            <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} />
          </button>
        </div>
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
              <i className="far fa-image" /> Evidence Documents
              {displayDocs.length > 0 && <span className="sc-tab-count">{uploadedTrainerDocs.length}/{displayDocs.length}</span>}
            </button>
            <button
              type="button"
              className={`sc-tab${activeTab === 'tlm' ? ' sc-tab--active' : ''}`}
              onClick={() => setActiveTab('tlm')}
            >
              <i className="fas fa-book" /> TLM
            </button>
          </nav>

          {activeTab === 'details' && (
            <div className="sc-body">
              <div className="sc-detail-grid">
                {detailItems.map(([icon, label, tone]) => (
                  <div key={label} className="sc-detail-item">
                    <small>{label}</small>
                    <strong>
                      <span className={`sc-detail-icon sc-detail-icon--${tone}`}>
                        <i className={`fas ${icon}`} />
                      </span>
                    
                    </strong>
                  </div>
                ))}
                <div className="sc-detail-item">
                  <small>Student Feedback</small>
                  <strong>
                    <span className="sc-detail-icon sc-detail-icon--blue">
                      <i className="far fa-star" />
                    </span>
                    <span className="sc-detail-value">No reviews yet</span>
                  </strong>
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
          )}

          {activeTab === 'evidence' && (
            <div className="sc-body">
              {displayDocs.length === 0 ? (
                <div className="sc-evidence-empty">
                  <i className="far fa-folder-open" />
                  <p>No documents submitted by the trainer yet.</p>
                </div>
              ) : (
                <div className="st-reg-docs-grid">
                  {displayDocs.map((doc) => {
                    const status = getDocStatus(doc);
                    const fileUrl = doc.fileUrl ? getDocFileUrl(doc.fileUrl) : '';
                    const fileType = getTrainerDocFileType(fileUrl || doc.fileName, doc.type);
                    const hasFile = Boolean(fileUrl) && status !== 'Not Uploaded';
                    const uploadDate = formatDocDate(doc.uploadedAt);
                    const uploadTime = formatDocTime(doc.uploadedAt);
                    return (
                      <div key={doc.id} className="st-reg-doc-card">
                        <div className="st-reg-doc-card__preview">
                          {hasFile ? (
                            fileType === 'image' ? (
                              <img src={fileUrl} alt={doc.name} className="st-reg-doc-card__image" />
                            ) : fileType === 'pdf' ? (
                              <div className="st-reg-doc-card__icon">
                                <i className="fa-solid fa-file" style={{ fontSize: 100, color: '#dc3545' }} />
                                <p>PDF Document</p>
                              </div>
                            ) : (
                              <div className="st-reg-doc-card__icon">
                                <i className={`fas ${fileType === 'video' ? 'fa-video' : 'fa-file'}`} />
                                <p>{fileType === 'video' ? 'Video' : 'Document'}</p>
                              </div>
                            )
                          ) : (
                            <div className="st-reg-doc-card__empty">
                              <i className="fas fa-file-upload" />
                              <p>No Document</p>
                            </div>
                          )}
                          {hasFile && (
                            <div className="st-reg-doc-card__overlay">
                              <button type="button" className="st-reg-preview-btn" onClick={() => setSelectedDoc(doc)}>
                                <i className="fas fa-search-plus" />
                                {status === 'Pending' ? 'Review' : 'Preview'}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="st-reg-doc-card__info">
                          <div className="st-reg-doc-card__header">
                            <h4>{doc.name}</h4>
                            {hasFile ? (
                              <button
                                type="button"
                                className="st-reg-pill st-reg-pill--verify"
                                onClick={() => setSelectedDoc(doc)}
                              >
                                <i className="fas fa-check" />
                                {status === 'Pending' ? 'VERIFY' : 'PREVIEW'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="st-reg-pill st-reg-pill--upload"
                                onClick={() => setSelectedDoc(doc)}
                              >
                                <i className="fas fa-cloud-upload-alt" />
                                UPLOAD
                              </button>
                            )}
                          </div>
                          <div className="st-reg-doc-card__meta">
                            <span>
                              <i className="fas fa-calendar-alt" />
                              {uploadDate || 'Not uploaded'}
                            </span>
                            {uploadTime && (
                              <span>
                                <i className="fas fa-clock" />
                                {uploadTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedDoc && (
                <TrainerDocumentReviewModal
                  doc={selectedDoc}
                  status={getDocStatus(selectedDoc)}
                  onClose={() => setSelectedDoc(null)}
                  onAccept={(doc) => {
                    setDocStatuses((prev) => ({ ...prev, [doc.id]: 'Verified' }));
                    setSelectedDoc(null);
                  }}
                  onReject={(doc) => {
                    setDocStatuses((prev) => ({ ...prev, [doc.id]: 'Rejected' }));
                    setSelectedDoc(null);
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'tlm' && (
            <div className="sc-body">
              <SeniorTlmPanel session={session} />
            </div>
          )}

          <footer className="sc-foot">
            <span className="sc-foot-note">
              <i className="fas fa-info-circle" /> Referred session — review trainer documents and MCQ answers.
            </span>
          </footer>
        </>
      )}

      {mcqModal === 'response' && (
        <div className="st-modal-overlay" onClick={() => setMcqModal(null)}>
          <div className="st-modal st-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="st-modal__header">
              <h3><i className="fas fa-user-check" /> Trainer Response</h3>
              <button type="button" className="st-modal__close" onClick={() => setMcqModal(null)} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="st-modal__body st-modal__body--scroll">
              {mcqReview.questions.length === 0 ? (
                <div className="sc-evidence-empty">
                  <i className="fas fa-hourglass-half" />
                  <p>No candidate response yet. The trainer has not submitted MCQ answers.</p>
                </div>
              ) : (
                <div className="st-trainer-mcq">
                  {getTotSubmissionHistory(session).length > 1 && (
                    <div className="st-mcq-history">
                      <strong>Previous results</strong>
                      {getTotSubmissionHistory(session).map((item, index) => (
                        <div
                          key={`${item.submittedAt || index}`}
                          className={`st-mcq-history__row${item.pass ? ' st-mcq-history__row--pass' : ' st-mcq-history__row--fail'}`}
                        >
                          <span>Attempt {index + 1}</span>
                          <span>{item.pass ? 'Pass' : 'Fail'} · {item.percentage}%</span>
                          <span>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN') : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`st-trainer-mcq__score${mcqReview.pass === false ? ' st-trainer-mcq__score--fail' : ' st-trainer-mcq__score--pass'}`}>
                    <strong>{mcqReview.score}/{mcqReview.totalMarks} marks · {mcqReview.percentage}%</strong>
                    <span>
                      {mcqReview.pass === false ? 'Needs improvement' : 'Pass'} · need {mcqReview.passPercent}%
                      {mcqReview.trainerName ? ` · ${mcqReview.trainerName}` : ''}
                      {mcqReview.submittedAt ? ` · ${new Date(mcqReview.submittedAt).toLocaleDateString('en-IN')}` : ''}
                    </span>
                  </div>
                  {mcqReview.questions.map((question, qIndex) => (
                    <div key={question.id} className="st-trainer-mcq__card">
                      <div className="st-trainer-mcq__qhead">
                        <strong>{qIndex + 1}. {question.question}</strong>
                        <span>{question.selectedIndex === null ? 'Skipped' : (question.isCorrect ? 'Correct' : 'Wrong')}</span>
                      </div>
                      <div className="st-trainer-mcq__options">
                        {question.options.map((option, optionIndex) => {
                          const isChosen = question.selectedIndex === optionIndex;
                          const isCorrect = question.correctIndex === optionIndex;
                          const cls = isCorrect
                            ? ' st-trainer-mcq__option--correct'
                            : isChosen
                              ? ' st-trainer-mcq__option--wrong'
                              : '';
                          return (
                            <div key={`${question.id}-${optionIndex}`} className={`st-trainer-mcq__option${cls}`}>
                              <span className="st-trainer-mcq__letter">{String.fromCharCode(65 + optionIndex)}</span>
                              <span>{option || 'Option not set'}</span>
                              {isChosen && <em>Trainer</em>}
                              {isCorrect && <em>Correct</em>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="st-modal__footer">
              <button type="button" className="sc-btn" onClick={() => setMcqModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {mcqModal === 'new' && (
        <div className="st-modal-overlay" onClick={() => setMcqModal(null)}>
          <div className="st-modal st-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="st-modal__header">
              <h3><i className="fas fa-plus" /> New MCQ</h3>
              <button type="button" className="st-modal__close" onClick={() => setMcqModal(null)} aria-label="Close">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="st-modal__body st-modal__body--scroll">
              <SeniorAddMcqForm
                session={session}
                token={token}
                backendUrl={backendUrl}
                onAdded={(saved) => {
                  if (typeof onSessionUpdated === 'function') onSessionUpdated(saved);
                }}
              />
            </div>
            <div className="st-modal__footer">
              <button type="button" className="sc-btn" onClick={() => setMcqModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const SeniorTrainerModule = () => {
  const userData = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
  const token = userData.token;
  const seniorTrainerId = userData._id || userData.id;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

  const [permissions, setPermissions] = useState();

  const updatedPermission = async () => {
    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token },
    });
    if (respose.data.status) {
      setPermissions(respose.data.permissions);
    }
  };

  useEffect(() => {
    if (token) updatedPermission();
  }, []);

  useEffect(() => {
    if (document.getElementById('st-font-plus-jakarta')) return undefined;
    const link = document.createElement('link');
    link.id = 'st-font-plus-jakarta';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  const canBeSeniorTrainerPermission =
    (permissions?.custom_permissions?.can_be_senior_trainer && permissions?.permission_type === 'Custom') ||
    permissions?.permission_type === 'Admin';

  const [reportDate, setReportDate] = useState(new Date());
  const [filters, setFilters] = useState({
    center: '',
    course: '',
    batch: '',
  });
  const [centerOptions, setCenterOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [allCoursesMeta, setAllCoursesMeta] = useState([]);
  const [allCentersMeta, setAllCentersMeta] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [editSessionId, setEditSessionId] = useState('');

  const pathLabels = useMemo(() => ({
    centerName: getOptionLabel(centerOptions, filters.center),
    courseTrade: getOptionLabel(courseOptions, filters.course),
    batchCode: getOptionLabel(batchOptions, filters.batch),
  }), [filters, centerOptions, courseOptions, batchOptions]);

  const batchSummary = useMemo(() => [
    pathLabels.centerName,
    pathLabels.courseTrade,
    pathLabels.batchCode,
  ].filter(Boolean).join(' · '), [pathLabels]);

  const filteredCourseOptions = useMemo(
    () => getLinkedCourseOptions(filters.center, courseOptions, allCentersMeta, allCoursesMeta),
    [filters.center, allCentersMeta, courseOptions, allCoursesMeta]
  );

  const reloadSessions = useCallback(() => {
    if (!token) {
      const local = filters.batch
        ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
        : [];
      setSessions(applyPathFilters(local, filters));
      return;
    }

    // Always load referred sessions for this senior trainer (batch filter is optional)
    fetchCoordinatorSessionsApi(backendUrl, token, {
      seniorTrainerId: '',
      excludeScheduled: true,
    })
      .then((data) => {
        const mine = filterSessionsForSeniorTrainer(data, seniorTrainerId);
        setSessions(applyPathFilters(mine, filters));
      })
      .catch((err) => {
        console.error('Failed to load sessions', err);
        const local = filters.batch
          ? filterSessionsForSeniorTrainer(loadCoordinatorSessions(filters.batch), seniorTrainerId)
          : [];
        setSessions(applyPathFilters(local, filters));
      });
  }, [filters, seniorTrainerId, backendUrl, token]);

  useEffect(() => {
    reloadSessions();
    setSelectedSessionId('');
  }, [reloadSessions]);

  useEffect(() => {
    setAssignmentDrafts((prev) => {
      const next = {};
      sessions.forEach((session) => {
        const existing = prev[session.id];
        next[session.id] = {
          assignDate: existing?.assignDate ?? parseSessionDateKey(session),
          trainerId: existing?.trainerId ?? session.fieldTrainerId ?? '',
        };
      });
      return next;
    });
  }, [sessions]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    const fetchTrainers = async () => {
      setLoadingTrainers(true);
      try {
        const res = await axios.get(`${backendUrl}/college/users/training-role-users?roleType=session`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        const trainers = (res.data?.data || [])
          .filter((trainer) => trainer._id)
          .map((trainer) => ({
            value: String(trainer._id),
            label: trainer.name || trainer.email || 'Trainer',
          }));
        setTrainerOptions(trainers);
      } catch (err) {
        console.error('Failed to fetch trainers:', err);
        if (!cancelled) setTrainerOptions([]);
      } finally {
        if (!cancelled) setLoadingTrainers(false);
      }
    };

    fetchTrainers();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const editingSession = useMemo(
    () => sessions.find((session) => session.id === editSessionId) || null,
    [sessions, editSessionId]
  );

  const handleOpenEditModal = useCallback((sessionId) => {
    setEditSessionId(resolveSessionSelectionId(sessionId));
  }, []);

  const handleCloseEditModal = useCallback(() => setEditSessionId(''), []);

  const handleModalSave = useCallback(async (sessionId, { center, course, batch, assignDate, trainerId }) => {
    const trainerName = trainerId
      ? (trainerOptions.find((trainer) => String(trainer.value) === String(trainerId))?.label || '')
      : '';
    const formattedDate = formatSessionDate(assignDate);
    const workflowStatus = trainerId ? WORKFLOW_STATUS.ASSIGNED : WORKFLOW_STATUS.SENT_TO_SENIOR;

    setSessions((prevSessions) => prevSessions.map((session) => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        center: center || session.center,
        course: course || session.course,
        batch: batch || session.batch,
        fieldTrainerId: trainerId,
        fieldTrainerName: trainerName || session.fieldTrainerName || '',
        sessionDate: assignDate || session.sessionDate,
        date: formattedDate || session.date,
        workflowStatus: trainerId
          ? WORKFLOW_STATUS.ASSIGNED
          : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
            ? WORKFLOW_STATUS.SENT_TO_SENIOR
            : session.workflowStatus),
      };
    }));

    setAssignmentDrafts((prev) => ({
      ...prev,
      [sessionId]: { assignDate, trainerId },
    }));

    if (token) {
      try {
        await patchCoordinatorSessionApi(backendUrl, token, sessionId, {
          center: center || undefined,
          course: course || undefined,
          batch: batch || undefined,
          fieldTrainerId: trainerId,
          fieldTrainerName: trainerName,
          sessionDate: assignDate || undefined,
          date: formattedDate || undefined,
          workflowStatus,
        });
      } catch (err) {
        console.error('Failed to save assignment', err);
      }
    }
  }, [trainerOptions, backendUrl, token]);

  useEffect(() => {
    const onFocus = () => reloadSessions();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reloadSessions]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key?.startsWith(AC_SESSIONS_STORAGE_PREFIX)) reloadSessions();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reloadSessions]);

  useEffect(() => {
    if (!token) {
      setLoadingCenters(false);
      return undefined;
    }
    const requestConfig = { headers: { 'x-auth': token } };
    let cancelled = false;

    const fetchFilterOptions = async () => {
      setLoadingCenters(true);
      try {
        const [centersRes, coursesRes, filtersRes] = await Promise.allSettled([
          axios.get(`${backendUrl}/college/list_all_centers`, requestConfig),
          axios.get(`${backendUrl}/college/all_courses`, requestConfig),
          axios.get(`${backendUrl}/college/filters-data`, requestConfig),
        ]);
        if (cancelled) return;

        if (centersRes.status === 'fulfilled' && centersRes.value.data?.success) {
          const centers = centersRes.value.data.data || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapApiOptions(centers));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const centers = filtersRes.value.data.centers || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapApiOptions(centers));
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value.data?.success) {
          const courses = coursesRes.value.data.data || [];
          setAllCoursesMeta(courses);
          setCourseOptions(mapApiOptions(courses));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const courses = filtersRes.value.data.courses || [];
          setAllCoursesMeta(courses);
          setCourseOptions(mapApiOptions(courses));
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      } finally {
        if (!cancelled) setLoadingCenters(false);
      }
    };

    fetchFilterOptions();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!filters.center) {
      setLoadingCourses(false);
      return;
    }
    setLoadingCourses(true);
    const timer = setTimeout(() => setLoadingCourses(false), 150);
    return () => clearTimeout(timer);
  }, [filters.center]);

  useEffect(() => {
    if (!token || !filters.center || !filters.course) {
      setBatchOptions([]);
      return undefined;
    }
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const params = new URLSearchParams();
        params.set('centerId', filters.center);
        params.set('courseId', filters.course);
        const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
          headers: { 'x-auth': token },
        });
        if (res.data?.success) {
          setBatchOptions((res.data.data || []).map((batch) => ({
            value: String(batch._id),
            label: batch.name,
          })));
        } else {
          setBatchOptions([]);
        }
      } catch {
        setBatchOptions([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
    return undefined;
  }, [filters.center, filters.course, token, backendUrl]);

  const handleFilterChange = (key, value) => {
    if (key === 'center') {
      setFilters({ center: value, course: '', batch: '' });
      setSelectedSessionId('');
      return;
    }
    if (key === 'course') {
      setFilters((prev) => ({ ...prev, course: value, batch: '' }));
      setSelectedSessionId('');
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedSessionId('');
  };

  const handleFilterReset = () => {
    setFilters({ center: '', course: '', batch: '' });
    setSelectedSessionId('');
  };

  const totSessions = useMemo(
    () => sessions.filter((session) => isTotSession(session)).map(mapSessionForTotCalendar),
    [sessions]
  );

  const studentSessions = useMemo(
    () => sessions.filter((session) => appearsOnStudentCalendar(session)),
    [sessions]
  );

  const tableSessions = useMemo(() => sortSessionsByDate(sessions), [sessions]);

  const selectedSession = useMemo(() => {
    const resolvedId = resolveSessionSelectionId(selectedSessionId);
    return sessions.find((session) => session.id === resolvedId) || null;
  }, [sessions, selectedSessionId]);

  const handleSelectSession = (sessionId) => {
    const resolvedId = resolveSessionSelectionId(sessionId);
    setSelectedSessionId((prev) => (resolveSessionSelectionId(prev) === resolvedId ? '' : resolvedId));
  };

  if (permissions && !canBeSeniorTrainerPermission) {
    return (
      <div className="st-portal">
        <style>{ST_CSS}</style>
        <div style={{ marginTop: 40, textAlign: 'center', padding: 48 }}>
          <i className="fas fa-lock" style={{ fontSize: 32, color: '#94a3b8', marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px' }}>Access denied</h3>
          <p style={{ margin: 0, color: '#64748b' }}>
            You need <strong>Senior Trainer</strong> permission (or Admin) to use this module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="st-portal">
      <style>{ST_CSS}</style>

      <header className="st-header">
        <div>
          <div className="st-role-badge">
            <i className="fas fa-user-shield" /> Senior Trainer
          </div>
          <h1 className="st-title">Training Calendar</h1>
                   
        </div>
        
      </header>



      <div className="st-stats-row">
        <div className="st-stat">
          <strong>{sessions.filter((s) => isTotSession(s)).length}</strong>
          <span>TOT plans</span>
        </div>
        <div className="st-stat st-stat--green">
          <strong>{sessions.filter((s) => appearsOnStudentCalendar(s)).length}</strong>
          <span>Student sessions</span>
        </div>
        <div className="st-stat st-stat--amber">
          <strong>{sessions.filter((s) => s.workflowStatus === WORKFLOW_STATUS.SENT_TO_SENIOR).length}</strong>
          <span>Sent for review</span>
        </div>
      </div>

      <div className="st-workspace">
        <div className="st-dual-calendars">
          <TrainingCalendar
            title="TOT Calendar"
            icon="fa-chalkboard-teacher"
            accent={BLUE}
            sessions={totSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
          <TrainingCalendar
            title="Session Calendar"
            icon="fa-user-graduate"
            accent={GREEN}
            sessions={studentSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>

        <SessionDayTimetable
          sessions={tableSessions}
          assignmentDrafts={assignmentDrafts}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
        />

        <SessionTable
          sessions={tableSessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
          filters={filters}
          centerOptions={centerOptions}
          courseOptions={filteredCourseOptions}
          batchOptions={batchOptions}
          loadingCenters={loadingCenters}
          loadingCourses={loadingCourses}
          loadingBatches={loadingBatches}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          assignmentDrafts={assignmentDrafts}
          trainerOptions={trainerOptions}
          loadingTrainers={loadingTrainers}
          onEditSession={handleOpenEditModal}
        />

        <div className="st-detail-panel">
          {selectedSession ? (
            <SeniorSessionCard
              session={selectedSession}
              token={token}
              backendUrl={backendUrl}
              onSessionUpdated={(savedSession) => {
                if (!savedSession?.id && !savedSession?._id) return;
                const sessionId = String(savedSession.id || savedSession._id);
                setSessions((prev) => prev.map((item) => (
                  String(item.id) === sessionId
                    ? { ...item, ...savedSession, id: sessionId }
                    : item
                )));
              }}
            />
          ) : (
            <div className="st-detail-empty">
              <i className="fas fa-hand-pointer" />
              <h4>Select a session</h4>
              <p>Click any session cell on the Session or TOT grid, or a row in the table, to view its full plan card.</p>
              {!filters.batch && sessions.length === 0 && (
                <p className="st-detail-empty__hint">
                  No referred sessions yet. Ask Academic Coordinator to refer a plan to your account.
                </p>
              )}
              {filters.batch && !totSessions.length && !studentSessions.length && (
                <p className="st-detail-empty__hint">
                  No sessions match this Center/Course/Batch filter. Clear filters to see all referred plans.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {editingSession && (
        <SessionAssignModal
          session={editingSession}
          centerOptions={centerOptions}
          courseOptions={courseOptions}
          allCentersMeta={allCentersMeta}
          allCoursesMeta={allCoursesMeta}
          trainerOptions={trainerOptions}
          loadingTrainers={loadingTrainers}
          backendUrl={backendUrl}
          token={token}
          onClose={handleCloseEditModal}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

const ST_CSS = `
  .st-portal {
    min-height: 100vh;
    background: linear-gradient(180deg, #f0fdf4 0%, #f4f6f9 100px, #f4f6f9 100%);
    padding: 12px 14px 48px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #1e293b;
  }
  .st-header {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 16px;
    margin-bottom: 12px; box-shadow: 0 10px 24px rgba(15,23,42,0.05);
  }
  .st-role-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #ecfdf5; color: ${GREEN}; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 999px; margin-bottom: 6px;
  }
  .st-title { margin: 0; font-size: 1.3rem; font-weight: 900; color: #0f172a; }
  .st-subtitle { margin: 8px 0 0; font-size: 13px; color: #64748b; max-width: 560px; line-height: 1.5; }
  .st-breadcrumb { font-size: 12px; color: #64748b; display: flex; gap: 6px; align-items: center; }
  .st-breadcrumb--active { color: ${GREEN}; font-weight: 700; }
  .st-header-meta { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
  .st-header-user, .st-header-date {
    display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #334155;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 10px;
  }
  .st-header-date .react-date-picker { border: none; font-size: 13px; }
  .st-header-date .react-date-picker__wrapper { border: none; background: transparent; }

  .st-filters, .st-toolbar, .st-calendar, .st-day-tt, .st-session-card, .st-sessions-table-wrap, .st-empty-state {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.05);
  }
  .st-filters { padding: 12px 14px; margin-bottom: 10px; }
  .st-filters__head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;
  }
  .st-filters__head h3 {
    margin: 0 0 3px; font-size: 13px; font-weight: 800; color: #0f172a;
    display: flex; align-items: center; gap: 6px;
  }
  .st-filters__head h3 i { color: ${GREEN}; }
  .st-filters__head p { margin: 0; font-size: 11px; color: #64748b; }
  .st-filters__grid {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
  }
  .st-filter-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .st-filter-field span {
    font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
  }
  .st-filter-select {
    width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 7px 10px;
    font-size: 12px; font-weight: 600; color: #0f172a; background: #fff; outline: none;
  }
  .st-filter-select:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
  .st-filter-select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
  .st-empty-state {
    text-align: center; padding: 36px 18px; color: #64748b;
  }
  .st-empty-state i { font-size: 28px; color: #cbd5e1; margin-bottom: 10px; display: block; }
  .st-empty-state h3 { margin: 0 0 6px; font-size: 1rem; color: #0f172a; }
  .st-empty-state p { margin: 0; font-size: 12px; line-height: 1.45; }

  .st-toolbar {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;
    padding: 10px 14px; margin-bottom: 10px;
  }
  .st-toolbar__label { display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
  .st-toolbar strong { font-size: 13px; color: #0f172a; }
  .st-toolbar__actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .st-btn {
    border: none; border-radius: 9px; padding: 7px 12px; font-size: 11px; font-weight: 800; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .st-btn--ghost { background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; }

  .st-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 10px; }
  .st-stat {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 9px 12px;
    box-shadow: 0 6px 14px rgba(15,23,42,0.03);
  }
  .st-stat strong { display: block; font-size: 1.1rem; font-weight: 900; color: #0f172a; line-height: 1.2; }
  .st-stat span { font-size: 11px; color: #64748b; font-weight: 700; }
  .st-stat--green strong { color: ${GREEN}; }
  .st-stat--amber strong { color: ${AMBER}; }

  .st-workspace { display: flex; flex-direction: column; gap: 10px; }
  .st-dual-calendars {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; align-items: start;
  }
  .st-calendar {
    padding: 0; overflow: hidden; min-width: 0; background: #fff;
    border: 1px solid #e2e8f0; border-radius: 16px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.06);
  }
  .st-calendar__title-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 8px 10px; border-bottom: 1px solid #eef2f7; background: color-mix(in srgb, var(--calendar-accent, ${GREEN}) 8%, white);
  }
  .st-calendar__title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 900; color: #0f172a; }
  .st-calendar__title i { color: var(--calendar-accent, ${GREEN}); }
  .st-calendar__count {
    font-size: 10px; font-weight: 800; color: var(--calendar-accent, ${GREEN});
    background: color-mix(in srgb, var(--calendar-accent, ${GREEN}) 14%, white);
    padding: 3px 8px; border-radius: 999px;
  }
  .st-calendar__head {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
    margin-bottom: 4px; padding: 8px 10px 0;
  }
  .st-calendar__head h3 { margin: 0; font-size: 0.9rem; font-weight: 900; }
  .st-calendar__head-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .st-calendar__head-hint { font-size: 10px; font-weight: 700; color: #94a3b8; }
  .st-calendar__pager { display: inline-flex; align-items: center; gap: 4px; }
  .st-calendar__pager-btn {
    width: 20px; height: 20px; border-radius: 7px; border: 1px solid #e2e8f0;
    background: #fff; color: var(--calendar-accent, #334155); font-size: 9px;
    display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .st-calendar__pager-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--calendar-accent, ${BLUE}) 12%, white); }
  .st-calendar__pager-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .st-calendar__pager-count { font-size: 9px; font-weight: 800; color: #64748b; min-width: 30px; text-align: center; }
  .st-calendar__weekdays {
    display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px;
    padding: 0 10px 4px;
  }
  .st-calendar__weekdays span {
    text-align: center; font-size: 9px; font-weight: 800; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 0;
  }
  .st-calendar__grid {
    display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 3px; padding: 0 10px 10px; width: 100%; box-sizing: border-box;
  }
  .st-calendar__day {
    box-sizing: border-box; min-width: 0; width: 100%; max-width: 100%;
    min-height: 58px; height: 100%;
    border: 1px solid #eef2f7; border-radius: 9px; padding: 4px;
    background: #fafbfc; display: flex; flex-direction: column; gap: 2px;
    text-align: left; overflow: hidden;
  }
  .st-calendar__day--muted { opacity: 0.35; }
  .st-calendar__day--slot {
    background: #f8fafc; border-style: dashed; border-color: #e2e8f0;
  }
  .st-calendar__day--slot .st-calendar__day-num { color: #94a3b8; }
  .st-calendar__day--session {
    margin: 0; font: inherit; color: inherit; appearance: none; -webkit-appearance: none;
    cursor: pointer; border: 1px solid #eef2f7;
    background: color-mix(in srgb, var(--event-color, ${BLUE}) 8%, white);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .st-calendar__day--session:hover {
    border-color: color-mix(in srgb, var(--event-color, ${BLUE}) 45%, #e2e8f0);
  }
  .st-calendar__day--selected {
    border-color: var(--event-color, ${GREEN});
    box-shadow: inset 0 0 0 1.5px var(--event-color, ${GREEN});
    background: color-mix(in srgb, var(--event-color, ${GREEN}) 16%, white);
  }
  .st-calendar__day-num {
    flex-shrink: 0; font-size: 10px; font-weight: 900; line-height: 1;
    color: var(--event-color, #334155);
  }
  .st-calendar__session-title {
    font-size: 9px; font-weight: 700; color: #0f172a; line-height: 1.2;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; word-break: break-word; overflow-wrap: anywhere;
  }
  .st-calendar__session-title--muted { color: #94a3b8; font-weight: 600; }
  .st-calendar__session-topic {
    margin-top: auto; font-size: 8px; font-weight: 600; color: #64748b;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
  }
  .st-calendar__empty {
    margin: 0; padding: 16px 10px 18px; text-align: center; font-size: 12px; font-weight: 700; color: #94a3b8;
  }

  .st-day-tt { padding: 0; overflow: hidden; }
  .st-day-tt__title-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
    padding: 8px 12px; border-bottom: 1px solid #eef2f7;
    background: linear-gradient(90deg, #eff6ff, #ecfdf5);
  }
  .st-day-tt__title {
    display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 900; color: #0f172a;
  }
  .st-day-tt__title i { color: ${BLUE}; }
  .st-day-tt__count {
    font-size: 10px; font-weight: 800; color: ${GREEN};
    background: #ecfdf5; padding: 3px 8px; border-radius: 999px;
  }
  .st-day-tt__hint {
    margin: 0; padding: 6px 12px 0; font-size: 11px; font-weight: 600; color: #64748b; line-height: 1.4;
  }
  .st-day-tt__layout {
    display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(220px, 0.9fr);
    gap: 10px; padding: 8px 10px 10px; align-items: start;
  }
  .st-day-tt__calendar .react-calendar {
    width: 100%; border: none; background: transparent; font-family: inherit;
  }
  .st-day-tt__calendar .react-calendar__navigation {
    display: flex; align-items: center; gap: 3px; margin-bottom: 4px;
  }
  .st-day-tt__calendar .react-calendar__navigation button {
    min-width: 30px; border-radius: 9px; font-size: 12px; font-weight: 800; color: #0f172a;
  }
  .st-day-tt__calendar .react-calendar__navigation button:enabled:hover {
    background: #eff6ff;
  }
  .st-day-tt__calendar .react-calendar__month-view__weekdays {
    text-align: center; text-transform: uppercase; font-size: 9px; font-weight: 800; color: #94a3b8;
  }
  .st-day-tt__calendar .react-calendar__month-view__weekdays__weekday { padding: 3px 0; }
  .st-day-tt__calendar .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
  .st-day-tt__calendar .react-calendar__tile {
    min-height: 66px; height: auto !important; padding: 4px 3px 3px;
    border-radius: 10px; border: 1px solid transparent; background: #fafbfc;
    display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start;
    gap: 2px; overflow: hidden;
  }
  .st-day-tt__calendar .react-calendar__tile:enabled:hover { background: #f1f5f9; }
  .st-day-tt__calendar .react-calendar__tile--now {
    background: #eff6ff;
  }
  .st-day-tt__calendar .react-calendar__tile--active {
    background: #ecfdf5 !important; color: inherit;
  }
  .st-day-tt__calendar .react-calendar__tile > abbr {
    align-self: flex-start; font-size: 10px; font-weight: 900; color: #334155;
  }
  .st-day-tt__tile--busy {
    border-color: #e2e8f0 !important; background: #fff !important;
  }
  .st-day-tt__tile--focused,
  .st-day-tt__tile--selected {
    box-shadow: inset 0 0 0 1.5px ${BLUE};
  }
  .st-day-tt__events {
    display: flex; flex-direction: column; gap: 2px; width: 100%; min-width: 0;
  }
  .st-day-tt__badge {
    align-self: flex-start; font-size: 8px; font-weight: 800; color: #1e40af;
    background: #dbeafe; border-radius: 999px; padding: 1px 5px; margin-bottom: 1px;
  }
  .st-day-tt__chip {
    width: 100%; margin: 0; border: none; border-radius: 6px; padding: 2px 4px;
    text-align: left; cursor: pointer; appearance: none; -webkit-appearance: none;
    background: color-mix(in srgb, var(--event-color, ${BLUE}) 14%, white);
    border-left: 3px solid var(--event-color, ${BLUE});
    display: grid; grid-template-columns: 7px minmax(0, 1fr); grid-template-rows: auto auto;
    column-gap: 4px; row-gap: 0; align-items: center; min-width: 0;
  }
  .st-day-tt__chip:hover {
    background: color-mix(in srgb, var(--event-color, ${BLUE}) 24%, white);
  }
  .st-day-tt__chip--selected {
    box-shadow: 0 0 0 1.5px var(--event-color, ${BLUE});
  }
  .st-day-tt__chip-dot {
    width: 7px; height: 7px; border-radius: 50%; grid-row: 1 / span 2;
  }
  .st-day-tt__chip-time {
    font-size: 9px; font-weight: 800; color: var(--event-color, ${BLUE});
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-day-tt__chip-title {
    font-size: 9px; font-weight: 700; color: #0f172a; line-height: 1.25;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-day-tt__more {
    font-size: 9px; font-weight: 800; color: #64748b; padding: 0 2px;
  }
  .st-day-tt__side {
    border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; padding: 8px;
    min-height: 180px;
  }
  .st-day-tt__side-head {
    display: flex; justify-content: space-between; align-items: baseline; gap: 6px;
    margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;
  }
  .st-day-tt__side-head h4 { margin: 0; font-size: 12px; font-weight: 900; color: #0f172a; }
  .st-day-tt__side-head span { font-size: 10px; font-weight: 800; color: ${BLUE}; }
  .st-day-tt__side-empty {
    margin: 8px 0 0; font-size: 11px; font-weight: 600; color: #94a3b8; line-height: 1.4;
  }
  .st-day-tt__side-empty--warn { color: ${AMBER}; }
  .st-day-tt__side-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .st-day-tt__side-item {
    width: 100%; display: flex; gap: 8px; align-items: flex-start; text-align: left;
    border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; padding: 7px 8px;
    cursor: pointer; appearance: none; -webkit-appearance: none;
  }
  .st-day-tt__side-item:hover { border-color: color-mix(in srgb, var(--event-color, ${BLUE}) 40%, #e2e8f0); }
  .st-day-tt__side-item--selected {
    border-color: var(--event-color, ${BLUE});
    box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--event-color, ${BLUE}) 35%, white);
  }
  .st-day-tt__side-swatch {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
  }
  .st-day-tt__side-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .st-day-tt__side-meta strong {
    font-size: 12px; font-weight: 800; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-day-tt__side-meta em { font-style: normal; font-size: 10px; font-weight: 800; color: var(--event-color, ${BLUE}); }
  .st-day-tt__side-meta small { font-size: 10px; font-weight: 600; color: #64748b; }
  .st-day-tt__done-flag {
    display: inline-flex; align-items: center; gap: 4px;
    margin-top: 2px; font-size: 10px; font-weight: 800; color: ${GREEN};
  }
  .st-day-tt__att-flag {
    display: inline-flex; align-items: center; gap: 4px;
    margin-top: 4px; font-size: 10px; font-weight: 800; color: ${BLUE};
  }
  .st-day-tt__att-counts {
    font-size: 10px; font-weight: 700; color: #475569;
  }
  .st-day-tt__done-remark {
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; margin-top: 2px;
    font-size: 10px; font-weight: 600; color: #334155; line-height: 1.35;
  }

  .st-detail-panel {
    padding: 0;
    min-height: auto;
    background: transparent;
    border: none;
    box-shadow: none;
  }
  .st-detail-empty { text-align: center; padding: 28px 16px; color: #64748b; }
  .st-detail-empty i { font-size: 26px; color: #cbd5e1; margin-bottom: 8px; }
  .st-detail-empty h4 { margin: 0 0 6px; color: #0f172a; font-size: 14px; }
  .st-detail-empty p { margin: 0; font-size: 12px; line-height: 1.4; }
  .st-detail-empty__hint { margin-top: 8px !important; color: ${AMBER}; font-weight: 700; }

  .st-sessions-table-wrap { padding: 10px 12px; }
  .st-sessions-table__head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 8px;
  }
  .st-sessions-table__head h3 {
    margin: 0; font-size: 13px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px;
  }
  .st-sessions-table__head h3 i { color: ${GREEN}; }
  .st-sessions-table__head span { font-size: 11px; font-weight: 700; color: #64748b; }
  .st-sessions-table__filters {
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; padding: 10px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
  }
  .st-sessions-table__clear { align-self: flex-start; }
  .st-sessions-table__empty { margin: 0; padding: 14px 0; text-align: center; color: #94a3b8; font-size: 12px; }
  .st-sessions-table-scroll { overflow-x: auto; }
  .st-sessions-table { width: 100%; border-collapse: collapse; min-width: 640px; }
  .st-sessions-table thead th {
    text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    color: #94a3b8; padding: 7px 10px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
  }
  .st-sessions-table__row { cursor: pointer; transition: background 0.12s; }
  .st-sessions-table__row:hover { background: #f8fafc; }
  .st-sessions-table__row--selected { background: #ecfdf5 !important; box-shadow: inset 3px 0 0 ${GREEN}; }
  .st-sessions-table td {
    padding: 7px 10px; border-bottom: 1px solid #eef2f7; font-size: 12px; color: #0f172a; vertical-align: middle;
  }
  .st-sessions-table td:first-child { width: 40px; font-weight: 800; color: #64748b; }
  .st-sessions-table td strong { display: block; font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 1px; }
  .st-sessions-table td small { display: block; font-size: 10px; color: #94a3b8; font-weight: 600; }
  .st-table-type {
    display: inline-flex; padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 800; text-transform: uppercase;
    margin-bottom: 3px;
  }
  .st-table-type--tot { background: #dbeafe; color: #1d4ed8; }
  .st-table-type--linked { background: #ede9fe; color: #6d28d9; }
  .st-table-type--student { background: #d1fae5; color: #065f46; }
  .st-table-cell--control { min-width: 110px; }
  .st-table-input, .st-table-select {
    width: 100%; min-width: 110px; border: 1px solid #e2e8f0; border-radius: 9px;
    padding: 6px 9px; font-size: 11px; font-weight: 600; color: #0f172a; background: #fff;
  }
  .st-table-input:focus, .st-table-select:focus {
    outline: none; border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
  }
  .st-table-select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

  .st-session-card { overflow: hidden; border-left: 4px solid ${GREEN}; }
  .st-session-card--no-activity { border-left-color: #cbd5e1; }
  .st-session-card__label {
    padding: 7px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    color: ${GREEN}; background: #f8fafc; border-bottom: 1px solid #eef2f7;
  }
  .st-session-card__head {
    padding: 12px; color: #fff; display: flex; justify-content: space-between; gap: 10px; align-items: flex-start;
  }
  .st-session-card__head--neutral { background: linear-gradient(105deg, #64748b, #475569); }
  .st-session-card__head h4 { margin: 0 0 3px; font-size: 14px; font-weight: 900; }
  .st-session-card__head p { margin: 0 0 6px; font-size: 11px; opacity: 0.9; }
  .st-session-card__badges { display: flex; flex-wrap: wrap; gap: 5px; }
  .st-activity-badge {
    display: inline-flex; padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 800; color: #fff;
  }
  .st-type-badge {
    display: inline-flex; padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 800; text-transform: uppercase;
  }
  .st-type-badge--tot { background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); color: #fff; }
  .st-type-badge--student { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .st-status-pill {
    flex-shrink: 0; padding: 4px 9px; border-radius: 999px; font-size: 9px; font-weight: 800; background: rgba(255,255,255,0.2); color: #fff;
  }
  .st-status-pill--amber { background: #fef3c7; color: #92400e; }
  .st-status-pill--blue { background: #dbeafe; color: #1d4ed8; }
  .st-status-pill--purple { background: #ede9fe; color: #6d28d9; }
  .st-status-pill--teal { background: #ccfbf1; color: #0f766e; }
  .st-status-pill--green { background: #d1fae5; color: #065f46; }
  .st-session-card__grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px;
  }
  .st-session-card__grid em {
    display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; font-style: normal;
  }
  .st-session-card__grid strong { font-size: 12px; color: #0f172a; }
  .st-session-card__notes {
    display: flex; gap: 8px; padding: 0 12px 12px; font-size: 11px; color: #475569; line-height: 1.45;
  }
  .st-session-card__notes i { color: ${GREEN}; margin-top: 2px; }
  .st-trainer-submit {
    border-top: 1px solid #eef2f7;
    padding: 12px;
    background: #fafbfc;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .st-trainer-submit__title {
    display: flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: ${GREEN};
  }
  .st-trainer-submit__block h6 {
    margin: 0 0 8px; font-size: 12px; font-weight: 800; color: #0f172a;
  }
  .st-trainer-submit__empty {
    margin: 0; padding: 10px 12px; border: 1px dashed #cbd5e1; border-radius: 10px;
    background: #fff; color: #64748b; font-size: 11px; font-weight: 600;
  }
  .st-trainer-docs { display: flex; flex-direction: column; gap: 8px; }
  .st-trainer-doc {
    display: flex; align-items: center; gap: 8px;
    border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; background: #fff;
  }
  .st-trainer-doc--uploaded { border-color: #bbf7d0; }
  .st-trainer-doc__icon {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: #eff6ff; color: ${BLUE}; font-size: 12px;
  }
  .st-trainer-doc__meta { min-width: 0; flex: 1; }
  .st-trainer-doc__meta strong {
    display: block; font-size: 12px; font-weight: 800; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-trainer-doc__meta small { font-size: 10px; font-weight: 600; color: #94a3b8; }
  .st-trainer-doc__btn {
    border: 1px solid #bbf7d0; background: #ecfdf5; color: ${GREEN};
    border-radius: 8px; padding: 5px 9px; font-size: 11px; font-weight: 800; cursor: pointer;
  }
  .st-trainer-doc__pending { font-size: 10px; font-weight: 800; color: ${AMBER}; }
  .st-trainer-mcq__score {
    display: flex; flex-direction: column; gap: 2px;
    border-radius: 10px; padding: 8px 10px; margin-bottom: 8px;
  }
  .st-trainer-mcq__score strong { font-size: 12px; }
  .st-trainer-mcq__score span { font-size: 10px; font-weight: 700; }
  .st-trainer-mcq__score--pass { background: #ecfdf5; color: #047857; }
  .st-trainer-mcq__score--fail { background: #fef2f2; color: #b91c1c; }
  .st-trainer-mcq { display: flex; flex-direction: column; gap: 8px; }
  .st-trainer-mcq__card {
    border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #fff;
  }
  .st-trainer-mcq__qhead {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;
  }
  .st-trainer-mcq__qhead strong { font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.4; }
  .st-trainer-mcq__qhead span { flex-shrink: 0; font-size: 10px; font-weight: 800; color: #64748b; }
  .st-trainer-mcq__options { display: flex; flex-direction: column; gap: 6px; }
  .st-trainer-mcq__option {
    display: flex; align-items: center; gap: 8px;
    border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px;
    background: #f8fafc; font-size: 11px; font-weight: 600; color: #334155;
  }
  .st-trainer-mcq__option em {
    margin-left: auto; font-style: normal; font-size: 9px; font-weight: 800; text-transform: uppercase;
  }
  .st-trainer-mcq__option--correct { border-color: #6ee7b7; background: #ecfdf5; color: #047857; }
  .st-trainer-mcq__option--wrong { border-color: #fca5a5; background: #fef2f2; color: #b91c1c; }
  .st-trainer-mcq__letter {
    width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    background: #e2e8f0; color: #475569; font-size: 10px; font-weight: 800;
  }
  .st-trainer-mcq__option--correct .st-trainer-mcq__letter { background: #a7f3d0; color: #047857; }
  .st-trainer-mcq__option--wrong .st-trainer-mcq__letter { background: #fecaca; color: #b91c1c; }
  .st-add-mcq {
    margin-bottom: 14px; border: 1px solid #dbeafe; background: #f8fbff;
    border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px;
  }
  .st-add-mcq__head strong { display: block; font-size: 13px; font-weight: 800; color: #0f172a; }
  .st-add-mcq__head span { display: block; margin-top: 3px; font-size: 11px; font-weight: 600; color: #64748b; line-height: 1.45; }
  .st-add-mcq__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .st-add-mcq__stepper-wrap { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #64748b; }
  .st-add-mcq__stepper {
    display: flex; align-items: center; border: 1px solid #e2e8f0; border-radius: 10px;
    overflow: hidden; background: #fff;
  }
  .st-add-mcq__stepper button {
    width: 28px; height: 32px; border: none; background: #f6f8fc; color: #1e293b;
    font-weight: 700; cursor: pointer;
  }
  .st-add-mcq__stepper button:disabled { opacity: 0.45; cursor: not-allowed; }
  .st-add-mcq__stepper input {
    width: 44px; height: 32px; border: none; text-align: center; font-weight: 700;
    font-size: 13px; outline: none; color: #1e293b;
  }
  .st-add-mcq__chip { font-size: 11px; font-weight: 700; background: #f6f8fc; color: #1e293b; border-radius: 999px; padding: 5px 10px; }
  .st-add-mcq__chip--mint { background: #d1fae5; color: #059669; }
  .st-add-mcq__chip--amber { background: #fef3c7; color: #92400e; }
  .st-add-mcq__list { display: flex; flex-direction: column; gap: 12px; }
  .st-add-mcq__card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #fff; display: flex; flex-direction: column; gap: 8px; }
  .st-add-mcq__card--locked { background: #f8fafc; }
  .st-add-mcq__card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .st-add-mcq__card-head strong { font-size: 13px; font-weight: 800; color: #0f172a; }
  .st-add-mcq__card-tools { display: flex; align-items: center; gap: 10px; }
  .st-add-mcq__remove { border: none; background: transparent; color: #fa5579; font-size: 11px; font-weight: 700; cursor: pointer; }
  .st-add-mcq__input {
    width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;
    font-size: 13px; outline: none; background: #fff;
  }
  .st-add-mcq__input:disabled { background: #f8fafc; color: #334155; }
  .st-add-mcq__option { display: flex; align-items: center; gap: 8px; }
  .st-add-mcq__add {
    width: 100%; border: 1px dashed #cbd5e1; background: #f8fafc; color: #1e293b;
    font-size: 13px; font-weight: 600; border-radius: 12px; padding: 10px 12px; cursor: pointer; text-align: left;
  }
  .st-add-mcq__error { font-size: 12px; font-weight: 700; color: #b91c1c; }
  .st-add-mcq__actions { display: flex; justify-content: flex-end; }
  .st-mcq-history { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  .st-mcq-history strong { font-size: 12px; font-weight: 800; color: #0f172a; }
  .st-mcq-history__row {
    display: flex; justify-content: space-between; gap: 8px; border-radius: 8px; padding: 6px 8px;
    font-size: 11px; font-weight: 700;
  }
  .st-mcq-history__row--pass { background: #ecfdf5; color: #047857; }
  .st-mcq-history__row--fail { background: #fef2f2; color: #b91c1c; }
  .st-session-card__source {
    padding: 8px 12px; border-top: 1px solid #eef2f7; font-size: 11px; font-weight: 700; color: #64748b;
    display: flex; align-items: center; gap: 6px; background: #fafbfc;
  }
  .st-text--green { color: ${GREEN}; }
  .st-text--amber { color: ${AMBER}; }

  .sc-wrap {
    background: #fff; border: 1px solid #bfdbfe;
    border-radius: 10px; overflow: hidden;
    margin-bottom: 10px;
    box-shadow: 0 4px 14px rgba(37,99,235,0.08);
  }
  .sc-wrap--menu { overflow: visible; }
  .sc-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 10px 12px; flex-wrap: nowrap; overflow: visible;
    background: linear-gradient(105deg, #1264dc 0%, #1b8def 48%, #2bd2e9 100%);
  }
  .sc-head-left {
    display: flex; align-items: center; gap: 8px;
    min-width: 0; flex: 1 1 0; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 8px;
    padding: 5px 8px;
    background: rgba(255,255,255,0.13);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
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
    border: 0; background: #fff; border-radius: 50%;
    width: 30px; height: 30px; min-width: 30px; min-height: 30px; padding: 0;
    cursor: pointer; color: ${BLUE}; font-size: 12px;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(15,23,42,0.12);
    overflow: hidden; line-height: 1;
  }
  .sc-toggle-btn:hover { background: #eff6ff; }
  .sc-head-controls {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    position: relative;
  }
  .sc-actions-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 36px;
    z-index: 8;
    display: flex; flex-direction: column;
    min-width: 188px; max-width: 240px;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 6px;
    box-shadow: 0 16px 40px rgba(15,23,42,0.16);
  }
  .sc-actions-item {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border: none; background: none; border-radius: 8px;
    font-size: 12px; font-weight: 700; color: #334155; cursor: pointer; text-align: left;
  }
  .sc-actions-item:hover { background: #f8fafc; color: ${BLUE}; }
  .sc-actions-item i { width: 16px; color: ${BLUE}; }
  .sc-stats {
    display: flex; align-items: stretch; gap: 5px;
    flex-shrink: 0;
  }
  .sc-stat {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 4px 7px; gap: 2px; text-align: center;
    min-height: 50px; min-width: 56px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.16);
    box-shadow: inset 0 -1px 0 rgba(255,255,255,0.16);
  }
  .sc-stat__icon {
    width: 20px; height: 20px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; margin-bottom: 0;
  }
  .sc-stat__icon--blue  { background: rgba(219,234,254,0.95); color: #1d4ed8; }
  .sc-stat__icon--green { background: rgba(209,250,229,0.95); color: #059669; }
  .sc-stat__icon--red   { background: rgba(254,226,226,0.95); color: #dc2626; }
  .sc-stat__icon--amber { background: rgba(254,243,199,0.95); color: #d97706; }
  .sc-stat__val { font-size: 14px; font-weight: 900; color: #fff; line-height: 1; }
  .sc-stat__lbl { font-size: 8px; color: rgba(255,255,255,0.86); font-weight: 700; white-space: nowrap; }
  .sc-tabs {
    display: flex; gap: 0; padding: 0 12px; border-bottom: 1px solid #e2e8f0; background: #fafbfc;
    overflow-x: auto;
  }
  .sc-tab {
    display: inline-flex; align-items: center; gap: 5px; height: 36px;
    border: none; background: none; font-size: 12px; font-weight: 700;
    color: #64748b; cursor: pointer; padding: 0 2px; margin-right: 16px; position: relative;
  }
  .sc-tab--active { color: ${BLUE}; }
  .sc-tab--active::after {
    content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
    height: 2px; border-radius: 2px 2px 0 0; background: ${BLUE};
  }
  .sc-tab-count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px; margin-left: 2px;
    border-radius: 999px; background: #dbeafe; color: ${BLUE};
    font-size: 10px; font-weight: 800;
  }
  .sc-tab--active .sc-tab-count { background: ${BLUE}; color: #fff; }
  .sc-body { padding: 12px 14px 10px; }
  .sc-detail-grid {
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px 14px; margin-bottom: 10px;
  }
  .sc-detail-item small {
    font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8;
    display: block; margin-bottom: 4px; letter-spacing: 0.03em;
  }
  .sc-detail-item strong {
    font-size: 11px; font-weight: 700; color: #1e293b;
    display: flex; align-items: center; gap: 6px;
    min-width: 0;
  }
  .sc-detail-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .sc-detail-icon {
    width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center; font-size: 10px;
  }
  .sc-detail-icon--blue { background: #dbeafe; color: #1d4ed8; }
  .sc-detail-icon--pink { background: #fce7ef; color: ${PINK}; }
  .sc-detail-icon--green { background: #d1fae5; color: #047857; }
  .sc-notes {
    border-top: 1px dashed #e2e8f0;
    display: flex; align-items: flex-start; gap: 8px;
    background: #fafbfc; margin: 0 -14px -10px; padding: 10px 14px 12px;
  }
  .sc-notes small { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 2px; }
  .sc-notes p { font-size: 11px; color: #334155; line-height: 1.45; margin: 0; }
  .st-tlm { display: flex; flex-direction: column; gap: 12px; }
  .st-tlm__head {
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }
  .st-tlm__head strong { display: block; font-size: 13px; font-weight: 800; color: #0f172a; }
  .st-tlm__head span { display: block; margin-top: 2px; font-size: 11px; font-weight: 600; color: #64748b; line-height: 1.4; }
  .st-tlm .sc-file-input { display: none; }
  .st-tlm__remove {
    margin-left: auto;
    border: none; background: transparent; color: #dc2626; font-size: 11px; font-weight: 800; cursor: pointer;
  }
  .sc-evidence-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .sc-evidence-card {
    border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px; background: #fafbfc;
  }
  .sc-evidence-card__title {
    font-size: 11px; font-weight: 700; color: #1e293b;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sc-evidence-icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .sc-evidence-icon--amber { background: #fef3c7; color: #d97706; }
  .sc-evidence-icon--green { background: #d1fae5; color: #059669; }
  .sc-evidence-type { color: #64748b; }
  .sc-evidence-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; min-height: 120px; padding: 24px;
    border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc;
    color: #64748b; text-align: center;
  }
  .sc-evidence-empty i { font-size: 28px; color: #94a3b8; }
  .sc-evidence-empty p { margin: 0; font-size: 12px; font-weight: 600; }
  .ev-pending { color: #d97706; font-size: 10px; font-weight: 600; }
  .sc-upload-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 4px; padding: 8px 12px; border-radius: 10px;
    border: 1px solid #bfdbfe; background: #eff6ff; color: ${BLUE};
    font-size: 11px; font-weight: 800; cursor: pointer;
  }
  .sc-upload-btn--full { width: 100%; justify-content: center; margin-top: auto; }
  .sc-foot {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 14px 22px; flex-wrap: wrap;
    border-top: 1px solid #f1f5f9; background: #fafbfc;
  }
  .sc-foot-right { display: flex; gap: 10px; flex-wrap: wrap; }
  .sc-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; border-radius: 12px; font-size: 12px; font-weight: 700;
    cursor: pointer; border: 1.5px solid #e2e8f0; background: #fff; color: #334155;
  }
  .sc-btn--outline { background: #fff; color: ${BLUE}; border-color: #bfdbfe; }
  .sc-btn--primary { background: ${BLUE}; color: #fff; border-color: ${BLUE}; }
  .sc-session-badge {
    display: inline-flex;
    margin-top: 4px; margin-right: 6px;
    border-radius: 999px; padding: 2px 8px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .sc-session-badge--plan { background: #dbeafe; color: #1d4ed8; }
  .sc-session-badge--done { background: #d1fae5; color: #047857; }
  .sc-done-panel {
    margin-top: 10px;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    padding: 10px 12px;
    background: #f8fafc;
  }
  .sc-done-panel--done {
    border-style: solid;
    border-color: #a7f3d0;
    background: #ecfdf5;
  }
  .sc-done-panel--att {
    border-style: solid;
    border-color: #bfdbfe;
    background: #eff6ff;
  }
  .sc-att-pills {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;
  }
  .sc-att-pills span {
    font-size: 10px; font-weight: 800; color: ${BLUE};
    background: #fff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 3px 8px;
  }
  .sc-done-panel__head {
    display: flex; align-items: flex-start; gap: 8px;
  }
  .sc-done-panel__head small {
    display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b;
  }
  .sc-done-panel__head strong { font-size: 12px; font-weight: 800; color: #0f172a; }
  .sc-done-panel__body { margin-top: 8px; padding-left: 28px; }
  .sc-done-panel__meta {
    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;
    font-size: 10px; font-weight: 700; color: #047857;
  }
  .sc-done-panel__remark {
    margin: 0; font-size: 12px; font-weight: 600; color: #334155; line-height: 1.45;
  }
  .sc-done-panel__empty {
    margin: 8px 0 0 28px; font-size: 11px; font-weight: 600; color: #64748b; line-height: 1.4;
  }
  .sc-foot-note {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; color: #64748b;
  }
  .sc-foot-note i { color: ${BLUE}; }

  .st-reg-docs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
    padding: 4px 2px 12px;
  }
  .st-reg-doc-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
  }
  .st-reg-doc-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  }
  .st-reg-doc-card__preview {
    position: relative;
    height: 200px;
    overflow: hidden;
    background: #f8f9fa;
  }
  .st-reg-doc-card__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .st-reg-doc-card:hover .st-reg-doc-card__image { transform: scale(1.05); }
  .st-reg-doc-card__icon,
  .st-reg-doc-card__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #ccc;
  }
  .st-reg-doc-card__empty i { font-size: 3rem; }
  .st-reg-doc-card__empty p,
  .st-reg-doc-card__icon p {
    margin: 10px 0 0;
    font-size: 12px;
    color: #999;
  }
  .st-reg-doc-card__icon i { color: #6c757d; font-size: 40px; }
  .st-reg-doc-card__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .st-reg-doc-card:hover .st-reg-doc-card__overlay { opacity: 1; }
  .st-reg-preview-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
  .st-reg-doc-card__info { padding: 1.5rem; }
  .st-reg-doc-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 0.75rem;
  }
  .st-reg-doc-card__header h4 {
    margin: 0;
    color: #333;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.3;
    flex: 1;
  }
  .st-reg-pill {
    border: none;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .st-reg-pill--upload {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: #fff;
    box-shadow: 0 3px 10px rgba(250, 112, 154, 0.4);
  }
  .st-reg-pill--verify {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
    box-shadow: 0 3px 10px rgba(255, 154, 158, 0.4);
  }
  .st-reg-doc-card__meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    color: #666;
    font-size: 0.85rem;
  }
  .st-reg-doc-card__meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  .st-reg-doc-card__meta i { color: #94a3b8; }

  .st-reg-modal-overlay {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
    padding: 16px;
  }
  .st-reg-modal {
    background: #fff;
    border-radius: 12px;
    width: 90%;
    max-width: 1100px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
  }
  .st-reg-modal__head {
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .st-reg-modal__head h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
  }
  .st-reg-modal__close {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  .st-reg-modal__close:hover { background: rgba(255,255,255,0.2); }
  .st-reg-modal__body {
    padding: 2rem;
    display: flex;
    gap: 2rem;
    overflow-y: auto;
    min-height: 0;
  }
  .st-reg-modal__preview {
    flex: 2;
    min-width: 0;
  }
  .st-reg-modal__preview-box {
    background: #f8f9fa;
    border-radius: 8px;
    min-height: 500px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed #dee2e6;
    overflow: hidden;
    position: relative;
  }
  .st-reg-modal__preview-box img {
    max-width: 100%;
    max-height: 90%;
    object-fit: contain;
  }
  .st-reg-modal__preview-box iframe,
  .st-reg-modal__preview-box video {
    width: 100%;
    height: 500px;
    border: none;
    background: #fff;
  }
  .st-reg-modal__empty {
    text-align: left;
    width: 100%;
    height: 100%;
    min-height: 460px;
    padding: 16px;
    color: #212529;
    font-size: 14px;
  }
  .st-reg-modal__side {
    flex: 1;
    min-width: 260px;
    max-width: 340px;
  }
  .st-reg-info-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e9ecef;
  }
  .st-reg-info-card h4 {
    margin: 0 0 1rem;
    color: #495057;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
  }
  .st-reg-info-row {
    margin-bottom: 0.75rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .st-reg-info-row strong {
    color: #495057;
    min-width: 120px;
    font-size: 0.92rem;
  }
  .st-reg-info-row span {
    color: #212529;
    font-size: 0.92rem;
  }
  .st-reg-modal__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .st-reg-btn {
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    width: 100%;
  }
  .st-reg-btn--approve { background: #198754; color: #fff; }
  .st-reg-btn--reject { background: #dc3545; color: #fff; }
  .st-reg-btn--ghost { background: #6c757d; color: #fff; }
  .st-reg-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .st-reg-reject {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1.5rem;
  }
  .st-reg-reject textarea {
    width: 100%;
    min-height: 100px;
    padding: 10px;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    resize: vertical;
    font-family: inherit;
    margin-bottom: 10px;
  }
  .st-reg-reject__btns { display: flex; gap: 8px; }

  @media (max-width: 900px) {
    .st-reg-modal__body { flex-direction: column; }
    .st-reg-modal__side { max-width: none; }
    .st-reg-modal__preview-box iframe, .st-reg-modal__preview-box video { height: 320px; }
  }

  @media (max-width: 1100px) {
    .st-dual-calendars { grid-template-columns: 1fr; }
    .st-filters__grid { grid-template-columns: 1fr; }
    .st-day-tt__layout { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .st-calendar__day { min-height: 50px; }
    .st-session-card__grid { grid-template-columns: 1fr; }
    .sc-detail-grid { grid-template-columns: 1fr; }
    .sc-evidence-grid { grid-template-columns: 1fr; }
    .sc-stats { display: none; }
    .sc-head { flex-wrap: wrap; }
  }

  /* ── Cute / modern visual pass (colors, shape, type only — no layout or logic changes) ── */
  .st-portal {
    background: #f6f8fc;
    font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
  }
  .st-header,
  .st-filters, .st-toolbar, .st-calendar, .st-day-tt,
  .st-session-card, .st-sessions-table-wrap, .st-empty-state {
    border-radius: 20px;
    border-color: #e8eef5;
    box-shadow: 0 4px 16px rgba(15,23,42,0.04);
  }
  .st-title { font-weight: 700; letter-spacing: -0.01em; }
  .st-role-badge { background: #fff1f4; color: ${PINK}; font-weight: 700; }
  .st-stat { border-radius: 16px; box-shadow: none; }
  .st-stat strong { font-weight: 700; }
  .st-calendar__title-bar, .st-day-tt__title-bar { box-shadow: none; }
  .st-calendar__day, .st-calendar__day--session { border-radius: 12px; }
  .st-btn, .st-filter-select, .st-table-input, .st-table-select,
  .st-header-user, .st-header-date { border-radius: 12px; }
  .st-status-pill, .st-table-type, .st-activity-badge, .st-type-badge {
    font-weight: 700;
  }
  .st-sessions-table__row--selected { box-shadow: inset 3px 0 0 ${PINK}; }
  .st-day-tt__side, .st-day-tt__side-item { border-radius: 14px; }

  /* ── Edit button + assignment modal ── */
  .st-btn--edit {
    background: #ecfdf5; color: ${GREEN}; border: 1px solid #bbf7d0;
    padding: 5px 10px; font-size: 10px;
  }
  .st-btn--edit:hover { background: #d1fae5; }
  .st-btn--primary {
    background: ${GREEN}; color: #fff;
  }
  .st-btn--primary:hover { background: #047857; }
  .st-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .st-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.45);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; z-index: 1000;
  }
  .st-modal {
    width: 100%; max-width: 400px; max-height: 88vh; overflow: hidden;
    background: #fff; border-radius: 18px; box-shadow: 0 20px 50px rgba(15,23,42,0.22);
    display: flex; flex-direction: column;
  }
  .st-modal--wide { max-width: 760px; }
  .st-modal__header {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 12px 14px; border-bottom: 1px solid #eef2f7;
  }
  .st-modal__header h3 {
    margin: 0; font-size: 14px; font-weight: 900; color: #0f172a;
    display: flex; align-items: center; gap: 6px;
  }
  .st-modal__header h3 i { color: ${GREEN}; }
  .st-modal__close {
    border: none; background: #f8fafc; color: #64748b; width: 24px; height: 24px;
    border-radius: 999px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  }
  .st-modal__close:hover { background: #eef2f7; color: #0f172a; }
  .st-modal__body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
  .st-modal__body--scroll { max-height: calc(88vh - 120px); }
  .st-modal__session-title {
    margin: 0 0 2px; font-size: 12px; font-weight: 800; color: #0f172a;
    background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; padding: 8px 10px;
  }
  .st-modal-field { display: flex; flex-direction: column; gap: 4px; }
  .st-modal-field span {
    font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
  }
  .st-modal__footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 10px 14px; border-top: 1px solid #eef2f7;
  }
`;

export default SeniorTrainerModule;

