import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';

const EditCourse = () => {

  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const { id } = useParams(); // Get course ID from URL
  const navigate = useNavigate();
  const centerRef = useRef(null);
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

   //vertical and project handle
    const [selectedVertical, setSelectedVertical] = useState([]);
    const [verticals, setVerticals] = useState([]);
    const [projects, setProjects] = useState([]);

  // State for data from API
  const [sectors, setSectors] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedBrochure, setSelectedBrochure] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [selectedTestimonialVideos, setSelectedTestimonialVideos] = useState([]);

  const choicesInstance = useRef(null);

  // Document requirements
  const [docsRequired, setDocsRequired] = useState([]);

  // FAQ questions and answers
  const [questionAnswers, setQuestionAnswers] = useState([
    { question: '', answer: '' }
  ]);

  // UI control states
  const [showProjectFields, setShowProjectFields] = useState(false);
  const [showTrainingFields, setShowTrainingFields] = useState({
    online: false,
    offline: false,
    center: false
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

  // Basic form state
  const [formData, setFormData] = useState({
    sectors: [],
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
    center: [],
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
    brochure: '',
    thumbnail: '',
    photos: [],
    videos: [],
    testimonialvideos: [],
  });

   useEffect(() => {
      if (!formData.project) {
        setCenters([]); // Clear centers if project is empty     
        return; // Exit early if no project is selected
      }
  
      const fetchCenters = async () => {
        try {
          const response = await axios.get(`${backendUrl}/college/list-centers?projectId=${formData.project}`, {
            headers: { 'x-auth': token },
          });
  
          if (response.data.success) {
            setCenters(response.data.data); // Set the centers
          } else {
            setCenters([]); // Handle case where no data is returned
          }
        } catch (error) {
          console.error("Error fetching centers:", error);
          setCenters([]); // Fallback in case of error
        }
      };
  
      fetchCenters(); // Trigger the fetch function when project changes
    }, [formData.project, backendUrl, token]); // Re-run the effect whenever the project changes
  

      useEffect(() => {
        // Cleanup previous instance
        const cleanupChoices = () => {
          if (choicesInstance.current) {
            try {
              // Check if the instance has a valid element before destroying
              if (choicesInstance.current.passedElement && 
                  choicesInstance.current.passedElement.element) {
                choicesInstance.current.destroy();
              }
            } catch (error) {
              console.warn('Error destroying Choices instance:', error);
            }
            choicesInstance.current = null;
          }
        };
    
        // Initialize Choices.js when training center field is visible and centers are available
        if (showTrainingFields.center && 
            centerRef.current && 
            centers.length > 0) {
          
          // Clean up any existing instance first
          cleanupChoices();
    
          try {
            // Initialize new Choices instance
            choicesInstance.current = new Choices(centerRef.current, {
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
    
            // Set selected values if any
            if (formData.center && formData.center.length > 0) {
              choicesInstance.current.setChoiceByValue(formData.center);
            }
          } catch (error) {
            console.error('Error initializing Choices:', error);
          }
        } else {
          // Clean up if field is not visible or no centers available
          cleanupChoices();
        }
    
        // Cleanup function
        return cleanupChoices;
      }, [showTrainingFields.center, centers, formData.center]);
    
      // Fetch verticals on mount
      useEffect(() => {
        fetchVerticals();
      }, []);
    
      useEffect(() => {
        console.log('projects', projects);
      }, [projects]);
    
      // Fetch projects when vertical changes
      useEffect(() => {
        const fetchProjects = async () => {
          if (formData.vertical) {
            try {
              const response = await axios.get(`${backendUrl}/college/list-projects?vertical=${formData.vertical}`, {
                headers: { 'x-auth': token }
              });
              if (response.data.success) {
                setProjects(response.data.data);
              } else {
                setProjects([]);
                console.error('Failed to fetch projects');
              }
            } catch (error) {
              setProjects([]);
              console.error('Error fetching projects:', error);
            }
          } else {
            setProjects([]);
          }
        };
    
        fetchProjects();
      }, [formData.vertical, backendUrl, token]);
    
      const fetchVerticals = async () => {
        try {
          const newVertical = await axios.get(`${backendUrl}/college/getVerticals`, { 
            headers: { 'x-auth': token } 
          });
          // Update the whole enhancedEntities but keep other keys unchanged
          setVerticals(newVertical.data.data);
        } catch (error) {
          console.error('Error fetching verticals:', error);
          setVerticals([]);
        }
      };

  

  // Fetch course, sectors and centers data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const headers = {
          'x-auth': user.token,
        };
        // Fetch course data
        const courseRes = await axios.get(`${backendUrl}/college/courses/edit/${id}`, { headers });
        console.log('courseRes', courseRes)
        // Fetch sectors and centers data
        const sectorsRes = await axios.get(`${backendUrl}/api/sectorList`);

        console.log('Course data:', courseRes.data);
        console.log('Sectors data:', sectorsRes.data);

        // Set sectors and centers
        setSectors(Array.isArray(sectorsRes.data) ? sectorsRes.data : []);


        // Format the course data
        const course = courseRes.data.course;
        console.log('course...', courseRes.data.course);
        // Initialize form data with course data
        setFormData({
          sectors: course.sectors ? course.sectors.map(c => c._id) : [],
          courseLevel: course.courseLevel || '',
          courseFeeType: course.courseFeeType || '',
          vertical: course.vertical || '',
          project: course.project || '',
          projectName: course.projectName || '',
          typeOfProject: course.typeOfProject || '',
          courseType: course.courseType || '',
          name: course.name || '',
          duration: course.duration || '',
          certifyingAgency: course.certifyingAgency || '',
          certifyingAgencyWebsite: course.certifyingAgencyWebsite || '',
          qualification: course.qualification || '',
          age: course.age || '',
          experience: course.experience || '',
          trainingMode: course.trainingMode || '',
          onlineTrainingTiming: course.onlineTrainingTiming || '',
          offlineTrainingTiming: course.offlineTrainingTiming || '',
          center: course.center ? course.center.map(c => c._id) : [],
          address: course.address || '',
          city: course.city || '',
          state: course.state || '',
          appLink: course.appLink || '',
          addressInput: course.Address || '',
          ojt: course.ojt || '',
          registrationCharges: course.registrationCharges || '',
          courseFee: course.courseFee || '',
          cutPrice: course.cutPrice || '',
          examFee: course.examFee || '',
          otherFee: course.otherFee || '',
          emiOptionAvailable: course.emiOptionAvailable || '',
          maxEMITenure: course.maxEMITenure || '',
          stipendDuringTraining: course.stipendDuringTraining || '',
          lastDateForApply: course.lastDateForApply ? new Date(course.lastDateForApply).toISOString().split('T')[0] : '',
          youtubeURL: course.youtubeURL || '',
          courseFeatures: course.courseFeatures || '',
          importantTerms: course.importantTerms || '',
          brochure: course.brochure || '',
          thumbnail: course.thumbnail || '',
          photos: course.photos || [],
          videos: course.videos || [],
          testimonialvideos: course.testimonialvideos || [],
          isContact: !!course.counslername || !!course.counslerphonenumber,
          counslername: course.counslername || '',
          counslerphonenumber: course.counslerphonenumber || '',
          counslerwhatsappnumber: course.counslerwhatsappnumber || '',
          counsleremail: course.counsleremail || '',
        });

        // Set docs required
        if (course.docsRequired && course.docsRequired.length > 0) {
          setDocsRequired(course.docsRequired.map(doc => ({
            _id: doc._id,
            name: doc.Name
          })));
        }

        // Set question answers
        if (course.questionAnswers && course.questionAnswers.length > 0) {
          setQuestionAnswers(course.questionAnswers.map(qa => ({
            question: qa.Question || '',
            answer: qa.Answer || ''
          })));
        }

        // Set UI state based on course data
        setShowProjectFields(course.courseFeeType === 'Free');
        setShowContactInfo(!!course.counslername || !!course.counslerphonenumber);
        handleTrainingModeChange(course.trainingMode);
        handleAddressChange(course.address);

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error loading course data. Please try again.');
      }
    };

    fetchData();
  }, []);

  // Initialize Choices.js for multi-select fields when training center is visible
  useEffect(() => {
    if (showTrainingFields.center && centerRef.current) {
      if (choicesInstance.current) {
        choicesInstance.current.destroy(); // destroy previous instance
      }

      choicesInstance.current = new Choices(centerRef.current, {
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

      // Set selected options
      if (formData.center?.length) {
        choicesInstance.current.setChoiceByValue(formData.center);
      }

      // Remove empty option if it exists
      const emptyOption = centerRef.current.querySelector('option[value=""]');
      if (emptyOption) {
        emptyOption.remove();
      }

      return () => {
        if (choicesInstance.current) {
          choicesInstance.current.destroy();
        }
      };
    }
  }, [showTrainingFields.center, centers, formData.center]);

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
      center: value === 'Offline' || value === 'Blended'
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
  const handlecenterChange = (selectedOptions) => {
    const selectedValues = Array.from(selectedOptions).map(option => option.value);
    setFormData({
      ...formData,
      center: selectedValues ? [selectedValues] : []
    });
  };


  useEffect(()=>{
    console.log('selected sectos',formData )
  },[formData.sectors])

  const handleSectorChange = (e) => {
  const selectedValues = Array.from(e.target.selectedOptions).map(option => option.value);
  console.log('selectedValues', selectedValues);
  setFormData({
    ...formData,
    sectors: selectedValues ? [selectedValues] : []
  });
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

  // File upload handlers
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedPhotos(files);
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedVideos(files);
  };

  const handleTestimonialVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedTestimonialVideos(files);
  };

  const handleBrochureUpload = (e) => {
    const file = e.target.files[0];
    if (validateFile(file, 'brochure')) {
      setSelectedBrochure(file);
    }
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (validateFile(file, 'thumbnail')) {
      setSelectedThumbnail(file);
    }
  };

  // Handle remove file from server
  const removeFile = async (fileType, key) => {
    try {
      await axios.post(`${backendUrl}/api/deletefile`, { key });

      let endpoint = '';
      switch (fileType) {
        case 'video':
          endpoint = '/college/courses/removevideo';
          setFormData(prev => ({ ...prev, videos: prev.videos.filter(v => v !== key) }));
          break;
        case 'photo':
          endpoint = '/college/courses/removephoto';
          setFormData(prev => ({ ...prev, photos: prev.photos.filter(p => p !== key) }));
          break;
        case 'testimonial':
          endpoint = '/college/courses/removetestimonial';
          setFormData(prev => ({ ...prev, testimonialvideos: prev.testimonialvideos.filter(t => t !== key) }));
          break;
        case 'brochure':
          endpoint = '/college/courses/removebrochure';
          setFormData(prev => ({ ...prev, brochure: '' }));
          break;
        case 'thumbnail':
          endpoint = '/college/courses/removethumbnail';
          setFormData(prev => ({ ...prev, thumbnail: '' }));
          break;
        default:
          break;
      }

      if (endpoint) {
        await axios.post(`${backendUrl}${endpoint}`, { courseId: id, key });
        alert(`${fileType} removed successfully`);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Failed to remove file');
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

  // Remove document field
  const removeDocumentField = (index) => {
    const updatedDocs = [...docsRequired];
    updatedDocs.splice(index, 1);
    setDocsRequired(updatedDocs);
  };

  // Handle document disabling (server call)
  const disableDocument = async (docId) => {
    if (window.confirm('Are you sure you want to remove this document?')) {
      try {
        const res = await axios.patch(`${backendUrl}/college/courses/${id}/disable-doc/${docId}`,docId,{
          headers: {
            'x-auth': token
          }
        });
        alert(res.data.message);
        // Remove from local state
        setDocsRequired(prev => prev.filter(doc => doc._id !== docId));
      } catch (error) {
        console.error('Error disabling document:', error);
        alert('Failed to disable document');
      }
    }
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
      'courseLevel', 'name', 'duration', 'qualification',
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
    if (window.confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      window.location.reload();
    }
  };

  // Handle form submission
  // Fixed handleSubmit function - Replace your existing one

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsSubmitting(true);

  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const form = new FormData();

    // Append form fields - FIXED VERSION
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'photos' && key !== 'videos' && key !== 'testimonialvideos' &&
        key !== 'brochure' && key !== 'thumbnail') {
        
        // Special handling for sectors
        if (key === 'sectors' && Array.isArray(value)) {
          // Send multiple values with same field name
          value.forEach(v => form.append('sectors', v));
        } 
        // Keep center as array format
        else if (key === 'center' && Array.isArray(value)) {
          value.forEach(v => form.append(`center`, v));
        }
        // Handle other arrays (if any)
        else if (Array.isArray(value)) {
          value.forEach(v => form.append(`${key}[]`, v));
        } 
        // Handle single values
        else {
          form.append(key, value);
        }
      }
    });

    // Rest of your code remains same...
    form.append('existingPhotos', JSON.stringify(formData.photos));
    form.append('existingVideos', JSON.stringify(formData.videos));
    form.append('existingTestimonialVideos', JSON.stringify(formData.testimonialvideos));
    form.append('existingBrochure', formData.brochure);
    form.append('existingThumbnail', formData.thumbnail);

    // Append new files
    if (selectedVideos.length > 0) {
      selectedVideos.forEach(file => form.append('videos', file));
    }

    if (selectedPhotos.length > 0) {
      selectedPhotos.forEach(file => form.append('photos', file));
    }

    if (selectedBrochure) {
      form.append('brochure', selectedBrochure);
    }

    if (selectedThumbnail) {
      form.append('thumbnail', selectedThumbnail);
    }

    if (selectedTestimonialVideos.length > 0) {
      selectedTestimonialVideos.forEach(file => form.append('testimonialvideos', file));
    }

    // Append docs required
    form.append('docsRequired', JSON.stringify(docsRequired.map(doc => ({
      _id: doc._id,
      Name: doc.name
    }))));

    // Append question answers
    form.append('questionAnswers', JSON.stringify(questionAnswers.map(qa => ({
      Question: qa.question,
      Answer: qa.answer
    }))));

    const response = await axios.put(`${backendUrl}/college/courses/edit/${id}`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth': user?.token || sessionStorage.getItem('token')
      }
    });

    if (response.data.status) {
      setSubmitSuccess(true);
      alert('Course updated successfully');
      navigate('/institute/viewcourse');
    } else {
      alert(response.data.message || 'Failed to update course');
    }
  } catch (error) {
    console.error('Error updating course:', error);
    alert('Error updating course. Please try again.');
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
              <h3 className="content-header-title float-left mb-0">Edit Course</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="/institute/dashboard">Home</a></li>
                  <li className="breadcrumb-item active">Edit Course</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message (if form successfully submitted) */}
      {submitSuccess && (
        <div className="alert alert-success mb-2" role="alert">
          Course updated successfully!
        </div>
      )}

      {/* Form */}
      <form className="form-horizontal" id="editCourseForm" onSubmit={handleSubmit}>
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
                        <label htmlFor="sectors">Sector</label>
                        <select
                          className={`form-control ${formErrors.sectors ? 'is-invalid' : ''}`}
                          name="sectors"
                          id="sectors"
                          value={formData.sectors[0]}
                           onChange={handleSectorChange}
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
                        {formErrors.sectors && <div className="invalid-feedback">{formErrors.sectors}</div>}
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

                      {/* Vertical */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="courseProjectblock">
                        <label htmlFor="vertical">Vertical</label>
                        <select
                          className="form-control"
                          name="vertical"
                          id="vertical"
                          value={formData.vertical}
                          onChange={handleChange}
                        >
                          <option value="">Select Vertical</option>
                          {verticals.map((vertical, index) => (
                            <option key={vertical._id || index} value={vertical._id}>{vertical.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Project */}
                      <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="courseProjectblock">
                        <label htmlFor="project">Project</label>
                        <select
                          className="form-control"
                          name="project"
                          id="project"
                          value={formData.project}
                          onChange={handleChange}
                        >
                          <option value="">Select Project</option>
                          {projects.map((project, index) => (
                            <option key={project._id || index} value={project._id}>{project.name}</option>
                          ))}
                        </select>
                      </div>

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
                      {showTrainingFields.center && (
                        <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1" id="centerblock">
                          <label htmlFor="center">Training Center</label>
                          <select
                            className="form-control"
                            name="center"
                            id="center"
                            multiple
                            value={formData.center}
                            ref={centerRef}
                            onChange={(e) => handlecenterChange(e.target.selectedOptions)}
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
                        <div className="row requiredDocsRow" key={doc._id || index}>
                          <div className="col-xl-3 col-xl-lg-3 col-md-2 col-sm-12 col-12 mb-1 doc-item">
                            <label>Document Name</label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control docsName"
                                value={doc.name || ''}
                                onChange={(e) => updateDocumentField(index, e.target.value)}
                              />
                              <div className="input-group-append">
                                <button
                                  className="btn btn-danger remove-doc"
                                  type="button"
                                  onClick={() => doc._id ? disableDocument(doc._id) : removeDocumentField(index)}
                                >
                                  X
                                </button>
                              </div>
                            </div>
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
                        {docsRequired.length > 0 ? 'Add Another' : 'Add Document'}
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
                      {/* Existing Videos */}
                      {formData.videos && formData.videos.length > 0 && (
                        <div className="col-12 mb-3">
                          <h5>Uploaded Videos</h5>
                          <div className="row">
                            {formData.videos.map((video, i) => (
                              <div key={`video-${i}`} className="col-xl-2 col-lg-2 col-md-3 col-sm-4 col-6 mb-2">
                                <div className="card">
                                  <div className="card-body p-1">
                                    <a href={`${bucketUrl}/${video}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                                      Video {i + 1}
                                    </a>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger ml-2"
                                      onClick={() => removeFile('video', video)}
                                    >
                                      <i className="feather icon-x"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Videos */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1">
                        <label htmlFor="videos">Add New Videos</label>
                        <input
                          name="videos"
                          id="videos"
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleVideoUpload}
                        />
                      </div>

                      {/* Existing Photos */}
                      {formData.photos && formData.photos.length > 0 && (
                        <div className="col-12 mb-3">
                          <h5>Uploaded Photos</h5>
                          <div className="row">
                            {formData.photos.map((photo, i) => (
                              <div key={`photo-${i}`} className="col-xl-2 col-lg-2 col-md-3 col-sm-4 col-6 mb-2">
                                <div className="card">
                                  <div className="card-body p-1 text-center">
                                    <img
                                      src={`${bucketUrl}/${photo}`}
                                      alt={`Photo ${i + 1}`}
                                      className="img-fluid mb-1"
                                      style={{ maxHeight: '100px' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger"
                                      onClick={() => removeFile('photo', photo)}
                                    >
                                      <i className="feather icon-x"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Photos */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1" id="uploadgallery">
                        <label htmlFor="photos">Add New Photos</label>
                        <input
                          type="file"
                          id="photos"
                          name="photos"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                        />
                      </div>

                      {/* Existing Brochure */}
                      {formData.brochure && (
                        <div className="col-12 mb-3">
                          <h5>Uploaded Brochure</h5>
                          <div className="row">
                            <div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 mb-2">
                              <div className="card">
                                <div className="card-body p-2">
                                  <a href={`${bucketUrl}/${formData.brochure}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                                    View Brochure
                                  </a>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger ml-2"
                                    onClick={() => removeFile('brochure', formData.brochure)}
                                  >
                                    <i className="feather icon-x"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Brochure */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1" id="brochures">
                        <label htmlFor="brochure">Add New Brochure</label>
                        <input
                          type="file"
                          id="brochure"
                          name="brochure"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleBrochureUpload}
                        />
                      </div>

                      {/* Existing Thumbnail */}
                      {formData.thumbnail && (
                        <div className="col-12 mb-3">
                          <h5>Uploaded Thumbnail</h5>
                          <div className="row">
                            <div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 mb-2">
                              <div className="card">
                                <div className="card-body p-2">
                                  <a href={`${bucketUrl}/${formData.thumbnail}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                                    View Thumbnail
                                  </a>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger ml-2"
                                    onClick={() => removeFile('thumbnail', formData.thumbnail)}
                                  >
                                    <i className="feather icon-x"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1" id="thumbnails">
                        <label htmlFor="thumbnail">Add New Thumbnail</label>
                        <input
                          type="file"
                          id="thumbnail"
                          name="thumbnail"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                        />
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
                    {/* Existing Testimonial Videos */}
                    {formData.testimonialvideos && formData.testimonialvideos.length > 0 && (
                      <div className="row mb-3">
                        <div className="col-12">
                          <h5>Uploaded Testimonial Videos</h5>
                          <div className="row">
                            {formData.testimonialvideos.map((video, i) => (
                              <div key={`testimonial-${i}`} className="col-xl-2 col-lg-2 col-md-3 col-sm-4 col-6 mb-2">
                                <div className="card">
                                  <div className="card-body p-1">
                                    <a href={`${bucketUrl}/${video}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                                      Testimonial {i + 1}
                                    </a>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger ml-2"
                                      onClick={() => removeFile('testimonial', video)}
                                    >
                                      <i className="feather icon-x"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-xl-4 col-xl-lg-4 col-md-4 col-sm-12 col-12 mb-1">
                        <label htmlFor="testimonialvideos">Add New Testimonial Videos</label>
                        <input
                          type="file"
                          id="testimonialvideos"
                          name="testimonialvideos"
                          accept="video/*"
                          multiple
                          onChange={handleTestimonialVideoUpload}
                        />
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
              className="btn btn-success px-lg-4 waves-effect waves-light ms-2"
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
          .ck-editor__editable_inline {
            height: 100px;
          }
          
          .choices__list--multiple .choices__item {
            position: relative !important;
            margin: 3px 5px 3px 0 !important;
            padding: 3px 20px 3px 5px !important;
            border: 1px solid #aaa !important;
            max-width: 100% !important;
            border-radius: 3px !important;
            background-color: #eee !important;
            color: #333 !important;
            line-height: 13px !important;
            cursor: default !important;
          }
          
          .choices[data-type*=select-multiple] .choices__button {
            position: absolute;
            right: 0;
            top: 0;
            padding: 2px 6px;
            margin-right: 0;
            border: none;
            background-color: transparent;
            border-left: 1px solid #aaa;
            color: #333;
          }
          `
        }
      </style>
    </div>
  );
};

export default EditCourse;
