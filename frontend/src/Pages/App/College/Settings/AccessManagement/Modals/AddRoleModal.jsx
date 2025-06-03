import React, { useState } from 'react';

const AddRoleModal = ({ 
  entities, 
  onClose, 
  onAddRole 
}) => {
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
      manage_assignments: false,
      kyc_verification: false,
      bulk_status_change: false,
      bulk_communication: false
    }
  });

  // HELPER FUNCTIONS
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
      // If projects are specifically selected, use those
      if (hierarchical.selected_projects.length > 0) {
        return hierarchical.selected_projects.map(id =>
          entities.PROJECT.find(p => p.id === id)
        ).filter(Boolean);
      }
      // Otherwise, get all projects from selected verticals
      if (hierarchical.selected_verticals.length > 0) {
        return getAvailableProjects(hierarchical.selected_verticals);
      }
      return [];
    } else if (level === 'CENTER') {
      // If centers are specifically selected, use those
      if (hierarchical.selected_centers.length > 0) {
        return hierarchical.selected_centers.map(id =>
          entities.CENTER.find(c => c.id === id)
        ).filter(Boolean);
      }
      // Get centers from selected projects
      if (hierarchical.selected_projects.length > 0) {
        return getAvailableCenters(hierarchical.selected_projects);
      }
      // Get centers from all projects of selected verticals
      if (hierarchical.selected_verticals.length > 0) {
        const projects = getAvailableProjects(hierarchical.selected_verticals);
        return getAvailableCenters(projects.map(p => p.id));
      }
      return [];
    } else if (level === 'COURSE') {
      // If courses are specifically selected, use those
      if (hierarchical.selected_courses.length > 0) {
        return hierarchical.selected_courses.map(id =>
          entities.COURSE.find(c => c.id === id)
        ).filter(Boolean);
      }
      // Get courses from selected centers
      if (hierarchical.selected_centers.length > 0) {
        return getAvailableCourses(hierarchical.selected_centers);
      }
      // Get courses from centers of selected projects
      if (hierarchical.selected_projects.length > 0) {
        const centers = getAvailableCenters(hierarchical.selected_projects);
        return getAvailableCourses(centers.map(c => c.id));
      }
      // Get courses from centers of projects of selected verticals
      if (hierarchical.selected_verticals.length > 0) {
        const projects = getAvailableProjects(hierarchical.selected_verticals);
        const centers = getAvailableCenters(projects.map(p => p.id));
        return getAvailableCourses(centers.map(c => c.id));
      }
      return [];
    } else if (level === 'BATCH') {
      // If batches are specifically selected, use those
      if (hierarchical.selected_batches.length > 0) {
        return hierarchical.selected_batches.map(id =>
          entities.BATCH.find(b => b.id === id)
        ).filter(Boolean);
      }
      // Get batches from selected courses
      if (hierarchical.selected_courses.length > 0) {
        return getAvailableBatches(hierarchical.selected_courses);
      }
      // Get batches from courses of selected centers
      if (hierarchical.selected_centers.length > 0) {
        const courses = getAvailableCourses(hierarchical.selected_centers);
        return getAvailableBatches(courses.map(c => c.id));
      }
      // Continue the chain upward as needed
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

  // HANDLE ADD ROLE FUNCTION
  const handleSubmit = () => {
    const newRole = {
      name: roleForm.name.toUpperCase().replace(/ /g, '_'),
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

    console.log('New Role Created:', newRole);
    onAddRole(newRole);
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Role</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-4">
              {/* Basic Information */}
              <div className="col-12">
                <h5 className="border-bottom pb-2">Basic Information</h5>
                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <label className="form-label">Role Name *</label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      placeholder="e.g., Regional Supervisor"
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Permission Type</label>
                    <select
                      value={roleForm.permission_type}
                      onChange={(e) => setRoleForm({ ...roleForm, permission_type: e.target.value })}
                      className="form-select"
                    >
                      <option value="hierarchical">Hierarchical</option>
                      <option value="lead_based">Lead Based</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description *</label>
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
              {(roleForm.permission_type === 'hierarchical' || roleForm.permission_type === 'hybrid') && (
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
                          <div className="text-muted small">Select specific verticals, then their projects, centers, courses, and batches</div>
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

                          {/* Step 2: Select Projects */}
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

                          {/* Step 3: Select Centers */}
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

                          {/* Step 4: Select Courses */}
                          {roleForm.view_permissions.hierarchical_selection.selected_centers.length > 0 && (
                            <div className="mb-4">
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-warning text-white">4</span>
                                <label className="form-label fw-medium mb-0 text-dark">Select Courses</label>
                                <small className="text-muted">(from selected centers)</small>
                              </div>
                              <div className="border rounded p-3 bg-white shadow-sm">
                                {(() => {
                                  const availableCourses = getAvailableCourses(roleForm.view_permissions.hierarchical_selection.selected_centers);
                                  if (availableCourses.length === 0) {
                                    return <div className="text-muted small">No courses found in selected centers</div>;
                                  }
                                  return availableCourses.map(course => (
                                    <div key={course.id} className="form-check mb-2">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={roleForm.view_permissions.hierarchical_selection.selected_courses.includes(course.id)}
                                        onChange={(e) => {
                                          const current = roleForm.view_permissions.hierarchical_selection.selected_courses;
                                          const updated = e.target.checked
                                            ? [...current, course.id]
                                            : current.filter(id => id !== course.id);
                                          updateHierarchicalSelection('courses', updated);
                                        }}
                                        id={`course_${course.id}`}
                                      />
                                      <label className="form-check-label fw-medium text-dark" htmlFor={`course_${course.id}`}>
                                        {course.name}
                                        <small className="text-muted ms-2">
                                          (from {entities.CENTER.find(c => c.id === course.parent_id)?.name})
                                        </small>
                                      </label>
                                    </div>
                                  ));
                                })()}
                                {roleForm.view_permissions.hierarchical_selection.selected_courses.length > 0 && (
                                  <div className="alert alert-light border-warning py-2 mt-2 mb-0">
                                    <small className="text-warning fw-medium">✅ Selected {roleForm.view_permissions.hierarchical_selection.selected_courses.length} course(s)</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Step 5: Select Batches */}
                          {roleForm.view_permissions.hierarchical_selection.selected_courses.length > 0 && (
                            <div className="mb-4">
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-success text-white">5</span>
                                <label className="form-label fw-medium mb-0 text-dark">Select Batches</label>
                                <small className="text-muted">(from selected courses)</small>
                              </div>
                              <div className="border rounded p-3 bg-white shadow-sm">
                                {(() => {
                                  const availableBatches = getAvailableBatches(roleForm.view_permissions.hierarchical_selection.selected_courses);
                                  if (availableBatches.length === 0) {
                                    return <div className="text-muted small">No batches found in selected courses</div>;
                                  }
                                  return availableBatches.map(batch => (
                                    <div key={batch.id} className="form-check mb-2">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={roleForm.view_permissions.hierarchical_selection.selected_batches.includes(batch.id)}
                                        onChange={(e) => {
                                          const current = roleForm.view_permissions.hierarchical_selection.selected_batches;
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
                                          (from {entities.COURSE.find(c => c.id === batch.parent_id)?.name})
                                        </small>
                                      </label>
                                    </div>
                                  ));
                                })()}
                                {roleForm.view_permissions.hierarchical_selection.selected_batches.length > 0 && (
                                  <div className="alert alert-light border-success py-2 mt-2 mb-0">
                                    <small className="text-success fw-medium">✅ Selected {roleForm.view_permissions.hierarchical_selection.selected_batches.length} batch(es)</small>
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
              )}

              {/* Add Permissions Section */}
              {(roleForm.permission_type === 'hierarchical' || roleForm.permission_type === 'hybrid') && (
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
              )}

              {/* Edit Permissions Section */}
              {(roleForm.permission_type === 'hierarchical' || roleForm.permission_type === 'hybrid') && (
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
              )}

              {/* Verify Permissions Section */}
              {(roleForm.permission_type === 'hierarchical' || roleForm.permission_type === 'hybrid') && (
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
              )}

              {/* Lead-based Permissions */}
              {(roleForm.permission_type === 'lead_based' || roleForm.permission_type === 'hybrid') && (
                <div className="col-12">
                  <h5 className="border-bottom pb-2">Lead Management Permissions</h5>
                  <div className="mt-3">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.view_own_leads}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                view_own_leads: e.target.checked
                              }
                            })}
                            id="view_own_leads"
                          />
                          <label className="form-check-label fw-medium" htmlFor="view_own_leads">
                            View Own Leads
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.add_leads}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                add_leads: e.target.checked
                              }
                            })}
                            id="add_leads"
                          />
                          <label className="form-check-label fw-medium" htmlFor="add_leads">
                            Add New Leads
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.edit_leads}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                edit_leads: e.target.checked
                              }
                            })}
                            id="edit_leads"
                          />
                          <label className="form-check-label fw-medium" htmlFor="edit_leads">
                            Edit Leads
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.view_team_leads}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                view_team_leads: e.target.checked
                              }
                            })}
                            id="view_team_leads"
                          />
                          <label className="form-check-label fw-medium" htmlFor="view_team_leads">
                            View Team Leads
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.manage_assignments}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                manage_assignments: e.target.checked
                              }
                            })}
                            id="manage_assignments"
                          />
                          <label className="form-check-label fw-medium" htmlFor="manage_assignments">
                            Manage Lead Assignments
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.kyc_verification}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                kyc_verification: e.target.checked
                              }
                            })}
                            id="kyc_verification"
                          />
                          <label className="form-check-label fw-medium" htmlFor="kyc_verification">
                            📋 KYC Verification
                          </label>
                          <div className="text-muted small">Verify lead documents and KYC compliance</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.bulk_status_change}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                bulk_status_change: e.target.checked
                              }
                            })}
                            id="bulk_status_change"
                          />
                          <label className="form-check-label fw-medium" htmlFor="bulk_status_change">
                            🔄 Bulk Status Change
                          </label>
                          <div className="text-muted small">Change status of multiple leads at once</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={roleForm.lead_permissions.bulk_communication}
                            onChange={(e) => setRoleForm({
                              ...roleForm,
                              lead_permissions: {
                                ...roleForm.lead_permissions,
                                bulk_communication: e.target.checked
                              }
                            })}
                            id="bulk_communication"
                          />
                          <label className="form-check-label fw-medium" htmlFor="bulk_communication">
                            📱 Bulk Communication
                          </label>
                          <div className="text-muted small">Send WhatsApp, SMS, Email to multiple leads</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Role Summary */}
              <div className="col-12">
                <div className="alert alert-light">
                  <h6 className="alert-heading">Role Summary</h6>
                  <div className="small">
                    <strong>Type:</strong> {roleForm.permission_type}<br />
                    <strong>Access:</strong> {roleForm.view_permissions.global ? 'Global' : 'Specific'}<br />
                    {roleForm.permission_type !== 'hierarchical' && (
                      <>
                        <strong>Lead Permissions:</strong> {Object.values(roleForm.lead_permissions).filter(Boolean).length} enabled
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!roleForm.name || !roleForm.description}
              className="btn btn-info"
            >
              Create Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRoleModal;