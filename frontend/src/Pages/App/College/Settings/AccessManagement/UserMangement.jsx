import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const UserManagement = ({ 
  users, 
  allRoles, 
  permissionMode, 
  searchTerm, 
  setSearchTerm,
  onViewUserDetails 
}) => {
  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by permission mode
    if (permissionMode !== 'unified') {
      filtered = filtered.filter(user => {
        if (permissionMode === 'hierarchical') {
          return user.permission_type === 'hierarchical' || user.permission_type === 'hybrid';
        } else if (permissionMode === 'lead_based') {
          return user.permission_type === 'lead_based' || user.permission_type === 'hybrid';
        }
        return true;
      });
    }

    // Filter by search term
    return filtered.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getUserSummary = (user) => {
    const role = allRoles[user.role];
    let summary = {
      role_name: role?.name || user.role,
      permission_type: user.permission_type
    };

    if (user.permission_type === 'hierarchical') {
      summary.access_info = `${user.master_access}: ${user.entity_name}`;
      summary.badge_color = 'bg-info';
    } else if (user.permission_type === 'lead_based') {
      summary.access_info = `${user.assigned_leads?.length || 0} leads`;
      if (user.team_leads) {
        summary.access_info += ` (+${user.team_leads.length - (user.assigned_leads?.length || 0)} team)`;
      }
      summary.badge_color = 'bg-success';
    } else if (user.permission_type === 'hybrid') {
      summary.access_info = `${user.entity_name} + ${user.assigned_leads?.length || 0} leads`;
      summary.badge_color = 'bg-warning';
    }

    return summary;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="position-relative">
          <Search className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control ps-5"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>User</th>
                <th>Role & Type</th>
                <th>Access Summary</th>
                <th>Team/Entity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().map((user) => {
                const summary = getUserSummary(user);
                return (
                  <tr key={user.user_id}>
                    <td>
                      <div>
                        <div className="fw-medium text-dark">{user.name}</div>
                        <div className="text-muted small">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className={`badge ${summary.badge_color}`}>
                          {summary.role_name}
                        </span>
                        <div className="small text-muted mt-1">
                          {user.permission_type === 'hierarchical' && '📋 Content Management'}
                          {user.permission_type === 'lead_based' && '🎯 Lead Management'}
                          {user.permission_type === 'hybrid' && '⚡ Hybrid Access'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        <div className="fw-medium">{summary.access_info}</div>
                        {user.centers_access && (
                          <div className="text-muted">{user.centers_access.length} centers</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        {user.permission_type === 'hierarchical' && (
                          <div className="text-muted">{user.entity_name}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => onViewUserDetails(user)}
                          className="btn btn-sm btn-outline-info"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-success" title="Edit User">
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Delete User">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;