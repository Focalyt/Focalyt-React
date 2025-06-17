import React from 'react';
import {
  User,
  Mail,
  Shield,
  Building,
  Target,
  Users,
  MapPin,
  Eye,
  Edit,
  CheckCircle,
  Layers
} from 'lucide-react';

const UserDetailsModal = ({ 
  user, 
  allRoles, 
  onClose 
}) => {
  if (!user) return null;

  const { accessSummary } = user;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Shield className="text-primary" size={20} />
              User Details & Permissions - {user.name}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="row g-4">
              
              {/* Basic Information */}
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">👤 Basic Information</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Name:</strong> {user.name}<br />
                        <strong>Email:</strong> {user.email}<br />
                        <strong>Mobile:</strong> {user.mobile}
                      </div>
                      <div className="col-md-6">
                        <strong>Designation:</strong> {user.designation}<br />
                        <strong>Status:</strong> <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>{user.status}</span><br />
                        <strong>Permission Type:</strong> <span className="badge bg-primary">{accessSummary?.permissionType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* College Information */}
              {user.college && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">🏢 College Information</h6>
                    </div>
                    <div className="card-body">
                      <strong>College:</strong> {user.college.name}<br />
                      <strong>Type:</strong> {user.college.type}<br />
                      <strong>Default Admin:</strong> {user.defaultAdmin ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Overview */}
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">📊 Permissions Overview</h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-md-2">
                        <div className="border rounded p-3">
                          <Eye className="text-info mb-2" size={24} />
                          <div className="fw-bold">{accessSummary?.viewPermissions?.type || 'Not set'}</div>
                          <small className="text-muted">View Access</small>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="border rounded p-3">
                          <Edit className="text-success mb-2" size={24} />
                          <div className="fw-bold">{accessSummary?.addPermissions?.count || 0}</div>
                          <small className="text-muted">Add Permissions</small>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="border rounded p-3">
                          <CheckCircle className="text-warning mb-2" size={24} />
                          <div className="fw-bold">{accessSummary?.editPermissions?.count || 0}</div>
                          <small className="text-muted">Edit Permissions</small>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="border rounded p-3">
                          <Shield className="text-danger mb-2" size={24} />
                          <div className="fw-bold">{accessSummary?.verifyPermissions?.count || 0}</div>
                          <small className="text-muted">Verify Permissions</small>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="border rounded p-3">
                          <Target className="text-primary mb-2" size={24} />
                          <div className="fw-bold">{accessSummary?.leadPermissions?.enabled || 0}</div>
                          <small className="text-muted">Lead Permissions</small>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="border rounded p-3">
                          <Users className="text-secondary mb-2" size={24} />
                          <div className="fw-bold">{accessSummary?.userManagement?.enabledCount || 0}</div>
                          <small className="text-muted">User Management</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Permissions */}
              {accessSummary?.viewPermissions && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <Eye className="me-2" size={16} />
                        View Permissions - {accessSummary.viewPermissions.type}
                      </h6>
                    </div>
                    <div className="card-body">
                      {accessSummary.viewPermissions.global ? (
                        <div className="alert alert-success">
                          🌍 <strong>Global Access:</strong> Can view all content across the entire system
                        </div>
                      ) : (
                        <div>
                          {/* Summary counts */}
                          <div className="row mb-3">
                            {Object.entries(accessSummary.viewPermissions.summary || {}).map(([key, count]) => (
                              count > 0 && (
                                <div key={key} className="col-md-2 mb-2">
                                  <div className="text-center border rounded p-2">
                                    <div className="fw-bold text-primary">{count}</div>
                                    <small className="text-muted text-capitalize">{key}</small>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                          
                          {/* Entity names */}
                          {Object.entries(accessSummary.viewPermissions.entities || {}).map(([type, entities]) => (
                            entities.length > 0 && (
                              <div key={type} className="mb-3">
                                <strong className="text-capitalize">{type}:</strong>
                                <div className="mt-1">
                                  {entities.map((entity, index) => (
                                    <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                      {entity.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add Permissions */}
              {accessSummary?.addPermissions?.count > 0 && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <Edit className="me-2" size={16} />
                        Add Permissions ({accessSummary.addPermissions.count})
                      </h6>
                    </div>
                    <div className="card-body">
                      {accessSummary.addPermissions.global ? (
                        <div className="alert alert-success">
                          🌍 <strong>Global Add Permission:</strong> Can add content anywhere
                        </div>
                      ) : (
                        <div className="row">
                          {accessSummary.addPermissions.permissions?.map((perm, index) => (
                            <div key={index} className="col-md-6 mb-3">
                              <div className="border rounded p-3">
                                <div className="fw-medium text-success">#{index + 1} - {perm.level} Level</div>
                                <div><strong>Entities:</strong> {perm.entities?.length || 0}</div>
                                <div><strong>Can Add:</strong> {perm.canAddTypes?.join(', ')}</div>
                                <small className="text-muted">{perm.summary}</small>
                                
                                {perm.entities?.length > 0 && (
                                  <div className="mt-2">
                                    {perm.entities.map((entity, i) => (
                                      <span key={i} className="badge bg-light text-dark me-1 small">
                                        {entity.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Permissions */}
              {accessSummary?.editPermissions?.count > 0 && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <CheckCircle className="me-2" size={16} />
                        Edit Permissions ({accessSummary.editPermissions.count})
                      </h6>
                    </div>
                    <div className="card-body">
                      {accessSummary.editPermissions.global ? (
                        <div className="alert alert-warning">
                          🌍 <strong>Global Edit Permission:</strong> Can edit content anywhere
                        </div>
                      ) : (
                        <div className="row">
                          {accessSummary.editPermissions.permissions?.map((perm, index) => (
                            <div key={index} className="col-md-6 mb-3">
                              <div className="border rounded p-3">
                                <div className="fw-medium text-warning">#{index + 1} - {perm.editType}</div>
                                {perm.levels?.length > 0 && (
                                  <div><strong>Levels:</strong> {perm.levels.join(', ')}</div>
                                )}
                                {perm.entities?.length > 0 && (
                                  <div>
                                    <strong>Entities:</strong>
                                    <div className="mt-1">
                                      {perm.entities.map((entity, i) => (
                                        <span key={i} className="badge bg-light text-dark me-1 small">
                                          {entity.name} ({entity.type})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <small className="text-muted">{perm.summary}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Verify Permissions */}
              {accessSummary?.verifyPermissions?.count > 0 && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <Shield className="me-2" size={16} />
                        Verify Permissions - {accessSummary.verifyPermissions.type}
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="alert alert-info">
                        <strong>Summary:</strong> {accessSummary.verifyPermissions.summary}
                      </div>
                      
                      {accessSummary.verifyPermissions.permissions?.map((perm, index) => (
                        <div key={index} className="border rounded p-3 mb-2">
                          {perm.parentEntities && (
                            <div>
                              <strong>Parent Entities:</strong>
                              <div className="mt-1">
                                {perm.parentEntities.map((entity, i) => (
                                  <span key={i} className="badge bg-light text-dark me-1">
                                    {entity.name} ({entity.type})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {perm.selectedLevels && (
                            <div><strong>Levels:</strong> {perm.selectedLevels.join(', ')}</div>
                          )}
                          <small className="text-muted">{perm.summary}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Permissions */}
              {accessSummary?.leadPermissions?.enabled > 0 && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <Target className="me-2" size={16} />
                        Lead Management ({accessSummary.leadPermissions.enabled} enabled)
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {Object.entries(accessSummary.leadPermissions.details || {}).map(([key, value]) => (
                          value && (
                            <div key={key} className="col-md-4 mb-2">
                              <CheckCircle className="text-success me-2" size={16} />
                              <span className="text-capitalize">{key.replace(/_/g, ' ')}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Management */}
              {accessSummary?.userManagement?.enabledCount > 0 && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <Users className="me-2" size={16} />
                        User Management ({accessSummary.userManagement.enabledCount} enabled)
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {accessSummary.userManagement.canViewUsers && (
                          <div className="col-md-4 mb-2">
                            <CheckCircle className="text-success me-2" size={16} />
                            Can View Users
                          </div>
                        )}
                        {accessSummary.userManagement.canAddUsers && (
                          <div className="col-md-4 mb-2">
                            <CheckCircle className="text-success me-2" size={16} />
                            Can Add Users
                          </div>
                        )}
                        {accessSummary.userManagement.canDeleteUsers && (
                          <div className="col-md-4 mb-2">
                            <CheckCircle className="text-success me-2" size={16} />
                            Can Delete Users
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reporting Managers */}
              {accessSummary?.reportingManagers > 0 && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <Users className="me-2" size={16} />
                        Reporting Structure
                      </h6>
                    </div>
                    <div className="card-body">
                      <strong>Reporting Managers:</strong> {accessSummary.reportingManagers} manager(s)
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;