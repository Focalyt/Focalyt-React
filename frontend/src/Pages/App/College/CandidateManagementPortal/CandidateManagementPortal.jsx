import React, { useEffect, useState } from 'react';
import Project from '../../../../Component/Layouts/App/College/ProjectManagement/Project';
import axios from 'axios'
import "./CandidateManagment.css"

const CandidateManagementPortal = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userStr = sessionStorage.getItem("user");
  const user = (userStr && userStr !== "undefined") ? JSON.parse(userStr) : {};
  const token = user.token;
  const [activeVerticalTab, setActiveVerticalTab] = useState('Active Verticals');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingVertical, setEditingVertical] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
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

  const [showProjectAddForm, setShowProjectAddForm] = useState(false);
  const [showProjectEditForm, setShowProjectEditForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    description: '',
    name: '',
    status: false
  });

  const [verticals, setVerticals] = useState([

  ]);


  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
      // Removed verticalName from URL for security and cleaner URLs
    } else {
      url.searchParams.delete('verticalId');
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {

    fetchVerticals();

  }, []);

  const fetchVerticals = async () => {
    const newVertical = await axios.get(`${backendUrl}/college/getVerticals`, { headers: { 'x-auth': token } });

    console.log('token', token)

    const verticalList = newVertical.data.data.map(v => ({
      id: v._id,
      name: v.name,
      status: v.status === true ? 'active' : 'inactive',
      code: v.description,
      projects: 2, // Optional: adjust based on real data
      createdAt: v.createdAt
    }));

    setVerticals(verticalList);

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

  const handleShare = (vertical) => {
    setSelectedVertical(vertical);
    setShowShareModal(true);
  };

  useEffect(() => {
    // URL-based restoration logic only
    const { stage, verticalId } = getInitialState();
  
    console.log('Restoring state from URL:', { stage, verticalId });
  
    if (stage === "project" && verticalId && verticals.length > 0) {
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
    } else {
      // Default to vertical view
      setShowVertical(true);
      setShowProjects(false);
      if (stage !== 'vertical') {
        updateURL('vertical');
      }
      console.log('Restored to vertical view');
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
      <div>
        {/* Breadcrumb Navigation */}
        {/* <div className="d-flex justify-content-between align-items-center mb-3">
          
          <div>
            <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
            </button>
            <button className="btn btn-danger" onClick={handleAdd}>Add Project</button>
          </div>
        </div> */}


        {/* Project Component with filtered data */}
       <Project selectedVertical={selectedVerticalForProjects} onBackToVerticals={handleBackToVerticals} />

      </div>
    );
  }

  // Default verticals view
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Verticals</h4>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>

          <button className="btn btn-danger" onClick={handleAdd}>Add Vertical</button>

        </div>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <ul className="nav nav-pills">
          {['Active Verticals', 'Inactive Verticals', 'All Verticals'].map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link ${activeVerticalTab === tab ? 'active' : ''}`}
                onClick={() => setActiveVerticalTab(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className="form-control w-25"
          placeholder="Search verticals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="row">
        {filteredVerticals.map(vertical => (
          <div key={vertical.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`} onClick={() => handleVerticalClick(vertical)} style={{ cursor: 'pointer' }}>
            <div className="card h-100 border rounded shadow-sm folder-card position-relative">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div
                    className="flex-grow-1 cursor-pointer"
                  >
                    <i className="bi bi-folder-fill text-warning fs-3"></i>
                    <h3 className="mt-2 mb-1">{vertical.name}</h3>
                    <p className="text-muted mb-1">{vertical.code}</p>
                    <span className={`${vertical.status === 'active' ? 'text-success' : 'text-secondary'}`}>{vertical.status}</span>
                  </div>
                  <div className="text-end verticalActionBtn">
                    <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Share" onClick={(e) => { e.stopPropagation(); handleShare(vertical); }}>
                      <i className="bi bi-share-fill"></i>
                    </button>
                    <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(vertical); }}>
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button className="btn btn-sm btn-light text-danger border-0 bg-transparent" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(vertical); }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="small text-muted mt-3">
                  <div><i className="bi bi-calendar me-1"></i>Created: <strong>{vertical.createdAt}</strong></div>
                  {/* <div>
                    <i className="bi bi-clipboard-data me-1"></i>
                    <span
                      className="text-primary"
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleVerticalClick(vertical)}
                    >
                      {vertical.projects} Projects
                    </span>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVerticals.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-folder-x fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No verticals found</h5>
          <p className="text-muted">Try adjusting your search or filter criteria</p>
        </div>
      )}

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
        {
          `
          @media (max-width: 768px) {
            .verticalActionBtn{
              display: flex;
            }
          }
          `
        }
      </style>
    </div>
  );
};

export default CandidateManagementPortal;