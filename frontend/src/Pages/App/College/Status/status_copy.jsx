import React, { useState, useEffect } from 'react';
import axios from 'axios'



// Main Component
const Status = () => {
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

  useEffect(() => {

    fetchStatus();

  }, []);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");

  const token = userData.token;

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
    axios.put(`${backendUrl}/college/statusB2b/reorder`, {
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
    axios.put(`${backendUrl}/college/statusB2b/reorder`, {
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
    onMoveRight
  }) => {
    const [showSubstatuses, setShowSubstatuses] = useState(true);

    return (

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-top', minWidth: 220, margin: '0 4px' }}>
        <div style={{ marginTop:'15%' }}>
          
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
            draggable
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
                <button
                  onClick={() => onDelete(_id)}
                  disabled={index === 0}
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
                          <button
                            onClick={() => onDeleteSubstatus(_id, substatus._id)}
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
            </div>
          )}
        </div>
        <div  style={{ marginTop:'15%' }}>

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
          </button></div>
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
    }, [editMode, initialData, isOpen, isSubstatus]);

    const handleSave = async (statusId, substatusId) => {
      if (title.trim()) {
        if (isSubstatus) {
          if (editMode) {
            // Edit substatus
            const response = await axios.put(`${backendUrl}/college/statusB2b/${statusId}/substatus/${substatusId}`, {
              title, description, hasRemarks, hasFollowup, hasAttachment
            }, { headers: { 'x-auth': token } });

            if (response.data.success) {
              alert("Substatus updated successfully");
              fetchStatus();
            }
          } else {
            // Add substatus
            const response = await axios.post(`${backendUrl}/college/statusB2b/${statusId}/substatus`, {
              title, description, hasRemarks, hasFollowup, hasAttachment
            }, { headers: { 'x-auth': token } });

            if (response.data.success) {
              alert("Substatus added successfully");
              fetchStatus();
            }
          }
        }
        else {
          // 🔁 Edit role (API call)
          if (editMode && statusId) {
            // Edit status
            const response = await axios.put(`${backendUrl}/college/statusB2b/edit/${statusId}`, {
              title, description, milestone
            }, { headers: { 'x-auth': token } });

            if (response.data.success) {
              alert("Status updated successfully");
              fetchStatus();
            }
          } else {
            // Add status
            const response = await axios.post(`${backendUrl}/college/statusB2b/add`, {
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
          <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>
            {editMode
              ? (isSubstatus ? 'Edit Substatus' : 'Edit Status')
              : (isSubstatus ? 'Add New Substatus' : 'Add New Status')}
          </h3>

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

      const response = await axios.get(`${backendUrl}/college/statusB2b`, {
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

      const response = await axios.put(`${backendUrl}/college/statusB2b/reorder`, {
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
  const handleDeleteSubstatus = (statusId, substatusId) => {
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

        const response = await axios.delete(`${backendUrl}/college/statusB2b/deleteSubStatus/${deletingStatusId}/substatus/${deletingSubstatusId}`, {
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

        const response = await axios.delete(`${backendUrl}/college/statusB2b/delete/${deletingStatusId}`, {
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

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '32px 16px',
        marginTop: '24px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '20px 16px',
          minWidth: 'max-content'
        }}>
          {statuses.map((status, index) => (
            <React.Fragment key={status.id}>
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
              {index < statuses.length - 1 && <Arrow />}
            </React.Fragment>
          ))}
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

export default Status;