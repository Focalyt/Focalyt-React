import React, { useEffect, useState } from 'react';
import { Can } from '../Components/cms/Can';
import { useClub } from '../../../../contexts/ClubContext';
import { clubCmsApi } from '../../../../services/club/clubCmsApi';
import { clubAdminStaffApi } from '../../../../services/club/clubAdminStaffApi';
import {
  MATRIX_PERMISSION_ROWS,
  MATRIX_ROLE_COLUMNS,
  defaultRoleMatrix,
  permissionsFromPreset,
} from '../../../../config/club/staffPermissions';

const PRESET_OPTIONS = [
  { id: 'sse', label: 'Sr Sales Eng.' },
  { id: 'se', label: 'Sales Eng.' },
];

export const AssignStaffPage = () => {
  const { assignedColleges, notify, livePermissionMatrix, refreshLiveCms } = useClub();
  const [collegeId, setCollegeId] = useState(assignedColleges[0]?._id || assignedColleges[0]?.id || '');
  const [matrix, setMatrix] = useState(livePermissionMatrix || defaultRoleMatrix());
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [preset, setPreset] = useState('sse');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const first = assignedColleges[0]?._id || assignedColleges[0]?.id || '';
    if (first && !collegeId) setCollegeId(first);
  }, [assignedColleges, collegeId]);

  useEffect(() => {
    setMatrix(livePermissionMatrix || defaultRoleMatrix());
  }, [livePermissionMatrix]);

  useEffect(() => {
    if (search.trim().length < 3) {
      setMatches([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await clubAdminStaffApi.searchCompanyUsers(search.trim());
        setMatches(res.status ? res.users || [] : []);
      } catch {
        setMatches([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const saveMatrix = async (nextMatrix) => {
    if (!collegeId) {
      setError('Select a campus first.');
      return;
    }
    setError('');
    setBusy(true);
    setMatrix(nextMatrix);
    try {
      const res = await clubCmsApi.setPermissionMatrix(collegeId, nextMatrix);
      if (!res.status) throw new Error(res.message || 'Could not save permissions');
      notify('Permissions saved', 'The Yes / No matrix is now live for this campus.');
      await refreshLiveCms(collegeId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save permissions');
      setMatrix(livePermissionMatrix || defaultRoleMatrix());
    } finally {
      setBusy(false);
    }
  };

  const toggleCell = (permissionKey, roleKey, enabled) => {
    saveMatrix({
      ...matrix,
      [permissionKey]: {
        ...(matrix[permissionKey] || {}),
        [roleKey]: enabled,
      },
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!collegeId || !selectedUser?._id) {
      setError('Search and select a company person first.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const res = await clubAdminStaffApi.assignStaff({
        userId: selectedUser._id,
        collegeId,
        staffRole: preset,
        permissions: permissionsFromPreset(preset),
      });
      if (!res.status) throw new Error(res.message || res.error || 'Could not assign this person');
      notify(
        'Person linked',
        `${selectedUser.name || selectedUser.email} now uses the ${preset === 'sse' ? 'Sr Sales Eng.' : 'Sales Eng.'} column.`
      );
      setSelectedUser(null);
      setSearch('');
      setMatches([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not assign this person');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="club-list-page">
        <div className="club-list-page__header">
          <div>
            <h1>Permissions</h1>
            <p>Tick Yes or No for each role on this campus.</p>
          </div>
        </div>
        <Can permission="staff.assign">
          <>
          <div className="club-list-page__panel" style={{ marginBottom: 16 }}>
            <div className="form-field" style={{ maxWidth: 320, marginBottom: 16 }}>
              <label className="form-label" htmlFor="matrix-campus">Campus</label>
              <select
                id="matrix-campus"
                className="form-select"
                value={collegeId}
                onChange={(e) => {
                  setCollegeId(e.target.value);
                  refreshLiveCms(e.target.value);
                }}
              >
                {assignedColleges.length === 0 && <option value="">No campus assigned</option>}
                {assignedColleges.map((college) => (
                  <option key={college._id || college.id} value={college._id || college.id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-table-wrap perm-table-wrap">
              <table className="admin-table perm-table role-matrix-table">
                <thead>
                  <tr>
                    <th>Permission Level</th>
                    {MATRIX_ROLE_COLUMNS.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_PERMISSION_ROWS.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <strong>{row.label}</strong>
                      </td>
                      {MATRIX_ROLE_COLUMNS.map((column) => {
                        const allowed = Boolean(matrix?.[row.key]?.[column.key]);
                        return (
                          <td key={column.key} className="perm-check-cell">
                            {column.editable ? (
                              <label className="perm-check">
                                <input
                                  type="checkbox"
                                  checked={allowed}
                                  disabled={busy || !collegeId}
                                  onChange={(e) => toggleCell(row.key, column.key, e.target.checked)}
                                />
                                <span>{allowed ? 'Yes' : 'No'}</span>
                              </label>
                            ) : (
                              <span className={`perm-fixed ${allowed ? 'is-yes' : 'is-no'}`}>
                                {allowed ? 'Yes' : 'No'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="club-list-page__panel">
            <h3>Assign SSE or SE</h3>
            <p className="club-list-page__meta" style={{ marginBottom: 16 }}>
              They keep their company login and use the column selected below.
            </p>
            <form onSubmit={handleAdd}>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="matrix-preset">Column</label>
                  <select
                    id="matrix-preset"
                    className="form-select"
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                  >
                    {PRESET_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="matrix-search">Company person</label>
                  <input
                    id="matrix-search"
                    className="form-input"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Type at least 3 letters of name or email"
                  />
                  {selectedUser && (
                    <p style={{ marginTop: 8, fontSize: '0.86rem' }}>
                      Selected: <strong>{selectedUser.name || selectedUser.email}</strong>
                    </p>
                  )}
                  {matches.length > 0 && !selectedUser && (
                    <div className="admin-table-wrap" style={{ marginTop: 8 }}>
                      {matches.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          className="fc-btn fc-btn-outline fc-btn-sm"
                          style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6 }}
                          onClick={() => {
                            setSelectedUser(user);
                            setSearch(user.email || user.name || '');
                            setMatches([]);
                          }}
                        >
                          {user.name || 'Company user'} · {user.email || user.mobile}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {error && <p style={{ color: 'var(--primary-rose)', marginTop: 10 }}>{error}</p>}
              <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" style={{ marginTop: 12 }} disabled={busy}>
                {busy ? 'Saving…' : 'Apply this column'}
              </button>
            </form>
          </div>
          </>
        </Can>
    </div>
  );
};

export default AssignStaffPage;
