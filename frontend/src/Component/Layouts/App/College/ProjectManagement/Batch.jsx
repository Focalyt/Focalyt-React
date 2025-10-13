import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import axios from 'axios'
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';

import Student from '../../../../Layouts/App/College/ProjectManagement/Student';
const useNavHeight = (dependencies = []) => {
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(140); // Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);

  const calculateHeight = useCallback(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      setNavHeight(height);
      console.log('Nav height updated:', height + 'px');
    }
  }, []);

  const calculateWidth = useCallback(() => {

    if (widthRef.current) {
      const width = widthRef.current.offsetWidth;
      setWidth(width);
      console.log('Width updated:', width + 'px');
    }
  }, []);


  useEffect(() => {
    // Initial calculation
    calculateHeight();
    calculateWidth();
    // Resize listener
    const handleResize = () => {
      setTimeout(calculateHeight, 100);
      setTimeout(calculateWidth, 100);
    };

    // Mutation observer for nav content changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateHeight, 50);
      setTimeout(calculateWidth, 50);
    });

    window.addEventListener('resize', handleResize);

    if (navRef.current) {
      observer.observe(navRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateHeight, calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateHeight, 50);
    setTimeout(calculateWidth, 50);
  }, dependencies);

  return { navRef, navHeight, calculateHeight, width };
};
const useMainWidth = (dependencies = []) => {// Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);

  const calculateWidth = useCallback(() => {

    if (widthRef.current) {
      const width = widthRef.current.offsetWidth;
      setWidth(width);
      console.log('Width updated:', width + 'px');
    }
  }, []);


  useEffect(() => {
    calculateWidth();
    // Resize listener
    const handleResize = () => {
      setTimeout(calculateWidth, 100);
    };

    // Mutation observer for nav content changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateWidth, 50);
    });

    window.addEventListener('resize', handleResize);

    if (widthRef.current) {
      observer.observe(widthRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateWidth, 100);
  }, dependencies);

  return { widthRef, width };
};
const useScrollBlur = (navbarHeight = 140) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const shouldBlur = currentScrollY > navbarHeight / 3;

      setIsScrolled(shouldBlur);
      setScrollY(currentScrollY);
    };

    // Throttle scroll event for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [navbarHeight]);

  return { isScrolled, scrollY, contentRef };
};
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
const Batch = ({ selectedCourse = null, onBackToCourses = null, selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const [permissions, setPermissions] = useState();
  useEffect(() => {
    updatedPermission()
  }, [])

  const updatedPermission = async () => {
    const response = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token }
    });
    console.log('response')
    if (response.data.status) {
      setPermissions(response.data.permissions);
    }
  }

  // State to store batches
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Main tab state
  const [mainTab, setMainTab] = useState('Batches'); // 'Batches' or 'All Admissions'


  const [trainers, setTrainers] = useState([]);
  const [showTrainerModal, setShowTrainerModal] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [isTrainerDropdownOpen, setIsTrainerDropdownOpen] = useState(false);
  const [selectedBatchForTrainer, setSelectedBatchForTrainer] = useState(null);
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
    }
  };


  // This was causing the modal to not open properly
  // useEffect(()=>{
  //   handleAssignTrainers()
  // },[selectedBatchForTrainer])

  const handleAssignTrainers = async () => {
    if (!selectedBatchForTrainer) {
      showAlert('Please select a batch first', 'error');
      return;
    }

    if (selectedTrainers.length === 0) {
      showAlert('Please select at least one trainer', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // console.log('Assigning trainers:', selectedTrainers);
      const response = await axios.post(`${backendUrl}/college/assigntrainerstobatch`, {
        batchId: selectedBatchForTrainer._id,
        trainers: selectedTrainers
      }, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status) {
        showAlert('Trainers assigned successfully!', 'success');
        setIsTrainerDropdownOpen(false);
        setSelectedTrainers([]);
        setSelectedBatchForTrainer(null);
        
        // Refresh batches list
        const batchesResponse = await axios.get(`${backendUrl}/college/get_batches`, {
          params: {
            courseId: selectedCourse?._id,
            centerId: selectedCenter?._id
          },
          headers: {
            'x-auth': token
          }
        });
        
        if (batchesResponse.data.success) {
          setBatches(batchesResponse.data.data);
        }
      } else {
        showAlert(response.data.message || 'Failed to assign trainers', 'error');
      }

    } catch (error) {
      console.error('Error in handleAssignTrainers:', error);
      showAlert(
        error?.response?.data?.message || 'Failed to assign trainers',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };


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
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  // CRM Dashboard exact same states for admissions
  const [allAdmissions, setAllAdmissions] = useState([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [loadingAdmissions, setLoadingAdmissions] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [showPopup, setShowPopup] = useState(null);

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

  const [seletectedStatus, setSelectedStatus] = useState('');
  const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
  const [showStudents, setShowStudents] = useState(false);
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState(null);

  const [subStatuses, setSubStatuses] = useState([


  ]);

  const [activeCrmFilter, setActiveCrmFilter] = useState(0);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showFollowupPanel, setShowFollowupPanel] = useState(false);
  const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [leadHistoryPanel, setLeadHistoryPanel] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);

  // Documents specific state
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentRotation, setDocumentRotation] = useState(0);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);


  // open model for upload documents 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);

  // URL-based state management for batch component
  const getURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      stage: urlParams.get('stage') || 'batch',
      batchId: urlParams.get('batchId'),
      batchName: urlParams.get('batchName'),
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
    url.searchParams.delete('batchId');
    url.searchParams.delete('batchName');
    url.searchParams.delete('courseId');
    url.searchParams.delete('courseName');
    url.searchParams.delete('centerId');
    url.searchParams.delete('centerName');
    url.searchParams.delete('projectId');
    url.searchParams.delete('projectName');
    url.searchParams.delete('verticalId');
    url.searchParams.delete('verticalName');

    // Set new params
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.set(key, params[key]);
      }
    });

    window.history.replaceState({}, '', url);
  };

  // Function to handle batch click for students
  const handleBatchClick = (batch) => {
    setSelectedBatchForStudents(batch);
    setShowStudents(true);

    updateURL({
      stage: 'student',
      batchId: batch._id,
      batchName: batch.name,
      courseId: selectedCourse?._id,
      courseName: selectedCourse?.name,
      centerId: selectedCenter?._id,
      centerName: selectedCenter?.name,
      projectId: selectedProject?._id,
      projectName: selectedProject?.name,
      verticalId: selectedVertical?.id,
      verticalName: selectedVertical?.name
    });
  };

  // Function to go back to batches view
  const handleBackToBatches = () => {
    setShowStudents(false);
    setSelectedBatchForStudents(null);
    updateURL({
      stage: 'batch',
      courseId: selectedCourse?._id,
      courseName: selectedCourse?.name,
      centerId: selectedCenter?._id,
      centerName: selectedCenter?.name,
      projectId: selectedProject?._id,
      projectName: selectedProject?.name,
      verticalId: selectedVertical?.id,
      verticalName: selectedVertical?.name
    });
  };

  const formatDateForState = (date) => {
    if (!date) return null;
    if (typeof date === 'string') {
      return new Date(date);
    }
    return date;
  };

  const addDays = (date, days) => {
    if (!date) return null;
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const zeroPeriodMinEndDate = formData.zeroPeriodStartDate ? addDays(formData.zeroPeriodStartDate, 7) : null;
  const batchMinEndDate = formData.startDate ? addDays(formData.startDate, 7) : null;
  const batchMinStartDate = formData.zeroPeriodEndDate ? addDays(formData.zeroPeriodEndDate, 1) : today;
  const [batches, setBatches] = useState([]);

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed, mainContentClass, mainTab]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
  const { widthRef, width } = useMainWidth([isFilterCollapsed, mainContentClass, mainTab]);

  // Exact same tabs as CRM Dashboard
  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History',
    'Documents'
  ];





  useEffect(() => {
    fetchSubStatus()

  }, [seletectedStatus]);

  // URL-based state restoration logic
  useEffect(() => {
    const urlParams = getURLParams();
    console.log('Batch component - URL params:', urlParams);

    // Only restore state if batches are loaded
    if (batches.length === 0) {
      console.log('Batches not loaded yet, skipping state restoration');
      return;
    }

    if (urlParams.stage === "student" && urlParams.batchId) {
      // Find batch from current batches list
      const batch = batches.find(b => b._id === urlParams.batchId);

      if (batch) {
        setSelectedBatchForStudents(batch);
        setShowStudents(true);
        console.log('Restored to student view for batch:', batch.name);
      }
      else {
        // Batch not found, reset to batch view
        console.warn('Batch not found in current list, resetting to batch view');
        updateURL({
          stage: 'batch',
          courseId: selectedCourse?._id,
          courseName: selectedCourse?.name,
          centerId: selectedCenter?._id,
          centerName: selectedCenter?.name,
          projectId: selectedProject?._id,
          projectName: selectedProject?.name,
          verticalId: selectedVertical?.id,
          verticalName: selectedVertical?.name
        });
        setShowStudents(false);
      }
    } else {
      // Default to batch view
      setShowStudents(false);
      if (urlParams.stage !== 'batch') {
        updateURL({
          stage: 'batch',
          courseId: selectedCourse?._id,
          courseName: selectedCourse?.name,
          centerId: selectedCenter?._id,
          centerName: selectedCenter?.name,
          projectId: selectedProject?._id,
          projectName: selectedProject?.name,
          verticalId: selectedVertical?.id,
          verticalName: selectedVertical?.name
        });
      }
      console.log('Restored to batch view');
    }
  }, [batches, selectedCourse, selectedCenter, selectedProject, selectedVertical]);

  const handleBatchAssign = async (e) => {
    if (!selectedBatch) {
      alert('Please select a batch');
      return;
    }

    // Check if student is already assigned to a batch
    if (selectedProfile?.isBatchAssigned) {
      alert('This student is already assigned to a batch!');
      return;
    }

    e?.preventDefault(); // Prevent form submission
    e?.stopPropagation(); // Stop event bubbling

    setIsBatchAssigning(true);

    console.log(selectedBatch, 'selectedBatch');
    console.log(selectedProfile, 'selectedProfile');
    try {
      const response = await axios.post(`${backendUrl}/college/candidate/assign-batch`, {
        batchId: selectedBatch,
        appliedCourseId: selectedProfile._id
      }, {
        headers: {
          'x-auth': token,
        },
      });

      if (response.data.status) {
        alert('Batch assigned successfully!');
      } else {
        alert(response.data.message || 'Failed to assign batch');
      }
    } catch (error) {
      console.error('Error assigning batch:', error);
      alert('Failed to assign batch');
    } finally {
      setIsBatchAssigning(false);
      closePanel();
      await fetchAdmissionsData();
    }


  }


  const fetchSubStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/status/${seletectedStatus}/substatus`, {
        headers: { 'x-auth': token }
      });

      console.log('response', response)

      if (response.data.success) {
        const status = response.data.data;


        setSubStatuses(response.data.data);


      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch SubStatus');
    }
  };
  const [showPanel, setShowPanel] = useState(null);

  const closePanel = () => {
    setShowPanel(null);
    setSelectedProfile(null);
    setMainContentClass('col-12');
  };

  const handleBatchChange = (e) => {
    console.log(e.target.value, 'e.target.value');
    setSelectedBatch(e.target.value);
  }


  const renderBatchAssignPanel = () => {
    // Check if student is already assigned to a batch
    const isAlreadyAssigned = selectedProfile?.isBatchAssigned;

    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary"></i>
            </div>
            <h6 className="mb-0 followUp fw-medium">
              {showPanel === 'BatchAssign' && (`Assign Batch`)}
            </h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closePanel}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
          </div>
        </div>

        <div className="card-body">
          {isAlreadyAssigned ? (
            // Show message if already assigned
            <div className="text-center py-4">
              <div className="mb-3">
                <i className="fas fa-check-circle text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <h6 className="text-success mb-2">Student Already Assigned</h6>
              <p className="text-muted mb-0">
                This student is already assigned to a batch and cannot be reassigned.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closePanel}
                  style={{ padding: '8px 24px', fontSize: '14px' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          ) : (
            // Show batch assignment form if not assigned
            <form>
              <div className="mb-1">
                <label htmlFor="counselor" className="form-label small fw-medium text-dark">
                  Select Batch<span className="text-danger">*</span>
                </label>
                <div className="d-flex">
                  <div className="form-floating flex-grow-1">
                    <select
                      className="form-select border-0 bgcolor"
                      id="counselor"
                      required
                      disabled={isBatchAssigning}
                      style={{
                        height: '42px',
                        paddingTop: '8px',
                        paddingInline: '10px',
                        width: '100%',
                        backgroundColor: '#f1f2f6'
                      }}
                      onChange={handleBatchChange}
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch, index) => (
                        <option key={index} value={batch._id}>{batch.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn"
                  disabled={isBatchAssigning}
                  style={{ border: '1px solid #ddd', padding: '8px 24px', fontSize: '14px' }}
                  onClick={closePanel}
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  className="btn text-white"
                  disabled={isBatchAssigning || !selectedBatch}
                  onClick={(e) => handleBatchAssign(e)}
                  style={{
                    backgroundColor: isBatchAssigning || !selectedBatch ? '#ccc' : '#fd7e14',
                    border: 'none',
                    padding: '8px 24px',
                    fontSize: '14px'
                  }}
                >
                  {isBatchAssigning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Assigning...
                    </>
                  ) : (
                    'BatchAssign'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'BatchAssign' ? (
        <div
          className={'modal show d-block'}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              {panelContent}
            </div>
          </div>
        </div>
      ) : null;
    }

    return showPanel === 'BatchAssign' ? (
      <div className="col-12 transition-col" id="refferPanel">
        {panelContent}
      </div>
    ) : null;
  };

  const renderLeadHistoryPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-history text-primary"></i>
            </div>
            <h6 className="mb-0 fw-medium">Lead History</h6>
          </div>
          <button className="btn-close" type="button" onClick={closePanel}>
          </button>
        </div>

        <div className="card-body p-0 d-flex flex-column h-100">
          {/* Scrollable Content Area */}
          <div
            className="flex-grow-1 overflow-auto px-3 py-2"
            style={{
              maxHeight: isMobile ? '60vh' : '65vh',
              minHeight: '200px'
            }}
          >
            {selectedProfile?.logs && Array.isArray(selectedProfile.logs) && selectedProfile.logs.length > 0 ? (
              <div className="timeline">
                {selectedProfile.logs.map((log, index) => (
                  <div key={index} className="timeline-item mb-4">
                    <div className="timeline-marker">
                      <div className="timeline-marker-icon">
                        <i className="fas fa-circle text-primary" style={{ fontSize: '8px' }}></i>
                      </div>
                      {index !== selectedProfile.logs.length - 1 && (
                        <div className="timeline-line"></div>
                      )}
                    </div>

                    <div className="timeline-content">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2" style={{ flexDirection: 'column' }}>
                            <span className="bg-light text-dark border">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Unknown Date'}
                            </span>
                            <small className="text-muted">
                              <i className="fas fa-user me-1"></i>
                              Modified By: {log.user?.name || 'Unknown User'}
                            </small>
                          </div>

                          <div className="mb-2">
                            <strong className="text-dark d-block mb-1">Action:</strong>
                            <div className="text-muted small" style={{ lineHeight: '1.6' }}>
                              {log.action ? (
                                log.action.split(';').map((actionPart, actionIndex) => (
                                  <div key={actionIndex} className="mb-1">
                                    • {actionPart.trim()}
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted">No action specified</div>
                              )}
                            </div>
                          </div>

                          {log.remarks && (
                            <div>
                              <strong className="text-dark d-block mb-1">Remarks:</strong>
                              <p className="mb-0 text-muted small" style={{ lineHeight: '1.4' }}>
                                {log.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center py-5">
                <div className="mb-3">
                  <i className="fas fa-history text-muted" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                </div>
                <h6 className="text-muted mb-2">No History Available</h6>
                <p className="text-muted small mb-0">No actions have been recorded for this lead yet.</p>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="border-top px-3 py-3 bg-light">
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closePanel}
              >
                <i className="fas fa-times me-1"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'leadHistory' ? (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxHeight: '90vh' }}>
            <div className="modal-content" style={{ height: '85vh' }}>
              {panelContent}
            </div>
          </div>
        </div>
      ) : null;
    }

    return showPanel === 'leadHistory' ? (
      <div className="col-12 transition-col" id="leadHistoryPanel" style={{ height: '80vh' }}>
        {panelContent}
      </div>
    ) : null;
  };

  // Exact same functions as CRM Dashboard
  const handleTabClick = (profileIndex, tabIndex) => {
    setActiveTab(prevTabs => ({
      ...prevTabs,
      [profileIndex]: tabIndex
    }));
  };

  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
  };

  const togglePopup = (profileIndex) => {
    setShowPopup(prev => prev === profileIndex ? null : profileIndex);
  };

  // Filter batches based on current sub-tab
  const filteredBatches = batches.filter(batch => {
    // Filter by selected course if provided
    if (selectedCourse && batch.course !== selectedCourse.code) return false;

    // Filter by batch sub-tab
    if (batchSubTab === 'Active Batches' && batch.status !== 'active') return false;
    if (batchSubTab === 'Inactive Batches' && batch.status !== 'inactive') return false;
    // 'All Batches' shows everything

    // Search filter
    return batch.name.toLowerCase() ||
      batch.code.toLowerCase() ||
      batch.course.toLowerCase() ||
      batch.instructor.toLowerCase() ||
      batch.centerName.toLowerCase();
  });

  // Filter admissions based on current sub-tab and search
  useEffect(() => {
    let filtered = [...allAdmissions];

    // Filter by admission sub-tab
    if (admissionSubTab === 'Batch Assigned') {
      filtered = filtered.filter(admission => admission.isBatchAssigned === true);
    } else if (admissionSubTab === 'Pending for Batch Assigned') {
      filtered = filtered.filter(admission => admission.isBatchAssigned === false);
    }
    // 'All List' shows everything

    // Search filter


    setFilteredAdmissions(filtered);
  }, [allAdmissions, admissionSubTab, searchQuery]);

  // Fetch admissions data
  const fetchAdmissionsData = async (customSearchQuery = null) => {
    const searchParam = customSearchQuery !== null ? customSearchQuery : searchQuery;
    if (mainTab !== 'All Admissions') return;
    setIsLoadingProfiles(true);
    try {
      const response = await axios.get(`${backendUrl}/college/admission-list/${selectedCourse?._id}/${selectedCenter?._id}?name=${searchParam}`, {

        headers: {
          'x-auth': token
        }
      });

      if (response.data.success) {
        setAllAdmissions(response.data.data);
        console.log(response.data.data, 'response.data.data')
      } else {
        setError('Failed to fetch admissions data');
      }
    } catch (err) {
      console.error('Error fetching admissions:', err);
      setError('Server error while fetching admissions');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (mainTab === 'All Admissions') {
      fetchAdmissionsData();
    }
  }, [mainTab]);

  const resetForm = () => {
    setFormData(
      {
        name: '', // Batch Name
        startDate: null, // Start Date
        endDate: null, // End Date
        zeroPeriodStartDate: null, // Zero Period Start Date
        zeroPeriodEndDate: null, // Zero Period End Date
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formData.zeroPeriodStartDate && new Date(formData.zeroPeriodStartDate) < today) {
      alert('Zero Period start date cannot be in the past');
      return;
    }

    if (formData.startDate && new Date(formData.startDate) < today) {
      alert('Batch start date cannot be in the past');
      return;
    }

    // Validate Zero Period dates
    if (formData.zeroPeriodStartDate && formData.zeroPeriodEndDate) {
      const startDate = new Date(formData.zeroPeriodStartDate);
      const endDate = new Date(formData.zeroPeriodEndDate);
      const minEndDate = addDays(startDate, 7);

      if (endDate < minEndDate) {
        alert('Zero Period end date must be at least 7 days after the start date');
        return;
      }
    }

    // Validate Batch dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const minEndDate = addDays(startDate, 7);

      if (endDate < minEndDate) {
        alert('Batch end date must be at least 7 days after the start date');
        return;
      }
    }

    // Validate that batch start date is at least 1 day after zero period end date
    if (formData.zeroPeriodEndDate && formData.startDate) {
      const zeroPeriodEnd = new Date(formData.zeroPeriodEndDate);
      const batchStart = new Date(formData.startDate);
      const minBatchStart = addDays(zeroPeriodEnd, 1);

      if (batchStart < minBatchStart) {
        alert('Batch start date must be at least 1 day after zero period end date');
        return;
      }
    }

    if (editingBatch) {
      // Edit existing batch
      setBatches(prev => prev.map(b =>
        b.id === editingBatch.id
          ? {
            ...b,
            ...formData,
            courseName: '',
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
      window.alert('Batch added successfully')
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

  const getFileType = (fileUrl) => {
    if (!fileUrl) return 'unknown';
    const extension = fileUrl.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'document';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'spreadsheet';
    }
    return 'unknown';
  };

  const filterDocuments = (documents = []) => {
    // Ensure documents is always an array
    if (!Array.isArray(documents)) return [];
    if (statusFilter === 'all') return documents;

    return documents.filter(doc => {
      if (!doc.uploads || doc.uploads.length === 0) return statusFilter === 'none';

      const lastUpload = doc.uploads[doc.uploads.length - 1];
      if (!lastUpload || !lastUpload.status) return false;

      return lastUpload.status.toLowerCase() === statusFilter;
    });
  };
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;


  const [user, setUser] = useState({
    image: '',
    name: 'John Doe'
  });
  const [experiences, setExperiences] = useState([{
    jobTitle: '',
    companyName: '',
    from: null,
    to: null,
    jobDescription: '',
    currentlyWorking: false
  }]);

  const scrollLeft = () => {
    const container = document.querySelector('.scrollable-content');
    if (container) {
      const cardWidth = document.querySelector('.info-card')?.offsetWidth || 200;
      container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.querySelector('.scrollable-content');
    if (container) {
      const cardWidth = document.querySelector('.info-card')?.offsetWidth || 200;
      container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  const openEditPanel = async (profile = null, panel) => {
    console.log('panel', panel);

    if (profile) {
      setSelectedProfile(profile);
    }

    // Close all panels first
    setShowEditPanel(false);
    setShowFollowupPanel(false);
    setShowWhatsappPanel(false);

    if (panel === 'StatusChange') {
      if (profile) {
        const newStatus = profile?._leadStatus?._id || '';
        setSelectedStatus(newStatus);

        if (newStatus) {
          await fetchSubStatus(newStatus);
        }

        setSelectedSubStatus(profile?.selectedSubstatus || '');
      }
      setShowEditPanel(true);
    }
    else if (panel === 'SetFollowup') {
      setShowPopup(null)
      setShowFollowupPanel(true);
    }

    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };
  const openBatchAssignPanel = async (profile = null, panel) => {
    console.log('panel', panel);

    if (profile) {
      setSelectedProfile(profile);

    }

    setShowPopup(null)
    setShowPanel('BatchAssign');

    if (panel === 'BatchAssign') {
      setShowPanel('BatchAssign');
    }

    if (panel === 'RefferAllLeads') {

      setShowPanel('RefferAllLeads');

    } else if (panel === 'Reffer') {
      setShowPanel('Reffer');
    }

    if (!isMobile) {
      setMainContentClass('col-8');
    }


  };
  const openleadHistoryPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null)
    setShowPanel('leadHistory');
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };



  const DocumentControls = React.memo(({
    onZoomIn,
    onZoomOut,
    onRotate,
    onReset,
    onDownload,
    zoomLevel,
    fileType
  }) => {
    return (
      <div className="preview-controls">
        <button
          onClick={onZoomIn}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Zoom In"
        >
          <i className="fas fa-search-plus"></i> Zoom In
        </button>

        <button
          onClick={onZoomOut}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Zoom Out"
        >
          <i className="fas fa-search-minus"></i> Zoom Out
        </button>

        {/* Show rotation button only for images */}
        {fileType === 'image' && (
          <button
            onClick={onRotate}
            className="control-btn"
            style={{ whiteSpace: 'nowrap' }}
            title="Rotate 90°"
          >
            <i className="fas fa-redo"></i> Rotate
          </button>
        )}

        {/* Reset View Button */}
        <button
          onClick={onReset}
          className="control-btn"
          style={{ whiteSpace: 'nowrap' }}
          title="Reset View"
        >
          <i className="fas fa-sync-alt"></i> Reset
        </button>

        {/* Download Button */}
        <a
          href={onDownload}
          download
          className="control-btn"
          target="_blank"
          rel="noopener noreferrer"
          style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}
          title="Download Document"
        >
          <i className="fas fa-download"></i> Download
        </a>

        {/* Zoom Level Indicator */}
        <div className="zoom-indicator" style={{
          fontSize: '12px',
          color: '#666',
          marginLeft: '10px',
          padding: '5px 10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    );
  });


  const updateDocumentStatus = (uploadId, status) => {
    // In real app, this would make an API call
    console.log(`Updating document ${uploadId} to ${status}`);
    if (status === 'Rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    alert(`Document ${status} successfully!`);
    closeDocumentModal();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-dark';
      case 'verified': return 'text-sucess';
      case 'rejected': return 'text-danger';
      default: return 'text-secondary';
    }
  };

  const formatDate = (date) => {
    // If the date is not a valid Date object, try to convert it
    if (date && !(date instanceof Date)) {
      date = new Date(date);
    }

    // Check if the date is valid
    if (!date || isNaN(date)) return ''; // Return an empty string if invalid

    // Now call toLocaleDateString
    return date.toLocaleDateString('en-GB');
  };


  const openDocumentModal = (document) => {
    // Check if this is the same document that was already open
    const isSameDocument = selectedDocument && selectedDocument._id === document._id;

    setSelectedDocument(document);
    setShowDocumentModal(true);

    // Only reset zoom and rotation if it's a NEW document or first time opening modal
    if (!isSameDocument) {
      setDocumentZoom(1);
      setDocumentRotation(0);
      setIsNewModalOpen(true);
    } else {
      setIsNewModalOpen(false);
    }

    document.body?.classNameList.add('no-scroll');
  };





  const openUploadModal = (document) => {
    setSelectedDocumentForUpload(document);
    setShowUploadModal(true);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false)
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedDocumentForUpload(null);
    setSelectedFile(null);
    setUploadPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid file (JPG, PNG, GIF, or PDF)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size should be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };


  // Document functions


  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);

    setIsNewModalOpen(false);
    // // Only reset when actually closing modal
    setDocumentZoom(1);
    setDocumentRotation(0);
  };



  const DeleteModal = () => {
    if (!showDeleteModal || !batchToDelete) return null;

    return (
      <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered justify-content-center mx-auto">
          <div className="modal-content p-0">
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
      <div className="row">
        <div className={mainContentClass}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="d-flex align-items-center gap-3">

                <ol className="breadcrumb border-0 mb-0 small">
                  {onBackToVerticals && selectedVertical && (
                    <li className="breadcrumb-item">
                      <button
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={onBackToVerticals}
                      >
                        Verticals
                      </button>
                    </li>
                  )}
                  {onBackToProjects && selectedProject && (
                    <li className="breadcrumb-item">
                      <button
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={onBackToProjects}
                      >
                        Projects
                      </button>
                    </li>
                  )}
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
                        Courses
                      </button>
                    </li>
                  )}

                  <li
                    className="breadcrumb-item active"
                    aria-current="page"
                  >
                    Batches{" "}
                    {selectedCourse && `- ${selectedCourse.name}`}
                  </li>
                </ol>
              </div>
            </div>

            <div>
              {onBackToCourses && (
                <button className="btn btn-outline-secondary me-2" onClick={onBackToCourses}>
                  <i className="bi bi-arrow-left"></i> Back
                </button>
              )}
              {/* <button className="btn btn-outline-secondary me-2 border-0" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button> */}
              {mainTab === 'Batches' && (
                <button className="btn btn-warning" onClick={handleAdd}>Add Batch</button>
              )}
            </div>
          </div>

          {/* Main Tabs */}
          <div className="d-block justify-content-between mb-3" ref={navRef}>
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
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <input
                  type="text"
                  className="form-control w-25"
                  placeholder={`Search`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* Clear (X) button */}
                {searchQuery && !loadingAdmissions && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                    }}
                    title="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                <button
                  onClick={() => fetchAdmissionsData()}
                  className={`btn btn-outline-primary`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <i className={`fas fa-search me-1`}></i>
                  Search
                </button>
              </div>

            </div>
          </div>

          {/* Content Area */}
          {mainTab === 'Batches' ? (
            // Batches Content (existing code)
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
                              {batch.trainers && batch.trainers.length > 0 && (
                                <p className="text-muted small mb-1">
                                  <i className="bi bi-people me-1"></i>
                                  <strong>Trainers:</strong> {batch.trainers.map(t => t.name).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                              <span className={` ${batch.status === 'active' ? 'text-success' : 'text-secondary'}`}>
                                {batch.status}
                              </span>
                              <span className={`${getModeColor(batch.mode)}`}>
                                {batch.mode}
                              </span>
                              {batch.trainers && batch.trainers.length > 0 && (
                                <span className="badge bg-info text-dark">
                                  <i className="bi bi-people-fill me-1"></i>
                                  {batch.trainers.length} Trainer{batch.trainers.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-end d-flex">
                            <button
                              className="btn btn-sm btn-light me-1 border-0 bg-transparent"
                              title="Select Trainers"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatchForTrainer(batch);
                                // Pre-select already assigned trainers
                                const assignedTrainerIds = batch.trainers?.map(t => t._id) || [];
                                setSelectedTrainers(assignedTrainerIds);
                                setIsTrainerDropdownOpen(true);
                              }}
                            >
                              <i className="bi bi-people"></i>
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




                        <div className="small text-muted mt-3">
                          <div className="row">
                            <div className="col-6">
                              <i className="bi bi-calendar-event me-1"></i>Start: <strong>{new Date(batch.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            </div>
                            <div className="col-6">
                              <i className="bi bi-calendar-check me-1"></i>End: <strong>{new Date(batch.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="small text-muted mt-3">
                          <div className="row">
                            <div className="col-6">
                              <i className="bi bi-calendar-event me-1"></i>Start: <strong>{new Date(batch.zeroPeriodStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            </div>
                            <div className="col-6">
                              <i className="bi bi-calendar-check me-1"></i>End: <strong>{new Date(batch.zeroPeriodEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
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
            // Admissions Content - EXACT SAME as CRM Dashboard
            <div className="content-body" style={{
              transition: 'margin-top 0.2s ease-in-out'
            }}>
              <section className="list-view">
                <div className='row'>

                  <div className={`col-12 rounded equal-height-2 coloumn-2`}>
                    <div className="card px-3">
                      <div className="row" id="crm-main-row">
                        {isLoadingProfiles && (
                          <div className="col-12 text-center py-5">
                            <div className="d-flex flex-column align-items-center">
                              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <h5 className="text-muted">Loading profiles...</h5>
                            </div>
                          </div>
                        )}

                        {!isLoadingProfiles && (
                          <>

                            {filteredAdmissions.map((profile, profileIndex) => (
                              <div className={`card-content transition-col mb-2`} key={profileIndex}>

                                {/* Profile Header Card */}
                                <div className="card border-0 shadow-sm mb-0 mt-2">
                                  <div className="card-body px-1 py-0 my-2">
                                    <div className="row align-items-center justify-content-between">
                                      <div className="col-md-6">
                                        <div className="d-flex align-items-center">
                                          <div className="form-check me-3">
                                            <input className="form-check-input" type="checkbox" />
                                          </div>
                                          <div className="me-3">
                                            <div className="circular-progress-container" data-percent={profile.docCounts.totalRequired > 0 ? profile.docCounts.uploadPercentage : 'NA'}>
                                              <svg width="40" height="40">
                                                <circle className="circle-bg" cx="20" cy="20" r="16"></circle>
                                                <circle className="circle-progress" cx="20" cy="20" r="16"></circle>
                                              </svg>
                                              <div className="progress-text"></div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="d-flex align-items-center">
                                              <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Your Name'}</h6>
                                              {(profile?.batch?.name || profile?.isBatchAssigned) && (
                                                <span className="badge bg-success ms-2" style={{ fontSize: '10px' }}>
                                                  <i className="fas fa-check-circle me-1"></i>
                                                  Assigned
                                                </span>
                                              )}
                                            </div>
                                            <small className="text-muted">{profile._candidate?.mobile || 'Mobile Number'}</small>
                                          </div>
                                          <div style={{ marginLeft: '15px' }}>
                                            <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                              <i className="fas fa-phone"></i>
                                            </button>
                                            <button
                                              className="btn btn-outline-success btn-sm border-0"

                                              style={{ fontSize: '20px' }}
                                              title="WhatsApp"
                                            >
                                              <i className="fab fa-whatsapp"></i>
                                            </button>
                                          </div>
                                          <div style={{
                                            marginLeft: '15px',
                                            backgroundColor: `${(profile?.batch?.name || profile?.isBatchAssigned) ? 'green' : 'red'}`,
                                            margin: '0px 10px',
                                            padding: '0px 10px',
                                            borderRadius: '10px',
                                            color: 'white'
                                          }}>
                                            <h6>
                                              {profile?.batch?.name || (profile?.isBatchAssigned ? 'Batch Assigned' : 'Batch Assignment Pending')}
                                            </h6>
                                          </div>
                                        </div>
                                      </div>



                                      <div className="col-md-1 text-end d-md-none d-sm-block d-block">
                                        <div className="btn-group">

                                          <div style={{ position: "relative", display: "inline-block" }}>
                                            <button
                                              className="btn btn-sm btn-outline-secondary border-0"
                                              onClick={() => togglePopup(profileIndex)}
                                              aria-label="Options"
                                            >
                                              <i className="fas fa-ellipsis-v"></i>
                                            </button>

                                            {/* Overlay for click outside */}
                                            {showPopup === profileIndex && (
                                              <div
                                                onClick={() => setShowPopup(null)}
                                                style={{
                                                  position: "fixed",
                                                  top: 0,
                                                  left: 0,
                                                  width: "100vw",
                                                  height: "100vh",
                                                  backgroundColor: "transparent",
                                                  zIndex: 999,
                                                }}
                                              ></div>
                                            )}

                                            <div
                                              style={{
                                                position: "absolute",
                                                top: "28px", // button ke thoda niche
                                                right: "-100px",
                                                width: "170px",
                                                backgroundColor: "white",
                                                border: "1px solid #ddd",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                borderRadius: "4px",
                                                padding: "8px 0",
                                                zIndex: 1000,
                                                transform: showPopup === profileIndex ? "translateX(-70px)" : "translateX(100%)",
                                                transition: "transform 0.3s ease-in-out",
                                                pointerEvents: showPopup ? "auto" : "none",
                                                display: showPopup === profileIndex ? "block" : "none"
                                              }}
                                            >


                                              <button
                                                className="dropdown-item"
                                                style={{
                                                  width: "100%",
                                                  padding: "8px 16px",
                                                  border: "none",
                                                  background: "none",
                                                  textAlign: "left",
                                                  cursor: "pointer",
                                                  fontSize: "12px",
                                                  fontWeight: "600"
                                                }}

                                                onClick={() => {
                                                  openleadHistoryPanel(profile);
                                                  console.log('selectedProfile', profile);
                                                }}
                                              >
                                                History List
                                              </button>
                                              {!profile?.batch && !profile?.isBatchAssigned ? (
                                                <button
                                                  className="dropdown-item"
                                                  onClick={() => {
                                                    openBatchAssignPanel(profile);
                                                    console.log('selectedProfile', profile);
                                                  }}
                                                  style={{
                                                    width: "100%",
                                                    padding: "8px 16px",
                                                    border: "none",
                                                    background: "none",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "600"
                                                  }}
                                                >
                                                  Assign Batch
                                                </button>
                                              ) : (
                                                <div
                                                  className="dropdown-item"
                                                  style={{
                                                    width: "100%",
                                                    padding: "8px 16px",
                                                    border: "none",
                                                    background: "none",
                                                    textAlign: "left",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color: "#28a745",
                                                    cursor: "default"
                                                  }}
                                                >
                                                  <i className="fas fa-check-circle me-1"></i>
                                                  Batch Assigned
                                                </div>
                                              )}



                                            </div>
                                          </div>

                                          <button
                                            className="btn btn-sm btn-outline-secondary border-0"
                                            onClick={() => setLeadDetailsVisible(profileIndex)}
                                          >
                                            {leadDetailsVisible === profileIndex ? (
                                              <i className="fas fa-chevron-up"></i>
                                            ) : (
                                              <i className="fas fa-chevron-down"></i>
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      <div className="col-md-2 text-end d-md-block d-sm-none d-none">
                                        <div className="btn-group">

                                          <div style={{ position: "relative", display: "inline-block" }}>
                                            <button
                                              className="btn btn-sm btn-outline-secondary border-0"
                                              onClick={() => togglePopup(profileIndex)}
                                              aria-label="Options"
                                            >
                                              <i className="fas fa-ellipsis-v"></i>
                                            </button>

                                            {/* Overlay for click outside */}
                                            {showPopup === profileIndex && (
                                              <div
                                                onClick={() => setShowPopup(null)}
                                                style={{
                                                  position: "fixed",
                                                  top: 0,
                                                  left: 0,
                                                  width: "100vw",
                                                  height: "100vh",
                                                  backgroundColor: "transparent",
                                                  zIndex: 999,
                                                }}
                                              ></div>
                                            )}

                                            <div
                                              style={{
                                                position: "absolute",
                                                top: "28px", // button ke thoda niche
                                                right: "-100px",
                                                width: "170px",
                                                backgroundColor: "white",
                                                border: "1px solid #ddd",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                borderRadius: "4px",
                                                padding: "8px 0",
                                                zIndex: 1000,
                                                transform: showPopup === profileIndex ? "translateX(-70px)" : "translateX(100%)",
                                                transition: "transform 0.3s ease-in-out",
                                                pointerEvents: showPopup === profileIndex ? "auto" : "none",
                                                display: showPopup === profileIndex ? "block" : "none"
                                              }}
                                            >


                                              <button
                                                className="dropdown-item"
                                                style={{
                                                  width: "100%",
                                                  padding: "8px 16px",
                                                  border: "none",
                                                  background: "none",
                                                  textAlign: "left",
                                                  cursor: "pointer",
                                                  fontSize: "12px",
                                                  fontWeight: "600"
                                                }}
                                                onClick={() => openleadHistoryPanel(profile)}
                                              >
                                                History List
                                              </button>
                                              {!profile?.batch && (
                                                <button
                                                  className="dropdown-item"
                                                  style={{
                                                    width: "100%",
                                                    padding: "8px 16px",
                                                    border: "none",
                                                    background: "none",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "600"
                                                  }}
                                                  onClick={() => {
                                                    openBatchAssignPanel(profile);
                                                    console.log('selectedProfile', profile);
                                                  }}
                                                >
                                                  Assign Batch
                                                </button>)}



                                            </div>
                                          </div>



                                          <button
                                            className="btn btn-sm btn-outline-secondary border-0"
                                            onClick={() => toggleLeadDetails(profileIndex)}
                                          >
                                            {leadDetailsVisible === profileIndex ? (
                                              <i className="fas fa-chevron-up"></i>
                                            ) : (
                                              <i className="fas fa-chevron-down"></i>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Tab Navigation and Content Card */}
                                <div className="card border-0 shadow-sm mb-4">
                                  <div className="card-header bg-white border-bottom-0 py-3 mb-3">
                                    <ul className="nav nav-pills nav-pills-sm">
                                      {tabs.map((tab, tabIndex) => (
                                        <li className="nav-item" key={tabIndex}>
                                          <button
                                            className={`nav-link ${(activeTab[profileIndex] || 0) === tabIndex ? 'active' : ''}`}
                                            onClick={() => handleTabClick(profileIndex, tabIndex)}
                                          >
                                            {tab}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Tab Content - Only show if leadDetailsVisible is true */}
                                  {leadDetailsVisible === profileIndex && (
                                    <div className="tab-content">

                                      {/* Lead Details Tab */}
                                      {/* {activeTab === 0 && ( */}
                                      {(activeTab[profileIndex] || 0) === 0 && (
                                        <div className="tab-pane active" id="lead-details">
                                          {/* Your lead details content here */}
                                          <div className="scrollable-container">
                                            <div className="scrollable-content">
                                              <div className="info-card">
                                                <div className="info-group">
                                                  <div className="info-label">LEAD AGE</div>
                                                  <div className="info-value">{profile.createdAt ?
                                                    Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                    : 'N/A'}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">Lead Owner</div>
                                                  <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">COURSE / JOB NAME</div>
                                                  <div className="info-value">{profile._course?.name}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">BATCH NAME</div>
                                                  <div className="info-value">{profile.batch?.name || 'N/A'}</div>
                                                </div>
                                              </div>

                                              <div className="info-card">
                                                <div className="info-group">
                                                  <div className="info-label">TYPE OF PROJECT</div>
                                                  <div className="info-value">{profile._course?.typeOfProject}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">PROJECT</div>
                                                  <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">SECTOR</div>
                                                  <div className="info-value">{profile.sector}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">LEAD CREATION DATE</div>
                                                  <div className="info-value">{profile.createdAt ?
                                                    new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                </div>
                                              </div>

                                              <div className="info-card">
                                                <div className="info-group">
                                                  <div className="info-label">STATE</div>
                                                  <div className="info-value">{profile._course?.state}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">City</div>
                                                  <div className="info-value">{profile._course?.city}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">BRANCH NAME</div>
                                                  <div className="info-value">{profile._center?.name}</div>
                                                </div>
                                                <div className="info-group">
                                                  <div className="info-label">LEAD MODIFICATION DATE</div>
                                                  <div className="info-value">{profile.updatedAt ?
                                                    new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>


                                          <div className="scroll-arrow scroll-left d-md-none" onClick={scrollLeft}>&lt;</div>
                                          <div className="scroll-arrow scroll-right d-md-none" onClick={scrollRight}>&gt;</div>


                                          <div className="desktop-view">
                                            <div className="row g-4">

                                              <div className="col-12">
                                                <div className="scrollable-container">
                                                  <div className="scrollable-content">
                                                    <div className="info-card">
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD AGE</div>
                                                        <div className="info-value">{profile.createdAt ?
                                                          Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                          : 'N/A'}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">Lead Owner</div>
                                                        <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">COURSE / JOB NAME</div>
                                                        <div className="info-value">{profile._course?.name}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">BATCH NAME</div>
                                                        <div className="info-value">{profile.batch?.name || 'N/A'}</div>
                                                      </div>
                                                    </div>

                                                    <div className="info-card">
                                                      <div className="info-group">
                                                        <div className="info-label">TYPE OF PROJECT</div>
                                                        <div className="info-value">{profile._course?.typeOfProject}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">PROJECT</div>
                                                        <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">SECTOR</div>
                                                        <div className="info-value">{profile._course?.sectors}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD CREATION DATE</div>
                                                        <div className="info-value">{profile.createdAt ?
                                                          new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                      </div>
                                                    </div>

                                                    <div className="info-card">
                                                      <div className="info-group">
                                                        <div className="info-label">STATE</div>
                                                        <div className="info-value">{profile._course?.state}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">City</div>
                                                        <div className="info-value">{profile._course?.city}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">BRANCH NAME</div>
                                                        <div className="info-value">{profile._center?.name}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD MODIFICATION DATE</div>
                                                        <div className="info-value">{profile.updatedAt ?
                                                          new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD MODIFICATION By</div>
                                                        <div className="info-value">Mar 21, 2025 3:32 PM</div>
                                                      </div>
                                                      <div className="info-group">
                                                        <div className="info-label">Counsellor Name</div>
                                                        <div className="info-value">{profile._course?.counslername}</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="scroll-arrow scroll-left d-md-none">&lt;</div>
                                                <div className="scroll-arrow scroll-right  d-md-none">&gt;</div>

                                                <div className="desktop-view">
                                                  <div className="row">
                                                    <div className="col-xl-3 col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD AGE</div>
                                                        <div className="info-value">{profile.createdAt ?
                                                          Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) + ' Days'
                                                          : 'N/A'}</div>
                                                      </div>
                                                    </div>

                                                    <div className="col-xl-3 col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">STATE</div>
                                                        <div className="info-value">{profile._course?.state}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">CITY</div>
                                                        <div className="info-value">{profile._course?.city}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">TYPE OF PROJECT</div>
                                                        <div className="info-value">{profile._course?.typeOfProject}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">PROJECT</div>
                                                        <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">Sector</div>
                                                        <div className="info-value">{profile._course?.sectors}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">COURSE / JOB NAME</div>
                                                        <div className="info-value">{profile._course?.name}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">BATCH NAME</div>
                                                        <div className="info-value">{profile.batch?.name || 'N/A'}</div>
                                                      </div>
                                                    </div>

                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">BRANCH NAME</div>
                                                        <div className="info-value">{profile._center?.name}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">NEXT ACTION DATE</div>
                                                        <div className="info-value">
                                                          {profile.followups?.length > 0
                                                            ?
                                                            (() => {
                                                              const dateObj = new Date(profile.followups[profile.followups.length - 1].date);
                                                              const datePart = dateObj.toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                              }).replace(/ /g, '-');
                                                              const timePart = dateObj.toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true,
                                                              });
                                                              return `${datePart}, ${timePart}`;
                                                            })()
                                                            : 'N/A'}
                                                        </div>

                                                      </div>
                                                    </div>

                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD CREATION DATE</div>
                                                        <div className="info-value">{profile.createdAt ? (() => {
                                                          const dateObj = new Date(profile.createdAt);
                                                          const datePart = dateObj.toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                          }).replace(/ /g, '-');
                                                          const timePart = dateObj.toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                          });
                                                          return `${datePart}, ${timePart}`;
                                                        })() : 'N/A'}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD MODIFICATION DATE</div>
                                                        <div className="info-value">{profile.updatedAt ? (() => {
                                                          const dateObj = new Date(profile.updatedAt);
                                                          const datePart = dateObj.toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                          }).replace(/ /g, '-');
                                                          const timePart = dateObj.toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                          });
                                                          return `${datePart}, ${timePart}`;
                                                        })() : 'N/A'}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD MODIFICATION BY</div>
                                                        <div className="info-value">{profile.logs?.length ? profile.logs[profile.logs.length - 1]?.user?.name || '' : ''}
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">Counsellor Name</div>
                                                        <div className="info-value">{profile._course?.counslername}</div>
                                                      </div>
                                                    </div>
                                                    <div className="col-xl- col-3">
                                                      <div className="info-group">
                                                        <div className="info-label">LEAD OWNER</div>
                                                        <div className="info-value">{profile.registeredBy?.name || 'Self Registerd'}</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Profile Tab */}
                                      {/* {activeTab === 1 && ( */}
                                      {(activeTab[profileIndex] || 0) === 1 && (
                                        <div className="tab-pane active" id="profile">
                                          <div className="resume-preview-body">
                                            <div id="resume-download" className="resume-document">

                                              <div className="resume-document-header">
                                                <div className="resume-profile-section">
                                                  {user?.image ? (
                                                    <img
                                                      src={`${bucketUrl}/${user.image}`}
                                                      alt="Profile"
                                                      className="resume-profile-image"
                                                    />
                                                  ) : (
                                                    <div className="resume-profile-placeholder">
                                                      <i className="bi bi-person-circle"></i>
                                                    </div>
                                                  )}

                                                  <div className="resume-header-content">
                                                    <h1 className="resume-name">
                                                      {profile._candidate?.name || 'Your Name'}
                                                    </h1>
                                                    <p className="resume-title">
                                                      {profile._candidate?.personalInfo?.professionalTitle || 'Professional Title'}
                                                    </p>
                                                    <p className="resume-title">
                                                      {profile._candidate?.sex || 'Sex'}
                                                    </p>

                                                    <div className="resume-contact-details">

                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-telephone-fill"></i>
                                                        <span>{profile._candidate?.mobile}</span>
                                                      </div>


                                                      <div className="resume-contact-item">
                                                        <i className="bi bi-envelope-fill"></i>
                                                        <span>{profile._candidate?.email}</span>
                                                      </div>



                                                      {profile._candidate?.dob && (
                                                        <div className="resume-contact-item">
                                                          <i className="bi bi-calendar-heart-fill"></i>
                                                          {new Date(profile._candidate.dob).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                          })}
                                                        </div>
                                                      )}
                                                      {profile._candidate?.personalInfo?.currentAddress?.city && (
                                                        <div className="resume-contact-item">
                                                          <i className="bi bi-geo-alt-fill"></i>
                                                          <span>Current:{profile._candidate.personalInfo.currentAddress.fullAddress}</span>
                                                        </div>
                                                      )}
                                                      {profile._candidate?.personalInfo?.permanentAddress?.city && (
                                                        <div className="resume-contact-item">
                                                          <i className="bi bi-house-fill"></i>
                                                          <span>Permanent: {profile._candidate.personalInfo.permanentAddress.fullAddress}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="resume-summary">
                                                  <h2 className="resume-section-title">Professional Summary</h2>
                                                  <p>{profile._candidates?.personalInfo?.summary || 'No summary provided'}</p>
                                                </div>
                                              </div>


                                              <div className="resume-document-body">

                                                <div className="resume-column resume-left-column">

                                                  {profile._candidate?.isExperienced === false ? (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Work Experience</h2>
                                                      <div className="resume-experience-item">
                                                        <div className="resume-item-header">
                                                          <h3 className="resume-item-title">Fresher</h3>
                                                        </div>
                                                        <div className="resume-item-content">
                                                          <p>Looking for opportunities to start my career</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    profile._candidate?.experiences?.length > 0 && (
                                                      <div className="resume-section">
                                                        <h2 className="resume-section-title">Work Experience</h2>
                                                        {profile._candidate.experiences.map((exp, index) => (
                                                          <div className="resume-experience-item" key={`resume-exp-${index}`}>
                                                            <div className="resume-item-header">
                                                              {exp.jobTitle && (
                                                                <h3 className="resume-item-title">{exp.jobTitle}</h3>
                                                              )}
                                                              {exp.companyName && (
                                                                <p className="resume-item-subtitle">{exp.companyName}</p>
                                                              )}
                                                              {(exp.from || exp.to || exp.currentlyWorking) && (
                                                                <p className="resume-item-period">
                                                                  {exp.from ? new Date(exp.from).toLocaleDateString('en-IN', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                  }) : 'Start Date'}
                                                                  {" - "}
                                                                  {exp.currentlyWorking ? 'Present' :
                                                                    exp.to ? new Date(exp.to).toLocaleDateString('en-IN', {
                                                                      year: 'numeric',
                                                                      month: 'short',
                                                                    }) : 'End Date'}
                                                                </p>
                                                              )}
                                                            </div>
                                                            {exp.jobDescription && (
                                                              <div className="resume-item-content">
                                                                <p>{exp.jobDescription}</p>
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )
                                                  )}

                                                  {profile._candidate?.qualifications?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Education</h2>
                                                      {profile._candidate.qualifications.map((edu, index) => (
                                                        <div className="resume-education-item" key={`resume-edu-${index}`}>
                                                          <div className="resume-item-header">
                                                            {edu.education && (
                                                              <h3 className="resume-item-title">{edu.education}</h3>
                                                            )}
                                                            {edu.course && (
                                                              <h3 className="resume-item-title">{edu.course}</h3>
                                                            )}
                                                            {edu.universityName && (
                                                              <p className="resume-item-subtitle">{edu.universityName}</p>
                                                            )}
                                                            {edu.schoolName && (
                                                              <p className="resume-item-subtitle">{edu.schoolName}</p>
                                                            )}
                                                            {edu.collegeName && (
                                                              <p className="resume-item-subtitle">{edu.collegeName}</p>
                                                            )}
                                                            {edu.passingYear && (
                                                              <p className="resume-item-period">{edu.passingYear}</p>
                                                            )}
                                                          </div>
                                                          <div className="resume-item-content">
                                                            {edu.marks && <p>Marks: {edu.marks}%</p>}
                                                            {edu.specialization && <p>Specialization: {edu.specialization}</p>}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>


                                                <div className="resume-column resume-right-column">

                                                  {profile._candidate?.personalInfo?.skills?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Skills</h2>
                                                      <div className="resume-skills-list">
                                                        {profile._candidate.personalInfo.skills.map((skill, index) => (
                                                          <div className="resume-skill-item" key={`resume-skill-${index}`}>
                                                            <div className="resume-skill-name">{skill.skillName || skill}</div>
                                                            {skill.skillPercent && (
                                                              <div className="resume-skill-bar-container">
                                                                <div
                                                                  className="resume-skill-bar"
                                                                  style={{ width: `${skill.skillPercent}%` }}
                                                                ></div>
                                                                <span className="resume-skill-percent">{skill.skillPercent}%</span>
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}



                                                  {profile._candidate?.personalInfo?.languages?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Languages</h2>
                                                      <div className="resume-languages-list">
                                                        {profile._candidate.personalInfo.languages.map((lang, index) => (
                                                          <div className="resume-language-item" key={`resume-lang-${index}`}>
                                                            <div className="resume-language-name">{lang.name || lang.lname || lang}</div>
                                                            {lang.level && (
                                                              <div className="resume-language-level">
                                                                {[1, 2, 3, 4, 5].map(dot => (
                                                                  <span
                                                                    key={`resume-lang-dot-${index}-${dot}`}
                                                                    className={`resume-level-dot ${dot <= (lang.level || 0) ? 'filled' : ''}`}
                                                                  ></span>
                                                                ))}
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}


                                                  {profile._candidate?.personalInfo?.certifications?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Certifications</h2>
                                                      <ul className="resume-certifications-list">
                                                        {profile._candidate.personalInfo.certifications.map((cert, index) => (
                                                          <li key={`resume-cert-${index}`} className="resume-certification-item">
                                                            <strong>{cert.certificateName || cert.name}</strong>
                                                            {cert.orgName && (
                                                              <span className="resume-cert-org"> - {cert.orgName}</span>
                                                            )}
                                                            {(cert.month || cert.year) && (
                                                              <span className="resume-cert-date">
                                                                {cert.month && cert.year ?
                                                                  ` (${cert.month}/${cert.year})` :
                                                                  cert.month ?
                                                                    ` (${cert.month})` :
                                                                    cert.year ?
                                                                      ` (${cert.year})` :
                                                                      ''}
                                                              </span>
                                                            )}
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    </div>
                                                  )}


                                                  {profile._candidate?.personalInfo?.projects?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Projects</h2>
                                                      {profile._candidate.personalInfo.projects.map((proj, index) => (
                                                        <div className="resume-project-item" key={`resume-proj-${index}`}>
                                                          <div className="resume-item-header">
                                                            <h3 className="resume-project-title">
                                                              {proj.projectName || 'Project'}
                                                              {proj.year && <span className="resume-project-year"> ({proj.year})</span>}
                                                            </h3>
                                                          </div>
                                                          {proj.description && (
                                                            <div className="resume-item-content">
                                                              <p>{proj.description}</p>
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}


                                                  {profile._candidate?.personalInfo?.interest?.length > 0 && (
                                                    <div className="resume-section">
                                                      <h2 className="resume-section-title">Interests</h2>
                                                      <div className="resume-interests-tags">
                                                        {profile._candidate.personalInfo.interest.map((interest, index) => (
                                                          <span className="resume-interest-tag" key={`resume-interest-${index}`}>
                                                            {interest}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}

                                                </div>
                                              </div>


                                              {profile._candidate?.personalInfo?.declaration?.text && (
                                                <div className="resume-declaration">
                                                  <h2 className="resume-section-title">Declaration</h2>
                                                  <p>{profile._candidate.personalInfo.declaration.text}</p>

                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Job History Tab */}
                                      {/* {activeTab === 2 && ( */}
                                      {(activeTab[profileIndex] || 0) === 2 && (
                                        <div className="tab-pane active" id="job-history">
                                          <div className="section-card">
                                            <div className="table-responsive">
                                              <table className="table table-hover table-bordered job-history-table">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th>S.No</th>
                                                    <th>Company Name</th>
                                                    <th>Position</th>
                                                    <th>Duration</th>
                                                    <th>Location</th>
                                                    <th>Status</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {experiences.map((job, index) => (
                                                    <tr key={index}>
                                                      <td>{index + 1}</td>
                                                      <td>{job.companyName}</td>
                                                      <td>{job.jobTitle}</td>
                                                      <td>
                                                        {job.from ? moment(job.from).format('MMM YYYY') : 'N/A'} -
                                                        {job.currentlyWorking ? 'Present' : job.to ? moment(job.to).format('MMM YYYY') : 'N/A'}
                                                      </td>
                                                      <td>Remote</td>
                                                      <td><span className="text-success">Completed</span></td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Course History Tab */}
                                      {/* {activeTab === 3 && ( */}
                                      {(activeTab[profileIndex] || 0) === 3 && (
                                        <div className="tab-pane active" id="course-history">
                                          <div className="section-card">
                                            <div className="table-responsive">
                                              <table className="table table-hover table-bordered course-history-table">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th>S.No</th>
                                                    <th>Applied Date</th>
                                                    <th>Course Name</th>
                                                    <th>Lead Added By</th>
                                                    <th>Counsellor</th>
                                                    <th>Status</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {profile?._candidate?._appliedCourses && profile._candidate._appliedCourses.length > 0 ? (
                                                    profile._candidate._appliedCourses.map((course, index) => (
                                                      <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{new Date(course.createdAt).toLocaleDateString('en-GB')}</td>
                                                        <td>{course._course?.name || 'N/A'}</td>
                                                        <td>{course.registeredBy?.name || 'Self Registered'}</td>
                                                        <td>{course.month || ''} {course.year || ''}</td>
                                                        <td><span className="text-success">{course._leadStatus?.title || '-'}</span></td>
                                                      </tr>
                                                    ))
                                                  ) : (
                                                    <tr>
                                                      <td colSpan={6} className="text-center">No course history available</td>
                                                    </tr>
                                                  )}

                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Documents Tab */}
                                      {/* {activeTab === 4 && ( */}

                                      {(activeTab[profileIndex] || 0) === 4 && (
                                        <div className="tab-pane active" id='studentsDocuments'>
                                          {(() => {
                                            const documentsToDisplay = profile.uploadedDocs || [];
                                            const totalRequired = profile?.docCounts?.totalRequired || 0;

                                            // If no documents are required, show a message
                                            if (totalRequired === 0) {
                                              return (
                                                <div className="col-12 text-center py-5">
                                                  <div className="text-muted">
                                                    <i className="fas fa-file-check fa-3x mb-3 text-success"></i>
                                                    <h5 className="text-success">No Documents Required</h5>
                                                    <p>This course does not require any document verification.</p>
                                                  </div>
                                                </div>

                                              );
                                            }

                                            // If documents are required, show the full interface
                                            return (
                                              <div className="enhanced-documents-panel">
                                                {/* Enhanced Stats Grid */}
                                                <div className="stats-grid">
                                                  {(() => {
                                                    // Use backend counts only, remove static document fallback
                                                    const backendCounts = profile?.docCounts || {};
                                                    return (
                                                      <>
                                                        <div className="stat-card total-docs">
                                                          <div className="stat-icon">
                                                            <i className="fas fa-file-alt"></i>
                                                          </div>
                                                          <div className="stat-info">
                                                            <h4>{backendCounts.totalRequired || 0}</h4>
                                                            <p>Total Required</p>
                                                          </div>
                                                          <div className="stat-trend">
                                                            <i className="fas fa-list"></i>
                                                          </div>
                                                        </div>

                                                        <div className="stat-card uploaded-docs">
                                                          <div className="stat-icon">
                                                            <i className="fas fa-cloud-upload-alt"></i>
                                                          </div>
                                                          <div className="stat-info">
                                                            <h4>{backendCounts.uploadedCount || 0}</h4>
                                                            <p>Uploaded</p>
                                                          </div>
                                                          <div className="stat-trend">
                                                            <i className="fas fa-arrow-up"></i>
                                                          </div>
                                                        </div>

                                                        <div className="stat-card pending-docs">
                                                          <div className="stat-icon">
                                                            <i className="fas fa-clock"></i>
                                                          </div>
                                                          <div className="stat-info">
                                                            <h4>{backendCounts.pendingVerificationCount || 0}</h4>
                                                            <p>Pending Review</p>
                                                          </div>
                                                          <div className="stat-trend">
                                                            <i className="fas fa-exclamation-triangle"></i>
                                                          </div>
                                                        </div>

                                                        <div className="stat-card verified-docs">
                                                          <div className="stat-icon">
                                                            <i className="fas fa-check-circle"></i>
                                                          </div>
                                                          <div className="stat-info">
                                                            <h4>{backendCounts.verifiedCount || 0}</h4>
                                                            <p>Approved</p>
                                                          </div>
                                                          <div className="stat-trend">
                                                            <i className="fas fa-thumbs-up"></i>
                                                          </div>
                                                        </div>

                                                        <div className="stat-card rejected-docs">
                                                          <div className="stat-icon">
                                                            <i className="fas fa-times-circle"></i>
                                                          </div>
                                                          <div className="stat-info">
                                                            <h4>{backendCounts.RejectedCount || 0}</h4>
                                                            <p>Rejected</p>
                                                          </div>
                                                          <div className="stat-trend">
                                                            <i className="fas fa-arrow-down"></i>
                                                          </div>
                                                        </div>
                                                      </>
                                                    );
                                                  })()}
                                                </div>

                                                {/* Enhanced Filter Section */}
                                                <div className="filter-section-enhanced">
                                                  <div className="filter-tabs-container">
                                                    <h5 className="filter-title">
                                                      <i className="fas fa-filter me-2"></i>
                                                      Filter Documents
                                                    </h5>
                                                    <div className="filter-tabs">
                                                      {(() => {
                                                        const backendCounts = profile?.docCounts || {};
                                                        return (
                                                          <>
                                                            <button
                                                              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                                              onClick={() => setStatusFilter('all')}
                                                            >
                                                              <i className="fas fa-list-ul"></i>
                                                              All Documents
                                                              <span className="badge">{backendCounts.totalRequired || 0}</span>
                                                            </button>
                                                            <button
                                                              className={`filter-btn pending ${statusFilter === 'pending' ? 'active' : ''}`}
                                                              onClick={() => setStatusFilter('pending')}
                                                            >
                                                              <i className="fas fa-clock"></i>
                                                              Pending
                                                              <span className="badge">{backendCounts.pendingVerificationCount || 0}</span>
                                                            </button>
                                                            <button
                                                              className={`filter-btn verified ${statusFilter === 'verified' ? 'active' : ''}`}
                                                              onClick={() => setStatusFilter('verified')}
                                                            >
                                                              <i className="fas fa-check-circle"></i>
                                                              Verified
                                                              <span className="badge">{backendCounts.verifiedCount || 0}</span>
                                                            </button>
                                                            <button
                                                              className={`filter-btn rejected ${statusFilter === 'rejected' ? 'active' : ''}`}
                                                              onClick={() => setStatusFilter('rejected')}
                                                            >
                                                              <i className="fas fa-times-circle"></i>
                                                              Rejected
                                                              <span className="badge">{backendCounts.RejectedCount || 0}</span>
                                                            </button>
                                                          </>
                                                        );
                                                      })()}
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Enhanced Documents Grid */}
                                                <div className="documents-grid-enhanced">
                                                  {(() => {
                                                    // Filter documents based on status filter
                                                    const filteredDocs = filterDocuments(documentsToDisplay);

                                                    if (filteredDocs.length === 0) {
                                                      return (
                                                        <div className="col-12 text-center py-5">
                                                          <div className="text-muted">
                                                            <i className="fas fa-filter fa-3x mb-3"></i>
                                                            <h5>No Documents Found</h5>
                                                            <p>No documents match the current filter criteria.</p>
                                                          </div>
                                                        </div>
                                                      );
                                                    }

                                                    return filteredDocs.map((doc, index) => {
                                                      // Check if this is a document with upload data or just uploaded file info
                                                      const latestUpload = doc.uploads && doc.uploads.length > 0
                                                        ? doc.uploads[doc.uploads.length - 1]
                                                        : (doc.fileUrl && doc.status !== "Not Uploaded" ? doc : null);

                                                      return (
                                                        <div key={doc._id || index} className="document-card-enhanced">
                                                          <div className="document-image-container">
                                                            {latestUpload || (doc.fileUrl && doc.status !== "Not Uploaded") ? (
                                                              <>
                                                                {(() => {
                                                                  const fileUrl = latestUpload?.fileUrl || doc.fileUrl;
                                                                  const fileType = getFileType(fileUrl);

                                                                  if (fileType === 'image') {
                                                                    return (
                                                                      <img
                                                                        src={fileUrl}
                                                                        alt="Document Preview"
                                                                        className="document-image"
                                                                      />
                                                                    );
                                                                  } else if (fileType === 'pdf') {
                                                                    return (
                                                                      <div className="document-preview-icon">
                                                                        <i className="fa-solid fa-file" style={{ fontSize: '100px', color: '#dc3545' }}></i>
                                                                        <p style={{ fontSize: '12px', marginTop: '10px' }}>PDF Document</p>
                                                                      </div>
                                                                    );
                                                                  } else {
                                                                    return (
                                                                      <div className="document-preview-icon">
                                                                        <i className={`fas ${fileType === 'pdf' ? 'fa-file-word' :
                                                                          fileType === 'spreadsheet' ? 'fa-file-excel' : 'fa-file'
                                                                          }`} style={{ fontSize: '40px', color: '#6c757d' }}></i>
                                                                        <p style={{ fontSize: '12px', marginTop: '10px' }}>
                                                                          {fileType === 'document' ? 'Document' :
                                                                            fileType === 'spreadsheet' ? 'Spreadsheet' : 'File'}
                                                                        </p>
                                                                      </div>
                                                                    );
                                                                  }
                                                                })()}
                                                                <div className="image-overlay">
                                                                  <button
                                                                    className="preview-btn"
                                                                    onClick={() => openDocumentModal(doc)}
                                                                  >
                                                                    <i className="fas fa-search-plus"></i>
                                                                    Preview
                                                                  </button>
                                                                </div>
                                                              </>
                                                            ) : (
                                                              <div className="no-document-placeholder">
                                                                <i className="fas fa-file-upload"></i>
                                                                <p>No Document</p>
                                                              </div>
                                                            )}

                                                            {/* Status Badge Overlay */}
                                                            <div className="status-badge-overlay">
                                                              {(latestUpload?.status === 'Pending' || doc.status === 'Pending') && (
                                                                <span className="status-badge-new pending">
                                                                  <i className="fas fa-clock"></i>
                                                                  Pending
                                                                </span>
                                                              )}
                                                              {(latestUpload?.status === 'Verified' || doc.status === 'Verified') && (
                                                                <span className="status-badge-new verified">
                                                                  <i className="fas fa-check-circle"></i>
                                                                  Verified
                                                                </span>
                                                              )}
                                                              {(latestUpload?.status === 'Rejected' || doc.status === 'Rejected') && (
                                                                <span className="status-badge-new rejected">
                                                                  <i className="fas fa-times-circle"></i>
                                                                  Rejected
                                                                </span>
                                                              )}
                                                              {(!latestUpload && doc.status === "Not Uploaded") && (
                                                                <span className="status-badge-new not-uploaded">
                                                                  <i className="fas fa-upload"></i>
                                                                  Required
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>

                                                          <div className="document-info-section">
                                                            <div className="document-header">
                                                              <h4 className="document-title">{doc.Name || `Document ${index + 1}`}</h4>
                                                              <div className="document-actions">
                                                                {(!latestUpload) ? (
                                                                  <button className="action-btn upload-btn" title="Upload Document" onClick={() => {
                                                                    setSelectedProfile(profile); // Set the current profile
                                                                    openUploadModal(doc);        // Open the upload modal
                                                                  }}>
                                                                    <i className="fas fa-cloud-upload-alt"></i>
                                                                    Upload
                                                                  </button>
                                                                ) : (
                                                                  <button
                                                                    className="action-btn verify-btn"
                                                                    onClick={() => openDocumentModal(doc)}
                                                                    title="Verify Document"
                                                                  >
                                                                    <i className="fas fa-search"></i>
                                                                    PREVIEW
                                                                  </button>
                                                                )}
                                                              </div>
                                                            </div>

                                                            <div className="document-meta">
                                                              <div className="meta-item">
                                                                <i className="fas fa-calendar-alt text-muted"></i>
                                                                <span className="meta-text">
                                                                  {(latestUpload?.uploadedAt || doc.uploadedAt) ?
                                                                    new Date(latestUpload?.uploadedAt || doc.uploadedAt).toLocaleDateString('en-GB', {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      year: 'numeric'
                                                                    }) :
                                                                    'Not uploaded'
                                                                  }
                                                                </span>
                                                              </div>

                                                              {latestUpload && (
                                                                <div className="meta-item">
                                                                  <i className="fas fa-clock text-muted"></i>
                                                                  <span className="meta-text">
                                                                    {new Date(latestUpload.uploadedAt).toLocaleTimeString('en-GB', {
                                                                      hour: '2-digit',
                                                                      minute: '2-digit'
                                                                    })}
                                                                  </span>
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      );
                                                    });
                                                  })()}
                                                </div>


                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}

                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>

                        )}


                      </div>


                    </div>
                  </div>



                </div>
              </section>
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
            <div className="modal d-block overflowY d-flex justify-content-center align-items-centr w-100" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered modal-lg w-100 d-flex justify-content-center">
                <div className="modal-content p-0">
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
                          placeholder="Enter batch description"
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
                      <div className="col-12">
                        <div className="row border" style={{
                          margin: "0px 3px 0 2px",
                          padding: "5px 2px 5px 2px"
                        }}>
                          <h6>Zero Period Dates</h6>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Start Date</label>
                            {/* <DatePicker
                      onChange={(e) => setFormData(prev => ({ ...prev, zeroPeriodStartDate: e.target.value }))}
                      value={formatDateForState(formData.zeroPeriodStartDate)}
                      format="dd/MM/yyyy"
                      clearIcon={null}
                      className="form-control"
                      dayPlaceholder="dd"
                      monthPlaceholder="mm"
                      yearPlaceholder="yyyy"
                      calendarIcon={<i className="fas fa-calendar-alt"></i>}
                    /> */}
                            <DatePicker
                              onChange={(date) => {
                                setFormData(prev => {
                                  const newData = { ...prev, zeroPeriodStartDate: date };
                                  // If end date is less than 7 days from new start date, adjust it
                                  if (date && prev.zeroPeriodEndDate) {
                                    const minEndDate = addDays(date, 7);
                                    if (new Date(prev.zeroPeriodEndDate) < minEndDate) {
                                      newData.zeroPeriodEndDate = minEndDate;
                                    }
                                  }
                                  return newData;
                                });
                              }}
                              value={formatDateForState(formData.zeroPeriodStartDate)}
                              minDate={today}
                              format="dd/MM/yyyy"
                              clearIcon={null}
                              className="form-control"
                              dayPlaceholder="dd"
                              monthPlaceholder="mm"
                              yearPlaceholder="yyyy"
                              calendarIcon={<i className="fas fa-calendar-alt"></i>}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">End Date</label>
                            <DatePicker
                              onChange={!formData.zeroPeriodStartDate ? null : (date) => {
                                setFormData(prev => {
                                  const newData = { ...prev, zeroPeriodEndDate: date };
                                  // If batch start date exists and is less than 1 day after zero period end date, adjust it
                                  if (date && prev.startDate) {
                                    const minBatchStartDate = addDays(date, 1);
                                    if (new Date(prev.startDate) < minBatchStartDate) {
                                      newData.startDate = minBatchStartDate;
                                      // Also adjust batch end date if needed
                                      if (prev.endDate) {
                                        const minBatchEndDate = addDays(minBatchStartDate, 7);
                                        if (new Date(prev.endDate) < minBatchEndDate) {
                                          newData.endDate = minBatchEndDate;
                                        }
                                      }
                                    }
                                  }
                                  return newData;
                                });
                              }}
                              value={formData.zeroPeriodStartDate ? formatDateForState(formData.zeroPeriodEndDate) : null}
                              minDate={zeroPeriodMinEndDate || today}
                              disabled={!formData.zeroPeriodStartDate}
                              format="dd/MM/yyyy"
                              clearIcon={null}
                              className={`form-control ${!formData.zeroPeriodStartDate ? 'disabled-datepicker' : ''}`}
                              dayPlaceholder="dd"
                              monthPlaceholder="mm"
                              yearPlaceholder="yyyy"
                              calendarIcon={<i className="fas fa-calendar-alt"></i>}
                            />
                          </div>
                        </div>

                      </div>

                    </div>
                    <div className="row">
                      <div className="col-12">
                        <div className="row border" style={{
                          margin: "40px 3px 0 2px",
                          padding: "5px 2px 5px 2px"
                        }}>
                          <h6>Batch Dates</h6>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Start Date</label>

                            {/* <DatePicker
                      onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                      value={formatDateForState(formData.startDate)}
                      format="dd/MM/yyyy"
                      clearIcon={null}
                      className="form-control"
                      dayPlaceholder="dd"
                      monthPlaceholder="mm"
                      yearPlaceholder="yyyy"
                      calendarIcon={<i className="fas fa-calendar-alt"></i>}
                    /> */}
                            <DatePicker
                              onChange={(date) => {
                                setFormData(prev => {
                                  const newData = { ...prev, startDate: date };
                                  // If end date is less than 7 days from new start date, adjust it
                                  if (date && prev.endDate) {
                                    const minEndDate = addDays(date, 7);
                                    if (new Date(prev.endDate) < minEndDate) {
                                      newData.endDate = minEndDate;
                                    }
                                  }
                                  return newData;
                                });
                              }}
                              value={formatDateForState(formData.startDate)}
                              minDate={batchMinStartDate}
                              format="dd/MM/yyyy"
                              clearIcon={null}
                              className="form-control"
                              dayPlaceholder="dd"
                              monthPlaceholder="mm"
                              yearPlaceholder="yyyy"
                              calendarIcon={<i className="fas fa-calendar-alt"></i>}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">End Date</label>
                            <DatePicker
                              onChange={!formData.startDate ? null : (date) => setFormData(prev => ({ ...prev, endDate: date }))}
                              value={formData.startDate ? formatDateForState(formData.endDate) : null}
                              minDate={batchMinEndDate || batchMinStartDate}
                              disabled={!formData.startDate}
                              format="dd/MM/yyyy"
                              clearIcon={null}
                              className={`form-control ${!formData.startDate ? 'disabled-datepicker' : ''}`}
                              dayPlaceholder="dd"
                              monthPlaceholder="mm"
                              yearPlaceholder="yyyy"
                              calendarIcon={<i className="fas fa-calendar-alt"></i>}
                            />
                          </div>
                        </div>
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
                      {selectedBatch.access?.map((a, index) => (
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

          {isTrainerDropdownOpen && (
            <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-lg  justify-content-center" style={{ margin: 'auto' }}>
                <div className="modal-content p-0">
                  <div className="modal-header">
                    <div>
                      <h1 className="modal-title fs-5">
                        <i className="fas fa-users me-2"></i>
                        Select Trainers
                      </h1>
                      {selectedBatchForTrainer && (
                        <small className="text-muted">
                          Batch: <strong>{selectedBatchForTrainer.name}</strong> ({selectedBatchForTrainer.code})
                        </small>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setIsTrainerDropdownOpen(false);
                        setSelectedTrainers([]);
                        setSelectedBatchForTrainer(null);
                      }}
                    ></button>
                  </div>
                  <div className="modal-body" style={{minHeight: '200px'}}>
                    {/* Currently assigned trainers info */}
                    {selectedBatchForTrainer?.trainers && selectedBatchForTrainer.trainers.length > 0 && (
                      <div className="alert alert-info mb-3">
                        <h6 className="mb-2">
                          <i className="fas fa-info-circle me-2"></i>
                          Currently Assigned Trainers:
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedBatchForTrainer.trainers.map(trainer => (
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
                      onToggle={() => { }}
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
                        setSelectedBatchForTrainer(null);
                      }}
                    >
                      <i className="fas fa-times me-2"></i>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={selectedTrainers.length === 0 || loading}
                      onClick={handleAssignTrainers}
                    >
                      {loading ? (
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

          <style>
            {
              `

    /* Clean Sticky Header CSS - Replace your entire style section with this */

