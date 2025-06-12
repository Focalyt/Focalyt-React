import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import './CourseCrm.css';
import './crm.css';

// Add this at the top of the file, after imports
const RejectionForm = React.memo(({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const reasonRef = useRef('');

  const handleReasonChange = (e) => {
    reasonRef.current = e.target.value;
    setReason(e.target.value);
  };

  const handleConfirm = () => {
    onConfirm(reasonRef.current);
  };

  return (
    <div className="rejection-form" style={{ display: 'block', marginTop: '20px' }}>
      <h4>Provide Rejection Reason</h4>
      <textarea
        value={reason}
        onChange={handleReasonChange}
        placeholder="Please provide a detailed reason for rejection..."
        rows="8"
        className="form-control mb-3"
      />
      <div className="d-flex gap-2">
        <button
          className="btn btn-danger"
          onClick={handleConfirm}
          disabled={!reason.trim()}
        >
          Confirm Rejection
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

const KYCManagement = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  // ========================================
  // 🎯 Main Tab State
  // ========================================
  const [mainTab, setMainTab] = useState('Ekyc'); // 'Ekyc' or 'AllAdmission'
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState({});
  const [showPopup, setShowPopup] = useState(null);
  const [activeCrmFilter, setActiveCrmFilter] = useState(0);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showFollowupPanel, setShowFollowupPanel] = useState(false);
  const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [leadHistoryPanel, setLeadHistoryPanel] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
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
  const rejectionReasonRef = useRef('');
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const [currentPreviewUpload, setCurrentPreviewUpload] = useState(null);


  // Static document data for demonstration
  useEffect(() => {
    // Initialize circular progress
    const containers = document.querySelectorAll('.circular-progress-container');
    containers.forEach(container => {
      const percent = container.getAttribute('data-percent');
      const circle = container.querySelector('circle.circle-progress');
      const progressText = container.querySelector('.progress-text');

      if (circle && progressText) {
        if (percent === 'NA' || percent === null || percent === undefined) {
          // Handle NA case
          circle.style.strokeDasharray = 0;
          circle.style.strokeDashoffset = 0;
          progressText.innerText = 'NA';
        } else {
          // Handle numeric percentage
          const radius = 16;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (percent / 100) * circumference;

          circle.style.strokeDasharray = circumference;
          circle.style.strokeDashoffset = offset;
          progressText.innerText = percent + '%';
        }
      }
    });
  }, [allProfiles]);

  // Static profile data
  const staticProfileData = [];

  // ========================================
  // 🎯 eKYC Filters Configuration
  // ========================================
  const [ekycFilters, setEkycFilters] = useState([
    { _id: 'pendingEkyc', name: 'kyc Pending', count: 0, milestone: '' },
   { _id: 'doneEkyc', name: 'kyc Verified', count: 0, milestone: 'Ekyc Done' },
   { _id: 'All', name: 'All', count: 0, milestone: '' }
   
  ]);

  // ========================================
  // 🎯 All Admission Filters Configuration
  // ========================================
 

  // open model for upload documents 
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

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


  // Simulate file upload with progress
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentForUpload) return;

    console.log('selectedDocumentForUpload', selectedDocumentForUpload)

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
      formData.append('doc', selectedDocumentForUpload._id);

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

  // ========================================
  // 🎯 Get Current Filters Function
  // ========================================
  const getCurrentFilters = () => {
    return mainTab === 'Ekyc' ? ekycFilters : [];
  };

 

  // Document functions
  // Fixed openDocumentModal function
  const openDocumentModal = (document, profile) => {
    console.log(profile, 'profile');
    if (profile) {
      setSelectedProfile(profile);
    }
    setSelectedDocument(document);
    setShowDocumentModal(true);
    setDocumentZoom(1);
    setDocumentRotation(0);
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setShowRejectionForm(false);
    setRejectionReason('');
    setIsNewModalOpen(false);
    // Only reset when actually closing modal
    setDocumentZoom(1);
    setDocumentRotation(0);
    document.body?.classList.remove('no-scroll');
  };

  const zoomIn = () => {
    setDocumentZoom(prev => Math.min(prev + 0.1, 3)); // Max zoom 3x
  };

  const zoomOut = () => {
    setDocumentZoom(prev => Math.max(prev - 0.1, 0.5)); // Min zoom 0.5x
  };

  const rotateDocument = () => {
    setDocumentRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setDocumentZoom(1);
    setDocumentRotation(0);
  };

  const updateDocumentStatus = async (uploadId, status, rejectionReason) => {
    try {
      if (!selectedProfile || !selectedProfile._id) {
        alert('No profile selected');
        return;
      }

      // Add confirmation dialog
      const confirmMessage = status === 'Verified' 
        ? 'Are you sure you want to verify this document?'
        : 'Are you sure you want to reject this document?';
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      const response = await axios.put(
        `${backendUrl}/college/verify-document/${selectedProfile._id}/${uploadId}`,
        {
          status,
          rejectionReason
        },
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // If KYC was updated, show a success message
        if (response.data.kycUpdated) {
          alert('All documents verified! KYC status has been updated.');
        } else {
          alert(`Document ${status.toLowerCase()} successfully!`);
        }
        
        // Refresh the profile data
        await fetchProfileData();
        closeDocumentModal();
      } else {
        alert(response.data.message || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Failed to update document status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-dark';
      case 'verified': return 'text-success';
      case 'rejected': return 'text-danger';
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

  const getDocumentCounts = (documents) => {
    // Ensure documents is an array
    const docArray = Array.isArray(documents) ? documents : [];

    const totalDocs = docArray.length;
    const uploadedDocs = docArray.filter(doc => doc.uploads && doc.uploads.length > 0).length;
    const pendingDocs = docArray.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending'
    ).length;
    const verifiedDocs = docArray.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Verified'
    ).length;
    const rejectedDocs = docArray.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected'
    ).length;

    return { totalDocs, uploadedDocs, pendingDocs, verifiedDocs, rejectedDocs };
  };

  // ========================================
  // 🎯 Main Tab Change Handler
  // ========================================
  const handleMainTabChange = (tabName) => {
    setMainTab(tabName);
    setActiveCrmFilter(0); // Reset to first filter

    // Reset filters and fetch appropriate data
    applyFiltersForTab(tabName, 0);

    // Also reset other filters
    setFilterData({
      name: '',
      courseType: '',
      status: 'true',
      leadStatus: '',
      sector: '',
      createdFromDate: null,
      createdToDate: null,
      modifiedFromDate: null,
      modifiedToDate: null,
      nextActionFromDate: null,
      nextActionToDate: null,
    });
  };

  // ========================================
  // 🎯 Tab-Specific Filter Logic
  // ========================================
  const applyFiltersForTab = (mainTabName, filterIndex) => {
    const currentFilters = mainTabName === 'Ekyc' ? ekycFilters : [];
    const selectedFilter = currentFilters[filterIndex];

    let filteredData = [...allProfilesData];

    if (mainTabName === 'Ekyc') {
      if (selectedFilter._id === 'pendingEkyc') {
        filteredData = filteredData.filter(profile => {
          return profile.ekycStatus === 'pending' ||
            profile.ekycStatus === null ||
            profile.ekycStatus === undefined ||
            profile.kyc === false ||
            (!profile.kyc && profile.kyc !== true);
        });
      } else if (selectedFilter._id === 'doneEkyc') {
        filteredData = filteredData.filter(profile => {
          return profile.ekycStatus === 'done' ||
            profile.ekycStatus === 'completed' ||
            profile.kyc === true;
        });
      }
    } else {
      if (selectedFilter._id === 'pendingDocs') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents;
          const counts = getDocumentCounts(docs);
          return counts.pendingDocs > 0;
        });
      } else if (selectedFilter._id === 'documentDone') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      } else if (selectedFilter._id === 'zeroPeriod') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      } else if (selectedFilter._id === 'batchFreeze') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      } else if (selectedFilter._id === 'dropout') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      } else if (selectedFilter._id === 'alladmission') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      }
    }

    console.log(`Filter applied: ${selectedFilter.name}`, {
      original: allProfilesData.length,
      filtered: filteredData.length,
      filterType: mainTabName,
      filterId: selectedFilter._id
    });

    setAllProfiles(filteredData);
  };

  // ========================================
  // 🎯 Filter Click Handler
  // ========================================
  const handleCrmFilterClick = (index) => {
    if (index === 0) {
      // Filter profiles where kyc is false
      const filtered = allProfilesData.filter(profile => profile.kyc === false);
      setAllProfiles(filtered);
      setActiveCrmFilter(index);
      return;
    }
    if (index === 1) {
      // Filter profiles where kyc is true
      const filtered = allProfilesData.filter(profile => profile.kyc === true);
      setAllProfiles(filtered);
      setActiveCrmFilter(index);
      return;
    } else if (index === 2) {
      setAllProfiles(allProfilesData);
      setActiveCrmFilter(index);
      return;
    }
    setActiveCrmFilter(index);
    applyFiltersForTab(mainTab, index);
  };

  // Filter state from Registration component
  const [filterData, setFilterData] = useState({
    name: '',
    courseType: '',
    status: 'true',
    leadStatus: '',
    sector: '',
    createdFromDate: null,
    createdToDate: null,
    modifiedFromDate: null,
    modifiedToDate: null,
    nextActionFromDate: null,
    nextActionToDate: null,
  });

  // Add dropdown visibility states
  const [showCreatedDatePicker, setShowCreatedDatePicker] = useState(false);
  const [showModifiedDatePicker, setShowModifiedDatePicker] = useState(false);
  const [showNextActionDatePicker, setShowNextActionDatePicker] = useState(false);

  const [statuses, setStatuses] = useState([
    { _id: '', name: '', count: 0 },
  ]);

  // edit status and set followup
  const [seletectedStatus, setSelectedStatus] = useState('');
  const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [remarks, setRemarks] = useState('');

  const [subStatuses, setSubStatuses] = useState([]);


  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History',
    'Documents'
  ];

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (seletectedStatus) {
      fetchSubStatus();
    }
  }, [seletectedStatus]);

  // Format date range for display
  const formatDateRange = (fromDate, toDate) => {
    if (!fromDate && !toDate) {
      return 'Select Date Range';
    }
    if (fromDate && !toDate) {
      return `From ${fromDate.toLocaleDateString('en-GB')}`;
    }
    if (!fromDate && toDate) {
      return `Until ${toDate.toLocaleDateString('en-GB')}`;
    }
    if (fromDate && toDate) {
      const from = fromDate.toLocaleDateString('en-GB');
      const to = toDate.toLocaleDateString('en-GB');
      if (from === to) {
        return from;
      }
      return `${from} - ${to}`;
    }
    return 'Select Date Range';
  };

  // Date range handlers
  const handleDateFilterChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);
    applyFilters(newFilterData);
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

  // Clear functions
  const clearDateFilter = (filterType) => {
    let newFilterData = { ...filterData };

    if (filterType === 'created') {
      newFilterData.createdFromDate = null;
      newFilterData.createdToDate = null;
    } else if (filterType === 'modified') {
      newFilterData.modifiedFromDate = null;
      newFilterData.modifiedToDate = null;
    } else if (filterType === 'nextAction') {
      newFilterData.nextActionFromDate = null;
      newFilterData.nextActionToDate = null;
    }

    setFilterData(newFilterData);
    applyFilters(newFilterData);
  };

  const handleDateChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);
    applyFilters(newFilterData);
  };

  const clearCreatedDate = () => {
    setFilterData(prev => ({
      ...prev,
      createdFromDate: null,
      createdToDate: null
    }));
    applyFilters({
      ...filterData,
      createdFromDate: null,
      createdToDate: null
    });
  };

  const clearModifiedDate = () => {
    setFilterData(prev => ({
      ...prev,
      modifiedFromDate: null,
      modifiedToDate: null
    }));
    applyFilters({
      ...filterData,
      modifiedFromDate: null,
      modifiedToDate: null
    });
  };

  const clearNextActionDate = () => {
    setFilterData(prev => ({
      ...prev,
      nextActionFromDate: null,
      nextActionToDate: null
    }));
    applyFilters({
      ...filterData,
      nextActionFromDate: null,
      nextActionToDate: null
    });
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      applyFilters();
      return;
    }

    const searchFiltered = allProfilesData.filter(profile => {
      try {
        const name = profile._candidate?.name ? String(profile._candidate.name).toLowerCase() : '';
        const mobile = profile._candidate?.mobile ? String(profile._candidate.mobile).toLowerCase() : '';
        const email = profile._candidate?.email ? String(profile._candidate.email).toLowerCase() : '';
        const searchLower = searchTerm.toLowerCase();

        return name.includes(searchLower) ||
          mobile.includes(searchLower) ||
          email.includes(searchLower);
      } catch (error) {
        console.error('Search filter error for profile:', profile, error);
        return false;
      }
    });

    setAllProfiles(searchFiltered);
  };

  const applyFilters = (filters = filterData) => {
    console.log('Applying filters with data:', filters);

    let filtered = [...allProfilesData];

    try {
      // Search filter
      if (filters.name && filters.name.trim()) {
        const searchTerm = filters.name.toLowerCase();
        filtered = filtered.filter(profile => {
          try {
            const name = profile._candidate?.name ? String(profile._candidate.name).toLowerCase() : '';
            const mobile = profile._candidate?.mobile ? String(profile._candidate.mobile).toLowerCase() : '';
            const email = profile._candidate?.email ? String(profile._candidate.email).toLowerCase() : '';

            return name.includes(searchTerm) ||
              mobile.includes(searchTerm) ||
              email.includes(searchTerm);
          } catch (error) {
            return false;
          }
        });
      }

      console.log('Filter results:', filtered.length, 'out of', allProfilesData.length);
      setAllProfiles(filtered);

    } catch (error) {
      console.error('Filter error:', error);
      setAllProfiles(allProfilesData);
    }
  };

  // Helper function for status icons
  const getStatusIcon = (statusName) => {
    const statusName_lower = statusName.toLowerCase();
    if (statusName_lower.includes('hot') || statusName_lower.includes('urgent')) return '🔥';
    if (statusName_lower.includes('warm') || statusName_lower.includes('interested')) return '⚡';
    if (statusName_lower.includes('cold') || statusName_lower.includes('not')) return '❄️';
    if (statusName_lower.includes('new') || statusName_lower.includes('fresh')) return '🆕';
    if (statusName_lower.includes('follow') || statusName_lower.includes('pending')) return '⏳';
    if (statusName_lower.includes('converted') || statusName_lower.includes('success')) return '✅';
    return '🎯';
  };

  const clearAllFilters = () => {
    setFilterData({
      name: '',
      courseType: '',
      status: 'true',
      leadStatus: '',
      sector: '',
      createdFromDate: null,
      createdToDate: null,
      modifiedFromDate: null,
      modifiedToDate: null,
      nextActionFromDate: null,
      nextActionToDate: null,
    });
    setAllProfiles(allProfilesData);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleMoveToAdmission = async(profile) => {
    try {
      if (!profile || !profile._id) {
        alert('No profile selected');
        return;
      }

      // Check if all documents are verified using docCounts
      if (profile.docCounts.verifiedCount !== profile.docCounts.totalRequired) {
        alert('All documents must be verified before moving to admission list');
        return;
      }

      // Show confirmation dialog
      const confirmMove = window.confirm('Do you really want to move this profile to admission list?');
      if (!confirmMove) {
        return;
      }

      // Check if backend URL and token exist
      if (!backendUrl) {
        alert('Backend URL not configured');
        return;
      }

      if (!token) {
        alert('Authentication token missing');
        return;
      }

      // Send PUT request to backend API to update status
      const response = await axios.put(
        `${backendUrl}/college/update/${profile._id}`,
        {
          admissionDone: true, // Set admission as done
          remarks: 'Moved to admission'
        },
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Profile moved to admission successfully!');
        // Refresh the profile data
        await fetchProfileData();
      } else {
        console.error('API returned error:', response.data);
        alert(response.data.message || 'Failed to move to admission');
      }
    } catch (error) {
      console.error('Error moving to admission:', error);
      alert('Failed to move to admission');
    }
  };

  const handleTimeChange = (e) => {
    if (!followupDate) {
      alert('Select date first');
      return;
    }

    const time = e.target.value;
    const [hours, minutes] = time.split(':');
    const selectedDateTime = new Date(followupDate);
    selectedDateTime.setHours(parseInt(hours, 10));
    selectedDateTime.setMinutes(parseInt(minutes, 10));
    selectedDateTime.setSeconds(0);
    selectedDateTime.setMilliseconds(0);

    const now = new Date();

    if (selectedDateTime < now) {
      alert('Select future time');
      return;
    }

    setFollowupTime(time);
  };

  const handleSubStatusChange = (e) => {
    const selectedSubStatusId = e.target.value;
    const selectedSubStatusObject = subStatuses.find(status => status._id === selectedSubStatusId);
    setSelectedSubStatus(selectedSubStatusObject || null);
  };

  const fetchStatus = async () => {
    try {


      const response = await axios.get(`${backendUrl}/college/status`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        const status = response.data.data;
        setStatuses(status.map(r => ({
          _id: r._id,
          name: r.title,
          count: r.count || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch Status');
    }
  };

  const fetchSubStatus = async () => {
    try {


      const response = await axios.get(`${backendUrl}/college/status/${seletectedStatus}/substatus`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        setSubStatuses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch SubStatus');
    }
  };

  const handleUpdateStatus = async () => {
      console.log('Function called');
  
      try {
      if(showEditPanel){
             // Validation checks
        if (!selectedProfile || !selectedProfile._id) {
          alert('No profile selected');
          return;
        }
  
        if (!seletectedStatus) {
          alert('Please select a status');
          return;
        }
  
        // Combine date and time into a single Date object (if both are set)
        let followupDateTime = '';
        if (followupDate && followupTime) {
          // Create proper datetime string
          const dateStr = followupDate instanceof Date
            ? followupDate.toISOString().split('T')[0]  // Get YYYY-MM-DD format
            : followupDate;
  
          followupDateTime = new Date(`${dateStr}T${followupTime}`);
  
          // Validate the datetime
          if (isNaN(followupDateTime.getTime())) {
            alert('Invalid date/time combination');
            return;
          }
        }
  
        // Prepare the request body
        const data = {
          _leadStatus: typeof seletectedStatus === 'object' ? seletectedStatus._id : seletectedStatus,
          _leadSubStatus: seletectedSubStatus?._id || null,
          followup: followupDateTime ? followupDateTime.toISOString() : null,
          remarks: remarks || ''
        };
  
        
  
        // Check if backend URL and token exist
        if (!backendUrl) {
          alert('Backend URL not configured');
          return;
        }
  
        if (!token) {
          alert('Authentication token missing');
          return;
        }
  
        // Send PUT request to backend API
        const response = await axios.put(
          `${backendUrl}/college/lead/status_change/${selectedProfile._id}`,
          data,
          {
            headers: {
              'x-auth': token,
              'Content-Type': 'application/json'
            }
          }
        );
  
        console.log('API response:', response.data);
  
        if (response.data.success) {
          alert('Status updated successfully!');
  
          // Reset form
          setSelectedStatus('');
          setSelectedSubStatus(null);
          setFollowupDate('');
          setFollowupTime('');
          setRemarks('');
  
          // Refresh data and close panel
          await fetchProfileData();
          closeEditPanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }
  
      }
      if(showFollowupPanel){
        
  
        // Combine date and time into a single Date object (if both are set)
        let followupDateTime = '';
        if (followupDate && followupTime) {
          // Create proper datetime string
          const dateStr = followupDate instanceof Date
            ? followupDate.toISOString().split('T')[0]  // Get YYYY-MM-DD format
            : followupDate;
  
          followupDateTime = new Date(`${dateStr}T${followupTime}`);
  
          // Validate the datetime
          if (isNaN(followupDateTime.getTime())) {
            alert('Invalid date/time combination');
            return;
          }
        }
  
        // Prepare the request body
        const data = {
          followup: followupDateTime ? followupDateTime.toISOString() : null,
          remarks: remarks || ''
        };
  
        
  
        // Check if backend URL and token exist
        if (!backendUrl) {
          alert('Backend URL not configured');
          return;
        }
  
        if (!token) {
          alert('Authentication token missing');
          return;
        }
  
        // Send PUT request to backend API
        const response = await axios.put(
          `${backendUrl}/college/lead/status_change/${selectedProfile._id}`,
          data,
          {
            headers: {
              'x-auth': token,
              'Content-Type': 'application/json'
            }
          }
        );
  
        console.log('API response:', response.data);
  
        if (response.data.success) {
          alert('Status updated successfully!');
  
          // Reset form
          setSelectedStatus('');
          setSelectedSubStatus(null);
          setFollowupDate('');
          setFollowupTime('');
          setRemarks('');
  
          // Refresh data and close panel
          await fetchProfileData();
          closeEditPanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }
  
      }
      } 
      catch (error) {
        console.error('Error updating status:', error);
  
        // More detailed error handling
        if (error.response) {
          // Server responded with error status
          console.error('Error Response:', error.response.data);
          console.error('Error Status:', error.response.status);
          alert(`Server Error: ${error.response.data.message || 'Failed to update status'}`);
        } else if (error.request) {
          // Request was made but no response received
          console.error('No response received:', error.request);
          alert('Network error: Unable to reach server');
        } else {
          // Something else happened
          console.error('Error:', error.message);
          alert(`Error: ${error.message}`);
        }
      }
    };

    
 

  useEffect(() => {
    fetchProfileData();
  }, []);
  // useEffect(() => {
  //   handleCrmFilterClick(activeCrmFilter);
  // }, [allProfiles]);

  useEffect(() => {
    fetchProfileData();
  }, [currentPage]);

  const fetchProfileData = async () => {
    try {

      if (!token) {
        console.warn('No token found in session storage.');
        return;
      }

      const response = await axios.get(`${backendUrl}/college/kycCandidates?page=${currentPage}`, {
        headers: {
          'x-auth': token,
        },
      });

      if (response.data.success && response.data.data) {
        const { totalCount = 0, pendingKycCount = 0, doneKycCount = 0 } = response.data;

        const filter = [
          { _id: 'pendingEkyc', name: 'Ekyc Pending', count: pendingKycCount, milestone: '' },
          { _id: 'doneEkyc', name: 'Ekyc Verified', count: doneKycCount, milestone: 'Ekyc Done' },
          { _id: 'All', name: 'All', count: totalCount, milestone: '' }
        ];

        setEkycFilters(filter);
        console.log('backend response', response.data.data)
        setAllProfiles(response.data.data);
        setAllProfilesData(response.data.data)
        setTotalPages(response.data.totalPages)

        
      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  // Additional state and functions (keeping existing ones for brevity)
  const [experiences, setExperiences] = useState([{
    jobTitle: '',
    companyName: '',
    from: null,
    to: null,
    jobDescription: '',
    currentlyWorking: false
  }]);

  const [educations, setEducations] = useState([
    {
      education: '',
      universityName: '',
      boardName: '',
      collegeName: '',
      schoolName: '',
      course: '',
      specialization: '',
      passingYear: '',
      marks: '',
      universityLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      },
      collegeLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      },
      schoolLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      }
    }
  ]);

  const togglePopup = (profileIndex) => {
    setShowPopup(prev => prev === profileIndex ? null : profileIndex);
  };

  const handleTabClick = (profileIndex, tabIndex) => {
    setActiveTab(prevTabs => ({
      ...prevTabs,
      [profileIndex]: tabIndex
    }));
  };

  const handleFilterChange = (e) => {
    try {
      const { name, value } = e.target;
      const newFilterData = { ...filterData, [name]: value };
      setFilterData(newFilterData);

      if (newFilterData.name) {
        handleSearch(newFilterData.name);
      } else {
        applyFilters(newFilterData);
      }
    } catch (error) {
      console.error('Filter change error:', error);
    }
  };

  const openEditPanel = async (profile = null, panel) => {
    console.log('panel', panel);

    if (profile) {
      setSelectedProfile(profile);
    }

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

  const closeEditPanel = () => {
    setShowEditPanel(false);
    setShowFollowupPanel(false);
    if (!isMobile) {
      setMainContentClass('col-12');
    }
  };

  const openWhatsappPanel = () => {
    setShowWhatsappPanel(true);
    setShowEditPanel(false);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const closeWhatsappPanel = () => {
    setShowWhatsappPanel(false);
    if (!isMobile) {
      setMainContentClass(showEditPanel ? 'col-8' : 'col-12');
    }
  };

  const openleadHistoryPanel = async (profile = null) => {
    if (profile) {
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

  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
  };

  const closeleadHistoryPanel = () => {
    setLeadHistoryPanel(false)
    if (!isMobile) {
      setMainContentClass(showEditPanel || showWhatsappPanel ? 'col-8' : 'col-12');
    }
  };

  const getPaginationPages = () => {
    const delta = 2;
    const range = [];
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(totalPages, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const today = new Date();

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

  // यह function DocumentModal के बाहर, component के अंदर कहीं भी define करें:

// Auto Height Document Thumbnail Function - DocumentModal के बाहर define करें


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
   // यदि आप बिल्कुल auto height चाहते हैं (बिना किसी limit के):
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
          height: isSmall ? 'auto' : '100px',
          minHeight: '50px',
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
            height: 'auto', // Completely auto height
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            cursor: 'pointer',
            backgroundColor: '#f8f9fa',
            display: 'block'
          }}
          onClick={() => {
            if (isSmall) {
              setCurrentPreviewUpload(upload);
            }
          }}
        />
      );
    } else if (fileType === 'pdf') {
      return (
        <div style={{ 
          position: 'relative', 
          overflow: 'visible', // Allow content to expand
          width: isSmall ? '100%' : '150px',
          height: 'auto' // Auto height for container
        }}>
          <iframe
            src={fileUrl+ '#navpanes=0&toolbar=0'} // Add FitH parameter for better PDF display
            className={`document-thumbnail pdf-thumbnail ${isSmall ? 'small' : ''}`}
            style={{
              width: '100%',
              height: isSmall ? 'auto' : '100px', // Use viewport height for history
              maxHeight: isSmall ? '600px' : '100px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer',
              pointerEvents: isSmall ? 'auto' : 'none',
              transform: isSmall ? 'scale(1)' : 'scale(0.3)',
              transformOrigin: 'top left',
              backgroundColor: '#fff'
            }}
            title="PDF Document"
            onClick={() => {
              if (isSmall) {
                setCurrentPreviewUpload(upload);
              }
            }}
            scrolling={isSmall ? 'auto' : 'no'}
          />
          {!isSmall && (
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
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
              onClick={() => {
                setCurrentPreviewUpload(upload);
              }}>
              PDF
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div style={{ 
          position: 'relative',
          width: isSmall ? '100%' : '150px',
          height: 'auto' // Auto height
        }}>
          <iframe
            src={fileUrl}
            className={`document-thumbnail ${isSmall ? 'small' : ''}`}
            style={{
              width: '100%',
              height: isSmall ? 'auto' : '100px',
              minHeight: isSmall ? '300px' : '100px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer',
              pointerEvents: isSmall ? 'auto' : 'none',
              backgroundColor: '#f8f9fa'
            }}
            title="Document"
            onClick={() => {
              if (isSmall) {
                setCurrentPreviewUpload(upload);
              }
            }}
            scrolling={isSmall ? 'auto' : 'no'}
          />
          {!isSmall && (
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
              fontSize: '24px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
              onClick={() => {
                setCurrentPreviewUpload(upload);
              }}>
              {fileType === 'document' ? '📄' :
                fileType === 'spreadsheet' ? '📊' : '📁'}
            </div>
          )}
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
              <div className="document-preview-container" style={{height: 'auto'}}>
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
                              <div className="pdf-viewer" style={{ width: '100%', height: '780px' }}>
                                <iframe
                                  src={fileUrl+ '#navpanes=0&toolbar=0'}
                                  width="100%"
                                  height="100%"
                                  style={{
                                    border: 'none',
                                    transform: `scale(${documentZoom})`,
                                    transformOrigin: 'top left',
                                    transition: 'transform 0.3s ease'
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
                        border: '1px solid #e9ecef'
                      }}>
                        {/* Document Preview Thumbnail using iframe/img */}
                        <div className="history-preview" style={{ marginRight: '0px' }}>
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

              {/* Document Actions */}
              {(latestUpload?.status || selectedDocument?.status) === 'Pending' && (
              <div className="document-actions mt-4">
                {!showRejectionForm ? (
                  <div className="action-buttons">
                    <button
                      className="btn btn-success me-2"
                      onClick={() => updateDocumentStatus(latestUpload?._id || selectedDocument?._id, 'Verified')}
                    >
                      <i className="fas fa-check"></i> Approve Document
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleRejectClick}
                    >
                      <i className="fas fa-times"></i> Reject Document
                    </button>
                  </div>
                ) : (
                  <div className="rejection-form" style={{ display: 'block', marginTop: '20px' }}>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a detailed reason for rejection..."
                      rows="8"
                      className="form-control mb-3"
                    />
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger"
                        onClick={handleConfirmRejection}
                      >
                        Confirm Rejection
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancelRejection}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>)}

             
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

  // Render Edit Panel
  const renderEditPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary"></i>
            </div>
            <h6 className="mb-0 followUp fw-medium">
              {showEditPanel && 'Edit Status for '}
              {showFollowupPanel && 'Set Followup for '}
              {selectedProfile?._candidate?.name || 'Unknown'}
            </h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closeEditPanel}></button>
          </div>
        </div>

        <div className="card-body">
          <form>
            {!showFollowupPanel && (
              <>
                <div className="mb-1">
                  <label htmlFor="status" className="form-label small fw-medium text-dark">
                    Status<span className="text-danger">*</span>
                  </label>
                  <div className="d-flex">
                    <div className="form-floating flex-grow-1">
                      <select
                        className="form-select border-0 bgcolor"
                        id="status"
                        value={seletectedStatus}
                        style={{
                          height: '42px',
                          paddingTop: '8px',
                          paddingInline: '10px',
                          width: '100%',
                          backgroundColor: '#f1f2f6'
                        }}
                        onChange={handleStatusChange}
                      >
                        <option value="">Select Status</option>
                        {statuses.map((filter, index) => (
                          <option key={filter._id} value={filter._id}>{filter.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-1">
                  <label htmlFor="subStatus" className="form-label small fw-medium text-dark">
                    Sub-Status<span className="text-danger">*</span>
                  </label>
                  <div className="d-flex">
                    <div className="form-floating flex-grow-1">
                      <select
                        className="form-select border-0 bgcolor"
                        id="subStatus"
                        value={seletectedSubStatus?._id || ''}
                        style={{
                          height: '42px',
                          paddingTop: '8px',
                          backgroundColor: '#f1f2f6',
                          paddingInline: '10px',
                          width: '100%'
                        }}
                        onChange={handleSubStatusChange}
                      >
                        <option value="">Select Sub-Status</option>
                        {subStatuses.map((filter, index) => (
                          <option key={filter._id} value={filter._id}>{filter.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {((seletectedSubStatus && seletectedSubStatus.hasFollowup) || showFollowupPanel) && (
              <div className="row mb-1">
                <div className="col-6">
                  <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark">
                    Next Action Date <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <DatePicker
                      className="form-control border-0 bgcolor"
                      onChange={setFollowupDate}
                      value={followupDate}
                      format="dd/MM/yyyy"
                      minDate={today}
                    />
                  </div>
                </div>

                <div className="col-6">
                  <label htmlFor="actionTime" className="form-label small fw-medium text-dark">
                    Time <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className="form-control border-0 bgcolor"
                      id="actionTime"
                      onChange={handleTimeChange}
                      value={followupTime}
                      style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {((seletectedSubStatus && seletectedSubStatus.hasRemarks) || showFollowupPanel) && (
              <div className="mb-1">
                <label htmlFor="comment" className="form-label small fw-medium text-dark">Comment</label>
                <textarea
                  className="form-control border-0 bgcolor"
                  id="comment"
                  rows="4"
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{ resize: 'none', backgroundColor: '#f1f2f6' }}
                ></textarea>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn"
                style={{ border: '1px solid #ddd', padding: '8px 24px', fontSize: '14px' }}
                onClick={closeEditPanel}
              >
                CLOSE
              </button>
              <button
                type="submit"
                className="btn text-white"
                onClick={handleUpdateStatus}
                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
              >
                SET FOLLOWUP
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <div
          className={`modal ${showEditPanel || showFollowupPanel ? 'show d-block' : 'd-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditPanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              {panelContent}
            </div>
          </div>
        </div>
      );
    }

    return showEditPanel || showFollowupPanel ? (
      <div className="col-12 transition-col" id="editFollowupPanel">
        {panelContent}
      </div>
    ) : null;
  };

  // Render WhatsApp Panel (Desktop Sidebar or Mobile Modal)
  const renderWhatsAppPanel = () => {
    const panelContent = (
      <div className="whatsapp-chat right-side-panel">
        <section className="topbar-container">
          <div className="left-topbar">
            <div className="img-container">
              <div className="small-avatar" title="Ram Ruhela">RR</div>
            </div>
            <div className="flex-column">
              <span title="Ram Ruhela" className="lead-name">Ram Ruhela</span><br />
              <span className="selected-number">Primary: 918875426236</span>
            </div>
          </div>
          <div className="right-topbar">
            <a className="margin-horizontal-4" href="#">
              <img src="/Assets/public_assets/images/whatapp/refresh.svg" alt="whatsAppAccount" title="whatsAppChatList.title.whatsAppAccount" />
            </a>
            <a className="margin-horizontal-5" href="#">
              <img src="/Assets/public_assets/images/whatapp/refresh.svg" alt="refresh" title="refresh" />
            </a>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={closeWhatsappPanel}
              title="Close WhatsApp"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </section>

        <section className="chat-view">
          <ul className="chat-container" id="messageList">
            <div className="counselor-msg-container">
              <div className="chatgroupdate"><span>03/26/2025</span></div>
              <div className="counselor-msg-0 counselor-msg macro">
                <div className="text text-r">
                  <div>
                    <span className="message-header-name student-messages">Anjali</span><br />
                    <div className="d-flex">
                      <pre className="text-message">
                        <br /><span><span style={{ fontSize: '16px' }}>🎯</span>&nbsp;फ्री&nbsp;होटल&nbsp;मैनेजमेंट&nbsp;कोर्स&nbsp;-&nbsp;सुनहरा&nbsp;मौका&nbsp;<span style={{ fontSize: '16px' }}>🎯</span><br /><br />अब&nbsp;बने&nbsp;Guest&nbsp;Service&nbsp;Executive&nbsp;(Front&nbsp;Office)&nbsp;और&nbsp;होटल&nbsp;इंडस्ट्री&nbsp;में&nbsp;पाएं&nbsp;शानदार&nbsp;करियर&nbsp;की&nbsp;शुरुआत।<br /><br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;आयु&nbsp;सीमा:&nbsp;18&nbsp;से&nbsp;29&nbsp;वर्ष<br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;योग्यता:&nbsp;12वीं&nbsp;पास<br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;कोर्स&nbsp;अवधि:&nbsp;3&nbsp;से&nbsp;4&nbsp;महीने<br /><span style={{ fontSize: '16px' }}>✅</span>&nbsp;100%&nbsp;जॉब&nbsp;प्लेसमेंट&nbsp;गारंटी</span>
                        <span className="messageTime text-message-time" id="time_0" style={{ marginTop: '12px' }}>
                          12:31 PM
                          <img src="/Assets/public_assets/images/whatapp/checked.png" style={{ marginLeft: '5px', marginBottom: '2px', width: '15px' }} alt="tick" />
                        </span>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="counselor-msg-container">
              <div className="chatgroupdate"><span>04/07/2025</span></div>
              <div className="counselor-msg-1 counselor-msg macro">
                <div className="text text-r">
                  <div className="d-flex">
                    <pre className="text-message">
                      <span className="message-header-name student-messages">Mr. Parveen Bansal</span><br />
                      <span><h6>Hello</h6></span>
                      <span className="messageTime text-message-time" id="time_1" style={{ marginTop: '7px' }}>
                        04:28 PM
                        <img src="/Assets/public_assets/images/whatapp/checked.png" style={{ marginLeft: '5px', marginBottom: '2px', width: '15px' }} alt="tick" />
                      </span>
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="sessionExpiredMsg">
              <span>Your session has come to end. It will start once you receive a WhatsApp from the lead.<br />Meanwhile, you can send a Business Initiated Messages (BIM).</span>
            </div>
          </ul>
        </section>

        <section className="footer-container">
          <div className="footer-box">
            <div className="message-container" style={{ height: '36px', maxHeight: '128px' }}>
              <textarea
                placeholder="Choose a template"
                className="disabled-style message-input"
                disabled
                rows="1"
                id="message-input"
                style={{ height: '36px', maxHeight: '128px', paddingTop: '8px', paddingBottom: '5px', marginBottom: '5px' }}
              ></textarea>
            </div>
            <hr className="divider" />
            <div className="message-container-input">
              <div className="left-footer">
                <span className="disabled-style margin-bottom-5">
                  <a className="margin-right-10" href="#" title="Emoji">
                    <img src="/Assets/public_assets/images/whatapp/refresh.svg" alt="Emoji" />
                  </a>
                </span>
                <span className="disabled-style">
                  <input name="fileUpload" type="file" title="Attach File" className="fileUploadIcon" />
                </span>
                <span className="input-template">
                  <a title="Whatsapp Template">
                    <img src="/Assets/public_assets/images/whatapp/orange-template-whatsapp.svg" alt="Whatsapp Template" />
                  </a>
                </span>
              </div>
              <div className="right-footer">
                <span className="disabled-style">
                  <a className="send-button" href="#" title="Send">
                    <img className="send-img" src="/Assets/public_assets/images/whatapp/paper-plane.svg" alt="Send" />
                  </a>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );

    if (isMobile) {
      return (
        <div
          className={`modal ${showWhatsappPanel ? 'show d-block' : 'd-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeWhatsappPanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxHeight: '90vh' }}>
            <div className="modal-content" style={{ height: '80vh' }}>
              {panelContent}
            </div>
          </div>
        </div>
      );
    }

    return showWhatsappPanel ? (
      <div className="col-12 transition-col" id="whatsappPanel">
        {panelContent}
      </div>
    ) : null;
  };

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
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
          <button className="btn-close" type="button" onClick={closeleadHistoryPanel}>
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
                          <div className="d-flex justify-content-between align-items-start mb-2">
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
                onClick={closeleadHistoryPanel}
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
      return (
        <div
          className={`modal ${leadHistoryPanel ? 'show d-block' : 'd-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeleadHistoryPanel();
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxHeight: '90vh' }}>
            <div className="modal-content" style={{ height: '85vh' }}>
              {panelContent}
            </div>
          </div>
        </div>
      );
    }

    return leadHistoryPanel ? (
      <div className="col-12 transition-col" id="leadHistoryPanel" style={{ height: '80vh' }}>
        {panelContent}
      </div>
    ) : null;
  };

  const handleRejectionReasonChange = (e) => {
    rejectionReasonRef.current = e.target.value;
    setRejectionReason(e.target.value);
  };

  const handleMarkDropout = async(profile) => {
    try {
      if (!profile || !profile._id) {
        alert('No profile selected');
        return;
      }

      // Show confirmation dialog
      const confirmDropout = window.confirm('Do you really want to mark this profile as dropout?');
      if (!confirmDropout) {
        return;
      }

      // Check if backend URL and token exist
      if (!backendUrl) {
        alert('Backend URL not configured');
        return;
      }

      if (!token) {
        alert('Authentication token missing');
        return;
      }

      // Send PUT request to backend API to update status
      const response = await axios.put(
        `${backendUrl}/college/update/${profile._id}`,
        {
          isDropout: true, // Set dropout status
          remarks: 'Marked as dropout'
        },
        {
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Profile marked as dropout successfully!');
        // Refresh the profile data
        await fetchProfileData();
      } else {
        console.error('API returned error:', response.data);
        alert(response.data.message || 'Failed to mark as dropout');
      }
    } catch (error) {
      console.error('Error marking as dropout:', error);
      alert('Failed to mark as dropout');
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>
          {/* Header */}
          <div className="bg-white shadow-sm border-bottom mb-3 sticky-top stickyBreakpoints">
            <div className="container-fluid py-2">
              <div className="row align-items-center justify-content-between">
                <div className="col-md-6 d-md-block d-sm-none">
                  <div className="main-tabs-container sticky-top" style={{ zIndex: 10, background: '#fff' }}>
                    <div className="btn-group" role="group" aria-label="eKYC Filters">
                      {ekycFilters.map((filter, index) => (
                        <div key={filter._id} className="position-relative d-inline-block me-2">
                          <button
                            className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                            onClick={() => handleCrmFilterClick( index)}
                          >
                            <i className={`fas ${filter._id === 'pendingEkyc' ? 'fa-clock' : filter._id === 'doneEkyc' ? 'fa-check-circle' : 'fa-list'} me-1`}></i>
                            {filter.name}
                            <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>({filter.count})</span>
                          </button>
                          {filter.milestone && (
                            <span
                              className="bg-success d-flex align-items-center milestoneResponsive"
                              style={{
                                fontSize: '0.75rem',
                                color: 'white',
                                verticalAlign: 'middle',
                                padding: '0.25em 0.5em',
                                transform: 'translate(15%, -100%)',
                                position: 'absolute',
                                borderRadius: '3px',
                                top: '-10px',
                                left: '50%',
                                zIndex: 1
                              }}
                              title={`Milestone: ${filter.milestone}`}
                            >
                              🚩 <span style={{ marginLeft: '4px' }}>{filter.milestone}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    <div className="input-group" style={{ maxWidth: '300px' }}>
                      <span className="input-group-text bg-white border-end-0 input-height">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        name="name"
                        className="form-control border-start-0 m-0"
                        placeholder="Quick search..."
                        value={filterData.name}
                        onChange={handleFilterChange}
                      />
                      {filterData.name && (
                        <button
                          className="btn btn-outline-secondary border-start-0"
                          type="button"
                          onClick={() => {
                            setFilterData(prev => ({ ...prev, name: '' }));
                            setAllProfiles(allProfilesData);
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                      className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className={`fas fa-filter me-1 ${!isFilterCollapsed ? 'fa-spin' : ''}`}></i>
                      Filters
                      {Object.values(filterData).filter(val => val && val !== 'true').length > 0 && (
                        <span className="bg-light text-dark ms-1">
                          {Object.values(filterData).filter(val => val && val !== 'true').length}
                        </span>
                      )}
                    </button>

                    <div className="btn-group">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        <i className="fas fa-th"></i>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      >
                        <i className="fas fa-list"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="container-fluid pb-2">
              <div className="card-body p-3 mt-3">
                <div className="d-flex flex-wrap gap-2 align-items-center mbResponsive">
                  {getCurrentFilters().map((filter, index) => (
                    <div key={index} className="d-flex align-items-center gap-1">
                      <div className='d-flex position-relative'>
                        <button
                          className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                          onClick={() => handleCrmFilterClick(filter._id, index)}
                        >
                          <i className={`fas ${mainTab === 'Ekyc' ?
                            (filter._id === 'pendingEkyc' ? 'fa-clock' :
                              filter._id === 'doneEkyc' ? 'fa-check-circle' : 'fa-list') :
                            (filter._id === 'pendingDocs' ? 'fa-hourglass-half' :
                              filter._id === 'documentDone' ? 'fa-check-double' : 'fa-folder-open')
                            } me-1`}></i>
                          {filter.name}
                          <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>
                            ({filter.count})
                          </span>
                        </button>

                        {filter.milestone && (
                          <span
                            className="bg-success d-flex align-items-center milestoneResponsive"
                            style={{
                              fontSize: '0.75rem',
                              color: 'white',
                              verticalAlign: 'middle',
                              padding: '0.25em 0.5em',
                              transform: 'translate(15%, -100%)',
                              position: 'absolute',
                              borderRadius: '3px',
                              top: '-10px',
                              left: '50%',
                              zIndex: 1
                            }}
                            title={`Milestone: ${filter.milestone}`}
                          >
                            🚩 <span style={{ marginLeft: '4px' }}>{filter.milestone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div> */}
          </div>

          {/* Advanced Filters */}
          {!isFilterCollapsed && (
            <div className="bg-white border-bottom shadow-sm">
              <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-filter text-primary me-2"></i>
                    <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                    <span className="bg-light text-dark ms-2">
                      {Object.values(filterData).filter(val => val && val !== 'true').length} Active
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={clearAllFilters}
                    >
                      <i className="fas fa-times-circle me-1"></i>
                      Clear All
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setIsFilterCollapsed(true)}
                    >
                      <i className="fas fa-chevron-up"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="content-body">
            <section className="list-view">
              <div className='row'>
                <div>
                  <div className="col-12 rounded equal-height-2 coloumn-2">
                    <div className="card px-3">
                      <div className="row" id="crm-main-row">
                        {allProfiles && allProfiles.length > 0 ? (
                          allProfiles.map((profile, profileIndex) => (
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
                                          <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Your Name'}</h6>
                                          <small className="text-muted">{profile._candidate?.mobile || 'Mobile Number'}</small>
                                        </div>
                                        <div style={{ marginLeft: '15px' }}>
                                          <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                            <i className="fas fa-phone"></i>
                                          </button>
                                          <img
                                            src="/Assets/public_assets/images/ekyc_done.png"
                                            alt="ekyc done"
                                            style={{ width: 100, height: 'auto', display: profile.kyc === true ? 'inline-block' : 'none' }}
                                          />
                                          <img
                                            src="/Assets/public_assets/images/ekyc_pending.png"
                                            alt="kyc pending"
                                            style={{ width: 100, height: 'auto', display: profile.kyc === false ? 'inline-block' : 'none' }}
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
                                              top: "28px",
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
                                            {Boolean(profile.kyc) && (
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
                                              onClick={() => handleMoveToAdmission(profile)}
                                            >
                                              Move to Admission
                                            </button>)}
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
                                              onClick={() => handleMarkDropout(profile)}
                                            >
                                              Mark Dropout
                                            </button>
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
                                                openEditPanel(profile, 'SetFollowup');
                                                console.log('selectedProfile', profile);
                                              }}
                                            >
                                              Set Followup
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
                                              top: "28px",
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
                                            {Boolean(profile.kyc) &&(
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
                                              onClick={() => handleMoveToAdmission(profile)}
                                            >
                                              Move to Admission
                                            </button>)}
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
                                              onClick={() => handleMarkDropout(profile)}
                                            >
                                              Mark Dropout
                                            </button>
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
                                                openEditPanel(profile, 'SetFollowup');
                                                console.log('selectedProfile', profile);
                                              }}
                                            >
                                              Set Followup
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
                                    {(activeTab[profileIndex] || 0) === 0 && (
                                      <div className="tab-pane active" id="lead-details">
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
                                                <div className="info-value">{(profile.leadOwner && Array.isArray(profile.leadOwner) ? profile.leadOwner.join(', ') : profile.leadOwner) || 'N/A'}</div>
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
                                                      <div className="info-value">{(profile.leadOwner && Array.isArray(profile.leadOwner) ? profile.leadOwner.join(', ') : profile.leadOwner) || 'N/A'}</div>
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
                                                        {profile.followups.length>0
                                                          ? (() => {
                                                            const dateObj = new Date(profile.followups[profile.followups.length - 1].date);
                                                            const datePart = dateObj.toLocaleDateString('en-GB', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                            }).replace(/ /g, '/');
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
                                                      <div className="info-value">{profile.createdAt ?
                                                        new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD MODIFICATION DATE</div>
                                                      <div className="info-value">{profile.updatedAt ?
                                                        new Date(profile.updatedAt).toLocaleString() : 'N/A'}</div>
                                                    </div>
                                                  </div>
                                                  <div className="col-xl- col-3">
                                                    <div className="info-group">
                                                      <div className="info-label">LEAD MODIFICATION BY</div>
                                                      <div className="info-value">{profile.logs && profile.logs.length ? profile.logs[profile.logs.length - 1]?.user?.name || '' : ''}
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
                                                <h2 className="resume-section-title">Professional Summary <i className="fa fa-clock-o" aria-hidden="true" style={{ fontSize: "16px" }}></i> </h2>
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
                                                  profile._candidate?.experiences && profile._candidate.experiences.length > 0 && (
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

                                                {profile._candidate?.qualifications && profile._candidate.qualifications.length > 0 && (
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
                                                {profile._candidate?.personalInfo?.skills && profile._candidate.personalInfo.skills.length > 0 && (
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

                                                {profile._candidate?.personalInfo?.languages && profile._candidate.personalInfo.languages.length > 0 && (
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

                                                {profile._candidate?.personalInfo?.certifications && profile._candidate.personalInfo.certifications.length > 0 && (
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

                                                {profile._candidate?.personalInfo?.projects && profile._candidate.personalInfo.projects.length > 0 && (
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

                                                {profile._candidate?.personalInfo?.interest && profile._candidate.personalInfo.interest.length > 0 && (
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
                                    {(activeTab[profileIndex] || 0) === 4 && (
                                      <div className="tab-pane active" id='studentsDocuments'>
                                        {(() => {
                                          const documentsToDisplay = profile.uploadedDocs || profile._candidate?.documents || [];
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
                                                        <h5 className='badge position-absolute'>{latestUpload?.status? latestUpload.status : ''}</h5>
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
                                                                      <i className="fas fa-file-pdf" style={{ fontSize: '40px', color: '#dc3545' }}></i>
                                                                      <p style={{ fontSize: '12px', marginTop: '10px' }}>PDF Document</p>
                                                                    </div>
                                                                  );
                                                                } else {
                                                                  return (
                                                                    <div className="document-preview-icon">
                                                                      <i className={`fas ${fileType === 'document' ? 'fa-file-word' :
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
                                                                  onClick={() => openDocumentModal(doc, profile)}
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
                                                            <h4 className="document-title">{doc.Name || doc.name || `Document ${index + 1}`}</h4>
                                                            <div className="document-actions">
                                                              {((!latestUpload) || (latestUpload?.status || doc.status) === 'Rejected')? (
                                                                <button className="action-btn upload-btn" title="Upload Document" onClick={() => {
                                                                  setSelectedProfile(profile); // Set the current profile
                                                                  openUploadModal(doc);        // Open the upload modal
                                                                }}>
                                                                  <i className="fas fa-cloud-upload-alt"></i>
                                                                  Upload
                                                                </button>
                                                              ) : ((latestUpload?.status || doc.status) === 'Pending') ? (
                                                                <button
                                                                  className="action-btn verify-btn"
                                                                  onClick={() => openDocumentModal(doc, profile)}
                                                                  title="Verify Document"
                                                                >
                                                                  <i className="fas fa-check"></i>
                                                                  VERIFY
                                                                </button>
                                                              ) : (
                                                                <button
                                                                  className="action-btn view-btn"
                                                                  onClick={() => openDocumentModal(doc)}
                                                                  title="View Document"
                                                                >
                                                                  <i className="fas fa-eye"></i>
                                                                  View
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
                          ))
                        ) : (
                          <div className="col-12 text-center py-5">
                            <div className="text-muted">
                              <i className="fas fa-users fa-3x mb-3"></i>
                              <h5>No profiles found</h5>
                              <p>Try adjusting your filters or search criteria</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <nav aria-label="Page navigation" className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-muted">
                    Page {currentPage} of {totalPages} ({allProfiles.length} results)
                  </small>
                </div>

                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo;
                    </button>
                  </li>

                  {currentPage > 3 && (
                    <>
                      <li className="page-item">
                        <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                      </li>
                      {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                    </>
                  )}

                  {getPaginationPages().map((pageNumber) => (
                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(pageNumber)}>
                        {pageNumber}
                      </button>
                    </li>
                  ))}

                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                      <li className="page-item">
                        <button className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                      </li>
                    </>
                  )}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </section>
          </div>


        </div>

        {/* Right Sidebar for Desktop - Panels */}
        {!isMobile && (
          <div className="col-4">
            <div className="row sticky-top stickyBreakpoints">
              {renderEditPanel()}
              {renderWhatsAppPanel()}
              {renderLeadHistoryPanel()}
            </div>
          </div>
        )}

        {/* Mobile Modals */}
        {isMobile && renderEditPanel()}
        {isMobile && renderWhatsAppPanel()}
        {isMobile && renderLeadHistoryPanel()}



      </div>

      <style>
        {`
        /* Existing styles */
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

        /* Main Tabs Styling */
        .main-tabs-container {
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 0;
        }

        .nav-tabs-main {
          border-bottom: none;
        }

        .nav-link.main-tab {
          background: none;
          border: none;
          color: #6c757d;
          font-weight: 600;
          font-size: 16px;
          padding: 15px 25px;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link.main-tab:hover {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.05);
          border-bottom-color: rgba(13, 110, 253, 0.3);
        }

        .nav-link.main-tab.active {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.1)!important;
          border-bottom-color: #0d6efd;
        }

        /* Tab Badge Styling */
        .tab-badge {
          background: linear-gradient(45deg, #fd7e14, #e8590c);
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }

        .nav-link.main-tab.active .tab-badge {
          background: linear-gradient(45deg, #0d6efd, #0b5ed7);
        }

        /* Enhanced Button Styling */
        .btn-sm {
          font-size: 13px;
          padding: 6px 12px;
        }

        .btn-primary {
          background: linear-gradient(45deg, #0d6efd, #0b5ed7);
          border: none;
        }

        .btn-outline-secondary {
          border-color: #dee2e6;
          color: #6c757d;
        }

        .btn-outline-secondary:hover {
          background-color: #f8f9fa;
          border-color: #dee2e6;
          color: #495057;
        }


.upload-modal-overlay {
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
}

.upload-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.upload-modal-header {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.upload-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.upload-modal-body {
  padding: 25px;
}

.file-drop-zone {
  border: 3px dashed #ddd;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
}

.file-drop-zone:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 48px;
  color: #007bff;
  margin-bottom: 10px;
}

.drop-zone-content h4 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.drop-zone-content p {
  margin: 0;
  color: #666;
}

.file-types {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.file-types span {
  font-size: 12px;
  color: #999;
}

.file-preview-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selected-file-info h4 {
  margin-bottom: 15px;
  color: #333;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.file-icon {
  width: 50px;
  height: 50px;
  background: #007bff;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.file-info {
  flex: 1;
}

.file-name {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.file-size {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 12px;
}

.upload-preview {
  text-align: center;
}

.upload-preview h5 {
  margin-bottom: 15px;
  color: #333;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid #eee;
}

.upload-progress-section {
  text-align: center;
}

.upload-progress-section h5 {
  margin-bottom: 15px;
  color: #333;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s ease;
}

.upload-modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafafa;
  border-radius: 0 0 12px 12px;
}

@media (max-width: 768px) {
  .upload-modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .upload-modal-header {
    padding: 15px 20px;
  }
  
  .upload-modal-body {
    padding: 20px;
  }
  
  .file-drop-zone {
    padding: 30px 15px;
  }
}


        /* ========================================
           🎯 NEW: Responsive Design (ADD THESE STYLES)
           ======================================== */
        /* Responsive Design */
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

        @media(max-width: 768px) {
          .mbResponsive{        
            flex-direction:column;
            align-items:flex-start!important;
          }
          .milestoneResponsive{        
            right:-77px;
            top:27px;
          }
          .nav-link.main-tab {
            font-size: 14px;
            padding: 12px 15px;
          }
          
          .tab-badge {
            font-size: 10px;
            padding: 1px 6px;
          }
        }


        /* Document History Auto Height CSS - Add to your existing styles */

/* Document History Container */
.document-history {
  width: 100%;
  max-height: 1000px;
  height: auto !important;
  padding: 0;
}

/* History Item Styling */
.document-history .history-item {
  display: block !important;
  padding: 15px;
  margin-bottom: 15px;
  backgroundColor: #f8f9fa;
  borderRadius: 12px;
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

/* Other Document Types Auto Height */




/* History Info Section */
.document-history .history-info {
  padding-top: 15px;
  border-top: 2px solid #e9ecef;
  margin-top: 10px;
}

.document-history .history-date {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.document-history .history-status {
  margin-bottom: 12px;
}

.document-history .history-status span {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Action Buttons */
.document-history .history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.document-history .history-actions .btn {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
  border: 1px solid transparent;
}

.document-history .history-actions .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.document-history .history-actions .btn-outline-primary {
  border-color: #007bff;
  color: #007bff;
}

.document-history .history-actions .btn-outline-primary:hover {
  background-color: #007bff;
  color: white;
}

.document-history .history-actions .btn-outline-secondary {
  border-color: #6c757d;
  color: #6c757d;
}

.document-history .history-actions .btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

/* Rejection Reason Styling */
.document-history .rejection-reason {
  margin-top: 10px;
  padding: 8px 0;
}

.document-history .rejection-reason strong {
  color: #856404;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.document-history .rejection-reason p {
  margin: 0;
  padding: 8px 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  font-size: 13px;
  color: #856404;
  line-height: 1.4;
}

/* Loading Animation */
.document-history .history-preview iframe,
.document-history .history-preview img {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.document-history .history-preview iframe[src],
.document-history .history-preview img[src] {
  opacity: 1;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .document-history .history-preview iframe.pdf-thumbnail {
    height: auto !important;
    max-height: 600px;
  }
  
  .document-history .history-preview iframe:not(.pdf-thumbnail) {
    height: auto !important;
    max-height: 600px;
  }
}

@media (max-width: 768px) {
  .document-history .history-preview iframe.pdf-thumbnail {
    height: 50vh !important;
    min-height: 300px;
    max-height: 500px;
  }
  
  .document-history .history-preview iframe:not(.pdf-thumbnail) {
    height: 40vh !important;
    min-height: 200px;
    max-height: 400px;
  }
  
  .document-history .history-item {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .document-history .history-actions {
    flex-direction: column;
  }
  
  .document-history .history-actions .btn {
    width: 100%;
    justify-content: center;
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

/* Smooth Hover Effects */
.document-history .history-item {
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
}

.document-history .history-item:hover {
  background: linear-gradient(145deg, #e9ecef, #f8f9fa);
}
        `}
      </style>
    </div>
  );
};

export default KYCManagement;
