import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddUserModal = ({
  users,
  entities,
  onClose,
  onAddUser,
  enhancedEntities
}) => {
  useEffect(() => {

  // Check for duplicate IDs
  const ids = users.map(u => u.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    console.error('Duplicate IDs found:', duplicateIds);
  }
}, [users]);
 useEffect(() => {
  console.log('enhancedEntities', enhancedEntities)
 }, [])


  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
   const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    mobile: '',
    description: '',
    designation: '',
    is_counseling_team: false,
    reporting_managers: [],
    permissions: {
      is_counseling_team: false,
      permission_type: 'hierarchical',
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
      verify_permissions: { global: false, type: '', parent_entities: [], selected_levels: [] },
      lead_permissions: {
        is_counseling_team: false,
        add_leads: false,
        edit_leads: false,
        manage_assignments: false,
        kyc_verification: false,
        bulk_status_change: false,
        bulk_communication: false
      },
      centers_access: [],
      user_management: {
        can_view_users: false,
        can_add_users: false,
        can_delete_users: false
      }
    }
  });

  const dummyReportingManagers = [
    { id: 'mgr_1', name: 'Rahul Sharma', designation: 'TL_COUNSELLOR', department: 'Counselling' },
    { id: 'mgr_2', name: 'Priya Singh', designation: 'TL_SALES', department: 'Sales' },
    { id: 'mgr_3', name: 'Amit Kumar', designation: 'SALES_MANAGER', department: 'Sales' },
    { id: 'mgr_4', name: 'Neha Gupta', designation: 'CENTER_SALES_HEAD', department: 'Sales' },
    { id: 'mgr_5', name: 'Vikash Yadav', designation: 'TL_COUNSELLOR', department: 'Counselling' },
    { id: 'mgr_6', name: 'Sita Patel', designation: 'SALES_MANAGER', department: 'Sales' }
  ];

  
  // HELPER FUNCTIONS (copied from AddRoleModal)
  const getAvailableProjects = (selectedVerticals) => {
  if (!selectedVerticals || selectedVerticals.length === 0) return [];
  return enhancedEntities.PROJECT.filter(project =>
    selectedVerticals.includes(project.parent_id) // ✅ Normal parent_id check
  );
};


const getAvailableCenters = (selectedProjects) => {
  console.log('enhancedEntities.CENTER',enhancedEntities.CENTER)
  if (!selectedProjects || selectedProjects.length === 0) return [];
  return enhancedEntities.CENTER.filter(center =>
    center.projects.some(projectId => selectedProjects.includes(projectId)) // ✅ Many-to-many check
  );
};

const getAvailableCourses = (selectedCenters, selectedProjects) => {
  if ((!selectedCenters || selectedCenters.length === 0) && (!selectedProjects || selectedProjects.length === 0)) {
    return [];
  }

  return enhancedEntities.COURSE.filter(course => {
    // Check centers match
    const centerMatch = selectedCenters && selectedCenters.length > 0
      ? Array.isArray(course.center) && course.center.some(centerId => selectedCenters.includes(centerId))
      : true; // if no centers selected, ignore center filter

    // Check projects match
    const projectMatch = selectedProjects && selectedProjects.length > 0
      ? selectedProjects.includes(course.project)
      : true; // if no projects selected, ignore project filter

    return centerMatch && projectMatch;
  });
};


  const getAvailableBatches = (selectedCenters, selectedCourses) => {
    if ((!selectedCenters || selectedCenters.length === 0) && (!selectedCourses || selectedCourses.length === 0)) {
      return [];
    }
    return enhancedEntities.BATCH.filter(batch => {
      // Center match
      const centerMatch = selectedCenters && selectedCenters.length > 0
        ? selectedCenters.includes(batch.center)
        : true;
      // Course match
      const courseMatch = selectedCourses && selectedCourses.length > 0
        ? selectedCourses.includes(batch.course)
        : true;
      return centerMatch && courseMatch;
    });
  };


  // NEW: Auto-select child entities when parent is selected
