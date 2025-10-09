import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import moment from 'moment';
const AddLeads = () => {

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
  const { courseId } = useParams();
  // Props that would come from parent component or context
  const [course, setCourse] = useState({});

  // const courseId = '';
  const [highestQualification, setHighestQualification] = useState([]);
  const [sources, setSources] = useState([]);
  const [counselors, setCounselors] = useState([]);

  // State management
  const [candidateNumber, setCandidateNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [showOtpActions, setShowOtpActions] = useState(false);
  const [showSendBtn, setShowSendBtn] = useState(true);
  const [showSelectCenter, setShowSelectCenter] = useState(false);
  const [showApplyDiv, setShowApplyDiv] = useState(false);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  const [showAddDocs, setShowAddDocs] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [isNumberDisabled, setIsNumberDisabled] = useState(false);
  const [isApplyBtnDisabled, setIsApplyBtnDisabled] = useState(false);
  const [isCenterSelectDisabled, setIsCenterSelectDisabled] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    selectedCenter: '',
    name: '',
    email: '',
    address: '',
    state: '',
    city: '',
    longitude: '',
    latitude: '',
    sex: '',
    dob: '',
    whatsapp: '',
    highestQualification: '',
    sourceType: '',
    source: '',
    sourceName: '',
  });

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [fileInputs, setFileInputs] = useState({});

  // Refs
  const addressInputRef = useRef(null);

  useEffect(() => {
    console.log("course", course);
  }, [course]);


  useEffect(() => {
    const fetchCourseDetails = async () => {
      const response = await axios.get(`${backendUrl}/college/courses/course-details/${courseId}`, {
        
        headers: {
          'x-auth': token,
        }
      });

      if(response.status === true || response.data.status === true || response.data.status === "true"){
        const data = response.data;
        console.log("data", data);
        setCourse(data.course);
        setHighestQualification(data.highestQualification);
      } else {
        alert(response?.msg || "Failed to fetch course details");
      }

      
      //
    };
    fetchCourseDetails();
  }, []);

  // Fetch sources from API
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch(`${backendUrl}/college/users/sources`, {
          method: 'GET',
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.status || data.success) {
          setSources(data.data || []);
        } else {
          console.error('Failed to fetch sources:', data.message);
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
      }
    };

    fetchSources();
  }, []);

  // Fetch counselors from API
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await fetch(`${backendUrl}/college/filters-data`, {
          method: 'GET',
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.status || data.success) {
          setCounselors(data.counselors || []);
        } else {
          console.error('Failed to fetch counselors:', data.message);
        }
      } catch (error) {
        console.error('Error fetching counselors:', error);
      }
    };

    fetchCounselors();
  }, []);

  // Google Maps initialization
  useEffect(() => {
    const initMap = () => {
      const options = {
        componentRestrictions: { country: "in" },
        fields: ["address_components", "geometry"],
        types: ["geocode"]
      };

      setTimeout(() => {
        if (addressInputRef.current && window.google) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            options
          );

          autocomplete.addListener("place_changed", function () {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.address_components) {
              alert("No details available for input: '" + place.name + "'");
              return;
            }

            const latitude = place.geometry.location.lat();
            const longitude = place.geometry.location.lng();

            let state = "";
            let city = "";
            let country = "";           

            place.address_components.forEach(component => {
              const types = component.types;
              if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
              if (types.includes('locality') || types.includes('sublocality')) {
                city = component.long_name;
              }
              if (types.includes("country")) {
                country = component.long_name;
              }
            });

            const address = [city, state, country].filter(Boolean).join(", ");


            setFormData(prev => ({
              ...prev,
              address,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              state,
              city
            }));

            console.log("Selected Location:", {
              latitude,
              longitude,
              state,
              city, address
            });

            addressInputRef.current.value = place.formatted_address || place.name || "";
          });
        }
      }, 500);
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB7DDN_gUp2zyrlElXtYpjTEQobYiUB9Lg&callback=initMap&libraries=places&v=weekly';
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  useEffect(() => {
    console.log("formData.address", formData.address);
  }, [formData.address]);

  // Helper functions
  const removeDisabled = (elementClass) => {
    console.log(elementClass);
    if (elementClass === 'applydiv') {
      setShowApplyDiv(true);
    }
  };

  const validateFile = (files) => {
    const allowedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
    let validFiles = true;

    Array.from(files).forEach(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        validFiles = false;
      }
    });

    if (!validFiles) {
      alert("Please upload only PDF, DOC, DOCX, JPG, JPEG, or PNG files!");
      return false;
    }
    return true;
  };

  const uploadFile = async (docsname, docsId, files) => {
    if (!courseId || courseId === "undefined") {
      console.error("Error: courseId is missing.");
      alert("Error: Course ID is not available.");
      return;
    }

    if (files.length === 0) {
      alert("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("courseId", courseId);
    formData.append("docsId", docsId);
    formData.append("mobile", candidateNumber);

    console.log("Upload request details:");
    console.log("Course ID:", courseId);
    console.log("Docs ID:", docsId);
    console.log("Mobile:", candidateNumber);
    console.log("File:", files[0]);
    console.log("Token:", token);

    try {
      console.log("Sending request to:", `${backendUrl}/college/courses/${courseId}/candidate/upload-docs`);

      const result = await axios.post(`${backendUrl}/college/courses/${courseId}/candidate/upload-docs`, formData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'multipart/form-data',
        }
      });





      if (result.status === true || result.data.status === true || result.data.status === "true") {
        alert("Your documents uploaded successfully");

        // Update uploaded files state
        setUploadedFiles(prev => ({
          ...prev,
          [docsname]: true
        }));
      } else {
        alert(result?.msg || "Failed to upload document");
      }

    } catch (err) {
      console.error("Error uploading document:", err);
      alert("Error uploading document. Please try again.");
    }
  };

  // Event handlers
  const handleNumberKeyPress = (e) => {
    let k = e.which;
    if (k > 58 || k < 48) {
      e.preventDefault();
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (candidateNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const body = { mobile: candidateNumber };


    try {
      const response = await fetch(`${backendUrl}/api/sendOtptoAddLead`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (data.status === true) {
        setShowOtpField(true);
        setShowOtpActions(true);
        setShowSendBtn(false);
        setIsNumberDisabled(true);
        alert("OTP has been sent to your mobile number.");
      } else {
        alert("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      alert("Please enter a valid 4-digit OTP.");
      return;
    }

    const body = {
      mobile: candidateNumber,
      otp: otp
    };

    try {
      console.log("Sending verification request with:", body);
      const response = await fetch(`${backendUrl}/api/verifyOtp`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      console.log("Verification response:", data);

      if (data.status === true) {
        setShowOtpField(false);
        setShowOtpActions(false);

        const verifyBody = { ...body, courseId };
        alert("Candidate OTP verified successfully.");

        const verifyResponse = await fetch(`${backendUrl}/college/candidate/verifyuser`, {
          method: 'POST',
          headers: {
            'x-auth': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(verifyBody)
        });
        const verifyData = await verifyResponse.json();

        if (verifyData.status === true && verifyData.appliedStatus === true) {
          alert("Course already applied");
          window.location.href = `${backendUrl}/institute/viewcourse/${courseId}/candidate/addleads`;
        } else if (verifyData.status === true && verifyData.appliedStatus === false) {
          if (course.center?.length > 0) {
            setShowSelectCenter(true);
          } else {
            setShowApplyDiv(true);
          }
        } else if (verifyData.status === false) {
          setShowCandidateDetails(true);
        }
      } else {
        alert("Incorrect OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Error verifying OTP. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (candidateNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const body = { mobile: candidateNumber };

    try {
      const response = await fetch(`${backendUrl}/api/sendOtptoAddLead`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (data.status === true) {
        alert("OTP resent successfully.");
      } else {
        alert("Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleApplyCourse = async (e) => {
    e.preventDefault();
    const body = { mobile: candidateNumber };

    if (course.center?.length > 0) {
      body.selectedCenter = selectedCenter;
    }

    try {
      console.log("Request body:", body);
      console.log("Token:", token);
      console.log("Course ID:", courseId);

      const response = await fetch(`${backendUrl}/college/candidate/course/${courseId}/apply`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        alert("Course applied successfully");
        setIsApplyBtnDisabled(true);

        if (course.center?.length > 0) {
          setIsCenterSelectDisabled(true);
        }

        if (course.docsRequired && course.docsRequired.length > 0) {
          setShowAddDocs(true);
        } else {
          window.location.href = `${backendUrl}/institute/viewcourse/${courseId}/candidate/addleads`;
        }
      } else {
        alert(data?.msg || "Something went wrong");
      }
    } catch (error) {
      console.error("Error applying for course:", error);
      alert("Something went wrong");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!candidateNumber) {
      return alert("mobile number required");
    }

    const data = {
      ...formData,
      courseId,
      mobile: candidateNumber
    };

    console.log("Final Form Data Object:", data);

    try {

      if(formData.selectedCenter === "" || formData.name === "" || formData.email === "" || formData.address === "" || formData.sex === "" || formData.dob === "" || formData.state === "" || formData.city === "" || formData.longitude === "" || formData.latitude === "" || formData.highestQualification === "" || formData.courseId === "" ){
        alert("Please fill all the fields");
        return;
      }

      const response = await fetch(`${backendUrl}/college/candidate/addleaddandcourseapply`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.status) {
        alert("Candidate added and Course applied");
        setShowCandidateDetails(false);

        if (course.docsRequired && course.docsRequired.length > 0) {
          setShowAddDocs(true);
        } else {
          window.location.href = `${backendUrl}/institute/viewcourse/${courseId}/candidate/addleads`;
        }
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (docName, files) => {
    if (validateFile(files)) {
      setFileInputs(prev => ({
        ...prev,
        [docName]: files[0]
      }));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-12 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Add Leads</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/institute/dashboard">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Add Leads</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-body">
        {/* Flash messages would go here */}

        <section id="add-leads">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Add Lead</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-1">
                        <label>
                          Candidate Number
                          <span className="asterisk">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          pattern="[0-9]{10}"
                          onKeyPress={(e) => {
                            if (candidateNumber.length === 10) return false;
                            handleNumberKeyPress(e);
                          }}
                          maxLength="10"
                          required
                          name="number"
                          placeholder="Candidate Number"
                          value={candidateNumber}
                          onChange={(e) => setCandidateNumber(e.target.value)}
                          disabled={isNumberDisabled}
                          id="user-input"
                        />
                      </div>

                      <div className={`col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-1 ${!showOtpField ? 'd-none' : ''}`} id="otp-field">
                        <label>
                          Enter OTP
                          <span className="asterisk">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          required
                          name="otp"
                          id="user-otp"
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>

                      <div className={`col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 ${!showSendBtn ? 'd-none' : ''}`} id="sendbtndiv">
                        <button
                          id="send-otp"
                          type="button"
                          className="btn btn-success px-lg-2 ml-1 waves-effect waves-light"
                          onClick={handleSendOtp}
                        >
                          Send OTP
                        </button>
                      </div>

                      <div className={`row align-items-center ${!showOtpActions ? 'd-none' : ''}`} id="otp-actions">
                        <div className="col-xl-2 col-lg-2 col-md-2 col-sm-2 col-2">
                          <button
                            className="btn btn-success btn-block waves-effect waves-light text-white btn-block"
                            id="resend-btn"
                            onClick={handleResendOtp}
                          >
                            Resend OTP
                          </button>
                        </div>
                        <div className="col-xl-1 col-lg-1 col-md-1 col-sm-1 col-1">
                          <button
                            className="btn btn-success float-right btn-inline waves-effect waves-light text-white btn-block"
                            id="verify-login-btn"
                            onClick={handleVerifyOtp}
                          >
                            Verify
                          </button>
                        </div>
                      </div>

                      {course.center?.length > 0 && (
                        <div id="selectCenter" className={`col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-md-0 mb-1 ${!showSelectCenter ? 'd-none' : ''}`}>
                          <select
                            onChange={(e) => {
                              setSelectedCenter(e.target.value);
                              removeDisabled('applydiv');
                            }}
                            className="form-control"
                            id="centerSelect"
                            name="center"
                            value={selectedCenter}
                            disabled={isCenterSelectDisabled}
                          >
                            <option value="">Select Training Center</option>
                            {course.center.map((c, i) => (
                              <option key={i} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div id="applydiv" className={`col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 ${!showApplyDiv ? 'd-none' : ''}`}>
                        <button
                          id="add__centers"
                          type="button"
                          className="btn btn-success px-lg-2 ml-1 waves-effect waves-light"
                          onClick={handleApplyCourse}
                          disabled={isApplyBtnDisabled}
                        >
                          Apply Course
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleFormSubmit} id="candidateDetails" className={`row ${!showCandidateDetails ? 'd-none' : ''}`}>
                      <div className="col-12">
                        <div className="row">
                          {course.center?.length > 0 && (
                            <div id="selectCenterNewLead" className="col-xl-3 mb-1">
                              <label>
                                Select Training Center <span className="mandatory">*</span>
                              </label>
                              <select
                                className="form-control"
                                id="centerSelectNewLead"
                                name="selectedCenter"
                                required
                                value={formData.selectedCenter}
                                onChange={(e) => handleFormDataChange('selectedCenter', e.target.value)}
                              >
                                <option value="">Select Option</option>
                                {course.center.map((c, i) => (
                                  <option key={i} value={c._id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="col-xl-3 mb-1">
                            <label>
                              Name <span className="mandatory">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="name"
                              maxLength="50"
                              required
                              value={formData.name}
                              onChange={(e) => handleFormDataChange('name', e.target.value)}
                            />
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>
                              Email <span className="mandatory">*</span>
                            </label>
                            <input
                              type="email"
                              className="form-control"
                              maxLength="50"
                              name="email"
                              value={formData.email}
                              required
                              onChange={(e) => handleFormDataChange('email', e.target.value)}
                            />
                          </div>

                          <div className="col-xl-3 mb-1">
                            <label>Address</label>
                            <input
                              ref={addressInputRef}
                              id="loc"
                              type="text"
                              className="form-control"
                              maxLength="100"
                              name="address"
                              value={formData.address}
                              onChange={(e) => handleFormDataChange('address', e.target.value)}
                            />
                          </div>

                          {/* Hidden fields for location data */}
                          <div className="col-xl-3 mb-1 d-none">
                            <label>State <span className="mandatory">*</span></label>
                            <input
                              id="state"
                              name="state"
                              type="hidden"
                              className="form-control"
                              maxLength="50"
                              value={formData.state}
                            />
                          </div>

                          <div className="col-xl-3 mb-1 d-none">
                            <label>City <span className="mandatory">*</span></label>
                            <input
                              id="city"
                              name="city"
                              type="hidden"
                              className="form-control"
                              maxLength="50"
                              value={formData.city}
                            />
                          </div>

                          <div className="col-xl-3 mb-1 d-none">
                            <label>Longitude <span className="mandatory">*</span></label>
                            <input
                              id="longitude"
                              name="longitude"
                              type="hidden"
                              className="form-control"
                              maxLength="50"
                              value={formData.longitude}
                            />
                          </div>

                          <div className="col-xl-3 mb-1 d-none">
                            <label>Latitude <span className="mandatory">*</span></label>
                            <input
                              id="latitude"
                              name="latitude"
                              type="hidden"
                              className="form-control"
                              maxLength="50"
                              value={formData.latitude}
                            />
                          </div>

                          <div className="col-xl-2 mb-1" id="pd-gender">
                            <label>
                              Gender<span className="mandatory"> *</span>
                            </label>
                            <select
                              className="form-control"
                              name="sex"
                              id="user-gender"
                              value={formData.sex}
                              onChange={(e) => handleFormDataChange('sex', e.target.value)}
                            >
                              <option value="">Please select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          <div className="col-xl-2 mb-1" id="dob-field">
                            <label>
                              Date of Birth<span className="mandatory"> *</span>
                            </label>
                            <input
                              type="date"
                              name="dob"
                              className="form-control"
                              value={formData.dob}
                              id="candidate-dob"
                              onChange={(e) => handleFormDataChange('dob', e.target.value)}
                            />
                          </div>

                          <div className="col-xl-3 mb-1" id="pd-number">
                            <label>
                              WhatsApp Number <span className="mandatory"> *</span>
                            </label>
                            <input
                              type="tel"
                              maxLength="10"
                              name="whatsapp"
                              className="form-control"
                              value={formData.whatsapp}
                              id="candidate-whatsapp-number"
                              onChange={(e) => handleFormDataChange('whatsapp', e.target.value)}
                            />
                          </div>

                          <div className="col-xl-3 mb-1" id="highestQuali">
                            <label>
                              Highest Qualification <span className="mandatory">*</span>
                            </label>
                            <select
                              className="form-control single-field"
                              value={formData.highestQualification}
                              name="highestQualification"
                              id="quali"
                              onChange={(e) => handleFormDataChange('highestQualification', e.target.value)}
                            >
                              <option value="">Select Highest Qualification</option>
                              {highestQualification.map((q) => (
                                <option key={q._id} value={q._id} className="text-capitalize">
                                  {q.name}
                                </option>
                              ))}
                            </select>
                          </div>

                                                                                                           <div className="col-xl-3 mb-1" id="highestQuali">
                              <label>
                               Source Type <span className="mandatory">*</span>
                              </label>
                              <select
                                className="form-control single-field"
                                value={formData.sourceType}
                                name="sourceType"
                                id="sourceType"
                                onChange={(e) => handleFormDataChange('sourceType', e.target.value)}
                              >
                                <option value="">Select Source Type</option>
                                <option value="Self/HO">Self/HO</option>
                                <option value="Third Party">Third Party</option>
                              </select>
                            </div>

                                                         {/* Second dropdown for Third Party sources */}
                             {formData.sourceType === "Third Party" && (
                               <div className="col-xl-3 mb-1" id="thirdPartySource">
                                 <label>
                                  Third Party Source <span className="mandatory">*</span>
                                 </label>
                                                                   <select
                                    className="form-control single-field"
                                    value={formData.source}
                                    name="source"
                                    id="thirdPartySourceSelect"
                                    onChange={(e) => {
                                      const selectedSource = sources.find(s => s._id === e.target.value);
                                      handleFormDataChange('source', e.target.value);
                                      handleFormDataChange('sourceName', selectedSource ? selectedSource.name : '');
                                    }}
                                  >
                                   <option value="">Select Third Party Source</option>
                                   {sources.map((source) => (
                                     <option key={source._id} value={source._id} className="text-capitalize">
                                       {source.name}
                                     </option>
                                   ))}
                                 </select>
                               </div>
                             )}

                                                          
                             {formData.sourceType === "Self/HO" && (
                               <div className="col-xl-3 mb-1" id="selfHoSource">
                                 <label>
                                  Self/HO Counselor <span className="mandatory">*</span>
                                 </label>
                                                                   <select
                                    className="form-control single-field"
                                    value={formData.source}
                                    name="source"
                                    id="selfHoSourceSelect"
                                    onChange={(e) => {
                                      const selectedCounselor = counselors.find(c => c._id === e.target.value);
                                      handleFormDataChange('source', e.target.value);
                                      handleFormDataChange('sourceName', selectedCounselor ? selectedCounselor.name : '');
                                    }}
                                  >
                                   <option value="">Select Self/HO Counselor</option>
                                   {counselors.map((counselor) => (
                                     <option key={counselor._id} value={counselor._id} className="text-capitalize">
                                       {counselor.name}
                                     </option>
                                   ))}
                                 </select>
                               </div>
                             )}

                             
                                                     
                        </div>
                      </div>

                      <div className="col-xl-3 mb-1">
                        <button type="submit" className="form-control btn btn-success px-lg-2 waves-effect waves-light">
                          Submit
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Document Upload Section */}
        {course.docsRequired && course.docsRequired.length > 0 && (
          <section id="add-docs" className={showAddDocs ? '' : 'd-none'}>
            <div className="row">
              <div className="col-xl-12 col-lg-12">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Upload Student Documents</h4>
                  </div>
                  <div className="card-content">
                    <div className="card-body">
                      {course.docsRequired.map((doc, index) => (
                        <div key={index} className="file-containers row align-items-center">
                          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-1">
                            <label>
                              Add {doc.Name}
                              <span className="asterisk">*</span>
                            </label>
                            <input
                              type="file"
                              className="form-control file-inputs fileInput"
                              onChange={(e) => handleFileChange(doc.Name, e.target.files)}
                              required
                              name="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              id={`file${doc.Name}`}
                              disabled={uploadedFiles[doc.Name]}
                            />
                          </div>
                          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-m mb-1">
                            <button
                              id="add__dcs"
                              type="button"
                              className={`btn px-lg-2 ml-1 waves-effect waves-light ${uploadedFiles[doc.Name] ? 'btn-secondary' : 'btn-success'
                                }`}
                              onClick={() => uploadFile(doc.Name, doc._id, fileInputs[doc.Name] ? [fileInputs[doc.Name]] : [])}
                              disabled={uploadedFiles[doc.Name]}
                            >
                              {uploadedFiles[doc.Name] ? 'Uploaded' : 'Upload'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="text-right reset"></div>
      </div>
    </div>
  );
};

export default AddLeads;