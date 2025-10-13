import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Batch from '../../../../Layouts/App/College/ProjectManagement/Batch';
import qs from 'query-string';

// MultiSelectCheckbox Component
const MultiSelectCheckbox = ({
  title,
  options,
  selectedValues,
  onChange,
  icon = "fas fa-list",
  isOpen,
  onToggle
}) => {
  const handleCheckboxChange = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return `Select ${title}`;
    } else if (selectedValues.length === 1) {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : selectedValues[0];
    } else if (selectedValues.length <= 2) {
      const selectedLabels = selectedValues.map(val => {
        const option = options.find(opt => opt.value === val);
        return option ? option.label : val;
      });
      return selectedLabels.join(', ');
    } else {
      return `${selectedValues.length} items selected`;
    }
  };

  return (
    <div className="multi-select-container-new">
      <label className="form-label small fw-bold text-dark d-flex align-items-center mb-2">
        <i className={`${icon} me-1 text-primary`}></i>
        {title}
        {selectedValues.length > 0 && (
          <span className="badge bg-primary ms-2">{selectedValues.length}</span>
        )}
      </label>

      <div className="multi-select-dropdown-new">
        <button
          type="button"
          className={`form-select multi-select-trigger ${isOpen ? 'open' : ''}`}
          onClick={onToggle}
          style={{ cursor: 'pointer', textAlign: 'left' }}
        >
          <span className="select-display-text">
            {getDisplayText()}
          </span>
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} dropdown-arrow`}></i>
        </button>

        {isOpen && (
          <div className="multi-select-options-new">
            {/* Search functionality */}
            <div className="options-search">
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ height: '40px' }}>
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="options-list-new">
              {options.map((option) => (
                <label key={option.value} className="option-item-new">
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleCheckboxChange(option.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="option-label-new">{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <i className="fas fa-check text-primary ms-auto"></i>
                  )}
                </label>
              ))}

              {options.length === 0 && (
                <div className="no-options">
                  <i className="fas fa-info-circle me-2"></i>
                  No {title.toLowerCase()} available
                </div>
              )}
            </div>

            {/* Footer with count */}
            {selectedValues.length > 0 && (
              <div className="options-footer">
                <small className="text-muted">
                  {selectedValues.length} of {options.length} selected
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Course = ({ selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const [showTrainerModal, setShowTrainerModal] = useState(false)
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [isTrainerDropdownOpen, setIsTrainerDropdownOpen] = useState(false);

  const [permissions, setPermissions] = useState()
  useEffect(() => {
    updatedPermission()
  }, [])
  const updatedPermission = async () => {
    const response = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token }
    });
    if (response.data.status) {
      setPermissions(response.data.permissions);
    }
  }
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
  const [loading, setLoading] = useState(false);
  const [assigningTrainers, setAssigningTrainers] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Show alert
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 5000);
  };

  useEffect(() => {
    fetchTrainers()
  }, [])

  const fetchTrainers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${backendUrl}/college/trainer/trainers`,
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );
      // console.log("fetch trainers", response.data)


      if (response.data.status && response.data.data) {
        setTrainers(response.data.data);
      } else {
        setTrainers([]);
        showAlert(response.data.message || 'No trainers found', 'warning');
      }

    } catch (error) {
      console.error('Error fetching trainers:', error);
      showAlert(
        error?.response?.data?.message || 'Failed to fetch trainers',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };


  const handleAssignTrainer = async () =>{
    try{
      if (!selectedCourse || !selectedCourse._id) {
        showAlert('Please select a course first', 'error');
        return;
      }

      if (selectedTrainers.length === 0) {
        showAlert('Please select at least one trainer', 'warning');
        return;
      }
      setLoading(true);
      const response = await axios.post(`${backendUrl}/college/assigntrainerstocourse`, {
        courseId: selectedCourse._id,
        trainers: selectedTrainers
      }, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });
      if(response.data.status){
        showAlert(response.data.message, 'success');
        setIsTrainerDropdownOpen(false);
        setSelectedTrainers([]);
        setSelectedCourse(null);
        
        // Refresh courses list
        await fetchCourses();
      }
      else{
        showAlert(response.data.message, 'error');
      }
    }
    catch(err){
      console.error('Error in handleAssignTrainer:', err);
      showAlert(err?.response?.data?.message || 'Failed to assign trainers', 'error');
    }
    finally {
      setLoading(false);
    }
  }


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
    // Get IDs from props or URL
    const centerId = selectedCenter?._id || new URLSearchParams(window.location.search).get('centerId');
    const projectId = selectedProject?._id || new URLSearchParams(window.location.search).get('projectId');

    if (centerId && projectId && token) {
      fetchCourses();
    } else {
      console.log('Missing centerId, projectId, or token for fetching courses');
    }
  }, [selectedCenter?._id, selectedProject?._id, token]);

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
      // Get IDs from props or URL (for refresh cases)
      const centerId = selectedCenter?._id || new URLSearchParams(window.location.search).get('centerId');
      const projectId = selectedProject?._id || new URLSearchParams(window.location.search).get('projectId');

      if (!centerId || !projectId) {
        console.warn('Missing centerId or projectId for fetching courses');
        setCourses([]);
        return;
      }

      const headers = {
        'x-auth': token,
      };

      const response = await axios.get(`${backendUrl}/college/all_courses_centerwise`, {
        params: {
          centerId: centerId,
          projectId: projectId
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

    // Clear all existing params first
    url.searchParams.delete('stage');
    url.searchParams.delete('courseId');
    url.searchParams.delete('courseName');
    url.searchParams.delete('centerId');
    url.searchParams.delete('centerName');
    url.searchParams.delete('projectId');
    url.searchParams.delete('projectName');
    url.searchParams.delete('verticalId');
    url.searchParams.delete('verticalName');
    url.searchParams.delete('batchId');
    url.searchParams.delete('batchName');

    // Set new params
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.set(key, params[key]);
      }
    });

    window.history.replaceState({}, '', url);
  };

  // ======== ADD THESE NEW FUNCTIONS FOR BATCH NAVIGATION ========
  // Function to handle course click for batches
  const handleCourseClick = (course) => {
    setSelectedCourseForBatches(course);
    setShowBatches(true);

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
  }, [courses, selectedCenter, selectedProject, selectedVertical]);

  // Function to go back to courses view
  const handleBackToCourses = () => {
    setShowBatches(false);
    setSelectedCourseForBatches(null);

    // Update URL to course view - only set essential parameters, not names
    updateURL({
      stage: 'course',
      centerId: selectedCenter?._id,
      projectId: selectedProject?._id,
      verticalId: selectedVertical?.id
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
  return (
    <div className="container py-4">
      {/* Alert Display */}
      {alert.show && (
        <div className={`alert alert-${alert.type === 'error' ? 'danger' : alert.type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`} 
             role="alert" 
             style={{ zIndex: 9999, minWidth: '300px' }}>
          <i className={`fas fa-${alert.type === 'success' ? 'check-circle' : alert.type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2`}></i>
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert({ show: false, message: '', type: '' })}></button>
        </div>
      )}

      {/* ======== ADD THIS: Back Button and Header ======== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className='d-md-block d-none'>
          <div className="d-flex align-items-center gap-3">

            <div className='d-flex align-items-center'>
              <h5 style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={onBackToVerticals} className="me-2">{selectedVertical.name} Vertical</h5>
              <span className="mx-2"> &gt; </span>
              <h5 style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={onBackToProjects} className="breadcrumb-item mb-0" aria-current="page">
                {selectedProject.name} Project
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={onBackToCenters} className="breadcrumb-item mb-0" aria-current="page">
                {selectedCenter.name} Centers
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 className="breadcrumb-item mb-0" aria-current="page" style={{ fontSize: '0.9rem' }}>
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
          {((permissions?.custom_permissions?.can_add_course && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (

            <button className="btn btn-info bg-transparent" onClick={handleAdd}>Add Course</button>
          )}
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
                          <p className="text-muted mb-1">{course.name}</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        {course.trainers && course.trainers.length > 0 && (
                          <p className="text-muted small mb-1">
                            <i className="bi bi-people me-1"></i>
                            <strong>Trainers:</strong> {course.trainers.map(t => t.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className={`${course.status === 'active' ? 'text-success' : 'text-secondary'}`}>
                          {course.status}
                        </span>

                        <span className="bg-primary">{course.sectors && course.sectors.length > 0 ? course.sectors[0].name : 'N/A'}
                        </span>
                        
                        {course.trainers && course.trainers.length > 0 && (
                          <span className="badge bg-info text-dark">
                            <i className="bi bi-people-fill me-1"></i>
                            {course.trainers.length} Trainer{course.trainers.length > 1 ? 's' : ''}
                          </span>
                        )}

                      </div>

                    </div>
                    <div className="text-end d-flex">
                      {/* <button className="btn btn-sm btn-light me-1 border-0 bg-transparent" title="Share" onClick={(e) => { e.stopPropagation(); }}> */}
                      <button 
                        className="btn btn-sm btn-light me-1 border-0 bg-transparent" 
                        title="Select Trainers" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(course);
                          // Pre-select already assigned trainers
                          const assignedTrainerIds = course.trainers?.map(t => t._id) || [];
                          setSelectedTrainers(assignedTrainerIds);
                          setIsTrainerDropdownOpen(true);
                        }}
                      >
                        <i className="bi bi-people"></i>
                      </button>

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

      {/* Trainer Selection Modal */}
      {isTrainerDropdownOpen && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-lg justify-content-center" style={{ margin: 'auto' }}>
            <div className="modal-content p-0">
              <div className="modal-header">
                <h1 className="modal-title fs-5">
                  <i className="fas fa-users me-2"></i>
                  Select Trainers {selectedCourse && `for ${selectedCourse.name}`}
                </h1>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setIsTrainerDropdownOpen(false);
                    setSelectedTrainers([]);
                    setSelectedCourse(null);
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{minHeight: '200px'}}>
                {/* Currently assigned trainers info */}
                {selectedCourse?.trainers && selectedCourse.trainers.length > 0 && (
                  <div className="alert alert-info mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-info-circle me-2"></i>
                      Currently Assigned Trainers:
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedCourse.trainers.map(trainer => (
                        <span key={trainer._id} className="badge bg-primary fs-6 px-2 py-1">
                          {trainer.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <MultiSelectCheckbox
                  title="Available Trainers"
                  options={trainers.map(trainer => ({
                    value: trainer._id,
                    label: trainer.name
                  }))}
                  selectedValues={selectedTrainers}
                  onChange={setSelectedTrainers}
                  icon="fas fa-users"
                  isOpen={true}
                  onToggle={() => {}}
                />
                
                {/* Selected trainers display */}
                {selectedTrainers.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-success">
                      <i className="fas fa-check-circle me-2"></i>
                      Selected Trainers ({selectedTrainers.length}):
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedTrainers.map(trainerId => {
                        const trainer = trainers.find(t => t._id === trainerId);
                        return (
                          <span key={trainerId} className="badge bg-success fs-6 px-3 py-2">
                            <i className="fas fa-user me-1"></i>
                            {trainer?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsTrainerDropdownOpen(false);
                    setSelectedTrainers([]);
                    setSelectedCourse(null);
                  }}
                >
                  <i className="fas fa-times me-2"></i>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  disabled={selectedTrainers.length === 0 || assigningTrainers}
                  onClick={handleAssignTrainer}
                >
                  {assigningTrainers ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Assign Trainer ({selectedTrainers.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
        h5{
        font-size:0.9rem;
        }
        
        .multi-select-container-new {
          position: relative;
          width: 100%;
        }
        
        .multi-select-dropdown-new {
          position: relative;
          width: 100%;
        }
        
        .multi-select-trigger {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          background: white !important;
          border: 1px solid #ced4da !important;
          border-radius: 0.375rem !important;
          padding: 0.375rem 0.75rem !important;
          font-size: 0.875rem !important;
          min-height: 38px !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .multi-select-trigger:hover {
          border-color: #86b7fe !important;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
        }
        
        .multi-select-trigger.open {
          border-color: #86b7fe !important;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
        }
        
        .multi-select-trigger:focus {
          outline: none;
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        .multi-select-trigger:active {
          transform: translateY(1px);
        }
        
        .select-display-text {
          flex: 1;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .dropdown-arrow {
          transition: transform 0.2s ease;
          margin-left: 0.5rem;
        }
        
        .multi-select-trigger.open .dropdown-arrow {
          transform: rotate(180deg);
        }
        
        .multi-select-options-new {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1;
          background: white;
          border: 1px solid #ced4da;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          transform-origin: top;
          animation: dropdownOpen 0.15s ease-out;
        }
        
        @keyframes dropdownOpen {
          0% {
            opacity: 0;
            transform: scaleY(0.8);
          }
          100% {
            opacity: 1;
            transform: scaleY(1);
          }
        }
        
        .options-search {
          padding: 0.5rem;
          border-bottom: 1px solid #e9ecef;
        }
        
        .options-list-new {
          max-height: 180px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        .options-list-new::-webkit-scrollbar {
          width: 6px;
        }
        
        .options-list-new::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .options-list-new::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .options-list-new::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .option-item-new {
          display: flex !important;
          align-items: center;
          padding: 0.5rem 0.75rem;
          margin: 0;
          cursor: pointer;
          transition: background-color 0.15s ease;
          border-bottom: 1px solid #f8f9fa;
        }
        
        .option-item-new:last-child {
          border-bottom: none;
        }
        
        .option-item-new:hover {
          background-color: #f8f9fa;
        }
        
        .option-item-new input[type="checkbox"] {
          margin: 0 0.5rem 0 0 !important;
          cursor: pointer;
          accent-color: #0d6efd;
        }
        
        .option-item-new input[type="checkbox"]:focus {
          outline: 2px solid #86b7fe;
          outline-offset: 2px;
        }
        
        .option-label-new {
          flex: 1;
          font-size: 0.875rem;
          color: #495057;
          cursor: pointer;
        }
        
        .option-item-new input[type="checkbox"]:checked + .option-label-new {
          font-weight: 500;
          color: #0d6efd;
        }
        
        .options-footer {
          padding: 0.5rem 0.75rem;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
          text-align: center;
        }
        
        .no-options {
          padding: 1rem;
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }
        
        .badge.bg-primary {
          background-color: #0d6efd !important;
          font-size: 0.75rem;
          padding: 0.25em 0.4em;
        }
        
        /* Loading state */
        .multi-select-loading {
          pointer-events: none;
          opacity: 0.6;
        }
        
        .multi-select-loading .dropdown-arrow {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .multi-select-options-new {
            max-height: 250px;
          }
          
          .options-list-new {
            max-height: 150px;
          }
        }
        `}
      </style>
    </div>
  );
};

export default Course;