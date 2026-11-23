import React, { useEffect, useMemo, useState } from 'react';
import { Can } from '../Components/cms/Can';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { isPositionsFeatureEnabled } from '../../../../services/club/clubService';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';

const defaultForm = (clubId = '') => ({
  title: '',
  clubId,
  description: '',
  seats: 1,
  termLabel: '',
  termStart: '',
  termEnd: '',
});

export const PositionsStaffPage = () => {
  const { state, upsertPosition, deletePosition, reviewPositionRequest, setPositionsFeatureEnabled } = useClub();
  const manageableClubs = staffManageableClubs(state.clubs);
  const [form, setForm] = useState(defaultForm(manageableClubs[0]?.id || ''));

  useEffect(() => {
    if (!form.clubId && manageableClubs[0]?.id) {
      setForm((prev) => ({ ...prev, clubId: manageableClubs[0].id }));
    }
  }, [form.clubId, manageableClubs]);

  const clubName = (id) => state.clubs.find((club) => club.id === id)?.name || '—';
  const posTitle = (id) => state.positions.find((position) => position.id === id)?.title || '—';
  const featureEnabled = isPositionsFeatureEnabled(state);

  const manageableIds = useMemo(
    () => new Set(manageableClubs.map((club) => String(club.id))),
    [manageableClubs]
  );

  const visiblePositions = useMemo(
    () => (state.positions || []).filter((position) => manageableIds.has(String(position.clubId))),
    [state.positions, manageableIds]
  );

  const visibleRequests = useMemo(
    () =>
      (state.positionRequests || []).filter((request) => manageableIds.has(String(request.clubId))),
    [state.positionRequests, manageableIds]
  );

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Positions</h1>
          <p>
            Campus office-bearer roles. Flow: Pending → Recommended → Assigned / Rejected. Seats auto-fill when
            assigned.
          </p>
        </div>
        <Can permission="positions.manageFeature">
          <button
            type="button"
            className={`fc-btn fc-btn-sm ${featureEnabled ? 'fc-btn-outline' : 'fc-btn-primary'}`}
            onClick={() => setPositionsFeatureEnabled(!featureEnabled)}
          >
            {featureEnabled ? 'Disable for students' : 'Enable for students'}
          </button>
        </Can>
      </div>

      <Can permission="positions.create">
        <form
          className="club-list-page__panel"
          onSubmit={(e) => {
            e.preventDefault();
            upsertPosition({
              ...form,
              seats: Number(form.seats) || 1,
              status: 'Open',
            });
            setForm(defaultForm(form.clubId));
          }}
        >
          <h3>Create position</h3>
          <p className="club-list-page__meta" style={{ marginBottom: 12 }}>
            Only approved club members can request. One open request per student per club.
          </p>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="President, Secretary…"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Club</label>
              <select
                className="form-select"
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
                required
              >
                <option value="">{manageableClubs.length ? 'Select a club' : 'No clubs available'}</option>
                {manageableClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Seats</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Term (optional)</label>
              <input
                className="form-input"
                value={form.termLabel}
                onChange={(e) => setForm({ ...form, termLabel: e.target.value })}
                placeholder="Academic Year 2025–26"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Term start</label>
              <input
                className="form-input"
                type="date"
                value={form.termStart}
                onChange={(e) => setForm({ ...form, termStart: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Term end</label>
              <input
                className="form-input"
                type="date"
                value={form.termEnd}
                onChange={(e) => setForm({ ...form, termEnd: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <input
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this role does on campus"
                required
              />
            </div>
          </div>
          <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" style={{ marginTop: 12 }}>
            Create position
          </button>
        </form>
      </Can>

      <div className="club-list-page__section" style={{ marginTop: 0 }}>
        <h2>Roles</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Club</th>
                <th>Seats</th>
                <th>Holders</th>
                <th>Term</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePositions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="club-list-page__empty">
                    No positions yet. Create President, Secretary, etc. for each club.
                  </td>
                </tr>
              ) : (
                visiblePositions.map((position) => {
                  const filled = Number(position.filledSeats) || (position.holders || []).length;
                  const seats = Math.max(1, Number(position.seats) || 1);
                  return (
                    <tr key={position.id}>
                      <td>
                        <div className="club-list-page__name">{position.title}</div>
                        <div className="club-list-page__meta">{position.description}</div>
                      </td>
                      <td>{clubName(position.clubId)}</td>
                      <td>
                        {filled}/{seats}
                      </td>
                      <td>
                        {(position.holders || []).length === 0 ? (
                          <span className="club-list-page__meta">Open</span>
                        ) : (
                          (position.holders || []).map((holder) => holder.studentName).join(', ')
                        )}
                      </td>
                      <td>
                        {position.termLabel || '—'}
                        {(position.termStart || position.termEnd) && (
                          <div className="club-list-page__meta">
                            {[position.termStart, position.termEnd].filter(Boolean).join(' → ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={position.status} />
                      </td>
                      <td>
                        <Can permission="positions.create">
                          <div className="club-list-page__actions">
                            <button
                              type="button"
                              className="club-link-btn"
                              onClick={() => deletePosition(position.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </Can>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="club-list-page__section">
        <h2>Student requests</h2>
        <p className="club-list-page__meta" style={{ marginBottom: 12 }}>
          Pending → Recommend (optional) → Assign. Reject closes the request.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Position</th>
                <th>Note</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="club-list-page__empty">
                    No position requests yet.
                  </td>
                </tr>
              ) : (
                visibleRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.studentName || '—'}</td>
                    <td>
                      {posTitle(request.positionId)}
                      <div className="club-list-page__meta">{clubName(request.clubId)}</div>
                    </td>
                    <td>{request.note || '—'}</td>
                    <td>
                      <StatusBadge status={request.status} />
                    </td>
                    <td>
                      {request.status === 'Pending' || request.status === 'Recommended' ? (
                        <div className="club-list-page__actions">
                          {request.status === 'Pending' && (
                            <Can permission="positions.recommend">
                              <button
                                type="button"
                                className="club-link-btn"
                                onClick={() => reviewPositionRequest(request.id, 'recommend')}
                              >
                                Recommend
                              </button>
                            </Can>
                          )}
                          <Can permission="positions.assign">
                            <button
                              type="button"
                              className="club-link-btn"
                              onClick={() => reviewPositionRequest(request.id, 'assign')}
                            >
                              Assign
                            </button>
                          </Can>
                          <Can permission="positions.assign">
                            <button
                              type="button"
                              className="club-link-btn"
                              onClick={() => reviewPositionRequest(request.id, 'reject')}
                            >
                              Reject
                            </button>
                          </Can>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PositionsStaffPage;
