import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { Breadcrumb, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import Select from 'react-select';

const AddCourse = () => {
  const navigate = useNavigate();
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State for form data
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
    brochure: '',
    thumbnail: '',
    photos: '',
    videos: '',
    testimonialvideos: '',
  });

  // State for required documents
  const [requiredDocs, setRequiredDocs] = useState([{ name: '' }]);

  // State for FAQs
  const [faqs, setFaqs] = useState([
    { question: 'Do you offer a safe working environment?', answer: 'Do you offer a safe working environment?' }
  ]);

  // State for sectors and training centers
  const [sectors, setSectors] = useState([]);
  const [centers, setCenters] = useState([]);
  const [errors, setErrors] = useState({});
  const [flashMessage, setFlashMessage] = useState(null);

  // Fetch sectors and centers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectorsResponse = await axios.get(`${backendUrl}/api/sectors`);
        const centersResponse = await axios.get(`${backendUrl}/api/centers`);
        
        setSectors(sectorsResponse.data.map(sector => ({
          value: sector._id,
          label: sector.name
        })));
        
        setCenters(centersResponse.data.map(center => ({
          value: center._id,
          label: center.name
        })));
      } catch (error) {
        console.error('Error fetching data:', error);
        setFlashMessage({ type: 'danger', message: 'Failed to load data' });
      }
    };

    fetchData();
  }, [backendUrl]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle select changes
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData({
      ...formData,
      [name]: selectedOption.value
    });
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (selectedOptions, { name }) => {
    setFormData({
      ...formData,
      [name]: selectedOptions.map(option => option.value)
    });
  };

  // Handle required documents
  const handleAddDoc = () => {
    setRequiredDocs([...requiredDocs, { name: '' }]);
  };

  const handleDocChange = (index, value) => {
    const updatedDocs = [...requiredDocs];
    updatedDocs[index].name = value;
    setRequiredDocs(updatedDocs);
  };

  // Handle FAQs
  const handleAddFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleFaqChange = (index, field, value) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index][field] = value;
    setFaqs(updatedFaqs);
  };

  // Handle file uploads
  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size and type
    if (fileType === 'brochure' || fileType === 'thumbnail') {
      if (!checkFileValidation(file.name) || !checkFileSize(file.size)) {
        setFlashMessage({
          type: 'danger',
          message: 'File must be .docx, .doc, .jpg, .jpeg, .png or pdf format and less than 5MB'
        });
        return;
      }
    } else {
      if (fileType === 'photos' && (!checkImageValidation(file.type) || !checkImageSize(file.size))) {
        setFlashMessage({
          type: 'danger',
          message: 'Images must be jpg, jpeg or png format and less than 2MB'
        });
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = {
        'x-auth': localStorage.getItem('token'),
        'Content-Type': 'multipart/form-data'
      };

      const response = await axios.post(
        `${backendUrl}/api/uploadAdminFile`,
        formData,
        { headers }
      );

      if (response.data.status) {
        setFormData(prev => ({
          ...prev,
          [fileType]: response.data.data.Key
        }));
        setFlashMessage({ type: 'success', message: 'File uploaded successfully' });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setFlashMessage({ type: 'danger', message: 'File upload failed' });
    }
  };

  // Handle multiple file uploads
  const handleMultipleFileUpload = async (e, fileType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (files.length > 5) {
      setFlashMessage({ type: 'danger', message: 'You cannot upload more than 5 files' });
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      if (fileType === 'photos') {
        if (!checkImageValidation(files[i].type) || !checkImageSize(files[i].size)) {
          setFlashMessage({
            type: 'danger',
            message: 'Images must be jpg, jpeg or png format and less than 2MB'
          });
          e.target.value = '';
          return;
        }
      }
      formData.append('files', files[i]);
    }

    try {
      const headers = {
        'x-auth': localStorage.getItem('token'),
        'Content-Type': 'multipart/form-data'
      };

      const endpoint = fileType === 'photos' ? 
        `${backendUrl}/api/uploadMultipleFiles` : 
        `${backendUrl}/api/uploadMultiFiles`;

      const response = await axios.post(endpoint, formData, { headers });

      if (response.data.status) {
        const combinedKeys = response.data.Data.map(img => img.Key).join(',');
        setFormData(prev => ({
          ...prev,
          [fileType]: combinedKeys
        }));
        setFlashMessage({ type: 'success', message: 'Files uploaded successfully' });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setFlashMessage({ type: 'danger', message: 'File upload failed' });
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sector) newErrors.sector = 'Sector is required';
    if (!formData.courseLevel) newErrors.courseLevel = 'Course Level is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.qualification) newErrors.qualification = 'Qualification is required';
    if (!formData.trainingMode) newErrors.trainingMode = 'Training Mode is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.ojt) newErrors.ojt = 'OJT is required';
    if (!formData.emiOptionAvailable) newErrors.emiOptionAvailable = 'EMI Option is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setFlashMessage({ type: 'danger', message: 'Please fill all required fields' });
      return;
    }

    const payload = {
      ...formData,
      docsRequired: requiredDocs
        .filter(doc => doc.name.trim() !== '')
        .map(doc => ({ Name: doc.name })),
      questionAnswers: faqs.map(faq => ({ 
        Question: faq.question, 
        Answer: faq.answer 
      }))
    };

    try {
      const response = await axios.post(`${backendUrl}/admin/courses/add`, payload, {
        headers: {
          'x-auth': localStorage.getItem('token'),
        }
      });

      if (response.status === 200 || response.data.status) {
        setFlashMessage({ type: 'success', message: 'Course added successfully' });
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Error adding course:', error);
      setFlashMessage({ 
        type: 'danger', 
        message: error.response?.data?.message || 'Failed to add course' 
      });
    }
  };

  // Helper functions for file validation
  const checkImageSize = (size) => {
    const finalSize = (size / 1024) / 1024;
    return finalSize <= 2;
  };

  const checkImageValidation = (fileType) => {
    const regex = /(\/jpg|\/jpeg|\/png)$/i;
    return regex.test(fileType);
  };

  const checkFileValidation = (fileName) => {
    const regex = /(\.docx|\.doc|\.pdf|\.jpg|\.jpeg|\.png)$/i;
    return regex.test(fileName);
  };

  const checkFileSize = (size) => {
    const finalSize = (size / 1024) / 1024;
    return finalSize <= 5;
  };

  // Toggle functions for conditional displays
  const toggleTrainingBlocks = () => {
    const showOnline = ['Online', 'Blended'].includes(formData.trainingMode);
    const showOffline = ['Offline', 'Blended'].includes(formData.trainingMode);
    
    return { showOnline, showOffline };
  };

  const toggleAddressFields = () => {
    const showAppLink = ['App', 'Both'].includes(formData.address);
    const showAddressInput = ['Address', 'Both'].includes(formData.address);
    
    return { showAppLink, showAddressInput };
  };

  const { showOnline, showOffline } = toggleTrainingBlocks();
  const { showAppLink, showAddressInput } = toggleAddressFields();

  return (
    <div className="">
      {/* Header */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Add Course</h3>
              <Breadcrumb>
                <Breadcrumb.Item href="/admin">Home</Breadcrumb.Item>
                <Breadcrumb.Item active>Add Course</Breadcrumb.Item>
              </Breadcrumb>
            </div>
          </div>
        </div>
      </div>

      {/* Flash Message */}
      {flashMessage && (
        <Alert variant={flashMessage.type} onClose={() => setFlashMessage(null)} dismissible>
          {flashMessage.message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Course Information */}
        <Card className="mb-4">
          <Card.Header className="border border-top-0 border-left-0 border-right-0">
            <h4 className="card-title pb-1">Course Information</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              {/* Sector */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Sector</Form.Label>
                  <Form.Control
                    as="select"
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    isInvalid={!!errors.sector}
                  >
                    <option value="">Select Sector</option>
                    {sectors.map((sector) => (
                      <option key={sector.value} value={sector.value}>
                        {sector.label}
                      </option>
                    ))}
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.sector}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Course Level */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Course Level</Form.Label>
                  <Form.Control
                    as="select"
                    name="courseLevel"
                    value={formData.courseLevel}
                    onChange={handleInputChange}
                    isInvalid={!!errors.courseLevel}
                  >
                    <option value="">Select Level</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Advance Diploma">Advance Diploma</option>
                    <option value="Degree">Degree</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.courseLevel}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Course Fee Type */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Course Fee Type</Form.Label>
                  <Form.Control
                    as="select"
                    name="courseFeeType"
                    value={formData.courseFeeType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Course Fee Type</option>
                    <option value="Paid">Paid</option>
                    <option value="Free">Free</option>
                  </Form.Control>
                </Form.Group>
              </Col>

              {/* Project Name */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Project Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Type of Project */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Type of Project</Form.Label>
                  <Form.Control
                    as="select"
                    name="typeOfProject"
                    value={formData.typeOfProject}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type of Project</option>
                    <option value="T&P">T&P</option>
                    <option value="P&T">P&T</option>
                    <option value="General">General</option>
                  </Form.Control>
                </Form.Group>
              </Col>

              {/* Course Type */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Course Type</Form.Label>
                  <Form.Control
                    as="select"
                    name="courseType"
                    value={formData.courseType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    <option value="course">Course Only</option>
                    <option value="coursejob">Course and Job</option>
                  </Form.Control>
                </Form.Group>
              </Col>

              {/* Name */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Duration */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Duration</Form.Label>
                  <Form.Control
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    isInvalid={!!errors.duration}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.duration}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Certifying Agency */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Certifying Agency</Form.Label>
                  <Form.Control
                    type="text"
                    name="certifyingAgency"
                    value={formData.certifyingAgency}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Certifying Agency Website */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Certifying Agency Website</Form.Label>
                  <Form.Control
                    type="text"
                    name="certifyingAgencyWebsite"
                    value={formData.certifyingAgencyWebsite}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Qualification */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Qualification</Form.Label>
                  <Form.Control
                    as="select"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    isInvalid={!!errors.qualification}
                  >
                    <option value="">Select Qualification</option>
                    <option value="8th">8th</option>
                    <option value="10th">10th</option>
                    <option value="12th">12th</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Advance Diploma">Advance Diploma</option>
                    <option value="Degree">Degree</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.qualification}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Age */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Experience */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Experience</Form.Label>
                  <Form.Control
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Training Mode */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Training Mode</Form.Label>
                  <Form.Control
                    as="select"
                    name="trainingMode"
                    value={formData.trainingMode}
                    onChange={handleInputChange}
                    isInvalid={!!errors.trainingMode}
                  >
                    <option value="">Select Training</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Blended">Blended</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.trainingMode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Online Training Timing */}
              {showOnline && (
                <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>Online Training Timing</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="onlineTrainingTiming"
                      value={formData.onlineTrainingTiming}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Offline Training Timing */}
              {showOffline && (
                <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>Offline Training Timing</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="offlineTrainingTiming"
                      value={formData.offlineTrainingTiming}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Training Center */}
              {showOffline && (
                <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>Training Center</Form.Label>
                    <Select
                      isMulti
                      name="trainingCenter"
                      options={centers}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      onChange={(selected) => 
                        handleMultiSelectChange(selected, { name: 'trainingCenter' })
                      }
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Address */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="select"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    isInvalid={!!errors.address}
                  >
                    <option value="">Select Address</option>
                    <option value="App">App</option>
                    <option value="Address">Address</option>
                    <option value="Both">Both</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.address}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* City */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* State */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* App Link */}
              {showAppLink && (
                <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>App Link</Form.Label>
                    <Form.Control
                      type="text"
                      name="appLink"
                      value={formData.appLink}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Address Input */}
              {showAddressInput && (
                <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="addressInput"
                      value={formData.addressInput}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
              )}

              {/* OJT */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>OJT</Form.Label>
                  <Form.Control
                    as="select"
                    name="ojt"
                    value={formData.ojt}
                    onChange={handleInputChange}
                    isInvalid={!!errors.ojt}
                  >
                    <option value="">Select OJT</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.ojt}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Registration Charges */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Registration Charges</Form.Label>
                  <Form.Control
                    type="text"
                    name="registrationCharges"
                    value={formData.registrationCharges}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Course Fee */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Course Fee</Form.Label>
                  <Form.Control
                    type="text"
                    name="courseFee"
                    value={formData.courseFee}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Cut Price */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Cut Price</Form.Label>
                  <Form.Control
                    type="text"
                    name="cutPrice"
                    value={formData.cutPrice}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Exam Fee */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Exam Fee</Form.Label>
                  <Form.Control
                    type="text"
                    name="examFee"
                    value={formData.examFee}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Other Fee */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Other Fee if any</Form.Label>
                  <Form.Control
                    type="text"
                    name="otherFee"
                    value={formData.otherFee}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* EMI Option Available */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>EMI Option Available</Form.Label>
                  <Form.Control
                    as="select"
                    name="emiOptionAvailable"
                    value={formData.emiOptionAvailable}
                    onChange={handleInputChange}
                    isInvalid={!!errors.emiOptionAvailable}
                  >
                    <option value="">Select EMI Option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.emiOptionAvailable}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Max EMI Tenure */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Max EMI Tenure</Form.Label>
                  <Form.Control
                    type="text"
                    name="maxEMITenure"
                    value={formData.maxEMITenure}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Stipend During Training */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Stipend During Training</Form.Label>
                  <Form.Control
                    type="text"
                    name="stipendDuringTraining"
                    value={formData.stipendDuringTraining}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Last Date for Apply */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Last date for apply</Form.Label>
                  <Form.Control
                    type="date"
                    name="lastDateForApply"
                    value={formData.lastDateForApply}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>

              {/* Youtube URL */}
              <Col xl={3} lg={3} md={2} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Youtube URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="youtubeURL"
                    value={formData.youtubeURL}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Documents Required */}
        <Card className="mb-4">
          <Card.Header className="border border-top-0 border-left-0 border-right-0">
            <h4 className="card-title pb-1">Documents Required</h4>
          </Card.Header>
          <Card.Body>
            <div id="documentContainer">
              {requiredDocs.map((doc, index) => (
                <Row key={index} className="mb-3">
                  <Col xl={3} lg={3} md={2} sm={12}>
                    <Form.Group>
                      <Form.Label>Document Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={doc.name}
                        onChange={(e) => handleDocChange(index, e.target.value)}
                        className="docsName"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              ))}
            </div>
            <div className="text-right">
              <Button variant="success" onClick={handleAddDoc}>+ Add Another</Button>
            </div>
          </Card.Body>
        </Card>

        {/* Add Docs */}
        <Card className="mb-4">
          <Card.Header className="border border-top-0 border-left-0 border-right-0">
            <h4 className="card-title pb-1">Add Docs</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              {/* Videos */}
              <Col xl={4} lg={4} md={4} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Add Videos</Form.Label>
                  <Form.Control 
                    type="file" 
                    multiple
                    onChange={(e) => handleMultipleFileUpload(e, 'videos')}
                  />
                </Form.Group>
              </Col>

              {/* Brochure */}
              <Col xl={4} lg={4} md={4} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Add Brochure</Form.Label>
                  <Form.Control 
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'brochure')}
                  />
                </Form.Group>
              </Col>

              {/* Thumbnail */}
              <Col xl={4} lg={4} md={4} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Add Thumbnail</Form.Label>
                  <Form.Control 
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'thumbnail')}
                  />
                </Form.Group>
              </Col>

              {/* Photos */}
              <Col xl={4} lg={4} md={4} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Add Photos</Form.Label>
                  <Form.Control 
                    type="file" 
                    multiple
                    onChange={(e) => handleMultipleFileUpload(e, 'photos')}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Testimonial Videos */}
        <Card className="mb-4">
          <Card.Header className="border border-top-0 border-left-0 border-right-0">
            <h4 className="card-title pb-1">Testimonial Videos</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xl={4} lg={4} md={4} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Add Testimonial Videos</Form.Label>
                  <Form.Control 
                    type="file" 
                    multiple
                    onChange={(e) => handleMultipleFileUpload(e, 'testimonialvideos')}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Extra Features */}
        <Card className="mb-4">
          <Card.Header className="border border-top-0 border-left-0 border-right-0">
            <h4 className="card-title pb-1">Extra Features</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xl={6} lg={6} md={6} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Course Feature</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="courseFeatures"
                    value={formData.courseFeatures}
                    onChange={handleInputChange}
                    placeholder="Bulleted points"
                  />
                </Form.Group>
              </Col>
              <Col xl={6} lg={6} md={6} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Important Terms</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="importantTerms"
                    value={formData.importantTerms}
                    onChange={handleInputChange}
                    placeholder="Bulleted points"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Dedicated Counselor */}
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col xs={12}>
                <Form.Label className="h4">Do you want to Add the Dedicated Counselor Number?</Form.Label>
                <div className="mb-3 mt-2">
                  <Form.Check
                    inline
                    type="radio"
                    id="contact-directly-yes"
                    name="isContact"
                    value="true"
                    label="Yes"
                    checked={formData.isContact === true}
                    onChange={() => setFormData({...formData, isContact: true})}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    id="contact-directly-no"
                    name="isContact"
                    value="false"
                    label="No"
                    checked={formData.isContact === false}
                    onChange={() => setFormData({...formData, isContact: false})}
                  />
                </div>
              </Col>

              {formData.isContact && (
                <Col xs={12}>
                  <Row>
                    <Col xl={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="counslername"
                          value={formData.counslername}
                          onChange={handleInputChange}
                          placeholder="Name"
                        />
                      </Form.Group>
                    </Col>
                    <Col xl={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="tel"
                          name="counslerphonenumber"
                          value={formData.counslerphonenumber}
                          onChange={handleInputChange}
                          placeholder="Phone no"
                          maxLength={10}
                        />
                      </Form.Group>
                    </Col>
                    <Col xl={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Whatsapp Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="counslerwhatsappnumber"
                          value={formData.counslerwhatsappnumber}
                          onChange={handleInputChange}
                          placeholder="Whatsapp Number"
                          maxLength={10}
                        />
                      </Form.Group>
                    </Col>
                    <Col xl={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="counsleremail"
                          value={formData.counsleremail}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* FAQs */}
        <Card className="mb-4">
          <Card.Header className="border border-top-0 border-left-0 border-right-0">
            <h4 className="card-title pb-1">Questions & Answers</h4>
          </Card.Header>
          <Card.Body>
            {faqs.map((faq, index) => (
              <Row key={index} className="mb-3">
                <Col xl={6} lg={6} md={6} sm={12}>
                  <Form.Group>
                    <Form.Label>Question</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xl={6} lg={6} md={6} sm={12}>
                  <Form.Group>
                    <Form.Label>Answer</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            ))}
            <div className="text-right">
              <Button variant="success" onClick={handleAddFaq}>+ Add Another</Button>
            </div>
          </Card.Body>
        </Card>

        {/* Form Buttons */}
        <div className="text-right mb-4">
          <Button 
            variant="danger" 
            className="mr-2"
            onClick={() => window.location.reload()}
          >
            Reset
          </Button>
          <Button variant="success" type="submit">
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddCourse;