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
  EyeOff,
  User,
  Lock,
  Trash2,
  BookOpen,
  GraduationCap,
  Clock
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
      { id: 'vertical_1', name: 'Technology Vertical' },
      { id: 'vertical_2', name: 'Business Vertical' }
    ],
    PROJECT: [
      { id: 'project_1', name: 'AI Development Project', parent_id: 'vertical_1' },
      { id: 'project_2', name: 'Web Development Project', parent_id: 'vertical_1' },
      { id: 'project_3', name: 'Mobile App Project', parent_id: 'vertical_2' },
      { id: 'project_4', name: 'Data Science Project', parent_id: 'vertical_2' }
    ],
    CENTER: [
      { id: 'center_1', name: 'Delhi Center', parent_id: 'project_1' },
      { id: 'center_2', name: 'Mumbai Center', parent_id: 'project_1' },
      { id: 'center_3', name: 'Bangalore Center', parent_id: 'project_2' },
      { id: 'center_4', name: 'Pune Center', parent_id: 'project_2' },
      { id: 'center_5', name: 'Chennai Center', parent_id: 'project_3' },
      { id: 'center_6', name: 'Hyderabad Center', parent_id: 'project_4' }
    ],
    COURSE: [
      { id: 'course_1', name: 'Python Fundamentals', parent_id: 'center_1' },
      { id: 'course_2', name: 'React Development', parent_id: 'center_1' },
      { id: 'course_3', name: 'Machine Learning', parent_id: 'center_2' },
      { id: 'course_4', name: 'Data Structures', parent_id: 'center_3' },
      { id: 'course_5', name: 'Mobile Development', parent_id: 'center_5' },
      { id: 'course_6', name: 'Data Science Basics', parent_id: 'center_6' }
    ],
    BATCH: [
      { id: 'batch_1', name: 'Python Batch A', parent_id: 'course_1' },
      { id: 'batch_2', name: 'Python Batch B', parent_id: 'course_1' },
      { id: 'batch_3', name: 'React Batch A', parent_id: 'course_2' },
      { id: 'batch_4', name: 'ML Batch A', parent_id: 'course_3' }
    ]
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [viewDetailsUser, setViewDetailsUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addMode, setAddMode] = useState('user'); // 'user' or 'role'
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
    // If it's the same level as view access, return the selected entities from view access
    if (childLevel === parentLevel) {
      return entities[childLevel]?.filter(entity =>
        selectedParentIds.includes(entity.id)
      ) || [];
    }



    // Define the hierarchy levels
    const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
    const parentIndex = hierarchy.indexOf(parentLevel);
    const childIndex = hierarchy.indexOf(childLevel);

    // If child level is not below parent level, return empty
    if (childIndex <= parentIndex) {
      return [];
    }

    // Get all descendants at the target level
    let currentLevelIds = selectedParentIds;
    let currentLevel = parentLevel;

    // Traverse down the hierarchy until we reach the target level
    for (let i = parentIndex + 1; i <= childIndex; i++) {
      const nextLevel = hierarchy[i];
      const nextLevelEntities = entities[nextLevel] || [];

      // Find entities whose parent_id is in currentLevelIds
      const filteredEntities = nextLevelEntities.filter(entity =>
        currentLevelIds.includes(entity.parent_id)
      );

      if (i === childIndex) {
        // We've reached the target level, return these entities
        return filteredEntities;
      } else {
        // Update currentLevelIds for next iteration
        currentLevelIds = filteredEntities.map(entity => entity.id);
      }
    }

    return [];
  };

  // View User Details functionality
  const handleViewUserDetails = (user) => {

    console.log('user', user)
    setViewDetailsUser(user);
    setShowUserDetails(true);
  };

  const viewRestrictionsOptions = [
    { id: 'financial_data', label: 'Financial Data', icon: Lock },
    { id: 'personal_details', label: 'Personal Details', icon: User },
    { id: 'salary_info', label: 'Salary Information', icon: Lock },
    { id: 'contact_details', label: 'Contact Details', icon: User },
    { id: 'assessment_scores', label: 'Assessment Scores', icon: GraduationCap },
    { id: 'internal_notes', label: 'Internal Notes', icon: BookOpen },
    { id: 'admin_logs', label: 'Admin Activity Logs', icon: Clock },
    { id: 'system_settings', label: 'System Settings', icon: Settings }
  ];

  // Get detailed view permissions for a user
  const getDetailedViewPermissions = (user) => {
    const viewableEntities = [];
    const restrictedAreas = user.view_restrictions || [];

    // Get hierarchy access based on user's level
    const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
    const userLevelIndex = hierarchy.indexOf(user.master_access);

    // User can view their level and below
    for (let i = userLevelIndex; i < hierarchy.length; i++) {
      const level = hierarchy[i];
      const entitiesAtLevel = entities[level] || [];

      if (i === userLevelIndex) {
        // At user's level - can only view their assigned entity
        const userEntity = entitiesAtLevel.find(e => e.id === user.entity_id);
        if (userEntity) {
          viewableEntities.push({
            level: level,
            entity: userEntity,
            access_type: 'FULL'
          });
        }
      } else {
        // Below user's level - can view children of their entity
        const childEntities = getChildEntities(level, user.master_access, [user.entity_id]);
        childEntities.forEach(entity => {
          viewableEntities.push({
            level: level,
            entity: entity,
            access_type: 'FULL'
          });
        });
      }
    }

    // Add parent hierarchy as read-only
    for (let i = 0; i < userLevelIndex; i++) {
      const level = hierarchy[i];
      const entitiesAtLevel = entities[level] || [];

      // Find parent entities in the hierarchy
      let parentEntity = null;
      if (level === 'VERTICAL' && user.master_access !== 'VERTICAL') {
        // Find the vertical that contains the user's entity
        entitiesAtLevel.forEach(vertical => {
          const hasChildren = entities['PROJECT']?.some(project =>
            project.parent_id === vertical.id &&
            getChildEntities(user.master_access, 'PROJECT', [project.id]).some(e => e.id === user.entity_id)
          );
          if (hasChildren) {
            parentEntity = vertical;
          }
        });
      } else if (level === 'PROJECT' && !['VERTICAL', 'PROJECT'].includes(user.master_access)) {
        // Find the project that contains the user's entity
        entitiesAtLevel.forEach(project => {
          const hasChildren = getChildEntities(user.master_access, 'PROJECT', [project.id]).some(e => e.id === user.entity_id);
          if (hasChildren) {
            parentEntity = project;
          }
        });
      }

      if (parentEntity) {
        viewableEntities.push({
          level: level,
          entity: parentEntity,
          access_type: 'READ_ONLY'
        });
      }
    }

    return {
      viewable_entities: viewableEntities,
      restricted_areas: restrictedAreas,
      access_summary: {
        total_viewable: viewableEntities.length,
        full_access: viewableEntities.filter(e => e.access_type === 'FULL').length,
        read_only: viewableEntities.filter(e => e.access_type === 'READ_ONLY').length,
        restrictions_count: restrictedAreas.length
      }
    };
  };


  // Helper function to get allowed entity levels based on view access
  const getAllowedAddLevels = () => {
    if (roleForm.view_access_type === 'GLOBAL') {
      return ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE'];
    }

    if (roleForm.master_level) {
      const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE'];
      const masterIndex = hierarchy.indexOf(roleForm.master_level);
      // Return current level and all levels below it (children)
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
      permission_levels: [], // For option 2 - multi-select levels
      with_child_levels: false, // For option 3
      specific_entities: [], // For options 4 & 5
      entity_names: [] // For options 4 & 5 - actual entity names
    };

    setRoleForm(prevForm => ({
      ...prevForm,
      edit_permissions: {
        ...prevForm.edit_permissions,
        specific_permissions: [...prevForm.edit_permissions.specific_permissions, newPermission]
      }
    }));
  };

  // Helper function to update edit permission
  const updateEditPermission = (permissionId, field, value) => {
    console.log(`Updating permission ${permissionId}, field: ${field}, value:`, value);

    setRoleForm(prevForm => {
      const updated = prevForm.edit_permissions.specific_permissions.map(permission =>
        permission.id === permissionId
          ? { ...permission, [field]: value }
          : permission
      );

      const newForm = {
        ...prevForm,
        edit_permissions: {
          ...prevForm.edit_permissions,
          specific_permissions: updated
        }
      };

      console.log('Updated form:', newForm);
      return newForm;
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

  // Helper function to get all entities for specific entity selection
  const getAllEntitiesForSelection = () => {
    const allEntities = [];
    Object.entries(entities).forEach(([type, entityList]) => {
      entityList.forEach(entity => {
        allEntities.push({
          ...entity,
          entity_type: type,
          full_name: `${entity.name} (${type})`
        });
      });
    });
    return allEntities;
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
    setUserForm({ name: '', email: '', role: '', entity_type: '', entity_id: '', multiple_entities: [] });
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
                      className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.id ? 'active' : ''
                        }`}
                      style={{ border: 'none', background: 'none' }}
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
                            <span className={`badge ${user.master_access === 'GLOBAL' ? 'bg-danger' :
                              user.master_access === 'VERTICAL' ? 'bg-warning' :
                                user.master_access === 'PROJECT' ? 'bg-success' :
                                  'bg-info'
                              }`}>
                              {user.master_access}
                            </span>
                          </td>
                          <td className="text-dark">
                            {user.entity_name || 'N/A'}
                          </td>
                          <td>
                            <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'
                              }`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => {
                                  console.log('button hitting');
                                  handleViewUserDetails(user);
                                }}
                                className="btn btn-sm btn-outline-info"
                                title="View Details"
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
                    <h3 className="card-title">Permission Analysis</h3>
                    <div className="btn-group" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="analysisView"
                        id="single"
                        checked={analysisView === 'single'}
                        onChange={() => setAnalysisView('single')}
                      />
                      <label className="btn btn-outline-primary" htmlFor="single">
                        Single User
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="analysisView"
                        id="matrix"
                        checked={analysisView === 'matrix'}
                        onChange={() => setAnalysisView('matrix')}
                      />
                      <label className="btn btn-outline-primary" htmlFor="matrix">
                        Permission Matrix
                      </label>
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
                            <div className="card bg-light mb-4">
                              <div className="card-body">
                                <h5 className="card-title">Permission Summary</h5>
                                <div className="row g-2 small">
                                  <div className="col-6">
                                    <span className="text-muted">Access Level:</span>
                                  </div>
                                  <div className="col-6">
                                    <span className="fw-medium">{analysisResult.summary.access_level}</span>
                                  </div>
                                  <div className="col-6">
                                    <span className="text-muted">Entity Control:</span>
                                  </div>
                                  <div className="col-6">
                                    <span className="fw-medium">{analysisResult.summary.entity_control}</span>
                                  </div>
                                  <div className="col-6">
                                    <span className="text-muted">Risk Level:</span>
                                  </div>
                                  <div className="col-6">
                                    <span className={`fw-medium ${analysisResult.summary.risk_level === 'HIGH' ? 'text-danger' :
                                      analysisResult.summary.risk_level === 'MEDIUM' ? 'text-warning' :
                                        'text-success'
                                      }`}>
                                      {analysisResult.summary.risk_level}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="row g-2 mb-4">
                              <div className="col-6">
                                <div className={`card text-center ${analysisResult.summary.can_add ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                                  <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                      {analysisResult.summary.can_add ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                      <span className="small fw-medium">Add Content</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className={`card text-center ${analysisResult.summary.can_edit ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                                  <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                      {analysisResult.summary.can_edit ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                      <span className="small fw-medium">Edit Content</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className={`card text-center ${analysisResult.summary.can_verify ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                                  <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                      {analysisResult.summary.can_verify ? <CheckCircle className="text-success" size={16} /> : <XCircle className="text-danger" size={16} />}
                                      <span className="small fw-medium">Verify Content</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="card text-center bg-primary bg-opacity-10">
                                  <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                      <Eye className="text-primary" size={16} />
                                      <span className="small fw-medium">View Access</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {analysisResult && (
                        <div className="col-lg-6">
                          <h5 className="fw-medium mb-3">Detailed Permissions</h5>

                          <div className="row g-3">
                            <div className="col-12">
                              <div className="card border-primary">
                                <div className="card-body">
                                  <h6 className="card-title text-primary mb-2">View Access</h6>
                                  <p className="card-text small text-primary mb-0">{analysisResult.permissions.view_access.description}</p>
                                </div>
                              </div>
                            </div>

                            <div className="col-12">
                              <div className="card border-success">
                                <div className="card-body">
                                  <h6 className="card-title text-success mb-2">Add Permissions</h6>
                                  <p className="card-text small text-success mb-0">{analysisResult.permissions.add_permissions}</p>
                                </div>
                              </div>
                            </div>

                            <div className="col-12">
                              <div className="card border-warning">
                                <div className="card-body">
                                  <h6 className="card-title text-warning mb-2">Edit Permissions</h6>
                                  <p className="card-text small text-warning mb-0">{analysisResult.permissions.edit_permissions}</p>
                                </div>
                              </div>
                            </div>

                            <div className="col-12">
                              <div className="card border-info">
                                <div className="card-body">
                                  <h6 className="card-title text-info mb-2">Verify Permissions</h6>
                                  <p className="card-text small text-info mb-0">{analysisResult.permissions.verify_permissions}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {analysisView === 'matrix' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-medium">Overall Permission Matrix</h5>
                        <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                          <Download size={16} />
                          <span>Export Matrix</span>
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-bordered table-hover">
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
                                    <div className="fw-medium text-dark">{user.name}</div>
                                    <div className="small text-muted">{user.entity_name}</div>
                                  </div>
                                </td>
                                <td className="text-center border-end">
                                  <span className="badge bg-primary">
                                    {user.role.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="text-center border-end">
                                  <span className={`badge ${user.master_access === 'GLOBAL' ? 'bg-danger' :
                                    user.master_access === 'VERTICAL' ? 'bg-warning' :
                                      user.master_access === 'PROJECT' ? 'bg-success' :
                                        'bg-info'
                                    }`}>
                                    {user.master_access}
                                  </span>
                                </td>
                                <td className="text-center border-end">
                                  {user.can_view_global ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_project ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_center ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_course ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_add_batch ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_edit_vertical ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_edit_project ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_edit_center ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center border-end">
                                  {user.can_verify_content ? <CheckCircle className="text-success" size={20} /> : <XCircle className="text-danger" size={20} />}
                                </td>
                                <td className="text-center">
                                  <span className={`badge ${user.risk_level === 'HIGH' ? 'bg-danger' :
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

                      <div className="card bg-light mt-4">
                        <div className="card-body">
                          <h6 className="card-title">Legend</h6>
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
                                <span className="badge bg-danger rounded-circle" style={{ width: '16px', height: '16px' }}></span>
                                <span>High Risk</span>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-success rounded-circle" style={{ width: '16px', height: '16px' }}></span>
                                <span>Low Risk</span>
                              </div>
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

        {/* User Details Modal */}
        {showUserDetails && viewDetailsUser && (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <User className="me-2" size={20} />
                    User Details: {viewDetailsUser.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUserDetails(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-4">
                    {/* User Information */}
                    <div className="col-md-4">
                      <div className="card h-100">
                        <div className="card-body">
                          <h6 className="card-title text-primary">👤 User Information</h6>
                          <div className="mb-3">
                            <div className="d-flex justify-content-center mb-3">
                              <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                                <User size={40} className="text-primary" />
                              </div>
                            </div>
                            <div className="text-center">
                              <h5 className="mb-1">{viewDetailsUser.name}</h5>
                              <p className="text-muted mb-2">{viewDetailsUser.email}</p>
                              <span className={`badge ${viewDetailsUser.status === 'active' ? 'bg-success' : 'bg-danger'
                                }`}>
                                {viewDetailsUser.status}
                              </span>
                            </div>
                          </div>
                          <hr />
                          <div className="row g-2 small">
                            <div className="col-6">Role:</div>
                            <div className="col-6">
                              <span className="badge bg-primary">{viewDetailsUser.role.replace('_', ' ')}</span>
                            </div>
                            <div className="col-6">Access Level:</div>
                            <div className="col-6">
                              <span className={`badge ${viewDetailsUser.master_access === 'GLOBAL' ? 'bg-danger' :
                                viewDetailsUser.master_access === 'VERTICAL' ? 'bg-warning' :
                                  'bg-info'
                                }`}>
                                {viewDetailsUser.master_access}
                              </span>
                            </div>
                            <div className="col-6">Entity:</div>
                            <div className="col-6 fw-medium">{viewDetailsUser.entity_name}</div>
                            <div className="col-6">Created:</div>
                            <div className="col-6 fw-medium">{viewDetailsUser.created_date}</div>
                            <div className="col-6">Last Login:</div>
                            <div className="col-6 fw-medium">{viewDetailsUser.last_login}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* View Permissions */}
                    <div className="col-md-8">
                      <div className="card h-100">
                        <div className="card-body">
                          <h6 className="card-title text-info">👁️ View Permissions</h6>
                          {(() => {
                            const viewDetails = getDetailedViewPermissions(viewDetailsUser);
                            return (
                              <div>
                                {/* Summary Cards */}
                                <div className="row g-2 mb-4">
                                  <div className="col-3">
                                    <div className="card bg-primary bg-opacity-10 text-center">
                                      <div className="card-body py-2">
                                        <div className="fw-bold text-primary">{viewDetails.access_summary.total_viewable}</div>
                                        <div className="small">Total Entities</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="card bg-success bg-opacity-10 text-center">
                                      <div className="card-body py-2">
                                        <div className="fw-bold text-success">{viewDetails.access_summary.full_access}</div>
                                        <div className="small">Full Access</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="card bg-warning bg-opacity-10 text-center">
                                      <div className="card-body py-2">
                                        <div className="fw-bold text-warning">{viewDetails.access_summary.read_only}</div>
                                        <div className="small">Read Only</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="card bg-danger bg-opacity-10 text-center">
                                      <div className="card-body py-2">
                                        <div className="fw-bold text-danger">{viewDetails.access_summary.restrictions_count}</div>
                                        <div className="small">Restrictions</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Viewable Entities */}
                                <div className="mb-4">
                                  <h6 className="fw-medium mb-3">Accessible Entities</h6>
                                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <div className="list-group">
                                      {viewDetails.viewable_entities.map((item, index) => (
                                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                          <div>
                                            <div className="fw-medium">{item.entity.name}</div>
                                            <div className="small text-muted">
                                              {item.level} Level
                                              {item.access_type === 'READ_ONLY' && ' (Parent Hierarchy)'}
                                            </div>
                                          </div>
                                          <div className="d-flex align-items-center gap-2">
                                            {item.access_type === 'FULL' ? (
                                              <Eye className="text-success" size={16} />
                                            ) : (
                                              <EyeOff className="text-warning" size={16} />
                                            )}
                                            <span className={`badge ${item.access_type === 'FULL' ? 'bg-success' : 'bg-warning'
                                              }`}>
                                              {item.access_type}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Restrictions */}
                                {viewDetails.restricted_areas.length > 0 && (
                                  <div>
                                    <h6 className="fw-medium mb-3 text-danger">🚫 View Restrictions</h6>
                                    <div className="row g-2">
                                      {viewDetails.restricted_areas.map((restriction, index) => {
                                        const restrictionData = viewRestrictionsOptions.find(opt => opt.id === restriction);
                                        const Icon = restrictionData?.icon || Lock;
                                        return (
                                          <div key={index} className="col-6">
                                            <div className="card border-danger">
                                              <div className="card-body py-2">
                                                <div className="d-flex align-items-center gap-2">
                                                  <Icon size={16} className="text-danger" />
                                                  <span className="small fw-medium">
                                                    {restrictionData?.label || restriction.replace('_', ' ')}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Permission Summary */}
                    <div className="col-12">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title text-success">📊 Complete Permission Summary</h6>
                          {(() => {
                            const fullAnalysis = analyzeUserPermissions(viewDetailsUser.user_id);
                            return (
                              <div className="row g-3">
                                <div className="col-md-3">
                                  <div className="card border-primary">
                                    <div className="card-body text-center">
                                      <Eye className="text-primary mb-2" size={24} />
                                      <h6 className="card-title text-primary">View Access</h6>
                                      <p className="card-text small">{fullAnalysis.permissions.view_access.description}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="card border-success">
                                    <div className="card-body text-center">
                                      <Plus className="text-success mb-2" size={24} />
                                      <h6 className="card-title text-success">Add Permissions</h6>
                                      <p className="card-text small">{fullAnalysis.permissions.add_permissions}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="card border-warning">
                                    <div className="card-body text-center">
                                      <Edit className="text-warning mb-2" size={24} />
                                      <h6 className="card-title text-warning">Edit Permissions</h6>
                                      <p className="card-text small">{fullAnalysis.permissions.edit_permissions}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <div className="card border-info">
                                    <div className="card-body text-center">
                                      <CheckCircle className="text-info mb-2" size={24} />
                                      <h6 className="card-title text-info">Verify Permissions</h6>
                                      <p className="card-text small">{fullAnalysis.permissions.verify_permissions}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUserDetails(false)}>
                    Close
                  </button>
                  <button type="button" className="btn btn-primary">
                    <Edit size={16} className="me-2" />
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable" style={{ maxHeight: '85vh' }}>
              <div className="modal-content d-flex flex-column h-100">
                {/* Modal Header - Fixed */}
                <div className="modal-header flex-shrink-0">
                  <div className="d-flex align-items-center gap-4">
                    <h5 className="modal-title">Add New User</h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddUser(false)}
                  ></button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="modal-body flex-grow-1 overflow-auto">
                  {addMode === 'user' ? (
                    /* User Form */
                    <div className="container-fluid">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="form-label">Name</label>
                          <input
                            type="text"
                            value={userForm.name}
                            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                            className="form-control"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            className="form-control"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Role</label>
                          <select
                            value={userForm.role}
                            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
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
                              onChange={(e) => setUserForm({ ...userForm, entity_type: e.target.value, entity_id: '' })}
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
                              <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <div className="row">
                                  {entities[userForm.entity_type]?.map(entity => (
                                    <div key={entity.id} className="col-6">
                                      <div className="form-check">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          checked={userForm.multiple_entities.includes(entity.id)}
                                          onChange={(e) => {
                                            const updated = e.target.checked
                                              ? [...userForm.multiple_entities, entity.id]
                                              : userForm.multiple_entities.filter(id => id !== entity.id);
                                            setUserForm({ ...userForm, multiple_entities: updated });
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
                                onChange={(e) => setUserForm({ ...userForm, entity_id: e.target.value })}
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
                    /* Role Form */
                    <div>
                      <div className="row g-4">
                        {/* Basic Information */}
                        <div className="col-12">
                          <h5 className="border-bottom pb-2">Basic Information</h5>

                          <div className="row g-3 mt-2">
                            <div className="col-md-6">
                              <label className="form-label">Name</label>
                              <input
                                type="text"
                                value={userForm.name}
                                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                className="form-control"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Email</label>
                              <input
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                className="form-control"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Role Name</label>
                              <input
                                type="text"
                                value={roleForm.name}
                                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                placeholder="e.g., Regional Supervisor"
                                className="form-control"
                              />
                            </div>
                            <div className="col-12">
                              <label className="form-label">Description</label>
                              <textarea
                                value={roleForm.description}
                                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                placeholder="Describe the role's responsibilities..."
                                rows={3}
                                className="form-control"
                              />
                            </div>

                            {/* View Access Configuration */}
                            <div className="col-12 mt-4">
                              <h6 className="fw-medium mb-3">View Access</h6>
                              <div className="row g-2">
                                <div className="col-12">
                                  <div className="form-check">
                                    <input
                                      type="radio"
                                      name="view_access_type"
                                      value="GLOBAL"
                                      checked={roleForm.view_access_type === 'GLOBAL'}
                                      onChange={(e) => setRoleForm({ ...roleForm, view_access_type: e.target.value, master_level: 'GLOBAL', specific_entities: [] })}
                                      className="form-check-input"
                                    />
                                    <label className="form-check-label small">Global Access</label>
                                  </div>
                                </div>
                                <div className="col-12">
                                  <div className="form-check">
                                    <input
                                      type="radio"
                                      name="view_access_type"
                                      value="SPECIFIC"
                                      checked={roleForm.view_access_type === 'SPECIFIC'}
                                      onChange={(e) => setRoleForm({ ...roleForm, view_access_type: e.target.value, specific_entities: [] })}
                                      className="form-check-input"
                                    />
                                    <label className="form-check-label small">Specific Entity Access</label>
                                  </div>
                                </div>
                              </div>

                              {roleForm.view_access_type === 'SPECIFIC' && (
                                <div className="mt-3">
                                  <div className="mb-3">
                                    <label className="form-label small fw-medium">Master Access Level</label>
                                    <select
                                      value={roleForm.master_level}
                                      onChange={(e) => setRoleForm({ ...roleForm, master_level: e.target.value, specific_entities: [] })}
                                      className="form-select"
                                    >
                                      <option value="">Select Master Level</option>
                                      <option value="VERTICAL">Vertical Level</option>
                                      <option value="PROJECT">Project Level</option>
                                      <option value="CENTER">Center Level</option>
                                      <option value="COURSE">Course Level</option>
                                      <option value="BATCH">Batch Level</option>
                                    </select>
                                    <div className="form-text small">
                                      Master level determines action scope. Parent hierarchy will be read-only.
                                    </div>
                                  </div>

                                  {roleForm.master_level && (
                                    <div>
                                      <label className="form-label small fw-medium">
                                        Select {roleForm.master_level} Entities (Multiple Selection)
                                      </label>
                                      <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                        {entities[roleForm.master_level]?.map(entity => (
                                          <div key={entity.id} className="form-check mb-1">
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={roleForm.specific_entities?.includes(entity.id)}
                                              onChange={(e) => {
                                                const current = roleForm.specific_entities || [];
                                                const updated = e.target.checked
                                                  ? [...current, entity.id]
                                                  : current.filter(id => id !== entity.id);
                                                setRoleForm({ ...roleForm, specific_entities: updated });
                                              }}
                                            />
                                            <label className="form-check-label small">{entity.name}</label>
                                          </div>
                                        ))}
                                      </div>
                                      {roleForm.specific_entities?.length > 0 && (
                                        <div className="form-text text-success mt-1 small">
                                          Selected: {roleForm.specific_entities.length} {roleForm.master_level.toLowerCase()}(s)
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Add Permissions Section */}
                        <div className="col-12">
                          <h5 className="border-bottom pb-2">Add Permissions</h5>

                          <div className="mt-3">
                            <div className="form-check mb-3">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={roleForm.add_permissions.global}
                                onChange={(e) => setRoleForm({
                                  ...roleForm,
                                  add_permissions: {
                                    ...roleForm.add_permissions,
                                    global: e.target.checked,
                                    specific_permissions: e.target.checked ? [] : roleForm.add_permissions.specific_permissions
                                  }
                                })}
                              />
                              <label className="form-check-label fw-medium small">🌍 Global Add Permission</label>
                            </div>

                            {!roleForm.add_permissions.global && (
                              <div className="card bg-light">
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="card-title mb-0 small fw-medium">Specific Add Permissions</h6>
                                    <button
                                      type="button"
                                      onClick={addNewAddPermission}
                                      disabled={!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC'}
                                      className="btn btn-success btn-sm"
                                    >
                                      + Add Permission
                                    </button>
                                  </div>

                                  {(!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC') && (
                                    <div className="alert alert-warning py-2">
                                      <p className="mb-0 small">⚠️ Please select Master Access Level in View Access section first</p>
                                    </div>
                                  )}

                                  {roleForm.add_permissions.specific_permissions.length === 0 && roleForm.master_level && (
                                    <div className="text-center py-4 text-muted small">
                                      No specific add permissions configured. Click "Add Permission" to start.
                                    </div>
                                  )}

                                  {/* Individual Add Permission Configurations */}
                                  {roleForm.add_permissions.specific_permissions.map((permission, index) => (
                                    <div key={permission.id} className="card border mb-3">
                                      <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                          <h6 className="text-primary mb-0 small fw-medium">Permission #{index + 1}</h6>
                                          <button
                                            type="button"
                                            onClick={() => removeAddPermission(permission.id)}
                                            className="btn btn-outline-danger btn-sm"
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        {/* Step 1: Select Permission Level */}
                                        <div className="row g-3">
                                          <div className="col-12">
                                            <label className="form-label small fw-medium">
                                              1️⃣ At which level do you want to grant add permissions?
                                            </label>
                                            <select
                                              value={permission.permission_level || ''}
                                              onChange={(e) => updateAddPermission(permission.id, 'permission_level', e.target.value)}
                                              className="form-select form-select-sm"
                                            >
                                              <option value="">Select Level</option>
                                              {getAllowedAddLevels().map(level => (
                                                <option key={level} value={level}>
                                                  {level} Level
                                                </option>
                                              ))}
                                            </select>
                                            <div className="form-text small">
                                              You can only select levels up to your view access level ({roleForm.master_level || 'None'})
                                            </div>
                                          </div>

                                          {/* Step 2: Select Specific Entities */}
                                          {permission.permission_level && (
                                            <div className="col-12">
                                              <label className="form-label small fw-medium">
                                                2️⃣ Select specific {permission.permission_level.toLowerCase()}(s) where they can add content:
                                              </label>

                                              {/* Show context of selected parent entities */}
                                              {permission.permission_level !== roleForm.master_level && roleForm.specific_entities?.length > 0 && (
                                                <div className="alert alert-info py-2 mb-2">
                                                  <div className="small fw-medium text-info mb-1">
                                                    📋 Based on your selected {roleForm.master_level.toLowerCase()}(s):
                                                  </div>
                                                  <div className="small text-info">
                                                    {entities[roleForm.master_level]?.filter(entity =>
                                                      roleForm.specific_entities.includes(entity.id)
                                                    ).map(entity => entity.name).join(', ')}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Show available entities based on permission level and view access */}
                                              <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {(() => {
                                                  let availableEntities = [];

                                                  if (permission.permission_level === roleForm.master_level) {
                                                    // Same level as master - show only selected entities from view access
                                                    availableEntities = entities[roleForm.master_level]?.filter(entity =>
                                                      roleForm.specific_entities?.includes(entity.id)
                                                    ) || [];
                                                  } else {
                                                    // Different level - show child entities based on hierarchy
                                                    availableEntities = getChildEntities(
                                                      permission.permission_level,
                                                      roleForm.master_level,
                                                      roleForm.specific_entities || []
                                                    );
                                                  }

                                                  if (availableEntities.length === 0) {
                                                    return (
                                                      <div className="small text-muted fst-italic p-2">
                                                        {permission.permission_level === roleForm.master_level
                                                          ? `No ${permission.permission_level.toLowerCase()} entities selected in view access`
                                                          : `No ${permission.permission_level.toLowerCase()} entities found under selected ${roleForm.master_level.toLowerCase()}(s)`
                                                        }
                                                      </div>
                                                    );
                                                  }

                                                  // Simple list for most cases
                                                  return availableEntities.map(entity => (
                                                    <div key={entity.id} className="form-check mb-1">
                                                      <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={permission.selected_entities?.includes(entity.id)}
                                                        onChange={(e) => {
                                                          const current = permission.selected_entities || [];
                                                          const updated = e.target.checked
                                                            ? [...current, entity.id]
                                                            : current.filter(id => id !== entity.id);
                                                          updateAddPermission(permission.id, 'selected_entities', updated);
                                                        }}
                                                      />
                                                      <label className="form-check-label small">{entity.name}</label>
                                                    </div>
                                                  ));
                                                })()}
                                              </div>

                                              {permission.selected_entities?.length > 0 && (
                                                <div className="form-text text-success mt-1 small">
                                                  ✅ Selected: {permission.selected_entities.length} {permission.permission_level.toLowerCase()}(s)
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Step 3: What can they add */}
                                          {permission.permission_level && permission.selected_entities?.length > 0 && (
                                            <div className="col-12">
                                              <label className="form-label small fw-medium">
                                                3️⃣ What can they add in the selected {permission.permission_level.toLowerCase()}(s)?
                                              </label>

                                              <div className="row g-2">
                                                {getChildEntityTypes(permission.permission_level).map(childType => (
                                                  <div key={childType} className="col-6">
                                                    <div className="form-check">
                                                      <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={permission.can_add_types?.includes(childType)}
                                                        onChange={(e) => {
                                                          const current = permission.can_add_types || [];
                                                          const updated = e.target.checked
                                                            ? [...current, childType]
                                                            : current.filter(type => type !== childType);
                                                          updateAddPermission(permission.id, 'can_add_types', updated);
                                                        }}
                                                      />
                                                      <label className="form-check-label small">Add {childType}</label>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>

                                              {getChildEntityTypes(permission.permission_level).length === 0 && (
                                                <div className="alert alert-secondary py-2">
                                                  <p className="mb-0 small fst-italic">⚠️ No child entities can be added at {permission.permission_level} level</p>
                                                </div>
                                              )}

                                              {permission.can_add_types?.length > 0 && (
                                                <div className="alert alert-success py-2 mt-2">
                                                  <p className="mb-0 small">
                                                    ✅ Can add: {permission.can_add_types.join(', ')} in {permission.selected_entities.length} selected {permission.permission_level.toLowerCase()}(s)
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* NEW IMPROVED Edit Permissions Section */}
                        <div className="col-12">
                          <h5 className="border-bottom pb-2">Edit Permissions</h5>
                          <div className="mt-3">
                            <div className="form-check mb-3">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={roleForm.edit_permissions.global}
                                onChange={(e) => setRoleForm({
                                  ...roleForm,
                                  edit_permissions: {
                                    ...roleForm.edit_permissions,
                                    global: e.target.checked,
                                    specific_permissions: e.target.checked ? [] : roleForm.edit_permissions.specific_permissions
                                  }
                                })}
                              />
                              <label className="form-check-label fw-medium small">🌍 Global Edit Permission</label>
                            </div>

                            {!roleForm.edit_permissions.global && (
                              <div className="card bg-light">
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="card-title mb-0 small fw-medium">Specific Edit Permissions</h6>
                                    <button
                                      type="button"
                                      onClick={addNewEditPermission}
                                      disabled={!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC'}
                                      className="btn btn-warning btn-sm"
                                    >
                                      + Add Edit Permission
                                    </button>
                                  </div>

                                  {(!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC') && (
                                    <div className="alert alert-warning py-2">
                                      <p className="mb-0 small">⚠️ Please select Master Access Level in View Access section first</p>
                                    </div>
                                  )}

                                  {roleForm.edit_permissions.specific_permissions.length === 0 && roleForm.master_level && (
                                    <div className="text-center py-4 text-muted small">
                                      No specific edit permissions configured. Click "Add Edit Permission" to start.
                                    </div>
                                  )}

                                  {/* Individual Edit Permission Configurations */}
                                  {roleForm.edit_permissions.specific_permissions.map((permission, index) => (
                                    <div key={permission.id} className="card border mb-3">
                                      <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                          <h6 className="text-warning mb-0 small fw-medium">Edit Permission #{index + 1}</h6>
                                          <button
                                            type="button"
                                            onClick={() => removeEditPermission(permission.id)}
                                            className="btn btn-outline-danger btn-sm"
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        {/* Step 1: Select Edit Type */}
                                        <div className="row g-3">
                                          <div className="col-12">
                                            <label className="form-label small fw-medium mb-2">
                                              1️⃣ What type of edit permission?
                                            </label>

                                            <div className="row g-2">
                                              <div className="col-12">
                                                <div className="form-check mb-2">
                                                  <input
                                                    type="radio"
                                                    name={`edit_type_${permission.id}`}
                                                    value="specific_entity_level"
                                                    checked={permission.edit_type === 'specific_entity_level'}
                                                    onChange={(e) => {
                                                      console.log('Radio button clicked:', e.target.value);
                                                      updateEditPermission(permission.id, 'edit_type', e.target.value);
                                                      // Reset other fields
                                                      setTimeout(() => {
                                                        updateEditPermission(permission.id, 'permission_levels', []);
                                                        updateEditPermission(permission.id, 'specific_entities', []);
                                                        updateEditPermission(permission.id, 'entity_names', []);
                                                        updateEditPermission(permission.id, 'with_child_levels', false);
                                                      }, 10);
                                                    }}
                                                    className="form-check-input"
                                                    id={`edit_type_1_${permission.id}`}
                                                  />
                                                  <label className="form-check-label small" htmlFor={`edit_type_1_${permission.id}`}>
                                                    <strong>📋 Specific Entity Level Edit Permission</strong>
                                                    <div className="text-muted small">Multi-select levels (project, course, center, vertical)</div>
                                                  </label>
                                                </div>
                                              </div>

                                              <div className="col-12">
                                                <div className="form-check mb-2">
                                                  <input
                                                    type="radio"
                                                    name={`edit_type_${permission.id}`}
                                                    value="specific_entity_with_children"
                                                    checked={permission.edit_type === 'specific_entity_with_children'}
                                                    onChange={(e) => {
                                                      console.log('Radio button clicked:', e.target.value);
                                                      updateEditPermission(permission.id, 'edit_type', e.target.value);
                                                      setTimeout(() => {
                                                        updateEditPermission(permission.id, 'permission_levels', []);
                                                        updateEditPermission(permission.id, 'specific_entities', []);
                                                        updateEditPermission(permission.id, 'entity_names', []);
                                                        updateEditPermission(permission.id, 'with_child_levels', true);
                                                      }, 10);
                                                    }}
                                                    className="form-check-input"
                                                    id={`edit_type_2_${permission.id}`}
                                                  />
                                                  <label className="form-check-label small" htmlFor={`edit_type_2_${permission.id}`}>
                                                    <strong>🔗 Specific Entity Level with All Child Level</strong>
                                                    <div className="text-muted small">Edit entity and all its children</div>
                                                  </label>
                                                </div>
                                              </div>

                                              <div className="col-12">
                                                <div className="form-check mb-2">
                                                  <input
                                                    type="radio"
                                                    name={`edit_type_${permission.id}`}
                                                    value="specific_entity_and_children"
                                                    checked={permission.edit_type === 'specific_entity_and_children'}
                                                    onChange={(e) => {
                                                      console.log('Radio button clicked:', e.target.value);
                                                      updateEditPermission(permission.id, 'edit_type', e.target.value);
                                                      setTimeout(() => {
                                                        updateEditPermission(permission.id, 'permission_levels', []);
                                                        updateEditPermission(permission.id, 'specific_entities', []);
                                                        updateEditPermission(permission.id, 'entity_names', []);
                                                        updateEditPermission(permission.id, 'with_child_levels', false);
                                                      }, 10);
                                                    }}
                                                    className="form-check-input"
                                                    id={`edit_type_3_${permission.id}`}
                                                  />
                                                  <label className="form-check-label small" htmlFor={`edit_type_3_${permission.id}`}>
                                                    <strong>🏢 Specific Entity and All Child Entity Edit Permission</strong>
                                                    <div className="text-muted small">Need to take entity name</div>
                                                  </label>
                                                </div>
                                              </div>

                                              <div className="col-12">
                                                <div className="form-check mb-2">
                                                  <input
                                                    type="radio"
                                                    name={`edit_type_${permission.id}`}
                                                    value="specific_entities_only"
                                                    checked={permission.edit_type === 'specific_entities_only'}
                                                    onChange={(e) => {
                                                      console.log('Radio button clicked:', e.target.value);
                                                      updateEditPermission(permission.id, 'edit_type', e.target.value);
                                                      setTimeout(() => {
                                                        updateEditPermission(permission.id, 'permission_levels', []);
                                                        updateEditPermission(permission.id, 'specific_entities', []);
                                                        updateEditPermission(permission.id, 'entity_names', []);
                                                        updateEditPermission(permission.id, 'with_child_levels', false);
                                                      }, 10);
                                                    }}
                                                    className="form-check-input"
                                                    id={`edit_type_4_${permission.id}`}
                                                  />
                                                  <label className="form-check-label small" htmlFor={`edit_type_4_${permission.id}`}>
                                                    <strong>📝 Specific Entities Edit Permission</strong>
                                                    <div className="text-muted small">Edit specific entities like "x project", "digital course" - need to take names</div>
                                                  </label>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Option 2: Specific Entity Level (Multi-select levels) */}
                                          {permission.edit_type === 'specific_entity_level' && (
                                            <div className="col-12">
                                              <label className="form-label small fw-medium">
                                                2️⃣ Select Entity Levels (Multi-select):
                                              </label>
                                              <div className="row g-2">
                                                {['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'].map(level => (
                                                  <div key={level} className="col-6">
                                                    <div className="form-check">
                                                      <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={permission.permission_levels?.includes(level) || false}
                                                        onChange={(e) => {
                                                          console.log(`Checkbox ${level} clicked:`, e.target.checked);
                                                          const current = permission.permission_levels || [];
                                                          const updated = e.target.checked
                                                            ? [...current, level]
                                                            : current.filter(l => l !== level);
                                                          console.log('Updated levels:', updated);
                                                          updateEditPermission(permission.id, 'permission_levels', updated);
                                                        }}
                                                        id={`level_${level}_${permission.id}`}
                                                      />
                                                      <label className="form-check-label small" htmlFor={`level_${level}_${permission.id}`}>
                                                        {level}
                                                      </label>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                              {permission.permission_levels?.length > 0 && (
                                                <div className="alert alert-warning py-2 mt-2">
                                                  <p className="mb-0 small">
                                                    ✅ Can edit all entities at: {permission.permission_levels.join(', ')} levels
                                                  </p>
                                                </div>
                                              )}
                                              <div className="small text-muted mt-1">
                                                Debug: Selected levels = {JSON.stringify(permission.permission_levels)}
                                              </div>
                                            </div>
                                          )}

                                          {/* Option 3: Specific Entity Level with All Child Level */}
                                          {permission.edit_type === 'specific_entity_with_children' && (
                                            <div className="col-12">
                                              <label className="form-label small fw-medium">
                                                2️⃣ Select Entity Level:
                                              </label>
                                              <select
                                                value={permission.permission_levels?.[0] || ''}
                                                onChange={(e) => {
                                                  updateEditPermission(permission.id, 'permission_levels', e.target.value ? [e.target.value] : []);
                                                  updateEditPermission(permission.id, 'specific_entities', []);
                                                }}
                                                className="form-select form-select-sm"
                                              >
                                                <option value="">Select Level</option>
                                                {['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'].map(level => (
                                                  <option key={level} value={level}>{level}</option>
                                                ))}
                                              </select>

                                              {/* Select specific entities at that level */}
                                              {permission.permission_levels?.[0] && (
                                                <div className="mt-3">
                                                  <label className="form-label small fw-medium">
                                                    3️⃣ Select specific {permission.permission_levels[0].toLowerCase()}(s):
                                                  </label>
                                                  <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                    {entities[permission.permission_levels[0]]?.map(entity => (
                                                      <div key={entity.id} className="form-check mb-1">
                                                        <input
                                                          type="checkbox"
                                                          className="form-check-input"
                                                          checked={permission.specific_entities?.includes(entity.id)}
                                                          onChange={(e) => {
                                                            const current = permission.specific_entities || [];
                                                            const updated = e.target.checked
                                                              ? [...current, entity.id]
                                                              : current.filter(id => id !== entity.id);
                                                            updateEditPermission(permission.id, 'specific_entities', updated);
                                                          }}
                                                        />
                                                        <label className="form-check-label small">{entity.name}</label>
                                                      </div>
                                                    ))}
                                                  </div>
                                                  {permission.specific_entities?.length > 0 && (
                                                    <div className="alert alert-warning py-2 mt-2">
                                                      <p className="mb-0 small">
                                                        ✅ Can edit selected {permission.permission_levels[0].toLowerCase()}(s) and ALL their children
                                                      </p>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Option 4 & 5: Specific Entity Names */}
                                          {(permission.edit_type === 'specific_entity_and_children' || permission.edit_type === 'specific_entities_only') && (
                                            <div className="col-12">
                                              <label className="form-label small fw-medium">
                                                2️⃣ Select Specific Entities by Name:
                                              </label>
                                              <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {getAllEntitiesForSelection().map(entity => (
                                                  <div key={`${entity.entity_type}_${entity.id}`} className="form-check mb-1">
                                                    <input
                                                      type="checkbox"
                                                      className="form-check-input"
                                                      checked={permission.entity_names?.includes(`${entity.entity_type}_${entity.id}`)}
                                                      onChange={(e) => {
                                                        const current = permission.entity_names || [];
                                                        const entityKey = `${entity.entity_type}_${entity.id}`;
                                                        const updated = e.target.checked
                                                          ? [...current, entityKey]
                                                          : current.filter(key => key !== entityKey);
                                                        updateEditPermission(permission.id, 'entity_names', updated);
                                                      }}
                                                    />
                                                    <label className="form-check-label small">{entity.full_name}</label>
                                                  </div>
                                                ))}
                                              </div>
                                              {permission.entity_names?.length > 0 && (
                                                <div className="alert alert-warning py-2 mt-2">
                                                  <p className="mb-0 small">
                                                    ✅ Selected {permission.entity_names.length} specific entities {permission.edit_type === 'specific_entity_and_children' ? '(including their children)' : '(entities only)'}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verify Permissions & Preview */}
                        {/* Verify Permissions & Preview */}
                        {/* Verify Permissions & Preview */}
                        <div className="col-12">
                          <h5 className="border-bottom pb-2">Verify & Preview</h5>

                          {/* Verify Permissions */}
                          <div className="mt-3">
                            <h6 className="fw-medium mb-3">Verify Permissions</h6>

                            <div className="row g-3">
                              {/* Option 1: Global Access */}
                              <div className="col-12">
                                <div className="form-check mb-2">
                                  <input
                                    type="radio"
                                    name="verify_type"
                                    value="global"
                                    checked={roleForm.verify_permissions.type === 'global'}
                                    onChange={(e) => setRoleForm({
                                      ...roleForm,
                                      verify_permissions: {
                                        type: 'global',
                                        global: true,
                                        parent_entities: [],
                                        selected_levels: []
                                      }
                                    })}
                                    className="form-check-input"
                                    id="verify_global"
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="verify_global">
                                    <span className="text-danger">🌍 1. Global Access</span>
                                    <div className="text-muted small">Can verify any content anywhere in the system</div>
                                  </label>
                                </div>
                              </div>

                              {/* Option 2: Specific Entity's Child */}
                              <div className="col-12">
                                <div className="form-check mb-2">
                                  <input
                                    type="radio"
                                    name="verify_type"
                                    value="entity_children"
                                    checked={roleForm.verify_permissions.type === 'entity_children'}
                                    onChange={(e) => setRoleForm({
                                      ...roleForm,
                                      verify_permissions: {
                                        type: 'entity_children',
                                        global: false,
                                        parent_entities: [],
                                        selected_levels: []
                                      }
                                    })}
                                    className="form-check-input"
                                    id="verify_entity_children"
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="verify_entity_children">
                                    <span className="text-warning">🔗 2. Specific Entity's Child</span>
                                    <div className="text-muted small">Can verify all children of selected parent entities</div>
                                  </label>
                                </div>

                                {/* Show entity selection for option 2 */}
                                {roleForm.verify_permissions.type === 'entity_children' && (
                                  <div className="ms-4 mt-3">
                                    <div className="card bg-warning bg-opacity-10 border-warning">
                                      <div className="card-body">
                                        <h6 className="card-title text-warning mb-3">Select Parent Entities</h6>

                                        {Object.entries(entities).map(([entityType, entityList]) => (
                                          <div key={entityType} className="mb-3">
                                            <div className="fw-medium text-warning mb-2">{entityType} Level:</div>
                                            <div className="border rounded p-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                              {entityList?.map(entity => (
                                                <div key={`verify_parent_${entity.id}`} className="form-check mb-1">
                                                  <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={roleForm.verify_permissions.parent_entities?.some(
                                                      e => e.entity_id === entity.id
                                                    )}
                                                    onChange={(e) => {
                                                      const current = roleForm.verify_permissions.parent_entities || [];
                                                      const updated = e.target.checked
                                                        ? [...current, { entity_type: entityType, entity_id: entity.id, entity_name: entity.name }]
                                                        : current.filter(e => e.entity_id !== entity.id);
                                                      setRoleForm({
                                                        ...roleForm,
                                                        verify_permissions: {
                                                          ...roleForm.verify_permissions,
                                                          parent_entities: updated
                                                        }
                                                      });
                                                    }}
                                                  />
                                                  <label className="form-check-label small">{entity.name}</label>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}

                                        {roleForm.verify_permissions.parent_entities?.length > 0 && (
                                          <div className="alert alert-warning py-2 mt-2">
                                            <div className="small fw-medium mb-1">✅ Selected Parent Entities:</div>
                                            <div className="small">
                                              {roleForm.verify_permissions.parent_entities.map(entity =>
                                                `${entity.entity_name} (${entity.entity_type})`
                                              ).join(', ')}
                                            </div>
                                            <div className="small text-warning mt-1">
                                              <strong>Can verify:</strong> All children content under these entities
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Option 3: Specific Entity Levels' Children */}
                              <div className="col-12">
                                <div className="form-check mb-2">
                                  <input
                                    type="radio"
                                    name="verify_type"
                                    value="specific_levels_children"
                                    checked={roleForm.verify_permissions.type === 'specific_levels_children'}
                                    onChange={(e) => setRoleForm({
                                      ...roleForm,
                                      verify_permissions: {
                                        type: 'specific_levels_children',
                                        global: false,
                                        parent_entities: [],
                                        selected_levels: []
                                      }
                                    })}
                                    className="form-check-input"
                                    id="verify_specific_levels_children"
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="verify_specific_levels_children">
                                    <span className="text-success">📊 3. Specific Entity Levels' Children</span>
                                    <div className="text-muted small">Can verify children of entities at selected levels (Vertical, Projects, Centers, etc.)</div>
                                  </label>
                                </div>

                                {/* Show level selection for option 3 */}
                                {roleForm.verify_permissions.type === 'specific_levels_children' && (
                                  <div className="ms-4 mt-3">
                                    <div className="card bg-success bg-opacity-10 border-success">
                                      <div className="card-body">
                                        <h6 className="card-title text-success mb-3">Select Entity Levels</h6>

                                        <div className="row g-2">
                                          {['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'].map(level => (
                                            <div key={`verify_level_${level}`} className="col-6">
                                              <div className="form-check">
                                                <input
                                                  type="checkbox"
                                                  className="form-check-input"
                                                  checked={roleForm.verify_permissions.selected_levels?.includes(level)}
                                                  onChange={(e) => {
                                                    const current = roleForm.verify_permissions.selected_levels || [];
                                                    const updated = e.target.checked
                                                      ? [...current, level]
                                                      : current.filter(l => l !== level);
                                                    setRoleForm({
                                                      ...roleForm,
                                                      verify_permissions: {
                                                        ...roleForm.verify_permissions,
                                                        selected_levels: updated
                                                      }
                                                    });
                                                  }}
                                                  id={`verify_level_checkbox_${level}`}
                                                />
                                                <label className="form-check-label small fw-medium" htmlFor={`verify_level_checkbox_${level}`}>
                                                  {level}
                                                </label>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {roleForm.verify_permissions.selected_levels?.length > 0 && (
                                          <div className="alert alert-success py-2 mt-3">
                                            <div className="small fw-medium mb-1">✅ Selected Entity Levels:</div>
                                            <div className="small mb-2">
                                              <strong>{roleForm.verify_permissions.selected_levels.join(', ')}</strong>
                                            </div>
                                            <div className="small text-success">
                                              <strong>Can verify:</strong> All children of entities at these levels
                                            </div>

                                            {/* Show examples */}
                                            <div className="mt-2 p-2 bg-white rounded border">
                                              <div className="small fw-medium text-dark mb-1">Examples:</div>
                                              {roleForm.verify_permissions.selected_levels.includes('VERTICAL') && (
                                                <div className="small text-muted">• VERTICAL → Can verify all Projects, Centers, Courses, Batches under any vertical</div>
                                              )}
                                              {roleForm.verify_permissions.selected_levels.includes('PROJECT') && (
                                                <div className="small text-muted">• PROJECT → Can verify all Centers, Courses, Batches under any project</div>
                                              )}
                                              {roleForm.verify_permissions.selected_levels.includes('CENTER') && (
                                                <div className="small text-muted">• CENTER → Can verify all Courses, Batches under any center</div>
                                              )}
                                              {roleForm.verify_permissions.selected_levels.includes('COURSE') && (
                                                <div className="small text-muted">• COURSE → Can verify all Batches under any course</div>
                                              )}
                                              {roleForm.verify_permissions.selected_levels.includes('BATCH') && (
                                                <div className="small text-muted">• BATCH → Can verify batch-level content</div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer - Fixed */}
                <div className="modal-footer flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddUser(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
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