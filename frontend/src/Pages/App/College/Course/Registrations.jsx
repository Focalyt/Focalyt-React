import React, { useState, useEffect } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import './CourseCrm.css';

const CRMDashboard = () => {
  // const [activeTab, setActiveTab] = useState(0);
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

  //Pagination

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

  useEffect(() => {
    getPaginationPages()
  }, [totalPages])




  //Date picker
  const today = new Date();  // Current date


  // Toggle POPUP

  const togglePopup = (profileIndex) => {
    setShowPopup(prev => prev === profileIndex ? null : profileIndex);
  };

  // Filter state from Registration component
  const [filterData, setFilterData] = useState({
    name: '',
    courseType: '',
    status: 'true',
    leadStatus: '',
    sector: '',
    // Date filter states
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

  const [crmFilters, setCrmFilters] = useState([
    { _id: '', name: '', count: 0, milestone: '' },

  ]);
  const [statuses, setStatuses] = useState([
    { _id: '', name: '', count: 0 },

  ]);

  // edit status and set followup
  const [seletectedStatus, setSelectedStatus] = useState('');
  const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [remarks, setRemarks] = useState('');


  const [subStatuses, setSubStatuses] = useState([


  ]);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const tabs = [
    'Lead Details',
    'Profile',
    'Job History',
    'Course History'
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
    fetchStatus()

  }, []);

  useEffect(() => {
    fetchSubStatus()

  }, [seletectedStatus]);

  useEffect(() => {
    console.log('seletectedSubStatus', seletectedSubStatus)

  }, [seletectedSubStatus]);


  //Advance filter

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

    // Apply filters immediately
    setTimeout(() => applyFilters(newFilterData), 100);
  };
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB');
  };


  // 5. Clear functions
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

    // Auto-apply filters after short delay
    setTimeout(() => {
      const newFilterData = {
        ...filterData,
        [fieldName]: date
      };
      applyFilters(newFilterData);
    }, 100);
  };

  // 4. Clear date functions
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
  // Add after existing functions


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

      // Course type filter
      if (filters.courseType) {
        filtered = filtered.filter(profile => {
          try {
            const courseType = profile._course?.courseType ? String(profile._course.courseType).toLowerCase() : '';
            return courseType === filters.courseType.toLowerCase();
          } catch (error) {
            return false;
          }
        });
      }

      // Lead status filter
      if (filters.leadStatus) {
        filtered = filtered.filter(profile =>
          profile._leadStatus?._id === filters.leadStatus
        );
      }

      // Status filter
      if (filters.status && filters.status !== 'true') {
        filtered = filtered.filter(profile =>
          profile._leadStatus?._id === filters.status
        );
      }

      // Sector filter
      if (filters.sector) {
        filtered = filtered.filter(profile => {
          try {
            const sectors = profile._course?.sectors ? String(profile._course.sectors).toLowerCase() : '';
            return sectors === filters.sector.toLowerCase();
          } catch (error) {
            return false;
          }
        });
      }

      // CREATED DATE filter
      if (filters.createdFromDate || filters.createdToDate) {
        filtered = filtered.filter(profile => {
          try {
            if (!profile.createdAt) return false;

            const profileDate = new Date(profile.createdAt);

            // From date check
            if (filters.createdFromDate) {
              const fromDate = new Date(filters.createdFromDate);
              fromDate.setHours(0, 0, 0, 0);
              if (profileDate < fromDate) return false;
            }

            // To date check
            if (filters.createdToDate) {
              const toDate = new Date(filters.createdToDate);
              toDate.setHours(23, 59, 59, 999);
              if (profileDate > toDate) return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        });
      }

      // MODIFIED DATE filter
      if (filters.modifiedFromDate || filters.modifiedToDate) {
        filtered = filtered.filter(profile => {
          try {
            if (!profile.updatedAt) return false;

            const profileDate = new Date(profile.updatedAt);

            // From date check
            if (filters.modifiedFromDate) {
              const fromDate = new Date(filters.modifiedFromDate);
              fromDate.setHours(0, 0, 0, 0);
              if (profileDate < fromDate) return false;
            }

            // To date check
            if (filters.modifiedToDate) {
              const toDate = new Date(filters.modifiedToDate);
              toDate.setHours(23, 59, 59, 999);
              if (profileDate > toDate) return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        });
      }

      // NEXT ACTION DATE filter
      if (filters.nextActionFromDate || filters.nextActionToDate) {
        filtered = filtered.filter(profile => {
          try {
            if (!profile.followupDate) return false;

            const profileDate = new Date(profile.followupDate);

            // From date check
            if (filters.nextActionFromDate) {
              const fromDate = new Date(filters.nextActionFromDate);
              fromDate.setHours(0, 0, 0, 0);
              if (profileDate < fromDate) return false;
            }

            // To date check
            if (filters.nextActionToDate) {
              const toDate = new Date(filters.nextActionToDate);
              toDate.setHours(23, 59, 59, 999);
              if (profileDate > toDate) return false;
            }

            return true;
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
    return '🎯'; // default icon
  };


  //
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
      return;  // Yahan return lagao
    }

    const time = e.target.value; // "HH:mm"

    const [hours, minutes] = time.split(':');

    const selectedDateTime = new Date(followupDate);
    selectedDateTime.setHours(parseInt(hours, 10));
    selectedDateTime.setMinutes(parseInt(minutes, 10));
    selectedDateTime.setSeconds(0);
    selectedDateTime.setMilliseconds(0);

    const now = new Date();

    if (selectedDateTime < now) {
      alert('Select future time');
      return;  // Yahan bhi return lagao
    }

    // Agar yaha aaya to time sahi hai
    setFollowupTime(time);
  };




  const handleSubStatusChange = (e) => {
    const selectedSubStatusId = e.target.value;

    // ID से पूरा object find करें
    const selectedSubStatusObject = subStatuses.find(status => status._id === selectedSubStatusId);

    // पूरा object set करें
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

      console.log('response', response)

      if (response.data.success) {
        const status = response.data.data;
        const allFilter = { _id: 'all', name: 'All', count: status.reduce((acc, cur) => acc + (cur.count || 0), 0) || 15 };
        const admissionListFilter = { _id: 'admission_list', name: 'Admission List', count: 0, milestone: '' };

        setCrmFilters([allFilter, ...status.map(r => ({
          _id: r._id,
          name: r.title,
          milestone: r.milestone,
          count: r.count || 0,  // agar backend me count nahi hai to 0
        })),
          admissionListFilter]);

        setStatuses(status.map(r => ({
          _id: r._id,
          name: r.title,
          count: r.count || 0,  // agar backend me count nahi hai to 0
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

  const handleUpdateStatus = async () => {
    console.log('Function called');
    try {

      console.log('Function in try');
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      // Combine date and time into a single Date object (if both are set)
      let followupDateTime = '';
      if (followupDate && followupTime) {
        followupDateTime = new Date(`${followupDate}T${followupTime}`);
      }

      // Prepare the request body
      const data = {
        _leadStatus: seletectedStatus?._id || seletectedStatus, // if it's an object or string
        _leadSubStatus: seletectedSubStatus?._id || '',
        followup: followupDateTime ? followupDateTime.toISOString() : '', // ISO string for backend
        remarks
      };

      console.log('Sending data:', data);

      // Send PUT request to backend API
      const response = await axios.put(`${backendUrl}/college/lead/status_change/${selectedProfile._id}`, data, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response:', response.data);

      if (response.data.success) {
        alert('Status updated successfully!');
        // Optionally refresh data here
        closeEditPanel();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // alert('An error occurred while updating status');
    }
  };




  const [user, setUser] = useState({
    image: '',
    name: 'John Doe'
  });

  // Inside CRMDashboard component:

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
        setTotalPages(response.data.totalPages)
      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };


  const [experiences, setExperiences] = useState([{
    jobTitle: '',
    companyName: '',
    from: null,
    to: null,
    jobDescription: '',
    currentlyWorking: false
  }]);



  useEffect(() => {
    // Initialize circular progress
    const containers = document.querySelectorAll('.circular-progress-container');
    containers.forEach(container => {
      const percent = container.getAttribute('data-percent');
      const circle = container.querySelector('circle.circle-progress');
      if (circle && percent) {
        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;

        const progressText = container.querySelector('.progress-text');
        if (progressText) {
          progressText.innerText = percent + '%';
        }
      }
    });
  }, []);

  // यह logs add करें अपने code में
useEffect(() => {
  console.log('Current State:', {
    totalProfiles: allProfiles.length,
    totalPages: totalPages,
    currentPage: currentPage,
    pageSize: pageSize
  });
}, [allProfiles, totalPages, currentPage, pageSize]);

  const handleCrmFilterClick = (_id, index) => {

    setCurrentPage(1);
    if (_id === 'all') {
      // Agar "all" filter select hua hai to pura data set kar do
      setAllProfiles(allProfilesData);

      setActiveCrmFilter(index)
      fetchProfileData();

    } else {
      // Filter karo jisme leadStatus._id match ho
      const filteredProfiles = allProfilesData.filter(profile => {
        return profile._leadStatus && profile._leadStatus._id === _id;
      });


      setActiveCrmFilter(index)
      setAllProfiles(filteredProfiles);
      // Calculate total pages
      const totalPages = Math.ceil(filteredProfiles.length / pageSize);
      setTotalPages(totalPages > 0 ? totalPages : 1);

    }
  };


  const handleTabClick = (profileIndex, tabIndex) => {
    setActiveTab(prevTabs => ({
      ...prevTabs,
      [profileIndex]: tabIndex
    }));
  };

  // const handleTabClick = (index) => {
  //   setActiveTab(index);
  //   console.log('Tab clicked:', index);
  // };

  const handleFilterChange = (e) => {
    try {
      const { name, value } = e.target;
      const newFilterData = { ...filterData, [name]: value };
      setFilterData(newFilterData);

      // Apply search if there's a search term
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

  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
  };

  const closeleadHistoryPanel = () => {
    setLeadHistoryPanel(false)
    if (!isMobile) {
      setMainContentClass(showEditPanel || showWhatsappPanel ? 'col-8' : 'col-12');
    }
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

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
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
            <button className="btn-close" type="button" onClick={closeEditPanel}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
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
                        className="form-select border-0  bgcolor"
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
                          <option value={filter._id}>{filter.name}</option>))}


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
                        className="form-select border-0  bgcolor"
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
                          <option value={filter._id}>{filter.title}</option>))}
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
                    {/* <input
                    type="date"
                    className="form-control border-0  bgcolor"
                    id="nextActionDate"
                    style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                    onChange={(e) => setFollowupDate(e.target.value)}
                  /> */}
                    <DatePicker
                      className="form-control border-0  bgcolor"
                      onChange={setFollowupDate}

                      value={followupDate}
                      format="dd/MM/yyyy"
                      minDate={today}   // Isse past dates disable ho jayengi

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
                      className="form-control border-0  bgcolor"
                      id="actionTime"
                      onChange={handleTimeChange}
                      value={followupTime}


                      style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                    />
                  </div>
                </div>
              </div>)}

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
                            <span className="badge bg-light text-dark border">
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
          <div className="bg-white shadow-sm border-bottom mb-3 sticky-top stickyBreakpoints" >
            <div className="container-fluid py-2 " >
              <div className="row align-items-center">
                <div className="col-md-6 d-md-block d-sm-none">
                  <div className="d-flex align-items-center">
                    <h4 className="fw-bold text-dark mb-0 me-3">Admission Cycle</h4>
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-0 small">
                        <li className="breadcrumb-item">
                          <a href="#" className="text-decoration-none">Home</a>
                        </li>
                        <li className="breadcrumb-item active">Admission Cycle</li>
                      </ol>
                    </nav>
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
                        <span className="badge bg-light text-dark ms-1">
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


                <div className="card-body p-3">
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {crmFilters.map((filter, index) => (
                      <div key={index} className="d-flex align-items-center gap-1">
                        <div className='d-flex'>
                          <button
                            className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
                            onClick={() => handleCrmFilterClick(filter._id, index)}
                          >
                            {filter.name}
                            <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>
                              ({filter.count})
                            </span>
                          </button>

                          {/* Milestone flag OUTSIDE the button */}
                          {filter.milestone && (
                            <span
                              className="bg-success d-flex align-items-center"
                              style={{
                                fontSize: '0.75rem', color: 'white', verticalAlign: 'middle', padding: '0.25em 0.5em', transform: 'translate(15%, -100%)',
                                position: 'absolute'
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
          </div>

          {/* Advanced Filters */}
          {/* Advanced Filters - Improved Design */}
          {!isFilterCollapsed && (
            <div className="bg-white border-bottom shadow-sm">
              <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-filter text-primary me-2"></i>
                    <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                    <span className="badge bg-light text-dark ms-2">
                      {Object.values(filterData).filter(val => val && val !== 'true').length} Active
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
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
                      }}
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

                <div className="row g-4">
                  {/* Search Section */}
                  {/* <div className="col-12">
                    <div className="card border-0 bg-light">
                      <div className="card-body p-3">
                        <label className="form-label small fw-bold text-dark mb-2">
                          <i className="fas fa-search me-1"></i>
                          Quick Search
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0">
                            <i className="fas fa-search text-muted"></i>
                          </span>
                          <input
                            type="text"
                            name="name"
                            className="form-control border-start-0"
                            placeholder="Type to search by name, mobile, or email..."
                            value={filterData.name}
                            onChange={handleFilterChange}
                          />
                          {filterData.name && (
                            <button
                              className="btn btn-outline-secondary"
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
                      </div>
                    </div>
                  </div> */}

                  {/* Category Filters */}
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-tags me-1 text-info"></i>
                      Lead Category
                    </label>
                    <div className="position-relative">
                      <select
                        className="form-select"
                        name="leadStatus"
                        value={filterData.leadStatus}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Categories</option>
                        <option value="Application">📋 Application</option>
                        <option value="Lead">🎯 Lead</option>
                        <option value="Prospect">👤 Prospect</option>
                      </select>
                      <i className="fas fa-chevron-down position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-signal me-1 text-warning"></i>
                      Status Priority
                    </label>
                    <div className="position-relative">
                      <select
                        className="form-select"
                        name="status"
                        value={filterData.status}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Status</option>
                        {statuses.map((status, index) => (
                          <option key={status._id} value={status._id}>
                            {getStatusIcon(status.name)} {status.name} ({status.count})
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-graduation-cap me-1 text-success"></i>
                      Course Type
                    </label>
                    <div className="position-relative">
                      <select
                        className="form-select"
                        name="courseType"
                        value={filterData.courseType}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Types</option>
                        <option value="Free">🆓 Free</option>
                        <option value="Paid">💰 Paid</option>
                      </select>
                      <i className="fas fa-chevron-down position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark">
                      <i className="fas fa-industry me-1 text-primary"></i>
                      Sector
                    </label>
                    <div className="position-relative">
                      <select
                        className="form-select"
                        name="sector"
                        value={filterData.sector}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Sectors</option>
                        <option value="Tourism and Hospitality">🏨 Tourism & Hospitality</option>
                        <option value="Information Technology">💻 Information Technology</option>
                        <option value="Healthcare">🏥 Healthcare</option>
                        <option value="Finance">💳 Finance</option>
                      </select>
                      <i className="fas fa-chevron-down position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style={{ pointerEvents: 'none' }}></i>
                    </div>
                  </div>

                  {/* Date Range */}
                  {/* Date Filters Section */}
                  {/* REPLACE your existing Date Filters Section with this */}
                  {/* Date Filters Section - Facebook Style */}
                  <div className="col-12">
                    <div className="row g-4">
                      {/* Created Date Range */}
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-plus me-1 text-success"></i>
                          Lead Creation Date Range
                        </label>
                        <div className="card border-0 bg-light p-3">
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'createdFromDate')}
                                value={filterData.createdFromDate}
                                format="dd/MM/yyyy"
                                className="form-control"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-success"></i>}
                                maxDate={filterData.createdToDate || new Date()}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'createdToDate')}
                                value={filterData.createdToDate}
                                format="dd/MM/yyyy"
                                className="form-control"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-success"></i>}
                                minDate={filterData.createdFromDate}
                                maxDate={new Date()}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.createdFromDate || filterData.createdToDate) && (
                            <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small className="text-success">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.createdFromDate && ` From ${formatDate(filterData.createdFromDate)}`}
                                {filterData.createdFromDate && filterData.createdToDate && ' |'}
                                {filterData.createdToDate && ` To ${formatDate(filterData.createdToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => clearDateFilter('created')}
                              disabled={!filterData.createdFromDate && !filterData.createdToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear Created Date
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Modified Date Range */}
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-edit me-1 text-warning"></i>
                          Lead Modification Date Range
                        </label>
                        <div className="card border-0 bg-light p-3">
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'modifiedFromDate')}
                                value={filterData.modifiedFromDate}
                                format="dd/MM/yyyy"
                                className="form-control"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-warning"></i>}
                                maxDate={filterData.modifiedToDate || new Date()}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'modifiedToDate')}
                                value={filterData.modifiedToDate}
                                format="dd/MM/yyyy"
                                className="form-control"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-warning"></i>}
                                minDate={filterData.modifiedFromDate}
                                maxDate={new Date()}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                            <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                              <small className="text-warning">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.modifiedFromDate && ` From ${formatDate(filterData.modifiedFromDate)}`}
                                {filterData.modifiedFromDate && filterData.modifiedToDate && ' |'}
                                {filterData.modifiedToDate && ` To ${formatDate(filterData.modifiedToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => clearDateFilter('modified')}
                              disabled={!filterData.modifiedFromDate && !filterData.modifiedToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear Modified Date
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Next Action Date Range */}
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-calendar-check me-1 text-info"></i>
                          Next Action Date Range
                        </label>
                        <div className="card border-0 bg-light p-3">
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">From Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'nextActionFromDate')}
                                value={filterData.nextActionFromDate}
                                format="dd/MM/yyyy"
                                className="form-control"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-info"></i>}
                                maxDate={filterData.nextActionToDate}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">To Date</label>
                              <DatePicker
                                onChange={(date) => handleDateFilterChange(date, 'nextActionToDate')}
                                value={filterData.nextActionToDate}
                                format="dd/MM/yyyy"
                                className="form-control"
                                clearIcon={null}
                                calendarIcon={<i className="fas fa-calendar text-info"></i>}
                                minDate={filterData.nextActionFromDate}
                              />
                            </div>
                          </div>

                          {/* Show selected dates */}
                          {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                            <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                              <small className="text-info">
                                <i className="fas fa-info-circle me-1"></i>
                                <strong>Selected:</strong>
                                {filterData.nextActionFromDate && ` From ${formatDate(filterData.nextActionFromDate)}`}
                                {filterData.nextActionFromDate && filterData.nextActionToDate && ' |'}
                                {filterData.nextActionToDate && ` To ${formatDate(filterData.nextActionToDate)}`}
                              </small>
                            </div>
                          )}

                          {/* Clear button */}
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => clearDateFilter('nextAction')}
                              disabled={!filterData.nextActionFromDate && !filterData.nextActionToDate}
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear Next Action Date
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Update the Clear All button in your existing filters section */}
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={clearAllFilters}
                  >
                    <i className="fas fa-times-circle me-1"></i>
                    Clear All Filters
                  </button>

                  {/* Update the results summary section */}
                  <div className="text-muted small">
                    <i className="fas fa-info-circle me-1"></i>
                    Showing {allProfiles.length} of {allProfilesData.length} results

                    {/* Active filter indicators */}
                    {(filterData.createdFromDate || filterData.createdToDate) && (
                      <div className="mt-1">
                        <span className="badge bg-success me-2">
                          <i className="fas fa-calendar-plus me-1"></i>
                          Created:
                          {filterData.createdFromDate && ` From ${formatDate(filterData.createdFromDate)}`}
                          {filterData.createdFromDate && filterData.createdToDate && ' to '}
                          {filterData.createdToDate && formatDate(filterData.createdToDate)}
                        </span>
                      </div>
                    )}

                    {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                      <div className="mt-1">
                        <span className="badge bg-warning me-2">
                          <i className="fas fa-calendar-edit me-1"></i>
                          Modified:
                          {filterData.modifiedFromDate && ` From ${formatDate(filterData.modifiedFromDate)}`}
                          {filterData.modifiedFromDate && filterData.modifiedToDate && ' to '}
                          {filterData.modifiedToDate && formatDate(filterData.modifiedToDate)}
                        </span>
                      </div>
                    )}

                    {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                      <div className="mt-1">
                        <span className="badge bg-info me-2">
                          <i className="fas fa-calendar-check me-1"></i>
                          Next Action:
                          {filterData.nextActionFromDate && ` From ${formatDate(filterData.nextActionFromDate)}`}
                          {filterData.nextActionFromDate && filterData.nextActionToDate && ' to '}
                          {filterData.nextActionToDate && formatDate(filterData.nextActionToDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setIsFilterCollapsed(true)}
                    >
                      <i className="fas fa-eye-slash me-1"></i>
                      Hide Filters
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => applyFilters()}
                    >
                      <i className="fas fa-search me-1"></i>
                      Apply Filters
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
                                            Move To Admission List
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
                                            onClick={() => alert("Reffer")}
                                          >
                                            Reffer
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
                                            Move To Admission List
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
                                            onClick={() => alert("Reffer")}
                                          >
                                            Reffer
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

                  {currentPage < totalPages - 2 && !getPaginationPages().includes(totalPages) && (
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
      <style jsx>
        {`
        html body .content .content-wrapper {
          padding: calc(0.9rem - 0.1rem) 1.2rem
        }

        .container-fluid.py-2 {
          position: sticky!important;
          top: 0;
          z-index: 1020;
          background-color: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
.stickyBreakpoints {
  position: sticky;
  top: 20px;  /* default top */
  z-index: 1020;
}
.react-date-picker__wrapper{
border:none;
}
.react-date-picker__inputGroup input{
border: none !important
}

.react-date-picker__inputGroup{
    width: 100%;
    white-space: nowrap;
    background: transparent;
    border: none;
}
    .react-date-picker__clear-button{
    display:none;
    }
        @media(max-width:1920px){
          .stickyBreakpoints{
            top: 20%
          }
        }
        
        @media(max-width:1400px){
          .stickyBreakpoints{
            top: 17%
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
        .bgcolor{
        background-color:#f1f2f6!important;
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

        #whatsappPanel{
        height: 73dvh;
        }
          .info-group{
          padding:8px;}
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .modal-dialog {
            margin: 0.5rem;
            max-width: calc(100% - 1rem);
          }

          .whatsapp-chat .modal-content {
            height: 90vh;
          }

          .col-md-6, .col-md-5, .col-md-1 {
            flex: 0 0 100%;
            max-width: 100%;
            margin-bottom: 1rem;
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
          .container-fluid.py-2 {
            padding: 0.5rem !important;
          }

          .card-body.px-1.py-0.my-2 {
            padding: 0.5rem !important;
          }

          .d-flex.align-items-center {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .btn-group {
            flex-wrap: wrap;
          }

          .input-group {
            max-width: 100% !important;
            margin-bottom: 0.5rem;
          }
        }
          /* Add this to your existing style tag or CSS file */
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
        `}
      </style>
    </div>
  );
};

export default CRMDashboard;

