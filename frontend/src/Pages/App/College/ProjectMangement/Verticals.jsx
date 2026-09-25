import React, { useEffect, useState } from 'react';
import Project from './Project';
import axios from 'axios'

const CandidateManagementPortal = ({ stopAtCenter = false }) => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userStr = sessionStorage.getItem("user");
  const user = (userStr && userStr !== "undefined") ? JSON.parse(userStr) : {};
  const token = user.token;

  const [permissions, setPermissions] = useState();

  useEffect(() => {
    updatedPermission()
  }, [])

  const updatedPermission = async () => {

    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token }
    });
    if (respose.data.status) {

      setPermissions(respose.data.permissions);
    }
  }

  const [activeVerticalTab, setActiveVerticalTab] = useState('Active Verticals');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingVertical, setEditingVertical] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [newUser, setNewUser] = useState('');
  const [newRole, setNewRole] = useState('Viewer');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [verticalToDelete, setVerticalToDelete] = useState(null);
  // vertical view
  const [showVertical, setShowVertical] = useState(true);

  // New state for project view
  const [showProjects, setShowProjects] = useState(false);
  const [selectedVerticalForProjects, setSelectedVerticalForProjects] = useState(null);


  // Form states
  const [formData, setFormData] = useState({
    description: '',
    name: '',
    status: false
  });

  const [verticals, setVerticals] = useState([

  ]);

  // URL-based state management only
  const getInitialState = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const stage = urlParams.get('stage') || 'vertical';
    const verticalId = urlParams.get('verticalId');
    return { stage, verticalId };
  };

  const updateURL = (stage, vertical = null) => {
    const url = new URL(window.location);
    url.searchParams.set('stage', stage);
    if (vertical) {
      url.searchParams.set('verticalId', vertical.id);
    } else {
      url.searchParams.delete('verticalId');
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {

    fetchVerticals();

  }, []);

  const fetchVerticals = async () => {
    try {
      const newVertical = await axios.get(`${backendUrl}/college/getVerticals`, { headers: { 'x-auth': token } });

      console.log('token', token);
      console.log('newVertical response:', newVertical);

      // Check if data exists and is an array
      if (newVertical.data && newVertical.data.data && Array.isArray(newVertical.data.data)) {
        const verticalList = newVertical.data.data.map(v => ({
          id: v._id,
          name: v.name,
          status: v.status === true ? 'active' : 'inactive',
          code: v.description,
          projects: 2, // Optional: adjust based on real data
          createdAt: v.createdAt
        }));

        setVerticals(verticalList);
      } else {
        console.warn('No verticals data found or data is not an array');
        setVerticals([]);
      }
    } catch (error) {
      console.error('Error fetching verticals:', error);
      setVerticals([]);
    }
  };

  const filteredVerticals = verticals.filter(vertical => {
    if (activeVerticalTab === 'Active Verticals' && vertical.status !== 'active') return false;
    if (activeVerticalTab === 'Inactive Verticals' && vertical.status !== 'inactive') return false;
    return vertical.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vertical.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const resetForm = () => {
    setFormData({
      description: '',
      name: '',
      status: false
    });
  };

  const handleAdd = () => {
    setEditingVertical(null);
    resetForm();
    setShowAddForm(true);
  };

  useEffect(() => {
    console.log('verticals formData:', formData);
  }, [formData]);


  const handleEdit = async (vertical) => {
    setEditingVertical(vertical);
    console.log('vertical', vertical)
    setFormData({
      description: vertical.code,
      name: vertical.name,
      status: vertical.status === 'active' ? true : false
    });


    setShowEditForm(true);
  };

  const handleDelete = (vertical) => {
    setVerticalToDelete(vertical);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const newVertical = await axios.delete(`${backendUrl}/college/deleteVertical/${verticalToDelete.id}`, { headers: { 'x-auth': token } });

    if (newVertical.data.status) {
      alert("Vertical deleted successfully");
      fetchVerticals()

    }
    setShowDeleteModal(false);
    setVerticalToDelete(null);
  };




  const handleSubmit = async () => {
    if (!(formData.description || '').trim() || !(formData.name || '').trim()) {
      alert('Please fill in all required fields');
      return;
    }
    if (editingVertical) {
      // Edit existing vertical
      const newVertical = await axios.put(`${backendUrl}/college/editVertical/${editingVertical.id}`, {
        formData
      }, { headers: { 'x-auth': token } });

      if (newVertical.data.status) {
        alert("Vertical updated successfully");
        fetchVerticals()

      }

      resetForm();
      setShowEditForm(false)
      setEditingVertical(null);


    } else {
      // Add new vertical
      const newVertical = await axios.post(`${backendUrl}/college/addVertical`, {
        formData
      }, { headers: { 'x-auth': token } });

      if (newVertical.data.status) {
        alert("Vertical added successfully");
        fetchVerticals()

      }

    }

    resetForm();
    setShowAddForm(false)
    setEditingVertical(null);
  };

  useEffect(() => {
    // URL-based restoration logic - only run when verticals are loaded
    const { stage, verticalId } = getInitialState();


    // Don't make any decisions until verticals are loaded
    if (verticals.length === 0) {
      console.log('Verticals not loaded yet, skipping URL restoration');
      return;
    }

    if (stage === "project") {
      // We have verticalId in URL and verticals are loaded, find the vertical
      const foundVertical = verticals.find(v => v.id === verticalId);
      if (foundVertical) {
        setSelectedVerticalForProjects(foundVertical);
        setShowProjects(true);
        setShowVertical(false);
        console.log('Found vertical from URL and restored to project view:', foundVertical.name);
      } else {
        // Vertical not found, reset to vertical view
        console.warn('Vertical not found, resetting to vertical view');
        updateURL('vertical');
        setShowVertical(true);
        setShowProjects(false);
      }
    } else if (stage === "center" && verticalId) {
      // Center view is rendered inside Project component, so set up project view
      const foundVertical = verticals.find(v => v.id === verticalId);
      if (foundVertical) {
        setSelectedVerticalForProjects(foundVertical);
        setShowProjects(true);
        setShowVertical(false);
        console.log('Found vertical from URL and restored to center view (via project):', foundVertical.name);
      } else {
        // Vertical not found, reset to vertical view
        console.warn('Vertical not found for center view, resetting to vertical view');
        updateURL('vertical');
        setShowVertical(true);
        setShowProjects(false);
      }
    } else if ((stage === "course" || stage === "batch") && verticalId) {
      // Course/Batch view is rendered inside Project->Center->Course, so set up project view
      const foundVertical = verticals.find(v => v.id === verticalId);
      if (foundVertical) {
        setSelectedVerticalForProjects(foundVertical);
        setShowProjects(true);
        setShowVertical(false);
        console.log('Found vertical from URL and restored to course/batch view (via project):', foundVertical.name);
      } else {
        // Vertical not found, reset to vertical view
        console.warn('Vertical not found for course/batch view, resetting to vertical view');
        updateURL('vertical');
        setShowVertical(true);
        setShowProjects(false);
      }
    } else if (stage === 'vertical') {
      // User is on verticals page - keep them there
      setShowVertical(true);
      setShowProjects(false);
      console.log('Staying on vertical view (no URL change needed)');
    } else {
      // Any other stage - default to vertical view
      setShowVertical(true);
      setShowProjects(false);
      updateURL('vertical');
      console.log('Redirecting to vertical view from unknown stage:', stage);
    }
  }, [verticals]); // Added verticals as dependency

  // New function to handle vertical click for projects
  const handleVerticalClick = (vertical) => {
    setSelectedVerticalForProjects(vertical);
    setShowProjects(true);
    setShowVertical(false);
    updateURL('project', vertical);
  };

  // Function to go back to verticals view
  const handleBackToVerticals = () => {
    setShowProjects(false);
    setShowVertical(true)
    setSelectedVerticalForProjects(null);
    updateURL('vertical');
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
    setEditingVertical(null);
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !verticalToDelete) return null;

    return (
      <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Confirm Delete</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the vertical <strong>{verticalToDelete.name} ({verticalToDelete.code})</strong>?</p>
              <p className="text-muted">This action cannot be undone and will remove all associated data.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                Delete Vertical
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If showing projects, render the Project component
  if (showProjects && selectedVerticalForProjects) {
    return (
      <div className="vt-screen-enter">
        <Project selectedVertical={selectedVerticalForProjects} onBackToVerticals={handleBackToVerticals} stopAtCenter={stopAtCenter} />
        <style>{`
          .vt-screen-enter { animation: vtSlideIn 0.32s ease; }
          @keyframes vtSlideIn {
            from { opacity: 0; transform: translateX(22px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  const canEditVertical = (permissions?.custom_permissions?.can_edit_vertical && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin';

  // Default verticals view
  return (
    <div className="container py-4 vt-page vt-screen-enter">
      <div className="vt-shell">
        <div className="vt-head">
          <div>
            <p className="vt-kicker">Training</p>
            <h4>Verticals</h4>
          </div>
          {((permissions?.custom_permissions?.can_add_vertical && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
            <button type="button" className="vt-add" onClick={handleAdd}>Add Vertical</button>
          )}
        </div>

        <div className="vt-toolbar">
          <div className="vt-tabs">
            {['Active Verticals', 'Inactive Verticals', 'All Verticals'].map(tab => (
              <button
                type="button"
                key={tab}
                className={activeVerticalTab === tab ? 'is-active' : ''}
                onClick={() => setActiveVerticalTab(tab)}
              >
                {tab.replace(' Verticals', '')}
              </button>
            ))}
          </div>
          <input
            className="vt-search"
            placeholder="Search verticals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredVerticals.length > 0 ? (
          <div className="table-responsive">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerticals.map(vertical => (
                  <tr key={vertical.id} className="vt-row" title="Open projects" onClick={() => handleVerticalClick(vertical)}>
                    <td>
                      <span className="vt-name">
                        <span className="vt-avatar">{(vertical.name || '?').charAt(0).toUpperCase()}</span>
                        {vertical.name}
                        <i className="bi bi-chevron-right vt-go"></i>
                      </span>
                    </td>
                    <td className="vt-desc">{vertical.code || '—'}</td>
                    <td>
                      <span className={`vt-pill ${vertical.status === 'active' ? 'is-active' : ''}`}>
                        {vertical.status}
                      </span>
                    </td>
                    <td className="vt-date">{vertical.createdAt ? new Date(vertical.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {canEditVertical && (
                        <div className="vt-actions">
                          <button type="button" title="Edit" onClick={() => handleEdit(vertical)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(vertical)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vt-empty">
            <i className="bi bi-folder2-open"></i>
            <h5>No verticals found</h5>
            <p>Try another filter or search.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddForm || showEditForm) && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">{editingVertical ? 'Edit Vertical' : 'Add New Vertical'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body">

                <div className="mb-3">
                  <label className="form-label">Vertical Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter vertical name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter Description"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        status: e.target.value === 'true'  // string ko boolean mein convert kar rahe hain
                      }))
                    }
                  >
                    <option value='true'>Active</option>
                    <option value='false'>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleSubmit}>
                  {editingVertical ? 'Update Vertical' : 'Add Vertical'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal />

      {/* Share Modal */}
      {showShareModal && selectedVertical && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Manage Access - {selectedVertical.code}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowShareModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-8">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Add user email"
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Contributor">Contributor</option>
                      <option value="Content Manager">Content Manager</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <textarea className="form-control" placeholder="Add message (optional)" rows={2}></textarea>
                </div>
                <div className="form-check mb-4">
                  <input type="checkbox" className="form-check-input" id="notifyCheck" defaultChecked />
                  <label className="form-check-label">Notify people</label>
                </div>
                <button type="button" className="btn btn-primary">Send</button>

                <hr />

                <h6 className="mb-3">Current Access</h6>
                <ul className="list-group">
                  {selectedVertical.access.map((a, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{a.name}</strong>
                      </div>
                      <select className="form-select w-auto">
                        <option value="Viewer" selected={a.role === 'Viewer'}>Viewer</option>
                        <option value="Contributor" selected={a.role === 'Contributor'}>Contributor</option>
                        <option value="Content Manager" selected={a.role === 'Content Manager'}>Content Manager</option>
                        <option value="Manager" selected={a.role === 'Manager'}>Manager</option>
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
{`
.vt-page { font-family: 'Open Sans', sans-serif; }
.vt-shell {
  background: #fff;
  border-radius: 22px;
  padding: 22px 22px 8px;
  box-shadow: 0 10px 30px rgba(252, 43, 90, 0.08);
  border: 1px solid #ffe4ea;
}
.vt-head, .vt-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.vt-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fb7185;
  font-weight: 700;
}
.vt-head h4 { margin: 2px 0 0; font-weight: 800; color: #1e293b; }
.vt-add {
  border: 0;
  color: #fff;
  background: linear-gradient(90deg, #E11D48, #fb7185);
  border-radius: 999px;
  padding: 10px 18px;
  font-weight: 700;
  box-shadow: 0 8px 16px rgba(225, 29, 72, 0.25);
}
.vt-toolbar { margin: 18px 0 8px; }
.vt-tabs {
  display: flex;
  gap: 6px;
  background: #fff1f4;
  padding: 5px;
  border-radius: 999px;
}
.vt-tabs button {
  border: 0;
  background: transparent;
  color: #9f1239;
  border-radius: 999px;
  padding: 7px 14px;
  font-weight: 700;
  font-size: 13px;
}
.vt-tabs button.is-active { background: #fc2b5a; color: #fff; }
.vt-search {
  border: 1px solid #fecdd3;
  background: #fffafa;
  border-radius: 999px;
  padding: 9px 14px;
  min-width: 220px;
  outline: none;
}
.vt-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
  table-layout: fixed;
}
.vt-table th,
.vt-table td {
  border: 1px solid #e5e7eb;
  padding: 12px 14px;
  text-align: left;
  vertical-align: middle;
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}
.vt-table th {
  background: #fafafa;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #222;
  font-weight: 700;
}
.vt-table th:nth-child(1) { width: 22%; }
.vt-table th:nth-child(2) { width: 38%; }
.vt-table th:nth-child(3) { width: 12%; }
.vt-table th:nth-child(4) { width: 14%; }
.vt-table th:nth-child(5) { width: 14%; }
.vt-table tbody td { background: #fff; }
.vt-row { cursor: pointer; }
.vt-table tbody tr:hover td { background: #f3f4f6; }
.vt-name {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: #be123c;
  font-weight: 800;
  padding: 0;
  transition: color 0.25s ease, transform 0.25s ease;
}
.vt-row:hover .vt-name { transform: translateX(6px); }
.vt-go {
  font-size: 12px;
  color: #fda4af;
  transition: transform 0.25s ease, color 0.25s ease;
}
.vt-row:hover .vt-go { color: #e11d48; transform: translateX(4px); }
.vt-screen-enter { animation: vtSlideIn 0.32s ease; }
@keyframes vtSlideIn {
  from { opacity: 0; transform: translateX(22px); }
  to { opacity: 1; transform: translateX(0); }
}
.vt-avatar {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffe4e6;
  color: #e11d48;
  font-size: 14px;
}
.vt-desc { color: #64748b; max-width: 360px; }
.vt-date { color: #475569; white-space: nowrap; }
.vt-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}
.vt-pill.is-active { background: #dcfce7; color: #15803d; }
.vt-actions { display: flex; gap: 6px; }
.vt-actions button {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid #ffe4e6;
  background: #fff;
  color: #be123c;
}
.vt-actions button.is-danger { color: #e11d48; background: #fff1f2; }
.vt-empty { text-align: center; padding: 48px 12px 36px; color: #94a3b8; }
.vt-empty i { font-size: 36px; color: #fda4af; }
.vt-empty h5 { color: #475569; margin-top: 10px; }
@media (max-width: 768px) {
  .vt-search { width: 100%; min-width: 0; }
  .vt-desc { max-width: 180px; }
}

/* ================== Base Styles ================== */

.searchBar {
  height: 30px;
  width: 25%;
}

.centerBtnResponsive {
  display: flex;
}

.verticalActionBtn {
  display: none;
}

.nav-pills .nav-link.active, 
.nav-pills .show > .nav-link {
  background-color: #fc2b5a;
}

/* ================== 992px ================== */
@media (max-width: 992px) {

  .subBtnRes {
    white-space: nowrap;
    padding: 0.25rem 0.5rem;
    font-size: 12px;
  }

  .visibility {
    display: none !important;
  }

  .centerBtnResponsive {
    display: flex;
  }
}

/* ================== 768px ================== */
@media (max-width: 768px) {

  .visibility {
    display: none !important;
  }

  .allCenter {
    display: block !important;
  }

  .allCenterBtn {
    margin-bottom: 10px !important;
  }

  .verticalActionBtn {
    display: flex;
  }
}

/* ================== 525px ================== */
@media (max-width: 525px) {

  .searchBar {
    width: 85px !important;
  }
}

/* ================== 450px ================== */
@media (max-width: 450px) {

  .navBTn {
    padding: 4px;
    width: 80px;
    border: 1px solid #d5d5d5;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: clamp(12px, 1.8vw, 15px);
  }
}
`}
</style>
    </div>
  );
};

export default CandidateManagementPortal;