import React, { useState, useEffect } from 'react';
import axios from 'axios'

const CopyTargetModal = ({
  isOpen,
  selection,
  departments,
  loadingDepartments,
  backendUrl,
  token,
  onClose,
  onCopy,
}) => {
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [targetProjects, setTargetProjects] = useState([]);
  const [loadingTargetProjects, setLoadingTargetProjects] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTargetDepartmentId('');
    setTargetProjectId('');
    setTargetProjects([]);
  }, [isOpen, selection]);

  useEffect(() => {
    if (!isOpen || !token || !targetDepartmentId) {
      setTargetProjects([]);
      setLoadingTargetProjects(false);
      return undefined;
    }
    let cancelled = false;
    const loadProjects = async () => {
      setLoadingTargetProjects(true);
      try {
        const response = await axios.get(`${backendUrl}/college/list-projects`, {
          headers: { 'x-auth': token },
          params: { vertical: targetDepartmentId },
        });
        if (cancelled) return;
        setTargetProjects((response.data?.data || []).map((item) => ({
          _id: String(item._id),
          name: item.name || 'Untitled project',
        })));
      } catch (error) {
        console.error('Error fetching projects for copy:', error);
        if (!cancelled) setTargetProjects([]);
      } finally {
        if (!cancelled) setLoadingTargetProjects(false);
      }
    };
    loadProjects();
    return () => { cancelled = true; };
  }, [isOpen, targetDepartmentId, backendUrl, token]);

  if (!isOpen || !selection) return null;

  const statusList = selection.statuses || [];
  const fieldStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 14,
    boxSizing: 'border-box',
    background: 'white',
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
    }}>
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 8,
        width: 440,
        maxWidth: '100%',
        margin: 'auto 0',
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
          Shift all statuses
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>
          {`Shift all ${statusList.length} statuses, with their substatuses, to another department and project.`}
        </p>

        <div style={{
          marginBottom: 16,
          padding: '10px 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          maxHeight: 120,
          overflowY: 'auto',
        }}>
          {statusList.length > 0 ? (
            statusList.map((item, index) => (
              <div key={item._id || index} style={{ fontSize: 13, color: '#1a202c', marginBottom: 4 }}>
                {index + 1}. {item.title}
                <span style={{ color: '#718096' }}> ({(item.substatuses || []).length} substatuses)</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: '#a0aec0' }}>No statuses to shift</div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Department</label>
          <select
            value={targetDepartmentId}
            disabled={loadingDepartments}
            onChange={(e) => {
              setTargetDepartmentId(e.target.value);
              setTargetProjectId('');
            }}
            style={fieldStyle}
          >
            <option value="">{loadingDepartments ? 'Loading departments...' : 'Select department'}</option>
            {departments.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Project</label>
          <select
            value={targetProjectId}
            disabled={!targetDepartmentId || loadingTargetProjects}
            onChange={(e) => setTargetProjectId(e.target.value)}
            style={{ ...fieldStyle, background: !targetDepartmentId ? '#f8fafc' : 'white' }}
          >
            <option value="">
              {!targetDepartmentId ? 'Select department first' : loadingTargetProjects ? 'Loading projects...' : 'Select project'}
            </option>
            {targetProjects.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const departmentName = departments.find((item) => item._id === targetDepartmentId)?.name || 'Department';
              const projectName = targetProjects.find((item) => item._id === targetProjectId)?.name || 'Project';
              onCopy({
                targetDepartmentId,
                targetProjectId,
                departmentName,
                projectName,
              });
            }}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Shift all
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const StatusB2C = () => {
  // Initial statuses with substatuses
  const [statuses, setStatuses] = useState([

  ]);

  // Modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isSubstatusModalOpen, setIsSubstatusModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [editingSubstatus, setEditingSubstatus] = useState(null);
  const [editingStatusIndex, setEditingStatusIndex] = useState(null);
  const [editingSubstatusIndex, setEditingSubstatusIndex] = useState(null);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingSubstatus, setIsDeletingSubstatus] = useState(false);
  const [deletingStatusId, setDeletingStatusId] = useState(null);
  const [deletingSubstatusId, setDeletingSubstatusId] = useState(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);

  // Department and project are UI scope only. Nothing is saved.
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [statusRegistryByScope, setStatusRegistryByScope] = useState({});
  const [substatusRegistryByScope, setSubstatusRegistryByScope] = useState({});
  const [transferSelection, setTransferSelection] = useState(null);
  const [scopeNotice, setScopeNotice] = useState('');

  useEffect(() => {

    fetchStatus();

  }, []);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");

  const token = userData.token;

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
        const list = (response.data?.data || [])
          .filter((item) => item.status !== false)
          .map((item) => ({
            _id: String(item._id),
            name: item.name || 'Untitled department',
          }));
        setDepartments(list);
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
        const list = (response.data?.data || []).map((item) => ({
          _id: String(item._id),
          name: item.name || 'Untitled project',
        }));
        setProjects(list);
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

  const selectedDepartment = departments.find((item) => item._id === departmentId);
  const selectedProject = projects.find((item) => item._id === projectId);
  const scopeReady = Boolean(departmentId && projectId);

  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    setProjectId('');
  };

  const scopeKeyFor = (dept, proj) => `${dept}::${proj}`;
  const currentScopeKey = scopeKeyFor(departmentId, projectId);
  const localStatuses = statusRegistryByScope[currentScopeKey] || [];
  const localSubstatuses = substatusRegistryByScope[currentScopeKey] || {};

  const visibleStatuses = statuses.map((status) => ({
    ...status,
    substatuses: [
      ...(status.substatuses || []),
      ...(localSubstatuses[status._id] || []),
    ],
  }));

  const makeLocalId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const cloneSubstatus = (substatus) => ({
    title: substatus.title,
    description: substatus.description,
    hasRemarks: substatus.hasRemarks,
    hasFollowup: substatus.hasFollowup,
    hasAttachment: substatus.hasAttachment,
    _id: makeLocalId('local-sub'),
    isLocalCopy: true,
  });

  const cloneStatus = (status) => ({
    title: status.title,
    description: status.description,
    milestone: status.milestone,
    _id: makeLocalId('local-status'),
    id: makeLocalId('local'),
    isLocalCopy: true,
    substatuses: (status.substatuses || []).map(cloneSubstatus),
  });

  const openShiftAll = () => {
    if (!visibleStatuses.length) {
      alert('No statuses to shift');
      return;
    }
    setTransferSelection({ statuses: visibleStatuses });
  };

  const handleCopyToScope = ({ targetDepartmentId, targetProjectId, departmentName, projectName }) => {
    const sourceStatuses = transferSelection?.statuses || [];
    if (!sourceStatuses.length || !targetDepartmentId || !targetProjectId) {
      alert('Select department and project');
      return;
    }
    if (targetDepartmentId === departmentId && targetProjectId === projectId) {
      alert('Choose a different department or project');
      return;
    }
    const key = scopeKeyFor(targetDepartmentId, targetProjectId);
    setStatusRegistryByScope((prev) => ({
      ...prev,
      [key]: sourceStatuses.map(cloneStatus),
    }));
    setDepartmentId(targetDepartmentId);
    setProjectId(targetProjectId);
    setScopeNotice(`Shifted ${sourceStatuses.length} statuses to ${departmentName} / ${projectName}. This stays on this screen only.`);
    setTransferSelection(null);
  };

  const handleRemoveLocalStatus = (localId) => {
    setStatusRegistryByScope((prev) => ({
      ...prev,
      [currentScopeKey]: (prev[currentScopeKey] || []).filter((item) => item._id !== localId),
    }));
  };

  const handleRemoveLocalSubstatus = (statusId, substatusId) => {
    setSubstatusRegistryByScope((prev) => {
      const scope = { ...(prev[currentScopeKey] || {}) };
      scope[statusId] = (scope[statusId] || []).filter((item) => item._id !== substatusId);
      return { ...prev, [currentScopeKey]: scope };
    });
  };

  // Toggle Switch Component
  const ToggleSwitch = ({ id, label, checked, onChange }) => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '12px 0',
        userSelect: 'none'
      }}>
        <label
          htmlFor={id}
          style={{
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4a5568'
          }}
        >
          {label}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0
            }}
          />
          <div
            style={{
              width: '36px',
              height: '20px',
              backgroundColor: checked ? '#4299e1' : '#cbd5e0',
              borderRadius: '10px',
              padding: '2px',
              transition: 'background-color 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => onChange({ target: { checked: !checked } })}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transform: checked ? 'translateX(16px)' : 'translateX(0)',
                transition: 'transform 0.2s'
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Feature Badge Component
  const FeatureBadge = ({ label, color }) => {
    return (
      <span style={{
        backgroundColor: color,
        color: 'white',
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '10px',
        marginRight: '4px',
        fontWeight: '500'
      }}>
        {label}
      </span>
    );
  };

 // Even better approach that directly manipulates the array order
const handleMoveLeft = async (statusId, currentIndex) => {
  if (currentIndex <= 0) {
    return; // Already at leftmost position
  }
  
  try {
    // Create a copy of the statuses array
    const newStatuses = [...statuses];
    
    // Get the item to move and the item before it
    const statusToMove = newStatuses[currentIndex];
    const prevStatus = newStatuses[currentIndex - 1];
    
    // Swap their positions in the array
    newStatuses[currentIndex] = prevStatus;
    newStatuses[currentIndex - 1] = statusToMove;
    
    // Update the state immediately for responsive UI
    setStatuses(newStatuses);
    
    // Prepare the payload for the API
    const statusOrder = newStatuses.map((status, index) => ({
      _id: status._id,
      index: index
    }));
    
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    
    // Make the API call in the background
    axios.put(`${backendUrl}/college/status/reorder`, {
      statusOrder
    }, {
      headers: { 'x-auth': token }
    })
    .then(response => {
      if (!response.data.success) {
        console.error('API reported failure on reorder');
        fetchStatus(); // Sync with server if API fails
      }
    })
    .catch(error => {
      console.error('Error reordering status:', error);
      fetchStatus(); // Sync with server if there's an error
    });
    
  } catch (error) {
    console.error('Error moving status left:', error);
    fetchStatus(); // Sync with server if there's an error
  }
};

const handleMoveRight = async (statusId, currentIndex) => {
  if (currentIndex >= statuses.length - 1) {
    return; // Already at rightmost position
  }
  
  try {
    // Create a copy of the statuses array
    const newStatuses = [...statuses];
    
    // Get the item to move and the item after it
    const statusToMove = newStatuses[currentIndex];
    const nextStatus = newStatuses[currentIndex + 1];
    
    // Swap their positions in the array
    newStatuses[currentIndex] = nextStatus;
    newStatuses[currentIndex + 1] = statusToMove;
    
    // Update the state immediately for responsive UI
    setStatuses(newStatuses);
    
    // Prepare the payload for the API
    const statusOrder = newStatuses.map((status, index) => ({
      _id: status._id,
      index: index
    }));
    
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    
    // Make the API call in the background
    axios.put(`${backendUrl}/college/status/reorder`, {
      statusOrder
    }, {
      headers: { 'x-auth': token }
    })
    .then(response => {
      if (!response.data.success) {
        console.error('API reported failure on reorder');
        fetchStatus(); // Sync with server if API fails
      }
    })
    .catch(error => {
      console.error('Error reordering status:', error);
      fetchStatus(); // Sync with server if there's an error
    });
    
  } catch (error) {
    console.error('Error moving status right:', error);
    fetchStatus(); // Sync with server if there's an error
  }
};

  

  // Status Card Component with Edit, Delete and Substatus
  const StatusCard = ({
    index,
    title,
    _id,
    milestone,
    description,
    substatuses,
    isSelected,
    onDragStart,
    onDragOver,
    onDrop,
    onEdit,
    onDelete,
    onAddSubstatus,
    onEditSubstatus,
    onDeleteSubstatus, onMoveLeft,
    onMoveRight,
    isLocalCopy
  }) => {
    const [showSubstatuses, setShowSubstatuses] = useState(true);

    return (

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-top', minWidth: 220, margin: '0 4px' }}>
        <div style={{ marginTop:'15%' }}>
          {!isLocalCopy && (
            <button
              onClick={() => onMoveLeft(_id, index)}
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
                position: 'relative',
                top: '2px'
              }}
              title="Move Left"
            >
              ← Move Left
            </button>
          )}

        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              position: 'relative'
            }}
            draggable={!isLocalCopy}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #e2e8f0',
                fontWeight: 500,
                color: '#4a5568',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <span>Position: {index + 1}</span>
              <div>
                {!isLocalCopy && (
                <button
                  onClick={() => onEdit(index)}
                  disabled={index === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#4299e1',
                    marginRight: '8px',
                    padding: '0',
                    fontSize: '14px'
                  }}
                >
                  ✏️
                </button>
                )}
                <button
                  onClick={() => onDelete(_id)}
                  disabled={!isLocalCopy && index === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#f56565',
                    padding: '0',
                    fontSize: '14px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontWeight: 500, marginTop: 12, fontSize: '16px', color: '#333' }}>
              {title}
            </div>
            {isLocalCopy && (
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <FeatureBadge label="Shifted" color="#3182ce" />
              </div>
            )}
            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: 6 }}>
              {description}
            </div>
            {milestone &&(<div style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: 6 }}>
              {milestone}
            </div>)}
            <div
              style={{
                textAlign: 'center',
                marginTop: 'auto',
                padding: '8px',
                borderTop: '1px solid #f0f0f0',
                cursor: 'pointer'
              }}
              onClick={() => setShowSubstatuses(!showSubstatuses)}
            >
              <span style={{ color: '#4299e1', fontSize: '14px' }}>
                {showSubstatuses ? 'Hide Substatus ▲' : 'Show Substatus ▼'}
              </span>
            </div>
          </div>

          {showSubstatuses && (
            <div style={{
              width: '3px',
              height: '15px',
              backgroundColor: '#cbd5e0'
            }}></div>
          )}

          {showSubstatuses && (
            <div style={{
              width: '90%',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              backgroundColor: '#f9fafb',
              padding: '12px',
              marginTop: '5px'
            }}>
              <div style={{ marginBottom: '12px', fontWeight: 500, color: '#4a5568', fontSize: '14px' }}>
                Substatus
              </div>

              {substatuses && substatuses.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  {substatuses.map((substatus, subIndex) => (
                    <div
                      key={subIndex}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '10px',
                        borderBottom: '1px solid #edf2f7',
                        backgroundColor: 'white',
                        marginBottom: '6px',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{substatus.title}</div>
                          <div style={{ fontSize: '12px', color: '#718096' }}>{substatus.description}</div>
                          <div style={{ marginTop: '4px' }}>
                            {substatus.isLocalCopy && (
                              <FeatureBadge label="Shifted" color="#3182ce" />
                            )}
                            {substatus.hasRemarks && (
                              <FeatureBadge label="Remarks" color="#38b2ac" />
                            )}
                            {substatus.hasFollowup && (
                              <FeatureBadge label="Followup" color="#ed8936" />
                            )}
                            {substatus.hasAttachment && (
                              <FeatureBadge label="Attachment" color="#805ad5" />
                            )}
                          </div>
                        </div>
                        <div>
                          {!substatus.isLocalCopy && (
                          <button
                            onClick={() => onEditSubstatus(index, subIndex)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#4299e1',
                              marginRight: '8px',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            ✏️
                          </button>
                          )}
                          <button
                            onClick={() => onDeleteSubstatus(_id, substatus._id, substatus)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#f56565',
                              padding: '0',
                              fontSize: '12px'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: '13px', padding: '8px 0' }}>
                  No substatus available
                </div>
              )}

              {!isLocalCopy && (
              <button
                onClick={() => onAddSubstatus(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'white',
                  color: '#4299e1',
                  border: '1px dashed #4299e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ marginRight: '4px' }}>+</span> Add New Substatus
              </button>
              )}
            </div>
          )}
        </div>
        <div  style={{ marginTop:'15%' }}>
          {!isLocalCopy && (
          <button
            onClick={() => onMoveRight(_id, index)}
            disabled={index === statuses.length - 1}
            style={{
              background: 'none',
              border: 'none',
              cursor: index === statuses.length - 1 ? 'not-allowed' : 'pointer',
              color: index === statuses.length - 1 ? '#cbd5e0' : '#4299e1',
              marginRight: '4px',
              padding: '0',
              fontSize: '14px',
              opacity: index === statuses.length - 1 ? 0.5 : 1
            }}
            title="Move Right"
          >
            → Move Right
          </button>
          )}
          </div>
      </div>
    );
  };

  // Arrow Component
  const Arrow = () => {
    return (
      <div style={{
        width: 80,
        minWidth: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 1,
        margin: '0 -4px'
      }}>
        <div style={{
          height: '1px',
          background: '#ccc',
          width: '100%',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            right: 0,
            top: -4,
            width: 0,
            height: 0,
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderLeft: '8px solid #ccc'
          }} />
        </div>
      </div>
    );
  };

  // Status/Substatus Modal
  const StatusModal = ({ isOpen, onClose, onSave, editMode, initialData, isSubstatus, editingStatus }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [milestone, setMilestone] = useState('');
    const [hasRemarks, setHasRemarks] = useState(false);
    const [hasFollowup, setHasFollowup] = useState(false);
    const [hasAttachment, setHasAttachment] = useState(false);
    const [formDepartmentId, setFormDepartmentId] = useState('');
    const [formProjectId, setFormProjectId] = useState('');
    const [formProjects, setFormProjects] = useState([]);
    const [loadingFormProjects, setLoadingFormProjects] = useState(false);

    // Initialize form if in edit mode
    useEffect(() => {
      if (editMode && initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setMilestone(initialData.milestone || '');
        if (isSubstatus) {
          setHasRemarks(initialData.hasRemarks || false);
          setHasFollowup(initialData.hasFollowup || false);
          setHasAttachment(initialData.hasAttachment || false);
        }
      } else {
        setTitle('');
        setDescription('');
        setMilestone('');
        setHasRemarks(false);
        setHasFollowup(false);
        setHasAttachment(false);
      }
      if (isOpen && !isSubstatus) {
        setFormDepartmentId(departmentId || '');
        setFormProjectId(projectId || '');
      }
    }, [editMode, initialData, isOpen, isSubstatus, departmentId, projectId]);

    useEffect(() => {
      if (!isOpen || isSubstatus || !formDepartmentId) {
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
          console.error('Error fetching projects for status form:', error);
          if (!cancelled) setFormProjects([]);
        } finally {
          if (!cancelled) setLoadingFormProjects(false);
        }
      };
      loadFormProjects();
      return () => { cancelled = true; };
    }, [isOpen, isSubstatus, formDepartmentId, backendUrl, token]);

    const handleSave = async (statusId, substatusId) => {
      if (title.trim()) {
        if (isSubstatus) {
          if (editMode) {
            // Edit substatus
            const response = await axios.put(`${backendUrl}/college/status/${statusId}/substatus/${substatusId}`, {
              title, description, hasRemarks, hasFollowup, hasAttachment
            }, { headers: { 'x-auth': token } });

            if (response.data.success) {
              alert("Substatus updated successfully");
              fetchStatus();
            }
          } else {
            // Add substatus
            const response = await axios.post(`${backendUrl}/college/status/${statusId}/substatus`, {
              title, description, hasRemarks, hasFollowup, hasAttachment
            }, { headers: { 'x-auth': token } });

            if (response.data.success) {
              alert("Substatus added successfully");
              fetchStatus();
            }
          }
        }
        else {
          if (!formDepartmentId || !formProjectId) {
            alert('Select department and project');
            return;
          }
          setDepartmentId(formDepartmentId);
          setProjectId(formProjectId);
          // 🔁 Edit role (API call)
          if (editMode && statusId) {
            // Edit status
            const response = await axios.put(`${backendUrl}/college/status/edit/${statusId}`, {
              title, description, milestone
            }, { headers: { 'x-auth': token } });

            if (response.data.success) {
              alert("Status updated successfully");
              fetchStatus();
            }
          } else {
            // Add status
            const response = await axios.post(`${backendUrl}/college/status/add`, {
              title, description,milestone
            }, { headers: { 'x-auth': token } });

            if (response.data.success) {
              alert("Status added successfully");
              fetchStatus();
            }
          }

        }
        setTitle('');
        setDescription('');
        setHasRemarks(false);
        setHasFollowup(false);
        setHasAttachment(false);
        onClose();
      }
    };



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
        alignItems: 'flex-start',
        zIndex: 100,
        overflowY: 'auto',
        padding: '40px 16px'
      }}>
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 8,
          width: 400,
          maxWidth: '100%',
          margin: 'auto 0'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>
            {editMode
              ? (isSubstatus ? 'Edit Substatus' : 'Edit Status')
              : (isSubstatus ? 'Add New Substatus' : 'Add New Status')}
          </h3>

          {!isSubstatus && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Department:
                </label>
                <select
                  value={formDepartmentId}
                  onChange={(e) => {
                    setFormDepartmentId(e.target.value);
                    setFormProjectId('');
                  }}
                  disabled={loadingDepartments}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    background: 'white'
                  }}
                >
                  <option value="">{loadingDepartments ? 'Loading departments...' : 'Select department'}</option>
                  {departments.map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Project:
                </label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  disabled={!formDepartmentId || loadingFormProjects}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    background: !formDepartmentId ? '#f8fafc' : 'white'
                  }}
                >
                  <option value="">
                    {!formDepartmentId ? 'Select department first' : loadingFormProjects ? 'Loading projects...' : 'Select project'}
                  </option>
                  {formProjects.map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {isSubstatus ? 'Substatus Name:' : 'Status Name:'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: In Review"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
            />
          </div>

          <div style={{ marginBottom: isSubstatus ? 24 : 0 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {isSubstatus ? 'Substatus Description:' : 'Status Description:'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Needs manager approval"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
            />
          </div>

          {!isSubstatus && (

          <div style={{ marginBottom:  0 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Milestone:
            </label>
            <input
              type="text"
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="Example: 1st Milestone"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
            />
          </div>
          )}
          {isSubstatus && (
            <div style={{
              marginTop: 20,
              padding: '12px 0',
              borderTop: '1px solid #edf2f7',
              borderBottom: '1px solid #edf2f7',
              marginBottom: 20
            }}>
              <div style={{ fontWeight: 500, color: '#4a5568', marginBottom: 8, fontSize: 14 }}>
                Additional Options:
              </div>

              <ToggleSwitch
                id="remarks"
                label="Remarks Required"
                checked={hasRemarks}
                onChange={(e) => setHasRemarks(e.target.checked)}
              />

              <ToggleSwitch
                id="followup"
                label="Followup Required"
                checked={hasFollowup}
                onChange={(e) => setHasFollowup(e.target.checked)}
              />

              <ToggleSwitch
                id="attachment"
                label="Attachment Required"
                checked={hasAttachment}
                onChange={(e) => setHasAttachment(e.target.checked)}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                let statusId = null;
                let substatusId = null;

                if (editMode) {
                  if (isSubstatus) {
                    statusId = editingStatus?._id;
                    substatusId = initialData?._id; // Substatus ka _id
                  } else {
                    statusId = initialData?._id; // Status ka _id
                  }
                } else if (isSubstatus) {
                  statusId = editingStatus?._id;
                }

                handleSave(statusId, substatusId);
              }}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {editMode ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteModal = ({ isOpen, onClose, onConfirm, itemTitle, isSubstatus }) => {
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
        zIndex: 100
      }}>
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 8,
          width: 400,
          maxWidth: '90%'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#e53e3e' }}>
            {isSubstatus ? 'Delete Substatus' : 'Delete Status'}
          </h3>

          <p style={{ marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete the {isSubstatus ? 'substatus' : 'status'} <strong>"{itemTitle}"</strong>? This action cannot be undone.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                padding: '8px 16px',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const fetchStatus = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/status`, {
        headers: { 'x-auth': token }
      });

      console.log('response', response)

      if (response.data.success) {
        const status = response.data.data;
        setStatuses(status.map((r, index) => ({
          _id: r._id,
          id: r.index + 1,
          title: r.title,
          milestone: r.milestone,
          description: r.description,
          substatuses: r.substatuses
        })));

        ;
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch roles');
    }
  };


  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };



  // Handle drop
  // const handleDrop = (e, targetIndex) => {
  //   e.preventDefault();

  //   if (draggedItem === targetIndex) return;

  //   const newStatuses = [...statuses];
  //   const draggedStatus = newStatuses[draggedItem];

  //   // Remove the dragged item
  //   newStatuses.splice(draggedItem, 1);

  //   // Add it at the new position
  //   newStatuses.splice(targetIndex, 0, draggedStatus);

  //   setStatuses(newStatuses);
  //   setDraggedItem(null);
  // };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();

    if (draggedItem === targetIndex) return;

    const newStatuses = [...statuses];
    const draggedStatus = newStatuses[draggedItem];

    // Remove dragged item
    newStatuses.splice(draggedItem, 1);

    // Insert dragged item at new position
    newStatuses.splice(targetIndex, 0, draggedStatus);

    setStatuses(newStatuses);
    setDraggedItem(null);

    try {
      // Prepare payload: array of {id, index} for all statuses in new order
      const statusOrder = newStatuses.map((status, index) => ({
        _id: status._id,
        index: index
      }));

      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.put(`${backendUrl}/college/status/reorder`, {
        statusOrder
      }, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        // Optionally, fetch fresh data from backend
        fetchStatus();  // or setStatuses(response.data.data)
      } else {
        alert('Failed to reorder status');
      }
    } catch (error) {
      console.error('Error reordering status:', error);
      alert('Error while updating order on server');
    }
  };


  // Add new status


  // Add new substatus
  const handleAddSubstatus = (statusIndex) => {
    setEditingStatusIndex(statusIndex);
    setIsEditMode(false);
    setIsSubstatusModalOpen(true);
  };

  // Save new substatus


  // Edit status
  const handleEditStatus = (index) => {
    setEditingStatus(statuses[index]);
    setEditingStatusIndex(index);
    setIsEditMode(true);
    setIsStatusModalOpen(true);
  };

  // Edit substatus
  const handleEditSubstatus = (statusIndex, substatusIndex) => {
    setEditingStatusIndex(statusIndex);
    setEditingSubstatusIndex(substatusIndex);
    setEditingSubstatus(statuses[statusIndex].substatuses[substatusIndex]);
    setIsEditMode(true);
    setIsSubstatusModalOpen(true);
  };

  // Save edited status
  const handleSaveEditStatus = (title, description) => {
    const newStatuses = [...statuses];
    newStatuses[editingStatusIndex] = {
      ...newStatuses[editingStatusIndex],
      title,
      description
    };
    setStatuses(newStatuses);
  };

  // Save edited substatus
  const handleSaveEditSubstatus = (title, description, hasRemarks, hasFollowup, hasAttachment) => {
    const newStatuses = [...statuses];
    newStatuses[editingStatusIndex].substatuses[editingSubstatusIndex] = {
      ...newStatuses[editingStatusIndex].substatuses[editingSubstatusIndex],
      title,
      description,
      hasRemarks,
      hasFollowup,
      hasAttachment
    };
    setStatuses(newStatuses);
  };

  // Delete status
  const handleDeleteStatus = (_id) => {
    setDeletingStatusId(_id);
    setIsDeletingSubstatus(false);
    setIsDeleteModalOpen(true);
  };

  // Delete substatus
  const handleDeleteSubstatus = (statusId, substatusId, substatus) => {
    if (substatus?.isLocalCopy) {
      handleRemoveLocalSubstatus(statusId, substatusId);
      return;
    }
    setDeletingStatusId(statusId);
    setDeletingSubstatusId(substatusId);
    setIsDeletingSubstatus(true);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (isDeletingSubstatus) {

      try {
        const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        const token = userData.token;

        const response = await axios.delete(`${backendUrl}/college/status/deleteSubStatus/${deletingStatusId}/substatus/${deletingSubstatusId}`, {
          headers: { 'x-auth': token }
        });

        if (response.data.success) {
          alert('Sub status deleted successfully');
          // Statuses ko update karo local state me ya phir dobara fetch karo
          fetchStatus();
        } else {
          alert('Failed to delete sub status');
        }
      } catch (error) {
        console.error('Error deleting sub status:', error);
        alert('Error occurred while deleting sub status');
      }
    } else {
      try {
        const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        const token = userData.token;

        const response = await axios.delete(`${backendUrl}/college/status/delete/${deletingStatusId}`, {
          headers: { 'x-auth': token }
        });

        if (response.data.success) {
          alert('Status deleted successfully');
          // Statuses ko update karo local state me ya phir dobara fetch karo
          fetchStatus();
        } else {
          alert('Failed to delete status');
        }
      } catch (error) {
        console.error('Error deleting status:', error);
        alert('Error occurred while deleting status');
      }
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '100%',
      margin: '0 auto',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#333',
          margin: 0
        }}>
          Lead Status Flow
        </h1>

        <button
          onClick={() => {
            setIsEditMode(false);
            setIsStatusModalOpen(true);
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
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '18px', marginRight: '4px' }}>+</span>
          Add New Status
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
          fontSize: '13px'
        }}>
          {scopeNotice}
        </div>
      )}

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginTop: '16px',
        overflowX: 'auto',
        whiteSpace: scopeReady ? 'nowrap' : 'normal'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderBottom: '1px solid #eef2f6',
          background: '#fafbfc',
          borderRadius: '8px 8px 0 0',
          whiteSpace: 'normal'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Department</span>
            <select
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              disabled={loadingDepartments}
              style={{
                height: '32px',
                width: '160px',
                padding: '0 8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e293b',
                background: 'white'
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
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!departmentId || loadingProjects}
              style={{
                height: '32px',
                width: '160px',
                padding: '0 8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e293b',
                background: !departmentId ? '#f8fafc' : 'white'
              }}
            >
              <option value="">
                {!departmentId ? 'Select department' : loadingProjects ? 'Loading...' : 'Select'}
              </option>
              {projects.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={openShiftAll}
            disabled={!scopeReady || visibleStatuses.length === 0}
            style={{
              marginLeft: 'auto',
              height: '32px',
              padding: '0 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              background: 'white',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: !scopeReady || visibleStatuses.length === 0 ? 'not-allowed' : 'pointer',
              opacity: !scopeReady || visibleStatuses.length === 0 ? 0.55 : 1
            }}
          >
            Shift all
          </button>
        </div>
        <div style={{ padding: scopeReady ? '8px 0 24px' : '24px 16px' }}>
        {!scopeReady ? (
          <div style={{
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#718096',
            gap: '8px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#4a5568' }}>
              Select a department and project
            </div>
            <div style={{ fontSize: '14px', maxWidth: '420px' }}>
              The lead status flow opens for the department and project you choose. This selection stays on this screen only.
            </div>
          </div>
        ) : (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '20px 16px',
          minWidth: 'max-content'
        }}>
          {visibleStatuses.map((status, index) => (
            <React.Fragment key={status.id || status._id}>
              <StatusCard
                index={index}
                title={status.title}
                _id={status._id}
                description={status.description}
                milestone={status.milestone}
                substatuses={status.substatuses}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.index)}
                onEdit={handleEditStatus}
                onDelete={handleDeleteStatus}
                onAddSubstatus={handleAddSubstatus}
                onEditSubstatus={handleEditSubstatus}
                onDeleteSubstatus={handleDeleteSubstatus}
                onMoveLeft={handleMoveLeft}
                onMoveRight={handleMoveRight}
              />
              {index < visibleStatuses.length - 1 && <Arrow />}
            </React.Fragment>
          ))}
        </div>
        )}
        {scopeReady && localStatuses.length > 0 && (
          <div style={{ marginTop: '28px', padding: '8px 16px 0', whiteSpace: 'normal' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '12px' }}>
              Shifted into {selectedDepartment?.name} / {selectedProject?.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 'max-content', whiteSpace: 'nowrap' }}>
              {localStatuses.map((status, index) => (
                <StatusCard
                  key={status._id}
                  index={index}
                  title={status.title}
                  _id={status._id}
                  description={status.description}
                  milestone={status.milestone}
                  substatuses={status.substatuses}
                  isLocalCopy
                  onDelete={handleRemoveLocalStatus}
                  onDeleteSubstatus={handleDeleteSubstatus}
                  onEdit={() => {}}
                  onAddSubstatus={() => {}}
                  onEditSubstatus={() => {}}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                  onMoveLeft={() => {}}
                  onMoveRight={() => {}}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      <div style={{
        background: '#f9fafb',
        marginTop: '20px',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 500, color: '#4a5568' }}>Instructions:</h3>
        <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#4a5568', fontSize: '14px' }}>
          <li style={{ marginBottom: '8px' }}>Choose a department, then a project, to open that status flow</li>
          <li style={{ marginBottom: '8px' }}>Use Shift all to move every status and its substatuses together to another department and project</li>
          <li style={{ marginBottom: '8px' }}>Drag and drop status cards to change their order</li>
          <li style={{ marginBottom: '8px' }}>Click on "Show Substatus ▼" to view substatus options</li>
          <li style={{ marginBottom: '8px' }}>Use the "Add New Substatus" button to add substatus to a status</li>
          <li style={{ marginBottom: '8px' }}>When adding a substatus, choose additional options with toggle switches</li>
          <li style={{ marginBottom: '8px' }}>Use ✏️ and 🗑️ buttons to edit or delete statuses and substatuses</li>
        </ul>
      </div>

      {/* Status Add/Edit Modal */}
      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        editMode={isEditMode}
        initialData={editingStatus}
        isSubstatus={false}
        editingStatus={statuses[editingStatusIndex]}
      />

      {/* Substatus Add/Edit Modal */}
      <StatusModal
        isOpen={isSubstatusModalOpen}
        onClose={() => setIsSubstatusModalOpen(false)}
        editMode={isEditMode}
        initialData={editingSubstatus}
        isSubstatus={true}
        editingStatus={statuses[editingStatusIndex]}
      />

      <CopyTargetModal
        isOpen={Boolean(transferSelection)}
        selection={transferSelection}
        departments={departments}
        loadingDepartments={loadingDepartments}
        backendUrl={backendUrl}
        token={token}
        onClose={() => setTransferSelection(null)}
        onCopy={handleCopyToScope}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemTitle={isDeletingSubstatus
          ? (deletingStatusId !== null && deletingSubstatusId !== null && statuses[deletingStatusId]?.substatuses[deletingSubstatusId]?.title || '')
          : (deletingStatusId !== null && statuses[deletingStatusId]?.title || '')}
        isSubstatus={isDeletingSubstatus}
      />
    </div>
  );
};

export default StatusB2C;