import React, { useState, useEffect, useMemo } from 'react';
import {
  GREEN,
  resolveSessionSelectionId,
  getSessionChipColor,
  buildPagedSessionSlots,
} from './seniorTrainerShared';

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

export default TrainingCalendar;
