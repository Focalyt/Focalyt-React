import React, { useEffect, useState } from 'react';
import { Can } from '../Components/cms/Can';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { isPositionsFeatureEnabled } from '../../../../services/club/clubService';
import { staffManageableClubs } from '../../../../services/club/clubLiveState';

export const PositionsStaffPage = () => {
  const { state, upsertPosition, deletePosition, reviewPositionRequest, setPositionsFeatureEnabled } = useClub();
  const manageableClubs = staffManageableClubs(state.clubs);
  const [form, setForm] = useState({
    title: '',
    clubId: manageableClubs[0]?.id || '',
    description: '',
    seats: 1,
  });

  useEffect(() => {
    if (!form.clubId && manageableClubs[0]?.id) {
      setForm((prev) => ({ ...prev, clubId: manageableClubs[0].id }));
    }
  }, [form.clubId, manageableClubs]);

  const clubName = (id) => state.clubs.find((club) => club.id === id)?.name || '—';
  const posTitle = (id) => state.positions.find((position) => position.id === id)?.title || '—';
  const featureEnabled = isPositionsFeatureEnabled(state);

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Positions</h1>
          <p>Club roles students can request. Open / Filled is per role.</p>
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
            upsertPosition({ ...form, seats: Number(form.seats) || 1, status: 'Open' });
            setForm({ ...form, title: '', description: '' });
          }}
        >
          <h3>Create position</h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
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
              <label className="form-label">Description</label>
              <input
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="club-list-page__empty">
                    No positions yet.
                  </td>
                </tr>
              ) : (
                state.positions.map((position) => (
                  <tr key={position.id}>
                    <td>
                      <div className="club-list-page__name">{position.title}</div>
                      <div className="club-list-page__meta">{position.description}</div>
                    </td>
                    <td>{clubName(position.clubId)}</td>
                    <td>{position.seats}</td>
                    <td>
                      <StatusBadge status={position.status} />
                    </td>
                    <td>
                      <Can permission="positions.create">
                        <div className="club-list-page__actions">
                          <button
                            type="button"
                            className="club-link-btn"
                            onClick={() =>
                              upsertPosition({
                                ...position,
                                status: position.status === 'Open' ? 'Filled' : 'Open',
                              })
                            }
                          >
                            Mark {position.status === 'Open' ? 'Filled' : 'Open'}
                          </button>
                          <button type="button" className="club-link-btn" onClick={() => deletePosition(position.id)}>
                            Remove
                          </button>
                        </div>
                      </Can>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="club-list-page__section">
        <h2>Student requests</h2>
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
              {state.positionRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="club-list-page__empty">
                    No position requests yet.
                  </td>
                </tr>
              ) : (
                state.positionRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.studentName || '—'}</td>
                    <td>{posTitle(request.positionId)}</td>
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
                              onClick={() => reviewPositionRequest(request.id, 'approve')}
                            >
                              Approve
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
