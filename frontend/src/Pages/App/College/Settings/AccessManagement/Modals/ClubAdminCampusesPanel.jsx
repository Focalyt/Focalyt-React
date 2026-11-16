import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const authHeaders = (token) => ({ headers: { 'x-auth': token } });

const campusPlace = (campus) =>
  [campus.city, campus.state].filter(Boolean).join(', ') || campus.address || 'Campus';

const ClubAdminCampusesPanel = ({
  userId,
  token,
  backendUrl,
  visible,
  variant = 'card',
  embedded = false,
  onChanged,
}) => {
  const targetUserId = userId ? String(userId) : '';
  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [addCampusId, setAddCampusId] = useState('');
  const [campusSearch, setCampusSearch] = useState('');
  const [moveToByCampus, setMoveToByCampus] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadCampuses = useCallback(async (search = '') => {
    if (!targetUserId || !token || !backendUrl) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${backendUrl}/college/users/club-campuses/${targetUserId}`,
        { ...authHeaders(token), params: search ? { q: search } : {} }
      );
      const data = response.data?.data || {};
      setAssigned(data.assigned || []);
      setAvailable(data.available || []);
      setAddCampusId('');
      setMoveToByCampus({});
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load assigned campuses.');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token, targetUserId]);

  useEffect(() => {
    if (!visible) return undefined;
    const delay = campusSearch.trim() ? 300 : 0;
    const timer = setTimeout(() => loadCampuses(campusSearch.trim()), delay);
    return () => clearTimeout(timer);
  }, [visible, campusSearch, loadCampuses]);

  const runAction = async (key, request, successFallback) => {
    setBusyId(key);
    setError('');
    setMessage('');
    try {
      const response = await request();
      setMessage(response.data?.message || successFallback);
      await loadCampuses(campusSearch.trim());
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Campus update failed.');
    } finally {
      setBusyId('');
    }
  };

  const handleAdd = () => {
    if (!addCampusId) return;
    return runAction(
      'add',
      () => axios.post(
        `${backendUrl}/college/users/club-campuses/${targetUserId}`,
        { collegeId: addCampusId },
        authHeaders(token)
      ),
      'Campus assigned.'
    );
  };

  const handleRemove = (campus) => {
    if (!window.confirm(`Remove ${campus.name} from this Club Admin? They will keep this login.`)) return;
    return runAction(
      `remove-${campus._id}`,
      () => axios.delete(
        `${backendUrl}/college/users/club-campuses/${targetUserId}/${campus._id}`,
        authHeaders(token)
      ),
      'Campus removed.'
    );
  };

  const handleReassign = (campus) => {
    const toCollegeId = moveToByCampus[campus._id];
    if (!toCollegeId) return;
    const next = available.find((item) => String(item._id) === String(toCollegeId));
    if (!window.confirm(`Move this Club Admin from ${campus.name} to ${next?.name || 'the selected campus'}? Same login will manage the new campus.`)) return;
    return runAction(
      `move-${campus._id}`,
      () => axios.post(
        `${backendUrl}/college/users/club-campuses/${targetUserId}/reassign`,
        { fromCollegeId: campus._id, toCollegeId },
        authHeaders(token)
      ),
      'Campus reassigned.'
    );
  };

  if (!visible) return null;

  const isClub = variant === 'club';
  const selectClass = isClub ? 'club-list-page__select' : 'form-select form-select-sm';
  const addSelectClass = isClub ? 'club-list-page__select' : 'form-select';
  const removeClass = isClub ? 'fc-btn fc-btn-outline fc-btn-sm' : 'btn btn-sm btn-outline-danger';
  const moveClass = isClub ? 'fc-btn fc-btn-outline fc-btn-sm' : 'btn btn-sm btn-outline-primary';
  const addClass = isClub ? 'fc-btn fc-btn-primary fc-btn-sm' : 'btn btn-primary';

  const body = (
    <>
      {!embedded ? (
        <p className={isClub ? 'club-list-page__meta' : 'text-muted small mb-3'} style={isClub ? { marginBottom: 12 } : undefined}>
          Assign, add, or reassign campuses to this Club Admin. They keep the same login.
          They can manage clubs only at campuses listed here.
        </p>
      ) : null}

      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {message ? <div className="alert alert-success py-2">{message}</div> : null}

      {loading ? (
        <p className={isClub ? 'club-list-page__meta' : 'text-muted mb-0'}>Loading campuses…</p>
      ) : (
        <>
          {assigned.length === 0 ? (
            <p className={isClub ? 'club-list-page__meta' : 'text-muted'}>No campuses assigned yet.</p>
          ) : (
            assigned.map((campus) => {
              const canChange = campus.managedByYou && !campus.defaultAdmin;
              const isLast = assigned.length === 1;
              return (
                <div key={campus._id} className="club-campus-assign__row">
                  <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                    <div>
                      <div className="fw-semibold">{campus.name}</div>
                      <div className={isClub ? 'club-list-page__meta' : 'small text-muted'}>{campusPlace(campus)}</div>
                      {campus.defaultAdmin ? (
                        <span className="badge bg-secondary mt-1">Primary admin</span>
                      ) : null}
                      {!campus.managedByYou ? (
                        <span className="badge bg-light text-dark border mt-1">Managed by another admin</span>
                      ) : null}
                    </div>
                    {canChange && !isLast ? (
                      <button
                        type="button"
                        className={removeClass}
                        disabled={Boolean(busyId)}
                        onClick={() => handleRemove(campus)}
                      >
                        {busyId === `remove-${campus._id}` ? 'Removing…' : 'Remove'}
                      </button>
                    ) : null}
                  </div>
                  {canChange && available.length > 0 ? (
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      <select
                        className={selectClass}
                        style={{ maxWidth: 280 }}
                        value={moveToByCampus[campus._id] || ''}
                        onChange={(e) =>
                          setMoveToByCampus((prev) => ({ ...prev, [campus._id]: e.target.value }))
                        }
                      >
                        <option value="">Reassign to another campus</option>
                        {available.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={moveClass}
                        disabled={!moveToByCampus[campus._id] || Boolean(busyId)}
                        onClick={() => handleReassign(campus)}
                      >
                        {busyId === `move-${campus._id}` ? 'Moving…' : 'Reassign'}
                      </button>
                    </div>
                  ) : null}
                  {canChange && isLast && available.length === 0 ? (
                    <div className={isClub ? 'club-list-page__meta' : 'small text-muted mt-2'} style={{ marginTop: 8 }}>
                      Last campus. Reassign or add another campus instead of removing it.
                    </div>
                  ) : null}
                </div>
              );
            })
          )}

          <div className="mt-3">
            <label className={isClub ? 'club-list-page__meta' : 'form-label fw-semibold'} style={isClub ? { display: 'block', marginBottom: 8, fontWeight: 600, color: '#0f172a' } : undefined}>
              Add campus
            </label>
            <input
              type="search"
              className={isClub ? 'club-list-page__search' : 'form-control mb-2'}
              style={{ maxWidth: 320, marginBottom: 8 }}
              placeholder="Search college name"
              value={campusSearch}
              onChange={(e) => setCampusSearch(e.target.value)}
              aria-label="Search campuses"
            />
            {available.length === 0 ? (
              <p className={isClub ? 'club-list-page__meta' : 'small text-muted mb-0'}>
                {campusSearch.trim()
                  ? 'No matching campuses. Try another college name.'
                  : 'No other campuses in the list. Search by college name to assign an existing campus.'}
              </p>
            ) : (
              <div className="d-flex gap-2 flex-wrap">
                <select
                  className={addSelectClass}
                  style={{ maxWidth: 320 }}
                  value={addCampusId}
                  onChange={(e) => setAddCampusId(e.target.value)}
                >
                  <option value="">Select a campus</option>
                  {available.map((campus) => (
                    <option key={campus._id} value={campus._id}>
                      {campus.name}{campus.city ? ` · ${campus.city}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={addClass}
                  disabled={!addCampusId || Boolean(busyId)}
                  onClick={handleAdd}
                >
                  {busyId === 'add' ? 'Adding…' : 'Add campus'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  if (isClub) {
    return embedded ? body : (
      <div className="club-list-page__panel">
        <h3>Campus assignment</h3>
        {body}
      </div>
    );
  }

  return (
    <div className="card mb-3">
      <div className="card-header text-white" style={{ backgroundColor: '#0f766e' }}>
        <h6 className="mb-0">Campus assignment</h6>
      </div>
      <div className="card-body">{body}</div>
    </div>
  );
};

export default ClubAdminCampusesPanel;