const autoSelectChildEntities = (level, selectedIds, isChecked, entityId) => {
  let newSelection = { ...userForm.permissions.view_permissions.hierarchical_selection };

  if (level === 'verticals') {
    newSelection.selected_verticals = selectedIds;
    
    if (isChecked) {
      // When checking a vertical, auto-select all its projects
      const availableProjects = getAvailableProjects([entityId]);
      const allProjectIds = availableProjects.map(p => p.id);
      newSelection.selected_projects = [...new Set([...newSelection.selected_projects, ...allProjectIds])];
      
      // Auto-select all centers from these projects
      const availableCenters = getAvailableCenters(allProjectIds);
      const allCenterIds = availableCenters.map(c => c.id);
      newSelection.selected_centers = [...new Set([...newSelection.selected_centers, ...allCenterIds])];
      
      // Auto-select all courses from these centers
      const availableCourses = getAvailableCourses(allCenterIds, allProjectIds);
      const allCourseIds = availableCourses.map(c => c.id);
      newSelection.selected_courses = [...new Set([...newSelection.selected_courses, ...allCourseIds])];
      
      // Auto-select all batches from these courses
      const availableBatches = getAvailableBatches(allCenterIds, allCourseIds);
      const allBatchIds = availableBatches.map(b => b.id);
      newSelection.selected_batches = [...new Set([...newSelection.selected_batches, ...allBatchIds])];
    } else {
      // When unchecking a vertical, remove all its related children
      const projectsToRemove = getAvailableProjects([entityId]).map(p => p.id);
      newSelection.selected_projects = newSelection.selected_projects.filter(id => !projectsToRemove.includes(id));
      
      const centersToRemove = getAvailableCenters(projectsToRemove).map(c => c.id);
      newSelection.selected_centers = newSelection.selected_centers.filter(id => !centersToRemove.includes(id));
      
      const coursesToRemove = getAvailableCourses(centersToRemove, projectsToRemove).map(c => c.id);
      newSelection.selected_courses = newSelection.selected_courses.filter(id => !coursesToRemove.includes(id));
      
      const batchesToRemove = getAvailableBatches(centersToRemove, coursesToRemove).map(b => b.id);
      newSelection.selected_batches = newSelection.selected_batches.filter(id => !batchesToRemove.includes(id));
    }
  } else if (level === 'projects') {
    newSelection.selected_projects = selectedIds;
    
    if (isChecked) {
      // When checking a project, auto-select all its centers
      const availableCenters = getAvailableCenters([entityId]);
      const allCenterIds = availableCenters.map(c => c.id);
      newSelection.selected_centers = [...new Set([...newSelection.selected_centers, ...allCenterIds])];
      
      // Auto-select all courses from these centers
      const availableCourses = getAvailableCourses(allCenterIds, [entityId]);
      const allCourseIds = availableCourses.map(c => c.id);
      newSelection.selected_courses = [...new Set([...newSelection.selected_courses, ...allCourseIds])];
      
      // Auto-select all batches from these courses
      const availableBatches = getAvailableBatches(allCenterIds, allCourseIds);
      const allBatchIds = availableBatches.map(b => b.id);
      newSelection.selected_batches = [...new Set([...newSelection.selected_batches, ...allBatchIds])];
    } else {
      // When unchecking a project, remove all its related children
      const centersToRemove = getAvailableCenters([entityId]).map(c => c.id);
      newSelection.selected_centers = newSelection.selected_centers.filter(id => !centersToRemove.includes(id));
      
      const coursesToRemove = getAvailableCourses(centersToRemove, [entityId]).map(c => c.id);
      newSelection.selected_courses = newSelection.selected_courses.filter(id => !coursesToRemove.includes(id));
      
      const batchesToRemove = getAvailableBatches(centersToRemove, coursesToRemove).map(b => b.id);
      newSelection.selected_batches = newSelection.selected_batches.filter(id => !batchesToRemove.includes(id));
    }
  } else if (level === 'centers') {
    newSelection.selected_centers = selectedIds;
    
    if (isChecked) {
      // When checking a center, auto-select all its courses
      const availableCourses = getAvailableCourses([entityId], newSelection.selected_projects);
      const allCourseIds = availableCourses.map(c => c.id);
      newSelection.selected_courses = [...new Set([...newSelection.selected_courses, ...allCourseIds])];
      
      // Auto-select all batches from these courses
      const availableBatches = getAvailableBatches([entityId], allCourseIds);
      const allBatchIds = availableBatches.map(b => b.id);
      newSelection.selected_batches = [...new Set([...newSelection.selected_batches, ...allBatchIds])];
    } else {
      // When unchecking a center, remove all its related children
      const coursesToRemove = getAvailableCourses([entityId], newSelection.selected_projects).map(c => c.id);
      newSelection.selected_courses = newSelection.selected_courses.filter(id => !coursesToRemove.includes(id));
      
      const batchesToRemove = getAvailableBatches([entityId], coursesToRemove).map(b => b.id);
      newSelection.selected_batches = newSelection.selected_batches.filter(id => !batchesToRemove.includes(id));
    }
  } else if (level === 'courses') {
    newSelection.selected_courses = selectedIds;
    
    if (isChecked) {
      // When checking a course, auto-select all its batches
      const availableBatches = getAvailableBatches(newSelection.selected_centers, [entityId]);
      const allBatchIds = availableBatches.map(b => b.id);
      newSelection.selected_batches = [...new Set([...newSelection.selected_batches, ...allBatchIds])];
    } else {
      // When unchecking a course, remove all its batches
      const batchesToRemove = getAvailableBatches(newSelection.selected_centers, [entityId]).map(b => b.id);
      newSelection.selected_batches = newSelection.selected_batches.filter(id => !batchesToRemove.includes(id));
    }
  } else if (level === 'batches') {
    newSelection.selected_batches = selectedIds;
  }

  return newSelection;
};



  // Helper function to update view permissions hierarchical selection
  // CHANGED: Updated helper function to update view permissions hierarchical selection with auto-selection
