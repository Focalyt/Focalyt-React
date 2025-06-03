import React, { useState, useEffect } from 'react';
import { Edit, User, Shield } from 'lucide-react';

const EditUserModal = ({ 
  user,
  users, 
  allRoles, 
  entities, 
  onClose, 
  onUpdateUser 
}) => {
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    status: 'active',
    permission_type: 'hierarchical',
    // Hierarchical fields
    entity_type: '',
    entity_id: '',
    multiple_entities: [],
    // Lead-based fields
    reporting_managers: [],
    centers_access: [],
    // Hybrid fields
    hierarchical_entity: '',
    lead_team: ''
  });

  const [originalUser, setOriginalUser] = useState(null);

  // Pre-populate form when user prop changes
  useEffect(() => {
    if (user) {
      setOriginalUser(user);
      setUserForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        status: user.status || 'active',
        permission_type: user.permission_type || 'hierarchical',
        entity_type: getEntityTypeFromUser(user),
        entity_id: user.entity_id || '',
        multiple_entities: user.multiple_entities || [],
        reporting_managers: user.reporting_managers || [],
        centers_access: user.centers_access || [],
        hierarchical_entity: user.hierarchical_entity || '',
        lead_team: user.lead_team || ''
      });
    }
  }, [user]);

  const getEntityTypeFromUser = (user) => {
    // Try to determine entity type from user's current assignment
    if (user.entity_id) {
      // Check which entity type contains this ID
      for (const [entityType, entityList] of Object.entries(entities)) {
        if (entityList.some(entity => entity.id === user.entity_id)) {
          return entityType;
        }
      }
    }
    return '';
  };

  const handleSubmit = () => {
    const updatedUser = {
      ...originalUser,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: userForm.status,
      permission_type: userForm.permission_type,
      reporting_managers: userForm.reporting_managers,
      centers_access: userForm.centers_access,
      entity_name: userForm.entity_type ? getEntityName(userForm.entity_type, userForm.entity_id) : originalUser.entity_name,
      entity_id: userForm.entity_id,
      hierarchical_entity: userForm.hierarchical_entity,
      lead_team: userForm.lead_team,
      // Keep original assigned leads unless specifically changed
      assigned_leads: originalUser.assigned_leads || []
    };
    
    onUpdateUser(updatedUser);
  };

  const getEntityName = (type, id) => {
    if (!type || !id) return '';
    const entityList = entities[type];
    const entity = entityList?.find(e => e.id === id);
    return entity?.name || '';
  };

  const hasChanges = () => {
    if (!originalUser) return false;
    
    return (
      userForm.name !== originalUser.name ||
      userForm.email !== originalUser.email ||
      userForm.role !== originalUser.role ||
      userForm.status !== originalUser.status ||
      userForm.permission_type !== originalUser.permission_type ||
      JSON.stringify(userForm.reporting_managers) !== JSON.stringify(originalUser.reporting_managers || []) ||
      JSON.stringify(userForm.centers_access) !== JSON.stringify(originalUser.centers_access || []) ||
      userForm.entity_id !== originalUser.entity_id
    );
  };

  if (!user) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Edit size={20} />
              Edit User - {originalUser?.name}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              {/* User ID Display */}
              <div className="col-12">
                <div className="alert alert-light py-2 d-flex align-items-center gap-2">
                  <User size={16} className="text-muted" />
                  <small className="text-muted">
                    <strong>User ID:</strong> {originalUser?.user_id}
                  </small>
                </div>
              </div>

              {/* Basic Info */}
              <div className="col-12">
                <h6 className="fw-medium mb-3">Basic Information</h6>
              </div>
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="form-control"
                  placeholder="Enter user's full name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="form-control"
                  placeholder="user@company.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Permission Type Selection */}
              <div className="col-12">
                <h6 className="fw-medium mb-3 mt-4">Permission Type</h6>
                <div className="row g-2">
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        type="radio"
                        name="permission_type"
                        value="hierarchical"
                        checked={userForm.permission_type === 'hierarchical'}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permission_type: e.target.value,
                          role: '' // Reset role when changing permission type
                        })}
                        className="form-check-input"
                        id="edit_perm_hierarchical"
                      />
                      <label className="form-check-label" htmlFor="edit_perm_hierarchical">
                        <div className="fw-medium text-info">📋 Content Management</div>
                        <div className="small text-muted">Hierarchical content permissions</div>
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        type="radio"
                        name="permission_type"
                        value="lead_based"
                        checked={userForm.permission_type === 'lead_based'}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permission_type: e.target.value,
                          role: ''
                        })}
                        className="form-check-input"
                        id="edit_perm_lead_based"
                      />
                      <label className="form-check-label" htmlFor="edit_perm_lead_based">
                        <div className="fw-medium text-success">🎯 Lead Management</div>
                        <div className="small text-muted">Team & lead-based access</div>
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        type="radio"
                        name="permission_type"
                        value="hybrid"
                        checked={userForm.permission_type === 'hybrid'}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permission_type: e.target.value,
                          role: ''
                        })}
                        className="form-check-input"
                        id="edit_perm_hybrid"
                      />
                      <label className="form-check-label" htmlFor="edit_perm_hybrid">
                        <div className="fw-medium text-warning">⚡ Hybrid Access</div>
                        <div className="small text-muted">Both content & lead management</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="col-12">
                <label className="form-label">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Role</option>
                  {Object.entries(allRoles)
                    .filter(([key, role]) =>
                      userForm.permission_type === 'hybrid' ? role.type === 'hybrid' :
                        role.type === userForm.permission_type
                    )
                    .map(([roleKey, role]) => (
                      <option key={roleKey} value={roleKey}>{role.name}</option>
                    ))}
                </select>
              </div>

              {/* Hierarchical Fields */}
              {userForm.permission_type === 'hierarchical' && (
                <>
                  <div className="col-12">
                    <h6 className="fw-medium mb-3 mt-3">📋 Content Management Assignment</h6>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Entity Type</label>
                    <select
                      value={userForm.entity_type}
                      onChange={(e) => setUserForm({ ...userForm, entity_type: e.target.value, entity_id: '' })}
                      className="form-select"
                    >
                      <option value="">Select Entity Type</option>
                      <option value="VERTICAL">Vertical</option>
                      <option value="PROJECT">Project</option>
                      <option value="CENTER">Center</option>
                      <option value="COURSE">Course</option>
                      <option value="BATCH">Batch</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Entity</label>
                    <select
                      value={userForm.entity_id}
                      onChange={(e) => setUserForm({ ...userForm, entity_id: e.target.value })}
                      className="form-select"
                      disabled={!userForm.entity_type}
                    >
                      <option value="">Select Entity</option>
                      {userForm.entity_type && entities[userForm.entity_type]?.map(entity => (
                        <option key={entity.id} value={entity.id}>{entity.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Lead-based Fields */}
              {userForm.permission_type === 'lead_based' && (
                <>
                  <div className="col-12">
                    <h6 className="fw-medium mb-3 mt-3">🎯 Lead Management Assignment</h6>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Reporting Managers</label>
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <div className="small text-muted mb-2">Select one or multiple reporting managers:</div>
                      {users
                        .filter(u => 
                          ['TL_COUNSELLOR', 'TL_SALES', 'SALES_MANAGER', 'CENTER_SALES_HEAD'].includes(u.role) &&
                          u.user_id !== originalUser?.user_id // Don't show self
                        )
                        .map(manager => (
                          <div key={manager.user_id} className="form-check mb-2">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={userForm.reporting_managers.includes(manager.user_id)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...userForm.reporting_managers, manager.user_id]
                                  : userForm.reporting_managers.filter(id => id !== manager.user_id);
                                setUserForm({ ...userForm, reporting_managers: updated });
                              }}
                              id={`edit_manager_${manager.user_id}`}
                            />
                            <label className="form-check-label" htmlFor={`edit_manager_${manager.user_id}`}>
                              <div className="fw-medium">{manager.name}</div>
                              <div className="small text-muted">{allRoles[manager.role]?.name}</div>
                            </label>
                          </div>
                        ))}
                    </div>
                    {userForm.reporting_managers.length > 0 && (
                      <div className="form-text text-success mt-2">
                        ✅ Selected {userForm.reporting_managers.length} reporting manager(s)
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Center Access</label>
                    <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      <div className="small text-muted mb-2">Select centers this user can access:</div>
                      <div className="row">
                        {entities.CENTER.map(center => (
                          <div key={center.id} className="col-6">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={userForm.centers_access.includes(center.id)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...userForm.centers_access, center.id]
                                    : userForm.centers_access.filter(id => id !== center.id);
                                  setUserForm({ ...userForm, centers_access: updated });
                                }}
                                id={`edit_center_${center.id}`}
                              />
                              <label className="form-check-label small" htmlFor={`edit_center_${center.id}`}>
                                {center.name}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Hybrid Fields */}
              {userForm.permission_type === 'hybrid' && (
                <>
                  <div className="col-12">
                    <h6 className="fw-medium mb-3 mt-3">📋 Content Management Assignment</h6>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Entity Type</label>
                    <select
                      value={userForm.entity_type}
                      onChange={(e) => setUserForm({ ...userForm, entity_type: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select Entity Type</option>
                      <option value="CENTER">Center</option>
                      <option value="PROJECT">Project</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Entity</label>
                    <select
                      value={userForm.hierarchical_entity}
                      onChange={(e) => setUserForm({ ...userForm, hierarchical_entity: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select Entity</option>
                      {userForm.entity_type && entities[userForm.entity_type]?.map(entity => (
                        <option key={entity.id} value={entity.id}>{entity.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <h6 className="fw-medium mb-3 mt-3">🎯 Lead Management Assignment</h6>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Lead Team</label>
                    <select
                      value={userForm.lead_team}
                      onChange={(e) => setUserForm({ ...userForm, lead_team: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select Lead Team</option>
                      <option value="team_1">Sales Team A</option>
                      <option value="team_2">Counselling Team B</option>
                    </select>
                  </div>
                </>
              )}

              {/* Current Assignments Info */}
              <div className="col-12">
                <div className="alert alert-info">
                  <h6 className="alert-heading d-flex align-items-center gap-2">
                    <Shield size={16} />
                    Current Assignments
                  </h6>
                  <div className="small">
                    <div><strong>Assigned Leads:</strong> {originalUser?.assigned_leads?.length || 0}</div>
                    {originalUser?.entity_name && (
                      <div><strong>Current Entity:</strong> {originalUser.entity_name}</div>
                    )}
                    <div className="text-muted mt-1">Note: Lead assignments will be preserved unless specifically reassigned</div>
                  </div>
                </div>
              </div>

              {/* Changes Summary */}
              {hasChanges() && (
                <div className="col-12">
                  <div className="alert alert-warning">
                    <h6 className="alert-heading">⚠️ Pending Changes</h6>
                    <div className="small">
                      You have unsaved changes. Review your modifications before updating.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                // Reset to original values
                setUserForm({
                  name: originalUser.name || '',
                  email: originalUser.email || '',
                  role: originalUser.role || '',
                  status: originalUser.status || 'active',
                  permission_type: originalUser.permission_type || 'hierarchical',
                  entity_type: getEntityTypeFromUser(originalUser),
                  entity_id: originalUser.entity_id || '',
                  reporting_managers: originalUser.reporting_managers || [],
                  centers_access: originalUser.centers_access || [],
                  hierarchical_entity: originalUser.hierarchical_entity || '',
                  lead_team: originalUser.lead_team || ''
                });
              }}
              className="btn btn-outline-warning"
              disabled={!hasChanges()}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!userForm.name || !userForm.email || !userForm.role || !hasChanges()}
              className="btn btn-success"
            >
              Update User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;