/* Main wrapper styling */
html body .content .content-wrapper {
    padding: calc(0.9rem - 0.1rem) 1.2rem;
    overflow: visible !important;
}

.bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .transition-all {
          transition: all 0.3s ease;
        }

        .nav-pills-sm .nav-link {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .sticky-top {
          position: sticky !important;
        }

        .btn-group .btn {
          border-radius: 0.375rem;
        }

        .btn-group .btn:not(:last-child) {
          margin-right: 0.25rem;
        }

        .card {
          transition: box-shadow 0.15s ease-in-out;
        }


        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .circular-progress-container {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .circular-progress-container svg {
          transform: rotate(-90deg);
        }

        .circle-bg {
          fill: none;
          stroke: #e6e6e6;
          stroke-width: 4;
        }

        .circle-progress {
          fill: none;
          stroke: #FC2B5A;
          stroke-width: 4;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }

        .circular-progress-container .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 10px;
          color: #333;
        }

        .contact-row {
          border: 1px solid #e0e0e0;
          border-radius: 2px;
          padding: 10px 15px;
          background-color: #fff;
        }

        .userCheckbox {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .contact-checkbox {
          display: flex;
          align-items: center;
        }

        .contact-name {
          font-weight: 500;
          margin-bottom: 0;
        }

        .contact-number {
          color: #888;
          font-size: 0.85rem;
        }

        .transition-col {
          transition: all 0.3s ease-in-out;
        }

        .leadsStatus {
          width: 100%;
          border-bottom: 1px solid #e0e0e0;
        }

        .leadsDetails {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-x: auto;
          white-space: nowrap;
        }

        .leadsDetails .status {
          padding: 12px 16px;
          font-size: 14px;
          color: #555;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .leadsDetails .status:hover {
          color: #000;
        }

        .leadsDetails .status.active {
          color: #333;
          font-weight: 500;
        }

        .leadsDetails .status.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #007bff;
        }

        .tab-pane {
          display: none;
        }

        .tab-pane.active {
          display: block;
        }

        .info-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-title {
          color: #495057;
          font-weight: 600;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #dee2e6;
        }
     

        .tab-pane {
          padding: 0;
          position: relative;
        }

        .scrollable-container {
          display: none;
        }

        .desktop-view {
          display: block;
        }

        .scroll-arrow {
          display: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          border: 1px solid #eaeaea;
        }

        .scroll-left {
          left: 5px;
        }

        .scroll-right {
          right: 5px;
        }
        .document-preview-icon{
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        @media (max-width: 767px) {
          .scrollable-container {
            display: block;
            width: 100%;
            overflow: hidden;
            padding: 10px 0;
          }

          .desktop-view {
            display: none;
          }

          .scrollable-content {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scroll-behavior: smooth;
            padding: 10px 0;
          }

          .info-card {
            flex: 0 0 auto;
            scroll-snap-align: start;
            margin-right: 15px;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #eaeaea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            background: #fff;
          }

          .scroll-arrow {
            display: flex;
          }

          .scrollable-content::-webkit-scrollbar {
            height: 4px;
          }

          .scrollable-content::-webkit-scrollbar-track {
            background: #f1f1f1;
          }

          .scrollable-content::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }

          .btn-group {
            flex-wrap: wrap;
          }
          
          .btn-group .btn {
            margin-bottom: 0.25rem;
          }
        }

        .whatsapp-chat {
          height: 100%;
          min-width: 300px;
          box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .right-side-panel {
          background: #ffffff !important;
          box-shadow: 0px 4px 5px rgba(0, 0, 0, 0.12), 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.04);
          width: 100%;
          height: 73dvh;
        }

        .whatsapp-chat .topbar-container {
          background-color: #fff;
          padding: 8px 16px;
          display: flex;
          /* height: 8%; */
          min-height: 43px;
          align-items: center;
          position: relative;
          justify-content: space-between;
        }

        .whatsapp-chat .topbar-container .left-topbar {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
        }

        .whatsapp-chat .topbar-container .left-topbar .img-container {
          margin-right: 12px;
        }

        .whatsapp-chat .topbar-container .left-topbar .selected-number {
          font-size: 12px;
          color: #393939;
        }

        .small-avatar {
          background: #f17e33;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          text-transform: uppercase;
          font-size: 14px;
        }

        .whatsapp-chat .chat-view {
          background: #E6DDD4;
          flex: 1;
          position: relative;
        }

        .whatsapp-chat .chat-view .chat-container {
          list-style-type: none;
          padding: 18px 10px;
          position: absolute;
          bottom: 0;
          display: flex;
          flex-direction: column;
          padding-right: 15px;
          overflow-x: hidden;
          max-height: 100%;
          margin-bottom: 0px;
          padding-bottom: 12px;
          overflow-y: scroll;
          width: 100%;
        }

        .whatsapp-chat .chat-view .counselor-msg-container {
          display: flex;
          flex-direction: column;
          align-items: end;
        }

        .whatsapp-chat .chat-view .chat-container .chatgroupdate {
          width: 92px;
          height: 24px;
          background: #DCF3FB;
          border-radius: 4px;
          margin-top: 51px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          margin-right: auto;
        }

        .whatsapp-chat .chat-view .chat-container .chatgroupdate span {
          font-size: 13px;
          color: #393939;
        }

        .whatsapp-chat .chat-view .counselor-msg {
          float: right;
          background: #D8FFC0;
          padding-right: 0;
        }

        .whatsapp-chat .chat-view .macro {
          margin-top: 12px;
          max-width: 92%;
          border-radius: 4px;
          padding: 8px;
          display: flex;
          padding-bottom: 2px;
          min-width: 22%;
          transform: scale(0);
          animation: message 0.15s ease-out 0s forwards;
        }

        @keyframes message {
          to {
            transform: scale(1);
          }
        }

        .whatsapp-chat .chat-view .text-r {
          float: right;
        }

        .whatsapp-chat .chat-view .text {
          width: 100%;
          display: flex;
          flex-direction: column;
          color: #4A4A4A;
          font-size: 12px;
        }

        .whatsapp-chat .chat-view .student-messages {
          color: #F17E33;
        }

        .whatsapp-chat .chat-view .message-header-name {
          font-weight: 600;
          font-size: 12px;
          line-height: 18px;
          color: #F17E33;
          position: relative;
          bottom: 4px;
          opacity: 0.9;
        }

        .whatsapp-chat .chat-view .text-message {
          width: 100%;
          margin-top: 0;
          margin-bottom: 2px;
          line-height: 16px;
          font-size: 12px;
          word-break: break-word;
        }

        .whatsapp-chat .chat-view pre {
          white-space: pre-wrap;
          padding: unset !important;
          font-size: unset !important;
          line-height: normal !important;
          color: #4A4A4A !important;
          overflow: unset !important;
          background-color: transparent !important;
          border: none !important;
          border-radius: unset !important;
          font-family: unset !important;
        }

        .whatsapp-chat .footer-container {
          background-color: #F5F6F6;
          box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.09);
          padding: 0;
          height: auto;
          align-items: center;
          border: none !important;
        }

        .whatsapp-chat .footer-container .footer-box {
          padding: 16px;
          background: #F5F6F6;
          border-radius: 6px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container {
          color: black;
          position: relative;
          height: 40px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container .message-input {
          background: #FFFFFF;
          border-radius: 6px 6px 0 0 !important;
          width: 100%;
          min-height: 36px;
          padding: 0px 12px;
          font-size: 12px;
          resize: none;
          position: absolute;
          bottom: 0px;
          line-height: 20px;
          padding-top: 8px;
          border: #fff;
        }

        .whatsapp-chat .footer-container .footer-box .divider {
          border: 1px solid #D8D8D8;
          margin-bottom: 0.8px !important;
          margin-top: -0.8px !important;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input {
          display: flex;
          background: #FFFFFF;
          height: 32px;
          border-radius: 0 0 6px 6px !important;
          justify-content: space-between;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-bottom-5 {
          margin-bottom: 5px;
          margin-right: 15px;
          margin-left: 10px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .margin-right-10 {
          margin-right: 10px;
        }

        .input-template {
          margin-bottom: 5px;
          margin-left: 15px;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .right-footer .send-button {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: #666;
        }

        .whatsapp-chat .footer-container .footer-box .message-container-input .left-footer .fileUploadIcon {
          cursor: pointer;
          color: #666;
          transform: translateY(15px);
        }

        .sessionExpiredMsg {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 8px 12px;
          margin: 10px 0;
          font-size: 12px;
          color: #856404;
          text-align: center;
        }

        .followUp {
          font-size: 13px;
          font-weight: 500;
          padding-left: 10px;
        }

        .section-card {
          padding: 5px;
          border-radius: 8px;
        }

        .section-title {
          color: #333;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }
.nav-pills .nav-link.active{
background: #fd2b5a;
}
        .resume-document {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border-radius: 8px;
        }

        .resume-document-header {
          margin-bottom: 30px;
        }

        .resume-profile-section {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .resume-profile-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          font-size: 40px;
          color: #999;
        }

        .resume-profile-image {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 20px;
        }

        .resume-header-content {
          flex: 1;
        }

        .resume-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }

        .resume-title {
          font-size: 16px;
          color: #666;
          margin-bottom: 10px;
        }

        .resume-contact-details {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }

        .resume-contact-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          color: #555;
        }

        .resume-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }

        .resume-section-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 5px;
        }

        .resume-document-body {
          display: flex;
          gap: 30px;
        }

        .resume-column {
          flex: 1;
        }

        .resume-section {
          margin-bottom: 25px;
        }

        .resume-experience-item,
        .resume-education-item,
        .resume-project-item {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .resume-item-header {
          margin-bottom: 10px;
        }

        .resume-item-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }

        .resume-item-subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 3px;
        }

        .resume-item-period {
          font-size: 13px;
          color: #888;
          font-style: italic;
        }

        .resume-item-content {
          font-size: 14px;
          color: #555;
          line-height: 1.5;
        }

        .resume-skills-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .resume-skill-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .resume-skill-name {
          flex: 1;
          font-size: 14px;
          color: #333;
        }

        .resume-skill-bar-container {
          flex: 2;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .resume-skill-bar {
          height: 100%;
          background: #007bff;
          border-radius: 4px;
        }

        .resume-languages-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .resume-language-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .resume-language-name {
          font-size: 14px;
          color: #333;
        }

        .resume-language-level {
          display: flex;
          gap: 3px;
        }

        .resume-level-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e0e0e0;
        }

        .resume-level-dot.filled {
          background: #007bff;
        }

        .resume-certifications-list {
          list-style: none;
          padding: 0;
        }

        .resume-certification-item {
          margin-bottom: 10px;
          font-size: 14px;
          color: #333;
        }

        .resume-cert-org {
          color: #666;
        }

        .resume-cert-date {
          color: #888;
          font-style: italic;
        }

        .resume-interests-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .resume-interest-tag {
          background: #f0f0f0;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
          color: #333;
        }

        .resume-declaration {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .highlight-text {
          color: #007bff;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .resume-document-body {
            flex-direction: column;
          }
          
          .resume-profile-section {
            flex-direction: column;
            text-align: center;
          }
          
          .resume-contact-details {
            justify-content: center;
          }
            .info-group{
            border: none;
            }
              .info-card {

                    flex: 0 0 auto;
                    scroll-snap-align: start;
                    margin-right: 15px;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #eaeaea;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    background: #fff;
                }
                    .input-height{
                    height: 40px;
                    }
                }

                
/* Mobile Modal Styles */
.modal {
    z-index: 1050;
}

.modal-dialog {
    margin: 1rem;
}

/* WhatsApp Panel Mobile Styles */
.whatsapp-chat {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.topbar-container {
    flex-shrink: 0;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f8f9fa;
}

.left-topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.small-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #007bff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.lead-name {
    font-weight: 600;
    font-size: 1rem;
}

.selected-number {
    color: #666;
    font-size: 0.9rem;
}

.right-topbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.chat-view {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f0f0f0;
}

.chat-container {
    list-style: none;
    padding: 0;
    margin: 0;
}

.counselor-msg-container {
    margin-bottom: 1.5rem;
}

.chatgroupdate {
    text-align: center;
    margin-bottom: 1rem;
}

.chatgroupdate span {
    background-color: #e3f2fd;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    color: #666;
}

.counselor-msg {
    background-color: #dcf8c6;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    max-width: 80%;
    margin-left: auto;
}

.text-message {
    white-space: pre-wrap;
    margin: 0;
    font-family: inherit;
}

.message-header-name {
    font-weight: 600;
    color: #1976d2;
}

.student-messages {
    color: #2e7d32;
}

.messageTime {
    font-size: 0.75rem;
    color: #666;
    display: block;
    text-align: right;
}

.sessionExpiredMsg {
    text-align: center;
    padding: 1rem;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.5rem;
    margin-top: 1rem;
    color: #856404;
}

.footer-container {
    flex-shrink: 0;
    border-top: 1px solid #e0e0e0;
    background-color: white;
}

.footer-box {
    padding: 1rem;
}

.message-container {
    margin-bottom: 0.5rem;
}

.message-input {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 0.5rem;
    resize: none;
    background-color: #f8f9fa;
}

.disabled-style {
    opacity: 0.6;
}

.divider {
    margin: 0.5rem 0;
    border-color: #e0e0e0;
}

.message-container-input {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bgcolor {
    background-color: #f1f2f6 !important;
}

.left-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.margin-right-10 {
    margin-right: 10px;
}

.margin-bottom-5 {
    margin-bottom: 5px;
}

.margin-horizontal-4 {
    margin: 0 4px;
}

.margin-horizontal-5 {
    margin: 0 5px;
}

.fileUploadIcon {
    width: 20px;
    height: 20px;
    opacity: 0;
    position: absolute;
    cursor: pointer;
}

.input-template {
    cursor: pointer;
}

.send-button {
    text-decoration: none;
}

.send-img {
    width: 20px;
    height: 20px;
}

#whatsappPanel {
    height: 73dvh;
}

.info-group {
    padding: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .modal-dialog {
        margin: 0.5rem;
    }

    .whatsapp-chat .modal-content {
        height: 90vh;
    }



    .nav-pills {
        flex-wrap: wrap;
    }

    .nav-pills .nav-link {
        font-size: 0.9rem;
        padding: 0.5rem 0.75rem;
    }
}

/* Additional mobile optimizations */
@media (max-width: 576px) {


    .btn-group {
        flex-wrap: wrap;
    }

    .input-group {
        max-width: 100% !important;
        margin-bottom: 0.5rem;
    }
}

/* Add this to your existing style tag or CSS file */
.react-date-picker{
padding:0 !important;

}
.react-calendar{
width: min-content !important;
height: min-content !important;
}
.react-date-picker__wrapper {
    border: 1px solid #ced4da !important;
    border-radius: 0.375rem !important;
}

.react-date-picker__inputGroup input {
    border: none !important;
    outline: none !important;
}

.react-date-picker__clear-button {
    display: none !important;
}

.react-date-picker__calendar-button {
    padding: 4px !important;
}

/* Additional styling for better appearance */
.react-date-picker__inputGroup {
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}

.react-date-picker__wrapper {
    background: white !important;
}


.no-scroll {
    overflow: hidden;
}

.modal-content {
    background-color: #fff;
    max-height: 90vh;
    width: 80%;
    overflow-y: auto;
    padding: 20px;
    border-radius: 8px;
}

.doc-iframe {
    transform-origin: top left;
    transition: transform 0.3s ease;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.admin-document-panel {
    margin: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: var(--shadow);
    overflow: hidden;
}

.panel-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    background-color: #4a6fdc;
    color: white;
}

.panel-header h2 {
    color: white;
    font-size: 1.5rem;
    margin: 0;
}

.user-selector {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
}

.candidate-info {
    background-color: #e9f0fd;
    padding: 20px;
    border-radius: 6px;
    margin: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.candidate-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #4a6fdc;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 24px;
    margin-right: 20px;
}

.candidate-details {
    flex-grow: 1;
}

.candidate-details h3 {
    margin: 0 0 5px 0;
    font-size: 22px;
    color: #333;
}

.candidate-details p {
    margin: 0 0 5px 0;
    color: #555;
}

.candidate-stats {
    display: flex;
    margin-top: 15px;
    flex-wrap: wrap;
    gap: 15px;
}

.stat-box {
    background: white;
    border-radius: 4px;
    padding: 10px 15px;
    min-width: 120px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-box h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: #666;
}

.stat-box p {
    margin: 0;
    font-size: 20px;
    font-weight: bold;
}

.document-list {
    overflow-x: auto;
    margin: 0 20px 20px 20px;
}

.document-table {
    width: 100%;
    border-collapse: collapse;
}

.document-table th {
    background-color: var(--gray-light);
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
    color: #444;
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
}



.document-table tbody tr:hover {
    background-color: #f8f9fa;
}

.document-table td {
    padding: 12px 15px;
    vertical-align: middle;
}

.status-badges {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-pending {
    background-color: #fff3cd;
    color: #856404;
}

.status-approved {
    background-color: #d4edda;
    color: #155724;
}

.status-rejected {
    background-color: #f8d7da;
    color: #721c24;
}

.action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.view-btn {
    color: var(--primary-color);
}

.view-btn:hover {
    background-color: rgba(74, 111, 220, 0.1);
}

.approve-btn {
    color: var(--success-color);
    background-color: #d4edda;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.approve-btn:hover {
    background-color: #c3e6cb;
}

.reject-btn {
    color: var(--danger-color);
    background-color: #f8d7da;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.reject-btn:hover {
    background-color: #f5c6cb;
}

/* Document Modal Styles - Add these to your existing <style jsx> section */

.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
}

.document-modal-content {
    background: white;
    border-radius: 12px;
    width: 70%;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.document-modal-content .modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e9ecef;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.document-modal-content .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
}

.document-modal-content .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.document-modal-content .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.document-modal-content .modal-body {
    padding: 2rem;
    display: flex;
    gap: 2rem;
    overflow-y: auto;
}

.document-preview-section {
    flex: 2;
    min-width: 400px;
}

.document-preview-container {
    background: #f8f9fa;
    border-radius: 8px;
    height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 2px dashed #dee2e6;
}

.document-preview-container img {
    max-width: 100%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-controls {
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px 15px;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
}

.control-btn:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

.no-document {
    text-align: center;
    color: #6c757d;
}

.document-info-section {
    flex: 1;
    /* min-width: 300px; */
}

.info-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e9ecef;
}

.info-card h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
}

.info-row {
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-row strong {
    color: #495057;
    min-width: 120px;
}

.verification-section {
    margin-top: 1.5rem;
}

.verification-steps {
    margin: 0;
    padding-left: 1.5rem;
}

.verification-steps li {
    margin-bottom: 0.5rem;
    color: #6c757d;
    line-height: 1.5;
}

.action-buttons {
    margin-top: 1.5rem;
    display: flex;
    gap: 10px;
}

.action-buttons .btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.rejection-form {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1.5rem;
}

.rejection-form h4 {
    color: #856404;
    margin: 0 0 1rem 0;
}

.rejection-form textarea {
    width: 100%;
    min-height: 100px!important;
    padding: 10px;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    resize: vertical;
}

/* .document-history {
    overflow-y: auto;
} */

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e9ecef;
}

.history-item:last-child {
    border-bottom: none;
}

.history-date {
    font-size: 0.9rem;
    color: #6c757d;
    position: absolute;
    top: 20px;
    right: 20px;
}

.history-status {
    font-size: 0.85rem;
    font-weight: 500;
    position: absolute;
    top:10px
}

/* Mobile Responsive */
@media (max-width: 768px) {
.modal-content{
width:100%;
}
    .document-modal-content {
        width: 98%;
        margin: 1rem;
        max-height: 95vh;
    }

    .document-modal-content .modal-body {
        flex-direction: column;
        padding: 1rem;
        gap: 1rem;
    }

    .document-preview-section {
        min-width: auto;
        overflow-y: auto;
    }

    .document-preview-container {
        height: 300px;
    }

    .document-info-section {
        min-width: auto;
    }
}

.m-c {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.m-h {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f9fa;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #777;
}

.m-b {
    padding: 20px;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    overflow-y: auto;
}

.document-preview {
    flex: 2;
    min-width: 400px;
    background-color: var(--gray-light);
    border-radius: 4px;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-direction: column;

}

.document-preview img {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.preview-controls {
    text-align: center;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 8px;
    border-radius: 4px;
}

.preview-controls button {
    background-color: #4a6fdc;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    margin: 0 5px;
    cursor: pointer;
}

.document-info {
    flex: 1;
    min-width: 300px;
}

.info-section {
    background-color: #f8f9fa;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
}

.info-section h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #4a6fdc;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
}

.document-info p {
    margin-bottom: 10px;
}

.document-history {
    margin-top: 20px;
}

.history-item {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #e0e0e0;
}

.history-item:last-child {
    border-bottom: none;
}

.history-item .date {
    font-size: 12px;
    color: #777;
}

.modal-actions {
    margin-top: 30px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.rejection-form {
    margin-top: 20px;
    display: none;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #dc3545;
}

.rejection-form h4 {
    margin-top: 0;
    color: #721c24;
}

.rejection-form textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 10px;
    min-height: 100px;
    resize: vertical;
}

.rejection-form button {
    margin-right: 10px;
}

.filter-bar {
    margin: 0 20px 20px 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    align-items: center;
}

.filter-label {
    font-weight: 600;
    color: #555;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    min-width: 150px;
}


.page-btn {
    background-color: white;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.page-btn:hover,
.page-btn.active {
    background-color: #4a6fdc;
    color: white;
}
/* Document History Container */
.document-history {
    width: 100%;
    max-height: 1000px;
    height: auto !important;
    padding: 0;
    position: relative;
  }
  
  /* History Item Styling */
  .document-history .history-item {
    display: block !important;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .document-history .history-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
    border-color: #007bff;
  }
  
  /* History Preview Container */
  .document-history .history-preview {
    margin-bottom: 15px;
    width: 100%;
    overflow: visible;
  }
  
  /* Auto Height for All Document Types */
  .document-history .history-preview img {
    width: 100% !important;
    height: auto !important;
    max-width: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background-color: #fff;
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  
  .document-history .history-preview img:hover {
    transform: scale(1.02);
  }
  
  /* PDF Auto Height */
  .document-history .history-preview iframe.pdf-thumbnail {
    width: 100% !important;
    height: fit-content !important;
    min-height: 750px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background-color: #fff;
    cursor: pointer;
  }
  
  /* History Info Section */
  .document-history .history-info {
    padding-top: 15px;
    border-top: 2px solid #e9ecef;
    margin-top: 10px;
  }
   

.enhanced-documents-panel {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    padding: 1.5rem;
    border-radius: 15px;
}

.candidate-header-section {
    margin-bottom: 2rem;
}

.candidate-info-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 2rem;
    position: relative;
    overflow: hidden;
}

.candidate-info-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.candidate-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.candidate-details h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
    font-weight: 700;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.contact-details span {
    color: #666;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.completion-ring {
    margin-left: auto;
    position: relative;
}

.circular-progress {
    position: relative;
}

.percentage-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.percentage {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    color: #4facfe;
}

.label {
    font-size: 0.7rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.progress-bar {
    transition: stroke-dasharray 1s ease-in-out;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    transition: all 0.3s ease;
}

.stat-card.total-docs::before {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.stat-card.uploaded-docs::before {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.pending-docs::before {
    background: linear-gradient(90deg, #fa709a 0%, #fee140 100%);
}

.stat-card.verified-docs::before {
    background: linear-gradient(90deg, #a8edea 0%, #fed6e3 100%);
}

.stat-card.rejected-docs::before {
    background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.total-docs .stat-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.uploaded-docs .stat-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.pending-docs .stat-icon {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.verified-docs .stat-icon {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.rejected-docs .stat-icon {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-info h4 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
}

.stat-info p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
}

.stat-trend {
    margin-left: auto;
    font-size: 1.2rem;
    color: #4facfe;
}

.filter-section-enhanced {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.filter-title {
    margin: 0 0 1rem 0;
    color: #333;
    font-weight: 600;
}

.filter-tabs {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-btn {
    background: #f8f9fa;
    border: 2px solid transparent;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: #666;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
}

.filter-btn .badges {
    background: #dee2e6;
    color: #495057;
    border-radius: 10px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.filter-btn:hover {
    background: #e9ecef;
    transform: translateY(-2px);
}

.filter-btn.active {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    border-color: #4facfe;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.filter-btn.active .badges {
    background: rgba(255, 255, 255, 0.2);
    color: #fc2b5a;
}

.filter-btn.pending.active {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    box-shadow: 0 5px 15px rgba(250, 112, 154, 0.4);
}

.filter-btn.verified.active {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2d7d32;
    box-shadow: 0 5px 15px rgba(168, 237, 234, 0.4);
}

.filter-btn.rejected.active {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
    box-shadow: 0 5px 15px rgba(255, 154, 158, 0.4);
}

.documents-grid-enhanced {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
}

.document-card-enhanced {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
}

.document-card-enhanced:hover {
    transform: translateY(-10px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.document-image-container {
    position: relative;
    height: 200px;
    overflow: hidden;
    background: #f8f9fa;
}

.document-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.document-card-enhanced:hover .document-image {
    transform: scale(1.05);
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.document-card-enhanced:hover .image-overlay {
    opacity: 1;
}

.preview-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: white;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.preview-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(79, 172, 254, 0.6);
}

.no-document-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #ccc;
    font-size: 3rem;
}

.no-document-placeholder p {
    margin-top: 1rem;
    font-size: 1rem;
    color: #999;
}

.status-badges-overlay {
    position: absolute;
    top: 15px;
    right: 15px;
}

.status-badges-new {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.status-badges-new.pending {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
}

.status-badges-new.verified {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #2d7d32;
}

.status-badges-new.rejected {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
}

.status-badges-new.not-uploaded {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.document-info-section {
    padding: 1.5rem;
}

.document-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.document-title {
    margin: 0;
    color: #333;
    font-size: 0.9rem;
    font-weight: 700;
    flex: 1;
}

.document-actions {
    margin-left: 1rem;
}

.action-btn {
    border: none;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.upload-btn {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(250, 112, 154, 0.4);
}

.verify-btn {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    color: #c62828;
    box-shadow: 0 3px 10px rgba(255, 154, 158, 0.4);
}

.view-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    box-shadow: 0 3px 10px rgba(79, 172, 254, 0.4);
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.document-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
}

.meta-text {
    color: #333;
}
  /* Responsive Design */
  @media (max-width: 1200px) {
    .document-history .history-preview iframe.pdf-thumbnail {
      height: auto !important;
      max-height: 600px;
    }
  }

@media (max-width: 768px) {
    .enhanced-documents-panel {
        padding: 1rem;
    }

    .candidate-info-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .completion-ring {
        margin-left: 0;
    }

    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .documents-grid-enhanced {
        grid-template-columns: 1fr;
    }

    .filter-tabs {
        justify-content: center;
    }

    .document-header {
        flex-direction: column;
        gap: 1rem;
    }

    .document-actions {
        margin-left: 0;
        align-self: stretch;
    }

    .action-btn {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 768px) {
    .document-history .history-preview iframe.pdf-thumbnail {
      height: 50vh !important;
      min-height: 300px;
      max-height: 500px;
    }
    
    .document-history .history-item {
      padding: 12px;
      margin-bottom: 12px;
    }
  }

@media (max-width: 768px) {
    .panel-header {
        flex-direction: column;
        align-items: stretch;
    }

    .m-b {
        flex-direction: column;
    }

    .candidate-info {
        flex-direction: column;
        text-align: center;
    }

    .candidate-avatar {
        margin: 0 0 15px 0;
    }

    .filter-bar {
        flex-direction: column;
        align-items: flex-start;
    }

    .filter-select {
        width: 100%;
    }
}
@media (max-width: 480px) {
    .document-history .history-preview iframe,
    .document-history .history-preview img {
      max-height: 300px;
      min-height: 150px;
    }
    
    .document-history .history-preview iframe.pdf-thumbnail {
      height: 40vh !important;
      min-height: 200px;
    }
  }

/* Sticky Header Container */
.sticky-header-container {
    position: sticky !important;
    top: 0 !important;
    z-index: 1020 !important;
    background-color: white !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
    width: 100% !important;
    margin-bottom: 1rem !important;
}

/* Header Content Styling */


/* Secondary Sticky Elements (Side Panels) */
.stickyBreakpoints {
    position: sticky !important;
    top: 120px !important;
    z-index: 11 !important;
}

/* Date Picker Styles */
.react-date-picker__wrapper {
    border: none;
}

.react-date-picker__inputGroup input {
    border: none !important;
}

.react-date-picker__inputGroup {
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}

.react-date-picker__clear-button {
    display: none;
}

/* Upload Modal Styles */
.upload-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.upload-modal-content {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
}

.upload-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-modal-body {
    padding: 24px;
}

.upload-modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.file-drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    background-color: #f9fafb;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-drop-zone:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.drop-zone-content .upload-icon {
    font-size: 48px;
    color: #3b82f6;
    margin-bottom: 16px;
    display: block;
}

.file-details {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: #f3f4f6;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.file-icon {
    width: 48px;
    height: 48px;
    background-color: #3b82f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.file-info {
    flex: 1;
}

.file-name {
    margin: 0 0 4px;
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
}

.file-size {
    margin: 0;
    color: #6b7280;
    font-size: 0.75rem;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
    border-radius: 4px;
}

/* Document Modal Styles */
.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(2px);
}

.document-modal-content {
    background-color: white;
    border-radius: 12px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1501;
}
         .react-date-picker__calendar.react-date-picker__calendar--open{
    inset: 0 !important;
    width: 300px !important;
}
/* Responsive Design */
@media (max-width: 1920px) {
    .stickyBreakpoints {
        top: 120px !important;
    }
}

@media (max-width: 1400px) {
    .stickyBreakpoints {
        top: 110px !important;
    }
}

@media (max-width: 768px) {
    .sticky-header-container {
        position: sticky !important;
        top: 0 !important;
    }
    
    .stickyBreakpoints {
        position: relative !important;
    }
    

}

    /* Final Complete CSS - Replace entire <style> section with this */

html body .content .content-wrapper {
    padding: calc(0.9rem - 0.1rem) 1.2rem;
    overflow: visible !important;
}


/* ========== STICKY HEADER STYLES ========== */
.sticky-header-container {
    position: sticky !important;
    top: 0 !important;
    z-index: 1020 !important;
    background-color: white !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
    width: 100% !important;
    margin-bottom: 1rem !important;
}

.site-header--sticky--register:not(.mobile-sticky-enable) {
    /* position: absolute !important; */
    top: 97px;
    z-index: 10;
}
    .site-header--sticky--register--panels{
     top: 316px;
    z-index: 10;
    }

@media (min-width: 992px) {
    .site-header--sticky--register:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        /* position: absolute !important; */
        /* min-height: 200px; */
        background: white;
    }
    .site-header--sticky--register--panels:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        /* position: absolute !important; */
        /* min-height: 200px; */
        background: white;
    }
}
    @media (max-width: 767px) {
    .site-header--sticky--register:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
        width: 100%;
        left: 0;
        right: 0;
    }
    .site-header--sticky--register--panels:not(.mobile-sticky-enable) {
        position: fixed !important;
        transition: 0.4s;
        background: white;
        width: 100%;
        left: 0;
        right: 0;
    }
    
    /* Adjust content margin to avoid overlap */
    .content-body {
        margin-top: 120px; /* Adjust based on your header height */
    }
}

.stickyBreakpoints {
    position: sticky !important;
    top: 120px !important;
    z-index: 11 !important;
}

/* ========== DATE PICKER STYLES ========== */
.react-date-picker__wrapper {
    border: none;
}

.react-date-picker__inputGroup input {
    border: none !important;
}

.react-date-picker__inputGroup {
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}

.react-date-picker__clear-button {
    display: none;
}

/* ========== UPLOAD MODAL STYLES ========== */
.upload-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.upload-modal-content {
    background-color: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
}

.upload-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-modal-body {
    padding: 24px;
}

.upload-modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.file-drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    background-color: #f9fafb;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-drop-zone:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
}

.drop-zone-content .upload-icon {
    font-size: 48px;
    color: #3b82f6;
    margin-bottom: 16px;
    display: block;
}

.file-details {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: #f3f4f6;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.file-icon {
    width: 48px;
    height: 48px;
    background-color: #3b82f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.file-info {
    flex: 1;
}

.file-name {
    margin: 0 0 4px;
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
}

.file-size {
    margin: 0;
    color: #6b7280;
    font-size: 0.75rem;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
    border-radius: 4px;
}

/* ========== DOCUMENT MODAL STYLES ========== */
.document-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1500;
    backdrop-filter: blur(2px);
}

.document-modal-content {
    background-color: white;
    border-radius: 12px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1501;
}
    #editFollowupPanel {
    max-height: calc(100vh - 220px); /* Adjust based on your header height */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: #cbd5e0 #f7fafc; /* For Firefox */
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 1920px) {
    .stickyBreakpoints {
        top: 120px !important;
    }
}

@media (max-width: 1400px) {
    .stickyBreakpoints {
        top: 110px !important;
    }
}

@media (max-width: 768px) {
    .sticky-header-container {
        position: sticky !important;
        top: 0 !important;
    }
    
    .stickyBreakpoints {
        position: relative !important;
    }
    

}


    
    `
            }
          </style>
          <style>
            {
              `
    /* Enhanced Multi-Select Dropdown Styles */
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
  width: 100% !important;
}

.multi-select-trigger:hover {
  border-color: #86b7fe !important;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
}

.multi-select-trigger.open {
  border-color: #86b7fe !important;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
}

.select-display-text {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #495057;
  font-weight: normal;
}

.dropdown-arrow {
  color: #6c757d;
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  margin-left: 0.5rem;
  flex-shrink: 0;
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
  max-height: 320px;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.options-header {
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.select-all-btn,
.clear-all-btn {
  font-size: 0.75rem !important;
  padding: 0.25rem 0.5rem !important;
  border-radius: 0.25rem !important;
  border: 1px solid !important;
}

.select-all-btn {
  border-color: #0d6efd !important;
  color: #0d6efd !important;
}

.clear-all-btn {
  border-color: #6c757d !important;
  color: #6c757d !important;
}

.select-all-btn:hover {
  background-color: #0d6efd !important;
  color: white !important;
}

.clear-all-btn:hover {
  background-color: #6c757d !important;
  color: white !important;
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

.option-label-new {
  flex: 1;
  font-size: 0.875rem;
  color: #495057;
  cursor: pointer;
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

/* Close dropdown when clicking outside */
.multi-select-container-new.dropdown-open::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .multi-select-options-new {
    max-height: 250px;
  }
  
  .options-header {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .select-all-btn,
  .clear-all-btn {
    width: 100%;
  }
  
  .options-list-new {
    max-height: 150px;
  }
}

/* Focus states for accessibility */
.multi-select-trigger:focus {
  outline: none;
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.option-item-new input[type="checkbox"]:focus {
  outline: 2px solid #86b7fe;
  outline-offset: 2px;
}

/* Selected state styling */
.option-item-new input[type="checkbox"]:checked + .option-label-new {
  font-weight: 500;
  color: #0d6efd;
}

/* Badge styling for multi-select */
.badge.bg-primary {
  background-color: #0d6efd !important;
  font-size: 0.75rem;
  padding: 0.25em 0.4em;
}

/* Animation for dropdown open/close */
.multi-select-options-new {
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

/* Prevent text selection on dropdown trigger */
.multi-select-trigger {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Enhanced visual feedback */
.multi-select-trigger:active {
  transform: translateY(1px);
}

/* Loading state (if needed) */
.multi-select-loading {
  pointer-events: none;
  opacity: 0.6;
}

.multi-select-loading .dropdown-arrow {
  animation: spin 1s linear infinite;
}
.react-date-picker.react-date-picker--closed.react-date-picker--enabled{
padding:0!important;
}
.react-date-picker__wrapper{
height:100%;
}

    `
            }
          </style>

        </div>
        {!isMobile && (
          <div className="col-4" >
            {/* <div className="row site-header--sticky--register--panels"> */}
            <div className="row" style={{
              zIndex: 15,
              transition: 'margin-top 0.2s ease-in-out',
              position: 'fixed'
            }}>
              {renderLeadHistoryPanel()}
              {renderBatchAssignPanel()}
            </div>
          </div>
        )}

        {/* Mobile Modals */}
        {isMobile && renderLeadHistoryPanel()}
        {isMobile && renderBatchAssignPanel()}
      </div>
    </div>
  );
};

export default Batch;