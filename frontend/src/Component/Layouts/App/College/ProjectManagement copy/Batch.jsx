import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import axios from 'axios'
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';

import Student from '../../../../Layouts/App/College/ProjectManagement copy/Student';

const Batch = ({ selectedCourse = null, onBackToCourses = null, selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {

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
  const [allProfilesData, setAllProfilesData] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

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

  useEffect(() => {
    const stage = localStorage.getItem("cmsStage");
    const savedBatch = JSON.parse(localStorage.getItem("selectedBatch") || "null");
  
    if (stage === "student" && savedBatch) {
      setSelectedBatchForStudents(savedBatch);
      setShowStudents(true);
    }
  }, []);

  // Function to handle batch click for students
  const handleBatchClick = (batch) => {
    setSelectedBatchForStudents(batch);
    setShowStudents(true);

    localStorage.setItem("cmsStage", "student");
    localStorage.setItem("selectedBatch", JSON.stringify(batch));

  };

  // Function to go back to batches view
  const handleBackToBatches = () => {
    setShowStudents(false);
    setSelectedBatchForStudents(null);

    localStorage.setItem("cmsStage", "batch");
    localStorage.removeItem("selectedBatch");
  };

  const [batches, setBatches] = useState([]);

  // Exact same tabs as CRM Dashboard
  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History',
    'Documents'
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [currentPage]);

  useEffect(() => {
    fetchSubStatus()

  }, [seletectedStatus]);

  const fetchProfileData = async () => {
    try {

      if (!token) {
        console.warn('No token found in session storage.');
        return;
      }

      // Replace with your actual profile API endpoint
      const response = await axios.get(`${backendUrl}/college/appliedCandidates?page=${currentPage}`, {
        headers: {
          'x-auth': token,
        },
      });
      console.log('Backend profile data:', response.data);
      if (response.data.success && response.data.data) {
        const data = response.data.data; // create array 
        setAllProfiles(response.data.data);
        setAllProfilesData(response.data.data)
        setTotalPages(response.data.totalPages);



      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

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
    return batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.centerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter admissions based on current sub-tab and search
  useEffect(() => {
    let filtered = [...allAdmissions];

    // Filter by admission sub-tab
    if (admissionSubTab === 'Batch Assigned') {
      filtered = filtered.filter(admission => admission._leadStatus?.title === 'Enrolled' || admission.batchId);
    } else if (admissionSubTab === 'Pending for Batch Assigned') {
      filtered = filtered.filter(admission => admission._leadStatus?.title !== 'Enrolled' && !admission.batchId);
    }
    // 'All List' shows everything

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(admission =>
        admission._candidate?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admission._candidate?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admission._candidate?.mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admission._course?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAdmissions(filtered);
  }, [allAdmissions, admissionSubTab, searchQuery]);

  // Fetch admissions data
  const fetchAdmissionsData = async () => {
    if (mainTab !== 'All Admissions') return;

    setLoadingAdmissions(true);
    try {
      const response = await axios.get(`${backendUrl}/college/appliedCandidates`, {
        params: {
          courseId: selectedCourse?._id,
          centerId: selectedCenter?._id
        },
        headers: {
          'x-auth': token
        }
      });

      if (response.data.success) {
        setAllAdmissions(response.data.data);
      } else {
        setError('Failed to fetch admissions data');
      }
    } catch (err) {
      console.error('Error fetching admissions:', err);
      setError('Server error while fetching admissions');
    } finally {
      setLoadingAdmissions(false);
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

  const openleadHistoryPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null)

    setLeadHistoryPanel(true)
    setShowWhatsappPanel(false);
    setShowEditPanel(false);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const handleMoveToKyc = async (profile) => {
    console.log('Function called');
    try {

      console.log('Function in try');
      // Prepare the request body
      const updatedData = {
        kycStage: true
      };

      // Send PUT request to backend API
      const response = await axios.put(`${backendUrl}/college/update/${profile._id}`, updatedData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response:', response.data);

      if (response.data.success) {
        alert('Lead moved to KYC Section successfully!');
        // Optionally refresh data here
        fetchProfileData()
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // alert('An error occurred while updating status');
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

  //  Simulate file upload with progress
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentForUpload) return;

    console.log('selectedDocumentForUpload', selectedDocumentForUpload, 'selectedProfile', selectedProfile)

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('doc', selectedDocumentForUpload.docsId);

      const response = await axios.put(`${backendUrl}/college/upload_docs/${selectedProfile._id}`, formData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('response', response)

      if (response.data.status) {
        alert('Document uploaded successfully! Status: Pending Review');

        // Optionally refresh data here
        closeUploadModal();
        fetchProfileData()
      } else {
        alert('Failed to upload file');
      }




    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
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


  const DocumentModal = () => {
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [documentZoom, setDocumentZoom] = useState(1);
    const [documentRotation, setDocumentRotation] = useState(0);

    const latestUpload = useMemo(() => {
      if (!selectedDocument) return null;
      return selectedDocument.uploads && selectedDocument.uploads.length > 0
        ? selectedDocument.uploads[selectedDocument.uploads.length - 1]
        : (selectedDocument.fileUrl && selectedDocument.status !== "Not Uploaded" ? selectedDocument : null);
    }, [selectedDocument]);

    const handleZoomIn = useCallback(() => {
      setDocumentZoom(prev => Math.min(prev + 0.1, 2));
    }, []);

    const handleZoomOut = useCallback(() => {
      setDocumentZoom(prev => Math.max(prev - 0.1, 0.5));
    }, []);

    const handleRotate = useCallback(() => {
      setDocumentRotation(prev => (prev + 90) % 360);
    }, []);

    const handleReset = useCallback(() => {
      setDocumentZoom(1);
      setDocumentRotation(0);
    }, []);

    const fileUrl = latestUpload?.fileUrl || selectedDocument?.fileUrl;
    const fileType = fileUrl ? getFileType(fileUrl) : null;

    const handleRejectClick = useCallback(() => {
      setShowRejectionForm(true);
    }, []);

    const handleCancelRejection = useCallback(() => {
      setShowRejectionForm(false);
      setRejectionReason('');
    }, []);

    const handleConfirmRejection = useCallback(() => {
      if (rejectionReason.trim()) {
        updateDocumentStatus(latestUpload?._id || selectedDocument?._id, 'Rejected', rejectionReason);
        handleCancelRejection();
      }
    }, [latestUpload, selectedDocument, rejectionReason, handleCancelRejection]);

    if (!showDocumentModal || !selectedDocument) return null;

    // Helper function to render document preview thumbnail using iframe/img
    const renderDocumentThumbnail = (upload, isSmall = true) => {
      const fileUrl = upload?.fileUrl;
      if (!fileUrl) {
        return (
          <div className={`document-thumbnail ${isSmall ? 'small' : ''}`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            width: isSmall ? '100%' : '150px',
            height: isSmall ? '100%' : '100px',
            fontSize: isSmall ? '16px' : '24px',
            color: '#6c757d'
          }}>
            📄
          </div>
        );
      }

      const fileType = getFileType(fileUrl);

      if (fileType === 'image') {
        return (
          <img
            src={fileUrl}
            alt="Document Preview"
            className={`document-thumbnail ${isSmall ? 'small' : ''}`}
            style={{
              width: isSmall ? '100%' : '150px',
              height: isSmall ? '100%' : '100px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (isSmall) {
                // Set this upload as the current preview
                setCurrentPreviewUpload(upload);
              }
            }}
          />
        );
      } else if (fileType === 'pdf') {
        return (
          <div style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
            <iframe
              src={fileUrl}
              className={`document-thumbnail pdf-thumbnail ${isSmall ? 'small' : ''}`}
              style={{
                width: isSmall ? '100%' : '150px',
                height: isSmall ? '360px' : '360px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                pointerEvents: 'none',
                transformOrigin: 'top left',
                overflow: 'hidden'
              }}
              title="PDF Thumbnail"
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc3545',
              fontSize: isSmall ? '10px' : '12px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}>
              PDF
            </div>
          </div>
        );
      } else {
        // For other document types, try to use iframe as well
        return (
          <div style={{ position: 'relative' }}>
            <iframe
              src={fileUrl}
              className={`document-thumbnail ${isSmall ? 'small' : ''}`}
              style={{
                width: isSmall ? '100%' : '150px',
                height: isSmall ? '100%' : '100px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                pointerEvents: 'none',
                backgroundColor: '#f8f9fa'
              }}
              title="Document Thumbnail"
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#007bff',
              fontSize: isSmall ? '16px' : '24px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
              onClick={() => {
                if (isSmall) {
                  setCurrentPreviewUpload(upload);
                }
              }}>
              {fileType === 'document' ? '📄' :
                fileType === 'spreadsheet' ? '📊' : '📁'}
            </div>
          </div>
        );
      }
    };


    return (
      <div className="document-modal-overlay" onClick={closeDocumentModal}>
        <div className="document-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{selectedDocument.Name} Verification</h3>
            <button className="close-btn" onClick={closeDocumentModal}>&times;</button>
          </div>

          <div className="modal-body">
            <div className="document-preview-section">
              <div className="document-preview-container">
                {(latestUpload?.fileUrl || selectedDocument?.fileUrl ||
                  (selectedDocument?.status && selectedDocument?.status !== "Not Uploaded" && selectedDocument?.status !== "No Uploads")) ? (
                  <>
                    {(() => {
                      console.log('selectedDocument:', selectedDocument);
                      console.log('latestUpload:', latestUpload);

                      const fileUrl = latestUpload?.fileUrl || selectedDocument?.fileUrl;
                      const hasDocument = fileUrl ||
                        (selectedDocument?.status && selectedDocument?.status !== "Not Uploaded" && selectedDocument?.status !== "No Uploads");

                      console.log('fileUrl:', fileUrl);
                      console.log('hasDocument:', hasDocument);

                      if (hasDocument) {
                        // If we have a file URL, show the appropriate viewer
                        if (fileUrl) {
                          const fileType = getFileType(fileUrl);

                          if (fileType === 'image') {
                            return (
                              <img
                                src={fileUrl}
                                alt="Document Preview"
                                style={{
                                  transform: `scale(${documentZoom}) rotate(${documentRotation}deg)`,
                                  transition: 'transform 0.3s ease',
                                  maxWidth: '100%',
                                  objectFit: 'contain'
                                }}
                              />
                            );
                          } else if (fileType === 'pdf') {
                            return (
                              <div className="pdf-viewer" style={{ width: '100%', height: '500px' }}>
                                <iframe
                                  src={fileUrl + '#navpanes=0&toolbar=0'}
                                  width="100%"
                                  height="100%"
                                  style={{
                                    border: 'none',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(-50%, -50%) scale(${documentZoom})`,
                                    transformOrigin: 'center center',
                                    transition: 'transform 0.3s ease',
                                    willChange: 'transform'
                                  }}
                                  title="PDF Document"
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div className="document-preview" style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                                  {fileType === 'document' ? '📄' :
                                    fileType === 'spreadsheet' ? '📊' : '📁'}
                                </div>
                                <h4>Document Preview</h4>
                                <p>Click download to view this file</p>
                                {fileUrl ? (
                                  <a
                                    href={fileUrl}
                                    download
                                    className="btn btn-primary"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <i className="fas fa-download me-2"></i>
                                    Download & View
                                  </a>
                                ) : (
                                  <button
                                    className="btn btn-secondary"
                                    disabled
                                    title="File URL not available"
                                  >
                                    <i className="fas fa-download me-2"></i>
                                    File Not Available
                                  </button>
                                )}
                              </div>
                            );
                          }
                        } else {
                          // Document exists but no file URL - show document uploaded message
                          return (
                            <div className="document-preview" style={{ textAlign: 'center', padding: '40px' }}>
                              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📄</div>
                              <h4>Document Uploaded</h4>
                              <p>Document is available for verification</p>
                              <p><strong>Status:</strong> {selectedDocument?.status}</p>
                            </div>
                          );
                        }
                      } else {
                        return (
                          <div className="no-document">
                            <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                            <p>No document uploaded</p>
                          </div>
                        );
                      }
                    })()}
                    <DocumentControls
                      onZoomIn={handleZoomIn}
                      onZoomOut={handleZoomOut}
                      onRotate={handleRotate}
                      onReset={handleReset}
                      onDownload={fileUrl}
                      zoomLevel={documentZoom}
                      fileType={fileType}
                    />
                  </>
                ) : (
                  <div className="no-document">
                    <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                    <p>No document uploaded</p>
                  </div>
                )}
              </div>

              {/* document preview container  */}

              {selectedDocument.uploads && selectedDocument.uploads.length > 0 && (
                <div className="info-card mt-4">
                  <h4>Document History</h4>
                  <div className="document-history">
                    {selectedDocument.uploads && selectedDocument.uploads.map((upload, index) => (
                      <div key={index} className="history-item" style={{
                        display: 'block',
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        height: '100%'
                      }}>
                        {/* Document Preview Thumbnail using iframe/img */}
                        <div className="history-preview" style={{ marginRight: '0px', height: '100%' }}>
                          {renderDocumentThumbnail(upload, true)}
                        </div>

                        {/* Document Info */}
                        <div className="history-info" style={{ flex: 1 }}>
                          <div className="history-date" style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#495057',
                            marginBottom: '4px'
                          }}>
                            {formatDate(upload.uploadedAt)}
                          </div>
                          <div className="history-status">
                            <span className={`${getStatusBadgeClass(upload.status)}`} style={{
                              fontSize: '12px',
                              padding: '4px 8px'
                            }}>
                              {upload.status}
                            </span>
                          </div>
                          {upload.fileUrl && (
                            <div className="history-actions" style={{ marginTop: '8px' }}>
                              <a
                                href={upload.fileUrl}
                                download
                                className="btn btn-sm btn-outline-primary"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  textDecoration: 'none'
                                }}
                              >
                                <i className="fas fa-download me-1"></i>
                                Download
                              </a>
                              <button
                                className="btn btn-sm btn-outline-secondary ms-2"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px'
                                }}
                                onClick={() => {
                                  // Switch main preview to this upload
                                  setCurrentPreviewUpload(upload);
                                }}
                              >
                                <i className="fas fa-eye me-1"></i>
                                Preview
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="document-info-section">
              <div className="info-card">
                <h4>Document Information</h4>
                <div className="info-row">
                  <strong>Document Name:</strong> {selectedDocument.Name}
                </div>
                <div className="info-row">
                  <strong>Upload Date:</strong> {(latestUpload?.uploadedAt || selectedDocument?.uploadedAt) ?
                    new Date(latestUpload?.uploadedAt || selectedDocument?.uploadedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`${getStatusBadgeClass(latestUpload?.status || selectedDocument?.status)} ms-2`}>
                    {latestUpload?.status || selectedDocument?.status || 'No Uploads'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = () => {
    if (!showUploadModal || !selectedDocumentForUpload) return null;

    return (
      <div className="upload-modal-overlay" onClick={closeUploadModal}>
        <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="upload-modal-header">
            <h3>
              <i className="fas fa-cloud-upload-alt me-2"></i>
              Upload {selectedDocumentForUpload.Name}
            </h3>
            <button className="close-btn" onClick={closeUploadModal}>&times;</button>
          </div>

          <div className="upload-modal-body">
            <div className="upload-section">
              {!selectedFile ? (
                <div className="file-drop-zone">
                  <div className="drop-zone-content">
                    <i className="fas fa-cloud-upload-alt upload-icon"></i>
                    <h4>Choose a file to upload</h4>
                    <p>Drag and drop a file here, or click to select</p>
                    <div className="file-types">
                      <span>Supported: JPG, PNG, GIF, PDF</span>
                      <span>Max size: 10MB</span>
                    </div>
                    <input
                      type="file"
                      id="file-input"
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => document.getElementById('file-input').click()}
                    >
                      <i className="fas fa-folder-open me-2"></i>
                      Choose File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="file-preview-section">
                  <div className="selected-file-info">
                    <h4>Selected File:</h4>
                    <div className="file-details">
                      <div className="file-icon">
                        <i className={`fas ${selectedFile.type.startsWith('image/') ? 'fa-image' : 'fa-file-pdf'}`}></i>
                      </div>
                      <div className="file-info">
                        <p className="file-name">{selectedFile.name}</p>
                        <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadPreview(null);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  {uploadPreview && (
                    <div className="upload-preview">
                      <h5>Preview:</h5>
                      <img src={uploadPreview} alt="Upload Preview" className="preview-image" />
                    </div>
                  )}

                  {isUploading && (
                    <div className="upload-progress-section">
                      <h5>Uploading...</h5>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p>{uploadProgress}% Complete</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="upload-modal-footer">
            <button
              className="btn btn-secondary"
              onClick={closeUploadModal}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleFileUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload me-2"></i>
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
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
              <h5 style={{ cursor: 'pointer' }} onClick={onBackToProjects} className="mb-0" aria-current="page">
                {selectedProject.name} Project
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 style={{ cursor: 'pointer' }} onClick={onBackToCenters} className="mb-0" aria-current="page">
                {selectedCenter.name} Centers
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 style={{ cursor: 'pointer' }} onClick={onBackToCourses} className="mb-0" aria-current="page">
                {selectedCourse.name} Centers
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5 className="mb-0" aria-current="page">
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
            <button className="btn btn-danger" onClick={handleAdd}>Add Batch</button>
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
        // Admissions Content - EXACT SAME as CRM Dashboard
        <div className="content-body">
          <section className="list-view">
            <div className='row'>
              <div>
                <div className="col-12 rounded equal-height-2 coloumn-2">
                  <div className="card px-3">
                    <div className="row" id="crm-main-row">

                      {filteredAdmissions.map((profile, profileIndex) => (
                        <div className={`card-content transition-col mb-2`} key={profileIndex}>

                          {/* Profile Header Card */}
                          <div className="card border-0 shadow-sm mb-0 mt-2">
                            <div className="card-body px-1 py-0 my-2">
                              <div className="row align-items-center">
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
                                      <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Your Name'}</h6>
                                      <small className="text-muted">{profile._candidate?.mobile || 'Mobile Number'}</small>
                                    </div>
                                    <div style={{ marginLeft: '15px' }}>
                                      <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                        <i className="fas fa-phone"></i>
                                      </button>
                                      {/* <button
                                        className="btn btn-outline-success btn-sm border-0"
                                        onClick={openWhatsappPanel}
                                        style={{ fontSize: '20px' }}
                                        title="WhatsApp"
                                      >
                                        <i className="fab fa-whatsapp"></i>
                                      </button> */}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-5">
                                  <div className="d-flex gap-2">
                                    <div className="flex-grow-1">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm m-0"
                                        style={{
                                          cursor: 'pointer',
                                          border: '1px solid #ddd',
                                          borderRadius: '0px',
                                          borderTopRightRadius: '5px',
                                          borderTopLeftRadius: '5px',
                                          width: '145px',
                                          height: '20px',
                                          fontSize: '10px'
                                        }}
                                        value={profile._leadStatus?.title}
                                        readOnly
                                        onClick={() => {
                                          openEditPanel(profile, 'StatusChange');
                                          console.log('selectedProfile', profile);
                                        }}

                                      />
                                      <input
                                        type="text"
                                        className="form-control form-control-sm m-0"
                                        value={profile.selectedSubstatus?.title}
                                        style={{
                                          cursor: 'pointer',
                                          border: '1px solid #ddd',
                                          borderRadius: '0px',
                                          borderBottomRightRadius: '5px',
                                          borderBottomLeftRadius: '5px',
                                          width: '145px',
                                          height: '20px',
                                          fontSize: '10px'
                                        }}
                                        readOnly
                                      />
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

                                <div className="col-md-1 text-end d-md-block d-sm-none d-none">
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
                                            <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
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
                                            <div className="info-value">PSD Chandauli Center</div>
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
                                                  <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
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
                                                  <div className="info-value">PSD Chandauli Center</div>
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
                                                  <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                                </div>
                                              </div>

                                              <div className="col-xl- col-3">
                                                <div className="info-group">
                                                  <div className="info-label">BRANCH NAME</div>
                                                  <div className="info-value">{profile._course?.college || 'N/A'}</div>
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

                                          <DocumentModal />
                                          <UploadModal />
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


                    </div>


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
        <div className="modal d-block overflowY d-flex justify-content-center w-100" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg w-100">
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

      <style>
        {
          `
        html body .content .content-wrapper {
    padding: calc(0.9rem - 0.1rem) 1.2rem
}

.container-fluid.py-2 {
    position: sticky !important;
    top: 0;
    z-index: 1020;
    background-color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.stickyBreakpoints {
    position: sticky;
    top: 20px;
    /* default top */
    z-index: 11;
}

.react-date-picker__wrapper {
    border: none;
}

.react-date-picker__inputGroup input {
    border: none !important
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

@media(max-width:1920px) {
    .stickyBreakpoints {
        top: 20%
    }
}

@media(max-width:1400px) {
    .stickyBreakpoints {
        top: 17%
    }
}


        `
        }
      </style>


    </div>
  );
};

export default Batch;