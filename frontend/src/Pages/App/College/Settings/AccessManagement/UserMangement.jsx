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
  onViewUserDetails,
  onStatusChange, // Function to handle status changes
  onEditUser,     // Function to handle user editing
  onDeleteUser    // Function to handle user deletion
}) => {
  const [activeTab, setActiveTab] = useState('active');

  const handleStatusChange = (userId, currentStatus) => {
    // Toggle the status and call the parent function
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    onStatusChange(userId, newStatus);
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by tab (active/inactive status)
    filtered = filtered.filter(user => {
      if (activeTab === 'active') {
        return user.status === 'active';
      } else {
        return user.status !== 'active';
      }
    });

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

  const getActiveUsersCount = () => users.filter(user => user.status === 'active').length;
  const getInactiveUsersCount = () => users.filter(user => user.status !== 'active').length;

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
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active Users ({getActiveUsersCount()})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`}
                onClick={() => setActiveTab('inactive')}
              >
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
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`userStatus${user.user_id}`}
                            checked={user.status === 'active'}
                            onChange={() => handleStatusChange(user.user_id, user.status)}
                          />
                          <label 
                            className="form-check-label" 
                            htmlFor={`userStatus${user.user_id}`}
                          >
                            <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                              {user.status}
                            </span>
                          </label>
                        </div>
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
                          <button 
                            onClick={() => onEditUser && onEditUser(user)}
                            className="btn btn-sm btn-outline-success" 
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteUser && onDeleteUser(user)}
                            className="btn btn-sm btn-outline-danger" 
                            title="Delete User"
                          >
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
      
      {getFilteredUsers().length === 0 && (
        <div className="text-center py-4">
          <Users size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No users found</h5>
          <p className="text-muted">Try adjusting your search criteria or filters.</p>
        </div>
      )}


      <style>
        {

          `
          /* Toggle Button CSS */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s ease;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Active state */
input:checked + .toggle-slider {
  background-color: #FC2B5A;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* Focus state for accessibility */
input:focus + .toggle-slider {
  box-shadow: 0 0 0 2px rgba(252, 43, 90, 0.3);
}

/* Hover effects */
.toggle-slider:hover {
  opacity: 0.9;
}

/* Disabled state */
input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

input:disabled + .toggle-slider:hover {
  opacity: 0.5;
}

/* Alternative larger size */
.toggle-switch.large {
  width: 60px;
  height: 30px;
}

.toggle-switch.large .toggle-slider {
  border-radius: 30px;
}

.toggle-switch.large .toggle-slider:before {
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
}

.toggle-switch.large input:checked + .toggle-slider:before {
  transform: translateX(30px);
}

/* Alternative smaller size */
.toggle-switch.small {
  width: 40px;
  height: 20px;
}

.toggle-switch.small .toggle-slider {
  border-radius: 20px;
}

.toggle-switch.small .toggle-slider:before {
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
}

.toggle-switch.small input:checked + .toggle-slider:before {
  transform: translateX(20px);
} 
          
          `
        }
      </style>
    </div>
  );
};

export default UserManagement;


// import React, { useState } from 'react';
// import {
//   Users,
//   Search,
//   Filter,
//   Download,
//   Eye,
//   Edit,
//   Trash2
// } from 'lucide-react';

// const UserManagement = ({
//   users,
//   allRoles,
//   permissionMode,
//   searchTerm,
//   setSearchTerm,
//   onViewUserDetails
// }) => {
//   const getFilteredUsers = () => {
//     let filtered = users;

//     // Filter by permission mode
//     if (permissionMode !== 'unified') {
//       filtered = filtered.filter(user => {
//         if (permissionMode === 'hierarchical') {
//           return user.permission_type === 'hierarchical' || user.permission_type === 'hybrid';
//         } else if (permissionMode === 'lead_based') {
//           return user.permission_type === 'lead_based' || user.permission_type === 'hybrid';
//         }
//         return true;
//       });
//     }

//     // Filter by search term
//     return filtered.filter(user =>
//       user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.role.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   };

//   const getUserSummary = (user) => {
//     const role = allRoles[user.role];
//     let summary = {
//       role_name: role?.name || user.role,
//       permission_type: user.permission_type
//     };

//     if (user.permission_type === 'hierarchical') {
//       summary.access_info = `${user.master_access}: ${user.entity_name}`;
//       summary.badge_color = 'bg-info';
//     } else if (user.permission_type === 'lead_based') {
//       summary.access_info = `${user.assigned_leads?.length || 0} leads`;
//       if (user.team_leads) {
//         summary.access_info += ` (+${user.team_leads.length - (user.assigned_leads?.length || 0)} team)`;
//       }
//       summary.badge_color = 'bg-success';
//     } else if (user.permission_type === 'hybrid') {
//       summary.access_info = `${user.entity_name} + ${user.assigned_leads?.length || 0} leads`;
//       summary.badge_color = 'bg-warning';
//     }

//     return summary;
//   };

//   return (
//     <div>
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <div className="position-relative">
//           <Search className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" size={16} />
//           <input
//             type="text"
//             placeholder="Search users..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="form-control ps-5"
//             style={{ paddingLeft: '2.5rem' }}
//           />
//         </div>
//         <div className="d-flex gap-2">
//           <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
//             <Filter size={16} />
//             <span>Filter</span>
//           </button>
//           <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
//             <Download size={16} />
//             <span>Export</span>
//           </button>
//         </div>
//       </div>

//       <div className="card">
//         <div className="table-responsive">
//           <table className="table table-hover mb-0">
//             <thead className="table-light">
//               <tr>
//                 <th>User</th>
//                 <th>Role & Type</th>
//                 <th>Access Summary</th>
//                 <th>Team/Entity</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {getFilteredUsers().map((user) => {
//                 const summary = getUserSummary(user);
//                 return (
//                   <tr key={user.user_id}>
//                     <td>
//                       <div>
//                         <div className="fw-medium text-dark">{user.name}</div>
//                         <div className="text-muted small">{user.email}</div>
//                       </div>
//                     </td>
//                     <td>
//                       <div>
//                         <span className={`badge ${summary.badge_color}`}>
//                           {summary.role_name}
//                         </span>
//                         <div className="small text-muted mt-1">
//                           {user.permission_type === 'hierarchical' && '📋 Content Management'}
//                           {user.permission_type === 'lead_based' && '🎯 Lead Management'}
//                           {user.permission_type === 'hybrid' && '⚡ Hybrid Access'}
//                         </div>
//                       </div>
//                     </td>
//                     <td>
//                       <div className="small">
//                         <div className="fw-medium">{summary.access_info}</div>
//                         {user.centers_access && (
//                           <div className="text-muted">{user.centers_access.length} centers</div>
//                         )}
//                       </div>
//                     </td>
//                     <td>
//                       <div className="small">
//                         {user.permission_type === 'hierarchical' && (
//                           <div className="text-muted">{user.entity_name}</div>
//                         )}
//                       </div>
//                     </td>
//                     <td>
//                       <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
//                         {user.status}
//                       </span>
//                     </td>
//                     <td>
//                       <div className="d-flex gap-2">
//                         <button
//                           onClick={() => onViewUserDetails(user)}
//                           className="btn btn-sm btn-outline-info"
//                           title="View Details"
//                         >
//                           <Eye size={16} />
//                         </button>
//                         <button className="btn btn-sm btn-outline-success" title="Edit User">
//                           <Edit size={16} />
//                         </button>
//                         <button className="btn btn-sm btn-outline-danger" title="Delete User">
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserManagement;