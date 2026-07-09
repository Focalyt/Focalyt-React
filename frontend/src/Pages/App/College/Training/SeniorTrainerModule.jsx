import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

const PINK = '#fa5579';
const BLUE = '#2563eb';
const AMBER = '#d97706';
const GREEN = '#059669';

const AC_SESSIONS_STORAGE_PREFIX = 'acCoordinatorSessions:';
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getOptionLabel = (options = [], value) =>
  options.find((option) => String(option.value) === String(value))?.label || '';

const mapApiOptions = (items = []) =>
  (items || [])
    .filter((item) => item && item._id && item.name)
    .map((item) => ({ value: String(item._id), label: item.name }));

const formatSessionDate = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-IN');
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

const loadCoordinatorSessions = (batchId) => {
  if (!batchId) return [];
  try {
    const raw = localStorage.getItem(`${AC_SESSIONS_STORAGE_PREFIX}${batchId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistCoordinatorSessions = (batchId, list) => {
  if (!batchId) return;
  try {
    localStorage.setItem(`${AC_SESSIONS_STORAGE_PREFIX}${batchId}`, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save coordinator sessions', err);
  }
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

const buildMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    cells.push({
      date,
      dateKey: date.toISOString().slice(0, 10),
      day,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      date,
      dateKey: date.toISOString().slice(0, 10),
      day,
      isCurrentMonth: true,
    });
  }

  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month + 1, nextMonthDay);
    cells.push({
      date,
      dateKey: date.toISOString().slice(0, 10),
      day: nextMonthDay,
      isCurrentMonth: false,
    });
    nextMonthDay += 1;
  }

  return cells;
};

const TrainingCalendar = ({
  title,
  icon,
  accent = GREEN,
  sessions,
  calendarMonth,
  onMonthChange,
  selectedSessionId,
  onSelectSession,
}) => {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const todayKey = new Date().toISOString().slice(0, 10);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((session) => {
      const key = parseSessionDateKey(session);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(session);
    });
    return map;
  }, [sessions]);

  return (
    <div className="st-calendar" style={{ '--calendar-accent': accent }}>
      <div className="st-calendar__title-bar">
        <div className="st-calendar__title">
          <i className={`fas ${icon}`} />
          <span>{title}</span>
        </div>
        <span className="st-calendar__count">{sessions.length} plan(s)</span>
      </div>
      <div className="st-calendar__head">
        <button type="button" className="st-calendar__nav" onClick={() => onMonthChange(-1)}>
          <i className="fas fa-chevron-left" />
        </button>
        <h3>{MONTH_NAMES[month]} {year}</h3>
        <button type="button" className="st-calendar__nav" onClick={() => onMonthChange(1)}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      <div className="st-calendar__weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="st-calendar__grid">
        {grid.map((cell) => {
          const daySessions = sessionsByDate[cell.dateKey] || [];
          const isToday = cell.dateKey === todayKey;
          return (
            <div
              key={cell.dateKey}
              className={`st-calendar__day${cell.isCurrentMonth ? '' : ' st-calendar__day--muted'}${isToday ? ' st-calendar__day--today' : ''}`}
            >
              <span className="st-calendar__day-num">{cell.day}</span>
              <div className="st-calendar__events">
                {daySessions.slice(0, 3).map((session) => {
                  const color = getSessionChipColor(session);
                  const isSelected = resolveSessionSelectionId(selectedSessionId) === resolveSessionSelectionId(session.id);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      className={`st-calendar__event${isSelected ? ' st-calendar__event--selected' : ''}`}
                      style={{ '--event-color': color }}
                      onClick={() => onSelectSession(session.id)}
                      title={`${session.title} · ${session.startTime || ''}`}
                    >
                      <span className="st-calendar__event-dot" />
                      <span className="st-calendar__event-text">{session.title}</span>
                    </button>
                  );
                })}
                {daySessions.length > 3 && (
                  <span className="st-calendar__more">+{daySessions.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  onAssignmentChange,
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
        {filters.batch
          ? 'No sessions to show for this batch.'
          : 'Select center, course and batch to load sessions.'}
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
                    <small>{session.startTime || '—'} – {session.endTime || '—'}</small>
                  </td>
                  <td>
                    <span className={`st-table-type st-table-type--${typeBadge}`}>
                      {getSessionTypeLabel(session)}
                    </span>
                    <small>{getSessionActivityLabel(session)}</small>
                  </td>
                  <td className="st-table-cell--control" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      className="st-table-input"
                      value={assignDate}
                      onChange={(e) => onAssignmentChange?.(session.id, 'assignDate', e.target.value)}
                    />
                  </td>
                  <td>{getDayNameFromDate(assignDate)}</td>
                  <td className="st-table-cell--control" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="st-table-select"
                      value={draft.trainerId || ''}
                      disabled={loadingTrainers}
                      onChange={(e) => onAssignmentChange?.(session.id, 'trainerId', e.target.value)}
                    >
                      <option value="">{loadingTrainers ? 'Loading...' : 'Select trainer'}</option>
                      {trainerOptions.map((trainer) => (
                        <option key={trainer.value} value={trainer.value}>
                          {trainer.label}
                        </option>
                      ))}
                    </select>
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

const SeniorSessionCard = ({ session }) => {
  const tone = STATUS_TONE[session.workflowStatus] || 'blue';
  const activities = getSessionActivities(session);
  const headStyle = buildActivityHeadStyle(activities);
  const primaryColor = activities[0]?.color || BLUE;
  const totSession = isTotSession(session);
  const showTotDetails = session.includeTot === true || session.sessionType === SESSION_TYPE.TOT;
  const evidenceCounts = countMaterials(session.evidenceDocs);
  const learningCounts = countMaterials(session.learningMaterials);
  const totProofCounts = countMaterials(session.totCompletionProofs);
  const totMaterialCounts = countMaterials(session.totMaterials);

  return (
    <article
      className={`st-session-card${activities.length ? '' : ' st-session-card--no-activity'}`}
      style={activities.length ? { borderLeftColor: primaryColor } : undefined}
    >
      <div className="st-session-card__label">
        <i className="fas fa-eye" /> Session details
      </div>
      <div
        className={`st-session-card__head${activities.length ? '' : ' st-session-card__head--neutral'}`}
        style={headStyle}
      >
        <div>
          <h4>{session.title}</h4>
          <p>{session.topicCovered || 'No topic added'}</p>
          <div className="st-session-card__badges">
            {activities.map((activity) => (
              <span key={activity.id} className="st-activity-badge" style={{ background: activity.color || BLUE }}>
                {activity.name}
              </span>
            ))}
            <span className={`st-type-badge st-type-badge--${totSession && session.sessionType === SESSION_TYPE.TOT && session.includeTot !== true ? 'tot' : 'student'}`}>
              {session.sessionType === SESSION_TYPE.TOT && session.includeTot !== true ? 'TOT Session' : 'Student Session'}
            </span>
            {session.includeTot === true && (
              <span className="st-type-badge st-type-badge--tot">TOT Linked</span>
            )}
          </div>
        </div>
        <span className={`st-status-pill st-status-pill--${tone}`}>
          {session.workflowStatus}
        </span>
      </div>

      <div className="st-session-card__grid">
        <div><em>Date</em><strong>{session.date || formatSessionDate(session.sessionDate)}</strong></div>
        <div><em>Time</em><strong>{session.startTime || '—'} – {session.endTime || '—'}</strong></div>
        <div><em>Method</em><strong>{session.trainingMethod || '—'}</strong></div>
        <div><em>Senior Trainer</em><strong>{session.seniorTrainerName || 'Not assigned'}</strong></div>
        <div><em>Field Trainer</em><strong>{session.fieldTrainerName || '—'}</strong></div>
        {showTotDetails && (
          <div><em>TOT Trainer</em><strong>{session.totTrainerName || '—'}</strong></div>
        )}
        {showTotDetails && (
          <div><em>TOT Topic</em><strong>{getTotDisplayTopic(session) || '—'}</strong></div>
        )}
        {showTotDetails && (
          <div>
            <em>TOT Status</em>
            <strong className={session.totStatus === 'completed' ? 'st-text--green' : 'st-text--amber'}>
              {session.totStatus === 'completed' ? 'TOT Completed' : 'TOT Pending'}
            </strong>
          </div>
        )}
        <div><em>Batch</em><strong>{session.batchCode || '—'}</strong></div>
        <div><em>Course</em><strong>{session.courseTrade || '—'}</strong></div>
        {showTotDetails ? (
          <>
            <div><em>Documents</em><strong>{evidenceCounts.total || '—'}</strong></div>
            <div><em>Learning material</em><strong>{learningCounts.total || '—'}</strong></div>
            <div><em>TOT proofs</em><strong>{totProofCounts.total} defined</strong></div>
            <div><em>TOT material</em><strong>{totMaterialCounts.total} item(s)</strong></div>
          </>
        ) : (
          <>
            <div><em>Documents</em><strong>{evidenceCounts.total || '—'}</strong></div>
            <div><em>Learning material</em><strong>{learningCounts.total || '—'}</strong></div>
          </>
        )}
      </div>

      {session.notes && (
        <div className="st-session-card__notes">
          <i className="far fa-sticky-note" />
          <p>{session.notes}</p>
        </div>
      )}

      <div className="st-session-card__source">
        <i className="fas fa-info-circle" />
        Planned by Academic Coordinator
      </div>
    </article>
  );
};

const SeniorTrainerModule = () => {
  const userData = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
  const token = userData.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

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
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

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

  const filteredCourseOptions = useMemo(() => {
    if (!filters.center) return [];
    const centerMeta = allCentersMeta.find((item) => String(item._id) === String(filters.center));
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
  }, [filters.center, allCentersMeta, courseOptions, allCoursesMeta]);

  const reloadSessions = useCallback(() => {
    if (!filters.batch) {
      setSessions([]);
      return;
    }
    setSessions(loadCoordinatorSessions(filters.batch));
  }, [filters.batch]);

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
        const res = await axios.get(`${backendUrl}/college/trainer/trainers`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        const trainers = (res.data?.data || [])
          .filter((trainer) => trainer.status !== false)
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

  const handleAssignmentChange = useCallback((sessionId, field, value) => {
    setAssignmentDrafts((prev) => {
      const nextDrafts = {
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          [field]: value,
        },
      };

      setSessions((prevSessions) => {
        const nextSessions = prevSessions.map((session) => {
          if (session.id !== sessionId) return session;

          const draft = nextDrafts[sessionId];
          const trainerId = draft.trainerId || '';
          const trainerName = trainerId
            ? (trainerOptions.find((trainer) => String(trainer.value) === String(trainerId))?.label || session.fieldTrainerName || '')
            : '';
          const sessionDate = draft.assignDate || session.sessionDate || session.date;
          const formattedDate = formatSessionDate(sessionDate);

          return {
            ...session,
            fieldTrainerId: trainerId,
            fieldTrainerName: trainerName,
            sessionDate,
            date: formattedDate,
            workflowStatus: trainerId
              ? WORKFLOW_STATUS.ASSIGNED
              : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
                ? WORKFLOW_STATUS.SENT_TO_SENIOR
                : session.workflowStatus),
          };
        });
        persistCoordinatorSessions(filters.batch, nextSessions);
        return nextSessions;
      });

      return nextDrafts;
    });
  }, [filters.batch, trainerOptions]);

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
    setSessions([]);
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

  const handleMonthChange = (delta) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleSelectSession = (sessionId) => {
    const resolvedId = resolveSessionSelectionId(sessionId);
    setSelectedSessionId((prev) => (resolveSessionSelectionId(prev) === resolvedId ? '' : resolvedId));
    const session = sessions.find((item) => item.id === resolvedId);
    if (session?.sessionDate) {
      const date = new Date(session.sessionDate);
      if (!Number.isNaN(date.getTime())) {
        setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
  };

  return (
    <div className="st-portal">
      <style>{ST_CSS}</style>

      <header className="st-header">
        <div>
          <div className="st-role-badge">
            <i className="fas fa-user-shield" /> Senior Trainer
          </div>
          <h1 className="st-title">Training Calendar</h1>
          <nav className="st-breadcrumb">
            <span>Training Module</span><span>/</span>
            <span className="st-breadcrumb--active">Senior Trainer</span>
          </nav>

        </div>
        <div className="st-header-meta">
          <div className="st-header-user">
            <i className="fas fa-user-circle" />
            <span>{userData.name || 'Senior Trainer'}</span>
          </div>
          <div className="st-header-date">
            <i className="fas fa-calendar-alt" />
            <DatePicker value={reportDate} onChange={setReportDate} format="dd/MM/yyyy" clearIcon={null} />
          </div>
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
            title="Session Calendar"
            icon="fa-user-graduate"
            accent={GREEN}
            sessions={studentSessions}
            calendarMonth={calendarMonth}
            onMonthChange={handleMonthChange}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
          <TrainingCalendar
            title="TOT Calendar"
            icon="fa-chalkboard-teacher"
            accent={BLUE}
            sessions={totSessions}
            calendarMonth={calendarMonth}
            onMonthChange={handleMonthChange}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>

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
          onAssignmentChange={handleAssignmentChange}
        />

        <div className="st-detail-panel">
          {selectedSession ? (
            <SeniorSessionCard session={selectedSession} />
          ) : (
            <div className="st-detail-empty">
              <i className="fas fa-hand-pointer" />
              <h4>Select a session</h4>
              <p>Click any event on the Session or TOT calendar, or a row in the table, to view its full plan card.</p>
              {!filters.batch && (
                <p className="st-detail-empty__hint">
                  Select Center → Course → Batch in the session list filters to load plans.
                </p>
              )}
              {filters.batch && !totSessions.length && !studentSessions.length && (
                <p className="st-detail-empty__hint">
                  No sessions found for this batch. Create plans in Academic Coordinator first.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ST_CSS = `
  .st-portal {
    min-height: 100vh;
    background: linear-gradient(180deg, #f0fdf4 0%, #f4f6f9 140px, #f4f6f9 100%);
    padding: 16px 20px 100px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #1e293b;
  }
  .st-header {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 22px;
    margin-bottom: 18px; box-shadow: 0 18px 40px rgba(15,23,42,0.06);
  }
  .st-role-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: #ecfdf5; color: ${GREEN}; font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 12px; border-radius: 999px; margin-bottom: 10px;
  }
  .st-title { margin: 0 0 6px; font-size: 1.6rem; font-weight: 900; color: #0f172a; }
  .st-subtitle { margin: 8px 0 0; font-size: 13px; color: #64748b; max-width: 560px; line-height: 1.5; }
  .st-breadcrumb { font-size: 12px; color: #64748b; display: flex; gap: 6px; align-items: center; }
  .st-breadcrumb--active { color: ${GREEN}; font-weight: 700; }
  .st-header-meta { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
  .st-header-user, .st-header-date {
    display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #334155;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 14px;
  }
  .st-header-date .react-date-picker { border: none; font-size: 13px; }
  .st-header-date .react-date-picker__wrapper { border: none; background: transparent; }

  .st-filters, .st-toolbar, .st-calendar, .st-detail-panel, .st-session-card, .st-sessions-table-wrap, .st-empty-state {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.05);
  }
  .st-filters { padding: 18px 20px; margin-bottom: 16px; }
  .st-filters__head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px;
  }
  .st-filters__head h3 {
    margin: 0 0 4px; font-size: 15px; font-weight: 800; color: #0f172a;
    display: flex; align-items: center; gap: 8px;
  }
  .st-filters__head h3 i { color: ${GREEN}; }
  .st-filters__head p { margin: 0; font-size: 12px; color: #64748b; }
  .st-filters__grid {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;
  }
  .st-filter-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .st-filter-field span {
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;
  }
  .st-filter-select {
    width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 12px;
    font-size: 13px; font-weight: 600; color: #0f172a; background: #fff; outline: none;
  }
  .st-filter-select:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
  .st-filter-select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
  .st-empty-state {
    text-align: center; padding: 56px 24px; color: #64748b;
  }
  .st-empty-state i { font-size: 32px; color: #cbd5e1; margin-bottom: 12px; display: block; }
  .st-empty-state h3 { margin: 0 0 8px; font-size: 1.1rem; color: #0f172a; }
  .st-empty-state p { margin: 0; font-size: 13px; line-height: 1.5; }

  .st-toolbar {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
    padding: 14px 18px; margin-bottom: 14px;
  }
  .st-toolbar__label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
  .st-toolbar strong { font-size: 14px; color: #0f172a; }
  .st-toolbar__actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .st-btn {
    border: none; border-radius: 10px; padding: 9px 14px; font-size: 12px; font-weight: 800; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .st-btn--ghost { background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; }

  .st-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 14px; }
  .st-stat {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px;
    box-shadow: 0 8px 20px rgba(15,23,42,0.04);
  }
  .st-stat strong { display: block; font-size: 1.4rem; font-weight: 900; color: #0f172a; }
  .st-stat span { font-size: 12px; color: #64748b; font-weight: 700; }
  .st-stat--green strong { color: ${GREEN}; }
  .st-stat--amber strong { color: ${AMBER}; }

  .st-workspace { display: flex; flex-direction: column; gap: 16px; }
  .st-dual-calendars { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  .st-calendar { padding: 0; overflow: hidden; }
  .st-calendar__title-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 12px 14px; border-bottom: 1px solid #eef2f7; background: color-mix(in srgb, var(--calendar-accent, ${GREEN}) 8%, white);
  }
  .st-calendar__title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 900; color: #0f172a; }
  .st-calendar__title i { color: var(--calendar-accent, ${GREEN}); }
  .st-calendar__count {
    font-size: 11px; font-weight: 800; color: var(--calendar-accent, ${GREEN});
    background: color-mix(in srgb, var(--calendar-accent, ${GREEN}) 14%, white);
    padding: 4px 10px; border-radius: 999px;
  }
  .st-calendar__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 14px 14px 0; }
  .st-calendar__head h3 { margin: 0; font-size: 1.1rem; font-weight: 900; }
  .st-calendar__nav {
    width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; color: #475569;
  }
  .st-calendar__weekdays {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px; padding: 0 14px;
  }
  .st-calendar__weekdays span {
    text-align: center; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; padding: 6px 0;
  }
  .st-calendar__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 0 14px 14px; }
  .st-calendar__day {
    min-height: 96px; border: 1px solid #eef2f7; border-radius: 10px; padding: 6px; background: #fafbfc;
    display: flex; flex-direction: column; gap: 4px;
  }
  .st-calendar__day--muted { opacity: 0.45; }
  .st-calendar__day--today { border-color: ${GREEN}; box-shadow: inset 0 0 0 1px ${GREEN}; }
  .st-calendar__day-num { font-size: 12px; font-weight: 800; color: #334155; }
  .st-calendar__events { display: flex; flex-direction: column; gap: 3px; }
  .st-calendar__event {
    display: flex; align-items: center; gap: 5px; width: 100%; border: none; border-radius: 6px;
    padding: 3px 6px; background: color-mix(in srgb, var(--event-color, ${BLUE}) 14%, white);
    cursor: pointer; text-align: left;
  }
  .st-calendar__event--selected {
    background: color-mix(in srgb, var(--event-color, ${BLUE}) 28%, white);
    box-shadow: inset 0 0 0 1.5px var(--event-color, ${BLUE});
  }
  .st-calendar__event-dot {
    width: 7px; height: 7px; border-radius: 999px; background: var(--event-color, ${BLUE}); flex-shrink: 0;
  }
  .st-calendar__event-text {
    font-size: 10px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-calendar__more { font-size: 10px; color: #94a3b8; font-weight: 700; padding-left: 4px; }

  .st-detail-panel { padding: 16px; min-height: auto; }
  .st-detail-empty { text-align: center; padding: 48px 20px; color: #64748b; }
  .st-detail-empty i { font-size: 32px; color: #cbd5e1; margin-bottom: 12px; }
  .st-detail-empty h4 { margin: 0 0 8px; color: #0f172a; }
  .st-detail-empty p { margin: 0; font-size: 13px; line-height: 1.5; }
  .st-detail-empty__hint { margin-top: 12px !important; color: ${AMBER}; font-weight: 700; }

  .st-sessions-table-wrap { padding: 16px 18px; }
  .st-sessions-table__head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px;
  }
  .st-sessions-table__head h3 {
    margin: 0; font-size: 15px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 8px;
  }
  .st-sessions-table__head h3 i { color: ${GREEN}; }
  .st-sessions-table__head span { font-size: 12px; font-weight: 700; color: #64748b; }
  .st-sessions-table__filters {
    display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; padding: 14px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;
  }
  .st-sessions-table__clear { align-self: flex-start; }
  .st-sessions-table__empty { margin: 0; padding: 20px 0; text-align: center; color: #94a3b8; font-size: 13px; }
  .st-sessions-table-scroll { overflow-x: auto; }
  .st-sessions-table { width: 100%; border-collapse: collapse; min-width: 640px; }
  .st-sessions-table thead th {
    text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    color: #94a3b8; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
  }
  .st-sessions-table__row { cursor: pointer; transition: background 0.12s; }
  .st-sessions-table__row:hover { background: #f8fafc; }
  .st-sessions-table__row--selected { background: #ecfdf5 !important; box-shadow: inset 3px 0 0 ${GREEN}; }
  .st-sessions-table td {
    padding: 12px; border-bottom: 1px solid #eef2f7; font-size: 13px; color: #0f172a; vertical-align: middle;
  }
  .st-sessions-table td:first-child { width: 56px; font-weight: 800; color: #64748b; }
  .st-sessions-table td strong { display: block; font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
  .st-sessions-table td small { display: block; font-size: 11px; color: #94a3b8; font-weight: 600; }
  .st-table-type {
    display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase;
    margin-bottom: 4px;
  }
  .st-table-type--tot { background: #dbeafe; color: #1d4ed8; }
  .st-table-type--linked { background: #ede9fe; color: #6d28d9; }
  .st-table-type--student { background: #d1fae5; color: #065f46; }
  .st-table-cell--control { min-width: 150px; }
  .st-table-input, .st-table-select {
    width: 100%; min-width: 130px; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 8px 10px; font-size: 12px; font-weight: 600; color: #0f172a; background: #fff;
  }
  .st-table-input:focus, .st-table-select:focus {
    outline: none; border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
  }
  .st-table-select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

  .st-session-card { overflow: hidden; border-left: 4px solid ${GREEN}; }
  .st-session-card--no-activity { border-left-color: #cbd5e1; }
  .st-session-card__label {
    padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    color: ${GREEN}; background: #f8fafc; border-bottom: 1px solid #eef2f7;
  }
  .st-session-card__head {
    padding: 16px; color: #fff; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;
  }
  .st-session-card__head--neutral { background: linear-gradient(105deg, #64748b, #475569); }
  .st-session-card__head h4 { margin: 0 0 4px; font-size: 16px; font-weight: 900; }
  .st-session-card__head p { margin: 0 0 8px; font-size: 12px; opacity: 0.9; }
  .st-session-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
  .st-activity-badge {
    display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; color: #fff;
  }
  .st-type-badge {
    display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase;
  }
  .st-type-badge--tot { background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); color: #fff; }
  .st-type-badge--student { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .st-status-pill {
    flex-shrink: 0; padding: 5px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.2); color: #fff;
  }
  .st-status-pill--amber { background: #fef3c7; color: #92400e; }
  .st-status-pill--blue { background: #dbeafe; color: #1d4ed8; }
  .st-status-pill--purple { background: #ede9fe; color: #6d28d9; }
  .st-status-pill--teal { background: #ccfbf1; color: #0f766e; }
  .st-status-pill--green { background: #d1fae5; color: #065f46; }
  .st-session-card__grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px;
  }
  .st-session-card__grid em {
    display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 3px; font-style: normal;
  }
  .st-session-card__grid strong { font-size: 13px; color: #0f172a; }
  .st-session-card__notes {
    display: flex; gap: 10px; padding: 0 16px 16px; font-size: 12px; color: #475569; line-height: 1.5;
  }
  .st-session-card__notes i { color: ${GREEN}; margin-top: 2px; }
  .st-session-card__source {
    padding: 12px 16px; border-top: 1px solid #eef2f7; font-size: 12px; font-weight: 700; color: #64748b;
    display: flex; align-items: center; gap: 8px; background: #fafbfc;
  }
  .st-text--green { color: ${GREEN}; }
  .st-text--amber { color: ${AMBER}; }

  @media (max-width: 1100px) {
    .st-dual-calendars { grid-template-columns: 1fr; }
    .st-filters__grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .st-calendar__day { min-height: 72px; }
    .st-session-card__grid { grid-template-columns: 1fr; }
  }
`;

export default SeniorTrainerModule;
