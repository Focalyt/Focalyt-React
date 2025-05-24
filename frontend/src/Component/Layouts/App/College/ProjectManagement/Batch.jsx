import React, { useState } from 'react';
import Student from '../../../../Layouts/App/College/ProjectManagement/Student';

const Batch = ({selectedCourse = null, onBackToCourses = null, selectedCenter = null, onBackToCenters = null}) => {
  const [activeBatchTab, setActiveBatchTab] = useState('Active Batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [newUser, setNewUser] = useState('');
  const [newRole, setNewRole] = useState('Student');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

  // States for Student navigation
  const [showStudents, setShowStudents] = useState(false);
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState(null);

  // Function to handle batch click for students
  const handleBatchClick = (batch) => {
    setSelectedBatchForStudents(batch);
    setShowStudents(true);
  };

  // Function to go back to batches view
  const handleBackToBatches = () => {
    setShowStudents(false);
    setSelectedBatchForStudents(null);
  };

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    course: selectedCourse?.code || '',
    center: selectedCenter?.code || '',
    instructor: '',
    maxStudents: '',
    startDate: '',
    endDate: '',
    mode: 'offline',
    status: 'active'
  });

  // Sample courses and centers for dropdown
  const availableCourses = [
    { id: 1, code: 'CS101', name: 'Introduction to Computer Science' },
    { id: 2, code: 'MATH201', name: 'Advanced Mathematics' },
    { id: 3, code: 'PHY301', name: 'Quantum Physics' }
  ];

  const availableCenters = [
    { id: 1, code: 'CTR001', name: 'Mumbai Technology Center' },
    { id: 2, code: 'CTR002', name: 'Delhi Regional Office' },
    { id: 3, code: 'CTR003', name: 'Bangalore R&D Center' }
  ];

  const [batches, setBatches] = useState([
    {
      id: 1,
      code: 'BATCH001',
      name: 'CS101 Morning Batch',
      course: 'CS101',
      courseName: 'Introduction to Computer Science',
      center: 'CTR001',
      centerName: 'Mumbai Technology Center',
      instructor: 'Dr. John Smith',
      maxStudents: 30,
      enrolledStudents: 28,
      completedStudents: 22,
      startDate: '2024-02-01',
      endDate: '2024-05-15',
      mode: 'offline',
      status: 'active',
      currentWeek: 8,
      totalWeeks: 16,
      createdAt: '2024-01-15',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 2,
      code: 'BATCH002',
      name: 'MATH201 Evening Batch',
      course: 'MATH201',
      courseName: 'Advanced Mathematics',
      center: 'CTR002',
      centerName: 'Delhi Regional Office',
      instructor: 'Prof. Sarah Johnson',
      maxStudents: 25,
      enrolledStudents: 25,
      completedStudents: 18,
      startDate: '2024-01-15',
      endDate: '2024-04-30',
      mode: 'hybrid',
      status: 'active',
      currentWeek: 12,
      totalWeeks: 16,
      createdAt: '2024-01-01',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 3,
      code: 'BATCH003',
      name: 'PHY301 Online Batch',
      course: 'PHY301',
      courseName: 'Quantum Physics',
      center: 'Online',
      centerName: 'Virtual Center',
      instructor: 'Dr. Michael Brown',
      maxStudents: 20,
      enrolledStudents: 0,
      completedStudents: 0,
      startDate: '2024-06-01',
      endDate: '2024-09-15',
      mode: 'online',
      status: 'inactive',
      currentWeek: 0,
      totalWeeks: 14,
      createdAt: '2024-03-01',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    }
  ]);

  const filteredBatches = batches.filter(batch => {
    // Filter by selected course if provided
    if (selectedCourse && batch.course !== selectedCourse.code) return false;
    
    if (activeBatchTab === 'Active Batches' && batch.status !== 'active') return false;
    if (activeBatchTab === 'Inactive Batches' && batch.status !== 'inactive') return false;
    return batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           batch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           batch.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
           batch.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
           batch.centerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      course: selectedCourse?.code || '',
      center: selectedCenter?.code || '',
      instructor: '',
      maxStudents: '',
      startDate: '',
      endDate: '',
      mode: 'offline',
      status: 'active'
    });
  };

  const handleAdd = () => {
    setEditingBatch(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      code: batch.code,
      name: batch.name,
      course: batch.course,
      center: batch.center,
      instructor: batch.instructor,
      maxStudents: batch.maxStudents.toString(),
      startDate: batch.startDate,
      endDate: batch.endDate,
      mode: batch.mode,
      status: batch.status
    });
    setShowEditForm(true);
  };

  const handleDelete = (batch) => {
    setBatchToDelete(batch);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setBatches(prev => prev.filter(b => b.id !== batchToDelete.id));
    setShowDeleteModal(false);
    setBatchToDelete(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() ||  !formData.instructor.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedCourseData = availableCourses.find(c => c.code === formData.course);
    const selectedCenterData = availableCenters.find(c => c.code === formData.center);

    if (editingBatch) {
      // Edit existing batch
      setBatches(prev => prev.map(b => 
        b.id === editingBatch.id 
          ? { 
              ...b, 
              ...formData, 
              courseName: selectedCourseData?.name || '',
              centerName: selectedCenterData?.name || 'Virtual Center',
              maxStudents: parseInt(formData.maxStudents) || 0
            }
          : b
      ));
      setShowEditForm(false);
    } else {
      // Add new batch
      const newBatch = {
        id: Date.now(),
        ...formData,
        courseName: selectedCourseData?.name || '',
        centerName: selectedCenterData?.name || 'Virtual Center',
        maxStudents: parseInt(formData.maxStudents) || 0,
        enrolledStudents: 0,
        completedStudents: 0,
        currentWeek: 0,
        totalWeeks: 16,
        createdAt: new Date().toISOString().split('T')[0],
        access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
      };
      setBatches(prev => [...prev, newBatch]);
      setShowAddForm(false);
    }
    
    resetForm();
    setEditingBatch(null);
  };

  const handleShare = (batch) => {
    setSelectedBatch(batch);
    setShowShareModal(true);
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
    setEditingBatch(null);
  };

  const getModeColor = (mode) => {
    switch(mode) {
      case 'online': return 'bg-info';
      case 'offline': return 'bg-success';
      case 'hybrid': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const getEnrollmentPercentage = (enrolled, max) => {
    if (max === 0) return 0;
    return Math.round((enrolled / max) * 100);
  };

  const getProgressPercentage = (current, total) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const getCompletionPercentage = (completed, enrolled) => {
    if (enrolled === 0) return 0;
    return Math.round((completed / enrolled) * 100);
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !batchToDelete) return null;

    return (
      <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Confirm Delete</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the batch <strong>{batchToDelete.name} ({batchToDelete.code})</strong>?</p>
              <p className="text-muted">This action cannot be undone and will remove all associated data including student enrollments and progress.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If showing students, render the Student component
  if (showStudents && selectedBatchForStudents) {
    return (
      <Student 
        selectedBatch={selectedBatchForStudents}
        onBackToBatches={handleBackToBatches}
        selectedCourse={selectedCourse}
        onBackToCourses={onBackToCourses}
        selectedCenter={selectedCenter}
        onBackToCenters={onBackToCenters}
      />
    );
  }

  return (
    <div className="container py-4">
      {/* Breadcrumb Navigation */}
      {/* <div className="mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            {onBackToCenters && selectedCenter && (
              <li className="breadcrumb-item">
                <button 
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={onBackToCenters}
                >
                  Centers
                </button>
              </li>
            )}
            {onBackToCourses && selectedCourse && (
              <li className="breadcrumb-item">
                <button 
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={onBackToCourses}
                >
                  {selectedCenter ? `${selectedCenter.name} Courses` : 'Courses'}
                </button>
              </li>
            )}
            <li className="breadcrumb-item active" aria-current="page">
              {selectedCourse ? `${selectedCourse.name} Batches` : 'Batches'}
            </li>
          </ol>
        </nav>
      </div> */}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Batches {selectedCourse && `- ${selectedCourse.name}`}</h4>
        <div>
          {onBackToCourses && (
            <button className="btn btn-outline-secondary me-2" onClick={onBackToCourses}>
              <i className="bi bi-arrow-left"></i> Back
            </button>
          )}
          <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>
          <button className="btn btn-warning" onClick={handleAdd}>Add Batch</button>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <ul className="nav nav-pills">
          {['Active Batches', 'Inactive Batches', 'All Batches'].map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link ${activeBatchTab === tab ? 'active' : ''}`}
                onClick={() => setActiveBatchTab(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className="form-control w-25"
          placeholder="Search batches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="row">
        {filteredBatches.map(batch => {
          const enrollmentPercentage = getEnrollmentPercentage(batch.enrolledStudents, batch.maxStudents);
          const progressPercentage = getProgressPercentage(batch.currentWeek, batch.totalWeeks);
          const completionPercentage = getCompletionPercentage(batch.completedStudents, batch.enrolledStudents);
          return (
            <div key={batch.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
              <div className="card h-100 border rounded shadow-sm position-relative">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div 
                      className="flex-grow-1 cursor-pointer"
                      onClick={() => handleBatchClick(batch)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-people-fill text-warning fs-3 me-2"></i>
                        <div>
                          <h5 className="card-title mb-1">{batch.code}</h5>
                          <p className="text-muted mb-1">{batch.name}</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <p className="text-muted small mb-1">
                          <i className="bi bi-book me-1"></i>
                          <strong>Course:</strong> {batch.course} - {batch.courseName}
                        </p>
                        <p className="text-muted small mb-1">
                          <i className="bi bi-building me-1"></i>
                          <strong>Center:</strong> {batch.centerName}
                        </p>
                        <p className="text-muted small mb-1">
                          <i className="bi bi-person-fill me-1"></i>
                          <strong>Instructor:</strong> {batch.instructor}
                        </p>
                       
                      </div>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className={` ${batch.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {batch.status}
                        </span>
                        <span className={`${getModeColor(batch.mode)}`}>
                          {batch.mode}
                        </span>
                      </div>
                    </div>
                    <div className="text-end d-flex">
                      <button className="btn btn-sm btn-light me-1" title="Share" onClick={(e) => {e.stopPropagation(); handleShare(batch);}}>
                        <i className="bi bi-share-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-light me-1" title="Edit" onClick={(e) => {e.stopPropagation(); handleEdit(batch);}}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={(e) => {e.stopPropagation(); handleDelete(batch);}}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* Enrollment Progress */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Enrollment</span>
                      <span>{batch.enrolledStudents}/{batch.maxStudents} ({enrollmentPercentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar bg-warning" 
                        role="progressbar" 
                        style={{ width: `${enrollmentPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Course Progress */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Course Progress</span>
                      <span>Week {batch.currentWeek}/{batch.totalWeeks} ({progressPercentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar bg-primary" 
                        role="progressbar" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Completion Progress */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Completion Rate</span>
                      <span>{batch.completedStudents}/{batch.enrolledStudents} ({completionPercentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Batch Stats */}
                  <div className="row small text-muted">
                    <div className="col-3 text-center">
                      <div className="fw-bold text-warning">{batch.enrolledStudents}</div>
                      <div>Enrolled</div>
                    </div>
                    <div className="col-3 text-center">
                      <div className="fw-bold text-primary">{batch.currentWeek}</div>
                      <div>Week</div>
                    </div>
                    <div className="col-3 text-center">
                      <div className="fw-bold text-success">{batch.completedStudents}</div>
                      <div>Completed</div>
                    </div>
                    <div className="col-3 text-center">
                      <div className="fw-bold text-info">{batch.maxStudents}</div>
                      <div>Capacity</div>
                    </div>
                  </div>

                  <div className="small text-muted mt-3">
                    <div className="row">
                      <div className="col-6">
                        <i className="bi bi-calendar-event me-1"></i>Start: <strong>{batch.startDate}</strong>
                      </div>
                      <div className="col-6">
                        <i className="bi bi-calendar-check me-1"></i>End: <strong>{batch.endDate}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-people fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No batches found</h5>
          <p className="text-muted">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddForm || showEditForm) && (
        <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">{editingBatch ? 'Edit Batch' : 'Add New Batch'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                  <label className="form-label">Batch Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter batch name"
                  />
                  </div>
                 
                </div>
               
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Center</label>
                    <select
                      className="form-select"
                      value={formData.center}
                      onChange={(e) => setFormData(prev => ({ ...prev, center: e.target.value }))}
                    >
                      <option value="">Select Center (Online if empty)</option>
                      {selectedCenter ? (
                        <option value={selectedCenter.code} selected>{selectedCenter.code} - {selectedCenter.name}</option>
                      ) : (
                        availableCenters.map(center => (
                          <option key={center.id} value={center.code}>
                            {center.code} - {center.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Mode</label>
                    <select
                      className="form-select"
                      value={formData.mode}
                      onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                    >
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Instructor *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.instructor}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                      placeholder="Enter instructor name"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Max Students</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: e.target.value }))}
                      placeholder="Enter max students"
                      min="1"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-warning" onClick={handleSubmit}>
                  {editingBatch ? 'Update Batch' : 'Add Batch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal />

      {/* Share Modal */}
      {showShareModal && selectedBatch && (
        <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">Manage Access - {selectedBatch.code}</h5>
                <button type="button" className="btn-close" onClick={() => setShowShareModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-8">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Add user email"
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="Student">Student</option>
                      <option value="Teaching Assistant">Teaching Assistant</option>
                      <option value="Batch Coordinator">Batch Coordinator</option>
                      <option value="Instructor">Instructor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <textarea className="form-control" placeholder="Add message (optional)" rows={2}></textarea>
                </div>
                <div className="form-check mb-4">
                  <input type="checkbox" className="form-check-input" id="notifyCheck" defaultChecked />
                  <label className="form-check-label">Notify people</label>
                </div>
                <button type="button" className="btn btn-warning">Send</button>

                <hr />

                <h6 className="mb-3">Current Access</h6>
                <ul className="list-group">
                  {selectedBatch.access.map((a, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{a.name}</strong>
                      </div>
                      <select className="form-select w-auto">
                        <option value="Student" selected={a.role === 'Student'}>Student</option>
                        <option value="Teaching Assistant" selected={a.role === 'Teaching Assistant'}>Teaching Assistant</option>
                        <option value="Batch Coordinator" selected={a.role === 'Batch Coordinator'}>Batch Coordinator</option>
                        <option value="Instructor" selected={a.role === 'Instructor'}>Instructor</option>
                        <option value="Admin" selected={a.role === 'Admin'}>Admin</option>
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>
        {`
        .overflowY{
        overflow-y : scroll!important;
        }
        `}
      </style>
    </div>
  );
};

export default Batch;

// import React, { useState } from 'react';
// import Student from '../../../../Layouts/App/College/ProjectManagement/Student';
// const Batch = ({selectedCenter = null, onBackToCenters = null}) => {
//   const [activeBatchTab, setActiveBatchTab] = useState('Active Batches');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [showEditForm, setShowEditForm] = useState(false);
//   const [editingBatch, setEditingBatch] = useState(null);
//   const [viewMode, setViewMode] = useState('grid');
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [newUser, setNewUser] = useState('');
//   const [newRole, setNewRole] = useState('Student');
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [batchToDelete, setBatchToDelete] = useState(null);

//  const [showBatches, setShowBatches] = useState(false);
//   const [selectedBatchesForStudent, setSelectedBatchesForStudent,] = useState(null);

//     // Function to handle course click for batches
//   const handleCourseClick = (course) => {
//     setSelectedBatchesForStudent(course);
//     setShowBatches(true);
//   };

//   // Function to go back to courses view
//   const handleBackToCourses = () => {
//     setShowBatches(false);
//     setSelectedBatchesForStudent(null);
//   };

//   // Form states
//   const [formData, setFormData] = useState({
//     code: '',
//     name: '',
//     course: '',
//     center: '',
//     instructor: '',
//     maxStudents: '',
//     startDate: '',
//     endDate: '',
//     mode: 'offline',
//     status: 'active'
//   });

//   // Sample courses and centers for dropdown
//   const availableCourses = [
//     { id: 1, code: 'CS101', name: 'Introduction to Computer Science' },
//     { id: 2, code: 'MATH201', name: 'Advanced Mathematics' },
//     { id: 3, code: 'PHY301', name: 'Quantum Physics' }
//   ];

//   const availableCenters = [
//     { id: 1, code: 'CTR001', name: 'Mumbai Technology Center' },
//     { id: 2, code: 'CTR002', name: 'Delhi Regional Office' },
//     { id: 3, code: 'CTR003', name: 'Bangalore R&D Center' }
//   ];

//   const [batches, setBatches] = useState([
//     {
//       id: 1,
//       code: 'BATCH001',
//       name: 'CS101 Morning Batch',
//       course: 'CS101',
//       courseName: 'Introduction to Computer Science',
//       center: 'CTR001',
//       centerName: 'Mumbai Technology Center',
//       instructor: 'Dr. John Smith',
//       maxStudents: 30,
//       enrolledStudents: 28,
//       completedStudents: 22,
//       startDate: '2024-02-01',
//       endDate: '2024-05-15',
//       mode: 'offline',
//       status: 'active',
//       currentWeek: 8,
//       totalWeeks: 16,
//       createdAt: '2024-01-15',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     },
//     {
//       id: 2,
//       code: 'BATCH002',
//       name: 'MATH201 Evening Batch',
//       course: 'MATH201',
//       courseName: 'Advanced Mathematics',
//       center: 'CTR002',
//       centerName: 'Delhi Regional Office',
//       instructor: 'Prof. Sarah Johnson',
//       maxStudents: 25,
//       enrolledStudents: 25,
//       completedStudents: 18,
//       startDate: '2024-01-15',
//       endDate: '2024-04-30',
//       mode: 'hybrid',
//       status: 'active',
//       currentWeek: 12,
//       totalWeeks: 16,
//       createdAt: '2024-01-01',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     },
//     {
//       id: 3,
//       code: 'BATCH003',
//       name: 'PHY301 Online Batch',
//       course: 'PHY301',
//       courseName: 'Quantum Physics',
//       center: 'Online',
//       centerName: 'Virtual Center',
//       instructor: 'Dr. Michael Brown',
//       maxStudents: 20,
//       enrolledStudents: 0,
//       completedStudents: 0,
//       startDate: '2024-06-01',
//       endDate: '2024-09-15',
//       mode: 'online',
//       status: 'inactive',
//       currentWeek: 0,
//       totalWeeks: 14,
//       createdAt: '2024-03-01',
//       access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//     }
//   ]);

//   const filteredBatches = batches.filter(batch => {
//     if (activeBatchTab === 'Active Batches' && batch.status !== 'active') return false;
//     if (activeBatchTab === 'Inactive Batches' && batch.status !== 'inactive') return false;
//     return batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            batch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            batch.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            batch.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            batch.centerName.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const resetForm = () => {
//     setFormData({
//       code: '',
//       name: '',
//       course: '',
//       center: '',
//       instructor: '',
//       maxStudents: '',
//       startDate: '',
//       endDate: '',
//       mode: 'offline',
//       status: 'active'
//     });
//   };

//   const handleAdd = () => {
//     setEditingBatch(null);
//     resetForm();
//     setShowAddForm(true);
//   };

//   const handleEdit = (batch) => {
//     setEditingBatch(batch);
//     setFormData({
//       code: batch.code,
//       name: batch.name,
//       course: batch.course,
//       center: batch.center,
//       instructor: batch.instructor,
//       maxStudents: batch.maxStudents.toString(),
//       startDate: batch.startDate,
//       endDate: batch.endDate,
//       mode: batch.mode,
//       status: batch.status
//     });
//     setShowEditForm(true);
//   };

//   const handleDelete = (batch) => {
//     setBatchToDelete(batch);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = () => {
//     setBatches(prev => prev.filter(b => b.id !== batchToDelete.id));
//     setShowDeleteModal(false);
//     setBatchToDelete(null);
//   };

//   const handleSubmit = () => {
//     if (!formData.name.trim() || !formData.course.trim() || !formData.instructor.trim()) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     const selectedCourse = availableCourses.find(c => c.code === formData.course);
//     const selectedCenter = availableCenters.find(c => c.code === formData.center);

//     if (editingBatch) {
//       // Edit existing batch
//       setBatches(prev => prev.map(b => 
//         b.id === editingBatch.id 
//           ? { 
//               ...b, 
//               ...formData, 
//               courseName: selectedCourse?.name || '',
//               centerName: selectedCenter?.name || 'Virtual Center',
//               maxStudents: parseInt(formData.maxStudents) || 0
//             }
//           : b
//       ));
//       setShowEditForm(false);
//     } else {
//       // Add new batch
//       const newBatch = {
//         id: Date.now(),
//         ...formData,
//         courseName: selectedCourse?.name || '',
//         centerName: selectedCenter?.name || 'Virtual Center',
//         maxStudents: parseInt(formData.maxStudents) || 0,
//         enrolledStudents: 0,
//         completedStudents: 0,
//         currentWeek: 0,
//         totalWeeks: 16,
//         createdAt: new Date().toISOString().split('T')[0],
//         access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
//       };
//       setBatches(prev => [...prev, newBatch]);
//       setShowAddForm(false);
//     }
    
//     resetForm();
//     setEditingBatch(null);
//   };

//   const handleShare = (batch) => {
//     setSelectedBatch(batch);
//     setShowShareModal(true);
//   };

//   const closeModal = () => {
//     setShowAddForm(false);
//     setShowEditForm(false);
//     resetForm();
//     setEditingBatch(null);
//   };

//   const getModeColor = (mode) => {
//     switch(mode) {
//       case 'online': return 'bg-info';
//       case 'offline': return 'bg-success';
//       case 'hybrid': return 'bg-warning';
//       default: return 'bg-secondary';
//     }
//   };

//   const getEnrollmentPercentage = (enrolled, max) => {
//     if (max === 0) return 0;
//     return Math.round((enrolled / max) * 100);
//   };

//   const getProgressPercentage = (current, total) => {
//     if (total === 0) return 0;
//     return Math.round((current / total) * 100);
//   };

//   const getCompletionPercentage = (completed, enrolled) => {
//     if (enrolled === 0) return 0;
//     return Math.round((completed / enrolled) * 100);
//   };

//   const DeleteModal = () => {
//     if (!showDeleteModal || !batchToDelete) return null;

//     return (
//       <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//         <div className="modal-dialog modal-dialog-centered">
//           <div className="modal-content">
//             <div className="modal-header bg-danger text-white">
//               <h5 className="modal-title">Confirm Delete</h5>
//               <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
//             </div>
//             <div className="modal-body">
//               <p>Are you sure you want to delete the batch <strong>{batchToDelete.name} ({batchToDelete.code})</strong>?</p>
//               <p className="text-muted">This action cannot be undone and will remove all associated data including student enrollments and progress.</p>
//             </div>
//             <div className="modal-footer">
//               <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
//                 Cancel
//               </button>
//               <button type="button" className="btn btn-danger" onClick={confirmDelete}>
//                 Delete Batch
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//     if (showBatches && selectedBatchesForStudent) {
//       return (
//         <div>
//           {/* Breadcrumb Navigation */}
//           {/* <div className="container py-2">
//             <nav aria-label="breadcrumb">
//               <ol className="breadcrumb">
//                 {onBackToCenters && (
//                   <li className="breadcrumb-item">
//                     <button 
//                       className="btn btn-link p-0 text-decoration-none"
//                       onClick={onBackToCenters}
//                     >
//                       {selectedCenter ? `${selectedCenter.name} Centers` : 'Centers'}
//                     </button>
//                   </li>
//                 )}
//                 <li className="breadcrumb-item">
//                   <button 
//                     className="btn btn-link p-0 text-decoration-none"
//                     onClick={handleBackToCourses}
//                   >
//                     {selectedCenter ? `${selectedCenter.name} Courses` : 'Courses'}
//                   </button>
//                 </li>
//                 <li className="breadcrumb-item active" aria-current="page">
//                   {selectedCourseForBatches.name} Batches
//                 </li>
//               </ol>
//             </nav>
//           </div> */}
          
//           {/* Batch Component with filtered data */}
//           <Student selectedCourse={selectedBatchesForStudent} />
//         </div>
//       );
//     }
  

//   return (
//     <div className="container py-4">
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <h4>Batches</h4>
//         <div>
//             <button className="btn btn-outline-secondary me-2" >
//              <i className="bi bi-arrow-left"></i>  Back
//           </button>
//           <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
//             <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
//           </button>
//           <button className="btn btn-warning" onClick={handleAdd}>Add Batch</button>
//         </div>
//       </div>

//       <div className="d-flex justify-content-between mb-3">
//         <ul className="nav nav-pills">
//           {['Active Batches', 'Inactive Batches', 'All Batches'].map(tab => (
//             <li className="nav-item" key={tab}>
//               <button
//                 className={`nav-link ${activeBatchTab === tab ? 'active' : ''}`}
//                 onClick={() => setActiveBatchTab(tab)}
//               >
//                 {tab}
//               </button>
//             </li>
//           ))}
//         </ul>
//         <input
//           type="text"
//           className="form-control w-25"
//           placeholder="Search batches..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//       </div>

//       <div className="row">
//         {filteredBatches.map(batch => {
//           const enrollmentPercentage = getEnrollmentPercentage(batch.enrolledStudents, batch.maxStudents);
//           const progressPercentage = getProgressPercentage(batch.currentWeek, batch.totalWeeks);
//           const completionPercentage = getCompletionPercentage(batch.completedStudents, batch.enrolledStudents);
//           return (
//             <div key={batch.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
//               <div className="card h-100 border rounded shadow-sm position-relative">
//                 <div className="card-body">
//                   <div className="d-flex justify-content-between align-items-start mb-2">
//                     <div className="flex-grow-1">
//                       <div className="d-flex align-items-center mb-2">
//                         <i className="bi bi-people-fill text-warning fs-3 me-2"></i>
//                         <div>
//                           <h5 className="card-title mb-1">{batch.code}</h5>
//                           <p className="text-muted mb-1">{batch.name}</p>
//                         </div>
//                       </div>
//                       <div className="mb-2">
//                         <p className="text-muted small mb-1">
//                           <i className="bi bi-book me-1"></i>
//                           <strong>Course:</strong> {batch.course} - {batch.courseName}
//                         </p>
//                         <p className="text-muted small mb-1">
//                           <i className="bi bi-building me-1"></i>
//                           <strong>Center:</strong> {batch.centerName}
//                         </p>
//                         <p className="text-muted small mb-1">
//                           <i className="bi bi-person-fill me-1"></i>
//                           <strong>Instructor:</strong> {batch.instructor}
//                         </p>
                       
//                       </div>
//                       <div className="d-flex flex-wrap gap-2 mb-2">
//                         <span className={` ${batch.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
//                           {batch.status}
//                         </span>
//                         <span className={`${getModeColor(batch.mode)}`}>
//                           {batch.mode}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-end d-flex">
//                       <button className="btn btn-sm btn-light me-1" title="Share" onClick={() => handleShare(batch)}>
//                         <i className="bi bi-share-fill"></i>
//                       </button>
//                       <button className="btn btn-sm btn-light me-1" title="Edit" onClick={() => handleEdit(batch)}>
//                         <i className="bi bi-pencil-square"></i>
//                       </button>
//                       <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={() => handleDelete(batch)}>
//                         <i className="bi bi-trash"></i>
//                       </button>
//                     </div>
//                   </div>
                  
//                   {/* Enrollment Progress */}
//                   <div className="mb-2">
//                     <div className="d-flex justify-content-between small text-muted mb-1">
//                       <span>Enrollment</span>
//                       <span>{batch.enrolledStudents}/{batch.maxStudents} ({enrollmentPercentage}%)</span>
//                     </div>
//                     <div className="progress" style={{ height: '4px' }}>
//                       <div 
//                         className="progress-bar bg-warning" 
//                         role="progressbar" 
//                         style={{ width: `${enrollmentPercentage}%` }}
//                       ></div>
//                     </div>
//                   </div>

//                   {/* Course Progress */}
//                   <div className="mb-2">
//                     <div className="d-flex justify-content-between small text-muted mb-1">
//                       <span>Course Progress</span>
//                       <span>Week {batch.currentWeek}/{batch.totalWeeks} ({progressPercentage}%)</span>
//                     </div>
//                     <div className="progress" style={{ height: '4px' }}>
//                       <div 
//                         className="progress-bar bg-primary" 
//                         role="progressbar" 
//                         style={{ width: `${progressPercentage}%` }}
//                       ></div>
//                     </div>
//                   </div>

//                   {/* Completion Progress */}
//                   <div className="mb-3">
//                     <div className="d-flex justify-content-between small text-muted mb-1">
//                       <span>Completion Rate</span>
//                       <span>{batch.completedStudents}/{batch.enrolledStudents} ({completionPercentage}%)</span>
//                     </div>
//                     <div className="progress" style={{ height: '4px' }}>
//                       <div 
//                         className="progress-bar bg-success" 
//                         role="progressbar" 
//                         style={{ width: `${completionPercentage}%` }}
//                       ></div>
//                     </div>
//                   </div>

//                   {/* Batch Stats */}
//                   <div className="row small text-muted">
//                     <div className="col-3 text-center">
//                       <div className="fw-bold text-warning">{batch.enrolledStudents}</div>
//                       <div>Enrolled</div>
//                     </div>
//                     <div className="col-3 text-center">
//                       <div className="fw-bold text-primary">{batch.currentWeek}</div>
//                       <div>Week</div>
//                     </div>
//                     <div className="col-3 text-center">
//                       <div className="fw-bold text-success">{batch.completedStudents}</div>
//                       <div>Completed</div>
//                     </div>
//                     <div className="col-3 text-center">
//                       <div className="fw-bold text-info">{batch.maxStudents}</div>
//                       <div>Capacity</div>
//                     </div>
//                   </div>

//                   <div className="small text-muted mt-3">
//                     <div className="row">
//                       <div className="col-6">
//                         <i className="bi bi-calendar-event me-1"></i>Start: <strong>{batch.startDate}</strong>
//                       </div>
//                       <div className="col-6">
//                         <i className="bi bi-calendar-check me-1"></i>End: <strong>{batch.endDate}</strong>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {filteredBatches.length === 0 && (
//         <div className="text-center py-5">
//           <i className="bi bi-people fs-1 text-muted"></i>
//           <h5 className="text-muted mt-3">No batches found</h5>
//           <p className="text-muted">Try adjusting your search or filter criteria</p>
//         </div>
//       )}

//       {/* Add/Edit Modal */}
//       {(showAddForm || showEditForm) && (
//         <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg">
//             <div className="modal-content">
//               <div className="modal-header bg-warning text-dark">
//                 <h5 className="modal-title">{editingBatch ? 'Edit Batch' : 'Add New Batch'}</h5>
//                 <button type="button" className="btn-close" onClick={closeModal}></button>
//               </div>
//               <div className="modal-body">
//                 <div className="row">
//                   <div className="col-md-6 mb-3">
//                   <label className="form-label">Batch Name *</label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     value={formData.name}
//                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter batch name"
//                   />
//                   </div>
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Course *</label>
//                     <select
//                       className="form-select"
//                       value={formData.course}
//                       onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
//                     >
//                       <option value="">Select Course</option>
//                       {availableCourses.map(course => (
//                         <option key={course.id} value={course.code}>
//                           {course.code} - {course.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
               
//                 <div className="row">
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Center</label>
//                     <select
//                       className="form-select"
//                       value={formData.center}
//                       onChange={(e) => setFormData(prev => ({ ...prev, center: e.target.value }))}
//                     >
//                       <option value="">Select Center (Online if empty)</option>
//                       {availableCenters.map(center => (
//                         <option key={center.id} value={center.code}>
//                           {center.code} - {center.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Mode</label>
//                     <select
//                       className="form-select"
//                       value={formData.mode}
//                       onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
//                     >
//                       <option value="offline">Offline</option>
//                       <option value="online">Online</option>
//                       <option value="hybrid">Hybrid</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="row">
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Instructor *</label>
//                     <input
//                       type="text"
//                       className="form-control"
//                       value={formData.instructor}
//                       onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
//                       placeholder="Enter instructor name"
//                     />
//                   </div>
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Max Students</label>
//                     <input
//                       type="number"
//                       className="form-control"
//                       value={formData.maxStudents}
//                       onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: e.target.value }))}
//                       placeholder="Enter max students"
//                       min="1"
//                     />
//                   </div>
//                 </div>
//                 <div className="row">
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">Start Date</label>
//                     <input
//                       type="date"
//                       className="form-control"
//                       value={formData.startDate}
//                       onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
//                     />
//                   </div>
//                   <div className="col-md-6 mb-3">
//                     <label className="form-label">End Date</label>
//                     <input
//                       type="date"
//                       className="form-control"
//                       value={formData.endDate}
//                       onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
//                     />
//                   </div>
//                 </div>
                
//                 <div className="mb-3">
//                   <label className="form-label">Status</label>
//                   <select
//                     className="form-select"
//                     value={formData.status}
//                     onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" className="btn btn-secondary" onClick={closeModal}>
//                   Cancel
//                 </button>
//                 <button type="button" className="btn btn-warning" onClick={handleSubmit}>
//                   {editingBatch ? 'Update Batch' : 'Add Batch'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       <DeleteModal />

//       {/* Share Modal */}
//       {showShareModal && selectedBatch && (
//         <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
//             <div className="modal-content" onClick={e => e.stopPropagation()}>
//               <div className="modal-header bg-warning text-dark">
//                 <h5 className="modal-title">Manage Access - {selectedBatch.code}</h5>
//                 <button type="button" className="btn-close" onClick={() => setShowShareModal(false)}></button>
//               </div>
//               <div className="modal-body">
//                 <div className="row mb-3">
//                   <div className="col-md-8">
//                     <input
//                       type="email"
//                       className="form-control"
//                       placeholder="Add user email"
//                       value={newUser}
//                       onChange={(e) => setNewUser(e.target.value)}
//                     />
//                   </div>
//                   <div className="col-md-4">
//                     <select
//                       className="form-select"
//                       value={newRole}
//                       onChange={(e) => setNewRole(e.target.value)}
//                     >
//                       <option value="Student">Student</option>
//                       <option value="Teaching Assistant">Teaching Assistant</option>
//                       <option value="Batch Coordinator">Batch Coordinator</option>
//                       <option value="Instructor">Instructor</option>
//                       <option value="Admin">Admin</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="mb-3">
//                   <textarea className="form-control" placeholder="Add message (optional)" rows={2}></textarea>
//                 </div>
//                 <div className="form-check mb-4">
//                   <input type="checkbox" className="form-check-input" id="notifyCheck" defaultChecked />
//                   <label className="form-check-label">Notify people</label>
//                 </div>
//                 <button type="button" className="btn btn-warning">Send</button>

//                 <hr />

//                 <h6 className="mb-3">Current Access</h6>
//                 <ul className="list-group">
//                   {selectedBatch.access.map((a, index) => (
//                     <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
//                       <div>
//                         <strong>{a.name}</strong>
//                       </div>
//                       <select className="form-select w-auto">
//                         <option value="Student" selected={a.role === 'Student'}>Student</option>
//                         <option value="Teaching Assistant" selected={a.role === 'Teaching Assistant'}>Teaching Assistant</option>
//                         <option value="Batch Coordinator" selected={a.role === 'Batch Coordinator'}>Batch Coordinator</option>
//                         <option value="Instructor" selected={a.role === 'Instructor'}>Instructor</option>
//                         <option value="Admin" selected={a.role === 'Admin'}>Admin</option>
//                       </select>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//               <div className="modal-footer">
//                 <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Done</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       <style>
//         {`
//         .overflowY{
//         overflow-y : scroll!important;
//         }
//         `}
//       </style>
//     </div>
//   );
// };

// export default Batch;