import React, { useState, useEffect } from 'react';
import Batch from '../../../../Layouts/App/College/ProjectManagement/Batch';

const Course = ({ selectedCenter = null, onBackToCenters = null }) => {
  const [activeCourseTab, setActiveCourseTab] = useState('Active Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newUser, setNewUser] = useState('');
  const [newRole, setNewRole] = useState('Student');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  
  // ======== NEW STATES FOR BATCH INTEGRATION ========
  // Add these new states for batch navigation
  const [showBatches, setShowBatches] = useState(false);
  const [selectedCourseForBatches, setSelectedCourseForBatches] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    level: 'beginner',
    duration: '',
    credits: '',
    instructor: '',
    maxStudents: '',
    status: 'active',
    centerCode: selectedCenter?.code || '' // ======== ADD THIS: Link course to center ========
  });

  const [courses, setCourses] = useState([
    {
      id: 1,
      code: 'CS101',
      name: 'Introduction to Computer Science',
      description: 'Fundamental concepts of computer science and programming',
      category: 'Computer Science',
      level: 'beginner',
      duration: '12 weeks',
      credits: 3,
      instructor: 'Dr. John Smith',
      maxStudents: 50,
      enrolledStudents: 45,
      completedStudents: 32,
      batches: 3, // ======== ADD THIS: Add batches count to each course ========
      centerCode: 'CTR001', // ======== ADD THIS: Link course to center ========
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      createdAt: '2023-12-01',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 2,
      code: 'MATH201',
      name: 'Advanced Mathematics',
      description: 'Calculus, linear algebra, and statistical methods',
      category: 'Mathematics',
      level: 'intermediate',
      duration: '16 weeks',
      credits: 4,
      instructor: 'Prof. Sarah Johnson',
      maxStudents: 30,
      enrolledStudents: 28,
      completedStudents: 25,
      batches: 2, // ======== ADD THIS: Add batches count to each course ========
      centerCode: 'CTR001', // ======== ADD THIS: Link course to center ========
      status: 'active',
      startDate: '2024-02-01',
      endDate: '2024-05-30',
      createdAt: '2024-01-10',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 3,
      code: 'PHY301',
      name: 'Quantum Physics',
      description: 'Advanced concepts in quantum mechanics and applications',
      category: 'Physics',
      level: 'advanced',
      duration: '14 weeks',
      credits: 5,
      instructor: 'Dr. Michael Brown',
      maxStudents: 20,
      enrolledStudents: 0,
      completedStudents: 0,
      batches: 0, // ======== ADD THIS: Add batches count to each course ========
      centerCode: 'CTR003', // ======== ADD THIS: Link course to center ========
      status: 'inactive',
      startDate: '2024-06-01',
      endDate: '2024-09-15',
      createdAt: '2024-03-01',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 4,
      code: 'ENG102',
      name: 'Business English Communication',
      description: 'Professional English for business communication',
      category: 'Language',
      level: 'intermediate',
      duration: '10 weeks',
      credits: 2,
      instructor: 'Ms. Emily Davis',
      maxStudents: 40,
      enrolledStudents: 35,
      completedStudents: 30,
      batches: 4, // ======== ADD THIS: Add batches count to each course ========
      centerCode: 'CTR002', // ======== ADD THIS: Link course to center ========
      status: 'active',
      startDate: '2024-03-01',
      endDate: '2024-05-15',
      createdAt: '2024-02-01',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    },
    {
      id: 5,
      code: 'DATA301',
      name: 'Data Science Fundamentals',
      description: 'Introduction to data analysis and machine learning',
      category: 'Data Science',
      level: 'intermediate',
      duration: '18 weeks',
      credits: 4,
      instructor: 'Dr. Alex Wilson',
      maxStudents: 25,
      enrolledStudents: 22,
      completedStudents: 18,
      batches: 2, // ======== ADD THIS: Add batches count to each course ========
      centerCode: 'CTR004', // ======== ADD THIS: Link course to center ========
      status: 'active',
      startDate: '2024-01-20',
      endDate: '2024-06-10',
      createdAt: '2024-01-01',
      access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
    }
  ]);

  // ======== ADD THIS: Update form data when selectedCenter changes ========
  useEffect(() => {
    if (selectedCenter) {
      setFormData(prev => ({
        ...prev,
        centerCode: selectedCenter.code
      }));
    }
  }, [selectedCenter]);

  const filteredCourses = courses.filter(course => {
    // ======== ADD THIS: Filter by selected center if provided ========
    if (selectedCenter && course.centerCode !== selectedCenter.code) return false;
    
    // Filter by tab
    if (activeCourseTab === 'Active Courses' && course.status !== 'active') return false;
    if (activeCourseTab === 'Inactive Courses' && course.status !== 'inactive') return false;
    
    // Filter by search query
    return course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      level: 'beginner',
      duration: '',
      credits: '',
      instructor: '',
      maxStudents: '',
      status: 'active',
      centerCode: selectedCenter?.code || '' // ======== ADD THIS: Reset with center code ========
    });
  };

  const handleAdd = () => {
    setEditingCourse(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      credits: course.credits.toString(),
      instructor: course.instructor,
      maxStudents: course.maxStudents.toString(),
      status: course.status,
      centerCode: course.centerCode // ======== ADD THIS: Include center code in edit ========
    });
    setShowEditForm(true);
  };

  const handleDelete = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim() || !formData.category.trim() || !formData.instructor.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingCourse) {
      // Edit existing course
      setCourses(prev => prev.map(c => 
        c.id === editingCourse.id 
          ? { 
              ...c, 
              ...formData, 
              credits: parseInt(formData.credits) || 0,
              maxStudents: parseInt(formData.maxStudents) || 0
            }
          : c
      ));
      setShowEditForm(false);
    } else {
      // Add new course
      const newCourse = {
        id: Date.now(),
        ...formData,
        credits: parseInt(formData.credits) || 0,
        maxStudents: parseInt(formData.maxStudents) || 0,
        enrolledStudents: 0,
        completedStudents: 0,
        batches: 0, // ======== ADD THIS: Initialize batches count for new courses ========
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days from now
        createdAt: new Date().toISOString().split('T')[0],
        access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
      };
      setCourses(prev => [...prev, newCourse]);
      setShowAddForm(false);
    }
    
    resetForm();
    setEditingCourse(null);
  };

  const handleShare = (course) => {
    setSelectedCourse(course);
    setShowShareModal(true);
  };

  // ======== ADD THESE NEW FUNCTIONS FOR BATCH NAVIGATION ========
  // Function to handle course click for batches
  const handleCourseClick = (course) => {
    setSelectedCourseForBatches(course);
    setShowBatches(true);
  };

  // Function to go back to courses view
  const handleBackToCourses = () => {
    setShowBatches(false);
    setSelectedCourseForBatches(null);
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
    setEditingCourse(null);
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getEnrollmentPercentage = (enrolled, max) => {
    if (max === 0) return 0;
    return Math.round((enrolled / max) * 100);
  };

  const getCompletionPercentage = (completed, enrolled) => {
    if (enrolled === 0) return 0;
    return Math.round((completed / enrolled) * 100);
  };

  const DeleteModal = () => {
    if (!showDeleteModal || !courseToDelete) return null;

    return (
      <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Confirm Delete</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the course <strong>{courseToDelete.name} ({courseToDelete.code})</strong>?</p>
              <p className="text-muted">This action cannot be undone and will remove all associated data including student enrollments.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                Delete Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ======== ADD THIS: If showing batches, render the Batch component ========
  if (showBatches && selectedCourseForBatches) {
    return (
      <div>
        {/* Breadcrumb Navigation */}
        <div className="container py-2">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              {onBackToCenters && (
                <li className="breadcrumb-item">
                  <button 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={onBackToCenters}
                  >
                    {selectedCenter ? `${selectedCenter.name} Centers` : 'Centers'}
                  </button>
                </li>
              )}
              <li className="breadcrumb-item">
                <button 
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={handleBackToCourses}
                >
                  {selectedCenter ? `${selectedCenter.name} Courses` : 'Courses'}
                </button>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {selectedCourseForBatches.name} Batches
              </li>
            </ol>
          </nav>
        </div>
        
        {/* Batch Component with filtered data */}
        <Batch selectedCourse={selectedCourseForBatches} />
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* ======== ADD THIS: Back Button and Header ======== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="d-flex align-items-center gap-3">
            {onBackToCenters && (
              <button 
                className="btn btn-outline-secondary"
                onClick={onBackToCenters}
                title="Back to Centers"
              >
                <i className="bi bi-arrow-left me-1"></i>
                Back
              </button>
            )}
            <div>
              <h4 className="mb-0">Courses</h4>
              {selectedCenter && (
                <small className="text-muted">
                  Showing courses for: <strong>{selectedCenter.name} ({selectedCenter.code})</strong>
                </small>
              )}
            </div>
          </div>
        </div>
        <div>
            <button 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={onBackToCenters}
                  ><i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
                    {selectedCenter ? `${selectedCenter.name} Centers` : 'Centers'}
                  </button>
          <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>
          <button className="btn btn-info" onClick={handleAdd}>Add Course</button>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <ul className="nav nav-pills">
          {['Active Courses', 'Inactive Courses', 'All Courses'].map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link ${activeCourseTab === tab ? 'active' : ''}`}
                onClick={() => setActiveCourseTab(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className="form-control w-25"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="row">
        {filteredCourses.map(course => {
          const enrollmentPercentage = getEnrollmentPercentage(course.enrolledStudents, course.maxStudents);
          const completionPercentage = getCompletionPercentage(course.completedStudents, course.enrolledStudents);
          return (
            <div key={course.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
              <div className="card h-100 border rounded shadow-sm position-relative">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    {/* ======== MODIFY THIS: Make course card clickable ======== */}
                    <div 
                      className="flex-grow-1 cursor-pointer"
                      onClick={() => handleCourseClick(course)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-book text-info fs-3 me-2"></i>
                        <div>
                          <h5 className="card-title mb-1">{course.code}</h5>
                          <p className="text-muted mb-1">{course.name}</p>
                        </div>
                      </div>
                      <p className="text-muted small mb-2">{course.description}</p>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className={`${course.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {course.status}
                        </span>
                        <span className={`${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        <span className="bg-primary">{course.category}</span>
                        {/* ======== ADD THIS: Show center code badge ======== */}
                        {selectedCenter && (
                          <span className="bg-secondary">
                            {course.centerCode}
                          </span>
                        )}
                      </div>
                      <div className="small text-muted mb-2">
                        <i className="bi bi-person-fill me-1"></i>
                        <strong>Instructor:</strong> {course.instructor}
                      </div>
                    </div>
                    {/* ======== MODIFY THIS: Add stopPropagation to action buttons ======== */}
                    <div className="text-end">
                      <button className="btn btn-sm btn-light me-1" title="Share" onClick={(e) => {e.stopPropagation(); handleShare(course);}}>
                        <i className="bi bi-share-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-light me-1" title="Edit" onClick={(e) => {e.stopPropagation(); handleEdit(course);}}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={(e) => {e.stopPropagation(); handleDelete(course);}}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* Enrollment Progress */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Enrollment</span>
                      <span>{course.enrolledStudents}/{course.maxStudents} ({enrollmentPercentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar bg-info" 
                        role="progressbar" 
                        style={{ width: `${enrollmentPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Completion Progress */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Completion</span>
                      <span>{course.completedStudents}/{course.enrolledStudents} ({completionPercentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* ======== MODIFY THIS: Add batches display in stats ======== */}
                  <div className="row small text-muted">
                    <div className="col-2 text-center">
                      <div className="fw-bold text-primary">{course.credits}</div>
                      <div>Credits</div>
                    </div>
                    <div className="col-2 text-center">
                      <div className="fw-bold text-info">{course.duration}</div>
                      <div>Duration</div>
                    </div>
                    <div className="col-2 text-center">
                      <div className="fw-bold text-warning">{course.enrolledStudents}</div>
                      <div>Enrolled</div>
                    </div>
                    <div className="col-2 text-center">
                      <div className="fw-bold text-success">{course.completedStudents}</div>
                      <div>Completed</div>
                    </div>
                    <div className="col-2 text-center">
                      <span 
                        className="fw-bold text-danger" 
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleCourseClick(course)}
                      >
                        {course.batches}
                      </span>
                      <div>Batches</div>
                    </div>
                  </div>

                  <div className="small text-muted mt-3">
                    <div className="row">
                      <div className="col-6">
                        <i className="bi bi-calendar-event me-1"></i>Start: <strong>{course.startDate}</strong>
                      </div>
                      <div className="col-6">
                        <i className="bi bi-calendar-check me-1"></i>End: <strong>{course.endDate}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-book fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No courses found</h5>
          {selectedCenter ? (
            <p className="text-muted">No courses found for center {selectedCenter.name}</p>
          ) : (
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddForm || showEditForm) && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">{editingCourse ? 'Edit Course' : 'Add New Course'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Course Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Enter course code (e.g., CS101)"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Enter category (e.g., Computer Science)"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter course name"
                  />
                </div>
                {/* ======== ADD THIS: Show center information in form ======== */}
                {selectedCenter && (
                  <div className="mb-3">
                    <label className="form-label">Center</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${selectedCenter.code} - ${selectedCenter.name}`}
                      readOnly
                      disabled
                    />
                    <small className="text-muted">Course will be linked to the current center</small>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter course description"
                  ></textarea>
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
                    <label className="form-label">Level</label>
                    <select
                      className="form-select"
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 12 weeks"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Credits</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.credits}
                      onChange={(e) => setFormData(prev => ({ ...prev, credits: e.target.value }))}
                      placeholder="Enter credits"
                      min="1"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
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
                <button type="button" className="btn btn-info" onClick={handleSubmit}>
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal />

      {/* Share Modal */}
      {showShareModal && selectedCourse && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">Manage Access - {selectedCourse.code}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowShareModal(false)}></button>
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
                <button type="button" className="btn btn-info">Send</button>

                <hr />

                <h6 className="mb-3">Current Access</h6>
                <ul className="list-group">
                  {selectedCourse.access.map((a, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{a.name}</strong>
                      </div>
                      <select className="form-select w-auto">
                        <option value="Student" selected={a.role === 'Student'}>Student</option>
                        <option value="Teaching Assistant" selected={a.role === 'Teaching Assistant'}>Teaching Assistant</option>
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
    </div>
  );
};

export default Course;