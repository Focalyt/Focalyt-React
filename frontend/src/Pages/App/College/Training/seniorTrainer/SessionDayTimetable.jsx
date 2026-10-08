import React, { useEffect, useMemo, useState } from 'react';
import {
  getSessionAssignDateKey,
  getSessionOutline,
  toLocalDateKey,
  resolveSessionSelectionId,
} from './seniorTrainerShared';

const PERIODS_STORAGE_KEY = 'seniorTrainerClassPeriods';

const readStoredPeriods = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PERIODS_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const legacyIds = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'lunch']);
    if (parsed.some((item) => legacyIds.has(item?.id))) return [];
    return parsed;
  } catch (err) {
    return [];
  }
};

const TABS = [
  { id: 'course', label: 'Course', icon: 'fa-book-open' },
  { id: 'placement', label: 'Placement', icon: 'fa-briefcase' },
  { id: 'club', label: 'Club', icon: 'fa-users' },
];

const toMin = (t) => {
  const [h, m] = String(t || '').split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

const fromMin = (mins) => {
  const normalized = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const defaultPlan = () => ({
  start: '09:00',
  periodCount: 6,
  periodMinutes: 60,
  lunchStart: '13:00',
  lunchEnd: '13:45',
});

const buildPlanSlots = (plan) => {
  const count = Math.max(1, Math.min(12, Number(plan.periodCount) || 0));
  const duration = [30, 45, 60].includes(Number(plan.periodMinutes)) ? Number(plan.periodMinutes) : 60;
  const start = toMin(plan.start);
  if (!count || start == null) return [];
  const lunchStart = toMin(plan.lunchStart);
  const lunchEnd = toMin(plan.lunchEnd);
  const hasLunch = lunchStart != null && lunchEnd != null && lunchEnd > lunchStart;
  let cursor = start;
  let lunchInserted = false;
  const stamp = Date.now();
  const slots = [];

  const insertLunch = () => {
    slots.push({
      id: `lunch-${stamp}`,
      type: 'break',
      label: 'Lunch',
      start: fromMin(lunchStart),
      end: fromMin(lunchEnd),
    });
    cursor = Math.max(cursor, lunchEnd);
    lunchInserted = true;
  };

  for (let index = 1; index <= count; index += 1) {
    if (hasLunch && !lunchInserted && cursor + duration > lunchStart) {
      insertLunch();
    }
    const end = cursor + duration;
    slots.push({
      id: `period-${index}-${stamp}`,
      type: 'period',
      label: `Period ${index}`,
      start: fromMin(cursor),
      end: fromMin(end),
    });
    cursor = end;
  }
  if (hasLunch && !lunchInserted) insertLunch();
  return slots.sort((a, b) => toMin(a.start) - toMin(b.start));
};

const outlineRank = (value) => {
  const number = parseInt(String(value || ''), 10);
  return Number.isFinite(number) ? number : 9999;
};

const groupPool = (list) => {
  const sorted = [...list].sort((a, b) => (
    outlineRank(a.unitNumber) - outlineRank(b.unitNumber)
    || outlineRank(a.chapterNumber) - outlineRank(b.chapterNumber)
    || outlineRank(a.sessionNumber) - outlineRank(b.sessionNumber)
    || String(a.title || '').localeCompare(String(b.title || ''))
  ));
  const units = [];
  const byUnit = new Map();
  sorted.forEach((session) => {
    const outline = getSessionOutline(session);
    const unitKey = outline.unit || '';
    const chapterKey = outline.chapter || '';
    if (!byUnit.has(unitKey)) {
      const group = { key: unitKey || 'sessions', label: outline.unit, chapters: [], byChapter: new Map() };
      byUnit.set(unitKey, group);
      units.push(group);
    }
    const unit = byUnit.get(unitKey);
    if (!unit.byChapter.has(chapterKey)) {
      const chapter = { key: `${unitKey}::${chapterKey || 'sessions'}`, label: outline.chapter, sessions: [] };
      unit.byChapter.set(chapterKey, chapter);
      unit.chapters.push(chapter);
    }
    unit.byChapter.get(chapterKey).sessions.push(session);
  });
  return units;
};

const durationLabel = (start, end) => {
  const mins = toMin(end) - toMin(start);
  if (!Number.isFinite(mins) || mins <= 0) return 'Set time';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

const buildDemoSessions = () => ([
  {
    id: 'demo-1',
    title: 'lksdkl',
    sessionNumber: '1',
    unitNumber: '1',
    unitName: 'unit',
    chapterNumber: '1',
    chapterName: 'ch1',
    timetableType: 'course',
    startTime: '',
    endTime: '',
    sessionDate: '',
  },
  {
    id: 'demo-2',
    title: 'iosjk',
    sessionNumber: '2',
    unitNumber: '1',
    unitName: 'unit',
    chapterNumber: '1',
    chapterName: 'ch1',
    timetableType: 'course',
    startTime: '',
    endTime: '',
    sessionDate: '',
  },
  {
    id: 'demo-3',
    title: 'lkslk',
    sessionNumber: '3',
    unitNumber: '1',
    unitName: 'unit',
    chapterNumber: '1',
    chapterName: 'ch1',
    timetableType: 'course',
    startTime: '',
    endTime: '',
    sessionDate: '',
  },
]);

const startOfWeek = (key) => {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

const SessionDayTimetable = ({
  sessions = [],
  assignmentDrafts = {},
  selectedSessionId,
  onSelectSession,
  onAssignPeriod,
}) => {
  const [tab, setTab] = useState('course');
  const [day, setDay] = useState(() => toLocalDateKey(new Date()));
  const [pickedId, setPickedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(defaultPlan);
  const [classPeriods, setClassPeriods] = useState(readStoredPeriods);
  const [demoSessions, setDemoSessions] = useState(buildDemoSessions);

  useEffect(() => {
    localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(classPeriods));
  }, [classPeriods]);

  const orderedPeriods = useMemo(() => [...classPeriods].sort((a, b) => {
    const aStart = toMin(a.start);
    const bStart = toMin(b.start);
    if (aStart == null && bStart == null) return 0;
    if (aStart == null) return 1;
    if (bStart == null) return -1;
    return aStart - bStart;
  }), [classPeriods]);

  const visibleSessions = useMemo(
    () => [...demoSessions, ...sessions],
    [demoSessions, sessions]
  );

  const tabSessions = useMemo(
    () => visibleSessions
      .filter((session) => (session.timetableType || 'course') === tab)
      .map((session) => ({
        ...session,
        _date: getSessionAssignDateKey(session, assignmentDrafts),
        _start: toMin(session.startTime),
        _end: toMin(session.endTime),
      })),
    [visibleSessions, tab, assignmentDrafts]
  );

  const pool = tabSessions.filter((session) => !session._date || session._start == null);
  const groupedPool = useMemo(() => groupPool(pool), [pool]);
  const daySessions = tabSessions.filter((session) => session._date === day && session._start != null);

  const countByDate = useMemo(() => {
    const map = {};
    tabSessions.forEach((session) => {
      if (session._date && session._start != null) {
        map[session._date] = (map[session._date] || 0) + 1;
      }
    });
    return map;
  }, [tabSessions]);

  const weekDays = useMemo(() => {
    const first = startOfWeek(day);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }, [day]);

  const shiftWeek = (delta) => {
    const date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() + delta * 7);
    setDay(toLocalDateKey(date));
  };

  const teachingPeriods = orderedPeriods.filter((period) => period.type === 'period');
  const lunch = orderedPeriods.find((period) => period.type === 'break');
  const totalMins = teachingPeriods.reduce((sum, period) => {
    const mins = toMin(period.end) - toMin(period.start);
    return sum + (Number.isFinite(mins) && mins > 0 ? mins : 0);
  }, 0);

  const ownerIndex = (session, periods) => {
    const start = session._start != null ? session._start : toMin(session.startTime);
    const end = session._end != null ? session._end : toMin(session.endTime);
    if (start == null || !periods.length) return -1;
    const exact = periods.findIndex((period) => start === toMin(period.start) && end === toMin(period.end));
    if (exact >= 0) return exact;
    let best = -1;
    let bestOverlap = 0;
    periods.forEach((period, index) => {
      const periodStart = toMin(period.start);
      const periodEnd = toMin(period.end);
      if (periodStart == null || periodEnd == null) return;
      const overlap = Math.min(end ?? start + 1, periodEnd) - Math.max(start, periodStart);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        best = index;
      }
    });
    return best;
  };

  const sessionsIn = (period) => {
    const index = teachingPeriods.findIndex((item) => item.id === period.id);
    if (index < 0) return [];
    return daySessions.filter((session) => ownerIndex(session, teachingPeriods) === index);
  };

  const bookedPeriods = teachingPeriods.filter((period) => sessionsIn(period).length > 0).length;

  const savePlacement = async (sessionId, payload) => {
    if (String(sessionId).startsWith('demo-')) {
      setDemoSessions((prev) => prev.map((session) => (
        session.id === sessionId
          ? {
            ...session,
            sessionDate: payload.assignDate,
            startTime: payload.startTime,
            endTime: payload.endTime,
            timetableType: payload.timetableType,
          }
          : session
      )));
      return;
    }
    if (!onAssignPeriod) return;
    await onAssignPeriod(sessionId, payload);
  };

  const assignTo = async (period) => {
    if (!pickedId || busy) return;
    const start = toMin(period.start);
    const end = toMin(period.end);
    if (start == null || end == null || end <= start) return;
    setBusy(true);
    try {
      await savePlacement(pickedId, {
        assignDate: day,
        startTime: period.start,
        endTime: period.end,
        timetableType: tab,
      });
      setPickedId('');
    } catch (err) {
      console.error('Failed to assign period', err);
    } finally {
      setBusy(false);
    }
  };

  const clearSlot = (event, id) => {
    event.stopPropagation();
    savePlacement(id, { assignDate: '', startTime: '', endTime: '', timetableType: tab })
      .catch((err) => console.error('Failed to clear period', err));
  };

  const updatePeriodTime = (period, field, value) => {
    const nextPeriod = { ...period, [field]: value };
    setClassPeriods((prev) => prev.map((item) => (item.id === period.id ? nextPeriod : item)));
    const start = toMin(nextPeriod.start);
    const end = toMin(nextPeriod.end);
    if (start == null || end == null || end <= start) return;
    sessionsIn(period).forEach((session) => {
      savePlacement(session.id, {
        assignDate: session._date || day,
        startTime: nextPeriod.start,
        endTime: nextPeriod.end,
        timetableType: tab,
      }).catch((err) => console.error('Failed to update class time', err));
    });
  };

  const createFromPlan = () => {
    const slots = buildPlanSlots(plan);
    if (!slots.length) return;
    const nextTeaching = slots.filter((slot) => slot.type === 'period');
    visibleSessions.forEach((session) => {
      if (!session.startTime || !session.endTime) return;
      const index = ownerIndex(session, teachingPeriods);
      if (index < 0) return;
      const next = nextTeaching[index];
      const assignDate = getSessionAssignDateKey(session, assignmentDrafts) || '';
      const payload = next
        ? {
          assignDate,
          startTime: next.start,
          endTime: next.end,
          timetableType: session.timetableType || 'course',
        }
        : {
          assignDate: '',
          startTime: '',
          endTime: '',
          timetableType: session.timetableType || 'course',
        };
      if (next && session.startTime === next.start && session.endTime === next.end) return;
      savePlacement(session.id, payload)
        .catch((err) => console.error('Failed to move session with the new class time', err));
    });
    setClassPeriods(slots);
  };

  const planPreview = useMemo(() => buildPlanSlots(plan), [plan]);

  const renameSlot = (period, label) => {
    setClassPeriods((prev) => prev.map((item) => (
      item.id === period.id ? { ...item, label } : item
    )));
  };

  const removeSlot = (period) => {
    sessionsIn(period).forEach((session) => {
      savePlacement(session.id, { assignDate: '', startTime: '', endTime: '', timetableType: tab })
        .catch((err) => console.error('Failed to clear period', err));
    });
    setClassPeriods((prev) => prev.filter((item) => item.id !== period.id));
  };

  const dayTitle = new Date(`${day}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section className="tt" data-tab={tab}>
      <div className="tt__body">
        <aside className="tt__side">
          <div className="tt__tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`tt__tab${tab === item.id ? ' tt__tab--on' : ''}`}
                onClick={() => {
                  setTab(item.id);
                  setPickedId('');
                }}
              >
                <i className={`fas ${item.icon}`} /> {item.label}
              </button>
            ))}
          </div>

          <div className="tt__pool">
            <h4>Not scheduled</h4>
            <p className="tt__pool-hint">
              Click a session, then click Free on a class.
            </p>
            {groupedPool.map((unit) => (
              <div key={unit.key} className="tt__outline">
                {unit.label ? <div className="tt__outline-unit">{unit.label}</div> : null}
                {unit.chapters.map((chapter) => (
                  <div key={chapter.key} className={chapter.label ? 'tt__outline-chapter-wrap' : ''}>
                    {chapter.label ? <div className="tt__outline-chapter">{chapter.label}</div> : null}
                    <ul>
                      {chapter.sessions.map((session) => (
                        <li key={session.id}>
                          <button
                            type="button"
                            className={`tt__pool-item${pickedId === session.id ? ' tt__pool-item--on' : ''}`}
                            onClick={() => setPickedId((current) => (current === session.id ? '' : session.id))}
                          >
                            <strong>
                              {session.sessionNumber ? `${String(session.sessionNumber).padStart(2, '0')} ` : ''}
                              {session.title || 'Untitled session'}
                            </strong>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="tt__main">
          <header className="tt__top">
            <div className="tt__title">
              <i className="fas fa-calendar-week" /> Session Timetable
            </div>
            <p className="tt__summary">
              {dayTitle} · {teachingPeriods.length} periods · {totalMins / 60} hrs
              {lunch ? ` · Lunch ${lunch.start}–${lunch.end}` : ''} · {bookedPeriods} booked
            </p>
          </header>

          <div className="tt__week">
            <button type="button" className="tt__nav" onClick={() => shiftWeek(-1)} aria-label="Previous week">
              <i className="fas fa-chevron-left" />
            </button>
            <div className="tt__days">
              {weekDays.map((date) => {
                const key = toLocalDateKey(date);
                const count = countByDate[key] || 0;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`tt__day${key === day ? ' tt__day--on' : ''}`}
                    onClick={() => setDay(key)}
                  >
                    <small>{date.toLocaleDateString('en-IN', { weekday: 'short' })}</small>
                    <strong>{date.getDate()}</strong>
                    <span>{count ? `${count} session${count > 1 ? 's' : ''}` : '—'}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="tt__nav" onClick={() => shiftWeek(1)} aria-label="Next week">
              <i className="fas fa-chevron-right" />
            </button>
            <input
              type="date"
              className="tt__jump"
              value={day}
              onChange={(event) => event.target.value && setDay(event.target.value)}
              aria-label="Jump to date"
            />
          </div>

          <div className="tt__composer">
            <label>
              Start
              <input
                type="time"
                value={plan.start}
                onChange={(event) => setPlan((current) => ({ ...current, start: event.target.value }))}
              />
            </label>
            <label>
              Periods
              <input
                type="number"
                min="1"
                max="12"
                value={plan.periodCount}
                onChange={(event) => setPlan((current) => ({ ...current, periodCount: event.target.value }))}
              />
            </label>
            <label>
              Duration
              <select
                value={plan.periodMinutes}
                onChange={(event) => setPlan((current) => ({ ...current, periodMinutes: Number(event.target.value) }))}
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </label>
            <label>
              Lunch start
              <input
                type="time"
                value={plan.lunchStart}
                onChange={(event) => setPlan((current) => ({ ...current, lunchStart: event.target.value }))}
              />
            </label>
            <label>
              Lunch end
              <input
                type="time"
                value={plan.lunchEnd}
                onChange={(event) => setPlan((current) => ({ ...current, lunchEnd: event.target.value }))}
              />
            </label>
            <button
              type="button"
              className="tt__mini tt__mini--go"
              disabled={!planPreview.length}
              onClick={createFromPlan}
            >
              {classPeriods.length ? 'Rebuild' : 'Create'}
            </button>
            <p className="tt__plan-note">
              {planPreview.length
                ? `${plan.periodCount} classes × ${plan.periodMinutes} min · ${((Number(plan.periodCount) * Number(plan.periodMinutes)) / 60).toFixed(1).replace(/\.0$/, '')} study hrs${plan.lunchStart && plan.lunchEnd ? ` · lunch ${plan.lunchStart}–${plan.lunchEnd}` : ' · no lunch'} · ends ${planPreview[planPreview.length - 1].end}`
                : 'Choose 30, 45, or 60 min classes. Set lunch start and end yourself. Clear lunch times for no lunch.'}
            </p>
          </div>

          <div className="tt__board">
            {orderedPeriods.length === 0 && (
              <p className="tt__empty">Define periods, lunch, and study hours above, then create the timetable.</p>
            )}
            {orderedPeriods.map((period) => {
              const timeFields = (
                <>
                  <button
                    type="button"
                    className="tt__col-remove"
                    title="Remove this slot"
                    onClick={() => removeSlot(period)}
                  >
                    &times;
                  </button>
                  <input
                    className="tt__label"
                    value={period.label}
                    onChange={(event) => renameSlot(period, event.target.value)}
                    aria-label="Slot name"
                  />
                  <div className="tt__clocks">
                    <label className="tt__clock">
                      Start
                      <input
                        type="time"
                        value={period.start}
                        disabled={Boolean(period.start && period.end)}
                        onChange={(event) => updatePeriodTime(period, 'start', event.target.value)}
                      />
                    </label>
                    <label className="tt__clock">
                      End
                      <input
                        type="time"
                        value={period.end}
                        disabled={Boolean(period.start && period.end)}
                        onChange={(event) => updatePeriodTime(period, 'end', event.target.value)}
                      />
                    </label>
                  </div>
                </>
              );
              if (period.type === 'break') {
                return (
                  <div key={period.id} className="tt__col tt__col--break">
                    {timeFields}
                    <div className="tt__break">
                      <i className="fas fa-utensils" />
                      <small>{durationLabel(period.start, period.end)}</small>
                    </div>
                  </div>
                );
              }
              const items = sessionsIn(period);
              const free = items.length === 0;
              return (
                <div key={period.id} className="tt__col">
                  {timeFields}
                  <div className="tt__meta">
                    <small>{durationLabel(period.start, period.end)}</small>
                  </div>
                  <div className="tt__slot">
                    {items.map((session) => {
                      const selected = resolveSessionSelectionId(selectedSessionId) === resolveSessionSelectionId(session.id);
                      const outline = getSessionOutline(session);
                      return (
                        <button
                          key={session.id}
                          type="button"
                          className={`tt__chip${selected ? ' tt__chip--on' : ''}`}
                          onClick={() => onSelectSession(session.id)}
                        >
                          <span className="tt__chip-title">{session.title || 'Untitled session'}</span>
                          {outline.path ? (
                            <span className="tt__chip-sub">{outline.path}</span>
                          ) : null}
                          <span
                            className="tt__chip-x"
                            role="button"
                            tabIndex={0}
                            title="Remove from this period"
                            onClick={(event) => clearSlot(event, session.id)}
                            onKeyDown={(event) => event.key === 'Enter' && clearSlot(event, session.id)}
                          >
                            &times;
                          </span>
                        </button>
                      );
                    })}
                    {free && (
                      <button
                        type="button"
                        className={`tt__free${pickedId ? ' tt__free--ready' : ''}`}
                        disabled={!pickedId || busy || !period.start || !period.end}
                        onClick={() => assignTo(period)}
                      >
                        {pickedId ? 'Assign here' : 'Free'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SessionDayTimetable;
