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
    { id: 'roles', label: 'Role Management', icon: Shield },
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
    console.log('Updating edit permission:', permissionId, field, value); // Debug log
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
              <p className="text-gray-600">Manage users, roles, and analyze permissions</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  setAddMode('user');
                  setShowAddUser(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <UserPlus size={16} />
                <span>Add User</span>
              </button>
              <button 
                onClick={() => {
                  setAddMode('role');
                  setShowAddUser(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
              >
                <Plus size={16} />
                <span>Add Role</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter size={16} />
                  <span>Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download size={16} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Master Access</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.master_access === 'GLOBAL' ? 'bg-red-100 text-red-800' :
                          user.master_access === 'VERTICAL' ? 'bg-purple-100 text-purple-800' :
                          user.master_access === 'PROJECT' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.master_access}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.entity_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setAnalysisUser(user.user_id);
                            const result = analyzeUserPermissions(user.user_id);
                            setAnalysisResult(result);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permission Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Permission Analysis</h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setAnalysisView('single')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      analysisView === 'single' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Single User
                  </button>
                  <button
                    onClick={() => setAnalysisView('matrix')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      analysisView === 'matrix' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Permission Matrix
                  </button>
                </div>
              </div>

              {analysisView === 'single' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                      <select
                        value={analysisUser}
                        onChange={(e) => {
                          setAnalysisUser(e.target.value);
                          if (e.target.value) {
                            const result = analyzeUserPermissions(e.target.value);
                            setAnalysisResult(result);
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Permission Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Access Level:</span>
                              <span className="font-medium">{analysisResult.summary.access_level}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Entity Control:</span>
                              <span className="font-medium">{analysisResult.summary.entity_control}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk Level:</span>
                              <span className={`font-medium ${
                                analysisResult.summary.risk_level === 'HIGH' ? 'text-red-600' :
                                analysisResult.summary.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {analysisResult.summary.risk_level}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-3 rounded-lg ${analysisResult.summary.can_add ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className="flex items-center space-x-2">
                              {analysisResult.summary.can_add ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-red-600" size={16} />}
                              <span className="text-sm font-medium">Add Content</span>
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg ${analysisResult.summary.can_edit ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className="flex items-center space-x-2">
                              {analysisResult.summary.can_edit ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-red-600" size={16} />}
                              <span className="text-sm font-medium">Edit Content</span>
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg ${analysisResult.summary.can_verify ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className="flex items-center space-x-2">
                              {analysisResult.summary.can_verify ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-red-600" size={16} />}
                              <span className="text-sm font-medium">Verify Content</span>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-100">
                            <div className="flex items-center space-x-2">
                              <Eye className="text-blue-600" size={16} />
                              <span className="text-sm font-medium">View Access</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {analysisResult && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Detailed Permissions</h4>
                      
                      <div className="space-y-3">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">View Access</h5>
                          <p className="text-sm text-blue-800">{analysisResult.permissions.view_access.description}</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h5 className="font-medium text-green-900 mb-2">Add Permissions</h5>
                          <p className="text-sm text-green-800">{analysisResult.permissions.add_permissions}</p>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h5 className="font-medium text-yellow-900 mb-2">Edit Permissions</h5>
                          <p className="text-sm text-yellow-800">{analysisResult.permissions.edit_permissions}</p>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <h5 className="font-medium text-purple-900 mb-2">Verify Permissions</h5>
                          <p className="text-sm text-purple-800">{analysisResult.permissions.verify_permissions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {analysisView === 'matrix' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Overall Permission Matrix</h4>
                    <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Download size={16} />
                      <span>Export Matrix</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">User</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Role</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Master Level</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider border-r">Global View</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider border-r">Add Project</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider border-r">Add Center</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider border-r">Add Course</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider border-r">Add Batch</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-yellow-600 uppercase tracking-wider border-r">Edit Vertical</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-yellow-600 uppercase tracking-wider border-r">Edit Project</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-yellow-600 uppercase tracking-wider border-r">Edit Center</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider border-r">Verify</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-red-600 uppercase tracking-wider">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {generatePermissionMatrix().map((user, index) => (
                          <tr key={user.user_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 border-r">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.entity_name}</div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.master_access === 'GLOBAL' ? 'bg-red-100 text-red-800' :
                                user.master_access === 'VERTICAL' ? 'bg-purple-100 text-purple-800' :
                                user.master_access === 'PROJECT' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.master_access}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_view_global ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_add_project ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_add_center ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_add_course ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_add_batch ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_edit_vertical ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_edit_project ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_edit_center ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center border-r">
                              {user.can_verify_content ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.risk_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                                user.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {user.risk_level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Legend</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Permission Granted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Permission Denied</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-red-100 rounded-full"></span>
                        <span>High Risk</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-green-100 rounded-full"></span>
                        <span>Low Risk</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Role Management Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Roles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div key={role} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{role.replace('_', ' ')}</h4>
                      <Shield className="text-gray-400" size={16} />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{roleDescriptions[role]}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Master Level: <span className="font-medium">{getMasterAccessLevel(role)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Add User/Role Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl mx-4 my-8 flex flex-col" style={{maxHeight: '85vh'}}>
            {/* Modal Header - Fixed */}
            <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg flex-shrink-0">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {addMode === 'user' ? 'Add New User' : 'Create New Role'}
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setAddMode('user')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      addMode === 'user' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Add User
                  </button>
                  <button
                    onClick={() => setAddMode('role')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      addMode === 'role' 
                        ? 'bg-white text-green-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Create Role
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content - Single Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {addMode === 'user' ? (
                /* User Form */
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    {userForm.role && userForm.role !== 'SUPER_ADMIN' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                        <select
                          value={userForm.entity_type}
                          onChange={(e) => setUserForm({...userForm, entity_type: e.target.value, entity_id: ''})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Entity Type</option>
                          {Object.keys(entities).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {userForm.entity_type && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {userForm.role === 'REGIONAL_MANAGER' ? 'Select Multiple Entities' : 'Select Entity'}
                        </label>
                        {userForm.role === 'REGIONAL_MANAGER' ? (
                          <div className="grid grid-cols-2 gap-2 border border-gray-300 rounded-lg p-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                            {entities[userForm.entity_type]?.map(entity => (
                              <label key={entity.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={userForm.multiple_entities.includes(entity.id)}
                                  onChange={(e) => {
                                    const updated = e.target.checked
                                      ? [...userForm.multiple_entities, entity.id]
                                      : userForm.multiple_entities.filter(id => id !== entity.id);
                                    setUserForm({...userForm, multiple_entities: updated});
                                  }}
                                  className="text-blue-600"
                                />
                                <span className="text-sm">{entity.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <select
                            value={userForm.entity_id}
                            onChange={(e) => setUserForm({...userForm, entity_id: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                        <input
                          type="text"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                          placeholder="e.g., Regional Supervisor"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={roleForm.description}
                          onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                          placeholder="Describe the role's responsibilities..."
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* View Access Configuration */}
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">View Access</h5>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="view_access_type"
                              value="GLOBAL"
                              checked={roleForm.view_access_type === 'GLOBAL'}
                              onChange={(e) => setRoleForm({...roleForm, view_access_type: e.target.value, master_level: 'GLOBAL', specific_entities: []})}
                              className="text-blue-600"
                            />
                            <span className="text-sm">Global Access</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="view_access_type"
                              value="SPECIFIC"
                              checked={roleForm.view_access_type === 'SPECIFIC'}
                              onChange={(e) => setRoleForm({...roleForm, view_access_type: e.target.value, specific_entities: []})}
                              className="text-blue-600"
                            />
                            <span className="text-sm">Specific Entity Access</span>
                          </label>
                        </div>

                        {roleForm.view_access_type === 'SPECIFIC' && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Master Access Level</label>
                              <select
                                value={roleForm.master_level}
                                onChange={(e) => setRoleForm({...roleForm, master_level: e.target.value, specific_entities: []})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select Master Level</option>
                                <option value="VERTICAL">Vertical Level</option>
                                <option value="PROJECT">Project Level</option>
                                <option value="CENTER">Center Level</option>
                                <option value="COURSE">Course Level</option>
                                <option value="BATCH">Batch Level</option>
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                Master level determines action scope. Parent hierarchy will be read-only.
                              </p>
                            </div>

                            {roleForm.master_level && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Select {roleForm.master_level} Entities (Multiple Selection)
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                  {entities[roleForm.master_level]?.map(entity => (
                                    <label key={entity.id} className="flex items-center space-x-2 mb-1">
                                      <input
                                        type="checkbox"
                                        checked={roleForm.specific_entities?.includes(entity.id)}
                                        onChange={(e) => {
                                          const current = roleForm.specific_entities || [];
                                          const updated = e.target.checked
                                            ? [...current, entity.id]
                                            : current.filter(id => id !== entity.id);
                                          setRoleForm({...roleForm, specific_entities: updated});
                                        }}
                                        className="text-blue-600"
                                      />
                                      <span className="text-sm">{entity.name}</span>
                                    </label>
                                  ))}
                                </div>
                                {roleForm.specific_entities?.length > 0 && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Selected: {roleForm.specific_entities.length} {roleForm.master_level.toLowerCase()}(s)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* IMPROVED Add Permissions Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Add Permissions</h4>

                      <div className="space-y-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.add_permissions.global}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              add_permissions: {
                                ...roleForm.add_permissions, 
                                global: e.target.checked,
                                specific_permissions: e.target.checked ? [] : roleForm.add_permissions.specific_permissions
                              }
                            })}
                            className="text-blue-600"
                          />
                          <span className="text-sm font-medium">🌍 Global Add Permission</span>
                        </label>

                        {!roleForm.add_permissions.global && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                              <h6 className="text-sm font-medium text-gray-800">Specific Add Permissions</h6>
                              <button
                                type="button"
                                onClick={addNewAddPermission}
                                disabled={!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC'}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                + Add Permission
                              </button>
                            </div>

                            {(!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC') && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                                <p className="text-sm text-yellow-800">
                                  ⚠️ Please select Master Access Level in View Access section first
                                </p>
                              </div>
                            )}

                            {roleForm.add_permissions.specific_permissions.length === 0 && roleForm.master_level && (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                No specific add permissions configured. Click "Add Permission" to start.
                              </div>
                            )}

                            {/* Individual Add Permission Configurations */}
                            {roleForm.add_permissions.specific_permissions.map((permission, index) => (
                              <div key={permission.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-white">
                                <div className="flex justify-between items-center mb-3">
                                  <h6 className="text-sm font-medium text-blue-800">Permission #{index + 1}</h6>
                                  <button
                                    type="button"
                                    onClick={() => removeAddPermission(permission.id)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>

                                {/* Step 1: Select Permission Level */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      1️⃣ At which level do you want to grant add permissions?
                                    </label>
                                    <select
                                      value={permission.permission_level || ''}
                                      onChange={(e) => updateAddPermission(permission.id, 'permission_level', e.target.value)}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="">Select Level</option>
                                      {getAllowedAddLevels().map(level => (
                                        <option key={level} value={level}>
                                          {level} Level
                                        </option>
                                      ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                      You can only select levels up to your view access level ({roleForm.master_level || 'None'})
                                    </p>
                                  </div>

                                  {/* Step 2: Select Specific Entities */}
                                  {permission.permission_level && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        2️⃣ Select specific {permission.permission_level.toLowerCase()}(s) where they can add content:
                                      </label>
                                      
                                      {/* Show context of selected parent entities */}
                                      {permission.permission_level !== roleForm.master_level && roleForm.specific_entities?.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                                          <div className="text-xs font-medium text-blue-800 mb-1">
                                            📋 Based on your selected {roleForm.master_level.toLowerCase()}(s):
                                          </div>
                                          <div className="text-xs text-blue-700">
                                            {entities[roleForm.master_level]?.filter(entity => 
                                              roleForm.specific_entities.includes(entity.id)
                                            ).map(entity => entity.name).join(', ')}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Show available entities based on permission level and view access */}
                                      <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto">
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
                                              <div className="text-xs text-gray-500 italic p-2">
                                                {permission.permission_level === roleForm.master_level 
                                                  ? `No ${permission.permission_level.toLowerCase()} entities selected in view access`
                                                  : `No ${permission.permission_level.toLowerCase()} entities found under selected ${roleForm.master_level.toLowerCase()}(s)`
                                                }
                                              </div>
                                            );
                                          }

                                          // Group entities by parent for better organization
                                          if (permission.permission_level !== roleForm.master_level && availableEntities.length > 3) {
                                            const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
                                            const currentIndex = hierarchy.indexOf(permission.permission_level);
                                            const parentLevel = hierarchy[currentIndex - 1];
                                            
                                            // Group by immediate parent
                                            const grouped = availableEntities.reduce((acc, entity) => {
                                              const parentEntity = entities[parentLevel]?.find(p => p.id === entity.parent_id);
                                              const parentName = parentEntity?.name || 'Unknown Parent';
                                              
                                              if (!acc[parentName]) {
                                                acc[parentName] = [];
                                              }
                                              acc[parentName].push(entity);
                                              return acc;
                                            }, {});

                                            return Object.entries(grouped).map(([parentName, children]) => (
                                              <div key={parentName} className="mb-2">
                                                <div className="text-xs font-medium text-gray-600 mb-1 bg-gray-100 px-2 py-1 rounded">
                                                  📁 {parentName}
                                                </div>
                                                <div className="ml-2 space-y-1">
                                                  {children.map(entity => (
                                                    <label key={entity.id} className="flex items-center space-x-2 text-xs">
                                                      <input
                                                        type="checkbox"
                                                        checked={permission.selected_entities?.includes(entity.id)}
                                                        onChange={(e) => {
                                                          const current = permission.selected_entities || [];
                                                          const updated = e.target.checked
                                                            ? [...current, entity.id]
                                                            : current.filter(id => id !== entity.id);
                                                          updateAddPermission(permission.id, 'selected_entities', updated);
                                                        }}
                                                        className="text-blue-600"
                                                      />
                                                      <span>{entity.name}</span>
                                                    </label>
                                                  ))}
                                                </div>
                                              </div>
                                            ));
                                          }

                                          // Simple list for small numbers or same level
                                          return availableEntities.map(entity => (
                                            <label key={entity.id} className="flex items-center space-x-2 text-xs mb-1">
                                              <input
                                                type="checkbox"
                                                checked={permission.selected_entities?.includes(entity.id)}
                                                onChange={(e) => {
                                                  const current = permission.selected_entities || [];
                                                  const updated = e.target.checked
                                                    ? [...current, entity.id]
                                                    : current.filter(id => id !== entity.id);
                                                  updateAddPermission(permission.id, 'selected_entities', updated);
                                                }}
                                                className="text-blue-600"
                                              />
                                              <span>{entity.name}</span>
                                              {/* Show parent context for nested children */}
                                              {entity.parent_id && permission.permission_level !== roleForm.master_level && availableEntities.length <= 3 && (() => {
                                                // Find the parent entity name
                                                const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
                                                const currentIndex = hierarchy.indexOf(permission.permission_level);
                                                const parentLevel = hierarchy[currentIndex - 1];
                                                const parentEntity = entities[parentLevel]?.find(p => p.id === entity.parent_id);
                                                
                                                return (
                                                  <span className="text-gray-400 text-xs ml-1">
                                                    (under {parentEntity?.name || 'parent'})
                                                  </span>
                                                );
                                              })()}
                                            </label>
                                          ));
                                        })()}
                                      </div>
                                      
                                      {permission.selected_entities?.length > 0 && (
                                        <p className="text-xs text-green-600 mt-1">
                                          ✅ Selected: {permission.selected_entities.length} {permission.permission_level.toLowerCase()}(s)
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Step 3: What can they add */}
                                  {permission.permission_level && permission.selected_entities?.length > 0 && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        3️⃣ What can they add in the selected {permission.permission_level.toLowerCase()}(s)?
                                      </label>
                                      
                                      <div className="grid grid-cols-2 gap-2">
                                        {getChildEntityTypes(permission.permission_level).map(childType => (
                                          <label key={childType} className="flex items-center space-x-2 text-xs">
                                            <input
                                              type="checkbox"
                                              checked={permission.can_add_types?.includes(childType)}
                                              onChange={(e) => {
                                                const current = permission.can_add_types || [];
                                                const updated = e.target.checked
                                                  ? [...current, childType]
                                                  : current.filter(type => type !== childType);
                                                updateAddPermission(permission.id, 'can_add_types', updated);
                                              }}
                                              className="text-green-600"
                                            />
                                            <span>Add {childType}</span>
                                          </label>
                                        ))}
                                      </div>

                                      {getChildEntityTypes(permission.permission_level).length === 0 && (
                                        <div className="text-xs text-gray-500 italic p-2 bg-gray-100 rounded">
                                          ⚠️ No child entities can be added at {permission.permission_level} level
                                        </div>
                                      )}

                                      {permission.can_add_types?.length > 0 && (
                                        <div className="mt-2 p-2 bg-green-50 rounded">
                                          <p className="text-xs text-green-800">
                                            ✅ Can add: {permission.can_add_types.join(', ')} in {permission.selected_entities.length} selected {permission.permission_level.toLowerCase()}(s)
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Edit Permissions */}
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-800 mb-2">Edit Permissions</h5>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={roleForm.edit_permissions.global}
                              onChange={(e) => setRoleForm({
                                ...roleForm,
                                edit_permissions: {
                                  ...roleForm.edit_permissions, 
                                  global: e.target.checked,
                                  specific_permissions: e.target.checked ? [] : roleForm.edit_permissions.specific_permissions
                                }
                              })}
                              className="text-blue-600"
                            />
                            <span className="text-sm font-medium">🌍 Global Edit Permission</span>
                          </label>

                          {!roleForm.edit_permissions.global && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-3">
                                <h6 className="text-sm font-medium text-gray-800">Specific Edit Permissions</h6>
                                <button
                                  type="button"
                                  onClick={addNewEditPermission}
                                  disabled={!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC'}
                                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  + Add Edit Permission
                                </button>
                              </div>

                              {(!roleForm.master_level || roleForm.view_access_type !== 'SPECIFIC') && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                                  <p className="text-sm text-yellow-800">
                                    ⚠️ Please select Master Access Level in View Access section first
                                  </p>
                                </div>
                              )}

                              {roleForm.edit_permissions.specific_permissions.length === 0 && roleForm.master_level && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  No specific edit permissions configured. Click "Add Edit Permission" to start.
                                </div>
                              )}

                              {/* Individual Edit Permission Configurations */}
                              {roleForm.edit_permissions.specific_permissions.map((permission, index) => (
                                <div key={permission.id} className="border border-gray-200 rounded-lg p-3 mb-3 bg-white">
                                  <div className="flex justify-between items-center mb-3">
                                    <h6 className="text-sm font-medium text-yellow-800">Edit Permission #{index + 1}</h6>
                                    <button
                                      type="button"
                                      onClick={() => removeEditPermission(permission.id)}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  {/* Step 1: Select Edit Type */}
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-2">
                                        1️⃣ What type of edit permission?
                                      </label>
                                      
                                      {/* Using radio buttons instead of dropdown for better debugging */}
                                      <div className="space-y-2">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`edit_type_${permission.id}`}
                                            value="particular_entity"
                                            checked={permission.edit_type === 'particular_entity'}
                                            onChange={(e) => {
                                              console.log('Radio changed:', e.target.value); // Debug
                                              updateEditPermission(permission.id, 'edit_type', e.target.value);
                                              // Reset other fields when edit type changes
                                              updateEditPermission(permission.id, 'permission_level', '');
                                              updateEditPermission(permission.id, 'selected_entities', []);
                                            }}
                                            className="text-yellow-600"
                                          />
                                          <span className="text-sm">📝 Particular Entity Edit</span>
                                        </label>
                                        
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`edit_type_${permission.id}`}
                                            value="parent_child_specific"
                                            checked={permission.edit_type === 'parent_child_specific'}
                                            onChange={(e) => {
                                              console.log('Radio changed:', e.target.value); // Debug
                                              updateEditPermission(permission.id, 'edit_type', e.target.value);
                                              updateEditPermission(permission.id, 'permission_level', '');
                                              updateEditPermission(permission.id, 'selected_entities', []);
                                            }}
                                            className="text-yellow-600"
                                          />
                                          <span className="text-sm">🔗 Parent-Child Specific Edit</span>
                                        </label>
                                        
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`edit_type_${permission.id}`}
                                            value="full_parent_access"
                                            checked={permission.edit_type === 'full_parent_access'}
                                            onChange={(e) => {
                                              console.log('Radio changed:', e.target.value); // Debug
                                              updateEditPermission(permission.id, 'edit_type', e.target.value);
                                              updateEditPermission(permission.id, 'permission_level', '');
                                              updateEditPermission(permission.id, 'selected_entities', []);
                                            }}
                                            className="text-yellow-600"
                                          />
                                          <span className="text-sm">🏢 Full Parent Access Edit</span>
                                        </label>
                                        
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`edit_type_${permission.id}`}
                                            value="details_only"
                                            checked={permission.edit_type === 'details_only'}
                                            onChange={(e) => {
                                              console.log('Radio changed:', e.target.value); // Debug
                                              updateEditPermission(permission.id, 'edit_type', e.target.value);
                                              updateEditPermission(permission.id, 'permission_level', '');
                                              updateEditPermission(permission.id, 'selected_entities', []);
                                            }}
                                            className="text-yellow-600"
                                          />
                                          <span className="text-sm">📋 Details Only Edit</span>
                                        </label>
                                      </div>
                                      
                                      <div className="text-xs text-gray-500 mt-2">
                                        {permission.edit_type === 'particular_entity' && '📝 Edit specific entities only'}
                                        {permission.edit_type === 'parent_child_specific' && '🔗 Edit specific children within parent entities'}
                                        {permission.edit_type === 'full_parent_access' && '🏢 Edit everything within selected parent entities'}
                                        {permission.edit_type === 'details_only' && '📋 Edit entity details only, not nested content'}
                                      </div>
                                    </div>

                                    {/* Step 2: Select Entity Level */}
                                    {permission.edit_type && (
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          2️⃣ At which entity level?
                                        </label>
                                        <select
                                          value={permission.permission_level || ''}
                                          onChange={(e) => {
                                            console.log('Level dropdown changed:', e.target.value); // Debug
                                            updateEditPermission(permission.id, 'permission_level', e.target.value);
                                            updateEditPermission(permission.id, 'selected_entities', []);
                                          }}
                                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                        >
                                          <option value="">Select Entity Level</option>
                                          {getAllowedAddLevels().map(level => (
                                            <option key={level} value={level}>
                                              {level} Level
                                            </option>
                                          ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Available levels based on your view access ({roleForm.master_level || 'None'})
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                          Debug: Selected edit type = {permission.edit_type}
                                        </p>
                                      </div>
                                    )}

                                    {/* Step 3: Select Specific Entities */}
                                    {permission.edit_type && permission.permission_level && (
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          3️⃣ Select specific {permission.permission_level.toLowerCase()}(s):
                                        </label>
                                        
                                        {/* Show context of selected parent entities */}
                                        {permission.permission_level !== roleForm.master_level && roleForm.specific_entities?.length > 0 && (
                                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                                            <div className="text-xs font-medium text-yellow-800 mb-1">
                                              📋 Based on your selected {roleForm.master_level.toLowerCase()}(s):
                                            </div>
                                            <div className="text-xs text-yellow-700">
                                              {entities[roleForm.master_level]?.filter(entity => 
                                                roleForm.specific_entities.includes(entity.id)
                                              ).map(entity => entity.name).join(', ')}
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto">
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
                                                <div className="text-xs text-gray-500 italic p-2">
                                                  {permission.permission_level === roleForm.master_level 
                                                    ? `No ${permission.permission_level.toLowerCase()} entities selected in view access`
                                                    : `No ${permission.permission_level.toLowerCase()} entities found under selected ${roleForm.master_level.toLowerCase()}(s)`
                                                  }
                                                </div>
                                              );
                                            }

                                            // Group entities by parent for better organization
                                            if (permission.permission_level !== roleForm.master_level && availableEntities.length > 3) {
                                              const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
                                              const currentIndex = hierarchy.indexOf(permission.permission_level);
                                              const parentLevel = hierarchy[currentIndex - 1];
                                              
                                              // Group by immediate parent
                                              const grouped = availableEntities.reduce((acc, entity) => {
                                                const parentEntity = entities[parentLevel]?.find(p => p.id === entity.parent_id);
                                                const parentName = parentEntity?.name || 'Unknown Parent';
                                                
                                                if (!acc[parentName]) {
                                                  acc[parentName] = [];
                                                }
                                                acc[parentName].push(entity);
                                                return acc;
                                              }, {});

                                              return Object.entries(grouped).map(([parentName, children]) => (
                                                <div key={parentName} className="mb-2">
                                                  <div className="text-xs font-medium text-gray-600 mb-1 bg-gray-100 px-2 py-1 rounded">
                                                    📁 {parentName}
                                                  </div>
                                                  <div className="ml-2 space-y-1">
                                                    {children.map(entity => (
                                                      <label key={entity.id} className="flex items-center space-x-2 text-xs">
                                                        <input
                                                          type="checkbox"
                                                          checked={permission.selected_entities?.includes(entity.id)}
                                                          onChange={(e) => {
                                                            const current = permission.selected_entities || [];
                                                            const updated = e.target.checked
                                                              ? [...current, entity.id]
                                                              : current.filter(id => id !== entity.id);
                                                            updateEditPermission(permission.id, 'selected_entities', updated);
                                                          }}
                                                          className="text-yellow-600"
                                                        />
                                                        <span>{entity.name}</span>
                                                      </label>
                                                    ))}
                                                  </div>
                                                </div>
                                              ));
                                            }

                                            // Simple list for small numbers or same level
                                            return availableEntities.map(entity => (
                                              <label key={entity.id} className="flex items-center space-x-2 text-xs mb-1">
                                                <input
                                                  type="checkbox"
                                                  checked={permission.selected_entities?.includes(entity.id)}
                                                  onChange={(e) => {
                                                    const current = permission.selected_entities || [];
                                                    const updated = e.target.checked
                                                      ? [...current, entity.id]
                                                      : current.filter(id => id !== entity.id);
                                                    updateEditPermission(permission.id, 'selected_entities', updated);
                                                  }}
                                                  className="text-yellow-600"
                                                />
                                                <span>{entity.name}</span>
                                                {/* Show parent context for nested children */}
                                                {entity.parent_id && permission.permission_level !== roleForm.master_level && availableEntities.length <= 3 && (() => {
                                                  // Find the parent entity name
                                                  const hierarchy = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
                                                  const currentIndex = hierarchy.indexOf(permission.permission_level);
                                                  const parentLevel = hierarchy[currentIndex - 1];
                                                  const parentEntity = entities[parentLevel]?.find(p => p.id === entity.parent_id);
                                                  
                                                  return (
                                                    <span className="text-gray-400 text-xs ml-1">
                                                      (under {parentEntity?.name || 'parent'})
                                                    </span>
                                                  );
                                                })()}
                                              </label>
                                            ));
                                          })()}
                                        </div>
                                        
                                        {permission.selected_entities?.length > 0 && (
                                          <div className="mt-2 p-2 bg-yellow-50 rounded">
                                            <p className="text-xs text-yellow-800">
                                              ✅ Selected: {permission.selected_entities.length} {permission.permission_level.toLowerCase()}(s) for {permission.edit_type?.replace('_', ' ')}
                                            </p>
                                          </div>
                                        )}
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

                    {/* Verify Permissions & Preview */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Verify & Preview</h4>

                      {/* Verify Permissions */}
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Verify Permissions</h5>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={roleForm.verify_permissions.global}
                              onChange={(e) => setRoleForm({
                                ...roleForm,
                                verify_permissions: {...roleForm.verify_permissions, global: e.target.checked}
                              })}
                              className="text-blue-600"
                            />
                            <span className="text-sm">Global Verify</span>
                          </label>

                          {!roleForm.verify_permissions.global && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              {/* Vertical Level Verify */}
                              <div className="mb-3">
                                <div className="text-xs font-medium text-blue-700 mb-2">Vertical Level:</div>
                                <div className="grid grid-cols-2 gap-1">
                                  {['PROJECT', 'CENTER', 'COURSE', 'BATCH'].map(type => (
                                    <label key={`verify_vertical_${type}`} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={roleForm.verify_permissions.vertical_types?.includes(type)}
                                        onChange={(e) => {
                                          const current = roleForm.verify_permissions.vertical_types || [];
                                          const updated = e.target.checked
                                            ? [...current, type]
                                            : current.filter(t => t !== type);
                                          setRoleForm({
                                            ...roleForm,
                                            verify_permissions: {...roleForm.verify_permissions, vertical_types: updated}
                                          });
                                        }}
                                        className="text-blue-600"
                                      />
                                      <span className="text-xs">{type}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Specific Entity Verify */}
                              <div className="border-t pt-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                                <div className="text-xs font-medium text-green-700 mb-2">Specific Entity Verify:</div>
                                {Object.entries(entities).map(([entityType, entityList]) => (
                                  <div key={entityType} className="mb-2">
                                    <div className="text-xs text-gray-600 mb-1 font-medium">{entityType}:</div>
                                    <div className="grid grid-cols-1 gap-1 ml-2">
                                      {entityList?.map(entity => (
                                        <label key={`verify_${entity.id}`} className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={roleForm.verify_permissions.specific_entities?.some(
                                              e => e.entity_id === entity.id
                                            )}
                                            onChange={(e) => {
                                              const current = roleForm.verify_permissions.specific_entities || [];
                                              const updated = e.target.checked
                                                ? [...current, {entity_type: entityType, entity_id: entity.id, entity_name: entity.name}]
                                                : current.filter(e => e.entity_id !== entity.id);
                                              setRoleForm({
                                                ...roleForm,
                                                verify_permissions: {...roleForm.verify_permissions, specific_entities: updated}
                                              });
                                            }}
                                            className="text-green-600"
                                          />
                                          <span className="text-xs">{entity.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Permission Preview */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border">
                        <h5 className="font-medium text-gray-800 mb-2">🔍 Permission Preview</h5>
                        <div className="text-sm space-y-2">
                          <div className="bg-white p-2 rounded border-l-4 border-blue-500">
                            <span className="font-medium text-blue-800">👁️ View:</span>
                            <div className="text-blue-700 ml-4 text-xs">
                              {roleForm.view_access_type === 'GLOBAL' 
                                ? '🌍 Complete system' 
                                : `📍 ${roleForm.master_level || 'Specific'} level + hierarchy`
                              }
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border-l-4 border-green-500">
                            <span className="font-medium text-green-800">➕ Add:</span>
                            <div className="text-green-700 ml-4 text-xs">
                              {roleForm.add_permissions.global 
                                ? '🔓 Can add anywhere'
                                : `🎯 ${roleForm.add_permissions.specific_permissions?.length || 0} permission configurations`
                              }
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border-l-4 border-yellow-500">
                            <span className="font-medium text-yellow-800">✏️ Edit:</span>
                            <div className="text-yellow-700 ml-4 text-xs">
                              {roleForm.edit_permissions.global 
                                ? '🔓 Can edit anything'
                                : `🎯 ${roleForm.edit_permissions.specific_permissions?.length || 0} edit permission configurations`
                              }
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border-l-4 border-purple-500">
                            <span className="font-medium text-purple-800">✅ Verify:</span>
                            <div className="text-purple-700 ml-4 text-xs">
                              {roleForm.verify_permissions.global 
                                ? '🔓 Can verify anything'
                                : `🎯 ${(roleForm.verify_permissions.vertical_types?.length || 0) + (roleForm.verify_permissions.specific_entities?.length || 0)} permissions`
                              }
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border-l-4 border-red-500">
                            <span className="font-medium text-red-800">⚠️ Risk:</span>
                            <div className="text-red-700 ml-4 text-xs">
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
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg flex-shrink-0">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addMode === 'user' ? handleAddUser : handleAddRole}
                disabled={addMode === 'user' 
                  ? (!userForm.name || !userForm.email || !userForm.role)
                  : (!roleForm.name || !roleForm.description)
                }
                className={`px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                  addMode === 'user' ? 'bg-blue-600' : 'bg-green-600'
                }`}
              >
                {addMode === 'user' ? 'Add User' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionAdminDashboard;