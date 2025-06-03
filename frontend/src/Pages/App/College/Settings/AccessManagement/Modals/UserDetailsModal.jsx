import React from 'react';
import {
  User,
  Mail,
  Shield,
  Building,
  Target,
  Users,
  MapPin
} from 'lucide-react';

const UserDetailsModal = ({ 
  user, 
  allRoles, 
  onClose 
}) => {
  if (!user) return null;

  const getUserTypeIcon = (permissionType) => {
    switch (permissionType) {
      case 'hierarchical':
        return <Building className="text-info" size={20} />;
      case 'lead_based':
        return <Target className="text-success" size={20} />;
      case 'hybrid':
        return <Shield className="text-warning" size={20} />;
      default:
        return <User className="text-secondary" size={20} />;
    }
  };

  const getUserTypeName = (permissionType) => {
    switch (permissionType) {
      case 'hierarchical':
        return 'Content Management';
      case 'lead_based':
        return 'Lead Management';
      case 'hybrid':
        return 'Hybrid Access';
      default:
        return 'Unknown';
    }
  };

  const getUserTypeDescription = (permissionType) => {
    switch (permissionType) {
      case 'hierarchical':
        return 'Manages content through hierarchical structure (Vertical → Project → Center → Course → Batch)';
      case 'lead_based':
        return 'Manages leads through team-based assignments and reporting structure';
      case 'hybrid':
        return 'Combines both content management and lead management capabilities';
      default:
        return '';
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <User size={20} />
              User Details - {user.name}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {/* Basic Information */}
            <div className="row g-4">
              <div className="col-12">
                <h6 className="fw-bold border-bottom pb-2 mb-3">Basic Information</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <User size={16} className="text-muted" />
                      <strong>Name:</strong>
                    </div>
                    <div className="ps-4">{user.name}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Mail size={16} className="text-muted" />
                      <strong>Email:</strong>
                    </div>
                    <div className="ps-4">{user.email}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Shield size={16} className="text-muted" />
                      <strong>Role:</strong>
                    </div>
                    <div className="ps-4">
                      <span className="badge bg-primary">{allRoles[user.role]?.name || user.role}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <strong>Status:</strong>
                    </div>
                    <div className="ps-4">
                      <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permission Type */}
              <div className="col-12">
                <h6 className="fw-bold border-bottom pb-2 mb-3">Permission Type</h6>
                <div className="card border-0" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      {getUserTypeIcon(user.permission_type)}
                      <div>
                        <h6 className="mb-0">{getUserTypeName(user.permission_type)}</h6>
                        <small className="text-muted">{user.permission_type}</small>
                      </div>
                    </div>
                    <p className="text-muted small mb-0">
                      {getUserTypeDescription(user.permission_type)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Access Details */}
              <div className="col-12">
                <h6 className="fw-bold border-bottom pb-2 mb-3">Access Details</h6>
                
                {/* Hierarchical Access */}
                {(user.permission_type === 'hierarchical' || user.permission_type === 'hybrid') && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Building size={16} className="text-info" />
                      <strong className="text-info">Content Management Access</strong>
                    </div>
                    <div className="ps-4">
                      {user.entity_name ? (
                        <div className="small">
                          <div><strong>Entity:</strong> {user.entity_name}</div>
                          <div className="text-muted">Can manage content within this entity and its children</div>
                        </div>
                      ) : (
                        <div className="text-muted small">No specific entity assigned</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lead-based Access */}
                {(user.permission_type === 'lead_based' || user.permission_type === 'hybrid') && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Target size={16} className="text-success" />
                      <strong className="text-success">Lead Management Access</strong>
                    </div>
                    <div className="ps-4">
                      <div className="row g-2 small">
                        <div className="col-md-6">
                          <strong>Assigned Leads:</strong> {user.assigned_leads?.length || 0}
                        </div>
                        <div className="col-md-6">
                          <strong>Center Access:</strong> {user.centers_access?.length || 0} centers
                        </div>
                        {user.reporting_managers && user.reporting_managers.length > 0 && (
                          <div className="col-12">
                            <strong>Reporting Managers:</strong> {user.reporting_managers.length} manager(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reporting Structure */}
              {user.reporting_managers && user.reporting_managers.length > 0 && (
                <div className="col-12">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">Reporting Structure</h6>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Users size={16} className="text-primary" />
                    <strong>Reports To:</strong>
                  </div>
                  <div className="ps-4">
                    {user.reporting_managers.map((managerId, index) => (
                      <span key={managerId} className="badge bg-light text-dark me-2">
                        Manager {index + 1}
                      </span>
                    ))}
                    {user.reporting_managers.length > 1 && (
                      <div className="small text-warning mt-1">
                        <strong>Matrix Reporting:</strong> Reports to multiple managers
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Center Access */}
              {user.centers_access && user.centers_access.length > 0 && (
                <div className="col-12">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">Center Access</h6>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MapPin size={16} className="text-info" />
                    <strong>Accessible Centers:</strong>
                  </div>
                  <div className="ps-4">
                    <div className="d-flex flex-wrap gap-2">
                      {user.centers_access.map((centerId, index) => (
                        <span key={centerId} className="badge bg-info">
                          Center {index + 1}
                        </span>
                      ))}
                    </div>
                    <div className="small text-muted mt-2">
                      Can access leads and perform operations in these centers
                    </div>
                  </div>
                </div>
              )}

              {/* User ID for Admin Reference */}
              <div className="col-12">
                <div className="alert alert-light py-2">
                  <small className="text-muted">
                    <strong>User ID:</strong> {user.user_id} 
                    <span className="ms-3"><strong>Permission Type:</strong> {user.permission_type}</span>
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-outline-primary"
            >
              Edit User
            </button>
            <button 
              type="button" 
              className="btn btn-outline-info"
            >
              View Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;