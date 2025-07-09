import React, { useState, useEffect } from 'react';
import Center from '../../../../Layouts/App/College/ProjectManagement/Center';

const Project = ({ selectedVertical = null, onBackToVerticals = null }) => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  
  // Safe session storage access with fallback
  const getUserData = () => {
    try {
      const userStr = sessionStorage.getItem("user");
      if (!userStr || userStr === "undefined" || userStr === "null") {
        return {};
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user data from sessionStorage:", error);
      return {};
    }
  };

  const userData = getUserData();
  const token = userData.token;

  const [activeProjectTab, setActiveProjectTab] = useState('Active Projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newUser, setNewUser] = useState('');
  const [newRole, setNewRole] = useState('Viewer');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // New states for center view
  const [showCenters, setShowCenters] = useState(false);
  const [selectedProjectForCenters, setSelectedProjectForCenters] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    vertical: selectedVertical?.id || '',
    status: 'active',
  });

  // Sample verticals for dropdown
  const availableVerticals = [
    { id: 1, code: 'FFTL', name: 'Focalyt Future Technology Labs' },
    { id: 2, code: 'GSE', name: 'Guest Service Associates' }
  ];

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update form data when selectedVertical changes
  useEffect(() => {
    if (selectedVertical) {
      setFormData(prev => ({
        ...prev,
        vertical: selectedVertical.id
      }));
    }
  }, [selectedVertical]);

  const filteredProjects = projects.filter(project => {
    // Status filter based on activeProjectTab
    if (activeProjectTab === 'Active Projects' && project.status?.toLowerCase() !== 'active') {
      return false;
    }
    if (activeProjectTab === 'Inactive Projects' && project.status?.toLowerCase() !== 'inactive') {
      return false;
    }

    // Search filter on name, code, or vertical (case-insensitive)
    const search = searchQuery.toLowerCase();
    const nameMatch = project.name?.toLowerCase().includes(search) || false;
    const codeMatch = project.code?.toLowerCase().includes(search) || false;
    const verticalMatch = project.vertical?.toLowerCase().includes(search) || false;

    return nameMatch || codeMatch || verticalMatch;
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      vertical: selectedVertical?.id || '',
      status: 'active',
      priority: 'medium'
    });
  };

  const handleAdd = () => {
    setEditingProject(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      code: project.code || '',
      name: project.name || '',
      description: project.description || '',
      vertical: project.vertical || '',
      status: project.status || 'active',
      priority: project.priority || 'medium'
    });
    setShowEditForm(true);
  };

  const handleDelete = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !token) return;

    try {
      const response = await fetch(`${backendUrl}/college/delete_project/${projectToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'x-auth': token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete project');
      }

      // Backend delete successful, local state update karo
      fetchProjects();

      // Modal close karo
      setShowDeleteModal(false);
      setProjectToDelete(null);

    } catch (error) {
      console.error('Delete error:', error);
      alert(error.message || 'Something went wrong while deleting');
    }
  };

  const fetchProjects = async () => {
    // Pehle check karo ke selectedVertical properly set hai ya nahi
    if (!selectedVertical || !selectedVertical.id) {
      console.warn('selectedVertical or selectedVertical.id not available:', selectedVertical);
      setProjects([]);
      setError('No vertical selected');
      return;
    }

    // Token check karo
    if (!token) {
      console.warn('No authentication token available');
      setError('Authentication required');
      return;
    }

    console.log('Fetching projects for selectedVertical:', selectedVertical);
    setLoading(true);
    setError(null);

    try {
      const url = `${backendUrl}/college/list-projects?vertical=${selectedVertical.id}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch projects'}`);
      }

      // Response text pehle check karo
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response received');
        setProjects([]);
        return;
      }

      // Ab safely JSON parse karo
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('Parsed data:', data);
      
      if (data && data.success && Array.isArray(data.data)) {
        setProjects(data.data);
        console.log('Projects set successfully:', data.data.length, 'projects');
      } else if (data && data.data && Array.isArray(data.data)) {
        // Agar success field nahi hai but data array hai
        setProjects(data.data);
        console.log('Projects set (no success field):', data.data.length, 'projects');
      } else {
        console.warn('Unexpected data format:', data);
        setProjects([]);
        setError('No projects found for this vertical');
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
      setError(err.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Component mount hone par immediately fetch mat karo
    // Pehle check karo ke selectedVertical properly set hai
    console.log('useEffect triggered with selectedVertical:', selectedVertical);
    
    if (selectedVertical && selectedVertical.id && token) {
      // Small delay add karo to ensure component properly mounted hai
      const timeoutId = setTimeout(() => {
        fetchProjects();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log('Not fetching projects:', { 
        hasSelectedVertical: !!selectedVertical, 
        hasId: !!selectedVertical?.id, 
        hasToken: !!token 
      });
      setProjects([]);
      setLoading(false);
    }
  }, [selectedVertical?.id, token]); // Dependencies ko specific rakho

  const handleSubmit = async () => {
    console.log('selectedVertical', selectedVertical);
    
    if (!formData.name?.trim() || !formData.vertical?.toString().trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!token) {
      alert('Authentication token not found. Please login again.');
      return;
    }

    try {
      console.log('formData', JSON.stringify(formData));

      if (editingProject) {
        // Edit existing project - PUT request
        const response = await fetch(`${backendUrl}/college/edit_project/${editingProject._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth': token
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update project');
        }

        fetchProjects();
        setShowEditForm(false);
      } else {
        // Add new project - POST request
        const response = await fetch(`${backendUrl}/college/add_project`, {
          method: 'POST',
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add project');
        }

        fetchProjects();
        setShowAddForm(false);
      }

      resetForm();
      setEditingProject(null);
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.message || 'Something went wrong');
    }
  };

  const handleShare = (project) => {
    setSelectedProject(project);
    setShowShareModal(true);
  };
  // URL-based state management for project component
  const getProjectState = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const stage = urlParams.get('stage') || 'project';
    const projectId = urlParams.get('projectId');
    
    return { stage, projectId };
  };

  const updateProjectURL = (stage, project = null) => {
    const url = new URL(window.location);
    url.searchParams.set('stage', stage);
    if (project) {
      url.searchParams.set('projectId', project._id || project.id);
    } else {
      url.searchParams.delete('projectId');
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    // URL-based restoration logic
    const { stage, projectId } = getProjectState();
  
    console.log('Project component - Restoring state from URL:', { stage, projectId });
  
    if (stage === "center" && projectId && projects.length > 0) {
      // We have projectId in URL and projects are loaded, find the project
      const foundProject = projects.find(p => (p._id || p.id) === projectId);
      if (foundProject) {
        setSelectedProjectForCenters(foundProject);
        setShowCenters(true);
        console.log('Found project from URL and restored to center view:', foundProject.name);
      } else {
        // Project not found, reset to project view
        console.warn('Project not found, resetting to project view');
        updateProjectURL('project');
        setShowCenters(false);
      }
    } else {
      // Default to project view
      setShowCenters(false);
      if (stage !== 'project') {
        updateProjectURL('project');
      }
      console.log('Restored to project view');
    }
  }, [projects]); // Added projects as dependency

  // New function to handle project click for centers
  const handleProjectClick = (project) => {
    setSelectedProjectForCenters(project);
    setShowCenters(true);
    updateProjectURL('center', project);
  };

  // Function to go back to projects view
  const handleBackToProjects = () => {
    setShowCenters(false);
    setSelectedProjectForCenters(null);
    updateProjectURL('project');
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
    setEditingProject(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getProgressPercentage = (completed, total) => {
    if (!total || total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !projectToDelete) return null;

    return (
      <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Confirm Delete</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the project <strong>{projectToDelete.name} ({projectToDelete.code})</strong>?</p>
              <p className="text-muted">This action cannot be undone and will remove all associated data.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Early return conditions with better error handling
  if (!token) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Authentication required. Please login again.
        </div>
      </div>
    );
  }

  if (!selectedVertical) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          No vertical selected. Please select a vertical first.
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="container py-4">
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading projects...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container py-4">
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-circle me-2"></i>
        {error}
        <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchProjects}>
          Retry
        </button>
      </div>
    </div>
  );

  // If showing centers, render the Center component
  if (showCenters && selectedProjectForCenters) {
    return (
      <div>
        <Center 
          selectedProject={selectedProjectForCenters} 
          onBackToProjects={handleBackToProjects} 
          onBackToVerticals={onBackToVerticals} 
          selectedVertical={selectedVertical} 
        />
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Back Button and Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className='d-md-block d-none'>
          <div className="d-flex align-items-center gap-3">
            <div className='d-flex align-items-center'>
              <h4 onClick={onBackToVerticals} style={{ cursor: 'pointer' }} className="me-2">
                {selectedVertical?.name || 'Unknown'} Vertical
              </h4>
              <span className="mx-2"> &gt; </span>
              <h5 className="breadcrumb-item mb-0" style={{ whiteSpace: 'nowrap' }} aria-current="page">
                Project
              </h5>
            </div>
          </div>
        </div>
        <div className='d-flex'>
          {onBackToVerticals && (
            <button
              onClick={onBackToVerticals}
              className="btn btn-light"
              title="Back to Verticals"
            >
              <i className="bi bi-arrow-left"></i>
              <span>Back</span>
            </button>
          )}

          <button className="btn btn-outline-secondary me-2 border-0" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>
          <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={handleAdd}>Add Project</button>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <ul className="nav nav-pills">
          {['Active Projects', 'Inactive Projects', 'All Projects'].map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link ${activeProjectTab === tab ? 'active' : ''}`}
                onClick={() => setActiveProjectTab(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className="form-control w-25"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="row">
        {filteredProjects.map(project => {
          const progressPercentage = getProgressPercentage(project.completedTasks, project.tasks);
          return (
            <div key={project.id || project._id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
              <div className="card h-100 border rounded shadow-sm position-relative">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2 row">
                    <div className="flex-grow-1 cursor-pointer col-md-9"
                      onClick={() => handleProjectClick(project)}
                      style={{ cursor: 'pointer' }}>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-kanban-fill text-primary fs-3 me-2"></i>
                        <div>
                          <h3 className="text-muted mb-1">{project.name || 'Unnamed Project'}</h3>
                        </div>
                      </div>
                      <p className="text-muted small mb-2">{project.description || 'No description'}</p>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className={`${project.status === 'active' ? 'text-success' : 'bg-secondary'}`}>
                          {project.status || 'unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="text-end d-flex col-md-3 justify-content-end">
                      {/* <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Share" onClick={(e) => { e.stopPropagation(); handleShare(project); }}>
                        <i className="bi bi-share-fill"></i>
                      </button> */}
                      <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(project); }}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn btn-sm btn-light text-danger border-0 bg-transparent" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(project); }}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="small text-muted">
                    <div className="row">
                      <div className="col-4">
                        <i className="bi bi-calendar me-1"></i>Created: <strong>{new Date(project.createdAt).toLocaleDateString('en-GB') || 'N/A'}</strong>
                      </div>
                      {/* <div className="col-4">
                        <i className="bi bi-calendar-check me-1"></i>Due: <strong>{new Date(project.dueDate).toLocaleDateString('en-GB') || 'N/A'}</strong>
                      </div> */}
                      {/* <div className="col-4">
                        <span
                          className="text-primary"
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => handleProjectClick(project)}
                        >
                          <i className="bi bi-building me-1"></i>{project.centers || 0} Centers
                        </span>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-5">
          <i className="bi bi-kanban fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No projects found</h5>
          {selectedVertical ? (
            <p className="text-muted">No projects found for {selectedVertical.name}</p>
          ) : (
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddForm || showEditForm) && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{editingProject ? 'Edit Project' : 'Add New Project'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Project Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter project description"
                    ></textarea>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                  {editingProject ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal />

      {/* Share Modal */}
      {showShareModal && selectedProject && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Manage Access - {selectedProject.code || 'Project'}</h5>
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
                      <option value="Project Manager">Project Manager</option>
                      <option value="Admin">Admin</option>
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
                  {(selectedProject.access || []).map((a, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{a.name || 'Unknown User'}</strong>
                      </div>
                      <select className="form-select w-auto">
                        <option value="Viewer" selected={a.role === 'Viewer'}>Viewer</option>
                        <option value="Contributor" selected={a.role === 'Contributor'}>Contributor</option>
                        <option value="Project Manager" selected={a.role === 'Project Manager'}>Project Manager</option>
                        <option value="Admin" selected={a.role === 'Admin'}>Admin</option>
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
          @media(max-width:768px){
            .verticals{
              font-size:15px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Project;