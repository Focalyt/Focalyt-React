import axios from 'axios';
import { resolveMediaUrl } from '../../../../../utils/resolveMediaUrl';

export const PINK = '#fa5579';
export const BLUE = '#2563eb';
export const AMBER = '#d97706';
export const GREEN = '#059669';

export const AC_SESSIONS_STORAGE_PREFIX = 'acCoordinatorSessions:'; // legacy
export const SESSION_TYPE = { TOT: 'tot', STUDENT: 'student' };

export const WORKFLOW_STATUS = {
  SCHEDULED: 'Scheduled',
  SENT_TO_SENIOR: 'Sent to Senior Trainer',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export const STATUS_TONE = {
  [WORKFLOW_STATUS.SCHEDULED]: 'blue',
  [WORKFLOW_STATUS.SENT_TO_SENIOR]: 'amber',
  [WORKFLOW_STATUS.ASSIGNED]: 'purple',
  [WORKFLOW_STATUS.IN_PROGRESS]: 'teal',
  [WORKFLOW_STATUS.COMPLETED]: 'green',
};

export const getOptionLabel = (options = [], value) =>
  options.find((option) => String(option.value) === String(value))?.label || '';

export const mapApiOptions = (items = []) =>
  (items || [])
    .filter((item) => item && item._id && item.name)
    .map((item) => ({ value: String(item._id), label: item.name }));

export const getLinkedCourseOptions = (centerId, courseOptions = [], allCentersMeta = [], allCoursesMeta = []) => {
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

export const formatSessionDate = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-IN');
};

export const authHeaders = (token) => ({ 'x-auth': token });

export const fetchCoordinatorSessionsApi = async (backendUrl, token, options = {}) => {
  const {
    batchId = '',
    courseId = '',
    seniorTrainerId = '',
    includeCoursePlans = false,
    excludeScheduled = true,
  } = options;
  const params = new URLSearchParams();
  if (batchId) params.set('batch', batchId);
  if (courseId) params.set('course', courseId);
  if (seniorTrainerId) params.set('seniorTrainerId', seniorTrainerId);
  if (includeCoursePlans) params.set('includeCoursePlans', 'true');
  if (excludeScheduled) params.set('excludeScheduled', 'true');
  const res = await axios.get(`${backendUrl}/college/session-plans?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

export const patchCoordinatorSessionApi = async (backendUrl, token, sessionId, payload) => {
  const res = await axios.patch(`${backendUrl}/college/session-plans/${sessionId}`, payload, {
    headers: authHeaders(token),
  });
  if (!res.data?.status) throw new Error(res.data?.message || 'Failed to update session');
  return res.data.data;
};

export const addTotQuestionApi = async (backendUrl, token, sessionId, payload) => {
  const res = await axios.post(
    `${backendUrl}/college/session-plans/${sessionId}/tot-questions`,
    payload,
    { headers: authHeaders(token) }
  );
  if (!res.data?.status) throw new Error(res.data?.message || 'Failed to add MCQ');
  return res.data.data;
};

export const getTotSubmissionHistory = (session = {}) => {
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

export const getSessionActivities = (session = {}) => {
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

export const buildActivityHeadStyle = (activities = []) => {
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

export const countMaterials = (items = []) => {
  const mandatory = (items || []).filter((item) => item.requirement !== 'non_mandatory').length;
  return { total: (items || []).length, mandatory, optional: (items || []).length - mandatory };
};

export const DOC_BUCKET_URL = (process.env.REACT_APP_MIPIE_BUCKET_URL || '').replace(/\/$/, '');
export const getDocFileUrl = (fileUrl) => resolveMediaUrl(DOC_BUCKET_URL, fileUrl);

export const formatDocDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDocTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const getTotQuestionId = (question, index) => String(question?._id || question?.id || `tot-q-${index}`);
export const getTotQuestionMarks = (question) => {
  const marks = Number(question?.marks);
  return Number.isFinite(marks) && marks > 0 ? marks : 1;
};
export const TOT_PASS_PERCENT_DEFAULT = 40;
export const TOT_MARKS_MAX = 100;
export const toPositiveMarks = (value, emptyValue = 0) => {
  if (value === '' || value == null) return emptyValue;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : emptyValue;
};
export const toPassPercentage = (value, emptyValue = TOT_PASS_PERCENT_DEFAULT) => {
  if (value === '' || value == null) return emptyValue;
  const n = Number(value);
  if (!Number.isFinite(n)) return emptyValue;
  return Math.min(100, Math.max(1, Math.round(n)));
};
export const sumTotMarks = (questions = []) =>
  (questions || []).reduce((sum, question) => sum + toPositiveMarks(question?.marks, 0), 0);
export const getTotPassPercentage = (session) => toPassPercentage(session?.totPassPercentage, TOT_PASS_PERCENT_DEFAULT);

export const isUploadedMaterial = (item = {}) => (
  Boolean(item.fileUrl || item.fileName)
  || String(item.status || '').toLowerCase() === 'uploaded'
);

export const collectTrainerSubmittedDocs = (session = {}) => {
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

export const getTrainerDocFileType = (fileUrl = '', docType = '') => {
  const url = String(fileUrl).split('?')[0].toLowerCase();
  const type = String(docType || '').toLowerCase();
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/.test(url) || type === 'image') return 'image';
  if (url.endsWith('.pdf') || type.includes('pdf')) return 'pdf';
  if (/\.(mp4|mov|avi|mkv|webm)$/.test(url) || type === 'video') return 'video';
  return 'file';
};

export const normalizeDocReviewStatus = (status, uploaded) => {
  const value = String(status || '').toLowerCase();
  if (value === 'verified' || value === 'accepted' || value === 'approved') return 'Verified';
  if (value === 'rejected') return 'Rejected';
  if (uploaded || value === 'pending' || value === 'uploaded') return 'Pending';
  return 'Not Uploaded';
};

export const getTrainerMcqReview = (session = {}) => {
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

export const loadCoordinatorSessions = (batchId) => {
  if (!batchId) return [];
  try {
    const raw = localStorage.getItem(`${AC_SESSIONS_STORAGE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const filterSessionsForSeniorTrainer = (sessions = [], userId = '') => {
  // Show every plan that AC has referred (not still in Scheduled).
  // Optional assignee check is only used when caller wants strict ownership.
  return sessions.filter((session) => session.workflowStatus !== WORKFLOW_STATUS.SCHEDULED);
};

export const applyPathFilters = (sessions = [], filters = {}) => {
  let list = sessions;
  if (filters.center) {
    list = list.filter((session) => (
      String(session.center || '') === String(filters.center)
      || (
        (!session.center || session.center === 'null')
        && filters.course
        && String(session.course || '') === String(filters.course)
      )
    ));
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

export const persistCoordinatorSessions = () => {
  // no-op: sessions persist via /college/session-plans API
};

export const parseSessionDateKey = (session) => {
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

export const isTotSession = (session) => (
  session?.includeTot === true || session?.sessionType === SESSION_TYPE.TOT
);

export const appearsOnStudentCalendar = (session) => session?.sessionType !== SESSION_TYPE.TOT;

export const getTotDisplayTitle = (session = {}) => (
  session.totTitle?.trim() || `TOT – ${session.title || 'Session'}`
);

export const getTotDisplayTopic = (session = {}) => (
  session.totUseSameTopics !== false
    ? (session.topicCovered || '')
    : (session.totTopicCovered || session.topicCovered || '')
);

export const mapSessionForTotCalendar = (session = {}) => ({
  ...session,
  id: `${session.id}-tot`,
  sourceSessionId: session.id,
  title: getTotDisplayTitle(session),
  topicCovered: getTotDisplayTopic(session),
  trainingMethod: session.totUseSameTopics !== false
    ? (session.trainingMethod || '')
    : (session.totTrainingMethod || session.trainingMethod || ''),
});

export const resolveSessionSelectionId = (sessionId) => (
  String(sessionId).endsWith('-tot') ? String(sessionId).replace(/-tot$/, '') : sessionId
);

export const getSessionChipColor = (session) => {
  const activities = getSessionActivities(session);
  if (activities.length) return activities[0].color || BLUE;
  return session?.sessionType === SESSION_TYPE.TOT ? BLUE : GREEN;
};

export const getSessionDateValue = (session) => {
  const key = parseSessionDateKey(session);
  if (!key) return null;
  const date = new Date(`${key}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getSessionOutline = (session = {}) => {
  const unit = [session.unitNumber ? `Unit ${session.unitNumber}` : '', session.unitName].filter(Boolean).join(' · ');
  const chapter = [session.chapterNumber ? `Ch. ${session.chapterNumber}` : '', session.chapterName].filter(Boolean).join(' · ');
  return { unit, chapter, path: [unit, chapter].filter(Boolean).join(' › ') };
};

export const getSessionTypeLabel = (session) => {
  if (session.sessionType === SESSION_TYPE.TOT && session.includeTot !== true) return 'TOT';
  if (session.includeTot === true) return 'Student + TOT';
  return 'Student';
};

export const getSessionTypeBadgeKind = (session) => {
  if (session.sessionType === SESSION_TYPE.TOT && session.includeTot !== true) return 'tot';
  if (session.includeTot === true) return 'linked';
  return 'student';
};

export const TRAINER_SESSIONS_STORAGE_PREFIX = 'trainerModuleSessions:';

export const formatDoneAt = (value) => {
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

export const mergeTrainerDoneDetails = (session = {}) => {
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

export const DUMMY_SESSION_DONE = {
  isDone: true,
  remark: 'Session completed. Attendance marked, topic covered, and students practiced the assigned activity.',
  markedAt: formatDoneAt(new Date().toISOString()),
  markedBy: 'Rahul Sharma',
};

export const DUMMY_SESSION_ATTENDANCE = {
  marked: true,
  total: 30,
  present: 22,
  absent: 8,
  percentage: '73.3%',
};

export const getSessionAttendanceView = (session = {}) => {
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

export const getSessionDoneDetails = (session = {}) => {
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

export const getSessionActivityLabel = (session) => {
  const activities = getSessionActivities(session);
  if (activities.length) return activities.map((activity) => activity.name).join(', ');
  if (isTotSession(session) && session.totUseSameTopics === false && session.totTopicCovered) {
    return session.totTopicCovered;
  }
  return getSessionTypeLabel(session);
};

export const sortSessionsByDate = (list = []) => [...list].sort((a, b) => {
  const dateA = getSessionDateValue(a)?.getTime() || 0;
  const dateB = getSessionDateValue(b)?.getTime() || 0;
  if (dateA !== dateB) return dateA - dateB;
  return (a.startTime || '').localeCompare(b.startTime || '');
});

export const TOTAL_SESSION_SLOTS = 30;

/** Builds enough fixed slots to hold every session, in pages of `pageSize`.
 *  Page 1 = sessions 1-30, page 2 = 31-60, etc. Nothing gets silently dropped. */
export const buildPagedSessionSlots = (sessions = [], pageSize = TOTAL_SESSION_SLOTS) => {
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

export const SESSION_PALETTE = [
  '#2563eb', '#059669', '#d97706', '#db2777', '#7c3aed',
  '#0891b2', '#ea580c', '#4f46e5', '#16a34a', '#e11d48',
  '#0d9488', '#c026d3', '#ca8a04', '#1d4ed8', '#be123c',
];

export const toLocalDateKey = (dateValue) => {
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

export const getSessionAssignDateKey = (session = {}, assignmentDrafts = {}) => {
  const sourceId = resolveSessionSelectionId(session.id);
  const draft = assignmentDrafts[sourceId] || assignmentDrafts[session.id];
  return draft?.assignDate || parseSessionDateKey(session) || '';
};

export const getTimetableSessionColor = (session, index = 0) => {
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

export const getDayNameFromDate = (dateValue) => {
  if (!dateValue) return '—';
  const date = typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T12:00:00`)
    : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { weekday: 'long' });
};

export const createSeniorMcqDraft = () => ({
  id: `st-mcq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  marks: 1,
});

export const mapStandardTlmItems = (session) => (
  (Array.isArray(session?.standardTlm) ? session.standardTlm : [])
    .filter((item) => item && String(item.name || '').trim())
    .map((item, index) => ({
      id: String(item.id || item._id || `tlm-${index}`),
      name: String(item.name).trim(),
      type: item.type || 'PDF',
      fileName: item.fileName || '',
      fileUrl: item.fileUrl || '',
      uploadedAt: item.uploadedAt || '',
    }))
);

export const getTlmPreviewUrl = (fileUrl) => {
  if (!fileUrl) return '';
  const value = String(fileUrl);
  if (value.startsWith('blob:') || value.startsWith('data:') || /^https?:\/\//i.test(value)) return value;
  return getDocFileUrl(value);
};

export const ST_CSS = `
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
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    padding: 10px 12px 0; background: #fff; overflow-x: auto;
  }
  .sc-tab {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid #e2e8f0; background: #fff; color: #334155;
    font-size: 12px; font-weight: 700; cursor: pointer;
    padding: 8px 14px; border-radius: 999px; white-space: nowrap;
  }
  .sc-tab:hover { border-color: #fd2b5a; color: #fd2b5a; }
  .sc-tab--active {
    background: #fd2b5a; border-color: #fd2b5a; color: #fff;
  }
  .sc-tab--active:hover { color: #fff; }
  .sc-tab-count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    border-radius: 999px; background: #fce7ef; color: #fd2b5a;
    font-size: 10px; font-weight: 800;
  }
  .sc-tab--active .sc-tab-count { background: rgba(255,255,255,0.22); color: #fff; }
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
  .st-tlm__type {
    display: block;
    margin-top: 2px;
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .st-tlm__error {
    margin: 6px 0 0;
    font-size: 11px;
    font-weight: 700;
    color: #dc2626;
  }
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

  .tt { --a: #059669; --a-soft: #ecfdf5; background: #fff; border: 1px solid #e8eef5; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(15,23,42,.04); font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif; color: #0f172a; }
  .tt[data-tab='placement'] { --a: #2563eb; --a-soft: #eff6ff; }
  .tt[data-tab='club'] { --a: #fa5579; --a-soft: #fff1f4; }

  .tt__body { display: grid; grid-template-columns: 220px minmax(0, 1fr); align-items: start; }
  .tt__side { display: flex; flex-direction: column; gap: 8px; padding: 8px; background: #f8fafc; border-right: 1px solid #eef2f7; }
  .tt__main { min-width: 0; display: flex; flex-direction: column; }

  .tt__tabs { display: flex; flex-direction: column; gap: 6px; }
  .tt__tab { border: 1px solid #e2e8f0; background: #fff; padding: 8px 12px; border-radius: 12px; font: inherit; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 8px; text-align: left; }
  .tt__tab:hover { color: var(--a); border-color: var(--a); }
  .tt__tab--on { background: var(--a); border-color: var(--a); color: #fff; }
  .tt__tab--on:hover { color: #fff; }

  .tt__top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid #eef2f7; background: var(--a-soft); }
  .tt__title { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 800; }
  .tt__title i { color: var(--a); }
  .tt__summary { margin: 0; font-size: 11px; font-weight: 700; color: #64748b; }

  .tt__week { display: flex; align-items: stretch; gap: 6px; padding: 6px 10px; border-bottom: 1px solid #eef2f7; }
  .tt__days { flex: 1; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
  .tt__nav { width: 30px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; cursor: pointer; color: #475569; }
  .tt__nav:hover { background: var(--a-soft); color: var(--a); }
  .tt__day { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 3px 2px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; font: inherit; cursor: pointer; }
  .tt__day small { font-size: 10px; font-weight: 700; color: #94a3b8; }
  .tt__day strong { font-size: 14px; font-weight: 800; line-height: 1.1; }
  .tt__day span { font-size: 10px; font-weight: 700; color: #94a3b8; }
  .tt__day--on { background: var(--a); border-color: var(--a); color: #fff; }
  .tt__day--on small, .tt__day--on span { color: rgba(255,255,255,.85); }
  .tt__jump { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 8px; font: inherit; font-size: 12px; color: #334155; }

  .tt__board { display: flex; flex-direction: row; align-items: flex-start; gap: 6px; overflow-x: auto; padding: 8px 10px 10px; }
  .tt__col { position: relative; flex: 0 0 148px; display: flex; flex-direction: column; gap: 4px; padding: 6px 18px 6px 8px; border: 1px solid #eef2f7; border-radius: 12px; background: #fff; }
  .tt__col--break { flex-basis: 118px; background: #fffbeb; border-color: #fde68a; justify-content: flex-start; }
  .tt__composer { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px; padding: 6px 10px; border-bottom: 1px solid #eef2f7; }
  .tt__composer label { display: flex; flex-direction: column; gap: 2px; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
  .tt__composer input, .tt__composer select { width: 105px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px 6px; font: inherit; font-size: 12px; font-weight: 700; color: #0f172a; background: #fff; }
  .tt__plan-note { margin: 0; flex: 1 1 220px; font-size: 11px; font-weight: 700; color: #64748b; }
  .tt__mini { border: 1px solid #e2e8f0; background: #fff; color: #334155; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
  .tt__mini:hover { border-color: var(--a); color: var(--a); }
  .tt__mini--break { background: #fffbeb; border-color: #fde68a; color: #b45309; }
  .tt__mini--break:hover { background: #fef3c7; color: #b45309; }
  .tt__mini--go { background: var(--a); border-color: var(--a); color: #fff; }
  .tt__mini--go:hover { color: #fff; }
  .tt__mini:disabled { opacity: 0.5; cursor: not-allowed; }
  .tt__draft { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .tt__draft span { font-size: 12px; font-weight: 800; }
  .tt__draft label { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #64748b; }
  .tt__draft input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 2px 4px; font: inherit; font-size: 12px; font-weight: 700; color: #0f172a; }
  .tt__clocks { display: flex; flex-direction: row; gap: 6px; }
  .tt__clock { display: flex; flex-direction: column; gap: 2px; font-size: 10px; font-weight: 700; color: #64748b; }
  .tt__clock input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3px 4px; font: inherit; font-size: 12px; font-weight: 700; color: #0f172a; background: #fff; }
  .tt__clock input:disabled { background: #f8fafc; color: #64748b; cursor: not-allowed; }
  .tt__empty { margin: 0; min-width: 220px; align-self: center; font-size: 12px; font-weight: 700; color: #64748b; line-height: 1.45; }
  .tt__label { width: 100%; border: none; background: transparent; font: inherit; font-size: 13px; font-weight: 800; color: #0f172a; padding: 0; }
  .tt__label:focus { outline: none; }
  .tt__col-remove { position: absolute; top: 6px; right: 6px; width: 18px; height: 18px; border: none; border-radius: 50%; background: #f1f5f9; color: #64748b; cursor: pointer; line-height: 16px; }
  .tt__col-remove:hover { background: #fee2e2; color: #dc2626; }
  .tt__time strong { font-size: 13px; font-weight: 800; }
  .tt__time small { font-size: 11px; color: #94a3b8; font-weight: 600; }
  .tt__meta { display: flex; flex-direction: column; gap: 1px; }
  .tt__meta strong { font-size: 12px; font-weight: 800; }
  .tt__meta small { font-size: 11px; color: #64748b; font-weight: 600; }
  .tt__break { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; margin-top: 8px; font-size: 12px; font-weight: 700; color: #b45309; }
  .tt__break small { font-weight: 600; color: #d97706; }

  .tt__slot { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .tt__free { min-height: 28px; padding: 4px 6px; border: 1.5px dashed #dbe3ec; background: #fafbfc; border-radius: 8px; font: inherit; font-size: 11px; font-weight: 700; color: #94a3b8; cursor: default; }
  .tt__free--ready { border-color: var(--a); background: var(--a-soft); color: var(--a); cursor: pointer; }
  .tt__free--ready:hover { background: #fff; }

  .tt__chip { position: relative; display: flex; flex-direction: column; gap: 1px; text-align: left; padding: 6px 18px 6px 6px; border: 1px solid #e2e8f0; border-top: 3px solid var(--a); border-radius: 8px; background: var(--a-soft); font: inherit; cursor: pointer; }
  .tt__chip--on { box-shadow: 0 0 0 1.5px var(--a); }
  .tt__chip-title { font-size: 12px; font-weight: 800; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tt__chip-sub { font-size: 10px; font-weight: 600; color: #64748b; }
  .tt__chip-x { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; line-height: 16px; text-align: center; border-radius: 50%; color: #94a3b8; font-size: 14px; }
  .tt__chip-x:hover { background: #fee2e2; color: #dc2626; }

  .tt__pool { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 8px; overflow-y: auto; }
  .tt__pool h4 { margin: 0 0 4px; font-size: 13px; font-weight: 800; }
  .tt__pool-hint { margin: 0 0 8px; font-size: 11px; font-weight: 600; color: #64748b; line-height: 1.4; }
  .tt__outline { display: flex; flex-direction: column; gap: 4px; }
  .tt__outline + .tt__outline { margin-top: 8px; }
  .tt__outline-unit { font-size: 11px; font-weight: 800; color: #0f172a; }
  .tt__outline-chapter { margin: 2px 0 2px 8px; font-size: 10px; font-weight: 700; color: #64748b; }
  .tt__outline-chapter-wrap ul { margin-left: 8px; }
  .tt__pool ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .tt__pool-item { width: 100%; text-align: left; display: flex; flex-direction: column; gap: 1px; padding: 7px 9px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; font: inherit; cursor: pointer; }
  .tt__pool-item strong { font-size: 12px; font-weight: 800; }
  .tt__pool-item small { font-size: 10px; font-weight: 600; color: #94a3b8; }
  .tt__pool-item--on { border-color: var(--a); background: var(--a-soft); box-shadow: 0 0 0 1.5px var(--a); }

  .tt button:focus-visible, .tt__jump:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; }

  @media (max-width: 900px) {
    .tt__body { grid-template-columns: 1fr; }
    .tt__side { border-right: none; border-bottom: 1px solid #eef2f7; }
    .tt__tabs { flex-direction: row; flex-wrap: wrap; }
    .tt__jump { display: none; }
  }
`;
