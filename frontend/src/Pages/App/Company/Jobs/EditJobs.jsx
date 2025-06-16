import React, { useState, useEffect, useRef } from 'react';

const EditJob = ({ jobId }) => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  
  // Get jobId from props, URL params, or window location
  const currentJobId = jobId || window.location.pathname.split('/').pop();

  // Form state
  const [formData, setFormData] = useState({
    displayCompanyName: '',
    title: '',
    _industry: '',
    experience: '',
    _qualification: '',
    _subQualification: [],
    validity: '',
    state: '',
    city: '',
    place: '',
    latitude: '',
    longitude: '',
    noOfPosition: '',
    genderPreference: 'no preference',
    jobType: '',
    compensation: '',
    pay: '',
    ageMin: 18,
    ageMax: 70,
    shift: '',
    shifttimings: '',
    work: '',
    benifits: [],
    remarks: '',
    payOut: '',
    _techSkills: [],
    _nonTechSkills: [],
    requirement: '',
    isFixed: true,
    amount: '',
    min: '',
    max: '',
    isContact: false,
    nameof: '',
    phoneNumberof: '',
    whatsappNumberof: '',
    emailof: '',
    jobDescription: 'Looking for a hard working and reliable resource for our company.',
    duties: '',
    jobVideo: '',
    isEdit: false
  });

  // Dropdown data
  const [dropdownData, setDropdownData] = useState({
    industry: [],
    qualification: [],
    subQualification: [],
    states: [],
    cities: [],
    techSkills: [],
    nonTechSkills: []
  });

  // Question/Answer pairs
  const [questionAnswers, setQuestionAnswers] = useState([
    { question: 'Do you offer safe working environment ?', answer: 'Yes we do offer as we are ISO certified' }
  ]);

  // UI State
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showSubQualificationField, setShowSubQualificationField] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCoinsModal, setShowCoinsModal] = useState(false);
  const [coinOffers, setCoinOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [availService, setAvailService] = useState(false);

  // Refs for Google Maps
  const workLocationRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Company and coins data
  const [companyData, setCompanyData] = useState({
    name: '',
    creditLeft: 0
  });

  const coinsRequired = { contactcoins: 25 };

  // Load initial data
  useEffect(() => {
    loadJobData();
    loadDropdownData();
    loadCompanyData();
  }, [currentJobId]);

  useEffect(() => {
    if (formData.place) {
      initializeGoogleMaps();
    }
  }, [formData.place]);

  const loadJobData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/editJobs/${currentJobId}`, {
        headers: { 'x-auth': token }
      });
      const data = await response.json();
      
      if (data.success && data.jd) {
        const job = data.jd;
        setFormData({
          displayCompanyName: job.displayCompanyName || '',
          title: job.title || '',
          _industry: job._industry || '',
          experience: job.experience || '',
          _qualification: job._qualification || '',
          _subQualification: job._subQualification || [],
          validity: job.validity ? formatDateForInput(job.validity) : '',
          state: job.state || '',
          city: job.city || '',
          place: job.place || '',
          latitude: job.latitude || '',
          longitude: job.longitude || '',
          noOfPosition: job.noOfPosition || '',
          genderPreference: job.genderPreference || 'no preference',
          jobType: job.jobType || '',
          compensation: job.compensation || '',
          pay: job.pay || '',
          ageMin: job.ageMin || 18,
          ageMax: job.ageMax || 70,
          shift: job.shift || '',
          shifttimings: job.shifttimings || '',
          work: job.work || '',
          benifits: job.benifits || [],
          remarks: job.remarks || '',
          payOut: job.payOut || '',
          _techSkills: job._techSkills || [],
          _nonTechSkills: job._nonTechSkills || [],
          requirement: job.requirement || '',
          isFixed: job.isFixed !== undefined ? job.isFixed : true,
          amount: job.amount || '',
          min: job.min || '',
          max: job.max || '',
          isContact: job.isContact || false,
          nameof: job.nameof || '',
          phoneNumberof: job.phoneNumberof || '',
          whatsappNumberof: job.whatsappNumberof || '',
          emailof: job.emailof || '',
          jobDescription: job.jobDescription || 'Looking for a hard working and reliable resource for our company.',
          duties: job.duties || '',
          jobVideo: job.jobVideo || '',
          isEdit: job.isEdit || false
        });

        // Set question answers
        if (job.questionsAnswers && job.questionsAnswers.length > 0) {
          setQuestionAnswers(job.questionsAnswers.map(qa => ({
            question: qa.Question || '',
            answer: qa.Answer || ''
          })));
        }

        // Show contact info if needed
        setShowContactInfo(job.isContact || false);
        setAvailService(job.isEdit || false);
      }
    } catch (error) {
      console.error('Error loading job data:', error);
    }
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const loadDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'x-auth': token };

      const [industryRes, qualificationRes, statesRes, techSkillsRes, nonTechSkillsRes] = await Promise.all([
        fetch(`${backendUrl}/api/industries`, { headers }),
        fetch(`${backendUrl}/api/qualifications`, { headers }),
        fetch(`${backendUrl}/api/states`, { headers }),
        fetch(`${backendUrl}/api/techskills`, { headers }),
        fetch(`${backendUrl}/api/nontechskills`, { headers })
      ]);

      const [industry, qualification, states, techSkills, nonTechSkills] = await Promise.all([
        industryRes.json(), qualificationRes.json(), statesRes.json(), 
        techSkillsRes.json(), nonTechSkillsRes.json()
      ]);

      setDropdownData({
        industry: industry.data || [],
        qualification: qualification.data || [],
        subQualification: qualification.subQualification || [],
        states: states.data || [],
        cities: [],
        techSkills: techSkills.data || [],
        nonTechSkills: nonTechSkills.data || []
      });

      // Load cities if state is selected
      if (formData.state) {
        loadCities(formData.state);
      }

    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const loadCompanyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/profile`, {
        headers: { 'x-auth': token }
      });
      const data = await response.json();
      setCompanyData(data);
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const loadCities = async (stateId) => {
    try {
      const response = await fetch(`${backendUrl}/company/getcitiesbyId?stateId=${stateId}`, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      const data = await response.json();
      setDropdownData(prev => ({ ...prev, cities: data.cityValues || [] }));
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const initializeGoogleMaps = () => {
    if (window.google && window.google.maps) {
      const options = {
        componentRestrictions: { country: "in" },
        types: ["establishment"]
      };

      if (workLocationRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          workLocationRef.current, 
          options
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry) {
            setFormData(prev => ({
              ...prev,
              place: workLocationRef.current.value,
              latitude: place.geometry.location.lat().toString(),
              longitude: place.geometry.location.lng().toString()
            }));
          }
        });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === '_techSkills' || name === '_nonTechSkills' || name === 'benifits') {
        setFormData(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Handle contact info display
      if (name === 'isContact') {
        setShowContactInfo(value === 'true');
        setAvailService(true);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setFormData(prev => ({ ...prev, state: stateId, city: '' }));
    
    if (stateId) {
      await loadCities(stateId);
    }
  };

  const handleQualificationChange = (e) => {
    const qualificationId = e.target.value;
    const selectedQual = dropdownData.qualification.find(q => q._id === qualificationId);
    const qualName = selectedQual?.name || '';
    
    setFormData(prev => ({ ...prev, _qualification: qualificationId }));
    
    if (qualName === '10th' || qualName === '12th' || qualName === 'Upto 5th') {
      setShowSubQualificationField(true);
      setFormData(prev => ({ ...prev, _subQualification: [], isEdit: true }));
    } else {
      setShowSubQualificationField(false);
      setFormData(prev => ({ ...prev, isEdit: false }));
    }
  };

  const handleAgeRangeChange = (e, type) => {
    const value = parseInt(e.target.value);
    setFormData(prev => ({ ...prev, [type]: value }));
  };

  const addQuestionAnswer = () => {
    setQuestionAnswers(prev => [...prev, { question: '', answer: '' }]);
  };

  const updateQuestionAnswer = (index, field, value) => {
    setQuestionAnswers(prev => 
      prev.map((qa, i) => i === index ? { ...qa, [field]: value } : qa)
    );
  };

  const removeQuestionAnswer = (index) => {
    setQuestionAnswers(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/mov', 'video/avi'];
      if (validTypes.includes(file.type)) {
        setFormData(prev => ({ ...prev, jobVideo: file }));
      } else {
        alert('Please select a valid video file (MP4, MOV, AVI)');
        e.target.value = '';
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validations
    if (!formData.displayCompanyName.trim()) newErrors.displayCompanyName = 'Company name is required';
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData._industry) newErrors._industry = 'Industry is required';
    if (!formData.experience) newErrors.experience = 'Experience is required';
    if (!formData._qualification) newErrors._qualification = 'Qualification is required';
    if (!formData.validity) newErrors.validity = 'Validity date is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.place.trim()) newErrors.place = 'Work location is required';
    if (!formData.jobType) newErrors.jobType = 'Job type is required';
    if (!formData.compensation) newErrors.compensation = 'Compensation type is required';
    if (!formData.pay) newErrors.pay = 'Pay type is required';
    if (!formData.work) newErrors.work = 'Work type is required';

    // Age validation
    if (formData.ageMin >= formData.ageMax) {
      newErrors.ageRange = 'Minimum age must be less than maximum age';
    }

    // Salary validation
    if (formData.isFixed && !formData.amount) {
      newErrors.amount = 'Fixed salary amount is required';
    }
    if (!formData.isFixed && (!formData.min || !formData.max)) {
      newErrors.salaryRange = 'Both minimum and maximum salary are required';
    }
    if (!formData.isFixed && formData.min && formData.max && parseInt(formData.min) >= parseInt(formData.max)) {
      newErrors.salaryRange = 'Minimum salary must be less than maximum salary';
    }

    // Contact info validation
    if (formData.isContact && !formData.phoneNumberof.trim()) {
      newErrors.phoneNumberof = 'Phone number is required for direct contact';
    }
    if (formData.isContact && formData.phoneNumberof.length !== 10) {
      newErrors.phoneNumberof = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Check coins requirement for contact service
    const creditsLeft = companyData.creditLeft || 0;
    const coinsNeeded = coinsRequired.contactcoins || 25;
    
    if (creditsLeft < coinsNeeded && 
        formData.isContact === false && 
        availService === true && 
        formData.isEdit === false) {
      setShowCoinsModal(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        questionsAnswers: questionAnswers.filter(qa => qa.question.trim() && qa.answer.trim()),
        isedited: availService
      };

      const response = await fetch(`${backendUrl}/company/editJobs/${currentJobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth': localStorage.getItem('token')
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Job updated successfully!');
        window.location.href = '/company/list/jobs';
      } else {
        const error = await response.json();
        alert('Error updating job: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error updating job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCoinOffers = async () => {
    try {
      const response = await fetch(`${backendUrl}/company/getCoinOffers`, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      const data = await response.json();
      setCoinOffers(data);
    } catch (error) {
      console.error('Error loading coin offers:', error);
    }
  };

  return (
    <>
      <>
        <div className="content-wrapper">
          
          {/* Header */}
          <div className="row">
            <div className="col-xl-12 px-3 text-right">
              <a href="/company/list/jobs" className="btn btn-outline-primary">All Job Details</a>
            </div>
          </div>

          <div>
            {/* Basic Job Information */}
            <section id="basic-info">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card mt-2">
                    <div className="card-header border border-top-0 border-left-0 border-right-0">
                      <h4 className="card-title pb-1">Edit Job Description</h4>
                    </div>
                    <div className="card-content">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-xl-3 mb-1">
                            <label>Display Organization Name <span className="mandatory">*</span></label>
                            <input 
                              className={`form-control ${errors.displayCompanyName ? 'error' : ''}`}
                              type="text" 
                              name="displayCompanyName"
                              value={formData.displayCompanyName}
                              onChange={handleInputChange}
                              placeholder="Company Name"
                              required
                            />
                            {errors.displayCompanyName && <span className="error-text">{errors.displayCompanyName}</span>}
                          </div>
                          
                          <div className="col-xl-3 mb-1">
                            <label>Title <span className="mandatory">*</span></label>
                            <input 
                              className={`form-control ${errors.title ? 'error' : ''}`}
                              type="text" 
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              placeholder="Enter the job title"
                              maxLength="25"
                              required
                            />
                            {errors.title && <span className="error-text">{errors.title}</span>}
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Industry <span className="mandatory">*</span></label>
                            <select 
                              className={`form-control ${errors._industry ? 'error' : ''}`}
                              name="_industry"
                              value={formData._industry}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select option</option>
                              {dropdownData.industry.map(item => (
                                <option key={item._id} value={item._id} className="text-capitalize">
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            {errors._industry && <span className="error-text">{errors._industry}</span>}
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Experience (In Years) <span className="mandatory">*</span></label>
                            <select 
                              className={`form-control ${errors.experience ? 'error' : ''}`}
                              name="experience"
                              value={formData.experience}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select option</option>
                              <option value="0">Fresher</option>
                              {Array.from({length: 25}, (_, i) => i + 1).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                            {errors.experience && <span className="error-text">{errors.experience}</span>}
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Qualification <span className="mandatory">*</span></label>
                            <select 
                              className={`form-control ${errors._qualification ? 'error' : ''}`}
                              name="_qualification"
                              value={formData._qualification}
                              onChange={handleQualificationChange}
                              required
                            >
                              <option value="">Select option</option>
                              {dropdownData.qualification.map(item => (
                                <option key={item._id} value={item._id} className="text-capitalize">
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            {errors._qualification && <span className="error-text">{errors._qualification}</span>}
                          </div>

                          {!showSubQualificationField && (
                            <div className="col-xl-3 mb-1">
                              <label>Stream <span className="mandatory">*</span></label>
                              <select 
                                className="form-control"
                                name="_subQualification"
                                multiple
                                value={formData._subQualification}
                                onChange={(e) => {
                                  const values = Array.from(e.target.selectedOptions, option => option.value);
                                  setFormData(prev => ({ ...prev, _subQualification: values }));
                                }}
                              >
                                {dropdownData.subQualification.map(item => (
                                  <option key={item._id} value={item._id} className="text-capitalize">
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {showSubQualificationField && (
                            <div className="col-xl-3 mb-1">
                              <label>Stream <span className="mandatory">*</span></label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Enter your subQualification"
                                name="_subQualification"
                                value={formData._subQualification}
                                onChange={handleInputChange}
                              />
                            </div>
                          )}

                          <div className="col-xl-3 mb-1">
                            <label>Active Till <span className="mandatory">*</span></label>
                            <input 
                              type="date" 
                              className={`form-control ${errors.validity ? 'error' : ''}`}
                              name="validity"
                              value={formData.validity}
                              onChange={handleInputChange}
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                            {errors.validity && <span className="error-text">{errors.validity}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Location Information */}
            <section id="location-info">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card mt-1">
                    <div className="card-content">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-xl-4 mb-1">
                            <label>State <span className="mandatory">*</span></label>
                            <select 
                              className={`form-control ${errors.state ? 'error' : ''}`}
                              name="state"
                              value={formData.state}
                              onChange={handleStateChange}
                              required
                            >
                              <option value="">Select option</option>
                              {dropdownData.states.map(item => (
                                <option key={item._id} value={item._id} className="text-capitalize">
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            {errors.state && <span className="error-text">{errors.state}</span>}
                          </div>

                          <div className="col-xl-4 mb-1">
                            <label>City <span className="mandatory">*</span></label>
                            <select 
                              className={`form-control ${errors.city ? 'error' : ''}`}
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select option</option>
                              {dropdownData.cities.map(item => (
                                <option key={item._id} value={item._id} className="text-capitalize">
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            {errors.city && <span className="error-text">{errors.city}</span>}
                          </div>

                          <div className="col-xl-4 mb-1">
                            <label>Work Location <span className="mandatory">*</span></label>
                            <div className="input-group mb-2">
                              <div className="input-group-prepend bg-locat">
                                <div className="input-group-text bg-intext">
                                  <img src="/images/isist.png" alt="location" />
                                </div>
                              </div>
                              <input 
                                type="text" 
                                className={`form-control ${errors.place ? 'error' : ''}`}
                                ref={workLocationRef}
                                name="place"
                                value={formData.place}
                                onChange={handleInputChange}
                                placeholder="Enter work location"
                                required
                              />
                            </div>
                            {errors.place && <span className="error-text">{errors.place}</span>}
                          </div>

                          <div className="col-xl-4 mb-1">
                            <label>Number of Vacancies</label>
                            <input 
                              className="form-control" 
                              type="number" 
                              name="noOfPosition"
                              value={formData.noOfPosition}
                              onChange={handleInputChange}
                              maxLength="3"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Job Preferences */}
            <section id="job-preferences">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card mt-1">
                    <div className="card-content">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-xl-3 mb-1">
                            <label>Gender Preferences <span className="mandatory">*</span></label>
                            <br />
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="genderPreference"
                                value="male"
                                checked={formData.genderPreference === 'male'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Male</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="genderPreference"
                                value="female"
                                checked={formData.genderPreference === 'female'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Female</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="genderPreference"
                                value="no preference"
                                checked={formData.genderPreference === 'no preference'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">No Preference</label>
                            </div>
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Type <span className="mandatory">*</span></label>
                            <br />
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="jobType"
                                value="Full Time"
                                checked={formData.jobType === 'Full Time'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Full Time</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="jobType"
                                value="Part Time"
                                checked={formData.jobType === 'Part Time'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Part Time</label>
                            </div>
                            {errors.jobType && <span className="error-text">{errors.jobType}</span>}
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Compensation <span className="mandatory">*</span></label>
                            <br />
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="compensation"
                                value="Fixed"
                                checked={formData.compensation === 'Fixed'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Fixed</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="compensation"
                                value="Incentive Only"
                                checked={formData.compensation === 'Incentive Only'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Incentive Only</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="compensation"
                                value="Fixed + Incentive"
                                checked={formData.compensation === 'Fixed + Incentive'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Fixed + Incentive</label>
                            </div>
                            {errors.compensation && <span className="error-text">{errors.compensation}</span>}
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Pay <span className="mandatory">*</span></label>
                            <br />
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="pay"
                                value="On Payrol"
                                checked={formData.pay === 'On Payrol'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">On Payrol</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="pay"
                                value="Freelancer/Consultant"
                                checked={formData.pay === 'Freelancer/Consultant'}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">Freelancer/Consultant</label>
                            </div>
                            {errors.pay && <span className="error-text">{errors.pay}</span>}
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-xl-6 mb-1">
                            <label>Age Group</label>
                            <div className="row">
                              <div className="col-6">
                                <label className="label-font">From</label>
                                <input 
                                  type="range" 
                                  min="18" 
                                  max="70" 
                                  value={formData.ageMin}
                                  name="ageMin"
                                  onChange={(e) => handleAgeRangeChange(e, 'ageMin')}
                                />
                                <p>Age: <span>{formData.ageMin}</span></p>
                              </div>
                              <div className="col-6">
                                <label className="label-font">To</label>
                                <input 
                                  type="range" 
                                  min="18" 
                                  max="70" 
                                  value={formData.ageMax}
                                  name="ageMax"
                                  onChange={(e) => handleAgeRangeChange(e, 'ageMax')}
                                />
                                <p>Age: <span>{formData.ageMax}</span></p>
                              </div>
                            </div>
                            {errors.ageRange && <span className="error-text">{errors.ageRange}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Shift and Work Information */}
            <section id="shift-info">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card mt-1">
                    <div className="card-content">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-xl-3 mb-1">
                            <label>Shift</label>
                            <br />
                            {['Day Shift', 'Night Shift', 'Rotational', 'NA'].map(shift => (
                              <div key={shift} className="form-check form-check-inline">
                                <input 
                                  className="form-check-input" 
                                  type="radio" 
                                  name="shift"
                                  value={shift}
                                  checked={formData.shift === shift}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label">{shift}</label>
                              </div>
                            ))}
                          </div>

                          <div className="col-xl-2 mb-1">
                            <label>Shift Timings</label>
                            <input 
                              className="form-control" 
                              type="text" 
                              name="shifttimings"
                              value={formData.shifttimings}
                              onChange={handleInputChange}
                              maxLength="20"
                            />
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Work Type <span className="mandatory">*</span></label>
                            <br />
                            {['Work from office', 'Work from home', 'Field', 'NA'].map(workType => (
                              <div key={workType} className="form-check form-check-inline">
                                <input 
                                  className="form-check-input" 
                                  type="radio" 
                                  name="work"
                                  value={workType}
                                  checked={formData.work === workType}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label">{workType}</label>
                              </div>
                            ))}
                            {errors.work && <span className="error-text">{errors.work}</span>}
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Additional Benefits</label>
                            <select 
                              className="form-control" 
                              multiple 
                              name="benifits"
                              value={formData.benifits}
                              onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData(prev => ({ ...prev, benifits: values }));
                              }}
                            >
                              {['Health Insurance', 'Overtime', 'Accomodation', 'Transport', 'PF', 'Joining Bonus', 'Fuel Allowance', 'Travel Allowance', 'Laptop', 'Mobile', 'Others'].map(benefit => (
                                <option key={benefit} value={benefit} selected={formData.benifits.includes(benefit)}>
                                  {benefit}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Remarks</label>
                            <textarea 
                              className="form-control" 
                              name="remarks"
                              value={formData.remarks}
                              onChange={handleInputChange}
                              rows="3"
                              maxLength="150"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Skills and Salary */}
            <section id="skills-salary">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card mt-1">
                    <div className="card-content">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-xl-3 mb-1">
                            <label>Payout</label>
                            <select 
                              className="form-control" 
                              name="payOut"
                              value={formData.payOut}
                              onChange={handleInputChange}
                            >
                              <option value="">Select option</option>
                              <option value="Daily">Daily</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="NA">NA</option>
                            </select>
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Tech Skills Required</label>
                            <select 
                              className="form-control" 
                              multiple 
                              name="_techSkills"
                              value={formData._techSkills}
                              onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData(prev => ({ ...prev, _techSkills: values }));
                              }}
                            >
                              {dropdownData.techSkills.map(skill => (
                                <option key={skill._id} value={skill._id} className="text-capitalize">
                                  {skill.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Non Tech Skills Required</label>
                            <select 
                              className="form-control" 
                              multiple 
                              name="_nonTechSkills"
                              value={formData._nonTechSkills}
                              onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setFormData(prev => ({ ...prev, _nonTechSkills: values }));
                              }}
                            >
                              {dropdownData.nonTechSkills.map(skill => (
                                <option key={skill._id} value={skill._id} className="text-capitalize">
                                  {skill.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Requirement (If any)</label>
                            <select 
                              className="form-control" 
                              name="requirement"
                              value={formData.requirement}
                              onChange={handleInputChange}
                            >
                              <option value="">Select option</option>
                              <option value="Two Wheeler">Two Wheeler</option>
                              <option value="Four Wheeler">Four Wheeler</option>
                              <option value="Driving License">Driving License</option>
                              <option value="Passport">Passport</option>
                            </select>
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Salary Range (Monthly in Rs.) <span className="mandatory">*</span></label>
                            <br />
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="isFixed"
                                value="true"
                                checked={formData.isFixed === true}
                                onChange={(e) => setFormData(prev => ({ ...prev, isFixed: e.target.value === 'true' }))}
                              />
                              <label className="form-check-label">Fixed</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="isFixed"
                                value="false"
                                checked={formData.isFixed === false}
                                onChange={(e) => setFormData(prev => ({ ...prev, isFixed: e.target.value === 'true' }))}
                              />
                              <label className="form-check-label">Define Range</label>
                            </div>

                            {formData.isFixed ? (
                              <div className="mt-2">
                                <input 
                                  className={`form-control ${errors.amount ? 'error' : ''}`}
                                  placeholder="Fixed amount" 
                                  type="number" 
                                  name="amount"
                                  value={formData.amount}
                                  onChange={handleInputChange}
                                  maxLength="10"
                                />
                                {errors.amount && <span className="error-text">{errors.amount}</span>}
                              </div>
                            ) : (
                              <div className="row mt-2">
                                <div className="col-6">
                                  <input 
                                    className={`form-control ${errors.salaryRange ? 'error' : ''}`}
                                    placeholder="Minimum" 
                                    type="number" 
                                    name="min"
                                    value={formData.min}
                                    onChange={handleInputChange}
                                    maxLength="10"
                                  />
                                </div>
                                <div className="col-6">
                                  <input 
                                    className={`form-control ${errors.salaryRange ? 'error' : ''}`}
                                    placeholder="Maximum" 
                                    type="number" 
                                    name="max"
                                    value={formData.max}
                                    onChange={handleInputChange}
                                    maxLength="10"
                                  />
                                </div>
                                {errors.salaryRange && <span className="error-text">{errors.salaryRange}</span>}
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

            {/* Contact Information */}
            <section id="contact-section">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card">
                    <div className="card-content">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-12">
                            <h5 className="h1">Do you want the candidate to contact you directly?</h5>
                          </div>
                          <div className="col-xl-12 col-lg-12 col-12">
                            <div className="form-check-inline">
                              <input 
                                type="radio" 
                                name="isContact" 
                                value="true"
                                checked={formData.isContact === true}
                                onChange={handleInputChange}
                              />
                              <label>Yes</label>
                            </div>
                            <div className="form-check-inline">
                              <input 
                                type="radio" 
                                name="isContact" 
                                value="false"
                                checked={formData.isContact === false}
                                onChange={handleInputChange}
                              />
                              <label>No</label>
                            </div>
                          </div>

                          {showContactInfo && (
                            <div className="col-12 mt-3">
                              <div className="row">
                                <div className="col-xl-3 mb-1">
                                  <label>Name</label>
                                  <input 
                                    type="text" 
                                    className="form-control"
                                    name="nameof"
                                    value={formData.nameof}
                                    onChange={handleInputChange}
                                    placeholder="Name"
                                  />
                                </div>
                                <div className="col-xl-3 mb-1">
                                  <label>Phone Number <span className="mandatory">*</span></label>
                                  <input 
                                    type="tel" 
                                    className={`form-control ${errors.phoneNumberof ? 'error' : ''}`}
                                    name="phoneNumberof"
                                    value={formData.phoneNumberof}
                                    onChange={handleInputChange}
                                    placeholder="Phone no"
                                    maxLength="10"
                                  />
                                  {errors.phoneNumberof && <span className="error-text">{errors.phoneNumberof}</span>}
                                </div>
                                <div className="col-xl-3 mb-1">
                                  <label>WhatsApp Number</label>
                                  <input 
                                    type="tel" 
                                    className="form-control"
                                    name="whatsappNumberof"
                                    value={formData.whatsappNumberof}
                                    onChange={handleInputChange}
                                    placeholder="WhatsApp Number"
                                    maxLength="10"
                                  />
                                </div>
                                <div className="col-xl-3 mb-1">
                                  <label>Email</label>
                                  <input 
                                    type="email" 
                                    className="form-control"
                                    name="emailof"
                                    value={formData.emailof}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
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

            {/* Questions and Answers */}
            <section id="qa-section">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card mt-1">
                    <div className="card-content">
                      <div className="card-body">
                        <div className="qs_list">
                          {questionAnswers.map((qa, index) => (
                            <div key={index} className="row questionanswerrow mb-3">
                              <div className="col-xl-6">
                                <label>Question</label>
                                <textarea 
                                  className="form-control" 
                                  rows="2"
                                  value={qa.question}
                                  onChange={(e) => updateQuestionAnswer(index, 'question', e.target.value)}
                                />
                              </div>
                              <div className="col-xl-6">
                                <label>Answer</label>
                                <textarea 
                                  className="form-control" 
                                  rows="2"
                                  value={qa.answer}
                                  onChange={(e) => updateQuestionAnswer(index, 'answer', e.target.value)}
                                />
                              </div>
                              {questionAnswers.length > 1 && (
                                <div className="col-12 mt-2">
                                  <button 
                                    type="button" 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeQuestionAnswer(index)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="row">
                            <div className="col-12 text-right">
                              <button 
                                type="button" 
                                className="btn btn-success text-white"
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
                </div>
              </div>
            </section>

            {/* Job Description */}
            <section id="job-description">
              <div className="row">
                <div className="col-xl-12 col-lg-12 px-3">
                  <div className="card mt-1">
                    <div className="card-content">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-xl-4 mb-1">
                            <label>Job Description</label>
                            <textarea 
                              className="form-control" 
                              name="jobDescription"
                              value={formData.jobDescription}
                              onChange={handleInputChange}
                              rows="5"
                            />
                          </div>
                          <div className="col-xl-5 mb-1">
                            <label>Job Duties</label>
                            <textarea 
                              className="form-control" 
                              name="duties"
                              value={formData.duties}
                              onChange={handleInputChange}
                              rows="3"
                              maxLength="150"
                            />
                          </div>
                          <div className="col-xl-3 mb-1">
                            <label>Add Video JD</label>
                            <input 
                              className="form-control" 
                              type="file" 
                              name="jobVideo"
                              onChange={handleFileChange}
                              accept="video/*"
                            />
                            {formData.jobVideo && typeof formData.jobVideo === 'string' && (
                              <div className="mt-2">
                                <a href={`${bucketUrl}/${formData.jobVideo}`} target="_blank" rel="noopener noreferrer">
                                  View Current Video
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="col-xl-12 mb-1 text-right">
                            <button 
                              type="button" 
                              className="btn btn-success waves-effect waves-light text-white"
                              onClick={handleSubmit}
                              disabled={loading}
                            >
                              {loading ? 'UPDATING...' : 'UPDATE'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </>

      {/* Coins Modal */}
      {showCoinsModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">Insufficient Coins</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowCoinsModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body pt-1">
                <h5 className="pb-1 mb-0 mt-1">
                  You need {coinsRequired.contactcoins} Coins to avail this Premium Service
                </h5>
                <ul className="list-unstyled">
                  <li className="mb-1">
                    <span className="credit font-weight-bold">
                      Current Coins Balance: {companyData.creditLeft}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    loadCoinOffers();
                    setShowCoinsModal(false);
                  }}
                >
                  Buy Coins
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-light" 
                  onClick={() => setShowCoinsModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .error {
          border-color: #dc3545 !important;
        }
        .error-text {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: block;
        }
        .mandatory {
          color: #dc3545;
        }
        .form-check-inline {
          margin-right: 1rem;
        }
        .modal {
          z-index: 1050;
        }
      `}</style>
    </>
  );
};

export default EditJob;