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
  Clock,
  Target,
  GitBranch,
  Briefcase,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Building,
  Layers
} from 'lucide-react';

const UnifiedPermissionDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [permissionMode, setPermissionMode] = useState('unified'); // 'hierarchical', 'lead_based', 'unified'

  // All users with both hierarchical and lead-based data
  const [users, setUsers] = useState([
  // Lead-based Users - UPDATED
  {
    user_id: 'user_3',
    name: 'Anil Verma',
    email: 'anil@company.com',
    role: 'COUNSELLOR',
    status: 'active',
    permission_type: 'lead_based',
    reporting_managers: ['user_5', 'user_6'], // Multiple reporting
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
    reporting_managers: ['user_6'], // Single reporting
    assigned_leads: ['lead_3', 'lead_4'],
    centers_access: ['center_2', 'center_3']
  }
]);

  // All roles (hierarchical + lead-based + hybrid)
  const [allRoles, setAllRoles] = useState({
    // Hierarchical Roles
    'SUPER_ADMIN': { name: 'Super Admin', type: 'hierarchical' },
    'VERTICAL_ADMIN': { name: 'Vertical Admin', type: 'hierarchical' },
    'PROJECT_MANAGER': { name: 'Project Manager', type: 'hierarchical' },
    'CENTER_HEAD': { name: 'Center Head', type: 'hierarchical' },
    'COURSE_COORDINATOR': { name: 'Course Coordinator', type: 'hierarchical' },
    'BATCH_COORDINATOR': { name: 'Batch Coordinator', type: 'hierarchical' },
    'AUDIT_USER': { name: 'Audit User', type: 'hierarchical' },
    'REGIONAL_MANAGER': { name: 'Regional Manager', type: 'hierarchical' },

    // Lead-based Roles
    'COUNSELLOR': { name: 'Counsellor', type: 'lead_based' },
    'TL_COUNSELLOR': { name: 'TL Counsellor', type: 'lead_based' },
    'SALES_EXECUTIVE': { name: 'Sales Executive', type: 'lead_based' },
    'TL_SALES': { name: 'TL Sales', type: 'lead_based' },
    'SALES_MANAGER': { name: 'Sales Manager', type: 'lead_based' },

    // Hybrid Roles
    'CENTER_SALES_HEAD': { name: 'Center Sales Head', type: 'hybrid' },
    'REGIONAL_SALES_MANAGER': { name: 'Regional Sales Manager', type: 'hybrid' }
  });

  // Team Management Data
  // Replace teams with organizational tree
