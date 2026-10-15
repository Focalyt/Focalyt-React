import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const ShiftTargetModal = ({
  isOpen,
  selection,
  departments,
  loadingDepartments,
  backendUrl,
  token,
  onClose,
  onShift,
}) => {
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [projectsByDepartment, setProjectsByDepartment] = useState({});
  const [selectedProjectIdsByDepartment, setSelectedProjectIdsByDepartment] = useState({});
  const [loadingProjectsByDepartment, setLoadingProjectsByDepartment] = useState({});
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState([]);
  const [positionByDepartment, setPositionByDepartment] = useState({});
  const [positionByProject, setPositionByProject] = useState({});
  const loadedDepartmentsRef = useRef({});

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDepartmentIds([]);
    setProjectsByDepartment({});
    setSelectedProjectIdsByDepartment({});
    setLoadingProjectsByDepartment({});
    loadedDepartmentsRef.current = {};
    setSelectedMilestoneIds((selection?.milestones || []).map((item) => item._id));
    setPositionByDepartment({});
    setPositionByProject({});
  }, [isOpen, selection]);

  useEffect(() => {
    if (!isOpen || !token) return undefined;
    let cancelled = false;
    selectedDepartmentIds.forEach((deptId) => {
      if (loadedDepartmentsRef.current[deptId]) return;
      loadedDepartmentsRef.current[deptId] = 'loading';
      setLoadingProjectsByDepartment((prev) => ({ ...prev, [deptId]: true }));
      axios.get(`${backendUrl}/college/list-projects`, {
        headers: { 'x-auth': token },
        params: { vertical: deptId },
      }).then((response) => {
        if (cancelled) return;
        loadedDepartmentsRef.current[deptId] = 'done';
        setProjectsByDepartment((prev) => ({
          ...prev,
          [deptId]: (response.data?.data || []).map((item) => ({
            _id: String(item._id),
            name: item.name || 'Untitled project',
          })),
        }));
      }).catch((error) => {
        console.error('Error fetching projects for shift:', error);
        if (!cancelled) {
          loadedDepartmentsRef.current[deptId] = '';
          setProjectsByDepartment((prev) => ({ ...prev, [deptId]: [] }));
        }
      }).finally(() => {
        if (!cancelled) {
          setLoadingProjectsByDepartment((prev) => ({ ...prev, [deptId]: false }));
        }
      });
    });
    return () => { cancelled = true; };
  }, [isOpen, selectedDepartmentIds, backendUrl, token]);

  if (!isOpen || !selection) return null;

  const milestoneList = selection.milestones || [];
  const isSingle = Boolean(selection.single);
  const allMilestonesSelected = milestoneList.length > 0 && selectedMilestoneIds.length === milestoneList.length;

  const toggleDepartment = (deptId) => {
    if (selectedDepartmentIds.includes(deptId)) {
      setSelectedDepartmentIds((prev) => prev.filter((id) => id !== deptId));
      setSelectedProjectIdsByDepartment((prev) => {
        const next = { ...prev };
        delete next[deptId];
        return next;
      });
      setPositionByDepartment((prev) => {
        const next = { ...prev };
        delete next[deptId];
        return next;
      });
      setPositionByProject((prev) => {
        const next = { ...prev };
        (projectsByDepartment[deptId] || []).forEach((project) => {
          delete next[project._id];
        });
        return next;
      });
      return;
    }
    setSelectedDepartmentIds((prev) => [...prev, deptId]);
  };

  const toggleProject = (deptId, projId) => {
    const removing = (selectedProjectIdsByDepartment[deptId] || []).includes(projId);
    setSelectedProjectIdsByDepartment((prev) => {
      const current = prev[deptId] || [];
      return {
        ...prev,
        [deptId]: current.includes(projId) ? current.filter((id) => id !== projId) : [...current, projId],
      };
    });
    if (removing) {
      setPositionByProject((positions) => {
        const next = { ...positions };
        delete next[projId];
        return next;
      });
    }
  };

  const keepDigits = (value) => String(value || '').replace(/[^\d]/g, '');

  const readPosition = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const number = Number(text);
    if (!Number.isInteger(number) || number < 1) return Number.NaN;
    return number;
  };

  const toggleMilestone = (milestoneId) => {
    setSelectedMilestoneIds((prev) => (
      prev.includes(milestoneId) ? prev.filter((id) => id !== milestoneId) : [...prev, milestoneId]
    ));
  };

  const handleConfirm = () => {
    const targets = [];
    for (const deptId of selectedDepartmentIds) {
      if (loadingProjectsByDepartment[deptId]) {
        alert('Wait for projects to finish loading');
        return;
      }
      const departmentName = departments.find((item) => item._id === deptId)?.name || 'Department';
      const departmentPosition = readPosition(positionByDepartment[deptId]);
      if (Number.isNaN(departmentPosition)) {
        alert(`Enter a whole position of 1 or more for ${departmentName}`);
        return;
      }
      const selectedIds = selectedProjectIdsByDepartment[deptId] || [];
      const departmentProjects = projectsByDepartment[deptId] || [];
      const chosenProjects = selectedIds.length
        ? selectedIds.map((projId) => departmentProjects.find((item) => item._id === projId)).filter(Boolean)
        : departmentProjects;
      if (!chosenProjects.length) {
        alert(departmentProjects.length ? `Select a project in ${departmentName}` : `${departmentName} has no projects`);
        return;
      }
      for (const project of chosenProjects) {
        const projectPosition = readPosition(positionByProject[project._id]);
        if (Number.isNaN(projectPosition)) {
          alert(`Enter a whole position of 1 or more for ${project.name}`);
          return;
        }
        const position = projectPosition || departmentPosition;
        if (!position) {
          alert(`Enter a position for ${departmentName}`);
          return;
        }
        targets.push({
          departmentId: deptId,
          projectId: project._id,
          departmentName,
          projectName: project.name,
          position,
          customOrder: projectPosition != null && projectPosition !== departmentPosition,
        });
      }
    }
    if (!targets.length) {
      alert('Select a department');
      return;
    }
    const chosen = milestoneList.filter((item) => selectedMilestoneIds.includes(item._id));
    if (!chosen.length) {
      alert('Select at least one milestone');
      return;
    }
    onShift({ targets, milestones: chosen, single: isSingle });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      zIndex: 120,
      overflowY: 'auto',
      padding: '40px 16px',
    }}
    >
      <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 480, maxWidth: '100%', margin: 'auto 0' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
          {isSingle ? 'Switch milestone' : 'Shift all milestones'}
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>
          {isSingle
            ? `Add "${milestoneList[0]?.title || 'this milestone'}" and set its position. A project position overrides the department.`
            : 'Select the milestones, then set the position for each department or project. They are placed in list order starting at that position.'}
        </p>
        <div style={{
          marginBottom: 16,
          padding: '10px 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          maxHeight: 160,
          overflowY: 'auto',
        }}
        >
          {!isSingle && milestoneList.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Milestones</span>
              <button
                type="button"
                onClick={() => setSelectedMilestoneIds(allMilestonesSelected ? [] : milestoneList.map((item) => item._id))}
                style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {allMilestonesSelected ? 'Clear' : 'Select all'}
              </button>
            </div>
          )}
          {milestoneList.map((item, index) => (
            isSingle ? (
              <div key={item._id || index} style={{ fontSize: 13, color: '#1a202c', marginBottom: 4 }}>
                {item.title}
              </div>
            ) : (
              <label
                key={item._id || index}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1a202c', marginBottom: 4, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={selectedMilestoneIds.includes(item._id)}
                  onChange={() => toggleMilestone(item._id)}
                />
                <span>{index + 1}. {item.title}</span>
              </label>
            )
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Departments and projects</label>
          <div style={{ marginBottom: 8, fontSize: 12, color: '#718096' }}>
            Position 1 is first. Leave projects unticked to use every project in the department.
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, maxHeight: 280, overflowY: 'auto', padding: '8px 12px' }}>
            {loadingDepartments ? (
              <div style={{ fontSize: 13, color: '#718096' }}>Loading departments...</div>
            ) : departments.length === 0 ? (
              <div style={{ fontSize: 13, color: '#a0aec0' }}>No departments</div>
            ) : departments.map((department) => {
              const departmentChecked = selectedDepartmentIds.includes(department._id);
              const departmentProjects = projectsByDepartment[department._id] || [];
              const selectedProjects = selectedProjectIdsByDepartment[department._id] || [];
              return (
                <div key={department._id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={departmentChecked}
                        onChange={() => toggleDepartment(department._id)}
                      />
                      <span>{department.name}</span>
                    </label>
                    {departmentChecked && (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={positionByDepartment[department._id] || ''}
                        onChange={(event) => setPositionByDepartment((prev) => ({
                          ...prev,
                          [department._id]: keepDigits(event.target.value),
                        }))}
                        placeholder="Position"
                        aria-label={`Position for ${department.name}`}
                        style={{ width: 84, height: 28, padding: '0 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                      />
                    )}
                  </div>
                  {departmentChecked && (
                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                      {loadingProjectsByDepartment[department._id] ? (
                        <div style={{ fontSize: 12, color: '#718096' }}>Loading projects...</div>
                      ) : departmentProjects.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#a0aec0' }}>No projects</div>
                      ) : departmentProjects.map((project) => {
                        const projectChecked = selectedProjects.includes(project._id);
                        return (
                          <div key={project._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={projectChecked}
                                onChange={() => toggleProject(department._id, project._id)}
                              />
                              <span>{project.name}</span>
                            </label>
                            {projectChecked && (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={positionByProject[project._id] || ''}
                                onChange={(event) => setPositionByProject((prev) => ({
                                  ...prev,
                                  [project._id]: keepDigits(event.target.value),
                                }))}
                                placeholder="Position"
                                aria-label={`Position for ${project.name}`}
                                style={{ width: 84, height: 28, padding: '0 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            {isSingle ? 'Switch' : 'Shift all'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MilestoneB2C = () => {
  const [milestones, setMilestones] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [appliedDepartmentId, setAppliedDepartmentId] = useState('');
  const [appliedProjectId, setAppliedProjectId] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [transferSelection, setTransferSelection] = useState(null);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 5000);
  };

  const fetchMilestones = async () => {
    try {
      setLoadingMilestones(true);
      const response = await axios.get(`${backendUrl}/college/milestone`, {
        headers: { 'x-auth': token },
      });
      if (response.data.success) {
        setMilestones((response.data.data || []).map((item) => ({
          _id: item._id,
          title: item.title,
          description: item.description,
          assignedDepartments: (item.assignedDepartments || []).map(String),
          assignedProjects: (item.assignedProjects || []).map(String),
          projectPositions: item.projectPositions || {},
          departmentPositions: item.departmentPositions || {},
        })));
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      showAlert('Failed to fetch milestones', 'danger');
    } finally {
      setLoadingMilestones(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await axios.get(`${backendUrl}/college/getVerticals`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        setDepartments((response.data?.data || [])
          .filter((item) => item.status !== false)
          .map((item) => ({
            _id: String(item._id),
            name: item.name || 'Untitled department',
          })));
      } catch (error) {
        console.error('Error fetching departments:', error);
        if (!cancelled) setDepartments([]);
      } finally {
        if (!cancelled) setLoadingDepartments(false);
      }
    };
    loadDepartments();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    axios.get(`${backendUrl}/college/list_all_projects`, {
      headers: { 'x-auth': token },
    }).then((response) => {
      if (cancelled) return;
      setAllProjects((response.data?.data || []).map((item) => ({
        _id: String(item._id),
        name: item.name || 'Untitled project',
        vertical: item.vertical ? String(item.vertical) : '',
      })));
    }).catch((error) => {
      console.error('Error fetching projects:', error);
      if (!cancelled) setAllProjects([]);
    });
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  useEffect(() => {
    if (!token || !departmentId) {
      setProjects([]);
      setLoadingProjects(false);
      return undefined;
    }
    let cancelled = false;
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list-projects`, {
          headers: { 'x-auth': token },
          params: { vertical: departmentId },
        });
        if (cancelled) return;
        setProjects((response.data?.data || []).map((item) => ({
          _id: String(item._id),
          name: item.name || 'Untitled project',
        })));
      } catch (error) {
        console.error('Error fetching projects:', error);
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };
    loadProjects();
    return () => { cancelled = true; };
  }, [departmentId, backendUrl, token]);

  const filterActive = Boolean(appliedDepartmentId);

  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    setProjectId('');
    setAppliedDepartmentId(value);
    setAppliedProjectId('');
  };

  const handleProjectChange = (value) => {
    setProjectId(value);
    setAppliedProjectId(value);
  };

  const scopePosition = (item) => {
    const raw = appliedProjectId
      ? item.projectPositions?.[appliedProjectId]
      : item.departmentPositions?.[appliedDepartmentId];
    const position = Number(raw);
    return Number.isFinite(position) ? position : Number.MAX_SAFE_INTEGER;
  };

  const filteredMilestones = filterActive
    ? milestones
      .filter((item) => item.assignedDepartments.includes(appliedDepartmentId)
        && (!appliedProjectId || item.assignedProjects.includes(appliedProjectId)))
      .sort((a, b) => scopePosition(a) - scopePosition(b))
    : milestones;

  const tableRows = filteredMilestones.flatMap((milestone, milestoneIndex) => {
    const departmentIds = filterActive
      ? milestone.assignedDepartments.filter((id) => id === appliedDepartmentId)
      : milestone.assignedDepartments;
    const projectsFor = (departmentId) => milestone.assignedProjects
      .map((id) => allProjects.find((project) => project._id === id))
      .filter((project) => project && (!departmentId || project.vertical === departmentId))
      .filter((project) => !filterActive || !appliedProjectId || project._id === appliedProjectId)
      .map((project) => project.name);

    if (!departmentIds.length) {
      return [{
        key: milestone._id,
        milestone,
        milestoneIndex,
        departmentName: '—',
        projectNames: [],
      }];
    }
    return departmentIds.map((departmentId) => ({
      key: `${milestone._id}-${departmentId}`,
      milestone,
      milestoneIndex,
      departmentName: departments.find((item) => item._id === departmentId)?.name || '—',
      projectNames: projectsFor(departmentId),
    }));
  });

  const appliedDepartmentName = departments.find((item) => item._id === appliedDepartmentId)?.name || '';
  const appliedProjectName = appliedProjectId
    ? (projects.find((item) => item._id === appliedProjectId)?.name || '')
    : '';

  const openSwitchMilestone = (milestone) => {
    if (!milestone) return;
    setTransferSelection({ milestones: [milestone], single: true });
  };

  const handleShiftToScope = async ({ targets, milestones: chosen, single }) => {
    if (!targets?.length || !chosen?.length) return;
    try {
      const response = await axios.post(`${backendUrl}/college/milestone/assign`, {
        milestoneIds: chosen.map((item) => item._id),
        placements: targets.map((target) => ({
          projectId: target.projectId,
          position: target.position,
          customOrder: target.customOrder,
        })),
      }, { headers: { 'x-auth': token } });
      if (!response.data.success) {
        showAlert(response.data.message || 'Failed to assign milestone', 'danger');
        return;
      }
    } catch (error) {
      console.error('Error assigning milestone:', error);
      showAlert(error.response?.data?.message || 'Failed to assign milestone', 'danger');
      return;
    }
    const targetLabel = targets.length === 1
      ? `${targets[0].departmentName} / ${targets[0].projectName}`
      : `${targets.length} projects`;
    showAlert(
      single
        ? `Assigned "${chosen[0].title}" to ${targetLabel}.`
        : `Assigned ${chosen.length} milestones to ${targetLabel}.`,
      'success'
    );
    setTransferSelection(null);
    fetchMilestones();
  };

  const persistOrder = async (ordered, scope) => {
    const milestoneOrder = ordered.map((item, index) => ({
      _id: item._id,
      index,
    }));
    try {
      const response = await axios.put(`${backendUrl}/college/milestone/reorder`, {
        milestoneOrder,
        departmentId: scope.departmentId,
        projectId: scope.projectId || undefined,
      }, {
        headers: { 'x-auth': token },
      });
      if (response.data.success) {
        fetchMilestones();
        return;
      }
      fetchMilestones();
    } catch (error) {
      console.error('Error reordering milestone:', error);
      fetchMilestones();
    }
  };

  const reorderWithinScope = (fromIndex, toIndex) => {
    if (!filterActive) return;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= filteredMilestones.length || toIndex >= filteredMilestones.length) return;
    if (fromIndex === toIndex) return;
    const next = [...filteredMilestones];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const scopeId = appliedProjectId || appliedDepartmentId;
    const positionKey = appliedProjectId ? 'projectPositions' : 'departmentPositions';
    setMilestones((current) => current.map((item) => {
      const at = next.findIndex((row) => row._id === item._id);
      if (at < 0) return item;
      return {
        ...item,
        [positionKey]: { ...(item[positionKey] || {}), [scopeId]: at },
      };
    }));
    persistOrder(next, { departmentId: appliedDepartmentId, projectId: appliedProjectId });
  };

  const handleMoveLeft = (currentIndex) => {
    reorderWithinScope(currentIndex, currentIndex - 1);
  };

  const handleMoveRight = (currentIndex) => {
    reorderWithinScope(currentIndex, currentIndex + 1);
  };

  const handleDrop = (event, targetIndex) => {
    event.preventDefault();
    if (draggedItem === null || draggedItem === targetIndex) return;
    reorderWithinScope(draggedItem, targetIndex);
    setDraggedItem(null);
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingMilestone(null);
    setFormResetKey((value) => value + 1);
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setIsEditMode(true);
    setFormResetKey((value) => value + 1);
  };

  const handleDeleteMilestone = (milestoneId) => {
    setDeletingMilestoneId(milestoneId);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async ({ title, description, departments: formDepartments, projects: formProjects }) => {
    const headers = { 'x-auth': token };
    setSaving(true);
    try {
      if (isEditMode && editingMilestone?._id) {
        // No selected departments or projects makes the milestone global again.
        const response = await axios.put(
          `${backendUrl}/college/milestone/edit/${editingMilestone._id}`,
          { title, description, departments: formDepartments || [], projects: formProjects || [] },
          { headers }
        );
        if (response.data.success) showAlert('Milestone updated successfully', 'success');
      } else {
        const response = await axios.post(`${backendUrl}/college/milestone/add`, { title, description }, { headers });
        const createdId = response.data?.data?._id;
        const hasScope = formDepartments?.length || formProjects?.length;
        if (response.data.success && createdId && hasScope) {
          await axios.put(
            `${backendUrl}/college/milestone/edit/${createdId}`,
            { departments: formDepartments || [], projects: formProjects || [] },
            { headers }
          );
        }
        if (response.data.success) showAlert('Milestone added successfully', 'success');
      }
      resetForm();
      fetchMilestones();
      return true;
    } catch (error) {
      console.error('Error saving milestone:', error);
      showAlert(error.response?.data?.message || 'Failed to save', 'danger');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (deletingMilestoneId) {
        const response = await axios.delete(
          `${backendUrl}/college/milestone/delete/${deletingMilestoneId}`,
          { headers: { 'x-auth': token } }
        );
        if (response.data.success) {
          showAlert('Milestone deleted successfully', 'success');
          if (editingMilestone?._id === deletingMilestoneId) resetForm();
          fetchMilestones();
        }
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      showAlert('Error occurred while deleting', 'danger');
    }
    setIsDeleteModalOpen(false);
    setDeletingMilestoneId(null);
  };

  const deletingMilestone = milestones.find((item) => item._id === deletingMilestoneId);


  return (
    <div className="container-fluid milestone-b2c-page">
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">
                {isEditMode ? 'Edit Milestone' : 'Add Milestone'}
              </h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">
                    {isEditMode ? 'Edit Milestone' : 'Add Milestone'}
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {alert.show && (
        <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ show: false, message: '', type: '' })}
          ></button>
        </div>
      )}

      <div className="content-body">
        <section className="list-view">
          <div className="row b2b-main-row">
            <div className="col-6 equal-height-2 b2b-form-col">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">
                    {isEditMode ? 'Edit Milestone' : 'Add Milestone'}
                  </h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <MilestoneForm
                      key={formResetKey}
                      editMode={isEditMode}
                      initialData={editingMilestone}
                      departments={departments}
                      backendUrl={backendUrl}
                      token={token}
                      onSave={handleSave}
                      onCancel={resetForm}
                      saving={saving}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 rounded equal-height-2 coloumn-2 b2b-table-col">
              <div className="card">
                <div className="row p-1">
                  <div className="col-xl-5">
                    <div className="card-header">
                      <h4 className="card-title">All Milestones</h4>
                    </div>
                  </div>
                  <div className="col-xl-7">
                    <div className="card-header d-flex gap-2">
                      <select
                        className="form-control form-control-sm"
                        value={departmentId}
                        onChange={(event) => handleDepartmentChange(event.target.value)}
                        disabled={loadingDepartments}
                      >
                        <option value="">{loadingDepartments ? 'Loading...' : 'All Departments'}</option>
                        {departments.map((item) => (
                          <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                      </select>
                      <select
                        className="form-control form-control-sm"
                        value={projectId}
                        onChange={(event) => handleProjectChange(event.target.value)}
                        disabled={!departmentId || loadingProjects}
                      >
                        <option value="">
                          {!departmentId ? 'All Projects' : loadingProjects ? 'Loading...' : 'All Projects'}
                        </option>
                        {projects.map((item) => (
                          <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {filterActive && (
                  <p className="text-muted small px-2 mb-0">
                    Showing milestones for <strong>{appliedDepartmentName || 'Department'}</strong>
                    {' / '}
                    <strong>{appliedProjectId ? (appliedProjectName || 'Project') : 'All projects'}</strong>
                    . Drag a row to set the order.
                  </p>
                )}

                <div className="card-content">
                  <div className="table-responsive">
                    {loadingMilestones && milestones.length === 0 ? (
                      <div className="text-center p-4">
                        <div className="spinner-border text-primary"></div>
                        <p className="mt-2">Loading milestones...</p>
                      </div>
                    ) : (
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>Milestone</th>
                            <th>Department</th>
                            <th>Project</th>
                            <th>Description</th>
                            {filterActive && <th>Position</th>}
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.length > 0 ? (
                            tableRows.map((row) => {
                              const { milestone, milestoneIndex } = row;
                              return (
                                <tr
                                  key={row.key}
                                  draggable={filterActive}
                                  onDragStart={() => setDraggedItem(milestoneIndex)}
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={(event) => handleDrop(event, milestoneIndex)}
                                  style={{ cursor: filterActive ? 'grab' : 'default' }}
                                >
                                  <td className="milestone-title-cell">
                                    <div className="milestone-title">{milestone.title}</div>
                                  </td>
                                  <td>
                                    {row.departmentName === '—' ? '—' : (
                                      <span className="dept-chip dept-chip-table">{row.departmentName}</span>
                                    )}
                                  </td>
                                  <td>
                                    {row.projectNames.length === 0 && '—'}
                                    {row.projectNames.length === 1 && (
                                      <span className="dept-chip dept-chip-table">{row.projectNames[0]}</span>
                                    )}
                                    {row.projectNames.length > 1 && (
                                      <span className="milestone-project-count" title={row.projectNames.join(', ')}>
                                        {row.projectNames.length} projects
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span className="milestone-desc" title={milestone.description || 'No description'}>
                                      {milestone.description || 'No description'}
                                    </span>
                                  </td>
                                  {filterActive && (
                                    <td>
                                      <div className="d-flex align-items-center gap-1">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-secondary"
                                          onMouseDown={(event) => event.stopPropagation()}
                                          onClick={() => handleMoveLeft(milestoneIndex)}
                                          disabled={milestoneIndex === 0}
                                          title="Move up"
                                        >
                                          ↑
                                        </button>
                                        <span>{milestoneIndex + 1}</span>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-secondary"
                                          onMouseDown={(event) => event.stopPropagation()}
                                          onClick={() => handleMoveRight(milestoneIndex)}
                                          disabled={milestoneIndex === filteredMilestones.length - 1}
                                          title="Move down"
                                        >
                                          ↓
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                  <td>
                                    <div className="milestone-row-actions">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary milestone-icon-btn"
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={() => openSwitchMilestone(milestone)}
                                        title="Switch"
                                      >
                                        <i className="fas fa-exchange-alt"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary milestone-icon-btn"
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={() => handleEditMilestone(milestone)}
                                        title="Edit"
                                        disabled={saving}
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger milestone-icon-btn"
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onClick={() => handleDeleteMilestone(milestone._id)}
                                        title="Delete"
                                        disabled={saving}
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={filterActive ? 6 : 5} className="text-center">
                                {filterActive ? 'No milestones added here yet' : 'No milestones found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ShiftTargetModal
        isOpen={Boolean(transferSelection)}
        selection={transferSelection}
        departments={departments}
        loadingDepartments={loadingDepartments}
        backendUrl={backendUrl}
        token={token}
        onClose={() => setTransferSelection(null)}
        onShift={handleShiftToScope}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingMilestoneId(null);
        }}
        onConfirm={handleConfirmDelete}
        itemTitle={deletingMilestone?.title}
      />

      <style>{`
        .milestone-b2c-page .asterisk {
          color: red;
        }
        .milestone-b2c-page .content-header-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #000;
        }
        .milestone-b2c-page .breadcrumb a,
        .milestone-b2c-page .breadcrumb-item.active {
          font-size: 0.8rem;
        }
        .milestone-b2c-page .card .card-title {
          font-size: 1rem !important;
        }
        .milestone-b2c-page .table th {
          font-size: 12px !important;
          text-transform: uppercase;
          background-color: #f8f9fa;
          font-weight: 600;
          border-top: none;
        }
        .milestone-b2c-page .table-hover-animation thead th {
          border-top: 2px solid #f8f8f8;
          border-bottom: 0;
          background-color: #fff;
        }
        .milestone-b2c-page label {
          font-size: 0.80rem !important;
          text-transform: capitalize;
        }
        .milestone-b2c-page .card {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 8px;
        }
        .milestone-b2c-page .card-header {
          border-bottom: 1px solid #dee2e6;
        }
        .milestone-b2c-page .table {
          width: 100%;
          margin-bottom: 1rem;
          color: #626262;
        }
        .milestone-b2c-page .table td {
          vertical-align: middle;
          white-space: normal;
        }
        .milestone-b2c-page .milestone-title {
          font-weight: 600;
          color: #1f2937;
          line-height: 1.3;
        }
        .milestone-b2c-page .milestone-title-projects {
          margin-top: 4px;
          max-width: 240px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.45;
        }
        .milestone-b2c-page .milestone-project-count {
          display: inline-flex;
          align-items: center;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 0.72rem;
          white-space: nowrap;
        }
        .milestone-b2c-page .milestone-desc {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 160px;
          color: #6b7280;
          line-height: 1.4;
        }
        .milestone-b2c-page .milestone-row-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .milestone-b2c-page .milestone-icon-btn {
          width: 32px;
          height: 32px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .milestone-b2c-page .form-control:focus {
          border-color: #28a745;
          box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
        }
        .milestone-b2c-page .btn-success {
          background-color: #28a745;
          border-color: #28a745;
        }
        .milestone-b2c-page .btn-success:hover {
          background-color: #218838;
          border-color: #1e7e34;
        }
        .milestone-b2c-page .btn-success:disabled {
          background-color: #6c757d;
          border-color: #6c757d;
        }
        .milestone-b2c-page .content-header {
          margin-bottom: 2rem;
        }
        .milestone-b2c-page .breadcrumb {
          background-color: transparent;
          padding: 0;
        }
        .milestone-b2c-page .alert {
          margin-bottom: 1rem;
        }
        .milestone-b2c-page .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }
        .milestone-b2c-page .gap-2 {
          gap: 0.5rem;
        }
        .milestone-b2c-page .font-small-3 {
          font-size: 0.875rem;
        }
        .milestone-b2c-page .dept-table-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .milestone-b2c-page .dept-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #eef6ff;
          color: #1a5fb4;
          border: 1px solid #cfe2ff;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 0.72rem;
          line-height: 1.4;
          text-transform: none;
        }
        .milestone-b2c-page .dept-chip-table {
          background: #f3f4f6;
          color: #374151;
          border-color: #e5e7eb;
        }
        .milestone-b2c-page .dept-chip-remove {
          border: none;
          background: transparent;
          color: inherit;
          font-size: 0.95rem;
          line-height: 1;
          padding: 0 0 0 2px;
          cursor: pointer;
        }
        .milestone-b2c-page .dept-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .milestone-b2c-page .dept-multi-select {
          position: relative;
        }
        .milestone-b2c-page .dept-multi-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
          background: #fff;
          cursor: pointer;
        }
        .milestone-b2c-page .dept-multi-trigger.open {
          border-color: #28a745;
        }
        .milestone-b2c-page .dept-multi-trigger-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 8px;
        }
        .milestone-b2c-page .dept-multi-dropdown {
          position: absolute;
          z-index: 20;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: #fff;
          border: 1px solid #ced4da;
          border-radius: 6px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
          max-height: 260px;
          display: flex;
          flex-direction: column;
        }
        .milestone-b2c-page .dept-multi-search {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .milestone-b2c-page .dept-multi-options {
          overflow-y: auto;
          padding: 4px 0;
        }
        .milestone-b2c-page .dept-multi-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin: 0;
          cursor: pointer;
          font-size: 0.85rem;
          text-transform: none;
        }
        .milestone-b2c-page .dept-multi-option:hover {
          background: #f8f9fa;
        }
        .milestone-b2c-page .dept-multi-empty {
          padding: 12px;
          color: #888;
          font-size: 0.8rem;
        }
        .milestone-b2c-page .milestone-scope-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          max-height: 220px;
          overflow-y: auto;
          padding: 8px 12px;
        }
        .milestone-b2c-page .milestone-scope-box label {
          text-transform: none;
        }
        @media (max-width: 768px) {
          .milestone-b2c-page .content-header {
            display: none;
          }
        }
        @media (max-width: 991px) {
          .milestone-b2c-page .b2b-main-row {
            flex-direction: column;
          }
          .milestone-b2c-page .b2b-form-col,
          .milestone-b2c-page .b2b-table-col {
            width: 100% !important;
            max-width: 100% !important;
            flex: 0 0 100% !important;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

function MultiSelect({
  options,
  selectedValues,
  onChange,
  disabled,
  loading,
  placeholder,
  searchPlaceholder,
  emptyText,
  loadingText,
  pluralLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(options) ? options : [];
    if (!q) return list;
    return list.filter((option) => String(option.label || '').toLowerCase().includes(q));
  }, [options, query]);

  const toggleValue = (value) => {
    if (disabled) return;
    const next = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];
    onChange(next);
  };

  const removeValue = (value) => {
    if (disabled) return;
    onChange(selectedValues.filter((item) => item !== value));
  };

  const displayText = (() => {
    if (loading) return loadingText;
    if (!selectedValues.length) return placeholder;
    if (selectedValues.length === 1) {
      return options.find((option) => option.value === selectedValues[0])?.label || '1 selected';
    }
    if (selectedValues.length === 2) {
      return selectedValues
        .map((id) => options.find((option) => option.value === id)?.label || id)
        .join(', ');
    }
    return `${selectedValues.length} ${pluralLabel} selected`;
  })();

  return (
    <div className="dept-multi-select" ref={containerRef}>
      <button
        type="button"
        className={`form-control dept-multi-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        disabled={disabled}
      >
        <span className="dept-multi-trigger-text">{displayText}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>
      {isOpen && (
        <div className="dept-multi-dropdown">
          <div className="dept-multi-search">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          <div className="dept-multi-options">
            {filteredOptions.length === 0 ? (
              <div className="dept-multi-empty">{loading ? loadingText : emptyText}</div>
            ) : (
              filteredOptions.map((option) => {
                const checked = selectedValues.includes(option.value);
                return (
                  <label key={option.value} className="dept-multi-option">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={checked}
                      onChange={() => toggleValue(option.value)}
                    />
                    <span>{option.label}</span>
                    {checked && <i className="fas fa-check text-success ms-auto"></i>}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
      {selectedValues.length > 0 && (
        <div className="dept-chips">
          {selectedValues.map((id) => {
            const option = options.find((item) => item.value === id);
            return (
              <span key={id} className="dept-chip">
                {option?.label || id}
                <button
                  type="button"
                  className="dept-chip-remove"
                  onClick={() => removeValue(id)}
                  disabled={disabled}
                  aria-label="Remove project"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MilestoneForm = ({
  editMode,
  initialData,
  departments,
  backendUrl,
  token,
  onSave,
  onCancel,
  saving,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formDepartmentIds, setFormDepartmentIds] = useState([]);
  const [formProjectIds, setFormProjectIds] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loadingAllProjects, setLoadingAllProjects] = useState(false);

  useEffect(() => {
    setTitle(editMode ? (initialData?.title || '') : '');
    setDescription(editMode ? (initialData?.description || '') : '');
    setFormDepartmentIds(editMode ? (initialData?.assignedDepartments || []) : []);
    setFormProjectIds(editMode ? (initialData?.assignedProjects || []) : []);
  }, [editMode, initialData]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const loadProjects = async () => {
      setLoadingAllProjects(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list_all_projects`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        setAllProjects((response.data?.data || []).map((item) => ({
          _id: String(item._id),
          name: item.name || 'Untitled project',
          vertical: item.vertical ? String(item.vertical) : '',
        })));
      } catch (error) {
        console.error('Error fetching projects for milestone form:', error);
        if (!cancelled) setAllProjects([]);
      } finally {
        if (!cancelled) setLoadingAllProjects(false);
      }
    };
    loadProjects();
    return () => { cancelled = true; };
  }, [backendUrl, token]);

  const departmentOptions = useMemo(() => (
    departments.map((department) => ({
      value: department._id,
      label: department.name,
    }))
  ), [departments]);

  const projectOptions = useMemo(() => (
    allProjects
      .filter((project) => formDepartmentIds.includes(project.vertical))
      .map((project) => ({
        value: project._id,
        label: project.name,
      }))
  ), [allProjects, formDepartmentIds]);

  const handleDepartmentsChange = (next) => {
    setFormDepartmentIds(next);
    setFormProjectIds((current) => current.filter((id) => {
      const project = allProjects.find((item) => item._id === id);
      return project && next.includes(project.vertical);
    }));
  };

  const handleSubmit = async () => {
    if (!title.trim() || saving) return;
    const saved = await onSave({
      title: title.trim(),
      description: description.trim(),
      departments: formDepartmentIds,
      projects: formProjectIds,
    });
    if (saved && !editMode) {
      setTitle('');
      setDescription('');
      setFormDepartmentIds([]);
      setFormProjectIds([]);
    }
  };

  return (
    <div className="form-horizontal">
      <div className="row">
        <div className="col-xl-8 mb-1">
          <label>Select Departments</label>
          <MultiSelect
            options={departmentOptions}
            selectedValues={formDepartmentIds}
            onChange={handleDepartmentsChange}
            disabled={saving}
            loading={false}
            placeholder="Select Departments"
            searchPlaceholder="Search departments..."
            emptyText="No departments found"
            loadingText="Loading departments..."
            pluralLabel="departments"
          />
        </div>

        <div className="col-xl-8 mb-1">
          <label>Select Projects</label>
          <MultiSelect
            options={projectOptions}
            selectedValues={formProjectIds}
            onChange={setFormProjectIds}
            disabled={saving || loadingAllProjects || !formDepartmentIds.length}
            loading={loadingAllProjects}
            placeholder={formDepartmentIds.length ? 'Select Projects' : 'Select a department first'}
            searchPlaceholder="Search projects..."
            emptyText="No projects found"
            loadingText="Loading projects..."
            pluralLabel="projects"
          />
        </div>

        <div className="col-xl-8 mb-1">
          <label>
            Enter Milestone
            <span className="asterisk" style={{ color: 'red' }}>*</span>
          </label>
          <input
            className="form-control"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter Milestone"
            required
            disabled={saving}
          />
        </div>

        <div className="col-xl-8 mb-1">
          <label>Description</label>
          <textarea
            className="form-control"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Enter description (optional)"
            rows="3"
            disabled={saving}
          />
        </div>

        <div className="col-xl-4 mb-1 d-flex align-items-end gap-2">
          <button
            type="button"
            className="btn btn-success font-small-3"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {editMode ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              editMode ? 'Update' : 'Add'
            )}
          </button>
          {editMode && (
            <button
              type="button"
              className="btn btn-secondary font-small-3"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ isOpen, onClose, onConfirm, itemTitle }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    }}
    >
      <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400, maxWidth: '90%' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#e53e3e' }}>
          Delete Milestone
        </h3>
        <p style={{ marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
          Are you sure you want to delete the milestone <strong>"{itemTitle}"</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} style={{ padding: '8px 16px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneB2C;

