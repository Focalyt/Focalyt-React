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
  counsellor: [],
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
  counsellor: '',
  counsellorName: '',
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
  department: '',
  project: '',
  center: '',
  course: '',
  batch: '',
  courseTrade: '',
  batchCode: '',
  trainerName: '',
  counsellor: '',
  counsellorName: '',
  notes: '',
  evidenceDocs: [],
});
const getOptionLabel = (options = [], value) =>
  options.find((option) => String(option.value) === String(value))?.label || '';

const SESSIONS_STORAGE_PREFIX = 'trainerModuleSessions:';

const loadStoredSessions = (batchId) => {
  if (!batchId) return [];
  try {
    const raw = localStorage.getItem(`${SESSIONS_STORAGE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistStoredSessions = (batchId, list) => {
  if (!batchId) return;
  localStorage.setItem(`${SESSIONS_STORAGE_PREFIX}${batchId}`, JSON.stringify(list));
};

const ATTENDANCE_STORAGE_PREFIX = 'trainerModuleAttendance:';

const loadStoredAttendance = (batchId) => {
  if (!batchId) return {};
  try {
    const raw = localStorage.getItem(`${ATTENDANCE_STORAGE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistStoredAttendance = (batchId, records) => {
  if (!batchId) return;
  localStorage.setItem(`${ATTENDANCE_STORAGE_PREFIX}${batchId}`, JSON.stringify(records || {}));
};

const computeStudentBatchAttendance = (studentId, sessions = [], attendanceRecordsBySession = {}) => {
  let markedSessions = 0;
  let presentSessions = 0;
  let absentSessions = 0;

  sessions.forEach((session) => {
    const rows = attendanceRecordsBySession[session.id];
    if (!rows?.length) return;

    const row = rows.find((entry) => String(entry.id) === String(studentId));
    if (!row || row.status === 'Not Marked') return;

    markedSessions += 1;
    if (row.status === 'Present') presentSessions += 1;
    if (row.status === 'Absent') absentSessions += 1;
  });

  const percentage = markedSessions > 0
    ? ((presentSessions / markedSessions) * 100).toFixed(1)
    : null;

  return { markedSessions, presentSessions, absentSessions, percentage };
};

const computeBatchAttendanceSummary = (students = [], sessions = [], attendanceRecordsBySession = {}) => {
  const studentStats = students.map((student) =>
    computeStudentBatchAttendance(student.id, sessions, attendanceRecordsBySession)
  );
  const tracked = studentStats.filter((stat) => stat.markedSessions > 0);
  const sessionsWithAttendance = sessions.filter(
    (session) => (attendanceRecordsBySession[session.id] || []).some(
      (row) => row.status === 'Present' || row.status === 'Absent'
    )
  ).length;

  if (!tracked.length) {
    const admissionAvg = students.length
      ? students.reduce((sum, student) => sum + (parseFloat(student.attendance) || 0), 0) / students.length
      : 0;
    return {
      source: 'admission',
      average: admissionAvg.toFixed(1),
      sessionsMarked: sessionsWithAttendance,
      totalSessions: sessions.length,
    };
  }

  const average = tracked.reduce((sum, stat) => sum + Number(stat.percentage), 0) / tracked.length;
  return {
    source: 'sessions',
    average: average.toFixed(1),
    sessionsMarked: sessionsWithAttendance,
    totalSessions: sessions.length,
    trackedStudents: tracked.length,
  };
};

const resolveSessionBatchId = (session, fallbackBatchId = '') =>
  session?.batch || fallbackBatchId || '';

const mergeBatchSessions = (batchId, currentSessions = []) => {
  if (!batchId) return [];
  const stored = loadStoredSessions(batchId);
  const byId = new Map(stored.map((session) => [session.id, session]));
  currentSessions.forEach((session) => {
    if (!session?.id) return;
    if (session.batch && String(session.batch) !== String(batchId)) return;
    byId.set(session.id, session);
  });
  return Array.from(byId.values());
};

const formatProfileDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN');
};

const mapAppliedCourseToStudent = (profile) => {
  const candidate = profile._candidate || {};
  const batch = profile.batch || profile._batch || {};
  const course = profile._course || {};
  const center = profile._center || {};
  const regular = profile.attendance?.regularPeriod || {};
  const zero = profile.attendance?.zeroPeriod || {};
  const att = regular.attendancePercentage ?? zero.attendancePercentage ?? 0;
  const candidateId = candidate._id ? String(candidate._id) : '';
  const mobile = candidate.mobile || profile.mobile || '-';
  const name = candidate.name || 'Unknown';
  const admissionDate = formatProfileDate(profile.admissionDate);
  const batchAssignedDate = formatProfileDate(profile.batchAssignedAt);
  const leadCreatedDate = formatProfileDate(profile.createdAt);
  const enrolledDate = admissionDate || batchAssignedDate || leadCreatedDate || '-';
  const enrolledDateLabel = admissionDate
    ? 'Admission Date'
    : batchAssignedDate
      ? 'Batch Assigned'
      : 'Lead Since';

  return {
    id: profile._id,
    appliedCourseId: profile._id ? String(profile._id) : '',
    candidateId,
    candidateKey: candidateId || `${mobile}-${name}`.trim().toLowerCase(),
    name,
    mobile,
    attendance: `${att || 0}%`,
    status: profile.dropout ? 'Dropout' : (profile.isBatchFreeze ? 'Frozen' : 'Active'),
    email: candidate.email || profile.email || '',
    batchCode: batch.name || profile.batchName || course.batchName || '-',
    batchId: batch._id ? String(batch._id) : (profile.batch ? String(profile.batch) : ''),
    course: course.name || profile.courseName || '-',
    courseId: course._id ? String(course._id) : (profile._course ? String(profile._course) : ''),
    center: center.name || profile.centerName || '-',
    centerId: center._id ? String(center._id) : (profile._center ? String(profile._center) : ''),
    project: course.projectName || profile.projectName || '-',
    projectType: course.typeOfProject || '-',
    sector: profile.sector
      || (typeof course.sectors === 'string' ? course.sectors : course.sectors?.[0]?.name)
      || '-',
    leadStatus: profile._leadStatus?.title || profile._leadStatus?.name || '-',
    state: candidate.personalInfo?.currentAddress?.state || '-',
    city: candidate.personalInfo?.currentAddress?.city || '-',
    leadCreatedDate: leadCreatedDate || '-',
    enrolledDate,
    enrolledDateLabel,
    totalSessions: regular.totalSessions || 0,
    presentSessions: regular.attendedSessions || 0,
    absentSessions: Math.max(0, (regular.totalSessions || 0) - (regular.attendedSessions || 0)),
    assessmentScore: 0,
    participationScore: 0,
    engagementScore: 0,
    practicalScore: 0,
    trainerRemark: '',
    sessionHistory: [],
  };
};

const enrichStudentsWithEnrollmentMeta = (students = []) => {
  const groups = new Map();
  students.forEach((student) => {
    const key = student.candidateKey || student.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(student);
  });

  return students.map((student) => {
    const group = groups.get(student.candidateKey || student.id) || [student];
    const otherEnrollments = group.filter((item) => item.id !== student.id);

    return {
      ...student,
      enrollmentCount: group.length,
      isMultiCourseCandidate: group.length > 1,
      otherEnrollments: otherEnrollments.map((item) => ({
        course: item.course,
        batchCode: item.batchCode,
        center: item.center,
        appliedCourseId: item.appliedCourseId,
      })),
    };
  });
};

const buildSessionContextFromFilters = (filters, {
  verticalOptions,
  projectOptions,
  centerOptions,
  courseOptions,
  batchOptions,
  trainerName,
}) => ({
  department: filters.department || '',
  project: filters.project || '',
  center: filters.center || '',
  course: filters.course || '',
  batch: filters.batch || '',
  counsellor: filters.counsellor || '',
  courseTrade: getOptionLabel(courseOptions, filters.course),
  batchCode: getOptionLabel(batchOptions, filters.batch),
  centerName: getOptionLabel(centerOptions, filters.center),
  projectName: getOptionLabel(projectOptions, filters.project),
  departmentName: getOptionLabel(verticalOptions, filters.department),
  trainerName: trainerName || '',
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
    departmentName: draft.departmentName || basicDetails.departmentName,
    projectName: draft.projectName || basicDetails.projectName,
    centerName: draft.centerName || basicDetails.centerName,
    attendance,
    evidenceDocs,
  };
};

const DUMMY_STUDENTS = [
  {
    id: 'ST01',
    name: 'Akash Gaurav',
    mobile: '6280484211',
    attendance: '92%',
    status: 'Active',
    email: 'akash.gaurav@email.com',
    batchCode: 'BATCH-RS-2024-01',
    course: 'Retail Sales Associate',
    center: 'Delhi Centre – Rohini',
    enrolledDate: '01/04/2026',
    totalSessions: 24,
    presentSessions: 22,
    absentSessions: 2,
    assessmentScore: 78,
    participationScore: 90,
    engagementScore: 88,
    practicalScore: 82,
    trainerRemark: 'Strong in customer handling and group activities.',
    sessionHistory: [
      { date: '22/06/2026', title: 'Morning Batch – Retail Sales', status: 'Present', topic: 'Customer handling' },
      { date: '21/06/2026', title: 'Assessment Review', status: 'Present', topic: 'Assessment discussion' },
      { date: '20/06/2026', title: 'Practical – Customer Handling', status: 'Absent', topic: 'Role play' },
    ],
  },
  {
    id: 'ST02',
    name: 'Priya Verma',
    mobile: '9876512340',
    attendance: '88%',
    status: 'Active',
    email: 'priya.verma@email.com',
    batchCode: 'BATCH-RS-2024-01',
    course: 'Retail Sales Associate',
    center: 'Delhi Centre – Rohini',
    enrolledDate: '05/04/2026',
    totalSessions: 24,
    presentSessions: 21,
    absentSessions: 3,
    assessmentScore: 84,
    participationScore: 86,
    engagementScore: 82,
    practicalScore: 80,
    trainerRemark: 'Consistent performer with good communication skills.',
    sessionHistory: [
      { date: '22/06/2026', title: 'Morning Batch – Retail Sales', status: 'Present', topic: 'Customer handling' },
      { date: '21/06/2026', title: 'Assessment Review', status: 'Present', topic: 'Assessment discussion' },
      { date: '20/06/2026', title: 'Practical – Customer Handling', status: 'Present', topic: 'Role play' },
    ],
  },
  {
    id: 'ST03',
    name: 'Rohit Singh',
    mobile: '9123456780',
    attendance: '76%',
    status: 'At Risk',
    email: 'rohit.singh@email.com',
    batchCode: 'BATCH-RS-2024-01',
    course: 'Retail Sales Associate',
    center: 'Delhi Centre – Rohini',
    enrolledDate: '10/04/2026',
    totalSessions: 24,
    presentSessions: 18,
    absentSessions: 6,
    assessmentScore: 62,
    participationScore: 68,
    engagementScore: 60,
    practicalScore: 58,
    trainerRemark: 'Needs follow-up on attendance and practical participation.',
    sessionHistory: [
      { date: '22/06/2026', title: 'Morning Batch – Retail Sales', status: 'Absent', topic: 'Customer handling' },
      { date: '21/06/2026', title: 'Assessment Review', status: 'Present', topic: 'Assessment discussion' },
      { date: '20/06/2026', title: 'Practical – Customer Handling', status: 'Not Marked', topic: 'Role play' },
    ],
  },
];
const buildStudentSessionHistory = (student, sessions = [], attendanceRecordsBySession = {}) => {
  const history = [];

  sessions.forEach((session) => {
    const rows = attendanceRecordsBySession[session.id];
    if (!rows?.length) return;

    const row = rows.find((entry) => entry.id === student.id)
      || rows.find((entry) => entry.name === student.name);
    if (!row) return;

    history.push({
      date: session.date || formatSessionDate(session.sessionDate),
      title: session.title,
      status: row.status,
      topic: session.topicCovered || session.title,
    });
  });

  return history.length ? history : (student.sessionHistory || []);
};
const getStudentPerformanceProfile = (student, sessions, attendanceRecordsBySession, basicDetails) => {
  if (!student) return null;

  const batchAttendance = computeStudentBatchAttendance(student.id, sessions, attendanceRecordsBySession);
  const sessionHistory = buildStudentSessionHistory(student, sessions, attendanceRecordsBySession);
  const presentFromHistory = sessionHistory.filter((entry) => entry.status === 'Present').length;
  const absentFromHistory = sessionHistory.filter((entry) => entry.status === 'Absent').length;
  const attendanceDisplay = batchAttendance.percentage != null
    ? `${batchAttendance.percentage}%`
    : student.attendance;
  const attendanceNum = parseFloat(batchAttendance.percentage ?? student.attendance) || 0;

  return {
    ...student,
    batchCode: student.batchCode || basicDetails.batchCode,
    course: student.course || basicDetails.courseTrade,
    center: student.center || basicDetails.centerName,
    attendance: attendanceDisplay,
    attendanceNum,
    attLevel: getAttendanceLevel(attendanceDisplay),
    performanceLabel: getPerformanceLabel(getAttendanceLevel(attendanceDisplay)),
    totalSessions: batchAttendance.markedSessions || student.totalSessions || sessionHistory.length || 0,
    presentSessions: batchAttendance.presentSessions || student.presentSessions || presentFromHistory,
    absentSessions: batchAttendance.absentSessions || student.absentSessions || absentFromHistory,
    sessionHistory,
    metrics: [
      { label: 'Class Participation', value: student.participationScore, icon: 'fa-users', tone: 'blue' },
      { label: 'Engagement', value: student.engagementScore, icon: 'fa-bolt', tone: 'pink' },
      { label: 'Internal Assessment', value: student.assessmentScore, icon: 'fa-file-alt', tone: 'green' },
      { label: 'Practical Performance', value: student.practicalScore, icon: 'fa-tools', tone: 'amber' },
    ],
  };
};
const PERFORMANCE_FIELDS = [
  { key: 'participationScore', label: 'Class Participation', icon: 'fa-users', placeholder: 'Enter class participation %' },
  { key: 'engagementScore', label: 'Engagement', icon: 'fa-bolt', placeholder: 'Enter engagement %' },
  { key: 'assessmentScore', label: 'Internal Assessment', icon: 'fa-file-alt', placeholder: 'Enter assessment %' },
  { key: 'practicalScore', label: 'Practical Performance', icon: 'fa-tools', placeholder: 'Enter practical score %' },
];
const createPerformanceDraft = (student) => ({
  studentId: student?.id || '',
  studentName: student?.name || '',
  participationScore: student?.participationScore ?? '',
  engagementScore: student?.engagementScore ?? '',
  assessmentScore: student?.assessmentScore ?? '',
  practicalScore: student?.practicalScore ?? '',
  trainerRemark: student?.trainerRemark || '',
});
const hasPerformanceData = (student) =>
  PERFORMANCE_FIELDS.some(({ key }) => student?.[key] !== '' && student?.[key] != null)
  || Boolean(student?.trainerRemark?.trim());
const clampScore = (value) => {
  if (value === '' || value == null) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return Math.min(100, Math.max(0, Math.round(num)));
};
const formatMetricValue = (value) => (value !== '' && value != null ? `${value}%` : 'Not added');

const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Not Marked'];
const attendanceTone = (status) => {
  if (status === 'Present') return 'present';
  if (status === 'Absent') return 'absent';
  return 'not-marked';
};
const createSessionAttendanceRows = (session, students = []) => {
  if (!students.length) return [];

  const presentCount = Math.min(Number(session?.presentCandidates) || 0, students.length);
  const absentCount = Math.min(Number(session?.absentCandidates) || 0, students.length - presentCount);

  return students.map((student, index) => {
    const status = index < presentCount
      ? 'Present'
      : index < presentCount + absentCount
        ? 'Absent'
        : 'Not Marked';

    return {
      id: student.id,
      name: student.name,
      mobile: student.mobile || '-',
      status,
      remarks: '',
      attendancePercent: student.attendance || '-',
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
const getStudentOverallAttendance = (studentId, students = [], sessions = [], attendanceRecordsBySession = {}) => {
  const batchAttendance = computeStudentBatchAttendance(studentId, sessions, attendanceRecordsBySession);
  if (batchAttendance.percentage != null) {
    return `${batchAttendance.percentage}% (${batchAttendance.presentSessions}/${batchAttendance.markedSessions})`;
  }
  return students.find((student) => student.id === studentId)?.attendance || '-';
};
const AttendancePercentCell = ({ row, students, sessions, attendanceRecordsBySession }) => (
  <td className="attendance-percent-col">
    <span className="attendance-percent-value">
      {getStudentOverallAttendance(row.id, students, sessions, attendanceRecordsBySession)}
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
const getAttendanceLevel = (attendance = '') => {
  const num = parseFloat(attendance) || 0;
  if (num >= 85) return 'high';
  if (num >= 70) return 'mid';
  return 'low';
};
const getPerformanceLabel = (level) => {
  if (level === 'high') return 'Excellent';
  if (level === 'mid') return 'Good';
  return 'Needs Focus';
};

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

const SessionFormSelect = ({ label, value, onChange, options = [], placeholder = 'All' }) => (
  <label className="session-field">
    <span>{label}</span>
    <select className="dbr-select session-field__control" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </label>
);



const SessionEmptyState = ({ onCreateSession }) => (
  <div className="tm-empty tm-empty--session-create">
    <i className="fas fa-laptop" />
    <p>No sessions yet for this batch.</p>
    <button type="button" className="tm-create-session-btn" onClick={onCreateSession}>
      <i className="fas fa-plus" /> Create first session
    </button>
  </div>
);

const SESSION_PATH_STEPS = [
  { key: 'department', label: 'Department', icon: 'fa-sitemap', step: 1, hint: 'Select a department to start' },
  { key: 'project', label: 'Project', icon: 'fa-project-diagram', step: 2, hint: 'Projects under selected department' },
  { key: 'center', label: 'Center', icon: 'fa-building', step: 3, hint: 'Centers linked to this project' },
  { key: 'course', label: 'Course', icon: 'fa-graduation-cap', step: 4, hint: 'Courses available at this center' },
  { key: 'batch', label: 'Batch', icon: 'fa-users', step: 5, hint: 'Select batch to manage sessions' },
];

const SessionPathPicker = ({
  filters,
  currentStep,
  options,
  loading,
  getLabel,
  onSelect,
  onBack,
  onReset,
}) => {
  const stepMeta = SESSION_PATH_STEPS.find((step) => step.key === currentStep) || SESSION_PATH_STEPS[0];
  const completedSteps = SESSION_PATH_STEPS.filter(({ key }) => filters[key]);

  return (
    <section className="tm-path-picker">
      <div className="tm-path-picker__intro">
        <div>
          <span className="tm-path-picker__badge">Step {stepMeta.step} of 5</span>
          <h3>Select {stepMeta.label}</h3>
          <p>{stepMeta.hint}</p>
        </div>
        {completedSteps.length > 0 && (
          <div className="tm-path-picker__actions">
            <button type="button" className="tm-path-picker__back" onClick={onBack}>
              <i className="fas fa-arrow-left" /> Back
            </button>
            <button type="button" className="tm-path-picker__reset" onClick={onReset}>
              Start over
            </button>
          </div>
        )}
      </div>

      {completedSteps.length > 0 && (
        <div className="tm-path-picker__trail">
          {completedSteps.map(({ key, label, icon }, index) => (
            <React.Fragment key={key}>
              {index > 0 && <i className="fas fa-chevron-right" />}
              <span className="tm-path-picker__crumb">
                <i className={`fas ${icon}`} />
                <em>{label}</em>
                <strong>{getLabel(key, filters[key])}</strong>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {loading ? (
        <div className="tm-path-picker__loading">
          <i className="fas fa-spinner fa-spin" />
          <p>Loading {stepMeta.label.toLowerCase()}...</p>
        </div>
      ) : options.length === 0 ? (
        <div className="tm-path-picker__empty">
          <i className={`fas ${stepMeta.icon}`} />
          <p>No {stepMeta.label.toLowerCase()} found for this selection.</p>
          {completedSteps.length > 0 && (
            <button type="button" className="tm-path-picker__back" onClick={onBack}>
              <i className="fas fa-arrow-left" /> Go back
            </button>
          )}
        </div>
      ) : (
        <div className="tm-path-picker__grid">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="tm-path-card-btn"
              onClick={() => onSelect(currentStep, option.value)}
            >
              <div className="tm-path-card-btn__icon">
                <i className={`fas ${stepMeta.icon}`} />
              </div>
              <strong>{option.label}</strong>
              <span>Select {stepMeta.label.toLowerCase()}</span>
              <i className="fas fa-arrow-right tm-path-card-btn__arrow" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

const SessionFormFields = ({
  draft,
  isEdit,
  onFieldChange,
  onEvidenceChange,
  onAddEvidence,
  onRemoveEvidence,
  readOnlyTrainer = false,
}) => {
  const ph = (text) => (isEdit ? undefined : text);

  return (
    <>
      <div className="session-form-grid">
        <label className="session-field">
          <span>Session title</span>
          <input className="dbr-input session-field__control" placeholder={ph('Enter session title')} value={draft.title} onChange={(e) => onFieldChange('title', e.target.value)} />
        </label>
        <label className="session-field">
          <span>Topic covered</span>
          <input className="dbr-input session-field__control" placeholder={ph('Enter topic covered')} value={draft.topicCovered} onChange={(e) => onFieldChange('topicCovered', e.target.value)} />
        </label>
        <label className="session-field">
          <span>Training method</span>
          <input className="dbr-input session-field__control" placeholder={ph('Enter training method')} value={draft.trainingMethod} onChange={(e) => onFieldChange('trainingMethod', e.target.value)} />
        </label>
        <label className="session-field">
          <span>Date</span>
          <input type="date" className="dbr-input session-field__control session-field__control--date" value={draft.sessionDate} onChange={(e) => onFieldChange('sessionDate', e.target.value)} />
        </label>
        <label className="session-field">
          <span>Start time</span>
          <input type="time" className="dbr-input session-field__control session-field__control--time" value={draft.startTime} onChange={(e) => onFieldChange('startTime', e.target.value)} />
        </label>
        <label className="session-field">
          <span>End time</span>
          <input type="time" className="dbr-input session-field__control session-field__control--time" value={draft.endTime} onChange={(e) => onFieldChange('endTime', e.target.value)} />
        </label>
        <label className="session-field">
          <span>Trainer name</span>
          <input className="dbr-input session-field__control" placeholder={ph('Enter trainer name')} value={draft.trainerName} onChange={(e) => onFieldChange('trainerName', e.target.value)} readOnly={readOnlyTrainer} />
        </label>
      </div>

      {isEdit && (
        <>
          <label className="session-field session-field--full">
            <span>Additional notes</span>
            <textarea className="dbr-textarea session-field__control" rows="3" placeholder="Enter additional notes..." value={draft.notes} onChange={(e) => onFieldChange('notes', e.target.value)} />
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
                <input className="dbr-input session-field__control" placeholder="Document name" value={doc.name} onChange={(e) => onEvidenceChange(index, 'name', e.target.value)} />
                <select className="dbr-select session-field__control" value={doc.type} onChange={(e) => onEvidenceChange(index, 'type', e.target.value)}>
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
        </>
      )}
    </>
  );
};

const SessionAddPanel = ({
  draft,
  batchLabel,
  studentCount,
  onClose,
  onSave,
  onFieldChange,
}) => {
  if (!draft) return null;

  return (
    <div className="session-add-panel">
      <div className="session-add-panel__head">
        <div>
          <h4>Add Session</h4>
          <p>{batchLabel} · {studentCount} students</p>
        </div>
        <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="session-add-panel__body">
        <SessionFormFields
          draft={draft}
          isEdit={false}
          onFieldChange={onFieldChange}
          readOnlyTrainer
        />
      </div>
      <div className="session-add-panel__foot">
        <button type="button" className="sc-btn" onClick={onClose}>Cancel</button>
        <button type="button" className="sc-btn sc-btn--primary" onClick={onSave}>
          <i className="fas fa-save" /> Save Session
        </button>
      </div>
    </div>
  );
};

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



const StudentCard = ({ student, batchAttendance, onView, onAttendance, onAddPerformance }) => {
  const attendanceLabel = batchAttendance?.percentage != null
    ? `${batchAttendance.percentage}%`
    : student.attendance;
  const attendanceHint = batchAttendance?.markedSessions
    ? `${batchAttendance.presentSessions}/${batchAttendance.markedSessions} sessions marked`
    : 'From admission record';
  const attendanceNum = parseFloat(batchAttendance?.percentage ?? student.attendance) || 0;
  const attLevel = getAttendanceLevel(attendanceLabel);
  const statusTone = student.status === 'Active' ? 'active' : 'risk';
  const performanceAdded = hasPerformanceData(student);
  const detailItems = [
    ['fa-phone', 'Mobile', student.mobile],
    ['fa-envelope', 'Email', student.email || '-'],
    ['fa-graduation-cap', 'Course', student.course],
    ['fa-users', 'Batch', student.batchCode],
    ['fa-building', 'Center', student.center],
    ['fa-map-marker-alt', 'Location', [student.city, student.state].filter((v) => v && v !== '-').join(', ') || '-'],
    ['fa-project-diagram', 'Project', student.project || '-'],
    [student.enrolledDateLabel === 'Lead Since' ? 'fa-calendar' : 'fa-calendar-check', student.enrolledDateLabel, student.enrolledDate || '-'],
  ];

  return (
    <article className={`st-card${student.isMultiCourseCandidate ? ' st-card--multi' : ''}`}>
      <div className="st-card__head">
        <div className="st-card__identity">
          <div className="st-card__avatar">{getInitials(student.name)}</div>
          <div className="st-card__title-wrap">
            <h4 className="st-card__name">{student.name}</h4>
            <span className="st-card__course-line">
              <i className="fas fa-graduation-cap" /> {student.course}
            </span>
            <span className="st-card__id">
              {student.batchCode} · {student.center}
              {student.leadStatus && student.leadStatus !== '-' ? ` · ${student.leadStatus}` : ''}
            </span>
          </div>
        </div>
        <div className="st-card__badges">
          {student.isMultiCourseCandidate && (
            <span className="st-card__multi-badge" title="Same candidate has multiple enrollments in this batch">
              <i className="fas fa-layer-group" /> {student.enrollmentCount} courses
            </span>
          )}
          <span className={`st-card__status st-card__status--${statusTone}`}>
            <i className={`fas ${statusTone === 'active' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} />
            {student.status}
          </span>
        </div>
      </div>

      <div className="st-card__body">
        {student.isMultiCourseCandidate && (
          <div className="st-card__multi-note">
            <i className="fas fa-info-circle" />
            <div>
              <strong>Same candidate in multiple courses</strong>
              <p>
                This card is for <em>{student.course}</em> ({student.batchCode}).
                {student.otherEnrollments?.length
                  ? ` Also enrolled in: ${student.otherEnrollments.map((item) => `${item.course} (${item.batchCode})`).join(', ')}.`
                  : ''}
              </p>
            </div>
          </div>
        )}

        <div className="st-card__attendance">
          <div className="st-card__attendance-top">
            <span>Batch Session Attendance</span>
            <strong className={`st-card__att-val st-card__att-val--${attLevel}`}>{attendanceLabel}</strong>
          </div>
          <small className="st-card__attendance-note">{attendanceHint}</small>
          <div className="st-card__progress">
            <div
              className={`st-card__progress-fill st-card__progress-fill--${attLevel}`}
              style={{ width: `${Math.min(attendanceNum, 100)}%` }}
            />
          </div>
        </div>

        <div className="st-card__details">
          {detailItems.map(([icon, label, value]) => (
            <div key={label} className="st-card__detail-item">
              <span><i className={`fas ${icon}`} /> {label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="st-card__meta">
          <div className="st-card__meta-item">
            <div className="st-card__meta-icon st-card__meta-icon--blue">
              <i className="fas fa-industry" />
            </div>
            <div>
              <span>Sector</span>
              <strong>{student.sector || '-'}</strong>
            </div>
          </div>
          <div className="st-card__meta-item">
            <div className="st-card__meta-icon st-card__meta-icon--pink">
              <i className="fas fa-chart-line" />
            </div>
            <div>
              <span>Performance</span>
              <strong>{performanceAdded ? getPerformanceLabel(attLevel) : 'Not added'}</strong>
            </div>
          </div>
        </div>

        <div className="st-card__actions">
          <button type="button" className="st-card__btn st-card__btn--primary" onClick={() => onView(student)}>
            <i className="fas fa-user" /> View Profile
          </button>
          <button type="button" className="st-card__btn st-card__btn--ghost" onClick={() => onAttendance(student)}>
            <i className="fas fa-clipboard-check" /> Attendance
          </button>
          <button
            type="button"
            className="st-card__btn st-card__btn--performance"
            onClick={() => onAddPerformance(student)}
          >
            <i className="fas fa-chart-bar" /> {performanceAdded ? 'Edit Performance' : 'Add Performance'}
          </button>
        </div>
      </div>
    </article>
  );
};

const StudentProfileModal = ({ student, sessions, attendanceRecordsBySession, basicDetails, onClose, onEditPerformance }) => {
  const profile = useMemo(
    () => getStudentPerformanceProfile(student, sessions, attendanceRecordsBySession, basicDetails),
    [student, sessions, attendanceRecordsBySession, basicDetails]
  );

  if (!profile) return null;

  const statusTone = profile.status === 'Active' ? 'active' : 'risk';
  const infoItems = [
    ['fa-phone', 'Mobile', profile.mobile],
    ['fa-envelope', 'Email', profile.email || '-'],
    ['fa-graduation-cap', 'Course', profile.course],
    ['fa-users', 'Batch', profile.batchCode],
    ['fa-building', 'Center', profile.center],
    ['fa-project-diagram', 'Project', profile.project || '-'],
    ['fa-briefcase', 'Project Type', profile.projectType || '-'],
    ['fa-industry', 'Sector', profile.sector || '-'],
    ['fa-tag', 'Lead Status', profile.leadStatus || '-'],
    [profile.enrolledDateLabel === 'Lead Since' ? 'fa-calendar' : 'fa-calendar-check', profile.enrolledDateLabel, profile.enrolledDate || '-'],
    ['fa-clock', 'Lead Created', profile.leadCreatedDate || '-'],
  ];

  return (
    <div className="st-profile-backdrop">
      <div className="st-profile-modal" role="dialog" aria-modal="true" aria-labelledby="student-profile-title">
        <div className="st-profile-modal__head">
          <div className="st-profile-modal__identity">
            <div className="st-profile-modal__avatar">{getInitials(profile.name)}</div>
            <div>
              <h3 id="student-profile-title">{profile.name}</h3>
              <p>{profile.course} · {profile.batchCode}{profile.isMultiCourseCandidate ? ` · ${profile.enrollmentCount} enrollments` : ''}</p>
            </div>
          </div>
          <div className="st-profile-modal__head-actions">
            <span className={`st-card__status st-card__status--${statusTone}`}>
              <i className={`fas ${statusTone === 'active' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} />
              {profile.status}
            </span>
            <button type="button" className="st-profile-modal__close" onClick={onClose} aria-label="Close profile">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="st-profile-modal__body">
          <div className="st-profile-stats">
            <div className="st-profile-stat">
              <div className="st-profile-stat__icon st-profile-stat__icon--pink"><i className="fas fa-percentage" /></div>
              <strong className={`st-card__att-val st-card__att-val--${profile.attLevel}`}>{profile.attendance}</strong>
              <span>Batch Session Attendance</span>
            </div>
            <div className="st-profile-stat">
              <div className="st-profile-stat__icon st-profile-stat__icon--green"><i className="fas fa-check-circle" /></div>
              <strong>{profile.presentSessions}</strong>
              <span>Present Sessions</span>
            </div>
            <div className="st-profile-stat">
              <div className="st-profile-stat__icon st-profile-stat__icon--red"><i className="fas fa-times-circle" /></div>
              <strong>{profile.absentSessions}</strong>
              <span>Absent Sessions</span>
            </div>
            <div className="st-profile-stat">
              <div className="st-profile-stat__icon st-profile-stat__icon--blue"><i className="fas fa-star" /></div>
              <strong>{profile.performanceLabel}</strong>
              <span>Performance</span>
            </div>
          </div>

          <div className="st-profile-section">
            <h4><i className="fas fa-id-card" /> Basic Information</h4>
            <div className="st-profile-info-grid">
              {infoItems.map(([icon, label, value]) => (
                <div key={label} className="st-profile-info-item">
                  <span><i className={`fas ${icon}`} /> {label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="st-profile-section">
            <h4><i className="fas fa-chart-bar" /> Performance Breakdown</h4>
            <div className="st-profile-metrics">
              {profile.metrics.map(({ label, value, icon, tone }) => (
                <div key={label} className="st-profile-metric">
                  <div className="st-profile-metric__head">
                    <span>
                      <i className={`fas ${icon} st-profile-metric__icon st-profile-metric__icon--${tone}`} />
                      {label}
                    </span>
                    <strong>{formatMetricValue(value)}</strong>
                  </div>
                  <div className="st-card__progress">
                    <div
                      className={`st-card__progress-fill st-card__progress-fill--${Number(value) >= 85 ? 'high' : Number(value) >= 70 ? 'mid' : 'low'}`}
                      style={{ width: `${value !== '' && value != null ? Math.min(Number(value) || 0, 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="st-profile-section">
            <h4><i className="fas fa-comment-dots" /> Trainer Remark</h4>
            <p className="st-profile-remark">{profile.trainerRemark || 'No remark added yet.'}</p>
          </div>

          <div className="st-profile-section">
            <h4><i className="fas fa-history" /> Session Attendance History</h4>
            <div className="st-profile-table-wrap">
              <table className="st-profile-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Topic</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.sessionHistory.map((entry) => (
                    <tr key={`${entry.date}-${entry.title}`}>
                      <td>{entry.date}</td>
                      <td>{entry.title}</td>
                      <td>{entry.topic}</td>
                      <td>
                        <span className={`st-profile-pill st-profile-pill--${attendanceTone(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="st-profile-modal__foot">
          <button type="button" className="sc-btn sc-btn--primary" onClick={() => onEditPerformance(student)}>
            <i className="fas fa-edit" /> {hasPerformanceData(student) ? 'Edit Performance' : 'Add Performance'}
          </button>
          <button type="button" className="sc-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const StudentPerformanceModal = ({ draft, onClose, onSave, onFieldChange }) => {
  if (!draft) return null;

  const isEdit = hasPerformanceData({
    participationScore: draft.participationScore,
    engagementScore: draft.engagementScore,
    assessmentScore: draft.assessmentScore,
    practicalScore: draft.practicalScore,
    trainerRemark: draft.trainerRemark,
  });

  return (
    <div className="st-perf-backdrop">
      <div className="st-perf-modal" role="dialog" aria-modal="true">
        <div className="st-perf-modal__head">
          <div>
            <h5>{isEdit ? 'Edit Performance' : 'Add Performance'}</h5>
            <span>{draft.studentName} · {draft.studentId}</span>
          </div>
          <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="st-perf-modal__body">
          <p className="st-perf-modal__hint">
            Enter performance scores for this student. Values should be between 0 and 100.
          </p>
          <div className="session-form-grid">
            {PERFORMANCE_FIELDS.map(({ key, label, icon, placeholder }) => (
              <label key={key} className="session-field">
                <span><i className={`fas ${icon}`} /> {label}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="dbr-input session-field__control"
                  placeholder={placeholder}
                  value={draft[key]}
                  onChange={(e) => onFieldChange(key, e.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="session-field session-field--full">
            <span><i className="fas fa-comment-dots" /> Trainer Remark</span>
            <textarea
              className="dbr-textarea session-field__control"
              rows="4"
              placeholder="Write trainer remark for this student..."
              value={draft.trainerRemark}
              onChange={(e) => onFieldChange('trainerRemark', e.target.value)}
            />
          </label>
        </div>

        <div className="st-perf-modal__foot">
          <button type="button" className="sc-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="sc-btn sc-btn--primary" onClick={onSave}>
            <i className="fas fa-save" /> Save Performance
          </button>
        </div>
      </div>
    </div>
  );
};

const ReferSessionModal = ({
  session,
  batchLabel,
  counselorOptions,
  counselorId,
  onCounselorChange,
  candidates,
  loading,
  selectedIds,
  onToggleCandidate,
  onToggleAll,
  submitting,
  onClose,
  onSubmit,
}) => {
  const allSelected = candidates.length > 0 && selectedIds.length === candidates.length;

  return (
    <div className="st-refer-backdrop">
      <div className="st-refer-modal" role="dialog" aria-modal="true">
        <div className="st-refer-modal__head">
          <div>
            <h5>Refer Session to Counsellor</h5>
            <span>{session?.title || 'Selected session'} · {batchLabel || 'Batch not selected'}</span>
          </div>
          <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="st-refer-modal__body">
          <p className="st-refer-modal__hint">
            Select a counsellor and choose students from the batch to refer using the refer-leads API.
          </p>

          <SessionFormSelect
            label="Counsellor"
            value={counselorId}
            onChange={onCounselorChange}
            options={counselorOptions}
            placeholder="Select counsellor"
          />

          <div className="st-refer-candidates">
            <div className="st-refer-candidates__head">
              <strong>Select Students</strong>
              {candidates.length > 0 && (
                <button type="button" className="st-refer-select-all" onClick={onToggleAll}>
                  {allSelected ? 'Clear All' : 'Select All'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="st-refer-empty">
                <i className="fas fa-spinner fa-spin" /> Loading students...
              </div>
            ) : candidates.length === 0 ? (
              <div className="st-refer-empty">
                No students found. Please select <strong>Center</strong>, <strong>Course</strong>, and <strong>Batch</strong> filters first.
              </div>
            ) : (
              <div className="st-refer-candidate-list">
                {candidates.map((candidate) => {
                  const checked = selectedIds.includes(candidate.appliedCourseId);
                  return (
                    <label
                      key={candidate.appliedCourseId}
                      className={`st-refer-candidate${checked ? ' st-refer-candidate--active' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleCandidate(candidate.appliedCourseId)}
                      />
                      <div>
                        <strong>{candidate.name}</strong>
                        <span>{candidate.mobile}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="st-refer-modal__foot">
          <button type="button" className="sc-btn" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" className="sc-btn sc-btn--primary" onClick={onSubmit} disabled={submitting}>
            <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-share-alt'}`} />
            {submitting ? 'Referring...' : 'Refer Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionFeedbackModal = ({ session, onClose }) => {
  if (!session) return null;

  return (
    <div className="session-modal-backdrop">
      <div className="session-modal session-feedback-modal" role="dialog" aria-modal="true">
        <div className="session-modal__head">
          <div>
            <h5>Session Feedback</h5>
            <span>{session.title || session.id}</span>
          </div>
          <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="session-modal__foot">
          <button type="button" className="sc-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Redesigned Session Card ─── */
const AddSessionModal = ({
  draft,
  isEdit,
  batchSummary,
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
            <span>{isEdit ? draft.id : 'Enter session details below'}</span>
          </div>
          <button type="button" className="session-modal__close" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="session-modal__body">
          {!isEdit && batchSummary && (
            <div className="session-modal__context">{batchSummary}</div>
          )}
          <SessionFormFields
            draft={draft}
            isEdit={isEdit}
            onFieldChange={onFieldChange}
            onEvidenceChange={onEvidenceChange}
            onAddEvidence={onAddEvidence}
            onRemoveEvidence={onRemoveEvidence}
            readOnlyTrainer={!isEdit}
          />
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
  students,
  sessions,
  attendanceRecordsBySession,
  view,
  onViewChange,
  onStatusChange,
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
    { label: 'Training Mode', value: session.trainingMethod || 'Interactive Learning' },
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
                      <th className="attendance-date-col">This Session</th>
                      <th>Batch Attendance</th>
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
                        <AttendancePercentCell
                          row={row}
                          students={students}
                          sessions={sessions}
                          attendanceRecordsBySession={attendanceRecordsBySession}
                        />
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>This Session Summary</td>
                      <td>
                        P: {stats.present} - A: {stats.absent} - NM: {stats.notMarked}
                      </td>
                      <td>{stats.attendance}%</td>
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
                      <th>Batch Attendance</th>
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
                        <AttendancePercentCell
                          row={row}
                          students={students}
                          sessions={sessions}
                          attendanceRecordsBySession={attendanceRecordsBySession}
                        />
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>This Session Summary</td>
                      <td>{sessionDate}</td>
                      <td>
                        P: {stats.present} - A: {stats.absent} - NM: {stats.notMarked}
                      </td>
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
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const activeSession = session || hydrateSession(DUMMY_SESSIONS[0], 0, basicDetails);
  const statusTone = activeSession.status === 'Completed' ? 'green' : 'amber';
  const statusIcon = activeSession.status === 'Completed' ? 'fa-check-circle' : 'fa-clock';
  const timeRange = `${activeSession.startTime || '10:00'} - ${activeSession.endTime || '12:00'}`;
  const detailItems = useMemo(() => ([
    ['fa-sitemap', 'Department', activeSession.departmentName || basicDetails.departmentName || '-', 'blue'],
    ['fa-project-diagram', 'Project', activeSession.projectName || basicDetails.projectName || '-', 'blue'],
    ['fa-building', 'Center', activeSession.centerName || basicDetails.centerName || '-', 'blue'],
    ['fa-book-open', 'Topic covered', activeSession.topicCovered || activeSession.title, 'blue'],
    ['fa-chalkboard', 'Training method', activeSession.trainingMethod || 'Interactive Learning', 'blue'],
    ['fa-calendar-alt', 'Session date', activeSession.date || formatSessionDate(activeSession.sessionDate), 'blue'],
    ['fa-clock', 'Time', timeRange, 'blue'],
    ['fa-graduation-cap', 'Course / trade', activeSession.courseTrade || basicDetails.courseTrade, 'pink'],
    ['fa-hashtag', 'Batch code', activeSession.batchCode || basicDetails.batchCode, 'pink'],
    ['fa-user', 'Trainer', activeSession.trainerName || basicDetails.trainerName, 'pink'],
    ['fa-user-tie', 'Counsellor', activeSession.counsellorName || '-', 'pink'],
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
          <button
            type="button"
            className="sc-head-tab"
            onClick={() => setFeedbackModalOpen(true)}
          >
            <i className="fas fa-comment-dots" /> Feedback
          </button>
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

      {feedbackModalOpen && (
        <SessionFeedbackModal
          session={activeSession}
          onClose={() => setFeedbackModalOpen(false)}
        />
      )}

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
    counsellor: '',
  });
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);
  const [allCoursesMeta, setAllCoursesMeta] = useState([]);
  const [allCentersMeta, setAllCentersMeta] = useState([]);
  const [quickSearch, setQuickSearch] = useState('');
  const [mainTab, setMainTab] = useState('session');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionDraft, setSessionDraft] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState({ isOpen: false, view: 'register', sessionId: '' });
  const [attendanceRecordsBySession, setAttendanceRecordsBySession] = useState({});
  const [studentProfileModal, setStudentProfileModal] = useState({ isOpen: false, student: null });
  const [performanceModal, setPerformanceModal] = useState({ isOpen: false, draft: null });
  const [referSessionModal, setReferSessionModal] = useState({
    isOpen: false,
    counselorId: '',
    selectedAppliedCourseIds: [],
  });
  const [referCandidates, setReferCandidates] = useState([]);
  const [referCandidatesLoading, setReferCandidatesLoading] = useState(false);
  const [referSubmitting, setReferSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [centerWiseCourseIds, setCenterWiseCourseIds] = useState(new Set());
  const [centerCoursesLoading, setCenterCoursesLoading] = useState(false);
  const [pathBatchesLoading, setPathBatchesLoading] = useState(false);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [sessionPanelView, setSessionPanelView] = useState('empty');
  const [toast, setToast] = useState('');

  const trainerProfile = useMemo(() => ({
    name: userData.name || TRAINER_INFO.name,
    mobile: userData.mobile || TRAINER_INFO.mobile,
    email: userData.email || TRAINER_INFO.email,
  }), [userData]);

  const activeBasicDetails = useMemo(() => buildSessionContextFromFilters(filters, {
    verticalOptions,
    projectOptions,
    centerOptions,
    courseOptions,
    batchOptions,
    trainerName: trainerProfile.name,
  }), [filters, verticalOptions, projectOptions, centerOptions, courseOptions, batchOptions, trainerProfile.name]);

  const persistSessions = useCallback((nextSessions, batchId = filters.batch) => {
    if (!batchId) return;
    persistStoredSessions(batchId, nextSessions);
  }, [filters.batch]);

  const [attendanceData, setAttendanceData] = useState(() => buildPointMap(ATTENDANCE_POINTS));
  const [trainingData, setTrainingData] = useState(() => buildPointMap(TRAINING_POINTS));
  const [documentData, setDocumentData] = useState(() => buildPointMap(DOCUMENT_POINTS));
  const [issueData, setIssueData] = useState(() =>
    Object.fromEntries(ISSUE_POINTS.map((p) => [p.id, emptyIssueValue()]))
  );

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const updateMap = useCallback((setter, id, field, val) => {
    setter((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }, []);

  const filterProjectOptions = useMemo(() => {
    if (!filters.department) return [];
    const projectIds = new Set(
      allCoursesMeta
        .filter((course) => String(course.vertical?._id || course.vertical) === String(filters.department))
        .map((course) => String(course.project?._id || course.project))
    );
    return projectOptions.filter((project) => projectIds.has(String(project.value)));
  }, [filters.department, projectOptions, allCoursesMeta]);

  const filterCenterOptions = useMemo(() => {
    if (!filters.project) return [];
    return centerOptions.filter((center) => {
      const meta = allCentersMeta.find((centerItem) => String(centerItem._id) === String(center.value));
      return meta?.projects?.some((project) => String(project._id || project) === String(filters.project));
    });
  }, [filters.project, centerOptions, allCentersMeta]);

  const filterCourseOptions = useMemo(() => {
    if (!filters.center || !filters.project) return [];
    if (!centerWiseCourseIds.size) return [];
    return courseOptions.filter((course) => centerWiseCourseIds.has(String(course.value)));
  }, [filters.center, filters.project, courseOptions, centerWiseCourseIds]);

  const sessionPathStep = useMemo(() => {
    if (!filters.department) return 'department';
    if (!filters.project) return 'project';
    if (!filters.center) return 'center';
    if (!filters.course) return 'course';
    if (!filters.batch) return 'batch';
    return 'complete';
  }, [filters]);

  const sessionPathOptions = useMemo(() => {
    switch (sessionPathStep) {
      case 'department':
        return verticalOptions;
      case 'project':
        return filterProjectOptions;
      case 'center':
        return filterCenterOptions;
      case 'course':
        return filterCourseOptions;
      case 'batch':
        return batchOptions;
      default:
        return [];
    }
  }, [sessionPathStep, verticalOptions, filterProjectOptions, filterCenterOptions, filterCourseOptions, batchOptions]);

  const sessionPathLoading = useMemo(() => {
    if (filterOptionsLoading && sessionPathStep === 'department') return true;
    if (sessionPathStep === 'course' && filters.center && filters.project && centerCoursesLoading) return true;
    if (sessionPathStep === 'batch' && filters.center && pathBatchesLoading) return true;
    return false;
  }, [filterOptionsLoading, sessionPathStep, filters.center, filters.project, centerCoursesLoading, pathBatchesLoading]);

  const getFilterLabel = useCallback((key, value) => {
    if (!value) return '';
    const optionMap = {
      department: verticalOptions,
      project: projectOptions,
      center: centerOptions,
      course: courseOptions,
      batch: batchOptions,
      counsellor: counselorOptions,
    };
    return getOptionLabel(optionMap[key] || [], value);
  }, [verticalOptions, projectOptions, centerOptions, courseOptions, batchOptions, counselorOptions]);

  useEffect(() => {
    const authToken = token || JSON.parse(sessionStorage.getItem('user') || '{}').token;
    if (!authToken) {
      setFilterOptionsLoading(false);
      console.error('TrainerModule: auth token missing, filters not loaded');
      return undefined;
    }

    const mapOptions = (items = []) =>
      (items || [])
        .filter((item) => item && item._id && item.name)
        .map((item) => ({ value: String(item._id), label: item.name }));

    const requestConfig = { headers: { 'x-auth': authToken }, timeout: 12000 };
    let cancelled = false;

    const fetchFilterOptions = async () => {
      setFilterOptionsLoading(true);

      try {
        // Load departments first so path picker is not blocked by slower APIs.
        try {
          const verticalsRes = await axios.get(`${backendUrl}/college/getVerticals`, requestConfig);
          if (!cancelled && verticalsRes.data?.status) {
            setVerticalOptions(mapOptions(verticalsRes.data.data));
          }
        } catch (verticalErr) {
          console.error('Failed to fetch verticals:', verticalErr);
          try {
            const filtersRes = await axios.get(`${backendUrl}/college/filters-data`, requestConfig);
            if (!cancelled && filtersRes.data?.status) {
              setVerticalOptions(mapOptions(filtersRes.data.verticals));
            }
          } catch (filtersErr) {
            console.error('Failed to fetch filter-data verticals:', filtersErr);
          }
        }
      } finally {
        if (!cancelled) setFilterOptionsLoading(false);
      }

      // Load remaining filter data in background.
      try {
        const [
          projectsRes,
          centersRes,
          coursesRes,
          filtersRes,
        ] = await Promise.allSettled([
          axios.get(`${backendUrl}/college/list_all_projects`, requestConfig),
          axios.get(`${backendUrl}/college/list_all_centers`, requestConfig),
          axios.get(`${backendUrl}/college/all_courses`, requestConfig),
          axios.get(`${backendUrl}/college/filters-data`, requestConfig),
        ]);

        if (cancelled) return;

        if (projectsRes.status === 'fulfilled' && projectsRes.value.data?.success) {
          setProjectOptions(mapOptions(projectsRes.value.data.data));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          setProjectOptions(mapOptions(filtersRes.value.data.projects));
        }

        if (centersRes.status === 'fulfilled' && centersRes.value.data?.success) {
          const centers = centersRes.value.data.data || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapOptions(centers));
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const centers = filtersRes.value.data.centers || [];
          setAllCentersMeta(centers);
          setCenterOptions(mapOptions(centers));
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value.data?.success) {
          const courses = coursesRes.value.data.data || [];
          setAllCoursesMeta(courses);
          setCourseOptions(mapOptions(courses));

          const projectMap = new Map();
          courses.forEach((course) => {
            const id = course.project?._id || course.project;
            const name = course.project?.name || course.projectName;
            if (id && name) {
              projectMap.set(String(id), { value: String(id), label: name });
            }
          });
          if (projectMap.size) {
            setProjectOptions((prev) => (prev.length ? prev : Array.from(projectMap.values())));
          }
        } else if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          setCourseOptions(mapOptions(filtersRes.value.data.courses));
        }

        if (filtersRes.status === 'fulfilled' && filtersRes.value.data?.status) {
          const activeCounselors = (filtersRes.value.data.counselors || []).filter(
            (c) => c?.status === true || c?.status === 'active'
          );
          setCounselorOptions(mapOptions(activeCounselors));
        }
      } catch (err) {
        console.error('Failed to fetch secondary filter options:', err);
      }
    };

    fetchFilterOptions();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token || !filters.center || !filters.project) {
      setCenterWiseCourseIds(new Set());
      return undefined;
    }

    const fetchCenterCourses = async () => {
      setCenterCoursesLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/college/all_courses_centerwise`, {
          params: { centerId: filters.center, projectId: filters.project },
          headers: { 'x-auth': token },
        });
        if (res.data?.success) {
          setCenterWiseCourseIds(new Set((res.data.data || []).map((course) => String(course._id))));
        } else {
          setCenterWiseCourseIds(new Set());
        }
      } catch (err) {
        console.error('Failed to fetch center-wise courses:', err);
        setCenterWiseCourseIds(new Set());
      } finally {
        setCenterCoursesLoading(false);
      }
    };

    fetchCenterCourses();
    return undefined;
  }, [filters.center, filters.project, token, backendUrl]);

  const fetchBatchStudents = useCallback(async (batchId, signal) => {
    const authToken = token || JSON.parse(sessionStorage.getItem('user') || '{}').token;
    if (!authToken || !batchId) {
      setStudents([]);
      setStudentsLoading(false);
      return;
    }

    setStudentsLoading(true);
    try {
      const res = await axios.get(
        `${backendUrl}/college/admission-list/${batchId}?page=1&limit=500`,
        {
          headers: { 'x-auth': authToken },
          timeout: 15000,
          signal,
        }
      );
      if (res.data.success && Array.isArray(res.data.data)) {
        setStudents(res.data.data.map(mapAppliedCourseToStudent));
      } else {
        setStudents([]);
      }
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED' && err?.name !== 'CanceledError') {
        console.error('Failed to fetch batch students:', err);
      }
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    if (!filters.batch) {
      setSessions([]);
      setSelectedSessionId('');
      setStudents([]);
      setStudentsLoading(false);
      setAttendanceRecordsBySession({});
      return undefined;
    }

    const controller = new AbortController();
    const stored = loadStoredSessions(filters.batch);
    setSessions(stored);
    setSelectedSessionId((prev) => (
      prev && stored.some((session) => session.id === prev) ? prev : stored[0]?.id || ''
    ));
    setSessionPanelView(stored.length ? 'view' : 'empty');
    setAttendanceRecordsBySession(loadStoredAttendance(filters.batch));
    fetchBatchStudents(filters.batch, controller.signal);
    return () => controller.abort();
  }, [filters.batch, fetchBatchStudents]);

  const fetchReferCandidates = useCallback(async (batchId) => {
    const authToken = token || JSON.parse(sessionStorage.getItem('user') || '{}').token;
    if (!authToken || !batchId) {
      setReferCandidates([]);
      return;
    }

    setReferCandidatesLoading(true);
    try {
      const res = await axios.get(
        `${backendUrl}/college/admission-list/${batchId}?page=1&limit=500`,
        { headers: { 'x-auth': authToken }, timeout: 15000 }
      );
      if (res.data.success && Array.isArray(res.data.data)) {
        setReferCandidates(res.data.data.map((profile) => ({
          appliedCourseId: profile._id,
          name: profile._candidate?.name || profile.counsellorName || 'Unknown',
          mobile: profile._candidate?.mobile || '-',
        })));
      } else {
        setReferCandidates([]);
      }
    } catch (err) {
      console.error('Failed to fetch refer candidates:', err);
      setReferCandidates([]);
    } finally {
      setReferCandidatesLoading(false);
    }
  }, [backendUrl, token]);

  const openReferSessionModal = () => {
    if (!filters.batch) {
      notify('Please select a batch first');
    }
    setReferSessionModal({
      isOpen: true,
      counselorId: filters.counsellor || '',
      selectedAppliedCourseIds: [],
    });
    if (filters.batch) {
      fetchReferCandidates(filters.batch);
    } else {
      setReferCandidates([]);
    }
  };

  const closeReferSessionModal = () => {
    setReferSessionModal({ isOpen: false, counselorId: '', selectedAppliedCourseIds: [] });
    setReferCandidates([]);
    setReferSubmitting(false);
  };

  const updateReferCounselor = (counselorId) => {
    setReferSessionModal((prev) => ({ ...prev, counselorId }));
  };

  const toggleReferCandidate = (appliedCourseId) => {
    setReferSessionModal((prev) => ({
      ...prev,
      selectedAppliedCourseIds: prev.selectedAppliedCourseIds.includes(appliedCourseId)
        ? prev.selectedAppliedCourseIds.filter((id) => id !== appliedCourseId)
        : [...prev.selectedAppliedCourseIds, appliedCourseId],
    }));
  };

  const toggleAllReferCandidates = () => {
    setReferSessionModal((prev) => ({
      ...prev,
      selectedAppliedCourseIds: prev.selectedAppliedCourseIds.length === referCandidates.length
        ? []
        : referCandidates.map((candidate) => candidate.appliedCourseId),
    }));
  };

  const handleReferSession = async () => {
    const { counselorId, selectedAppliedCourseIds } = referSessionModal;

    if (!counselorId) {
      notify('Please select counsellor');
      return;
    }
    if (!selectedAppliedCourseIds.length) {
      notify('Please select at least one student');
      return;
    }

    const type = selectedAppliedCourseIds.length === 1 ? 'RefferSingleLead' : 'RefferBulkLead';
    const appliedCourseId = type === 'RefferSingleLead'
      ? selectedAppliedCourseIds[0]
      : selectedAppliedCourseIds;

    setReferSubmitting(true);
    try {
      const response = await axios.post(`${backendUrl}/college/refer-leads`, {
        counselorId,
        appliedCourseId,
        type,
      }, {
        headers: { 'x-auth': token },
      });

      if (response.data.status || response.data.success) {
        notify('Session referred successfully');
        closeReferSessionModal();
      } else {
        notify(response.data.message || 'Failed to refer session');
      }
    } catch (error) {
      console.error('Error referring session:', error);
      notify(error.response?.data?.message || 'Failed to refer session');
    } finally {
      setReferSubmitting(false);
    }
  };

  useEffect(() => {
    if (!token) return undefined;
    if (!filters.center) {
      setBatchOptions([]);
      return undefined;
    }

    const fetchBatches = async () => {
      setPathBatchesLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.center) params.set('centerId', filters.center);
        if (filters.course) params.set('courseId', filters.course);
        const res = await axios.get(`${backendUrl}/college/get_batches?${params.toString()}`, {
          headers: { 'x-auth': token },
          timeout: 12000,
        });
        if (res.data?.success) {
          setBatchOptions((res.data.data || []).map((b) => ({ value: b._id, label: b.name })));
        } else {
          setBatchOptions([]);
        }
      } catch (err) {
        console.error('Failed to fetch batches:', err);
        setBatchOptions([]);
      } finally {
        setPathBatchesLoading(false);
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
      setFilters((prev) => ({ ...prev, center: value, course: '', batch: '' }));
      return;
    }
    if (key === 'course') {
      setFilters((prev) => ({ ...prev, course: value, batch: '' }));
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSessionPathBack = () => {
    if (filters.batch) {
      handleFilterChange('batch', '');
      return;
    }
    if (filters.course) {
      handleFilterChange('course', '');
      return;
    }
    if (filters.center) {
      handleFilterChange('center', '');
      return;
    }
    if (filters.project) {
      handleFilterChange('project', '');
      return;
    }
    if (filters.department) {
      handleFilterChange('department', '');
    }
  };

  const handleSessionPathReset = () => {
    setFilters({
      department: '',
      project: '',
      center: '',
      course: '',
      batch: '',
      counsellor: filters.counsellor,
    });
  };

  const filteredSessions = useMemo(() => {
    const query = quickSearch.trim().toLowerCase();
    return sessions.filter((session) => {
      if (filters.batch && session.batch && String(session.batch) !== String(filters.batch)) return false;
      if (filters.course && session.course && String(session.course) !== String(filters.course)) return false;
      if (filters.center && session.center && String(session.center) !== String(filters.center)) return false;
      if (!query) return true;
      return (
        session.title?.toLowerCase().includes(query)
        || session.id?.toLowerCase().includes(query)
        || session.topicCovered?.toLowerCase().includes(query)
        || session.date?.toLowerCase().includes(query)
        || session.batchCode?.toLowerCase().includes(query)
      );
    });
  }, [sessions, quickSearch, filters.batch, filters.course, filters.center]);

  useEffect(() => {
    if (!filteredSessions.length) {
      setSelectedSessionId('');
      return;
    }
    if (!filteredSessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId(filteredSessions[0].id);
    }
  }, [filteredSessions, selectedSessionId]);

  const selectedSession = useMemo(
    () => filteredSessions.find((session) => session.id === selectedSessionId) || filteredSessions[0] || null,
    [filteredSessions, selectedSessionId]
  );

  const batchAttendanceSummary = useMemo(
    () => computeBatchAttendanceSummary(students, sessions, attendanceRecordsBySession),
    [students, sessions, attendanceRecordsBySession]
  );
  const displayStudents = useMemo(
    () => enrichStudentsWithEnrollmentMeta(students),
    [students]
  );
  const referBatchLabel = useMemo(
    () => getOptionLabel(batchOptions, filters.batch),
    [batchOptions, filters.batch]
  );
  const attendanceSession = useMemo(
    () => sessions.find((session) => session.id === attendanceModal.sessionId) || selectedSession,
    [sessions, attendanceModal.sessionId, selectedSession]
  );
  const attendanceRows = attendanceRecordsBySession[attendanceModal.sessionId] || [];

  const openAddSessionModal = () => {
    if (!filters.batch) {
      notify('Pehle Sessions tab mein Department se Batch tak select karein');
      return;
    }

    const nextSessionNumber = sessions.length + 1;
    const context = buildSessionContextFromFilters(filters, {
      verticalOptions,
      projectOptions,
      centerOptions,
      courseOptions,
      batchOptions,
      trainerName: trainerProfile.name,
    });

    setEditingSessionId(null);
    setSessionDraft({
      ...createEmptySessionDraft(nextSessionNumber),
      ...context,
      status: 'Pending',
      counsellor: filters.counsellor || '',
      counsellorName: getOptionLabel(counselorOptions, filters.counsellor),
      ...(trainerProfile.name ? { trainerName: trainerProfile.name } : {}),
      ...(students.length ? {
        totalCandidates: String(students.length),
        presentCandidates: '0',
        absentCandidates: '0',
      } : {}),
    });
    setIsSessionModalOpen(true);
  };

  const closeSessionPanel = () => {
    setSessionDraft(null);
    setEditingSessionId(null);
    setSessionPanelView(filteredSessions.length ? 'view' : 'empty');
  };
  const openEditSessionModal = (session) => {
    setEditingSessionId(session.id);
    setSessionDraft({
      ...session,
      sessionDate: session.sessionDate || getTodayInputValue(),
      evidenceDocs: session.evidenceDocs?.length ? session.evidenceDocs : createEvidenceDocs('Pending'),
    });
    setSessionPanelView('view');
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
  const syncFiltersFromSession = (session) => {
    if (!session?.batch) return;
    setFilters((prev) => ({
      ...prev,
      department: session.department || prev.department,
      project: session.project || prev.project,
      center: session.center || prev.center,
      course: session.course || prev.course,
      batch: session.batch,
      counsellor: session.counsellor || prev.counsellor,
    }));
  };

  const finishSessionSave = (sessionId, batchId, nextSessions, savedSession) => {
    const isActiveBatch = filters.batch && batchId && String(filters.batch) === String(batchId);

    if (!isActiveBatch) {
      syncFiltersFromSession(savedSession);
    }

    setSessions(nextSessions);
    setSelectedSessionId(sessionId);
    setSessionPanelView('view');
  };

  const saveSessionDraft = () => {
    if (!sessionDraft?.batch) {
      notify('Please select a batch for this session');
      return;
    }
    if (!sessionDraft?.title?.trim()) {
      notify('Please enter session title');
      return;
    }
    if (!sessionDraft?.sessionDate) {
      notify('Please select session date');
      return;
    }

    const draftWithCounsellor = {
      ...sessionDraft,
      ...buildSessionContextFromFilters(filters, {
        verticalOptions,
        projectOptions,
        centerOptions,
        courseOptions,
        batchOptions,
        trainerName: trainerProfile.name,
      }),
      status: sessionDraft.status || 'Pending',
      counsellor: filters.counsellor || sessionDraft.counsellor || '',
      counsellorName: getOptionLabel(counselorOptions, filters.counsellor || sessionDraft.counsellor),
      courseTrade: getOptionLabel(courseOptions, filters.course || sessionDraft.course),
      batchCode: getOptionLabel(batchOptions, filters.batch || sessionDraft.batch),
      departmentName: getOptionLabel(verticalOptions, filters.department || sessionDraft.department),
      projectName: getOptionLabel(projectOptions, filters.project || sessionDraft.project),
      centerName: getOptionLabel(centerOptions, filters.center || sessionDraft.center),
      batch: filters.batch || sessionDraft.batch,
      totalCandidates: String(students.length || sessionDraft.totalCandidates || 0),
    };
    const normalizedSession = normalizeSessionDraft(draftWithCounsellor, activeBasicDetails);
    const batchId = resolveSessionBatchId(normalizedSession, sessionDraft.batch || filters.batch);

    if (editingSessionId) {
      const baseSessions = mergeBatchSessions(batchId, sessions);
      const nextSessions = baseSessions.map((session) => (
        session.id === editingSessionId ? { ...normalizedSession, id: editingSessionId } : session
      ));
      const updatedSession = nextSessions.find((session) => session.id === editingSessionId);

      persistStoredSessions(batchId, nextSessions);
      finishSessionSave(editingSessionId, batchId, nextSessions, updatedSession);
      notify('Session updated');
      closeSessionModal();
    } else {
      const newSession = {
        ...normalizedSession,
        id: `S-${Date.now()}`,
      };
      const baseSessions = mergeBatchSessions(batchId, sessions);
      const nextSessions = [...baseSessions, newSession];

      persistStoredSessions(batchId, nextSessions);
      finishSessionSave(newSession.id, batchId, nextSessions, newSession);
      notify('Session added');
      closeSessionModal();
    }
  };
  const updateSessionStatus = (sessionId, status) => {
    setSessions((prev) => {
      const next = prev.map((session) => (
        session.id === sessionId ? { ...session, status } : session
      ));
      persistSessions(next, resolveSessionBatchId(next.find((session) => session.id === sessionId), filters.batch));
      return next;
    });
    notify(`Session marked ${status}`);
  };
  const uploadEvidenceFile = (sessionId, docId, file) => {
    if (!file) return;
    setSessions((prev) => {
      const next = prev.map((session) => (
        session.id === sessionId
          ? {
            ...session,
            evidenceDocs: session.evidenceDocs.map((doc) => (
              doc.id === docId ? { ...doc, status: 'Uploaded', fileName: file.name } : doc
            )),
          }
          : session
      ));
      persistSessions(next, resolveSessionBatchId(next.find((session) => session.id === sessionId), filters.batch));
      return next;
    });
    notify('Evidence uploaded');
  };
  const openAttendanceModal = (session, view = 'register') => {
    if (!students.length) {
      notify('No students in this batch. Assign students to batch first.');
      return;
    }
    setAttendanceRecordsBySession((prev) => (
      prev[session.id]
        ? prev
        : { ...prev, [session.id]: createSessionAttendanceRows(session, students) }
    ));
    setAttendanceModal({ isOpen: true, view, sessionId: session.id });
  };
  const closeAttendanceModal = () => {
    setAttendanceModal((prev) => ({ ...prev, isOpen: false }));
  };
  const openStudentProfile = (student) => {
    setStudentProfileModal({ isOpen: true, student });
  };
  const closeStudentProfile = () => {
    setStudentProfileModal({ isOpen: false, student: null });
  };
  const openPerformanceModal = (student) => {
    setPerformanceModal({ isOpen: true, draft: createPerformanceDraft(student) });
  };
  const closePerformanceModal = () => {
    setPerformanceModal({ isOpen: false, draft: null });
  };
  const updatePerformanceDraft = (field, value) => {
    setPerformanceModal((prev) => (
      prev.draft ? { ...prev, draft: { ...prev.draft, [field]: value } } : prev
    ));
  };
  const savePerformanceDraft = () => {
    const { draft } = performanceModal;
    if (!draft?.studentId) return;

    const updatedPerformance = {
      participationScore: clampScore(draft.participationScore),
      engagementScore: clampScore(draft.engagementScore),
      assessmentScore: clampScore(draft.assessmentScore),
      practicalScore: clampScore(draft.practicalScore),
      trainerRemark: draft.trainerRemark.trim(),
    };

    setStudents((prev) => prev.map((student) => (
      student.id === draft.studentId ? { ...student, ...updatedPerformance } : student
    )));

    setStudentProfileModal((prev) => (
      prev.isOpen && prev.student?.id === draft.studentId
        ? { ...prev, student: { ...prev.student, ...updatedPerformance } }
        : prev
    ));

    notify(`Performance saved for ${draft.studentName}`);
    closePerformanceModal();
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
    setSessions((prev) => {
      const next = prev.map((session) => (
        session.id === attendanceModal.sessionId
          ? {
            ...session,
            totalCandidates: String(stats.total),
            presentCandidates: String(stats.present),
            absentCandidates: String(stats.absent),
            attendance: `${stats.attendance}%`,
          }
          : session
      ));
      persistSessions(
        next,
        resolveSessionBatchId(next.find((session) => session.id === attendanceModal.sessionId), filters.batch)
      );
      return next;
    });
    setAttendanceRecordsBySession((prev) => {
      persistStoredAttendance(filters.batch, prev);
      return prev;
    });
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
          {!filters.batch ? (
            <SessionPathPicker
              filters={filters}
              currentStep={sessionPathStep}
              options={sessionPathOptions}
              loading={sessionPathLoading}
              getLabel={getFilterLabel}
              onSelect={handleFilterChange}
              onBack={handleSessionPathBack}
              onReset={handleSessionPathReset}
            />
          ) : (
            <>
              <div className="dbr-session-bar">
                <div className="dbr-session-summary">
                  <span className="dbr-session-summary__lbl">Selected path</span>
                  <span className="dbr-session-summary__count">
                    {[
                      activeBasicDetails.departmentName,
                      activeBasicDetails.projectName,
                      activeBasicDetails.centerName,
                      activeBasicDetails.courseTrade,
                      activeBasicDetails.batchCode,
                    ].filter(Boolean).join(' · ')}
                  </span>
                  <span className="dbr-session-summary__count">
                    {studentsLoading ? '…' : students.length} students · <strong>{filteredSessions.length}</strong> sessions
                  </span>
                  <span className="dbr-session-summary__count">
                    {batchAttendanceSummary.sessionsMarked}/{batchAttendanceSummary.totalSessions} sessions marked · Avg {batchAttendanceSummary.average}%
                    {batchAttendanceSummary.source === 'sessions' ? ' (from marked sessions)' : ' (from admission record)'}
                  </span>
                </div>
                <div className="dbr-session-actions">
                  <FilterSelect
                    label="Counsellor"
                    icon="fa-user-tie"
                    options={counselorOptions}
                    value={filters.counsellor}
                    onChange={(v) => handleFilterChange('counsellor', v)}
                  />
                  <button type="button" className="dbr-btn dbr-btn--session-pill dbr-btn--ghost" onClick={handleSessionPathReset}>
                    Change batch
                  </button>
                  <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={openAddSessionModal}>
                    <i className="fas fa-plus" /> Add Session
                  </button>
                  <button type="button" className="dbr-btn dbr-btn--session-pill" onClick={openReferSessionModal}>
                    <i className="fas fa-share-alt" /> Refer Session
                  </button>
                </div>
              </div>

              <div className="dbr-actions">
                <input
                  type="text"
                  className="dbr-search dbr-search--full"
                  placeholder="Search sessions by title, topic, date..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                />
              </div>

              {filteredSessions.length > 0 && sessionPanelView !== 'add' && (
                <div className="dbr-session-picker">
                  {filteredSessions.map((session) => {
                    const tone = session.status === 'Completed' ? 'green' : 'amber';
                    const isActive = session.id === selectedSessionId;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        className={`dbr-session-picker__item${isActive ? ' dbr-session-picker__item--active' : ''}`}
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          setSessionPanelView('view');
                        }}
                      >
                        <span className={`dbr-session-picker__status dbr-session-picker__status--${tone}`}>{session.status}</span>
                        <strong>{session.title}</strong>
                        <small>{session.date || formatSessionDate(session.sessionDate)}</small>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="tm-workspace">
                
                <div className="tm-main">
                  {sessionPanelView === 'add' && sessionDraft ? (
                    <SessionAddPanel
                      draft={sessionDraft}
                      batchLabel={activeBasicDetails.batchCode}
                      studentCount={studentsLoading ? '…' : students.length}
                      onClose={closeSessionPanel}
                      onSave={saveSessionDraft}
                      onFieldChange={updateSessionDraft}
                    />
                  ) : selectedSession && sessionPanelView === 'view' ? (
                    <>
                      {studentsLoading && (
                        <div className="tm-empty tm-empty--inline">
                          <i className="fas fa-spinner fa-spin" />
                          <p>Loading batch students...</p>
                        </div>
                      )}
                      {!studentsLoading && !students.length && (
                        <div className="tm-empty tm-empty--session-create tm-empty--inline">
                          <i className="fas fa-user-graduate" />
                          <p>No batch-assigned students found. You can still manage this session.</p>
                        </div>
                      )}
                      <SessionCard
                        basicDetails={activeBasicDetails}
                        session={selectedSession}
                        notify={notify}
                        onStatusChange={updateSessionStatus}
                        onEvidenceUpload={uploadEvidenceFile}
                        onEditSession={openEditSessionModal}
                        onOpenAttendance={openAttendanceModal}
                      />
                    </>
                  ) : (
                    <>
                      {studentsLoading && (
                        <div className="tm-empty tm-empty--inline">
                          <i className="fas fa-spinner fa-spin" />
                          <p>Loading batch students...</p>
                        </div>
                      )}
                      <SessionEmptyState onCreateSession={openAddSessionModal} />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {mainTab === 'student' && (
        <div className="dbr-student-view">
          {!filters.batch ? (
            <div className="tm-empty tm-empty--banner">
              <i className="fas fa-filter" />
              <h4>Select a batch to view students</h4>
            </div>
          ) : studentsLoading ? (
            <div className="tm-empty"><i className="fas fa-spinner fa-spin" /><p>Loading students...</p></div>
          ) : (
            <>
          <div className="st-summary-bar">
            <div className="st-summary-bar__left">
              <div className="st-summary-bar__icon">
                <i className="fas fa-user-graduate" />
              </div>
              <div>
                <h3>Student Overview</h3>
                <p>Track attendance and performance for enrolled candidates</p>
              </div>
            </div>
            <div className="st-summary-stats">
              <div className="st-summary-stat">
                <div className="st-summary-stat__icon st-summary-stat__icon--blue">
                  <i className="fas fa-users" />
                </div>
                <div>
                  <strong>{students.length}</strong>
                  <span>Total Students</span>
                </div>
              </div>
              <div className="st-summary-stat">
                <div className="st-summary-stat__icon st-summary-stat__icon--green">
                  <i className="fas fa-check-circle" />
                </div>
                <div>
                  <strong>{students.filter((s) => s.status === 'Active').length}</strong>
                  <span>Active</span>
                </div>
              </div>
              <div className="st-summary-stat">
                <div className="st-summary-stat__icon st-summary-stat__icon--amber">
                  <i className="fas fa-exclamation-triangle" />
                </div>
                <div>
                  <strong>{students.filter((s) => s.status !== 'Active').length}</strong>
                  <span>At Risk</span>
                </div>
              </div>
              <div className="st-summary-stat">
                <div className="st-summary-stat__icon st-summary-stat__icon--pink">
                  <i className="fas fa-percentage" />
                </div>
                <div>
                  <strong>
                    {batchAttendanceSummary.average}%
                  </strong>
                  <span>
                    {batchAttendanceSummary.source === 'sessions'
                      ? `Avg across ${batchAttendanceSummary.sessionsMarked} marked sessions`
                      : 'Avg from admission record'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="st-grid">
            {students.length === 0 ? (
              <div className="tm-empty tm-empty--banner">
                <p>No students in this batch yet.</p>
              </div>
            ) : displayStudents.map((st) => (
              <StudentCard
                key={st.id}
                student={st}
                batchAttendance={computeStudentBatchAttendance(st.id, sessions, attendanceRecordsBySession)}
                onView={openStudentProfile}
                onAttendance={(student) => notify(`Attendance: ${student.name}`)}
                onAddPerformance={openPerformanceModal}
              />
            ))}
          </div>
            </>
          )}
        </div>
      )}

      {isSessionModalOpen && sessionDraft && (
        <AddSessionModal
          draft={sessionDraft}
          isEdit={!!editingSessionId}
          batchSummary={[
            activeBasicDetails.departmentName,
            activeBasicDetails.projectName,
            activeBasicDetails.centerName,
            activeBasicDetails.courseTrade,
            activeBasicDetails.batchCode,
          ].filter(Boolean).join(' · ')}
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
          students={students}
          sessions={sessions}
          attendanceRecordsBySession={attendanceRecordsBySession}
          view={attendanceModal.view}
          onViewChange={setAttendanceView}
          onStatusChange={(studentId, status) => updateAttendanceRow(studentId, 'status', status)}
          onClose={closeAttendanceModal}
          onSave={saveAttendanceRows}
        />
      )}

      {studentProfileModal.isOpen && studentProfileModal.student && (
        <StudentProfileModal
          student={studentProfileModal.student}
          sessions={sessions}
          attendanceRecordsBySession={attendanceRecordsBySession}
          basicDetails={activeBasicDetails}
          onClose={closeStudentProfile}
          onEditPerformance={openPerformanceModal}
        />
      )}

      {performanceModal.isOpen && performanceModal.draft && (
        <StudentPerformanceModal
          draft={performanceModal.draft}
          onClose={closePerformanceModal}
          onSave={savePerformanceDraft}
          onFieldChange={updatePerformanceDraft}
        />
      )}

      {referSessionModal.isOpen && (
        <ReferSessionModal
          session={selectedSession}
          batchLabel={referBatchLabel}
          counselorOptions={counselorOptions}
          counselorId={referSessionModal.counselorId}
          onCounselorChange={updateReferCounselor}
          candidates={referCandidates}
          loading={referCandidatesLoading}
          selectedIds={referSessionModal.selectedAppliedCourseIds}
          onToggleCandidate={toggleReferCandidate}
          onToggleAll={toggleAllReferCandidates}
          submitting={referSubmitting}
          onClose={closeReferSessionModal}
          onSubmit={handleReferSession}
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

  /* Session path picker cards */
  .tm-path-picker {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
    padding: 20px; margin-bottom: 14px; box-shadow: 0 10px 28px rgba(15,23,42,0.05);
  }
  .tm-path-picker__intro {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start;
    gap: 12px; margin-bottom: 16px;
  }
  .tm-path-picker__badge {
    display: inline-block; background: #eff6ff; color: ${BLUE}; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;
  }
  .tm-path-picker__intro h3 { margin: 0 0 4px; font-size: 1.25rem; font-weight: 900; color: #0f172a; }
  .tm-path-picker__intro p { margin: 0; font-size: 13px; color: #64748b; }
  .tm-path-picker__actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .tm-path-picker__back, .tm-path-picker__reset {
    border: 1px solid #e2e8f0; background: #fff; border-radius: 999px; padding: 8px 14px;
    font-size: 12px; font-weight: 700; cursor: pointer; color: #475569;
  }
  .tm-path-picker__reset { color: ${PINK}; border-color: #fecdd3; }
  .tm-path-picker__trail {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 14px;
    padding: 12px 14px; margin-bottom: 16px;
  }
  .tm-path-picker__crumb {
    display: inline-flex; flex-direction: column; gap: 2px; background: #fff;
    border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 12px; min-width: 120px;
  }
  .tm-path-picker__crumb i { color: ${PINK}; font-size: 11px; margin-bottom: 2px; }
  .tm-path-picker__crumb em {
    font-style: normal; font-size: 9px; font-weight: 800; text-transform: uppercase;
    color: #94a3b8; letter-spacing: 0.05em;
  }
  .tm-path-picker__crumb strong { font-size: 12px; color: #0f172a; line-height: 1.3; }
  .tm-path-picker__trail > i { color: #cbd5e1; font-size: 10px; }
  .tm-path-picker__grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px;
  }
  .tm-path-card-btn {
    display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
    text-align: left; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px;
    padding: 18px; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    position: relative; min-height: 140px;
  }
  .tm-path-card-btn:hover {
    transform: translateY(-4px); border-color: ${BLUE};
    box-shadow: 0 12px 30px rgba(37,99,235,0.12);
  }
  .tm-path-card-btn__icon {
    width: 44px; height: 44px; border-radius: 12px; background: #fff5f7;
    display: flex; align-items: center; justify-content: center; color: ${PINK}; font-size: 18px;
  }
  .tm-path-card-btn strong { font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.35; }
  .tm-path-card-btn span { font-size: 11px; color: #64748b; font-weight: 600; }
  .tm-path-card-btn__arrow {
    position: absolute; right: 16px; bottom: 16px; color: ${BLUE}; font-size: 12px;
  }
  .tm-path-picker__loading, .tm-path-picker__empty {
    text-align: center; padding: 48px 20px; color: #64748b;
  }
  .tm-path-picker__loading i, .tm-path-picker__empty i { font-size: 28px; color: #cbd5e1; margin-bottom: 12px; }
  .dbr-btn--ghost { background: #fff; color: #64748b; border-color: #cbd5e1; }
  .dbr-session-actions .dbr-filter-pill { min-width: 140px; max-width: 180px; margin: 0; }

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
  .st-summary-bar {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;
    background: #fff; border: 1px solid #fbcfe8; border-radius: 16px;
    padding: 16px 18px; margin-bottom: 16px;
    box-shadow: 0 10px 28px rgba(250,85,121,0.08);
  }
  .st-summary-bar__left { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .st-summary-bar__icon {
    width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
    background: linear-gradient(135deg, ${PINK}, #fb7185);
    color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px;
    box-shadow: 0 8px 20px rgba(250,85,121,0.25);
  }
  .st-summary-bar__left h3 { margin: 0 0 4px; font-size: 17px; font-weight: 900; color: #0f172a; }
  .st-summary-bar__left p { margin: 0; font-size: 12px; color: #64748b; }
  .st-summary-stats { display: flex; flex-wrap: wrap; gap: 10px; }
  .st-summary-stat {
    display: flex; align-items: center; gap: 10px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 10px 14px; min-width: 120px;
  }
  .st-summary-stat__icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0;
  }
  .st-summary-stat__icon--blue  { background: #dbeafe; color: #1d4ed8; }
  .st-summary-stat__icon--green { background: #d1fae5; color: #059669; }
  .st-summary-stat__icon--amber { background: #fef3c7; color: #d97706; }
  .st-summary-stat__icon--pink  { background: #fce7f3; color: ${PINK}; }
  .st-summary-stat strong { display: block; font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1.1; }
  .st-summary-stat span { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .st-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 14px;
  }
  .st-card {
    background: #fff; border: 1px solid #fbcfe8; border-radius: 16px; overflow: hidden;
    box-shadow: 0 10px 28px rgba(250,85,121,0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .st-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(250,85,121,0.16); }
  .st-card__head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 14px 16px;
    background: linear-gradient(105deg, #db2777 0%, ${PINK} 48%, #fb7185 100%);
  }
  .st-card__identity { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
  .st-card__avatar {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35);
    color: #fff; font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
  }
  .st-card__title-wrap { min-width: 0; }
  .st-card__name {
    margin: 0; font-size: 14px; font-weight: 900; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-card--multi { border-color: #f59e0b; box-shadow: 0 10px 28px rgba(245,158,11,0.14); }
  .st-card__course-line {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.95);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-card__course-line i { margin-right: 4px; opacity: 0.9; }
  .st-card__badges { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .st-card__multi-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 800; padding: 5px 8px; border-radius: 999px;
    background: rgba(255,255,255,0.95); color: #b45309; border: 1px solid rgba(255,255,255,0.5);
    white-space: nowrap;
  }
  .st-card__multi-note {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 10px 12px; margin-bottom: 12px;
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
    font-size: 11px; color: #92400e;
  }
  .st-card__multi-note i { margin-top: 2px; color: #d97706; flex-shrink: 0; }
  .st-card__multi-note strong { display: block; margin-bottom: 2px; font-size: 11px; }
  .st-card__multi-note p { margin: 0; line-height: 1.45; }
  .st-card__multi-note em { font-style: normal; font-weight: 800; color: #78350f; }
  .st-card__details {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;
  }
  .st-card__detail-item {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; min-width: 0;
  }
  .st-card__detail-item span {
    display: block; font-size: 9px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;
  }
  .st-card__detail-item strong {
    display: block; font-size: 11px; font-weight: 800; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-card__id {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.86); margin-top: 2px;
  }
  .st-card__status {
    display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
    font-size: 10px; font-weight: 800; padding: 6px 10px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.35); white-space: nowrap;
  }
  .st-card__status--active { background: rgba(16,185,129,0.92); color: #fff; }
  .st-card__status--risk  { background: rgba(245,158,11,0.92); color: #fff; }
  .st-card__body { padding: 16px; }
  .st-card__attendance { margin-bottom: 14px; }
  .st-card__attendance-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
    font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .st-card__attendance-note {
    display: block;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
  }
  .st-card__att-val { font-size: 15px; font-weight: 900; }
  .st-card__att-val--high { color: #059669; }
  .st-card__att-val--mid  { color: #d97706; }
  .st-card__att-val--low  { color: #dc2626; }
  .st-card__progress { height: 7px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
  .st-card__progress-fill { height: 100%; border-radius: 999px; transition: width 0.35s ease; }
  .st-card__progress-fill--high { background: linear-gradient(90deg, #059669, #34d399); }
  .st-card__progress-fill--mid  { background: linear-gradient(90deg, #d97706, #fbbf24); }
  .st-card__progress-fill--low  { background: linear-gradient(90deg, #dc2626, #f87171); }
  .st-card__meta {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;
  }
  .st-card__meta-item {
    display: flex; align-items: center; gap: 10px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; min-width: 0;
  }
  .st-card__meta-icon {
    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 12px;
  }
  .st-card__meta-icon--blue { background: #dbeafe; color: #1d4ed8; }
  .st-card__meta-icon--pink { background: #fce7f3; color: ${PINK}; }
  .st-card__meta-item span {
    display: block; font-size: 9px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .st-card__meta-item strong {
    display: block; font-size: 12px; font-weight: 800; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-card__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .st-card__actions .st-card__btn--performance { grid-column: 1 / -1; }
  .st-card__btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border-radius: 10px; padding: 9px 10px; font-size: 11px; font-weight: 800;
    cursor: pointer; border: 1px solid transparent; transition: background 0.15s, transform 0.15s;
  }
  .st-card__btn--primary { background: ${PINK}; color: #fff; border-color: ${PINK}; }
  .st-card__btn--primary:hover { filter: brightness(0.96); transform: translateY(-1px); }
  .st-card__btn--ghost { background: #fff; color: ${BLUE}; border-color: rgba(37,99,235,0.2); }
  .st-card__btn--ghost:hover { background: #eff6ff; transform: translateY(-1px); }
  .st-card__btn--performance {
    background: linear-gradient(90deg, #db2777, ${PINK});
    color: #fff;
    border-color: ${PINK};
  }
  .st-card__btn--performance:hover { filter: brightness(0.96); transform: translateY(-1px); }

  /* Student performance form modal */
  .st-perf-backdrop {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(15,23,42,0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .st-perf-modal {
    width: min(760px, 100%);
    max-height: calc(100vh - 40px);
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 30px 80px rgba(15,23,42,0.28);
  }
  .st-perf-modal__head,
  .st-perf-modal__foot {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 16px 18px; border-bottom: 1px solid #e2e8f0;
  }
  .st-perf-modal__foot { border-top: 1px solid #e2e8f0; border-bottom: 0; justify-content: flex-end; }
  .st-perf-modal__head h5 { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; }
  .st-perf-modal__head span { color: #64748b; font-size: 12px; font-weight: 800; }
  .st-perf-modal__body { overflow-y: auto; padding: 18px; }
  .st-perf-modal__hint {
    margin: 0 0 14px; padding: 12px 14px; border-radius: 10px;
    background: #fff5f7; border: 1px solid #fbcfe8;
    color: #64748b; font-size: 12px; font-weight: 600;
  }
  .st-perf-modal__body .session-field span i { margin-right: 6px; color: ${PINK}; }

  /* Refer session modal */
  .st-refer-backdrop {
    position: fixed; inset: 0; z-index: 10001;
    background: rgba(15,23,42,0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .st-refer-modal {
    width: min(640px, 100%);
    max-height: calc(100vh - 40px);
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 30px 80px rgba(15,23,42,0.28);
  }
  .st-refer-modal__head,
  .st-refer-modal__foot {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 16px 18px; border-bottom: 1px solid #e2e8f0;
  }
  .st-refer-modal__foot { border-top: 1px solid #e2e8f0; border-bottom: 0; justify-content: flex-end; }
  .st-refer-modal__head h5 { margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; }
  .st-refer-modal__head span { color: #64748b; font-size: 12px; font-weight: 800; }
  .st-refer-modal__body { overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 14px; }
  .st-refer-modal__hint {
    margin: 0; padding: 12px 14px; border-radius: 10px;
    background: #eff6ff; border: 1px solid #bfdbfe;
    color: #64748b; font-size: 12px; font-weight: 600;
  }
  .st-refer-candidates {
    border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fafbfc;
  }
  .st-refer-candidates__head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 12px 14px; border-bottom: 1px solid #e2e8f0; background: #fff;
  }
  .st-refer-candidates__head strong { font-size: 13px; color: #0f172a; }
  .st-refer-select-all {
    border: 0; background: transparent; color: ${BLUE}; font-size: 12px; font-weight: 800; cursor: pointer;
  }
  .st-refer-select-all:hover { text-decoration: underline; }
  .st-refer-candidate-list { max-height: 260px; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
  .st-refer-candidate {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer;
  }
  .st-refer-candidate--active { border-color: ${BLUE}; background: #eff6ff; }
  .st-refer-candidate input { width: 16px; height: 16px; accent-color: ${BLUE}; flex-shrink: 0; }
  .st-refer-candidate strong { display: block; font-size: 13px; color: #0f172a; }
  .st-refer-candidate span { display: block; font-size: 11px; color: #64748b; margin-top: 2px; }
  .st-refer-empty {
    padding: 24px 16px; text-align: center; color: #64748b; font-size: 13px; font-weight: 600;
  }
  .st-refer-empty i { margin-right: 8px; color: ${BLUE}; }

  /* Student profile modal */
  .st-profile-backdrop {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(15,23,42,0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .st-profile-modal {
    width: min(920px, 100%);
    max-height: calc(100vh - 40px);
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 30px 80px rgba(15,23,42,0.28);
  }
  .st-profile-modal__head {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 18px 20px;
    background: linear-gradient(105deg, #db2777 0%, ${PINK} 48%, #fb7185 100%);
  }
  .st-profile-modal__identity { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .st-profile-modal__avatar {
    width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
    background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35);
    color: #fff; font-size: 16px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
  }
  .st-profile-modal__identity h3 {
    margin: 0 0 4px; font-size: 20px; font-weight: 900; color: #fff;
  }
  .st-profile-modal__identity p {
    margin: 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.88);
  }
  .st-profile-modal__head-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .st-profile-modal__close {
    width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.16); border-radius: 10px;
    color: #fff; cursor: pointer;
  }
  .st-profile-modal__close:hover { background: rgba(255,255,255,0.28); }
  .st-profile-modal__body { overflow-y: auto; padding: 20px; }
  .st-profile-modal__foot {
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 14px 20px; border-top: 1px solid #e2e8f0; background: #fafbfc;
  }
  .st-profile-stats {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px;
  }
  .st-profile-stat {
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 10px;
  }
  .st-profile-stat__icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 13px; margin-bottom: 2px;
  }
  .st-profile-stat__icon--pink  { background: #fce7f3; color: ${PINK}; }
  .st-profile-stat__icon--green { background: #d1fae5; color: #059669; }
  .st-profile-stat__icon--red   { background: #fee2e2; color: #dc2626; }
  .st-profile-stat__icon--blue  { background: #dbeafe; color: #1d4ed8; }
  .st-profile-stat strong { font-size: 18px; font-weight: 900; color: #0f172a; line-height: 1.1; }
  .st-profile-stat span {
    font-size: 10px; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .st-profile-section { margin-bottom: 18px; }
  .st-profile-section h4 {
    margin: 0 0 12px; font-size: 14px; font-weight: 900; color: #0f172a;
    display: flex; align-items: center; gap: 8px;
  }
  .st-profile-section h4 i { color: ${PINK}; }
  .st-profile-info-grid {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;
  }
  .st-profile-info-item {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;
  }
  .st-profile-info-item span {
    display: block; font-size: 10px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;
  }
  .st-profile-info-item span i { margin-right: 6px; color: ${BLUE}; }
  .st-profile-info-item strong {
    display: block; font-size: 13px; font-weight: 800; color: #0f172a;
    word-break: break-word;
  }
  .st-profile-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .st-profile-metric {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;
  }
  .st-profile-metric__head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    margin-bottom: 8px; font-size: 12px; font-weight: 800; color: #334155;
  }
  .st-profile-metric__head span { display: inline-flex; align-items: center; gap: 8px; }
  .st-profile-metric__icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
  }
  .st-profile-metric__icon--blue  { background: #dbeafe; color: #1d4ed8; }
  .st-profile-metric__icon--pink  { background: #fce7f3; color: ${PINK}; }
  .st-profile-metric__icon--green { background: #d1fae5; color: #059669; }
  .st-profile-metric__icon--amber { background: #fef3c7; color: #d97706; }
  .st-profile-remark {
    margin: 0; padding: 14px 16px; border-radius: 12px;
    background: #fff5f7; border: 1px solid #fbcfe8;
    color: #475569; font-size: 13px; line-height: 1.55;
  }
  .st-profile-table-wrap {
    border: 1px solid #e2e8f0; border-radius: 12px; overflow: auto;
  }
  .st-profile-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .st-profile-table th,
  .st-profile-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eef2f7; }
  .st-profile-table th {
    background: #f8fafc; font-size: 10px; font-weight: 800; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .st-profile-table tbody tr:last-child td { border-bottom: 0; }
  .st-profile-pill {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 88px; padding: 4px 10px; border-radius: 999px;
    font-size: 10px; font-weight: 900;
  }
  .st-profile-pill--present { background: #dcfce7; color: #047857; }
  .st-profile-pill--absent { background: #fee2e2; color: #b91c1c; }
  .st-profile-pill--not-marked { background: #e2e8f0; color: #475569; }
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
    // grid-template-columns: 300px minmax(0, 1fr);
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
  .tm-empty--banner {
    background: #fff; border: 1px dashed #cbd5e1; border-radius: 14px;
    padding: 32px 24px; text-align: center; margin: 16px 0;
  }
  .tm-empty--banner h4 { margin: 12px 0 8px; font-size: 16px; font-weight: 800; color: #334155; }
  .tm-empty--banner p { margin: 0 0 6px; color: #64748b; font-size: 13px; }
  .tm-empty__hint { font-size: 12px !important; color: #94a3b8 !important; }
  .tm-empty--session-create {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    min-height: 320px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 48px 24px;
  }
  .tm-empty--session-create i { font-size: 42px; color: #cbd5e1; margin-bottom: 16px; }
  .tm-empty--session-create p { font-size: 14px; color: #64748b; margin-bottom: 20px; }
  .tm-create-session-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 999px; border: 1px solid #e2e8f0;
    background: #fff; color: ${PINK}; font-size: 14px; font-weight: 700;
    cursor: pointer; box-shadow: 0 4px 14px rgba(15,23,42,0.06);
  }
  .tm-create-session-btn:hover { border-color: #fecdd3; background: #fff5f7; }
  .tm-sidebar--profile-only { align-self: start; }
  .dbr-search--full { width: 100%; max-width: none; }
  .session-add-panel {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    overflow: hidden; box-shadow: 0 8px 24px rgba(15,23,42,0.06);
  }
  .session-add-panel__head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 12px; padding: 18px 20px; border-bottom: 1px solid #f1f5f9;
  }
  .session-add-panel__head h4 { margin: 0 0 4px; font-size: 18px; font-weight: 800; color: #0f172a; }
  .session-add-panel__head p { margin: 0; font-size: 12px; color: #64748b; }
  .session-add-panel__body { padding: 20px; }
  .session-add-panel__foot {
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 16px 20px; border-top: 1px solid #f1f5f9; background: #fafbfc;
  }
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
  .sc-head-tab {
    border: 1px solid rgba(255,255,255,0.38);
    background: rgba(255,255,255,0.16);
    color: #fff;
    height: 31px;
    padding: 0 12px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }
  .sc-head-tab:hover { background: rgba(255,255,255,0.26); }
  .session-feedback-modal { max-width: 480px; }
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
  .session-modal__context {
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    line-height: 1.5;
  }
  .session-form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px 16px;
  }
  .session-field { display: flex; flex-direction: column; gap: 6px; margin: 0; }
  .session-field span {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  .session-field__control {
    min-height: 40px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    background: #f8fafc;
    width: 100%;
    box-sizing: border-box;
  }
  .session-field__control:focus {
    outline: none;
    border-color: ${BLUE};
    background: #fff;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
  }
  .session-field__control::placeholder { color: #94a3b8; font-weight: 500; }
  .session-field__control--date,
  .session-field__control--time {
    color: #0f172a;
  }
  .session-field__control--date:invalid,
  .session-field__control--time:invalid {
    color: #94a3b8;
  }
  .session-field--full { margin-top: 14px; grid-column: 1 / -1; }
  .session-field--full .session-field__control { min-height: 88px; resize: vertical; }
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

  /* Students — styles defined earlier in sheet */
  .dbr-student-view { margin-bottom: 20px; }

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
    .tm-path-picker__grid { grid-template-columns: 1fr; }
    .tm-sidebar { position: static; }
    .tm-session-panel__list { max-height: 240px; }
    .tm-tabs { width: 100%; }
    .tm-tab { flex: 1; justify-content: center; padding: 10px 12px; }
    .tm-toolbar { flex-direction: column; align-items: stretch; }
    .tm-search { max-width: none; }
    .tm-student-grid { grid-template-columns: 1fr; }
    .st-grid { grid-template-columns: 1fr; }
    .st-summary-stats { width: 100%; }
    .st-summary-stat { flex: 1; min-width: calc(50% - 5px); }
    .st-card__meta { grid-template-columns: 1fr; }
    .st-card__actions { grid-template-columns: 1fr; }
    .st-profile-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .st-profile-info-grid { grid-template-columns: 1fr; }
    .st-profile-metrics { grid-template-columns: 1fr; }
    .st-profile-backdrop { padding: 10px; align-items: flex-start; }
    .st-profile-modal { max-height: calc(100vh - 20px); }
    .st-perf-backdrop { padding: 10px; align-items: flex-start; }
    .st-perf-modal { max-height: calc(100vh - 20px); }
    .st-refer-backdrop { padding: 10px; align-items: flex-start; }
    .st-refer-modal { max-height: calc(100vh - 20px); }
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