const [organizationTree] = useState({
  'user_5': { // Kavita Desai - TL Counsellor
    user_id: 'user_5',
    name: 'Kavita Desai',
    role: 'TL_COUNSELLOR',
    email: 'kavita@company.com',
    direct_reports: ['user_3'],
    level: 1,
    department: 'COUNSELLING'
  },
  'user_6': { // Amit Sharma - Center Sales Head
    user_id: 'user_6', 
    name: 'Amit Sharma',
    role: 'CENTER_SALES_HEAD',
    email: 'amit@company.com',
    direct_reports: ['user_4'],
    level: 1,
    department: 'SALES'
  },
  'user_3': { // Anil Verma - Reports to both
    user_id: 'user_3',
    name: 'Anil Verma', 
    role: 'COUNSELLOR',
    email: 'anil@company.com',
    direct_reports: [],
    reporting_to: ['user_5', 'user_6'], // Matrix reporting
    level: 2,
    department: 'COUNSELLING'
  },
  'user_4': { // Sneha Patel
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

const OrganizationTree = () => {
  const buildTree = () => {
    const tree = {};
    
    // Build hierarchy
    Object.values(organizationTree).forEach(user => {
      if (user.level === 1) { // Top level managers
        tree[user.user_id] = {
          ...user,
          children: getDirectReports(user.user_id)
        };
      }
    });
    
    return tree;
  };

  const getDirectReports = (managerId) => {
    return Object.values(organizationTree)
      .filter(user => user.reporting_to?.includes(managerId))
      .map(user => ({
        ...user,
        children: getDirectReports(user.user_id)
      }));
  };

  const TreeNode = ({ node, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    const userLeads = getUserLeads(node.user_id);
    
    return (
      <div className="tree-node">
        <div 
          className={`d-flex align-items-center gap-3 p-3 border rounded mb-2 ${
            level === 0 ? 'bg-primary bg-opacity-10' : 
            level === 1 ? 'bg-info bg-opacity-10' : 'bg-light'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Expand/Collapse Button */}
          {node.children?.length > 0 && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '−' : '+'}
            </button>
          )}
          
          {/* User Avatar */}
          <div className={`bg-${level === 0 ? 'primary' : level === 1 ? 'info' : 'secondary'} bg-opacity-25 rounded-circle p-2`}>
            <User size={16} className={`text-${level === 0 ? 'primary' : level === 1 ? 'info' : 'secondary'}`} />
          </div>
          
          {/* User Details */}
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2">
              <div className="fw-medium">{node.name}</div>
              <span className={`badge bg-${node.department === 'SALES' ? 'success' : 'info'}`}>
                {allRoles[node.role]?.name}
              </span>
            </div>
            <div className="text-muted small">{node.email}</div>
            
            {/* Reporting Info */}
            {node.reporting_to?.length > 0 && (
              <div className="small text-warning mt-1">
                Reports to: {node.reporting_to.map(managerId => 
                  organizationTree[managerId]?.name
                ).join(', ')}
              </div>
            )}
            
            {/* Performance Metrics */}
            <div className="d-flex gap-3 mt-2">
              <div className="small">
                <span className="text-primary fw-medium">{userLeads.length}</span>
                <span className="text-muted"> leads</span>
              </div>
              <div className="small">
                <span className="text-success fw-medium">
                  {userLeads.filter(lead => lead.status === 'qualified').length}
                </span>
                <span className="text-muted"> qualified</span>
              </div>
              {node.direct_reports?.length > 0 && (
                <div className="small">
                  <span className="text-info fw-medium">{node.direct_reports.length}</span>
                  <span className="text-muted"> reports</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="d-flex gap-2">
            <button
              onClick={() => handleViewUserDetails(node)}
              className="btn btn-sm btn-outline-primary"
            >
              <Eye size={14} />
            </button>
            <button className="btn btn-sm btn-outline-success">
              <Edit size={14} />
            </button>
          </div>
        </div>
        
        {/* Children */}
        {expanded && node.children?.map(child => (
          <TreeNode key={child.user_id} node={child} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="organization-tree">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Organization Structure</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <Download size={14} className="me-1" />
            Export Org Chart
          </button>
          <button className="btn btn-success btn-sm">
            <Plus size={14} className="me-1" />
            Add Position
          </button>
        </div>
      </div>
      
      {/* Department Filters */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <input type="radio" className="btn-check" name="dept" id="all" defaultChecked />
          <label className="btn btn-outline-secondary" htmlFor="all">All Departments</label>
          
          <input type="radio" className="btn-check" name="dept" id="sales" />
          <label className="btn btn-outline-success" htmlFor="sales">Sales</label>
          
          <input type="radio" className="btn-check" name="dept" id="counselling" />
          <label className="btn btn-outline-info" htmlFor="counselling">Counselling</label>
        </div>
      </div>
      
      {/* Tree Structure */}
      <div className="tree-container">
        {Object.values(buildTree()).map(rootNode => (
          <TreeNode key={rootNode.user_id} node={rootNode} level={0} />
        ))}
      </div>
      
      {/* Statistics */}
      <div className="row g-3 mt-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-primary">
                {Object.values(organizationTree).filter(u => u.level === 1).length}
              </div>
              <div className="small">Managers</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-info">
                {Object.values(organizationTree).filter(u => u.level === 2).length}
              </div>
              <div className="small">Team Members</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-success">
                {leads.filter(l => l.status === 'qualified').length}
              </div>
              <div className="small">Total Qualified</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="fw-bold text-warning">
                {Object.values(organizationTree).filter(u => u.reporting_to?.length > 1).length}
              </div>
              <div className="small">Matrix Reporting</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
  // Leads Data
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

  // Assignment Rules
  const [assignmentRules] = useState([
    {
      id: 'rule_1',
      name: 'Geographic Assignment',
      type: 'location_based',
      description: 'Auto-assign leads based on center location',
      active: true,
      conditions: {
        center_mapping: {
          'center_1': ['user_3', 'user_5'], // Delhi
          'center_2': ['user_4', 'user_6'], // Mumbai
          'center_3': ['user_4'] // Pune
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

  // Existing entities data (from original system)
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

  // States for modals and forms
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [viewDetailsUser, setViewDetailsUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addMode, setAddMode] = useState('user'); // 'user' or 'role'
  const [searchTerm, setSearchTerm] = useState('');

  // Form states (keeping original complex role form)
  const [userForm, setUserForm] = useState({
  name: '',
  email: '',
  role: '',
  permission_type: 'hierarchical',
  // Hierarchical fields
  entity_type: '',
  entity_id: '',
  multiple_entities: [],
  // Lead-based fields - UPDATED
  reporting_managers: [], // Multiple selection instead of single manager
  centers_access: [],
  // Hybrid fields
  hierarchical_entity: '',
  lead_team: ''
});

  // COMPLETE ROLE FORM STATE FROM DOCUMENT 1
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permission_type: 'hierarchical',
    view_access_type: 'SPECIFIC',
    master_level: '',
    specific_entities: [],

    // UPDATED: Hierarchical View Permissions
    view_permissions: {
      global: false,
      hierarchical_selection: {
        selected_verticals: [],
        selected_projects: [],
        selected_centers: [],
        selected_courses: [],
        selected_batches: []
      }
    },

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
      type: '',
      vertical_types: [],
      specific_entities: [],
      parent_entities: [],
      selected_levels: []
    },

    // LEAD-BASED: Permissions
    lead_permissions: {
      view_own_leads: false,
      add_leads: false,
      edit_leads: false,
      view_team_leads: false,
      manage_assignments: false
    }
  });

  // Permission analysis states
  const [analysisUser, setAnalysisUser] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisView, setAnalysisView] = useState('single');

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'teams', label: 'Team Management', icon: GitBranch },
    { id: 'assignments', label: 'Assignment Rules', icon: Target },
    { id: 'analysis', label: 'Permission Analysis', icon: Eye },
    { id: 'roles', label: 'Role Management', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // HELPER FUNCTIONS FROM DOCUMENT 1
  const getAvailableProjects = (selectedVerticals) => {
    if (!selectedVerticals || selectedVerticals.length === 0) return [];
    return entities.PROJECT.filter(project =>
      selectedVerticals.includes(project.parent_id)
    );
  };

  const getAvailableCenters = (selectedProjects) => {
    if (!selectedProjects || selectedProjects.length === 0) return [];
    return entities.CENTER.filter(center =>
      selectedProjects.includes(center.parent_id)
    );
  };

  const getAvailableCourses = (selectedCenters) => {
    if (!selectedCenters || selectedCenters.length === 0) return [];
    return entities.COURSE.filter(course =>
      selectedCenters.includes(course.parent_id)
    );
  };

  const getAvailableBatches = (selectedCourses) => {
    if (!selectedCourses || selectedCourses.length === 0) return [];
    return entities.BATCH.filter(batch =>
      selectedCourses.includes(batch.parent_id)
    );
  };

  // Helper function to update view permissions hierarchical selection
  const updateHierarchicalSelection = (level, selectedIds) => {
    const newSelection = { ...roleForm.view_permissions.hierarchical_selection };

    if (level === 'verticals') {
      newSelection.selected_verticals = selectedIds;
      newSelection.selected_projects = [];
      newSelection.selected_centers = [];
      newSelection.selected_courses = [];
      newSelection.selected_batches = [];
    } else if (level === 'projects') {
      newSelection.selected_projects = selectedIds;
      newSelection.selected_centers = [];
      newSelection.selected_courses = [];
      newSelection.selected_batches = [];
    } else if (level === 'centers') {
      newSelection.selected_centers = selectedIds;
      newSelection.selected_courses = [];
      newSelection.selected_batches = [];
    } else if (level === 'courses') {
      newSelection.selected_courses = selectedIds;
      newSelection.selected_batches = [];
    } else if (level === 'batches') {
      newSelection.selected_batches = selectedIds;
    }

    setRoleForm({
      ...roleForm,
      view_permissions: {
        ...roleForm.view_permissions,
        hierarchical_selection: newSelection
      }
    });
  };

  // Helper function to get entities for edit permissions based on current view access
  const getEditableEntitiesForLevel = (level) => {
    if (roleForm.view_permissions.global) {
      return entities[level] || [];
    }

    const hierarchical = roleForm.view_permissions.hierarchical_selection;
    if (!hierarchical) return [];

    if (level === 'VERTICAL') {
      return hierarchical.selected_verticals.map(id =>
        entities.VERTICAL.find(v => v.id === id)
      ).filter(Boolean);
    } else if (level === 'PROJECT') {
      let availableProjects = hierarchical.selected_projects.map(id =>
        entities.PROJECT.find(p => p.id === id)
      ).filter(Boolean);

      if (availableProjects.length === 0 && hierarchical.selected_verticals.length > 0) {
        availableProjects = getAvailableProjects(hierarchical.selected_verticals);
      }
      return availableProjects;
    } else if (level === 'CENTER') {
      let availableCenters = hierarchical.selected_centers.map(id =>
        entities.CENTER.find(c => c.id === id)
      ).filter(Boolean);

      if (availableCenters.length === 0 && hierarchical.selected_projects.length > 0) {
        availableCenters = getAvailableCenters(hierarchical.selected_projects);
      } else if (availableCenters.length === 0 && hierarchical.selected_verticals.length > 0) {
        const projects = getAvailableProjects(hierarchical.selected_verticals);
        availableCenters = getAvailableCenters(projects.map(p => p.id));
      }
      return availableCenters;
    } else if (level === 'COURSE') {
      let availableCourses = hierarchical.selected_courses.map(id =>
        entities.COURSE.find(c => c.id === id)
      ).filter(Boolean);

      if (availableCourses.length === 0 && hierarchical.selected_centers.length > 0) {
        availableCourses = getAvailableCourses(hierarchical.selected_centers);
      }
      return availableCourses;
    } else if (level === 'BATCH') {
      let availableBatches = hierarchical.selected_batches.map(id =>
        entities.BATCH.find(b => b.id === id)
      ).filter(Boolean);

      if (availableBatches.length === 0 && hierarchical.selected_courses.length > 0) {
        availableBatches = getAvailableBatches(hierarchical.selected_courses);
      }
      return availableBatches;
    }

    return [];
  };

  // Helper function to get child entity types
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
      permission_levels: [],
      with_child_levels: false,
      specific_entities: [],
      entity_names: []
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

  // Lead-based permission helpers
  const getLeadBasedPermissions = (role) => {
    const permissions = {
      'COUNSELLOR': {
        view_own_leads: true,
        add_leads: false,
        edit_leads: false,
        view_team_leads: false,
        manage_assignments: false
      },
      'TL_COUNSELLOR': {
        view_own_leads: true,
        add_leads: false,
        edit_leads: false,
        view_team_leads: true,
        manage_assignments: true
      },
      'SALES_EXECUTIVE': {
        view_own_leads: true,
        add_leads: true,
        edit_leads: true,
        view_team_leads: false,
        manage_assignments: false
      },
      'TL_SALES': {
        view_own_leads: true,
        add_leads: true,
        edit_leads: true,
        view_team_leads: true,
        manage_assignments: true
      },
      'SALES_MANAGER': {
        view_own_leads: true,
        add_leads: true,
        edit_leads: true,
        view_team_leads: true,
        manage_assignments: true,
        view_all_teams: true
      }
    };
    return permissions[role] || {};
  };

  // HANDLE ADD ROLE FUNCTION FROM DOCUMENT 1
  const handleAddRole = () => {
    const newRole = {
      name: roleForm.name.toUpperCase().replace(' ', '_'),
      description: roleForm.description,
      permission_type: roleForm.permission_type,
      view_access: {
        type: roleForm.view_access_type,
        master_level: roleForm.master_level,
        specific_entities: roleForm.specific_entities
      },
      view_permissions: roleForm.view_permissions,
      add_permissions: roleForm.add_permissions,
      edit_permissions: roleForm.edit_permissions,
      verify_permissions: roleForm.verify_permissions,
      lead_permissions: roleForm.lead_permissions
    };

    // Add to allRoles state
    setAllRoles(prev => ({
      ...prev,
      [newRole.name]: {
        name: roleForm.description,
        type: roleForm.permission_type
      }
    }));

    console.log('New Role Created:', newRole);

    // Reset form
    setRoleForm({
      name: '',
      description: '',
      permission_type: 'hierarchical',
      view_access_type: 'SPECIFIC',
      master_level: '',
      specific_entities: [],
      view_permissions: {
        global: false,
        hierarchical_selection: {
          selected_verticals: [],
          selected_projects: [],
          selected_centers: [],
          selected_courses: [],
          selected_batches: []
        }
      },
      add_permissions: { global: false, specific_permissions: [] },
      edit_permissions: { global: false, specific_permissions: [] },
      verify_permissions: { global: false, type: '', vertical_types: [], specific_entities: [], parent_entities: [], selected_levels: [] },
      lead_permissions: {
        view_own_leads: false,
        add_leads: false,
        edit_leads: false,
        view_team_leads: false,
        manage_assignments: false
      }
    });
    setShowAddUser(false);
  };

  // User management functions
  const handleViewUserDetails = (user) => {
    setViewDetailsUser(user);
    setShowUserDetails(true);
  };

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

  const handleAddUser = () => {
  const selectedRole = allRoles[userForm.role];
  
  const newUser = {
    user_id: `user_${Date.now()}`,
    name: userForm.name,
    email: userForm.email,
    role: userForm.role,
    
    // Entity info from role
    master_access: selectedRole.entity_binding.type,
    entity_id: selectedRole.entity_binding.entity_ids[0],
    entity_name: selectedRole.entity_binding.entity_names[0],
    
    // Permissions from role
    permissions: selectedRole.permissions
  };
};

  const getEntityName = (type, id) => {
    if (!type || !id) return '';
    const entityList = entities[type];
    const entity = entityList?.find(e => e.id === id);
    return entity?.name || '';
  };

  const getTeamMembers = (teamId) => {
    return users.filter(user => user.team_id === teamId);
  };

  // const getTeamTL = (teamId) => {
  //   const team = teams.find(t => t.id === teamId);
  //   return users.find(user => user.user_id === team?.tl_id);
  // };

  const getUserLeads = (userId) => {
    const user = users.find(u => u.user_id === userId);
    if (!user) return [];

    let accessibleLeads = [];

    // Own leads
    if (user.assigned_leads) {
      accessibleLeads = leads.filter(lead =>
        user.assigned_leads.includes(lead.lead_id)
      );
    }

    // Team leads (for TLs)
    if (user.team_leads) {
      const teamLeads = leads.filter(lead =>
        user.team_leads.includes(lead.lead_id)
      );
      accessibleLeads = [...accessibleLeads, ...teamLeads];
    }

    // Remove duplicates
    return accessibleLeads.filter((lead, index, self) =>
      index === self.findIndex(l => l.lead_id === lead.lead_id)
    );
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
                onClick={() => {
                  setAddMode('user');
                  setShowAddUser(true);
                }}
                className="btn btn-success d-flex align-items-center gap-2"
              >
                <UserPlus size={16} />
                <span>Add User</span>
              </button>

              {/* ADD ROLE BUTTON - Only show for hierarchical/content management */}
              {(permissionMode === 'hierarchical' || permissionMode === 'unified') && (
                <button
                  onClick={() => {
                    setAddMode('role');
                    setRoleForm(prev => ({ ...prev, permission_type: 'hierarchical' }));
                    setShowAddUser(true);
                  }}
                  className="btn btn-info d-flex align-items-center gap-2"
                >
                  <Shield size={16} />
                  <span>Add Role</span>
                </button>
              )}
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
                              {user.team_id && (
                                <div>
                                  {/* <div className="fw-medium">
                                    {teams.find(t => t.id === user.team_id)?.name}
                                  </div>
                                  {user.manager_id && (
                                    <div className="text-muted">
                                      Manager: {users.find(u => u.user_id === user.manager_id)?.name}
                                    </div>
                                  )} */}
                                </div>
                              )}
                              {user.permission_type === 'hierarchical' && (
                                <div className="text-muted">{user.entity_name}</div>
                              )}
                            </div>
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
                                onClick={() => handleViewUserDetails(user)}
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
        )}

        {/* Team Management Tab */}
        {activeTab === 'teams' && (
          <OrganizationTree />
        )}

        {/* Assignment Rules Tab */}
        {activeTab === 'assignments' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3>Assignment Rules</h3>
              <button className="btn btn-success d-flex align-items-center gap-2">
                <Plus size={16} />
                <span>Create Rule</span>
              </button>
            </div>

            <div className="row g-4">
              {assignmentRules.map((rule) => (
                <div key={rule.id} className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="card-title mb-0">{rule.name}</h5>
                          <div className="text-muted small">{rule.type.replace('_', ' ')}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${rule.active ? 'bg-success' : 'bg-secondary'}`}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={rule.active}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="text-muted mb-3">{rule.description}</p>

                      {rule.type === 'location_based' && (
                        <div>
                          <h6 className="fw-medium mb-2">Center Mapping</h6>
                          {Object.entries(rule.conditions.center_mapping).map(([centerId, userIds]) => {
                            const center = entities.CENTER.find(c => c.id === centerId);
                            return (
                              <div key={centerId} className="mb-2">
                                <div className="fw-medium small">{center?.name}</div>
                                <div className="small text-muted">
                                  → {userIds.map(userId =>
                                    users.find(u => u.user_id === userId)?.name
                                  ).join(', ')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {rule.type === 'course_based' && (
                        <div>
                          <h6 className="fw-medium mb-2">Course Specialization</h6>
                          {Object.entries(rule.conditions.course_mapping).map(([course, userIds]) => (
                            <div key={course} className="mb-2">
                              <div className="fw-medium small">{course}</div>
                              <div className="small text-muted">
                                → {userIds.map(userId =>
                                  users.find(u => u.user_id === userId)?.name
                                ).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {rule.type === 'load_based' && (
                        <div>
                          <h6 className="fw-medium mb-2">Load Balancing</h6>
                          <div className="small">
                            <div>Max leads per user: {rule.conditions.max_leads_per_user}</div>
                            <div>Rebalance: {rule.conditions.rebalance_frequency}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary">
                          <Edit size={14} className="me-1" />
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-info">
                          <Eye size={14} className="me-1" />
                          Test
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <Trash2 size={14} className="me-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Tab - keeping original complexity */}
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
                              const user = users.find(u => u.user_id === e.target.value);
                              setAnalysisResult(user);
                            }
                          }}
                          className="form-select"
                        >
                          <option value="">Choose a user...</option>
                          {users.map(user => (
                            <option key={user.user_id} value={user.user_id}>
                              {user.name} ({allRoles[user.role]?.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {analysisResult && (
                        <div>
                          <div className="card bg-light mb-4">
                            <div className="card-body">
                              <h5 className="card-title">User Summary</h5>
                              <div className="row g-2 small">
                                <div className="col-6">
                                  <span className="text-muted">Permission Type:</span>
                                </div>
                                <div className="col-6">
                                  <span className="fw-medium">
                                    {analysisResult.permission_type === 'hierarchical' && '📋 Content Management'}
                                    {analysisResult.permission_type === 'lead_based' && '🎯 Lead Management'}
                                    {analysisResult.permission_type === 'hybrid' && '⚡ Hybrid Access'}
                                  </span>
                                </div>
                                <div className="col-6">
                                  <span className="text-muted">Role:</span>
                                </div>
                                <div className="col-6">
                                  <span className="fw-medium">{allRoles[analysisResult.role]?.name}</span>
                                </div>
                                {analysisResult.permission_type !== 'lead_based' && (
                                  <>
                                    <div className="col-6">
                                      <span className="text-muted">Entity Control:</span>
                                    </div>
                                    <div className="col-6">
                                      <span className="fw-medium">{analysisResult.entity_name}</span>
                                    </div>
                                  </>
                                )}
                                {analysisResult.permission_type !== 'hierarchical' && (
                                  <>
                                    <div className="col-6">
                                      <span className="text-muted">Assigned Leads:</span>
                                    </div>
                                    <div className="col-6">
                                      <span className="fw-medium">{analysisResult.assigned_leads?.length || 0}</span>
                                    </div>
                                  </>
                                )}
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
                          {analysisResult.permission_type === 'hierarchical' && (
                            <>
                              <div className="col-12">
                                <div className="card border-primary">
                                  <div className="card-body">
                                    <h6 className="card-title text-primary mb-2">📋 Content Access</h6>
                                    <p className="card-text small text-primary mb-0">
                                      Can access {analysisResult.entity_name} and all its children content
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="card border-success">
                                  <div className="card-body">
                                    <h6 className="card-title text-success mb-2">➕ Add Permissions</h6>
                                    <p className="card-text small text-success mb-0">
                                      Can add content based on role level and hierarchy
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {analysisResult.permission_type === 'lead_based' && (
                            <>
                              <div className="col-12">
                                <div className="card border-success">
                                  <div className="card-body">
                                    <h6 className="card-title text-success mb-2">🎯 Lead Access</h6>
                                    <p className="card-text small text-success mb-0">
                                      {analysisResult.assigned_leads?.length || 0} assigned leads
                                      {analysisResult.team_leads && ` + ${analysisResult.team_leads.length - (analysisResult.assigned_leads?.length || 0)} team leads`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="card border-info">
                                  <div className="card-body">
                                    <h6 className="card-title text-info mb-2">📋 Dynamic Center Access</h6>
                                    <p className="card-text small text-info mb-0">
                                      Access to {analysisResult.centers_access?.length || 0} centers based on lead assignments
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {analysisResult.permission_type === 'hybrid' && (
                            <>
                              <div className="col-12">
                                <div className="card border-warning">
                                  <div className="card-body">
                                    <h6 className="card-title text-warning mb-2">⚡ Hybrid Access</h6>
                                    <p className="card-text small text-warning mb-0">
                                      Content: {analysisResult.entity_name}<br />
                                      Leads: {analysisResult.assigned_leads?.length || 0} direct + team management
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Role Management Tab */}
        {activeTab === 'roles' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3>Role Management</h3>
              <button
                onClick={() => {
                  setAddMode('role');
                  setRoleForm(prev => ({ ...prev, permission_type: 'hierarchical' }));
                  setShowAddUser(true);
                }}
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
          </div>
        )}
      </div>

      {/* Add User/Role Modal */}
      {showAddUser && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className={`modal-dialog ${addMode === 'role' ? 'modal-xl' : 'modal-lg'} modal-dialog-scrollable`}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {addMode === 'user' ? 'Add New User' : 'Create New Role'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddUser(false)}
                ></button>
              </div>
              <div className="modal-body">
                {addMode === 'user' ? (
                  /* USER FORM */
                  <div className="row g-3">
                    {/* Basic Info */}
                    <div className="col-12">
                      <h6 className="fw-medium mb-3">Basic Information</h6>
                    </div>
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

                    {/* Permission Type Selection */}
                    <div className="col-12">
                      <h6 className="fw-medium mb-3 mt-4">Permission Type</h6>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <div className="form-check">
                            <input
                              type="radio"
                              name="permission_type"
                              value="hierarchical"
                              checked={userForm.permission_type === 'hierarchical'}
                              onChange={(e) => setUserForm({
                                ...userForm,
                                permission_type: e.target.value,
                                role: ''
                              })}
                              className="form-check-input"
                              id="perm_hierarchical"
                            />
                            <label className="form-check-label" htmlFor="perm_hierarchical">
                              <div className="fw-medium text-info">📋 Content Management</div>
                              <div className="small text-muted">Hierarchical content permissions</div>
                            </label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input
                              type="radio"
                              name="permission_type"
                              value="lead_based"
                              checked={userForm.permission_type === 'lead_based'}
                              onChange={(e) => setUserForm({
                                ...userForm,
                                permission_type: e.target.value,
                                role: ''
                              })}
                              className="form-check-input"
                              id="perm_lead_based"
                            />
                            <label className="form-check-label" htmlFor="perm_lead_based">
                              <div className="fw-medium text-success">🎯 Lead Management</div>
                              <div className="small text-muted">Team & lead-based access</div>
                            </label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input
                              type="radio"
                              name="permission_type"
                              value="hybrid"
                              checked={userForm.permission_type === 'hybrid'}
                              onChange={(e) => setUserForm({
                                ...userForm,
                                permission_type: e.target.value,
                                role: ''
                              })}
                              className="form-check-input"
                              id="perm_hybrid"
                            />
                            <label className="form-check-label" htmlFor="perm_hybrid">
                              <div className="fw-medium text-warning">⚡ Hybrid Access</div>
                              <div className="small text-muted">Both content & lead management</div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="col-12">
                      <label className="form-label">Role</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        className="form-select"
                      >
                        <option value="">Select Role</option>
                        {Object.entries(allRoles)
                          .filter(([key, role]) =>
                            userForm.permission_type === 'hybrid' ? role.type === 'hybrid' :
                              role.type === userForm.permission_type
                          )
                          .map(([roleKey, role]) => (
                            <option key={roleKey} value={roleKey}>{role.name}</option>
                          ))}
                      </select>
                    </div>

                    {/* Conditional Fields based on Permission Type */}


                    {userForm.permission_type === 'lead_based' && (
  <>
    <div className="col-12">
      <label className="form-label">Reporting Managers</label>
      <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <div className="small text-muted mb-2">Select one or multiple reporting managers:</div>
        {users
          .filter(user => 
            // Show only users who can be managers (TL roles, managers, etc.)
            ['TL_COUNSELLOR', 'TL_SALES', 'SALES_MANAGER', 'CENTER_SALES_HEAD'].includes(user.role)
          )
          .map(manager => (
            <div key={manager.user_id} className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={userForm.reporting_managers.includes(manager.user_id)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...userForm.reporting_managers, manager.user_id]
                    : userForm.reporting_managers.filter(id => id !== manager.user_id);
                  setUserForm({ ...userForm, reporting_managers: updated });
                }}
                id={`manager_${manager.user_id}`}
              />
              <label className="form-check-label" htmlFor={`manager_${manager.user_id}`}>
                <div className="fw-medium">{manager.name}</div>
                <div className="small text-muted">{allRoles[manager.role]?.name} - {manager.entity_name}</div>
              </label>
            </div>
          ))}
      </div>
      {userForm.reporting_managers.length > 0 && (
        <div className="form-text text-success mt-2">
          ✅ Selected {userForm.reporting_managers.length} reporting manager(s)
        </div>
      )}
    </div>

    <div className="col-12">
      <label className="form-label">Center Access</label>
      <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
        <div className="small text-muted mb-2">Select centers this user can access:</div>
        <div className="row">
          {entities.CENTER.map(center => (
            <div key={center.id} className="col-6">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={userForm.centers_access.includes(center.id)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...userForm.centers_access, center.id]
                      : userForm.centers_access.filter(id => id !== center.id);
                    setUserForm({ ...userForm, centers_access: updated });
                  }}
                />
                <label className="form-check-label small">{center.name}</label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
)}

                    {userForm.permission_type === 'hybrid' && (
                      <>
                        <div className="col-12">
                          <h6 className="fw-medium mb-3 mt-3">📋 Content Management Assignment</h6>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Entity Type</label>
                          <select
                            value={userForm.entity_type}
                            onChange={(e) => setUserForm({ ...userForm, entity_type: e.target.value })}
                            className="form-select"
                          >
                            <option value="">Select Entity Type</option>
                            <option value="CENTER">Center</option>
                            <option value="PROJECT">Project</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Entity</label>
                          <select
                            value={userForm.hierarchical_entity}
                            onChange={(e) => setUserForm({ ...userForm, hierarchical_entity: e.target.value })}
                            className="form-select"
                          >
                            <option value="">Select Entity</option>
                            {userForm.entity_type && entities[userForm.entity_type]?.map(entity => (
                              <option key={entity.id} value={entity.id}>{entity.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-12">
                          <h6 className="fw-medium mb-3 mt-3">🎯 Lead Management Assignment</h6>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Lead Team</label>
                          <select
                            value={userForm.lead_team}
                            onChange={(e) => setUserForm({ ...userForm, lead_team: e.target.value })}
                            className="form-select"
                          >
                            <option value="">Select Lead Team</option>
                            {/* {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))} */}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Role Description */}
                    {userForm.role && (
                      <div className="col-12">
                        <div className="alert alert-light">
                          <h6 className="alert-heading">Role: {allRoles[userForm.role]?.name}</h6>
                          <div className="small">
                            {userForm.permission_type === 'hierarchical' && '📋 Hierarchical content management permissions'}
                            {userForm.permission_type === 'lead_based' && '🎯 Team-based lead management permissions'}
                            {userForm.permission_type === 'hybrid' && '⚡ Combined content management + lead management permissions'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ROLE FORM - COMPLETE FROM DOCUMENT 1 */
                  <div>
                    <div className="row g-4">
                      {/* Basic Information */}
                      <div className="col-12">
                        <h5 className="border-bottom pb-2">Basic Information</h5>

                        <div className="row g-3 mt-2">
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
                        </div>
                      </div>

                      {/* VIEW PERMISSIONS SECTION */}
                      <div className="col-12">
                        <h5 className="border-bottom pb-2">View Permissions</h5>

                        <div className="mt-3">
                          {/* Global or Specific Choice */}
                          <div className="row g-2 mb-4">
                            <div className="col-12">
                              <div className="form-check mb-2">
                                <input
                                  type="radio"
                                  name="view_access_type"
                                  value="GLOBAL"
                                  checked={roleForm.view_permissions.global}
                                  onChange={(e) => setRoleForm({
                                    ...roleForm,
                                    view_permissions: {
                                      global: true,
                                      hierarchical_selection: {
                                        selected_verticals: [],
                                        selected_projects: [],
                                        selected_centers: [],
                                        selected_courses: [],
                                        selected_batches: []
                                      }
                                    }
                                  })}
                                  className="form-check-input"
                                  id="view_global"
                                />
                                <label className="form-check-label fw-medium" htmlFor="view_global">
                                  🌍 Global View Access
                                </label>
                                <div className="text-muted small">Can view all content across the entire system</div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="form-check">
                                <input
                                  type="radio"
                                  name="view_access_type"
                                  value="SPECIFIC"
                                  checked={!roleForm.view_permissions.global}
                                  onChange={(e) => setRoleForm({
                                    ...roleForm,
                                    view_permissions: {
                                      global: false,
                                      hierarchical_selection: {
                                        selected_verticals: [],
                                        selected_projects: [],
                                        selected_centers: [],
                                        selected_courses: [],
                                        selected_batches: []
                                      }
                                    }
                                  })}
                                  className="form-check-input"
                                  id="view_specific"
                                />
                                <label className="form-check-label fw-medium" htmlFor="view_specific">
                                  🎯 Specific Hierarchical Access
                                </label>
                                <div className="text-muted small">Select specific verticals, then their projects, centers, etc.</div>
                              </div>
                            </div>
                          </div>

                          {/* Hierarchical Selection */}
                          {!roleForm.view_permissions.global && (
                            <div className="card border" style={{ backgroundColor: '#f8f9fa' }}>
                              <div className="card-body">
                                <h6 className="card-title text-dark mb-4 d-flex align-items-center gap-2">
                                  <span className="badge bg-secondary">📊</span>
                                  Hierarchical View Selection
                                </h6>

                                {/* Step 1: Select Verticals */}
                                <div className="mb-4">
                                  <div className="d-flex align-items-center gap-2 mb-3">
                                    <span className="badge bg-dark text-white">1</span>
                                    <label className="form-label fw-medium mb-0 text-dark">Select Verticals</label>
                                  </div>
                                  <div className="border rounded p-3 bg-white shadow-sm">
                                    {entities.VERTICAL.map(vertical => (
                                      <div key={vertical.id} className="form-check mb-2">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          checked={roleForm.view_permissions.hierarchical_selection.selected_verticals.includes(vertical.id)}
                                          onChange={(e) => {
                                            const current = roleForm.view_permissions.hierarchical_selection.selected_verticals;
                                            const updated = e.target.checked
                                              ? [...current, vertical.id]
                                              : current.filter(id => id !== vertical.id);
                                            updateHierarchicalSelection('verticals', updated);
                                          }}
                                          id={`vertical_${vertical.id}`}
                                        />
                                        <label className="form-check-label fw-medium text-dark" htmlFor={`vertical_${vertical.id}`}>
                                          {vertical.name}
                                        </label>
                                      </div>
                                    ))}
                                    {roleForm.view_permissions.hierarchical_selection.selected_verticals.length > 0 && (
                                      <div className="alert alert-light border-success py-2 mt-2 mb-0">
                                        <small className="text-success fw-medium">✅ Selected {roleForm.view_permissions.hierarchical_selection.selected_verticals.length} vertical(s)</small>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Step 2: Select Projects (Only if verticals are selected) */}
                                {roleForm.view_permissions.hierarchical_selection.selected_verticals.length > 0 && (
                                  <div className="mb-4">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                      <span className="badge bg-primary text-white">2</span>
                                      <label className="form-label fw-medium mb-0 text-dark">Select Projects</label>
                                      <small className="text-muted">(from selected verticals)</small>
                                    </div>
                                    <div className="border rounded p-3 bg-white shadow-sm">
                                      {(() => {
                                        const availableProjects = getAvailableProjects(roleForm.view_permissions.hierarchical_selection.selected_verticals);
                                        if (availableProjects.length === 0) {
                                          return <div className="text-muted small">No projects found in selected verticals</div>;
                                        }
                                        return availableProjects.map(project => (
                                          <div key={project.id} className="form-check mb-2">
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={roleForm.view_permissions.hierarchical_selection.selected_projects.includes(project.id)}
                                              onChange={(e) => {
                                                const current = roleForm.view_permissions.hierarchical_selection.selected_projects;
                                                const updated = e.target.checked
                                                  ? [...current, project.id]
                                                  : current.filter(id => id !== project.id);
                                                updateHierarchicalSelection('projects', updated);
                                              }}
                                              id={`project_${project.id}`}
                                            />
                                            <label className="form-check-label fw-medium text-dark" htmlFor={`project_${project.id}`}>
                                              {project.name}
                                              <small className="text-muted ms-2">
                                                (from {entities.VERTICAL.find(v => v.id === project.parent_id)?.name})
                                              </small>
                                            </label>
                                          </div>
                                        ));
                                      })()}
                                      {roleForm.view_permissions.hierarchical_selection.selected_projects.length > 0 && (
                                        <div className="alert alert-light border-primary py-2 mt-2 mb-0">
                                          <small className="text-primary fw-medium">✅ Selected {roleForm.view_permissions.hierarchical_selection.selected_projects.length} project(s)</small>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Step 3: Select Centers (Only if projects are selected) */}
                                {roleForm.view_permissions.hierarchical_selection.selected_projects.length > 0 && (
                                  <div className="mb-4">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                      <span className="badge bg-info text-white">3</span>
                                      <label className="form-label fw-medium mb-0 text-dark">Select Centers</label>
                                      <small className="text-muted">(from selected projects)</small>
                                    </div>
                                    <div className="border rounded p-3 bg-white shadow-sm">
                                      {(() => {
                                        const availableCenters = getAvailableCenters(roleForm.view_permissions.hierarchical_selection.selected_projects);
                                        if (availableCenters.length === 0) {
                                          return <div className="text-muted small">No centers found in selected projects</div>;
                                        }
                                        return availableCenters.map(center => (
                                          <div key={center.id} className="form-check mb-2">
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={roleForm.view_permissions.hierarchical_selection.selected_centers.includes(center.id)}
                                              onChange={(e) => {
                                                const current = roleForm.view_permissions.hierarchical_selection.selected_centers;
                                                const updated = e.target.checked
                                                  ? [...current, center.id]
                                                  : current.filter(id => id !== center.id);
                                                updateHierarchicalSelection('centers', updated);
                                              }}
                                              id={`center_${center.id}`}
                                            />
                                            <label className="form-check-label fw-medium text-dark" htmlFor={`center_${center.id}`}>
                                              {center.name}
                                              <small className="text-muted ms-2">
                                                (from {entities.PROJECT.find(p => p.id === center.parent_id)?.name})
                                              </small>
                                            </label>
                                          </div>
                                        ));
                                      })()}
                                      {roleForm.view_permissions.hierarchical_selection.selected_centers.length > 0 && (
                                        <div className="alert alert-light border-info py-2 mt-2 mb-0">
                                          <small className="text-info fw-medium">✅ Selected {roleForm.view_permissions.hierarchical_selection.selected_centers.length} center(s)</small>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Selection Summary */}
                                {(roleForm.view_permissions.hierarchical_selection.selected_verticals.length > 0 ||
                                  roleForm.view_permissions.hierarchical_selection.selected_projects.length > 0 ||
                                  roleForm.view_permissions.hierarchical_selection.selected_centers.length > 0 ||
                                  roleForm.view_permissions.hierarchical_selection.selected_courses.length > 0 ||
                                  roleForm.view_permissions.hierarchical_selection.selected_batches.length > 0) && (
                                    <div className="alert alert-light border-success">
                                      <h6 className="alert-heading text-success d-flex align-items-center gap-2">
                                        <span>📋</span>
                                        Selection Summary
                                      </h6>
                                      <div className="small text-dark">
                                        {roleForm.view_permissions.hierarchical_selection.selected_verticals.length > 0 && (
                                          <div className="mb-1">• <strong>Verticals:</strong> {roleForm.view_permissions.hierarchical_selection.selected_verticals.length} selected</div>
                                        )}
                                        {roleForm.view_permissions.hierarchical_selection.selected_projects.length > 0 && (
                                          <div className="mb-1">• <strong>Projects:</strong> {roleForm.view_permissions.hierarchical_selection.selected_projects.length} selected</div>
                                        )}
                                        {roleForm.view_permissions.hierarchical_selection.selected_centers.length > 0 && (
                                          <div className="mb-1">• <strong>Centers:</strong> {roleForm.view_permissions.hierarchical_selection.selected_centers.length} selected</div>
                                        )}
                                        {roleForm.view_permissions.hierarchical_selection.selected_courses.length > 0 && (
                                          <div className="mb-1">• <strong>Courses:</strong> {roleForm.view_permissions.hierarchical_selection.selected_courses.length} selected</div>
                                        )}
                                        {roleForm.view_permissions.hierarchical_selection.selected_batches.length > 0 && (
                                          <div className="mb-1">• <strong>Batches:</strong> {roleForm.view_permissions.hierarchical_selection.selected_batches.length} selected</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
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
                                    className="btn btn-success btn-sm"
                                  >
                                    + Add Permission
                                  </button>
                                </div>

                                {/* Check if view permissions are configured */}
                                {(!roleForm.view_permissions.global &&
                                  (!roleForm.view_permissions.hierarchical_selection ||
                                    roleForm.view_permissions.hierarchical_selection.selected_verticals.length === 0)) && (
                                    <div className="alert alert-warning py-2">
                                      <p className="mb-0 small">⚠️ Please configure View Permissions first. Add permissions depend on your view access.</p>
                                    </div>
                                  )}

                                {roleForm.add_permissions.specific_permissions.length === 0 && (
                                  roleForm.view_permissions.global ||
                                  (roleForm.view_permissions.hierarchical_selection &&
                                    roleForm.view_permissions.hierarchical_selection.selected_verticals.length > 0)
                                ) && (
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

                                      {/* Step 1: Select Level */}
                                      <div className="row g-3">
                                        <div className="col-12">
                                          <label className="form-label small fw-medium">
                                            1️⃣ Select Level for Add Permission
                                          </label>
                                          <select
                                            value={permission.permission_level || ''}
                                            onChange={(e) => updateAddPermission(permission.id, 'permission_level', e.target.value)}
                                            className="form-select form-select-sm"
                                          >
                                            <option value="">Select Level</option>
                                            {['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'].map(level => (
                                              <option key={level} value={level}>
                                                {level} Level
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Step 2: Select Entities */}
                                        {permission.permission_level && (
                                          <div className="col-12">
                                            <label className="form-label small fw-medium">
                                              2️⃣ Select {permission.permission_level.toLowerCase()}(s) where they can add content
                                            </label>

                                            {/* If global view access, show all entities of selected level */}
                                            {roleForm.view_permissions.global ? (
                                              <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {entities[permission.permission_level]?.map(entity => (
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
                                                ))}
                                              </div>
                                            ) : (
                                              /* If specific view access, show filtered entities */
                                              <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {(() => {
                                                  const availableEntities = getEditableEntitiesForLevel(permission.permission_level);

                                                  if (availableEntities.length === 0) {
                                                    return (
                                                      <div className="small text-muted fst-italic p-2">
                                                        No {permission.permission_level.toLowerCase()} entities available based on your view permissions
                                                      </div>
                                                    );
                                                  }

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
                                            )}

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

                      {/* Edit Permissions Section */}
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
                                    className="btn btn-warning btn-sm"
                                  >
                                    + Add Edit Permission
                                  </button>
                                </div>

                                {/* Check if view permissions are configured */}
                                {(!roleForm.view_permissions.global &&
                                  (!roleForm.view_permissions.hierarchical_selection ||
                                    roleForm.view_permissions.hierarchical_selection.selected_verticals.length === 0)) && (
                                    <div className="alert alert-warning py-2">
                                      <p className="mb-0 small">⚠️ Please configure View Permissions first. Edit permissions depend on your view access.</p>
                                    </div>
                                  )}

                                {roleForm.edit_permissions.specific_permissions.length === 0 && (
                                  roleForm.view_permissions.global ||
                                  (roleForm.view_permissions.hierarchical_selection &&
                                    roleForm.view_permissions.hierarchical_selection.selected_verticals.length > 0)
                                ) && (
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
                                                    updateEditPermission(permission.id, 'edit_type', e.target.value);
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

                                        {/* Option 1: Specific Entity Level (Multi-select levels) */}
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
                                                        const current = permission.permission_levels || [];
                                                        const updated = e.target.checked
                                                          ? [...current, level]
                                                          : current.filter(l => l !== level);
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
                                          </div>
                                        )}

                                        {/* Option 2: Specific Entity Level with All Child Level */}
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
                                                  {/* If global view access, show all entities of selected level */}
                                                  {roleForm.view_permissions.global ? (
                                                    entities[permission.permission_levels[0]]?.map(entity => (
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
                                                    ))
                                                  ) : (
                                                    /* If specific view access, show filtered entities */
                                                    (() => {
                                                      const availableEntities = getEditableEntitiesForLevel(permission.permission_levels[0]);

                                                      if (availableEntities.length === 0) {
                                                        return (
                                                          <div className="small text-muted fst-italic p-2">
                                                            No {permission.permission_levels[0].toLowerCase()} entities available based on your view permissions
                                                          </div>
                                                        );
                                                      }

                                                      return availableEntities.map(entity => (
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
                                                      ));
                                                    })()
                                                  )}
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

                                        {/* Option 3: Specific Entity Names */}
                                        {(permission.edit_type === 'specific_entity_and_children' || permission.edit_type === 'specific_entities_only') && (
                                          <div className="col-12">
                                            <label className="form-label small fw-medium">
                                              2️⃣ Select Specific Entities by Name:
                                            </label>

                                            <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                              {/* If global view access, show all entities */}
                                              {roleForm.view_permissions.global ? (
                                                getAllEntitiesForSelection().map(entity => (
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
                                                ))
                                              ) : (
                                                /* If specific view access, show filtered entities */
                                                (() => {
                                                  const viewableEntities = [];
                                                  const hierarchical = roleForm.view_permissions.hierarchical_selection;

                                                  // Get viewable entities based on hierarchical selection
                                                  if (hierarchical) {
                                                    // Add selected verticals
                                                    hierarchical.selected_verticals.forEach(verticalId => {
                                                      const vertical = entities.VERTICAL.find(v => v.id === verticalId);
                                                      if (vertical) {
                                                        viewableEntities.push({
                                                          ...vertical,
                                                          entity_type: 'VERTICAL',
                                                          full_name: `${vertical.name} (VERTICAL)`
                                                        });
                                                      }
                                                    });

                                                    // Add available projects
                                                    const availableProjects = getAvailableProjects(hierarchical.selected_verticals);
                                                    availableProjects.forEach(project => {
                                                      viewableEntities.push({
                                                        ...project,
                                                        entity_type: 'PROJECT',
                                                        full_name: `${project.name} (PROJECT)`
                                                      });
                                                    });

                                                    // Add available centers
                                                    const availableCenters = getAvailableCenters(hierarchical.selected_projects.length > 0 ? hierarchical.selected_projects : availableProjects.map(p => p.id));
                                                    availableCenters.forEach(center => {
                                                      viewableEntities.push({
                                                        ...center,
                                                        entity_type: 'CENTER',
                                                        full_name: `${center.name} (CENTER)`
                                                      });
                                                    });

                                                    // Add available courses
                                                    const availableCourses = getAvailableCourses(hierarchical.selected_centers.length > 0 ? hierarchical.selected_centers : availableCenters.map(c => c.id));
                                                    availableCourses.forEach(course => {
                                                      viewableEntities.push({
                                                        ...course,
                                                        entity_type: 'COURSE',
                                                        full_name: `${course.name} (COURSE)`
                                                      });
                                                    });

                                                    // Add available batches
                                                    const availableBatches = getAvailableBatches(hierarchical.selected_courses.length > 0 ? hierarchical.selected_courses : availableCourses.map(c => c.id));
                                                    availableBatches.forEach(batch => {
                                                      viewableEntities.push({
                                                        ...batch,
                                                        entity_type: 'BATCH',
                                                        full_name: `${batch.name} (BATCH)`
                                                      });
                                                    });
                                                  }

                                                  if (viewableEntities.length === 0) {
                                                    return (
                                                      <div className="small text-muted fst-italic p-2">
                                                        No entities available based on your view permissions
                                                      </div>
                                                    );
                                                  }

                                                  return viewableEntities.map(entity => (
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
                                                  ));
                                                })()
                                              )}
                                            </div>
                                            {permission.entity_names?.length > 0 && (
                                              <div className="alert alert-warning py-2 mt-2">
                                                <p className="mb-0 small">
                                                  ✅ Selected {permission.entity_names.length} specific entities
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
                      <div className="col-12">
                        <h5 className="border-bottom pb-2">Verify Permissions</h5>

                        <div className="mt-3">
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

                                      {/* Check if view permissions are configured */}
                                      {(!roleForm.view_permissions.global &&
                                        (!roleForm.view_permissions.hierarchical_selection ||
                                          roleForm.view_permissions.hierarchical_selection.selected_verticals.length === 0)) && (
                                          <div className="alert alert-warning py-2 mb-3">
                                            <p className="mb-0 small">⚠️ Please configure View Permissions first. Verify permissions depend on your view access.</p>
                                          </div>
                                        )}

                                      {/* If global view access, show all entities */}
                                      {roleForm.view_permissions.global ? (
                                        Object.entries(entities).map(([entityType, entityList]) => (
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
                                        ))
                                      ) : (
                                        /* If specific view access, show filtered entities */
                                        (() => {
                                          const hierarchical = roleForm.view_permissions.hierarchical_selection;
                                          const viewableEntitiesForVerify = {};

                                          if (hierarchical) {
                                            // Add selected verticals
                                            if (hierarchical.selected_verticals.length > 0) {
                                              viewableEntitiesForVerify.VERTICAL = hierarchical.selected_verticals.map(id =>
                                                entities.VERTICAL.find(v => v.id === id)
                                              ).filter(Boolean);
                                            }

                                            // Add available projects
                                            const availableProjects = getAvailableProjects(hierarchical.selected_verticals);
                                            if (availableProjects.length > 0) {
                                              viewableEntitiesForVerify.PROJECT = availableProjects;
                                            }

                                            // Add available centers
                                            const availableCenters = getAvailableCenters(hierarchical.selected_projects.length > 0 ? hierarchical.selected_projects : availableProjects.map(p => p.id));
                                            if (availableCenters.length > 0) {
                                              viewableEntitiesForVerify.CENTER = availableCenters;
                                            }

                                            // Add available courses
                                            const availableCourses = getAvailableCourses(hierarchical.selected_centers.length > 0 ? hierarchical.selected_centers : availableCenters.map(c => c.id));
                                            if (availableCourses.length > 0) {
                                              viewableEntitiesForVerify.COURSE = availableCourses;
                                            }

                                            // Add available batches
                                            const availableBatches = getAvailableBatches(hierarchical.selected_courses.length > 0 ? hierarchical.selected_courses : availableCourses.map(c => c.id));
                                            if (availableBatches.length > 0) {
                                              viewableEntitiesForVerify.BATCH = availableBatches;
                                            }
                                          }

                                          if (Object.keys(viewableEntitiesForVerify).length === 0) {
                                            return (
                                              <div className="small text-muted fst-italic p-2">
                                                No entities available based on your view permissions
                                              </div>
                                            );
                                          }

                                          return Object.entries(viewableEntitiesForVerify).map(([entityType, entityList]) => (
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
                                          ));
                                        })()
                                      )}

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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={
                    addMode === 'user'
                      ? (!userForm.name || !userForm.email || !userForm.role)
                      : (!roleForm.name || !roleForm.description)
                  }
                  className={`btn ${addMode === 'user' ? 'btn-success' : 'btn-info'}`}
                >
                  {addMode === 'user' ? 'Add User' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedPermissionDashboard;