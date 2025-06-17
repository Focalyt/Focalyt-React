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
import LeadAssignmentRule from './leadAssignmentRule';
import qs from 'query-string';



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
    BATCH: []
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
    
  });

  // Leads data
  const [leads] = useState([
   
  ]);

  // Assignment rules data
  const [assignmentRules] = useState([
    
  ]);

  // Entities data
 

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
    fetchCourses()
    fetchBatches()
    fetchUsers()
  }, []);


  
  

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/users`, {
        headers: { 'x-auth': token }
      });
  
      if (response.data.success) {
        console.log('response.data.data.users', response.data.data.users)
        // Update users state with detailed access summary
        setUsers(response.data.data.users.map(user => ({
          user_id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          designation: user.designation,
          status: user.status ? 'active' : 'inactive',
          reporting_managers: user.accessSummary?.reportingManagers || 0,
          role: user.role,
          roleId: user.roleId,          
          // ✅ NEW: Add detailed access summary
          accessSummary: user.accessSummary || {},
          fullPermissions: user.fullPermissions || {},
          college: user.college || {},
          created_at: user.createdAt
        })));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
    const user = JSON.parse(sessionStorage.getItem('user'));
    const headers = {
      'x-auth': user.token,
    };
    
    const response = await axios.get(`${backendUrl}/college/courses`, { headers });

    

    const responseData = response.data.courses || [];

    // Convert to desired structure
    const list = responseData.map(a => ({
      id: a._id,
      name: a.name,
      status: a.status === true ? 'active' : 'inactive',
      center: Array.isArray(a.center) ? a.center : [a.center], // convert to array safely
      project:a.project,
      createdAt: a.createdAt
    }));

    // Update enhancedEntities
    setEnhancedEntities(prev => ({
      ...prev,
      COURSE: list
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
};



const fetchBatches = async () => {
  try {
    const response = await axios.get(`${backendUrl}/college/batches`, {
      headers: { 'x-auth': token }
    });

    const responseData = response.data.batches || [];

    // Convert to desired structure
    const list = responseData.map(a => ({
      id: a._id,
      name: a.name,
      status: a.status === true ? 'active' : 'inactive',
      center: a.centerId? a.centerId : "", // convert to array safely
      course:a.courseId?a.courseId :'',
      createdAt: a.createdAt
    }));

    console.log('Fetched batchs:', list);
    // Update enhancedEntities
    setEnhancedEntities(prev => ({
      ...prev,
      BATCH: list
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
            handleAddUser={handleAddUser}
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
          <LeadAssignmentRule
            assignmentRules={assignmentRules}            
            users={users}
            enhancedEntities={enhancedEntities}
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
              <h1 className="h2 fw-bold text-dark mb-1">Access Management</h1>
              <p className="text-muted mb-0">Complete permission system with hierarchical content management & lead-based access control</p>
            </div>
            
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        {/* Permission Mode Info Banner */}
        

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