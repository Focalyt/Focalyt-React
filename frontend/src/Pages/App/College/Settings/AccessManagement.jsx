import React, { useState } from 'react';
import { Users, Shield, CheckSquare, Layers, UserPlus, Edit, Trash2, Copy, ChevronDown, Search, Filter, Save, X, Plus, Settings, FileText, UserCheck } from 'lucide-react';

// Bootstrap 5 version of the Access Management Dashboard
const AccessManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAddModal , setShowAddModal] = useState(false);
  
  // Sample data for demonstration
  const roles = [
    { id: 1, name: 'Lead Manager', description: 'Can add and manage leads', usersCount: 5, lastModified: '2025-05-02' },
    { id: 2, name: 'Document Verifier', description: 'Can verify documents only', usersCount: 8, lastModified: '2025-05-01' },
    { id: 3, name: 'Batch Manager', description: 'Can assign batches to leads', usersCount: 3, lastModified: '2025-04-28' },
    { id: 4, name: 'Center Manager', description: 'Can manage dropouts and rejections', usersCount: 4, lastModified: '2025-04-25' },
  ];
  
  const users = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul.s@example.com', role: 'Lead Manager', lastActive: '2025-05-07', hasCustomPerms: true },
    { id: 2, name: 'Priya Patel', email: 'priya.p@example.com', role: 'Document Verifier', lastActive: '2025-05-06', hasCustomPerms: false },
    { id: 3, name: 'Amit Kumar', email: 'amit.k@example.com', role: 'Batch Manager', lastActive: '2025-05-05', hasCustomPerms: false },
    { id: 4, name: 'Sneha Gupta', email: 'sneha.g@example.com', role: 'Center Manager', lastActive: '2025-05-04', hasCustomPerms: true },
  ];
  
  const permissionCategories = [
    {
      name: 'Lead Management',
      permissions: [
        { key: 'ADD_LEAD', description: 'Can add new leads to the system' },
        { key: 'EDIT_LEAD', description: 'Can edit existing lead information' },
        { key: 'DELETE_LEAD', description: 'Can remove leads from the system' },
        { key: 'VIEW_ALL_LEADS', description: 'Can view all leads in the system' },
      ]
    },
    {
      name: 'Document Verification',
      permissions: [
        { key: 'VIEW_DOCUMENTS', description: 'Can view uploaded documents' },
        { key: 'VERIFY_DOCUMENTS', description: 'Can mark documents as verified' },
        { key: 'REJECT_DOCUMENTS', description: 'Can reject documents and request new ones' },
      ]
    },
    {
      name: 'Batch Management',
      permissions: [
        { key: 'CREATE_BATCH', description: 'Can create new batches' },
        { key: 'ASSIGN_BATCH', description: 'Can assign leads to batches' },
        { key: 'MODIFY_BATCH', description: 'Can modify batch details and schedules' },
      ]
    },
    {
      name: 'Center Management',
      permissions: [
        { key: 'MARK_DROPOUT', description: 'Can mark students as dropouts' },
        { key: 'PROCESS_REFUND', description: 'Can process refunds for dropouts' },
        { key: 'VIEW_CENTER_ANALYTICS', description: 'Can view center performance analytics' },
      ]
    },
  ];
  
  return (
    <div className="bg-light min-vh-100">
      {/* Top navigation */}
      <nav className="navbar navbar-light bg-white shadow-sm">
        <div className="container">
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex align-items-center">
              <Shield className="text-primary" size={32} />
              <span className="ms-2 fs-4 fw-semibold text-dark">Access Manager</span>
            </div>
           
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="container py-4">
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link d-flex align-items-center ${activeTab === 'roles' ? 'active' : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              <Shield className="me-2" size={20} />
              Roles Management
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link d-flex align-items-center ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="me-2" size={20} />
              User Assignment
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link d-flex align-items-center ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              <Layers className="me-2" size={20} />
              Permission Analysis
            </button>
          </li>
        </ul>
        
        {/* Roles Management Tab */}
        {activeTab === 'roles' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-3 fw-semibold">Role Management</h1>
              <button
                className="btn btn-primary d-flex align-items-center"
                onClick={() => setShowRoleModal(true)}
              >
                <Plus className="me-2" size={16} />
                Create Role
              </button>
            </div>
            
            {/* Search and filter */}
            <div className="d-flex align-items-center mb-4">
              <div className="position-relative flex-grow-1">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                  <Search className="text-secondary" size={20} />
                </div>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search roles"
                />
              </div>
              <button className="btn btn-outline-secondary ms-3 d-flex align-items-center">
                <Filter className="me-2" size={16} />
                Filter
              </button>
            </div>
            
            {/* Roles table */}
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Role Name</th>
                      <th>Description</th>
                      <th>Users</th>
                      <th>Last Modified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-3 text-primary" style={{ width: "32px", height: "32px" }}>
                              <Shield size={16} />
                            </div>
                            <div className="ms-3">
                              <div className="fw-medium">{role.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary">{role.description}</td>
                        <td>{role.usersCount} users</td>
                        <td className="text-secondary">{role.lastModified}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-link text-primary p-0">
                              <Edit size={16} />
                            </button>
                            <button className="btn btn-sm btn-link text-success p-0">
                              <Copy size={16} />
                            </button>
                            <button className="btn btn-sm btn-link text-danger p-0">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Users Assignment Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-3 fw-semibold">User Role Assignment</h1>
              <button className="btn btn-primary d-flex align-items-center"  onClick={() => setShowAddModal(true)}>
                <UserPlus className="me-2" size={16} />
                Add User
              </button>
            </div>
            
            {/* Search and filter */}
            <div className="d-flex align-items-center mb-4">
              <div className="position-relative flex-grow-1">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                  <Search className="text-secondary" size={20} />
                </div>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search users"
                />
              </div>
              <button className="btn btn-outline-secondary ms-3 d-flex align-items-center">
                <Filter className="me-2" size={16} />
                Filter
              </button>
            </div>
            
            {/* Users table */}
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Last Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded-circle text-secondary fw-semibold" style={{ width: "32px", height: "32px" }}>
                              {user.name.charAt(0)}
                            </div>
                            <div className="ms-3">
                              <div className="fw-medium">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary">{user.email}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <select className="form-select form-select-sm">
                              <option>{user.role}</option>
                              <option>Lead Manager</option>
                              <option>Document Verifier</option>
                              <option>Batch Manager</option>
                              <option>Center Manager</option>
                            </select>
                            {user.hasCustomPerms && (
                              <span className="ms-2 badge bg-warning bg-opacity-10 text-warning">
                                Custom
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-secondary">{user.lastActive}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-link text-primary p-0">
                              <Edit size={16} />
                            </button>
                            <button className="btn btn-sm btn-link text-warning p-0">
                              <Shield size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Permission Analysis Tab */}
        {activeTab === 'analysis' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-3 fw-semibold">Permission Analysis</h1>
              <button className="btn btn-primary d-flex align-items-center">
                <FileText className="me-2" size={16} />
                Export Report
              </button>
            </div>
            
            {/* Matrix view */}
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Permission Matrix</h5>
                <p className="card-text text-secondary mb-0">
                  See which roles have which permissions at a glance
                </p>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Permission</th>
                      <th className="text-center">Lead Manager</th>
                      <th className="text-center">Document Verifier</th>
                      <th className="text-center">Batch Manager</th>
                      <th className="text-center">Center Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Lead Management permissions */}
                    <tr className="table-light">
                      <td colSpan="5" className="fw-medium">Lead Management</td>
                    </tr>
                    <tr>
                      <td className="text-secondary">Add Lead</td>
                      <td className="text-center">
                        <CheckSquare className="text-success" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                    </tr>
                    <tr>
                      <td className="text-secondary">Edit Lead</td>
                      <td className="text-center">
                        <CheckSquare className="text-success" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                    </tr>
                    
                    {/* Document Verification permissions */}
                    <tr className="table-light">
                      <td colSpan="5" className="fw-medium">Document Verification</td>
                    </tr>
                    <tr>
                      <td className="text-secondary">View Documents</td>
                      <td className="text-center">
                        <CheckSquare className="text-success" size={20} />
                      </td>
                      <td className="text-center">
                        <CheckSquare className="text-success" size={20} />
                      </td>
                      <td className="text-center">
                        <CheckSquare className="text-success" size={20} />
                      </td>
                      <td className="text-center">
                        <CheckSquare className="text-success" size={20} />
                      </td>
                    </tr>
                    <tr>
                      <td className="text-secondary">Verify Documents</td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                      <td className="text-center">
                        <CheckSquare className="text-success" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                      <td className="text-center">
                        <X className="text-secondary" size={20} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Role creation/edit modal */}
      {showRoleModal && (
        <div className="modal d-block rolemodel" style={{ backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Role</h5>
                <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="role-name" className="form-label">Role Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="role-name"
                    placeholder="e.g. Student Coordinator"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="role-description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="role-description"
                    rows="3"
                    placeholder="Describe the role's responsibilities"
                  ></textarea>
                </div>
                
                {/* Permissions section */}
                <div className="mb-3">
                  <h6 className="mb-3">Permissions</h6>
                  
                  {permissionCategories.map((category) => (
                    <div key={category.name} className="mb-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="fw-medium mb-0">{category.name}</h6>
                        <button className="btn btn-sm btn-link text-primary">
                          Select All
                        </button>
                      </div>
                      <div className="bg-light p-3 rounded mt-2">
                        {category.permissions.map((permission) => (
                          <div key={permission.key} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={permission.key}
                            />
                            <label className="form-check-label fw-medium" htmlFor={permission.key}>
                              {permission.description}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowRoleModal(false)}
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{showAddModal && (
        <div className="modal d-block rolemodel" style={{ backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New User</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="role-name" className="form-label">User Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="role-name"
                    placeholder="e.g. Student Coordinator"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="role-description" className="form-label">Designation</label>
                  <textarea
                    className="form-control"
                    id="role-description"
                    rows="3"
                    placeholder="Describe the role's responsibilities"
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="role-description" className="form-label">Email</label>
                  <input type='email'
                    className="form-control"
                    id="email"
                    placeholder="Email"
                  ></input>
                </div>
                <div className="mb-3">
                  <label htmlFor="role-description" className="form-label">Mobile Number</label>
                  <input type='number'
                    className="form-control"
                    id="mobileNumber"
                    placeholder="Mobile Number"
                  ></input>
                </div>
                <div className="mb-3">
                  <label htmlFor="role-description" className="form-label">Role</label>
                  <select type='text'
                    className="form-control"
                    id="roles"
                    placeholder="Role"
                  >
                    <option value="">Choose Role</option>
                  </select>
                </div>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(false)}
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {
          `
          .rolemodel{
          overflow-y: scroll!important;
          }
          `
        }
      </style>
    </div>
  );
};

export default AccessManagementDashboard;