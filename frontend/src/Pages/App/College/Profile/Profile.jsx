import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Profile = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const [college, setCollege] = useState({
    name: '',
    stateId: '',
    cityId: '',
    place: '',
    _university: '',
    website: '',
    linkedin: '',
    facebook: '',
    zipcode: '',
    address: '',
    description: '',
    logo: '',
    _concernPerson: {
      name: '',
      designation: '',
      email: '',
      mobile: ''
    },
    collegeRepresentatives: [{
      name: '',
      designation: '',
      email: '',
      mobile: ''
    }]
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStates();
    fetchProfileData();
    
    const timer = setTimeout(() => {
    initializeGoogleMaps();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      // Cleanup preview URL on unmount
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, []);

  // Cleanup preview URL when it changes
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/profile`, {
        headers: { 'x-auth': token }
      });
      if (response.data && response.data.college) {
        const collegeData = response.data.college;
        
        if (collegeData._concernPerson) {
          if (Array.isArray(collegeData._concernPerson)) {
            const concernPerson = collegeData._concernPerson.find(cp => 
              cp._id && cp._id.toString() === userData._id?.toString()
            );
            if (concernPerson && !concernPerson.mobile && userData.mobile) {
              concernPerson.mobile = userData.mobile;
            }
          } else {
            if (!collegeData._concernPerson.mobile && userData.mobile) {
              collegeData._concernPerson.mobile = userData.mobile;
            }
          }
        }
        
        setCollege(collegeData);
        if (collegeData.stateId) {
          fetchCities(collegeData.stateId);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Error loading profile data. Please refresh the page.');
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/profile-options`, {
        headers: { 'x-auth': token }
      });
      if (response.data && response.data.status) {
        setStates(response.data.states || []);
        setUniversities(response.data.universities || []);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      alert('Error loading states. Please refresh the page.');
    }
  };




  const fetchCities = async (stateId) => {
    try {
      const response = await axios.get(`${backendUrl}/company/getcitiesbyId`, {
        params: { stateId },
        headers: { 'x-auth': token }
      });
      setCities(response.data?.cityValues || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };


  const initializeGoogleMaps = () => {
    // Wait for Google Maps to load and DOM to be ready
    const initAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
      const input = document.getElementById('work-loc');
        if (input) {
      const options = {
        componentRestrictions: { country: "in" },
        types: ["establishment"]
      };

      const autocomplete = new window.google.maps.places.Autocomplete(input, options);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
            if (place.geometry) {
        setCollege(prev => ({
          ...prev,
          place: input.value,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }));
            }
          });
        }
      } else {
        // Retry after a short delay if Google Maps isn't loaded yet
        setTimeout(initAutocomplete, 100);
      }
    };

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initAutocomplete();
        }
      }, 100);

      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(checkGoogleMaps), 10000);
    }
  };

  const handleInputChange = (e, section, index = null) => {
    const { name, value } = e.target;

    if (section === 'college') {
      setCollege(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (section === 'concernPerson') {
      setCollege(prev => ({
        ...prev,
        _concernPerson: {
          ...prev._concernPerson,
          [name]: value
        }
      }));
    } else if (section === 'representative' && index !== null) {
      const updatedRepresentatives = [...college.collegeRepresentatives];
      updatedRepresentatives[index] = {
        ...updatedRepresentatives[index],
        [name]: value
      };
      setCollege(prev => ({
        ...prev,
        collegeRepresentatives: updatedRepresentatives
      }));
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setCollege(prev => ({
      ...prev,
      stateId,
      cityId: '' // Reset city when state changes
    }));
    if (stateId) {
      fetchCities(stateId);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    console.log('File selected for upload:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!checkImageValidation(file.type) || !checkImageSize(file.size)) {
      alert("This format not accepted and each image should be 2MB");
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setLogoPreview(null);
      return;
    }

    // Create preview URL immediately
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading logo to:', `${backendUrl}/api/uploadSingleFile`);
      
      // Use backendUrl for the upload endpoint
      const response = await axios.post(`${backendUrl}/api/uploadSingleFile`, formData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Logo upload response:', response.data);

      if (response.data && response.data.status) {
        const logoKey = response.data.data.Key || response.data.data.key || response.data.data.Location?.split('/').pop();
        
        if (logoKey) {
          console.log('Logo key received:', logoKey);
          setCollege(prev => ({
            ...prev,
            logo: logoKey
          }));
          
          // Clear preview and use uploaded logo
          if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
            setLogoPreview(null);
          }
          
          // Trigger logo update event for navbar (preview before save)
          window.dispatchEvent(new Event('collegeLogoUpdated'));
          
          alert('Logo uploaded successfully! Click Save to update your profile.');
        } else {
          console.error('Logo key not found in response:', response.data);
          alert('Logo uploaded but key not found. Please check console for details.');
          // Clear preview on error
          if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
            setLogoPreview(null);
          }
        }
      } else {
        console.error('Upload failed - response:', response.data);
        alert('Failed to upload logo. Please try again.');
        // Clear preview on error
        if (logoPreview) {
          URL.revokeObjectURL(logoPreview);
          setLogoPreview(null);
        }
      }
      
      // Reset input after upload (success or failure) so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error uploading logo. Please try again.';
      alert(`Error: ${errorMessage}\n\nCheck browser console (F12) for more details.`);
      
      // Clear preview on error
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }
      
      // Reset input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!college.logo && !logoPreview) return;
    
    if (!window.confirm('Are you sure you want to remove the logo?')) {
      return;
    }

    // Clear preview if exists
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }

    // If no uploaded logo, just clear state and return
    if (!college.logo || college.logo.trim() === '') {
      setCollege(prev => ({
        ...prev,
        logo: ''
      }));
      return;
    }

    try {
      await axios.post(`${backendUrl}/api/deleteSingleFile`, { key: college.logo }, {
        headers: { 'x-auth': token }
      });

      await axios.post(`${backendUrl}/company/removelogo`, { key: college.logo }, {
        headers: { 'x-auth': token }
      });

      setCollege(prev => ({
        ...prev,
        logo: ''
      }));
      
      alert('Logo removed successfully! Click Save to update your profile.');
    } catch (error) {
      console.error('Error removing logo:', error);
      // Even if API call fails, clear the logo from state to show default placeholder
      setCollege(prev => ({
        ...prev,
        logo: ''
      }));
      alert('Logo removed from display. Click Save to update your profile.');
    }
  };

  const addRepresentative = () => {
    setCollege(prev => ({
      ...prev,
      collegeRepresentatives: [
        ...prev.collegeRepresentatives,
        { name: '', designation: '', email: '', mobile: '' }
      ]
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!college.name?.trim()) errors.collegeName = true;
    if (!college.stateId) errors.state = true;
    if (!college.cityId) errors.city = true;
    if (!college._university) errors.university = true;
    if (!college.place?.trim()) errors.workLocation = true;
    if (!college._concernPerson?.name?.trim()) errors.concernName = true;
    if (!college._concernPerson?.designation?.trim()) errors.concernDesignation = true;
    if (!checkEmail(college._concernPerson?.email)) errors.concernEmail = true;
    // Mobile is disabled, so skip validation if it's from userData
    if (!college._concernPerson?.mobile && !userData.mobile) {
      errors.concernMobile = true;
    } else if (college._concernPerson?.mobile && !checkMobile(college._concernPerson.mobile)) {
      errors.concernMobile = true;
    }

    setErrors(errors);
    
    // Log validation errors for debugging
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      console.log('College data:', college);
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate form first
    if (!validateForm()) {
      alert('Please fill all required fields correctly.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        concernedPerson: college._concernPerson,
        collegeInfo: {
          name: college.name,
          stateId: college.stateId,
          cityId: college.cityId,
          place: college.place,
          latitude: college.latitude,
          longitude: college.longitude,
          _university: college._university,
          website: college.website,
          linkedin: college.linkedin,
          facebook: college.facebook,
          zipcode: college.zipcode,
          address: college.address,
          description: college.description,
          logo: college.logo
        },
        representativeInfo: college.collegeRepresentatives.filter(rep =>
          rep.name || rep.designation || rep.email || rep.mobile
        )
      };

      console.log('Submitting profile data:', body);

      const response = await axios.post(`${backendUrl}/college/myprofile`, body, {
        headers: { 'x-auth': token }
      });

      console.log('Profile save response:', response.data);

      if (response.data && (response.data.status === 200 || response.data.status === true)) {
        // Show success message
        alert('Profile updated successfully!');
        
        // Fetch updated profile data to refresh the form with latest data
        // This updates the form without full page reload
        try {
          await fetchProfileData();
          
          // Trigger logo update event for navbar
          if (college.logo) {
            window.dispatchEvent(new Event('collegeLogoUpdated'));
          }
        } catch (fetchError) {
          console.error('Error fetching updated profile:', fetchError);
          // If fetch fails, do a full reload as fallback
          window.location.reload();
        }
      } else {
        alert(response.data?.message || 'Profile updated successfully!');
        try {
          await fetchProfileData();
          
          // Trigger logo update event for navbar
          if (college.logo) {
            window.dispatchEvent(new Event('collegeLogoUpdated'));
          }
        } catch (fetchError) {
          console.error('Error fetching updated profile:', fetchError);
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error saving profile. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkEmail = (email) => {
    if (!email) return false;
    const emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailReg.test(email);
  };

  const checkMobile = (number) => {
    if (!number) return false;
    const numStr = String(number).trim();
    return numStr.length === 10 && !isNaN(numStr);
  };

  const checkImageSize = (size) => {
    const finalSize = (size / 1024) / 1024;
    return finalSize <= 2;
  };

  const checkImageValidation = (type) => {
    const regex = /(\/jpg|\/jpeg|\/png)$/i;
    return regex.test(type);
  };

  const fldStyle = {
    width: '100%',
    padding: '9px 13px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    background: '#fff',
    color: '#333',
    transition: 'border-color 0.2s',
  };
  const fldErrStyle = { ...fldStyle, border: '1.5px solid #ef4444' };
  const lblStyle = { fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '5px', display: 'block' };
  const lblErrStyle = { ...lblStyle, color: '#ef4444' };
  const reqStar = <span style={{ color: '#ef4444' }}>*</span>;
  const sectionCardStyle = {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(252,43,90,0.07)',
    marginBottom: '24px',
    border: '1px solid #f1f5f9',
  };
  const sectionHeaderStyle = {
    background: 'linear-gradient(90deg, #E11D48 , #ff5770 )',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };
  const fieldWrap = { flex: '1 1 220px', minWidth: '180px', maxWidth: '260px' };
  const fieldWrapWide = { flex: '1 1 300px', minWidth: '220px', maxWidth: '420px' };

  return (
    <>
      {/* Page Header Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #E11D48 , #ff5770 )',
        borderRadius: '16px',
        padding: '22px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(252,43,90,0.25)',
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.3px' }}>
            <i className="fas fa-university" style={{ marginRight: '10px', opacity: 0.9 }}></i>
            Your Profile
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            Manage college information and representatives
          </p>
        </div>
        <button
          onClick={() => setShowPreviewModal(true)}
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            color: '#fff',
            borderRadius: '10px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
        >
          <i className="fas fa-eye"></i> Preview
        </button>
      </div>

      {/* College Information Section */}
      <div style={sectionCardStyle} id="college-info">
        <div style={sectionHeaderStyle}>
          <i className="fas fa-building" style={{ color: '#fff', fontSize: '16px' }}></i>
          <h5 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '15px' }}>College Information</h5>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>

            <div style={fieldWrap}>
              <label style={errors.collegeName ? lblErrStyle : lblStyle}>College Name {reqStar}</label>
              <input
                type="text"
                name="name"
                style={errors.collegeName ? fldErrStyle : fldStyle}
                value={college.name}
                onChange={(e) => handleInputChange(e, 'college')}
                maxLength="30"
                placeholder="Enter college name"
              />
            </div>

            <div style={fieldWrap}>
              <label style={errors.state ? lblErrStyle : lblStyle}>State {reqStar}</label>
              <select
                name="stateId"
                style={errors.state ? fldErrStyle : fldStyle}
                value={college.stateId}
                onChange={handleStateChange}
              >
                <option value="">Select State</option>
                {Array.isArray(states) && states.length > 0 ? (
                  states.map((state) => (
                    <option key={state._id} value={state._id}>{state.name}</option>
                  ))
                ) : (
                  <option disabled>No states available</option>
                )}
              </select>
            </div>

            <div style={fieldWrap}>
              <label style={errors.city ? lblErrStyle : lblStyle}>City {reqStar}</label>
              <select
                name="cityId"
                style={errors.city ? fldErrStyle : fldStyle}
                value={college.cityId}
                onChange={(e) => handleInputChange(e, 'college')}
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div style={fieldWrap}>
              <label htmlFor="work-loc" style={errors.workLocation ? lblErrStyle : lblStyle}>Work Location {reqStar}</label>
              <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: errors.workLocation ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0' }}>
                <div style={{ background: 'linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)', padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
                  <img src="/Assets/images/isist.png" id="siteforcomp" alt="location" style={{ height: '18px' }} />
                </div>
                <input
                  type="text"
                  id="work-loc"
                  name="place"
                  style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: '13px', background: '#fff', color: '#333' }}
                  placeholder="Enter a location"
                  value={college.place || ''}
                  onChange={(e) => handleInputChange(e, 'college')}
                />
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={errors.university ? lblErrStyle : lblStyle}>University {reqStar}</label>
              <select
                name="_university"
                style={errors.university ? fldErrStyle : fldStyle}
                value={college._university}
                onChange={(e) => handleInputChange(e, 'college')}
              >
                <option value="">Select University</option>
                {universities.map((university) => (
                  <option key={university._id} value={university._id}>{university.name}</option>
                ))}
              </select>
            </div>

            <div style={fieldWrap}>
              <label style={lblStyle}>Website</label>
              <input
                type="text"
                name="website"
                style={fldStyle}
                value={college.website}
                onChange={(e) => handleInputChange(e, 'college')}
                maxLength="100"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div style={fieldWrap}>
              <label style={lblStyle}>LinkedIn URL</label>
              <input
                type="text"
                name="linkedin"
                style={fldStyle}
                value={college.linkedin}
                onChange={(e) => handleInputChange(e, 'college')}
                placeholder="https://linkedin.com/..."
              />
            </div>

            <div style={fieldWrap}>
              <label style={lblStyle}>Facebook</label>
              <input
                type="text"
                name="facebook"
                style={fldStyle}
                value={college.facebook}
                onChange={(e) => handleInputChange(e, 'college')}
                maxLength="100"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div style={fieldWrap}>
              <label style={lblStyle}>Zipcode</label>
              <input
                type="number"
                name="zipcode"
                style={fldStyle}
                value={college.zipcode}
                onChange={(e) => handleInputChange(e, 'college')}
                maxLength="6"
                placeholder="400001"
              />
            </div>

            <div style={fieldWrapWide}>
              <label style={lblStyle}>Address</label>
              <textarea
                name="address"
                style={{ ...fldStyle, resize: 'vertical', minHeight: '80px' }}
                value={college.address}
                onChange={(e) => handleInputChange(e, 'college')}
                maxLength="150"
                rows="3"
                placeholder="Full college address"
              ></textarea>
            </div>

            <div style={fieldWrapWide}>
              <label style={lblStyle}>Description</label>
              <textarea
                name="description"
                style={{ ...fldStyle, resize: 'vertical', minHeight: '80px' }}
                value={college.description}
                onChange={(e) => handleInputChange(e, 'college')}
                maxLength="500"
                rows="3"
                placeholder="Brief description about your college"
              ></textarea>
            </div>

            {/* Logo Upload */}
            <div style={{ flex: '0 0 auto', alignSelf: 'center' }}>
                      <div className="image-upload" style={{ position: 'relative', display: 'inline-block' }}>
                        {(logoPreview || (college.logo && college.logo.trim() !== '')) ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <label htmlFor="uploadlogo" style={{ cursor: 'pointer', display: 'block' }}>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                  src={logoPreview || `${bucketUrl}/${college.logo}?t=${Date.now()}`}
                                  className="pointer companylogo"
                                  height="auto"
                                  width="60"
                                  alt="College Logo"
                                  style={{ 
                                    borderRadius: '4px',
                                    border: logoPreview ? '2px solid #fc2b5a' : '2px solid #ddd',
                                    padding: '2px',
                                    transition: 'opacity 0.3s'
                                  }}
                                  onError={(e) => {
                                    console.error('Error loading logo image:', college.logo);
                                    e.target.style.display = 'none';
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.opacity = '0.8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.opacity = '1';
                                  }}
                                  title={logoPreview ? "Preview - Click Save to update" : "Click to update logo"}
                                />
                                {/* {logoPreview && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '-90px',
                                    width: '100px',
                                    left: '0',
                                    right: '0',
                                    background: 'rgba(252, 43, 90, 0.8)',
                                    color: 'white',
                                    fontSize: '9px',
                                    padding: '2px',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                  }}>Preview</div>
                                )} */}
                                {!logoPreview && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '-70px',
                                    left: '0',
                                    right: '0',
                                    // background: 'rgba(0,0,0,0.6)',
                                    color: 'black',
                                    fontSize: '10px',
                                    padding: '2px',
                                    textAlign: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.3s',
                                    pointerEvents: 'none',
                                    width:'200px',
                                    height:'120px'
                                  }} className="logo-hover-text">Click to update</div>
                                )}
                              </div>
                            </label>
                            {!logoPreview && (
                              <button
                                className="remove-logo-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveLogo();
                                }}
                                title="Remove logo"
                                style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  right: '-8px',
                                  background: 'red',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                  zIndex: 1,
                                  lineHeight: '1'
                                }}
                              >
                                &times;
                              </button>
                            )}
                            <p className="mt-1" style={{ textAlign: 'center', fontSize: '12px', marginTop: '5px' }}>
                              {logoPreview ? 'Preview (Click Save)' : 'College Logo'}
                            </p>
                          </div>
                        ) : (
                          <>
                            <label htmlFor="uploadlogo" style={{ cursor: 'pointer', alignSelf: 'center', display: 'block' }}>
                              <img
                                className="custom-cursor-pointer default"
                                src="/Assets/images/add_receipt.png"
                                width="60"
                                height="auto"
                                alt="Upload logo"
                                style={{ display: 'block', margin: '0 auto' }}
                              />
                            </label>
                            <p className="mt-1 custom-cursor-pointer" style={{ textAlign: 'center', fontSize: '12px', marginTop: '5px' }}>
                              <label htmlFor="uploadlogo" style={{ cursor: 'pointer' }}>Upload logo</label>
                            </p>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          id="uploadlogo"
                          type="file"
                          className="my-logo-uploader form-control"
                          style={{ display: 'none' }}
                          onChange={handleLogoUpload}
                          accept="image/jpeg,image/png,image/jpg"
                        />
                      </div>
                    </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div 
          className="resume-preview-modal"
          onClick={() => setShowPreviewModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="resume-preview-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 20px',
              borderBottom: '1px solid #eee'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>College Profile Preview</h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#555'
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#f5f5f5'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '40px',
                maxWidth: '800px',
                margin: '0 auto',
                boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
                fontFamily: 'Roboto, Arial, sans-serif'
              }}>
                {/* College Logo and Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '30px',
                  paddingBottom: '20px',
                  borderBottom: '2px solid #fc2b5a'
                }}>
                  {(logoPreview || (college.logo && college.logo.trim() !== '')) ? (
                    <img
                      src={logoPreview || `${bucketUrl}/${college.logo}?t=${Date.now()}`}
                      alt="College Logo"
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '2px solid #ddd',
                        padding: '5px',
                        backgroundColor: '#fff'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f0f0f0',
                      color: '#aaa',
                      fontSize: '14px'
                    }}>
                      No Logo
                    </div>
                  )}
                  <div>
                    <h1 style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      margin: '0 0 5px 0',
                      color: '#333'
                    }}>
                      {college.name || 'College Name'}
                    </h1>
                    {college.place && (
                      <p style={{
                        fontSize: '16px',
                        color: '#666',
                        margin: 0
                      }}>
                        <i className="bi bi-geo-alt-fill" style={{ color: '#fc2b5a', marginRight: '5px' }}></i>
                        {college.place}
                      </p>
                    )}
                  </div>
                </div>

                {/* College Information */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#fc2b5a',
                    margin: '0 0 15px 0',
                    paddingBottom: '5px',
                    borderBottom: '1px solid #eee'
                  }}>
                    College Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    {college._university && (
                      <div>
                        <strong>University:</strong> {universities.find(u => u._id === college._university)?.name || college._university}
                      </div>
                    )}
                    {college.website && (
                      <div>
                        <strong>Website:</strong> <a href={college.website} target="_blank" rel="noopener noreferrer" style={{ color: '#fc2b5a' }}>{college.website}</a>
                      </div>
                    )}
                    {college.linkedin && (
                      <div>
                        <strong>LinkedIn:</strong> <a href={college.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#fc2b5a' }}>{college.linkedin}</a>
                      </div>
                    )}
                    {college.facebook && (
                      <div>
                        <strong>Facebook:</strong> <a href={college.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#fc2b5a' }}>{college.facebook}</a>
                      </div>
                    )}
                    {college.zipcode && (
                      <div>
                        <strong>Zipcode:</strong> {college.zipcode}
                      </div>
                    )}
                    {college.address && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Address:</strong> {college.address}
                      </div>
                    )}
                    {college.description && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Description:</strong>
                        <p style={{ marginTop: '5px', lineHeight: '1.6', color: '#555' }}>{college.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Concerned Person */}
                {college._concernPerson && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#fc2b5a',
                      margin: '0 0 15px 0',
                      paddingBottom: '5px',
                      borderBottom: '1px solid #eee'
                    }}>
                      Concerned Person
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                      {college._concernPerson.name && (
                        <div>
                          <strong>Name:</strong> {college._concernPerson.name}
                        </div>
                      )}
                      {college._concernPerson.designation && (
                        <div>
                          <strong>Designation:</strong> {college._concernPerson.designation}
                        </div>
                      )}
                      {college._concernPerson.email && (
                        <div>
                          <strong>Email:</strong> {college._concernPerson.email}
                        </div>
                      )}
                      {college._concernPerson.mobile && (
                        <div>
                          <strong>Contact Number:</strong> {college._concernPerson.mobile}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* College Representatives */}
                {college.collegeRepresentatives && college.collegeRepresentatives.length > 0 && college.collegeRepresentatives.some(rep => rep.name || rep.designation || rep.email || rep.mobile) && (
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#fc2b5a',
                      margin: '0 0 15px 0',
                      paddingBottom: '5px',
                      borderBottom: '1px solid #eee'
                    }}>
                      College Representatives
                    </h3>
                    {college.collegeRepresentatives.filter(rep => rep.name || rep.designation || rep.email || rep.mobile).map((rep, index) => (
                      <div key={index} style={{
                        padding: '15px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        borderLeft: '3px solid #fc2b5a'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {rep.name && <div><strong>Name:</strong> {rep.name}</div>}
                          {rep.designation && <div><strong>Designation:</strong> {rep.designation}</div>}
                          {rep.email && <div><strong>Email:</strong> {rep.email}</div>}
                          {rep.mobile && <div><strong>Contact:</strong> {rep.mobile}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{
              padding: '15px 20px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '15px'
            }}>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  border: '1px solid #ddd'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concerned Person Section */}
      <div style={sectionCardStyle} id="Concerned-Person">
        <div style={sectionHeaderStyle}>
          <i className="fas fa-user-tie" style={{ color: '#fff', fontSize: '16px' }}></i>
          <h5 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '15px' }}>Concerned Person</h5>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
            <div style={fieldWrap}>
              <label style={errors.concernName ? lblErrStyle : lblStyle}>Name {reqStar}</label>
              <input
                type="text"
                name="name"
                style={errors.concernName ? fldErrStyle : fldStyle}
                value={college._concernPerson ? college._concernPerson.name : ''}
                onChange={(e) => handleInputChange(e, 'concernPerson')}
                maxLength="25"
                placeholder="Full name"
              />
            </div>
            <div style={fieldWrap}>
              <label style={errors.concernDesignation ? lblErrStyle : lblStyle}>Designation {reqStar}</label>
              <input
                type="text"
                name="designation"
                style={errors.concernDesignation ? fldErrStyle : fldStyle}
                value={college._concernPerson?.designation || ''}
                onChange={(e) => handleInputChange(e, 'concernPerson')}
                maxLength="25"
                placeholder="e.g. Principal"
              />
            </div>
            <div style={fieldWrap}>
              <label style={errors.concernEmail ? lblErrStyle : lblStyle}>Email {reqStar}</label>
              <input
                type="email"
                name="email"
                style={errors.concernEmail ? fldErrStyle : fldStyle}
                value={college._concernPerson?.email || ''}
                onChange={(e) => handleInputChange(e, 'concernPerson')}
                maxLength="30"
                placeholder="email@college.edu"
              />
            </div>
            <div style={fieldWrap}>
              <label style={errors.concernMobile ? lblErrStyle : lblStyle}>Contact Number {reqStar}</label>
              <input
                type="number"
                name="mobile"
                style={{ ...fldStyle, background: '#f8f9fa', color: '#888', cursor: 'not-allowed' }}
                value={college._concernPerson?.mobile || userData.mobile || ''}
                disabled
                placeholder="Mobile number from signup"
              />
            </div>
          </div>
        </div>
      </div>

      {/* College Representatives Section */}
      <div style={sectionCardStyle} id="representativeinfo">
        <div style={sectionHeaderStyle}>
          <i className="fas fa-users" style={{ color: '#fff', fontSize: '16px' }}></i>
          <h5 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '15px' }}>College Representatives</h5>
        </div>
        <div style={{ padding: '24px' }}>
          {college.collegeRepresentatives.map((rep, index) => (
            <div key={index} style={{
              display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end',
              padding: '16px', background: '#fafbfc', borderRadius: '12px',
              marginBottom: '14px', border: '1px solid #f1f5f9',
            }}>
              <div style={fieldWrap}>
                <label style={lblStyle}>Name</label>
                <input
                  style={fldStyle}
                  type="text"
                  name="name"
                  value={rep.name}
                  onChange={(e) => handleInputChange(e, 'representative', index)}
                  maxLength="25"
                  placeholder="Representative name"
                />
              </div>
              <div style={fieldWrap}>
                <label style={lblStyle}>Designation</label>
                <input
                  style={fldStyle}
                  type="text"
                  name="designation"
                  value={rep.designation}
                  onChange={(e) => handleInputChange(e, 'representative', index)}
                  maxLength="25"
                  placeholder="e.g. Placement Officer"
                />
              </div>
              <div style={fieldWrap}>
                <label style={lblStyle}>Email</label>
                <input
                  style={fldStyle}
                  type="email"
                  name="email"
                  value={rep.email}
                  onChange={(e) => handleInputChange(e, 'representative', index)}
                  maxLength="30"
                  placeholder="email@college.edu"
                />
              </div>
              <div style={fieldWrap}>
                <label style={lblStyle}>Contact Number</label>
                <input
                  style={fldStyle}
                  type="text"
                  name="mobile"
                  value={rep.mobile}
                  onChange={(e) => handleInputChange(e, 'representative', index)}
                  maxLength="10"
                  placeholder="10-digit number"
                />
              </div>
              {index === 0 && (
                <div style={{ alignSelf: 'flex-end', paddingBottom: '2px' }}>
                  <button
                    onClick={addRepresentative}
                    style={{
                      background: 'linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)',
                      color: '#fff', border: 'none', borderRadius: '10px',
                      padding: '9px 18px', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
              )}
            </div>
          ))}

          {errors.message && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{errors.message}</div>
          )}

          {/* Save / Reset Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => window.location.href = '/college/myprofile'}
              style={{
                background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0',
                borderRadius: '10px', padding: '9px 24px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <i className="fas fa-undo" style={{ marginRight: '6px' }}></i>Reset
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: loading ? '#ccc' : 'linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '9px 28px', fontSize: '13px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(252,43,90,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {loading
                ? <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'profileSpin 0.8s linear infinite', marginRight: '8px', verticalAlign: 'middle' }}></span>Saving...</>
                : <><i className="fas fa-save" style={{ marginRight: '6px' }}></i>Save Profile</>
              }
            </button>
          </div>
        </div>
      </div>
<style>
  {
    `
    .float-left {
    float: left !important;
}
    .breadcrumb {
    border-left: 1px solid #d6dce1;
    padding: .5rem 0 .5rem 1rem !important;
    }
    .breadcrumb-item a, .card-body a {
    color: #fc2b5a;
}
    html body .content .content-wrapper .content-header-title {
    color: #636363;
    font-weight: 500;
    margin-right: 1rem;
    padding-bottom: 10px;
}
    .card .card-title {
    font-size: 1rem !important;
    font-size: 1.32rem;
    font-weight: 500;
    letter-spacing: .05rem;
    margin-bottom: .5rem;
}
    `
  }
</style>
<style>
  {
    `
    input[type="text"],
input[type="email"],
input[type="number"],
input[type="tel"],
input[type="date"],
select {
  background-color: #fff;
  border: var(--bs-border-width) solid var(--bs-border-color);
  color: #333 !important;
}
.card {
    margin-bottom: 2.2rem;
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
    transition: all .3sease-in-out;
}
.card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid rgba(34, 41, 47, 0.125);
    border-radius: 0.5rem;
}
.bg-intext {
    background-color: #FC2B5A;
}
.new-bg-text {
    background-color: #FC2B5A !important;
    border-top-right-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
}
.float-left {
    float: left !important;
}
/* .breadcrumb .breadcrumb-item+.breadcrumb-item:before {
    content: "\e847";
    font-family: 'feather';
    color: #626262;
} */
.breadcrumb .breadcrumb-item+.breadcrumb-item:before {
    content: "\f105"; /* Arrow Right */
  font-family: "Font Awesome 6 Free";
  font-weight: 900; /* Solid icons = 900, Regular = 400 */
  color: #626262;
}
.breadcrumb-item+.breadcrumb-item::before {
    display: inline-block;
    padding-right: 0.5rem;
    color: #b8c2cc;
    content: "/";
}
.breadcrumb .breadcrumb-item+.breadcrumb-item {
    padding-left: 0;
}
.breadcrumb {
    font-size: 1rem;
    font-family: "Montserrat", Helvetica, Arial, serif;
    background-color: transparent;
    padding: 0.5rem 0 0.5rem 1rem !important;
    border-left: 1px solid #d6dce1;
    border-radius: 0;
}
.breadcrumbs-top .breadcrumb {
    margin: 0;
    padding: 0;
}

.breadcrumb>li+li::before {
    padding-right: .6rem;
    padding-left: .6rem;
}
a {
    color: #FC2B5A;
    text-decoration: none;
    background-color: transparent;
}
.mandatory {
    color: red;
}
label {
    font-size: 0.80rem !important;
}
@keyframes profileSpin {
  to { transform: rotate(360deg); }
}
.input-group {
    position: relative;
    display: flex
;
    flex-wrap: wrap;
    align-items: stretch;
    width: 100%;
}
#siteforcomp {
    height: 29px;

}

/* Floating Audio Button */
.floating-audio-btn {
position: absolute;
bottom: 0px;
right: 20px;
background-color: #fc2b5a;
color: white;
width: 130px;
height: 45px;
border-radius: 40px;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
cursor: pointer;
box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
z-index: 100;
transition: all 0.2s;
}

.floating-audio-btn:hover {
transform: translateY(-3px);
box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.floating-audio-btn i {
font-size: 18px;
}

/* Recording Modal Styles */
.recording-modal-overlay {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background-color: rgba(0, 0, 0, 0.5);
display: flex;
align-items: center;
justify-content: center;
z-index: 1000;
}

.recording-modal {
background-color: white;
border-radius: 10px;
width: 90%;
max-width: 600px;
max-height: 90vh;
overflow: hidden;
display: flex;
flex-direction: column;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.recording-modal .modal-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px 20px;
border-bottom: 1px solid #eee;
}

.recording-modal .modal-header h5 {
font-size: 18px;
margin: 0;
font-weight: 600;
}

.recording-modal .close-modal {
background: none;
border: none;
color: #555;
cursor: pointer;
font-size: 18px;
}

.recording-modal .modal-body {
padding: 20px;
flex: 1;
overflow-y: auto;
}

.recording-modal .modal-footer {
padding: 15px 20px;
border-top: 1px solid #eee;
text-align: right;
}

.btn-done {
background-color: #fc2b5a;
color: white;
border: none;
padding: 8px 20px;
border-radius: 4px;
cursor: pointer;
}

.btn-done:hover {
background-color: #e6255c;
}

/* The remaining recording controls and recording items
can use the same CSS you already have */

  /* Resume Builder Container */
.resume-builder-container {
max-width: 1200px;
margin: 0 auto;
padding: 30px;
background-color: #f9f9f9;
border-radius: 10px;
box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

/* Header */
.resume-builder-header {
text-align: center;
padding-bottom: 20px;
border-bottom: 1px solid #eee;
}

.resume-builder-title {
font-size: 28px;
font-weight: 700;
color: #333;
margin-bottom: 15px;
}

/* Profile Strength Meter */
.profile-strength-meter {
max-width: 600px;
margin: 20px auto;
padding: 15px;
background-color: #fff;
border-radius: 8px;
box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.strength-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 10px;
}

.strength-label {
font-size: 16px;
font-weight: 500;
color: #333;
}

.strength-badge {
font-size: 18px;
font-weight: 700;
color: #fc2b5a;
}

.strength-level {
font-size: 14px;
color: #666;
}

.progress {
height: 10px;
background-color: #e9ecef;
border-radius: 5px;
overflow: hidden;
}

.progress-bar {
height: 100%;
border-radius: 5px;
transition: width 0.3s ease;
}

/* Navigation Tabs */
.resume-tabs {
margin-bottom: 25px;
}

.nav-tabs {
border-bottom: 1px solid #ddd;
}

.nav-tabs .nav-link {
border: none;
border-bottom: 3px solid transparent;
border-radius: 0;
color: #555;
font-weight: 500;
padding: 12px 20px;
transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
border-color: transparent;
color: #fc2b5a;
background: none;
}

.nav-tabs .nav-link.active {
color: #fc2b5a;
border-color: #fc2b5a;
background: none;
}

/* Resume Content */
/* .resume-section {
display: none;
} */

.resume-section.active {
display: block;
}

.resume-paper {
background-color: #fff;
border-radius: 8px;
padding: 30px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

}

.section-title {
font-size: 20px;
font-weight: 600;
color: #333;
margin-bottom: 25px;
padding-bottom: 10px;
border-bottom: 2px solid #f1f1f1;
}

/* Personal Info */
.resume-header {
display: flex;
gap: 30px;
margin-bottom: 30px;
}

.profile-image-container {
flex-shrink: 0;
}

.profile-image {
width: 150px;
height: 150px;
border-radius: 50%;
overflow: hidden;
background-color: #f1f1f1;
display: flex;
align-items: center;
justify-content: center;
position: relative;
border: 3px solid #fff;
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.profile-image img {
width: 100%;
height: 100%;
object-fit: cover;
}

.profile-placeholder {
font-size: 60px;
color: #ccc;
}

.image-upload-overlay {
position: absolute;
bottom: 0;
left: 0;
right: 0;
background: rgba(0, 0, 0, 0.6);
color: white;
padding: 5px 0;
text-align: center;
cursor: pointer;
opacity: 0;
transition: opacity 0.3s;
}

.profile-image:hover .image-upload-overlay {
opacity: 1;
}

.profile-info {
flex: 1;
}

.profile-name {
font-size: 26px;
font-weight: 700;
color: #333;
margin-bottom: 8px;
}

.profile-title {
font-size: 18px;
color: #555;
margin-bottom: 15px;
}

.profile-summary {
font-size: 15px;
line-height: 1.5;
color: #666;
margin-bottom: 20px;
}

.contact-info {
display: flex;
flex-wrap: wrap;
gap: 15px;
}

.contact-item {
display: flex;
align-items: center;
gap: 8px;
font-size: 14px;
color: #555;
}

.contact-item i {
color: #fc2b5a;
}

/* Experience Section */
.experience-item, .education-item {
position: relative;
padding: 20px;
margin-bottom: 20px;
background-color: #f9f9f9;
border-radius: 8px;
border-left: 3px solid #fc2b5a;
}

.item-controls {
position: absolute;
top: 0px;
right: 10px;
}

.remove-button {
background: none;
border: none;
color: #dc3545;
cursor: pointer;
font-size: 16px;
}

.remove-button:hover {
color: #bd2130;
}

.job-title, .degree-select {
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 5px;
}

.company-name, .university {
font-size: 16px;
color: #555;
margin-bottom: 10px;
}

.date-range, .passing-year {
font-size: 14px;
color: #777;
margin-bottom: 15px;
display: flex;
align-items: center;
flex-wrap: wrap;
gap: 10px;
}

.date-label {
font-weight: 500;
}

.date-input {
border: 1px solid #ddd;
padding: 5px 10px;
border-radius: 4px;
}

.job-description, .additional-info {
background-color: #fff;
padding: 15px;
border-radius: 6px;
font-size: 14px;
line-height: 1.5;
color: #555;
}

/* Skills Section */
.skills-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 20px;
margin-bottom: 20px;
}

.skill-item {
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.skill-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 10px;
}

.skill-edit {
display: flex;
justify-content: space-between;
width: 100%;
margin-right: 10px;
}

.skill-name {
font-weight: 500;
color: #333;
}

.skill-level {
font-size: 14px;
color: #666;
}

.remove-skill {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

.skill-slider {
width: 100%;
}

/* Additional Sections */
.extras-section {
display: flex;
flex-direction: column;
gap: 30px;
}

.extra-category {
margin-bottom: 25px;
}

.category-title {
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 15px;
padding-bottom: 8px;
border-bottom: 1px solid #eee;
}

/* Languages */
.languages-list {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
gap: 15px;
margin-bottom: 20px;
}

.language-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 12px 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.language-details {
flex: 1;
}

.language-proficiency {
display: flex;
gap: 5px;
margin-top: 5px;
}

.proficiency-dot {
width: 12px;
height: 12px;
border-radius: 50%;
background-color: #ddd;
cursor: pointer;
}

.proficiency-dot.filled {
background-color: #fc2b5a;
}

.remove-language {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Certifications */
.certifications-list {
display: flex;
flex-direction: column;
gap: 15px;
margin-bottom: 20px;
}

.certificate-item {
display: flex;
justify-content: space-between;
align-items: flex-start;
padding-inline: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.certificate-details {
flex: 1;
}

.certificate-name {
font-weight: 500;
margin-bottom: 5px;
}

.certificate-issuer {
font-size: 14px;
color: #666;
}

.remove-certificate {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Projects */
.projects-list {
display: flex;
flex-direction: column;
gap: 15px;
margin-bottom: 20px;
}

.project-item {
display: flex;
justify-content: space-between;
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.project-details {
flex: 1;
}

.project-header {
display: flex;
justify-content: space-between;
margin-bottom: 10px;
}

.project-name {
font-weight: 500;
}

.project-year {
font-size: 14px;
color: #777;
}

.project-description {
font-size: 14px;
line-height: 1.5;
color: #555;
}

.remove-project {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Interests */
.interests-container {
margin-bottom: 20px;
}

.interests-tags {
display: flex;
flex-wrap: wrap;
gap: 10px;
margin-bottom: 15px;
}

.interest-tag {
display: flex;
align-items: center;
background-color: #f1f1f1;
border-radius: 30px;
padding: 6px 15px;
font-size: 14px;
}

.remove-interest {

margin-left: 8px;
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 18px;
position: absolute;
top: -6px;
right: 0px;
}

/* Declaration */
.declaration-container {
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.declaration-content {
font-size: 14px;
line-height: 1.5;
color: #555;
min-height: 60px;
}

/* Voice Recording */
.recording-container {
padding: 20px;
background-color: #f9f9f9;
border-radius: 8px;
}

.recording-controls {
text-align: center;
margin-bottom: 30px;
}

.recording-timer {
font-size: 36px;
font-weight: 700;
margin-bottom: 10px;
}

.recording-status {
margin-bottom: 20px;
color: #666;
min-height: 20px;
}

.control-buttons {
display: flex;
justify-content: center;
gap: 15px;
}

.record-button {
padding: 10px 20px;
background-color: #fc2b5a;
color: white;
border: none;
border-radius: 30px;
cursor: pointer;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.record-button:hover {
background-color: #e6255c;
}

.record-button.recording {
background-color: #dc3545;
animation: pulse 1.5s infinite;
}

@keyframes pulse {
0% { transform: scale(1); }
50% { transform: scale(1.05); }
100% { transform: scale(1); }
}

.recordings-list {
margin-top: 30px;
}

.recordings-list h5 {
margin-bottom: 15px;
font-size: 18px;
}

.no-recordings {
text-align: center;
padding: 20px;
color: #777;
font-style: italic;
}

.recording-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px;
background-color: #fff;
border-radius: 8px;
margin-bottom: 10px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recording-info {
flex: 1;
}

.recording-name {
font-weight: 500;
margin-bottom: 5px;
}

.recording-timestamp {
font-size: 12px;
color: #777;
}

.recording-actions {
display: flex;
align-items: center;
gap: 15px;
}

.audio-player {
height: 30px;
}

.delete-recording {
background: none;
border: none;
color: #dc3545;
cursor: pointer;
}

/* Add Button */
.add-button {
padding: 8px 16px;
background-color: #fc2b5a;
color: white;
border: none;
border-radius: 30px;
cursor: pointer;
font-size: 14px;
display: inline-flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.add-button:hover {
background-color: #e6255c;
}

/* Action Buttons */
.resume-actions {
margin-top: 30px;
display: flex;
justify-content: flex-end;
gap: 15px;
}

.upload-resume, .save-resume, .preview-resume {
padding: 10px 20px;
border-radius: 30px;
cursor: pointer;
font-size: 15px;
font-weight: 500;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.upload-resume {
background-color: #f8f9fa;
color: #333;
border: 1px solid #ddd;
}

.upload-resume:hover {
background-color: #e9ecef;
}

.save-resume {
background-color: #28a745;
color: white;
border: none;
}

.save-resume:hover {
background-color: #218838;
}

.preview-resume {
background-color: #fc2b5a;
color: white;
border: none;
}

.preview-resume:hover {
background-color: #e6255c;
}

/* Editable Content */
[contenteditable=true] {
min-height: 20px;
border: 1px solid transparent;
padding: 3px;
border-radius: 4px;
transition: border 0.2s;
min-width: 10%;
border: 1px solid #ddd;
}

[contenteditable=true]:hover {
border-color: #ddd;
}

[contenteditable=true]:focus {
outline: none;
border-color: #fc2b5a;
background-color: rgba(252, 43, 90, 0.05);
}

[contenteditable=true]:empty:before {
content: attr(data-placeholder);
color: #aaa;
cursor: text;
}
/* Remove Field Option Styling */
.field-container {
position: relative;
}

.remove-field-btn {
position: absolute;
top: 8px;
right: 8px;
background: none;
border: none;
color: #dc3545;
cursor: pointer;
font-size: 16px;
width: 24px;
height: 24px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 50%;
opacity: 0;
transition: opacity 0.2s, background-color 0.2s;
}

.field-container:hover .remove-field-btn {
opacity: 1;
}

.remove-field-btn:hover {
background-color: rgba(220, 53, 69, 0.1);
}

/* Add this to the existing field items */
.experience-item,
.education-item,
.skill-item,
.certificate-item,
.language-item,
.project-item,
.interest-tag {
position: relative;
}
/* Responsive Fixes */
@media (max-width: 768px) {
    .floating-audio-btn{
        top:-85px;
        right: 5px;
    }
.resume-builder-container {
padding: 15px;
}

.resume-header {
flex-direction: column;
align-items: center;
}

.profile-image-container {
margin-bottom: 20px;
}

.profile-info {
text-align: center;
}

.contact-info {
justify-content: center;
}

.skills-grid, .languages-list {
grid-template-columns: 1fr;
}

.recording-item {
flex-direction: column;
align-items: flex-start;
}

.recording-actions {
margin-top: 10px;
width: 100%;
}

.audio-player {
width: 100%;
}

.resume-actions {
flex-direction: column;
}

.upload-resume, .save-resume, .preview-resume {
width: 100%;
justify-content: center;
}
.field-wrapper {
position: relative;
}

.remove-btn {
position: absolute;
top: 6px;
right: 6px;
background: transparent;
border: none;
color: #dc3545;
font-size: 16px;
padding: 2px 6px;
border-radius: 50%;
opacity: 0;
transition: all 0.2s ease-in-out;
}

.field-wrapper:hover .remove-btn {
opacity: 1;
background-color: rgba(220, 53, 69, 0.1);
}
.resume-preview-modal {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.6);
z-index: 999;
display: flex;
justify-content: center;
align-items: center;
}

.resume-preview-content {
background-color: white;
padding: 30px;
border-radius: 12px;
max-height: 80vh;
overflow-y: auto;
width: 90%;
max-width: 600px;
}


}
/* Resume Preview Modal */
.resume-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .resume-preview-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 900px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  
  .resume-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .resume-preview-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  
  .close-preview {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #555;
  }
  
  .resume-preview-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #f5f5f5;
  }
  
  .resume-preview-actions {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  }
  
  .download-resume-btn, .close-preview-btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .download-resume-btn {
    background-color: #28a745;
    color: white;
    border: none;
  }
  
  .close-preview-btn {
    background-color: #f8f9fa;
    color: #333;
    border: 1px solid #ddd;
  }
  
  /* Resume Document Styling */
  .resume-document {
    background-color: white;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    font-family: 'Roboto', Arial, sans-serif;
  }
  
  .resume-document-header {
    margin-bottom: 30px;
  }
  
  .resume-profile-section {
    display: flex;
    gap: 25px;
    margin-bottom: 25px;
  }
  
  .resume-profile-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #f0f0f0;
  }
  
  .resume-profile-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    font-size: 50px;
    color: #aaa;
  }
  
  .resume-header-content {
    flex: 1;
  }
  
  .resume-name {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 5px 0;
    color: #333;
  }
  
  .resume-title {
    font-size: 18px;
    color: #666;
    margin: 0 0 15px 0;
  }
  
  .resume-contact-details {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .resume-contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #555;
  }
  
  .resume-contact-item i {
    color: #fc2b5a;
    font-size: 16px;
  }
  
  .resume-summary {
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 6px;
    margin-bottom: 30px;
  }
  
  .resume-summary p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #555;
  }
  
  .resume-document-body {
    display: flex;
    gap: 30px;
  }
  
  .resume-column {
    flex: 1;
  }
  
  .resume-left-column {
    border-right: 1px solid #eee;
    padding-right: 25px;
  }
  
  .resume-right-column {
    padding-left: 5px;
  }
  
  .resume-section {
    margin-bottom: 25px;
  }
  
  .resume-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #fc2b5a;
    margin: 0 0 15px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  
  .resume-experience-item, .resume-education-item, .resume-project-item {
    margin-bottom: 20px;
  }
  
  .resume-item-header {
    margin-bottom: 8px;
  }
  
  .resume-item-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 3px 0;
    color: #333;
  }
  
  .resume-item-subtitle {
    font-size: 14px;
    color: #666;
    margin: 0 0 3px 0;
  }
  
  .resume-item-period {
    font-size: 12px;
    color: #888;
    margin: 0;
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
    margin-bottom: 8px;
  }
  
  .resume-skill-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .resume-skill-bar-container {
    height: 6px;
    background-color: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .resume-skill-bar {
    height: 100%;
    background-color: #fc2b5a;
    border-radius: 3px;
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
    margin-bottom: 8px;
  }
  
  .resume-language-name {
    font-size: 14px;
    font-weight: 500;
  }
  
  .resume-language-level {
    display: flex;
    gap: 3px;
  }
  
  .resume-level-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #f0f0f0;
  }
  
  .resume-level-dot.filled {
    background-color: #fc2b5a;
  }
  
  .resume-certifications-list {
    padding-left: 20px;
    margin: 0;
    font-size: 14px;
    color: #555;
  }
  
  .resume-certifications-list li {
    margin-bottom: 8px;
  }
  
  .resume-project-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 5px 0;
  }
  
  .resume-project-year {
    font-size: 14px;
    font-weight: normal;
    color: #777;
  }
  
  .resume-interests-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .resume-interest-tag {
    display: inline-block;
    padding: 5px 12px;
    background-color: #f5f5f5;
    border-radius: 20px;
    font-size: 13px;
    color: #555;
  }
  
  .resume-declaration {
    border-top: 1px solid #eee;
    margin-top: 30px;
    padding-top: 20px;
  }
  
  .resume-declaration p {
    font-size: 14px;
    color: #555;
    line-height: 1.5;
    font-style: italic;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .resume-document {
      padding: 20px;
    }
    
    .resume-profile-section {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .resume-contact-details {
      justify-content: center;
    }
    
    .resume-document-body {
      flex-direction: column;
    }
    
    .resume-left-column {
      border-right: none;
      padding-right: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    .resume-right-column {
      padding-left: 0;
    }
  }
 

  .pac-container {
    z-index: 10000 !important;
    font-family: inherit !important;
    border-radius: 4px !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
    margin-top: 2px !important;
    background-color: #fff !important;
    border: 1px solid #d4d4d4 !important;
    max-height: 300px !important;
    overflow-y: auto !important;
  }

  /* Work Location Input Styling */
  #work-loc {
    color: #333 !important;
    background-color: #fff !important;
    font-size: 14px !important;
  }

  #work-loc::placeholder {
    color: #999 !important;
    opacity: 1;
    font-size: 14px !important;
  }

  /* Google Places Autocomplete Dropdown Styling */
  .pac-container .pac-item {
    color: #333 !important;
    font-size: 13px !important;
    padding: 8px 12px !important;
    cursor: pointer !important;
    border-top: 1px solid #e6e6e6 !important;
    line-height: 1.4 !important;
    min-height: 32px !important;
    display: flex !important;
    align-items: center !important;
  }

  .pac-container .pac-item:first-child {
    border-top: none !important;
  }

  .pac-container .pac-item:hover {
    background-color: #f1f1f1 !important;
  }

  /* Logo Upload Hover Effect */
  .image-upload label:hover .logo-hover-text {
    opacity: 1 !important;
  }

  .image-upload label:hover img.companylogo {
    opacity: 0.8 !important;
    border-color: #fc2b5a !important;
  }

  .remove-logo-btn:hover {
    background: #dc3545 !important;
    transform: scale(1.1);
    transition: all 0.2s;
  }

  .image-upload label {
    position: relative;
    display: inline-block;
  }

  .image-upload label:hover > div > .logo-hover-text {
    opacity: 1 !important;
  }
  }

  .pac-container .pac-item-selected {
    background-color: #e8f0fe !important;
  }

  .pac-container .pac-item-query {
    color: #333 !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    padding-right: 3px !important;
  }

  .pac-container .pac-icon {
    width: 15px !important;
    height: 20px !important;
    margin-right: 8px !important;
  }

  .pac-container .pac-matched {
    font-weight: 600 !important;
    color: #1a73e8 !important;
  }

  .pac-container .pac-item-query .pac-matched {
    color: #1a73e8 !important;
  }

  .pac-container .pac-item-text {
    font-size: 12px !important;
    color: #666 !important;
    margin-top: 2px !important;
  }

  .pac-container .pac-item-text .pac-matched {
    color: #1a73e8 !important;
    font-weight: 500 !important;
  }

  /* Hide "powered by Google" text if needed, or style it */
  .pac-container .pac-logo:after {
    font-size: 10px !important;
    color: #999 !important;
  }

  
    `
  }
</style>
    </>
  );
};

export default Profile;