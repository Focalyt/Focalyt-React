import React, { useState } from 'react';


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

  const allVerticals = [
    {
      id: 1,
      code: 'FFTL',
      name: 'Focalyt Future Technology Labs',
      status: 'active',
      projects: 2,
      createdAt: '2024-04-12',
      access: [
        { name: 'superadmin@focalyt.com', role: 'Manager' },
        { name: 'akhilesh@focalyt.com', role: 'Content Manager' }
      ]
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
  ];

  const filteredVerticals = allVerticals.filter(vertical => {
    if (activeVerticalTab === 'Active Verticals' && vertical.status !== 'active') return false;
    if (activeVerticalTab === 'Inactive Verticals' && vertical.status !== 'inactive') return false;
    return vertical.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           vertical.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleEdit = (vertical) => {
    setEditingVertical(vertical);
    setShowEditForm(true);
  };

  const handleShare = (vertical) => {
    setSelectedVertical(vertical);
    setShowShareModal(true);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Verticals</h4>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>
          <button className="btn btn-danger" onClick={() => setShowAddForm(true)}>Add Vertical</button>
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
                  <div>
                    <i className="bi bi-folder-fill text-warning fs-3"></i>
                    <h5 className="card-title mt-2 mb-1">{vertical.code}</h5>
                    <p className="text-muted mb-1">{vertical.name}</p>
                    <span className={`badge ${vertical.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{vertical.status}</span>
                  </div>
                  <div className="text-end">
                    <button className="btn btn-sm btn-light me-2" title="Share" onClick={() => handleShare(vertical)}>
                      <i className="bi bi-share-fill"></i>
                    </button>
                    <button className="btn btn-sm btn-light" title="Edit" onClick={() => handleEdit(vertical)}>
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </div>
                </div>
                <div className="small text-muted mt-3">
                  <div><i className="bi bi-calendar me-1"></i>Created: <strong>{vertical.createdAt}</strong></div>
                  <div><i className="bi bi-people me-1"></i>Access: <strong>{vertical.access.map(a => `${a.name} (${a.role})`).join(', ')}</strong></div>
                  <div><i className="bi bi-clipboard-data me-1"></i>{vertical.projects} Projects</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                <form>
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
                    <label className="form-check-label" htmlFor="notifyCheck">Notify people</label>
                  </div>
                  <button type="button" className="btn btn-primary">Send</button>
                </form>

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