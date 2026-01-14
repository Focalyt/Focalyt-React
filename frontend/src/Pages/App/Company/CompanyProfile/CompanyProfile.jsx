import React, { useState, useEffect, useRef } from 'react';

const CompanyProfile = () => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form data state
  const [concernedPerson, setConcernedPerson] = useState({
    name: '',
    email: '',
    mobile: '',
    whatsapp: '',
    designation: ''
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    email: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    headOAddress: '',
    description: '',
    stateId: '',
    cityId: '',
    place: '',
    latitude: '',
    longitude: '',
    zipcode: '',
    logo: '',
    mediaGallery: [],
    mediaGalleryVideo: ''
  });

  const [executives, setExecutives] = useState([
    { name: '', designation: '', image: '', linkedin: '' }
  ]);

  // Reference data
  const [industries, setIndustries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [mediaGalleryImages, setMediaGalleryImages] = useState([]);

  // Refs
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    initializeGoogleMaps();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch profile data and reference data
      const [profileResponse, industriesResponse, statesResponse] = await Promise.all([
        fetch(`${backendUrl}/company/myprofile`, {
          headers: { 'x-auth': token }
        }),
        fetch(`${backendUrl}/api/industries`, {
          headers: { 'x-auth': token }
        }),
        fetch(`${backendUrl}/api/states`, {
          headers: { 'x-auth': token }
        })
      ]);

      const profileData = await profileResponse.json();
      const industriesData = await industriesResponse.json();
      const statesData = await statesResponse.json();

      // Set form data
      if (profileData.user) {
        setConcernedPerson({
          name: profileData.user.name || '',
          email: profileData.user.email || '',
          mobile: profileData.user.mobile || '',
          whatsapp: profileData.user.whatsapp || profileData.user.mobile || '',
          designation: profileData.user.designation || ''
        });
      }

      if (profileData.company) {
        setCompanyInfo({
          name: profileData.company.name || '',
          industry: profileData.company._industry || '',
          email: profileData.company.email || '',
          linkedin: profileData.company.linkedin || '',
          twitter: profileData.company.twitter || '',
          facebook: profileData.company.facebook || '',
          headOAddress: profileData.company.headOAddress || '',
          description: profileData.company.description || '',
          stateId: profileData.company.stateId || '',
          cityId: profileData.company.cityId || '',
          place: profileData.company.place || '',
          latitude: profileData.company.latitude || '',
          longitude: profileData.company.longitude || '',
          zipcode: profileData.company.zipcode || '',
          logo: profileData.company.logo || '',
          mediaGallery: profileData.company.mediaGallery || [],
          mediaGalleryVideo: profileData.company.mediaGalleryVideo || ''
        });
        setMediaGalleryImages(profileData.company.mediaGallery || []);
      }

      if (profileData.company?.companyExecutives?.length > 0) {
        setExecutives(profileData.company.companyExecutives);
      }

      setIndustries(industriesData.industry || []);
      setStates(statesData.state || []);

      // Fetch cities if state is selected
      if (profileData.company?.stateId) {
        fetchCities(profileData.company.stateId);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleMaps = () => {
    if (window.google && window.google.maps) {
      const options = {
        componentRestrictions: { country: "in" },
        types: ["establishment"]
      };
      
      if (locationInputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          locationInputRef.current, 
          options
        );
        
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry) {
            setCompanyInfo(prev => ({
              ...prev,
              place: locationInputRef.current.value,
              latitude: place.geometry.location.lat().toString(),
              longitude: place.geometry.location.lng().toString()
            }));
          }
        });
      }
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/getcitiesbyId?stateId=${stateId}`, {
        headers: { 'x-auth': token }
      });
      const data = await response.json();
      setCities(data.cityValues || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleConcernedPersonChange = (field, value) => {
    setConcernedPerson(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }

    // Fetch cities when state changes
    if (field === 'stateId' && value) {
      fetchCities(value);
      setCompanyInfo(prev => ({ ...prev, cityId: '' })); // Reset city
    }
  };

  const handleExecutiveChange = (index, field, value) => {
    const updatedExecutives = [...executives];
    updatedExecutives[index] = { ...updatedExecutives[index], [field]: value };
    setExecutives(updatedExecutives);
  };

  const addExecutive = () => {
    setExecutives([...executives, { name: '', designation: '', image: '', linkedin: '' }]);
  };

  const uploadSingleFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${backendUrl}/api/uploadSingleFile`, {
      method: 'POST',
      headers: { 'x-auth': token },
      body: formData
    });
    
    return response.json();
  };

  const uploadMultipleFiles = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${backendUrl}/api/uploadMultipleFiles`, {
      method: 'POST',
      headers: { 'x-auth': token },
      body: formData
    });
    
    return response.json();
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      alert("Please upload a valid image (JPG, JPEG, PNG) under 2MB");
      event.target.value = '';
      return;
    }

    try {
      const result = await uploadSingleFile(file);
      if (result.status) {
        setCompanyInfo(prev => ({ ...prev, logo: result.data.Key }));
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };

  const handleMediaGalleryUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 5) {
      alert("You cannot upload more than 5 images");
      event.target.value = '';
      return;
    }

    // Validate all files
    for (let file of files) {
      if (!validateImageFile(file)) {
        alert("All files must be valid images (JPG, JPEG, PNG) under 2MB");
        event.target.value = '';
        return;
      }
    }

    try {
      const result = await uploadMultipleFiles(files);
      if (result.status) {
        const newImages = result.Data.map(img => img.Key);
        setMediaGalleryImages(prev => [...prev, ...newImages]);
        setCompanyInfo(prev => ({
          ...prev,
          mediaGallery: [...prev.mediaGallery, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Error uploading media gallery:', error);
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateVideoFile(file)) {
      alert("Please upload a valid video (MP4, MOV, AVI) under 10MB");
      event.target.value = '';
      return;
    }

    try {
      setSaving(true);
      const result = await uploadSingleFile(file); // Use same endpoint or create video-specific
      if (result.status) {
        setCompanyInfo(prev => ({ ...prev, mediaGalleryVideo: result.data.key }));
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExecutiveImageUpload = async (event, index) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      alert("Please upload a valid image (JPG, JPEG, PNG) under 2MB");
      event.target.value = '';
      return;
    }

    try {
      const result = await uploadSingleFile(file);
      if (result.status) {
        handleExecutiveChange(index, 'image', result.data.Key);
      }
    } catch (error) {
      console.error('Error uploading executive image:', error);
    }
  };

  const removeMediaImage = async (imageKey, index) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${backendUrl}/api/deleteSingleFile`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: imageKey })
      });

      const updatedImages = mediaGalleryImages.filter((_, i) => i !== index);
      setMediaGalleryImages(updatedImages);
      setCompanyInfo(prev => ({
        ...prev,
        mediaGallery: updatedImages
      }));
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const removeLogo = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${backendUrl}/api/deleteSingleFile`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: companyInfo.logo })
      });

      setCompanyInfo(prev => ({ ...prev, logo: '' }));
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  const removeVideo = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${backendUrl}/api/deleteSingleFile`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: companyInfo.mediaGalleryVideo })
      });

      setCompanyInfo(prev => ({ ...prev, mediaGalleryVideo: '' }));
    } catch (error) {
      console.error('Error removing video:', error);
    }
  };

  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  };

  const validateVideoFile = (file) => {
    const validTypes = ['video/mp4', 'video/mov', 'video/avi'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  };

  const validateForm = () => {
    const newErrors = {};

    // Concerned Person validation
    if (!concernedPerson.name.trim()) newErrors.name = true;
    if (!validateEmail(concernedPerson.email)) newErrors.email = true;
    if (!validateWhatsApp(concernedPerson.whatsapp)) newErrors.whatsapp = true;
    if (!concernedPerson.designation.trim()) newErrors.designation = true;

    // Company Info validation
    if (!companyInfo.name.trim()) newErrors.companyName = true;
    if (!companyInfo.industry) newErrors.industry = true;
    if (!companyInfo.stateId) newErrors.stateId = true;
    if (!companyInfo.cityId) newErrors.cityId = true;
    if (!companyInfo.place.trim()) newErrors.place = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWhatsApp = (number) => {
    return number && number.length === 10;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields correctly");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        concernedPerson,
        companyInfo,
        executiveinfo: executives
      };

      const response = await fetch(`${backendUrl}/company/myprofile`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Profile updated successfully!");
        window.location.reload();
      } else {
        alert("Error updating profile");
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
        {/* Breadcrumb */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Company Profile</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/company/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">Company Profile</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Concerned Person Section */}
        <section id="Concerned-Person">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Concerned Person</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Name <span className="mandatory"> *</span></label>
                        <input 
                          type="text" 
                          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                          value={concernedPerson.name}
                          onChange={(e) => handleConcernedPersonChange('name', e.target.value)}
                          maxLength="25"
                          required 
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Email<span className="mandatory"> *</span></label>
                        <input 
                          type="email" 
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          value={concernedPerson.email}
                          onChange={(e) => handleConcernedPersonChange('email', e.target.value)}
                          maxLength="50"
                          required 
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Contact Number<span className="mandatory"> *</span></label>
                        <input 
                          type="number" 
                          className="form-control"
                          value={concernedPerson.mobile}
                          disabled 
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>WhatsApp<span className="mandatory"> *</span></label>
                        <input 
                          type="tel" 
                          className={`form-control ${errors.whatsapp ? 'is-invalid' : ''}`}
                          value={concernedPerson.whatsapp}
                          onChange={(e) => handleConcernedPersonChange('whatsapp', e.target.value)}
                          maxLength="10"
                          required 
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Designation<span className="mandatory"> *</span></label>
                        <input 
                          className={`form-control ${errors.designation ? 'is-invalid' : ''}`}
                          type="text" 
                          value={concernedPerson.designation}
                          onChange={(e) => handleConcernedPersonChange('designation', e.target.value)}
                          maxLength="25"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Company Information Section */}
        <section id="companyinformation">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Company Information</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 mb-1">
                        <label>Company Name <span className="mandatory"> *</span></label>
                        <input 
                          type="text" 
                          className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                          value={companyInfo.name}
                          onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                          maxLength="30"
                          required 
                        />
                      </div>
                      <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 mb-1">
                        <label>Industry <span className="mandatory"> *</span></label>
                        <select 
                          className={`form-control text-capitalize ${errors.industry ? 'is-invalid' : ''}`}
                          value={companyInfo.industry}
                          onChange={(e) => handleCompanyInfoChange('industry', e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {industries.map(industry => (
                            <option key={industry._id} value={industry._id} className="text-capitalize">
                              {industry.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Email</label>
                        <input 
                          type="email" 
                          className="form-control"
                          value={companyInfo.email}
                          onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
                          maxLength="50"
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Linkedin URL</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={companyInfo.linkedin}
                          onChange={(e) => handleCompanyInfoChange('linkedin', e.target.value)}
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Twitter URL</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={companyInfo.twitter}
                          onChange={(e) => handleCompanyInfoChange('twitter', e.target.value)}
                          maxLength="100"
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Facebook URL</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={companyInfo.facebook}
                          onChange={(e) => handleCompanyInfoChange('facebook', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>HO Address</label>
                        <textarea 
                          className="form-control"
                          value={companyInfo.headOAddress}
                          onChange={(e) => handleCompanyInfoChange('headOAddress', e.target.value)}
                          rows="3"
                          maxLength="150"
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Description</label>
                        <textarea 
                          className="form-control"
                          value={companyInfo.description}
                          onChange={(e) => handleCompanyInfoChange('description', e.target.value)}
                          rows="3"
                          maxLength="500"
                        />
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>State <span className="mandatory"> *</span></label>
                        <select 
                          className={`form-control ${errors.stateId ? 'is-invalid' : ''}`}
                          value={companyInfo.stateId}
                          onChange={(e) => handleCompanyInfoChange('stateId', e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {states.map(state => (
                            <option key={state._id} value={state._id} className="text-capitalize">
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>City <span className="mandatory"> *</span></label>
                        <select 
                          className={`form-control ${errors.cityId ? 'is-invalid' : ''}`}
                          value={companyInfo.cityId}
                          onChange={(e) => handleCompanyInfoChange('cityId', e.target.value)}
                        >
                          <option value="">Select City</option>
                          {cities.map(city => (
                            <option key={city._id} value={city._id} className="text-capitalize">
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-xl-3" id="loc-field">
                        <label>Current Location<span className="mandatory"> *</span></label>
                        <div className="input-group mb-2">
                          <div className="input-group-prepend bg-locat">
                            <div className="input-group-text bg-intext">
                              <img src="/images/isist.png" alt="location" />
                            </div>
                          </div>
                          <input 
                            ref={locationInputRef}
                            type="text" 
                            className={`form-control ${errors.place ? 'is-invalid' : ''}`}
                            value={companyInfo.place}
                            onChange={(e) => handleCompanyInfoChange('place', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 mb-1">
                        <label>Zipcode</label>
                        <input 
                          type="number" 
                          className="form-control"
                          value={companyInfo.zipcode}
                          onChange={(e) => handleCompanyInfoChange('zipcode', e.target.value)}
                          maxLength="6"
                        />
                      </div>
                    </div>

                    {/* Media Gallery */}
                    <div className="row mt-2">
                      <div className="col-xl-12">
                        <h5>Media Gallery</h5>
                      </div>
                      
                      {/* Logo Upload */}
                      <div className="col-xl-1 col-lg-1 col-md-1 col-sm-2 col-2 mb-1 mt-1" style={{alignSelf: 'center'}}>
                        <div className="image-upload">
                          {companyInfo.logo ? (
                            <>
                              <label style={{cursor: 'pointer'}}>
                                <img 
                                  src={`${bucketUrl}/${companyInfo.logo}`}
                                  className="pointer companylogo" 
                                  height="auto" 
                                  width="60%" 
                                  alt="Company Logo"
                                />
                              </label>
                              <i 
                                className="feather icon-x remove_uploaded_pic" 
                                style={{color:'red', cursor: 'pointer'}}
                                onClick={removeLogo}
                              />
                              <p>Company Logo</p>
                            </>
                          ) : (
                            <>
                              <label htmlFor="uploadlogo" style={{cursor: 'pointer'}}>
                                <img 
                                  className="custom-cursor-pointer default" 
                                  src="/images/add_receipt.png" 
                                  width="80" 
                                  height="auto" 
                                  alt="Upload Logo"
                                />
                              </label>
                              <p className="mt-1 custom-cursor-pointer">Upload logo</p>
                            </>
                          )}
                          <input 
                            id="uploadlogo" 
                            type="file" 
                            className="my-logo-uploader form-control" 
                            style={{display:'none'}}
                            onChange={handleLogoUpload}
                            accept="image/*"
                          />
                        </div>
                      </div>

                      {/* Media Gallery Images */}
                      {mediaGalleryImages.map((image, index) => (
                        <div key={index} className="col-xl-1 col-lg-1 col-md-1 col-sm-2 col-3 mb-1 galleryImage" style={{alignSelf: 'center'}}>
                          <div className="image-upload">
                            <img 
                              src={`${bucketUrl}/${image}`} 
                              height="auto" 
                              width="60%" 
                              className="pointer img-fluid" 
                              alt="Gallery"
                            />
                            <i 
                              className="feather icon-x remove_uploaded_pic" 
                              style={{color:'red', cursor: 'pointer'}}
                              onClick={() => removeMediaImage(image, index)}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Upload Gallery Button */}
                      <div className="col-xl-1 col-lg-1 col-md-1 col-sm-2 col-3 mb-1" style={{alignSelf: 'center'}}>
                        <div className="image-upload">
                          <label htmlFor="media-group">
                            <img src="/images/icons/jd_one.png" className="pointer img-fluid" alt="Upload" />
                          </label>
                          <input 
                            id="media-group" 
                            type="file" 
                            multiple 
                            onChange={handleMediaGalleryUpload}
                            accept="image/*"
                          />
                        </div>
                        <label>Workplace Pics</label>
                      </div>

                      {/* Video Upload */}
                      <div className="col-xl-1 col-lg-1 col-md-1 col-sm-2 col-3 mb-1" style={{alignSelf: 'center'}}>
                        {companyInfo.mediaGalleryVideo ? (
                          <div>
                            <a 
                              target="_blank" 
                              href={`${bucketUrl}/${companyInfo.mediaGalleryVideo}`}
                              className="pointer img-fluid" 
                              style={{whiteSpace: 'nowrap'}}
                              rel="noopener noreferrer"
                            >
                              Uploaded Video
                            </a>
                            <i 
                              className="feather icon-x remove_uploaded_pic" 
                              style={{color:'red', cursor: 'pointer'}}
                              onClick={removeVideo}
                            />
                          </div>
                        ) : (
                          <div className="image-upload videoupload">
                            <label htmlFor="workspace-video">
                              <img src="/images/icons/jd_two.png" className="pointer img-fluid" alt="Upload Video" />
                            </label>
                            <input 
                              type="file" 
                              id="workspace-video" 
                              onChange={handleVideoUpload}
                              accept="video/*"
                            />
                            <label>Workplace Video</label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Company Executive Section */}
        <section id="executiveinfo">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Add Your HR Team</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div id="executivelist">
                      {executives.map((executive, index) => (
                        <div key={index} className="row executiverow">
                          <div className="col-xl-2 col-lg-4 mb-1">
                            <label>Name</label>
                            <input 
                              className="form-control" 
                              type="text" 
                              value={executive.name}
                              onChange={(e) => handleExecutiveChange(index, 'name', e.target.value)}
                              maxLength="25"
                            />
                          </div>
                          <div className="col-xl-2 col-lg-4 mb-1">
                            <label>Designation</label>
                            <input 
                              className="form-control" 
                              type="text" 
                              value={executive.designation}
                              onChange={(e) => handleExecutiveChange(index, 'designation', e.target.value)}
                              maxLength="25"
                            />
                          </div>
                          <div className="col-xl-2 col-lg-4 mb-1">
                            <label>Image</label>
                            {executive.image ? (
                              <div>
                                <img 
                                  src={`${bucketUrl}/${executive.image}`}
                                  className="pointer" 
                                  height="60" 
                                  width="80" 
                                  alt="Executive"
                                />
                              </div>
                            ) : (
                              <input 
                                className="form-control" 
                                type="file"
                                onChange={(e) => handleExecutiveImageUpload(e, index)}
                                accept="image/*"
                              />
                            )}
                          </div>
                          <div className="col-xl-2 mb-1">
                            <label>Linkedin URL</label>
                            <input 
                              className="form-control" 
                              type="text" 
                              value={executive.linkedin}
                              onChange={(e) => handleExecutiveChange(index, 'linkedin', e.target.value)}
                            />
                          </div>
                          {index === 0 && (
                            <div className="col-xl-2 my-auto">
                              <button 
                                className="btn btn-success text-white" 
                                onClick={addExecutive}
                                type="button"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="row">
                      <div className="col-xl-12 col-lg-4 col-md-4 col-sm-6 col-8 mt-xl-2 mt-lg-2 mt-md-2 text-right">
                        <button 
                          className="btn btn-danger px-xl-3 px-lg-2 px-md-2 px-sm-2" 
                          onClick={handleReset}
                          type="button"
                        >
                          Reset
                        </button>
                        <button 
                          className="btn btn-success text-white ml-xl-2 ml-md-1 ml-sm-2 ml-lg-2 px-xl-3 px-lg-2 px-md-2 px-sm-2" 
                          onClick={handleSave}
                          disabled={saving}
                          type="button"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
     
    </>
  );
};

export default CompanyProfile;