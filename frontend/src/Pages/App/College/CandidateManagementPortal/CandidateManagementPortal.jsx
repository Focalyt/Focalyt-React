import React, { useState } from 'react';
import Project from '../../../../Component/Layouts/App/College/ProjectManagement/Project';

const CandidateManagementPortal = () => {
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
  
  // New state for project view
  const [showProjects, setShowProjects] = useState(false);
  const [selectedVerticalForProjects, setSelectedVerticalForProjects] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    status: 'active'
  });

  const [verticals, setVerticals] = useState([
    {
      id: 1,
      code: 'FFTL',
      name: 'Focalyt Future Technology Labs',
      status: 'active',
      projects: 2,
      createdAt: '2024-04-12',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 2,
      code: 'GSE',
      name: 'Guest Service Associates',
      status: 'active',
      projects: 1,
      createdAt: '2024-03-18',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    }
  ]);

  const filteredVerticals = verticals.filter(vertical => {
    if (activeVerticalTab === 'Active Verticals' && vertical.status !== 'active') return false;
    if (activeVerticalTab === 'Inactive Verticals' && vertical.status !== 'inactive') return false;
    return vertical.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           vertical.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      status: 'active'
    });
  };

  const handleAdd = () => {
    setEditingVertical(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEdit = (vertical) => {
    setEditingVertical(vertical);
    setFormData({
      code: vertical.code,
      name: vertical.name,
      status: vertical.status
    });
    setShowEditForm(true);
  };

  const handleDelete = (vertical) => {
    setVerticalToDelete(vertical);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setVerticals(prev => prev.filter(v => v.id !== verticalToDelete.id));
    setShowDeleteModal(false);
    setVerticalToDelete(null);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingVertical) {
      // Edit existing vertical
      setVerticals(prev => prev.map(v => 
        v.id === editingVertical.id 
          ? { ...v, ...formData }
          : v
      ));
      setShowEditForm(false);
    } else {
      // Add new vertical
      const newVertical = {
        id: Date.now(),
        ...formData,
        projects: 0,
        createdAt: new Date().toISOString().split('T')[0],
        access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
      };
      setVerticals(prev => [...prev, newVertical]);
      setShowAddForm(false);
    }
    
    resetForm();
    setEditingVertical(null);
  };

  const handleShare = (vertical) => {
    setSelectedVertical(vertical);
    setShowShareModal(true);
  };

  // New function to handle vertical click for projects
  const handleVerticalClick = (vertical) => {
    setSelectedVerticalForProjects(vertical);
    setShowProjects(true);
  };

  // Function to go back to verticals view
  const handleBackToVerticals = () => {
    setShowProjects(false);
    setSelectedVerticalForProjects(null);
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
        <div className="container py-2">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <button 
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={handleBackToVerticals}
                >
                  Verticals
                </button>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {selectedVerticalForProjects.name} Projects
              </li>
            </ol>
          </nav>
        </div>
        
        {/* Project Component with filtered data */}
        <Project selectedVertical={selectedVerticalForProjects} />
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
          <div key={vertical.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
            <div className="card h-100 border rounded shadow-sm folder-card position-relative">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div 
                    className="flex-grow-1 cursor-pointer"
                    onClick={() => handleVerticalClick(vertical)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-folder-fill text-warning fs-3"></i>
                    <h5 className="card-title mt-2 mb-1">{vertical.code}</h5>
                    <p className="text-muted mb-1">{vertical.name}</p>
                    <span className={`badge ${vertical.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{vertical.status}</span>
                  </div>
                  <div className="text-end">
                    <button className="btn btn-sm btn-light me-1" title="Share" onClick={(e) => {e.stopPropagation(); handleShare(vertical);}}>
                      <i className="bi bi-share-fill"></i>
                    </button>
                    <button className="btn btn-sm btn-light me-1" title="Edit" onClick={(e) => {e.stopPropagation(); handleEdit(vertical);}}>
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={(e) => {e.stopPropagation(); handleDelete(vertical);}}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="small text-muted mt-3">
                  <div><i className="bi bi-calendar me-1"></i>Created: <strong>{vertical.createdAt}</strong></div>
                  <div>
                    <i className="bi bi-clipboard-data me-1"></i>
                    <span 
                      className="text-primary" 
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleVerticalClick(vertical)}
                    >
                      {vertical.projects} Projects
                    </span>
                  </div>
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
                  <label className="form-label">Vertical Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter vertical code (e.g., FFTL)"
                  />
                </div>
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
    </div>
  );
};

export default CandidateManagementPortal;

// import React, { useState } from 'react';
// import Project from '../../../../Component/Layouts/App/College/ProjectManagement/Project';


// const CandidateManagementPortal = () => {
//   const [activeVerticalTab, setActiveVerticalTab] = useState('Active Verticals');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [showEditForm, setShowEditForm] = useState(false);
//   const [editingVertical, setEditingVertical] = useState(null);
//   const [viewMode, setViewMode] = useState('grid');
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [selectedVertical, setSelectedVertical] = useState(null);
//   const [newUser, setNewUser] = useState('');
//   const [newRole, setNewRole] = useState('Viewer');
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [verticalToDelete, setVerticalToDelete] = useState(null);

//   // Form states
//   const [formData, setFormData] = useState({
//     code: '',
//     name: '',
//     status: 'active'
//   });

//   const [verticals, setVerticals] = useState([
//     {
//       id: 1,
//       code: 'FFTL',
//       name: 'Focalyt Future Technology Labs',
//       status: 'active',
//       projects: 2,
//       createdAt: '2024-04-12',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     },
//     {
//       id: 2,
//       code: 'GSE',
//       name: 'Guest Service Associates',
//       status: 'active',
//       projects: 1,
//       createdAt: '2024-03-18',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     }
//   ]);

//   const filteredVerticals = verticals.filter(vertical => {
//     if (activeVerticalTab === 'Active Verticals' && vertical.status !== 'active') return false;
//     if (activeVerticalTab === 'Inactive Verticals' && vertical.status !== 'inactive') return false;
//     return vertical.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            vertical.code.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const resetForm = () => {
//     setFormData({
//       code: '',
//       name: '',
//       status: 'active'
//     });
//   };

//   const handleAdd = () => {
//     setEditingVertical(null);
//     resetForm();
//     setShowAddForm(true);
//   };

//   const handleEdit = (vertical) => {
//     setEditingVertical(vertical);
//     setFormData({
//       code: vertical.code,
//       name: vertical.name,
//       status: vertical.status
//     });
//     setShowEditForm(true);
//   };

//   const handleDelete = (vertical) => {
//     setVerticalToDelete(vertical);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = () => {
//     setVerticals(prev => prev.filter(v => v.id !== verticalToDelete.id));
//     setShowDeleteModal(false);
//     setVerticalToDelete(null);
//   };

//   const handleSubmit = () => {
//     if (!formData.code.trim() || !formData.name.trim()) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     if (editingVertical) {
//       // Edit existing vertical
//       setVerticals(prev => prev.map(v => 
//         v.id === editingVertical.id 
//           ? { ...v, ...formData }
//           : v
//       ));
//       setShowEditForm(false);
//     } else {
//       // Add new vertical
//       const newVertical = {
//         id: Date.now(),
//         ...formData,
//         projects: 0,
//         createdAt: new Date().toISOString().split('T')[0],
//         access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//       };
//       setVerticals(prev => [...prev, newVertical]);
//       setShowAddForm(false);
//     }
    
//     resetForm();
//     setEditingVertical(null);
//   };

//   const handleShare = (vertical) => {
//     setSelectedVertical(vertical);
//     setShowShareModal(true);
//   };

//   const closeModal = () => {
//     setShowAddForm(false);
//     setShowEditForm(false);
//     resetForm();
//     setEditingVertical(null);
//   };

//   const DeleteModal = () => {
//     if (!showDeleteModal || !verticalToDelete) return null;

//     return (
//       <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//         <div className="modal-dialog modal-dialog-centered">
//           <div className="modal-content">
//             <div className="modal-header bg-danger text-white">
//               <h5 className="modal-title">Confirm Delete</h5>
//               <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
//             </div>
//             <div className="modal-body">
//               <p>Are you sure you want to delete the vertical <strong>{verticalToDelete.name} ({verticalToDelete.code})</strong>?</p>
//               <p className="text-muted">This action cannot be undone and will remove all associated data.</p>
//             </div>
//             <div className="modal-footer">
//               <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
//                 Cancel
//               </button>
//               <button type="button" className="btn btn-danger" onClick={confirmDelete}>
//                 Delete Vertical
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
//         <h4>Verticals</h4>
//         <div>
//           <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
//             <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
//           </button>
//           <button className="btn btn-danger" onClick={handleAdd}>Add Vertical</button>
//         </div>
//       </div>

//       <div className="d-flex justify-content-between mb-3">
//         <ul className="nav nav-pills">
//           {['Active Verticals', 'Inactive Verticals', 'All Verticals'].map(tab => (
//             <li className="nav-item" key={tab}>
//               <button
//                 className={`nav-link ${activeVerticalTab === tab ? 'active' : ''}`}
//                 onClick={() => setActiveVerticalTab(tab)}
//               >
//                 {tab}
//               </button>
//             </li>
//           ))}
//         </ul>
//         <input
//           type="text"
//           className="form-control w-25"
//           placeholder="Search verticals..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//       </div>

//       <div className="row">
//         {filteredVerticals.map(vertical => (
//           <div key={vertical.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
//             <div className="card h-100 border rounded shadow-sm folder-card position-relative">
//               <div className="card-body">
//                 <div className="d-flex justify-content-between align-items-start mb-2">
//                   <div>
//                     <i className="bi bi-folder-fill text-warning fs-3"></i>
//                     <h5 className="card-title mt-2 mb-1">{vertical.code}</h5>
//                     <p className="text-muted mb-1">{vertical.name}</p>
//                     <span className={`badge ${vertical.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{vertical.status}</span>
//                   </div>
//                   <div className="text-end">
//                     <button className="btn btn-sm btn-light me-1" title="Share" onClick={() => handleShare(vertical)}>
//                       <i className="bi bi-share-fill"></i>
//                     </button>
//                     <button className="btn btn-sm btn-light me-1" title="Edit" onClick={() => handleEdit(vertical)}>
//                       <i className="bi bi-pencil-square"></i>
//                     </button>
//                     <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={() => handleDelete(vertical)}>
//                       <i className="bi bi-trash"></i>
//                     </button>
//                   </div>
//                 </div>
//                 <div className="small text-muted mt-3">
//                   <div><i className="bi bi-calendar me-1"></i>Created: <strong>{vertical.createdAt}</strong></div>
//                   <div><i className="bi bi-clipboard-data me-1"></i>{vertical.projects} Projects</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {filteredVerticals.length === 0 && (
//         <div className="text-center py-5">
//           <i className="bi bi-folder-x fs-1 text-muted"></i>
//           <h5 className="text-muted mt-3">No verticals found</h5>
//           <p className="text-muted">Try adjusting your search or filter criteria</p>
//         </div>
//       )}

//       {/* Add/Edit Modal */}
//       {(showAddForm || showEditForm) && (
//         <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered">
//             <div className="modal-content">
//               <div className="modal-header bg-danger text-white">
//                 <h5 className="modal-title">{editingVertical ? 'Edit Vertical' : 'Add New Vertical'}</h5>
//                 <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
//               </div>
//               <div className="modal-body">
//                 <div className="mb-3">
//                   <label className="form-label">Vertical Code *</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     value={formData.code}
//                     onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
//                     placeholder="Enter vertical code (e.g., FFTL)"
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label className="form-label">Vertical Name *</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     value={formData.name}
//                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter vertical name"
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label className="form-label">Status</label>
//                   <select
//                     className="form-select"
//                     value={formData.status}
//                     onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" className="btn btn-secondary" onClick={closeModal}>
//                   Cancel
//                 </button>
//                 <button type="button" className="btn btn-danger" onClick={handleSubmit}>
//                   {editingVertical ? 'Update Vertical' : 'Add Vertical'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       <DeleteModal />

//       {/* Share Modal */}
//       {showShareModal && selectedVertical && (
//         <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
//             <div className="modal-content" onClick={e => e.stopPropagation()}>
//               <div className="modal-header bg-danger text-white">
//                 <h5 className="modal-title">Manage Access - {selectedVertical.code}</h5>
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
//                       <option value="Content Manager">Content Manager</option>
//                       <option value="Manager">Manager</option>
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
//                   {selectedVertical.access.map((a, index) => (
//                     <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
//                       <div>
//                         <strong>{a.name}</strong>
//                       </div>
//                       <select className="form-select w-auto">
//                         <option value="Viewer" selected={a.role === 'Viewer'}>Viewer</option>
//                         <option value="Contributor" selected={a.role === 'Contributor'}>Contributor</option>
//                         <option value="Content Manager" selected={a.role === 'Content Manager'}>Content Manager</option>
//                         <option value="Manager" selected={a.role === 'Manager'}>Manager</option>
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

// export default CandidateManagementPortal;