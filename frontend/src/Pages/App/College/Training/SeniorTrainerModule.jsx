import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-date-picker';
import Calendar from 'react-calendar';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

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

const buildFixedSessionSlots = (sessions = [], total = TOTAL_SESSION_SLOTS) => {
  const byNumber = {};
  const unnumbered = [];

  sessions.forEach((session) => {
    const num = parseInt(String(session.sessionNumber ?? ''), 10);
    if (Number.isFinite(num) && num >= 1 && num <= total) {
      if (!byNumber[num]) byNumber[num] = session;
      else unnumbered.push(session);
      return;
    }
    unnumbered.push(session);
  });

  let freeSlot = 1;
  unnumbered.forEach((session) => {
    while (freeSlot <= total && byNumber[freeSlot]) freeSlot += 1;
    if (freeSlot > total) return;
    byNumber[freeSlot] = session;
    freeSlot += 1;
  });

  return Array.from({ length: total }, (_, index) => {
    const sessionNumber = index + 1;
    return {
      key: `slot-${sessionNumber}`,
      sessionNumber: String(sessionNumber),
      session: byNumber[sessionNumber] || null,
    };
  });
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
  const cells = useMemo(() => buildFixedSessionSlots(sessions), [sessions]);

  return (
    <div className="st-calendar" style={{ '--calendar-accent': accent }}>
      <div className="st-calendar__title-bar">
        <div className="st-calendar__title">
          <i className={`fas ${icon}`} />
          <span>{title}</span>
        </div>
        <span className="st-calendar__count">{sessions.length} / {TOTAL_SESSION_SLOTS} plan(s)</span>
      </div>
      <div className="st-calendar__head">
        <h3>Session plans</h3>
        <span className="st-calendar__head-hint">Session 1–{TOTAL_SESSION_SLOTS} · dates assigned later</span>
      </div>

      <div className="st-calendar__weekdays" aria-hidden="true">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="st-calendar__grid">
        {cells.map((cell) => {
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
          const timeLabel = [session.startTime, session.endTime].filter(Boolean).join('–') || 'Time TBA';
          return (
            <button
              key={session.id}
              type="button"
              className={`st-day-tt__chip${isSelected ? ' st-day-tt__chip--selected' : ''}`}
              style={{ '--event-color': session._timetableColor }}
              title={`${session.title || 'Session'} · ${timeLabel}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectSession(session.id);
              }}
            >
              <span className="st-day-tt__chip-dot" style={{ background: session._timetableColor }} />
              <span className="st-day-tt__chip-time">{timeLabel}</span>
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
            <h4>
              {focusedDateKey
                ? new Date(`${focusedDateKey}T12:00:00`).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                : 'Day detail'}
            </h4>
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
                const timeLabel = [session.startTime, session.endTime].filter(Boolean).join(' – ') || 'Time TBA';
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
                        <em>{timeLabel}</em>
                        <small>{getSessionTypeLabel(session)}{session.sessionNumber ? ` · #${session.sessionNumber}` : ''}</small>
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
  onAssignmentChange,
  canAssignTrainers = true,
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
                  <td className="st-table-cell--control" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      className="st-table-input"
                      value={assignDate}
                      disabled={!canAssignTrainers}
                      onChange={(e) => onAssignmentChange?.(session.id, 'assignDate', e.target.value)}
                    />
                  </td>
                  <td>{getDayNameFromDate(assignDate)}</td>
                  <td className="st-table-cell--control" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="st-table-select"
                      value={draft.trainerId || ''}
                      disabled={loadingTrainers || !canAssignTrainers}
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
        {/* <div><em>Time</em><strong>{session.startTime || '—'} – {session.endTime || '—'}</strong></div> */}
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
        const res = await axios.get(`${backendUrl}/college/users/training-role-users?roleType=trainer`, {
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

  const handleAssignmentChange = useCallback((sessionId, field, value) => {
    setAssignmentDrafts((prev) => {
      const nextDrafts = {
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          [field]: value,
        },
      };

      const draft = nextDrafts[sessionId];
      const trainerId = draft.trainerId || '';
      const trainerName = trainerId
        ? (trainerOptions.find((trainer) => String(trainer.value) === String(trainerId))?.label || '')
        : '';
      const sessionDate = draft.assignDate || '';
      const formattedDate = formatSessionDate(sessionDate);
      const workflowStatus = trainerId
        ? WORKFLOW_STATUS.ASSIGNED
        : WORKFLOW_STATUS.SENT_TO_SENIOR;

      setSessions((prevSessions) => prevSessions.map((session) => {
        if (session.id !== sessionId) return session;
        return {
          ...session,
          fieldTrainerId: trainerId,
          fieldTrainerName: trainerName || session.fieldTrainerName || '',
          sessionDate: sessionDate || session.sessionDate,
          date: formattedDate || session.date,
          workflowStatus: trainerId
            ? WORKFLOW_STATUS.ASSIGNED
            : (session.workflowStatus === WORKFLOW_STATUS.ASSIGNED
              ? WORKFLOW_STATUS.SENT_TO_SENIOR
              : session.workflowStatus),
        };
      }));

      if (token) {
        patchCoordinatorSessionApi(backendUrl, token, sessionId, {
          fieldTrainerId: trainerId,
          fieldTrainerName: trainerName,
          sessionDate: sessionDate || undefined,
          date: formattedDate || undefined,
          workflowStatus,
        }).catch((err) => {
          console.error('Failed to save assignment', err);
        });
      }

      return nextDrafts;
    });
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
          <nav className="st-breadcrumb">
            <span>Training Module</span><span>/</span>
            <span className="st-breadcrumb--active">Senior Trainer</span>
          </nav>
          <p className="st-subtitle">
            View plans referred by Academic Coordinator and assign field trainers.
          </p>

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
          onAssignmentChange={handleAssignmentChange}
        />

        <div className="st-detail-panel">
          {selectedSession ? (
            <SeniorSessionCard session={selectedSession} />
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

  .st-filters, .st-toolbar, .st-calendar, .st-day-tt, .st-detail-panel, .st-session-card, .st-sessions-table-wrap, .st-empty-state {
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
  .st-dual-calendars {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: start;
  }
  .st-calendar {
    padding: 0; overflow: hidden; min-width: 0; background: #fff;
    border: 1px solid #e2e8f0; border-radius: 16px;
    box-shadow: 0 10px 28px rgba(15,23,42,0.06);
  }
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
  .st-calendar__head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    margin-bottom: 8px; padding: 14px 14px 0;
  }
  .st-calendar__head h3 { margin: 0; font-size: 1.05rem; font-weight: 900; }
  .st-calendar__head-hint { font-size: 11px; font-weight: 700; color: #94a3b8; }
  .st-calendar__weekdays {
    display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px;
    padding: 0 14px 6px;
  }
  .st-calendar__weekdays span {
    text-align: center; font-size: 10px; font-weight: 800; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 0;
  }
  .st-calendar__grid {
    display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px; padding: 0 14px 14px; width: 100%; box-sizing: border-box;
  }
  .st-calendar__day {
    box-sizing: border-box; min-width: 0; width: 100%; max-width: 100%;
    min-height: 88px; height: 100%;
    border: 1px solid #eef2f7; border-radius: 10px; padding: 6px;
    background: #fafbfc; display: flex; flex-direction: column; gap: 3px;
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
    flex-shrink: 0; font-size: 12px; font-weight: 900; line-height: 1;
    color: var(--event-color, #334155);
  }
  .st-calendar__session-title {
    font-size: 10px; font-weight: 700; color: #0f172a; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden; word-break: break-word; overflow-wrap: anywhere;
  }
  .st-calendar__session-title--muted { color: #94a3b8; font-weight: 600; }
  .st-calendar__session-topic {
    margin-top: auto; font-size: 9px; font-weight: 600; color: #64748b;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
  }
  .st-calendar__empty {
    margin: 0; padding: 24px 14px 28px; text-align: center; font-size: 13px; font-weight: 700; color: #94a3b8;
  }

  .st-day-tt { padding: 0; overflow: hidden; }
  .st-day-tt__title-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    padding: 12px 16px; border-bottom: 1px solid #eef2f7;
    background: linear-gradient(90deg, #eff6ff, #ecfdf5);
  }
  .st-day-tt__title {
    display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 900; color: #0f172a;
  }
  .st-day-tt__title i { color: ${BLUE}; }
  .st-day-tt__count {
    font-size: 11px; font-weight: 800; color: ${GREEN};
    background: #ecfdf5; padding: 4px 10px; border-radius: 999px;
  }
  .st-day-tt__hint {
    margin: 0; padding: 10px 16px 0; font-size: 12px; font-weight: 600; color: #64748b; line-height: 1.45;
  }
  .st-day-tt__layout {
    display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.9fr);
    gap: 14px; padding: 12px 14px 16px; align-items: start;
  }
  .st-day-tt__calendar .react-calendar {
    width: 100%; border: none; background: transparent; font-family: inherit;
  }
  .st-day-tt__calendar .react-calendar__navigation {
    display: flex; align-items: center; gap: 4px; margin-bottom: 8px;
  }
  .st-day-tt__calendar .react-calendar__navigation button {
    min-width: 36px; border-radius: 10px; font-size: 13px; font-weight: 800; color: #0f172a;
  }
  .st-day-tt__calendar .react-calendar__navigation button:enabled:hover {
    background: #eff6ff;
  }
  .st-day-tt__calendar .react-calendar__month-view__weekdays {
    text-align: center; text-transform: uppercase; font-size: 10px; font-weight: 800; color: #94a3b8;
  }
  .st-day-tt__calendar .react-calendar__month-view__weekdays__weekday { padding: 6px 0; }
  .st-day-tt__calendar .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
  .st-day-tt__calendar .react-calendar__tile {
    min-height: 108px; height: auto !important; padding: 6px 4px 4px;
    border-radius: 12px; border: 1px solid transparent; background: #fafbfc;
    display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start;
    gap: 4px; overflow: hidden;
  }
  .st-day-tt__calendar .react-calendar__tile:enabled:hover { background: #f1f5f9; }
  .st-day-tt__calendar .react-calendar__tile--now {
    background: #eff6ff;
  }
  .st-day-tt__calendar .react-calendar__tile--active {
    background: #ecfdf5 !important; color: inherit;
  }
  .st-day-tt__calendar .react-calendar__tile > abbr {
    align-self: flex-start; font-size: 12px; font-weight: 900; color: #334155;
  }
  .st-day-tt__tile--busy {
    border-color: #e2e8f0 !important; background: #fff !important;
  }
  .st-day-tt__tile--focused,
  .st-day-tt__tile--selected {
    box-shadow: inset 0 0 0 1.5px ${BLUE};
  }
  .st-day-tt__events {
    display: flex; flex-direction: column; gap: 3px; width: 100%; min-width: 0;
  }
  .st-day-tt__badge {
    align-self: flex-start; font-size: 9px; font-weight: 800; color: #1e40af;
    background: #dbeafe; border-radius: 999px; padding: 1px 6px; margin-bottom: 1px;
  }
  .st-day-tt__chip {
    width: 100%; margin: 0; border: none; border-radius: 6px; padding: 3px 5px;
    text-align: left; cursor: pointer; appearance: none; -webkit-appearance: none;
    background: color-mix(in srgb, var(--event-color, ${BLUE}) 14%, white);
    border-left: 3px solid var(--event-color, ${BLUE});
    display: grid; grid-template-columns: 8px minmax(0, 1fr); grid-template-rows: auto auto;
    column-gap: 5px; row-gap: 0; align-items: center; min-width: 0;
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
    border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; padding: 12px;
    min-height: 280px;
  }
  .st-day-tt__side-head {
    display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
    margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;
  }
  .st-day-tt__side-head h4 { margin: 0; font-size: 13px; font-weight: 900; color: #0f172a; }
  .st-day-tt__side-head span { font-size: 11px; font-weight: 800; color: ${BLUE}; }
  .st-day-tt__side-empty {
    margin: 12px 0 0; font-size: 12px; font-weight: 600; color: #94a3b8; line-height: 1.45;
  }
  .st-day-tt__side-empty--warn { color: ${AMBER}; }
  .st-day-tt__side-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .st-day-tt__side-item {
    width: 100%; display: flex; gap: 10px; align-items: flex-start; text-align: left;
    border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 10px;
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
  .st-day-tt__side-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .st-day-tt__side-meta strong {
    font-size: 13px; font-weight: 800; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .st-day-tt__side-meta em { font-style: normal; font-size: 11px; font-weight: 800; color: var(--event-color, ${BLUE}); }
  .st-day-tt__side-meta small { font-size: 11px; font-weight: 600; color: #64748b; }

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
    .st-day-tt__layout { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .st-calendar__day { min-height: 72px; }
    .st-session-card__grid { grid-template-columns: 1fr; }
  }
`;

export default SeniorTrainerModule;