const updateHierarchicalSelection = (level, selectedIds, isChecked = null, entityId = null) => {
  let newSelection;
  
  if (isChecked !== null && entityId !== null) {
    // Use auto-selection when individual entity is toggled
    newSelection = autoSelectChildEntities(level, selectedIds, isChecked, entityId);
  } else {
    // Use regular selection for bulk operations
    newSelection = { ...userForm.permissions.view_permissions.hierarchical_selection };
    
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
  }

  setUserForm({
    ...userForm,
    permissions: {
      ...userForm.permissions,
      view_permissions: {
        ...userForm.permissions.view_permissions,
        hierarchical_selection: newSelection
      }
    }
  });
};

  // Helper function to get entities for edit permissions based on current view access
  const getEditableEntitiesForLevel = (level) => {
    if (userForm.permissions.view_permissions.global) {
      return enhancedEntities[level] || [];
    }

    const hierarchical = userForm.permissions.view_permissions.hierarchical_selection;
    if (!hierarchical) return [];

    if (level === 'VERTICAL') {
      return hierarchical.selected_verticals.map(id =>
        enhancedEntities.VERTICAL.find(v => v.id === id)
      ).filter(Boolean);
    } else if (level === 'PROJECT') {
      if (hierarchical.selected_projects.length > 0) {
        return hierarchical.selected_projects.map(id =>
          enhancedEntities.PROJECT.find(p => p.id === id)
        ).filter(Boolean);
      }
      if (hierarchical.selected_verticals.length > 0) {
        return getAvailableProjects(hierarchical.selected_verticals);
      }
      return [];
    } else if (level === 'CENTER') {
      if (hierarchical.selected_centers.length > 0) {
        return hierarchical.selected_centers.map(id =>
          enhancedEntities.CENTER.find(c => c.id === id)
        ).filter(Boolean);
      }
      if (hierarchical.selected_projects.length > 0) {
        return getAvailableCenters(hierarchical.selected_projects);
      }
      if (hierarchical.selected_verticals.length > 0) {
        const projects = getAvailableProjects(hierarchical.selected_verticals);
        return getAvailableCenters(projects.map(p => p.id));
      }
      return [];
    } 
    else if (level === 'COURSE') {
  if (hierarchical.selected_courses.length > 0) {
    return hierarchical.selected_courses.map(id =>
      enhancedEntities.COURSE.find(c => c.id === id)
    ).filter(Boolean);
  }
  if (hierarchical.selected_centers.length > 0) {
    return getAvailableCourses(hierarchical.selected_centers, []); // no selected projects here
  }
  if (hierarchical.selected_projects.length > 0) {
    const centers = getAvailableCenters(hierarchical.selected_projects);
    return getAvailableCourses(centers.map(c => c.id), hierarchical.selected_projects);
  }
  if (hierarchical.selected_verticals.length > 0) {
    const projects = getAvailableProjects(hierarchical.selected_verticals);
    const centers = getAvailableCenters(projects.map(p => p.id));
    return getAvailableCourses(centers.map(c => c.id), projects.map(p => p.id));
  }
  return [];
}
 
    else if (level === 'BATCH') {
      if (hierarchical.selected_batches.length > 0) {
        return hierarchical.selected_batches.map(id =>
          enhancedEntities.BATCH.find(b => b.id === id)
        ).filter(Boolean);
      }
      if (hierarchical.selected_courses.length > 0) {
        return getAvailableBatches(hierarchical.selected_courses);
      }
      if (hierarchical.selected_centers.length > 0) {
        const courses = getAvailableCourses(hierarchical.selected_centers);
        return getAvailableBatches(courses.map(c => c.id));
      }
      return [];
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

  // Helper function to add new add permission
  const addNewAddPermission = () => {
    const newPermission = {
      id: Date.now(),
      permission_level: '',
      selected_entities: [],
      can_add_types: []
    };

    setUserForm({
      ...userForm,
      permissions: {  // ✅ ADD THIS
        ...userForm.permissions,
        add_permissions: {
          ...userForm.permissions.add_permissions,
          specific_permissions: [...userForm.permissions.add_permissions.specific_permissions, newPermission]
        }
      }
    });
  };

  // Helper function to update add permission
  const updateAddPermission = (permissionId, field, value) => {
    const updated = userForm.permissions.add_permissions.specific_permissions.map(permission =>
      permission.id === permissionId
        ? { ...permission, [field]: value }
        : permission
    );

    setUserForm({
      ...userForm,
      permissions: {  // ✅ ADD THIS
        ...userForm.permissions,
        add_permissions: {
          ...userForm.permissions.add_permissions,
          specific_permissions: updated
        }
      }
    });
  };

  // Helper function to remove add permission
  const removeAddPermission = (permissionId) => {
    const updated = userForm.permissions.add_permissions.specific_permissions.filter(
      permission => permission.id !== permissionId
    );

    setUserForm({
      ...userForm,
      permissions: {  // ✅ ADD THIS
        ...userForm.permissions,
        add_permissions: {
          ...userForm.permissions.add_permissions,
          specific_permissions: updated
        }
      }
    });
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

    setUserForm(prevForm => ({
      ...prevForm,
      permissions: {  // ✅ ADD THIS
        ...prevForm.permissions,
        edit_permissions: {
          ...prevForm.permissions.edit_permissions,
          specific_permissions: [...prevForm.permissions.edit_permissions.specific_permissions, newPermission]
        }
      }
    }));
  };

  // Helper function to update edit permission
  const updateEditPermission = (permissionId, field, value) => {
    setUserForm(prevForm => {
      const updated = prevForm.permissions.edit_permissions.specific_permissions.map(permission =>
        permission.id === permissionId
          ? { ...permission, [field]: value }
          : permission
      );

      return {
        ...prevForm,
        permissions: {  // ✅ ADD THIS
          ...prevForm.permissions,
          edit_permissions: {
            ...prevForm.permissions.edit_permissions,
            specific_permissions: updated
          }
        }
      };
    });
  };

  // Helper function to remove edit permission
  const removeEditPermission = (permissionId) => {
    const updated = userForm.permissions.edit_permissions.specific_permissions.filter(
      permission => permission.id !== permissionId
    );

    setUserForm({
      ...userForm,
      edit_permissions: {
        ...userForm.permissions.edit_permissions,
        specific_permissions: updated
      }
    });
  };

  // Helper function to get all entities for specific entity selection
  const getAllEntitiesForSelection = () => {
    const allEntities = [];
    Object.entries(enhancedEntities).forEach(([type, entityList]) => {
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

  const handleSubmit = async () => {
  try {
    const requestData = {
      name: userForm.name,
      email: userForm.email,
      mobile: userForm.mobile,
      designation: userForm.designation,
      permissions: userForm.permissions
    };

    const response = await axios.post(`${backendUrl}/college/roles/users/add-concern-person`, requestData,{
            headers: {
              // 'Content-Type': 'multipart/form-data',
              'x-auth': token
            }
          });
    
    if (response.data.status) {
      // Success - call the parent callback
      onAddUser({
        ...requestData,
        _id: response.data.userId,
        status: 'active',
        created_at: new Date().toISOString()
      });
      
      // Show success message or close modal
      alert('User added successfully!');
    } else {
      alert('Error: ' + response.data.error);
    }
  } catch (error) {
    console.error('Error adding user:', error);
    const errorMessage = error.response?.data?.error || 'Failed to add user';
    alert('Error: ' + errorMessage);
  }
};

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">👤 Add New User with Permissions</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row g-4">

              {/* Basic Information */}
              <div className="col-12">
                <h5 className="border-bottom pb-2">Basic Information</h5>
                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="form-control"
                      placeholder="Enter user's full name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="form-control"
                      placeholder="user@company.com"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Mobile *</label>
                    <input
                      type="text"
                      value={userForm.mobile}
                      onChange={(e) => {const value = e.target.value;
                        // Allow only numbers and max 10 digits
                        if (/^[6-9][0-9]{0,9}$/.test(value) || value === "") {
                          setUserForm({ ...userForm, mobile: value });
                        }}}
                      className="form-control"
                      placeholder="Enter user's mobile number"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Role/Designation *</label>
                    <input
                      type="text"
                      value={userForm.designation}
                      onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                      className="form-control"
                      placeholder="Enter user's designation"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Description *</label>
                    <textarea
                      value={userForm.description}
                      onChange={(e) => setUserForm({ ...userForm, description: e.target.value })}
                      className="form-control"
                      placeholder="Enter description, Why add this user"
                      style={{ minHeight: '120px' }}
                    >
                    </textarea>
                  </div>

                  {/* Reporting Managers Section */}
                  <div className="col-md-6">
                    <label className="form-label">Reporting Managers</label>
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="small text-muted">Select reporting managers:</div>
                        <div className="small">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => setUserForm({
                              ...userForm,
                              reporting_managers: users.map(m => m.user_id)
                            })}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setUserForm({ ...userForm, reporting_managers: [] })}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {users.map(manager => (
                        <div key={manager.user_id} className="form-check mb-3 p-2 border-bottom">
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
                          <label className="form-check-label w-100" htmlFor={`manager_${manager.id}`}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-medium text-dark">{manager.name}</div>
                                <div className="small text-primary">{manager.designation}</div>
                              </div>
                              <span className="badge bg-light text-dark small">{manager.department}</span>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>

                    {userForm.reporting_managers.length > 0 && (
                      <div className="mt-2">
                        <div className="alert alert-success py-2">
                          <div className="small">
                            ✅ <strong>{userForm.reporting_managers.length}</strong> reporting manager(s) selected
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Permission Type *</label>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <div className="form-check">
                          <input
                            type="radio"
                            name="permission_type"
                            value="hierarchical"
                            checked={userForm.permissions.permission_type === 'hierarchical'}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                permission_type: e.target.value
                              }
                            })}

                            className="form-check-input"
                            id="perm_hierarchical"
                          />
                          <label className="form-check-label" htmlFor="perm_hierarchical">
                            <div className="fw-medium text-info">📋 Operation Management</div>
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
                            checked={userForm.permissions.permission_type === 'lead_based'}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                permission_type: e.target.value
                              }
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
                            checked={userForm.permissions.permission_type === 'hybrid'}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                permission_type: e.target.value
                              }
                            })}
                            className="form-check-input"
                            id="perm_hybrid"
                          />
                          <label className="form-check-label" htmlFor="perm_hybrid">
                            <div className="fw-medium text-success">🎯 Hybrid</div>
                            <div className="small text-muted">Team & lead-based access & Hierarchical access</div>
                          </label>
                        </div>
                      </div>


                     
                    </div>
                  </div>
                </div>
              </div>

              {/* User MANAGEMENT PERMISSIONS SECTION */}
              {(userForm.permissions.permission_type === 'hierarchical' || userForm.permissions.permission_type === 'hybrid') && (
                <div className="col-12">
                  <h5 className="border-bottom pb-2">User Management Permissions</h5>
                  <div className="mt-3">
                    {/* Global or Specific Choice */}
                    <div className="row g-2 mb-4">
                      <div className="col-12">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            name="view_users"
                            value="true"
                            className="form-check-input"
                            id="view_users"
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                user_management: {
                                  ...userForm.permissions.user_management,
                                  can_view_users: e.target.checked
                                }
                              }
                            })}
                          />
                          <label className="form-check-label fw-medium" htmlFor="view_users">
                            Can View Users
                          </label>
                          <div className="text-muted small">Can view all users</div>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            name="add_users"
                            value="true"
                            className="form-check-input"
                            id="add_users"
                             onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                user_management: {
                                  ...userForm.permissions.user_management,
                                  add_users: e.target.checked
                                }
                              }
                            })}
                          />
                          <label className="form-check-label fw-medium" htmlFor="add_users">
                            Can Add Users
                          </label>
                          <div className="text-muted small">Can add users</div>
                        </div>

                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            name="delete_users"
                            value="true"
                            className="form-check-input"
                            id="delete_users"
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                user_management: {
                                  ...userForm.permissions.user_management,
                                  delete_users: e.target.checked
                                }
                              }
                            })}
                          />
                          <label className="form-check-label fw-medium" htmlFor="delete_users">
                            Can Delete Users
                          </label>
                          <div className="text-muted small">Can delete any user</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW PERMISSIONS SECTION */}
              {(userForm.permissions.permission_type === 'hierarchical' || userForm.permissions.permission_type === 'hybrid') && (
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
                            checked={userForm.permissions.view_permissions.global}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
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
                            checked={!userForm.permissions.view_permissions.global}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
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
                              }
                            })}
                            className="form-check-input"
                            id="view_specific"
                          />
                          <label className="form-check-label fw-medium" htmlFor="view_specific">
                            🎯 Specific Hierarchical Access
                          </label>
                          <div className="text-muted small">Select specific verticals, then their projects, centers, courses, and batches</div>
                        </div>
                      </div>
                    </div>

                    {/* Hierarchical Selection */}
                    {!userForm.permissions.view_permissions.global && (
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
                              {enhancedEntities.VERTICAL.map(vertical => (
                                <div key={vertical.id} className="form-check mb-2">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.includes(vertical.id)}
                                    onChange={(e) => {
                                      const current = userForm.permissions.view_permissions.hierarchical_selection.selected_verticals;
                                      const updated = e.target.checked
                                        ? [...current, vertical.id]
                                        : current.filter(id => id !== vertical.id);
                                      updateHierarchicalSelection('verticals', updated, e.target.checked, vertical.id); // ← ADDED PARAMETERS
                                    }}
                                    id={`vertical_${vertical.id}`}
                                  />
                                  <label className="form-check-label fw-medium text-dark" htmlFor={`vertical_${vertical.id}`}>
                                    {vertical.name}
                                  </label>
                                </div>
                              ))}
                              {userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length > 0 && (
                                <div className="alert alert-light border-success py-2 mt-2 mb-0">
                                  <small className="text-success fw-medium">✅ Selected {userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length} vertical(s)</small>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Step 2: Select Projects */}
                          {userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length > 0 && (
                            <div className="mb-4">
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-primary text-white">2</span>
                                <label className="form-label fw-medium mb-0 text-dark">Select Projects</label>
                                <small className="text-muted">(from selected verticals)</small>
                              </div>
                              <div className="border rounded p-3 bg-white shadow-sm">
                                {(() => {
                                  const availableProjects = getAvailableProjects(userForm.permissions.view_permissions.hierarchical_selection.selected_verticals);
                                  if (availableProjects.length === 0) {
                                    return <div className="text-muted small">No projects found in selected verticals</div>;
                                  }
                                  return availableProjects.map(project => (
                                    <div key={project.id} className="form-check mb-2">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={userForm.permissions.view_permissions.hierarchical_selection.selected_projects.includes(project.id)}
                                        onChange={(e) => {
                                          const current = userForm.permissions.view_permissions.hierarchical_selection.selected_projects;
                                          const updated = e.target.checked
                                            ? [...current, project.id]
                                            : current.filter(id => id !== project.id);
                                          updateHierarchicalSelection('projects', updated, e.target.checked, project.id); // ← ADDED PARAMETERS
                                        }}
                                        id={`project_${project.id}`}
                                      />
                                      <label className="form-check-label fw-medium text-dark" htmlFor={`project_${project.id}`}>
                                        {project.name}
                                        <small className="text-muted ms-2">
                                          (from {enhancedEntities.VERTICAL.find(v => v.id === project.parent_id)?.name})
                                        </small>
                                      </label>
                                    </div>
                                  ));
                                })()}
                                {userForm.permissions.view_permissions.hierarchical_selection.selected_projects.length > 0 && (
                                  <div className="alert alert-light border-primary py-2 mt-2 mb-0">
                                    <small className="text-primary fw-medium">✅ Selected {userForm.permissions.view_permissions.hierarchical_selection.selected_projects.length} project(s)</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Step 3: Select Centers */}
                          {userForm.permissions.view_permissions.hierarchical_selection.selected_projects.length > 0 && (
                            <div className="mb-4">
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-info text-white">3</span>
                                <label className="form-label fw-medium mb-0 text-dark">Select Centers</label>
                                <small className="text-muted">(from selected projects)</small>
                              </div>
                              <div className="border rounded p-3 bg-white shadow-sm">
                                {(() => {
                                  const availableCenters = getAvailableCenters(userForm.permissions.view_permissions.hierarchical_selection.selected_projects);
                                  if (availableCenters.length === 0) {
                                    return <div className="text-muted small">No centers found in selected projects</div>;
                                  }
                                  return availableCenters.map(center => (
                                    <div key={center.id} className="form-check mb-2">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={userForm.permissions.view_permissions.hierarchical_selection.selected_centers.includes(center.id)}
                                        onChange={(e) => {
                                          const current = userForm.permissions.view_permissions.hierarchical_selection.selected_centers;
                                          const updated = e.target.checked
                                            ? [...current, center.id]
                                            : current.filter(id => id !== center.id);
                                          updateHierarchicalSelection('centers', updated, e.target.checked, center.id); // ← ADDED PARAMETERS
                                        }}
                                        id={`center_${center.id}`}
                                      />
                                      <label className="form-check-label fw-medium text-dark" htmlFor={`center_${center.id}`}>
                                        {center.name}
                                        <small className="text-muted ms-2">
                                          (from {enhancedEntities.PROJECT.find(p => p.id === center.parent_id)?.name})
                                        </small>
                                      </label>
                                    </div>
                                  ));
                                })()}
                                {userForm.permissions.view_permissions.hierarchical_selection.selected_centers.length > 0 && (
                                  <div className="alert alert-light border-info py-2 mt-2 mb-0">
                                    <small className="text-info fw-medium">✅ Selected {userForm.permissions.view_permissions.hierarchical_selection.selected_centers.length} center(s)</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Step 4: Select Courses */}
                          {userForm.permissions.view_permissions.hierarchical_selection.selected_centers.length > 0 && (
                            <div className="mb-4">
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-warning text-white">4</span>
                                <label className="form-label fw-medium mb-0 text-dark">Select Courses</label>
                                <small className="text-muted">(from selected centers)</small>
                              </div>
                              <div className="border rounded p-3 bg-white shadow-sm">
                                {(() => {
                                  const availableCourses = getAvailableCourses(userForm.permissions.view_permissions.hierarchical_selection.selected_centers);
                                  if (availableCourses.length === 0) {
                                    return <div className="text-muted small">No courses found in selected centers</div>;
                                  }
                                  return availableCourses.map(course => (
                                    <div key={course.id} className="form-check mb-2">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={userForm.permissions.view_permissions.hierarchical_selection.selected_courses.includes(course.id)}
                                        onChange={(e) => {
                                          const current = userForm.permissions.view_permissions.hierarchical_selection.selected_courses;
                                          const updated = e.target.checked
                                            ? [...current, course.id]
                                            : current.filter(id => id !== course.id);
                                          updateHierarchicalSelection('courses', updated, e.target.checked, course.id); // ← ADDED PARAMETERS
                                        }}
                                        id={`course_${course.id}`}
                                      />
                                      <label className="form-check-label fw-medium text-dark" htmlFor={`course_${course.id}`}>
                                        {course.name}
                                        <small className="text-muted ms-2">
                                          (from {enhancedEntities.CENTER.find(c => c.id === course.parent_id)?.name})
                                        </small>
                                      </label>
                                    </div>
                                  ));
                                })()}
                                {userForm.permissions.view_permissions.hierarchical_selection.selected_courses.length > 0 && (
                                  <div className="alert alert-light border-warning py-2 mt-2 mb-0">
                                    <small className="text-warning fw-medium">✅ Selected {userForm.permissions.view_permissions.hierarchical_selection.selected_courses.length} course(s)</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Step 5: Select Batches */}
                          {userForm.permissions.view_permissions.hierarchical_selection.selected_courses.length > 0 && (
                            <div className="mb-4">
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-success text-white">5</span>
                                <label className="form-label fw-medium mb-0 text-dark">Select Batches</label>
                                <small className="text-muted">(from selected courses)</small>
                              </div>
                              <div className="border rounded p-3 bg-white shadow-sm">
                                {(() => {
                                  const availableBatches = getAvailableBatches(userForm.permissions.view_permissions.hierarchical_selection.selected_centers, userForm.permissions.view_permissions.hierarchical_selection.selected_courses);
                                  if (availableBatches.length === 0) {
                                    return <div className="text-muted small">No batches found in selected courses</div>;
                                  }
                                  return availableBatches.map(batch => (
                                    <div key={batch.id} className="form-check mb-2">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={userForm.permissions.view_permissions.hierarchical_selection.selected_batches.includes(batch.id)}
                                        onChange={(e) => {
                                          const current = userForm.permissions.view_permissions.hierarchical_selection.selected_batches;
                                          const updated = e.target.checked
                                            ? [...current, batch.id]
                                            : current.filter(id => id !== batch.id);
                                          updateHierarchicalSelection('batches', updated);
                                        }}
                                        id={`batch_${batch.id}`}
                                      />
                                      <label className="form-check-label fw-medium text-dark" htmlFor={`batch_${batch.id}`}>
                                        {batch.name}
                                        <small className="text-muted ms-2">
                                          (from {enhancedEntities.COURSE.find(c => c.id === batch.parent_id)?.name})
                                        </small>
                                      </label>
                                    </div>
                                  ));
                                })()}
                                {userForm.permissions.view_permissions.hierarchical_selection.selected_batches.length > 0 && (
                                  <div className="alert alert-light border-success py-2 mt-2 mb-0">
                                    <small className="text-success fw-medium">✅ Selected {userForm.permissions.view_permissions.hierarchical_selection.selected_batches.length} batch(es)</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Selection Summary */}
                          {(userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length > 0 ||
                            userForm.permissions.view_permissions.hierarchical_selection.selected_projects.length > 0 ||
                            userForm.permissions.view_permissions.hierarchical_selection.selected_centers.length > 0 ||
                            userForm.permissions.view_permissions.hierarchical_selection.selected_courses.length > 0 ||
                            userForm.permissions.view_permissions.hierarchical_selection.selected_batches.length > 0) && (
                              <div className="alert alert-light border-success">
                                <h6 className="alert-heading text-success d-flex align-items-center gap-2">
                                  <span>📋</span>
                                  View Access Summary
                                </h6>
                                <div className="small text-dark">
                                  {userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length > 0 && (
                                    <div className="mb-1">• <strong>Verticals:</strong> {userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length} selected</div>
                                  )}
                                  {userForm.permissions.view_permissions.hierarchical_selection.selected_projects.length > 0 && (
                                    <div className="mb-1">• <strong>Projects:</strong> {userForm.permissions.view_permissions.hierarchical_selection.selected_projects.length} selected</div>
                                  )}
                                  {userForm.permissions.view_permissions.hierarchical_selection.selected_centers.length > 0 && (
                                    <div className="mb-1">• <strong>Centers:</strong> {userForm.permissions.view_permissions.hierarchical_selection.selected_centers.length} selected</div>
                                  )}
                                  {userForm.permissions.view_permissions.hierarchical_selection.selected_courses.length > 0 && (
                                    <div className="mb-1">• <strong>Courses:</strong> {userForm.permissions.view_permissions.hierarchical_selection.selected_courses.length} selected</div>
                                  )}
                                  {userForm.permissions.view_permissions.hierarchical_selection.selected_batches.length > 0 && (
                                    <div className="mb-1">• <strong>Batches:</strong> {userForm.permissions.view_permissions.hierarchical_selection.selected_batches.length} selected</div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add Permissions Section */}
              {(userForm.permissions.permission_type === 'hierarchical' || userForm.permissions.permission_type === 'hybrid') && (
                <div className="col-12">
                  <h5 className="border-bottom pb-2">Add Permissions</h5>
                  <div className="mt-3">
                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={userForm.permissions.add_permissions.global}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permissions: {
                             // ✅ ADD THIS
                              ...userForm.permissions,
                              add_permissions: {
                                ...userForm.permissions.add_permissions,
                                global: e.target.checked,
                                specific_permissions: e.target.checked ? [] : userForm.permissions.add_permissions.specific_permissions
                              }
                            
                          }
                        })}
                      />
                      <label className="form-check-label fw-medium small">🌍 Global Add Permission</label>
                    </div>

                    {!userForm.permissions.add_permissions.global && (
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
                          {(!userForm.permissions.view_permissions.global &&
                            (!userForm.permissions.view_permissions.hierarchical_selection ||
                              userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length === 0)) && (
                              <div className="alert alert-warning py-2">
                                <p className="mb-0 small">⚠️ Please configure View Permissions first. Add permissions depend on your view access.</p>
                              </div>
                            )}

                          {userForm.permissions.add_permissions.specific_permissions.length === 0 && (
                            userForm.permissions.view_permissions.global ||
                            (userForm.permissions.view_permissions.hierarchical_selection &&
                              userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length > 0)
                          ) && (
                              <div className="text-center py-4 text-muted small">
                                No specific add permissions configured. Click "Add Permission" to start.
                              </div>
                            )}

                          {/* Individual Add Permission Configurations */}
                          {userForm.permissions.add_permissions.specific_permissions.map((permission, index) => (
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
                                      {userForm.permissions.view_permissions.global ? (
                                        <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                          {enhancedEntities[permission.permission_level]?.map(entity => (
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
                                                id={`add_type_${childType}_${permission.id}`}
                                              />
                                              <label className="form-check-label small" htmlFor={`add_type_${childType}_${permission.id}`}>
                                                Add {childType}
                                              </label>
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
              )}

              {/* Edit Permissions Section */}
              {(userForm.permissions.permission_type === 'hierarchical' || userForm.permissions.permission_type === 'hybrid') && (
                <div className="col-12">
                  <h5 className="border-bottom pb-2">Edit Permissions</h5>
                  <div className="mt-3">
                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={userForm.permissions.edit_permissions.global}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permissions: {
                            ...userForm.permissions,
                            edit_permissions: {
                              ...userForm.permissions.edit_permissions,
                              global: e.target.checked,
                              specific_permissions: e.target.checked ? [] : userForm.permissions.edit_permissions.specific_permissions
                            }
                          }
                        })}
                      />
                      <label className="form-check-label fw-medium small">🌍 Global Edit Permission</label>
                    </div>

                    {!userForm.permissions.edit_permissions.global && (
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
                          {(!userForm.permissions.view_permissions.global &&
                            (!userForm.permissions.view_permissions.hierarchical_selection ||
                              userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length === 0)) && (
                              <div className="alert alert-warning py-2">
                                <p className="mb-0 small">⚠️ Please configure View Permissions first. Edit permissions depend on your view access.</p>
                              </div>
                            )}

                          {userForm.permissions.edit_permissions.specific_permissions.length === 0 && (
                            userForm.permissions.view_permissions.global ||
                            (userForm.permissions.view_permissions.hierarchical_selection &&
                              userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length > 0)
                          ) && (
                              <div className="text-center py-4 text-muted small">
                                No specific edit permissions configured. Click "Add Edit Permission" to start.
                              </div>
                            )}

                          {/* Individual Edit Permission Configurations */}
                          {userForm.permissions.edit_permissions.specific_permissions.map((permission, index) => (
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
                                            ✅ Can edit all entities at: {permission.permission_levels.join(', ')} levels and Its childrens
                                          </p>
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
                                        {userForm.permissions.view_permissions.global ? (
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
                                            const hierarchical = userForm.permissions.view_permissions.hierarchical_selection;

                                            // Get viewable entities based on hierarchical selection
                                            if (hierarchical) {
                                              // Add selected verticals
                                              hierarchical.selected_verticals.forEach(verticalId => {
                                                const vertical = enhancedEntities.VERTICAL.find(v => v.id === verticalId);
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
                                              const availableBatches = getAvailableBatches(
                                                hierarchical.selected_centers.length > 0 ? hierarchical.selected_centers : availableCenters.map(c => c.id),
                                                hierarchical.selected_courses.length > 0 ? hierarchical.selected_courses : availableCourses.map(c => c.id)
                                              );
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
              )}

              {/* Verify Permissions Section */}
              {(userForm.permissions.permission_type === 'hierarchical' || userForm.permissions.permission_type === 'hybrid') && (
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
                            checked={userForm.permissions.verify_permissions.type === 'global'}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                verify_permissions: {
                                  type: 'global',
                                  global: true,
                                  parent_entities: [],
                                  selected_levels: []
                                }
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
                            checked={userForm.permissions.verify_permissions.type === 'entity_children'}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                verify_permissions: {
                                  type: 'entity_children',
                                  global: false,
                                  parent_entities: [],
                                  selected_levels: []
                                }
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
                        {userForm.permissions.verify_permissions.type === 'entity_children' && (
                          <div className="ms-4 mt-3">
                            <div className="card bg-warning bg-opacity-10 border-warning">
                              <div className="card-body">
                                <h6 className="card-title text-warning mb-3">Select Parent Entities</h6>

                                {/* Check if view permissions are configured */}
                                {(!userForm.permissions.view_permissions.global &&
                                  (!userForm.permissions.view_permissions.hierarchical_selection ||
                                    userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length === 0)) && (
                                    <div className="alert alert-warning py-2 mb-3">
                                      <p className="mb-0 small">⚠️ Please configure View Permissions first. Verify permissions depend on your view access.</p>
                                    </div>
                                  )}

                                {/* If global view access, show all entities */}
                                {userForm.permissions.view_permissions.global ? (
                                  Object.entries(enhancedEntities).map(([entityType, entityList]) => (
                                    <div key={entityType} className="mb-3">
                                      <div className="fw-medium text-warning mb-2">{entityType} Level:</div>
                                      <div className="border rounded p-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                        {entityList?.map(entity => (
                                          <div key={`verify_parent_${entity.id}`} className="form-check mb-1">
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={userForm.permissions.verify_permissions.parent_entities?.some(
                                                e => e.entity_id === entity.id
                                              )}
                                              onChange={(e) => {
                                                const current = userForm.permissions.verify_permissions.parent_entities || [];
                                                const updated = e.target.checked
                                                  ? [...current, { entity_type: entityType, entity_id: entity.id, entity_name: entity.name }]
                                                  : current.filter(e => e.entity_id !== entity.id);
                                                setUserForm({
                                                  ...userForm,
                                                  permissions: {
                                                    ...userForm.permissions,
                                                    verify_permissions: {
                                                      ...userForm.permissions.verify_permissions,
                                                      parent_entities: updated
                                                    }
                                                  }
                                                });
                                              }}
                                              id={`verify_parent_entity_${entity.id}`}
                                            />
                                            <label className="form-check-label small" htmlFor={`verify_parent_entity_${entity.id}`}>
                                              {entity.name}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  /* If specific view access, show filtered entities */
                                  (() => {
                                    const hierarchical = userForm.permissions.view_permissions.hierarchical_selection;
                                    const viewableEntitiesForVerify = {};

                                    if (hierarchical) {
                                      // Add selected verticals
                                      if (hierarchical.selected_verticals.length > 0) {
                                        viewableEntitiesForVerify.VERTICAL = hierarchical.selected_verticals.map(id =>
                                          enhancedEntities.VERTICAL.find(v => v.id === id)
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
                                                checked={userForm.permissions.verify_permissions.parent_entities?.some(
                                                  e => e.entity_id === entity.id
                                                )}
                                                onChange={(e) => {
                                                  const current = userForm.permissions.verify_permissions.parent_entities || [];
                                                  const updated = e.target.checked
                                                    ? [...current, { entity_type: entityType, entity_id: entity.id, entity_name: entity.name }]
                                                    : current.filter(e => e.entity_id !== entity.id);
                                                  setUserForm({
                                                    ...userForm,
                                                    permissions: {
                                                      ...userForm.permissions,
                                                      verify_permissions: {
                                                        ...userForm.permissions.verify_permissions,
                                                        parent_entities: updated
                                                      }
                                                    }
                                                  });
                                                }}
                                                id={`verify_parent_entity_${entity.id}`}
                                              />
                                              <label className="form-check-label small" htmlFor={`verify_parent_entity_${entity.id}`}>
                                                {entity.name}
                                              </label>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ));
                                  })()
                                )}

                                {userForm.permissions.verify_permissions.parent_entities?.length > 0 && (
                                  <div className="alert alert-warning py-2 mt-2">
                                    <div className="small fw-medium mb-1">✅ Selected Parent Entities:</div>
                                    <div className="small">
                                      {userForm.permissions.verify_permissions.parent_entities.map(entity =>
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
                            checked={userForm.permissions.verify_permissions.type === 'specific_levels_children'}
                            onChange={(e) => setUserForm({
                              ...userForm,
                              permissions: {
                                ...userForm.permissions,
                                verify_permissions: {
                                  type: 'specific_levels_children',
                                  global: false,
                                  parent_entities: [],
                                  selected_levels: []
                                }
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
                        {userForm.permissions.verify_permissions.type === 'specific_levels_children' && (
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
                                          checked={userForm.permissions.verify_permissions.selected_levels?.includes(level)}
                                          onChange={(e) => {
                                            const current = userForm.permissions.verify_permissions.selected_levels || [];
                                            const updated = e.target.checked
                                              ? [...current, level]
                                              : current.filter(l => l !== level);
                                            setUserForm({
                                              ...userForm,
                                              permissions: {
                                                ...userForm.permissions,
                                                verify_permissions: {
                                                  ...userForm.permissions.verify_permissions,
                                                  selected_levels: updated
                                                }
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

                                {userForm.permissions.verify_permissions.selected_levels?.length > 0 && (
                                  <div className="alert alert-success py-2 mt-3">
                                    <div className="small fw-medium mb-1">✅ Selected Entity Levels:</div>
                                    <div className="small mb-2">
                                      <strong>{userForm.permissions.verify_permissions.selected_levels.join(', ')}</strong>
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
              )}

              {/* Lead-based Permissions */}
              {(userForm.permissions.permission_type === 'lead_based' || userForm.permissions.permission_type === 'hybrid') && (

                <>
                  {(userForm.permissions.permission_type === 'lead_based') && (
                    <div className="col-12">
                      <div className="mb-4">
                        <label className="form-label fw-medium mb-1 text-dark">
                          Is this user part of the counseling team?
                        </label>
                        <div className="form-check">
                          <input
                            type="radio"
                            id="counseling_yes"
                            name="is_counseling_team"
                            value="yes"
                            checked={userForm.is_counseling_team === true}
                            onChange={() =>
                              setUserForm({ ...userForm, is_counseling_team: true })
                            }
                            className="form-check-input"
                          />
                          <label className="form-check-label" htmlFor="counseling_yes">
                            Yes
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            type="radio"
                            id="counseling_no"
                            name="is_counseling_team"
                            value="no"
                            checked={userForm.is_counseling_team === false}
                            onChange={() =>
                              setUserForm({ ...userForm, is_counseling_team: false })
                            }
                            className="form-check-input"
                          />
                          <label className="form-check-label" htmlFor="counseling_no">
                            No
                          </label>
                        </div>
                      </div>

                      
                    </div>)}
                  <div className="col-12">
                    <h5 className="border-bottom pb-2">Lead Management Permissions</h5>
                    <div className="mt-3">
                      <div className="row g-3">
                        {Object.entries({
                          add_leads: 'Add New Leads',
                          edit_leads: 'Edit Leads',
                          manage_assignments: 'Manage Lead Assignments',
                          kyc_verification: '📋 KYC Verification',
                          bulk_status_change: '🔄 Bulk Status Change',
                          bulk_communication: '📱 Bulk Communication',
                          bulk_lead_assign: 'Bulk Lead Assign'
                        }).map(([key, label]) => (
                          <div key={key} className="col-md-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={userForm.permissions.lead_permissions[key]}
                                onChange={(e) => setUserForm({
                                  ...userForm,
                                  permissions: {
                                    ...userForm.permissions,
                                    lead_permissions: {
                                      ...userForm.permissions.lead_permissions,
                                      [key]: e.target.checked
                                    }
                                  }
                                })}
                                id={`lead_${key}`}
                              />
                              <label className="form-check-label fw-medium" htmlFor={`lead_${key}`}>
                                {label}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>


                    </div>
                  </div>

                </>
              )}

              {/* User Summary */}
              <div className="col-12">
                <div className="alert alert-light">
                  <h6 className="alert-heading">User Permission Summary</h6>
                  <div className="small">
                    <strong>Name:</strong> {userForm.name || 'Not set'}<br />
                    <strong>Email:</strong> {userForm.email || 'Not set'}<br />
                    <strong>Permission Type:</strong> {userForm.permissions.permission_type}<br />
                    <strong>View Access:</strong> {userForm.permissions.view_permissions.global ? 'Global' : 'Specific'}<br />
                    <strong>Add Access:</strong> {userForm.permissions.add_permissions.global ? 'Global' : `${userForm.permissions.add_permissions.specific_permissions?.length || 0} specific permission(s)`}<br />
                    <strong>Edit Access:</strong> {userForm.permissions.edit_permissions.global ? 'Global' : `${userForm.permissions.edit_permissions.specific_permissions?.length || 0} specific permission(s)`}<br />
                    <strong>Verify Access:</strong> {userForm.permissions.verify_permissions.type || 'Not set'}<br />
                    {userForm.permissions.permission_type !== 'hierarchical' && (
                      <>
                        <strong>Lead Permissions:</strong> {Object.values(userForm.permissions.lead_permissions).filter(Boolean).length} enabled<br />
                        <strong>Reporting Managers:</strong> {userForm.reporting_managers.length} selected
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                !userForm.name ||
                !userForm.email ||
                (userForm.permissions.permission_type === 'hierarchical' && !userForm.permissions.view_permissions.global && userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length === 0) ||
                (userForm.permissions.permission_type === 'lead_based' && userForm.reporting_managers.length === 0) ||
                (userForm.permissions.permission_type === 'hybrid' && !userForm.permissions.view_permissions.global && userForm.permissions.view_permissions.hierarchical_selection.selected_verticals.length === 0 && userForm.reporting_managers.length === 0)
              }
              className="btn btn-success"
            >
              👤 Add User with Complete Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage
const ExampleApp = () => {
  const [showModal, setShowModal] = useState(true);
  const [users, setUsers] = useState([]);

  const handleAddUser = (newUser) => {
    setUsers([...users, newUser]);
    setShowModal(false);
    console.log('New user added with permissions:', newUser);
  };

  return (
    <div>
      {showModal && (
        <AddUserModal
          users={users}
          entities={{}}
          onClose={() => setShowModal(false)}
          onAddUser={handleAddUser}
        />
      )}
      {!showModal && (
        <div className="container mt-5">
          <div className="text-center">
            <h3>User Added Successfully with Permissions!</h3>
            <p>Total Users: {users.length}</p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => setShowModal(true)}
            >
              Add Another User
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUserModal;