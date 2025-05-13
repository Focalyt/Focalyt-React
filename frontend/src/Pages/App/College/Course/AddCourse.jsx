import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';

// Custom styles to match the original application
const styles = {
  errorField: {
    borderColor: '#dc3545'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '0.875em',
    marginTop: '0.25rem'
  },
  ckEditor: {
    '& .ck-editor__editable': {
      minHeight: '200px',
      maxHeight: '400px'
    },
    '& .ck.ck-editor': {
      width: '100%'
    },
    '& .ck.ck-content': {
      fontSize: '1rem',
      lineHeight: '1.5'
    }
  }
};

const AddCourse = () => {
  const navigate = useNavigate();
  const trainingCenterRef = useRef(null);
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  // State for data from API
  const [sectors, setSectors] = useState([]);
  const [centers, setCenters] = useState([]);
  
  // Basic form state
  const [formData, setFormData] = useState({
    sector: '',
    courseLevel: '',
    courseFeeType: '',
    projectName: '',
    typeOfProject: '',
    courseType: '',
    name: '',
    duration: '',
    certifyingAgency: '',
    certifyingAgencyWebsite: '',
    qualification: '',
    age: '',
    experience: '',
    trainingMode: '',
    onlineTrainingTiming: '',
    offlineTrainingTiming: '',
    trainingCenter: [],
    address: '',
    city: '',
    state: '',
    appLink: '',
    addressInput: '',
    ojt: '',
    registrationCharges: '',
    courseFee: '',
    cutPrice: '',
    examFee: '',
    otherFee: '',
    emiOptionAvailable: '',
    maxEMITenure: '',
    stipendDuringTraining: '',
    lastDateForApply: '',
    youtubeURL: '',
    courseFeatures: '',
    importantTerms: '',
    isContact: false,
    counslername: '',
    counslerphonenumber: '',
    counslerwhatsappnumber: '',
    counsleremail: '',
  });
  
  // File upload state
  const [fileUrls, setFileUrls] = useState({
    videos: '',
    brochure: '',
    thumbnail: '',
    photos: '',
    testimonialvideos: ''
  });
  
  // Document requirements
  const [docsRequired, setDocsRequired] = useState([{ name: '' }]);
  
  // FAQ questions and answers
  const [questionAnswers, setQuestionAnswers] = useState([
    { question: '<p>Do you offer a safe working environment?</p>', answer: '<p>Do you offer a safe working environment?</p>' }
  ]);
  
  // UI control states
  const [showProjectFields, setShowProjectFields] = useState(false);
  const [showTrainingFields, setShowTrainingFields] = useState({
    online: false,
    offline: false,
    trainingCenter: false
  });
  const [showAddressFields, setShowAddressFields] = useState({
    appLink: false,
    addressInput: false
  });
  const [showContactInfo, setShowContactInfo] = useState(false);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Fetch sectors and centers data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace these URLs with your actual API endpoints
        const sectorsResponse = await axios.get(`${backendUrl}/api/sectorList`);
        const centersResponse = await axios.get(`${backendUrl}/api/centerList`);
        
        console.log('Sectors response:', sectorsResponse.data);
        console.log('Centers response:', centersResponse.data);
        
        setSectors(Array.isArray(sectorsResponse.data) ? sectorsResponse.data : []);
        setCenters(Array.isArray(centersResponse.data) ? centersResponse.data : []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Set empty arrays as fallback
        setSectors([]);
        setCenters([]);
      }
    };
    
    fetchData();
  }, []);
  
  // Initialize Choices.js for multi-select fields
  useEffect(() => {
    if (trainingCenterRef.current) {
      const choices = new Choices(trainingCenterRef.current, {
        removeItemButton: true,
        searchEnabled: true,
        itemSelectText: '',
        placeholder: false,
        allowHTML: false,
        maxItemCount: -1,
        duplicateItemsAllowed: false,
        delimiter: ',',
        paste: true,
        maxItems: null,
        silent: false
      });
      
      // Remove empty option if it exists
      const emptyOption = trainingCenterRef.current.querySelector('option[value=""]');
      if (emptyOption) {
        emptyOption.remove();
      }
      
      // Clean up on component unmount
      return () => {
        choices.destroy();
      };
    }
  }, [centers]);
  
  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
    
    // Handle specific field changes that affect UI
    if (name === 'courseFeeType') {
      setShowProjectFields(value === 'Free');
    } else if (name === 'trainingMode') {
      handleTrainingModeChange(value);
    } else if (name === 'address') {
      handleAddressChange(value);
    }
  };
  
  // Handle training mode field changes
  const handleTrainingModeChange = (value) => {
    setShowTrainingFields({
      online: value === 'Online' || value === 'Blended',
      offline: value === 'Offline' || value === 'Blended',
      trainingCenter: value === 'Offline' || value === 'Blended'
    });
  };
  
  // Handle address field changes
  const handleAddressChange = (value) => {
    setShowAddressFields({
      appLink: value === 'App' || value === 'Both',
      addressInput: value === 'Address' || value === 'Both'
    });
  };
  
  // Handle contact info radio buttons
  const handleContactChange = (value) => {
    setFormData({
      ...formData,
      isContact: value === 'true'
    });
    setShowContactInfo(value === 'true');
  };
  
  // Handle multi-select training center field
  const handleTrainingCenterChange = (selectedOptions) => {
    const selectedValues = Array.from(selectedOptions).map(option => option.value);
    setFormData({
      ...formData,
      trainingCenter: selectedValues
    });
  };
  
  // Handle file uploads
  const handleFileChange = async (e, fileType) => {
    const uploadedFiles = e.target.files;
    
    if (!uploadedFiles || !uploadedFiles.length) return;
    
    // Validate file count for multiple uploads
    if ((fileType === 'photos' || fileType === 'testimonialvideos' || fileType === 'videos') && uploadedFiles.length > 5) {
      alert("You cannot upload more than 5 files");
      e.target.value = '';
      return;
    }
    
    // Handle single file upload (brochure, thumbnail)
    if (fileType === 'brochure' || fileType === 'thumbnail') {
      const file = uploadedFiles[0];
      
      if (!validateFile(file, fileType)) {
        e.target.value = '';
        return;
      }
      
      await uploadFile(file, fileType);
    } 
    // Handle multiple file upload (photos, videos, testimonial videos)
    else {
      const filesArray = Array.from(uploadedFiles);
      const validFiles = filesArray.filter(file => validateFile(file, fileType));
      
      if (validFiles.length !== filesArray.length) {
        alert("Some files were rejected due to format or size restrictions");
      }
      
      if (validFiles.length === 0) {
        e.target.value = '';
        return;
      }
      
      await uploadFiles(validFiles, fileType);
    }
    
    // Clear the file input
    e.target.value = '';
  };
  
  // Validate file based on type
  const validateFile = (file, fileType) => {
    if (!file) return false;
    
    const fileSize = file.size;
    const fileName = file.name;
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    // For photos
    if (fileType === 'photos') {
      const validExtensions = ['.jpg', '.jpeg', '.png'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!validExtensions.includes(fileExtension)) {
        alert("Please upload images in jpg, jpeg, or png format");
        return false;
      }
      
      if (fileSize > maxSize) {
        alert("Image size should be less than 2MB");
        return false;
      }
      
      return true;
    }
    
    // For brochure and thumbnail
    if (fileType === 'brochure' || fileType === 'thumbnail') {
      const validExtensions = ['.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validExtensions.includes(fileExtension)) {
        alert(`Please upload ${fileType} in doc, docx, pdf, jpg, jpeg, or png format`);
        return false;
      }
      
      if (fileSize > maxSize) {
        alert(`${fileType} size should be less than 5MB`);
        return false;
      }
      
      return true;
    }
    
    // For videos (less strict validation)
    return true;
  };
  
  // Upload single file
  const uploadFile = async (file, fileType) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(
        `${backendUrl}/api/uploadAdminFile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth': localStorage.getItem('token')
          }
         
        }
      );
      
      if (response.data && response.data.status) {
        console.log(`${fileType} uploaded successfully:`, response.data);
        setFileUrls({
          ...fileUrls,
          [fileType]: response.data.data.Key
        });
      }
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      alert(`Failed to upload ${fileType}. Please try again.`);
    }
  };
  
  // Upload multiple files
  const uploadFiles = async (files, fileType) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      // Use different endpoints based on file type
      const endpoint = fileType === 'photos' 
        ? '/api/uploadMultipleFiles' 
        : '/api/uploadMultiFiles'; // For videos and testimonial videos
        
      const response = await axios.post(
        `${backendUrl}${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth': localStorage.getItem('token')
          }
        }
      );
      
      if (response.data && response.data.status) {
        console.log(`${fileType} uploaded successfully:`, response.data);
        const keys = response.data.Data.map(item => item.Key);
        setFileUrls({
          ...fileUrls,
          [fileType]: keys.join(',')
        });
      }
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      alert(`Failed to upload ${fileType}. Please try again.`);
    }
  };
  
  // Add a new document field
  const addDocumentField = () => {
    setDocsRequired([...docsRequired, { name: '' }]);
  };
  
  // Update document field value
  const updateDocumentField = (index, value) => {
    const updatedDocs = [...docsRequired];
    updatedDocs[index].name = value;
    setDocsRequired(updatedDocs);
  };
  
  // Add a new question-answer pair
  const addQuestionAnswer = () => {
    setQuestionAnswers([...questionAnswers, { question: '', answer: '' }]);
  };
  
  // Update question or answer
  const updateQuestionAnswer = (index, field, content) => {
    const updatedQA = [...questionAnswers];
    updatedQA[index][field] = content;
    setQuestionAnswers(updatedQA);
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'sector', 'courseLevel', 'name', 'duration', 'qualification', 
      'trainingMode', 'address', 'ojt', 'emiOptionAvailable'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = `This field is required`;
      }
    });
    
    // Set all errors at once
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Reset form to initial state
  const resetForm = () => {
    // Reset all form fields
    setFormData({
      sector: '',
      courseLevel: '',
      courseFeeType: '',
      projectName: '',
      typeOfProject: '',
      courseType: '',
      name: '',
      duration: '',
      certifyingAgency: '',
      certifyingAgencyWebsite: '',
      qualification: '',
      age: '',
      experience: '',
      trainingMode: '',
      onlineTrainingTiming: '',
      offlineTrainingTiming: '',
      trainingCenter: [],
      address: '',
      city: '',
      state: '',
      appLink: '',
      addressInput: '',
      ojt: '',
      registrationCharges: '',
      courseFee: '',
      cutPrice: '',
      examFee: '',
      otherFee: '',
      emiOptionAvailable: '',
      maxEMITenure: '',
      stipendDuringTraining: '',
      lastDateForApply: '',
      youtubeURL: '',
      courseFeatures: '',
      importantTerms: '',
      isContact: false,
      counslername: '',
      counslerphonenumber: '',
      counslerwhatsappnumber: '',
      counsleremail: '',
    });
    
    // Reset file URLs
    setFileUrls({
      videos: '',
      brochure: '',
      thumbnail: '',
      photos: '',
      testimonialvideos: ''
    });
    
    // Reset docs required
    setDocsRequired([{ name: '' }]);
    
    // Reset questions and answers
    setQuestionAnswers([
      { question: '<p>Do you offer a safe working environment?</p>', answer: '<p>Do you offer a safe working environment?</p>' }
    ]);
    
    // Reset UI state
    setShowProjectFields(false);
    setShowTrainingFields({
      online: false,
      offline: false,
      trainingCenter: false
    });
    setShowAddressFields({
      appLink: false,
      addressInput: false
    });
    setShowContactInfo(false);
    
    // Reset form validation
    setFormErrors({});
    setIsSubmitting(false);
    setSubmitSuccess(false);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Find first error field and scroll to it
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.focus();
      }
      return;
    }
    
    setIsSubmitting(true);
    
    // Format data for backend according to the server's expected format
    const submissionData = {
      // Use backend field names exactly as expected by the Courses model
      sector: formData.sector,
      sectors: [formData.sector], // Convert to array if needed
      center: formData.trainingCenter,
      courseLevel: formData.courseLevel,
      courseFeeType: formData.courseFeeType,
      projectName: formData.projectName,
      typeOfProject: formData.typeOfProject,
      courseType: formData.courseType,
      name: formData.name,
      duration: formData.duration,
      certifyingAgency: formData.certifyingAgency,
      certifyingAgencyWebsite: formData.certifyingAgencyWebsite,
      qualification: formData.qualification,
      age: formData.age,
      experience: formData.experience,
      trainingMode: formData.trainingMode,
      onlineTrainingTiming: formData.onlineTrainingTiming,
      offlineTrainingTiming: formData.offlineTrainingTiming,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      appLink: formData.appLink,
      addressInput: formData.addressInput,
      ojt: formData.ojt,
      registrationCharges: formData.registrationCharges,
      courseFee: formData.courseFee,
      cutPrice: formData.cutPrice,
      examFee: formData.examFee,
      otherFee: formData.otherFee,
      emiOptionAvailable: formData.emiOptionAvailable,
      maxEMITenure: formData.maxEMITenure,
      stipendDuringTraining: formData.stipendDuringTraining,
      lastDateForApply: formData.lastDateForApply,
      youtubeURL: formData.youtubeURL,
      courseFeatures: formData.courseFeatures,
      importantTerms: formData.importantTerms,
      
      // Files - keep as comma-separated strings as server expects
      brochure: fileUrls.brochure,
      thumbnail: fileUrls.thumbnail,
      photos: fileUrls.photos,
      videos: fileUrls.videos,
      testimonialvideos: fileUrls.testimonialvideos,
      
      // Counselor info
      counslername: formData.counslername,
      counslerphonenumber: formData.counslerphonenumber,
      counslerwhatsappnumber: formData.counslerwhatsappnumber,
      counsleremail: formData.counsleremail,
      
      // Format arrays of objects as required
      docsRequired: docsRequired.filter(doc => doc.name.trim() !== '').map(doc => ({ Name: doc.name })),
      questionAnswers: questionAnswers.map(qa => ({ Question: qa.question, Answer: qa.answer }))
    };
    
    console.log('Submitting course data:', submissionData);
    
    try {
      const response = await axios.post(
        `${backendUrl}/college/courses/add`,
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth': localStorage.getItem('token')
          }
        }
      );
      
      console.log('Server response:', response);
      
      if (response && response.data && response.data.status) {
        setSubmitSuccess(true);
        alert(response.data.message || 'Course added successfully!');
        navigate('institute/myProfile');
      } else {
        alert(response.data?.message || 'Failed to add course');
      }
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CKEditor configuration
  const editorConfig = {
    toolbar: [
      'heading', '|', 
      'bold', 'italic', 'underline', 'strikethrough', '|', 
      'bulletedList', 'numberedList', '|', 
      'link', '|', 
      'undo', 'redo'
    ]
  };
  
  return (
    <div className="content-body">
      {/* Header */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Add Course</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="/admin">Home</a></li>
                  <li className="breadcrumb-item active">Add Course</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message (if form successfully submitted) */}
      {submitSuccess && (
        <div className="alert alert-success mb-2" role="alert">
          Course added successfully!
        </div>
      )}

      {/* Form */}
      <form className="form-horizontal" id="addCourseForm" onSubmit={handleSubmit}>
        {/* Course Information Section */}
        <section id="course-info">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Course Information</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      {/* Sector */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="sectorblock">
                        <label htmlFor="sector">Sector</label>
                        <select 
                          className={`form-control ${formErrors.sector ? 'is-invalid' : ''}`}
                          name="sector" 
                          id="sector"
                          value={formData.sector}
                          onChange={handleChange}
                        >
                          <option value="">Select Sector</option>
                          {Array.isArray(sectors) && sectors.length > 0 ? (
                            sectors.map((sector, i) => (
                              <option key={sector._id || i} value={sector._id}>{sector.name}</option>
                            ))
                          ) : (
                            <option disabled>No sectors available</option>
                          )}
                        </select>
                        {formErrors.sector && <div className="invalid-feedback">{formErrors.sector}</div>}
                      </div>

                      {/* Course Level */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="courseblock">
                        <label htmlFor="courseLevel">Course Level</label>
                        <select 
                          className={`form-control ${formErrors.courseLevel ? 'is-invalid' : ''}`}
                          name="courseLevel" 
                          id="courseLevel"
                          value={formData.courseLevel}
                          onChange={handleChange}
                        >
                          <option value="">Select Level</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Advance Diploma">Advance Diploma</option>
                          <option value="Degree">Degree</option>
                        </select>
                        {formErrors.courseLevel && <div className="invalid-feedback">{formErrors.courseLevel}</div>}
                      </div>

                      {/* Course Fee Type */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="courseFeeTypeblock">
                        <label htmlFor="courseFeeType">Course Fee Type</label>
                        <select 
                          className="form-control" 
                          name="courseFeeType" 
                          id="courseFeeType"
                          value={formData.courseFeeType}
                          onChange={handleChange}
                        >
                          <option value="">Select Course Fee Type</option>
                          <option value="Paid">Paid</option>
                          <option value="Free">Free</option>
                        </select>
                      </div>

                      {/* Project Name (conditional) */}
                      {showProjectFields && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="projectNameblock">
                          <label htmlFor="projectName">Project Name</label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="projectName" 
                            id="projectName"
                            value={formData.projectName}
                            onChange={handleChange}
                          />
                        </div>
                      )}

                      {/* Type of Project (conditional) */}
                      {showProjectFields && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="courseProjectblock">
                          <label htmlFor="typeOfProject">Type of Project</label>
                          <select 
                            className="form-control" 
                            name="typeOfProject" 
                            id="typeOfProject"
                            value={formData.typeOfProject}
                            onChange={handleChange}
                          >
                            <option value="">Select Type of Project</option>
                            <option value="T&P">T&P</option>
                            <option value="P&T">P&T</option>
                            <option value="General">General</option>
                          </select>
                        </div>
                      )}

                      {/* Course Type */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="courseTypeblock">
                        <label htmlFor="courseType">Course Type</label>
                        <select 
                          className="form-control" 
                          name="courseType" 
                          id="courseType"
                          value={formData.courseType}
                          onChange={handleChange}
                        >
                          <option value="">Select Type</option>
                          <option value="course">Course Only</option>
                          <option value="coursejob">Course and Job</option>
                        </select>
                      </div>

                      {/* Name */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="nameblock">
                        <label htmlFor="name">Name</label>
                        <input 
                          className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                          type="text" 
                          name="name" 
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                        />
                        {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                      </div>

                      {/* Duration */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="durationblock">
                        <label htmlFor="duration">Duration</label>
                        <input 
                          className={`form-control ${formErrors.duration ? 'is-invalid' : ''}`}
                          type="text" 
                          name="duration" 
                          id="duration"
                          value={formData.duration}
                          onChange={handleChange}
                        />
                        {formErrors.duration && <div className="invalid-feedback">{formErrors.duration}</div>}
                      </div>

                      {/* Certifying Agency */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="certifyingAgency">Certifying Agency</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="certifyingAgency" 
                          id="certifyingAgency"
                          value={formData.certifyingAgency}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Certifying Agency Website */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="certifyingAgencyWebsite">Certifying Agency Website</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="certifyingAgencyWebsite" 
                          id="certifyingAgencyWebsite"
                          value={formData.certifyingAgencyWebsite}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Qualification */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="qualificationblock">
                        <label htmlFor="qualification">Qualification</label>
                        <select 
                          className={`form-control ${formErrors.qualification ? 'is-invalid' : ''}`}
                          name="qualification" 
                          id="qualification"
                          value={formData.qualification}
                          onChange={handleChange}
                        >
                          <option value="">Select Qualification</option>
                          <option value="8th">8th</option>
                          <option value="10th">10th</option>
                          <option value="12th">12th</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Advance Diploma">Advance Diploma</option>
                          <option value="Degree">Degree</option>
                        </select>
                        {formErrors.qualification && <div className="invalid-feedback">{formErrors.qualification}</div>}
                      </div>

                      {/* Age */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="age">Age</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="age" 
                          id="age"
                          value={formData.age}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Experience */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="experience">Experience</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="experience" 
                          id="experience"
                          value={formData.experience}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Training Mode */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="trainingblock">
                        <label htmlFor="trainingMode">Training Mode</label>
                        <select 
                          className={`form-control ${formErrors.trainingMode ? 'is-invalid' : ''}`}
                          name="trainingMode" 
                          id="trainingMode"
                          value={formData.trainingMode}
                          onChange={handleChange}
                        >
                          <option value="">Select Training</option>
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                          <option value="Blended">Blended</option>
                        </select>
                        {formErrors.trainingMode && <div className="invalid-feedback">{formErrors.trainingMode}</div>}
                      </div>

                      {/* Online Training Timing (conditional) */}
                      {showTrainingFields.online && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="onlinetrainingblock">
                          <label htmlFor="onlineTrainingTiming">Online training Timing</label>
                          <textarea 
                            className="form-control" 
                            name="onlineTrainingTiming" 
                            id="onlineTrainingTiming"
                            value={formData.onlineTrainingTiming}
                            onChange={handleChange}
                          ></textarea>
                        </div>
                      )}

                      {/* Offline Training Timing (conditional) */}
                      {showTrainingFields.offline && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="offlinetrainingblock">
                          <label htmlFor="offlineTrainingTiming">Offline training Timing</label>
                          <textarea 
                            className="form-control" 
                            name="offlineTrainingTiming" 
                            id="offlineTrainingTiming"
                            value={formData.offlineTrainingTiming}
                            onChange={handleChange}
                          ></textarea>
                        </div>
                      )}

                      {/* Training Center (conditional) */}
                      {showTrainingFields.trainingCenter && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="trainingCenterblock">
                          <label htmlFor="trainingCenter">Training Center</label>
                          <select 
                            className="form-control" 
                            name="trainingCenter" 
                            id="trainingCenter"
                            multiple
                            ref={trainingCenterRef}
                            onChange={(e) => handleTrainingCenterChange(e.target.selectedOptions)}
                          >
                            {Array.isArray(centers) && centers.length > 0 ? (
                              centers.map((center, i) => (
                                <option key={center._id || i} value={center._id}>{center.name}</option>
                              ))
                            ) : (
                              <option disabled>No training centers available</option>
                            )}
                          </select>
                        </div>
                      )}

                      {/* Address */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="addressblock">
                        <label htmlFor="address">Address</label>
                        <select 
                          className={`form-control ${formErrors.address ? 'is-invalid' : ''}`}
                          name="address" 
                          id="address"
                          value={formData.address}
                          onChange={handleChange}
                        >
                          <option value="">Select Address</option>
                          <option value="App">App</option>
                          <option value="Address">Address</option>
                          <option value="Both">Both</option>
                        </select>
                        {formErrors.address && <div className="invalid-feedback">{formErrors.address}</div>}
                      </div>

                      {/* City */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="cityblock">
                        <label htmlFor="city">City</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="city" 
                          id="city"
                          value={formData.city}
                          onChange={handleChange}
                        />
                      </div>

                      {/* State */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="stateblock">
                        <label htmlFor="state">State</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="state" 
                          id="state"
                          value={formData.state}
                          onChange={handleChange}
                        />
                      </div>

                      {/* App Link (conditional) */}
                      {showAddressFields.appLink && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="applinkblock">
                          <label htmlFor="appLink">App link</label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="appLink" 
                            id="appLink"
                            value={formData.appLink}
                            onChange={handleChange}
                          />
                        </div>
                      )}

                      {/* Address Input (conditional) */}
                      {showAddressFields.addressInput && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="addressinputblock">
                          <label htmlFor="addressInput">Address</label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="addressInput" 
                            id="addressInput"
                            value={formData.addressInput}
                            onChange={handleChange}
                          />
                        </div>
                      )}

                      {/* OJT */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="ojtblock">
                        <label htmlFor="ojt">OJT</label>
                        <select 
                          className={`form-control ${formErrors.ojt ? 'is-invalid' : ''}`}
                          name="ojt" 
                          id="ojt"
                          value={formData.ojt}
                          onChange={handleChange}
                        >
                          <option value="">Select OJT</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                        {formErrors.ojt && <div className="invalid-feedback">{formErrors.ojt}</div>}
                      </div>

                      {/* Registration Charges */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="registrationCharges">Registration Charges</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="registrationCharges" 
                          id="registrationCharges"
                          value={formData.registrationCharges}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Course Fee */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="courseFee">Course Fee</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="courseFee" 
                          id="courseFee"
                          value={formData.courseFee}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Cut Price */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="cutPrice">Cut Price</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="cutPrice" 
                          id="cutPrice"
                          value={formData.cutPrice}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Exam Fee */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="examFee">Exam Fee</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="examFee" 
                          id="examFee"
                          value={formData.examFee}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Other Fee */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="otherFee">Other fee if any</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="otherFee" 
                          id="otherFee"
                          value={formData.otherFee}
                          onChange={handleChange}
                        />
                      </div>

                      {/* EMI Option */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="emioptionblock">
                        <label htmlFor="emiOptionAvailable">EMI Option Available</label>
                        <select 
                          className={`form-control ${formErrors.emiOptionAvailable ? 'is-invalid' : ''}`}
                          name="emiOptionAvailable" 
                          id="emiOptionAvailable"
                          value={formData.emiOptionAvailable}
                          onChange={handleChange}
                        >
                          <option value="">Select EMI Option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                        {formErrors.emiOptionAvailable && <div className="invalid-feedback">{formErrors.emiOptionAvailable}</div>}
                      </div>

                      {/* Max EMI Tenure */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="maxEMITenure">Max EMI Tenure</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="maxEMITenure" 
                          id="maxEMITenure"
                          value={formData.maxEMITenure}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Stipend During Training */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="stipendDuringTraining">Stipend During Training</label>
                        <input 
                          className="form-control" 
                          type="text" 
                          name="stipendDuringTraining" 
                          id="stipendDuringTraining"
                          value={formData.stipendDuringTraining}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Last Date for Apply */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                        <label htmlFor="lastDateForApply">Last date for apply</label>
                        <input 
                          className="form-control" 
                          type="date" 
                          name="lastDateForApply" 
                          id="lastDateForApply"
                          value={formData.lastDateForApply}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Youtube URL */}
                      <div className="col-xl-3 mb-1">
                        <label htmlFor="youtubeURL">Youtube URL</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="enter youtube url" 
                          id="youtubeURL"
                          name="youtubeURL"
                          value={formData.youtubeURL}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Documents Required Section */}
        <section id="docsRequired">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Documents Required</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div id="documentContainer">
                      {docsRequired.map((doc, index) => (
                        <div className="row requiredDocsRow" key={index}>
                          <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1">
                            <label>Document Name</label>
                            <input 
                              type="text" 
                              className="form-control docsName" 
                              value={doc.name}
                              onChange={(e) => updateDocumentField(index, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="col-xl-12 mb-1 px-0 text-right">
                      <button 
                        type="button" 
                        className="btn btn-success text-white add-another-button"
                        onClick={addDocumentField}
                      >
                        + Add Another
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Add Docs Section */}
        <section id="add-docs">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Add Docs</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      {/* Videos */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1">
                        <label htmlFor="videos">Add Videos</label>
                        <input 
                          id="videos" 
                          type="file" 
                          multiple 
                          onChange={(e) => handleFileChange(e, 'videos')}
                        />
                        {fileUrls.videos && (
                          <div className="mt-1 text-success">
                            Videos uploaded successfully
                          </div>
                        )}
                      </div>
                      
                      {/* Brochure */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1" id="brochures">
                        <label htmlFor="brochure">Add Brochure</label>
                        <input 
                          id="brochure" 
                          type="file"
                          onChange={(e) => handleFileChange(e, 'brochure')}
                        />
                        {fileUrls.brochure && (
                          <div className="mt-1 text-success">
                            Brochure uploaded successfully
                          </div>
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1" id="thumbnails">
                        <label htmlFor="thumbnail">Add Thumbnail</label>
                        <input 
                          id="thumbnail" 
                          type="file"
                          onChange={(e) => handleFileChange(e, 'thumbnail')}
                        />
                        {fileUrls.thumbnail && (
                          <div className="mt-1 text-success">
                            Thumbnail uploaded successfully
                          </div>
                        )}
                      </div>

                      {/* Photos */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1" id="uploadgallery">
                        <label htmlFor="photos">Add Photos</label>
                        <input 
                          id="photos" 
                          type="file" 
                          multiple
                          onChange={(e) => handleFileChange(e, 'photos')}
                        />
                        {fileUrls.photos && (
                          <div className="mt-1 text-success">
                            Photos uploaded successfully
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

        {/* Testimonial Videos Section */}
        <section id="testimonial-videos">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Testimonial Videos</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1">
                        <label htmlFor="testimonialvideos">Add Testimonial Videos</label>
                        <input 
                          id="testimonialvideos" 
                          type="file" 
                          multiple
                          onChange={(e) => handleFileChange(e, 'testimonialvideos')}
                        />
                        {fileUrls.testimonialvideos && (
                          <div className="mt-1 text-success">
                            Testimonial videos uploaded successfully
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

        {/* Extra Features Section */}
        <section id="extra-features">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Extra Features</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      {/* Course Feature */}
                      <div className="col-xl-6 col-xl-lg-6 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Course Feature</label>
                        <div className="ck-editor-container">
                          <CKEditor
                            editor={ClassicEditor}
                            data={formData.courseFeatures}
                            config={editorConfig}
                            onChange={(event, editor) => {
                              const data = editor.getData();
                              setFormData({
                                ...formData,
                                courseFeatures: data
                              });
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Important Terms */}
                      <div className="col-xl-6 col-xl-lg-6 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Important Terms</label>
                        <div className="ck-editor-container">
                          <CKEditor
                            editor={ClassicEditor}
                            data={formData.importantTerms}
                            config={editorConfig}
                            onChange={(event, editor) => {
                              const data = editor.getData();
                              setFormData({
                                ...formData,
                                importantTerms: data
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Counselor Section */}
        <section id="counselor-info">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Dedicated Counselor</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-12 mb-2">
                        <label className="h5">Do you want to Add the Dedicated Counselor Number?</label>
                        
                        <div className="form-check-inline ml-3">
                          <input 
                            type="radio" 
                            id="contact-directly-yes" 
                            name="isContact" 
                            value="true"
                            checked={formData.isContact === true}
                            onChange={() => handleContactChange('true')}
                          />
                          <label htmlFor="contact-directly-yes" className="ml-1">Yes</label>
                        </div>
                        <div className="form-check-inline ml-2">
                          <input 
                            type="radio" 
                            id="contact-directly-no" 
                            name="isContact" 
                            value="false"
                            checked={formData.isContact === false}
                            onChange={() => handleContactChange('false')}
                          />
                          <label htmlFor="contact-directly-no" className="ml-1">No</label>
                        </div>
                      </div>
                      
                      {showContactInfo && (
                        <div className="col-12" id="contact-info">
                          <div className="row">
                            {/* Counselor Name */}
                            <div className="col-xl-3 mb-1" id="counsler-name">
                              <label htmlFor="counslername">Name</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                name="counslername" 
                                id="counslername" 
                                placeholder="Name"
                                value={formData.counslername}
                                onChange={handleChange}
                              />
                            </div>
                            
                            {/* Counselor Phone */}
                            <div className="col-xl-3 mb-1" id="counsler-phoneNumber">
                              <label htmlFor="counslerphonenumber">Phone Number<span className="text-danger">*</span></label>
                              <input 
                                type="tel" 
                                className="form-control" 
                                id="counslerphonenumber" 
                                pattern="[+]?[0-9]{1,3}\\s?\\d{9,12}" 
                                placeholder="Phone no" 
                                name="counslerphonenumber"
                                maxLength="10"
                                value={formData.counslerphonenumber}
                                onChange={handleChange}
                              />
                            </div>
                            
                            {/* Counselor WhatsApp */}
                            <div className="col-xl-3 mb-1" id="counsler-whatsappNumber">
                              <label htmlFor="counslerwhatsappnumber">WhatsApp Number</label>
                              <input 
                                type="tel" 
                                className="form-control" 
                                id="counslerwhatsappnumber" 
                                pattern="[+]?[0-9]{1,3}\\s?\\d{9,12}" 
                                placeholder="WhatsApp Number" 
                                name="counslerwhatsappnumber"
                                maxLength="10"
                                value={formData.counslerwhatsappnumber}
                                onChange={handleChange}
                              />
                            </div>
                            
                            {/* Counselor Email */}
                            <div className="col-xl-3 mb-1" id="counsler-email">
                              <label htmlFor="counsleremail">Email</label>
                              <input 
                                className="form-control" 
                                type="email" 
                                name="counsleremail" 
                                placeholder="Enter your email" 
                                id="counsleremail"
                                value={formData.counsleremail}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Question & Answer Section */}
        <section id="faq-section">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card mt-1">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">FAQ</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div id="questionanswerlist">
                      {questionAnswers.map((qa, index) => (
                        <div className="row questionanswerrow mb-4" key={index}>
                          <div className="col-xl-6 mb-1">
                            <label>Question</label>
                            <div className="ck-editor-container">
                              <CKEditor
                                editor={ClassicEditor}
                                data={qa.question}
                                config={editorConfig}
                                onChange={(event, editor) => {
                                  const data = editor.getData();
                                  updateQuestionAnswer(index, 'question', data);
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-xl-6 mb-1">
                            <label>Answer</label>
                            <div className="ck-editor-container">
                              <CKEditor
                                editor={ClassicEditor}
                                data={qa.answer}
                                config={editorConfig}
                                onChange={(event, editor) => {
                                  const data = editor.getData();
                                  updateQuestionAnswer(index, 'answer', data);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="col-xl-12 mb-1 px-0 text-right">
                      <button 
                        type="button" 
                        className="btn btn-success text-white add-button"
                        onClick={addQuestionAnswer}
                      >
                        + Add Another
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Buttons */}
        <div className="row mt-3 mb-5">
          <div className="col-lg-12 col-md-12 col-sm-12 col-12 text-right">
            <button 
              type="button" 
              onClick={resetForm} 
              className="btn btn-danger waves-effect waves-light mr-2"
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button 
              type="submit" 
              className="btn btn-success px-lg-4 waves-effect waves-light"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
      <style>
        {
          `
          .ck-editor__editable_inline{
          height:40px;
          }
          
          `
        }
      </style>
    </div>
  );
};

export default AddCourse;