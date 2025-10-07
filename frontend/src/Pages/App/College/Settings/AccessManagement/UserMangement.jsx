import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Plus,
  Grid,
  List,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Settings,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User
} from 'lucide-react';

const UserManagement = ({
  users = [],
  handleAddUser,
  handleEditUser,
  allRoles = {},
  permissionMode = 'unified',
  searchTerm = '',
  setSearchTerm,
  onViewUserDetails,
  onStatusChange,
  onEditUser,
  onDeleteUser,
  onRestoreUser
}) => {
  const [activeTab, setActiveTab] = useState('active');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'matrix'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Sample users for demo if none provided
  const sampleUsers = users.length > 0 ? users : [
    
  ];

  const currentUsers = users.length > 0 ? users : sampleUsers;

  const handleStatusChange = (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (onStatusChange) {
      onStatusChange(userId, newStatus);
    }
  };

  const getFilteredUsers = () => {
    let filtered = currentUsers;

    // Filter by tab (active/inactive status)
    filtered = filtered.filter(user => {
      if (activeTab === 'active') {
        return user.status === 'active';
      } else {
        return user.status !== 'active';
      }
    });

    // Filter by search term
    return filtered.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getRoleInfo = (roleNumber) => {
    switch(roleNumber) {
      case 0: return { name: 'Admin', color: 'danger', icon: Crown };
      case 10: return { name: 'View Only', color: 'info', icon: Eye };
      case 99: return { name: 'Custom', color: 'warning', icon: Settings };
      default: return { name: 'User', color: 'secondary', icon: User };
    }
  };

  const getPermissionCount = (user) => {
    if (user.role === 0) return 'All Permissions';
    if (user.role === 10) return 'View Only';
    if (user.role === 99 && user.permissions) {
      const count = Object.values(user.permissions).filter(Boolean).length;
      return `${count} Custom`;
    }
    return 'No Permissions';
  };

  const showUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getActiveUsersCount = () => currentUsers.filter(user => user.status === 'active').length;
  const getInactiveUsersCount = () => currentUsers.filter(user => user.status !== 'active').length;

  // User Details Modal
  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;

    const roleInfo = getRoleInfo(user.role);
    const RoleIcon = roleInfo.icon;

    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">👤 User Details</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-8">
                  <div className="d-flex align-items-center mb-4">
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '60px', height: '60px' }}>
                      <span className="text-white fw-bold" style={{ fontSize: '24px' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="mb-1">{user.name}</h4>
                      <p className="text-muted mb-0">{user.designation}</p>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center">
                        <Mail size={16} className="text-muted me-2" />
                        <div>
                          <small className="text-muted d-block">Email</small>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center">
                        <Phone size={16} className="text-muted me-2" />
                        <div>
                          <small className="text-muted d-block">Mobile</small>
                          <span>{user.mobile}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center">
                        <Calendar size={16} className="text-muted me-2" />
                        <div>
                          <small className="text-muted d-block">Created</small>
                          <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center">
                        <User size={16} className="text-muted me-2" />
                        <div>
                          <small className="text-muted d-block">Added By</small>
                          <span>{user.userAddedby}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {user.description && (
                    <div className="mb-4">
                      <h6>Description</h6>
                      <p className="text-muted">{user.description}</p>
                    </div>
                  )}

                  {user.reporting_managers && user.reporting_managers.length > 0 && (
                    <div className="mb-4">
                      <h6>Reporting Managers</h6>
                      {user.reporting_managers.map(managerId => {
                        const manager = currentUsers.find(u => u.id === managerId);
                        return manager ? (
                          <span key={managerId} className="badge bg-info me-1">
                            {manager.name}
                          </span>
                        ) : (
                          <span key={managerId} className="badge bg-secondary me-1">
                            ID: {managerId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title mb-0">Access & Permissions</h6>
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <RoleIcon size={32} className={`text-${roleInfo.color} mb-2`} />
                        <div>
                          <span className={`badge bg-${roleInfo.color}`}>{roleInfo.name}</span>
                        </div>
                        <small className="text-muted d-block mt-1">
                          {getPermissionCount(user)}
                        </small>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Status</span>
                          <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {user.role === 99 && user.permissions && (
                        <div>
                          <h6 className="small text-muted mb-2">CUSTOM PERMISSIONS</h6>
                          <div className="small">
                            {Object.entries(user.permissions).map(([perm, value]) => (
                              value && (
                                <div key={perm} className="d-flex justify-content-between mb-1">
                                  <span className="text-truncate" style={{ fontSize: '0.75rem' }}>
                                    {perm.replace(/can_|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  <span className="text-success">✓</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => onEditUser && onEditUser(user)}>
                <Edit size={16} className="me-1" />
                Edit User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Matrix View Component
  const MatrixView = () => {
    const permissions = [
      { key: 'can_view_leads', label: 'View Leads' },
      { key: 'can_add_leads', label: 'Add Leads' },
      { key: 'can_edit_leads', label: 'Edit Leads' },
      { key: 'can_view_kyc', label: 'View KYC' },
      { key: 'can_verify_reject_kyc', label: 'Verify KYC' },
      { key: 'can_view_training', label: 'View Training' },
      { key: 'can_add_course', label: 'Add Course' },
      { key: 'can_view_users', label: 'View Users' },
      { key: 'can_add_users', label: 'Add Users' },
      { key: 'can_bulk_export', label: 'Bulk Export' }
    ];

    const hasPermission = (user, permission) => {
      if (user.role === 0) return true; // Admin has all
      if (user.role === 10) return ['can_view_leads', 'can_view_kyc', 'can_view_training', 'can_view_users', 'can_bulk_export'].includes(permission);
      if (user.role === 99 && user.permissions) return user.permissions[permission] || false;
      return false;
    };

    return (
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">🔐 User Permissions Matrix</h5>
          <small className="text-muted">Overview of all user permissions across the system</small>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ minWidth: '150px' }}>User</th>
                  <th style={{ minWidth: '80px' }}>Role</th>
                  {permissions.map(perm => (
                    <th key={perm.key} className="text-center" style={{ minWidth: '80px', fontSize: '0.75rem' }}>
                      {perm.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getFilteredUsers().map(user => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                               style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                            <span className="text-white fw-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="small fw-bold">{user.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${roleInfo.color} small`}>
                          {roleInfo.name}
                        </span>
                      </td>
                      {permissions.map(perm => (
                        <td key={perm.key} className="text-center">
                          {hasPermission(user, perm.key) ? (
                            <span className="text-success fw-bold">✓</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      ))}
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

  if (viewMode === 'matrix') {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <h4 className="mb-0">User Management</h4>
            <div className="btn-group" role="group">
              <button
                className={`btn btn-outline-primary ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} className="me-1" />
                List View
              </button>
              <button
                className={`btn btn-outline-primary ${viewMode === 'matrix' ? 'active' : ''}`}
                onClick={() => setViewMode('matrix')}
              >
                <Grid size={16} className="me-1" />
                Matrix View
              </button>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleAddUser && handleAddUser()}>
              <Plus size={16} />
              <span>Add User</span>
            </button>
          </div>
        </div>
        <MatrixView />
      </div>
    );
  }

  return (
    <div>
      {/* Desktop/Medium Screen Header */}
      <div className="d-none d-md-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <h4 className="mb-0">User Management</h4>
          <div className="btn-group" role="group">
            <button
              className={`btn btn-outline-primary ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} className="me-1" />
              List View
            </button>
            <button
              className={`btn btn-outline-primary ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              <Grid size={16} className="me-1" />
              Matrix View
            </button>
          </div>
        </div>
        <div className="position-relative">
          <Search className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control ps-5"
            style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
          />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleAddUser && handleAddUser()}>
            <Plus size={16} />
            <span>Add User</span>
          </button>
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

      {/* Mobile/Small Screen Header */}
      <div className="d-md-none mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">User Management</h4>
          <div className="d-flex gap-2">
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleAddUser && handleAddUser()}>
              <Plus size={16} />
              <span></span>
            </button>
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <Filter size={16} />
              <span></span>
            </button>
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <Download size={16} />
              <span></span>
            </button>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="btn-group" role="group">
            <button
              className={`btn btn-outline-primary ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} className="me-1" />
              List View
            </button>
            <button
              className={`btn btn-outline-primary ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              <Grid size={16} className="me-1" />
              Matrix View
            </button>
          </div>
        </div>

        <div className="position-relative">
          <Search className="serachUser position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control ps-5"
            style={{ paddingLeft: '2.5rem', minWidth: '50px' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <UserCheck size={16} className="me-1" />
                Active Users ({getActiveUsersCount()})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`}
                onClick={() => setActiveTab('inactive')}
              >
                <UserX size={16} className="me-1" />
                Inactive Users ({getInactiveUsersCount()})
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role & Access</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredUsers().map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '40px', height: '40px' }}>
                            <span className="text-white fw-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="fw-bold">{user.name}</div>
                            <div className="text-muted small">{user.designation}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="small">
                          <div className="d-flex align-items-center mb-1">
                            <Mail size={12} className="me-1 text-muted" />
                            <span>{user.email}</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <Phone size={12} className="me-1 text-muted" />
                            <span>{user.mobile}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="d-flex align-items-center">
                          <RoleIcon size={16} className={`text-${roleInfo.color} me-2`} />
                          <span className={`badge bg-${roleInfo.color}`}>
                            {roleInfo.name}
                          </span>
                        </div>
                      </td>
                      
                      <td>
                        <span className="small text-muted">
                          {getPermissionCount(user)}
                        </span>
                      </td>
                      
                      <td>
                        <button
                          className={`btn btn-sm ${user.status === 'active' ? 'btn-success' : 'btn-outline-secondary'}`}
                          onClick={() => handleStatusChange(user.id, user.status)}
                        >
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      
                      <td>
                        <span className="small text-muted">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => showUserDetails(user)}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleEditUser && handleEditUser(user)}
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {activeTab === 'active' ? onDeleteUser && onDeleteUser(user) : onRestoreUser && onRestoreUser(user)}}
                            title= {activeTab === 'active' ? "Delete User" : "Restore User"}
                          >
                            {activeTab === 'active' ? <Trash2 size={14} /> : <RotateCcw size={14} />}
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

      {getFilteredUsers().length === 0 && (
        <div className="text-center py-5">
          <Users size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No users found</h5>
          <p className="text-muted">Try adjusting your search criteria or add some users.</p>
        </div>
      )}

      {showUserModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }} 
        />
      )}

<style>
  {
    `
    @media (max-width: 768px) {
      .serachUser{
        width:25px!important;
        margin-top:0px!important;
      }
    }
    `
  }
</style>

    </div>
  );
};

export default UserManagement;