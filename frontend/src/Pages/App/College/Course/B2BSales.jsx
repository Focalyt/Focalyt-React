import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';
import { GoogleLogin } from 'react-google-login'

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'

import CandidateProfile from '../CandidateProfile/CandidateProfile';
// import GoogleMapsLocationPicker from './GoogleMapsLocationPicker';

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
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const [openModalId, setOpenModalId] = useState(null);

  // const [activeTab, setActiveTab] = useState(0);
  const [activeTab, setActiveTab] = useState({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(null);
  const [activeCrmFilter, setActiveCrmFilter] = useState(0);

  const [mainContentClass, setMainContentClass] = useState('col-12');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [counselors, setCounselors] = useState([]);

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


  const responseGoogle = (response) => {
    console.log(response);
  }


  const initializeBusinessNameAutocomplete = () => {
    console.log('Initializing business name autocomplete...');

    // Check if Google Maps is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.log('Google Maps not available yet');
      return;
    }

    // Get input element using ref
    const input = businessNameInputRef.current;
    if (!input) {
      console.log('Business name input not found');
      return;
    }

    console.log('Business name input found, initializing autocomplete...');

    // Remove any existing autocomplete to prevent duplicates
    if (input.autocomplete) {
      window.google.maps.event.clearInstanceListeners(input);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      componentRestrictions: { country: 'in' },
    });

    autocomplete.addListener('place_changed', () => {
      console.log('Place selected from autocomplete');
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
    console.log('Business name autocomplete initialized successfully');
  };

  // Fetch filter options from backend API on mount

  useEffect(() => {
    fetchB2BDropdownOptions();
    fetchUsers(); // Fetch users for Lead Owner dropdown
  }, []);

  // Test Google Maps API availability on component mount
  useEffect(() => {
    console.log('B2BSales component mounted');
    console.log('Google Maps API available:', !!(window.google && window.google.maps && window.google.maps.places));
  }, []);

  // Initialize autocomplete when modal is opened
  useEffect(() => {
    if (showAddLeadModal) {
      console.log('Modal opened, initializing autocomplete...');
      // Small delay to ensure modal is fully rendered and Google Maps is loaded
      const timer = setTimeout(() => {
        initializeBusinessNameAutocomplete();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [showAddLeadModal]);

  // Fetch B2B dropdown options
  const fetchB2BDropdownOptions = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

      // Fetch Lead Categories
      const leadCategoriesRes = await axios.get(`${backendUrl}/college/b2b/lead-categories`, {
        headers: { 'x-auth': token }
      });
      if (leadCategoriesRes.data.status) {
        setLeadCategoryOptions(leadCategoriesRes.data.data.map(cat => ({
          value: cat._id,
          label: cat.name
        })));
      }

      // Fetch Type of B2B
      const typeOfB2BRes = await axios.get(`${backendUrl}/college/b2b/type-of-b2b`, {
        headers: { 'x-auth': token }
      });
      if (typeOfB2BRes.data.status) {
        setTypeOfB2BOptions(typeOfB2BRes.data.data.map(type => ({
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

      const response = await axios.get(`${backendUrl}/college/users`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        console.log('response.data.data.users', response.data.data)
        // Update users state with detailed access summary
        setUsers(response.data.data.users.map(user => ({
          _id: user._id,
          name: user.name,

        })));
      } else {
        console.error('Failed to fetch users:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);



  const handleCheckboxChange = (lead, checked) => {
    if (checked) {
      setSelectedProfiles(prev => [...prev, lead._id]);
    } else {
      setSelectedProfiles(prev => prev.filter(id => id !== lead._id));
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Mobile/WhatsApp number validation function
  const validateMobileNumber = (number) => {
    // Remove all non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/;
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

    console.log(name, value, 'name, value')
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

    // Email validation
    if (!leadFormData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(leadFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    if (!leadFormData.mobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!validateMobileNumber(leadFormData.mobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // WhatsApp validation (optional but validate if provided)
    if (leadFormData.whatsapp && !validateMobileNumber(leadFormData.whatsapp)) {
      errors.whatsapp = 'Please enter a valid 10-digit WhatsApp number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add state for leads data
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const response = await axios.get(`${backendUrl}/college/b2b/leads`, {
        headers: { 'x-auth': token }
      });

      console.log('Leads response:', response.data.data);

      if (response.data.status) {
        setLeads(response.data.data.leads || []);
      } else {
        console.error('Failed to fetch leads:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    console.log('leads', leads)
  }, [leads])

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
        concernPersonName: leadFormData.concernPersonName,
        designation: leadFormData.designation,
        email: leadFormData.email,
        mobile: leadFormData.mobile,
        whatsapp: leadFormData.whatsapp,
        leadOwner: leadFormData.leadOwner,
        remark: leadFormData.remark
      };
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

      console.log('Submitting lead data:', leadData);

      // Send data to backend API
      const response = await axios.post(`${backendUrl}/college/b2b/add-lead`, leadData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.status) {
        // Show success message
        alert('Lead added successfully!');

        // Refresh the leads list
        fetchLeads();

        // Reset form
        setLeadFormData({
          leadCategory: '',
          typeOfB2B: '',
          businessName: '',
          businessAddress: '',
          concernPersonName: '',
          designation: '',
          email: '',
          mobile: '',
          whatsapp: '',
          leadOwner: ''
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
      designation: '',
      email: '',
      mobile: '',
      whatsapp: '',
      leadOwner: ''
    });
    setFormErrors({});
    setExtractedNumbers([]);
    setSelectedLocation(null);
    setShowMap(false);
  };

  // Open lead modal and initialize autocomplete
  const handleOpenLeadModal = () => {
    console.log('handleOpenLeadModal')
    setShowAddLeadModal(true);
  };


  const openUploadModal = (document) => {
    setSelectedDocumentForUpload(document);
    // setShowUploadModal(true);
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
    if (seletectedStatus) {
      fetchSubStatus()
    }
  }, [seletectedStatus]);


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
      const response = await axios.get(`${backendUrl}/college/statusB2b`, {
        headers: { 'x-auth': token }
      });

      console.log('response', response)

      if (response.data.success) {
        const status = response.data.data;
        const allFilter = { _id: 'all', name: 'All' };


        setCrmFilters([allFilter, ...status.map(r => ({
          _id: r._id,
          name: r.title,
          milestone: r.milestone,  // agar backend me count nahi hai to 0
        }))]);

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
      const response = await axios.get(`${backendUrl}/college/statusB2b/${seletectedStatus}/substatus`, {
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









  const openEditPanel = async (profile = null, panel) => {
    console.log('panel', panel);
    setSelectedProfile(null)
    setShowPanel('')
    setSelectedStatus(null)
    setSelectedSubStatus(null)


    if (profile) {
      setSelectedProfile(profile);
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


  const closePanel = () => {
    setShowPanel('');
    setShowPopup(null);
    setSelectedConcernPerson(null);
    setSelectedProfiles(null);
    setSelectedProfile(null);
    setSelectedStatus(null)
    setSelectedSubStatus(null)
    if (!isMobile) {
      setMainContentClass('col-12');
    }
  };



  const openRefferPanel = async (profile = null, panel) => {
    console.log('panel', panel);

    if (profile) {
      setSelectedProfile(profile);


    }

    setShowPopup(null)

    if (panel === 'RefferAllLeads') {

      setShowPanel('RefferAllLeads');

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


    const fetchConcernPersons = async () => {
      const response = await axios.get(`${backendUrl}/college/refer-leads`, {
        headers: {
          'x-auth': token,
        },
      });
      console.log(userData, 'userData');
      let concernPersons = [];
      await response.data.concernPerson.map(person => {
        if (person._id._id.toString() !== userData._id.toString()) {
          concernPersons.push(person);
        }
      });
      setConcernPersons(concernPersons);
    }
    fetchConcernPersons();
  };


  const handleConcernPersonChange = (e) => {
    console.log(e.target.value, 'e.target.value');
    setSelectedConcernPerson(e.target.value);
  }

  const handleReferLead = async () => {
    console.log(selectedConcernPerson, 'selectedConcernPerson');
    try {
      const response = await axios.post(`${backendUrl}/college/refer-leads`, {
        counselorId: selectedConcernPerson,
        appliedCourseId: selectedProfile._id
      }, {
        headers: {
          'x-auth': token,
        },
      });

      if (response.data.status) {
        const message = alert('Lead referred successfully!');
        if (message) {


        }
      } else {
        alert(response.data.message || 'Failed to refer lead');
      }
      closePanel();



    } catch (error) {
      console.error('Error referring lead:', error);
      alert('Failed to refer lead');
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
    setSelectedProfiles(null);
    if (!isMobile) {
      setMainContentClass('col-8');
    }
  };

  useEffect(() => {
    console.log('selectedProfile', selectedProfile);
  }, [selectedProfile]);

  const openProfileEditPanel = async (profile = null) => {
    if (profile) {
      // Set selected profile
      setSelectedProfile(profile);

    }

    setShowPopup(null);
    setShowPanel('ProfileEdit');
    setSelectedConcernPerson(null);
    setSelectedProfiles(null);
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
              {(showPanel === 'editPanel' || showPanel === 'followUp') && `${showPanel === 'editPanel' ? 'Edit Status for ' : 'Set Followup for '}${selectedProfile?._candidate?.name || ''}`}


              {(showPanel === 'bulkstatuschange') && 'Bulk Status Change'}

            </h6>
          </div>
          <div>
            <button className="btn-close" type="button" onClick={closePanel}>
              {/* <i className="fa-solid fa-xmark"></i> */}
            </button>
          </div>
        </div>

        <div className="card-body">
          <form>

            {(showPanel !== 'followUp') && (
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


            {((seletectedSubStatus && seletectedSubStatus.hasFollowup && (showPanel !== 'bulkstatuschange')) || (showPanel === 'followUp') || (showPanel !== 'bulkstatuschange')) && (

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

                {/* remark */}
                <div className="col-12">
                  <label htmlFor="comment" className="form-label small fw-medium text-dark">Comment</label>
                  <textarea
                    className="form-control border-0 bgcolor bg-light"
                    id="comment"
                    rows="4"
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>)}

            {((seletectedSubStatus && seletectedSubStatus.hasRemarks) || (setShowPanel === 'followUp')) && (

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
                onClick={closePanel}
              >
                CLOSE
              </button>
              <button

                className="btn text-white"
                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
              >

                {(showPanel === 'editPanel') && 'UPDATE STATUS'}
                {(showPanel === 'followUp') && 'SET FOLLOWUP '}
                {(showPanel === 'bulkstatuschange') && 'UPDATE BULK STATUS '}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    if (isMobile) {
      return (showPanel === 'editPanel') || (showPanel === 'followUp') || (showPanel === 'bulkstatuschange') ? (

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

    return (showPanel === 'editPanel') || (showPanel === 'followUp') || (showPanel === 'bulkstatuschange') ? (
      <div className="col-12 transition-col" id="editFollowupPanel">
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

              {showPanel === 'Reffer' && (`Refer Lead ${selectedProfile?._candidate?.name || 'Unknown'} to Counselor`)}
              {showPanel === 'RefferAllLeads' && (`Refer All Lead to Counselor`)}

            </h6>
          </div>
          <div>
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
                      {concernPersons.map((counselor, index) => (
                        <option key={index} value={counselor._id._id}>{counselor._id.name}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </>

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
                type="submit"
                className="btn text-white"
                onClick={handleReferLead}
                style={{ backgroundColor: '#fd7e14', border: 'none', padding: '8px 24px', fontSize: '14px' }}
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



  return (
    <div className="container-fluid">
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
    margin-bottom: 1rem;
  }

  .lead-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  /* Header Section */
  .lead-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
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
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: white;
    line-height: 1.3;
  }

  .lead-contact-person {
    font-size: 0.9rem;
    margin: 0;
    opacity: 0.9;
    display: flex;
    align-items: center;
  }

  .lead-badges {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
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
    padding: 1.5rem;
  }

  .contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
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
    margin-bottom: 0.25rem;
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
    padding: 1rem 1.5rem;
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
      gap: 1rem;
    }
    
    .action-group {
      width: 100%;
      justify-content: center;
    }
    
    .lead-badges {
      position: static;
      margin-top: 1rem;
    }
  }
`}</style>
      <div className="row">
        <div className={isMobile ? 'col-12' : mainContentClass}>
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
            <nav ref={navRef} className="" style={{ zIndex: 11, backgroundColor: 'white', position: 'fixed', width: `${width}px`, boxShadow: '0 4px 25px 0 #0000001a', paddingBlock: '10px' }}
            >
              <div className="container-fluid">
                <div className="row align-items-center">
                  <div className="col-md-6 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">
                      <h4 className="fw-bold text-dark mb-0 me-3">B2B Cycle</h4>
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
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      <button className="btn btn-primary" onClick={handleOpenLeadModal} style={{ whiteSpace: 'nowrap' }}>
                        <i className="fas fa-plus me-1"></i> Add Lead
                      </button>
                     
                    </div>
                    <GoogleLogin
                        clientId="449914901350-ibgtfl0tbog7vb91u7d5s9cmo92ba1kg.apps.googleusercontent.com"
                        buttonText="Login"
                        onSuccess={responseGoogle}
                        onFailure={responseGoogle}
                        cookiePolicy={'single_host_origin'}
                        responseType='code'
                        accessType='offline'
                        scope='openid profile email https://www.googleapis.com/auth/calendar'
                      />
                  </div>


                  {/* Filter Buttons Row */}
                  <div className="col-12 mt-2">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {crmFilters.map((filter, index) => (
                        <div key={index} className="d-flex align-items-center gap-1">
                          <div className='d-flex position-relative'>
                            <button
                              className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'}`}
                            >
                              {filter.name}
                              <span className={`ms-1 ${activeCrmFilter === index ? 'text-white' : 'text-dark'}`}>
                                ({filter.count})
                              </span>
                            </button>

                            {filter.milestone && (
                              <span
                                className="position-absolute bg-success text-white px-2 py-1 rounded-pill"
                                style={{
                                  fontSize: '0.7rem',
                                  top: '-8px',
                                  right: '-10px',
                                  transform: 'scale(0.8)'
                                }}
                                title={`Milestone: ${filter.milestone}`}
                              >
                                🚩 {filter.milestone}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>




          {/* Main Content */}
          <div className="content-body marginTopMobile" style={{
            marginTop: `${navHeight + 10}px`,
            transition: 'margin-top 0.2s ease-in-out'
          }}>
            <section className="list-view">

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
                  <h5 className="mt-3 text-muted">No B2B Leads Found</h5>
                  <p className="text-muted">Start by adding your first B2B lead using the "Add Lead" button.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {leads.map((lead, leadIndex) => (
                    <div key={lead._id || leadIndex} className="col-12">
                      <div className="lead-card">
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
                          </div>
                          <div className="lead-badges">
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
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="lead-content">
                          {/* Contact Info Grid */}
                          <div className="contact-grid">
                            <div className="contact-item">
                              <div className="contact-icon">
                                <i className="fas fa-envelope"></i>
                              </div>
                              <div className="contact-details">
                                <span className="contact-label">Email</span>
                                <span className="contact-value">
                                  {lead.email || 'Not provided'}
                                </span>
                              </div>
                            </div>

                            <div className="contact-item">
                              <div className="contact-icon">
                                <i className="fas fa-id-badge"></i>
                              </div>
                              <div className="contact-details">
                                <span className="contact-label">Designation</span>
                                <span className="contact-value">
                                  {lead.designation || 'Not specified'}
                                </span>
                              </div>
                            </div>

                            <div className="contact-item">
                              <div className="contact-icon phone">
                                <i className="fas fa-phone"></i>
                              </div>
                              <div className="contact-details">
                                <span className="contact-label">Mobile</span>
                                <span className="contact-value">
                                  {lead.mobile ? (
                                    <a href={`tel:${lead.mobile}`} className="contact-link">
                                      {lead.mobile}
                                    </a>
                                  ) : 'Not provided'}
                                </span>
                              </div>
                            </div>

                            <div className="contact-item">
                              <div className="contact-icon whatsapp">
                                <i className="fab fa-whatsapp"></i>
                              </div>
                              <div className="contact-details">
                                <span className="contact-label">WhatsApp</span>
                                <span className="contact-value">
                                  {lead.whatsapp ? (
                                    <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noopener noreferrer" className="contact-link">
                                      {lead.whatsapp}
                                    </a>
                                  ) : 'Not provided'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Address Section */}
                          {lead.address && (
                            <div className="address-section">
                              <div className="contact-item">
                                <div className="contact-icon address">
                                  <i className="fas fa-map-marker-alt"></i>
                                </div>
                                <div className="contact-details">
                                  <span className="contact-label">Address</span>
                                  <span className="contact-value address-text">
                                    {lead.address}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Lead Owner Section */}
                          {lead.leadOwner?.name && (
                            <div className="owner-section">
                              <div className="contact-item">
                                <div className="contact-icon owner">
                                  <i className="fas fa-user-tie"></i>
                                </div>
                                <div className="contact-details">
                                  <span className="contact-label">Lead Owner</span>
                                  <span className="contact-value">
                                    {lead.leadOwner.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className='d-flex gap-4'>

                            {/* Lead Added By Section */}
                            {lead.leadAddedBy?.name && (
                              <div className="owner-section">
                                <div className="contact-item">
                                  <div className="contact-icon added-by">
                                    <i className="fas fa-user-plus"></i>
                                  </div>
                                  <div className="contact-details">
                                    <span className="contact-label">Added By</span>
                                    <span className="contact-value">
                                      {lead.leadAddedBy.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {lead.remark && (
                              <div className="owner-section">
                                <div className="contact-item">
                                  <div className="contact-icon added-by">
                                    <i className="fas fa-comment"></i>
                                  </div>
                                  <div className="contact-details">
                                    <span className="contact-label">Remarks</span>
                                    <span className="contact-value">
                                      {lead.remark}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="lead-actions">
                          <div className="action-group primary">
                            {/* <button
                              className="action-btn view"
                              onClick={() => togglePopup(leadIndex)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                              <span>View</span>
                            </button> */}
                            <button
                              className="action-btn refer"
                              onClick={() => openRefferPanel(lead, 'Reffer')}
                              title="Refer Lead"
                            >
                              <i className="fas fa-share"></i>
                              <span>Refer</span>
                            </button>
                            <button
                              className="action-btn history"
                              onClick={() => openleadHistoryPanel(lead)}
                              title="Lead History"
                            >
                              <i className="fas fa-history"></i>
                              <span>History</span>
                            </button>
                          </div>
                          <div className="action-group secondary">
                            <button
                              className="action-btn status"
                              onClick={() => openEditPanel(lead, 'StatusChange')}
                              title="Change Status"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="action-btn followup"
                              onClick={() => openEditPanel(lead, 'SetFollowup')}
                              title="Set Follow-up"
                            >
                              <i className="fas fa-calendar-plus"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <nav aria-label="Page navigation" className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <small className="text-muted">
                    Page {currentPage} of {totalPages} ({leads.length} results)
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

        </div >

        {/* Right Sidebar for Desktop - Panels */}
        {
          !isMobile && (
            <div className="col-4">
              <div className="row " style={{
                transition: 'margin-top 0.2s ease-in-out',
                position: 'fixed'
              }}>
                {renderEditPanel()}
                {renderRefferPanel()}
                {renderLeadHistoryPanel()}
              </div>
            </div>
          )
        }

        {/* Mobile Modals */}
        {isMobile && renderEditPanel()}
        {isMobile && renderRefferPanel()}
        {isMobile && renderLeadHistoryPanel()}

      </div >
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
                        {leadCategoryOptions.map(category => (
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
                        {typeOfB2BOptions.map(type => (
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
                        Email <span className="text-danger">*</span>
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

                    {/* Lead Owner */}
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-user-tie text-primary me-1"></i>
                        Lead Owner
                      </label>
                      <select
                        className="form-select"
                        name="leadOwner"
                        value={leadFormData.leadOwner}
                        onChange={handleLeadInputChange}
                      >
                        <option value="">Select Lead Owner</option>
                        {users?.map(user => (
                          <option key={user?._id} value={user?._id}>
                            {user?.name}
                          </option>
                        ))}
                      </select>
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
                          Add Lead
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


    </div >
  );
};

export default B2BSales;

