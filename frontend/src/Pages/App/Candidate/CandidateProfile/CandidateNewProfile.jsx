import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { usePlacesWidget } from 'react-google-autocomplete';
import "./CandidateProfile.css"

const CandidateNewProfile = () => {
  const navigate = useNavigate();
  const [preloaderVisible, setPreloaderVisible] = useState(false);
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const [experiences, setExperiences] = useState([{}]);
  const [educations, setEducations] = useState([{}]);
  const [skills, setSkills] = useState([{}]);
  const [certificates, setCertificates] = useState([{}]);
  const [languages, setLanguages] = useState([{}]);
  const [projects, setProjects] = useState([{}]);
  const [interests, setInterests] = useState(['']);
  const [user, setUser] = useState({});
  const [declaration, setDeclaration] = useState();
  const createEditable = (content, placeholder) => (
    <div contentEditable={true} data-placeholder={placeholder} suppressContentEditableWarning={true}>
      {content}
    </div>
  );

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      console.log("user (after sessionStorage):", parsed); // ✅ Right place to log
    }
  }, []);

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
      console.log("backendUrl =>", backendUrl);

      const token = localStorage.getItem('token');
      console.log('token', token)
      const response = await axios.get(`${backendUrl}/candidate/myprofile`, {
        headers: { 'x-auth': token }
      });
      console.log('response getting', response.data)
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

    autocomplete.addListener('place_changed', function () {
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

        <section id="personal-info">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Personal Information</h4>
                </div>
                <div className="card-content p-0">
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

                      <div className="col-xl-6 mb-1">
                        <label htmlFor="address">Address<span className="mandatory"> *</span></label>
                        <div className="input-group">
                          <div className="input-group-prepend bg-locat">
                            <div className="input-group-text bg-intext new-bg-text">
                              <img src="/Assets/images/isist.png" id="siteforcomp" alt="location" />
                            </div>
                          </div>
                          <input
                            type="text"
                            className="form-control"
                            id="address"
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

        {/* new Tech Skills  */}

        <section id="skill">
          <div className="cv-container">
            <div className="top-bar"></div>
            <div className="cv-header">
              <div className="profile-image">
                <img src="/api/placeholder/150/150" alt="Profile Picture" />
                <div className="upload-icon">📷</div>
              </div>
              <div className="personal-info">
                {createEditable('Your Name', 'Your Name')}
                {createEditable('Professional Title', 'Professional Title')}
                {createEditable('A results-driven professional with over 8 years...', 'Write a brief professional summary here...')}
                <div className="contact-info">
                  <div className="contact-item"><span className="contact-icon">📞</span>{createEditable('+91 98765 43210', 'Phone Number')}</div>
                  <div className="contact-item"><span className="contact-icon">✉️</span>{createEditable('yourname@example.com', 'Email Address')}</div>
                  <div className="contact-item"><span className="contact-icon">🌐</span>{createEditable('linkedin.com/in/yourprofile', 'LinkedIn/Website')}</div>
                  <div className="contact-item"><span className="contact-icon">📍</span>{createEditable('Mumbai, India', 'Location')}</div>
                </div>
              </div>
            </div>

            <div className="main-content">
              <div className="left-column">
                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">💼</div>
                    <div className="section-title">Work Experience</div>
                  </div>
                  {experiences.map((_, index) => (
                    <div className="experience-item" key={index}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-line"></div>
                      {createEditable('', 'Job Title')}
                      {createEditable('', 'Company Name')}
                      <div className="date">
                        <span className="date-icon">📅</span>
                        {createEditable('', 'Duration')}
                      </div>
                      {createEditable('', 'Job Description')}
                    </div>
                  ))}
                  <button className="add-UserBtn" onClick={() => setExperiences([...experiences, {}])}>➕ Add Experience</button>
                </div>

                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">🎓</div>
                    <div className="section-title">Education</div>
                  </div>
                  {educations.map((_, index) => (
                    <div className="education-item" key={index}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-line"></div>
                      {createEditable('', 'Degree')}
                      {createEditable('', 'University')}
                      <div className="date">
                        <span className="date-icon">📅</span>
                        {createEditable('', 'Duration')}
                      </div>
                      {createEditable('', 'Additional Information')}
                    </div>
                  ))}
                  <button className="add-UserBtn" onClick={() => setEducations([...educations, {}])}>➕ Add Education</button>
                </div>
                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">📜</div>
                    <div className="section-title">Declaration</div>
                  </div>
                  <div
                    className="education-description"
                    contentEditable
                    suppressContentEditableWarning={true}
                    onBlur={(e) => setDeclaration(e.target.innerText)}
                  >
                    {declaration}
                  </div>
                </div>
              </div>

              <div className="right-column">
                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">🔧</div>
                    <div className="section-title">Skills</div>
                  </div>
                  <div className="skills-container">
                    {skills.map((_, index) => (
                      <div className="skill-item" key={index}>
                        <div className="skill-name">
                          {createEditable('', 'Skill Name')}<span>80%</span>
                        </div>
                        <div className="skill-bar">
                          <div className="skill-progress" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                    ))}
                    <button className="add-UserBtn" onClick={() => setSkills([...skills, {}])}>➕ Add Skill</button>
                  </div>
                </div>

                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">🏆</div>
                    <div className="section-title">Certifications</div>
                  </div>
                  <ul className="certificates-list">
                    {certificates.map((_, index) => (
                      <li className="certificate-item" key={index}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-line"></div>
                        {createEditable('', 'Certificate Name')}
                        {createEditable('', 'Issuing Organization, Year')}
                      </li>
                    ))}
                    <button className="add-UserBtn" onClick={() => setCertificates([...certificates, {}])}>➕ Add Certificate</button>
                  </ul>
                </div>

                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">🌐</div>
                    <div className="section-title">Languages</div>
                  </div>
                  <div className="languages-list">
                    {languages.map((_, index) => (
                      <div className="language-item" key={index}>
                        {createEditable('', 'Language Name')}
                        <div className="language-level">
                          <div className="level-dot filled"></div>
                          <div className="level-dot filled"></div>
                          <div className="level-dot filled"></div>
                          <div className="level-dot"></div>
                          <div className="level-dot"></div>
                        </div>
                      </div>
                    ))}
                    <button className="add-UserBtn" onClick={() => setLanguages([...languages, {}])}>➕ Add Language</button>
                  </div>
                </div>

                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">📊</div>
                    <div className="section-title">Projects</div>
                  </div>
                  <div className="projects-container">
                    {projects.map((_, index) => (
                      <div className="project-item" key={index}>
                        {createEditable('', 'Project Name')}
                        {createEditable('', 'Year')}
                        {createEditable('', 'Project Description')}
                      </div>
                    ))}
                    <button className="add-UserBtn" onClick={() => setProjects([...projects, {}])}>➕ Add Project</button>
                  </div>
                </div>

                <div className="section">
                  <div className="section-header">
                    <div className="section-icon">🎯</div>
                    <div className="section-title">Interests</div>
                  </div>
                  <div className="interests-list">
                    {interests.map((_, index) => (
                      <div className="interest-tag" contentEditable={true} data-placeholder="Interest" suppressContentEditableWarning={true} key={index}></div>
                    ))}
                    <button className="add-UserBtn" onClick={() => setInterests([...interests, ''])}>➕ Add Interest</button>
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
                            <label className="font-weight-bold">Location {index + 1}</label>
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


      <style>
        {`
         .cv-container {
            
    margin: 30px auto;
    background-color: #fff;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
    position: relative;
}

.top-bar {
    height: 10px;
    background: linear-gradient(90deg, #2e5cb8 0%, #4776e6 100%);
}

.cv-header {
    display: flex;
    padding: 40px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #eaeaea;
}

.profile-image {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #fff;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    background-color: #e9ecef;
    position: relative;
}

.profile-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.upload-icon {
    position: absolute;
    bottom: 5px;
    right: 5px;
    background: rgba(255, 255, 255, 0.8);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
}

.upload-icon:hover {
    background: #fff;
    transform: scale(1.1);
}

.personal-info {
    margin-left: 40px;
    flex: 1;
}

.name {
    font-size: 36px;
    font-weight: 700;
    color: #2e5cb8;
    margin-bottom: 5px;
}

.position {
    font-size: 20px;
    color: #6c757d;
    margin-bottom: 15px;
    font-weight: 500;
}

.profile-summary {
    margin-bottom: 20px;
    font-size: 15px;
    line-height: 1.7;
    color: #495057;
}

.contact-info {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.contact-item {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin-right: 20px;
    color: #495057;
}

.contact-icon {
    margin-right: 8px;
    color: #4776e6;
    font-size: 16px;
}

.main-content {
    display: flex;
    padding: 30px;
}

.left-column {
    flex: 1;
    padding-right: 30px;
}

.right-column {
    flex: 1;
    padding-left: 30px;
    border-left: 1px solid #eaeaea;
}

.section {
    margin-bottom: 35px;
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.section-icon {
    width: 35px;
    height: 35px;
    background-color: #4776e6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 16px;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    color: #2e5cb8;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.experience-item, .education-item {
    margin-bottom: 25px;
    position: relative;
}

.timeline-dot {
    position: absolute;
    left: -39px;
    top: 5px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: #4776e6;
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px #4776e6;
}

.timeline-line {
    position: absolute;
    top: 19px;
    left: -33px;
    width: 2px;
    height: calc(100% + 10px);
    background-color: #e9ecef;
}

.job-title, .degree {
    font-size: 18px;
    font-weight: 600;
    color: #343a40;
    margin-bottom: 5px;
}

.company, .school {
    font-size: 16px;
    color: #6c757d;
    font-weight: 500;
    margin-bottom: 5px;
}

.date {
    font-size: 14px;
    color: #868e96;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
}

.date-icon {
    margin-right: 5px;
}

.job-description, .education-description {
    font-size: 15px;
    color: #495057;
    line-height: 1.7;
}

.skills-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.skill-item {
    margin-bottom: 15px;
}

.skill-name {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 15px;
    font-weight: 500;
    color: #495057;
}

.skill-bar {
    height: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
}

.skill-progress {
    height: 100%;
    background: linear-gradient(90deg, #2e5cb8 0%, #4776e6 100%);
    border-radius: 4px;
}

.languages-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.language-item {
    margin-bottom: 15px;
}

.language-name {
    font-weight: 500;
    margin-bottom: 5px;
    color: #495057;
}

.language-level {
    display: flex;
}

.level-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 5px;
    background-color: #e9ecef;
}

.filled {
    background: linear-gradient(90deg, #2e5cb8 0%, #4776e6 100%);
}

.certificates-list {
    list-style: none;
}

.certificate-item {
    margin-bottom: 15px;
    position: relative;
    padding-left: 25px;
}

.certificate-title {
    font-weight: 500;
    color: #343a40;
    font-size: 16px;
    margin-bottom: 3px;
}

.certificate-details {
    font-size: 14px;
    color: #6c757d;
}

.interests-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.interest-tag {
    background-color: #e9ecef;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 14px;
    color: #495057;
    transition: all 0.2s;
    display: flex;
    align-items: center;
}

.interest-tag:hover {
    background-color: #4776e6;
    color: #fff;
}

.strength-meter {
    padding: 25px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-top: 40px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.strength-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.strength-title {
    font-size: 18px;
    font-weight: 600;
    color: #343a40;
}

.strength-score {
    font-size: 24px;
    font-weight: 700;
    color: #2e5cb8;
}

.strength-category {
    margin-bottom: 15px;
}

.category-header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 5px;
}

.progress-bar {
    height: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #2e5cb8 0%, #4776e6 100%);
    border-radius: 4px;
}

.references-container {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
}

.reference-item {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.reference-name {
    font-size: 16px;
    font-weight: 600;
    color: #343a40;
    margin-bottom: 5px;
}

.reference-position {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 10px;
}

.reference-contact {
    font-size: 14px;
    color: #495057;
}

.projects-container {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
}

.project-item {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.project-title {
    font-size: 16px;
    font-weight: 600;
    color: #343a40;
    margin-bottom: 5px;
}

.project-date {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 10px;
}

.project-description {
    font-size: 14px;
    color: #495057;
}

[contenteditable="true"]:focus {
    outline: 2px solid #4776e6;
    border-radius: 3px;
}

[contenteditable="true"]:empty:before {
    content: attr(data-placeholder);
    color: #adb5bd;
    cursor: text;
}

.add-UserBtn {
  background-color: #2e5cb8;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 15px;
  font-size: 14px;
}
.add-UserBtn:hover {
  background-color: #1c469a;
}

@media (max-width: 768px) {
    .cv-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .personal-info {
        margin-left: 0;
        margin-top: 20px;
    }
    
    .contact-info {
        justify-content: center;
    }
    
    .main-content {
        flex-direction: column;
    }
    
    .left-column, .right-column {
        padding: 0;
    }
    
    .right-column {
        border-left: none;
        border-top: 1px solid #eaeaea;
        margin-top: 20px;
        padding-top: 20px;
    }
    
    .skills-container, .languages-list {
        grid-template-columns: 1fr;
    }
}
        `}
      </style>
    </div>
  );
};

export default CandidateNewProfile;

