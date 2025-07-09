import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Batch from '../../../../Layouts/App/College/ProjectManagement copy/Batch';
import qs from 'query-string';

const Course = ({ selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
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
    status: 'active',
    centerCode: selectedCenter?.code || '' // ======== ADD THIS: Link course to center ========
  });

  const [courses, setCourses] = useState([
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

  useEffect(() => {
    fetchCourses()
  }, []);

  // Set up initial URL with current context
  useEffect(() => {
    const urlParams = getURLParams();
    console.log('Course initial URL setup - current params:', urlParams);
    
    // If we're not in course or batch stage, set to course stage
    if (urlParams.stage !== 'course' && urlParams.stage !== 'batch') {
      console.log('Setting to course stage');
      updateURL({ 
        stage: 'course',
        centerId: selectedCenter?._id,
        centerName: selectedCenter?.name,
        projectId: selectedProject?._id,
        projectName: selectedProject?.name,
        verticalId: selectedVertical?.id,
        verticalName: selectedVertical?.name
      });
    }
  }, [selectedCenter, selectedProject, selectedVertical]);

  const fetchCourses = async (params) => {
    try {

      const headers = {
        'x-auth': token,
      };


      const response = await axios.get(`${backendUrl}/college/all_courses_centerwise`, {
        params: {
          centerId: selectedCenter._id,
          projectId: selectedProject._id
        },
        headers: headers // make sure headers are passed correctly
      });


      console.log("Fetched courses:", response.data.data);
      console.log(" Response :", response);


      if (response.data) {
        const updatedCourses = (response.data.data || []).map(course => ({
          ...course,
          status: course.status === true ? 'active' : 'inactive'
        }));
        setCourses(updatedCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    // ======== ADD THIS: Filter by selected center if provided ========
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
    setFormData(course);
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



  const handleShare = (course) => {
    setSelectedCourse(course);
    setShowShareModal(true);
  };

  // ======== ADD THESE NEW FUNCTIONS FOR BATCH NAVIGATION ========
  // Function to handle course click for batches
  const handleCourseClick = (course) => {
    setSelectedCourseForBatches(course);
    setShowBatches(true);

    // Update URL with course and navigation info
    updateURL({ 
      stage: 'batch', 
      courseId: course._id, 
      courseName: course.name,
      centerId: selectedCenter?._id,
      centerName: selectedCenter?.name,
      projectId: selectedProject?._id,
      projectName: selectedProject?.name,
      verticalId: selectedVertical?.id,
      verticalName: selectedVertical?.name
    });
  };

  useEffect(() => {
    const urlParams = getURLParams();
    console.log('Course component - URL params:', urlParams);
    
    // Only restore state if courses are loaded
    if (courses.length === 0) {
      console.log('Courses not loaded yet, skipping state restoration');
      return;
    }
    
    if (urlParams.stage === "batch" && urlParams.courseId) {
      // Find course from current courses list
      const course = courses.find(c => c._id === urlParams.courseId);
      if (course) {
        setSelectedCourseForBatches(course);
        setShowBatches(true);
        console.log('Restored to batch view for course:', course.name);
      } else {
        // Course not found, reset to course view
        console.warn('Course not found in current list, resetting to course view');
        updateURL({ 
          stage: 'course',
          centerId: selectedCenter?._id,
          centerName: selectedCenter?.name,
          projectId: selectedProject?._id,
          projectName: selectedProject?.name,
          verticalId: selectedVertical?.id,
          verticalName: selectedVertical?.name
        });
        setShowBatches(false);
      }
    } else {
      // Default to course view
      setShowBatches(false);
      console.log('Restored to course view');
    }
  }, [courses, selectedCenter, selectedProject, selectedVertical]); // Depend on courses and navigation context


  // Function to go back to courses view
  const handleBackToCourses = () => {
    setShowBatches(false);
    setSelectedCourseForBatches(null);

    // Update URL to course view while preserving navigation context
    updateURL({ 
      stage: 'course',
      centerId: selectedCenter?._id,
      centerName: selectedCenter?.name,
      projectId: selectedProject?._id,
      projectName: selectedProject?.name,
      verticalId: selectedVertical?.id,
      verticalName: selectedVertical?.name
    });
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
    setEditingCourse(null);
  };

  const getLevelColor = (level) => {
    switch (level) {
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
        {/* <div className="container py-2">
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
        </div> */}

        {/* Batch Component with filtered data */}
        <Batch selectedCourse={selectedCourseForBatches} onBackToCourses={handleBackToCourses} selectedCenter={selectedCenter} onBackToCenters={onBackToCenters} selectedProject={selectedProject} onBackToProjects={onBackToProjects} selectedVertical={selectedVertical} onBackToVerticals={onBackToVerticals} />
      </div>
    );
  }

  // URL-based state management
  const getURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      stage: urlParams.get('stage') || 'course',
      courseId: urlParams.get('courseId'),
      courseName: urlParams.get('courseName'),
      centerId: urlParams.get('centerId'),
      centerName: urlParams.get('centerName'),
      projectId: urlParams.get('projectId'),
      projectName: urlParams.get('projectName'),
      verticalId: urlParams.get('verticalId'),
      verticalName: urlParams.get('verticalName')
    };
  };

  const updateURL = (params) => {
    const url = new URL(window.location);
    
    // Clear existing params
    url.searchParams.delete('stage');
    url.searchParams.delete('courseId');
    url.searchParams.delete('courseName');
    
    // Set new params
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.set(key, params[key]);
      }
    });
    
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="container py-4">
      {/* ======== ADD THIS: Back Button and Header ======== */}
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
              <h5 className="breadcrumb-item mb-0" aria-current="page">
                All Courses
              </h5>
            </div>
          </div>
        </div>

        <div>

          {onBackToCenters && (
            <button
              onClick={onBackToCenters}
              className="btn btn-light"
              title="Back to Verticals"
            >
              <i className="bi bi-arrow-left"></i>
              <span>Back</span>
            </button>
          )}

          <button className="btn btn-outline-secondary me-2 border-0 bg-transparent" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>
          <button className="btn btn-danger" onClick={handleAdd}>Add Course</button>
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
            <div key={course._id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
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
                          {/* <h5 className="card-title mb-1">{course.code}</h5> */}
                          <p className="text-muted mb-1">{course.courseLevel}</p>
                        </div>
                      </div>
                      <p className="text-muted small mb-2">{course.name}</p>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className={`${course.status === 'active' ? 'text-success' : 'text-secondary'}`}>
                          {course.status}
                        </span>

                        <span className="bg-primary">{course.sectors && course.sectors.length > 0 ? course.sectors[0].name : 'N/A'}
                        </span>
                        {/* ======== ADD THIS: Show center code badge ======== */}
                        {selectedCenter && (
                          <span className="text-secondary">
                            {course.centerCode}
                          </span>
                        )}
                      </div>
                      {/* <div className="small text-muted mb-2">
                        <i className="bi bi-person-fill me-1"></i>
                        <strong>Instructor:</strong> {course.instructor}
                      </div> */}
                    </div>
                    {/* ======== MODIFY THIS: Add stopPropagation to action buttons ======== */}
                    <div className="text-end">
                      {/* <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Share" onClick={(e) => { e.stopPropagation(); handleShare(course); }}>
                        <i className="bi bi-share-fill"></i>
                      </button> */}
                      <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(course); }}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      {/* <button className="btn btn-sm btn-light text-danger border-0 bg-transparent" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(course); }}>
                        <i className="bi bi-trash"></i>
                      </button> */}
                    </div>
                  </div>

                  {/* Enrollment Progress */}
                  {/* <div className="mb-2">
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
                  </div> */}

                  {/* Completion Progress */}
                  {/* <div className="mb-3">
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
                  </div> */}

                  {/* ======== MODIFY THIS: Add batches display in stats ======== */}
                  <div className="row small text-muted">
                    {/* <div className="col-2 text-center">
                      <div className="fw-bold text-primary">{course.credits}</div>
                      <div>Credits</div>
                    </div> */}
                    {/* <div className="col-2 text-center">
                      <div className="fw-bold text-info">{course.duration}</div>
                      <div>Duration</div>
                    </div> */}
                    {/* <div className="col-2 text-center">
                      <div className="fw-bold text-warning">{course.enrolledStudents}</div>
                      <div>Enrolled</div>
                    </div> */}

                    {/* <div className="col-2 text-center">
                      <span 
                        className="fw-bold text-danger" 
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleCourseClick(course)}
                      >
                        {course.batches}
                      </span>
                      <div>Batches</div>
                    </div> */}
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





      {/* Share Modal */}
      {/* {showShareModal && selectedCourse && (
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
      )} */}
      <style>
        {`
        .overflowY{
        overflow-y :scroll !important;
        } 
        `}
      </style>
    </div>
  );
};

export default Course;