import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  GitBranch,
  Target,
  Settings as SettingsIcon,
  Layers,
  Building
} from 'lucide-react';
import axios from 'axios'

// Import all components
import UserManagement from './AccessManagement/UserMangement';
import TeamManagement from './AccessManagement/TeamManagement';
import AssignmentRule from './AccessManagement/AssignmentRule';
import PermissionAnalysis from './AccessManagement/PermissionAnalysis';
import RoleManagement from './AccessManagement/RoleManagement';
import Settings from './AccessManagement/Settings';
import CrmAccessManagement from './CrmAccessManagement';


// Import shared components/modals

import {
  UserDetailsModal,
  AddUserModal,
  AddRoleModal
} from './AccessManagement/Modals';


const AccessManagement = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const [activeTab, setActiveTab] = useState('users');
  const [permissionMode, setPermissionMode] = useState('unified');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [viewDetailsUser, setViewDetailsUser] = useState(null);
  const [addMode, setAddMode] = useState('user');

  // All users data
  const [users, setUsers] = useState([
    {
      user_id: 'user_3',
      name: 'Anil Verma',
      email: 'anil@company.com',
      role: 'COUNSELLOR',
      status: 'active',
      permission_type: 'lead_based',
      reporting_managers: ['user_5', 'user_6'],
      assigned_leads: ['lead_1', 'lead_2'],
      centers_access: ['center_1', 'center_2']
    },
    {
      user_id: 'user_4',
      name: 'Sneha Patel',
      email: 'sneha@company.com',
      role: 'SALES_EXECUTIVE',
      status: 'active',
      permission_type: 'lead_based',
      reporting_managers: ['user_6'],
      assigned_leads: ['lead_3', 'lead_4'],
      centers_access: ['center_2', 'center_3']
    }
  ]);

  const [enhancedEntities, setEnhancedEntities] = useState({
    VERTICAL: [
      
    ],
    PROJECT: [
      
    ],
    CENTER: [
     
    ],
    COURSE: [
      
    ],
    BATCH: [
      { id: 'batch_1', name: 'React Batch Jan 2025', parent_id: 'course_1' },
      { id: 'batch_2', name: 'Node.js Batch Feb 2025', parent_id: 'course_2' },
      { id: 'batch_3', name: 'MERN Batch Mar 2025', parent_id: 'course_3' }
    ]
  });

  // All roles data
  const [allRoles, setAllRoles] = useState({
    'SUPER_ADMIN': { name: 'Super Admin', type: 'hierarchical' },
    'VERTICAL_ADMIN': { name: 'Vertical Admin', type: 'hierarchical' },
    'PROJECT_MANAGER': { name: 'Project Manager', type: 'hierarchical' },
    'CENTER_HEAD': { name: 'Center Head', type: 'hierarchical' },
    'COURSE_COORDINATOR': { name: 'Course Coordinator', type: 'hierarchical' },
    'BATCH_COORDINATOR': { name: 'Batch Coordinator', type: 'hierarchical' },
    'AUDIT_USER': { name: 'Audit User', type: 'hierarchical' },
    'REGIONAL_MANAGER': { name: 'Regional Manager', type: 'hierarchical' },
    'COUNSELLOR': { name: 'Counsellor', type: 'lead_based' },
    'TL_COUNSELLOR': { name: 'TL Counsellor', type: 'lead_based' },
    'SALES_EXECUTIVE': { name: 'Sales Executive', type: 'lead_based' },
    'TL_SALES': { name: 'TL Sales', type: 'lead_based' },
    'SALES_MANAGER': { name: 'Sales Manager', type: 'lead_based' },
    'CENTER_SALES_HEAD': { name: 'Center Sales Head', type: 'hybrid' },
    'REGIONAL_SALES_MANAGER': { name: 'Regional Sales Manager', type: 'hybrid' }
  });

  // Organization tree data
  const [organizationTree] = useState({
    'user_5': {
      user_id: 'user_5',
      name: 'Kavita Desai',
      role: 'TL_COUNSELLOR',
      email: 'kavita@company.com',
      direct_reports: ['user_3'],
      level: 1,
      department: 'COUNSELLING'
    },
    'user_6': {
      user_id: 'user_6',
      name: 'Amit Sharma',
      role: 'CENTER_SALES_HEAD',
      email: 'amit@company.com',
      direct_reports: ['user_4'],
      level: 1,
      department: 'SALES'
    },
    'user_3': {
      user_id: 'user_3',
      name: 'Anil Verma',
      role: 'COUNSELLOR',
      email: 'anil@company.com',
      direct_reports: [],
      reporting_to: ['user_5', 'user_6'],
      level: 2,
      department: 'COUNSELLING'
    },
    'user_4': {
      user_id: 'user_4',
      name: 'Sneha Patel',
      role: 'SALES_EXECUTIVE',
      email: 'sneha@company.com',
      direct_reports: [],
      reporting_to: ['user_6'],
      level: 2,
      department: 'SALES'
    }
  });

  // Leads data
  const [leads] = useState([
    {
      lead_id: 'lead_1',
      name: 'John Doe',
      email: 'john@email.com',
      phone: '+91-9876543210',
      course_interested: 'Python Course',
      center: 'center_1',
      center_name: 'Delhi Center',
      assigned_to: 'user_3',
      status: 'contacted',
      priority: 'high',
      created_date: '2024-01-15'
    },
    {
      lead_id: 'lead_2',
      name: 'Sarah Wilson',
      email: 'sarah@email.com',
      phone: '+91-9876543211',
      course_interested: 'Data Science',
      center: 'center_2',
      center_name: 'Mumbai Center',
      assigned_to: 'user_3',
      status: 'new',
      priority: 'medium',
      created_date: '2024-01-16'
    },
    {
      lead_id: 'lead_3',
      name: 'David Smith',
      email: 'david@email.com',
      phone: '+91-9876543212',
      course_interested: 'React Development',
      center: 'center_2',
      center_name: 'Mumbai Center',
      assigned_to: 'user_4',
      status: 'qualified',
      priority: 'high',
      created_date: '2024-01-17'
    }
  ]);

  // Assignment rules data
  const [assignmentRules] = useState([
    {
      id: 'rule_1',
      name: 'Geographic Assignment',
      type: 'location_based',
      description: 'Auto-assign leads based on center location',
      active: true,
      conditions: {
        center_mapping: {
          'center_1': ['user_3', 'user_5'],
          'center_2': ['user_4', 'user_6'],
          'center_3': ['user_4']
        }
      }
    },
    {
      id: 'rule_2',
      name: 'Course Specialization',
      type: 'course_based',
      description: 'Assign based on counsellor expertise',
      active: true,
      conditions: {
        course_mapping: {
          'Python Course': ['user_3'],
          'Data Science': ['user_3', 'user_5'],
          'React Development': ['user_4']
        }
      }
    },
    {
      id: 'rule_3',
      name: 'Workload Balancing',
      type: 'load_based',
      description: 'Distribute leads evenly among team members',
      active: false,
      conditions: {
        max_leads_per_user: 10,
        rebalance_frequency: 'weekly'
      }
    }
  ]);

  // Entities data
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

  // Tab definitions
  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'teams', label: 'Team Management', icon: GitBranch },
    { id: 'assignments', label: 'Assignment Rules', icon: Target },
    { id: 'analysis', label: 'Permission Analysis', icon: Eye },
    { id: 'roles', label: 'Role Management', icon: Shield },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  // Event handlers
  const handleViewUserDetails = (user) => {
    setViewDetailsUser(user);
    setShowUserDetails(true);
  };

  const handleAddUser = () => {
    setAddMode('user');
    setShowAddUser(true);
  };

  const handleCreateRole = () => {
    setAddMode('role');
    setShowAddRole(true);
  };
  useEffect(() => {
    fetchVerticals()
    fetchProjects()
    fetchCenters()
  }, []);

  const fetchVerticals = async () => {
    const newVertical = await axios.get(`${backendUrl}/college/getVerticals`, { headers: { 'x-auth': token } });

    const verticalList = newVertical.data.data.map(v => ({
      id: v._id,
      name: v.name,
      status: v.status === true ? 'active' : 'inactive',

      createdAt: v.createdAt
    }));


    // Update the whole enhancedEntities but keep other keys unchanged
    setEnhancedEntities(prev => ({
      ...prev,
      VERTICAL: verticalList
    }));

  };

  const fetchProjects = async () => {
    const response = await axios.get(`${backendUrl}/college/list_all_projects`, { headers: { 'x-auth': token } });

    const list = response.data.data.map(v => ({
      id: v._id,
      name: v.name,
      status: v.status === true ? 'active' : 'inactive',
      parent_id:v.vertical,
      createdAt: v.createdAt
    }));
    console.log('response', response)
    console.log('projets', list)


    // Update the whole enhancedEntities but keep other keys unchanged
    setEnhancedEntities(prev => ({
      ...prev,
      PROJECT: list
    }));

  };

 const fetchCenters = async () => {
  try {
    const response = await axios.get(`${backendUrl}/college/list_all_centers`, {
      headers: { 'x-auth': token }
    });

    const centersData = response.data.data || [];

    // Convert to desired structure
    const list = centersData.map(center => ({
      id: center._id,
      name: center.name,
      status: center.status === true ? 'active' : 'inactive',
      projects: Array.isArray(center.projects) ? center.projects : [center.projects], // convert to array safely
      createdAt: center.createdAt
    }));

    console.log('Fetched centers:', list);

    // Update enhancedEntities
    setEnhancedEntities(prev => ({
      ...prev,
      CENTER: list
    }));
  } catch (error) {
    console.error('Error fetching centers:', error);
  }
};

