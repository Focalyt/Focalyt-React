import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import './CourseCrm.css';
import './crm.css';

const CRMDashboard = () => {
  // ========================================
  // 🎯 NEW: Main Tab State (ADD THIS)
  // ========================================
  const [mainTab, setMainTab] = useState('Ekyc'); // 'Ekyc' or 'AllAdmission'

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
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);

  // Static document data for demonstration
  const staticDocuments = [
    {
      _id: 'doc1',
      Name: 'Aadhaar Card',
      uploads: [{
        _id: 'upload1',
        fileUrl: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=400',
        uploadedAt: new Date('2024-01-15'),
        status: 'Pending'
      }]
    },
    {
      _id: 'doc2',
      Name: 'PAN Card',
      uploads: [{
        _id: 'upload2',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
        uploadedAt: new Date('2024-01-16'),
        status: 'Verified'
      }]
    },
    {
      _id: 'doc3',
      Name: '10th Marksheet',
      uploads: [{
        _id: 'upload3',
        fileUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
        uploadedAt: new Date('2024-01-17'),
        status: 'Rejected'
      }]
    },
    {
      _id: 'doc4',
      Name: '12th Marksheet',
      uploads: []
    },
    {
      _id: 'doc5',
      Name: 'Passport Photo',
      uploads: [{
        _id: 'upload5',
        fileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        uploadedAt: new Date('2024-01-18'),
        status: 'Verified'
      }]
    }
  ];

  // Static profile data
  const staticProfileData = [
    {
      _id: 'profile1',
      _candidate: {
        name: 'Rahul Sharma',
        mobile: '+91 9876543210',
        email: 'rahul.sharma@email.com',
        documents: staticDocuments
      },
      _leadStatus: { _id: 'status1', title: 'Hot Lead' },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      _course: {
        name: 'Full Stack Development',
        sectors: 'Information Technology'
      },
      // ========================================
      // 🎯 NEW: Add eKYC Status Field (ADD THIS TO YOUR DATA)
      // ========================================
      ekycStatus: 'pending' // 'pending' | 'done' - for ekyc filtering
    }
  ];

  // ========================================
  // 🎯 NEW: eKYC Filters Configuration (ADD THIS)
  // Main filters for eKYC tab
  // ========================================
  const [ekycFilters] = useState([
    { _id: 'pendingEkyc', name: 'Ekyc Pending', count: 1771, milestone: '' },
    { _id: 'doneEkyc', name: 'Ekyc Done', count: 1770, milestone: 'Ekyc Done' },
    { _id: 'All', name: 'All', count: 1, milestone: '' },
  ]);

  // ========================================
  // 🎯 NEW: All Admission Filters Configuration (ADD THIS)
  // Main filters for All Admission tab
  // ========================================
  const [admissionFilters] = useState([
    { _id: 'pendingDocs', name: 'Pending For Batch Assign', count: 856, milestone: '' },
    { _id: 'documentDone', name: 'Batch Assigned', count: 624, milestone: 'Completed' },
    { _id: 'dropout', name: 'Dropout', count: 1480, milestone: '' },
    { _id: 'alladmission', name: 'All Lists', count: 1480, milestone: '' },
  ]);

  // ========================================
  // 🎯 NEW: Get Current Filters Function (ADD THIS)
  // Returns appropriate filters based on main tab
  // ========================================
  const getCurrentFilters = () => {
    return mainTab === 'Ekyc' ? ekycFilters : admissionFilters;
  };

  // Initialize data
  useEffect(() => {
    setAllProfiles(staticProfileData);
    setAllProfilesData(staticProfileData);
  }, []);

  // Document functions (keeping existing ones)
  const openDocumentModal = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
    setDocumentZoom(1);
    setDocumentRotation(0);
    document.body?.classList.add('no-scroll');
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setShowRejectionForm(false);
    setRejectionReason('');
    document.body?.classList.remove('no-scroll');
  };

  const zoomIn = () => {
    setDocumentZoom(prev => prev + 0.1);
  };

  const zoomOut = () => {
    setDocumentZoom(prev => prev > 0.5 ? prev - 0.1 : prev);
  };

  const rotateDocument = () => {
    setDocumentRotation(prev => (prev + 90) % 360);
  };

  const updateDocumentStatus = (uploadId, status) => {
    console.log(`Updating document ${uploadId} to ${status}`);
    if (status === 'Rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
      if (status === 'Verified') {
      // Update profile eKYC status to 'done'
      setAllProfiles(prevProfiles => prevProfiles.map(profile =>
        profile._id === selectedProfile._id
          ? { ...profile, ekycStatus: 'done' }
          : profile
      ));
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

  const filterDocuments = (documents) => {
    if (statusFilter === 'all') return documents;
    return documents.filter(doc => {
      if (doc.uploads.length === 0) return statusFilter === 'none';
      return doc.uploads[doc.uploads.length - 1].status.toLowerCase() === statusFilter;
    });
  };

  const getDocumentCounts = (documents) => {
    const totalDocs = documents.length;
    const uploadedDocs = documents.filter(doc => doc.uploads.length > 0).length;
    const pendingDocs = documents.filter(doc =>
      doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending'
    ).length;
    const verifiedDocs = documents.filter(doc =>
      doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Verified'
    ).length;
    const rejectedDocs = documents.filter(doc =>
      doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected'
    ).length;

    return { totalDocs, uploadedDocs, pendingDocs, verifiedDocs, rejectedDocs };
  };

  // ========================================
  // 🎯 NEW: Main Tab Change Handler (ADD THIS)
  // Handles switching between eKYC and All Admission tabs
  // ========================================
  const handleMainTabChange = (tabName) => {
    setMainTab(tabName);
    setActiveCrmFilter(0); // Reset to first filter
    // Reset filters and fetch appropriate data
    applyFiltersForTab(tabName, 0);
  };

  // ========================================
  // 🎯 NEW: Tab-Specific Filter Logic (ADD THIS)
  // Apply filters based on main tab and sub-filter
  // ========================================
  const applyFiltersForTab = (mainTabName, filterIndex) => {
    const currentFilters = mainTabName === 'Ekyc' ? ekycFilters : admissionFilters;
    const selectedFilter = currentFilters[filterIndex];

    let filteredData = [...staticProfileData];

    if (mainTabName === 'Ekyc') {
      // 🔹 eKYC Tab Filtering Logic
      if (selectedFilter._id === 'pendingEkyc') {
        filteredData = filteredData.filter(profile => profile.ekycStatus === 'pending');
      } else if (selectedFilter._id === 'doneEkyc') {
        filteredData = filteredData.filter(profile => profile.ekycStatus === 'done');
      }
      // 'All' shows all data
    } else {
      // 🔹 All Admission Tab Filtering Logic
      if (selectedFilter._id === 'pendingDocs') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents || staticDocuments;
          const counts = getDocumentCounts(docs);
          return counts.pendingDocs > 0;
        });
      } else if (selectedFilter._id === 'documentDone') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents || staticDocuments;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      } else if (selectedFilter._id === 'dropout') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents || staticDocuments;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      } else if (selectedFilter._id === 'alladmission') {
        filteredData = filteredData.filter(profile => {
          const docs = profile._candidate?.documents || staticDocuments;
          const counts = getDocumentCounts(docs);
          return counts.verifiedDocs === counts.totalDocs && counts.totalDocs > 0;
        });
      }
      // 'allDocuments' shows all data
    }

    setAllProfiles(filteredData);
  };

  // ========================================
  // 🎯 UPDATED: Filter Click Handler (MODIFY THIS)
  // Updated to work with new tab system
  // ========================================
  const handleCrmFilterClick = (_id, index) => {
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

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

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
    fetchSubStatus()
  }, [seletectedStatus]);

  useEffect(() => {
    console.log('seletectedSubStatus', seletectedSubStatus)
  }, [seletectedSubStatus]);

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
    setTimeout(() => applyFilters(newFilterData), 100);
  };

  const formatDate = (date) => {
    if (!date) return '';
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
    setTimeout(() => applyFilters(newFilterData), 100);
  };

  const handleDateChange = (date, fieldName) => {
    setFilterData(prev => ({
      ...prev,
      [fieldName]: date
    }));

    setTimeout(() => {
      const newFilterData = {
        ...filterData,
        [fieldName]: date
      };
      applyFilters(newFilterData);
    }, 100);
  };

  const clearCreatedDate = () => {
    setFilterData(prev => ({
      ...prev,
      createdFromDate: null,
      createdToDate: null
    }));
    setTimeout(() => applyFilters({
      ...filterData,
      createdFromDate: null,
      createdToDate: null
    }), 100);
  };

  const clearModifiedDate = () => {
    setFilterData(prev => ({
      ...prev,
      modifiedFromDate: null,
      modifiedToDate: null
    }));
    setTimeout(() => applyFilters({
      ...filterData,
      modifiedFromDate: null,
      modifiedToDate: null
    }), 100);
  };

  const clearNextActionDate = () => {
    setFilterData(prev => ({
      ...prev,
      nextActionFromDate: null,
      nextActionToDate: null
    }));
    setTimeout(() => applyFilters({
      ...filterData,
      nextActionFromDate: null,
      nextActionToDate: null
    }), 100);
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

      // Other existing filters...
      // (keeping the existing filter logic)

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
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

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
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

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
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      let followupDateTime = '';
      if (followupDate && followupTime) {
        followupDateTime = new Date(`${followupDate}T${followupTime}`);
      }

      const data = {
        _leadStatus: seletectedStatus?._id || seletectedStatus,
        _leadSubStatus: seletectedSubStatus?._id || '',
        followup: followupDateTime ? followupDateTime.toISOString() : '',
        remarks
      };

      const response = await axios.put(`${backendUrl}/college/lead/status_change/${selectedProfile._id}`, data, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Status updated successfully!');
        closeEditPanel();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const [user, setUser] = useState({
    image: '',
    name: 'John Doe'
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [currentPage]);

  const fetchProfileData = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      if (!token) {
        console.warn('No token found in session storage.');
        return;
      }

      const response = await axios.get(`${backendUrl}/college/appliedCandidates?page=${currentPage}`, {
        headers: {
          'x-auth': token,
        },
      });

      if (response.data.success && response.data.data) {
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

  // (Keeping other existing state and functions...)

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

  // Additional helper functions and components remain the same...
  // (Document Modal, Edit Panel, etc. - keeping existing implementations)

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

  // Document Modal Component (keeping existing implementation)
  const DocumentModal = () => {
    if (!showDocumentModal || !selectedDocument) return null;

    const latestUpload = selectedDocument.uploads.length > 0 ? selectedDocument.uploads[selectedDocument.uploads.length - 1] : null;

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
                {latestUpload ? (
                  <>
                    <img
                      src={latestUpload.fileUrl}
                      alt="Document Preview"
                      style={{
                        transform: `scale(${documentZoom}) rotate(${documentRotation}deg)`,
                        transition: 'transform 0.3s ease',
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                    />
                    <div className="preview-controls">
                      <button onClick={zoomIn} className="control-btn" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fas fa-search-plus"></i> Zoom In
                      </button>
                      <button onClick={zoomOut} className="control-btn" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fas fa-search-minus"></i> Zoom Out
                      </button>
                      <button onClick={rotateDocument} className="control-btn" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fas fa-redo"></i> Rotate
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-document">
                    <i className="fas fa-file-times fa-3x text-muted mb-3"></i>
                    <p>No document uploaded</p>
                  </div>
                )}
              </div>
            </div>

            <div className="document-info-section">
              <div className="info-card">
                <h4>Document Information</h4>
                <div className="info-row">
                  <strong>Document Name:</strong> {selectedDocument.Name}
                </div>
                <div className="info-row">
                  <strong>Upload Date:</strong> {latestUpload ? formatDate(latestUpload.uploadedAt) : 'N/A'}
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`${getStatusBadgeClass(latestUpload?.status)} ms-2`}>
                    {latestUpload?.status || 'No Uploads'}
                  </span>
                </div>
              </div>

              {latestUpload?.status === 'Pending' && (
                <div className="verification-section">
                  <div className="info-card">
                    <h4>Verification Steps</h4>
                    <ol className="verification-steps">
                      <li>Check if the document is clearly visible</li>
                      <li>Verify the document belongs to the candidate</li>
                      <li>Confirm all required details are present</li>
                      <li>Check the document validity dates</li>
                      <li>Ensure there are no signs of tampering</li>
                    </ol>
                  </div>

                  {!showRejectionForm ? (
                    <div className="action-buttons">
                      <button
                        className="btn btn-success me-2"
                        onClick={() => updateDocumentStatus(latestUpload._id, 'Verified')}
                      >
                        <i className="fas fa-check"></i> Approve Document
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setShowRejectionForm(true)}
                      >
                        <i className="fas fa-times"></i> Reject Document
                      </button>
                    </div>
                  ) : (
                    <div className="rejection-form">
                      <h4>Provide Rejection Reason</h4>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a detailed reason for rejection..."
                        rows="4"
                        className="form-control mb-3"
                      />
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-danger"
                          onClick={() => updateDocumentStatus(latestUpload._id, 'Rejected')}
                        >
                          Confirm Rejection
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowRejectionForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedDocument.uploads.length > 0 && (
                <div className="info-card">
                  <h4>Document History</h4>
                  <div className="document-history">
                    {selectedDocument.uploads.map((upload, index) => (
                      <div key={index} className="history-item">
                        <div className="history-date">
                          {formatDate(upload.uploadedAt)}
                        </div>
                        <div className="history-status">
                          <span className={`${getStatusBadgeClass(upload.status)}`}>
                            {upload.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

  // Render Edit Panel (keeping existing implementation but simplified for brevity)
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
                UPDATE STATUS
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


  return (
    <div className="container-fluid">

      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>
          {/* Header */}
          <div className="bg-white shadow-sm border-bottom mb-3 sticky-top stickyBreakpoints">
            <div className="container-fluid py-2">
              <div className="row align-items-center">
                <div className="col-md-6 d-md-block d-sm-none">
                   <div className="main-tabs-container">
                <ul className="nav nav-tabs nav-tabs-main border-0">
                  {/* 🔹 eKYC Management Tab */}
                  <li className="nav-item">
                    <button
                      className={`nav-link main-tab ${mainTab === 'Ekyc' ? 'active' : ''}`}
                      onClick={() => handleMainTabChange('Ekyc')}
                    >
                      <i className="fas fa-id-card me-2"></i>
                      eKYC Management
                      <span className="tab-badge">
                        {ekycFilters.reduce((sum, filter) => sum + filter.count, 0)}
                      </span>
                    </button>
                  </li>
                  {/* 🔹 All Admission Tab */}
                  <li className="nav-item">
                    <button
                      className={`nav-link main-tab ${mainTab === 'AllAdmission' ? 'active' : ''}`}
                      onClick={() => handleMainTabChange('AllAdmission')}
                    >
                      <i className="fas fa-graduation-cap me-2"></i>
                      All Admission
                      <span className="tab-badge">
                        {admissionFilters.reduce((sum, filter) => sum + filter.count, 0)}
                      </span>
                    </button>
                  </li>
                </ul>
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

            {/* ========================================
                🎯 NEW: Main Tabs Section (ADD THIS ENTIRE SECTION)
                Two main tabs: eKYC Management and All Admission
                ======================================== */}
            <div className="container-fluid pb-2">
             

              {/* ========================================
                  🎯 NEW: Dynamic Sub-filters Section (ADD THIS)
                  Shows different filters based on selected main tab
                  ======================================== */}
              <div className="card-body p-3 mt-3">
                <div className="d-flex flex-wrap gap-2 align-items-center mbResponsive">
                  {getCurrentFilters().map((filter, index) => (
                    <div key={index} className="d-flex align-items-center gap-1">
                      <div className='d-flex position-relative'>
                        <button
                          className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                          onClick={() => handleCrmFilterClick(filter._id, index)}
                        >
                          {/* 🔹 Dynamic Icons Based on Tab */}
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


                        {/* 🔹 Milestone Badge */}
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
                              borderRadius: '3px'
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
            </div>
          </div>

          {/* Advanced Filters (keeping existing implementation) */}
          {!isFilterCollapsed && (
            <div className="bg-white border-bottom shadow-sm">
              <div className="container-fluid py-4">
                {/* Existing advanced filters code... */}
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
                {/* Rest of the existing advanced filters... */}
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

                        {allProfiles.map((profile, profileIndex) => (
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
                                        <div className="circular-progress-container" data-percent="40">
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
                                          style={{ width: 100, height: 'auto', marginLeft: 8, display: profile.ekycStatus === 'done' ? 'inline-block' : 'none' }}
                                        />
                                        <img
                                          src="/Assets/public_assets/images/ekyc_pending.png"
                                          alt="ekyc pending"
                                          style={{ width: 100, height: 'auto', display: profile.ekycStatus === 'pending' ? 'inline-block' : 'none' }}
                                        />

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
                                          >
                                            Assign Batch
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
                                            onClick={() => alert("dropout")}
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
                                          >
                                            Assign Batch
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
                                            onClick={() => alert("dropout")}
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
                                                    <div className="info-value">{profile.followupDate ? new Date(profile.followupDate).toLocaleString() : 'N/A'}</div>
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
                                              <h2 className="resume-section-title">Professional Summary <i class="fa fa-clock-o" aria-hidden="true" style={{ fontSize: "16px" }}></i> </h2>
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
                                      <div className="enhanced-documents-panel">


                                        {/* Candidate Info Header */}
                                        <div className="candidate-header-section">
                                          <div className="candidate-info-card">
                                            <div className="candidate-avatar-large">
                                              {profile._candidate?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div className="candidate-details">
                                              <h3>{profile._candidate?.name}</h3>
                                              <div className="contact-details">
                                                <span><i className="fas fa-envelope text-primary"></i> {profile._candidate?.email}</span>
                                                <span><i className="fas fa-phone text-success"></i> {profile._candidate?.mobile}</span>
                                              </div>
                                            </div>
                                            <div className="completion-ring">
                                              {(() => {
                                                const counts = getDocumentCounts(profile._candidate?.documents || staticDocuments);
                                                const percentage = Math.round((counts.verifiedDocs / counts.totalDocs) * 100);
                                                return (
                                                  <div className="circular-progress" data-percentage={percentage}>
                                                    <svg className="progress-ring" width="80" height="80">
                                                      <circle
                                                        cx="40"
                                                        cy="40"
                                                        r="35"
                                                        fill="none"
                                                        stroke="#e6e6e6"
                                                        strokeWidth="6"
                                                      />
                                                      <circle
                                                        cx="40"
                                                        cy="40"
                                                        r="35"
                                                        fill="none"
                                                        stroke="#4facfe"
                                                        strokeWidth="6"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${(percentage / 100) * 220} 220`}
                                                        transform="rotate(-90 40 40)"
                                                        className="progress-bar"
                                                      />
                                                    </svg>
                                                    <div className="percentage-text">
                                                      <span className="percentage">{percentage}%</span>
                                                      <span className="label">Complete</span>
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Enhanced Stats Grid */}
                                        <div className="stats-grid">
                                          {(() => {
                                            const counts = getDocumentCounts(profile._candidate?.documents || staticDocuments);
                                            return (
                                              <>
                                                <div className="stat-card total-docs">
                                                  <div className="stat-icon">
                                                    <i className="fas fa-file-alt"></i>
                                                  </div>
                                                  <div className="stat-info">
                                                    <h4>{counts.totalDocs}</h4>
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
                                                    <h4>{counts.uploadedDocs}</h4>
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
                                                    <h4>{counts.pendingDocs}</h4>
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
                                                    <h4>{counts.verifiedDocs}</h4>
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
                                                    <h4>{counts.rejectedDocs}</h4>
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
                                              <button
                                                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                                onClick={() => setStatusFilter('all')}
                                              >
                                                <i className="fas fa-list-ul"></i>
                                                All Documents
                                                <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).totalDocs}</span>
                                              </button>
                                              <button
                                                className={`filter-btn pending ${statusFilter === 'pending' ? 'active' : ''}`}
                                                onClick={() => setStatusFilter('pending')}
                                              >
                                                <i className="fas fa-clock"></i>
                                                Pending
                                                <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).pendingDocs}</span>
                                              </button>
                                              <button
                                                className={`filter-btn verified ${statusFilter === 'verified' ? 'active' : ''}`}
                                                onClick={() => setStatusFilter('verified')}
                                              >
                                                <i className="fas fa-check-circle"></i>
                                                Verified
                                                <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).verifiedDocs}</span>
                                              </button>
                                              <button
                                                className={`filter-btn rejected ${statusFilter === 'rejected' ? 'active' : ''}`}
                                                onClick={() => setStatusFilter('rejected')}
                                              >
                                                <i className="fas fa-times-circle"></i>
                                                Rejected
                                                <span className="badge">{getDocumentCounts(profile._candidate?.documents || staticDocuments).rejectedDocs}</span>
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Enhanced Documents Grid */}
                                        <div className="documents-grid-enhanced">
                                          {filterDocuments(profile._candidate?.documents || staticDocuments).map((doc, index) => {
                                            const latestUpload = doc.uploads.length > 0 ? doc.uploads[doc.uploads.length - 1] : null;

                                            return (
                                              <div key={doc._id} className="document-card-enhanced">
                                                <div className="document-image-container">
                                                  {latestUpload ? (
                                                    <>
                                                      <img
                                                        src={latestUpload.fileUrl}
                                                        alt="Document Preview"
                                                        className="document-image"
                                                      />
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
                                                    {latestUpload?.status === 'Pending' && (
                                                      <span className="status-badge-new pending">
                                                        <i className="fas fa-clock"></i>
                                                        Pending
                                                      </span>
                                                    )}
                                                    {latestUpload?.status === 'Verified' && (
                                                      <span className="status-badge-new verified">
                                                        <i className="fas fa-check-circle"></i>
                                                        Verified
                                                      </span>
                                                    )}
                                                    {latestUpload?.status === 'Rejected' && (
                                                      <span className="status-badge-new rejected">
                                                        <i className="fas fa-times-circle"></i>
                                                        Rejected
                                                      </span>
                                                    )}
                                                    {!latestUpload && (
                                                      <span className="status-badge-new not-uploaded">
                                                        <i className="fas fa-upload"></i>
                                                        Required
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                <div className="document-info-section">
                                                  <div className="document-header">
                                                    <h4 className="document-title">{doc.Name}</h4>
                                                    <div className="document-actions">
                                                      {!latestUpload ? (
                                                        <button className="action-btn upload-btn" title="Upload Document">
                                                          <i className="fas fa-cloud-upload-alt"></i>
                                                          Upload
                                                        </button>
                                                      ) : latestUpload.status === 'Pending' ? (
                                                        <button
                                                          className="action-btn verify-btn"
                                                          onClick={() => openDocumentModal(doc)}
                                                          title="Verify Document"
                                                        >
                                                          <i className="fas fa-search"></i>
                                                          Verify
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
                                                        {latestUpload ?
                                                          new Date(latestUpload.uploadedAt).toLocaleDateString('en-GB', {
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
                                          })}
                                        </div>


                                        <DocumentModal />
                                      </div>


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
        /* ========================================
           🎯 EXISTING STYLES (KEEP THESE)
           ======================================== */
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

        /* ========================================
           🎯 NEW: Main Tabs Styling (ADD THESE STYLES)
           ======================================== */
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

        /* ========================================
           🎯 NEW: Tab Badge Styling (ADD THESE STYLES)
           ======================================== */
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

        /* ========================================
           🎯 NEW: Enhanced Button Styling (ADD THESE STYLES)
           ======================================== */
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

        /* ========================================
           🎯 NEW: Responsive Design (ADD THESE STYLES)
           ======================================== */
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
        `}
      </style>
    </div>
  );
};

export default CRMDashboard;