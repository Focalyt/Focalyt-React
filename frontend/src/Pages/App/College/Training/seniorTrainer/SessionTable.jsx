import React from 'react';
import {
  getOptionLabel,
  parseSessionDateKey,
  resolveSessionSelectionId,
  getSessionTypeLabel,
  getSessionTypeBadgeKind,
  getSessionActivityLabel,
  getDayNameFromDate,
} from './seniorTrainerShared';

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
  hideFilters = false,
  assignmentDrafts = {},
  trainerOptions = [],
  loadingTrainers = false,
  onEditSession,
}) => {
  return (
  <section className="st-sessions-table-wrap">
    <div className="st-sessions-table__head">
      <h3><i className="fas fa-table" /> Session List</h3>
      <span>{sessions.length} session(s)</span>
    </div>

    {!hideFilters && (
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
    )}

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
}

export default SessionTable;
