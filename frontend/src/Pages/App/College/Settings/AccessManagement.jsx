import React, { useState, useEffect } from 'react';
import axios from 'axios'
import {
  Users, Shield, CheckSquare, Layers, UserPlus, Edit, Trash2, Copy,
  Search, Filter, Plus, AlertTriangle, Building, BookOpen, X, Save,
  ChevronDown
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

  const [passwordMismatch, setPasswordMismatch] = useState(false);


  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    designation: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // Context permission states
  const [userContextPerms, setUserContextPerms] = useState({});
  const [coursesSelected, setCoursesSelected] = useState([]);
  const [centersSelected, setCentersSelected] = useState([]);
  const [projectsSelected, setProjectsSelected] = useState([]);
  const [verticalsSelected, setVerticalsSelected] = useState([]);

  // UI state for multiselect dropdowns
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sample data
  const [roles, setRoles] = useState([
  ]);

  useEffect(() => {
    fetchRoles();
    fetchRoleslist();

  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'analysis' || activeTab === 'roles') {
      fetchRoleslist();
    }
  }, [activeTab]);

  const fetchRoles = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/roles/all-roles`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        const fetchedRoles = response.data.data;

        // Set roles for table
        setRoles(fetchedRoles.map((r, index) => ({
          _id: r._id,
          id: index + 1,
          name: r.roleName,
          description: r.description,
          usersCount: 0, // You can compute actual count if needed
          lastModified: r.updatedAt?.slice(0, 10) || ''
        })));

        // Set rolePermissions
        // const rolePermMap = {};
        // fetchedRoles.forEach(role => {
        //   rolePermMap[role.roleName] = role.permissions || [];
        // });
        // setRolePermissions(rolePermMap);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch roles');
    }
  };

  const fetchRoleslist = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/roles/all-roleslist`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        const fetchedRoles = response.data.data;

        setRolePermissions(response.data.rolePermissions);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch roles');
    }
  };

  const [users, setUsers] = useState([

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

  const [projects, setProjects] = useState([
    { id: 1, name: 'ERP Implementation' },
    { id: 2, name: 'Mobile App Development' },
    { id: 3, name: 'Website Redesign' },
    { id: 4, name: 'Data Migration' }
  ]);

  const [verticals, setVerticals] = useState([
    { id: 1, name: 'Education' },
    { id: 2, name: 'Healthcare' },
    { id: 3, name: 'Finance' },
    { id: 4, name: 'Technology' }
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
        { key: 'DELETE_ROLE', description: 'Can delete roles' },
        { key: 'Approve_ROLE', description: 'Can delete roles' },
      ]
    },
    {
      name: 'Verticals Management',
      permissions: [
        { key: 'VIEW_VERTICALS', description: 'Can view verticals' },
        { key: 'CREATE_VERTICALS', description: 'Can create verticals' },
        { key: 'EDIT_VERTICALS', description: 'Can edit vertical details', contextRequired: true },

      ]
    },
    {
      name: 'Projects Management',
      permissions: [
        { key: 'VIEW_PROJECTS', description: 'Can view projects' },
        { key: 'CREATE_PROJECTS', description: 'Can create projects' },
        { key: 'EDIT_PROJECTS', description: 'Can edit project details', contextRequired: true },

      ]
    },
    {
      name: 'Center Management',
      permissions: [
        { key: 'VIEW_CENTERS', description: 'Can view centers' },
        { key: 'CREATE_CENTERS', description: 'Can create centers' },
        { key: 'EDIT_CENTERS', description: 'Can edit center details', contextRequired: true },

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
      name: 'Batch Management',
      permissions: [
        { key: 'VIEW_BATCH', description: 'Can view Batch' },
        { key: 'CREATE_BATCH', description: 'Can create Batch' },
        { key: 'EDIT_BATCH', description: 'Can edit Batch details', contextRequired: true },
        { key: 'MANAGE_COURSE_CONTENT', description: 'Can manage course content', contextRequired: true },
        { key: 'VERIFY_DOCUMENT', description: 'Can verify course documents', contextRequired: true },
      ]
    },
    {
      name: 'Lead Management',
      permissions: [
        { key: 'VIEW_LEAD_OWN', description: 'Can view lead (Own Lead)' },
        { key: 'VIEW_LEAD_GLOBAL', description: 'Can view lead (Global Lead)' },
        { key: 'DELETE_LEAD_OWN', description: 'Can delete lead (Own Lead)' },
        { key: 'DELETE_LEAD_GLOBAL', description: 'Can delete lead (Global Lead)' },
        { key: 'CREATE_LEAD', description: 'Can create lead' },
        { key: 'EDIT_Lead', description: 'Can edit lead details', contextRequired: true },
        { key: 'MANAGE_COURSE_CONTENT', description: 'Can manage course content', contextRequired: true },
        { key: 'VERIFY_DOCUMENT', description: 'Can verify course documents', contextRequired: true },
      ]
    },

  ];

  // Role permissions mapping
  const [rolePermissions, setRolePermissions] = useState({});

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
    } else if (type === 'project') {
      const project = projects.find(p => p.id.toString() === id.toString());
      return project ? project.name : id;
    } else if (type === 'vertical') {
      const vertical = verticals.find(v => v.id.toString() === id.toString());
      return vertical ? vertical.name : id;
    }
    return id;
  };

  // ------- EVENT HANDLERS -------

  // Check if a context is selected
  const isItemSelected = (list, itemId) => {
    return list.includes(itemId);
  };

  // Toggle context selection
  const toggleItemSelection = (list, setList, itemId) => {
    if (isItemSelected(list, itemId)) {
      setList(list.filter(id => id !== itemId));
    } else {
      setList([...list, itemId]);
    }
  };

  // Role handlers
  const handleOpenRoleModal = async (role = null) => {
    if (role) {
      // Editing existing role
      setEditingRole(role);

      console.log('role', role)

      // agar permissions nahi aaye toh pehle fetch kar lo

      await fetchRoleslist(); // ✅ async wait karo

      console.log('rolePermissions', rolePermissions)


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
  const handleDeleteRole = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this role?');
    if (!confirmDelete) return;

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    try {
      const response = await axios.delete(`${backendUrl}/college/roles/delete-role/${id}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        alert('Role deleted successfully!');
        fetchRoles(); // refresh the list
        setRoleForm({ name: '', description: '', permissions: {} });
        setEditingRole(null);
        setShowRoleModal(false);
      } else {
        alert('Failed to delete role.');
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };


  const handleSaveRole = async () => {
    const currentDate = new Date().toISOString().slice(0, 10);
    const permissionsArray = Object.keys(roleForm.permissions)
      .filter(key => roleForm.permissions[key]);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    console.log('userData', userData)
    const token = userData.token;

    if (editingRole) {
      // 🔁 Edit role (API call)
      const response = await axios.put(`${backendUrl}/college/roles/edit-role/${editingRole._id}`, {
        roleName: roleForm.name,
        description: roleForm.description,
        permissions: permissionsArray
      }, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        alert("Role updated successfully");
        fetchRoles(); // refresh list
        fetchRoleslist();
      }
    }
    else {

      const response = await axios.post(`${backendUrl}/college/roles/add-role`,
        {
          roleName: roleForm.name,
          description: roleForm.description,
          permissions: permissionsArray
        },
        {
          headers: { 'x-auth': token }
        });

      if (response.data.success) {
        alert('Role added successfully!');
        setShowRoleModal(false);
        setRoleForm({ name: '', description: '', permissions: {} });

        fetchRoles();


      }
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
    const updatedForm = {
      ...userForm,
      [id]: value
    };



    // Match check only if both fields are filled
    if (
      (id === "password" || id === "confirmPassword") &&
      updatedForm.password &&
      updatedForm.confirmPassword
    ) {
      setPasswordMismatch(updatedForm.password !== updatedForm.confirmPassword);
    }

    setUserForm(updatedForm);
  };

  const fetchUsers = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      console.log('User', userData)
      const collegeId = userData.collegeId;

      const response = await axios.get(`${backendUrl}/college/roles/users/concern-persons/${collegeId}`, {
        headers: { 'x-auth': token }
      });
      console.log('response', response)
      if (response.data.success) {
        const fetchedUsers = response.data.users.map((user, index) => ({
          _id: user._id._id,
          id: index + 1,
          defaultAdmin: user.defaultAdmin,
          name: user._id.name,
          email: user._id.email,
          mobile: user._id.mobile,
          designation: user._id.designation,
          role: user._id.roleId ? user._id.roleId.roleName : "Default Admin", // if roleName stored in access
          lastActive: user._id.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A",
          hasCustomPerms: user._id.access?.contextPermissions?.length > 0
        }));

        setUsers(fetchedUsers);
      }
    } catch (err) {
      console.error("Error fetching users:", err.message);
    }
  };



  const handleSaveUser = async () => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    const headers = { headers: { 'x-auth': token } };
    const payload = {
      name: userForm.name,
      email: userForm.email,
      mobile: userForm.mobile,
      designation: userForm.designation,
      password: userForm.password,
      confirmPassword: userForm.confirmPassword,
      roleId: roles.find(r => r.name === userForm.role)?._id, // ensure your roles have _id
      collegeId: userData.collegeId // assuming stored in session
    };

    try {
      if (editingUser) {
        // Call update API
        const response = await axios.put(`${backendUrl}/college/roles/users/${editingUser._id}`, payload, headers);
        if (response.data.status) {
          alert("User updated successfully");
          fetchUsers(); // Reload user list
        }
      } else {
        // Call add API
        const response = await axios.post(`${backendUrl}/college/roles/users/add-concern-person`, payload, headers);
        if (response.data.status) {
          alert("User added successfully");
          fetchUsers(); // Reload user list
        }
      }
      setShowUserModal(false);
      setUserForm({ name: '', email: '', role: '', designation: '', mobile: '', password: '', confirmPassword: '' });
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Something went wrong");
    }
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

    // Reset all selections
    setCoursesSelected([]);
    setCentersSelected([]);
    setProjectsSelected([]);
    setVerticalsSelected([]);

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

  // Modified to handle multiple context types and selections
  const handleAddPermissionContext = (permKey, contextType, selectedItems) => {
    if (!contextType || selectedItems.length === 0) return;

    // Get current contexts for this permission
    const currentContexts = userContextPerms[permKey] || [];

    // Create array of new contexts to add
    const newContextsToAdd = selectedItems.map(itemId => ({
      type: contextType,
      id: itemId
    }));

    // Filter out duplicates
    const newContexts = [
      ...currentContexts,
      ...newContextsToAdd.filter(newCtx =>
        !currentContexts.some(ctx =>
          ctx.type === newCtx.type && ctx.id === newCtx.id
        )
      )
    ];

    // Update user context permissions
    setUserContextPerms({
      ...userContextPerms,
      [permKey]: newContexts
    });
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

  // Multiselect dropdown component
  const MultiSelectDropdown = ({ items, selectedItems, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="position-relative">
        <div
          className="form-select d-flex justify-content-between align-items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="text-truncate">
            {selectedItems.length === 0 ? (
              <span className="text-muted">Select items</span>
            ) : (
              <span>{selectedItems.length} selected</span>
            )}
          </div>
          <div>
            <ChevronDown size={16} />
          </div>
        </div>

        {isOpen && (
          <div className="position-absolute top-100 start-0 mt-1 w-100 bg-white border rounded-2 shadow-sm z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {items.map(item => (
              <div
                key={item.id}
                className="d-flex align-items-center px-3 py-2 border-bottom cursor-pointer hover-bg-light"
                onClick={() => {
                  onChange(item.id);
                }}
              >
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => { }}
                />
                <span>{item.name}</span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="px-3 py-2 text-muted">
                No items available
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
                        onClick={() => handleDeleteRole(role._id)}
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
                      {user.role}

                      {user.hasCustomPerms && (
                        <span className="ms-2 badge bg-warning bg-opacity-10 text-warning border-0 bg-transparent" style={{ top: '-6px' }}>
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
                        disabled={
                          user.role === "Admin"
                        }
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-link text-warning p-0 border-0"
                        onClick={() => handleOpenPermissionModal(user)}
                        title="Custom permissions"
                        disabled={
                          user.role === "Admin"
                        }
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-link text-danger p-0 border-0"
                        onClick={() => handleDeleteUser(user)}
                        title="Delete user"
                        disabled={
                          user.role === "Admin"
                        }
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
    <div className="modal d-block scrollY " style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                    {/* {category.permissions.map((permission) => (
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
                    ))} */}
                  
                    {category.permissions.map((permission) => {
                      // Radio button groups ke liye keys sets banaate hain
                      const viewLeadKeys = ['VIEW_LEAD_OWN', 'VIEW_LEAD_GLOBAL'];
                      const deleteLeadKeys = ['DELETE_LEAD_OWN', 'DELETE_LEAD_GLOBAL'];

                      if (viewLeadKeys.includes(permission.key)) {
                        return (
                          <div key={permission.key} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              id={permission.key}
                              name="lead_view_permission"
                              checked={roleForm.permissions[permission.key] || false}
                              onChange={() => {
                                setRoleForm(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    'VIEW_LEAD_OWN': permission.key === 'VIEW_LEAD_OWN',
                                    'VIEW_LEAD_GLOBAL': permission.key === 'VIEW_LEAD_GLOBAL'
                                  }
                                }));
                              }}
                            />
                            <label className="form-check-label" htmlFor={permission.key}>
                              {permission.description}
                              {permission.contextRequired && (
                                <span className="ms-2 bg-info bg-opacity-10 text-info">
                                  Context Required
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      } else if (deleteLeadKeys.includes(permission.key)) {
                        return (
                          <div key={permission.key} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              id={permission.key}
                              name="lead_delete_permission"
                              checked={roleForm.permissions[permission.key] || false}
                              onChange={() => {
                                setRoleForm(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    'DELETE_LEAD_OWN': permission.key === 'DELETE_LEAD_OWN',
                                    'DELETE_LEAD_GLOBAL': permission.key === 'DELETE_LEAD_GLOBAL'
                                  }
                                }));
                              }}
                            />
                            <label className="form-check-label" htmlFor={permission.key}>
                              {permission.description}
                              {permission.contextRequired && (
                                <span className="ms-2 bg-info bg-opacity-10 text-info">
                                  Context Required
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      } else {
                        // Baaki permissions checkbox ke roop me rahega
                        return (
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
                                <span className="ms-2 bg-info bg-opacity-10 text-info">
                                  Context Required
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      }
                    })}


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
    <div className="modal d-block scrollY" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
            <div className="mb-3">
              <label htmlFor="pass" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
                onChange={handleUserFormChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="confPass" className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                placeholder="Confirm Password"
                onChange={handleUserFormChange}
              />
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
              disabled={
                !userForm.name || !userForm.mobile || !userForm.email || !userForm.designation || !userForm.role || !userForm.password || !userForm.confirmPassword || passwordMismatch
              }
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
          {passwordMismatch && (
            <div className="text-danger mb-2">Passwords do not match</div>
          )}

        </div>
      </div>
    </div>
  );

  // Custom permissions modal with simplified layout matching the reference design
const renderPermissionModal = () => (
  <div className="modal d-block scrollY" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
    <div className="modal-dialog modal-dialog-centered modal-lg">
      <div className="modal-content">
        <div className="modal-header bg-danger text-white">
          <h5 className="modal-title">Custom Permissions: {editingUser?.name}</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowPermissionModal(false)}></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <AlertTriangle className="me-2" size={20} />
            <div>
              Custom permissions override role-based permissions. Use with caution.
            </div>
          </div>

          {/* Context-specific permissions by category */}
          {permissionCategories.map((category) => (
            <div key={category.name} className="mb-4">
              <h6 className="fw-medium mb-2">{category.name}</h6>

              {/* If no context permissions in category */}
              {category.permissions.filter(p => p.contextRequired).length === 0 ? (
                <div className="text-muted">No context-specific permissions in this category</div>
              ) : (
                category.permissions
                  .filter(permission => permission.contextRequired)
                  .map((permission) => (
                    <div key={permission.key} className="mb-4 pb-3 border-bottom">
                      <div className="form-check mb-3">
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

                      {/* Context selectors - only shown when permission is checked */}
                      {!!userContextPerms[permission.key] && (
                        <div className="ms-4">

                          {/* Courses Dropdown */}
                          {permission.key.includes('COURSE') && (
                            <div className="mb-3">
                              <label className="form-label">Courses</label>
                              <MultiSelectDropdown
                                items={courses}
                                selectedItems={coursesSelected}
                                onChange={(id) => toggleItemSelection(coursesSelected, setCoursesSelected, id)}
                              />
                            </div>
                          )}

                          {/* Centers Dropdown */}
                          {permission.key.includes('CENTER') && (
                            <div className="mb-3">
                              <label className="form-label">Centers</label>
                              <MultiSelectDropdown
                                items={centers}
                                selectedItems={centersSelected}
                                onChange={(id) => toggleItemSelection(centersSelected, setCentersSelected, id)}
                              />
                            </div>
                          )}

                          {/* Projects Dropdown */}
                          {permission.key.includes('PROJECT') && (
                            <div className="mb-3">
                              <label className="form-label">Projects</label>
                              <MultiSelectDropdown
                                items={projects}
                                selectedItems={projectsSelected}
                                onChange={(id) => toggleItemSelection(projectsSelected, setProjectsSelected, id)}
                              />
                            </div>
                          )}

                          {/* Verticals Dropdown */}
                          {permission.key.includes('VERTICAL') && (
                            <div className="mb-3">
                              <label className="form-label">Verticals</label>
                              <MultiSelectDropdown
                                items={verticals}
                                selectedItems={verticalsSelected}
                                onChange={(id) => toggleItemSelection(verticalsSelected, setVerticalsSelected, id)}
                              />
                            </div>
                          )}

                          {/* Display assigned contexts */}
                          {userContextPerms[permission.key]?.length > 0 && (
                            <div className="mt-3">
                              <div className="small fw-medium mb-2 text-secondary">Assigned Contexts:</div>
                              <div>
                                {userContextPerms[permission.key]?.map((context, index) => (
                                  <span key={index} className="badge bg-light text-dark me-2 mb-2 p-2">
                                    {context.type === 'center' && <Building size={14} className="me-1" />}
                                    {context.type === 'course' && <BookOpen size={14} className="me-1" />}
                                    {context.type === 'project' && <Layers size={14} className="me-1" />}
                                    {context.type === 'vertical' && <Users size={14} className="me-1" />}
                                    {getContextName(context.type, context.id)}
                                    <button
                                      className="btn-close ms-2"
                                      style={{ fontSize: '10px' }}
                                      onClick={() => handleRemovePermissionContext(permission.key, index)}
                                      type="button"
                                    ></button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          ))}
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
            className="btn btn-danger"
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
    <div className="modal d-block scrollY" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
        {`
          .scrollY {
            overflow-y: scroll!important;
          }
          
          .cursor-pointer {
            cursor: pointer;
          }
          
          .hover-bg-light:hover {
            background-color: #f8f9fa;
          }
          
          .z-3 {
            z-index: 3;
          }
        `}
      </style>
    </div>
  );
};

export default AccessManagementSystem;