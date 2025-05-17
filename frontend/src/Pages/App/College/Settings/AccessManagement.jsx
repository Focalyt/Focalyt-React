import React, { useState } from 'react';
import { 
  Users, Shield, CheckSquare, Layers, UserPlus, Edit, Trash2, Copy, 
  Search, Filter, Plus, AlertTriangle, Building, BookOpen, X, Save
} from 'lucide-react';

const AccessManagementSystem = () => {
  // ------- STATE MANAGEMENT -------
  // Tab state
  const [activeTab, setActiveTab] = useState('roles');
  
  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // Editing states
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {}
  });
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    designation: '',
    mobile: ''
  });
  
  // Context permission states
  const [contextType, setContextType] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [userContextPerms, setUserContextPerms] = useState({});
  
  // Sample data
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', description: 'Full system access', usersCount: 2, lastModified: '2025-05-10' },
    { id: 2, name: 'Instructor', description: 'Can manage courses and content', usersCount: 5, lastModified: '2025-05-08' },
    { id: 3, name: 'Center Manager', description: 'Can manage center operations', usersCount: 3, lastModified: '2025-05-05' },
    { id: 4, name: 'Student Coordinator', description: 'Can manage student data', usersCount: 4, lastModified: '2025-05-01' }
  ]);
  
  const [users, setUsers] = useState([
    { id: 1, name: 'Vikram Singh', email: 'vikram@example.com', role: 'Admin', lastActive: '2025-05-13', hasCustomPerms: false },
    { id: 2, name: 'Priya Sharma', email: 'priya@example.com', role: 'Instructor', lastActive: '2025-05-12', hasCustomPerms: true },
    { id: 3, name: 'Rahul Patel', email: 'rahul@example.com', role: 'Center Manager', lastActive: '2025-05-11', hasCustomPerms: true },
    { id: 4, name: 'Meera Kapoor', email: 'meera@example.com', role: 'Student Coordinator', lastActive: '2025-05-10', hasCustomPerms: false }
  ]);
  
  const [centers, setCenters] = useState([
    { id: 1, name: 'Chandigarh Center', location: 'Chandigarh' },
    { id: 2, name: 'Delhi Center', location: 'New Delhi' },
    { id: 3, name: 'Mumbai Center', location: 'Mumbai' },
    { id: 4, name: 'Bangalore Center', location: 'Bangalore' }
  ]);
  
  const [courses, setCourses] = useState([
    { id: 1, name: 'Web Development', duration: '3 months' },
    { id: 2, name: 'Data Science', duration: '4 months' },
    { id: 3, name: 'Digital Marketing', duration: '2 months' },
    { id: 4, name: 'UI/UX Design', duration: '3 months' }
  ]);
  
  // Permission definitions
  const permissionCategories = [
    {
      name: 'User Management',
      permissions: [
        { key: 'VIEW_USERS', description: 'Can view users' },
        { key: 'CREATE_USER', description: 'Can create users' },
        { key: 'EDIT_USER', description: 'Can edit user details' },
        { key: 'DELETE_USER', description: 'Can delete users' }
      ]
    },
    {
      name: 'Role Management',
      permissions: [
        { key: 'VIEW_ROLES', description: 'Can view roles' },
        { key: 'CREATE_ROLE', description: 'Can create roles' },
        { key: 'EDIT_ROLE', description: 'Can edit roles' },
        { key: 'DELETE_ROLE', description: 'Can delete roles' }
      ]
    },
    {
      name: 'Course Management',
      permissions: [
        { key: 'VIEW_COURSES', description: 'Can view courses' },
        { key: 'CREATE_COURSE', description: 'Can create courses' },
        { key: 'EDIT_COURSE', description: 'Can edit course details', contextRequired: true },
        { key: 'MANAGE_COURSE_CONTENT', description: 'Can manage course content', contextRequired: true },
        { key: 'VERIFY_DOCUMENT', description: 'Can verify course documents', contextRequired: true },
      ]
    },
    {
      name: 'Center Management',
      permissions: [
        { key: 'VIEW_CENTERS', description: 'Can view centers' },
        { key: 'CREATE_CENTER', description: 'Can create centers' },
        { key: 'MANAGE_CENTER', description: 'Can manage center operations', contextRequired: true },
        { key: 'VIEW_CENTER_ANALYTICS', description: 'Can view center analytics', contextRequired: true },
        { key: 'VIEW_LEADS_ANALYTICS', description: 'Can view Leads analytics', contextRequired: true },
        { key: 'APPROVE_CENTER', description: 'Can approve center for operations', contextRequired: true },
      ]
    },{
      name: 'Add Center',
      permissions: [
        { key: 'VIEW_CENTERS', description: 'Can view centers' },
        { key: 'CREATE_CENTER', description: 'Can create centers' },
        { key: 'MANAGE_CENTER', description: 'Can manage center operations', contextRequired: true },
        { key: 'VIEW_CENTER_ANALYTICS', description: 'Can view center analytics', contextRequired: true },
        { key: 'VIEW_LEADS_ANALYTICS', description: 'Can view Leads analytics', contextRequired: true },
        { key: 'APPROVE_CENTER', description: 'Can approve center for operations', contextRequired: true },
      ]
    }
  ];
  
  // Role permissions mapping
  const [rolePermissions, setRolePermissions] = useState({
    'Admin': ['VIEW_USERS', 'CREATE_USER', 'EDIT_USER', 'DELETE_USER', 'VIEW_ROLES', 'CREATE_ROLE', 'EDIT_ROLE', 'DELETE_ROLE', 
              'VIEW_COURSES', 'CREATE_COURSE', 'EDIT_COURSE', 'MANAGE_COURSE_CONTENT', 'VIEW_CENTERS', 'CREATE_CENTER', 'MANAGE_CENTER', 'VIEW_CENTER_ANALYTICS'],
    'Instructor': ['VIEW_USERS', 'VIEW_COURSES', 'EDIT_COURSE', 'MANAGE_COURSE_CONTENT', 'VIEW_CENTERS'],
    'Center Manager': ['VIEW_USERS', 'VIEW_COURSES', 'VIEW_CENTERS', 'MANAGE_CENTER', 'VIEW_CENTER_ANALYTICS'],
    'Student Coordinator': ['VIEW_USERS', 'VIEW_COURSES', 'VIEW_CENTERS']
  });
  
  // Context-specific permissions
  const [contextPermissions, setContextPermissions] = useState([
    { userId: 2, permKey: 'EDIT_COURSE', contextType: 'course', contextId: 1 },
    { userId: 2, permKey: 'MANAGE_COURSE_CONTENT', contextType: 'course', contextId: 1 },
    { userId: 3, permKey: 'MANAGE_CENTER', contextType: 'center', contextId: 1 },
    { userId: 3, permKey: 'VIEW_CENTER_ANALYTICS', contextType: 'center', contextId: 1 },
    { userId: 5, permKey: 'EDIT_LEAD', contextType: 'lead', contextId: 1 },
    { userId: 5, permKey: 'CONVERT_LEAD', contextType: 'lead', contextId: 2 }
  ]);
  
  // ------- HELPER FUNCTIONS -------
  
  // Get user by ID
  const getUserById = (id) => users.find(user => user.id === id);
  
  // Get permission description by key
  const getPermissionDesc = (key) => {
    for (const category of permissionCategories) {
      const permission = category.permissions.find(p => p.key === key);
      if (permission) return permission.description;
    }
    return key;
  };
  
  // Check if permission requires context
  const isContextRequired = (key) => {
    for (const category of permissionCategories) {
      const permission = category.permissions.find(p => p.key === key);
      if (permission) return permission.contextRequired || false;
    }
    return false;
  };
  
  // Get context name by type and id
  const getContextName = (type, id) => {
    if (type === 'center') {
      const center = centers.find(c => c.id.toString() === id.toString());
      return center ? center.name : id;
    } else if (type === 'course') {
      const course = courses.find(c => c.id.toString() === id.toString());
      return course ? course.name : id;
    }
    return id;
  };
  
  // ------- EVENT HANDLERS -------
  
  // Role handlers
  const handleOpenRoleModal = (role = null) => {
    if (role) {
      // Editing existing role
      setEditingRole(role);
      
      // Create permissions object based on rolePermissions
      const permissions = {};
      if (rolePermissions[role.name]) {
        rolePermissions[role.name].forEach(permKey => {
          permissions[permKey] = true;
        });
      }
      
      setRoleForm({
        name: role.name,
        description: role.description,
        permissions: permissions
      });
    } else {
      // Creating new role
      setEditingRole(null);
      setRoleForm({
        name: '',
        description: '',
        permissions: {}
      });
    }
    setShowRoleModal(true);
  };
  
  const handleCopyRole = (role) => {
    // Create permissions object based on rolePermissions
    const permissions = {};
    if (rolePermissions[role.name]) {
      rolePermissions[role.name].forEach(permKey => {
        permissions[permKey] = true;
      });
    }
    
    setRoleForm({
      name: `${role.name} (Copy)`,
      description: role.description,
      permissions: permissions
    });
    setEditingRole(null);
    setShowRoleModal(true);
  };
  
  const handleDeleteRole = (role) => {
    setItemToDelete({ type: 'role', item: role });
    setShowDeleteModal(true);
  };
  
  const handleRoleFormChange = (e) => {
    const { id, value } = e.target;
    setRoleForm({
      ...roleForm,
      [id]: value
    });
  };
  
  const handlePermissionChange = (e) => {
    const { id, checked } = e.target;
    setRoleForm({
      ...roleForm,
      permissions: {
        ...roleForm.permissions,
        [id]: checked
      }
    });
  };
  
  const handleSelectAllPermissions = (categoryName) => {
    const category = permissionCategories.find(cat => cat.name === categoryName);
    if (!category) return;
    
    const newPermissions = { ...roleForm.permissions };
    
    category.permissions.forEach(perm => {
      newPermissions[perm.key] = true;
    });
    
    setRoleForm({
      ...roleForm,
      permissions: newPermissions
    });
  };
  
  const handleSaveRole = () => {
    const currentDate = new Date().toISOString().slice(0, 10);
    const permissionsArray = Object.keys(roleForm.permissions)
      .filter(key => roleForm.permissions[key]);
    
    if (editingRole) {
      // Update existing role
      setRoles(roles.map(role => 
        role.id === editingRole.id 
          ? { ...role, name: roleForm.name, description: roleForm.description, lastModified: currentDate }
          : role
      ));
      
      // If the role name changed, update the old name in permissions
      if (editingRole.name !== roleForm.name) {
        const updatedRolePermissions = { ...rolePermissions };
        delete updatedRolePermissions[editingRole.name];
        updatedRolePermissions[roleForm.name] = permissionsArray;
        setRolePermissions(updatedRolePermissions);
        
        // Also update user roles
        setUsers(users.map(user => 
          user.role === editingRole.name 
            ? { ...user, role: roleForm.name }
            : user
        ));
      } else {
        // Just update permissions
        setRolePermissions({
          ...rolePermissions,
          [roleForm.name]: permissionsArray
        });
      }
    } else {
      // Create new role
      const newRole = {
        id: Math.max(...roles.map(r => r.id)) + 1,
        name: roleForm.name,
        description: roleForm.description,
        usersCount: 0,
        lastModified: currentDate
      };
      setRoles([...roles, newRole]);
      
      // Add role permissions
      setRolePermissions({
        ...rolePermissions,
        [roleForm.name]: permissionsArray
      });
    }
    
    // Reset form and close modal
    setRoleForm({ name: '', description: '', permissions: {} });
    setEditingRole(null);
    setShowRoleModal(false);
  };
  
  // User handlers
  const handleOpenUserModal = (user = null) => {
    if (user) {
      // Editing existing user
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation || '',
        mobile: user.mobile || ''
      });
    } else {
      // Creating new user
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        role: '',
        designation: '',
        mobile: ''
      });
    }
    setShowUserModal(true);
  };
  
  const handleDeleteUser = (user) => {
    setItemToDelete({ type: 'user', item: user });
    setShowDeleteModal(true);
  };
  
  const handleUserFormChange = (e) => {
    const { id, value } = e.target;
    setUserForm({
      ...userForm,
      [id]: value
    });
  };
  
  const handleSaveUser = () => {
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, name: userForm.name, email: userForm.email, role: userForm.role }
          : user
      ));
      
      // Update role user counts if role changed
      if (editingUser.role !== userForm.role) {
        setRoles(roles.map(role => {
          if (role.name === editingUser.role) {
            return { ...role, usersCount: Math.max(0, role.usersCount - 1) };
          } else if (role.name === userForm.role) {
            return { ...role, usersCount: role.usersCount + 1 };
          }
          return role;
        }));
      }
    } else {
      // Create new user
      const newUser = {
        id: Math.max(...users.map(u => u.id)) + 1,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        lastActive: 'Never',
        hasCustomPerms: false
      };
      setUsers([...users, newUser]);
      
      // Update role user count
      setRoles(roles.map(role => 
        role.name === userForm.role 
          ? { ...role, usersCount: role.usersCount + 1 }
          : role
      ));
    }
    
    // Reset form and close modal
    setUserForm({ name: '', email: '', role: '', designation: '', mobile: '' });
    setEditingUser(null);
    setShowUserModal(false);
  };
  
  const handleChangeUserRole = (userId, newRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Update user's role
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, role: newRole }
        : u
    ));
    
    // Update role user counts
    setRoles(roles.map(role => {
      if (role.name === user.role) {
        return { ...role, usersCount: Math.max(0, role.usersCount - 1) };
      } else if (role.name === newRole) {
        return { ...role, usersCount: role.usersCount + 1 };
      }
      return role;
    }));
  };
  
  // Context permission handlers
  const handleOpenPermissionModal = (user) => {
    setEditingUser(user);
    
    // Load user's context permissions
    const userPerms = {};
    contextPermissions
      .filter(cp => cp.userId === user.id)
      .forEach(cp => {
        if (!userPerms[cp.permKey]) {
          userPerms[cp.permKey] = [];
        }
        userPerms[cp.permKey].push({
          type: cp.contextType,
          id: cp.contextId
        });
      });
    
    setUserContextPerms(userPerms);
    setShowPermissionModal(true);
  };
  
  const handleCustomPermissionChange = (permKey, isChecked) => {
    if (isChecked && !userContextPerms[permKey]) {
      setUserContextPerms({
        ...userContextPerms,
        [permKey]: []
      });
    } else if (!isChecked) {
      const updatedPerms = { ...userContextPerms };
      delete updatedPerms[permKey];
      setUserContextPerms(updatedPerms);
    }
  };
  
  const handleAddPermissionContext = (permKey) => {
    if (!contextType || !selectedContext) return;
    
    // Check for duplicates
    const isDuplicate = userContextPerms[permKey]?.some(
      ctx => ctx.type === contextType && ctx.id === selectedContext
    );
    
    if (isDuplicate) return;
    
    // Add context to permission
    setUserContextPerms({
      ...userContextPerms,
      [permKey]: [
        ...(userContextPerms[permKey] || []),
        { type: contextType, id: selectedContext }
      ]
    });
    
    // Reset selection
    setSelectedContext('');
  };
  
  const handleRemovePermissionContext = (permKey, index) => {
    if (!userContextPerms[permKey]) return;
    
    const updatedContexts = [...userContextPerms[permKey]];
    updatedContexts.splice(index, 1);
    
    // If no contexts left, consider removing the permission key entirely
    if (updatedContexts.length === 0) {
      const updatedPerms = { ...userContextPerms };
      delete updatedPerms[permKey];
      setUserContextPerms(updatedPerms);
    } else {
      setUserContextPerms({
        ...userContextPerms,
        [permKey]: updatedContexts
      });
    }
  };
  
  const handleSaveCustomPermissions = () => {
    // Convert userContextPerms to contextPermissions format
    const newContextPerms = [];
    
    Object.keys(userContextPerms).forEach(permKey => {
      userContextPerms[permKey].forEach(context => {
        newContextPerms.push({
          userId: editingUser.id,
          permKey,
          contextType: context.type,
          contextId: context.id
        });
      });
    });
    
    // Filter out existing permissions for this user
    const otherUserPerms = contextPermissions.filter(cp => cp.userId !== editingUser.id);
    
    // Combine with new permissions
    setContextPermissions([...otherUserPerms, ...newContextPerms]);
    
    // Update user's hasCustomPerms flag
    setUsers(users.map(user => 
      user.id === editingUser.id 
        ? { ...user, hasCustomPerms: newContextPerms.length > 0 }
        : user
    ));
    
    setShowPermissionModal(false);
  };
  
  const handleResetToRoleDefaults = () => {
    // Remove all custom permissions for this user
    setContextPermissions(contextPermissions.filter(cp => cp.userId !== editingUser.id));
    
    // Update user's hasCustomPerms flag
    setUsers(users.map(user => 
      user.id === editingUser.id 
        ? { ...user, hasCustomPerms: false }
        : user
    ));
    
    setUserContextPerms({});
    setShowPermissionModal(false);
  };
  
  // Delete confirmation handler
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'role') {
      const roleToDelete = itemToDelete.item;
      
      // Remove role from rolePermissions
      const updatedRolePermissions = { ...rolePermissions };
      delete updatedRolePermissions[roleToDelete.name];
      setRolePermissions(updatedRolePermissions);
      
      // Remove role from roles array
      setRoles(roles.filter(role => role.id !== roleToDelete.id));
      
      // Update users with this role to have no role
      setUsers(users.map(user => 
        user.role === roleToDelete.name 
          ? { ...user, role: '' }
          : user
      ));
    } else if (itemToDelete.type === 'user') {
      const userToDelete = itemToDelete.item;
      
      // Remove user from users array
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      // Update role user count
      setRoles(roles.map(role => 
        role.name === userToDelete.role 
          ? { ...role, usersCount: Math.max(0, role.usersCount - 1) }
          : role
      ));
      
      // Remove user's context permissions
      setContextPermissions(contextPermissions.filter(cp => cp.userId !== userToDelete.id));
    }
    
    setItemToDelete(null);
    setShowDeleteModal(false);
  };
  
  // ------- RENDER FUNCTIONS -------
  
  // Render roles tab
  const renderRolesTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-semibold">Role Management</h1>
        <button
          className="btn btn-primary d-flex align-items-center"
          onClick={() => handleOpenRoleModal()}
        >
          <Plus className="me-2" size={16} />
          Create Role
        </button>
      </div>
      
      {/* Search and filter */}
      <div className="d-flex align-items-center mb-4">
        <div className="position-relative flex-grow-1">
          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
            <Search className="text-secondary" size={20} />
          </div>
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search roles"
          />
        </div>
        <button className="btn btn-outline-secondary ms-3 d-flex align-items-center">
          <Filter className="me-2" size={16} />
          Filter
        </button>
      </div>
      
      {/* Roles table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Users</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-3 text-primary" style={{ width: "32px", height: "32px" }}>
                        <Shield size={16} />
                      </div>
                      <div className="ms-3">
                        <div className="fw-medium">{role.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-secondary">{role.description}</td>
                  <td>{role.usersCount} users</td>
                  <td className="text-secondary">{role.lastModified}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-link text-primary p-0 border-0"
                        onClick={() => handleOpenRoleModal(role)}
                        title="Edit role"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-link text-success p-0 border-0"
                        onClick={() => handleCopyRole(role)}
                        title="Duplicate role"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-link text-danger p-0 border-0"
                        onClick={() => handleDeleteRole(role)}
                        title="Delete role"
                      >
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
  );
  
  // Render users tab
  const renderUsersTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-semibold">User Management</h1>
        <button 
          className="btn btn-primary d-flex align-items-center" 
          onClick={() => handleOpenUserModal()}
        >
          <UserPlus className="me-2" size={16} />
          Add User
        </button>
      </div>
      
      {/* Search and filter */}
      <div className="d-flex align-items-center mb-4">
        <div className="position-relative flex-grow-1">
          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
            <Search className="text-secondary" size={20} />
          </div>
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search users"
          />
        </div>
        <button className="btn btn-outline-secondary ms-3 d-flex align-items-center">
          <Filter className="me-2" size={16} />
          Filter
        </button>
      </div>
      
      {/* Users table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded-circle text-secondary fw-semibold" style={{ width: "32px", height: "32px" }}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="ms-3">
                        <div className="fw-medium">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-secondary">{user.email}</td>
                  <td>
                    <div className="d-flex align-items-center position-relative">
                      <select 
                        className="form-select form-select-sm"
                        value={user.role}
                        onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                      >
                        <option value="">No Role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.name} disabled>{role.name}</option>
                        ))}
                      </select>
                  
                      {user.hasCustomPerms && (
                        <span className="ms-2 badge bg-warning bg-opacity-10 text-warning border-0 bg-transparent" style={{top: '-6px'}}>
                          <Shield size={16} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-secondary">{user.lastActive}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-link text-primary p-0 border-0"
                        onClick={() => handleOpenUserModal(user)}
                        title="Edit user"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-link text-warning p-0 border-0"
                        onClick={() => handleOpenPermissionModal(user)}
                        title="Custom permissions"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-link text-danger p-0 border-0"
                        onClick={() => handleDeleteUser(user)}
                        title="Delete user"
                      >
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
  );
  
  // Render permission analysis tab
  const renderAnalysisTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-semibold">Permission Analysis</h1>
      </div>
      
      {/* Permission matrix */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">Permission Matrix</h5>
          <p className="card-text text-secondary mb-0">
            See which roles have which permissions
          </p>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered mb-0">
            <thead className="table-light">
              <tr>
                <th>Permission</th>
                {roles.map(role => (
                  <th key={role.id} className="text-center">{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionCategories.map(category => (
                <React.Fragment key={category.name}>
                  <tr className="table-light">
                    <td colSpan={roles.length + 1} className="fw-medium">{category.name}</td>
                  </tr>
                  {category.permissions.map(permission => (
                    <tr key={permission.key}>
                      <td className="text-secondary">
                        {permission.description}
                        {permission.contextRequired && (
                          <span className="ms-2 bg-info bg-opacity-10 text-info">
                            Context Required
                          </span>
                        )}
                      </td>
                      {roles.map(role => (
                        <td key={role.id} className="text-center">
                          {rolePermissions[role.name]?.includes(permission.key) ? (
                            <CheckSquare className="text-success" size={20} />
                          ) : (
                            <X className="text-secondary" size={20} />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Context-specific permissions */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Context-Specific Permissions</h5>
          <p className="card-text text-secondary mb-0">
            View permissions granted for specific centers and courses
          </p>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className="nav-link active">
                <Building className="me-2" size={16} />
                Centers & Courses
              </button>
            </li>
          </ul>
          
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Permission</th>
                  <th>Context Type</th>
                  <th>Specific Item</th>
                  <th>Role Override</th>
                </tr>
              </thead>
              <tbody>
                {contextPermissions.length > 0 ? contextPermissions.map((cp, index) => {
                  const user = getUserById(cp.userId);
                  return (
                    <tr key={index}>
                      <td>{user?.name || `User ${cp.userId}`}</td>
                      <td>{getPermissionDesc(cp.permKey)}</td>
                      <td>
                        {cp.contextType === 'center' ? (
                          <span><Building size={14} className="me-1" /> Center</span>
                        ) : (
                          <span><BookOpen size={14} className="me-1" /> Course</span>
                        )}
                      </td>
                      <td>{getContextName(cp.contextType, cp.contextId)}</td>
                      <td>
                        {rolePermissions[user?.role]?.includes(cp.permKey) ? (
                          <span className=" bg-success bg-opacity-10 text-success">Same as role</span>
                        ) : (
                          <span className=" bg-warning bg-opacity-10 text-warning">Custom override</span>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="text-center py-3 text-secondary">
                      No context-specific permissions assigned
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
  
  // ------- MODALS -------
  
  // Role modal
  const renderRoleModal = () => (
    <div className="modal d-block scrollY " style={{ backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editingRole ? 'Edit Role' : 'Create New Role'}</h5>
            <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Role Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                placeholder="e.g. Course Manager"
                value={roleForm.name}
                onChange={handleRoleFormChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="description"
                rows="3"
                placeholder="Describe the role's responsibilities"
                value={roleForm.description}
                onChange={handleRoleFormChange}
              ></textarea>
            </div>
            
            {/* Permissions section */}
            <div className="mb-3">
              <h6 className="mb-3">Permissions</h6>
              
              {permissionCategories.map((category) => (
                <div key={category.name} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="fw-medium mb-0">{category.name}</h6>
                    <button 
                      className="btn btn-sm btn-link text-primary"
                      onClick={() => handleSelectAllPermissions(category.name)}
                      type="button"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="bg-light p-3 rounded mt-2">
                    {category.permissions.map((permission) => (
                      <div key={permission.key} className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={permission.key}
                          checked={roleForm.permissions[permission.key] || false}
                          onChange={handlePermissionChange}
                        />
                        <label className="form-check-label" htmlFor={permission.key}>
                          {permission.description}
                          {permission.contextRequired && (
                            <span className="ms-2  bg-info bg-opacity-10 text-info">
                              Context Required
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="alert alert-info mt-3">
                <div className="d-flex">
                  <div className="me-2">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="mb-0">
                      <strong>Context-specific permissions</strong> require assigning specific courses or centers 
                      to users. After creating the role, you can assign these contexts from the User Management tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowRoleModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveRole}
            >
              {editingRole ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // User modal
  const renderUserModal = () => (
    <div className="modal d-block scrollY" style={{ backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editingUser ? 'Edit User' : 'Create New User'}</h5>
            <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                placeholder="Full Name"
                value={userForm.name}
                onChange={handleUserFormChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                type="email"
                className="form-control"
                id="email"
                placeholder="Email"
                value={userForm.email}
                onChange={handleUserFormChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="mobile" className="form-label">Mobile Number</label>
              <input 
                type="text"
                className="form-control"
                id="mobile"
                placeholder="Mobile Number"
                value={userForm.mobile}
                onChange={handleUserFormChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="designation" className="form-label">Designation</label>
              <input
                type="text"
                className="form-control"
                id="designation"
                placeholder="Job Title"
                value={userForm.designation}
                onChange={handleUserFormChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="role" className="form-label">Role</label>
              <select
                className="form-select"
                id="role"
                value={userForm.role}
                onChange={handleUserFormChange}
              >
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
            
            {editingUser && editingUser.hasCustomPerms && (
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <AlertTriangle className="me-2" size={20} />
                <div>
                  This user has custom permissions. You can manage them by clicking on the shield icon in the user list.
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowUserModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveUser}
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Custom permissions modal
  const renderPermissionModal = () => (
    <div className="modal d-block scrollY" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto'}}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Custom Permissions: {editingUser?.name}</h5>
            <button type="button" className="btn-close" onClick={() => setShowPermissionModal(false)}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-warning d-flex align-items-center" role="alert">
              <AlertTriangle className="me-2" size={20} />
              <div>
                Custom permissions override role-based permissions. Use with caution.
              </div>
            </div>
            
            {/* Context-specific permissions section */}
            <div className="mb-3">
              {permissionCategories.map((category) => (
                <div key={category.name} className="mb-4">
                  <h6 className="fw-medium mb-2">{category.name}</h6>
                  
                  {/* Only show permissions that require context */}
                  {category.permissions
                    .filter(permission => permission.contextRequired)
                    .map((permission) => (
                      <div key={permission.key} className="mb-4 border-bottom pb-3">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`custom_${permission.key}`}
                            checked={!!userContextPerms[permission.key]}
                            onChange={(e) => handleCustomPermissionChange(permission.key, e.target.checked)}
                          />
                          <label className="form-check-label fw-medium" htmlFor={`custom_${permission.key}`}>
                            {permission.description}
                          </label>
                        </div>
                        
                        {/* Context selector */}
                        {!!userContextPerms[permission.key] && (
                          <div className="ms-4 mt-3">
                            <div className="row align-items-end">
                              <div className="col-md-4 mb-2">
                                <label className="form-label text-secondary small">Context Type</label>
                                <select 
                                  className="form-select form-select-sm"
                                  onChange={(e) => setContextType(e.target.value)}
                                  value={contextType}
                                >
                                  <option value="">Select Type</option>
                                  <option value="center">Center</option>
                                  <option value="course">Course</option>
                                </select>
                              </div>
                              <div className="col-md-5 mb-2">
                                <label className="form-label text-secondary small">Specific Item</label>
                                <select 
                                  className="form-select form-select-sm"
                                  onChange={(e) => setSelectedContext(e.target.value)}
                                  value={selectedContext}
                                  disabled={!contextType}
                                >
                                  <option value="">Select Item</option>
                                  {contextType === 'center' && centers.map(center => (
                                    <option key={center.id} value={center.id}>{center.name}</option>
                                  ))}
                                  {contextType === 'course' && courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3 mb-2">
                                <button 
                                  className="btn btn-sm btn-outline-primary w-100"
                                  onClick={() => handleAddPermissionContext(permission.key)}
                                  disabled={!contextType || !selectedContext}
                                  type="button"
                                >
                                  <Plus size={16} />
                                  Add
                                </button>
                              </div>
                            </div>
                            
                            {/* Display assigned contexts */}
                            <div className="mt-3">
                              <div className="small fw-medium mb-2 text-secondary">Assigned Contexts:</div>
                              {userContextPerms[permission.key]?.length > 0 ? (
                                <div>
                                  {userContextPerms[permission.key]?.map((context, index) => (
                                    <span key={index} className="badge bg-light text-dark me-2 mb-2 p-2">
                                      {context.type === 'center' ? <Building size={14} className="me-1" /> : <BookOpen size={14} className="me-1" />}
                                      {getContextName(context.type, context.id)}
                                      <button 
                                        className="btn-close ms-2" 
                                        style={{fontSize: '10px'}}
                                        onClick={() => handleRemovePermissionContext(permission.key, index)}
                                        type="button"
                                      ></button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted small">No contexts assigned yet</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {category.permissions.filter(p => p.contextRequired).length === 0 && (
                    <div className="text-muted">No context-specific permissions in this category</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-danger me-auto"
              onClick={handleResetToRoleDefaults}
            >
              Reset to Role Defaults
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPermissionModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveCustomPermissions}
            >
              Save Custom Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Delete confirmation modal
  const renderDeleteModal = () => (
    <div className="modal d-block scrollY" style={{ backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirm Delete</h5>
            <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.</p>
            {itemToDelete?.type === 'role' && (
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <AlertTriangle className="me-2" size={20} />
                <div>
                  Deleting this role will also remove it from all users who have it assigned.
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // ------- MAIN COMPONENT RENDER -------
  return (
    <div className="bg-light min-vh-100">
      {/* Top navigation */}
      <nav className="navbar navbar-light bg-white shadow-sm">
        <div className="container">
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex align-items-center">
              <Shield className="text-primary" size={32} />
              <span className="ms-2 fs-4 fw-semibold text-dark">Access Management System</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="container py-4">
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link d-flex align-items-center ${activeTab === 'roles' ? 'active' : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              <Shield className="me-2" size={20} />
              Roles Management
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link d-flex align-items-center ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="me-2" size={20} />
              User Management
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link d-flex align-items-center ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              <Layers className="me-2" size={20} />
              Permission Analysis
            </button>
          </li>
        </ul>
        
        {/* Tab content */}
        {activeTab === 'roles' && renderRolesTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
      </div>
      
      {/* Modals */}
      {showRoleModal && renderRoleModal()}
      {showUserModal && renderUserModal()}
      {showPermissionModal && renderPermissionModal()}
      {showDeleteModal && renderDeleteModal()}


      <style>
        {

          `
          .scrollY{
          overflow-y: scroll!important;
          }
          
          `
        }
      </style>
    </div>
  );
};

export default AccessManagementSystem;