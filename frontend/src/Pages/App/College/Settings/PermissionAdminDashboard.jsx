import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Eye, 
  Plus, 
  Search, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Download,
  Edit,
  Trash2
} from 'lucide-react';

const PermissionAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([
    {
      user_id: 'user_1',
      name: 'Rajesh Kumar',
      email: 'rajesh@company.com',
      role: 'CENTER_HEAD',
      status: 'active',
      master_access: 'CENTER',
      entity_id: 'center_1',
      entity_name: 'Delhi Center'
    },
    {
      user_id: 'user_2', 
      name: 'Priya Singh',
      email: 'priya@company.com',
      role: 'PROJECT_MANAGER',
      status: 'active',
      master_access: 'PROJECT',
      entity_id: 'project_1',
      entity_name: 'AI Development Project'
    }
  ]);

  const [roles] = useState([
    'SUPER_ADMIN',
    'VERTICAL_ADMIN', 
    'PROJECT_MANAGER',
    'CENTER_HEAD',
    'COURSE_COORDINATOR',
    'BATCH_COORDINATOR',
    'AUDIT_USER',
    'REGIONAL_MANAGER'
  ]);

  const [entities] = useState({
    VERTICAL: [
      {id: 'vertical_1', name: 'Technology Vertical'},
      {id: 'vertical_2', name: 'Business Vertical'}
    ],
    PROJECT: [
      {id: 'project_1', name: 'AI Development Project', parent_id: 'vertical_1'},
      {id: 'project_2', name: 'Web Development Project', parent_id: 'vertical_1'},
      {id: 'project_3', name: 'Mobile App Project', parent_id: 'vertical_2'},
      {id: 'project_4', name: 'Data Science Project', parent_id: 'vertical_2'}
    ],
    CENTER: [
      {id: 'center_1', name: 'Delhi Center', parent_id: 'project_1'},
      {id: 'center_2', name: 'Mumbai Center', parent_id: 'project_1'},
      {id: 'center_3', name: 'Bangalore Center', parent_id: 'project_2'},
      {id: 'center_4', name: 'Pune Center', parent_id: 'project_2'},
      {id: 'center_5', name: 'Chennai Center', parent_id: 'project_3'},
      {id: 'center_6', name: 'Hyderabad Center', parent_id: 'project_4'}
    ],
    COURSE: [
      {id: 'course_1', name: 'Python Fundamentals', parent_id: 'center_1'},
      {id: 'course_2', name: 'React Development', parent_id: 'center_1'},
      {id: 'course_3', name: 'Machine Learning', parent_id: 'center_2'},
      {id: 'course_4', name: 'Data Structures', parent_id: 'center_3'},
      {id: 'course_5', name: 'Mobile Development', parent_id: 'center_5'},
      {id: 'course_6', name: 'Data Science Basics', parent_id: 'center_6'}
    ],
    BATCH: [
      {id: 'batch_1', name: 'Python Batch A', parent_id: 'course_1'},
      {id: 'batch_2', name: 'Python Batch B', parent_id: 'course_1'},
      {id: 'batch_3', name: 'React Batch A', parent_id: 'course_2'},
      {id: 'batch_4', name: 'ML Batch A', parent_id: 'course_3'}
    ]
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addMode, setAddMode] = useState('user');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    entity_type: '',
    entity_id: '',
    multiple_entities: []
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    view_access_type: 'SPECIFIC',
    master_level: '',
    specific_entities: [],
    add_permissions: {
      global: false,
      specific_permissions: []
    },
    edit_permissions: {
      global: false,
      specific_permissions: []
    },
    verify_permissions: {
      global: false,
      vertical_types: [],
      specific_entities: []
    }
  });

  // Permission analysis
  const [analysisUser, setAnalysisUser] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisView, setAnalysisView] = useState('single');

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analysis', label: 'Permission Analysis', icon: Eye },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const roleDescriptions = {
    'SUPER_ADMIN': 'Complete system access with all permissions',
    'VERTICAL_ADMIN': 'Full control over a specific vertical and all its content',
    'PROJECT_MANAGER': 'Manage specific project and all its centers/courses/batches',
    'CENTER_HEAD': 'Control specific center with courses and batches',
    'COURSE_COORDINATOR': 'Manage specific courses and their batches',
    'BATCH_COORDINATOR': 'Manage only specific batches',
    'AUDIT_USER': 'Read-only access for compliance and reporting',
    'REGIONAL_MANAGER': 'Manage multiple centers across regions'
  };

  // Helper function to get child entities based on parent selection
  const getChildEntities = (childLevel, parentLevel, selectedParentIds) => {
    if (childLevel === parentLevel) {
      return entities[childLevel]?.filter(entity => 
        selectedParentIds.includes(entity.id)
      ) || [];
    }

    const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
    const parentIndex = hierarchy.indexOf(parentLevel);
    const childIndex = hierarchy.indexOf(childLevel);

    if (childIndex <= parentIndex) {
      return [];
    }

    let currentLevelIds = selectedParentIds;
    let currentLevel = parentLevel;

    for (let i = parentIndex + 1; i <= childIndex; i++) {
      const nextLevel = hierarchy[i];
      const nextLevelEntities = entities[nextLevel] || [];
      
      const filteredEntities = nextLevelEntities.filter(entity => 
        currentLevelIds.includes(entity.parent_id)
      );
      
      if (i === childIndex) {
        return filteredEntities;
      } else {
        currentLevelIds = filteredEntities.map(entity => entity.id);
      }
    }

    return [];
  };

  // Helper function to get allowed entity levels based on view access
  const getAllowedAddLevels = () => {
    if (roleForm.view_access_type === 'GLOBAL') {
      return ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE'];
    }
    
    if (roleForm.master_level) {
      const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE'];
      const masterIndex = hierarchy.indexOf(roleForm.master_level);
      return hierarchy.slice(masterIndex);
    }
    
    return [];
  };

  // Helper function to get what can be added at a specific level
  const getChildEntityTypes = (level) => {
    const childMap = {
      'VERTICAL': ['PROJECT', 'CENTER', 'COURSE', 'BATCH'],
      'PROJECT': ['CENTER', 'COURSE', 'BATCH'],
      'CENTER': ['COURSE', 'BATCH'],
      'COURSE': ['BATCH'],
      'BATCH': []
    };
    return childMap[level] || [];
  };

  // Helper function to add new edit permission
  const addNewEditPermission = () => {
    const newPermission = {
      id: Date.now(),
      edit_type: '',
      permission_level: '',
      selected_entities: []
    };
    
    setRoleForm({
      ...roleForm,
      edit_permissions: {
        ...roleForm.edit_permissions,
        specific_permissions: [...roleForm.edit_permissions.specific_permissions, newPermission]
      }
    });
  };

  // Helper function to update edit permission
  const updateEditPermission = (permissionId, field, value) => {
    const updated = roleForm.edit_permissions.specific_permissions.map(permission => 
      permission.id === permissionId 
        ? { ...permission, [field]: value }
        : permission
    );
    
    setRoleForm({
      ...roleForm,
      edit_permissions: {
        ...roleForm.edit_permissions,
        specific_permissions: updated
      }
    });
  };

  // Helper function to remove edit permission
  const removeEditPermission = (permissionId) => {
    const updated = roleForm.edit_permissions.specific_permissions.filter(
      permission => permission.id !== permissionId
    );
    
    setRoleForm({
      ...roleForm,
      edit_permissions: {
        ...roleForm.edit_permissions,
        specific_permissions: updated
      }
    });
  };

  // Helper function to add new add permission
  const addNewAddPermission = () => {
    const newPermission = {
      id: Date.now(),
      permission_level: '',
      selected_entities: [],
      can_add_types: []
    };
    
    setRoleForm({
      ...roleForm,
      add_permissions: {
        ...roleForm.add_permissions,
        specific_permissions: [...roleForm.add_permissions.specific_permissions, newPermission]
      }
    });
  };

  // Helper function to update add permission
  const updateAddPermission = (permissionId, field, value) => {
    const updated = roleForm.add_permissions.specific_permissions.map(permission => 
      permission.id === permissionId 
        ? { ...permission, [field]: value }
        : permission
    );
    
    setRoleForm({
      ...roleForm,
      add_permissions: {
        ...roleForm.add_permissions,
        specific_permissions: updated
      }
    });
  };

  // Helper function to remove add permission
  const removeAddPermission = (permissionId) => {
    const updated = roleForm.add_permissions.specific_permissions.filter(
      permission => permission.id !== permissionId
    );
    
    setRoleForm({
      ...roleForm,
      add_permissions: {
        ...roleForm.add_permissions,
        specific_permissions: updated
      }
    });
  };

  const generatePermissionMatrix = () => {
    return users.map(user => {
      const analysis = analyzeUserPermissions(user.user_id);
      return {
        user_id: user.user_id,
        name: user.name,
        role: user.role,
        master_access: user.master_access,
        entity_name: user.entity_name,
        can_view_global: user.role === 'SUPER_ADMIN',
        can_add_project: ['SUPER_ADMIN', 'VERTICAL_ADMIN'].includes(user.role),
        can_add_center: ['SUPER_ADMIN', 'VERTICAL_ADMIN', 'PROJECT_MANAGER'].includes(user.role),
        can_add_course: !['BATCH_COORDINATOR', 'AUDIT_USER'].includes(user.role),
        can_add_batch: !['AUDIT_USER'].includes(user.role),
        can_edit_vertical: ['SUPER_ADMIN', 'VERTICAL_ADMIN'].includes(user.role),
        can_edit_project: ['SUPER_ADMIN', 'VERTICAL_ADMIN', 'PROJECT_MANAGER'].includes(user.role),
        can_edit_center: !['BATCH_COORDINATOR', 'AUDIT_USER'].includes(user.role),
        can_verify_content: !['BATCH_COORDINATOR', 'AUDIT_USER'].includes(user.role),
        risk_level: analysis?.summary.risk_level || 'LOW'
      };
    });
  };

  const handleAddRole = () => {
    const newRole = {
      name: roleForm.name.toUpperCase().replace(' ', '_'),
      description: roleForm.description,
      view_access: {
        type: roleForm.view_access_type,
        master_level: roleForm.master_level,
        specific_entities: roleForm.specific_entities
      },
      add_permissions: roleForm.add_permissions,
      edit_permissions: roleForm.edit_permissions,
      verify_permissions: roleForm.verify_permissions
    };
    
    console.log('New Role Created:', newRole);
    setRoleForm({
      name: '',
      description: '',
      view_access_type: 'SPECIFIC',
      master_level: '',
      specific_entities: [],
      add_permissions: { global: false, specific_permissions: [] },
      edit_permissions: { global: false, specific_permissions: [] },
      verify_permissions: { global: false, vertical_types: [], specific_entities: [] }
    });
    setShowAddUser(false);
  };

  const handleAddUser = () => {
    const newUser = {
      user_id: `user_${Date.now()}`,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: 'active',
      master_access: getMasterAccessLevel(userForm.role),
      entity_id: userForm.entity_id,
      entity_name: getEntityName(userForm.entity_type, userForm.entity_id)
    };
    
    setUsers([...users, newUser]);
    setUserForm({name: '', email: '', role: '', entity_type: '', entity_id: '', multiple_entities: []});
    setShowAddUser(false);
  };

  const getMasterAccessLevel = (role) => {
    const levelMap = {
      'SUPER_ADMIN': 'GLOBAL',
      'VERTICAL_ADMIN': 'VERTICAL',
      'PROJECT_MANAGER': 'PROJECT', 
      'CENTER_HEAD': 'CENTER',
      'COURSE_COORDINATOR': 'COURSE',
      'BATCH_COORDINATOR': 'BATCH',
      'AUDIT_USER': 'READ_ONLY',
      'REGIONAL_MANAGER': 'MULTI_CENTER'
    };
    return levelMap[role] || 'UNKNOWN';
  };

  const getEntityName = (type, id) => {
    if (!type || !id) return '';
    const entityList = entities[type];
    const entity = entityList?.find(e => e.id === id);
    return entity?.name || '';
  };

  const analyzeUserPermissions = (user_id) => {
    const user = users.find(u => u.user_id === user_id);
    if (!user) return null;

    const permissions = {
      view_access: getViewAccess(user),
      add_permissions: getAddPermissions(user),
      edit_permissions: getEditPermissions(user),
      verify_permissions: getVerifyPermissions(user)
    };

    return {
      user: user,
      permissions: permissions,
      summary: generatePermissionSummary(user, permissions)
    };
  };

  const getViewAccess = (user) => {
    if (user.role === 'SUPER_ADMIN') {
      return { type: 'GLOBAL', description: 'Can view all content across system' };
    }
    
    return {
      type: 'SPECIFIC',
      master_level: user.master_access,
      entity: user.entity_name,
      description: `Can view ${user.entity_name} and all its children + read-only parent hierarchy`
    };
  };

  const getAddPermissions = (user) => {
    const rolePermissions = {
      'SUPER_ADMIN': 'Can add content anywhere in the system',
      'VERTICAL_ADMIN': 'Can add Projects, Centers, Courses, Batches in vertical',
      'PROJECT_MANAGER': 'Can add Centers, Courses, Batches in project',
      'CENTER_HEAD': 'Can add Courses and Batches in center',
      'COURSE_COORDINATOR': 'Can add Batches in assigned courses',
      'BATCH_COORDINATOR': 'Cannot add any new content',
      'AUDIT_USER': 'Cannot add any content',
      'REGIONAL_MANAGER': 'Can add Courses and Batches in assigned centers'
    };
    
    return rolePermissions[user.role] || 'No add permissions';
  };

  const getEditPermissions = (user) => {
    const rolePermissions = {
      'SUPER_ADMIN': 'Can edit any content in the system',
      'VERTICAL_ADMIN': 'Can edit all content in vertical',
      'PROJECT_MANAGER': 'Can edit project and all its content',
      'CENTER_HEAD': 'Can edit center and all its courses/batches',
      'COURSE_COORDINATOR': 'Can edit assigned courses and their batches',
      'BATCH_COORDINATOR': 'Can edit only assigned batches',
      'AUDIT_USER': 'Cannot edit any content',
      'REGIONAL_MANAGER': 'Can edit assigned centers and their content'
    };
    
    return rolePermissions[user.role] || 'No edit permissions';
  };

  const getVerifyPermissions = (user) => {
    const rolePermissions = {
      'SUPER_ADMIN': 'Can verify any pending content',
      'VERTICAL_ADMIN': 'Can verify content in vertical',
      'PROJECT_MANAGER': 'Can verify content in project',
      'CENTER_HEAD': 'Can verify batches in center',
      'COURSE_COORDINATOR': 'Can verify batches in courses',
      'BATCH_COORDINATOR': 'Cannot verify content',
      'AUDIT_USER': 'Cannot verify content',
      'REGIONAL_MANAGER': 'Can verify content in assigned centers'
    };
    
    return rolePermissions[user.role] || 'No verify permissions';
  };

  const generatePermissionSummary = (user, permissions) => {
    const level = user.master_access;
    const canAdd = !['BATCH_COORDINATOR', 'AUDIT_USER'].includes(user.role);
    const canEdit = user.role !== 'AUDIT_USER';
    const canVerify = !['BATCH_COORDINATOR', 'AUDIT_USER'].includes(user.role);

    return {
      access_level: level,
      can_add: canAdd,
      can_edit: canEdit,
      can_verify: canVerify,
      entity_control: user.entity_name,
      risk_level: user.role === 'SUPER_ADMIN' ? 'HIGH' : level === 'VERTICAL' ? 'MEDIUM' : 'LOW'
    };
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
        rel="stylesheet"
      />
      <div className="min-vh-100 bg-light">
        {/* Header */}
        <div className="bg-white shadow-sm border-bottom">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center py-4">
              <div>
                <h1 className="h2 fw-bold text-dark mb-1">Permission Management</h1>
                <p className="text-muted mb-0">Manage users, roles, and analyze permissions</p>
              </div>
              <div className="d-flex gap-3">
                <button 
                  onClick={() => {
                    setAddMode('role');
                    setShowAddUser(true);
                  }}
                  className="btn btn-success d-flex align-items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Add User</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid py-4">
          {/* Tabs */}
          <div className="border-bottom mb-4">
            <ul className="nav nav-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li className="nav-item" key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`nav-link d-flex align-items-center gap-2 ${
                        activeTab === tab.id ? 'active' : ''
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="position-relative">
                  <Search className="position-absolute text-muted" size={16} style={{left: '12px', top: '50%', transform: 'translateY(-50%)'}} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control ps-5"
                    style={{width: '250px'}}
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
                        <th>Role</th>
                        <th>Master Access</th>
                        <th>Entity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.user_id}>
                          <td>
                            <div>
                              <div className="fw-medium text-dark">{user.name}</div>
                              <div className="text-muted small">{user.email}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              user.master_access === 'GLOBAL' ? 'bg-danger' :
                              user.master_access === 'VERTICAL' ? 'bg-info' :
                              user.master_access === 'PROJECT' ? 'bg-success' :
                              'bg-warning'
                            }`}>
                              {user.master_access}
                            </span>
                          </td>
                          <td className="text-dark">
                            {user.entity_name || 'N/A'}
                          </td>
                          <td>
                            <span className={`badge ${
                              user.status === 'active' ? 'bg-success' : 'bg-danger'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setAnalysisUser(user.user_id);
                                  const result = analyzeUserPermissions(user.user_id);
                                  setAnalysisResult(result);
                                }}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <Eye size={16} />
                              </button>
                              <button className="btn btn-sm btn-outline-success">
                                <Edit size={16} />
                              </button>
                              <button className="btn btn-sm btn-outline-danger">
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

          {/* Permission Analysis Tab */}
          {activeTab === 'analysis' && (
            <div>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="h5 mb-0">Permission Analysis</h3>
                    <div className="btn-group" role="group">
                      <button
                        onClick={() => setAnalysisView('single')}
                        className={`btn ${analysisView === 'single' ? 'btn-primary' : 'btn-outline-primary'}`}
                      >
                        Single User
                      </button>
                      <button
                        onClick={() => setAnalysisView('matrix')}
                        className={`btn ${analysisView === 'matrix' ? 'btn-primary' : 'btn-outline-primary'}`}
                      >
                        Permission Matrix
                      </button>
                    </div>
                  </div>

                  {analysisView === 'single' && (
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="mb-4">
                          <label className="form-label fw-medium">Select User</label>
                          <select
                            value={analysisUser}
                            onChange={(e) => {
                              setAnalysisUser(e.target.value);
                              if (e.target.value) {
                                const result = analyzeUserPermissions(e.target.value);
                                setAnalysisResult(result);
                              }
                            }}
                            className="form-select"
                          >
                            <option value="">Choose a user...</option>
                            {users.map(user => (
                              <option key={user.user_id} value={user.user_id}>
                                {user.name} ({user.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        {analysisResult && (
                          <div>
                            <div className="bg-light rounded p-4 mb-4">
                              <h6 className="fw-medium mb-3">Permission Summary</h6>
                              <div className="row g-2 small">
                                <div className="col-6">
                                  <span>Access Level:</span>
                                </div>
                                <div className="col-6">
                                  <span className="fw-medium">{analysisResult.summary.access_level}</span>
                                </div>
                                <div className="col-6">
                                  <span>Entity Control:</span>
                                </div>
                                <div className="col-6">
                                  <span className="fw-medium">{analysisResult.summary.entity_control}</span>
                                </div>
                                <div className="col-6">
                                  <span>Risk Level:</span>
                                </div>
                                <div className="col-6">
                                  <span className={`fw-medium ${
                                    analysisResult.summary.risk_level === 'HIGH' ? 'text-danger' :
                                    analysisResult.summary.risk_level === 'MEDIUM' ? 'text-warning' :
                                    'text-success'
                                  }`}>
                                    {analysisResult.summary.risk_level}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="row g-2">
                              <div className="col-6">
                                <div className={`p-3 rounded ${analysisResult.summary.can_add ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'}`}>
                                  <div className="d-flex align-items-center gap-2">
                                    {analysisResult.summary.can_add ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                    <span className="small fw-medium">Add Content</span>
                                  </div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className={`p-3 rounded ${analysisResult.summary.can_edit ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'}`}>
                                  <div className="d-flex align-items-center gap-2">
                                    {analysisResult.summary.can_edit ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                    <span className="small fw-medium">Edit Content</span>
                                  </div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className={`p-3 rounded ${analysisResult.summary.can_verify ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'}`}>
                                  <div className="d-flex align-items-center gap-2">
                                    {analysisResult.summary.can_verify ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                    <span className="small fw-medium">Verify Content</span>
                                  </div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="p-3 rounded bg-info bg-opacity-25">
                                  <div className="d-flex align-items-center gap-2">
                                    <Eye className="text-info" size={16} />
                                    <span className="small fw-medium">View Access</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {analysisResult && (
                        <div className="col-lg-6">
                          <h6 className="fw-medium mb-3">Detailed Permissions</h6>
                          
                          <div className="d-grid gap-3">
                            <div className="bg-primary bg-opacity-25 rounded p-3">
                              <h6 className="fw-medium text-primary mb-2">View Access</h6>
                              <p className="small text-primary mb-0">{analysisResult.permissions.view_access.description}</p>
                            </div>

                            <div className="bg-success bg-opacity-25 rounded p-3">
                              <h6 className="fw-medium text-success mb-2">Add Permissions</h6>
                              <p className="small text-success mb-0">{analysisResult.permissions.add_permissions}</p>
                            </div>

                            <div className="bg-warning bg-opacity-25 rounded p-3">
                              <h6 className="fw-medium text-warning mb-2">Edit Permissions</h6>
                              <p className="small text-warning mb-0">{analysisResult.permissions.edit_permissions}</p>
                            </div>

                            <div className="bg-secondary bg-opacity-25 rounded p-3">
                              <h6 className="fw-medium text-secondary mb-2">Verify Permissions</h6>
                              <p className="small text-secondary mb-0">{analysisResult.permissions.verify_permissions}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {analysisView === 'matrix' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="fw-medium mb-0">Overall Permission Matrix</h6>
                        <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                          <Download size={16} />
                          <span>Export Matrix</span>
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th className="border-end">User</th>
                              <th className="text-center border-end">Role</th>
                              <th className="text-center border-end">Master Level</th>
                              <th className="text-center border-end text-primary">Global View</th>
                              <th className="text-center border-end text-success">Add Project</th>
                              <th className="text-center border-end text-success">Add Center</th>
                              <th className="text-center border-end text-success">Add Course</th>
                              <th className="text-center border-end text-success">Add Batch</th>
                              <th className="text-center border-end text-warning">Edit Vertical</th>
                              <th className="text-center border-end text-warning">Edit Project</th>
                              <th className="text-center border-end text-warning">Edit Center</th>
                              <th className="text-center border-end text-info">Verify</th>
                              <th className="text-center text-danger">Risk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatePermissionMatrix().map((user, index) => (
                              <tr key={user.user_id} className={index % 2 === 0 ? '' : 'table-light'}>
                                <td className="border-end">
                                  <div>
                                    <div className="small fw-medium">{user.name}</div>
                                    <div className="text-muted" style={{fontSize: '0.75rem'}}>{user.entity_name}</div>
                                  </div>
                                </td>
                                <td className="text-center border-end">
                                  <span className="badge bg-primary small">
                                    {user.role.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="text-center border-end">
                                  <span className={`badge small ${
                                    user.master_access === 'GLOBAL' ? 'bg-danger' :
                                    user.master_access === 'VERTICAL' ? 'bg-info' :
                                    user.master_access === 'PROJECT' ? 'bg-success' :
                                    'bg-warning'
                                  }`}>
                                    {user.master_access}
                                  </span>
                                </td>
                                <td className="text-center border-end">
                                  {user.can_view_global ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_project ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_center ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_course ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_batch ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_edit_vertical ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_edit_project ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_edit_center ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_verify_content ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                </td>
                                <td className="text-center">
                                  <span className={`badge small ${
                                    user.risk_level === 'HIGH' ? 'bg-danger' :
                                    user.risk_level === 'MEDIUM' ? 'bg-warning' :
                                    'bg-success'
                                  }`}>
                                    {user.risk_level}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-light rounded p-4 mt-4">
                        <h6 className="fw-medium mb-3">Legend</h6>
                        <div className="row g-3 small">
                          <div className="col-md-3">
                            <div className="d-flex align-items-center gap-2">
                              <CheckCircle className="text-success" size={16} />
                              <span>Permission Granted</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="d-flex align-items-center gap-2">
                              <XCircle className="text-danger" size={16} />
                              <span>Permission Denied</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="bg-danger rounded-circle" style={{width: '16px', height: '16px'}}></span>
                              <span>High Risk</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="bg-success rounded-circle" style={{width: '16px', height: '16px'}}></span>
                              <span>Low Risk</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showAddUser && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content" style={{maxHeight: '85vh', display: 'flex', flexDirection: 'column'}}>
                {/* Modal Header */}
                <div className="modal-header">
                  <div className="d-flex align-items-center gap-3">
                    <h5 className="modal-title mb-0">Add New User</h5>
                  </div>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="btn-close"
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body" style={{flex: 1, overflowY: 'auto'}}>
                  {addMode === 'user' ? (
                    /* User Form */
                    <div className="container-sm">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Name</label>
                          <input
                            type="text"
                            value={userForm.name}
                            onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                            className="form-control"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="form-control"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Role</label>
                          <select
                            value={userForm.role}
                            onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                            className="form-select"
                          >
                            <option value="">Select Role</option>
                            {roles.map(role => (
                              <option key={role} value={role}>{role.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>

                        {userForm.role && userForm.role !== 'SUPER_ADMIN' && (
                          <div className="col-md-6">
                            <label className="form-label">Entity Type</label>
                            <select
                              value={userForm.entity_type}
                              onChange={(e) => setUserForm({...userForm, entity_type: e.target.value, entity_id: ''})}
                              className="form-select"
                            >
                              <option value="">Select Entity Type</option>
                              {Object.keys(entities).map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {userForm.entity_type && (
                          <div className="col-12">
                            <label className="form-label">
                              {userForm.role === 'REGIONAL_MANAGER' ? 'Select Multiple Entities' : 'Select Entity'}
                            </label>
                            {userForm.role === 'REGIONAL_MANAGER' ? (
                              <div className="border rounded p-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                                <div className="row">
                                  {entities[userForm.entity_type]?.map(entity => (
                                    <div key={entity.id} className="col-md-6">
                                      <div className="form-check">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          checked={userForm.multiple_entities.includes(entity.id)}
                                          onChange={(e) => {
                                            const updated = e.target.checked
                                              ? [...userForm.multiple_entities, entity.id]
                                              : userForm.multiple_entities.filter(id => id !== entity.id);
                                            setUserForm({...userForm, multiple_entities: updated});
                                          }}
                                        />
                                        <label className="form-check-label small">{entity.name}</label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <select
                                value={userForm.entity_id}
                                onChange={(e) => setUserForm({...userForm, entity_id: e.target.value})}
                                className="form-select"
                              >
                                <option value="">Select Entity</option>
                                {entities[userForm.entity_type]?.map(entity => (
                                  <option key={entity.id} value={entity.id}>{entity.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Role Form - This would be a very large section, so I'll provide a simplified version */
                    <div>
                      <div className="mb-4">
                        <h6 className="border-bottom pb-2">Basic Information</h6>
                        <div className="row g-3 mt-2">
                          <div className="col-md-6">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              value={userForm.name}
                              onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                              className="form-control"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              value={userForm.email}
                              onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                              className="form-control"
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Role Name</label>
                            <input
                              type="text"
                              value={roleForm.name}
                              onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                              placeholder="e.g., Regional Supervisor"
                              className="form-control"
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Description</label>
                            <textarea
                              value={roleForm.description}
                              onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                              placeholder="Describe the role's responsibilities..."
                              rows={3}
                              className="form-control"
                            />
                          </div>
                        </div>
                      </div>

                      {/* View Access Configuration */}
                      <div className="mb-4">
                        <h6 className="border-bottom pb-2">View Access</h6>
                        <div className="mt-3">
                          <div className="form-check">
                            <input
                              type="radio"
                              name="view_access_type"
                              value="GLOBAL"
                              checked={roleForm.view_access_type === 'GLOBAL'}
                              onChange={(e) => setRoleForm({...roleForm, view_access_type: e.target.value, master_level: 'GLOBAL', specific_entities: []})}
                              className="form-check-input"
                            />
                            <label className="form-check-label">Global Access</label>
                          </div>
                          <div className="form-check">
                            <input
                              type="radio"
                              name="view_access_type"
                              value="SPECIFIC"
                              checked={roleForm.view_access_type === 'SPECIFIC'}
                              onChange={(e) => setRoleForm({...roleForm, view_access_type: e.target.value, specific_entities: []})}
                              className="form-check-input"
                            />
                            <label className="form-check-label">Specific Entity Access</label>
                          </div>

                          {roleForm.view_access_type === 'SPECIFIC' && (
                            <div className="mt-3">
                              <div className="mb-3">
                                <label className="form-label">Master Access Level</label>
                                <select
                                  value={roleForm.master_level}
                                  onChange={(e) => setRoleForm({...roleForm, master_level: e.target.value, specific_entities: []})}
                                  className="form-select"
                                >
                                  <option value="">Select Master Level</option>
                                  <option value="VERTICAL">Vertical Level</option>
                                  <option value="PROJECT">Project Level</option>
                                  <option value="CENTER">Center Level</option>
                                  <option value="COURSE">Course Level</option>
                                  <option value="BATCH">Batch Level</option>
                                </select>
                                <div className="form-text">
                                  Master level determines action scope. Parent hierarchy will be read-only.
                                </div>
                              </div>

                              {roleForm.master_level && (
                                <div>
                                  <label className="form-label">
                                    Select {roleForm.master_level} Entities (Multiple Selection)
                                  </label>
                                  <div className="border rounded p-3" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                    {entities[roleForm.master_level]?.map(entity => (
                                      <div key={entity.id} className="form-check">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          checked={roleForm.specific_entities?.includes(entity.id)}
                                          onChange={(e) => {
                                            const current = roleForm.specific_entities || [];
                                            const updated = e.target.checked
                                              ? [...current, entity.id]
                                              : current.filter(id => id !== entity.id);
                                            setRoleForm({...roleForm, specific_entities: updated});
                                          }}
                                        />
                                        <label className="form-check-label small">{entity.name}</label>
                                      </div>
                                    ))}
                                  </div>
                                  {roleForm.specific_entities?.length > 0 && (
                                    <div className="form-text text-success">
                                      Selected: {roleForm.specific_entities.length} {roleForm.master_level.toLowerCase()}(s)
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Permission Preview */}
                      <div className="bg-light rounded p-3 border">
                        <h6 className="mb-3">🔍 Permission Preview</h6>
                        <div className="small">
                          <div className="bg-white p-2 rounded border-start border-primary border-4 mb-2">
                            <span className="fw-medium text-primary">👁️ View:</span>
                            <div className="text-primary ms-4">
                              {roleForm.view_access_type === 'GLOBAL' 
                                ? '🌍 Complete system' 
                                : `📍 ${roleForm.master_level || 'Specific'} level + hierarchy`
                              }
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border-start border-success border-4 mb-2">
                            <span className="fw-medium text-success">➕ Add:</span>
                            <div className="text-success ms-4">
                              {roleForm.add_permissions.global 
                                ? '🔓 Can add anywhere'
                                : `🎯 ${roleForm.add_permissions.specific_permissions?.length || 0} permission configurations`
                              }
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border-start border-warning border-4 mb-2">
                            <span className="fw-medium text-warning">✏️ Edit:</span>
                            <div className="text-warning ms-4">
                              {roleForm.edit_permissions.global 
                                ? '🔓 Can edit anything'
                                : `🎯 ${roleForm.edit_permissions.specific_permissions?.length || 0} edit permission configurations`
                              }
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border-start border-danger border-4">
                            <span className="fw-medium text-danger">⚠️ Risk:</span>
                            <div className="text-danger ms-4">
                              {(roleForm.view_access_type === 'GLOBAL' || roleForm.add_permissions.global || roleForm.edit_permissions.global || roleForm.verify_permissions.global)
                                ? '🔴 HIGH (Global permissions)'
                                : roleForm.master_level === 'VERTICAL'
                                  ? '🟡 MEDIUM (Vertical access)'
                                  : '🟢 LOW (Limited scope)'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMode === 'user' ? handleAddUser : handleAddRole}
                    disabled={addMode === 'user' 
                      ? (!userForm.name || !userForm.email || !userForm.role)
                      : (!roleForm.name || !roleForm.description)
                    }
                    className={`btn ${addMode === 'user' ? 'btn-primary' : 'btn-success'}`}
                  >
                    Add User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PermissionAdminDashboard;