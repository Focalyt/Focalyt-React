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

  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const navigate = useNavigate();
  const trainingCenterRef = useRef(null);
  const choicesInstance = useRef(null);
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State for data from API
  const [sectors, setSectors] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedBrochure, setSelectedBrochure] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [selectedTestimonialVideos, setSelectedTestimonialVideos] = useState([]);

  const [selectedPhotoPreviews, setSelectedPhotoPreviews] = useState([]);
  const [selectedThumbnailPreview, setSelectedThumbnailPreview] = useState(null);
  const [selectedTestimonialPreviews, setSelectedTestimonialPreviews] = useState([]);
  const [selectedBrochurePreview, setSelectedBrochurePreview] = useState(null);

  //vertical and project handle
  const [selectedVertical, setSelectedVertical] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const [projects, setProjects] = useState([]);

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

  // Fetch centers when project changes
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

  // Fetch sectors and centers data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace these URLs with your actual API endpoints
        const sectorsResponse = await axios.get(`${backendUrl}/api/sectorList`);
        console.log('Sectors response:', sectorsResponse.data);
        setSectors(Array.isArray(sectorsResponse.data) ? sectorsResponse.data : []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Set empty arrays as fallback
        setSectors([]);
      }
    };

    fetchData();
  }, [backendUrl]);

  // Consolidated Choices.js management - FIXED VERSION
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
    if (showTrainingFields.trainingCenter && 
        trainingCenterRef.current && 
        centers.length > 0) {
      
      // Clean up any existing instance first
      cleanupChoices();

      try {
        // Initialize new Choices instance
        choicesInstance.current = new Choices(trainingCenterRef.current, {
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
        if (formData.trainingCenter && formData.trainingCenter.length > 0) {
          choicesInstance.current.setChoiceByValue(formData.trainingCenter);
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
  }, [showTrainingFields.trainingCenter, centers, formData.trainingCenter]);

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

  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // If project is selected to the default value, reset it to empty string
    if (name === 'project' && value === '') {
      setFormData({
        ...formData,
        [name]: ''  // Reset to empty string when the default option is selected
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

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
      'sectors', 'courseLevel', 'name', 'duration', 'qualification',
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
      sector: [],
      courseLevel: '',
      courseFeeType: '',
      projectName: '',
      vertical: '',
      project: '',
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

    // Reset file states
    setSelectedVideos([]);
    setSelectedPhotos([]);
    setSelectedBrochure(null);
    setSelectedThumbnail(null);
    setSelectedTestimonialVideos([]);

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


  const handleBrochureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;


    try {
      // Validate brochure file
      if (validateFile(file, 'brochure')) {
        // Cleanup previous preview
        if (selectedBrochurePreview && selectedBrochurePreview.url) {
          URL.revokeObjectURL(selectedBrochurePreview.url);
        }
        setFormData(prevData => ({
          ...prevData,
          brochure: file
        }));

        setSelectedBrochure(file);

        // Create preview object


        console.log('Brochure uploaded successfully:', file.name);
      }
    } catch (error) {
      alert(error.message);
      e.target.value = ''; // Reset input
    }
  };

  const handleTestimonialVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      // Validate all files first
      const validFiles = [];
      const previews = [];

      files.forEach(file => {
        // Validate testimonial video
        if (validateTestimonialVideo(file)) {
          validFiles.push(file);

          setFormData(prev => ({
            ...prev,
            testimonialvideos: [...prev.testimonialvideos, file]
          }));

          // Create preview object
          // previews.push({
          //   file: file,
          //   url: URL.createObjectURL(file),
          //   name: file.name,
          //   size: file.size,
          //   type: file.type
          // });
        }
      });

      if (validFiles.length > 0) {
        setSelectedTestimonialVideos(prev => [...prev, ...validFiles]);
        setSelectedTestimonialPreviews(prev => [...prev, ...previews]);

        console.log(`${validFiles.length} testimonial video(s) uploaded successfully`);
      }
    } catch (error) {
      alert(error.message);
      e.target.value = ''; // Reset input
    }
  };

  const validateTestimonialVideo = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB for testimonial videos
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please upload testimonial videos in MP4, WebM, OGG, AVI, or MOV format');
    }

    if (file.size > maxSize) {
      throw new Error('Testimonial video file must be less than 50MB');
    }

    return true;
  };

  const removeAllTestimonials = () => {
    if (window.confirm('Are you sure you want to remove all testimonial videos?')) {
      // Cleanup object URLs
      selectedTestimonialPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });

      setSelectedTestimonialVideos([]);
      setSelectedTestimonialPreviews([]);

      // Reset file input
      const testimonialInput = document.getElementById('testimonialvideos');
      if (testimonialInput) {
        testimonialInput.value = '';
      }
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate files
    const validFiles = [];
    const previews = [];

    files.forEach(file => {
      if (validateFile(file, 'photos')) {
        validFiles.push(file);

        setFormData(prevData => ({
          ...prevData,
          photos: [...prevData.photos, file]
        }));


      }
    });

    if (validFiles.length > 0) {
      setSelectedPhotos(prev => [...prev, ...validFiles]);
      setSelectedPhotoPreviews(prev => [...prev, ...previews]);

      console.log(`${validFiles.length} photo(s) uploaded successfully`);
    }
  };
  
  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (validateFile(file, 'thumbnail')) {
        // Cleanup previous preview
        if (selectedThumbnailPreview && selectedThumbnailPreview.url) {
          URL.revokeObjectURL(selectedThumbnailPreview.url);
        }

        setFormData(prevData => ({
          ...prevData,
          thumbnail: URL.createObjectURL(file)
        }));

        setSelectedThumbnail(file);

        console.log('Thumbnail uploaded successfully:', file.name);
      }
    } catch (error) {
      alert(error.message);
      e.target.value = '';
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clean up old object URLs from previous uploads
      if (formData.videos && formData.videos.length > 0) {
        formData.videos.forEach(video => {
          if (video instanceof File) {
            // Revoke previous object URL if it exists
            try {
              URL.revokeObjectURL(URL.createObjectURL(video));
            } catch (error) {
              console.log('No object URL to revoke');
            }
          }
        });
      }

      // Update state with new video
      setSelectedVideos([file]);
      setFormData(prevData => ({
        ...prevData,
        videos: [file]
      }));

      console.log('Video replaced with:', file.name);
    }
  };

  const getFileUrl = (file) => {

    if (typeof file === 'string') {
      // Check if the file is already a URL starting with Amazon bucket URL
      if (file.includes(bucketUrl) || file.includes('http') || file.includes('blob')) {
        return file; // Return the file URL as is if it starts with the bucket URL
      } else {
        return `${bucketUrl}/${file}`; // Prepend the bucket URL to the file path if it's not already a complete URL
      }
    } else if (file instanceof File) {
      // For new video files, create an object URL
      return URL.createObjectURL(file);
    }
    return '';
  };


  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts
      if (formData.videos) {
        formData.videos.forEach(video => {
          if (video instanceof File) {
            try {
              URL.revokeObjectURL(URL.createObjectURL(video));
            } catch (error) {
              // Silent cleanup
            }
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup photo object URLs when component unmounts
      selectedPhotoPreviews.forEach(preview => {
        try {
          URL.revokeObjectURL(preview.url);
        } catch (error) {
          console.log('Photo cleanup error:', error);
        }
      });
    };
  }, [selectedPhotoPreviews]);


  useEffect(() => {
    return () => {
      if (selectedThumbnailPreview && selectedThumbnailPreview.url) {
        try {
          URL.revokeObjectURL(selectedThumbnailPreview.url);
        } catch (error) {
          console.log('Thumbnail cleanup error:', error);
        }
      }
    };
  }, [selectedThumbnailPreview]);

  useEffect(() => {
    return () => {
      // Cleanup testimonial video object URLs when component unmounts
      selectedTestimonialPreviews.forEach(preview => {
        try {
          URL.revokeObjectURL(preview.url);
        } catch (error) {
          console.log('Testimonial video cleanup error:', error);
        }
      });
    };
  }, [selectedTestimonialPreviews]);

  useEffect(() => {
    return () => {
      // Cleanup brochure object URL when component unmounts
      if (selectedBrochurePreview && selectedBrochurePreview.url) {
        try {
          URL.revokeObjectURL(selectedBrochurePreview.url);
        } catch (error) {
          console.log('Brochure cleanup error:', error);
        }
      }
    };
  }, [selectedBrochurePreview]);

  const removeFile = async (fileType, key) => {

    const confirm = window.confirm('Are you sure you want to remove this file?');
    if (!confirm) {
      return;
    }
    if (fileType === 'video') {
      // Clean up object URL if it's a new video file



      // Remove from formData
      setFormData(prev => ({
        ...prev,
        videos: [] // Empty array for single video
      }));

      // Clear selectedVideos
      setSelectedVideos([]);

      // Reset the file input
      const videoInput = document.getElementById('videos');
      if (videoInput) {
        videoInput.value = '';

      }


    } else if (fileType === 'photo') {

      console.log(key, 'key');
      // Remove from formData.photos (server photos)
      if (typeof key === 'string') {
        setFormData(prev => ({
          ...prev,
          photos: prev.photos.filter(p => p !== key)
        }));
      }

      // Remove from selectedPhotos and cleanup object URL
      if (key instanceof File) {
        // Find and cleanup object URL

        const previewToRemove = selectedPhotoPreviews.find(p => p.file === key);
        if (previewToRemove) {
          URL.revokeObjectURL(previewToRemove.url);
        }

        setSelectedPhotos(prev => prev.filter(p => p !== key));
        setSelectedPhotoPreviews(prev => prev.filter(p => p.file !== key));
        setFormData(prev => ({
          ...prev,
          photos: prev.photos.filter(p => p !== key)
        }));

        const photoInput = document.getElementById('photos');
        if (photoInput) {
          photoInput.value = '';
        }


      }
    }
    if (fileType === 'brochure') {
      if (typeof key === 'string') {
        setFormData(prev => ({ ...prev, brochure: '' }));
      }

      if (key instanceof File) {
        if (selectedBrochurePreview && selectedBrochurePreview.url) {
          URL.revokeObjectURL(selectedBrochurePreview.url);
        }

        setSelectedBrochure(null);
        setSelectedBrochurePreview(null);

        const brochureInput = document.getElementById('brochure');
        if (brochureInput) {
          brochureInput.value = '';
        }
        setFormData(prev => ({ ...prev, brochure: '' }));
      }
    } else if (fileType === 'thumbnail') {
      // Remove server thumbnail
      if (typeof key === 'string') {
        setFormData(prev => ({ ...prev, thumbnail: '' }));
      }

      // Remove new thumbnail and cleanup object URL
      if (key instanceof File) {
        if (selectedThumbnailPreview && selectedThumbnailPreview.url) {
          URL.revokeObjectURL(selectedThumbnailPreview.url);
        }

        setSelectedThumbnail(null);
        setSelectedThumbnailPreview(null);
        setFormData(prev => ({ ...prev, thumbnail: '' }));

        const thumbnailInput = document.getElementById('thumbnail');
        if (thumbnailInput) {
          thumbnailInput.value = '';
        }
      }
    } else if (fileType === 'testimonial') {
      setFormData(prev => ({ ...prev, testimonialvideos: prev.testimonialvideos.filter(t => t !== key) }));
      setSelectedTestimonialVideos(prev => prev.filter(t => t !== key));
      setSelectedTestimonialPreviews(prev => prev.filter(t => t.file !== key));
      const testimonialInput = document.getElementById('testimonialvideos');
      if (testimonialInput) {
        testimonialInput.value = '';
      }
    }



  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const user = JSON.parse(sessionStorage.getItem('user'));

    const form = new FormData();

    // Append basic fields
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => form.append(`${key}[]`, v));
      } else {
        form.append(key, value);
      }
    });

    // Append files
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

    // Append JSON fields
    form.append('docsRequired', JSON.stringify(docsRequired));
    form.append('questionAnswers', JSON.stringify(questionAnswers));

    // CreatedBy & college
    form.append('createdBy', JSON.stringify({
      type: 'college',
      id: user._id
    }));
    form.append('college', user.collegeId);

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${backendUrl}/college/courses/add`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth': user.token
        }
      });
      if (response.data.status) {
        alert("Course added successfully");
        window.location.reload();
      } else {
        alert(response.data.message || "Failed to add course");
      }
    } catch (error) {
      console.error(error);
      alert("Error while submitting course");
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
                  <li className="breadcrumb-item"><a href="/institute/dashboard">Home</a></li>
                  <li className="breadcrumb-item active">Add Course</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
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
                        <label htmlFor="sectors">Sector</label>
                        <select
                          className={`form-control ${formErrors.sector ? 'is-invalid' : ''}`}
                          name="sectors"
                          id="sectors"
                          value={formData.sectors}
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

            <div className="col-xl-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Add Docs</h4>
                </div>
                <div className="row">
                  <div className="col-xl-3">
                    <div className="uploadedVideos card m-2 p-1">
                      <h5 className="m-2 text-center">Videos</h5>
                      <div className='innerUploadedVideos' style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>


                        {/* Video Preview */}
                        {formData.videos && formData.videos.length > 0 ? (

                          <div className="card m-0">
                            {/* <div className="card-body p-0 position-relative"> */}
                            {/* Video Preview with forced re-render */}
                            <video
                              key={formData.videos[0] instanceof File ? formData.videos[0].name + Date.now() : formData.videos[0]}
                              width="100%"
                              height="auto"
                              controls
                              style={{ borderRadius: '5px' }}
                            >
                              <source src={getFileUrl(formData.videos[0])} type="video/mp4" />
                              <source src={getFileUrl(formData.videos[0])} type="video/webm" />
                              <source src={getFileUrl(formData.videos[0])} type="video/ogg" />
                              Your browser does not support the video tag.
                            </video>

                            {/* Remove button */}
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute"
                              style={{ right: '5px', top: '5px', zIndex: 10 }}
                              onClick={() => removeFile('video', formData.videos[0])}
                            >
                              <i className="fa fa-times"></i>
                            </button>

                            {/* </div> */}
                          </div>

                        )
                          :
                          <p>No videos uploaded</p>
                        }


                      </div>
                      <div className='innerUploadedVideos' style={{ height: '70px', width: '100%' }}>
                        <div className="col-xl-12 col-xl-lg-12 col-md-12 col-sm-12 col-12 mb-1">
                          <label htmlFor="videos">
                            {formData.videos && formData.videos.length > 0 ? 'Replace Video' : 'Add Video'}
                          </label>
                          <input
                            name="videos"
                            id="videos"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            key={`video-input-${Date.now()}`} // Force input reset
                            style={{ width: '100%', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3">
                    <div className="uploadedPhotos  card m-2 p-1">
                      <h5 className="m-2 text-center">Photos</h5>
                      <div className='innerUploadedPhotos' style={{ height: '140px', width: '100%', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                        {formData.photos && formData.photos.length > 0 ? (
                          formData.photos.map((photo, i) => (
                            <div className=" position-relative w-25" key={`photo-${i}`}>
                              <div className="card-body p-1 text-center ">

                                <a href={getFileUrl(photo)} target="_blank" rel="noopener noreferrer" className="text-primary">
                                  <img
                                    src={getFileUrl(photo)}
                                    alt={`Photo ${i + 1}`}
                                    className="img-fluid mb-1"
                                    style={{ maxHeight: '100px' }}
                                  />
                                </a>
                                {/* <img
                                      src={getFileUrl(photo)}
                                      alt={`Photo ${i + 1}`}
                                      className="img-fluid mb-1"
                                      style={{ maxHeight: '100px' }}
                                    /> */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute" style={{ width: "15px", height: "15px", top: '-4px', right: '-4px' }}
                                  onClick={() => removeFile('photo', photo)}
                                >
                                  <i className="fa fa-times" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '10px', transform: 'translateY(-4px' }}></i>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : <p>No photos uploaded</p>}
                      </div>
                      <div className='innerUploadedPhotos' style={{ height: '70px', width: '100%' }}>
                        <div className="col-12 mb-1" id="uploadgallery">
                          <label htmlFor="photos">Add New Photos</label>
                          <input
                            type="file"
                            id="photos"
                            name="photos"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            style={{ width: '100%', fontSize: '12px' }}
                          />
                        </div>

                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3">
                    <div className="brouchers card m-2 p-1">
                      <h5 className="m-2 text-center">Brouchers</h5>

                      <div className='innerUploadedBrouchers' style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {formData.brochure ? (
                          <div className="card-body p-3 position-relative">
                            <div className="d-flex align-items-center justify-content-center" onClick={() => window.open(getFileUrl(formData.brochure), '_blank')}>
                              <div className="brochure-icon mr-3">
                                <i style={{ fontSize: '100px' }} className={`fa-solid fa-file`}></i>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute"
                                  style={{ right: '10px', top: '10px' }}
                                  onClick={() => removeFile('brochure', formData.brochure)}
                                  title="Remove brochure"
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>

                            </div>
                          </div>)
                          :
                          <p>No brouchers uploaded</p>
                        }

                      </div>
                      <div className='innerUploadedBrouchers' style={{ height: '70px', width: '100%' }}>
                        <div className="col-12 mb-1" id="brochures">
                          <label htmlFor="brochure">Add New Brochure</label>
                          <input
                            type="file"
                            id="brochure"
                            name="brochure"
                            accept=".pdf,.doc,.docx"
                            onChange={handleBrochureUpload} style={{ width: '100%', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3">
                    <div className="thumbnails card m-2 p-1">
                      <h5 className="m-2 text-center">Thumbnails</h5>
                      <div className='innerUploadedThumbnails' style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                        {formData.thumbnail ? (

                          <div className="thumbnail-preview-container p-1 position-relative">
                            <img
                              src={formData.thumbnail}
                              alt="New Thumbnail"
                              className="img-fluid rounded"
                              style={{
                                width: '100%',
                                objectFit: 'cover',
                                cursor: 'pointer'
                              }}
                            />

                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute"
                              style={{
                                right: '5px',
                                top: '5px',
                                width: '25px',
                                height: '25px',
                                padding: '0',
                                borderRadius: '50%',
                                fontSize: '12px',
                                zIndex: 10
                              }}
                              onClick={() => removeFile('thumbnail', formData.thumbnail)}
                              title="Remove thumbnail"
                            >
                              ×
                            </button>
                          </div>


                        )
                          :
                          <p>No thumbnails uploaded</p>
                        }

                      </div>
                      <div className='innerUploadedThumbnails' style={{ height: '70px', width: '100%' }}>
                        <div className="col-12 mb-1" id="thumbnails">
                          <label htmlFor="thumbnail">Add New Thumbnail</label>
                          <input
                            type="file"
                            id="thumbnail"
                            name="thumbnail"
                            accept="image/*"
                            onChange={handleThumbnailUpload} style={{ width: '100%', fontSize: '12px' }}
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

        {/* Testimonial Videos Section */}
        <section id="testimonial-videos">
          <div className="row" style={{minHeight:'170px'}}>
            <div className="col-xl-12 col-lg-12">
             
              <div>
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Testimonial Videos</h4>
                  </div>

                  <div className="row">
                    <div className="col-xl-3 m-2">
                      <div className="col-12 mb-1 d-flex justify-content-center h-100 flex-column ps-3">
                        <label htmlFor="testimonialvideos">Add New Testimonial Videos</label>
                        <input
                          type="file"
                          id="testimonialvideos"
                          name="testimonialvideos"
                          accept="video/*"
                          multiple
                          onChange={handleTestimonialVideoUpload} style={{width:'100%', fontSize:'12px' , textAlign:'center'}}
                        />
                      </div>

                    </div>
                    {formData.testimonialvideos && formData.testimonialvideos.length > 0 && (

formData.testimonialvideos.map((video, i) => (
                    <div className="col-xl-3 m-2">
                      <div className="card" style={{height:'138px', width:'100%'}}>
                            {/* Existing Testimonial Videos */}
                           
                                <div key={`testimonial-${i}`} className="col-12 mb-2">
                              
                                      <video key={formData.videos[0] instanceof File ? formData.videos[0].name + Date.now() : formData.videos[0]}
                                        width="100%"
                                        height="auto"
                                        controls className="text-primary">
                                        <source src={getFileUrl(video)} type="video/mp4" />
                                        <source src={getFileUrl(video)} type="video/webm" />
                                        <source src={getFileUrl(video)} type="  video/ogg" />
                                        Your browser does not support the video tag.
                                      </video>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-danger ml-2 position-absolute" style={{right:'1px'}}
                                        onClick={() => removeFile('testimonial', video)}
                                      >
                                        <i className="fa fa-times"></i>
                                      </button>
                                    </div>
                                  
                             
                      </div>
                    </div>
                    ))
                  )}
                </div>

                </div>

              </div>

            </div>
            <div className="col-12">

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
        {`
          .ck-editor__editable_inline{
            height:40px;
          }
        `}
      </style>
    </div>
  );
};

export default AddCourse;