import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'
import { Link } from 'react-router-dom';
import { getGoogleAuthCode, getGoogleRefreshToken } from '../../../../Component/googleOAuth';

import CandidateProfile from '../CandidateProfile/CandidateProfile';


// Google Maps API styles
const mapStyles = `

  .map-container {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .map-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    background: #f8f9fa;
    color: #6c757d;
  }
  
  .location-info {
    background: #e8f5e8;
    border: 1px solid #28a745;
    border-radius: 4px;
    padding: 8px 12px;
    margin-top: 8px;
  }
  
  .map-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .map-buttons .btn {
    flex: 1;
    font-size: 0.875rem;
  }
`;

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
            {/* Search functionality (optional) */}
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

const useNavHeight = (dependencies = []) => {
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(140); // Default fallback
  const widthRef = useRef(null);
  const [width, setWidth] = useState(0);

  const calculateHeight = useCallback(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      setNavHeight(height);
    }
  }, []);

  const calculateWidth = useCallback(() => {

    if (widthRef.current) {
      const width = widthRef.current.offsetWidth;
      setWidth(width);
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
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculateWidth]);

  // Recalculate when dependencies change
  useEffect(() => {
    setTimeout(calculateWidth, 50);
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
const B2BSales = () => {

  const candidateRef = useRef();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem("user") || "{}"));
  const token = userData.token;
  // const permissions = userData.permissions
  const [permissions, setPermissions] = useState();

  useEffect(() => {
    updatedPermission()
  }, [])

  // Console: logged-in institute user and all permissions (for debugging)
  useEffect(() => {
    if (permissions != null && userData?._id) {
      const instituteUser = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        role: userData.role,
        collegeId: userData.collegeId,
        collegeName: userData.collegeName,
        isDefaultAdmin: userData.isDefaultAdmin,
      };
      console.log('[Institute] Logged-in user:', instituteUser);
      console.log('[Institute] User permissions:', permissions);
      if (permissions?.custom_permissions) {
        console.log('[Institute] Custom permissions:', permissions.custom_permissions);
      }
    }
  }, [permissions, userData]);

  const updatedPermission = async () => {

    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token }
    });
    if (respose.data.status) {

      setPermissions(respose.data.permissions);
    }
  }

  const [openModalId, setOpenModalId] = useState(null);

  // const [activeTab, setActiveTab] = useState(0);
  const [activeTab, setActiveTab] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(null);
  const [activeCrmFilter, setActiveCrmFilter] = useState(0);

  // ===== New UI tabs (requested redesign) =====
  const [mainTab, setMainTab] = useState('lead'); // lead | performance | followup | documents
  const [leadTab, setLeadTab] = useState('approval'); // add | approval | report
  const [leadApprovalTab, setLeadApprovalTab] = useState('pending'); // pending | approved | rejected
  const [performanceTab, setPerformanceTab] = useState('all'); // all | hot | warm | cold | prospect (approved leads)
  const [followupTab, setFollowupTab] = useState('planned'); // done | planned | scheduled | missed
  const [scheduledDays, setScheduledDays] = useState('1'); // for scheduled dropdown (days)

  /** Sales copy: API-driven approval counts + list */
  const [approvalSummary, setApprovalSummary] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
  });
  const [loadingApprovalSummary, setLoadingApprovalSummary] = useState(false);
  const [approvalListLeads, setApprovalListLeads] = useState([]);
  const [loadingApprovalList, setLoadingApprovalList] = useState(false);

  const [performanceSummary, setPerformanceSummary] = useState({
    all: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    prospect: 0,
  });
  const [loadingPerformanceSummary, setLoadingPerformanceSummary] = useState(false);

  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [collapsedLeadCards, setCollapsedLeadCards] = useState(() => new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [counselors, setCounselors] = useState([]);

  // Lead logs state
  const [leadLogsLoading, setLeadLogsLoading] = useState(false);
  const [leadLogs, setLeadLogs] = useState([]);

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
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadMessage, setBulkUploadMessage] = useState('');
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState(false);
  
  // Bulk inputs state
  const [showBulkInputs, setShowBulkInputs] = useState(false);
  const [bulkMode, setBulkMode] = useState('');
  const [input1Value, setInput1Value] = useState('');

  // Lead form state
  const [leadFormData, setLeadFormData] = useState({
    leadCategory: '',
    typeOfB2B: '',
    businessName: '',
    businessAddress: '',
    concernPersonName: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    designation: '',
    email: '',
    mobile: '',
    whatsapp: '',
    leadOwner: '',
    leadStatus: '',
    lockLeadDays: '60',
    remark: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [extractedNumbers, setExtractedNumbers] = useState([]);

  //refer lead stats
  const [concernPersons, setConcernPersons] = useState([]);
  const [selectedConcernPerson, setSelectedConcernPerson] = useState(null);

  //filter stats


  const [selectedProfiles, setSelectedProfiles] = useState([]);

  // Users state for Lead Owner dropdown
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);


  //side pannel stats
  const [showPanel, setShowPanel] = useState('')
  const [panelActionsOpen, setPanelActionsOpen] = useState(false);
  const panelActionsRef = useRef(null);

  // Loading state for fetchProfileData
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);


  // B2B Dropdown Options
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);
  const [typeOfB2BOptions, setTypeOfB2BOptions] = useState([]);

  // Google Maps API
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);

  const businessNameInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const bulkUploadFileInputRef = useRef(null);
  const [isgoogleLoginLoading, setIsgoogleLoginLoading] = useState(false);


  const handleGoogleLogin = async () => {
    try {
      setIsgoogleLoginLoading(true);

      const result = await getGoogleAuthCode({
        scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar'],
        user: userData
      });


      const refreshToken = await getGoogleRefreshToken({
        code: result,
        user: userData
      });


      const user = {
        ...userData,
        googleAuthToken: refreshToken.data
      }
      sessionStorage.setItem('googleAuthToken', JSON.stringify(refreshToken.data));

      setUserData(user);


    } catch (error) {
      console.error('❌ Login failed:', error);

      // Handle specific popup errors
      if (error.message.includes('Popup blocked')) {
        console.error('Please allow popups for this site and try again.');
      } else if (error.message.includes('closed by user')) {
        console.error('Login cancelled by user.');
      } else {
        console.error('Login failed: ' + error.message);
      }

    } finally {
      setIsgoogleLoginLoading(false);
      setShowPanel('followUp');

    }
    // initiateGoogleAuth();
  };

  const handleGoogleLogout = () => {
    try {
      const updatedUser = { ...userData };
      delete updatedUser.googleAuthToken;
      setUserData(updatedUser);

      // Clear any stored Google auth token from sessionStorage
      sessionStorage.removeItem('googleAuthToken');

      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        delete parsedUser.googleAuthToken;
        sessionStorage.setItem('user', JSON.stringify(parsedUser));
      }

      alert('Disconnected from Google Calendar successfully.');
    } catch (err) {
      console.error('Error while disconnecting Google Calendar:', err);
    }
  };

  // Simple function to add follow-up to Google Calendar
  // Function to clear all follow-up form data
  const clearFollowupFormData = () => {
    setFollowupFormData({
      followupDate: '',
      followupTime: '',
      remarks: '',
      additionalRemarks: '',
      selectedProfile: null,
      selectedConcernPerson: null,
      selectedProfiles: null,
      selectedCounselor: null,
      selectedDocument: null
    });
  };

  const addFollowUpToGoogleCalendar = async (e) => {
    e.preventDefault();

    try {
      // Check if user has Google token
      if (!userData.googleAuthToken?.accessToken) {
        alert('Please login with Google first');
        return;
      }

      // Determine whether follow-up fields are filled
      const hasFollowup =
        (showPanel === 'followUp') ||
        (showPanel === 'editPanel' && seletectedSubStatus && seletectedSubStatus.hasFollowup);

      const hasFollowupData =
        hasFollowup && followupFormData.followupDate && followupFormData.followupTime;

      // Normalise date value for API (string or Date instance)
      const followupDateValue = followupFormData.followupDate instanceof Date
        ? followupFormData.followupDate.toISOString()
        : followupFormData.followupDate;

      // 1) Edit panel: change status (and optionally set follow-up + Google Calendar) via B2B status API
      if (showPanel === 'editPanel' && selectedProfile && seletectedStatus) {
        const statusData = {
          status: seletectedStatus,
          subStatus: seletectedSubStatus?._id || null,
          remarks: followupFormData.remarks || 'Status updated via B2B panel'
        };

        if (hasFollowupData) {
          statusData.followUpDate = followupDateValue;
          statusData.followUpTime = followupFormData.followupTime;
          statusData.googleCalendarEvent = true;
        }

        await updateLeadStatus(selectedProfile._id, statusData);

        if (hasFollowupData) {
          alert('✅ Status and follow-up updated successfully!');
        } else {
          alert('✅ Status updated successfully!');
        }
      }

      // 2) Standalone follow-up panel: create follow-up (and Google Calendar event) via B2B follow-up API
      if (showPanel === 'followUp' && selectedProfile && hasFollowupData) {
        await axios.post(
          `${backendUrl}/college/b2b_copy/leads/${selectedProfile._id}/followup`,
          {
            scheduledDate: followupDateValue,
            scheduledTime: followupFormData.followupTime,
            remarks: followupFormData.remarks || '',
            googleCalendarEvent: true
          },
          {
            headers: { 'x-auth': token }
          }
        );

        alert('✅ Follow-up saved and scheduled successfully!');
      }

      window.dispatchEvent(new CustomEvent('b2b-followup-updated'));
    } catch (error) {
      console.error('❌ Error in addFollowUpToGoogleCalendar:', error);
      alert('❌ Error processing request');
    } finally {
      closePanel();
    }
  };

  const initializeBusinessNameAutocomplete = () => {

    // Check if Google Maps is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Get input element using ref
    const input = businessNameInputRef.current;
    if (!input) {
      return;
    }


    // Remove any existing autocomplete to prevent duplicates
    if (input.autocomplete) {
      window.google.maps.event.clearInstanceListeners(input);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      componentRestrictions: { country: 'in' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      const placeNameOnly = place.name || input.value;

      setLeadFormData(prev => ({
        ...prev,
        businessName: placeNameOnly
      }));

      let city = '', state = '';
      place.address_components?.forEach((component) => {
        const types = component.types.join(',');
        if (types.includes("locality")) city = component.long_name;
        if (types.includes("administrative_area_level_1")) state = component.long_name;
        if (!city && types.includes("sublocality_level_1")) city = component.long_name;
      });

      setLeadFormData(prev => ({
        ...prev,
        city: city,
        state: state,
        latitude: lat,
        longitude: lng
      }));

      setLeadFormData(prev => ({
        ...prev,
        address: place.formatted_address || ''
      }));
    });

    // Store reference to autocomplete
    input.autocomplete = autocomplete;
  };

  const initializeCityAutocomplete = () => {
    // Check if Google Maps is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Get input element using ref
    const input = cityInputRef.current;
    if (!input) {
      return;
    }

    // Remove any existing autocomplete to prevent duplicates
    if (input.autocomplete) {
      window.google.maps.event.clearInstanceListeners(input);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['(cities)'],
      componentRestrictions: { country: 'in' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place) return;

      let city = '';
      place.address_components?.forEach((component) => {
        const types = component.types.join(',');
        if (types.includes("locality")) city = component.long_name;
        if (!city && types.includes("sublocality_level_1")) city = component.long_name;
      });

      setLeadFormData(prev => ({
        ...prev,
        city: city || place.name || input.value
      }));
    });

    // Store reference to autocomplete
    input.autocomplete = autocomplete;
  };

  const initializeStateAutocomplete = () => {
    // Check if Google Maps is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Get input element using ref
    const input = stateInputRef.current;
    if (!input) {
      return;
    }

    // Remove any existing autocomplete to prevent duplicates
    if (input.autocomplete) {
      window.google.maps.event.clearInstanceListeners(input);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['administrative_area_level_1'],
      componentRestrictions: { country: 'in' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place) return;

      let state = '';
      place.address_components?.forEach((component) => {
        const types = component.types.join(',');
        if (types.includes("administrative_area_level_1")) state = component.long_name;
      });

      setLeadFormData(prev => ({
        ...prev,
        state: state || place.name || input.value
      }));
    });

    // Store reference to autocomplete
    input.autocomplete = autocomplete;
  };

  // Fetch filter options from backend API on mount

  useEffect(() => {
    fetchB2BDropdownOptions();
    fetchUsers(); // Fetch users for Lead Owner dropdown
    fetchStatusCounts(); // Fetch status counts
  }, []);


  // Initialize autocomplete when modal is opened
  useEffect(() => {
    if (showAddLeadModal) {
      // Default Lead Owner to logged-in user (and keep it locked)
      // Depend on userData so it works even if user loads slightly later.
      if (userData?._id) {
        setLeadFormData((prev) => ({
          ...prev,
          leadOwner: userData._id,
        }));
      }

      // Small delay to ensure modal is fully rendered and Google Maps is loaded
      const timer = setTimeout(() => {
        initializeBusinessNameAutocomplete();
        initializeCityAutocomplete();
        initializeStateAutocomplete();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [showAddLeadModal, userData?._id]);

  // Fetch B2B dropdown options
  const fetchB2BDropdownOptions = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

      // Fetch Lead Categories (only active)
      const leadCategoriesRes = await axios.get(`${backendUrl}/college/b2b_copy/lead-categories?status=true`, {
        headers: { 'x-auth': token }
      });
      if (leadCategoriesRes.data.status) {
        setLeadCategoryOptions(leadCategoriesRes.data.data
          .filter(cat => cat.isActive === true) // Filter only active items
          .map(cat => ({
            value: cat._id,
            label: cat.name || cat.title
          })));
      }

      // Fetch Type of B2B (only active)
      const typeOfB2BRes = await axios.get(`${backendUrl}/college/b2b_copy/type-of-b2b?status=true`, {
        headers: { 'x-auth': token }
      });
      if (typeOfB2BRes.data.status) {
        setTypeOfB2BOptions(typeOfB2BRes.data.data
          .filter(type => type.isActive === true) // Filter only active items
          .map(type => ({
            value: type._id,
            label: type.name
          })));
      }
    } catch (err) {
      console.error('Failed to fetch B2B dropdown options:', err);
    }
  };



  // Fetch users for Lead Owner dropdown
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

      const response = await axios.get(`${backendUrl}/college/users/b2b-users`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        // Update users state with detailed access summary
        setUsers(response.data.data);
      } else {
        console.error('Failed to fetch users:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };






  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Mobile/WhatsApp number validation function
  // Note: For this screen we accept any 10-digit number (0-9),
  // because UI copy says "Enter 10-digit mobile" without 6-9 restriction.
  const validateMobileNumber = (number) => {
    if (number == null) return false;
    // Remove all non-digit characters
    const cleanNumber = String(number).replace(/\D/g, '');
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(cleanNumber);
  };

  // Extract mobile/WhatsApp numbers from text
  const extractMobileNumbers = (text) => {
    if (!text) return [];

    // Regex to match various mobile number formats
    const mobileRegex = /(?:\+91[\s-]?)?[6-9]\d{9}|(?:\+91[\s-]?)?[0-9]{10}/g;
    const matches = text.match(mobileRegex) || [];

    // Clean and validate numbers
    const validNumbers = matches
      .map(num => num.replace(/\D/g, ''))
      .filter(num => {
        // Remove +91 prefix if present and validate
        const cleanNum = num.startsWith('91') && num.length === 12 ? num.slice(2) : num;
        return validateMobileNumber(cleanNum);
      })
      .map(num => {
        // Remove +91 prefix if present
        return num.startsWith('91') && num.length === 12 ? num.slice(2) : num;
      });

    // Return unique numbers (max 10)
    return [...new Set(validNumbers)].slice(0, 10);
  };

  // Handle lead form input changes
  const handleLeadInputChange = (e) => {
    const { name, value } = e.target;

    setLeadFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Extract numbers from mobile and whatsapp fields
    if (name === 'mobile' || name === 'whatsapp') {
      const extracted = extractMobileNumbers(value);
      setExtractedNumbers(extracted);
    }
  };

  // Handle mobile number input with validation
  const handleLeadMobileChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobile') {
      if (value.length > 10) {
        setFormErrors(prev => ({
          ...prev,
          mobile: 'Mobile number should be 10 digits'
        }));
      }
    }

    // Only allow digits, spaces, hyphens, and plus sign
    const cleanValue = value.replace(/[^\d\s\-+]/g, '');

    setLeadFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Extract numbers
    const extracted = extractMobileNumbers(cleanValue);
    setExtractedNumbers(extracted);
  };

  // Validate lead form
  const validateLeadForm = () => {
    const errors = {};

    // Required field validation
    if (!leadFormData.leadCategory) errors.leadCategory = 'Lead category is required';
    if (!leadFormData.typeOfB2B) errors.typeOfB2B = 'B2B type is required';
    if (!leadFormData.businessName) errors.businessName = 'Business name is required';
    if (!leadFormData.concernPersonName) errors.concernPersonName = 'Concern person name is required';
    // if (!leadFormData.landlineNumber) errors.landlineNumber = 'Landline number is required';
    // Email validation
    // if (!leadFormData.email) {
    //   errors.email = 'Email is required';
    // } else if (!validateEmail(leadFormData.email)) {
    //   errors.email = 'Please enter a valid email address';
    // }

    // Mobile validation
    if (!leadFormData.mobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!validateMobileNumber(leadFormData.mobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Lead Status and Lock Lead (same as LRP requirements)
    if (!leadFormData.leadStatus) errors.leadStatus = 'Lead status is required';
    if (!leadFormData.lockLeadDays) errors.lockLeadDays = 'Lock duration is required';

    // WhatsApp validation (optional but validate if provided)
    if (leadFormData.whatsapp && !validateMobileNumber(leadFormData.whatsapp)) {
      errors.whatsapp = 'Please enter a valid 10-digit WhatsApp number';
    }

    // Landline number validation
    // if (!leadFormData.landlineNumber) {
    //   errors.landlineNumber = 'Landline number is required';
    // } else if (!validateMobileNumber(leadFormData.landlineNumber)) {
    //   errors.landlineNumber = 'Please enter a valid 10-digit landline number';
    // }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add state for leads data
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);

  // Add state for status counts
  const [statusCounts, setStatusCounts] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loadingStatusCounts, setLoadingStatusCounts] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    leadCategory: '',
    typeOfB2B: '',
    leadOwner: '',
    dateRange: {
      start: null,
      end: null
    },
    status: null,
    subStatus: null
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (mainTab === 'lead') {
      fetchLeads(selectedStatusFilter, 1);
    }
  }, [mainTab]);

  useEffect(() => {
    if (mainTab !== 'performance') return;
    const opts = {
      approvalStatus: 'Approved',
      fetchLimit: 200,
    };
    if (performanceTab !== 'all') {
      opts.performanceLeadStatus = performanceTab;
    }
    fetchLeads(null, 1, opts);
  }, [mainTab, performanceTab]);

  const fetchPerformanceSummary = async () => {
    if (!token) return;
    try {
      setLoadingPerformanceSummary(true);
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/performance-summary`, {
        headers: { 'x-auth': token },
      });
      if (response.data.status && response.data.data) {
        setPerformanceSummary(response.data.data);
      }
    } catch (e) {
      console.error('fetchPerformanceSummary', e);
    } finally {
      setLoadingPerformanceSummary(false);
    }
  };

  useEffect(() => {
    if (mainTab !== 'performance') return;
    fetchPerformanceSummary();
  }, [mainTab]);

  // Auto-select leads based on Input 1 value for bulk refer
  useEffect(() => {
    if (bulkMode !== 'bulkrefer') {
      return;
    }

    if (!leads || leads.length === 0) {
      return;
    }

    const numValue = input1Value === '' ? 0 : parseInt(input1Value, 10);
    
    if (isNaN(numValue) || numValue < 1) {
      setSelectedProfiles([]);
      return;
    }

    // Get total available leads
    const totalAvailableLeads = totalLeads || leads.length;
    const validNumValue = Math.min(numValue, totalAvailableLeads);

    // If user wants more leads than currently loaded, fetch them
    if (validNumValue > leads.length && validNumValue > 0) {
      const fetchLeadsForSelection = async () => {
        if (!token) return;

        try {
          const eff = { ...filters };
          const params = {
            page: 1,
            limit: validNumValue.toString(),
            ...(selectedStatusFilter && { status: selectedStatusFilter }),
            ...(eff.search && { search: eff.search }),
            ...(eff.leadCategory && { leadCategory: eff.leadCategory }),
            ...(eff.typeOfB2B && { typeOfB2B: eff.typeOfB2B }),
            ...(eff.leadOwner && { leadOwner: eff.leadOwner }),
            ...(eff.dateRange?.start && { startDate: eff.dateRange.start }),
            ...(eff.dateRange?.end && { endDate: eff.dateRange.end }),
            ...(eff.status && { status: eff.status }),
            ...(eff.subStatus && { subStatus: eff.subStatus })
          };

          const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
            headers: { 'x-auth': token },
            params: params
          });

          if (response.data.status && response.data.data.leads) {
            const fetchedLeads = response.data.data.leads;
            const selectedLeadsData = fetchedLeads.slice(0, validNumValue);
            const leadsToSelect = selectedLeadsData.map(lead => lead._id);
            setSelectedProfiles(leadsToSelect);
          }
        } catch (error) {
          console.error('Error fetching leads for selection:', error);
          // Fallback: select from current leads
          const selectedLeadsData = leads.slice(0, Math.min(validNumValue, leads.length));
          const leadsToSelect = selectedLeadsData.map(lead => lead._id);
          setSelectedProfiles(leadsToSelect);
        }
      };

      fetchLeadsForSelection();
    } else {
      // Select from current leads
      const selectedLeadsData = leads.slice(0, validNumValue);
      const leadsToSelect = selectedLeadsData.map(lead => lead._id);
      setSelectedProfiles(leadsToSelect);
    }
  }, [input1Value, bulkMode, leads, totalLeads, filters, selectedStatusFilter, token]);

  // Handle status card click
  const handleStatusCardClick = (statusId) => {
    // console.log('🎯 [FRONTEND] Status Card Clicked:', {
    //   statusId,
    //   currentFilters: filters,
    //   leadOwnerFilter: filters.leadOwner
    // });
    setSelectedStatusFilter(statusId);
    setCurrentPage(1);
    fetchLeads(statusId, 1);
  };

  // Handle total card click (show all leads)
  const handleTotalCardClick = () => {
    // console.log('📊 [FRONTEND] Total Card Clicked:', {
    //   currentFilters: filters,
    //   leadOwnerFilter: filters.leadOwner
    // });
    setSelectedStatusFilter(null);
    setCurrentPage(1);
    fetchLeads(null, 1);
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value
      }
    }));
  };

  const applyFilters = (filterOverrides = {}) => {
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1, filterOverrides);
    fetchStatusCounts(filterOverrides); // Update status counts with current filters
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      leadCategory: '',
      typeOfB2B: '',
      leadOwner: '',
      dateRange: {
        start: null,
        end: null
      },
      status: null,
      subStatus: null
    });
    setCurrentPage(1);
    fetchLeads(selectedStatusFilter, 1);
    fetchStatusCounts(); // Update status counts after clearing filters
  };

  const fetchLeads = async (statusFilter = null, page = 1, filterOverrides = {}) => {
    try {
      closePanel();
      setLoadingLeads(true);

      const eff = { ...filters, ...filterOverrides };

      // Build query parameters
      const params = {
        page: page,
        // limit: 10,           
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      // Add filter parameters (use effective filters so clearing search refetches all)
      if (eff.search) {
        params.search = eff.search;
      }
      if (eff.leadCategory) {
        params.leadCategory = eff.leadCategory;
      }
      if (eff.typeOfB2B) {
        params.typeOfB2B = eff.typeOfB2B;
      }
      if (eff.leadOwner) {
        params.leadOwner = eff.leadOwner;
      }
      if (eff.dateRange?.start) {
        params.startDate = eff.dateRange.start;
      }
      if (eff.dateRange?.end) {
        params.endDate = eff.dateRange.end;
      }
      if (eff.status) {
        params.status = eff.status;
      }
      if (eff.subStatus) {
        params.subStatus = eff.subStatus;
      }
      if (eff.approvalStatus) {
        params.approvalStatus = eff.approvalStatus;
      }
      if (eff.performanceLeadStatus) {
        params.leadStatus = eff.performanceLeadStatus;
      }
      if (eff.fetchLimit) {
        params.limit = eff.fetchLimit;
      }

      // console.log('🔍 [FRONTEND] fetchLeads called:', {
      //   statusFilter,
      //   page,
      //   filters: filters,
      //   params: params,
      //   leadOwnerInFilters: filters.leadOwner,
      //   leadOwnerInParams: params.leadOwner
      // });

      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (response.data.status) {
        const fetchedLeads = response.data.data.leads || [];
        
        // console.log('📥 [FRONTEND] Response received:', {
        //   status: response.data.status,
        //   leadsCount: fetchedLeads.length,
        //   pagination: response.data.data?.pagination,
        //   message: response.data.message,
        //   appliedFilter: filters.leadOwner ? `leadOwner: ${filters.leadOwner}` : 'No filter'
        // });
        
        // Debug: Log leadOwner data from response
        // if (fetchedLeads.length > 0) {
        //   console.log('👤 [FRONTEND] Lead Owner Data Received:');
        //   fetchedLeads.slice(0, 3).forEach((lead, index) => {
        //     console.log(`  Lead ${index + 1}:`, {
        //       businessName: lead.businessName,
        //       leadOwner: lead.leadOwner,
        //       leadOwnerId: lead.leadOwner?._id || lead.leadOwner || 'null',
        //       leadOwnerName: lead.leadOwner?.name || 'No Owner',
        //       leadOwnerEmail: lead.leadOwner?.email || 'N/A',
        //       leadAddedBy: lead.leadAddedBy,
        //       leadAddedByName: lead.leadAddedBy?.name || 'No Added By'
        //     });
        //   });
        // } else {
        //   console.log('⚠️ [FRONTEND] No leads in response - Setting empty array');
        // }
        
        // console.log('🔄 [FRONTEND] Updating leads state:', {
        //   previousLeadsCount: leads.length,
        //   newLeadsCount: fetchedLeads.length,
        //   willClear: fetchedLeads.length === 0
        // });
        
        setLeads(fetchedLeads);
        // ✅ Extract pagination data from backend response
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.totalPages || 1);
          setCurrentPage(response.data.data.pagination.currentPage || 1);
          setPageSize(response.data.data.pagination.totalLeads || 0);
        }
        
        // console.log('✅ [FRONTEND] Leads state updated');
      } else {
        console.error('❌ [FRONTEND] Failed to fetch leads:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Fetch status counts
  const fetchStatusCounts = async (filterOverrides = {}) => {
    try {
      setLoadingStatusCounts(true);
      const eff = { ...filters, ...filterOverrides };
      // Build params with current filters (except status filter, as we're counting by status)
      const params = {};
      if (eff.leadCategory) params.leadCategory = eff.leadCategory;
      if (eff.typeOfB2B) params.typeOfB2B = eff.typeOfB2B;
      if (eff.leadOwner) params.leadOwner = eff.leadOwner;
      if (eff.search) params.search = eff.search;
      if (eff.subStatus) params.subStatus = eff.subStatus;
      if (eff.dateRange?.start) params.startDate = eff.dateRange.start;
      if (eff.dateRange?.end) params.endDate = eff.dateRange.end;
      
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/status-count`, {
        headers: { 'x-auth': token },
        params: params
      });

      if (response.data.status) {
        setStatusCounts(response.data.data.statusCounts || []);
        setTotalLeads(response.data.data.totalLeads || 0);
      } else {
        console.error('Failed to fetch status counts:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching status counts:', error);
    } finally {
      setLoadingStatusCounts(false);
    }
  };

  const fetchApprovalSummary = async () => {
    if (!token) return;
    try {
      setLoadingApprovalSummary(true);
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/approval-summary`, {
        headers: { 'x-auth': token },
      });
      if (response.data.status && response.data.data) {
        setApprovalSummary(response.data.data);
      }
    } catch (e) {
      console.error('fetchApprovalSummary', e);
    } finally {
      setLoadingApprovalSummary(false);
    }
  };

  const handleApprovalDecision = async (leadId, decision) => {
    if (!leadId || !['Approved', 'Rejected'].includes(decision)) return;
    try {
      const response = await axios.patch(
        `${backendUrl}/college/b2b_copy/leads/${leadId}/approval`,
        { decision },
        { headers: { 'x-auth': token, 'Content-Type': 'application/json' } }
      );
      if (!response.data.status) {
        alert(response.data.message || 'Failed to update approval');
        return;
      }
      await fetchApprovalSummary();
      fetchPerformanceSummary();
      const map = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
      const approvalStatus = map[leadApprovalTab];
      const listRes = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
        headers: { 'x-auth': token },
        params: { approvalStatus, limit: 500, page: 1 },
      });
      if (listRes.data.status) {
        setApprovalListLeads(listRes.data.data.leads || []);
      }
      if (mainTab === 'performance') {
        const opts = { approvalStatus: 'Approved', fetchLimit: 200 };
        if (performanceTab !== 'all') {
          opts.performanceLeadStatus = performanceTab;
        }
        fetchLeads(null, 1, opts);
      } else {
        fetchLeads(selectedStatusFilter, currentPage);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update approval');
    }
  };

  useEffect(() => {
    if (mainTab !== 'lead') return;
    fetchApprovalSummary();
  }, [mainTab]);

  useEffect(() => {
    if (mainTab !== 'lead' || leadTab !== 'approval') return;
    const map = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
    const approvalStatus = map[leadApprovalTab];
    if (!approvalStatus) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingApprovalList(true);
        const response = await axios.get(`${backendUrl}/college/b2b_copy/leads`, {
          headers: { 'x-auth': token },
          params: { approvalStatus, limit: 500, page: 1 },
        });
        if (!cancelled && response.data.status) {
          setApprovalListLeads(response.data.data.leads || []);
        }
      } catch (e) {
        console.error('approval list fetch', e);
      } finally {
        if (!cancelled) setLoadingApprovalList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mainTab, leadTab, leadApprovalTab, backendUrl, token]);


  // Check if user can update a lead
  const canUpdateLead = (lead) => {
    if (!lead || !userData?._id) return false;
    
    // Admin can always update - check both permissions state and userData
    const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
    if (permissionType === 'Admin') return true;
    
    // Check if user is the lead owner or lead added by
    const userId = userData._id;
    const leadAddedById = lead.leadAddedBy?._id || lead.leadAddedBy;
    const leadOwnerId = lead.leadOwner?._id || lead.leadOwner;
    
    return leadAddedById?.toString() === userId?.toString() || 
           leadOwnerId?.toString() === userId?.toString();
  };

  // Update lead status
  const updateLeadStatus = async (leadId, statusData) => {
    try {
      // Get current status information for logging
      const currentStatus = selectedProfile?.status?.name || 'Unknown';
      const currentSubStatus = selectedProfile?.subStatus?.title || 'No Sub-Status';
      const newStatus = statuses.find(s => s._id === statusData.status)?.name || 'Unknown';
      const newSubStatus = subStatuses.find(s => s._id === statusData.subStatus)?.title || 'No Sub-Status';

      const response = await axios.put(`${backendUrl}/college/b2b_copy/leads/${leadId}/status`, statusData, {
        headers: { 'x-auth': token }
      });

      if (response.data.status) {
        // Refresh the leads list
        fetchLeads(selectedStatusFilter, currentPage);

        // Refresh status counts
        fetchStatusCounts();

        // Close the panel
        closePanel();
      } else {
        alert(response.data.message || 'Failed to update lead status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update lead status. Please try again.';
      alert(errorMessage);
    }
  };

  // Handle lead form submission
  const handleLeadSubmit = async () => {
    if (!validateLeadForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data according to backend schema
      const leadData = {
        leadCategory: leadFormData.leadCategory,
        typeOfB2B: leadFormData.typeOfB2B,
        businessName: leadFormData.businessName,
        address: leadFormData.address,
        city: leadFormData.city,
        state: leadFormData.state,
        concernPersonName: leadFormData.concernPersonName,
        designation: leadFormData.designation,
        email: leadFormData.email,
        mobile: leadFormData.mobile,
        whatsapp: leadFormData.whatsapp,
        landlineNumber: leadFormData.landlineNumber,
        leadOwner: userData?._id || leadFormData.leadOwner,
        leadStatus: leadFormData.leadStatus,
        lockLeadDays: Number(leadFormData.lockLeadDays),
        remark: leadFormData.remark
      };

      // Lock duration (60 days): assign Lead Owner to logged-in user
      if (Number(leadFormData.lockLeadDays) === 60 && userData?._id) {
        leadData.leadOwner = userData._id;
      }
      // Add coordinates if location is selected
      if (selectedLocation) {
        leadData.coordinates = {
          type: "Point",
          coordinates: [selectedLocation.lng, selectedLocation.lat] // [longitude, latitude]
        };
      } else if (leadFormData.longitude && leadFormData.latitude) {
        leadData.coordinates = {
          type: "Point",
          coordinates: [leadFormData.longitude, leadFormData.latitude] // [longitude, latitude]
        };
      }

      // Send data to backend API
      const response = await axios.post(`${backendUrl}/college/b2b_copy/add-lead`, leadData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.status) {
        const createdLeadId = response.data?.data?._id;
        if (createdLeadId) {
          setMainTab('lead');
          setLeadTab('approval');
          setLeadApprovalTab('pending');
        }

        // Show success message
        alert('Lead added successfully!');

        fetchApprovalSummary();
        fetchLeads(null, 1);
        fetchStatusCounts();

        // Reset form
        setLeadFormData({
          leadCategory: '',
          typeOfB2B: '',
          businessName: '',
          businessAddress: '',
          concernPersonName: '',
          address: '',
          city: '',
          state: '',
          designation: '',
          email: '',
          mobile: '',
          whatsapp: '',
          landlineNumber: '',
          leadOwner: '',
          leadStatus: '',
          lockLeadDays: '60',
          remark: ''
        });
        setFormErrors({});
        setExtractedNumbers([]);
        setSelectedLocation(null);
        setShowMap(false);

        // Close modal
        setShowAddLeadModal(false);
      } else {
        alert(response.data.message || 'Failed to add lead');
      }

    } catch (error) {
      console.error('Error submitting lead:', error);
      if (error.response?.data?.message) {
        alert(`Failed to add lead: ${error.response.data.message}`);
      } else {
        alert('Failed to add lead. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Close lead modal
  const handleCloseLeadModal = () => {
    setShowAddLeadModal(false);
    setLeadFormData({
      leadCategory: '',
      typeOfB2B: '',
      businessName: '',
      businessAddress: '',
      concernPersonName: '',
      address: '',
      city: '',
      state: '',
      designation: '',
      email: '',
      mobile: '',
      whatsapp: '',
      landlineNumber: '',
      leadOwner: '',
      remark: ''
    });
    setFormErrors({});
    setExtractedNumbers([]);
    setSelectedLocation(null);
    setShowMap(false);
  };

  // Open lead modal and initialize autocomplete
  const handleOpenLeadModal = () => {
    setShowAddLeadModal(true);
  };

  // Bulk Upload Functions
  const handleBulkFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        setBulkUploadMessage('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setBulkUploadMessage('File size should not exceed 10MB');
        e.target.value = '';
        return;
      }
      
      setBulkUploadFile(selectedFile);
      setBulkUploadMessage('');
      setBulkUploadErrors([]);
      setBulkUploadSuccess(false);
    }
  };

  const handleBulkUpload = async () => {
    // Get file directly from input element
    const fileInput = bulkUploadFileInputRef.current;
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      setBulkUploadMessage('Please select a file');
      return;
    }

    const selectedFile = fileInput.files[0];

    // Validate file object
    if (!(selectedFile instanceof File)) {
      setBulkUploadMessage('Invalid file object. Please select the file again.');
      return;
    }

    setBulkUploadLoading(true);
    setBulkUploadMessage('');
    setBulkUploadErrors([]);
    setBulkUploadSuccess(false);

    // Create FormData and append file
    const formData = new FormData();
    formData.append('file', selectedFile, selectedFile.name);

    // Debug: Log FormData contents
    console.log('File to upload:', selectedFile);
    console.log('File name:', selectedFile?.name);
    console.log('File size:', selectedFile?.size);
    console.log('File type:', selectedFile?.type);
    console.log('Is File instance:', selectedFile instanceof File);
    
    // Verify FormData
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log('  -', pair[0], ':', pair[1]);
    }

    try {
      const response = await axios.post(`${backendUrl}/college/b2b_copy/leads/import`, formData, {
        headers: {
          'x-auth': token
          // Don't set Content-Type - axios will automatically set it with boundary for FormData
        }
      });

      if (response.data.status) {
        setBulkUploadSuccess(true);
        const successCount = response.data.data?.inserted || 0;
        const errorCount = response.data.data?.errors || 0;
        const errorDetails = response.data.data?.errorDetails || [];
        
        setBulkUploadMessage(
          `✅ ${successCount} leads imported successfully${errorCount > 0 ? `. ${errorCount} errors found.` : ''}`
        );
        
        if (errorDetails.length > 0) {
          setBulkUploadErrors(errorDetails);
        }

        // Refresh the leads list and status counts
        fetchLeads(selectedStatusFilter, currentPage);
        fetchStatusCounts();

        // Clear file after 3 seconds
        setTimeout(() => {
          setBulkUploadFile(null);
          const fileInput = document.getElementById('bulkUploadFile');
          if (fileInput) {
            fileInput.value = '';
          }
        }, 3000);
      } else {
        setBulkUploadMessage(response.data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setBulkUploadMessage(
        error.response?.data?.message || 'Failed to upload file. Please try again.'
      );
    } finally {
      setBulkUploadLoading(false);
    }
  };

  const handleCloseBulkUploadModal = () => {
    setShowBulkUploadModal(false);
    setBulkUploadFile(null);
    setBulkUploadMessage('');
    setBulkUploadErrors([]);
    setBulkUploadSuccess(false);
    const fileInput = document.getElementById('bulkUploadFile');
    if (fileInput) {
      fileInput.value = '';
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchLeads(selectedStatusFilter, newPage);
  };
  useEffect(() => {
    getPaginationPages()
  }, [totalPages])




  //Date picker
  const today = new Date();  // Current date


  // Toggle POPUP

  const [crmFilters, setCrmFilters] = useState([
    { _id: '', name: '', count: 0, milestone: '' },

  ]);
  const [statuses, setStatuses] = useState([
    { _id: '', name: '', count: 0 },

  ]);

  // edit status and set followup
  const [seletectedStatus, setSelectedStatus] = useState('');
  const [seletectedSubStatus, setSelectedSubStatus] = useState(null);
  // Single state for all follow-up form data
  const [followupFormData, setFollowupFormData] = useState({
    followupDate: '',
    followupTime: '',
    remarks: '',
    selectedProfile: null,
    selectedConcernPerson: null,
    selectedProfiles: null,
    selectedCounselor: null,
    selectedDocument: null
  });


  const [subStatuses, setSubStatuses] = useState([


  ]);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed, crmFilters]);
  const { widthRef, width } = useMainWidth([isFilterCollapsed, crmFilters, mainContentClass]);
  const { isScrolled, scrollY, contentRef } = useScrollBlur(navHeight);
  const blurIntensity = Math.min(scrollY / 10, 15);
  const navbarOpacity = Math.min(0.85 + scrollY / 1000, 0.98);
  const tabs = [
    'Lead Details', ,
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
    fetchStatus()

  }, []);

  useEffect(() => {
    if (seletectedStatus || filters.status) {
      fetchSubStatus()
    }
  }, [seletectedStatus, filters.status]);


  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };



  const handleTimeChange = (e) => {
    if (!followupFormData.followupDate) {
      alert('Select date first');
      return;  // Yahan return lagao
    }

    const time = e.target.value; // "HH:mm"

    const [hours, minutes] = time.split(':');

    const selectedDateTime = new Date(followupFormData.followupDate);
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
    setFollowupFormData(prev => ({ ...prev, followupTime: time }));
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
      const response = await axios.get(`${backendUrl}/college/statusB2b`, {
        headers: { 'x-auth': token }
      });

      console.log('B2B fetchStatus response:', response.data);

      if (response.data.success) {
        const status = response.data.data;
        console.log('B2B Fetched statuses:', status);
        const allFilter = { _id: 'all', name: 'All' };

        setCrmFilters([allFilter, ...status.map(r => ({
          _id: r._id,
          name: r.title,
          milestone: r.milestone,
        }))]);

        setStatuses(status.map(r => ({
          _id: r._id,
          name: r.title,
          count: r.count || 0,
        })));

        console.log('B2B Statuses set:', status.length);
      } else {
        console.error('API returned error:', response.data);
        alert('Failed to fetch Status: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching B2B statuses:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to fetch Status: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchSubStatus = async () => {
    try {
      const status = seletectedStatus || filters.status;
      if (!status) {
        alert('Please select a status');
        return;
      }
      const response = await axios.get(`${backendUrl}/college/statusB2b/${status}/substatus`, {
        headers: { 'x-auth': token }
      });


      if (response.data.success) {
        const status = response.data.data;


        setSubStatuses(response.data.data);


      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch SubStatus');
    }
  };









  const openEditPanel = async (profile = null, panel) => {
    // Check permission before opening panel
    if (profile && (panel === 'StatusChange' || panel === 'SetFollowup')) {
      if (!canUpdateLead(profile)) {
        alert('You do not have permission to update this lead. Only the lead owner or the person who added the lead can update it.');
        return;
      }
    }

    setSelectedProfile(null)
    setShowPanel('')
    setSelectedStatus(null)
    setSelectedSubStatus(null)


    if (profile) {
      setSelectedProfile(profile);
      setFollowupFormData(prev => ({ ...prev, selectedProfile: profile }));
    }

    // Close all panels first

    setShowPopup(null);
    setSelectedConcernPerson(null);


    if (panel === 'StatusChange') {
      if (profile) {
        const newStatus = profile?._leadStatus?._id || '';
        setSelectedStatus(newStatus);

        // if (newStatus) {
        //   await fetchSubStatus(newStatus);
        // }

        setSelectedSubStatus(profile?.selectedSubstatus || '');
      }
      setShowPanel('editPanel')

    }
    else if (panel === 'SetFollowup') {
      setShowPopup(null)
      setShowPanel('followUp')
    }
    else if (panel === 'bulkstatuschange') {
      setShowPopup(null)
      setShowPanel('bulkstatuschange')

    }

    if (!isMobile) {
      setMainContentClass('col-8');

      setTimeout(() => {
        if (widthRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);

    }
  };

  const openPanelHome = (profile = null) => {
    if (profile) {
      setSelectedProfile(profile);
      setFollowupFormData((prev) => ({ ...prev, selectedProfile: profile }));
    }

    setShowPopup(null);
    setSelectedConcernPerson(null);
    setShowPanel('panelHome');

    if (!isMobile) {
      setMainContentClass('col-8');
      setTimeout(() => {
        if (widthRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);
    }
  };

  const toggleLeadCardCollapsed = (leadId) => {
    if (!leadId) return;
    setCollapsedLeadCards((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };


  const closePanel = () => {
    // Hide bulk inputs when bulk refer panel is closed
    if (showPanel === 'RefferAllLeads') {
      setShowBulkInputs(false);
      setBulkMode('');
      setInput1Value('');
      setSelectedProfiles([]);
    }
    setShowPanel('');
    clearFollowupFormData();
    setShowPopup(null);
    clearFollowupFormData();
    setSelectedStatus(null)
    setSelectedSubStatus(null)
    if (!isMobile) {
      setMainContentClass('col-12');
    }
  };



  const openRefferPanel = async (profile = null, panel) => {

    if (profile) {
      setSelectedProfile(profile);
    }

    setShowPopup(null);

    if (panel === 'RefferAllLeads') {
      setShowPanel('RefferAllLeads');
      // Ensure bulk mode is enabled for "Refer All Leads"
      setShowBulkInputs(true);
      setBulkMode('bulkrefer');
      setInput1Value('');
      setSelectedProfiles([]);
    } else if (panel === 'Reffer') {
      setShowPanel('Reffer');
    }

    if (!isMobile) {
      setMainContentClass('col-8');

      setTimeout(() => {
        if (widthRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      }, 200);
    }
  };


  const handleConcernPersonChange = (e) => {
    setSelectedConcernPerson(e.target.value);
  }

  const handleReferLead = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedConcernPerson) {
      alert('Please select a counselor');
      return;
    }

    if (showPanel === 'RefferAllLeads') {
      if (!selectedProfiles || selectedProfiles.length === 0) {
        alert('Please select at least one lead to refer. Enter a number in Input 1 to select leads.');
        return;
      }
    } else {
      if (!selectedProfile || !selectedProfile._id) {
        alert('Please select a lead to refer');
        return;
      }
    }

    try {
      const isBulk = showPanel === 'RefferAllLeads';
      
      if (isBulk) {
        // Bulk route (backend supports array)
        try {
          const bulkRes = await axios.post(
            `${backendUrl}/college/b2b_copy/refer-leads`,
            { counselorId: selectedConcernPerson, leadIds: selectedProfiles },
            { headers: { 'x-auth': token } }
          );

          if (bulkRes?.data?.status) {
            const modified = bulkRes?.data?.data?.modified;
            const okCount = typeof modified === 'number' ? modified : (selectedProfiles?.length || 0);
            alert(`Referred ${okCount} lead(s) successfully!`);
            await fetchLeads(selectedStatusFilter, currentPage);
            await fetchStatusCounts();
            closePanel();
            return;
          }
        } catch (bulkErr) {
          // If bulk endpoint not available yet, fallback below
          console.warn('Bulk refer endpoint failed, falling back to single calls:', bulkErr?.response?.status);
        }

        // Fallback: call single endpoint per lead
        const results = await Promise.allSettled(
          (selectedProfiles || []).map((id) =>
            axios.post(
              `${backendUrl}/college/b2b_copy/refer-lead`,
              { counselorId: selectedConcernPerson, leadId: id, type: 'single' },
              { headers: { 'x-auth': token } }
            )
          )
        );

        const ok = results.filter((r) => r.status === 'fulfilled' && r.value?.data?.status).length;
        const failed = results.length - ok;

        if (ok > 0) {
          alert(`Referred ${ok} lead(s) successfully${failed ? `, ${failed} failed` : ''}.`);
          await fetchLeads(selectedStatusFilter, currentPage);
          await fetchStatusCounts();
          closePanel();
          return;
        }

        alert('Failed to refer selected leads');
        return;
      }

      // Single refer
      const response = await axios.post(
        `${backendUrl}/college/b2b_copy/refer-lead`,
        { counselorId: selectedConcernPerson, leadId: selectedProfile._id, type: 'single' },
        { headers: { 'x-auth': token } }
      );

      if (response?.data?.status) {
        alert('Lead referred successfully!');
        await fetchLeads(selectedStatusFilter, currentPage);
        await fetchStatusCounts();
        closePanel();
        return;
      }

      alert(response?.data?.message || 'Failed to refer lead');
    } catch (error) {
      console.error('Error referring lead:', error);
      alert(error.response?.data?.message || 'Failed to refer lead. Please try again.');
    }
  }
  const openleadHistoryPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null);
    setShowPanel('leadHistory');
    setSelectedConcernPerson(null);
    setSelectedProfiles([]);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };


  const openProfileEditPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null);
    setShowPanel('ProfileEdit');
    setSelectedConcernPerson(null);
    setSelectedProfiles([]);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  const toggleLeadDetails = (profileIndex) => {
    setLeadDetailsVisible(prev => prev === profileIndex ? null : profileIndex);
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

  useEffect(() => {
    // close dropdown when panel/lead changes
    setPanelActionsOpen(false);
  }, [showPanel, selectedProfile?._id]);

  useEffect(() => {
    const onDocDown = (e) => {
      if (!panelActionsOpen) return;
      const el = panelActionsRef.current;
      if (el && !el.contains(e.target)) setPanelActionsOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [panelActionsOpen]);

  const PanelActionToolbar = () => {
    const hasLead = !!selectedProfile?._id;
    const disabled = !hasLead || showPanel === 'RefferAllLeads';
    const isActive = (key) => showPanel === key;

    return (
      <div ref={panelActionsRef} className="position-relative me-2" aria-label="Panel actions">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          disabled={disabled}
          onClick={() => setPanelActionsOpen((v) => !v)}
          title="Actions"
          style={{ borderRadius: '10px', padding: '6px 10px' }}
        >
          <i className="fas fa-sliders-h me-1"></i>
          Actions
          <i className={`fas fa-chevron-${panelActionsOpen ? 'up' : 'down'} ms-2`} style={{ fontSize: '10px' }}></i>
        </button>

        {panelActionsOpen && !disabled && (
          <div
            className="card border-0 shadow-sm"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              minWidth: '220px',
              borderRadius: '12px',
              overflow: 'hidden',
              zIndex: 50,
            }}
          >
            <div className="list-group list-group-flush">
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${isActive('editPanel') ? 'active' : ''}`}
                onClick={() => { setPanelActionsOpen(false); if (!isActive('editPanel')) openEditPanel(selectedProfile, 'StatusChange'); }}
              >
                <i className="fas fa-edit"></i>
                <span className="fw-semibold">Change Status</span>
              </button>
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${isActive('Reffer') ? 'active' : ''}`}
                onClick={() => { setPanelActionsOpen(false); if (!isActive('Reffer')) openRefferPanel(selectedProfile, 'Reffer'); }}
              >
                <i className="fas fa-share"></i>
                <span className="fw-semibold">Refer</span>
              </button>
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${isActive('leadHistory') ? 'active' : ''}`}
                onClick={() => { setPanelActionsOpen(false); if (!isActive('leadHistory')) openleadHistoryPanel(selectedProfile); }}
              >
                <i className="fas fa-history"></i>
                <span className="fw-semibold">History</span>
              </button>
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${isActive('followUp') ? 'active' : ''}`}
                onClick={() => { setPanelActionsOpen(false); if (!isActive('followUp')) openEditPanel(selectedProfile, 'SetFollowup'); }}
              >
                <i className="fas fa-calendar-plus"></i>
                <span className="fw-semibold">Set Follow-up</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Status Change Panel
  const renderStatusChangePanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-edit text-primary"></i>
            </div>
            <h6 className="mb-0 fw-medium text-primary">
              Change Status for {selectedProfile?.businessName || 'Lead'}
            </h6>
          </div>
          <div className='d-flex align-items-center'>
            {userData.googleAuthToken?.accessToken && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm me-2 google-btn"
                onClick={handleGoogleLogout}
              >
                Disconnect Google Calendar
              </button>
            )}
            <PanelActionToolbar />
            <button className="btn-close" type="button" onClick={closePanel}></button>
          </div>
        </div>

        <div className="card-body">
          {userData.googleAuthToken?.accessToken && !isgoogleLoginLoading ? (
            <form onSubmit={addFollowUpToGoogleCalendar}>
              {/* Status Selection */}
              <div className="mb-3">
                <label htmlFor="status" className="form-label small fw-medium text-dark">
                  Status<span className="text-danger">*</span>
                </label>
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
                  {statuses.map((status, index) => (
                    <option key={status._id} value={status._id}>{status.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Status Selection */}
              <div className="mb-3">
                <label htmlFor="subStatus" className="form-label small fw-medium text-dark">
                  Sub-Status
                </label>
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
                  {subStatuses.map((subStatus, index) => (
                    <option key={subStatus._id} value={subStatus._id}>{subStatus.title}</option>
                  ))}
                </select>
              </div>

              {/* Follow-up Section (if substatus has followup) */}
              {seletectedSubStatus && seletectedSubStatus.hasFollowup && (
                <div className="mb-3">
                  <h6 className="text-dark mb-2">Follow-up Details</h6>
                  <div className="row">
                    <div className="col-6 ps-3">
                      <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark">
                        Next Action Date <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        className="form-control border-0 bgcolor small-date"
                        onChange={(date) => setFollowupFormData(prev => ({ ...prev, followupDate: date }))}
                        value={followupFormData.followupDate}
                        format="dd/MM/yyyy"
                        minDate={today}
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="actionTime" className="form-label small fw-medium text-dark">
                        Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control border-0 bgcolor"
                        id="actionTime"
                        onChange={(e) => setFollowupFormData(prev => ({ ...prev, followupTime: e.target.value }))}
                        value={followupFormData.followupTime}
                        style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks Section - Only show if substatus has hasRemarks: true */}
              {seletectedSubStatus && seletectedSubStatus.hasRemarks && (
                <div className="mb-3">
                  <label htmlFor="remarks" className="form-label small fw-medium text-dark">
                    Remarks <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control border-0 bgcolor"
                    id="remarks"
                    rows="4"
                    onChange={(e) => setFollowupFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    value={followupFormData.remarks}
                    placeholder="Enter remarks about this status change..."
                    style={{ resize: 'none', backgroundColor: '#f1f2f6' }}
                    required
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Status
                </button>
              </div>
            </form>
          ) : !isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <button className="btn btn-primary" onClick={handleGoogleLogin}>
                  Login with Google to Update Status
                </button>
              </div>
            </div>
          )}

          {isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'editPanel' ? (
        <div
          className="modal show d-block"
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

    return showPanel === 'editPanel' ? (
      <div className="col-12 transition-col" id="statusChangePanel">
        {panelContent}
      </div>
    ) : null;
  };

  // Render Follow-up Panel
  const renderFollowupPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm" style={{
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom" style={{
          borderRadius: '12px 12px 0 0',
          borderBottom: '2px solid #f8f9fa',
          backgroundColor: '#f8f9fa'
        }}>
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-calendar-plus text-success" style={{ fontSize: '18px' }}></i>
            </div>
            <h6 className="mb-0 fw-medium text-success" style={{ fontSize: '16px', fontWeight: '600' }}>
              Set Follow-up for {selectedProfile?.businessName || 'Lead'}
            </h6>
          </div>
          <div className="d-flex align-items-center">
            {userData.googleAuthToken?.accessToken && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm me-2 google-btn"
                onClick={handleGoogleLogout}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '999px'
                }}
              >
                Disconnect Google Calendar
              </button>
            )}
            <PanelActionToolbar />
            <button className="btn-close" type="button" onClick={closePanel} style={{
              fontSize: '14px',
              padding: '4px',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              border: 'none',
              color: '#6c757d'
            }}></button>
          </div>
        </div>

        <div className="card-body" style={{ padding: '24px' }}>
          {userData.googleAuthToken?.accessToken && !isgoogleLoginLoading ? (
            <form onSubmit={addFollowUpToGoogleCalendar}>
              {/* Follow-up Date and Time */}
              <div className="row mb-4">
                <div className="col-6">
                  <label htmlFor="nextActionDate" className="form-label small fw-medium text-dark" style={{ fontSize: '13px', marginBottom: '8px' }}>
                    Follow-up Date <span className="text-danger">*</span>
                  </label>
                  <DatePicker
                    className="form-control border-0 bgcolor"
                    onChange={(date) => setFollowupFormData(prev => ({ ...prev, followupDate: date }))}
                    value={followupFormData.followupDate}
                    format="dd/MM/yyyy"
                    minDate={today}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #ced4da',
                      borderRadius: '8px',
                      height: '42px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <div className="col-6">
                  <label htmlFor="actionTime" className="form-label small fw-medium text-dark" style={{ fontSize: '13px', marginBottom: '8px' }}>
                    Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className="form-control border-0 bgcolor"
                    id="actionTime"
                    onChange={(e) => setFollowupFormData(prev => ({ ...prev, followupTime: e.target.value }))}
                    value={followupFormData.followupTime}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #ced4da',
                      borderRadius: '8px',
                      height: '42px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="mb-4">
                <label htmlFor="followupRemarks" className="form-label small fw-medium text-dark" style={{ fontSize: '13px', marginBottom: '8px' }}>
                  Follow-up Notes
                </label>
                <textarea
                  className="form-control border-0 bgcolor"
                  id="followupRemarks"
                  rows="4"
                  onChange={(e) => setFollowupFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  value={followupFormData.remarks}
                  placeholder="Enter follow-up notes..."
                  style={{
                    resize: 'none',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #ced4da',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    minHeight: '100px'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderWidth: '1.5px',
                    minWidth: '100px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    minWidth: '120px',
                    boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                  }}
                >
                  Set Follow-up
                </button>
              </div>
            </form>
          ) : !isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <button className="btn btn-primary" onClick={handleGoogleLogin}>
                  Login with Google to Set Follow-up
                </button>
              </div>
            </div>
          )}

          {isgoogleLoginLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'followUp' ? (
        <div
          className="modal show d-block"
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

    return showPanel === 'followUp' ? (
      <div className="col-12 transition-col" id="followupPanel">
        {panelContent}
      </div>
    ) : null;
  };

  const renderPanelHome = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-layer-group text-primary"></i>
            </div>
            <h6 className="mb-0 fw-medium text-primary">
              {selectedProfile?.businessName ? selectedProfile.businessName : 'Lead Actions'}
            </h6>
          </div>
          <div className="d-flex align-items-center">
            <PanelActionToolbar />
            <button className="btn-close" type="button" onClick={closePanel}></button>
          </div>
        </div>
        <div className="card-body">
          <div className="text-muted" style={{ fontSize: '13px' }}>
            Select an action from the icons above to open its panel.
          </div>
          <div className="mt-3 small text-muted">
            Available: Change Status, Refer, History, Set Follow-up.
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return showPanel === 'panelHome' ? (
        <div
          className="modal show d-block"
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

    return showPanel === 'panelHome' ? (
      <div className="col-12 transition-col" id="panelHome">
        {panelContent}
      </div>
    ) : null;
  };

  // Render Reffer Panel (Desktop Sidebar or Mobile Modal)

  const renderRefferPanel = () => {
    const panelContent = (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="fas fa-user-edit text-secondary"></i>
            </div>
            <h6 className="mb-0 followUp fw-medium">
              {showPanel === 'Reffer' && (`Refer Lead ${selectedProfile?.businessName || 'Unknown'} to Counselor`)}
              {showPanel === 'RefferAllLeads' && (`Refer All Leads to Counselor`)}
            </h6>
          </div>
          <div className="d-flex align-items-center">
            <button className="btn-close" type="button" onClick={closePanel}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
          </div>
        </div>

        <div className="card-body">
          <form>


            <>

              {/* NEW COUNSELOR SELECT DROPDOWN */}
              <div className="mb-1">
                <label htmlFor="counselor" className="form-label small fw-medium text-dark">
                  Select Counselor<span className="text-danger">*</span>
                </label>
                <div className="d-flex">
                  <div className="form-floating flex-grow-1">
                    <select
                      className="form-select border-0  bgcolor"
                      id="counselor"
                      style={{
                        height: '42px',
                        paddingTop: '8px',
                        paddingInline: '10px',
                        width: '100%',
                        backgroundColor: '#f1f2f6'
                      }}
                      onChange={handleConcernPersonChange}
                    >
                      <option value="">Select Counselor</option>
                      {users.map((counselor, index) => (
                        <option key={index} value={counselor._id}>{counselor.name}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </>

            {/* Bulk refer info (selection happens from the bulk bar above the cards) */} 
            {showPanel === 'RefferAllLeads' && (
              <div className="mb-3 p-2 bg-light rounded" style={{ fontSize: '13px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">
                    <i className="fas fa-users me-1"></i>
                    Selected Leads:
                  </span>
                  <span className="fw-semibold text-primary">
                    {selectedProfiles?.length || 0}
                  </span>
                </div>
                <small className="text-muted d-block mt-1">
                  Type a number in the bulk bar above the lead cards to auto-select.
                </small>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn"
                style={{ border: '1px solid #ddd', padding: '8px 24px', fontSize: '14px' }}
                onClick={closePanel}
              >
                CLOSE
              </button>
              <button
                type="button"
                className="btn text-white"
                onClick={(e) => handleReferLead(e)}
                disabled={
                  !selectedConcernPerson || 
                  (showPanel === 'RefferAllLeads' && (selectedProfiles.length === 0 && !input1Value))
                }
                style={{ 
                  backgroundColor: (!selectedConcernPerson || (showPanel === 'RefferAllLeads' && selectedProfiles.length === 0 && !input1Value)) ? '#ccc' : '#fd7e14', 
                  border: 'none', 
                  padding: '8px 24px', 
                  fontSize: '14px',
                  cursor: (!selectedConcernPerson || (showPanel === 'RefferAllLeads' && selectedProfiles.length === 0 && !input1Value)) ? 'not-allowed' : 'pointer'
                }}
              >
                {showPanel === 'Reffer' ? 'REFER LEAD' : 'REFER BULK LEAD'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (showPanel === 'Reffer') || (showPanel === 'RefferAllLeads') ? (
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

    return (showPanel === 'Reffer') || (showPanel === 'RefferAllLeads') ? (
      <div className="col-12 transition-col" id="refferPanel">
        {panelContent}
      </div>
    ) : null;
  };

  const fetchLeadLogs = async (leadId) => {
    try {
      setLeadLogsLoading(true);
      const response = await axios.get(`${backendUrl}/college/b2b_copy/leads/${leadId}/logs`, {
        headers: { 'x-auth': token }
      });
      if (response.data.status) {
        // console.log(response.data.data, 'response.data.data')
        setLeadLogs(response.data.data);
      }
    } catch (error) {
      console.log(error, 'error');
    } finally {
      setLeadLogsLoading(false);
    }
  }

  useEffect(() => {
    if (showPanel === 'leadHistory') {
      fetchLeadLogs(selectedProfile._id);
    }
  }, [showPanel]);

  // Render Edit Panel (Desktop Sidebar or Mobile Modal)
  const renderLeadHistoryPanel = () => {
    const panelContent = (
      <>
        {leadLogsLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
              <div className="d-flex align-items-center">
                <div className="me-2">
                  <i className="fas fa-history text-primary"></i>
                </div>
                <h6 className="mb-0 fw-medium">Lead History</h6>
              </div>
              <button className="btn-close" type="button" onClick={closePanel}></button>
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
                {leadLogs && leadLogs.logs && leadLogs.logs.length > 0 ? (
                  <div className="timeline">
                    {leadLogs.logs.map((log, index) => (
                      <div key={index} className="timeline-item mb-4">
                        <div className="timeline-marker">
                          <div className="timeline-marker-icon">
                            <i className="fas fa-circle text-primary" style={{ fontSize: '8px' }}></i>
                          </div>
                          {index !== leadLogs.logs.length - 1 && (
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
                                  Modified By: {log.user || 'Unknown User'}
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
        )}
      </>
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



  // ===== Derived data for redesigned tabs =====
  const nowTs = Date.now();
  const followupLeads = (leads || []).filter((l) => !!l?.followUp);
  const followupBuckets = followupLeads.reduce(
    (acc, l) => {
      const fu = l.followUp || {};
      const status = (fu.status || '').toLowerCase();
      const scheduledTs = fu.scheduledDate ? new Date(fu.scheduledDate).getTime() : NaN;

      if (status === 'completed') {
        acc.done.push(l);
        return acc;
      }

      if (Number.isFinite(scheduledTs) && scheduledTs < nowTs && status !== 'completed') {
        acc.missed.push(l);
        return acc;
      }

      // planned: has followup pending but no strict scheduled window
      acc.planned.push(l);

      // scheduled window bucket for dropdown
      if (Number.isFinite(scheduledTs)) {
        acc.scheduled.push(l);
      }
      return acc;
    },
    { done: [], planned: [], scheduled: [], missed: [] }
  );

  return (
    <div className="container-fluid">

      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass} style={{
          width: !isMobile && showPanel ? 'calc(100% - 350px)' : '100%',
          marginRight: !isMobile && showPanel ? '350px' : '0',
          transition: 'all 0.3s ease'
        }}>
          <div
            className="content-blur-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: `${navHeight + 50}px`,
              background: `linear-gradient(
                180deg,
                rgba(255, 255, 255, ${isScrolled ? 0.7 : 0}) 0%,
                rgba(255, 255, 255, ${isScrolled ? 0.5 : 0}) 50%,
                rgba(255, 255, 255, ${isScrolled ? 0.2 : 0}) 80%,
                transparent 100%
              )`,
              backdropFilter: isScrolled ? `blur(${blurIntensity * 0.5}px)` : 'none',
              WebkitBackdropFilter: isScrolled ? `blur(${blurIntensity * 0.5}px)` : 'none',
              pointerEvents: 'none',
              zIndex: 9,
              transition: 'all 0.3s ease',
              opacity: isScrolled ? 1 : 0
            }}
          />
          <div className="position-relative" ref={widthRef} >
            <nav ref={navRef} className="" style={{ zIndex: 11, backgroundColor: 'white', position: 'fixed', width: `${width}px`, boxShadow: '0 4px 25px 0 #0000001a', paddingBlock: '5px' }}
            >
              <div className="container-fluid">
                <div className="row align-items-center">
                  <div className="col-md-6 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">
                      <h5 className="fw-bold text-dark mb-0 me-3" style={{ fontSize: '1.1rem' }}>B2B Cycle</h5>
                      <div className="btn-group btn-group-sm ms-2" role="group" aria-label="B2B main tabs">
                        <button
                          type="button"
                          className={`btn ${mainTab === 'lead' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => { setMainTab('lead'); setLeadTab('approval'); }}
                        >
                          Lead
                        </button>
                        <button
                          type="button"
                          className={`btn ${mainTab === 'performance' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => { setMainTab('performance'); setPerformanceTab('all'); }}
                        >
                          Performance
                        </button>
                        <button
                          type="button"
                          className={`btn ${mainTab === 'followup' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setMainTab('followup')}
                        >
                          Followup
                        </button>
                        <button
                          type="button"
                          className={`btn ${mainTab === 'documents' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setMainTab('documents')}
                        >
                          Documents
                        </button>
                      </div>
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
                          <li className="breadcrumb-item">
                            <a href="/institute/dashboard" className="text-decoration-none">Home</a>
                          </li>
                          <li className="breadcrumb-item active">B2B Cycle</li>
                        </ol>
                      </nav>
                    </div>
                  </div>

                  <div className="col-md-6">
                    {/* Desktop Layout */}
                    <div className="d-none flex-row-reverse d-md-flex justify-content-between align-items-center gap-2">
                      {/* Left side - Buttons */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {/* Quick Search */}
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Quick search..."
                              value={filters.search}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleFilterChange('search', val);
                                if (val === '') applyFilters({ search: '' });
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  applyFilters();
                                }
                              }}
                              style={{
                                width: '200px',
                                paddingRight: '30px',
                                paddingLeft: '12px',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                backgroundColor: '#ffffff',
                                border: '1.5px solid #ced4da',
                                color: '#212529',
                                fontSize: '13px',
                                borderRadius: '6px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s ease'
                              }}
                            />
                            {filters.search && (
                              <button
                                type="button"
                                className="btn btn-sm position-absolute"
                                onClick={() => {
                                  handleFilterChange('search', '');
                                  applyFilters({ search: '' });
                                }}
                                style={{
                                  right: '2px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  padding: '2px 6px',
                                  backgroundColor: '#dc3545',
                                  border: 'none',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <i className="fas fa-times" style={{ fontSize: '8px' }}></i>
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={applyFilters}
                            disabled={!filters.search}
                            style={{
                              backgroundColor: '#007bff',
                              borderColor: '#007bff',
                              color: 'white',
                              fontWeight: '500',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fas fa-search me-1"></i>
                          </button>
                        </div>

                        <button
                          className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setShowFilters(!showFilters)}
                          style={{
                            backgroundColor: showFilters ? '#007bff' : '#ffffff',
                            color: showFilters ? '#ffffff' : '#6c757d',
                            fontWeight: '500',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            transition: 'all 0.2s ease',
                            borderWidth: '1.5px'
                          }}
                        >
                          <i className="fas fa-filter me-1"></i>
                        </button>

                        <Link
                          to="/institute/lrp"
                          className="btn btn-sm btn-outline-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                          title="Add Day Visit Report (LRP)"
                        >
                          <i className="fas fa-clipboard-list" style={{ fontSize: '10px' }}></i>
                          Day Visit Report
                        </Link>
                        
                        {((permissions?.custom_permissions?.can_add_leads_b2b && permissions?.permission_type === 'Custom')|| permissions?.permission_type === 'Admin') && (
                          <>
                            <button className="btn btn-sm btn-outline-primary" style={{
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                              onClick={handleOpenLeadModal}
                            >
                              <i className="fas fa-plus" style={{ fontSize: "10px" }}></i>
                              Add Lead
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-primary" 
                              style={{
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              onClick={() => {
                                setShowBulkInputs(true);
                                setBulkMode('bulkupload');
                                setInput1Value('');
                                setShowBulkUploadModal(true);
                              }}
                            >
                              <i className="fas fa-file-upload" style={{ fontSize: "10px" }}></i>
                              Bulk Upload
                            </button>
                          </>
                        )}
                        {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            disabled={loadingLeads || leads.length === 0}
                            style={{
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            onClick={() => {
                              setShowBulkInputs(true);
                              setBulkMode('bulkrefer');
                              setInput1Value('');
                              openRefferPanel(null, 'RefferAllLeads');
                            }}
                          >
                            <i className="fas fa-share-alt" style={{ fontSize: "10px" }}></i>
                            Refer All Leads
                          </button>
                        )}
                      </div>

                      {/* Right side - Input Fields for Bulk Refer */}
                      {showBulkInputs && bulkMode === 'bulkrefer' && (
                        <div style={{
                          display: "flex",
                          alignItems: "stretch",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          backgroundColor: "#fff",
                          overflow: "hidden",
                          width: "200px",
                          height: "32px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }}>
                          <input
                            type="text"
                            placeholder="Input 1"
                            value={input1Value}
                            onChange={(e) => {
                              const maxValue = totalLeads || leads?.length || 0;
                              let inputValue = e.target.value.replace(/[^0-9]/g, '');
                              
                              if (inputValue === '') {
                                setInput1Value('');
                                return;
                              }
                              
                              const numValue = parseInt(inputValue, 10);
                              
                              if (numValue < 1 || isNaN(numValue)) {
                                inputValue = '1';
                              } else if (numValue > maxValue) {
                                inputValue = maxValue.toString();
                              }
                              
                              setInput1Value(inputValue);
                            }}
                            onKeyDown={(e) => {
                              if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            style={{
                              width: "50%",
                              border: "none",
                              borderRight: "1px solid #dee2e6",
                              outline: "none",
                              padding: "4px 10px",
                              fontSize: "12px",
                              backgroundColor: "transparent",
                              height: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Input 2"
                            value={totalLeads || leads?.length || 0}
                            readOnly
                            style={{
                              width: "50%",
                              border: "none",
                              outline: "none",
                              padding: "4px 10px",
                              fontSize: "12px",
                              backgroundColor: "transparent",
                              height: "100%",
                              boxSizing: "border-box",
                              cursor: "default"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="col-12 d-md-none mt-2">
                    <div className="row g-2">
                      <div className="col-12">
                        <Link
                          to="/institute/lrp"
                          className="btn w-100 btn-outline-secondary"
                          style={{
                            padding: '10px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                          }}
                        >
                          <i className="fas fa-clipboard-list" style={{ fontSize: '14px' }}></i>
                          Day Visit Report
                        </Link>
                      </div>
                      {((permissions?.custom_permissions?.can_add_leads_b2b && permissions?.permission_type === 'Custom')|| permissions?.permission_type === 'Admin') && (
                        <>
                          <div className="col-6">
                            <button className="btn w-100" style={{
                              padding: "12px 8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                              onClick={handleOpenLeadModal}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
                              }}
                            >
                              <i className="fas fa-plus" style={{ fontSize: "14px" }}></i>
                              Add Lead
                            </button>
                          </div>
                          <div className="col-6">
                            <button className="btn w-100" style={{
                              padding: "12px 8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                              onClick={() => {
                                setShowBulkInputs(true);
                                setBulkMode('bulkupload');
                                setInput1Value('');
                                setShowBulkUploadModal(true);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                              }}
                            >
                              <i className="fas fa-file-upload" style={{ fontSize: "14px" }}></i>
                              Bulk Upload
                            </button>
                          </div>
                        </>
                      )}
                      {((permissions?.custom_permissions?.can_assign_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin') && (
                        <div className="col-6">
                          <button 
                            className="btn w-100" 
                            disabled={loadingLeads || leads.length === 0}
                            style={{
                              padding: "12px 8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              backgroundColor: loadingLeads || leads.length === 0 ? '#ccc' : '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(108, 117, 125, 0.3)',
                              transition: 'all 0.2s ease',
                              cursor: loadingLeads || leads.length === 0 ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => {
                              setShowBulkInputs(true);
                              setBulkMode('bulkrefer');
                              setInput1Value('');
                              openRefferPanel(null, 'RefferAllLeads');
                            }}
                            onMouseEnter={(e) => {
                              if (!loadingLeads && leads.length > 0) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
                            }}
                          >
                            <i className="fas fa-share-alt" style={{ fontSize: "14px" }}></i>
                            Refer Leads
                          </button>
                        </div>
                      )}
                      {/* Mobile Bulk Input Fields for Bulk Refer */}
                      {showBulkInputs && bulkMode === 'bulkrefer' && (
                        <div className="col-12 mt-2">
                          <div style={{
                            display: "flex",
                            alignItems: "stretch",
                            border: "1px solid #dee2e6",
                            borderRadius: "4px",
                            backgroundColor: "#fff",
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                          }}>
                            <input
                              type="text"
                              placeholder="Input 1"
                              value={input1Value}
                              onChange={(e) => {
                                const maxValue = totalLeads || leads?.length || 0;
                                let inputValue = e.target.value.replace(/[^0-9]/g, '');
                                
                                if (inputValue === '') {
                                  setInput1Value('');
                                  return;
                                }
                                
                                const numValue = parseInt(inputValue, 10);
                                
                                if (numValue < 1 || isNaN(numValue)) {
                                  inputValue = '1';
                                } else if (numValue > maxValue) {
                                  inputValue = maxValue.toString();
                                }
                                
                                setInput1Value(inputValue);
                              }}
                              onKeyDown={(e) => {
                                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Enter') {
                                  e.preventDefault();
                                }
                              }}
                              style={{
                                width: "50%",
                                border: "none",
                                borderRight: "1px solid #dee2e6",
                                outline: "none",
                                padding: "8px 12px",
                                fontSize: "14px",
                                backgroundColor: "transparent",
                                height: "40px",
                                boxSizing: "border-box"
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Input 2"
                              value={totalLeads || leads?.length || 0}
                              readOnly
                              style={{
                                width: "50%",
                                border: "none",
                                outline: "none",
                                padding: "8px 12px",
                                fontSize: "14px",
                                backgroundColor: "transparent",
                                height: "40px",
                                boxSizing: "border-box",
                                cursor: "default"
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="col-12 mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative flex-grow-1">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="🔍 Search leads..."
                              value={filters.search}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleFilterChange('search', val);
                                if (val === '') applyFilters({ search: '' });
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  applyFilters();
                                }
                              }}
                              style={{
                                paddingRight: '35px',
                                paddingLeft: '14px',
                                paddingTop: '12px',
                                paddingBottom: '12px',
                                backgroundColor: '#ffffff',
                                border: '1.5px solid #ced4da',
                                color: '#212529',
                                fontSize: '14px',
                                borderRadius: '8px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            {filters.search && (
                              <button
                                type="button"
                                className="btn btn-sm position-absolute"
                                onClick={() => {
                                  handleFilterChange('search', '');
                                  applyFilters({ search: '' });
                                }}
                                style={{
                                  right: '4px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  padding: '4px 8px',
                                  backgroundColor: '#dc3545',
                                  border: 'none',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
                                }}
                              >
                                <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={applyFilters}
                            disabled={!filters.search}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              minWidth: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
                            }}
                          >
                            <i className="fas fa-search" style={{ fontSize: '16px' }}></i>
                          </button>
                          <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              minWidth: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: showFilters ? '0 2px 8px rgba(0, 123, 255, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s ease',
                              borderWidth: '1.5px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = showFilters ? '0 2px 8px rgba(0, 123, 255, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            <i className="fas fa-filter" style={{ fontSize: '16px' }}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lead = approval summary. Performance = All/Hot/Warm/Cold/Prospect (approved only). Else = CRM pipeline. */}
                  <div className="col-12 mt-1">
                    <div className="d-flex flex-wrap gap-1 align-items-center mt-sm-3 mt-3">
                      {mainTab === 'lead' ? (
                        loadingApprovalSummary ? (
                          <div className="d-flex gap-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="card border-0 shadow-sm" style={{ minWidth: '120px', height: '45px' }}>
                                <div className="card-body d-flex align-items-center justify-content-center py-1">
                                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div
                              className="card border-0 shadow-sm"
                              style={{ minWidth: '120px', height: '45px', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}
                            >
                              <div className="card-body p-1 text-center d-flex align-items-center justify-content-center h-100">
                                <div>
                                  <div className="text-white fw-bold" style={{ fontSize: '11px' }}>Total leads</div>
                                  <small className="text-white" style={{ fontSize: '10px', opacity: 0.95 }}>{approvalSummary.total}</small>
                                </div>
                              </div>
                            </div>
                            <div className="card border-0 shadow-sm" style={{ minWidth: '120px', height: '45px', border: '1px solid #198754' }}>
                              <div className="card-body p-1 text-center d-flex align-items-center justify-content-center h-100">
                                <div>
                                  <div className="fw-bold text-success" style={{ fontSize: '11px' }}>Accepted</div>
                                  <small className="text-muted" style={{ fontSize: '10px' }}>{approvalSummary.accepted}</small>
                                </div>
                              </div>
                            </div>
                            <div className="card border-0 shadow-sm" style={{ minWidth: '120px', height: '45px', border: '1px solid #dc3545' }}>
                              <div className="card-body p-1 text-center d-flex align-items-center justify-content-center h-100">
                                <div>
                                  <div className="fw-bold text-danger" style={{ fontSize: '11px' }}>Rejected</div>
                                  <small className="text-muted" style={{ fontSize: '10px' }}>{approvalSummary.rejected}</small>
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      ) : mainTab === 'performance' ? (
                        loadingPerformanceSummary ? (
                          <div className="d-flex gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="card border-0 shadow-sm" style={{ minWidth: '100px', height: '45px' }}>
                                <div className="card-body d-flex align-items-center justify-content-center py-1">
                                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {[
                              { id: 'all', label: 'All', countKey: 'all', accent: '#0d6efd' },
                              { id: 'hot', label: 'Hot', countKey: 'hot', accent: '#dc3545' },
                              { id: 'warm', label: 'Warm', countKey: 'warm', accent: '#fd7e14' },
                              { id: 'cold', label: 'Cold', countKey: 'cold', accent: '#6c757d' },
                              { id: 'prospect', label: 'Prospect', countKey: 'prospect', accent: '#198754' },
                            ].map(({ id, label, countKey, accent }) => {
                              const count = performanceSummary[countKey] ?? 0;
                              const selected = performanceTab === id;
                              return (
                                <div
                                  key={id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setPerformanceTab(id)}
                                  onKeyDown={(e) => e.key === 'Enter' && setPerformanceTab(id)}
                                  className="card border-0 shadow-sm"
                                  style={{
                                    minWidth: '100px',
                                    height: '45px',
                                    cursor: 'pointer',
                                    border: selected ? `2px solid ${accent}` : '1px solid #dee2e6',
                                    background: selected ? `${accent}14` : '#fff',
                                  }}
                                >
                                  <div className="card-body p-1 text-center d-flex flex-column align-items-center justify-content-center h-100">
                                    <span className="fw-bold" style={{ fontSize: '11px', color: '#212529' }}>{label}</span>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>{count} leads</small>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )
                      ) : loadingStatusCounts ? (
                        <div className="d-flex gap-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="card border-0 shadow-sm" style={{ minWidth: '110px', height: '45px' }}>
                              <div className="card-body d-flex align-items-center justify-content-center">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div
                            className={`card border-0 shadow-sm status-count-card total ${selectedStatusFilter === null ? 'selected' : ''}`}
                            style={{
                              minWidth: '110px',
                              height: '45px',
                              cursor: 'pointer',
                              border: selectedStatusFilter === null ? '2px solid #007bff' : '1px solid transparent'
                            }}
                            onClick={handleTotalCardClick}
                            title="Click to view all leads"
                          >
                            <div className="card-body p-1 text-center d-flex align-items-center justify-content-center">
                              <div className="d-flex align-items-center">
                                <i className="fas fa-chart-line me-1" style={{ color: '#007bff', fontSize: '12px' }}></i>
                                <div>
                                  <h6 className="mb-0 fw-bold" style={{ color: '#ffffff', fontSize: '12px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Total</h6>
                                  <small style={{ color: '#ffffff', fontSize: '10px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{totalLeads} leads</small>
                                </div>
                              </div>
                            </div>
                          </div>

                          {statusCounts.map((status, index) => {
                            const isSelected = selectedStatusFilter === status.statusId;
                            return (
                              <div
                                key={status.statusId || index}
                                className={`card border-0 shadow-sm status-count-card status ${isSelected ? 'selected' : ''}`}
                                style={{
                                  minWidth: '110px',
                                  height: '45px',
                                  cursor: 'pointer',
                                  border: isSelected ? '2px solid #007bff' : '1px solid transparent',
                                  backgroundColor: isSelected ? '#f8f9ff' : 'white'
                                }}
                                onClick={() => handleStatusCardClick(status.statusId)}
                                title={`Click to view ${status.statusName} leads`}
                              >
                                <div className="card-body p-1 text-center d-flex align-items-center justify-content-center">
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-tag me-1" style={{ color: '#28a745', fontSize: '12px' }}></i>
                                    <div>
                                      <h6 className="mb-0 fw-bold" style={{ color: '#212529', fontSize: '11px' }}>{status.statusName}</h6>
                                      <small style={{ color: '#6c757d', fontSize: '9px' }}>{status.count} leads</small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>




          {/* Main Content */}
          <div className="content-body marginTopMobile" style={{
            marginTop: `${navHeight + 5}px`,
            transition: 'margin-top 0.2s ease-in-out'
          }}>
            {mainTab === 'lead' && (
              <section className="mb-3">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="mb-1 fw-bold">Lead Management</h6>
                        <div className="text-muted" style={{ fontSize: '13px' }}>
                          Add Lead → <b>Lead Status</b> (Hot / Warm / Cold / Prospect) is saved with the lead → Approval (Pending). After <b>Accept</b>, use the <b>Performance</b> tab to work leads by the same status.
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button className={`btn btn-sm ${leadTab === 'add' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setLeadTab('add')}>
                          Add Lead
                        </button>
                        <button className={`btn btn-sm ${leadTab === 'approval' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setLeadTab('approval')}>
                          Approval
                          <span className="badge bg-danger ms-2">{approvalSummary.pending ?? 0}</span>
                        </button>
                        <button className={`btn btn-sm ${leadTab === 'report' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setLeadTab('report')}>
                          Lead Report
                        </button>
                      </div>
                    </div>

                    {leadTab === 'add' && (
                      <div className="mt-3">
                        <div className="alert alert-info mb-2" style={{ fontSize: '13px' }}>
                          Use the existing <b>Add Lead</b> flow. Click below to open form.
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAddLeadModal(true)}>
                          <i className="fas fa-plus me-2"></i>
                          Add Lead
                        </button>
                      </div>
                    )}

                    {leadTab === 'approval' && (
                      <div className="mt-3">
                        <div className="btn-group btn-group-sm mb-2 flex-wrap" role="group" aria-label="Approval tabs">
                          <button
                            type="button"
                            className={`btn ${leadApprovalTab === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => setLeadApprovalTab('pending')}
                          >
                            Pending ({approvalSummary.pending ?? 0})
                          </button>
                          <button
                            type="button"
                            className={`btn ${leadApprovalTab === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setLeadApprovalTab('approved')}
                          >
                            Accepted ({approvalSummary.accepted ?? 0})
                          </button>
                          <button
                            type="button"
                            className={`btn ${leadApprovalTab === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setLeadApprovalTab('rejected')}
                          >
                            Rejected ({approvalSummary.rejected ?? 0})
                          </button>
                        </div>

                        <div className="table-responsive">
                          {loadingApprovalList ? (
                            <div className="text-center py-4 text-muted">
                              <div className="spinner-border spinner-border-sm text-primary" role="status" />
                              <span className="ms-2">Loading…</span>
                            </div>
                          ) : (
                            <table className="table table-sm align-middle">
                              <thead>
                                <tr>
                                  <th>Business</th>
                                  <th>Contact</th>
                                  <th>Lead Status</th>
                                  <th>Added by</th>
                                  <th style={{ minWidth: '180px' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {approvalListLeads.map((l) => (
                                  <tr key={l._id}>
                                    <td className="fw-semibold">{l.businessName || '—'}</td>
                                    <td>{l.concernPersonName || '—'}</td>
                                    <td>
                                      <span className="badge bg-secondary text-capitalize">
                                        {l.leadStatus
                                          ? ({ hot: 'Hot', warm: 'Warm', cold: 'Cold', prospect: 'Prospect' }[String(l.leadStatus).toLowerCase()] || l.leadStatus)
                                          : '—'}
                                      </span>
                                    </td>
                                    <td>{l.leadAddedBy?.name || '—'}</td>
                                    <td>
                                      {leadApprovalTab === 'pending' ? (
                                        <div className="d-flex flex-wrap gap-1">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleApprovalDecision(l._id, 'Approved')}
                                          >
                                            Approve
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleApprovalDecision(l._id, 'Rejected')}
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-muted small">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {approvalListLeads.length === 0 && (
                                  <tr>
                                    <td colSpan="5" className="text-center text-muted py-3">
                                      No leads in this bucket yet.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    )}

                    {leadTab === 'report' && (
                      <div className="mt-3">
                        <div className="row g-2">
                          <div className="col-md-4">
                            <div className="card border-0 bg-light h-100">
                              <div className="card-body">
                                <div className="text-muted" style={{ fontSize: '13px' }}>Total Leads (current filters)</div>
                                <div className="fs-4 fw-bold">{totalLeads || (leads?.length || 0)}</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card border-0 bg-light h-100">
                              <div className="card-body">
                                <div className="text-muted" style={{ fontSize: '13px' }}>Pending Approval</div>
                                <div className="fs-4 fw-bold text-warning">{approvalSummary.pending ?? 0}</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card border-0 bg-light h-100">
                              <div className="card-body">
                                <div className="text-muted" style={{ fontSize: '13px' }}>Approved</div>
                                <div className="fs-4 fw-bold text-success">{approvalSummary.accepted ?? 0}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-muted mt-2" style={{ fontSize: '12px' }}>
                          Approval counts sync from the server (copy leads collection).
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {mainTab === 'performance' && (
              <section className="list-view">

              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                <div className="card-body py-3">
                  <h6 className="mb-1 fw-bold">Performance</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                    Approved leads only. Use <b>All, Hot, Warm, Cold, Prospect</b> in the bar above to switch lists (same Lead Status as at add time).
                  </p>
                </div>
              </div>

              {/* Bulk refer bar (shows above lead cards) */}
              {showBulkInputs && bulkMode === 'bulkrefer' && (
                <div className="card border-0 shadow-sm mb-2" style={{ borderRadius: '12px' }}>
                  <div className="card-body py-2">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>
                          <i className="fas fa-layer-group me-1 text-secondary"></i>
                          Bulk Select
                        </span>
                        <div style={{
                          display: "flex",
                          alignItems: "stretch",
                          border: "1px solid #dee2e6",
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          overflow: "hidden",
                          width: "220px",
                          height: "36px"
                        }}>
                          <input
                            type="text"
                            placeholder="Input 1"
                            value={input1Value}
                            onChange={(e) => {
                              const maxValue = totalLeads || leads?.length || 0;
                              let inputValue = e.target.value.replace(/[^0-9]/g, '');
                              if (inputValue === '') {
                                setInput1Value('');
                                return;
                              }
                              const numValue = parseInt(inputValue, 10);
                              if (numValue < 1 || isNaN(numValue)) inputValue = '1';
                              else if (numValue > maxValue) inputValue = maxValue.toString();
                              setInput1Value(inputValue);
                            }}
                            onKeyDown={(e) => {
                              if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            style={{
                              width: "50%",
                              border: "none",
                              borderRight: "1px solid #dee2e6",
                              outline: "none",
                              padding: "6px 10px",
                              fontSize: "12px",
                              backgroundColor: "transparent",
                              height: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Total"
                            value={totalLeads || leads?.length || 0}
                            readOnly
                            style={{
                              width: "50%",
                              border: "none",
                              outline: "none",
                              padding: "6px 10px",
                              fontSize: "12px",
                              backgroundColor: "transparent",
                              height: "100%",
                              boxSizing: "border-box",
                              cursor: "default"
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setInput1Value('');
                            setSelectedProfiles([]);
                          }}
                          title="Clear selection"
                          style={{ height: '36px' }}
                        >
                          Clear
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted" style={{ fontSize: '13px' }}>
                          Selected: <span className="fw-semibold text-primary">{selectedProfiles?.length || 0}</span>
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            if (!selectedProfiles || selectedProfiles.length === 0) {
                              alert('Please type a number in Input 1 to select leads first.');
                              return;
                            }
                            openRefferPanel(null, 'RefferAllLeads');
                          }}
                          style={{ height: '36px', whiteSpace: 'nowrap' }}
                        >
                          <i className="fas fa-share me-1"></i>
                          Refer
                        </button>
                      </div>
                    </div>
                    <small className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                      Tip: this selects the first N leads from your current filters/status and highlights them below.
                    </small>
                  </div>
                </div>
              )}

            {/* followup/documents tabs are rendered below the performance section */}

              {/* Loading State */}
              {loadingLeads ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading B2B leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox text-muted" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  <h5 className="mt-3 text-muted">
                    {selectedStatusFilter ? 'No leads found for selected status' : 'No B2B Leads Found'}
                  </h5>
                  <p className="text-muted">
                    {selectedStatusFilter ? 'Try selecting a different status or add new leads.' : 'Start by adding your first B2B lead using the "Add Lead" button.'}
                  </p>
                </div>
              ) : (
                <div className="row g-2">
                  {leads.map((lead, leadIndex) => (
                    <div key={lead._id || leadIndex} className="col-12">
                      <div className={`lead-card ${(bulkMode === 'bulkrefer' && (selectedProfiles || []).includes(lead._id)) ? 'bulk-selected' : ''}`}>
                        {/* Card Header */}
                        <div className="lead-header">
                          <div className="lead-title-section">
                            <h5 className="lead-business-name">
                              {lead.businessName || 'Business Name Not Available'}
                            </h5>
                            <p className="lead-contact-person">
                              <i className="fas fa-user me-2"></i>
                              {lead.concernPersonName || 'Contact Person Not Available'}
                            </p>

                            {/* Compact Contact Info */}
                            <div className="lead-contact-info">
                              {lead.email && (
                                <div className="lead-contact-item">
                                  <i className="fas fa-envelope"></i>
                                  <span>{lead.email}</span>
                                </div>
                              )}
                              {lead.designation && (
                                <div className="lead-contact-item">
                                  <i className="fas fa-id-badge"></i>
                                  <span>{lead.designation}</span>
                                </div>
                              )}
                              {lead.mobile && (
                                <div className="lead-contact-item">
                                  <i className="fas fa-phone"></i>
                                  <span>{lead.mobile}</span>
                                </div>
                              )}
                              {lead.whatsapp && (
                                <div className="lead-contact-item">
                                  <i className="fab fa-whatsapp"></i>
                                  <span>{lead.whatsapp}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="lead-badges">
                            {!!lead._id && (
                              <button
                                type="button"
                                className="btn btn-sm btn-light border"
                                onClick={() => toggleLeadCardCollapsed(lead._id)}
                                title={collapsedLeadCards.has(lead._id) ? 'Expand card' : 'Collapse card'}
                                style={{ borderRadius: '999px', padding: '4px 8px', marginRight: '6px' }}
                              >
                                <i className={`fas fa-chevron-${collapsedLeadCards.has(lead._id) ? 'down' : 'up'}`}></i>
                              </button>
                            )}
                            {lead.leadCategory?.name && (
                              <span className="lead-badge category">
                                {lead.leadCategory.name}
                              </span>
                            )}
                            {lead.typeOfB2B?.name && (
                              <span className="lead-badge type">
                                {lead.typeOfB2B.name}
                              </span>
                            )}
                            {lead.leadStatus && (
                              <span className="lead-badge" style={{ background: '#6f42c1', color: '#fff' }} title="Lead status at add time">
                                {({ hot: 'Hot', warm: 'Warm', cold: 'Cold', prospect: 'Prospect' }[String(lead.leadStatus).toLowerCase()] || lead.leadStatus)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Content */}
                        {!lead._id || !collapsedLeadCards.has(lead._id) ? (
                        <div className="lead-content">
                          {/* Status Section */}
                          <div className="status-section mb-2">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <i className="fas fa-tag text-primary me-2"></i>
                                <span className="fw-bold text-dark">CRM Status:</span>
                                <span className="ms-2 badge bg-primary">
                                  {lead.status?.title || lead.status?.name || 'No Status'}
                                </span>
                                {lead.subStatus && (
                                  <span className="ms-2 badge bg-secondary">
                                    {(() => {
                                      const substatus = lead.status?.substatuses?.find(sub => sub._id === lead.subStatus);
                                      return substatus?.title || 'No Sub-Status';
                                    })()}
                                  </span>
                                )}
                              </div>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openPanelHome(lead)}
                                title="Open panel"
                              >
                                <i className="fas fa-arrow-right me-1"></i>
                                Open
                              </button>
                            </div>
                          </div>

                          {/* Compact Additional Info */}
                          <div className="compact-info-section">
                            <div className="compact-info-grid">
                              {lead.address && (
                                <div className="compact-info-item">
                                  <i className="fas fa-map-marker-alt text-danger"></i>
                                  <span className="compact-info-label">Address:</span>
                                  <span className="compact-info-value">{lead.address}</span>
                                </div>
                              )}
                              {lead.leadOwner?.name && (
                                <div className="compact-info-item">
                                  <i className="fas fa-user-tie text-warning"></i>
                                  <span className="compact-info-label">Owner:</span>
                                  <span className="compact-info-value">{lead.leadOwner.name}</span>
                                </div>
                              )}
                              {lead.leadAddedBy?.name && (
                                <div className="compact-info-item">
                                  <i className="fas fa-user-plus text-info"></i>
                                  <span className="compact-info-label">Added:</span>
                                  <span className="compact-info-value">{lead.leadAddedBy.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        ) : (
                          <div className="px-3 pb-3 text-muted" style={{ fontSize: '12px' }}>
                            Card collapsed. Click the chevron to expand.
                          </div>
                        )}

                        {/* Card actions removed (use sidebar Actions menu) */}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <nav aria-label="Page navigation" className="mt-2">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-muted">
                    Page {currentPage} of {totalPages} ({leads.length} results)
                  </small>
                </div>

                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo;
                    </button>
                  </li>

                  {currentPage > 3 && (
                    <>
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                      </li>
                      {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                    </>
                  )}

                  {getPaginationPages().map((pageNumber) => (
                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                        {pageNumber}
                      </button>
                    </li>
                  ))}

                  {currentPage < totalPages - 2 && !getPaginationPages().includes(totalPages) && (
                    <>
                      {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
                      </li>
                    </>
                  )}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </section>
            )}

            {mainTab === 'followup' && (
              <section className="mb-3">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <h6 className="mb-0 fw-bold">Followup</h6>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <div className="btn-group btn-group-sm" role="group" aria-label="Followup tabs">
                          <button className={`btn ${followupTab === 'done' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFollowupTab('done')}>Done</button>
                          <button className={`btn ${followupTab === 'planned' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFollowupTab('planned')}>Planned</button>
                          <button className={`btn ${followupTab === 'scheduled' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setFollowupTab('scheduled')}>Scheduled</button>
                          <button className={`btn ${followupTab === 'missed' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFollowupTab('missed')}>Missed</button>
                        </div>
                        {followupTab === 'scheduled' && (
                          <select className="form-select form-select-sm" value={scheduledDays} onChange={(e) => setScheduledDays(e.target.value)} style={{ width: '140px' }}>
                            {['1', '2', '3', '5', '7', '15', '30'].map((d) => (
                              <option key={d} value={d}>{d} day</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="table-responsive mt-3">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th>Business</th>
                            <th>Contact</th>
                            <th>Followup Date</th>
                            <th>Followup Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const bucket =
                              followupTab === 'done' ? followupBuckets.done :
                              followupTab === 'missed' ? followupBuckets.missed :
                              followupTab === 'scheduled' ? followupBuckets.scheduled :
                              followupBuckets.planned;

                            const days = parseInt(scheduledDays, 10);
                            const withinScheduled = followupTab !== 'scheduled'
                              ? bucket
                              : bucket.filter((l) => {
                                const ts = l?.followUp?.scheduledDate ? new Date(l.followUp.scheduledDate).getTime() : NaN;
                                if (!Number.isFinite(ts)) return false;
                                const diffDays = (ts - Date.now()) / (1000 * 60 * 60 * 24);
                                return diffDays >= 0 && diffDays <= (Number.isFinite(days) ? days : 1);
                              });

                            if (withinScheduled.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="4" className="text-center text-muted py-3">No followups found.</td>
                                </tr>
                              );
                            }

                            return withinScheduled.map((l) => (
                              <tr key={l._id}>
                                <td className="fw-semibold">{l.businessName || '—'}</td>
                                <td>{l.concernPersonName || '—'}</td>
                                <td>{l.followUp?.scheduledDate ? new Date(l.followUp.scheduledDate).toLocaleString() : '—'}</td>
                                <td>{l.followUp?.status || 'Pending'}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {mainTab === 'documents' && (
              <section className="mb-3">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <h6 className="mb-0 fw-bold">Documents</h6>
                      <div className="text-muted" style={{ fontSize: '12px' }}>
                        Mandatory docs / Submitted docs counts + approval actions (UI)
                      </div>
                    </div>

                    <div className="row g-2 mt-2">
                      <div className="col-md-6">
                        <div className="card border-0 bg-light h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="text-muted" style={{ fontSize: '13px' }}>Mandatory Docs</div>
                                <div className="fs-4 fw-bold">0</div>
                              </div>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-warning" disabled>Pending</button>
                                <button className="btn btn-sm btn-outline-success" disabled>Approve</button>
                              </div>
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: '12px' }}>
                              Hook this to your backend doc schema when available.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-0 bg-light h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="text-muted" style={{ fontSize: '13px' }}>Submitted Docs</div>
                                <div className="fs-4 fw-bold">0</div>
                              </div>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-warning" disabled>Pending</button>
                                <button className="btn btn-sm btn-outline-success" disabled>Approve</button>
                              </div>
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: '12px' }}>
                              You can re-use existing upload modal once docs fields are finalized.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

        </div >

        {/* Right Sidebar for Desktop - Panels */}
        {
          !isMobile && showPanel && (
            <div className="col-4" style={{
              position: 'fixed',
              top: '130px',
              right: '0',
              width: '350px',
              maxHeight: 'calc(100vh - 135px)',
              overflowY: 'auto',
              backgroundColor: 'white',
              zIndex: 1000,
              boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
              transform: showPanel ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease',
              borderRadius: '8px 0 0 8px'
            }}>

              {renderStatusChangePanel()}
              {renderFollowupPanel()}
              {renderRefferPanel()}
              {renderLeadHistoryPanel()}
              {renderPanelHome()}

            </div>
          )
        }

        {/* Mobile Modals */}
        {isMobile && renderStatusChangePanel()}
        {isMobile && renderFollowupPanel()}
        {isMobile && renderRefferPanel()}
        {isMobile && renderLeadHistoryPanel()}
        {isMobile && renderPanelHome()}

      </div >

      {/* Filter Modal */}
      {showFilters && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1060,
            // Ensure modal overlay can scroll on smaller screens
            overflowY: 'auto',
            maxHeight: '100vh'
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" style={{ maxHeight: '90vh' }}>
            <div className="modal-content border-0 shadow" style={{ maxHeight: '90vh' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-filter me-2"></i>
                  Filter Leads
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowFilters(false)}
                ></button>
              </div>
              <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-tag text-success me-2"></i>
                      Lead Category
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.leadCategory}
                      onChange={(e) => handleFilterChange('leadCategory', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Categories</option>
                      {leadCategoryOptions && leadCategoryOptions.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-building text-info me-2"></i>
                      Type of B2B
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.typeOfB2B}
                      onChange={(e) => handleFilterChange('typeOfB2B', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Types</option>
                      {typeOfB2BOptions && typeOfB2BOptions.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-user text-warning me-2"></i>
                      Lead Owner
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.leadOwner}
                      onChange={(e) => handleFilterChange('leadOwner', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Owners</option>
                      {users && users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 bg-light"
                      value={filters.dateRange.start || ''}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      End Date
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 bg-light"
                      value={filters.dateRange.end || ''}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      Status
                    </label>
                    <select
                      className="form-select border-0 bg-light"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="">All Statuses</option>
                      {statuses.map(status => (
                        <option key={status._id} value={status._id}>
                          {status.name}
                        </option>
                      ))}
                    </select>

                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark mb-2">
                      <i className="fas fa-calendar text-danger me-2"></i>
                      Sub Status
                    </label>
                    <select
                      className="form-select border-0  bgcolor"
                      name="subStatus"
                      id="subStatus"
                      value={filters.subStatus}
                      style={{
                        height: '42px',
                        paddingTop: '8px',
                        backgroundColor: '#f1f2f6',
                        paddingInline: '10px',
                        width: '100%'
                      }}
                      onChange={(e) => handleFilterChange('subStatus', e.target.value)}

                    >
                      <option value="">Select Sub-Status</option>
                      {subStatuses.map((filter, index) => (
                        <option value={filter._id}>{filter.title}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFilters(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={clearFilters}
                >
                  <i className="fas fa-eraser me-1"></i>
                  Clear All
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    applyFilters();
                    setShowFilters(false);
                  }}
                >
                  <i className="fas fa-check me-1"></i>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Add modal Start*/}
      {
        showAddLeadModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060, maxHeight: '100vh', overflowY: 'auto' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Modal Header */}
                <div className="modal-header" style={{ backgroundColor: '#fc2b5a', color: 'white' }}>
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="fas fa-user-plus me-2"></i>
                    Add New B2B Lead
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleCloseLeadModal}
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body p-4 " style={{ maxHeight: '100vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    {/* Lead Category */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-tag text-primary me-1"></i>
                        Lead Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.leadCategory ? 'is-invalid' : ''}`}
                        name="leadCategory"
                        value={leadFormData.leadCategory}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Select Lead Category</option>
                        {leadCategoryOptions.filter(category => category).map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.leadCategory && (
                        <div className="invalid-feedback">
                          {formErrors.leadCategory}
                        </div>
                      )}
                    </div>

                    {/* Type of B2B */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-building text-primary me-1"></i>
                        Type of B2B <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.typeOfB2B ? 'is-invalid' : ''}`}
                        name="typeOfB2B"
                        value={leadFormData.typeOfB2B}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Select B2B Type</option>
                        {typeOfB2BOptions.filter(type => type).map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.typeOfB2B && (
                        <div className="invalid-feedback">
                          {formErrors.typeOfB2B}
                        </div>
                      )}
                    </div>

                    {/* Business Name */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-briefcase text-primary me-1"></i>
                        Business Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        ref={businessNameInputRef}
                        className={`form-control ${formErrors.businessName ? 'is-invalid' : ''}`}
                        name="businessName"
                        value={leadFormData.businessName}
                        onChange={handleLeadInputChange}
                        placeholder="Enter business/company name"
                      />

                      {formErrors.businessName && (
                        <div className="invalid-feedback">
                          {formErrors.businessName}
                        </div>
                      )}
                    </div>

                    {/* Business Address with Google Maps */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map-marker-alt text-primary me-1"></i>
                        Business Address
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.businessAddress ? 'is-invalid' : ''}`}
                        name="address"
                        value={leadFormData.address}
                        onChange={handleLeadInputChange}
                        placeholder="Enter business address"
                      />

                      {formErrors.businessAddress && (
                        <div className="invalid-feedback d-block">
                          {formErrors.businessAddress}
                        </div>
                      )}
                    </div>

                    {/* Manual Location Fields */}
                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        <i className="fas fa-city text-primary me-1"></i>
                        City
                      </label>
                      <input
                        ref={cityInputRef}
                        type="text"
                        className="form-control"
                        name="city"
                        value={leadFormData.city}
                        onChange={handleLeadInputChange}
                        placeholder="Start typing city name..."
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map text-primary me-1"></i>
                        State
                      </label>
                      <input
                        ref={stateInputRef}
                        type="text"
                        className="form-control"
                        name="state"
                        value={leadFormData.state}
                        onChange={handleLeadInputChange}
                        placeholder="Start typing state name..."
                      />
                    </div>



                    {/* Concern Person Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-user text-primary me-1"></i>
                        Concern Person Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.concernPersonName ? 'is-invalid' : ''}`}
                        name="concernPersonName"
                        value={leadFormData.concernPersonName}
                        onChange={handleLeadInputChange}
                        placeholder="Enter contact person name"
                      />
                      {formErrors.concernPersonName && (
                        <div className="invalid-feedback">
                          {formErrors.concernPersonName}
                        </div>
                      )}
                    </div>

                    {/* Designation */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-id-badge text-primary me-1"></i>
                        Designation
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="designation"
                        value={leadFormData.designation}
                        onChange={handleLeadInputChange}
                        placeholder="e.g., HR Manager, CEO, Director"
                      />
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-envelope text-primary me-1"></i>
                        Email
                      </label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        name="email"
                        value={leadFormData.email}
                        onChange={handleLeadInputChange}
                        placeholder="Enter email address"
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback">
                          {formErrors.email}
                        </div>
                      )}
                    </div>

                    {/* Mobile */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-phone text-primary me-1"></i>
                        Mobile <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.mobile ? 'is-invalid' : ''}`}
                        name="mobile"
                        value={leadFormData.mobile}
                        onChange={handleLeadMobileChange}
                        placeholder="Enter mobile number"
                      />
                      {formErrors.mobile && (
                        <div className="invalid-feedback">
                          {formErrors.mobile}
                        </div>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fab fa-whatsapp text-success me-1"></i>
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.whatsapp ? 'is-invalid' : ''}`}
                        name="whatsapp"
                        value={leadFormData.whatsapp}
                        onChange={handleLeadMobileChange}
                        placeholder="WhatsApp number"
                      />
                      {formErrors.whatsapp && (
                        <div className="invalid-feedback">
                          {formErrors.whatsapp}
                        </div>
                      )}
                    </div>

                    {/* Landline Number */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-phone text-primary me-1"></i>
                        Landline Number
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.landlineNumber ? 'is-invalid' : ''}`}
                        name="landlineNumber"
                        value={leadFormData.landlineNumber}
                        onChange={handleLeadMobileChange}
                        placeholder="Landline number"
                      />
                      {formErrors.landlineNumber && (
                        <div className="invalid-feedback">
                          {formErrors.landlineNumber}
                        </div>
                      )}
                    </div>

                    {/* Lead Owner */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-user-tie text-primary me-1"></i>
                        Lead Owner
                      </label>
                      <select
                        className="form-select"
                        name="leadOwner"
                        value={userData?._id || leadFormData.leadOwner || ''}
                        onChange={handleLeadInputChange}
                        disabled
                      >
                        <option value={userData?._id || ''}>
                          {userData?.name || 'Loading...'}
                        </option>
                      </select>
                    </div>

                    {/* Lead Status (as in LRP) */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-thermometer-half text-primary me-1"></i>
                        Lead Status <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.leadStatus ? 'is-invalid' : ''}`}
                        name="leadStatus"
                        value={leadFormData.leadStatus}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Choose</option>
                        {[
                          { v: 'hot', label: 'Hot' },
                          { v: 'warm', label: 'Warm' },
                          { v: 'cold', label: 'Cold' },
                          { v: 'prospect', label: 'Prospect' },
                        ].map(({ v, label }) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>
                      {formErrors.leadStatus && (
                        <div className="invalid-feedback">
                          {formErrors.leadStatus}
                        </div>
                      )}
                    </div>

                    {/* Lock duration: only 60 days option */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-lock text-primary me-1"></i>
                        Lock my Lead <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.lockLeadDays ? 'is-invalid' : ''}`}
                        name="lockLeadDays"
                        value={leadFormData.lockLeadDays}
                        onChange={handleLeadInputChange}
                      >
                        <option value="60">60 days</option>
                      </select>
                      {formErrors.lockLeadDays && (
                        <div className="invalid-feedback">
                          {formErrors.lockLeadDays}
                        </div>
                      )}
                      {leadFormData.lockLeadDays === '60' && (
                        <div className="text-muted mt-1" style={{ fontSize: '12px' }}>
                          This will auto-assign Lead Owner to you for 60 days.
                        </div>
                      )}
                    </div>

                    {/* Remark */}
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        <i className="fas fa-comment text-primary me-1"></i>
                        Remark
                      </label>
                      <textarea
                        className="form-control"
                        name="remark"
                        value={leadFormData.remark}
                        onChange={handleLeadInputChange}
                        placeholder="Enter remark"
                      />
                    </div>




                  </div>

                  {/* Form Actions */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-4"
                          onClick={handleCloseLeadModal}
                        >
                          <i className="fas fa-times me-1"></i>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn px-4"
                          style={{ backgroundColor: '#fc2b5a', color: 'white' }}
                          onClick={handleLeadSubmit}
                        >
                          <i className="fas fa-save me-1"></i>
                          Submit for Approval
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              {/* Modal Header */}
              <div className="modal-header" style={{ backgroundColor: '#28a745', color: 'white' }}>
                <h5 className="modal-title d-flex align-items-center">
                  <i className="fas fa-file-upload me-2"></i>
                  Bulk Upload B2B Leads
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseBulkUploadModal}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {/* Instructions */}
                <div className="alert alert-info mb-4">
                  <h6 className="fw-bold mb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    Instructions:
                  </h6>
                  <ul className="mb-0 small">
                    <li>Upload CSV or Excel file (.xlsx, .xls, .csv)</li>
                    <li>Maximum file size: 10MB</li>
                    <li><strong>Required fields:</strong> Business Name, Concern Person Name, Mobile, Lead Category, Type of B2B</li>
                   
                  </ul>
                </div>

                {/* File Upload Section */}
                <div className="mb-4">
                  <label className="form-label fw-bold mb-3">
                    <i className="fas fa-file-excel text-success me-2"></i>
                    Select File <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="file"
                      id="bulkUploadFile"
                      ref={bulkUploadFileInputRef}
                      className="form-control"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBulkFileChange}
                      disabled={bulkUploadLoading}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => bulkUploadFileInputRef.current?.click()}
                      disabled={bulkUploadLoading}
                    >
                      <i className="fas fa-folder-open me-1"></i>
                      Browse
                    </button>
                  </div>
                  {bulkUploadFile && (
                    <div className="mt-2">
                      <small className="text-success">
                        <i className="fas fa-check-circle me-1"></i>
                        Selected: {bulkUploadFile.name} ({(bulkUploadFile.size / 1024).toFixed(2)} KB)
                      </small>
                    </div>
                  )}
                </div>

                {/* Sample File Download */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      // Create sample CSV content with proper format
                      // Note: Lead Category and Type of B2B names should match system values
                      const sampleCSV = `Business Name,Concern Person Name,Mobile,Email,Lead Category,Type of B2B,Address,City,State,Designation,WhatsApp,Landline Number,Lead Owner,Remark
ABC Company,John Doe,9876543210,john@abc.com,Corporate,Partner,123 Main Street,Mumbai,Maharashtra,Manager,9876543210,0221234567,Owner Name,Sample remark
XYZ Corp,Jane Smith,9876543211,jane@xyz.com,Individual,Client,456 Park Avenue,Delhi,Delhi,Director,9876543211,0111234567,Owner Name,Another remark
Tech Solutions,Raj Kumar,9876543212,raj@tech.com,Corporate,Partner,789 Tech Park,Bangalore,Karnataka,CEO,9876543212,0801234567,Owner Name,Technology company`;
                      
                      const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', 'b2b_leads_sample.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    <i className="fas fa-download me-1"></i>
                    Download Sample CSV
                  </button>
                </div>

                {/* Message Display */}
                {bulkUploadMessage && (
                  <div className={`alert ${bulkUploadSuccess ? 'alert-success' : 'alert-danger'} mb-3`}>
                    <i className={`fas ${bulkUploadSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                    {bulkUploadMessage}
                  </div>
                )}

                {/* Error Details */}
                {bulkUploadErrors.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold text-danger mb-2">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Error Details:
                    </h6>
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                      <ul className="mb-0 small">
                        {bulkUploadErrors.map((error, index) => (
                          <li key={index} className="text-danger">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={handleCloseBulkUploadModal}
                    disabled={bulkUploadLoading}
                  >
                    <i className="fas fa-times me-1"></i>
                    {bulkUploadSuccess ? 'Close' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-success px-4"
                    onClick={handleBulkUpload}
                    disabled={!bulkUploadFile || bulkUploadLoading}
                  >
                    {bulkUploadLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload me-1"></i>
                        Upload Leads
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inject Google Maps styles */}
      <style>{mapStyles}</style>
      <style>{`
  .modal .pac-container {
    z-index: 99999 !important;
    position: fixed !important;
  }
  
  .modal .pac-item {
    cursor: pointer;
    padding: 8px 12px;
    border-bottom: 1px solid #e9ecef;
  }
  
  .modal .pac-item:hover {
    background-color: #f8f9fa;
  }
  
  .modal .pac-item-selected {
    background-color: #007bff;
    color: white;
  }

  /* Modern Lead Card Styles */
  .lead-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 0.5rem;
  }

  .lead-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  /* Bulk selection highlight */
  .lead-card.bulk-selected {
    outline: 2px solid #0d6efd;
    box-shadow: 0 8px 25px rgba(13, 110, 253, 0.25);
  }

  /* Header Section */
  .lead-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }

  .lead-header::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(30px, -30px);
  }

  .lead-title-section {
    position: relative;
    z-index: 2;
  }

  .lead-business-name {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    color: white;
    line-height: 1.2;
  }

  .lead-contact-person {
    font-size: 0.85rem;
    margin: 0 0 0.5rem 0;
    opacity: 0.9;
    display: flex;
    align-items: center;
  }

  .lead-contact-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .lead-contact-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    opacity: 0.9;
    max-width: 200px;
  }

  .lead-contact-item i {
    font-size: 0.65rem;
    width: 10px;
    flex-shrink: 0;
  }

  .lead-contact-item span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Compact Additional Info Section */
  .compact-info-section {
    margin-top: 0.5rem;
  }

  .compact-info-grid {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .compact-info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0;
  }

  .compact-info-item i {
    font-size: 0.7rem;
    width: 12px;
    flex-shrink: 0;
  }

  .compact-info-label {
    font-weight: 600;
    color: #6c757d;
    min-width: 50px;
    flex-shrink: 0;
  }

  .compact-info-value {
    color: #212529;
    flex: 1;
    word-break: break-word;
  }

  .lead-badges {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;
    z-index: 2;
  }

  .lead-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .lead-badge.category {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    backdrop-filter: blur(10px);
  }

  .lead-badge.type {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    backdrop-filter: blur(10px);
  }

  /* Content Section */
  .lead-content {
    padding: 0.75rem;
  }

  .contact-grid {
    display: none; /* Hide the large contact grid since we're moving info to header */
  }

  .contact-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .contact-item:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }

  .contact-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .contact-icon:not(.phone):not(.whatsapp):not(.address):not(.owner) {
    background: linear-gradient(135deg, #6c757d, #495057);
  }

  .contact-icon.phone {
    background: linear-gradient(135deg, #28a745, #20c997);
  }

  .contact-icon.whatsapp {
    background: linear-gradient(135deg, #25d366, #128c7e);
  }

  .contact-icon.address {
    background: linear-gradient(135deg, #dc3545, #c82333);
  }

  .contact-icon.owner {
    background: linear-gradient(135deg, #ffc107, #e0a800);
  }

  .contact-icon.added-by {
    background: linear-gradient(135deg, #6f42c1, #5a32a3);
  }

  .contact-details {
    flex: 1;
    min-width: 0;
  }

  .contact-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.1rem;
  }

  .contact-value {
    display: block;
    font-size: 0.9rem;
    color: #212529;
    font-weight: 500;
    word-break: break-word;
  }

  .contact-link {
    color: #007bff;
    text-decoration: none;
    font-weight: 600;
  }

  .contact-link:hover {
    color: #0056b3;
    text-decoration: underline;
  }

  .address-text {
    line-height: 1.4;
  }

  .address-section,
  .owner-section {
    margin-top: 1rem;
  }

  /* Action Buttons */
  .lead-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
  }

  .action-group {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    color: white;
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .action-btn.view {
    background: linear-gradient(135deg, #007bff, #0056b3);
  }

  .action-btn.refer {
    background: linear-gradient(135deg, #6c757d, #495057);
  }

  .action-btn.history {
    background: linear-gradient(135deg, #17a2b8, #138496);
  }

  .action-btn.status {
    background: linear-gradient(135deg, #ffc107, #e0a800);
    padding: 0.5rem;
    min-width: 40px;
  }

  .action-btn.followup {
    background: linear-gradient(135deg, #28a745, #20c997);
    padding: 0.5rem;
    min-width: 40px;
  }

  .action-btn span {
    display: inline-block;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .contact-grid {
      grid-template-columns: 1fr;
    }
    
    .lead-actions {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
    }
    
    .action-group {
      width: 100%;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .action-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      min-height: 44px;
    }
    
    .action-btn span {
      font-size: 0.85rem;
    }
    
    .lead-badges {
      position: static;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    
    .lead-header {
      padding: 1rem 0.75rem;
    }
    
    .lead-business-name {
      font-size: 1rem;
    }
    
    .lead-contact-person {
      font-size: 0.8rem;
    }
    
    .lead-contact-info {
    display:flex;
    flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .lead-contact-item {
      display:flex;
      align-item:center;
      gap: 0.25rem;
      font-size:0.7rem;
      opacity: 0.9;
      max-width: 262px;
    }
    
    .lead-content {
      padding: 0.75rem 0.5rem;
    }
    
    .status-section {
      padding: 10px;
    }
    
    .status-section .badge {
      font-size: 0.7rem;
      padding: 3px 6px;
    }
    
    .status-section .btn {
      font-size: 0.7rem;
      padding: 4px 10px;
    }
    
    .compact-info-item {
      font-size: 0.7rem;
      padding: 0.3rem 0;
    }
    
    .status-count-card {
      min-width: 100px;
      height: 50px;
    }
    
    .status-count-card .card-body {
      padding: 0.4rem;
    }
    
    .status-count-card h6 {
      font-size: 0.75rem;
    }
    
    .status-count-card small {
      font-size: 0.65rem;
    }
  }

  /* Status Count Cards Styles */
  .status-count-card {
    transition: all 0.3s ease;
    border-radius: 12px;
    overflow: hidden;
  }

  .status-count-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .status-count-card .card-body {
    padding: 0.5rem;
  }

  .status-count-card h4 {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .status-count-card h6 {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-count-card small {
    font-size: 0.75rem;
  }

  /* Status-specific colors */
  .status-count-card.total {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .status-count-card.total h4,
  .status-count-card.total h6,
  .status-count-card.total small {
    color: white;
  }

  .status-count-card.status {
    background: white;
    border: 1px solid #e9ecef;
  }

  .status-count-card.status:hover {
    border-color: #007bff;
  }

  .status-count-card.selected {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
    border: 2px solid #007bff !important;
    background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
  }

  .status-count-card.selected.total {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  }

  /* Status Section Styles */
  .status-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #e9ecef;
  }

  .status-section .badge {
    font-size: 0.75rem;
    padding: 4px 8px;
  }

  .status-section .btn {
    font-size: 0.75rem;
    padding: 4px 12px;
  }

  /* Filter Panel Styles */
  .filter-panel {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
  }

  .filter-panel:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .filter-panel .form-control,
  .filter-panel .form-select {
    transition: all 0.2s ease;
    border-radius: 8px;
  }

  .filter-panel .form-control:focus,
  .filter-panel .form-select:focus {
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    border-color: #007bff;
  }

  .filter-panel .btn {
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .filter-panel .btn:hover {
    transform: translateY(-1px);
  }

  /* Global Text Visibility Improvements */
  .form-control, .form-select {
    color: #212529 !important;
    background-color: #ffffff !important;
    border: 1px solid #ced4da !important;
  }

  .form-control:focus, .form-select:focus {
    color: #212529 !important;
    background-color: #ffffff !important;
    border-color: #007bff !important;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
  }

  .btn {
    font-weight: 500 !important;
  }

  .text-dark {
    color: #212529 !important;
  }

  .text-muted {
    color: #6c757d !important;
  }

  .text-primary {
    color: #007bff !important;
  }

  .text-success {
    color: #28a745 !important;
  }

  .text-warning {
    color: #ffc107 !important;
  }

  .text-danger {
    color: #dc3545 !important;
  }

  .text-info {
    color: #17a2b8 !important;
  }

  /* Override card margin-bottom to reduce spacing */
  .card {
    margin-bottom: 0.5rem !important;
  }
`}</style>
<style>
{`
@media (max-width:992px){
.react-calendar {
  transform: translateY(-200px) !important;
}
}
/* ===== Small Date Input ===== */
.small-date {
  font-size: 14px;
  height: 32px;
  padding: 4px 8px;
  white-space: nowrap;
}

/* ===== React Date Picker (react-date-picker) ===== */
.react-date-picker {
  height: 32px;
  box-sizing:content-box;
}

.react-date-picker__wrapper {
  height: 100%;
  border: none !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
}

.react-date-picker__inputGroup {
  height: 100%;
  font-size: 15px;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.react-date-picker__button {
  padding: 0;
  margin: 0;
}

.react-date-picker__calendar-button {
  padding: 0 4px;
}

/* Hide clear button if needed */
/* .react-date-picker__clear-button {
  display: none;
} */

/* ===== React Datepicker (react-datepicker) ===== */
.react-datepicker-wrapper,
.react-datepicker__input-container,
.react-datepicker__input-container input {
  width: 100%;
}
  .react-date-picker__inputGroup {
  min-width: unset !important;   /* removes calc width */
  flex-grow: 1;
  padding: 0 2px;
  box-sizing: border-box;
}
  

/* ===== Lead Buttons ===== */
.LeadButtons {
  width: 100%;
  white-space: nowrap;
}

.search-wrapper {
  position: relative;
  width: 100%;
}

.SerachClear {
  position: absolute;   /* IMPORTANT */
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  background-color: #dc3545;
  border: none;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
  cursor: pointer;
}
.google-btn{
    white-space: nowrap;
    width: 90px !important;
    overflow: hidden;
}
/* Tablet */
@media (max-width: 768px) {

  .SerachClear {
            width: 22px !important;
        height: 22px !important;
        right: 10px !important;
        top: 15px !important;
  }
}
}
`}
</style>
    </div >
  );
};

export default B2BSales;
