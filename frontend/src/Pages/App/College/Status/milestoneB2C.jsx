import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const scopeKeyFor = (department, project) => `${department}::${project}`;

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
  const loadedDepartmentsRef = useRef({});

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDepartmentIds([]);
    setProjectsByDepartment({});
    setSelectedProjectIdsByDepartment({});
    setLoadingProjectsByDepartment({});
    loadedDepartmentsRef.current = {};
    setSelectedMilestoneIds((selection?.milestones || []).map((item) => item._id));
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
      return;
    }
    setSelectedDepartmentIds((prev) => [...prev, deptId]);
  };

  const toggleProject = (deptId, projId) => {
    setSelectedProjectIdsByDepartment((prev) => {
      const current = prev[deptId] || [];
      return {
        ...prev,
        [deptId]: current.includes(projId) ? current.filter((id) => id !== projId) : [...current, projId],
      };
    });
  };

  const toggleMilestone = (milestoneId) => {
    setSelectedMilestoneIds((prev) => (
      prev.includes(milestoneId) ? prev.filter((id) => id !== milestoneId) : [...prev, milestoneId]
    ));
  };

  const handleConfirm = () => {
    const targets = [];
    selectedDepartmentIds.forEach((deptId) => {
      const departmentName = departments.find((item) => item._id === deptId)?.name || 'Department';
      (selectedProjectIdsByDepartment[deptId] || []).forEach((projId) => {
        targets.push({
          departmentId: deptId,
          projectId: projId,
          departmentName,
          projectName: (projectsByDepartment[deptId] || []).find((item) => item._id === projId)?.name || 'Project',
        });
      });
    });
    if (!targets.length) {
      alert('Select at least one project');
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
      <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 440, maxWidth: '100%', margin: 'auto 0' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
          {isSingle ? 'Switch milestone' : 'Shift all milestones'}
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>
          {isSingle
            ? `Add "${milestoneList[0]?.title || 'this milestone'}" to one or more departments and projects.`
            : 'Select the milestones and add them to one or more departments and projects.'}
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
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Departments and projects</label>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, maxHeight: 220, overflowY: 'auto', padding: '8px 12px' }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={departmentChecked}
                      onChange={() => toggleDepartment(department._id)}
                    />
                    <span>{department.name}</span>
                  </label>
                  {departmentChecked && (
                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                      {loadingProjectsByDepartment[department._id] ? (
                        <div style={{ fontSize: 12, color: '#718096' }}>Loading projects...</div>
                      ) : departmentProjects.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#a0aec0' }}>No projects</div>
                      ) : departmentProjects.map((project) => (
                        <label
                          key={project._id}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 4, cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project._id)}
                            onChange={() => toggleProject(department._id, project._id)}
                          />
                          <span>{project.name}</span>
                        </label>
                      ))}
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
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [appliedDepartmentId, setAppliedDepartmentId] = useState('');
  const [appliedProjectId, setAppliedProjectId] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [milestoneRegistryByScope, setMilestoneRegistryByScope] = useState({});
  const [scopeMeta, setScopeMeta] = useState({});
  const [transferSelection, setTransferSelection] = useState(null);
  const [scopeNotice, setScopeNotice] = useState('');

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;

  const fetchMilestones = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/milestone`, {
        headers: { 'x-auth': token },
      });
      if (response.data.success) {
        setMilestones((response.data.data || []).map((item) => ({
          _id: item._id,
          id: item.index + 1,
          title: item.title,
          description: item.description,
        })));
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      alert('Failed to fetch milestones');
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
  };

  const applyFilter = () => {
    if (!departmentId) {
      alert('Select a department to search');
      return;
    }
    setAppliedDepartmentId(departmentId);
    setAppliedProjectId(projectId);
  };

  const clearFilter = () => {
    setDepartmentId('');
    setProjectId('');
    setAppliedDepartmentId('');
    setAppliedProjectId('');
  };

  const scopeSections = Object.keys(milestoneRegistryByScope)
    .filter((key) => (milestoneRegistryByScope[key] || []).length > 0)
    .filter((key) => {
      if (!filterActive) return true;
      const meta = scopeMeta[key] || {};
      if (meta.departmentId !== appliedDepartmentId) return false;
      return !appliedProjectId || meta.projectId === appliedProjectId;
    })
    .map((key) => ({ key, meta: scopeMeta[key] || {}, milestones: milestoneRegistryByScope[key] }));

  const appliedDepartmentName = departments.find((item) => item._id === appliedDepartmentId)?.name || '';
  const appliedProjectName = appliedProjectId
    ? (projects.find((item) => item._id === appliedProjectId)?.name
      || Object.values(scopeMeta).find((meta) => meta.projectId === appliedProjectId)?.projectName
      || '')
    : '';

  const openSwitchMilestone = (milestone) => {
    if (!milestone) return;
    setTransferSelection({ milestones: [milestone], single: true });
  };

  const handleShiftToScope = ({ targets, milestones: chosen, single }) => {
    if (!targets?.length || !chosen?.length) return;
    setMilestoneRegistryByScope((prev) => {
      const next = { ...prev };
      targets.forEach((target) => {
        const key = scopeKeyFor(target.departmentId, target.projectId);
        const incoming = chosen.map((item) => ({
          title: item.title,
          description: item.description,
          sourceId: item.sourceId || item._id,
          _id: `local-milestone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          isLocalCopy: true,
        }));
        const incomingSources = new Set(incoming.map((item) => item.sourceId));
        const kept = (next[key] || []).filter((item) => !incomingSources.has(item.sourceId));
        next[key] = [...kept, ...incoming];
      });
      return next;
    });
    setScopeMeta((prev) => {
      const next = { ...prev };
      targets.forEach((target) => {
        next[scopeKeyFor(target.departmentId, target.projectId)] = target;
      });
      return next;
    });
    const targetLabel = targets.length === 1
      ? `${targets[0].departmentName} / ${targets[0].projectName}`
      : `${targets.length} department/project combinations`;
    setScopeNotice(
      single
        ? `Added "${chosen[0].title}" to ${targetLabel}. This stays on this screen only.`
        : `Added ${chosen.length} milestones to ${targetLabel}. This stays on this screen only.`
    );
    setTransferSelection(null);
  };

  const handleRemoveLocalMilestone = (localId) => {
    setMilestoneRegistryByScope((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        next[key] = (prev[key] || []).filter((item) => item._id !== localId);
      });
      return next;
    });
  };

  const persistOrder = async (nextMilestones) => {
    const milestoneOrder = nextMilestones.map((item, index) => ({
      _id: item._id,
      index,
    }));
    try {
      const response = await axios.put(`${backendUrl}/college/milestone/reorder`, { milestoneOrder }, {
        headers: { 'x-auth': token },
      });
      if (!response.data.success) fetchMilestones();
    } catch (error) {
      console.error('Error reordering milestone:', error);
      fetchMilestones();
    }
  };

  const handleMoveLeft = (currentIndex) => {
    if (currentIndex <= 0) return;
    const next = [...milestones];
    const moved = next[currentIndex];
    next[currentIndex] = next[currentIndex - 1];
    next[currentIndex - 1] = moved;
    setMilestones(next);
    persistOrder(next);
  };

  const handleMoveRight = (currentIndex) => {
    if (currentIndex >= milestones.length - 1) return;
    const next = [...milestones];
    const moved = next[currentIndex];
    next[currentIndex] = next[currentIndex + 1];
    next[currentIndex + 1] = moved;
    setMilestones(next);
    persistOrder(next);
  };

  const handleDrop = async (event, targetIndex) => {
    event.preventDefault();
    if (draggedItem === null || draggedItem === targetIndex) return;
    const next = [...milestones];
    const [moved] = next.splice(draggedItem, 1);
    next.splice(targetIndex, 0, moved);
    setMilestones(next);
    setDraggedItem(null);
    persistOrder(next);
  };

  const handleEditMilestone = (index) => {
    setEditingMilestone(milestones[index]);
    setIsEditMode(true);
    setIsMilestoneModalOpen(true);
  };

  const handleDeleteMilestone = (milestoneId) => {
    setDeletingMilestoneId(milestoneId);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async ({ title, description }) => {
    const headers = { 'x-auth': token };
    try {
      if (isEditMode && editingMilestone?._id) {
        const response = await axios.put(
          `${backendUrl}/college/milestone/edit/${editingMilestone._id}`,
          { title, description },
          { headers }
        );
        if (response.data.success) alert('Milestone updated successfully');
      } else {
        const response = await axios.post(`${backendUrl}/college/milestone/add`, { title, description }, { headers });
        if (response.data.success) alert('Milestone added successfully');
      }
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
      setIsEditMode(false);
      fetchMilestones();
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert(error.response?.data?.message || 'Failed to save');
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
          alert('Milestone deleted successfully');
          fetchMilestones();
        }
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Error occurred while deleting');
    }
    setIsDeleteModalOpen(false);
    setDeletingMilestoneId(null);
  };

  const deletingMilestone = milestones.find((item) => item._id === deletingMilestoneId);

  return (
    <div
      className="milestone-b2c-page"
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        maxWidth: '100%',
        margin: '0 auto',
        padding: '24px',
      }}
    >
      <style>{`
        .milestone-b2c-page,
        .milestone-b2c-page button,
        .milestone-b2c-page input {
          font-family: Inter, sans-serif;
        }
        .milestone-b2c-page button,
        .milestone-b2c-page input {
          font-size: 14px;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333', margin: 0 }}>
          Lead Milestone Flow
        </h1>
        <button
          type="button"
          onClick={() => {
            setIsEditMode(false);
            setEditingMilestone(null);
            setIsMilestoneModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px', marginRight: '4px' }}>+</span>
          Add New Milestone
        </button>
      </div>

      {scopeNotice && (
        <div style={{
          marginBottom: '12px',
          padding: '8px 12px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          color: '#166534',
          fontSize: '13px',
        }}
        >
          {scopeNotice}
        </div>
      )}

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginTop: '16px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderBottom: '1px solid #eef2f6',
          background: '#fafbfc',
          borderRadius: '8px 8px 0 0',
          whiteSpace: 'normal',
        }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Department</span>
            <select
              value={departmentId}
              onChange={(event) => handleDepartmentChange(event.target.value)}
              disabled={loadingDepartments}
              style={{
                height: '32px',
                width: '160px',
                padding: '0 8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e293b',
                background: 'white',
              }}
            >
              <option value="">{loadingDepartments ? 'Loading...' : 'Select'}</option>
              {departments.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Project</span>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              disabled={!departmentId || loadingProjects}
              style={{
                height: '32px',
                width: '160px',
                padding: '0 8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e293b',
                background: !departmentId ? '#f8fafc' : 'white',
              }}
            >
              <option value="">
                {!departmentId ? 'Select department' : loadingProjects ? 'Loading...' : 'All projects'}
              </option>
              {projects.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={applyFilter}
            disabled={!departmentId}
            style={{
              height: '32px',
              padding: '0 14px',
              border: 'none',
              borderRadius: '6px',
              background: '#3b82f6',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: !departmentId ? 'not-allowed' : 'pointer',
              opacity: !departmentId ? 0.55 : 1,
            }}
          >
            Search
          </button>
          {(filterActive || departmentId) && (
            <button
              type="button"
              onClick={clearFilter}
              style={{
                height: '32px',
                padding: '0 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: 'white',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div style={{ padding: '8px 0 24px' }}>
          {filterActive && (
            <div style={{ padding: '8px 16px 0', fontSize: '13px', color: '#475569', whiteSpace: 'normal' }}>
              Showing milestones for <strong>{appliedDepartmentName || 'Department'}</strong>
              {' / '}
              <strong>{appliedProjectId ? (appliedProjectName || 'Project') : 'All projects'}</strong>
            </div>
          )}
          {!filterActive && (
            <div style={{ display: 'flex', alignItems: 'flex-start', padding: '20px 16px', minWidth: 'max-content' }}>
              {milestones.map((milestone, index) => (
                <React.Fragment key={milestone._id}>
                  <MilestoneCard
                    index={index}
                    total={milestones.length}
                    title={milestone.title}
                    _id={milestone._id}
                    description={milestone.description}
                    onDragStart={() => setDraggedItem(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, index)}
                    onEdit={handleEditMilestone}
                    onDelete={handleDeleteMilestone}
                    onMoveLeft={handleMoveLeft}
                    onMoveRight={handleMoveRight}
                    onSwitch={() => openSwitchMilestone(milestone)}
                  />
                  {index < milestones.length - 1 && <Arrow />}
                </React.Fragment>
              ))}
              {milestones.length === 0 && (
                <div style={{ color: '#718096', padding: '12px 8px', whiteSpace: 'normal' }}>
                  No milestones yet. Add one to show it in the Performance tab.
                </div>
              )}
            </div>
          )}
          {filterActive && scopeSections.length === 0 && (
            <div style={{
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: '#718096',
              gap: '8px',
              whiteSpace: 'normal',
              padding: '0 16px',
            }}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#4a5568' }}>
                No milestones added here yet
              </div>
              <div style={{ fontSize: '14px', maxWidth: '420px' }}>
                Clear the search to see all milestones, then use Switch to add them to this department and project.
              </div>
            </div>
          )}
          {scopeSections.map((section) => (
            <div key={section.key} style={{ marginTop: '8px', padding: '8px 16px 0', whiteSpace: 'normal' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '12px' }}>
                {section.meta.departmentName || 'Department'} / {section.meta.projectName || 'Project'}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 'max-content', whiteSpace: 'nowrap' }}>
                {section.milestones.map((milestone, index) => (
                  <React.Fragment key={milestone._id}>
                    <MilestoneCard
                      index={index}
                      total={section.milestones.length}
                      title={milestone.title}
                      _id={milestone._id}
                      description={milestone.description}
                      isLocalCopy
                      onDelete={handleRemoveLocalMilestone}
                      onEdit={() => {}}
                      onDragStart={() => {}}
                      onDragOver={() => {}}
                      onDrop={() => {}}
                      onMoveLeft={() => {}}
                      onMoveRight={() => {}}
                      onSwitch={() => openSwitchMilestone(milestone)}
                    />
                    {index < section.milestones.length - 1 && <Arrow />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: '#f9fafb',
        marginTop: '20px',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 500, color: '#4a5568' }}>Instructions:</h3>
        <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#4a5568', fontSize: '14px' }}>
          <li style={{ marginBottom: '8px' }}>All milestones show by default. Pick a department (and optionally a project) and click Search to see only the milestones added there</li>
          <li style={{ marginBottom: '8px' }}>Use Switch on a milestone to add it to one or more departments and projects</li>
          <li style={{ marginBottom: '8px' }}>Drag and drop milestone cards to change their order</li>
          <li style={{ marginBottom: '8px' }}>Use ✏️ and 🗑️ buttons to edit or delete milestones</li>
        </ul>
      </div>

      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onSave={handleSave}
        editMode={isEditMode}
        initialData={editingMilestone}
        departments={departments}
        loadingDepartments={loadingDepartments}
        backendUrl={backendUrl}
        token={token}
        departmentId={departmentId}
        projectId={projectId}
        onScopeChange={(nextDepartmentId, nextProjectId) => {
          setDepartmentId(nextDepartmentId);
          setProjectId(nextProjectId);
        }}
      />
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
    </div>
  );
};

const MilestoneCard = ({
  index,
  total,
  title,
  _id,
  description,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onSwitch,
  isLocalCopy,
}) => (
  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', minWidth: 220, margin: '0 4px' }}>
    <div style={{ marginTop: '15%' }}>
      {!isLocalCopy && (
      <button
        type="button"
        onClick={() => onMoveLeft(index)}
        disabled={index === 0}
        style={{
          background: 'none',
          border: 'none',
          cursor: index === 0 ? 'not-allowed' : 'pointer',
          color: index === 0 ? '#cbd5e0' : '#4299e1',
          marginRight: '4px',
          padding: '0',
          fontSize: '14px',
          opacity: index === 0 ? 0.5 : 1,
        }}
      >
        ← Move Left
      </button>
      )}
    </div>
    <div
      style={{
        width: 220,
        minHeight: 140,
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
      }}
      draggable={!isLocalCopy}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e2e8f0',
        fontWeight: 500,
        color: '#4a5568',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Position: {index + 1}</span>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onSwitch();
            }}
            style={{
              padding: '2px 8px',
              border: '1px solid #93c5fd',
              borderRadius: '4px',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Add this milestone to one or more departments and projects"
          >
            Switch
          </button>
        </div>
        <div>
          {!isLocalCopy && (
          <button
            type="button"
            onClick={() => onEdit(index)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4299e1', marginRight: '8px', padding: 0, fontSize: '14px' }}
          >
            ✏️
          </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(_id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f56565', padding: 0, fontSize: '14px' }}
          >
            🗑️
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontWeight: 500, marginTop: 12, fontSize: '16px', color: '#333', whiteSpace: 'normal' }}>
        {title}
      </div>
      {isLocalCopy && (
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <span style={{ background: '#3182ce', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 500 }}>
            Shifted
          </span>
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: 6, whiteSpace: 'normal', padding: '0 8px 16px' }}>
        {description}
      </div>
    </div>
    <div style={{ marginTop: '15%' }}>
      {!isLocalCopy && (
      <button
        type="button"
        onClick={() => onMoveRight(index)}
        disabled={index === total - 1}
        style={{
          background: 'none',
          border: 'none',
          cursor: index === total - 1 ? 'not-allowed' : 'pointer',
          color: index === total - 1 ? '#cbd5e0' : '#4299e1',
          padding: 0,
          fontSize: '14px',
          opacity: index === total - 1 ? 0.5 : 1,
        }}
      >
        → Move Right
      </button>
      )}
    </div>
  </div>
);

const Arrow = () => (
  <div style={{
    width: 80,
    minWidth: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 1,
    margin: '70px -4px 0',
  }}
  >
    <div style={{ height: '1px', background: '#ccc', width: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        right: 0,
        top: -4,
        width: 0,
        height: 0,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        borderLeft: '8px solid #ccc',
      }}
      />
    </div>
  </div>
);

const MilestoneModal = ({
  isOpen,
  onClose,
  onSave,
  editMode,
  initialData,
  departments,
  loadingDepartments,
  backendUrl,
  token,
  departmentId,
  projectId,
  onScopeChange,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formProjects, setFormProjects] = useState([]);
  const [loadingFormProjects, setLoadingFormProjects] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(editMode ? (initialData?.title || '') : '');
    setDescription(editMode ? (initialData?.description || '') : '');
    setFormDepartmentId(departmentId || '');
    setFormProjectId(projectId || '');
  }, [editMode, initialData, isOpen, departmentId, projectId]);

  useEffect(() => {
    if (!isOpen || !token || !formDepartmentId) {
      if (!formDepartmentId) setFormProjects([]);
      return undefined;
    }
    let cancelled = false;
    const loadFormProjects = async () => {
      setLoadingFormProjects(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list-projects`, {
          headers: { 'x-auth': token },
          params: { vertical: formDepartmentId },
        });
        if (cancelled) return;
        setFormProjects((response.data?.data || []).map((item) => ({
          _id: String(item._id),
          name: item.name || 'Untitled project',
        })));
      } catch (error) {
        console.error('Error fetching projects for milestone form:', error);
        if (!cancelled) setFormProjects([]);
      } finally {
        if (!cancelled) setLoadingFormProjects(false);
      }
    };
    loadFormProjects();
    return () => { cancelled = true; };
  }, [isOpen, formDepartmentId, backendUrl, token]);

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
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>
          {editMode ? 'Edit Milestone' : 'Add New Milestone'}
        </h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Department:</label>
          <select
            value={formDepartmentId}
            disabled={loadingDepartments}
            onChange={(event) => {
              setFormDepartmentId(event.target.value);
              setFormProjectId('');
            }}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', background: 'white' }}
          >
            <option value="">{loadingDepartments ? 'Loading departments...' : 'Select department'}</option>
            {departments.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Project:</label>
          <select
            value={formProjectId}
            disabled={!formDepartmentId || loadingFormProjects}
            onChange={(event) => setFormProjectId(event.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', background: !formDepartmentId ? '#f8fafc' : 'white' }}
          >
            <option value="">
              {!formDepartmentId ? 'Select department first' : loadingFormProjects ? 'Loading projects...' : 'Select project'}
            </option>
            {formProjects.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Milestone Name:</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Admission"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Milestone Description:</label>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Example: Leads ready for admission"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!title.trim()) return;
              if (!formDepartmentId || !formProjectId) {
                alert('Select department and project');
                return;
              }
              onScopeChange(formDepartmentId, formProjectId);
              onSave({ title: title.trim(), description: description.trim() });
            }}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            {editMode ? 'Update' : 'Add'}
          </button>
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
