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

    // Build data object, excluding selectedCenter if it's empty or course has no centers
    const hasCenters = course.center && course.center.length > 0;
    const data = {
      ...formData,
      courseId,
      mobile: candidateNumber
    };

    // Remove selectedCenter if it's empty or if course doesn't have centers
    if (!hasCenters || !data.selectedCenter || data.selectedCenter === "") {
      delete data.selectedCenter;
    }

    try {
      // Build validation conditions
      const validationErrors = [];
      
      // Check selectedCenter only if course has centers
      if (hasCenters && (formData.selectedCenter === "" || !formData.selectedCenter)) {
        validationErrors.push("Selected Center");
      }
      
      if (formData.name === "") validationErrors.push("Name");
      if (formData.email === "") validationErrors.push("Email");
      if (formData.address === "") validationErrors.push("Address");
      if (formData.sex === "") validationErrors.push("Gender");
      if (formData.dob === "") validationErrors.push("Date of Birth");
      if (formData.state === "") validationErrors.push("State");
      if (formData.city === "") validationErrors.push("City");
      if (formData.longitude === "") validationErrors.push("Longitude");
      if (formData.latitude === "") validationErrors.push("Latitude");
      if (formData.highestQualification === "") validationErrors.push("Highest Qualification");
      if (!formData.courseId && !courseId) validationErrors.push("Course ID");
      if (!formData.sourceType) validationErrors.push("Source Type");
      
      // Check source based on sourceType
      if (formData.sourceType === "Third Party" && !formData.source) {
        validationErrors.push("Third Party Source");
      }
      if (formData.sourceType === "Self/HO" && !formData.source) {
        validationErrors.push("Self/HO Counselor");
      }

      if (validationErrors.length > 0) {
        alert(`Please fill all the required fields: ${validationErrors.join(", ")}`);
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

  const fldStyle = {
    width: '100%',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#1e293b',
    background: '#f8fafc',
    outline: 'none',
  };
  const lblStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '5px',
  };
  const reqStar = <span style={{ color: '#FC2B5A' }}>*</span>;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>

      {/* Gradient Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '24px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 10px 25px rgba(252,43,90,0.35)',
      }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px 14px' }}>
          <i className="fa fa-user-plus" style={{ fontSize: '20px' }}></i>
        </div>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '22px' }}>Add Leads</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '13px' }}>
            <a href="/institute/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>Home</a>
            <span style={{ margin: '0 8px', opacity: 0.6 }}>›</span>
            <span>Add Leads</span>
          </p>
        </div>
      </div>

      {/* Step 1 — OTP Verification Card */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#FC2B5A,#a5003a)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>1</div>
          <h5 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>Candidate Verification</h5>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>

            {/* Mobile Number */}
            <div style={{ width: '220px' }}>
              <label style={lblStyle}>Candidate Number {reqStar}</label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                onKeyPress={(e) => { if (candidateNumber.length === 10) return false; handleNumberKeyPress(e); }}
                maxLength="10"
                required
                name="number"
                placeholder="10-digit mobile"
                value={candidateNumber}
                onChange={(e) => setCandidateNumber(e.target.value)}
                disabled={isNumberDisabled}
                id="user-input"
                style={{ ...fldStyle, background: isNumberDisabled ? '#f1f5f9' : '#f8fafc' }}
              />
            </div>

            {/* OTP Field */}
            {showOtpField && (
              <div style={{ width: '160px' }} id="otp-field">
                <label style={lblStyle}>Enter OTP {reqStar}</label>
                <input
                  type="number"
                  required
                  name="otp"
                  id="user-otp"
                  placeholder="4-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={fldStyle}
                />
              </div>
            )}

            {/* Send OTP Button */}
            {showSendBtn && (
              <div id="sendbtndiv">
                <button
                  id="send-otp"
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    background: 'linear-gradient(135deg,#FC2B5A,#a5003a)',
                    color: 'white', border: 'none',
                    borderRadius: '10px', padding: '10px 22px',
                    fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(252,43,90,0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <i className="fa fa-paper-plane" style={{ marginRight: '7px' }}></i>Send OTP
                </button>
              </div>
            )}

            {/* OTP Actions */}
            {showOtpActions && (
              <div id="otp-actions" style={{ display: 'flex', gap: '10px' }}>
                <button
                  id="resend-btn"
                  onClick={handleResendOtp}
                  style={{
                    background: 'white', color: '#FC2B5A',
                    border: '1.5px solid #FC2B5A',
                    borderRadius: '10px', padding: '10px 18px',
                    fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  <i className="fa fa-refresh" style={{ marginRight: '6px' }}></i>Resend
                </button>
                <button
                  id="verify-login-btn"
                  onClick={handleVerifyOtp}
                  style={{
                    background: 'linear-gradient(135deg,#FC2B5A,#a5003a)',
                    color: 'white', border: 'none',
                    borderRadius: '10px', padding: '10px 22px',
                    fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(252,43,90,0.3)', whiteSpace: 'nowrap',
                  }}
                >
                  <i className="fa fa-check" style={{ marginRight: '6px' }}></i>Verify OTP
                </button>
              </div>
            )}

            {/* Select Center */}
            {course.center?.length > 0 && showSelectCenter && (
              <div id="selectCenter" style={{ width: '220px' }}>
                <label style={lblStyle}>Training Center {reqStar}</label>
                <select
                  onChange={(e) => { setSelectedCenter(e.target.value); removeDisabled('applydiv'); }}
                  id="centerSelect"
                  name="center"
                  value={selectedCenter}
                  disabled={isCenterSelectDisabled}
                  style={fldStyle}
                >
                  <option value="">Select Training Center</option>
                  {course.center.map((c, i) => (
                    <option key={i} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Apply Course Button */}
            {showApplyDiv && (
              <div id="applydiv">
                <button
                  id="add__centers"
                  type="button"
                  onClick={handleApplyCourse}
                  disabled={isApplyBtnDisabled}
                  style={{
                    background: isApplyBtnDisabled ? '#e2e8f0' : 'linear-gradient(135deg,#FC2B5A,#a5003a)',
                    color: isApplyBtnDisabled ? '#94a3b8' : 'white',
                    border: 'none', borderRadius: '10px', padding: '10px 22px',
                    fontWeight: 600, fontSize: '13px',
                    cursor: isApplyBtnDisabled ? 'not-allowed' : 'pointer',
                    boxShadow: isApplyBtnDisabled ? 'none' : '0 4px 10px rgba(252,43,90,0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <i className="fa fa-graduation-cap" style={{ marginRight: '7px' }}></i>Apply Course
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2 — Candidate Details Form */}
      {showCandidateDetails && (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#FC2B5A,#a5003a)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>2</div>
            <h5 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>Candidate Details</h5>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <form onSubmit={handleFormSubmit} id="candidateDetails">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>

                {course.center?.length > 0 && (
                  <div style={{ flex: '1 1 200px', minWidth: '180px' }} id="selectCenterNewLead">
                    <label style={lblStyle}>Training Center {reqStar}</label>
                    <select
                      id="centerSelectNewLead"
                      name="selectedCenter"
                      required
                      value={formData.selectedCenter}
                      onChange={(e) => handleFormDataChange('selectedCenter', e.target.value)}
                      style={fldStyle}
                    >
                      <option value="">Select Option</option>
                      {course.center.map((c, i) => (
                        <option key={i} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                  <label style={lblStyle}>Name {reqStar}</label>
                  <input type="text" name="name" maxLength="50" required value={formData.name}
                    onChange={(e) => handleFormDataChange('name', e.target.value)} style={fldStyle} placeholder="Full name" />
                </div>

                <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                  <label style={lblStyle}>Email {reqStar}</label>
                  <input type="email" maxLength="50" name="email" value={formData.email} required
                    onChange={(e) => handleFormDataChange('email', e.target.value)} style={fldStyle} placeholder="Email address" />
                </div>

                <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                  <label style={lblStyle}>Address</label>
                  <input ref={addressInputRef} id="loc" type="text" maxLength="100" name="address"
                    value={formData.address} onChange={(e) => handleFormDataChange('address', e.target.value)}
                    style={fldStyle} placeholder="Search address..." />
                </div>

                {/* Hidden location fields */}
                <input id="state" name="state" type="hidden" value={formData.state} />
                <input id="city" name="city" type="hidden" value={formData.city} />
                <input id="longitude" name="longitude" type="hidden" value={formData.longitude} />
                <input id="latitude" name="latitude" type="hidden" value={formData.latitude} />

                <div style={{ flex: '1 1 160px', minWidth: '140px' }} id="pd-gender">
                  <label style={lblStyle}>Gender {reqStar}</label>
                  <select name="sex" id="user-gender" value={formData.sex}
                    onChange={(e) => handleFormDataChange('sex', e.target.value)} style={fldStyle}>
                    <option value="">Please select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 160px', minWidth: '140px' }} id="dob-field">
                  <label style={lblStyle}>Date of Birth {reqStar}</label>
                  <input type="date" name="dob" value={formData.dob} id="candidate-dob"
                    onChange={(e) => handleFormDataChange('dob', e.target.value)} style={fldStyle} />
                </div>

                <div style={{ flex: '1 1 180px', minWidth: '160px' }} id="pd-number">
                  <label style={lblStyle}>WhatsApp Number {reqStar}</label>
                  <input type="tel" maxLength="10" name="whatsapp" value={formData.whatsapp}
                    id="candidate-whatsapp-number" onChange={(e) => handleFormDataChange('whatsapp', e.target.value)}
                    style={fldStyle} placeholder="WhatsApp number" />
                </div>

                <div style={{ flex: '1 1 200px', minWidth: '180px' }} id="highestQuali">
                  <label style={lblStyle}>Highest Qualification {reqStar}</label>
                  <select className="single-field" value={formData.highestQualification}
                    name="highestQualification" id="quali"
                    onChange={(e) => handleFormDataChange('highestQualification', e.target.value)} style={fldStyle}>
                    <option value="">Select Qualification</option>
                    {highestQualification.map((q) => (
                      <option key={q._id} value={q._id} className="text-capitalize">{q.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
                  <label style={lblStyle}>Source Type {reqStar}</label>
                  <select className="single-field" value={formData.sourceType} name="sourceType" id="sourceType"
                    onChange={(e) => handleFormDataChange('sourceType', e.target.value)} style={fldStyle}>
                    <option value="">Select Source Type</option>
                    <option value="Self/HO">Self/HO</option>
                    <option value="Third Party">Third Party</option>
                  </select>
                </div>

                {formData.sourceType === "Third Party" && (
                  <div style={{ flex: '1 1 200px', minWidth: '180px' }} id="thirdPartySource">
                    <label style={lblStyle}>Third Party Source {reqStar}</label>
                    <select className="single-field" value={formData.source} name="source" id="thirdPartySourceSelect"
                      onChange={(e) => {
                        const selectedSource = sources.find(s => s._id === e.target.value);
                        handleFormDataChange('source', e.target.value);
                        handleFormDataChange('sourceName', selectedSource ? selectedSource.name : '');
                      }} style={fldStyle}>
                      <option value="">Select Third Party Source</option>
                      {sources.map((source) => (
                        <option key={source._id} value={source._id} className="text-capitalize">{source.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.sourceType === "Self/HO" && (
                  <div style={{ flex: '1 1 200px', minWidth: '180px' }} id="selfHoSource">
                    <label style={lblStyle}>Self/HO Counselor {reqStar}</label>
                    <select className="single-field" value={formData.source} name="source" id="selfHoSourceSelect"
                      onChange={(e) => {
                        const selectedCounselor = counselors.find(c => c._id === e.target.value);
                        handleFormDataChange('source', e.target.value);
                        handleFormDataChange('sourceName', selectedCounselor ? selectedCounselor.name : '');
                      }} style={fldStyle}>
                      <option value="">Select Self/HO Counselor</option>
                      {counselors.map((counselor) => (
                        <option key={counselor._id} value={counselor._id} className="text-capitalize">{counselor.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <button type="submit" style={{
                  background: 'linear-gradient(135deg,#FC2B5A,#a5003a)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  padding: '11px 32px', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(252,43,90,0.35)',
                }}>
                  <i className="fa fa-check-circle" style={{ marginRight: '8px' }}></i>Submit & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 3 — Document Upload */}
      {course.docsRequired && course.docsRequired.length > 0 && showAddDocs && (
        <div id="add-docs" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#FC2B5A,#a5003a)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>3</div>
            <h5 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>Upload Student Documents</h5>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {course.docsRequired.map((doc, index) => (
                <div key={index} style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px',
                  background: uploadedFiles[doc.Name] ? '#f0fdf4' : '#fef6f8',
                  border: `1.5px solid ${uploadedFiles[doc.Name] ? '#86efac' : '#fecdd3'}`,
                  borderRadius: '12px', padding: '14px 18px',
                }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ ...lblStyle, color: uploadedFiles[doc.Name] ? '#16a34a' : '#64748b' }}>
                      {doc.Name} <span style={{ color: '#FC2B5A' }}>*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(doc.Name, e.target.files)}
                      required
                      name="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      id={`file${doc.Name}`}
                      disabled={uploadedFiles[doc.Name]}
                      style={{ ...fldStyle, padding: '7px 12px', background: 'white' }}
                    />
                  </div>
                  <div style={{ paddingTop: '18px' }}>
                    <button
                      id="add__dcs"
                      type="button"
                      onClick={() => uploadFile(doc.Name, doc._id, fileInputs[doc.Name] ? [fileInputs[doc.Name]] : [])}
                      disabled={uploadedFiles[doc.Name]}
                      style={{
                        background: uploadedFiles[doc.Name] ? '#dcfce7' : 'linear-gradient(135deg,#FC2B5A,#a5003a)',
                        color: uploadedFiles[doc.Name] ? '#16a34a' : 'white',
                        border: 'none', borderRadius: '10px', padding: '10px 20px',
                        fontWeight: 600, fontSize: '13px',
                        cursor: uploadedFiles[doc.Name] ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <i className={`fa ${uploadedFiles[doc.Name] ? 'fa-check-circle' : 'fa-upload'}`} style={{ marginRight: '7px' }}></i>
                      {uploadedFiles[doc.Name] ? 'Uploaded' : 'Upload'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddLeads;