import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const authHeaders = (token) => ({ headers: { 'x-auth': token } });

const canAssignClubCampuses = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
    const permissions = stored.permissions || stored.userData?.permissions || {};
    return permissions.permission_type === 'Admin';
  } catch {
    return false;
  }
};

const campusPlace = (campus) =>
  [campus.city, campus.state].filter(Boolean).join(', ') || campus.address || '—';

export const ClubAdminCampusSettings = () => {
  const allowed = useMemo(() => canAssignClubCampuses(), []);
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const token = JSON.parse(sessionStorage.getItem('user') || '{}').token;
  const [admins, setAdmins] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [moveToByCampus, setMoveToByCampus] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAdmins = useCallback(async () => {
    if (!allowed || !token || !backendUrl) return;
    setError('');
    try {
      const response = await axios.get(`${backendUrl}/college/users/club-admins`, authHeaders(token));
      const list = response.data?.data?.admins || [];
      setAdmins(list);
      setSelectedId((current) => {
        if (current && list.some((admin) => String(admin._id) === String(current))) return current;
        return list[0]?._id ? String(list[0]._id) : '';
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load Club Admins.');
    }
  }, [allowed, backendUrl, token]);

  const loadCampuses = useCallback(async (userId) => {
    if (!userId || !token || !backendUrl) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${backendUrl}/college/users/club-campuses/${userId}`,
        authHeaders(token)
      );
      const data = response.data?.data || {};
      setAssigned(data.assigned || []);
      setAvailable(data.available || []);
      setMoveToByCampus({});
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load Focalyt campuses.');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    if (!selectedId) return;
    loadCampuses(selectedId);
  }, [selectedId, loadCampuses]);

  const campuses = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = [
      ...assigned.map((campus) => ({ ...campus, assigned: true })),
      ...available.map((campus) => ({ ...campus, assigned: false })),
    ].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (!needle) return rows;
    return rows.filter((campus) =>
      [campus.name, campus.city, campus.state, campus.address]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [assigned, available, search]);

  const runAction = async (key, request, successFallback) => {
    setBusyId(key);
    setError('');
    setMessage('');
    try {
      const response = await request();
      setMessage(response.data?.message || successFallback);
      await Promise.all([loadCampuses(selectedId), loadAdmins()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Campus update failed.');
    } finally {
      setBusyId('');
    }
  };

  const handleAssign = (campus) =>
    runAction(
      `add-${campus._id}`,
      () => axios.post(
        `${backendUrl}/college/users/club-campuses/${selectedId}`,
        { collegeId: campus._id },
        authHeaders(token)
      ),
      'Campus assigned.'
    );

  const handleRemove = (campus) => {
    if (!window.confirm(`Remove ${campus.name} from this Club Admin? They will keep this login.`)) return;
    return runAction(
      `remove-${campus._id}`,
      () => axios.delete(
        `${backendUrl}/college/users/club-campuses/${selectedId}/${campus._id}`,
        authHeaders(token)
      ),
      'Campus removed.'
    );
  };

  const handleReassign = (campus) => {
    const toCollegeId = moveToByCampus[campus._id];
    if (!toCollegeId) return;
    const next = available.find((item) => String(item._id) === String(toCollegeId));
    if (!window.confirm(`Move this Club Admin from ${campus.name} to ${next?.name || 'the selected campus'}?`)) return;
    return runAction(
      `move-${campus._id}`,
      () => axios.post(
        `${backendUrl}/college/users/club-campuses/${selectedId}/reassign`,
        { fromCollegeId: campus._id, toCollegeId },
        authHeaders(token)
      ),
      'Campus reassigned.'
    );
  };

  if (!allowed) return null;

  const selected = admins.find((admin) => String(admin._id) === String(selectedId));

  return (
    <div className="club-list-page__panel">
      <h3>Club staff campuses</h3>
      <p className="club-list-page__meta" style={{ marginBottom: 12 }}>
        Only the main Institute Admin assigns campuses to Club Admin, SSE, or SE. Same login — no new account.
      </p>

      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {message ? <div className="alert alert-success py-2">{message}</div> : null}

      {admins.length === 0 ? (
        <p className="club-list-page__meta">
          No Club Admins yet. Create one in Access Management with Club Administrator access, then assign campuses here.
        </p>
      ) : (
        <>
          <div className="club-list-page__toolbar">
            <select
              className="club-list-page__select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              aria-label="Select Club Admin"
            >
              {admins.map((admin) => (
                <option key={admin._id} value={admin._id}>
                  {admin.name}
                  {admin.clubRole ? ` · ${admin.clubRole}` : ''}
                  {admin.email ? ` · ${admin.email}` : ''}
                </option>
              ))}
            </select>
            <input
              type="search"
              className="club-list-page__search"
              placeholder="Search Focalyt campuses"
              aria-label="Search campuses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selected ? (
            <p className="club-list-page__meta" style={{ marginBottom: 10 }}>
              Managing campuses for <strong>{selected.name}</strong>
            </p>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campus</th>
                  <th>Place</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && campuses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="club-list-page__empty">Loading Focalyt campuses…</td>
                  </tr>
                ) : campuses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="club-list-page__empty">
                      {search.trim()
                        ? 'No campus matches this search.'
                        : 'No real Focalyt campuses were found.'}
                    </td>
                  </tr>
                ) : (
                  campuses.map((campus) => {
                    const canRemove = campus.assigned && !campus.defaultAdmin && assigned.length > 1;
                    const canReassign = campus.assigned && !campus.defaultAdmin && available.length > 0;
                    return (
                      <tr key={campus._id}>
                        <td>
                          <div className="club-list-page__name">{campus.name || 'Unnamed campus'}</div>
                          {campus.type ? <div className="club-list-page__meta">{campus.type}</div> : null}
                        </td>
                        <td>{campusPlace(campus)}</td>
                        <td>
                          {campus.assigned ? (
                            <>
                              <span className="badge bg-success">Assigned</span>
                              {campus.defaultAdmin ? (
                                <span className="badge bg-secondary ms-1">Primary</span>
                              ) : null}
                            </>
                          ) : (
                            <span className="badge bg-light text-dark border">Not assigned</span>
                          )}
                        </td>
                        <td>
                          <div className="club-list-page__actions">
                            {!campus.assigned ? (
                              <button
                                type="button"
                                className="fc-btn fc-btn-primary fc-btn-sm"
                                disabled={Boolean(busyId)}
                                onClick={() => handleAssign(campus)}
                              >
                                {busyId === `add-${campus._id}` ? 'Assigning…' : 'Assign'}
                              </button>
                            ) : (
                              <>
                                {canReassign ? (
                                  <>
                                    <select
                                      className="club-list-page__select"
                                      value={moveToByCampus[campus._id] || ''}
                                      onChange={(e) =>
                                        setMoveToByCampus((prev) => ({ ...prev, [campus._id]: e.target.value }))
                                      }
                                      aria-label={`Reassign ${campus.name}`}
                                    >
                                      <option value="">Reassign to</option>
                                      {available.map((item) => (
                                        <option key={item._id} value={item._id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      className="fc-btn fc-btn-outline fc-btn-sm"
                                      disabled={!moveToByCampus[campus._id] || Boolean(busyId)}
                                      onClick={() => handleReassign(campus)}
                                    >
                                      {busyId === `move-${campus._id}` ? 'Moving…' : 'Reassign'}
                                    </button>
                                  </>
                                ) : null}
                                {canRemove ? (
                                  <button
                                    type="button"
                                    className="fc-btn fc-btn-outline fc-btn-sm"
                                    disabled={Boolean(busyId)}
                                    onClick={() => handleRemove(campus)}
                                  >
                                    {busyId === `remove-${campus._id}` ? 'Removing…' : 'Remove'}
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ClubAdminCampusSettings;
