import React, { useState, useEffect } from 'react';
import Center from '../../../../Layouts/App/College/ProjectManagement/Center';

const Project = ({ selectedVertical = null, onBackToVerticals = null }) => {
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
    vertical: selectedVertical?.code || '',
    status: 'active',
  });

  // Sample verticals for dropdown
  const availableVerticals = [
    { id: 1, code: 'FFTL', name: 'Focalyt Future Technology Labs' },
    { id: 2, code: 'GSE', name: 'Guest Service Associates' }
  ];

  const [projects, setProjects] = useState([
    {
      id: 1,
      code: 'PROJ001',
      name: 'AI Research Platform',
      description: 'Advanced AI research and development platform',
      vertical: 'FFTL',
      status: 'active',
      priority: 'high',
      tasks: 15,
      completedTasks: 8,
      centers: 2, // Added centers count
      createdAt: '2024-04-15',
      dueDate: '2024-08-30',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 2,
      code: 'PROJ002',
      name: 'Guest Experience App',
      description: 'Mobile application for enhanced guest services',
      vertical: 'GSE',
      status: 'active',
      priority: 'medium',
      tasks: 22,
      completedTasks: 18,
      centers: 3, // Added centers count
      createdAt: '2024-03-20',
      dueDate: '2024-07-15',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 3,
      code: 'PROJ003',
      name: 'Data Analytics Dashboard',
      description: 'Comprehensive analytics and reporting dashboard',
      vertical: 'FFTL',
      status: 'inactive',
      priority: 'low',
      tasks: 8,
      completedTasks: 8,
      centers: 1, // Added centers count
      createdAt: '2024-02-10',
      dueDate: '2024-06-01',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 4,
      code: 'PROJ004',
      name: 'Customer Feedback System',
      description: 'Real-time customer feedback and rating system',
      vertical: 'GSE',
      status: 'active',
      priority: 'high',
      tasks: 12,
      completedTasks: 5,
      centers: 2, // Added centers count
      createdAt: '2024-04-01',
      dueDate: '2024-09-15',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    }
  ]);

  // Update form data when selectedVertical changes
  useEffect(() => {
    if (selectedVertical) {
      setFormData(prev => ({
        ...prev,
        vertical: selectedVertical.code
      }));
    }
  }, [selectedVertical]);

  const filteredProjects = projects.filter(project => {
    // Filter by selected vertical if provided
    if (selectedVertical && project.vertical !== selectedVertical.code) return false;
    
    // Filter by tab
    if (activeProjectTab === 'Active Projects' && project.status !== 'active') return false;
    if (activeProjectTab === 'Inactive Projects' && project.status !== 'inactive') return false;
    
    // Filter by search query
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.vertical.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      vertical: selectedVertical?.code || '',
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
      code: project.code,
      name: project.name,
      description: project.description,
      vertical: project.vertical,
      status: project.status,
      priority: project.priority
    });
    setShowEditForm(true);
  };

  const handleDelete = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleSubmit = () => {
    if ( !formData.name.trim() || !formData.vertical.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingProject) {
      // Edit existing project
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id 
          ? { ...p, ...formData }
          : p
      ));
      setShowEditForm(false);
    } else {
      // Add new project
      const newProject = {
        id: Date.now(),
        ...formData,
        tasks: 0,
        completedTasks: 0,
        centers: 0, // Initialize centers count
        createdAt: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
      };
      setProjects(prev => [...prev, newProject]);
      setShowAddForm(false);
    }
    
    resetForm();
    setEditingProject(null);
  };

  const handleShare = (project) => {
    setSelectedProject(project);
    setShowShareModal(true);
  };

  // New function to handle project click for centers
  const handleProjectClick = (project) => {
    setSelectedProjectForCenters(project);
    setShowCenters(true);
  };

  // Function to go back to projects view
  const handleBackToProjects = () => {
    setShowCenters(false);
    setSelectedProjectForCenters(null);
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
    setEditingProject(null);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0;
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

  // If showing centers, render the Center component
  if (showCenters && selectedProjectForCenters) {
    return (
      <div>
        {/* Breadcrumb Navigation */}
        {/* <div className="container py-2 d-none">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              {onBackToVerticals && (
                <li className="breadcrumb-item">
                  <button 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={onBackToVerticals}
                  >
                    Verticals
                  </button>
                </li>
              )}
              <li className="breadcrumb-item">
                <button 
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={handleBackToProjects}
                >
                  {selectedVertical ? `${selectedVertical.name} Projects` : 'Projects'}
                </button>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {selectedProjectForCenters.name} Centers
              </li>
            </ol>
          </nav>
        </div> */}
        
        {/* Center Component with filtered data */}
        <Center selectedProject={selectedProjectForCenters} />
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Back Button and Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="d-flex align-items-center gap-3">
          
            <div className='d-flex align-items-center'>
            <h4 onClick={onBackToVerticals}  className="verticals me-2">Verticals</h4>
            <span className="mx-2"> &gt; </span>
            <h5 className="breadcrumb-item mb-0 verticals" style={{whiteSpace: 'nowrap'}} aria-current="page">
              {selectedVertical.name} Projects
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
          <button className="btn btn-primary" style={{whiteSpace: 'nowrap'}} onClick={handleAdd}>Add Project</button>
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
            <div key={project.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
              <div className="card h-100 border rounded shadow-sm position-relative">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div 
                      className="flex-grow-1 cursor-pointer"
                      onClick={() => handleProjectClick(project)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-kanban-fill text-primary fs-3 me-2"></i>
                        <div>
                          <h5 className="card-title mb-1">{project.code}</h5>
                          <p className="text-muted mb-1">{project.name}</p>
                        </div>
                      </div>
                      <p className="text-muted small mb-2">{project.description}</p>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className={`${project.status === 'active' ? 'text-success' : 'bg-secondary'}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Share" onClick={(e) => {e.stopPropagation(); handleShare(project);}}>
                        <i className="bi bi-share-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Edit" onClick={(e) => {e.stopPropagation(); handleEdit(project);}}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn btn-sm btn-light text-danger border-0 bg-transparent" title="Delete" onClick={(e) => {e.stopPropagation(); handleDelete(project);}}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Progress</span>
                      <span>{project.completedTasks}/{project.tasks} tasks ({progressPercentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className="progress-bar text-success" 
                        role="progressbar" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="small text-muted">
                    <div className="row">
                      <div className="col-4">
                        <i className="bi bi-calendar me-1"></i>Created: <strong>{project.createdAt}</strong>
                      </div>
                      <div className="col-4">
                        <i className="bi bi-calendar-check me-1"></i>Due: <strong>{project.dueDate}</strong>
                      </div>
                      <div className="col-4">
                        <span 
                          className="text-primary" 
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => handleProjectClick(project)}
                        >
                          <i className="bi bi-building me-1"></i>{project.centers} Centers
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
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
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.description}
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
                      value={formData.status}
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
                <h5 className="modal-title">Manage Access - {selectedProject.code}</h5>
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
                  {selectedProject.access.map((a, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{a.name}</strong>
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
        {
          `
          @media(max-width:768px){
          .verticals{
          font-size:15px;
          }
          }
          `
        }
      </style>
    </div>
  );
};

export default Project;

// import React, { useState } from 'react';

// const Project = () => {
//   const [activeProjectTab, setActiveProjectTab] = useState('Active Projects');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [showEditForm, setShowEditForm] = useState(false);
//   const [editingProject, setEditingProject] = useState(null);
//   const [viewMode, setViewMode] = useState('grid');
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [newUser, setNewUser] = useState('');
//   const [newRole, setNewRole] = useState('Viewer');
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [projectToDelete, setProjectToDelete] = useState(null);

//   // Form states
//   const [formData, setFormData] = useState({
//     code: '',
//     name: '',
//     description: '',
//     vertical: '',
//     status: 'active',
//     priority: 'medium'
//   });

//   // Sample verticals for dropdown
//   const availableVerticals = [
//     { id: 1, code: 'FFTL', name: 'Focalyt Future Technology Labs' },
//     { id: 2, code: 'GSE', name: 'Guest Service Associates' }
//   ];

//   const [projects, setProjects] = useState([
//     {
//       id: 1,
//       code: 'PROJ001',
//       name: 'AI Research Platform',
//       description: 'Advanced AI research and development platform',
//       vertical: 'FFTL',
//       status: 'active',
//       priority: 'high',
//       tasks: 15,
//       completedTasks: 8,
//       createdAt: '2024-04-15',
//       dueDate: '2024-08-30',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     },
//     {
//       id: 2,
//       code: 'PROJ002',
//       name: 'Guest Experience App',
//       description: 'Mobile application for enhanced guest services',
//       vertical: 'GSE',
//       status: 'active',
//       priority: 'medium',
//       tasks: 22,
//       completedTasks: 18,
//       createdAt: '2024-03-20',
//       dueDate: '2024-07-15',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     },
//     {
//       id: 3,
//       code: 'PROJ003',
//       name: 'Data Analytics Dashboard',
//       description: 'Comprehensive analytics and reporting dashboard',
//       vertical: 'FFTL',
//       status: 'inactive',
//       priority: 'low',
//       tasks: 8,
//       completedTasks: 8,
//       createdAt: '2024-02-10',
//       dueDate: '2024-06-01',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     }
//   ]);

//   const filteredProjects = projects.filter(project => {
//     if (activeProjectTab === 'Active Projects' && project.status !== 'active') return false;
//     if (activeProjectTab === 'Inactive Projects' && project.status !== 'inactive') return false;
//     return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            project.vertical.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const resetForm = () => {
//     setFormData({
//       code: '',
//       name: '',
//       description: '',
//       vertical: '',
//       status: 'active',
//       priority: 'medium'
//     });
//   };

//   const handleAdd = () => {
//     setEditingProject(null);
//     resetForm();
//     setShowAddForm(true);
//   };

//   const handleEdit = (project) => {
//     setEditingProject(project);
//     setFormData({
//       code: project.code,
//       name: project.name,
//       description: project.description,
//       vertical: project.vertical,
//       status: project.status,
//       priority: project.priority
//     });
//     setShowEditForm(true);
//   };

//   const handleDelete = (project) => {
//     setProjectToDelete(project);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = () => {
//     setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
//     setShowDeleteModal(false);
//     setProjectToDelete(null);
//   };

//   const handleSubmit = () => {
//     if (!formData.code.trim() || !formData.name.trim() || !formData.vertical.trim()) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     if (editingProject) {
//       // Edit existing project
//       setProjects(prev => prev.map(p => 
//         p.id === editingProject.id 
//           ? { ...p, ...formData }
//           : p
//       ));
//       setShowEditForm(false);
//     } else {
//       // Add new project
//       const newProject = {
//         id: Date.now(),
//         ...formData,
//         tasks: 0,
//         completedTasks: 0,
//         createdAt: new Date().toISOString().split('T')[0],
//         dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
//         access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//       };
//       setProjects(prev => [...prev, newProject]);
//       setShowAddForm(false);
//     }
    
//     resetForm();
//     setEditingProject(null);
//   };

//   const handleShare = (project) => {
//     setSelectedProject(project);
//     setShowShareModal(true);
//   };

//   const closeModal = () => {
//     setShowAddForm(false);
//     setShowEditForm(false);
//     resetForm();
//     setEditingProject(null);
//   };

//   const getPriorityColor = (priority) => {
//     switch(priority) {
//       case 'high': return 'bg-danger';
//       case 'medium': return 'bg-warning';
//       case 'low': return 'bg-info';
//       default: return 'bg-secondary';
//     }
//   };

//   const getProgressPercentage = (completed, total) => {
//     if (total === 0) return 0;
//     return Math.round((completed / total) * 100);
//   };

//   const DeleteModal = () => {
//     if (!showDeleteModal || !projectToDelete) return null;

//     return (
//       <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//         <div className="modal-dialog modal-dialog-centered">
//           <div className="modal-content">
//             <div className="modal-header bg-danger text-white">
//               <h5 className="modal-title">Confirm Delete</h5>
//               <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
//             </div>
//             <div className="modal-body">
//               <p>Are you sure you want to delete the project <strong>{projectToDelete.name} ({projectToDelete.code})</strong>?</p>
//               <p className="text-muted">This action cannot be undone and will remove all associated data.</p>
//             </div>
//             <div className="modal-footer">
//               <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
//                 Cancel
//               </button>
//               <button type="button" className="btn btn-danger" onClick={confirmDelete}>
//                 Delete Project
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="container py-4">
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <h4>Projects</h4>
//         <div>
//           <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
//             <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
//           </button>
//           <button className="btn btn-primary" onClick={handleAdd}>Add Project</button>
//         </div>
//       </div>

//       <div className="d-flex justify-content-between mb-3">
//         <ul className="nav nav-pills">
//           {['Active Projects', 'Inactive Projects', 'All Projects'].map(tab => (
//             <li className="nav-item" key={tab}>
//               <button
//                 className={`nav-link ${activeProjectTab === tab ? 'active' : ''}`}
//                 onClick={() => setActiveProjectTab(tab)}
//               >
//                 {tab}
//               </button>
//             </li>
//           ))}
//         </ul>
//         <input
//           type="text"
//           className="form-control w-25"
//           placeholder="Search projects..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//       </div>

//       <div className="row">
//         {filteredProjects.map(project => {
//           const progressPercentage = getProgressPercentage(project.completedTasks, project.tasks);
//           return (
//             <div key={project.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
//               <div className="card h-100 border rounded shadow-sm position-relative">
//                 <div className="card-body">
//                   <div className="d-flex justify-content-between align-items-start mb-2">
//                     <div className="flex-grow-1">
//                       <div className="d-flex align-items-center mb-2">
//                         <i className="bi bi-kanban-fill text-primary fs-3 me-2"></i>
//                         <div>
//                           <h5 className="card-title mb-1">{project.code}</h5>
//                           <p className="text-muted mb-1">{project.name}</p>
//                         </div>
//                       </div>
//                       <p className="text-muted small mb-2">{project.description}</p>
//                       <div className="d-flex flex-wrap gap-2 mb-2">
//                         <span className={`badge ${project.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
//                           {project.status}
//                         </span>
//                         <span className={`badge ${getPriorityColor(project.priority)}`}>
//                           {project.priority} priority
//                         </span>
//                         <span className="badge bg-info">{project.vertical}</span>
//                       </div>
//                     </div>
//                     <div className="text-end">
//                       <button className="btn btn-sm btn-light me-1" title="Share" onClick={() => handleShare(project)}>
//                         <i className="bi bi-share-fill"></i>
//                       </button>
//                       <button className="btn btn-sm btn-light me-1" title="Edit" onClick={() => handleEdit(project)}>
//                         <i className="bi bi-pencil-square"></i>
//                       </button>
//                       <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={() => handleDelete(project)}>
//                         <i className="bi bi-trash"></i>
//                       </button>
//                     </div>
//                   </div>
                  
//                   {/* Progress Bar */}
//                   <div className="mb-3">
//                     <div className="d-flex justify-content-between small text-muted mb-1">
//                       <span>Progress</span>
//                       <span>{project.completedTasks}/{project.tasks} tasks ({progressPercentage}%)</span>
//                     </div>
//                     <div className="progress" style={{ height: '6px' }}>
//                       <div 
//                         className="progress-bar bg-success" 
//                         role="progressbar" 
//                         style={{ width: `${progressPercentage}%` }}
//                       ></div>
//                     </div>
//                   </div>

//                   <div className="small text-muted">
//                     <div className="row">
//                       <div className="col-6">
//                         <i className="bi bi-calendar me-1"></i>Created: <strong>{project.createdAt}</strong>
//                       </div>
//                       <div className="col-6">
//                         <i className="bi bi-calendar-check me-1"></i>Due: <strong>{project.dueDate}</strong>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {filteredProjects.length === 0 && (
//         <div className="text-center py-5">
//           <i className="bi bi-kanban fs-1 text-muted"></i>
//           <h5 className="text-muted mt-3">No projects found</h5>
//           <p className="text-muted">Try adjusting your search or filter criteria</p>
//         </div>
//       )}

//       {/* Add/Edit Modal */}
//       {(showAddForm || showEditForm) && (
//         <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg">
//             <div className="modal-content">
//               <div className="modal-header bg-primary text-white">
//                 <h5 className="modal-title">{editingProject ? 'Edit Project' : 'Add New Project'}</h5>
//                 <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
//               </div>
//               <div className="modal-body">
//                 <div className="row">
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Project Code *</label>
//                     <input
//                       type="text"
//                       className="form-control"
//                       value={formData.code}
//                       onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
//                       placeholder="Enter project code (e.g., PROJ001)"
//                     />
//                   </div>
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Vertical *</label>
//                     <select
//                       className="form-select"
//                       value={formData.vertical}
//                       onChange={(e) => setFormData(prev => ({ ...prev, vertical: e.target.value }))}
//                     >
//                       <option value="">Select Vertical</option>
//                       {availableVerticals.map(vertical => (
//                         <option key={vertical.id} value={vertical.code}>
//                           {vertical.code} - {vertical.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//                 <div className="mb-3">
//                   <label className="form-label">Project Name *</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     value={formData.name}
//                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter project name"
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label className="form-label">Description</label>
//                   <textarea
//                     className="form-control"
//                     rows="3"
//                     value={formData.description}
//                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                     placeholder="Enter project description"
//                   ></textarea>
//                 </div>
//                 <div className="row">
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Status</label>
//                     <select
//                       className="form-select"
//                       value={formData.status}
//                       onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
//                     >
//                       <option value="active">Active</option>
//                       <option value="inactive">Inactive</option>
//                     </select>
//                   </div>
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Priority</label>
//                     <select
//                       className="form-select"
//                       value={formData.priority}
//                       onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
//                     >
//                       <option value="low">Low</option>
//                       <option value="medium">Medium</option>
//                       <option value="high">High</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" className="btn btn-secondary" onClick={closeModal}>
//                   Cancel
//                 </button>
//                 <button type="button" className="btn btn-primary" onClick={handleSubmit}>
//                   {editingProject ? 'Update Project' : 'Add Project'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       <DeleteModal />

//       {/* Share Modal */}
//       {showShareModal && selectedProject && (
//         <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
//             <div className="modal-content" onClick={e => e.stopPropagation()}>
//               <div className="modal-header bg-primary text-white">
//                 <h5 className="modal-title">Manage Access - {selectedProject.code}</h5>
//                 <button type="button" className="btn-close btn-close-white" onClick={() => setShowShareModal(false)}></button>
//               </div>
//               <div className="modal-body">
//                 <div className="row mb-3">
//                   <div className="col-md-8">
//                     <input
//                       type="email"
//                       className="form-control"
//                       placeholder="Add user email"
//                       value={newUser}
//                       onChange={(e) => setNewUser(e.target.value)}
//                     />
//                   </div>
//                   <div className="col-md-4">
//                     <select
//                       className="form-select"
//                       value={newRole}
//                       onChange={(e) => setNewRole(e.target.value)}
//                     >
//                       <option value="Viewer">Viewer</option>
//                       <option value="Contributor">Contributor</option>
//                       <option value="Project Manager">Project Manager</option>
//                       <option value="Admin">Admin</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="mb-3">
//                   <textarea className="form-control" placeholder="Add message (optional)" rows={2}></textarea>
//                 </div>
//                 <div className="form-check mb-4">
//                   <input type="checkbox" className="form-check-input" id="notifyCheck" defaultChecked />
//                   <label className="form-check-label">Notify people</label>
//                 </div>
//                 <button type="button" className="btn btn-primary">Send</button>

//                 <hr />

//                 <h6 className="mb-3">Current Access</h6>
//                 <ul className="list-group">
//                   {selectedProject.access.map((a, index) => (
//                     <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
//                       <div>
//                         <strong>{a.name}</strong>
//                       </div>
//                       <select className="form-select w-auto">
//                         <option value="Viewer" selected={a.role === 'Viewer'}>Viewer</option>
//                         <option value="Contributor" selected={a.role === 'Contributor'}>Contributor</option>
//                         <option value="Project Manager" selected={a.role === 'Project Manager'}>Project Manager</option>
//                         <option value="Admin" selected={a.role === 'Admin'}>Admin</option>
//                       </select>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//               <div className="modal-footer">
//                 <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Done</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Project;