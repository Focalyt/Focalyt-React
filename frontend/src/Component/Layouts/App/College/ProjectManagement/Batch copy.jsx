import React, { useState, useEffect } from 'react';
import axios from 'axios'
import Student from '../../../../Layouts/App/College/ProjectManagement/Student';

const Batch = ({ selectedCourse=null, onBackToCourses =null, selectedCenter= null, onBackToCenters=null, selectedProject=null, onBackToProjects=null, selectedVertical=null, onBackToVerticals=null }) => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  
  // State to store batches
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Main tab state
  const [mainTab, setMainTab] = useState('Batches'); // 'Batches' or 'All Admissions'

  // Form states
  const [formData, setFormData] = useState({
    name: '', // Batch Name
    instructor: '', // Instructor Name
    description: '', // Description Name
    startDate: '', // Start Date
    endDate: '', // End Date
    zeroPeriodStartDate: '', // Zero Period Start Date
    zeroPeriodEndDate: '', // Zero Period End Date
    maxStudents: 0, // Changed from 'students' to 'maxStudents'
    status: '', // Default to 'active'
    courseId: selectedCourse._id, // Course ID (using selectedCourseData)
    centerId: selectedCenter._id, // Center ID (using selectedCenterData)
    createdBy: userData._id, // Assuming 'user' contains current logged-in user's ID
  });

  // Sub-tab states
  const [batchSubTab, setBatchSubTab] = useState('Active Batches'); // For Batches main tab
  const [admissionSubTab, setAdmissionSubTab] = useState('Batch Assigned'); // For All Admissions main tab

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

  


  // Sample courses and centers for dropdown


  const [batches, setBatches] = useState([
    
  ]);

  // Sample admission data
  const [allAdmissions, setAllAdmissions] = useState([
    {
      id: 1,
      studentName: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+91 9876543210',
      course: 'CS101',
      courseName: 'Introduction to Computer Science',
      center: 'CTR001',
      centerName: 'Mumbai Technology Center',
      admissionDate: '2024-01-20',
      status: 'assigned', // 'assigned', 'pending', 'enrolled'
      batchCode: 'BATCH001',
      batchName: 'CS101 Morning Batch'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+91 9876543211',
      course: 'MATH201',
      courseName: 'Advanced Mathematics',
      center: 'CTR002',
      centerName: 'Delhi Regional Office',
      admissionDate: '2024-01-22',
      status: 'pending',
      batchCode: null,
      batchName: null
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      phone: '+91 9876543212',
      course: 'PHY301',
      courseName: 'Quantum Physics',
      center: 'CTR003',
      centerName: 'Bangalore R&D Center',
      admissionDate: '2024-01-25',
      status: 'assigned',
      batchCode: 'BATCH003',
      batchName: 'PHY301 Online Batch'
    }
  ]);

  // Filter batches based on current sub-tab
  const filteredBatches = batches.filter(batch => {
    // Filter by selected course if provided
    if (selectedCourse && batch.course !== selectedCourse.code) return false;

    // Filter by batch sub-tab
    if (batchSubTab === 'Active Batches' && batch.status !== 'active') return false;
    if (batchSubTab === 'Inactive Batches' && batch.status !== 'inactive') return false;
    // 'All Batches' shows everything

    // Search filter
    return batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.centerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter admissions based on current sub-tab
  const filteredAdmissions = allAdmissions.filter(admission => {
    // Filter by selected course if provided
    if (selectedCourse && admission.course !== selectedCourse.code) return false;

    // Filter by admission sub-tab
    if (admissionSubTab === 'Batch Assigned' && admission.status !== 'assigned') return false;
    if (admissionSubTab === 'Pending for Batch Assigned' && admission.status !== 'pending') return false;
    // 'All List' shows everything

    // Search filter
    return admission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.centerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admission.batchName && admission.batchName.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const resetForm = () => {
    setFormData(
      {
    name: '', // Batch Name
    startDate: '', // Start Date
    endDate: '', // End Date
    zeroPeriodStartDate: '', // Zero Period Start Date
    zeroPeriodEndDate: '', // Zero Period End Date
    maxStudents: 0, // Changed from 'students' to 'maxStudents'
    status: 'active', // Default to 'active'
    courseId: selectedCourse._id, // Course ID (using selectedCourseData)
    centerId: selectedCenter._id, // Center ID (using selectedCenterData)
    createdBy: userData._id, // Assuming 'user' contains current logged-in user's ID
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

  // Fetch batches when course or center change
  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`${backendUrl}/college/get_batches`, {
          params: {
            courseId: selectedCourse?._id,  // Assuming `selectedCourse` is an object with `id`
            centerId: selectedCenter?._id    // Assuming `selectedCenter` is an object with `id`
          },
          headers: {
            'x-auth': token  // Pass the token in the headers for authentication
          }
        });

        if (response.data.success) {
          setBatches(response.data.data);
        } else {
          setError('Failed to fetch batches');
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.instructor.trim()) {
      alert('Please fill in all required fields');
      return;
    }


    if (editingBatch) {
      // Edit existing batch
      setBatches(prev => prev.map(b =>
        b.id === editingBatch.id
          ? {
            ...b,
            ...formData,
            courseName:  '',
            centerName: 'Virtual Center',
            maxStudents: parseInt(formData.maxStudents) || 0
          }
          : b
      ));
      setShowEditForm(false);
    } else {

      const response = await fetch(`${backendUrl}/college/add_batch`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add project');
      alert('Batch added successfully')
      resetForm()
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
    switch (mode) {
      case 'online': return 'text-info';
      case 'offline': return 'text-success';
      case 'hybrid': return 'text-warning';
      default: return 'text-secondary';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'text-success';
      case 'pending': return 'text-warning';
      case 'enrolled': return 'text-primary';
      default: return 'text-secondary';
    }
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

   if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="d-flex align-items-center gap-3">

            <div className='d-flex align-items-center'>
              <h5 style={{ cursor: 'pointer' }} onClick={onBackToVerticals} className="me-2">{selectedVertical.name} Vertical</h5>
              <span className="mx-2"> &gt; </span>
              <h5 style={{ cursor: 'pointer' }} onClick={onBackToProjects} className="breadcrumb-item mb-0" aria-current="page">
                {selectedProject.name} Project
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 style={{ cursor: 'pointer' }} onClick={onBackToCenters} className="breadcrumb-item mb-0" aria-current="page">
                {selectedCenter.name} Centers
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 style={{ cursor: 'pointer' }} onClick={onBackToCourses} className="breadcrumb-item mb-0" aria-current="page">
                {selectedCourse.name} Centers
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 className="breadcrumb-item mb-0" aria-current="page">
                All Batches
              </h5>
            </div>
          </div>
        </div>
        
        <div>
          {onBackToCourses && (
            <button className="btn btn-outline-secondary me-2" onClick={onBackToCourses}>
              <i className="bi bi-arrow-left"></i> Back
            </button>
          )}
          <button className="btn btn-outline-secondary me-2 border-0" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>
          {mainTab === 'Batches' && (
            <button className="btn btn-warning" onClick={handleAdd}>Add Batch</button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="d-block justify-content-between mb-3">
        <ul className="nav nav-pills mb-3">
          {['Batches', 'All Admissions'].map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link ${mainTab === tab ? 'active' : ''}`}
                onClick={() => setMainTab(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>

        {/* Sub Tabs and Search */}
        <div className='d-flex justify-content-between mb-3'>
          <ul className="nav nav-pills">
            {mainTab === 'Batches'
              ? ['Active Batches', 'Inactive Batches', 'All Batches'].map(tab => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${batchSubTab === tab ? 'active' : ''}`}
                    onClick={() => setBatchSubTab(tab)}
                  >
                    {tab}
                  </button>
                </li>
              ))
              : ['Batch Assigned', 'Pending for Batch Assigned', 'All List'].map(tab => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link ${admissionSubTab === tab ? 'active' : ''}`}
                    onClick={() => setAdmissionSubTab(tab)}
                  >
                    {tab}
                  </button>
                </li>
              ))
            }
          </ul>
          <input
            type="text"
            className="form-control w-25"
            placeholder={`Search ${mainTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      {mainTab === 'Batches' ? (
        // Batches Content
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
                          <span className={` ${batch.status === 'active' ? 'text-success' : 'text-secondary'}`}>
                            {batch.status}
                          </span>
                          <span className={`${getModeColor(batch.mode)}`}>
                            {batch.mode}
                          </span>
                        </div>
                      </div>
                      <div className="text-end d-flex">
                        <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Share" onClick={(e) => { e.stopPropagation(); handleShare(batch); }}>
                          <i className="bi bi-share-fill"></i>
                        </button>
                        <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(batch); }}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-light text-danger border-0 bg-transparent" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(batch); }}>
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
                          className="progress-bar text-success"
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
      ) : (
        // Admissions Content
        <div className="row">
          {filteredAdmissions.map(admission => (
            <div key={admission.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
              <div className="card h-100 border rounded shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-person-check-fill text-primary fs-3 me-2"></i>
                    <div>
                      <h5 className="card-title mb-1">{admission.studentName}</h5>
                      <p className="text-muted mb-0">{admission.email}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-muted small mb-1">
                      <i className="bi bi-telephone me-1"></i>
                      <strong>Phone:</strong> {admission.phone}
                    </p>
                    <p className="text-muted small mb-1">
                      <i className="bi bi-book me-1"></i>
                      <strong>Course:</strong> {admission.course} - {admission.courseName}
                    </p>
                    <p className="text-muted small mb-1">
                      <i className="bi bi-building me-1"></i>
                      <strong>Center:</strong> {admission.centerName}
                    </p>
                    {admission.batchCode && (
                      <p className="text-muted small mb-1">
                        <i className="bi bi-people me-1"></i>
                        <strong>Batch:</strong> {admission.batchCode} - {admission.batchName}
                      </p>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className={`badge ${getStatusColor(admission.status)}`}>
                      {admission.status === 'assigned' ? 'Batch Assigned' :
                        admission.status === 'pending' ? 'Pending Assignment' :
                          admission.status}
                    </span>
                    <small className="text-muted">
                      <i className="bi bi-calendar-event me-1"></i>
                      {admission.admissionDate}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {((mainTab === 'Batches' && filteredBatches.length === 0) ||
        (mainTab === 'All Admissions' && filteredAdmissions.length === 0)) && (
          <div className="text-center py-5">
            <i className={`bi ${mainTab === 'Batches' ? 'bi-people' : 'bi-person-check'} fs-1 text-muted`}></i>
            <h5 className="text-muted mt-3">No {mainTab.toLowerCase()} found</h5>
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          </div>
        )}

      {/* Add/Edit Modal - Only for Batches */}
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Description *</label>
                    <input
                      type="text"
                      name='description'
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter batch name"
                    />
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
                    <label className="form-label">Zero Period Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.zeroPeriodStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, zeroPeriodStartDate: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Zero Period End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.zeroPeriodEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, zeroPeriodEndDate: e.target.value }))}
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