const fetchCourses = async () => {
  try {
    const response = await axios.get(`${backendUrl}/college/all_courses`, {
      headers: { 'x-auth': token }
    });

    const responseData = response.data.data || [];

    // Convert to desired structure
    const list = responseData.map(a => ({
      id: a._id,
      name: a.name,
      status: a.status === true ? 'active' : 'inactive',
      center: Array.isArray(a.center) ? a.center : [a.center], // convert to array safely
      project:a.project,
      createdAt: a.createdAt
    }));

    console.log('Fetched courses:', list);
    // Update enhancedEntities
    setEnhancedEntities(prev => ({
      ...prev,
      COURSE: list
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
};


  const renderActiveTab = () => {
    switch (activeTab) {
      case 'users':
        return (
          <UserManagement
            users={users}
            allRoles={allRoles}
            permissionMode={permissionMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onViewUserDetails={handleViewUserDetails}
          />
        );
      case 'teams':
        return (
          <TeamManagement
            organizationTree={organizationTree}
            allRoles={allRoles}
            leads={leads}
            onViewUserDetails={handleViewUserDetails}
          />
        );
      case 'assignments':
        return (
          <CrmAccessManagement
            assignmentRules={assignmentRules}
            entities={entities}
            users={users}
          />
        );
      case 'analysis':
        return (
          <PermissionAnalysis
            users={users}
            allRoles={allRoles}
          />
        );
      case 'roles':
        return (
          <RoleManagement
            allRoles={allRoles}
            onCreateRole={handleCreateRole}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-bottom">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center py-4">
            <div>
              <h1 className="h2 fw-bold text-dark mb-1">Unified Permission Management</h1>
              <p className="text-muted mb-0">Complete permission system with hierarchical content management & lead-based access control</p>
            </div>
            <div className="d-flex gap-3">
              {/* Permission Mode Toggle */}
              <div className="btn-group" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="permissionMode"
                  id="unified"
                  checked={permissionMode === 'unified'}
                  onChange={() => setPermissionMode('unified')}
                />
                <label className="btn btn-outline-primary" htmlFor="unified">
                  <Layers size={16} className="me-1" />
                  Unified
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="permissionMode"
                  id="hierarchical"
                  checked={permissionMode === 'hierarchical'}
                  onChange={() => setPermissionMode('hierarchical')}
                />
                <label className="btn btn-outline-info" htmlFor="hierarchical">
                  <Building size={16} className="me-1" />
                  Content
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="permissionMode"
                  id="lead_based"
                  checked={permissionMode === 'lead_based'}
                  onChange={() => setPermissionMode('lead_based')}
                />
                <label className="btn btn-outline-success" htmlFor="lead_based">
                  <Target size={16} className="me-1" />
                  Leads
                </label>
              </div>

              <button
                onClick={handleAddUser}
                className="btn btn-success d-flex align-items-center gap-2"
              >
                <UserPlus size={16} />
                <span>Add User</span>
              </button>

            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        {/* Permission Mode Info Banner */}
        <div className="alert alert-light border mb-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                {permissionMode === 'unified' && (
                  <>
                    <Layers className="text-primary" size={24} />
                    <div>
                      <div className="fw-medium">Unified View Active</div>
                      <div className="small text-muted">Complete system showing hierarchical content management + lead-based permissions + hybrid roles</div>
                    </div>
                  </>
                )}
                {permissionMode === 'hierarchical' && (
                  <>
                    <Building className="text-info" size={24} />
                    <div>
                      <div className="fw-medium">Content Management Mode</div>
                      <div className="small text-muted">Hierarchical permissions for content (Vertical → Project → Center → Course → Batch)</div>
                    </div>
                  </>
                )}
                {permissionMode === 'lead_based' && (
                  <>
                    <Target className="text-success" size={24} />
                    <div>
                      <div className="fw-medium">Lead Management Mode</div>
                      <div className="small text-muted">Team-based lead management permissions (Sales, Counselling teams)</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="col-md-4 text-end">
              <div className="d-flex gap-2">
                <span className="badge bg-info">{users.filter(u => u.permission_type === 'hierarchical').length} Content</span>
                <span className="badge bg-success">{users.filter(u => u.permission_type === 'lead_based').length} Lead</span>
                <span className="badge bg-warning">{users.filter(u => u.permission_type === 'hybrid').length} Hybrid</span>
                <span className="badge bg-secondary">{Object.keys(allRoles).length} Roles</span>
              </div>
            </div>
          </div>
        </div>

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

        {/* Active Tab Content */}
        {renderActiveTab()}
      </div>

      {/* Modals */}
      {showUserDetails && (
        <UserDetailsModal
          user={viewDetailsUser}
          allRoles={allRoles}
          onClose={() => setShowUserDetails(false)}
        />
      )}

      {showAddUser && (
        <AddUserModal
          users={users}
          allRoles={allRoles}
          entities={entities}
          onClose={() => setShowAddUser(false)}
          onAddUser={(newUser) => {
            setUsers([...users, newUser]);
            setShowAddUser(false);
          }}
          enhancedEntities={enhancedEntities}

        />
      )}

      {showAddRole && (
        <AddRoleModal
          entities={entities}
          onClose={() => setShowAddRole(false)}
          onAddRole={(newRole) => {
            setAllRoles(prev => ({
              ...prev,
              [newRole.name]: {
                name: newRole.description,
                type: newRole.permission_type
              }
            }));
            setShowAddRole(false);
          }}
        />
      )}
    </div>
  );
};

export default AccessManagement;