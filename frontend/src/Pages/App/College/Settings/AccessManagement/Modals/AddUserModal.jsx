import React, { useState } from 'react';
import axios from 'axios'

const AddUserModal = ({ onClose, onAddUser, users = [], entities = {} }) => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const user = JSON.parse(sessionStorage.getItem('user'));
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    mobile: '',
    role_designation: '',
    description: '',
    reporting_managers: [],
    access_level: '', // New field for access level selection
    centers_access: [],
    permissions: {
      // Lead Management (B2B)
      can_view_leads_b2b: false,
      can_add_leads_b2b: false,
      can_edit_leads_b2b: false,
      can_assign_leads_b2b: false,
      can_delete_leads_b2b: false,

      // Lead Management
      can_view_leads: false,
      can_add_leads: false,
      can_edit_leads: false,
      can_assign_leads: false,
      can_delete_leads: false,

      // KYC Verification
      can_view_kyc: false,
      can_verify_reject_kyc: false,
      can_request_kyc: false,

      // Training Management
      can_view_training: false,
      can_add_vertical: false,
      can_add_project: false,
      can_add_center: false,
      can_add_course: false,
      can_add_batch: false,
      can_assign_batch: false,

      // User Management
      can_view_users: false,
      can_add_users: false,
      can_edit_users: false,
      can_delete_users: false,
      can_manage_roles: false,

      // Bulk Actions
      can_bulk_import: false,
      can_bulk_export: false,
      can_bulk_update: false,
      can_bulk_delete: false,
      can_bulk_communication: false
    }
  });

  // Predefined access levels
  const accessLevels = {
    admin: {
      label: '👑 Admin Access (Full Control)',
      description: 'Complete access to all features and permissions',
      permissions: {
        can_view_leads_b2b: true,
        can_add_leads_b2b: true,
        can_edit_leads_b2b: true,
        can_assign_leads_b2b: true,
        can_delete_leads_b2b: true,

        can_view_leads: true,
        can_add_leads: true,
        can_edit_leads: true,
        can_assign_leads: true,
        can_delete_leads: true,
        can_view_kyc: true,
        can_verify_reject_kyc: true,
        can_request_kyc: true,
        can_view_training: true,
        can_add_vertical: true,
        can_add_project: true,
        can_add_center: true,
        can_add_course: true,
        can_add_batch: true,
        can_assign_batch: true,
        can_view_users: true,
        can_add_users: true,
        can_edit_users: true,
        can_delete_users: true,
        can_manage_roles: true,
        can_bulk_import: true,
        can_bulk_export: true,
        can_bulk_update: true,
        can_bulk_delete: true,
        can_bulk_communication: true
      }
    },
    view_only: {
      label: '👀 View Only Access',
      description: 'Read-only access to view information without modification rights',
      permissions: {

        can_view_leads_b2b: true,
        can_view_leads: true,
        can_add_leads: false,
        can_edit_leads: false,
        can_assign_leads: false,
        can_delete_leads: false,
        can_view_kyc: true,
        can_verify_reject_kyc: false,
        can_request_kyc: false,
        can_view_training: true,
        can_add_vertical: false,
        can_add_project: false,
        can_add_center: false,
        can_add_course: false,
        can_add_batch: false,
        can_assign_batch: false,
        can_view_users: true,
        can_add_users: false,
        can_edit_users: false,
        can_delete_users: false,
        can_manage_roles: false,
        can_bulk_import: false,
        can_bulk_export: true,
        can_bulk_update: false,
        can_bulk_delete: false,
        can_bulk_communication: false
      }
    },
    custom: {
      label: '⚙️ Custom Access',
      description: 'Manually configure specific permissions as needed',
      permissions: {} // Will be set manually
    }
  };

  const handleAccessLevelChange = (level) => {
    setUserForm(prev => ({
      ...prev,
      access_level: level,
      permissions: level === 'custom' ? prev.permissions : accessLevels[level].permissions
    }));
  };

  const handleReportingManagerChange = (userId, isChecked) => {
    const updatedManagers = isChecked
      ? [...userForm.reporting_managers, userId]
      : userForm.reporting_managers.filter(id => id !== userId);

    setUserForm(prevForm => ({
      ...prevForm,
      reporting_managers: updatedManagers
    }));
  };

  const handlePermissionChange = (permission, value) => {
    let updatedPermissions = {
      ...userForm.permissions,
      [permission]: value
    };


    // KYC Dependencies
    if (permission === 'can_verify_reject_kyc' && value === true) {
      updatedPermissions.can_view_kyc = true;
    }
    if (permission === 'can_request_kyc' && value === true) {
      updatedPermissions.can_view_kyc = true;
    }
    if (permission === 'can_view_kyc' && value === false) {
      updatedPermissions.can_verify_reject_kyc = false;
      updatedPermissions.can_request_kyc = false;
    }

    // Lead Management Dependencies
    if (['can_add_leads', 'can_edit_leads', 'can_assign_leads', 'can_delete_leads'].includes(permission) && value === true) {
      updatedPermissions.can_view_leads = true;
    }
    if (permission === 'can_view_leads' && value === false) {
      updatedPermissions.can_add_leads = false;
      updatedPermissions.can_edit_leads = false;
      updatedPermissions.can_assign_leads = false;
      updatedPermissions.can_delete_leads = false;
    }

    // Training Management Dependencies
    if (['can_add_vertical', 'can_add_project', 'can_add_center', 'can_add_course', 'can_add_batch', 'can_assign_batch'].includes(permission) && value === true) {
      updatedPermissions.can_view_training = true;
    }
    if (permission === 'can_view_training' && value === false) {
      updatedPermissions.can_add_vertical = false;
      updatedPermissions.can_add_project = false;
      updatedPermissions.can_add_center = false;
      updatedPermissions.can_add_course = false;
      updatedPermissions.can_add_batch = false;
      updatedPermissions.can_assign_batch = false;
    }

    // User Management Dependencies
    if (['can_add_users', 'can_edit_users', 'can_delete_users', 'can_manage_roles'].includes(permission) && value === true) {
      updatedPermissions.can_view_users = true;
    }
    if (permission === 'can_view_users' && value === false) {
      updatedPermissions.can_add_users = false;
      updatedPermissions.can_edit_users = false;
      updatedPermissions.can_delete_users = false;
      updatedPermissions.can_manage_roles = false;
    }

    setUserForm({
      ...userForm,
      permissions: updatedPermissions
    });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!userForm.name || !userForm.email || !userForm.mobile || !userForm.role_designation) {
      alert('Please fill all required fields (Name, Email, Mobile, Role/Designation)');
      return;
    }

    if (!userForm.access_level) {
      alert('Please select an access level');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Mobile validation
    if (userForm.mobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      console.log(userForm, 'userForm')
      console.log(token, 'token')
      const reponse = await axios.post(`${backendUrl}/college/users/add`, userForm, {
        headers: {
          'x-auth': token
        }
      })
      console.log(reponse, 'reponse')
      if (reponse.status) {
        alert('User added successfully')
        onAddUser()
      }
      else {
        alert('Error adding user: ' + reponse.data.error)
      }

    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user: ' + error.response.data.message);
    }
  };

  return (
    <div className="fixed-top d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', height: '100vh', zIndex: 1050 }}>
      <div className="bg-white rounded shadow-lg" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
          <h4 className="mb-0">👤 Add New User</h4>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        {/* Body */}
        <div className="p-4">

          {/* Basic Information */}
          <div className="mb-4">
            <h5 className="text-primary mb-3">📝 Basic Information</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@company.com"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Mobile *</label>
                <input
                  type="text"
                  className="form-control"
                  value={userForm.mobile}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[0-9]{0,10}$/.test(value)) {
                      setUserForm({ ...userForm, mobile: value });
                    }
                  }}
                  placeholder="1234567890"
                  maxLength="10"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Role/Designation *</label>
                <input
                  type="text"
                  className="form-control"
                  value={userForm.role_designation}
                  onChange={(e) => setUserForm({ ...userForm, role_designation: e.target.value })}
                  placeholder="e.g. Sales Manager, Team Lead, Admin"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={userForm.description}
                  onChange={(e) => setUserForm({ ...userForm, description: e.target.value })}
                  placeholder="Brief description about the user"
                />
              </div>
            </div>
          </div>

          {/* Reporting Managers Section */}
          <div className="mb-4">
            <h5 className="text-info mb-3">👨‍💼 Reporting Managers</h5>

            {users.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-4">
                  <div className="text-muted">
                    <div className="mb-2" style={{ fontSize: '2rem' }}>👥</div>
                    <h6>No existing users found</h6>
                    <p className="small mb-0">Add some users first to assign reporting managers for new users</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Select Reporting Managers ({users.filter(u => u.status === true || u.status === 'true' || u.status === "active").length} available)</span>
                  <div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => {
                        setUserForm(prev => ({
                          ...prev,
                          reporting_managers: users.filter(user =>
                            user.status === true || user.status === 'true' || user.status === "active"
                          ).map(u => u.user_id)
                        }));
                      }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setUserForm(prev => ({ ...prev, reporting_managers: [] }));
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="card-body" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {users.filter(u => (u.status === true || u.status === 'true' || u.status === "active")).map(user => {
                    const isSelected = userForm.reporting_managers.includes(user.user_id);

                    return (
                      <div key={user.user_id} className="form-check mb-3 p-2 border-bottom">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleReportingManagerChange(user.user_id, e.target.checked)}
                          id={`manager_${user.user_id}`}
                        />
                        <label className="form-check-label w-100" htmlFor={`manager_${user.user_id}`}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-bold text-dark">{user.name}</div>
                              <div className="small text-primary">{user.designation || user.role_designation || 'No designation'}</div>
                              {user.email && <div className="small text-muted">📧 {user.email}</div>}
                              {user.mobile && <div className="small text-muted">📱 {user.mobile}</div>}
                            </div>
                            <div className="text-end">
                              <span className="badge bg-success">Active</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>

                {userForm.reporting_managers.length > 0 && (
                  <div className="card-footer bg-light">
                    <div className="small">
                      <strong>✅ Selected Managers: {userForm.reporting_managers.length}</strong>
                      <div className="mt-1">
                        {userForm.reporting_managers.map(managerId => {
                          const manager = users.find(u => u.user_id === managerId);
                          return manager ? (
                            <span key={managerId} className="badge bg-primary me-1 mb-1">
                              {manager.name}
                            </span>
                          ) : (
                            <span key={managerId} className="badge bg-warning me-1 mb-1">
                              Unknown (ID: {managerId})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Access Level Selection */}
          <div className="mb-4">
            <h5 className="text-warning mb-3">🔒 Access Level Selection *</h5>
            <div className="alert alert-info py-2 mb-3">
              <small>💡 <strong>Important:</strong> Select the appropriate access level. You can choose predefined levels or customize permissions manually.</small>
            </div>

            <div className="row g-3">
              {Object.entries(accessLevels).map(([key, level]) => (
                <div key={key} className="col-12">
                  <div className={`card border ${userForm.access_level === key ? 'border-primary bg-primary bg-opacity-10' : ''}`}>
                    <div className="card-body">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="access_level"
                          id={`access_${key}`}
                          checked={userForm.access_level === key}
                          onChange={() => handleAccessLevelChange(key)}
                        />
                        <label className="form-check-label w-100" htmlFor={`access_${key}`}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{level.label}</h6>
                              <p className="text-muted mb-0 small">{level.description}</p>
                              {key !== 'custom' && (
                                <div className="mt-2">
                                  <small className="text-success">
                                    ✅ {Object.values(level.permissions).filter(Boolean).length} permissions enabled
                                  </small>
                                </div>
                              )}
                            </div>
                            {userForm.access_level === key && (
                              <span className="badge bg-primary">Selected</span>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Permissions - Only show if Custom Access is selected */}
          {userForm.access_level === 'custom' && (
            <div className="mb-4">
              <h5 className="text-danger mb-3">⚙️ Custom Permissions Configuration</h5>
              <div className="alert alert-warning py-2 mb-3">
                <small>⚠️ <strong>Custom Mode:</strong> Configure individual permissions as needed. Dependencies will be automatically handled.</small>
              </div>

              {/* Lead Management (B2B) */}
              <div className="card mb-3">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">🎯 Lead Management (B2B)</h6>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {Object.entries({
                      can_view_leads_b2b: '👀 View Leads',
                      can_add_leads_b2b: '➕ Add New Leads',
                      can_edit_leads_b2b: '✏️ Edit Leads',
                      can_assign_leads_b2b: '🔄 Assign Leads',
                      can_delete_leads_b2b: '🗑️ Delete Leads'
                    }).map(([permission, label]) => (
                      <div key={permission} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={userForm.permissions[permission]}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            id={`perm_${permission}`}
                          />
                          <label className="form-check-label" htmlFor={`perm_${permission}`}>
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* Lead Management */}
              <div className="card mb-3">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">🎯 Lead Management</h6>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {Object.entries({
                      can_view_leads: '👀 View Leads',
                      can_add_leads: '➕ Add New Leads',
                      can_edit_leads: '✏️ Edit Leads',
                      can_assign_leads: '🔄 Assign Leads',
                      can_delete_leads: '🗑️ Delete Leads'
                    }).map(([permission, label]) => (
                      <div key={permission} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={userForm.permissions[permission]}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            id={`perm_${permission}`}
                          />
                          <label className="form-check-label" htmlFor={`perm_${permission}`}>
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* KYC Verification */}
              <div className="card mb-3">
                <div className="card-header bg-success text-white">
                  <h6 className="mb-0">📋 KYC Verification</h6>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {Object.entries({
                      can_view_kyc: '👀 View KYC Documents',
                      can_verify_reject_kyc: '✅ Verify/Reject KYC',
                      can_request_kyc: '📄 Request KYC Documents'
                    }).map(([permission, label]) => (
                      <div key={permission} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={userForm.permissions[permission]}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            id={`perm_${permission}`}
                          />
                          <label className="form-check-label" htmlFor={`perm_${permission}`}>
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Training Management */}
              <div className="card mb-3">
                <div className="card-header bg-info text-white">
                  <h6 className="mb-0">🎓 Training Management</h6>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {Object.entries({
                      can_view_training: '👀 View Training System',
                      can_add_vertical: '🏢 Add Vertical',
                      can_add_project: '📋 Add Project',
                      can_add_center: '🏫 Add Center',
                      can_add_course: '📚 Add Course',
                      can_add_batch: '👥 Add Batch',
                      can_assign_batch: '🎯 Assign Batch'
                    }).map(([permission, label]) => (
                      <div key={permission} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={userForm.permissions[permission]}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            id={`perm_${permission}`}
                          />
                          <label className="form-check-label" htmlFor={`perm_${permission}`}>
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Management */}
              <div className="card mb-3">
                <div className="card-header bg-warning text-dark">
                  <h6 className="mb-0">👥 User Management</h6>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {Object.entries({
                      can_view_users: '👀 View Users',
                      can_add_users: '➕ Add New Users',
                      can_edit_users: '✏️ Edit Users',
                      can_delete_users: '🗑️ Delete Users',
                      can_manage_roles: '🎭 Manage User Roles'
                    }).map(([permission, label]) => (
                      <div key={permission} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={userForm.permissions[permission]}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            id={`perm_${permission}`}
                          />
                          <label className="form-check-label" htmlFor={`perm_${permission}`}>
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="card mb-3">
                <div className="card-header bg-danger text-white">
                  <h6 className="mb-0">📦 Bulk Actions</h6>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {Object.entries({
                      can_bulk_import: '📥 Bulk Import Data',
                      can_bulk_export: '📤 Bulk Export Data',
                      can_bulk_update: '🔄 Bulk Update Records',
                      can_bulk_delete: '🗑️ Bulk Delete Records',
                      can_bulk_communication: '📱 Bulk Communication'
                    }).map(([permission, label]) => (
                      <div key={permission} className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={userForm.permissions[permission]}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            id={`perm_${permission}`}
                          />
                          <label className="form-check-label" htmlFor={`perm_${permission}`}>
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="alert alert-info">
            <h6 className="alert-heading">📋 Summary</h6>
            <div className="small">
              <strong>Name:</strong> {userForm.name || 'Not set'}<br />
              <strong>Role/Designation:</strong> {userForm.role_designation || 'Not set'}<br />
              <strong>Access Level:</strong> {userForm.access_level ? accessLevels[userForm.access_level].label : 'Not selected'}<br />
              <strong>Total Permissions:</strong> {Object.values(userForm.permissions).filter(Boolean).length}<br />
              <strong>Reporting Managers:</strong> {userForm.reporting_managers.length} selected
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-end gap-2 p-4 border-top">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={!userForm.name || !userForm.email || !userForm.mobile || !userForm.role_designation || !userForm.access_level}
          >
            ✅ Add User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;