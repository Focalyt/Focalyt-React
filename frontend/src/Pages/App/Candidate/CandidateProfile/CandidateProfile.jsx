import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { usePlacesWidget } from 'react-google-autocomplete';
import "./CandidateProfile.css"
const backendUrl = process.env.REACT_APP_BASE_URL;

const CandidateProfile = () => {
  const navigate = useNavigate();
  const [preloaderVisible, setPreloaderVisible] = useState(false);
  const [candidate, setCandidateData] = useState({
    name: '',
    mobile: '',
    email: '',
    sex: '',
    dob: '',
    whatsapp: '',
    address: '',
    state: '',
    city: '',
    pincode: '',
    place: '',
    latitude: '',
    longitude: '',
    image: '',
    resume: '',
    profilevideo: '',
    highestQualification: '',
    yearOfPassing: '',
    isExperienced: false,
    totalExperience: '',
    qualifications: [],
    experiences: [],
    techSkills: [],
    nonTechSkills: [],
    locationPreferences: []
  });
  
  const [formData, setFormData] = useState({
    personalInfo: {},
    qualifications: [],
    technicalskills: [],
    nontechnicalskills: [],
    locationPreferences: [],
    experiences: [],
    highestQualification: '',
    yearOfPassing: '',
    totalExperience: '',
    isExperienced: false
  });
  
  const [formOptions, setFormOptions] = useState({
    states: [],
    cities: [],
    qualifications: [],
    subQualifications: [],
    universities: [],
    industries: [],
    subIndustries: [],
    technicalSkills: [],
    nonTechnicalSkills: []
  });
  
  const [errors, setErrors] = useState({
    message: '',
    visible: false
  });
  
  const [cashbackModal, setCashbackModal] = useState({
    visible: false,
    isProfileCompleted: false,
    isVideoCompleted: false,
    totalCashback: 0,
    cashbackInfo: {
      profilecomplete: 0,
      videoprofile: 0,
      apply: 0
    }
  });

  // References for Google Maps places
  const { ref: workLocationRef } = usePlacesWidget({
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    options: {
      componentRestrictions: { country: "in" },
      types: ["establishment"]
    },
    onPlaceSelected: (place) => {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          place: place.formatted_address,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }
      }));
    }
  });

  useEffect(() => {
    // Fetch candidate data and form options when component mounts
    fetchCandidateData();
    fetchFormOptions();
  }, []);

  const fetchCandidateData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backendUrl}/candidate/profile`, {
        headers: { 'x-auth': token }
      });
      
      if (response.data.status) {
        const candidateData = response.data.candidate;
        setCandidateData(candidateData);
        
        // Initialize form data with candidate data
        setFormData({
          personalInfo: {
            name: candidateData.name || '',
            mobile: candidateData.mobile || '',
            email: candidateData.email || '',
            sex: candidateData.sex || '',
            dob: candidateData.dob ? new Date(candidateData.dob).toISOString().slice(0, 10) : '',
            whatsapp: candidateData.whatsapp || candidateData.mobile || '',
            address: candidateData.address || '',
            state: candidateData.state?._id || '',
            city: candidateData.city || '',
            pincode: candidateData.pincode || '',
            place: candidateData.place || '',
            latitude: candidateData.latitude || '',
            longitude: candidateData.longitude || '',
            image: candidateData.image || '',
            resume: candidateData.resume || '',
            profilevideo: candidateData.profilevideo || ''
          },
          qualifications: candidateData.qualifications || [],
          technicalskills: candidateData.techSkills || [],
          nontechnicalskills: candidateData.nonTechSkills || [],
          locationPreferences: candidateData.locationPreferences || [],
          experiences: candidateData.experiences || [],
          highestQualification: candidateData.highestQualification || '',
          yearOfPassing: candidateData.yearOfPassing || '',
          totalExperience: candidateData.totalExperience || '',
          isExperienced: candidateData.isExperienced || false
        });
      }
    } catch (error) {
      console.error('Error fetching candidate data:', error);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backendUrl}/candidate/form-options`, {
        headers: { 'x-auth': token }
      });
      
      if (response.data) {
        setFormOptions({
          states: response.data.states || [],
          cities: response.data.cities || [],
          qualifications: response.data.qualifications || [],
          subQualifications: response.data.subQualifications || [],
          universities: response.data.universities || [],
          industries: response.data.industries || [],
          subIndustries: response.data.subIndustries || [],
          technicalSkills: response.data.technicalSkills || [],
          nonTechnicalSkills: response.data.nonTechnicalSkills || []
        });
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
    }
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value
      }
    }));
  };

  const handleExperienceChange = (e) => {
    const { value } = e.target;
    if (value === 'Fresher') {
      setFormData(prev => ({
        ...prev,
        isExperienced: false,
        experiences: []
      }));
    } else if (value === 'Experienced') {
      setFormData(prev => ({
        ...prev,
        isExperienced: true
      }));
    }
  };


  const handleQualificationChange = (index, e) => {
    const { name, value } = e.target;
    const updatedQualifications = [...formData.qualifications];
    
    if (!updatedQualifications[index]) {
      updatedQualifications[index] = {};
    }
    
    updatedQualifications[index][name] = value;
    
    setFormData(prev => ({
      ...prev,
      qualifications: updatedQualifications
    }));
    
    // If qualification ID changed, fetch sub-qualifications
    if (name === 'Qualification') {
      fetchSubQualifications(value, index);
    }
  };

  const handleExperienceDetailChange = (index, e) => {
    const { name, value } = e.target;
    const updatedExperiences = [...formData.experiences];
    
    if (!updatedExperiences[index]) {
      updatedExperiences[index] = {};
    }
    
    updatedExperiences[index][name] = value;
    
    setFormData(prev => ({
      ...prev,
      experiences: updatedExperiences
    }));
  };

  const fetchCitiesByState = async (stateId, fieldType, index) => {
    try {
      const response = await axios.get(`${backendUrl}/candidate/getcitiesbyId`, {
        params: { stateId }
      });
      
      if (response.data && response.data.cityValues) {
        // Update cities in form options
        const cities = response.data.cityValues;
        setFormOptions(prev => ({
          ...prev,
          cities: cities
        }));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleStateChange = (e, fieldType, index) => {
    const stateId = e.target.value;
    
    if (fieldType === 'personal') {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          state: stateId,
          city: '' // Reset city when state changes
        }
      }));
    } else if (fieldType === 'location') {
      const updatedLocationPreferences = [...formData.locationPreferences];
      
      if (!updatedLocationPreferences[index]) {
        updatedLocationPreferences[index] = {};
      }
      
      updatedLocationPreferences[index].state = stateId;
      updatedLocationPreferences[index].city = ''; // Reset city
      
      setFormData(prev => ({
        ...prev,
        locationPreferences: updatedLocationPreferences
      }));
    } else if (fieldType === 'experience') {
      const updatedExperiences = [...formData.experiences];
      
      if (!updatedExperiences[index]) {
        updatedExperiences[index] = {};
      }
      
      updatedExperiences[index].Company_State = stateId;
      updatedExperiences[index].Company_City = ''; // Reset city
      
      setFormData(prev => ({
        ...prev,
        experiences: updatedExperiences
      }));
    }
    
    // Fetch cities for the selected state
    fetchCitiesByState(stateId);
  };

  const handleSkillChange = (type, index, e) => {
    const { value } = e.target;
    const field = type === 'technical' ? 'technicalskills' : 'nontechnicalskills';
    
    const updatedSkills = [...formData[field]];
    
    if (!updatedSkills[index]) {
      updatedSkills[index] = {};
    }
    
    updatedSkills[index].skillId = value;
    
    setFormData(prev => ({
      ...prev,
      [field]: updatedSkills
    }));
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file based on type
    if (!validateFile(file, fileType)) {
      return;
    }
    
    setPreloaderVisible(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const endpoint = fileType === 'video' ? '/api/uploadVideo' : '/api/uploadSingleFile';
      
      const response = await axios.post(`${backendUrl}${endpoint}`, formData, {
        headers: { 
          'x-auth': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPreloaderVisible(false);
      
      if (response.data.status) {
        const key = response.data.data.Key;
        
        // Update form data based on file type
        if (fileType === 'image') {
          setFormData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              image: key
            }
          }));
        } else if (fileType === 'resume') {
          setFormData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              resume: key
            }
          }));
        } else if (fileType === 'video') {
          setFormData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              profilevideo: key
            }
          }));
        } else if (fileType === 'techSkill' || fileType === 'nonTechSkill') {
          // Extract index from id if it's a skill video
          const fieldName = fileType === 'techSkill' ? 'technicalskills' : 'nontechnicalskills';
          const index = parseInt(e.target.id.replace(fileType, ''));
          
          const updatedSkills = [...formData[fieldName]];
          if (!updatedSkills[index]) {
            updatedSkills[index] = { skillId: '' };
          }
          
          updatedSkills[index].upload_url = key;
          
          setFormData(prev => ({
            ...prev,
            [fieldName]: updatedSkills
          }));
        }
      }
    } catch (error) {
      setPreloaderVisible(false);
      console.error(`Error uploading ${fileType}:`, error);
    }
  };

  const validateFile = (file, fileType) => {
    const fileName = file.name;
    const fileSize = file.size;
    
    if (fileType === 'image') {
      // Validate image file
      const validImageTypes = /\.(jpg|jpeg|png)$/i;
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!validImageTypes.test(fileName)) {
        alert("Please upload the image in jpg, jpeg or png format");
        return false;
      }
      
      if (fileSize > maxSize) {
        alert("Uploaded image should be less than 2MB");
        return false;
      }
    } else if (fileType === 'resume') {
      // Validate resume file
      const validResumeTypes = /\.(docx|doc|pdf|jpg|jpeg|png)$/i;
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validResumeTypes.test(fileName)) {
        alert("Please upload the resume in .docx, .doc, .jpg, .jpeg, .png or pdf format");
        return false;
      }
      
      if (fileSize > maxSize) {
        alert("Uploaded resume size should be less than 5MB");
        return false;
      }
    } else if (fileType === 'video' || fileType === 'techSkill' || fileType === 'nonTechSkill') {
      // Validate video file
      const validVideoTypes = /\.(mp4|mov|avi)$/i;
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validVideoTypes.test(fileName)) {
        alert("Please upload the video in mp4, mov or avi format");
        return false;
      }
      
      if (fileSize > maxSize) {
        alert("Uploaded video should be less than 10MB");
        return false;
      }
    }
    
    return true;
  };


  const addExperienceRow = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, {}]
    }));
  };

  const deleteExperienceRow = (index) => {
    const updatedExperiences = [...formData.experiences];
    updatedExperiences.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      experiences: updatedExperiences
    }));
  };

  const handleLocationPreferenceChange = (index, e) => {
    const { name, value } = e.target;
    const updatedLocationPreferences = [...formData.locationPreferences];
    
    if (!updatedLocationPreferences[index]) {
      updatedLocationPreferences[index] = {};
    }
    
    updatedLocationPreferences[index][name] = value;
    
    setFormData(prev => ({
      ...prev,
      locationPreferences: updatedLocationPreferences
    }));
  };

  const removeUploadedFile = async (fileType) => {
    try {
      let key = '';
      
      if (fileType === 'image') {
        key = formData.personalInfo.image;
      } else if (fileType === 'resume') {
        key = formData.personalInfo.resume;
      } else if (fileType === 'video') {
        key = formData.personalInfo.profilevideo;
      }
      
      if (!key) return;
      
      const token = localStorage.getItem('token');
      
      // Delete file from storage
      await axios.post(`${backendUrl}/api/deleteSingleFile`, { key }, {
        headers: { 'x-auth': token }
      });
      
      // Update database record
      const endpoint = 
        fileType === 'image' ? '/candidate/removelogo' : 
        fileType === 'resume' ? '/candidate/removeResume' : 
        '/candidate/removeVideo';
      
      await axios.post(`${backendUrl}${endpoint}`, { key }, {
        headers: { 'x-auth': token }
      });
      
      // Update form data
      if (fileType === 'image') {
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            image: ''
          }
        }));
      } else if (fileType === 'resume') {
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            resume: ''
          }
        }));
      } else if (fileType === 'video') {
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            profilevideo: ''
          }
        }));
      }
    } catch (error) {
      console.error(`Error removing ${fileType}:`, error);
    }
  };

  const removeSkillVideo = (type, index) => {
    const field = type === 'technical' ? 'technicalskills' : 'nontechnicalskills';
    const updatedSkills = [...formData[field]];
    
    if (updatedSkills[index]) {
      updatedSkills[index].upload_url = '';
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: updatedSkills
    }));
  };

  const validateForm = () => {
    // Reset errors
    setErrors({
      message: '',
      visible: false
    });
    
    const {
      name, whatsapp, pincode, email, sex, address, state, city, place, dob
    } = formData.personalInfo;
    
    const { highestQualification, isExperienced } = formData;
    
    let isValid = true;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      setErrors({
        message: "Candidate name is required!",
        visible: true
      });
      return false;
    }
    
    // Validate WhatsApp number
    if (!whatsapp || whatsapp.trim() === '' || whatsapp.length !== 10) {
      setErrors({
        message: "WhatsApp Number must be 10 Digits!",
        visible: true
      });
      return false;
    }
    
    // Validate pincode
    if (!pincode || pincode.trim() === '' || pincode.length !== 6) {
      setErrors({
        message: "Pincode must be 6 Digits!",
        visible: true
      });
      return false;
    }
    
    // Validate email
    const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    if (email && email.trim() !== '' && !emailRegex.test(email)) {
      setErrors({
        message: "Personal Email not Valid!",
        visible: true
      });
      return false;
    }
    
    // Validate other required fields
    if (!sex || !address || !state || !city || !place || !dob) {
      setErrors({
        message: "Please fill all required fields!",
        visible: true
      });
      return false;
    }
    
    // Validate highest qualification
    if (!highestQualification) {
      setErrors({
        message: "Please select highest qualification!",
        visible: true
      });
      return false;
    }
    
    // Validate experience selection
    if (isExperienced === undefined) {
      setErrors({
        message: "Please select experience status!",
        visible: true
      });
      return false;
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setPreloaderVisible(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${backendUrl}/candidate/myprofile`, formData, {
        headers: { 'x-auth': token }
      });
      
      setPreloaderVisible(false);
      
      if (response.data.status) {
        setErrors({
          message: response.data.message,
          visible: true
        });
        
        // Show cashback modal if applicable
        if (response.data.isProfileCompleted || response.data.isVideoCompleted) {
          setCashbackModal({
            visible: true,
            isProfileCompleted: response.data.isProfileCompleted,
            isVideoCompleted: response.data.isVideoCompleted,
            totalCashback: response.data.totalCashback[0]?.totalAmount || 0,
            cashbackInfo: {
              profilecomplete: response.data.cashback?.profilecomplete || 0,
              videoprofile: response.data.cashback?.videoprofile || 0,
              apply: response.data.cashback?.apply || 0
            }
          });
        }
      }
    } catch (error) {
      setPreloaderVisible(false);
      console.error('Error saving profile:', error);
      setErrors({
        message: "An error occurred while saving your profile.",
        visible: true
      });
    }
  };

  const handleReset = () => {
    // Reset form to original candidate data
    fetchCandidateData();
  };

  const closeCashbackModal = () => {
    setCashbackModal(prev => ({
      ...prev,
      visible: false
    }));
  };
  const [loading, setLoading] = useState(false);
  
  // Form data state
  const [qualificationData, setQualificationData] = useState({
    highestQualification: '',
    yearOfPassing: '',
    qualifications: []
  });
  
  // Options for dropdowns
  const [options, setOptions] = useState({
    qualifications: [],
    subQualifications: [],
    universities: []
  });
  
  // Fetch initial data when component mounts
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Update UI when highest qualification changes
  useEffect(() => {
    handleHighestQualificationChange();
  }, [qualificationData.highestQualification]);
  
  // Fetch all required data for qualification section
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch candidate profile data
      const profileResponse = await axios.get(`${backendUrl}/candidate/profile`, {
        headers: { 'x-auth': token }
      });
      
      if (profileResponse.data.status && profileResponse.data.candidate) {
        const candidate = profileResponse.data.candidate;
        
        // Set candidate qualification data
        setQualificationData({
          highestQualification: candidate.highestQualification || '',
          yearOfPassing: candidate.yearOfPassing || '',
          qualifications: candidate.qualifications?.length > 0 ? candidate.qualifications : []
        });
      }
      
      // Fetch qualification options
      const optionsResponse = await axios.get(`${backendUrl}/candidate/form-options`, {
        headers: { 'x-auth': token }
      });
      
      if (optionsResponse.data) {
        setOptions({
          qualifications: optionsResponse.data.qualifications || [],
          subQualifications: optionsResponse.data.subQualifications || [],
          universities: optionsResponse.data.universities || []
        });
      }
    } catch (error) {
      console.error('Error fetching qualification data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle highest qualification change
  const handleHighestQualificationChange = () => {
    const { highestQualification } = qualificationData;
    
    if (!highestQualification) return;
    
    const selectedQualification = options.qualifications.find(q => q._id === highestQualification);
    
    if (!selectedQualification) return;
    
    // For basic qualifications (Upto 5th, 10th, 12th), only show year of passing
    if (['Upto 5th', '10th', '12th'].includes(selectedQualification.name.trim())) {
      setQualificationData(prev => ({
        ...prev,
        qualifications: []
      }));
      document.getElementById('addmore')?.style.setProperty('display', 'none');
    } else {
      // For higher qualifications, show detailed qualification form
      if (qualificationData.qualifications.length === 0) {
        setQualificationData(prev => ({
          ...prev,
          qualifications: [{}]
        }));
      }
      
      document.getElementById('addmore')?.style.setProperty('display', 'block');
    }
  };
  
  // Handle input change for main qualification fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQualificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle qualification row input changes
  const handleQualificationInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedQualifications = [...qualificationData.qualifications];
    
    if (!updatedQualifications[index]) {
      updatedQualifications[index] = {};
    }
    
    updatedQualifications[index][name] = value;
    
    setQualificationData(prev => ({
      ...prev,
      qualifications: updatedQualifications
    }));
    
    // If qualification ID changed, fetch sub-qualifications
    if (name === 'Qualification') {
      fetchSubQualifications(value);
    }
  };
  
  // Fetch sub-qualifications based on qualification ID
  const fetchSubQualifications = async (qualificationId) => {
    if (!qualificationId) return;
    
    try {
      const response = await axios.get(`${backendUrl}/candidate/getSubQualification`, {
        params: { qualificationId }
      });
      
      if (response.data.status) {
        setOptions(prev => ({
          ...prev,
          subQualifications: response.data.subQualification || []
        }));
      }
    } catch (error) {
      console.error('Error fetching sub-qualifications:', error);
    }
  };
  
  // Add new qualification row
  const addQualificationRow = () => {
    setQualificationData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, {}]
    }));
  };
  
  // Delete qualification row
  const deleteQualificationRow = (index) => {
    const updatedQualifications = [...qualificationData.qualifications];
    updatedQualifications.splice(index, 1);
    
    setQualificationData(prev => ({
      ...prev,
      qualifications: updatedQualifications
    }));
  };
  
  // Handle college location changes
  const initCollegeLocationAutocomplete = (element) => {
    if (!window.google || !element) return;
    
    const options = {
      componentRestrictions: { country: "in" },
      types: ["establishment"]
    };
    
    const autocomplete = new window.google.maps.places.Autocomplete(element, options);
    
    autocomplete.addListener('place_changed', function() {
      const place = autocomplete.getPlace();
      const row = element.closest('.qua-row');
      
      if (row) {
        const placeInput = row.querySelector('.cllgPlace');
        const latInput = row.querySelector('.cllgLatitude');
        const lngInput = row.querySelector('.cllgLongitude');
        
        if (placeInput) placeInput.value = element.value;
        if (latInput) latInput.value = place.geometry?.location.lat() || '';
        if (lngInput) lngInput.value = place.geometry?.location.lng() || '';
      }
    });
  };
  
  // Initialize Google Maps autocomplete for new college location fields
  useEffect(() => {
    const elements = document.querySelectorAll('.college-loc');
    elements.forEach(element => {
      initCollegeLocationAutocomplete(element);
    });
  }, [qualificationData.qualifications]);
  return (
    
    <div className="">
      {preloaderVisible && <div id="preloader"></div>}
      
      <div className="content-overlay"></div>
      <div className="header-navbar-shadow"></div>
      <div className="content-wrapper">
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Your Profile</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="/candidate/dashboard">Home</a></li>
                    <li className="breadcrumb-item"><a href="#">Your Profile</a></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="content-body">
          {/* Personal Information Section */}
          <section id="personal-info">
            <div className="row">
              <div className="col-xl-12 col-lg-12">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Personal Information</h4>
                  </div>
                  <div className="card-content">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-xl-3 mb-1" id="pd-name">
                          <label>Name / नाम<span className="mandatory"> *</span></label>
                          <input 
                            type="text" 
                            name="name" 
                            className="form-control" 
                            value={formData.personalInfo.name || ''} 
                            onChange={handlePersonalInfoChange}
                            maxLength={15}
                          />
                        </div>
                        <div className="col-xl-2 mb-1">
                          <label>Mobile / मोबाइल<span className="mandatory"> *</span></label>
                          <input 
                            type="number" 
                            name="mobile" 
                            className="form-control" 
                            value={formData.personalInfo.mobile || ''} 
                            readOnly
                          />
                        </div>
                        <div className="col-xl-3 mb-1" id="pd-email">
                          <label>Email / ईमेल</label>
                          <input 
                            type="email" 
                            name="email" 
                            className="form-control" 
                            value={formData.personalInfo.email || ''} 
                            onChange={handlePersonalInfoChange}
                            maxLength={30}
                          />
                        </div>
                        <div className="col-xl-2 mb-1" id="pd-gender">
                          <label>Gender / लिंग<span className="mandatory"> *</span></label>
                          <select 
                            className="form-control" 
                            name="sex" 
                            value={formData.personalInfo.sex || ''} 
                            onChange={handlePersonalInfoChange}
                          >
                            <option value="">Please select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="col-xl-2 mb-1" id="dob-field">
                          <label>Date of Birth / जन्म तिथि<span className="mandatory"> *</span></label>
                          <input 
                            type="date" 
                            name="dob" 
                            className="form-control" 
                            value={formData.personalInfo.dob || ''} 
                            onChange={handlePersonalInfoChange}
                          />
                        </div>
                        <div className="col-xl-3 mb-1" id="pd-number">
                          <label>WhatsApp Number / व्हाट्सएप नंबर<span className="mandatory"> *</span></label>
                          <input 
                            type="tel" 
                            maxLength={10} 
                            name="whatsapp" 
                            className="form-control" 
                            value={formData.personalInfo.whatsapp || formData.personalInfo.mobile || ''}
                            onChange={handlePersonalInfoChange}
                          />
                        </div>
                        <div className="col-xl-3 mb-1" id="pd-address">
                          <label>Address / पता<span className="mandatory"> *</span></label>
                          <input 
                            type="text" 
                            name="address" 
                            className="form-control" 
                            value={formData.personalInfo.address || ''} 
                            onChange={handlePersonalInfoChange}
                            maxLength={50}
                          />
                        </div>
                        <div className="col-xl-3 mb-1" id="pd-state">
                          <label>State / राज्य<span className="mandatory"> *</span></label>
                          <select 
                            className="form-control" 
                            name="state" 
                            value={formData.personalInfo.state || ''} 
                            onChange={(e) => handleStateChange(e, 'personal')}
                          >
                            <option value="">Select Option</option>
                            {formOptions.states.map(state => (
                              <option key={state._id} value={state._id} className="text-capitalize">
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-xl-3 mb-1" id="city-div">
                          <label>City / शहर<span className="mandatory"> *</span></label>
                          <select 
                            className="form-control" 
                            name="city" 
                            value={formData.personalInfo.city || ''} 
                            onChange={handlePersonalInfoChange}
                          >
                            <option value="">Select City</option>
                            {formOptions.cities.map(city => (
                              formData.personalInfo.state === city.stateId && (
                                <option key={city._id} value={city._id} className="text-capitalize">
                                  {city.name}
                                </option>
                              )
                            ))}
                          </select>
                        </div>
                        <div className="col-xl-6 mb-1">
                          <label htmlFor="work-loc">Current Location<span className="mandatory"> *</span></label>
                          <div className="input-group">
                            <div className="input-group-prepend bg-locat">
                              <div className="input-group-text bg-intext new-bg-text">
                                <img src="/Assets/images/isist.png" id="siteforcomp" alt="location" />
                              </div>
                            </div>
                            <input 
                              type="text" 
                              className="form-control" 
                              id="work-loc" 
                              ref={workLocationRef}
                              value={formData.personalInfo.place || ''} 
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  personalInfo: {
                                    ...prev.personalInfo,
                                    place: e.target.value
                                  }
                                }));
                              }}
                            />
                            <input type="hidden" id="place" name="place" value={formData.personalInfo.place || ''} className="form-control" />
                            <input type="hidden" id="latitude" name="latitude" value={formData.personalInfo.latitude || ''} className="form-control" />
                            <input type="hidden" id="longitude" name="longitude" value={formData.personalInfo.longitude || ''} className="form-control" />
                          </div>
                        </div>
                        <div className="col-xl-3 mb-1" id="pd-pincode">
                          <label>Pincode / पिन कोड<span className="mandatory"> *</span></label>
                          <input 
                            type="number" 
                            name="pincode" 
                            className="form-control" 
                            id="candidate-pincode" 
                            maxLength={6}
                            value={formData.personalInfo.pincode || ''}
                            onChange={handlePersonalInfoChange}
                          />
                        </div>
                        <div className="col-xl-3 mb-1">
                          <label>Upload image / तस्विर अपलोड करे</label>
                          {formData.personalInfo.image ? (
                            <div>
                              <a href={`${process.env.REACT_APP_BUCKET_URL}/${formData.personalInfo.image}`} target="_blank" rel="noopener noreferrer">
                                Uploaded image
                              </a>
                              <i 
                                className="feather icon-x remove_uploaded_pic" 
                                style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }}
                                onClick={() => removeUploadedFile('image')}
                              ></i>
                            </div>
                          ) : (
                            <input 
                              type="file" 
                              className="form-control" 
                              id="candidate-file"
                              onChange={(e) => handleFileUpload(e, 'image')}
                            />
                          )}
                        </div>
                        <div className="col-xl-3 mb-1">
                          <label>Upload resume / रिज्यूमे अपलोड करें</label>
                          {formData.personalInfo.resume ? (
                            <div>
                              <a href={`${process.env.REACT_APP_BUCKET_URL}/${formData.personalInfo.resume}`} target="_blank" rel="noopener noreferrer">
                                Uploaded resume
                              </a>
                              <i 
                                className="feather icon-x remove_uploaded_pic" 
                                style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }}
                                onClick={() => removeUploadedFile('resume')}
                              ></i>
                            </div>
                          ) : (
                            <input 
                              type="file" 
                              className="form-control" 
                              id="uploadresume"
                              onChange={(e) => handleFileUpload(e, 'resume')}
                            />
                          )}
                        </div>
                        <div className="col-xl-3 mb-1">
                          <label>Add Video Profile / वीडियो प्रोफाइल जोड़ें</label>
                          {formData.personalInfo.profilevideo ? (
                            <div className="profilevideo">
                              <a 
                                href={`${process.env.REACT_APP_BUCKET_URL}/${formData.personalInfo.profilevideo}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                id="uploadedvideo"
                              >
                                Uploaded Video
                              </a>
                              <i 
                                className="feather icon-x remove_uploaded_pic" 
                                style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }}
                                onClick={() => removeUploadedFile('video')}
                              ></i>
                            </div>
                          ) : (
                            <input 
                              type="file" 
                              className="form-control" 
                              id="uploadVideo"
                              onChange={(e) => handleFileUpload(e, 'video')}
                            />
                          )}
                        </div>
                        <div className="col-xl-3 mb-1">
                          <label>Sample Video Profile / वीडियो प्रोफाइल नमूना</label>
                          <div>
                            <a href="/sampleVideoProfile" target="_blank" rel="noopener noreferrer">View / देखे</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Qualification Section */}
          <section id="qualification">
      <div className="row">
        <div className="col-xl-12 col-lg-12">
          <div className="card">
            <div className="card-header border border-top-0 border-left-0 border-right-0">
              <h4 className="card-title pb-1">Qualification</h4>
            </div>
            <div className="card-content">
              <div className="card-body">
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row" id="qualification-section">
                    <div className="col-xl-4 ml-1 mb-1" id="highestQuali">
                      <label>Highest Qualification / अपनी उच्चतम योग्यता का चयन करें<span className="mandatory"> *</span></label>
                      <select 
                        className="form-control single-field" 
                        name="highestQualification"
                        id="quali"
                        value={qualificationData.highestQualification}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Highest Qualification</option>
                        {options.qualifications.map(qualification => (
                          <option key={qualification._id} value={qualification._id} className="text-capitalize">
                            {qualification.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div id="qualification-div" className="col-xl-12 mb-1">
                      {/* For basic qualifications (Upto 5th, 10th, 12th) */}
                      {qualificationData.highestQualification && 
                       ['Upto 5th', '10th', '12th'].includes(
                         options.qualifications.find(q => q._id === qualificationData.highestQualification)?.name?.trim()
                       ) && (
                        <div>
                          <label>Year of Passing / उत्तीर्ण होने का वर्ष</label>
                          <select 
                            className="form-control single-field" 
                            name="yearOfPassing"
                            id="yearPassing"
                            value={qualificationData.yearOfPassing}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Year</option>
                            {Array.from({ length: 25 }, (_, i) => 2023 - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* For higher qualifications */}
                      {qualificationData.qualifications && qualificationData.qualifications.length > 0 && 
                       !['Upto 5th', '10th', '12th'].includes(
                         options.qualifications.find(q => q._id === qualificationData.highestQualification)?.name?.trim()
                       ) && 
                       qualificationData.qualifications.map((qualification, index) => (
                        <div key={index} className="row px-1 qua-row">
                          <div className="col-xl-4">
                            <label>Year of Passing / उत्तीर्ण होने का वर्ष</label>
                            <select 
                              className="form-control" 
                              name="PassingYear"
                              value={qualification.PassingYear || ''}
                              onChange={(e) => handleQualificationInputChange(index, e)}
                            >
                              <option value="">Select Year</option>
                              {Array.from({ length: 25 }, (_, i) => 2023 - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="col-xl-4 mb-1">
                            <label>Qualification / योग्यता</label>
                            <select 
                              className="form-control" 
                              name="Qualification"
                              value={qualification.Qualification || ''}
                              onChange={(e) => handleQualificationInputChange(index, e)}
                            >
                              <option value="">Select Qualification</option>
                              {options.qualifications
                                .filter(q => q.basic !== true)
                                .map(qual => (
                                  <option key={qual._id} value={qual._id} className="text-capitalize">
                                    {qual.name}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          
                          <div className="col-xl-4 mb-1">
                            <label>Stream / उप योग्यता</label>
                            <select 
                              className="form-control text-capitalize subqualification" 
                              name="subQualification"
                              value={qualification.subQualification || ''}
                              onChange={(e) => handleQualificationInputChange(index, e)}
                            >
                              <option value="">Select Subqualification</option>
                              {options.subQualifications
                                .filter(sq => sq._qualification === qualification.Qualification)
                                .map(subQual => (
                                  <option key={subQual._id} value={subQual._id} className="text-capitalize">
                                    {subQual.name}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          
                          <div className="col-xl-4 mb-1">
                            <label>College Name / कॉलेज का नाम</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              name="College"
                              value={qualification.College || ''}
                              onChange={(e) => handleQualificationInputChange(index, e)}
                              maxLength={50}
                            />
                          </div>
                          
                          <div className="col-xl-4 mb-1">
                            <label>University Name / विश्वविद्यालय का नाम</label>
                            <select 
                              className="form-control text-capitalize" 
                              name="University"
                              value={qualification.University || ''}
                              onChange={(e) => handleQualificationInputChange(index, e)}
                            >
                              <option value="">Select University</option>
                              {options.universities.map(university => (
                                <option key={university._id} value={university._id} className="text-capitalize">
                                  {university.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="col-xl-4 mb-1">
                            <label>Assessment Type / मूल्यांकन प्रकार</label>
                            <select 
                              className="form-control" 
                              name="AssessmentType"
                              value={qualification.AssessmentType || ''}
                              onChange={(e) => handleQualificationInputChange(index, e)}
                            >
                              <option value="">Select Option</option>
                              <option value="CGPA">CGPA</option>
                              <option value="Percentage">Percentage</option>
                              <option value="Grade">Grade</option>
                            </select>
                          </div>
                          
                          <div className="col-xl-4 mb-1">
                            <label>Enter Value / मूल्य दर्ज करें</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Enter CGPA, Percentage or Grade" 
                              name="Result"
                              value={qualification.Result || ''}
                              onChange={(e) => handleQualificationInputChange(index, e)}
                              maxLength={4}
                            />
                          </div>
                          
                          <div className="col-xl-4 mb-1">
                            <label htmlFor="college-loc">College Location</label>
                            <div className="input-group mb-2">
                              <div className="input-group-prepend bg-locat">
                                <div className="input-group-text bg-intext">
                                  <img src="/images/isist.png" id="siteforcomp" alt="location icon" />
                                </div>
                              </div>
                              <input 
                                type="text" 
                                className="form-control college-loc" 
                                id={`college-loc-${index}`}
                                value={qualification.collegePlace || ''}
                                onChange={(e) => handleQualificationInputChange(index, {
                                  target: {
                                    name: 'collegePlace',
                                    value: e.target.value
                                  }
                                })}
                              />
                              <input 
                                type="hidden" 
                                className="form-control cllgPlace" 
                                name="collegePlace" 
                                value={qualification.collegePlace || ''} 
                              />
                              <input 
                                type="hidden" 
                                className="form-control cllgLatitude" 
                                name="collegeLatitude" 
                                value={qualification.collegeLatitude || ''} 
                              />
                              <input 
                                type="hidden" 
                                className="form-control cllgLongitude" 
                                name="collegeLongitude" 
                                value={qualification.collegeLongitude || ''} 
                              />
                            </div>
                          </div>
                          
                          {index >= 1 && (
                            <div className="d-flex flex-row-reverse deletequalification">
                              <div className="col my-auto">
                                <button 
                                  className="btn btn-danger waves-effect waves-light"
                                  onClick={() => deleteQualificationRow(index)}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div 
                      id="addmore" 
                      style={{ 
                        display: 
                          qualificationData.qualifications && 
                          qualificationData.qualifications.length > 0 && 
                          !['Upto 5th', '10th', '12th'].includes(
                            options.qualifications.find(q => q._id === qualificationData.highestQualification)?.name?.trim()
                          ) ? 'block' : 'none' 
                      }}
                      className="col-12"
                    >
                      <button 
                        onClick={addQualificationRow}
                        className="btn btn-success waves-effect waves-light text-white mt-2"
                        type="button"
                      >
                        + Add Another
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
          
          {/* Skills Section */}
          <section id="skills-and-profile">
            <div className="row">
              <div className="col-xl-6 col-lg-6">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Technical Skills / तकनीकी कौशल</h4>
                  </div>
                  <div className="card-content">
                    <div className="card-body" id="Technical-skills-section">
                      <div className="col-xl-12 px-0">
                        {[0, 1, 2, 3].map(index => (
                          <div key={`tech-${index}`} className="row mb-1 skillrow">
                            <div className="col-xl-6">
                              <label>Select Skills / कौशल का चयन करें</label>
                              <select 
                                className="form-control text-capitalize chosen" 
                                name="techskill"
                                value={formData.technicalskills[index]?.skillId || ''}
                                onChange={(e) => handleSkillChange('technical', index, e)}
                              >
                                <option value="">Select skill</option>
                                {formOptions.technicalSkills.map(skill => (
                                  <option key={skill._id} value={skill._id} className="text-capitalize">
                                    {skill.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-xl-6">
                              {formData.technicalskills[index]?.upload_url ? (
                                <div>
                                  <br />
                                  <a 
                                    id="uploadedvideo" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    href={`${process.env.REACT_APP_BUCKET_URL}/${formData.technicalskills[index].upload_url}`}
                                    className="pointer img-fluid"
                                  >
                                    Uploaded Video
                                  </a>
                                  <i 
                                    className="feather icon-x remove_uploaded_pic" 
                                    style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }}
                                    onClick={() => removeSkillVideo('technical', index)}
                                  ></i>
                                </div>
                              ) : (
                                <>
                                  <label>Upload video / विडियो को अपलोड करें</label>
                                  <input 
                                    type="file" 
                                    id={`techSkill${index}`} 
                                    className="form-control"
                                    onChange={(e) => handleFileUpload(e, 'techSkill')}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-6 col-lg-6">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Non Technical Skills / गैर तकनीकी कौशल</h4>
                  </div>
                  <div className="card-content">
                    <div className="card-body" id="non-technical-skills-section">
                      <div className="col-xl-12 px-0">
                        {[0, 1, 2, 3].map(index => (
                          <div key={`nontech-${index}`} className="row mb-1 skillrow">
                            <div className="col-xl-6">
                              <label>Select Skills / कौशल का चयन करें</label>
                              <select 
                                className="form-control text-capitalize chosen" 
                                name="nontechskill"
                                value={formData.nontechnicalskills[index]?.skillId || ''}
                                onChange={(e) => handleSkillChange('nonTechnical', index, e)}
                              >
                                <option value="">Select skill</option>
                                {formOptions.nonTechnicalSkills.map(skill => (
                                  <option key={skill._id} value={skill._id} className="text-capitalize">
                                    {skill.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-xl-6">
                              {formData.nontechnicalskills[index]?.upload_url ? (
                                <div>
                                  <br />
                                  <a 
                                    id="uploadedvideo" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    href={`${process.env.REACT_APP_BUCKET_URL}/${formData.nontechnicalskills[index].upload_url}`}
                                    className="pointer img-fluid"
                                  >
                                    Uploaded Video
                                  </a>
                                  <i 
                                    className="feather icon-x remove_uploaded_pic" 
                                    style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }}
                                    onClick={() => removeSkillVideo('nonTechnical', index)}
                                  ></i>
                                </div>
                              ) : (
                                <>
                                  <label>Upload video / विडियो को अपलोड करें</label>
                                  <input 
                                    type="file" 
                                    id={`nonTechSkill${index}`} 
                                    className="form-control"
                                    onChange={(e) => handleFileUpload(e, 'nonTechSkill')}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Experience Section */}
          <section id="Experience-section">
            <div className="row">
              <div className="col-xl-12 col-lg-12">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Experience / अनुभव</h4>
                  </div>
                  <div className="card-content">
                    <div className="card-body">
                      <div className="row" id="exp-section">
                        <div className="col-xl-3 mb-1" id="isExp">
                          <label>Experience / अनुभव<span className="mandatory"> *</span></label>
                          <select 
                            className="form-control" 
                            name="experience"
                            value={formData.isExperienced ? 'Experienced' : 'Fresher'}
                            onChange={handleExperienceChange}
                          >
                            <option value="">Select Experience</option>
                            <option value="Fresher">Fresher</option>
                            <option value="Experienced">Experienced</option>
                          </select>
                        </div>
                        
                        {formData.isExperienced && (
                          <div className="col-xl-3 mb-1" id="total-exp">
                            <label>Total experience (yrs) / कुल अनुभव (वर्ष)</label>
                            <input 
                              type="number" 
                              name="totalExperience" 
                              className="form-control"
                              value={formData.totalExperience || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, totalExperience: e.target.value }))}
                            />
                          </div>
                        )}
                        
                        <div id="experience-div" className="col-xl-12">
                          {formData.isExperienced && formData.experiences && formData.experiences.map((experience, index) => (
                            <div key={`exp-${index}`} className="row px-1 exp-row">
                              <div className="col-xl-3 mb-1">
                                <label>From Date / तिथि से</label>
                                <input 
                                  type="date" 
                                  className="form-control" 
                                  name="FromDate"
                                  value={experience.FromDate || ''}
                                  onChange={(e) => handleExperienceDetailChange(index, e)}
                                />
                              </div>
                              <div className="col-xl-3 mb-1">
                                <label>To Date / तिथि तक</label>
                                <input 
                                  type="date" 
                                  className="form-control" 
                                  name="ToDate"
                                  value={experience.ToDate || ''}
                                  onChange={(e) => handleExperienceDetailChange(index, e)}
                                />
                              </div>
                              <div className="col-xl-3 mb-1">
                                <label>Industry / उद्योग</label>
                                <select 
                                  className="form-control text-capitalize" 
                                  name="Industry_Name"
                                  value={experience.Industry_Name || ''}
                                  onChange={(e) => handleExperienceDetailChange(index, e)}
                                >
                                  <option value="">Select Industry</option>
                                  {formOptions.industries.map(industry => (
                                    <option key={industry._id} value={industry._id} className="text-capitalize">
                                      {industry.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-xl-3 mb-1">
                                <label>Sub Industry / उप उद्योग</label>
                                <select 
                                  className="form-control text-capitalize" 
                                  name="SubIndustry_Name"
                                  value={experience.SubIndustry_Name || ''}
                                  onChange={(e) => handleExperienceDetailChange(index, e)}
                                >
                                  <option value="">Select Sub Industry</option>
                                  {formOptions.subIndustries.map(subIndustry => (
                                    <option key={subIndustry._id} value={subIndustry._id} className="text-capitalize">
                                      {subIndustry.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-xl-3 mb-1">
                                <label>Company name / कंपनी का नाम</label>
                                <input 
                                  type="text" 
                                  name="Company_Name" 
                                  className="form-control"
                                  value={experience.Company_Name || ''}
                                  onChange={(e) => handleExperienceDetailChange(index, e)}
                                  maxLength={50}
                                />
                              </div>
                              <div className="col-xl-3 mb-1">
                                <label>State / राज्य</label>
                                <select 
                                  className="form-control" 
                                  name="Company_State"
                                  value={experience.Company_State || ''}
                                  onChange={(e) => handleStateChange(e, 'experience', index)}
                                >
                                  <option value="">Select State</option>
                                  {formOptions.states.map(state => (
                                    <option key={state._id} value={state._id} className="text-capitalize">
                                      {state.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-xl-3 mb-1">
                                <label>City / शहर</label>
                                <select 
                                  className="form-control" 
                                  name="Company_City"
                                  value={experience.Company_City || ''}
                                  onChange={(e) => handleExperienceDetailChange(index, e)}
                                >
                                  <option value="">Select City</option>
                                  {formOptions.cities.map(city => (
                                    experience.Company_State === city.stateId && (
                                      <option key={city._id} value={city._id} className="text-capitalize">
                                        {city.name}
                                      </option>
                                    )
                                  ))}
                                </select>
                              </div>
                              <div className="col-xl-3 mb-1">
                                <label>Comments / टिप्पणियाँ</label>
                                <input 
                                  type="text" 
                                  name="Comments" 
                                  className="form-control"
                                  value={experience.Comments || ''}
                                  onChange={(e) => handleExperienceDetailChange(index, e)}
                                />
                              </div>
                              {index >= 1 && (
                                <div className="col-xl-12 text-right deleteexperience">
                                  <div className="my-auto">
                                    <button 
                                      className="btn btn-danger waves-effect waves-light"
                                      onClick={() => deleteExperienceRow(index)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {formData.isExperienced && (
                          <div className="col-xl-12 text-right" id="addmoreexp">
                            <button 
                              onClick={addExperienceRow}
                              className="btn btn-success waves-effect waves-light text-white mt-2"
                            >
                              + Add Another
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Location Preferences Section */}
          <section id="location-preference">
            <div className="row">
              <div className="col-xl-12 col-lg-12">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Location Preferences / स्थान का चयन</h4>
                  </div>
                  <div className="card-content">
                    <div className="card-body">
                      {[0, 1, 2].map(index => (
                        <div key={`loc-${index}`} className="row locationpref">
                          <div className="d-flex align-items-center gap-5">
                          <div className="my-auto">
                            <label className="font-weight-bold">Location {index+1}</label>
                          </div>
                          <div className="col-xl-3 mb-1">
                            <label>State / राज्य</label>
                            <select 
                              className="form-control" 
                              name="state"
                              value={formData.locationPreferences[index]?.state || ''}
                              onChange={(e) => handleStateChange(e, 'location', index)}
                            >
                              <option value="">Select State</option>
                              {formOptions.states.map(state => (
                                <option key={state._id} value={state._id} className="text-capitalize">
                                  {state.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-xl-3 mb-1" id={`city-div${index}`}>
                            <label>City / शहर</label>
                            <select 
                              className="form-control" 
                              name="city"
                              value={formData.locationPreferences[index]?.city || ''}
                              onChange={(e) => handleLocationPreferenceChange(index, e)}
                            >
                              <option value="">Select City</option>
                              {formOptions.cities.map(city => (
                                formData.locationPreferences[index]?.state === city.stateId && (
                                  <option key={city._id} value={city._id} className="text-capitalize prefcitylist">
                                    {city.name}
                                  </option>
                                )
                              ))}
                            </select>
                          </div>
                          </div>
                          
                        </div>
                      ))}
                      
                      <div className="row">
                        <div className="col-xl-12 text-right">
                          <button 
                            className="btn btn-danger waves-effect waves-light"
                            onClick={handleReset}
                          >
                            Reset
                          </button>
                          <button 
                            className="btn btn-success waves-effect waves-light text-white ml-2"
                            onClick={handleSubmit}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                      
                      {errors.visible && (
                        <div className="row">
                          <div className="col-xl-12">
                            <div id="msg" style={{ color: 'red' }}>
                              {errors.message}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* Cashback Modal */}
      {cashbackModal.visible && (
        <div className="modal fade show" id="cashbackmodal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content modal-sm">
              <div className="modal-header vchr_header">
                <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">Congratulations</h5>
                <button type="button" className="close color-purple" onClick={closeCashbackModal}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body p-0">
                <form className="my-3">
                  <h3 className="coupon-text">
                    You have earned <strong id="money-text">₹ {cashbackModal.totalCashback}</strong> /आपने <strong id="money-text-hindi">₹ {cashbackModal.totalCashback}</strong> कमाए हैं|
                  </h3>
                  
                  {cashbackModal.isProfileCompleted === 'false' && (
                    <div id="profile-comp">
                      <p id="video-text">
                        You have earn ₹ {cashbackModal.cashbackInfo.profilecomplete} for completing profile / आपने प्रोफाइल पूरा करने के लिए ₹ {cashbackModal.cashbackInfo.profilecomplete} कमाए हैं|
                      </p>
                    </div>
                  )}
                  
                  {cashbackModal.isVideoCompleted === '' && (
                    <div id="upload-video">
                      <p id="video-text" className="mx-2">
                        Upload the video and earn ₹ {cashbackModal.cashbackInfo.videoprofile} / वीडियो अपलोड करें और ₹ {cashbackModal.cashbackInfo.videoprofile} कमाएं |
                      </p>
                      <a href="/candidate/myProfile#personal-info" id="a-profile">
                        <button 
                          type="button" 
                          className="voucher-btn btn btn-sm ml-1" 
                          aria-label="upload-video"
                        >
                          <span aria-hidden="true" className="yes-cross">Upload video / वीडियो अपलोड</span>
                        </button>
                      </a>
                    </div>
                  )}
                  
                  {cashbackModal.isProfileCompleted !== 'false' && cashbackModal.isVideoCompleted !== '' && (
                    <div id="apply-job">
                      <h3 id="video-text">
                        Apply on the jobs and earn ₹ {cashbackModal.cashbackInfo.apply} / नौकरियों पर आवेदन करें और ₹ {cashbackModal.cashbackInfo.apply} कमाएं|
                      </h3>
                      <a href="/candidate/searchjob">
                        <button type="button" className="voucher-btn btn btn-sm ml-1">
                          <span aria-hidden="true" className="yes-cross">Apply now / अप्लाई करें</span>
                        </button>
                      </a>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;



// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const CandidateProfile = () => {
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

//   // State for form data
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     mobile: "",
//     gender: "",
//     dob: "",
//     address: "",
//     state: "",
//     city: "",
//     pincode: "",
//     highestQualification: "",
//     experience: "",
//     profilePic: "",
//     resume: "",
//     profileVideo: "",
//   });

//   // State for lists (dropdowns)
//   const [states, setStates] = useState([]);
//   const [cities, setCities] = useState([]);
//   const [qualifications, setQualifications] = useState([]);

//   // State for messages
//   const [errorMessage, setErrorMessage] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   // Fetch Initial Data (States, Qualifications)
//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const statesRes = await axios.get(`${backendUrl}/candidate/states`);
//         const qualsRes = await axios.get(`${backendUrl}/candidate/qualifications`);
//         setStates(statesRes.data);
//         setQualifications(qualsRes.data);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     }
//     fetchData();
//   }, []);

//   // Handle Input Change
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Handle State Change (Fetch Cities)
//   const handleStateChange = async (e) => {
//     const selectedState = e.target.value;
//     setFormData({ ...formData, state: selectedState, city: "" });

//     try {
//       const response = await axios.get(`${backendUrl}/candidate/cities?state=${selectedState}`);
//       setCities(response.data);
//     } catch (error) {
//       console.error("Error fetching cities:", error);
//     }
//   };

//   // Handle File Upload
//   const handleFileUpload = async (e, field) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const response = await axios.post(`${backendUrl}/upload`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setFormData((prev) => ({ ...prev, [field]: response.data.filePath }));
//     } catch (error) {
//       console.error("File upload error:", error);
//     }
//   };

//   // Handle Form Submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validation
//     if (!formData.name || !formData.mobile || !formData.gender || !formData.dob || !formData.state || !formData.city) {
//       setErrorMessage("All required fields must be filled.");
//       return;
//     }

//     setErrorMessage("");
//     setSuccessMessage("");

//     try {
//       const response = await axios.post(`${backendUrl}/candidate/myprofile`, formData, {
//         headers: { "x-auth": localStorage.getItem("token") },
//       });

//       if (response.data.status) {
//         setSuccessMessage(response.data.message);
//       } else {
//         setErrorMessage(response.data.message);
//       }
//     } catch (error) {
//       setErrorMessage("Something went wrong. Please try again.");
//     }
//   };

//   return (
//     <div className="container mt-4">
//       <h3 className="mb-3">Your Profile</h3>

//       {/* Form Start */}
//       <form onSubmit={handleSubmit}>
//         <div className="row">
//           {/* Name */}
//           <div className="col-md-4 mb-3">
//             <label>Name *</label>
//             <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
//           </div>

//           {/* Mobile */}
//           <div className="col-md-4 mb-3">
//             <label>Mobile *</label>
//             <input type="number" className="form-control" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
//           </div>

//           {/* Email */}
//           <div className="col-md-4 mb-3">
//             <label>Email</label>
//             <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
//           </div>

//           {/* Gender */}
//           <div className="col-md-3 mb-3">
//             <label>Gender *</label>
//             <select className="form-control" name="gender" value={formData.gender} onChange={handleInputChange} required>
//               <option value="">Select Gender</option>
//               <option value="Male">Male</option>
//               <option value="Female">Female</option>
//             </select>
//           </div>

//           {/* Date of Birth */}
//           <div className="col-md-3 mb-3">
//             <label>Date of Birth *</label>
//             <input type="date" className="form-control" name="dob" value={formData.dob} onChange={handleInputChange} required />
//           </div>

//           {/* Address */}
//           <div className="col-md-6 mb-3">
//             <label>Address *</label>
//             <input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} required />
//           </div>

//           {/* State Selection */}
//           <div className="col-md-3 mb-3">
//             <label>State *</label>
//             <select className="form-control" name="state" value={formData.state} onChange={handleStateChange} required>
//               <option value="">Select State</option>
//               {states.map((state) => (
//                 <option key={state._id} value={state._id}>{state.name}</option>
//               ))}
//             </select>
//           </div>

//           {/* City Selection */}
//           <div className="col-md-3 mb-3">
//             <label>City *</label>
//             <select className="form-control" name="city" value={formData.city} onChange={handleInputChange} required>
//               <option value="">Select City</option>
//               {cities.map((city) => (
//                 <option key={city._id} value={city._id}>{city.name}</option>
//               ))}
//             </select>
//           </div>

//           {/* Pincode */}
//           <div className="col-md-3 mb-3">
//             <label>Pincode *</label>
//             <input type="number" className="form-control" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
//           </div>

//           {/* Profile Picture Upload */}
//           <div className="col-md-3 mb-3">
//             <label>Upload Profile Picture</label>
//             <input type="file" className="form-control" onChange={(e) => handleFileUpload(e, "profilePic")} />
//           </div>

//           {/* Resume Upload */}
//           <div className="col-md-3 mb-3">
//             <label>Upload Resume</label>
//             <input type="file" className="form-control" onChange={(e) => handleFileUpload(e, "resume")} />
//           </div>
//         </div>

//         {/* Error & Success Messages */}
//         {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
//         {successMessage && <div className="alert alert-success">{successMessage}</div>}

//         {/* Submit Button */}
//         <button type="submit" className="btn btn-success">Save Profile</button>
//       </form>
//     </div>
//   );
// };

// export default CandidateProfile;




// import React , {useState , useEffect}from 'react';
// import axios from 'axios';
// import moment from 'moment';
// import "./CandidateProfile.css";
// import NotificationModal from "../../../../Component/Layouts/App/Candidates/NotificationModel/NotificationModel";
// import SendSMSModal from '../../../../Component/Layouts/App/Candidates/NotificationModel/NotificationModel';
// import FilterForm from '../../../../Component/Layouts/App/Candidates/FilterForm/FilterForm';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faUser as faUserRegular,
//   faFile,
//   faPaperPlane,
//   faMap,
//   faHand,
//   faBookmark,
//   faMoneyBill1,
//   faCirclePlay,
//   faShareFromSquare,
//   faBell,
// } from "@fortawesome/free-regular-svg-icons";

// import {
//   faArrowDown,
//   faArrowUp,
//   faCircleCheck,
//   faFileText,
//   faEdit,
//   faLogIn,
//   faRightToBracket,
//   faSignIn
// } from "@fortawesome/free-solid-svg-icons";
// const CandidatrProfile = () => {
  
//   const [candidates, setCandidates] = useState([]);
//   const [count, setCount] = useState(0);
//   const [isChecked, setIsChecked] = useState(false);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [sortingOrder, setSortingOrder] = useState(-1);
//   const [sortingValue, setSortingValue] = useState('createdAt');
//   const [view, setView] = useState(false);
//   const [smsHistory, setSmsHistory] = useState(null);
//   const [smsCount, setSmsCount] = useState(0);
//   const [formData, setFormData] = useState({
//     name: '',
//     FromDate: '',
//     ToDate: '',
//     Profile: '',
//     verified: '',
//     status: true
//   });
//   const [selectedCandidateId, setSelectedCandidateId] = useState('');
//   const [showSMSModal, setShowSMSModal] = useState(false);
//   const [showNotificationModal, setShowNotificationModal] = useState(false);

//   // Fetch data on initial load and when dependencies change
//   useEffect(() => {
//     fetchCandidates();
//   }, [page, sortingValue, sortingOrder, isChecked]);

//   // Fetch candidates from API
//   const fetchCandidates = async () => {
//     try {
//       const params = new URLSearchParams({
//         page,
//         value: sortingValue,
//         order: sortingOrder,
//         status: !isChecked,
//         ...formData
//       });

//       const response = await axios.get(`/admin/candidate?${params.toString()}`);
//       setCandidates(response.data.candidates || []);
//       setCount(response.data.count || 0);
//       setTotalPages(response.data.totalPages || 1);
//       setSmsHistory(response.data.smsHistory || null);
//       setSmsCount(response.data.smsCount || 0);
//       setView(response.data.view || false);
//     } catch (error) {
//       console.error('Error fetching candidates:', error);
//     }
//   };

//   // Handle archived checkbox change
//   const handleArchivedChange = () => {
//     setIsChecked(!isChecked);
//   };

//   // Handle filter form submission
//   const handleFilterSubmit = (data) => {
//     setFormData(data);
//     setPage(1);
//     fetchCandidates();
//   };

//   // Handle reset filters
//   const handleReset = () => {
//     setFormData({
//       name: '',
//       FromDate: '',
//       ToDate: '',
//       Profile: '',
//       verified: '',
//       status: !isChecked
//     });
//     setPage(1);
//     fetchCandidates();
//   };

//   // Handle column sorting
//   const handleSorting = (value) => {
//     const newOrder = value === sortingValue ? sortingOrder * -1 : -1;
//     setSortingValue(value);
//     setSortingOrder(newOrder);
//   };

//   // Handle status toggle
//   const handleStatusChange = async (id, status, model) => {
//     try {
//       const newStatus = status === 'true' || status === true ? false : true;
//       await axios.post('/admin/changestatus', {
//         id,
//         status: newStatus,
//         model
//       });
//       fetchCandidates();
//     } catch (error) {
//       console.error('Error changing status:', error);
//     }
//   };

//   // Handle profile visibility toggle
//   const handleProfileVisibilityChange = async (mobile, visibility) => {
//     try {
//       const newVisibility = visibility === 'true' || visibility === true ? false : true;
//       await axios.post('/admin/candidate/changeprofilestatus', {
//         mobile,
//         status: newVisibility
//       });
//       fetchCandidates();
//     } catch (error) {
//       console.error('Error changing profile visibility:', error);
//     }
//   };

//   // Handle export candidates to CSV
//   const handleExportCandidates = async () => {
//     try {
//       const body = {
//         FromDate: formData.FromDate,
//         ToDate: formData.ToDate,
//         username: formData.name,
//         isProfileCompleted: formData.Profile
//       };

//       const response = await axios.post('/admin/candidate/downloadCSV', body, { responseType: 'blob' });
//       const href = URL.createObjectURL(response.data);
//       window.open(href, '_blank');
//     } catch (error) {
//       console.error('Error exporting candidates:', error);
//     }
//   };

//   // Handle sending bulk SMS
//   const handleSendSMS = async () => {
//     try {
//       await axios.post('/admin/candidate/bulkSMS', {
//         isProfileCompleted: false,
//         name: formData.name,
//         fromDate: formData.FromDate,
//         toDate: formData.ToDate,
//         count: smsCount
//       });

//       setSmsHistory({
//         createdAt: new Date(),
//         count: smsCount
//       });

//       setShowSMSModal(false);
//     } catch (error) {
//       console.error('Error sending SMS:', error);
//     }
//   };

//   // Handle opening notification modal
//   const handleOpenNotificationModal = (candidateId) => {
//     setSelectedCandidateId(candidateId);
//     setShowNotificationModal(true);
//   };

//   // Handle sending notification
//   const handleSendNotification = async (eventType, message) => {
//     if (!eventType || !message) {
//       return { success: false, message: 'Please fill the required fields!' };
//     }

//     try {
//       const response = await axios.post('/admin/candidate/sendNotification', {
//         title: eventType,
//         message,
//         candidateId: selectedCandidateId
//       });

//       if (response.data.status) {
//         fetchCandidates();
//         setShowNotificationModal(false);
//         return { success: true, message: response.data.message };
//       } else {
//         return { success: false, message: response.data.message };
//       }
//     } catch (error) {
//       console.error('Error sending notification:', error);
//       return { success: false, message: 'An error occurred while sending notification' };
//     }
//   };

//   // Handle login as candidate
//   const handleLoginAs = async (mobile) => {
//     try {
//       const response = await axios.post('/api/loginAsCandidate', {
//         mobile,
//         module: 'candidate'
//       });

//       if (response.data.role === 3) {
//         localStorage.setItem('candidate', response.data.name);
//         localStorage.setItem('token', response.data.token);
//         window.location.href = '/candidate/dashboard';
//       }
//     } catch (error) {
//       console.error('Error logging in as candidate:', error);
//     }
//   };

//   // Handle page change
//   const handlePageChange = (newPage) => {
//     setPage(newPage);
//   };
//   return (
//     <div className="">
//           <div className="content-overlay"></div>
//           <div className="header-navbar-shadow"></div>
//     <div className="content-wrapper">
//     <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
//               <div className="content-header-left col-md-9 col-12 mb-2">
//                 <div className="row breadcrumbs-top">
//                   <div className="col-12">
//                     <h3 className="content-header-title float-left mb-0">Your Profile</h3>
//                     <div className="breadcrumb-wrapper col-12">
//                       <ol className="breadcrumb">
//                         <li className="breadcrumb-item">
//                           <a href="/candidate/dashboard">Home</a>
//                         </li>
//                         <li className="breadcrumb-item active">Your Profile</li>
//                       </ol>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//         <div className="content-body">
//            {/* <!-- Personal Information Section --> */}
//     <section id="personal-info">
//         <div class="row">
//             <div class="col-xl-12 col-lg-12">
//                 <div class="card">
//                     <div class="card-header border border-top-0 border-left-0 border-right-0">
//                         <h4 class="card-title pb-1">Personal Information</h4>
//                     </div>
//                     <div class="card-content">
//                         <div class="card-body">
//                             <div class="row">
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Name / नाम<span class="mandatory"> *</span></label>
//                                     <input type="text" name="name" class="form-control" maxlength="15"/>
//                                 </div>
//                                 <div class="col-xl-2 mb-1">
//                                     <label>Mobile / मोबाइल<span class="mandatory"> *</span></label>
//                                     <input type="number" name="mobile" class="form-control" readonly/>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Email / ईमेल</label>
//                                     <input type="email" name="email" class="form-control"/>
//                                 </div>
//                                 <div class="col-xl-2 mb-1">
//                                     <label>Gender / लिंग<span class="mandatory"> *</span></label>
//                                     <select class="form-control" name="sex">
//                                         <option value="">Please select</option>
//                                         <option value="Male">Male</option>
//                                         <option value="Female">Female</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-2 mb-1">
//                                     <label>Date of Birth / जन्म तिथि<span class="mandatory"> *</span></label>
//                                     <input type="date" name="dob" class="form-control"/>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>WhatsApp Number / व्हाट्सएप नंबर<span class="mandatory"> *</span></label>
//                                     <input type="tel" name="whatsapp" class="form-control" maxlength="10"/>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Address / पता<span class="mandatory"> *</span></label>
//                                     <input type="text" name="address" class="form-control"/>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>State / राज्य<span class="mandatory"> *</span></label>
//                                     <select class="form-control" name="state">
//                                         <option value="">Select Option</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>City / शहर<span class="mandatory"> *</span></label>
//                                     <select class="form-control" name="city">
//                                         <option value="">Select City</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-6 mb-1">
//                                     {/* <label>Pincode / पिन कोड<span class="mandatory"> *</span></label>
//                                     <input type="number" name="pincode" class="form-control" maxlength="6"/> */}
//                                     <label for="work-loc">Current Location<span class="mandatory"> *</span></label>
//                                 <div class="input-group">
//                                   <div class="input-group-prepend bg-locat">
//                                     <div class="input-group-text bg-intext"><img src="/images/isist.png" id="siteforcomp"/>
//                                     </div>
//                                   </div>
//                                   <input type="text" class="form-control pac-target-input" id="work-loc" value="Dharamshala, Himachal Pradesh, India" placeholder="Enter a location" autocomplete="off"/>
//                                   <input type="hidden" id="place" name="place" value="" class="form-control"/>
//                                   <input type="hidden" id="latitude" name="latitude" value="" class="form-control"/>
//                                   <input type="hidden" id="longitude" name="longitude" value="" class="form-control"/>
//                                 </div>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Upload image / तस्विर अपलोड करे</label>
//                                     <input type="file" class="form-control" name="image"/>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Upload resume / रिज्यूमे अपलोड करें</label>
//                                     <input type="file" class="form-control" name="resume"/>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Add Video Profile / वीडियो प्रोफाइल जोड़ें</label>
//                                     <input type="file" class="form-control" name="profilevideo"/>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Sample Video Profile / वीडियो प्रोफाइल नमूना</label>
//                                     <div>
//                                         <a href="/sampleVideoProfile" target="_blank">View / देखे</a>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </section>
//           <section className="list-view">
//             <div className="row">
//               <div className="col-12 rounded equal-height-2 coloumn-2">
//                 <div className="card">
//                   <div className="row">
//                     {/* Archive toggle section */}
//                     <div className="col-xl-5 col-lg-6 col-md-4 col-sm-12 col-12 my-auto">
//                       <div className="archieve text-left px-1">
//                         <input
//                           style={{ marginBottom: '4px' }}
//                           type="checkbox"
//                           checked={isChecked}
//                           onChange={handleArchivedChange}
//                           id="checkbox1"
//                         />
//                         &nbsp;
//                         <p>Show Archived</p>
//                       </div>
//                     </div>

//                     {/* SMS and export section */}
//                     <div className="col-xl-7 col-lg-6 col-md-8 col-sm-12 col-12">
//                       <div className="row">
//                         {!view && (
//                           <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
//                             <div className="mt-1 pr-1">
//                               <a href="#" onClick={() => setShowSMSModal(true)}>
//                                 <img src="/images/conversation.png" alt="" />
//                                 <span className="totalCount pl-1">Profile Completion SMS</span>
//                               </a>
//                               <h6 className="text-danger mr-1" id="smsHistory">
//                                 Last Sent:{' '}
//                                 {smsHistory?.createdAt ? (
//                                   `${moment(smsHistory.createdAt).utcOffset("+05:30").format('MMM DD YYYY')} (${smsHistory.count})`
//                                 ) : (
//                                   '0'
//                                 )}
//                               </h6>
//                             </div>
//                           </div>
//                         )}

//                         <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
//                           <div className="collectie mt-1 mr-1 bottomcontent">
//                             <a href="#" className="d-flex align-items-center" onClick={handleExportCandidates}>
//                               <img src="/images/csv.png" alt="" />
//                               <span className="totalCount my-auto ml-1">Total Candidates: {count}</span>
//                             </a>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="card-content col-12">
//                     {/* Filter Form */}
//                     <FilterForm
//                       initialData={formData}
//                       onSubmit={handleFilterSubmit}
//                       onReset={handleReset}
//                       isChecked={isChecked}
//                     />

//                     {/* Candidates Table */}
//                     <div className="table-responsive">
//                       {candidates && candidates.length > 0 ? (
//                         <table id="tblexportData" className="table table-hover-animation mb-0 table-hover" width="100%">
//                           <thead>
//                             <tr>
//                               <th
//                                 className="three column wide"
//                                 width="18%"
//                                 onClick={() => handleSorting('createdAt')}
//                                 style={{ cursor: 'pointer' }}
//                               >
//                                 DATE{' '}
//                                 <FontAwesomeIcon
//                                   icon={sortingValue === 'createdAt' && sortingOrder === 1 ? faArrowUp : faArrowDown}
//                                   className={sortingValue === 'createdAt' ? 'success' : 'danger'}
//                                 />
//                               </th>
//                               <th className="three column wide candidate-wrap" width="19%">CANDIDATE NAME</th>
//                               <th className="one column wide" width="15%">MOBILE NO.</th>
//                               <th
//                                 className="one column wide"
//                                 width="7%"
//                                 onClick={() => handleSorting('refCount')}
//                                 style={{ cursor: 'pointer' }}
//                               >
//                                 Ref{' '}
//                                 <FontAwesomeIcon
//                                   icon={sortingValue === 'refCount' && sortingOrder === 1 ? faArrowUp : faArrowDown}
//                                   className={sortingValue === 'refCount' ? 'success' : 'danger'}
//                                 />
//                               </th>
//                               <th
//                                 className="one column wide"
//                                 width="7%"
//                                 onClick={() => handleSorting('cashbackDue')}
//                                 style={{ cursor: 'pointer' }}
//                               >
//                                 DUE{' '}
//                                 <FontAwesomeIcon
//                                   icon={sortingValue === 'cashbackDue' && sortingOrder === 1 ? faArrowUp : faArrowDown}
//                                   className={sortingValue === 'cashbackDue' ? 'success' : 'danger'}
//                                 />
//                               </th>
//                               <th
//                                 className="one column wide"
//                                 width="7%"
//                                 onClick={() => handleSorting('cashbackPaid')}
//                                 style={{ cursor: 'pointer' }}
//                               >
//                                 PAID{' '}
//                                 <FontAwesomeIcon
//                                   icon={sortingValue === 'cashbackPaid' && sortingOrder === 1 ? faArrowUp : faArrowDown}
//                                   className={sortingValue === 'cashbackPaid' ? 'success' : 'danger'}
//                                 />
//                               </th>
//                               <th
//                                 className="one column wide"
//                                 width="7%"
//                                 onClick={() => handleSorting('amountSpent')}
//                                 style={{ cursor: 'pointer' }}
//                               >
//                                 SPENT{' '}
//                                 <FontAwesomeIcon
//                                   icon={sortingValue === 'amountSpent' && sortingOrder === 1 ? faArrowUp : faArrowDown}
//                                   className={sortingValue === 'amountSpent' ? 'success' : 'danger'}
//                                 />
//                               </th>
//                               <th className="one column wide" width="5%">STATUS</th>
//                               <th className="one column wide" width="5%">VISIBLE</th>
//                               {!view && <th className="one column wide" width="10%">Action</th>}
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {candidates.map((candidate, index) => (
//                               <tr key={candidate._id}>
//                                 <td className="text-capitalize">
//                                   {candidate.createdAt
//                                     ? moment(candidate.createdAt).utcOffset("+05:30").format('MMM DD YYYY hh:mm A')
//                                     : "NA"
//                                   }
//                                 </td>
//                                 <td className="text-capitalize candid-wrap">
//                                   <a href={`/admin/candidate/details/${candidate._id}`}>
//                                     {candidate.name || "NA"}
//                                   </a>
//                                   {candidate.verified && (
//                                     <FontAwesomeIcon
//                                       icon={faCircleCheck}
//                                       style={{ color: '#28c76f', marginLeft: '5px' }}
//                                     />
//                                   )}
//                                 </td>
//                                 <td className="text-capitalize">
//                                   {candidate.mobile || "NA"}
//                                 </td>
//                                 <td className="text-capitalize">
//                                   {candidate.refCount || 0}
//                                 </td>
//                                 <td className="text-capitalize">
//                                   {candidate.cashbackDue}
//                                 </td>
//                                 <td className="text-capitalize">
//                                   {candidate.cashbackPaid}
//                                 </td>
//                                 <td className="text-capitalize">
//                                   {candidate.amountSpent}
//                                 </td>
//                                 {view ? (
//                                   <td>{candidate.status ? 'True' : 'False'}</td>
//                                 ) : (
//                                   <td>
//                                     <div className="custom-control custom-switch custom-control-inline" style={{ paddingLeft: '10px' }}>
//                                       <input
//                                         type="checkbox"
//                                         className="custom-control-input"
//                                         id={`customSwitch${index}`}
//                                         checked={candidate.status}
//                                         onChange={() => handleStatusChange(candidate._id, candidate.status, 'candidate')}
//                                       />
//                                       <label
//                                         className="custom-control-label"
//                                         htmlFor={`customSwitch${index}`}
//                                       />
//                                     </div>
//                                   </td>
//                                 )}
//                                 {view ? (
//                                   <td>{candidate.visibility ? 'True' : 'False'}</td>
//                                 ) : (
//                                   <td>
//                                     <div className="custom-control custom-switch custom-control-inline" style={{ paddingLeft: '10px' }}>
//                                       <input
//                                         type="checkbox"
//                                         className="custom-control-input"
//                                         id={`ctmSwitch${index}`}
//                                         checked={candidate.visibility}
//                                         onChange={() => handleProfileVisibilityChange(candidate.mobile, candidate.visibility)}
//                                       />
//                                       <label
//                                         className="custom-control-label"
//                                         htmlFor={`ctmSwitch${index}`}
//                                       />
//                                     </div>
//                                   </td>
//                                 )}
//                                 {!view && (
//                                   <td className="d-flex">
//                                     <a href={`/admin/candidate/candidatedoc/${candidate._id}`} title="Document" className="pr-1">
//                                       <FontAwesomeIcon icon={faFileText} className="fa-lg primary" />
//                                     </a>
//                                     <a href={`/admin/candidate/edit/${candidate._id}`} title="Edit" className="pr-1">
//                                       <FontAwesomeIcon icon={faEdit} className="fa-lg primary" />
//                                     </a>
//                                     <a href="#" title="Send Notification" className="pr-1" onClick={() => handleOpenNotificationModal(candidate._id)}>
//                                       <FontAwesomeIcon icon={faBell} className="text-danger" />
//                                     </a>
//                                     <FontAwesomeIcon
//                                       icon={faRightToBracket}
//                                       className="fa-lg primary cursor-pointer loginIcon"
//                                       title="Login as Candidate"
//                                       onClick={() => handleLoginAs(candidate.mobile)}
//                                     />
//                                   </td>
//                                 )}
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       ) : (
//                         <p className="text-center mt-3">No result found</p>
//                       )}

//                       {/* Pagination */}
//                       {/* {totalPages > 1 && (
//                       <Pagination 
//                         currentPage={page}
//                         totalPages={totalPages}
//                         onPageChange={handlePageChange}
//                       />
//                     )} */}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>
//         </div>

      
//         <form method="post">
   

//     {/* <!-- Qualification Section --> */}
//     <section id="qualification">
//         <div class="row">
//             <div class="col-xl-12 col-lg-12">
//                 <div class="card">
//                     <div class="card-header border border-top-0 border-left-0 border-right-0">
//                         <h4 class="card-title pb-1">Qualification</h4>
//                     </div>
//                     <div class="card-content">
//                         <div class="card-body">
//                             <div class="row">
//                                 <div class="col-xl-4 mb-1">
//                                     <label>Highest Qualification / अपनी उच्चतम योग्यता का चयन करें<span class="mandatory"> *</span></label>
//                                     <select class="form-control" name="highestQualification">
//                                         <option value="">Select Highest Qualification</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-4 mb-1">
//                                     <label>Year of Passing / उत्तीर्ण होने का वर्ष</label>
//                                     <select class="form-control" name="yearOfPassing">
//                                         <option value="">Select Year</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-4 mb-1">
//                                     <label>University Name / विश्वविद्यालय का नाम</label>
//                                     <select class="form-control" name="University">
//                                         <option value="">Select University</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-4 mb-1">
//                                     <label>Enter Value / मूल्य दर्ज करें</label>
//                                     <input type="text" class="form-control" name="Result" placeholder="Enter CGPA, Percentage or Grade"/>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </section>
// {/* Tech Deptment   */}

// <section id="skills-and-profile">
//     <div class="row">
//         <div class="col-xl-6 col-lg-6">
//             <div class="card">
//                 <div class="card-header border border-top-0 border-left-0 border-right-0">
//                     <h4 class="card-title pb-1">Technical Skills / तकनीकी कौशल</h4>
//                 </div>
//                 <div class="card-content">
//                     <div class="card-body" id="Technical-skills-section">
//                         <div class="col-xl-12 px-0">
//                             <div class="row mb-1 skillrow">
//                                 <div class="col-xl-6">
//                                     <label>Select Skills / कौशल का चयन करें</label>
//                                     <select class="form-control text-capitalize" name="techskill">
//                                         <option value="">Select skill</option>
//                                         <option value="plumber">Plumber</option>
//                                         <option value="carpenter">Carpenter</option>
//                                         <option value="construction_manager">Construction Manager</option>
//                                         <option value="computer_typing">Computer Typing</option>
//                                         <option value="electrician">Electrician</option>
//                                         <option value="building_inspector">Building Inspector</option>
//                                         <option value="welding">Welding</option>
//                                         <option value="auto_mechanic">Auto Mechanic</option>
//                                         <option value="pipefitter">Pipefitter</option>
//                                         <option value="others">Others</option>
//                                         <option value="bookkeeping">Bookkeeping</option>
//                                         <option value="data_entry">Data Entry</option>
//                                         <option value="boilermaker">Boilermaker</option>
//                                         <option value="supervisor">Supervisor</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-6">
//                                     <label>Upload video / विडियो को अपलोड करें</label>
//                                     <input type="file" class="form-control"/>
//                                 </div>
//                             </div>
//                             <div class="row mb-1 skillrow">
//                                 <div class="col-xl-6">
//                                     <label>Select Skills / कौशल का चयन करें</label>
//                                     <select class="form-control text-capitalize" name="techskill">
//                                         <option value="">Select skill</option>
//                                         <option value="plumber">Plumber</option>
//                                         <option value="carpenter">Carpenter</option>
//                                         <option value="construction_manager">Construction Manager</option>
//                                         <option value="computer_typing">Computer Typing</option>
//                                         <option value="electrician">Electrician</option>
//                                         <option value="building_inspector">Building Inspector</option>
//                                         <option value="welding">Welding</option>
//                                         <option value="auto_mechanic">Auto Mechanic</option>
//                                         <option value="pipefitter">Pipefitter</option>
//                                         <option value="others">Others</option>
//                                         <option value="bookkeeping">Bookkeeping</option>
//                                         <option value="data_entry">Data Entry</option>
//                                         <option value="boilermaker">Boilermaker</option>
//                                         <option value="supervisor">Supervisor</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-6">
//                                     <label>Upload video / विडियो को अपलोड करें</label>
//                                     <input type="file" class="form-control"/>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>

//         {/* <!-- Non-Technical Skills Section --> */}
//         <div class="col-xl-6 col-lg-6">
//             <div class="card">
//                 <div class="card-header border border-top-0 border-left-0 border-right-0">
//                     <h4 class="card-title pb-1">Non-Technical Skills / गैर तकनीकी कौशल</h4>
//                 </div>
//                 <div class="card-content">
//                     <div class="card-body" id="non-technical-skills-section">
//                         <div class="col-xl-12 px-0">
//                             <div class="row mb-1 skillrow">
//                                 <div class="col-xl-6">
//                                     <label>Select Skills / कौशल का चयन करें</label>
//                                     <select class="form-control text-capitalize" name="nontechskill">
//                                         <option value="">Select skill</option>
//                                         <option value="communication">Communication Skills</option>
//                                         <option value="group_discussion">Group Discussion</option>
//                                         <option value="leadership">Leadership</option>
//                                         <option value="self_introduction">Self Introduction</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-6">
//                                     <label>Upload video / विडियो को अपलोड करें</label>
//                                     <input type="file" class="form-control"/>
//                                 </div>
//                             </div>
//                             <div class="row mb-1 skillrow">
//                                 <div class="col-xl-6">
//                                     <label>Select Skills / कौशल का चयन करें</label>
//                                     <select class="form-control text-capitalize" name="nontechskill">
//                                         <option value="">Select skill</option>
//                                         <option value="communication">Communication Skills</option>
//                                         <option value="group_discussion">Group Discussion</option>
//                                         <option value="leadership">Leadership</option>
//                                         <option value="self_introduction">Self Introduction</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-6">
//                                     <label>Upload video / विडियो को अपलोड करें</label>
//                                     <input type="file" class="form-control"/>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </div>
// </section>


//     {/* <!-- Experience Section --> */}
//     <section id="Experience-section">
//         <div class="row">
//             <div class="col-xl-12 col-lg-12">
//                 <div class="card">
//                     <div class="card-header border border-top-0 border-left-0 border-right-0">
//                         <h4 class="card-title pb-1">Experience / अनुभव</h4>
//                     </div>
//                     <div class="card-content">
//                         <div class="card-body">
//                             <div class="row">
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Experience / अनुभव<span class="mandatory"> *</span></label>
//                                     <select class="form-control" name="experience">
//                                         <option value="">Select Experience</option>
//                                         <option value="Fresher">Fresher</option>
//                                         <option value="Experienced">Experienced</option>
//                                     </select>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                     <label>Total experience (yrs) / कुल अनुभव (वर्ष)</label>
//                                     <input type="number" name="totalExperience" class="form-control"/>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </section>

//     {/* <!-- Location Preference --> */}
//     <section id="location-preference">
//         <div class="row">
//             <div class="col-xl-12 col-lg-12">
//                 <div class="card">
//                     <div class="card-header border border-top-0 border-left-0 border-right-0">
//                         <h4 class="card-title pb-1">Location Preferences / स्थान का चयन</h4>
//                     </div>
//                     <div class="card-content">
//                         <div class="card-body">
//                         <div class="row locationpref">
//                                 <div class="col-xl- 1my-auto">
//                                   <label class="font-weight-bold">Location 1</label>
//                                 </div>
//                                 <div class="col-xl-3 mb-1">
//                                   <label>State / राज्य</label>
//                                   <select class="form-control" name="state" value="" id="state-field0" onchange="stateChangeHandler(event,'city-field0')">
//                                     <option value="">Select State</option>
//                                             <option value="5e043406217229f30bc98e7e" class="text-capitalize">
//                                               Andhra Pradesh
//                                             </option>
//                                             <option value="5e043406217229f30bc98e82" class="text-capitalize">
//                                               Chandigarh
//                                             </option>
//                                             <option value="5e043406217229f30bc98e86" class="text-capitalize">
//                                               Delhi
//                                             </option>
//                                             <option value="5e043406217229f30bc98e87" class="text-capitalize">
//                                               Goa
//                                             </option>
//                                             <option value="5e043406217229f30bc98e8f" class="text-capitalize">
//                                               Lakshadweep
//                                             </option>
//                                             <option value="5e043406217229f30bc98e9b" class="text-capitalize">
//                                               Punjab
//                                             </option>
//                                             <option value="5e043406217229f30bc98e9c" class="text-capitalize">
//                                               Rajasthan
//                                             </option>
//                                             <option value="5e043406217229f30bc98e9e" class="text-capitalize">
//                                               Tamil Nadu
//                                             </option>
//                                             <option value="5e043406217229f30bc98ea2" class="text-capitalize">
//                                               Uttarakhand
//                                             </option>
//                                             <option value="5e043406217229f30bc98ea4" class="text-capitalize">
//                                               West Bengal
//                                             </option>
//                                             <option value="5e043406217229f30bc98ead" class="text-capitalize">
//                                               Pondicherry
//                                             </option>
                                            
//                                         <option value="5e043406217229f30bc98e8a" class="text-capitalize" selected="">
//                                           Himachal Pradesh
//                                         </option>
//                                             <option value="5e043406217229f30bc98e8e" class="text-capitalize">
//                                               Kerala
//                                             </option>
//                                             <option value="5e043406217229f30bc98e91" class="text-capitalize">
//                                               Maharashtra
//                                             </option>
//                                             <option value="5e043406217229f30bc98e92" class="text-capitalize">
//                                               Manipur
//                                             </option>
//                                             <option value="5e043406217229f30bc98e9f" class="text-capitalize">
//                                               Telangana
//                                             </option>
//                                             <option value="5e043406217229f30bc98ea0" class="text-capitalize">
//                                               Tripura
//                                             </option>
//                                             <option value="5e043406217229f30bc98ea1" class="text-capitalize">
//                                               Uttar Pradesh
//                                             </option>
//                                             <option value="5e043406217229f30bc98e7d" class="text-capitalize">
//                                               Andaman and Nicobar Islands
//                                             </option>
//                                             <option value="5e043406217229f30bc98e7f" class="text-capitalize">
//                                               Arunachal Pradesh
//                                             </option>
//                                             <option value="5e043406217229f30bc98e81" class="text-capitalize">
//                                               Bihar
//                                             </option>
//                                             <option value="5e043406217229f30bc98e83" class="text-capitalize">
//                                               Chhattisgarh
//                                             </option>
//                                             <option value="5e043406217229f30bc98e89" class="text-capitalize">
//                                               Haryana
//                                             </option>
//                                             <option value="5e043406217229f30bc98e8b" class="text-capitalize">
//                                               Jammu and Kashmir
//                                             </option>
//                                             <option value="5e043406217229f30bc98e8c" class="text-capitalize">
//                                               Jharkhand
//                                             </option>
//                                             <option value="5e043406217229f30bc98e90" class="text-capitalize">
//                                               Madhya Pradesh
//                                             </option>
//                                             <option value="5e043406217229f30bc98e94" class="text-capitalize">
//                                               Mizoram
//                                             </option>
//                                             <option value="5e043406217229f30bc98e96" class="text-capitalize">
//                                               Karnataka
//                                             </option>
//                                             <option value="5e043406217229f30bc98e80" class="text-capitalize">
//                                               Assam
//                                             </option>
//                                             <option value="5e043406217229f30bc98e84" class="text-capitalize">
//                                               Dadra and Nagar Haveli
//                                             </option>
//                                             <option value="5e043406217229f30bc98e88" class="text-capitalize">
//                                               Gujarat
//                                             </option>
//                                             <option value="5e043406217229f30bc98e93" class="text-capitalize">
//                                               Meghalaya
//                                             </option>
//                                             <option value="5e043406217229f30bc98e95" class="text-capitalize">
//                                               Nagaland
//                                             </option>
//                                             <option value="5e043406217229f30bc98e99" class="text-capitalize">
//                                               Odisha
//                                             </option>
//                                             <option value="5e043406217229f30bc98e9d" class="text-capitalize">
//                                               Sikkim
//                                             </option>                                          
//                                             <option value="63b8078e89a901873ae0e74e" class="text-capitalize">
//                                               Ladakh
//                                             </option>
                                            
//                                   </select>
//                                 </div>
//                                 <div class="col-xl-3 mb-1" id="city-div0">
//                                   <label>City / शहर</label>
//                                   <select class="form-control" name="city" id="city-field0">
//                                     <option value="">Select City</option>
//                                         <option value="5e04341c217229f30bc9a3f3" class="text-capitalize prefcitylist" selected="">
//                                           Kangra
//                                         </option>
                                          
//                                   </select>
//                                 </div>
//                               </div>
//                             <div class="row">
//                                 <div class="col-xl-12 text-right">
//                                     <button type="reset" class="btn btn-danger">Reset</button>
//                                     <button type="submit" class="btn btn-success">Save</button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </section>
// </form>
// <SendSMSModal
//           show={showSMSModal}
//           onHide={() => setShowSMSModal(false)}
//           onSend={handleSendSMS}
//           smsCount={smsCount}
//           formData={formData}
//         />


      
//         <NotificationModal
//           show={showNotificationModal}
//           onHide={() => setShowNotificationModal(false)}
//           onSend={handleSendNotification}
//         />
//     </div>
     
//       </div>

//   )
// }

// export default CandidatrProfile

