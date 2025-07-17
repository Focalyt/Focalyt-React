import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'

import CandidateProfile from '../CandidateProfile/CandidateProfile';
import GoogleMapsLocationPicker from './GoogleMapsLocationPicker';

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

  const fetchProfile = (id) => {
    if (candidateRef.current) {
      console.log('start fetching', id)
      candidateRef.current.fetchProfile(id);
    }
  };


  const handleSaveCV = async () => {
    if (candidateRef.current) {
      const result = await candidateRef.current.handleSaveCV();
      console.log(result, 'result')
      if (result === true) {
        setOpenModalId(null); setSelectedProfile(null)
      }
    }
  };

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
    designation: '',
    email: '',
    mobile: '',
    whatsapp: '',
    leadOwner: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [extractedNumbers, setExtractedNumbers] = useState([]);

  //refer lead stats
  const [concernPersons, setConcernPersons] = useState([]);
  const [selectedConcernPerson, setSelectedConcernPerson] = useState(null);

  //filter stats
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubStatus, setFilterSubStatus] = useState('all');
  const [filterLeadStatus, setFilterLeadStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterCenter, setFilterCenter] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterCounselor, setFilterCounselor] = useState('all');
  const [filterConcernPerson, setFilterConcernPerson] = useState('all');
  const [filterDate, setFilterDate] = useState(new Date());
  const [selectedProfiles, setSelectedProfiles] = useState([]);


  //side pannel stats
  const [showPanel, setShowPanel] = useState('')

  // Loading state for fetchProfileData
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // 1. State
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [centerOptions, setCenterOptions] = useState([]);
  const [counselorOptions, setCounselorOptions] = useState([]);
  
  // B2B Dropdown Options
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);
  const [typeOfB2BOptions, setTypeOfB2BOptions] = useState([]);
  
  // Google Maps API
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for Google Maps API availability
  useEffect(() => {
    const checkGoogleMapsAPI = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps API available');
        setMapLoaded(true);
        window.googleMapsLoaded = true;
        initializeAutocomplete();
        return;
      }

      // Check if script is loading from index.html
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
      if (existingScript) {
        console.log('Google Maps script found in index.html, waiting for load...');
        
        // Wait for script to load
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            console.log('Google Maps API loaded from index.html');
            setMapLoaded(true);
            window.googleMapsLoaded = true;
            initializeAutocomplete();
            clearInterval(checkInterval);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google || !window.google.maps) {
            console.warn('Google Maps API not loaded after timeout. Using fallback mode.');
            setMapLoaded(true);
          }
        }, 10000);
      } else {
        console.warn('Google Maps script not found. Using fallback mode.');
        setMapLoaded(true);
      }
    };

    checkGoogleMapsAPI();
  }, []);

  // Initialize Google Maps Autocomplete
  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps) {
      console.log('Google Maps not loaded yet');
      return;
    }

    // Wait for DOM to be ready
    setTimeout(() => {
    const addressInput = document.getElementById('businessAddress');
    if (addressInput) {
        // Remove existing autocomplete if any
        if (addressInput.autocomplete) {
          window.google.maps.event.clearInstanceListeners(addressInput);
        }

      const autocomplete = new window.google.maps.places.Autocomplete(addressInput, {
          types: ['address', 'establishment'],
          componentRestrictions: { country: 'IN' }, // Restrict to India
          fields: ['formatted_address', 'geometry', 'place_id', 'name', 'address_components']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const location = {
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
              placeId: place.place_id,
              name: place.name
          };
          setSelectedLocation(location);
          setLeadFormData(prev => ({
            ...prev,
            businessAddress: place.formatted_address
          }));
            
            // Show success message
            console.log('Location selected:', location);
          } else {
            console.log('No geometry found for selected place');
          }
        });

        // Store reference to autocomplete
        addressInput.autocomplete = autocomplete;
      } else {
        console.log('Address input not found, retrying...');
        // Retry after a short delay
        setTimeout(initializeAutocomplete, 500);
      }
    }, 100);
  };

  // Fetch filter options from backend API on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        const token = userData.token;
        const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
        
        // Fetch main filter options
        const res = await axios.get(`${backendUrl}/college/filters-data`, {
          headers: { 'x-auth': token }
        });
        if (res.data.status) {
          setVerticalOptions(res.data.verticals.map(v => ({ value: v._id, label: v.name })));
          setProjectOptions(res.data.projects.map(p => ({ value: p._id, label: p.name })));
          setCourseOptions(res.data.courses.map(c => ({ value: c._id, label: c.name })));
          setCenterOptions(res.data.centers.map(c => ({ value: c._id, label: c.name })));
          setCounselorOptions(res.data.counselors.map(c => ({ value: c._id, label: c.name })));
        }

        // Fetch B2B dropdown options
        await fetchB2BDropdownOptions();
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

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

  // Handle location selection from map (for backward compatibility)
  const handleMapLocationSelect = (location) => {
    setSelectedLocation(location);
    setLeadFormData(prev => ({
      ...prev,
      businessAddress: location.address
    }));
  };

  // Initialize map when shown
  useEffect(() => {
    if (showMap && mapLoaded && window.google) {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const map = new window.google.maps.Map(mapElement, {
          center: selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : { lat: 20.5937, lng: 78.9629 }, // Default to India center
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });

        let marker = null;

        // Add click listener to map
        map.addListener('click', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Remove existing marker
          if (marker) {
            marker.setMap(null);
          }

          // Add new marker
          marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: true
          });

          // Geocode the clicked location
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const location = {
                address: results[0].formatted_address,
                lat: lat,
                lng: lng,
                placeId: results[0].place_id
              };
              handleMapLocationSelect(location);
            }
          });
        });

        // Add marker for selected location if exists
        if (selectedLocation) {
          marker = new window.google.maps.Marker({
            position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
            map: map,
            draggable: true
          });
          map.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        }
      }
    }
  }, [showMap, mapLoaded, selectedLocation]);

  // Reinitialize autocomplete when map is loaded
  useEffect(() => {
    if (mapLoaded) {
      initializeAutocomplete();
    }
  }, [mapLoaded]);

  const handleCheckboxChange = (profile, checked) => {
    if (checked) {
      setSelectedProfiles(prev => [...prev, profile._id]);
    } else {
      setSelectedProfiles(prev => prev.filter(id => id !== profile._id));
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
        businessAddress: leadFormData.businessAddress,
        concernPersonName: leadFormData.concernPersonName,
        designation: leadFormData.designation,
        email: leadFormData.email,
        mobile: leadFormData.mobile,
        whatsapp: leadFormData.whatsapp,
        leadOwner: leadFormData.leadOwner
      };

      // Add coordinates if location is selected
      if (selectedLocation) {
        leadData.coordinates = {
          coordinates: [selectedLocation.lng, selectedLocation.lat] // [longitude, latitude]
        };
      }

      console.log('Submitting lead data:', leadData);

      // Send data to backend API
      const response = await axios.post(`${backendUrl}/college/b2b/leads`, leadData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        }
      });

      if (response.data.status) {
        // Show success message
        alert('Lead added successfully!');
        
        // Refresh the leads list
        fetchProfileData();
        
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
      formData.append('doc', selectedDocumentForUpload._id);
      console.log('selectedDocumentForUpload', selectedDocumentForUpload._id);

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
        const closeButton = document.querySelector('#staticBackdrop .btn-close');
        if (closeButton) {
          closeButton.click();
        }
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
  // Fixed openDocumentModal function
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

    document.body?.classList.add('no-scroll');
  };

  const closeDocumentModal = useCallback(() => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setDocumentZoom(1);
    setDocumentRotation(0);
  }, []);
  // const closeDocumentModal = () => {
  //   setShowDocumentModal(false);
  //   setSelectedDocument(null);

  //   setIsNewModalOpen(false);
  //   // // Only reset when actually closing modal
  //   setDocumentZoom(1);
  //   setDocumentRotation(0);
  // };

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

  const updateDocumentStatus = useCallback((uploadId, status, reason) => {
    console.log(`Updating document ${uploadId} to ${status}`);
    if (status === 'Rejected' && !reason?.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    alert(`Document ${status} successfully!`);
    closeDocumentModal();
  }, [closeDocumentModal]);

  // const updateDocumentStatus = (uploadId, status) => {
  //   // In real app, this would make an API call
  //   console.log(`Updating document ${uploadId} to ${status}`);
  //   if (status === 'Rejected' && !rejectionReason.trim()) {
  //     alert('Please provide a rejection reason');
  //     return;
  //   }
  //   alert(`Document ${status} successfully!`);
  //   closeDocumentModal();
  // };



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


  const getDocumentCounts = (documents = []) => {
    // Ensure documents is always an array
    if (!Array.isArray(documents)) return {
      totalDocs: 0,
      uploadedDocs: 0,
      pendingDocs: 0,
      verifiedDocs: 0,
      rejectedDocs: 0
    };

    const totalDocs = documents.length;
    const uploadedDocs = documents.filter(doc => doc.uploads && doc.uploads.length > 0).length;
    const pendingDocs = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending'
    ).length;
    const verifiedDocs = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Verified'
    ).length;
    const rejectedDocs = documents.filter(doc =>
      doc.uploads && doc.uploads.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected'
    ).length;

    return { totalDocs, uploadedDocs, pendingDocs, verifiedDocs, rejectedDocs };
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



  // Form data state
  const [formData, setFormData] = useState({
    projects: {
      type: "includes",
      values: []
    },
    verticals: {
      type: "includes",
      values: []
    },
    course: {
      type: "includes",
      values: []
    },
    center: {
      type: "includes",
      values: []
    },
    counselor: {
      type: "includes",
      values: []
    },
    sector: {
      type: "includes",
      values: []
    }
  });

  // Dropdown open state
  const [dropdownStates, setDropdownStates] = useState({
    projects: false,
    verticals: false,
    course: false,
    center: false,
    counselor: false,
    sector: false
  });



  const toggleDropdown = (filterName) => {
    setDropdownStates(prev => {
      // Close all other dropdowns and toggle the current one
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === filterName ? !prev[key] : false;
        return acc;
      }, {});
      return newState;
    });
  };

  // Add this useEffect to handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any multi-select dropdown
      const isMultiSelectClick = event.target.closest('.multi-select-container-new');

      if (!isMultiSelectClick) {
        // Close all dropdowns
        setDropdownStates(prev =>
          Object.keys(prev).reduce((acc, key) => {
            acc[key] = false;
            return acc;
          }, {})
        );
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate total selected filters
  const totalSelected = Object.values(formData).reduce((total, filter) => total + filter.values.length, 0);

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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fileInputRef.current?.click(); // Use ref instead of getElementById
                      }}
                    // onClick={() => document.getElementById('file-input').click()}
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

  const { navRef, navHeight } = useNavHeight([isFilterCollapsed, crmFilters]);
  const { widthRef, width } = useMainWidth([isFilterCollapsed, crmFilters , mainContentClass]);
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

  useEffect(() => {
    console.log('seletectedSubStatus', seletectedSubStatus)

  }, [seletectedSubStatus]);


  //Advance filter




  // Date range handlers
  const handleDateFilterChange = (date, fieldName) => {
    const newFilterData = {
      ...filterData,
      [fieldName]: date
    };
    setFilterData(newFilterData);

    // Apply filters immediately
    setTimeout(() => fetchProfileData(newFilterData), 100);
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
    setTimeout(() => fetchProfileData(newFilterData), 100);
  };



  //
  const clearAllFilters = () => {
    const clearedFilters = {
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
    };

    setFilterData(clearedFilters);
    setFormData({
      projects: { type: "includes", values: [] },
      verticals: { type: "includes", values: [] },
      course: { type: "includes", values: [] },
      center: { type: "includes", values: [] },
      counselor: { type: "includes", values: [] },
      sector: { type: "includes", values: [] }
    });

    setCurrentPage(1);
    // Explicitly call fetchProfileData with cleared filters to ensure data is fetched
    fetchProfileData(clearedFilters, 1);
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

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    try {
      if (showPanel === 'bulkstatuschange') {
        // Validation checks
        if (!selectedProfiles) {
          alert('No profile selected');
          return;
        }

        if (!seletectedStatus) {
          alert('Please select a status');
          return;
        }


        // Prepare the request body
        const data = {
          selectedProfiles,
          _leadStatus: typeof seletectedStatus === 'object' ? seletectedStatus._id : seletectedStatus,
          _leadSubStatus: seletectedSubStatus?._id || null,
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
          `${backendUrl}/college/lead/bulk_status_change`,
          data,
          {
            headers: {
              'x-auth': token,
              'Content-Type': 'application/json'
            }
          }
        );


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
          closePanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }

      }
      if (showPanel === 'editPanel') {
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
          closePanel();
        } else {
          console.error('API returned error:', response.data);
          alert(response.data.message || 'Failed to update status');
        }

      }
      if (showPanel === 'followUp') {


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
          closePanel();
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




  // Inside CRMDashboard component:

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    fetchProfileData(filterData, currentPage);
  }, [currentPage]);

  // Add this function in your component:
  const updateCrmFiltersFromBackend = (backendCounts) => {
    console.log('Backend counts received:', backendCounts);

    setCrmFilters(prevFilters => {
      return prevFilters.map(filter => {
        if (filter._id === 'all') {
          return { ...filter, count: backendCounts.all || 0 };
        }

        const backendFilter = backendCounts[filter._id];
        if (backendFilter) {
          return {
            ...filter,
            count: backendFilter.count || 0,
            milestone: backendFilter.milestone
          };
        }

        return { ...filter, count: 0 };
      });
    });
  };

  const fetchProfileData = async (filters = filterData, page = currentPage) => {
    try {
      setIsLoadingProfiles(true);

      if (!token) {
        console.warn('No token found in session storage.');
        setIsLoadingProfiles(false);
        return;
      }

      // Prepare query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(filters.name && { name: filters.name }),
        ...(filters.b2bType && { b2bType: filters.b2bType }),
        ...(filters.leadCategory && { leadCategory: filters.leadCategory }),
        ...(filters.leadOwner && { leadOwner: filters.leadOwner }),
        ...(filters.createdFromDate && { createdFromDate: filters.createdFromDate.toISOString() }),
        ...(filters.createdToDate && { createdToDate: filters.createdToDate.toISOString() }),
        ...(filters.modifiedFromDate && { modifiedFromDate: filters.modifiedFromDate.toISOString() }),
        ...(filters.modifiedToDate && { modifiedToDate: filters.modifiedToDate.toISOString() }),
        ...(filters.nextActionFromDate && { nextActionFromDate: filters.nextActionFromDate.toISOString() }),
        ...(filters.nextActionToDate && { nextActionToDate: filters.nextActionToDate.toISOString() }),
      
    
      });
      console.log('API counselor:', formData.counselor.values);

      const response = await axios.get(`${backendUrl}/college/appliedCandidates?${queryParams}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success && response.data.data) {
        const data = response.data;
        console.log('data', data);

        // Sirf ek state me data set karo - paginated data
        setAllProfiles(data.data);
        setTotalPages(data.totalPages);
        setPageSize(data.limit);

        // Update CRM filter counts from backend
        if (data.crmFilterCounts) {
          updateCrmFiltersFromBackend(data.crmFilterCounts);
        }
      } else {
        console.error('Failed to fetch profile data', response.data.message);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoadingProfiles(false);
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

      // Reset to first page and fetch with new filters
      setCurrentPage(1);
      fetchProfileData(newFilterData, 1);
    } catch (error) {
      console.error('Filter change error:', error);
    }
  };

  useEffect(() => {
    // Always fetch data when formData changes, regardless of whether filters have values
    setCurrentPage(1);
    fetchProfileData(filterData, 1);
  }, [formData]);



  const handleCrmFilterClick = async (index) => {
    setActiveCrmFilter(index);
    setCurrentPage(1);

    let newFilterData = { ...filterData };

    if (index !== 0) {
      newFilterData.leadStatus = crmFilters[index]._id;
    } else {
      // Remove leadStatus filter for "All"
      delete newFilterData.leadStatus;
    }

    setFilterData(newFilterData);
    fetchProfileData(newFilterData, 1);
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
      await fetchProfileData();
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
                onClick={handleUpdateStatus}
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
                      <button className="btn btn-primary" onClick={() => setShowAddLeadModal(true)} style={{ whiteSpace: 'nowrap' }}>
                        <i className="fas fa-plus me-1"></i> Add Lead
                      </button>
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
                              fetchProfileData();
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


                    </div>
                  </div>

                  {/* Filter Buttons Row */}
                  <div className="col-12 mt-2">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {crmFilters.map((filter, index) => (
                        <div key={index} className="d-flex align-items-center gap-1">
                          <div className='d-flex position-relative'>
                            <button
                              className={`btn btn-sm ${activeCrmFilter === index ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => handleCrmFilterClick(index)}
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

          {/* Advanced Filters */}
          {!isFilterCollapsed && (
            <div
              className="modal show fade d-block"
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1050
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsFilterCollapsed(true);
              }}
            >
              <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered mx-auto justify-content-center">
                <div className="modal-content">
                  {/* Modal Header - Fixed at top */}
                  <div className="modal-header bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-filter text-primary me-2"></i>
                        <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                        {totalSelected > 0 && (
                          <span className="badge bg-primary ms-2">
                            {totalSelected} Active
                          </span>
                        )}
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
                          className="btn-close"
                          onClick={() => setIsFilterCollapsed(true)}
                          aria-label="Close"
                        ></button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Body - Scrollable content */}
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      {/* Course Type Filter */}
                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-graduation-cap me-1 text-success"></i>
                           Type of B2B
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-select"
                            name="b2bType"
                            value={filterData.b2bType}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Types</option>
                            <option value="Free">🆓 Free</option>
                            <option value="Paid">💰 Paid</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-graduation-cap me-1 text-success"></i>
                           Lead Category
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-select"
                            name="leadCategory"
                            value={filterData.leadCategory}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Types</option>
                            <option value="Free">🆓 Free</option>
                            <option value="Paid">💰 Paid</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-bold text-dark">
                          <i className="fas fa-graduation-cap me-1 text-success"></i>
                           Lead Owner
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-select"
                            name="leadOwner"
                            value={filterData.leadOwner}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Types</option>
                            <option value="Free">🆓 Free</option>
                            <option value="Paid">💰 Paid</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Date Filters Section */}
                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <h6 className="text-dark fw-bold mb-3">
                          <i className="fas fa-calendar-alt me-2 text-primary"></i>
                          Date Range Filters
                        </h6>
                      </div>

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
                                className="form-control p-0"
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
                                className="form-control p-0"
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
                                className="form-control p-0"
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
                                className="form-control p-0"
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
                                className="form-control p-0"
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
                                className="form-control p-0"
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

                    {/* Results Summary */}
                    <div className="row mt-4">
                      <div className="col-12">
                        <div className="alert alert-info">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-info-circle me-2"></i>
                            <div>
                              <strong>Results Summary:</strong> Showing {allProfiles.length} results on page {currentPage} of {totalPages}

                              {/* Active filter indicators */}
                              <div className="mt-2">
                                {(filterData.createdFromDate || filterData.createdToDate) && (
                                  <span className="badge bg-success me-2">
                                    <i className="fas fa-calendar-plus me-1"></i>
                                    Created Date Filter Active
                                  </span>
                                )}

                                {(filterData.modifiedFromDate || filterData.modifiedToDate) && (
                                  <span className="badge bg-warning me-2">
                                    <i className="fas fa-calendar-edit me-1"></i>
                                    Modified Date Filter Active
                                  </span>
                                )}

                                {(filterData.nextActionFromDate || filterData.nextActionToDate) && (
                                  <span className="badge bg-info me-2">
                                    <i className="fas fa-calendar-check me-1"></i>
                                    Next Action Date Filter Active
                                  </span>
                                )}

                                {totalSelected > 0 && (
                                  <span className="badge bg-primary me-2">
                                    <i className="fas fa-filter me-1"></i>
                                    {totalSelected} Multi-Select Filters Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer - Fixed at bottom */}
                  <div className="modal-footer bg-light border-top">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div className="text-muted small">
                        <i className="fas fa-filter me-1"></i>
                        {Object.values(filterData).filter(val => val && val !== 'true').length + totalSelected} filters applied
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
                          onClick={() => {
                            fetchProfileData(filterData);
                            setIsFilterCollapsed(true);
                          }}
                        >
                          <i className="fas fa-search me-1"></i>
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Main Content */}
          <div className="content-body marginTopMobile" style={{
            marginTop: `${navHeight + 10}px`,
            transition: 'margin-top 0.2s ease-in-out'
          }}>
            <section className="list-view">
              <div className="row">
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={isLoadingProfiles || allProfiles.length === 0}
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    onClick={() => {
                      openRefferPanel(null, 'RefferAllLeads');
                      console.log('selectedProfile', null);
                    }}
                  >
                    <i className="fas fa-share-alt" style={{ fontSize: "10px" }}></i>
                    Refer All Leads
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={isLoadingProfiles || allProfiles.length === 0}
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    onClick={() => { openEditPanel(null, 'bulkstatuschange') }}
                  >
                    <i className="fas fa-tasks" style={{ fontSize: "10px" }}></i>
                    Bulk Action
                  </button>


                </div>
              </div>
              <div className='row'>
                <div>
                  <div className="col-12 rounded equal-height-2 coloumn-2">
                    <div className="card px-3">
                      <div className="row" id="crm-main-row">

                        {/* Loading State */}
                        {isLoadingProfiles && (
                          <div className="col-12 text-center py-5">
                            <div className="d-flex flex-column align-items-center">
                              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <h5 className="text-muted">Loading profiles...</h5>
                              <p className="text-muted small">Please wait while we fetch the latest data</p>
                            </div>
                          </div>
                        )}

                        {/* Profiles List */}
                        {!isLoadingProfiles && allProfiles.map((profile, profileIndex) => (
                          <div className={`card-content transition-col mb-2`} key={profileIndex}>

                            {/* Profile Header Card */}
                            <div className="card border-0 shadow-sm mb-0 mt-2">
                              <div className="card-body px-1 py-0 my-2">
                                <div className="row align-items-center">
                                  <div className="col-md-6">
                                    <div className="d-flex align-items-center">
                                      <div className="form-check me-3">
                                        <input onChange={(e) => handleCheckboxChange(profile, e.target.checked)} className="form-check-input" type="checkbox" />
                                      </div>
                                      
                                      <div>
                                        <h6 className="mb-0 fw-bold">{profile._candidate?.name || 'Your Name'}</h6>
                                        <small className="text-muted">{profile._candidate?.mobile || 'Mobile Number'}</small>
                                      </div>
                                      <div style={{ marginLeft: '15px' }}>
                                        <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                          <a href={`tel:${profile._candidate?.mobile}`} target="_blank" rel="noopener noreferrer">
                                            <i className="fas fa-phone"></i>
                                          </a>
                                        </button>
                                        {/* <button
                                        className="btn btn-outline-success btn-sm border-0"
                                        onClick={openWhatsappPanel}
                                        style={{ fontSize: '20px' }}
                                        title="WhatsApp"
                                      >
                                        <i className="fab fa-whatsapp"></i>
                                      </button> */}
                                        <a
                                          className="btn btn-outline-success btn-sm border-0"
                                          href={`https://wa.me/${profile._candidate?.mobile}`}
                                          style={{ fontSize: '20px' }}
                                          title="WhatsApp"
                                          target="_blank"
                                        >
                                          <i className="fab fa-whatsapp"></i>
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-4">
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

                                  <div className="col-md-2 text-end d-md-none d-sm-block d-block">
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
                                              zIndex: 8,
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
                                            zIndex: 9,
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
                                              openRefferPanel(profile, 'Reffer');
                                              console.log('selectedProfile', profile);
                                            }}
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
                                              openRefferPanel(profile, 'SetFollowup');
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
                                              zIndex: 8,
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
                                            zIndex: 9,
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
                                            onClick={() => {
                                              setShowPopup(null)
                                              openRefferPanel(profile, 'Reffer');
                                              console.log('selectedProfile', profile);
                                            }}
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
                                              <div className="info-label">Lead Category</div>
                                              <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">Type of B2B</div>
                                              <div className="info-value">{profile._course?.name}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">Business Name</div>
                                              <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                            </div>
                                          </div>

                                          <div className="info-card">
                                            <div className="info-group">
                                              <div className="info-label">Concern Person Name</div>
                                              <div className="info-value">{profile._course?.typeOfProject}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">Designation</div>
                                              <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">Email</div>
                                              <div className="info-value">{profile.sector}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">Mobile Number</div>
                                              <div className="info-value">{profile.createdAt ?
                                                new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">WhatsApp Number</div>
                                              <div className="info-value">{profile.createdAt ?
                                                new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                            </div>
                                          </div>

                                          <div className="info-card">
                                            <div className="info-group">
                                              <div className="info-label">STATE</div>
                                              <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">City</div>
                                              <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                            </div>
                                            <div className="info-group">
                                              <div className="info-label">Lead Owner</div>
                                              <div className="info-value">{profile._center?.name || 'N/A'}</div>
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
                                                    <div className="info-label">Lead Category</div>
                                                    <div className="info-value">{profile.leadOwner?.join(', ') || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Type of B2B</div>
                                                    <div className="info-value">{profile._course?.name}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Business Name</div>
                                                    <div className="info-value">{profile._course?.batchName || 'N/A'}</div>
                                                  </div>
                                                </div>

                                                <div className="info-card">
                                                  <div className="info-group">
                                                    <div className="info-label">Concern Person Name</div>
                                                    <div className="info-value">{profile._course?.typeOfProject}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Designation</div>
                                                    <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Email</div>
                                                    <div className="info-value">{profile._course?.sectors}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Mobile Number</div>
                                                    <div className="info-value">{profile.createdAt ?
                                                      new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">WhatsApp Number</div>
                                                    <div className="info-value">{profile.createdAt ?
                                                      new Date(profile.createdAt).toLocaleString() : 'N/A'}</div>
                                                  </div>
                                                </div>

                                                <div className="info-card">
                                                  <div className="info-group">
                                                    <div className="info-label">STATE</div>
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">City</div>
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                                  </div>
                                                  <div className="info-group">
                                                    <div className="info-label">Lead Owner</div>
                                                    <div className="info-value">{profile._center?.name || 'N/A'}</div>
                                                  </div>
                                                 
                                                  <div className="info-group">
                                                    <div className="info-label">Remarks</div>
                                                    <div className="info-value">{profile.remarks || 'N/A'}</div>
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
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.state || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">CITY</div>
                                                    <div className="info-value">{profile._candidate?.personalInfo?.currentAddress?.city || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Concern Person Name</div>
                                                    <div className="info-value">{profile._course?.typeOfProject}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Designation</div>
                                                    <div className="info-value">{profile._course?.projectName || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Email</div>
                                                    <div className="info-value">{profile._course?.sectors}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Mobile Number</div>
                                                    <div className="info-value">{profile._course?.name}</div>
                                                  </div>
                                                </div>
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">WhatsApp Number</div>
                                                    <div className="info-value">{profile._course?.name}</div>
                                                  </div>
                                                </div>

                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Type Of B2B</div>
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
                                                    <div className="info-label">Lead Category</div>
                                                    <div className="info-value">{profile.remarks || 'N/A'}</div>
                                                  </div>
                                                </div>
                                                
                                                <div className="col-xl- col-3">
                                                  <div className="info-group">
                                                    <div className="info-label">Lead Owner</div>
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
                                  

                                                          </div>
                                                          )}
                                                        </div>
                            {/* Lead Add modal Start*/}
                            {showAddLeadModal && (
                            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                              <div className="modal-dialog modal-lg modal-dialog-centered">
                                <div className="modal-content">
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
                                  <div className="modal-body p-4">
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
                                        <GoogleMapsLocationPicker
                                          onLocationSelect={(location) => {
                                            setSelectedLocation(location);
                                            setLeadFormData(prev => ({
                                              ...prev,
                                              businessAddress: location.address
                                            }));
                                          }}
                                          selectedLocation={selectedLocation}
                                            placeholder="Enter business address or use map to select"
                                            disabled={loading}
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
                                          {/* {leadOwners.map(owner => (
                                            <option key={owner.value} value={owner.value}>
                                              {owner.label}
                                            </option>
                                          ))} */}
                                        </select>
                                      </div>

                                      {/* Extracted Numbers Display */}
                                      {extractedNumbers.length > 0 && (
                                        <div className="col-12">
                                          <div className="alert alert-info">
                                            <div className="d-flex align-items-center mb-2">
                                              <i className="fas fa-phone text-primary me-2"></i>
                                              <strong>Extracted Mobile/WhatsApp Numbers ({extractedNumbers.length}):</strong>
                                            </div>
                                            <div className="row g-2">
                                              {extractedNumbers.map((number, index) => (
                                                <div key={index} className="col-md-3 col-sm-6">
                                                  <span className="badge bg-success me-1">
                                                    <i className="fas fa-check me-1"></i>
                                                    {number}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}
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
                            )}
                            {/* Lead Add modal End */}


                            <style>
                              {
                                `.new-modal-content{
                                 width:1000px!important;
                                 transform: translateX(25%);
                                 }

                                 @media(max-width:768px){
                                 .new-modal-content{
                                 width:100%!important;
                                 transform: translateX(0%)
                                 }
                                 }
                                  `
                              }
                            </style>
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
            <div className="row " style={{
              transition: 'margin-top 0.2s ease-in-out',
              position: 'fixed'
            }}>
              {renderEditPanel()}
              {renderRefferPanel()}
              {renderLeadHistoryPanel()}
            </div>
          </div>
        )}

        {/* Mobile Modals */}
        {isMobile && renderEditPanel()}
        {isMobile && renderRefferPanel()}
        {isMobile && renderLeadHistoryPanel()}

      </div>
      <UploadModal />

     
      
    </div>
  );
};

export default B2BSales;

