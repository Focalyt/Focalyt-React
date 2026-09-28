import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../ProjectMangement/listView.css';

const ROLES = [
  { key: 'academic', label: 'Academic Coordinator', roleType: 'academic', member: 'Coordinator' },
  { key: 'senior', label: 'Senior Trainer', roleType: 'senior', member: 'Senior Trainer' },
  { key: 'trainer', label: 'Trainer', roleType: 'trainer_only', member: 'Trainer' },
];

const statusLabel = (member, key) => {
  if (key === 'all') return 'All';
  if (key === 'active') return `Active ${member}`;
  return `Inactive ${member}`;
};

const AssignTeam = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;

  const [roleKey, setRoleKey] = useState('academic');
  const [statusKey, setStatusKey] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingPerson, setEditingPerson] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '', designation: '', status: 'active' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const role = ROLES.find((item) => item.key === roleKey) || ROLES[0];

  useEffect(() => {
    let cancelled = false;

    const loadPeople = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await axios.get(`${backendUrl}/college/users/training-role-users`, {
          headers: { 'x-auth': token },
          params: { roleType: role.roleType, status: 'all' },
        });
        if (!cancelled) setPeople(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching assign team users:', error);
        if (!cancelled) {
          setPeople([]);
          setLoadError('Could not load team members.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPeople();
    return () => {
      cancelled = true;
    };
  }, [backendUrl, token, role.roleType]);

  const counts = {
    active: people.filter((person) => person.status === 'active').length,
    inactive: people.filter((person) => person.status !== 'active').length,
    all: people.length,
  };

  const visiblePeople = people.filter((person) => {
    if (statusKey === 'active' && person.status !== 'active') return false;
    if (statusKey === 'inactive' && person.status === 'active') return false;
    const haystack = [person.name, person.email, person.mobile, person.designation]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  const openEdit = (person) => {
    setEditingPerson(person);
    setEditForm({
      name: person.name || '',
      email: person.email || '',
      mobile: person.mobile ? String(person.mobile) : '',
      designation: person.designation || '',
      status: person.status === 'active' ? 'active' : 'inactive',
    });
  };

  const saveEdit = async () => {
    if (!editingPerson) return;
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.mobile.trim()) {
      toast.error('Name, email, and mobile are required.');
      return;
    }
    setSavingEdit(true);
    try {
      await axios.post(
        `${backendUrl}/college/users/update/${editingPerson._id}`,
        {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          mobile: editForm.mobile.trim(),
          designation: editForm.designation.trim(),
          status: editForm.status === 'active',
        },
        { headers: { 'x-auth': token } }
      );
      setPeople((prev) => prev.map((person) => (
        person._id === editingPerson._id
          ? {
            ...person,
            name: editForm.name.trim(),
            email: editForm.email.trim(),
            mobile: editForm.mobile.trim(),
            designation: editForm.designation.trim(),
            status: editForm.status,
          }
          : person
      )));
      setEditingPerson(null);
      toast.success('Team member updated.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update this team member.');
    } finally {
      setSavingEdit(false);
    }
  };

  const deletePerson = async (person) => {
    const confirmed = window.confirm(`Delete ${person.name || 'this team member'}?`);
    if (!confirmed) return;
    setDeletingId(person._id);
    try {
      await axios.delete(`${backendUrl}/college/users/${person._id}`, {
        headers: { 'x-auth': token },
        data: { name: person.name },
      });
      setPeople((prev) => prev.filter((item) => item._id !== person._id));
      toast.success('Team member deleted.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not delete this team member.');
    } finally {
      setDeletingId('');
    }
  };

  const statusTabs = [
    { key: 'active', label: statusLabel(role.member, 'active') },
    { key: 'inactive', label: statusLabel(role.member, 'inactive') },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="container py-4 vt-page vt-screen-enter">
      <style>{`
        .at-actions { display: flex; align-items: center; gap: 8px; }
        .at-action {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 12px;
          background: #fff1f3;
          color: #f43f5e;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
        }
        .at-action:hover { background: #ffe4e8; }
        .at-action:disabled { opacity: 0.55; cursor: default; }
        .at-action svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>
      <div className="vt-shell">
        <div className="vt-head">
          <div>
            <p className="vt-kicker">Training</p>
            <h4 style={{ margin: '2px 0 0', fontWeight: 800, color: '#1e293b' }}>Assign Team</h4>
          </div>
        </div>

        <div className="vt-toolbar">
          <div className="vt-tabs" role="tablist" aria-label="Team role">
            {ROLES.map((item) => (
              <button
                type="button"
                key={item.key}
                role="tab"
                aria-selected={roleKey === item.key}
                className={roleKey === item.key ? 'is-active' : ''}
                onClick={() => {
                  setRoleKey(item.key);
                  setStatusKey('active');
                  setSearchQuery('');
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="vt-toolbar">
          <div className="vt-tabs" role="tablist" aria-label={`${role.label} status`}>
            {statusTabs.map((tab) => (
              <button
                type="button"
                key={tab.key}
                role="tab"
                aria-selected={statusKey === tab.key}
                className={statusKey === tab.key ? 'is-active' : ''}
                onClick={() => setStatusKey(tab.key)}
              >
                {tab.label}
                <span style={{ marginLeft: 6, opacity: 0.85 }}>({counts[tab.key]})</span>
              </button>
            ))}
          </div>
          <input
            className="vt-search"
            placeholder={`Search ${role.label.toLowerCase()}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="vt-empty">
            <h5>Loading {role.label.toLowerCase()}s...</h5>
          </div>
        ) : loadError ? (
          <div className="vt-empty">
            <i className="bi bi-exclamation-circle"></i>
            <h5>{loadError}</h5>
          </div>
        ) : visiblePeople.length > 0 ? (
          <div className="table-responsive">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePeople.map((person) => (
                  <tr key={person._id} className="vt-row is-static">
                    <td>
                      <span className="vt-name">
                        <span className="vt-avatar">{(person.name || '?').charAt(0).toUpperCase()}</span>
                        {person.name || 'Unnamed'}
                      </span>
                    </td>
                    <td>{person.email || '—'}</td>
                    <td>{person.mobile || '—'}</td>
                    <td>{person.designation || '—'}</td>
                    <td>
                      <span className={`vt-pill ${person.status === 'active' ? 'is-active' : ''}`}>
                        {person.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="at-actions">
                        <button type="button" className="at-action" title="Edit" onClick={() => openEdit(person)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 20h4.2L19.4 8.8a1.6 1.6 0 0 0 0-2.3l-1.9-1.9a1.6 1.6 0 0 0-2.3 0L4 15.8V20z" />
                            <path d="M13.6 6.2l4.2 4.2" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="at-action"
                          title="Delete"
                          disabled={deletingId === person._id}
                          onClick={() => deletePerson(person)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 7h14" />
                            <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
                            <path d="M7.5 7l.7 12.2A1.5 1.5 0 0 0 9.7 20.5h4.6a1.5 1.5 0 0 0 1.5-1.3L16.5 7" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vt-empty">
            <i className="bi bi-people"></i>
            <h5>No {role.label.toLowerCase()}s found</h5>
            <p>Try another status tab or search.</p>
          </div>
        )}
      </div>

      {editingPerson && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: '#fc2b5a' }}>
                <h5 className="modal-title">Edit {role.member}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingPerson(null)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Name</label>
                <input
                  className="form-control mb-3"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <label className="form-label fw-semibold">Email</label>
                <input
                  className="form-control mb-3"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <label className="form-label fw-semibold">Mobile</label>
                <input
                  className="form-control mb-3"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, mobile: e.target.value }))}
                />
                <label className="form-label fw-semibold">Designation</label>
                <input
                  className="form-control mb-3"
                  value={editForm.designation}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, designation: e.target.value }))}
                />
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingPerson(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" disabled={savingEdit} onClick={saveEdit}>
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTeam;
