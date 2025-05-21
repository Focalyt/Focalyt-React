import React, { useState, useEffect } from 'react';

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

// Status Card Component with Edit, Delete and Substatus
const StatusCard = ({ 
  index, 
  title, 
  subtitle, 
  substatuses, 
  isSelected, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onEdit, 
  onDelete, 
  onAddSubstatus,
  onEditSubstatus,
  onDeleteSubstatus
}) => {
  const [showSubstatuses, setShowSubstatuses] = useState(false);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 220, margin: '0 4px' }}>
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
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid #e2e8f0', 
          fontWeight: 500, 
          color: '#4a5568',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Index: {index}</span>
          <div>
            <button 
              onClick={() => onEdit(index)}
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
              onClick={() => onDelete(index)}
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
          {subtitle}
        </div>
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
                      <div style={{ fontSize: '12px', color: '#718096' }}>{substatus.subtitle}</div>
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
                        onClick={() => onDeleteSubstatus(index, subIndex)}
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
const StatusModal = ({ isOpen, onClose, onSave, editMode, initialData, isSubstatus }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [hasRemarks, setHasRemarks] = useState(false);
  const [hasFollowup, setHasFollowup] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);
  
  // Initialize form if in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      setTitle(initialData.title || '');
      setSubtitle(initialData.subtitle || '');
      if (isSubstatus) {
        setHasRemarks(initialData.hasRemarks || false);
        setHasFollowup(initialData.hasFollowup || false);
        setHasAttachment(initialData.hasAttachment || false);
      }
    } else {
      setTitle('');
      setSubtitle('');
      setHasRemarks(false);
      setHasFollowup(false);
      setHasAttachment(false);
    }
  }, [editMode, initialData, isOpen, isSubstatus]);
  
  const handleSave = () => {
    if (title.trim()) {
      if (isSubstatus) {
        onSave(title, subtitle, hasRemarks, hasFollowup, hasAttachment);
      } else {
        onSave(title, subtitle);
      }
      setTitle('');
      setSubtitle('');
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
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
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
            onClick={handleSave}
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

// Main Component
const Status = () => {
  // Initial statuses with substatuses
  const [statuses, setStatuses] = useState([
    { 
      id: '1', 
      title: 'Completed', 
      subtitle: 'Task is complete',
      substatuses: [
        { 
          id: '1-1', 
          title: 'Verification', 
          subtitle: 'Needs verification',
          hasRemarks: true,
          hasFollowup: false,
          hasAttachment: true
        },
        { 
          id: '1-2', 
          title: 'Closed', 
          subtitle: 'Case closed',
          hasRemarks: true,
          hasFollowup: false,
          hasAttachment: false
        }
      ] 
    },
    { 
      id: '2', 
      title: 'Status-4', 
      subtitle: '',
      substatuses: [] 
    },
    { 
      id: '3', 
      title: 'In Progress', 
      subtitle: 'Currently working',
      substatuses: [
        { 
          id: '3-1', 
          title: 'Working', 
          subtitle: 'Active development',
          hasRemarks: true,
          hasFollowup: true,
          hasAttachment: true
        }
      ] 
    },
    { 
      id: '4', 
      title: 'New', 
      subtitle: 'New status',
      substatuses: [] 
    },
    { 
      id: '5', 
      title: 'Step', 
      subtitle: 'Step description',
      substatuses: [] 
    }
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
  const [deletingStatusIndex, setDeletingStatusIndex] = useState(null);
  const [deletingSubstatusIndex, setDeletingSubstatusIndex] = useState(null);
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  
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
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedItem === targetIndex) return;
    
    const newStatuses = [...statuses];
    const draggedStatus = newStatuses[draggedItem];
    
    // Remove the dragged item
    newStatuses.splice(draggedItem, 1);
    
    // Add it at the new position
    newStatuses.splice(targetIndex, 0, draggedStatus);
    
    setStatuses(newStatuses);
    setDraggedItem(null);
  };
  
  // Add new status
  const handleAddStatus = (title, subtitle) => {
    const newId = `${Date.now()}`;
    setStatuses([...statuses, { 
      id: newId, 
      title, 
      subtitle,
      substatuses: []
    }]);
  };
  
  // Add new substatus
  const handleAddSubstatus = (statusIndex) => {
    setEditingStatusIndex(statusIndex);
    setIsEditMode(false);
    setIsSubstatusModalOpen(true);
  };
  
  // Save new substatus
  const handleSaveSubstatus = (title, subtitle, hasRemarks, hasFollowup, hasAttachment) => {
    const newStatuses = [...statuses];
    const newSubstatus = {
      id: `${newStatuses[editingStatusIndex].id}-${Date.now()}`,
      title,
      subtitle,
      hasRemarks,
      hasFollowup,
      hasAttachment
    };
    
    newStatuses[editingStatusIndex].substatuses.push(newSubstatus);
    setStatuses(newStatuses);
  };
  
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
  const handleSaveEditStatus = (title, subtitle) => {
    const newStatuses = [...statuses];
    newStatuses[editingStatusIndex] = {
      ...newStatuses[editingStatusIndex],
      title,
      subtitle
    };
    setStatuses(newStatuses);
  };
  
  // Save edited substatus
  const handleSaveEditSubstatus = (title, subtitle, hasRemarks, hasFollowup, hasAttachment) => {
    const newStatuses = [...statuses];
    newStatuses[editingStatusIndex].substatuses[editingSubstatusIndex] = {
      ...newStatuses[editingStatusIndex].substatuses[editingSubstatusIndex],
      title,
      subtitle,
      hasRemarks,
      hasFollowup,
      hasAttachment
    };
    setStatuses(newStatuses);
  };
  
  // Delete status
  const handleDeleteStatus = (index) => {
    setDeletingStatusIndex(index);
    setIsDeletingSubstatus(false);
    setIsDeleteModalOpen(true);
  };
  
  // Delete substatus
  const handleDeleteSubstatus = (statusIndex, substatusIndex) => {
    setDeletingStatusIndex(statusIndex);
    setDeletingSubstatusIndex(substatusIndex);
    setIsDeletingSubstatus(true);
    setIsDeleteModalOpen(true);
  };
  
  // Confirm delete
  const handleConfirmDelete = () => {
    if (isDeletingSubstatus) {
      // Delete substatus
      const newStatuses = [...statuses];
      newStatuses[deletingStatusIndex].substatuses.splice(deletingSubstatusIndex, 1);
      setStatuses(newStatuses);
    } else {
      // Delete status
      const newStatuses = [...statuses];
      newStatuses.splice(deletingStatusIndex, 1);
      setStatuses(newStatuses);
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
          CRM Status Flow
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
                subtitle={status.subtitle}
                substatuses={status.substatuses}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onEdit={handleEditStatus}
                onDelete={handleDeleteStatus}
                onAddSubstatus={handleAddSubstatus}
                onEditSubstatus={handleEditSubstatus}
                onDeleteSubstatus={handleDeleteSubstatus}
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
        onSave={isEditMode ? handleSaveEditStatus : handleAddStatus}
        editMode={isEditMode}
        initialData={editingStatus}
        isSubstatus={false}
      />
      
      {/* Substatus Add/Edit Modal */}
      <StatusModal
        isOpen={isSubstatusModalOpen}
        onClose={() => setIsSubstatusModalOpen(false)}
        onSave={isEditMode ? handleSaveEditSubstatus : handleSaveSubstatus}
        editMode={isEditMode}
        initialData={editingSubstatus}
        isSubstatus={true}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemTitle={isDeletingSubstatus 
          ? (deletingStatusIndex !== null && deletingSubstatusIndex !== null && statuses[deletingStatusIndex]?.substatuses[deletingSubstatusIndex]?.title || '') 
          : (deletingStatusIndex !== null && statuses[deletingStatusIndex]?.title || '')}
        isSubstatus={isDeletingSubstatus}
      />
    </div>
  );
};

export default Status;