import React from 'react';
import {
  Shield,
  Building,
  Target,
  Layers,
  Eye,
  Edit
} from 'lucide-react';

const RoleManagement = ({ 
  allRoles, 
  onCreateRole 
}) => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Role Management</h3>
        <button
          onClick={onCreateRole}
          className="btn btn-info d-flex align-items-center gap-2"
        >
          <Shield size={16} />
          <span>Create New Role</span>
        </button>
      </div>

      {/* Roles by Type */}
      <div className="row g-4">
        {/* Hierarchical Roles */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-info bg-opacity-10">
              <h5 className="card-title mb-0 text-info">
                <Building size={16} className="me-2" />
                Content Management Roles
              </h5>
            </div>
            <div className="card-body">
              {Object.entries(allRoles)
                .filter(([key, role]) => role.type === 'hierarchical')
                .map(([roleKey, role]) => (
                  <div key={roleKey} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <div className="fw-medium">{role.name}</div>
                      <div className="small text-muted">{roleKey}</div>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-sm btn-outline-success">
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Lead-based Roles */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-success bg-opacity-10">
              <h5 className="card-title mb-0 text-success">
                <Target size={16} className="me-2" />
                Lead Management Roles
              </h5>
            </div>
            <div className="card-body">
              {Object.entries(allRoles)
                .filter(([key, role]) => role.type === 'lead_based')
                .map(([roleKey, role]) => (
                  <div key={roleKey} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <div className="fw-medium">{role.name}</div>
                      <div className="small text-muted">{roleKey}</div>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-sm btn-outline-success">
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Hybrid Roles */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-warning bg-opacity-10">
              <h5 className="card-title mb-0 text-warning">
                <Layers size={16} className="me-2" />
                Hybrid Roles
              </h5>
            </div>
            <div className="card-body">
              {Object.entries(allRoles)
                .filter(([key, role]) => role.type === 'hybrid')
                .map(([roleKey, role]) => (
                  <div key={roleKey} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <div className="fw-medium">{role.name}</div>
                      <div className="small text-muted">{roleKey}</div>
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-sm btn-outline-success">
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Role Statistics */}
      <div className="row g-3 mt-4">
        <div className="col-md-4">
          <div className="card bg-info bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-info">
                {Object.values(allRoles).filter(role => role.type === 'hierarchical').length}
              </div>
              <div className="small">Content Roles</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-success">
                {Object.values(allRoles).filter(role => role.type === 'lead_based').length}
              </div>
              <div className="small">Lead Roles</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-warning">
                {Object.values(allRoles).filter(role => role.type === 'hybrid').length}
              </div>
              <div className="small">Hybrid Roles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;