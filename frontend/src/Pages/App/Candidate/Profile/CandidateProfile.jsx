import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { parseAddressComponents, getCoordinates, isValidPlace } from "../../../../utils/addressUtils";

const CandidateProfile = () => {
  // State for resume data
  const [user, setUser] = useState({});
  const [voiceIntroduction, setVoiceIntroduction] = useState(false);
  const [experiences, setExperiences] = useState([{
    jobTitle: '',
    companyName: '',
    from: null,
    to: null,
    jobDescription: '',
    currentlyWorking: false
  }]);

  const [educations, setEducations] = useState([
    {
      education: '',          // ObjectId of Qualification (e.g., 10th, UG)
      universityName: '',
      boardName: '',
      collegeName: '',
      schoolName: '',
      course: '',             // ObjectId of QualificationCourse
      specialization: '',
      passingYear: '',
      marks: '',

      universityLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      },
      collegeLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      },
      schoolLocation: {
        type: 'Point',
        coordinates: [0, 0],
        city: '',
        state: '',
        fullAddress: ''
      }
    }
  ]);

  const [skills, setSkills] = useState([{
    skillName: '',
    skillPercent: 0
  }]);
  const [resume, setResume] = useState([{

  }]);
  const [certificates, setCertificates] = useState([{
    certificateName: '',
    orgName: '',
    month: '',
    year: '',
    orgLocation: {
      type: 'Point',
      coordinates: [],
      city: '',
      state: '',
      fullAddress: ''
    }
  }]);
  const [projects, setProjects] = useState([{
    projectName: '',
    proyear: '',
    proDescription: ''
  }]);
  const [interests, setInterests] = useState(['']);
  const [languages, setLanguages] = useState([{
    name: '',
    level: 0
  }]);
  const [declaration, setDeclaration] = useState({
    isChecked: false,
    text: 'I hereby declare that all the information provided above is true to the best of my knowledge.'
  });

  // State for UI control
  const [profileData, setProfileData] = useState({});
  const [educationList, setEducationList] = useState([]);

  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [profileStrength, setProfileStrength] = useState(0);
  const [showIntroOptions, setShowIntroOptions] = useState(true);

  const [fileName, setFileName] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [updateNumber, setUpdateNumber] = useState(false);
  const viewResume = () => {
    try {
      // Get the resume URL from state array (profileData.personalInfo.resume)
      // Resume is stored as an array of objects with 'url' property
      const resumeArray = resume.length > 0 ? resume : (profileData?.personalInfo?.resume || []);
      
      if (!resumeArray || resumeArray.length === 0 || !resumeArray[0]?.url) {
        alert("Resume not found. Please upload it again.");
        return;
      }

      // Get the latest resume URL
      const latestResume = resumeArray[resumeArray.length - 1];
      const url = latestResume.url;
      
      setResumeUrl(url);
      setShowResumeViewer(true);
    } catch (error) {
      console.error("Error viewing resume:", error);
      alert("Failed to view resume. Please try again later.");
    }
  };

  const checkCvValidation = (fileName) => {
    const allowedExtensions = /\.(docx?|pdf|jpg|jpeg|png)$/i;
    return allowedExtensions.test(fileName);
  };
  const checkCVSize = (size) => {
    return size <= 5 * 1024 * 1024; // 5MB
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name;
    const fileSize = file.size;

    if (!checkCvValidation(fileType) && !checkCVSize(fileSize)) {
      alert("Upload the CV in .docx, .doc, .jpg, .jpeg, .png or pdf format and size should be less than 5MB");
      e.target.value = '';
      return;
    } else if (checkCvValidation(fileType) && !checkCVSize(fileSize)) {
      alert("Uploaded CV size should be less than 5MB");
      e.target.value = '';
      return;
    } else if (!checkCvValidation(fileType) && checkCVSize(fileSize)) {
      alert("Upload the CV in .docx, .doc, .jpg, .jpeg, .png or pdf format");
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const headers = {
      headers: {
        'x-auth': localStorage.getItem('token'),
        'Content-Type': 'multipart/form-data'
      }
    };

    try {
      const result = await axios.post(`${backendUrl}/api/uploadSingleFile`, formData, headers);
      console.log("📦 Upload response:", result.data);

      if (result.data.status) {
        localStorage.setItem("resume", result.data.data.Key); // Saving key like original

        // Store file info in localStorage
        const currentDate = new Date().toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        }).replace(/ /g, ' ');

        localStorage.setItem('resumeFileName', file.name);
        localStorage.setItem('resumeUploadDate', currentDate);

        setFileName(file.name);
        setUploadDate(currentDate);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Something went wrong while uploading the resume.");
    }
  };


  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [timer, setTimer] = useState('00:00');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const secondsRef = useRef(0);
  const minutesRef = useRef(0);
  const [boardSuggestions, setBoardSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(null); // active input index
  const [coursesList, setCoursesList] = useState({}); // इंडेक्स के आधार पर कोर्सेस स्टोर करेगा
  const [specializationsList, setSpecializationsList] = useState({}); // इंडेक्स के आधार पर स्पेशलाइजेशन स्टोर करेगा
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const videoChunksRef = useRef([]);
  const videoRecorderRef = useRef(null);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [oldPhoneNumber, setOldPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [errors, setErrors] = useState({
    oldPhone: '',
    otp: '',
    newPhone: ''
  });

  const openPhoneModal = () => {
    setShowPhoneModal(true);
    // Clear previous data when opening modal
    setOldPhoneNumber('');
    setOtp('');
    setNewPhoneNumber('');
    setIsOtpSent(false);
    setErrors({});
  };

  const closePhoneModal = () => {
    setShowPhoneModal(false);
    // Reset all states when closing
    setOldPhoneNumber('');
    setOtp('');
    setNewPhoneNumber('');
    setIsOtpSent(false);
    setOtpLoading(false);
    setUpdateLoading(false);
    setErrors({});
  };

  const sendOtp = async () => { }

  const updatePhoneNumber = async () => { }

  const handleOldPhoneChange = (e) => { }

  const handleOtpChange = (e) => { }

  const handleNewPhoneChange = (e) => { }



  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setVideoStream(stream);

      const recorder = new MediaRecorder(stream);
      videoRecorderRef.current = recorder;
      videoChunksRef.current = [];

      recorder.ondataavailable = e => videoChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        console.log("Video URL", url); // Preview or upload it
        // save it to state if needed
      };

      recorder.start();
      setIsRecordingVideo(true);
    } catch (err) {
      console.error("Video recording failed:", err);
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current) {
      videoRecorderRef.current.stop();
      videoStream.getTracks().forEach(track => track.stop());
      setIsRecordingVideo(false);
    }
  };
  const openModal = () => {
    setUpdateNumber(true);
  };

  const closeModal = () => {
    setUpdateNumber(false);
  };

  // Backend URL
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const uploadCV = async (file, filename) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${backendUrl}/api/uploadSingleFile/${filename}`, formData, {
        headers: {
          'x-auth': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status && res.data.data.Location) {
        // Store file info in localStorage before updating profile
        const currentDate = new Date().toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        }).replace(/ /g, ' ');
        localStorage.setItem('resumeFileName', file.name);
        localStorage.setItem('resumeUploadDate', currentDate)

        // Set the state values
        setFileName(file.name);
        setUploadDate(currentDate);


        // ✅ Resume uploaded, now update profile
        const uploadeddata = {
          name: file.name,
          url: res.data.data.Location,
          uploadedAt: new Date()
        };
        console.log('file uploaded on s3')

        await updateFileInProfile(uploadeddata, filename);


      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };


  const updateFileInProfile = async (dataObject, schemaFieldName) => {
    try {
      const token = localStorage.getItem('token');
      console.log('updateFileInProfile hitting')

      const res = await axios.patch(`${backendUrl}/candidate/updatefiles`, {
        [schemaFieldName]: dataObject
      }, {
        headers: { 'x-auth': token }
      });

      if (res.data.status) {
        alert(`${schemaFieldName} updated successfully!`);

        // Dynamically update in local state too
        setProfileData(prev => ({
          ...prev,
          personalInfo: {
            ...(prev.personalInfo || {}),
            [schemaFieldName]: [
              ...(prev.personalInfo?.[schemaFieldName] || []),
              dataObject
            ]
          }
        }));

        window.location.reload();

      }
    } catch (err) {
      console.error(`${schemaFieldName} update failed:`, err);
    }
  };
  useEffect(() => {
    const savedFileName = localStorage.getItem('resumeFileName');
    const savedUploadDate = localStorage.getItem('resumeUploadDate');

    if (savedFileName) {
      setFileName(savedFileName);
    }

    if (savedUploadDate) {
      setUploadDate(savedUploadDate);
    }
  }, []);



  // कोर्स के आधार पर स्पेशलाइजेशन फेच करने का फंक्शन
  const fetchSpecializationsByCourse = async (courseId) => {
    if (!courseId) return;

    try {
      const response = await axios.get(`${backendUrl}/api/specializations/${courseId}`);

      if (response.data.status) {
        return response.data.data.specializations;
      } else {
        console.error("Failed to fetch specializations:", response.data.message);
        return [];
      }
    } catch (err) {
      console.error("Error fetching specializations:", err);
      return [];
    }
  };

  // जब भी कोर्स चुना जाए, तब स्पेशलाइजेशन फेच करें
  const handleCourseChange = async (e, index) => {
    const courseId = e.target.value;

    const updated = [...educations];
    updated[index].course = courseId;
    // स्पेशलाइजेशन रीसेट करें क्योंकि कोर्स बदल गया है
    updated[index].specialization = '';
    setEducations(updated);

    // स्पेशलाइजेशन फेच करें
    if (courseId) {
      const specializations = await fetchSpecializationsByCourse(courseId);

      // स्पेशलाइजेशन की सूची स्टेट में स्टोर करें
      setSpecializationsList(prevState => ({
        ...prevState,
        [index]: specializations
      }));
    }
  };

  // शिक्षा के आधार पर कोर्स फेच करने का फंक्शन
  const fetchCoursesByEducation = async (educationId) => {
    if (!educationId) return;

    try {
      const response = await axios.get(`${backendUrl}/api/courselist/${educationId}`);

      if (response.data.status) {
        return response.data.data.courses;
      } else {
        console.error("Failed to fetch courses:", response.data.message);
        return [];
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      return [];
    }
  };


  // जब भी शिक्षा चुनी जाए, तब कोर्स फेच करें
  const handleEducationChange = async (e, index) => {
    const educationId = e.target.value;

    const updated = [...educations];
    updated[index].education = educationId;
    updated[index].course = '';
    updated[index].specialization = '';
    setEducations(updated);

    const educationName = educationList.find(ed => ed._id === educationId)?.name;

    if (educationName === 'ITI') {
      const courseRes = await fetchCoursesByEducation(educationId);
      if (courseRes.length > 0) {
        const itiCourseId = courseRes[0]._id;

        // Set course ID in state
        updated[index].course = itiCourseId;
        setEducations([...updated]);

        // Fetch specialization for this course
        const specializations = await fetchSpecializationsByCourse(itiCourseId);
        setSpecializationsList(prev => ({
          ...prev,
          [index]: specializations
        }));
      }
    } else {
      // Normal flow for other education types
      const courses = await fetchCoursesByEducation(educationId);
      setCoursesList(prev => ({
        ...prev,
        [index]: courses
      }));
    }
  };

  useEffect(() => {
    if (educations.length > 0 && educationList.length > 0) {
      educations.forEach(async (edu, index) => {
        const educationName = educationList.find(q => q._id === edu.education)?.name;

        // ✅ If Graduation or other higher education, fetch course list
        if (educationName && !['Upto 5th', '6th - 9th Class', '10th', '12th', 'ITI'].includes(educationName)) {
          const courseRes = await fetchCoursesByEducation(edu.education);
          if (courseRes.length > 0) {
            setCoursesList(prev => ({
              ...prev,
              [index]: courseRes
            }));
          }

          // ✅ Then fetch specialization
          if (edu.course) {
            const specRes = await fetchSpecializationsByCourse(edu.course);
            if (specRes.length > 0) {
              setSpecializationsList(prev => ({
                ...prev,
                [index]: specRes
              }));
            }
          }
        }

        // ✅ If ITI, handle that case separately
        if (educationName === 'ITI') {
          const courseRes = await fetchCoursesByEducation(edu.education);
          if (courseRes.length > 0) {
            const itiCourseId = courseRes[0]._id;

            // Update selected course ID if not already present
            if (!edu.course) {
              const updated = [...educations];
              updated[index].course = itiCourseId;
              setEducations(updated);
            }

            setCoursesList(prev => ({
              ...prev,
              [index]: courseRes
            }));

            const specRes = await fetchSpecializationsByCourse(itiCourseId);
            if (specRes.length > 0) {
              setSpecializationsList(prev => ({
                ...prev,
                [index]: specRes
              }));
            }
          }
        }
      });
    }
  }, [educations, educationList]);



  // For creating editable content
  const createEditable = (content, placeholder, onChange, id = '') => (
    <div
      id={id}
      contentEditable
      data-placeholder={placeholder}
      suppressContentEditableWarning={true}
      onBlur={(e) => {
        const updatedValue = e.target.innerText.trim();
        if (onChange) onChange(updatedValue);
      }}
    >
      {content}
    </div>
  );
  useEffect(() => {
    console.log("✅ Is Declaration Checked:", declaration.isChecked);
  }, [declaration.isChecked]);

  // Calculate profile strength
  useEffect(() => {
    calculateProfileStrength();
  }, [user, experiences, educations, skills, languages, projects, interests]);

  // Initialize Company Name Autocomplete
  const initializeCompanyAutocomplete = (index) => {
    setTimeout(() => {
      const companyInput = document.getElementById(`company-name-${index}`);
      if (!companyInput || !window.google || !window.google.maps || !window.google.maps.places) {
        return; // Not ready yet
      }

      try {
        // Create the autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(companyInput, {
          types: ['establishment'], // This ensures we only get businesses/establishments
          componentRestrictions: { country: 'in' }
        });

        // Add styling to ensure visibility
        companyInput.style.backgroundColor = "#ffffff";
        companyInput.style.color = "#000000";

        // When a place is selected
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place) {
            return;
          }

          // Get just the company name
          const companyName = place.name || '';

          // Update the experiences state
          const updatedExperiences = [...experiences];
          updatedExperiences[index].companyName = companyName;
          setExperiences(updatedExperiences);
        });

        console.log(`Company autocomplete initialized for index ${index}`);
      } catch (error) {
        console.error("Error initializing company autocomplete:", error);
      }
    }, 100);
  };

  // Initialize company name autocomplete when experiences change
  useEffect(() => {
    if (window.googleMapsLoaded) {
      experiences.forEach((_, index) => {
        initializeCompanyAutocomplete(index);
      });
    }
  }, [experiences.length]);

  useEffect(() => {
    if (window.googleMapsLoaded) {
      certificates.forEach((_, index) => {
        initializeCertificationOrgAutocomplete(index);
      });
    }
  }, [certificates.length]);

  // सामान्य ऑटोकम्पलीट इनिशियलाइज़ फंक्शन
  const initializeAutocomplete = (inputId, stateUpdater, index, propertyName) => {
    setTimeout(() => {
      const inputElement = document.getElementById(inputId);
      console.log(`Trying to initialize autocomplete for ${inputId}`);

      if (!inputElement || !window.google || !window.google.maps || !window.google.maps.places) {
        console.log(`Input element ${inputId} not found or Google Maps not loaded`);
        return;
      }

      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
          types: ['establishment'],
          componentRestrictions: { country: 'in' }
        });

        inputElement.style.backgroundColor = "#ffffff";
        inputElement.style.color = "#000000";

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!isValidPlace(place)) return;

          const coordinates = getCoordinates(place);
          const addressData = parseAddressComponents(place);

          // Set name and location
          stateUpdater(prev => {
            const updated = [...prev];
            updated[index][propertyName] = place.name || '';

            const locationKey = propertyName === 'schoolName' ? 'schoolLocation' :
              propertyName === 'collegeName' ? 'collegeLocation' :
                propertyName === 'universityName' ? 'universityLocation' : null;

            if (locationKey) {
              updated[index][locationKey] = {
                type: 'Point',
                coordinates: coordinates, // Already in [lng, lat] format
                city: addressData.city,
                state: addressData.state,
                fullAddress: addressData.fullAddress
              };
            }

            return updated;
          });

          // Debug logging
          console.log(`Autocomplete for ${inputId}:`, {
            place: place.name,
            coordinates,
            addressData
          });
        });

        console.log(`Autocomplete initialized for ${inputId}`);
      } catch (error) {
        console.error(`Error initializing autocomplete for ${inputId}:`, error);
      }
    }, 300);
  };




  // Initialize company name autocomplete when experiences change
  // useEffect में आप निम्न प्रकार से इसे कॉल कर सकते हैं
  useEffect(() => {
    if (window.googleMapsLoaded) {
      educations.forEach((edu, index) => {
        const educationName = educationList.find(q => q._id === edu.education)?.name || '';

        // Check education type and initialize appropriate fields
        if (educationName === '10th' || educationName === '12th') {
          // School name autocomplete
          initializeAutocomplete(`school-name-${index}`, setEducations, index, 'schoolName');
        }
        else if (educationName === 'ITI') {
          // ITI name autocomplete
          initializeAutocomplete(`iti-name-${index}`, setEducations, index, 'collegeName');
        }
        else if (educationName && educationName !== 'Upto 5th' && educationName !== '6th - 9th Class') {
          // University autocomplete
          initializeAutocomplete(`university-name-${index}`, setEducations, index, 'universityName');
          // College name autocomplete
          initializeAutocomplete(`college-name-${index}`, setEducations, index, 'collegeName');
        }
      });
    }
  }, [educations.map(edu => edu.education).join(','), window.googleMapsLoaded, educationList]);
  // Add this useEffect to set up the company autocomplete whenever experiences change
  // Load Google Maps API only once
  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      // If not loaded, load the script
      if (!document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error("Missing Google Maps API key!");
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          // Set a flag to indicate Google Maps is loaded
          window.googleMapsLoaded = true;
          // Trigger a state update to force re-render and initialize autocompletes
          setProfileData(prev => ({ ...prev }));
        };
        document.head.appendChild(script);
      }
    } else {
      window.googleMapsLoaded = true;
    }
  }, []); // Empty dependency array - run once on mount



  // Initialize address autocomplete separately
  useEffect(() => {
    if (window.googleMapsLoaded) {
      initializeAddressAutocomplete();
      initializePermanentAddressAutocomplete();
    }
  }, [window.googleMapsLoaded]); // This will run whenever Google Maps becomes available 

  // Only re-run when the number of experiences changes

  const handleBoardInputChange = async (value, index) => {
    const updated = [...educations];
    updated[index].boardName = value; // temporary label
    updated[index].board = ''; // reset ID
    setEducations(updated);

    if (value.length >= 2) {
      try {
        const res = await axios.get(`${backendUrl}/api/boards?search=${value}`);
        console.log('res', res.data)
        setBoardSuggestions(res.data); // response should be [{ _id, name }]
        setSuggestionIndex(index);
      } catch (err) {
        console.error("Board fetch error:", err);
        setBoardSuggestions([]);
      }
    } else {
      setBoardSuggestions([]);
    }
  };


  // certificat organization


  const initializeCertificationOrgAutocomplete = (index) => {
    console.log("Initializing address autocomplete...");
    const input = document.getElementById(`issuing-organization-${index}`);

    if (!input) {
      console.warn('Input element with ID "issuing-organization-{index}" not found. Retrying...');
      setTimeout(() => initializeCertificationOrgAutocomplete(index), 100);
      return;
    }

    try {
      console.log("Setting up autocomplete for input:", input);

      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['establishment'],
        componentRestrictions: { country: 'in' }
      });

      input.style.backgroundColor = "#ffffff";
      input.style.color = "#000000";

      autocomplete.addListener('place_changed', () => {
        console.log("Place changed event fired");
        const place = autocomplete.getPlace();

        if (!isValidPlace(place)) {
          console.warn('Invalid place data selected.');
          return;
        }

        const coordinates = getCoordinates(place);
        const addressData = parseAddressComponents(place);

        console.log("Extracted data:", { 
          fullAddress: addressData.fullAddress, 
          city: addressData.city, 
          state: addressData.state, 
          pincode: addressData.pincode, 
          coordinates 
        });

        // 👇 Set directly into certificates[index]
        setCertificates(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            orgName: place.name || '', // ✅ Set orgName
            orgLocation: {
              type: 'Point',
              coordinates: coordinates, // Already in [lng, lat] format
              city: addressData.city,
              state: addressData.state,
              fullAddress: addressData.fullAddress
            }
          };
          return updated;
        });

        // 👇 Update input value too (optional visual update)
        input.value = place.name || '';
      });

      console.log("Google Maps Places Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
    }
  };


  // Address location autocomplete
  const initializeAddressAutocomplete = () => {
    console.log("Initializing address autocomplete...");
    const input = document.getElementById('address-location');

    if (!input) {
      console.warn('Input element with ID "address-location" not found. Retrying...');
      setTimeout(initializeAddressAutocomplete, 100);
      return;
    }

    try {
      console.log("Setting up autocomplete for input:", input);

      // Create the autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['geocode'],
        componentRestrictions: { country: 'in' }
      });

      // Add styling to make sure the autocomplete dropdown is visible
      input.style.backgroundColor = "#ffffff";
      input.style.color = "#000000";


      // Add change event listener
      autocomplete.addListener('place_changed', () => {
        console.log("Place changed event fired");
        const place = autocomplete.getPlace();

        if (!isValidPlace(place)) {
          console.warn('Invalid place data selected.');
          return;
        }

        console.log("Selected place:", place);

        const coordinates = getCoordinates(place);
        const addressData = parseAddressComponents(place);

        console.log("Extracted data:", { 
          fullAddress: addressData.fullAddress, 
          city: addressData.city, 
          state: addressData.state, 
          pincode: addressData.pincode, 
          coordinates 
        });

        setProfileData(prev => ({
          ...prev,
          personalInfo: {
            ...(prev.personalInfo || {}),
            currentAddress: {
              fullAddress: addressData.fullAddress,
              state: addressData.state,
              city: addressData.city,
              pincode: addressData.pincode,
              latitude: coordinates[1], // latitude
              longitude: coordinates[0] // longitude
            }
          }
        }));
      });

      console.log("Google Maps Places Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
    }
  };
  const initializePermanentAddressAutocomplete = () => {
    console.log("Initializing address autocomplete...");
    const input = document.getElementById('permanent-address');

    if (!input) {
      console.warn('Input element with ID "address-location" not found. Retrying...');
      setTimeout(initializePermanentAddressAutocomplete, 100);
      return;
    }

    try {
      console.log("Setting up autocomplete for input:", input);

      // Create the autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['geocode'],
        componentRestrictions: { country: 'in' }
      });

      // Add styling to make sure the autocomplete dropdown is visible
      input.style.backgroundColor = "#ffffff";
      input.style.color = "#000000";


      // Add change event listener
      autocomplete.addListener('place_changed', () => {
        console.log("Place changed event fired");
        const place = autocomplete.getPlace();

        if (!isValidPlace(place)) {
          console.warn('Invalid place data selected.');
          return;
        }

        console.log("Selected place:", place);

        const coordinates = getCoordinates(place);
        const addressData = parseAddressComponents(place);

        console.log("Extracted data:", { 
          fullAddress: addressData.fullAddress, 
          city: addressData.city, 
          state: addressData.state, 
          pincode: addressData.pincode, 
          coordinates 
        });

        setProfileData(prev => ({
          ...prev,
          personalInfo: {
            ...(prev.personalInfo || {}),
            permanentAddress: {
              fullAddress: addressData.fullAddress,
              state: addressData.state,
              city: addressData.city,
              pincode: addressData.pincode,
              latitude: coordinates[1], // latitude
              longitude: coordinates[0] // longitude
            }
          }
        }));
      });

      console.log("Google Maps Places Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
    }
  };

  const calculateProfileStrength = () => {
    let strength = 0;

    // Check basic info
    if (user?.name) strength += 10;

    // Check sections
    if (experiences.some(exp => exp.jobTitle || exp.companyName)) strength += 15;
    if (educations.some(edu => edu.degree || edu.universityName)) strength += 15;
    if (skills.some(skill => skill.skillName)) strength += 15;
    if (languages.some(lang => lang.lname)) strength += 10;
    if (projects.some(proj => proj.projectName)) strength += 10;
    if (interests.some(interest => interest)) strength += 10;
    if (certificates.some(cert => cert.certificateName)) strength += 10;
    if (declaration) strength += 5;

    setProfileStrength(Math.min(strength, 100));
  };

  // Recording functions
  const updateTimer = () => {
    secondsRef.current++;
    if (secondsRef.current >= 60) {
      secondsRef.current = 0;
      minutesRef.current++;
    }

    setTimer(
      `${minutesRef.current.toString().padStart(2, '0')}:${secondsRef.current.toString().padStart(2, '0')}`
    );
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    secondsRef.current = 0;
    minutesRef.current = 0;
    setTimer('00:00');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const timestamp = new Date().toLocaleString();

        setRecordings(prevRecordings => [
          {
            id: Date.now(),
            url: audioUrl,
            timestamp,
            name: `Recording ${prevRecordings.length + 1}`
          },
          ...prevRecordings
        ]);

        setRecordingStatus('Recording saved successfully!');
        // ✅ Define audioFile from blob
        const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, {
          type: 'audio/wav'
        });

        resetTimer();
        await uploadCV(audioFile, 'voiceIntro');

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus('Recording in progress...');

      resetTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setRecordingStatus('Error accessing microphone. Please allow permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus('Recording stopped...');
    }
  };

  const deleteRecording = (id) => {
    setRecordings(prevRecordings => prevRecordings.filter(recording => recording.id !== id));
  };

  // Save resume function
  const handleSaveCV = async () => {
    try {
      let certificatesValid = true;
      certificates.forEach(cert => {
        if ((cert.month || cert.year || cert.currentlypursuing) &&
          (!cert.certificateName || !cert.orgName)) {
          certificatesValid = false;
        }
      });

      if (!certificatesValid) {
        alert("Please complete all required certificate fields (name and organization) for certificates with dates or marked as 'Currently Pursuing'");
        return;
      }
      if (!declaration?.isChecked) {
        alert("Please accept the declaration before saving your resume.");
        return;
      }
      const token = localStorage.getItem('token');
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      const monthNames = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December"
      };
      // Format the data to match what your API expects
      const cvPayload = {
        name: profileData.name || '',
        email: profileData?.email || '',
        mobile: profileData?.mobile || '',
        sex: profileData?.sex || '',
        dob: profileData?.dob || '',
        whatsapp: profileData?.whatsapp || '',
        personalInfo: {
          professionalTitle: profileData?.personalInfo?.professionalTitle || '',
          professionalSummary: profileData?.personalInfo?.professionalSummary || '',
          currentAddress: profileData?.personalInfo?.currentAddress || {},
          permanentAddress: profileData?.personalInfo?.permanentAddress || {},
          image: userData.image || user.image || '',
          resume: userData.resume || user.resume || '',
          voiceIntro: recordings.map(rec => ({
            name: rec.name,
            url: rec.url,
            timestamp: rec.timestamp,
            status: true
          })),
          skills: skills.map(s => ({
            skillName: s.skillName || '',
            skillPercent: s.skillPercent || 0
          })),
          certifications: certificates.map(c => ({
            certificateName: c.certificateName || '',
            orgName: c.orgName || '',
            month: c.month ? monthNames[c.month] || c.month : '',
            year: c.year || '',
            orgLocation: c.orgLocation || {
              type: 'Point',
              coordinates: [0, 0],
              city: '',
              state: '',
              fullAddress: ''
            }
          })),
          languages: languages.map(l => ({
            name: l.name || '',
            level: l.level || 0
          })),
          projects: projects.map(p => ({
            projectName: p.projectName || '',
            proyear: p.proyear || '',
            proDescription: p.proDescription || ''
          })),
          interest: interests.filter(i => i.trim() !== ''),
          declaration: declaration
        },

        experiences: experiences.map(e => ({
          jobTitle: e.jobTitle || '',
          companyName: e.companyName || '',
          from: e.from ? new Date(e.from) : null,
          to: e.to ? new Date(e.to) : null,
          jobDescription: e.jobDescription || '',
          currentlyWorking: e.currentlyWorking || false,
          location: e.location || {
            type: 'Point',
            coordinates: [0, 0],
            city: '',
            state: '',
            fullAddress: ''
          }
        }))
        ,
        isExperienced: profileData.isExperienced,
        qualifications: educations.map(edu => ({
          education: edu.education,
          boardName: edu.boardName,
          schoolName: edu.schoolName,
          collegeName: edu.collegeName,
          universityName: edu.universityName,
          passingYear: edu.passingYear,
          marks: edu.marks,
          course: edu.course,
          specialization: edu.specialization,

          universityLocation: edu.universityLocation || {
            type: 'Point',
            coordinates: [0, 0],
            city: '',
            state: '',
            fullAddress: ''
          },

          collegeLocation: edu.collegeLocation || {
            type: 'Point',
            coordinates: [0, 0],
            city: '',
            state: '',
            fullAddress: ''
          },

          schoolLocation: edu.schoolLocation || {
            type: 'Point',
            coordinates: [0, 0],
            city: '',
            state: '',
            fullAddress: ''
          }
        }))
      };

      console.log("📤 CV Payload being sent to backend:", cvPayload);

      const res = await axios.post(`${backendUrl}/candidate/saveProfile`, cvPayload, {
        headers: {
          'x-auth': token
        }
      });

      if (res.data.status) {
        alert('CV Saved Successfully!');
        // window.location.reload();

      } else {
        alert('Failed to save CV!');
      }
    } catch (err) {
      console.error("Error saving CV:", err);
      alert("An error occurred while saving your CV");
    }
  };


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log("No authentication token found");
          return;
        }

        const response = await axios.get(`${backendUrl}/candidate/getProfile`, {
          headers: {
            'x-auth': token
          }
        });

        if (response.data.status) {
          console.log("Profile data fetched:", response.data.data);
          const data = response.data.data;
          console.log("Candidate Profile Data: ", data);
          // Set education options - sort by class level (ascending order: 1-5, 6-9, 10, 12, then higher)
          const getClassLevel = (name) => {
            const nameLower = (name || '').toLowerCase();
            // Extract numeric class from name
            const upto5Match = nameLower.match(/upto?\s*5/i);
            if (upto5Match) return 1; // Upto 5th class
            
            const class69Match = nameLower.match(/6th?\s*[-–]\s*9th/i);
            if (class69Match) return 2; // 6th - 9th class
            
            const class10Match = nameLower.match(/10th?/i);
            if (class10Match) return 3; // 10th class
            
            const class12Match = nameLower.match(/12th?/i);
            if (class12Match) return 4; // 12th class
            
            // Higher education (Diploma, UG, PG, etc.)
            if (nameLower.includes('diploma')) return 5;
            if (nameLower.includes('undergraduate') || nameLower.includes('ug')) return 6;
            if (nameLower.includes('postgraduate') || nameLower.includes('pg')) return 7;
            
            // Default for other education levels
            return 99;
          };
          
          const sortedEducations = (data.educations || []).sort((a, b) => {
            const levelA = getClassLevel(a.name);
            const levelB = getClassLevel(b.name);
            if (levelA !== levelB) {
              return levelA - levelB; // Sort by class level
            }
            // If same level, sort alphabetically
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setEducationList(sortedEducations);

          // Set candidate data
          const candidate = data.candidate;
          if (candidate) {
            setProfileData(candidate);
            // Map backend data to frontend state
            setUser({
              name: candidate.name,
              image: candidate.personalInfo?.image
            });

            // Set experiences
            if (Array.isArray(candidate.experiences) && candidate.experiences.length > 0) {
              setExperiences(candidate.experiences);
            }

            // Set qualifications/education
            if (Array.isArray(candidate.qualifications) && candidate.qualifications.length > 0) {
              setEducations(candidate.qualifications);
            }

            // Set skills
            if (Array.isArray(candidate.personalInfo?.skills) && candidate.personalInfo.skills.length > 0) {
              setSkills(candidate.personalInfo.skills);

              //Set Resume
            } if (Array.isArray(candidate.personalInfo?.resume) && candidate.personalInfo.resume.length > 0) {
              setResume(candidate.personalInfo.resume);
            }

            // Set certificates
            if (Array.isArray(candidate.personalInfo?.certifications) && candidate.personalInfo.certifications.length > 0) {
              setCertificates(candidate.personalInfo.certifications);
            }


            // Set languages
            if (Array.isArray(candidate.personalInfo?.languages) && candidate.personalInfo.languages.length > 0) {
              setLanguages(candidate.personalInfo.languages);
            }


            // Set projects
            if (Array.isArray(candidate.personalInfo?.projects) && candidate.personalInfo.projects.length > 0) {
              setProjects(candidate.personalInfo.projects);
            }


            // Set interests
            if (Array.isArray(candidate.personalInfo?.interest) && candidate.personalInfo.interest.length > 0) {
              setInterests(candidate.personalInfo.interest);
            }


            // Set declaration
            if (candidate.personalInfo?.declaration) {
              setDeclaration(candidate.personalInfo.declaration);
            }


            // Set voice recordings
            if (Array.isArray(candidate.personalInfo?.voiceIntro) && candidate.personalInfo.voiceIntro.length > 0) {
              setRecordings(candidate.personalInfo.voiceIntro.map(voice => ({
                id: voice._id || Date.now(),
                url: voice.url,
                name: voice.name,
                timestamp: voice.timestamp,
                status: voice.status
              })));
              setVoiceIntroduction(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [backendUrl]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop any active audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clear any active timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);



  return (
    <div className="resume-builder-container">
      <div className='d-flex align-items-center mb-3 mediawidth'>
        <button
          className="audio-intro-btn"
          onClick={() => {
            setShowRecordingModal(true);
            setShowIntroOptions(false);
          }}
        >
          <i className="bi bi-mic-fill"></i>
          <span>Introduce Yourself to Build Your Resume</span>
        </button>
        <label className="upload-resume">
          <i className="bi bi-upload me-2"></i> Upload Resume
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadCV(file, 'resume');
                e.target.value = null; // Direct upload on file selection
              }
            }}
          />
        </label>
      </div>

      <div className="resume-builder-header mb-4">
        <h2 className="resume-builder-title">Professional Resume Builder</h2>

        {/* Profile Strength Meter */}
        <div className="profile-strength-meter">
          <div className="strength-header">
            <div className="d-flex align-items-center">
              <span className="strength-label">Profile Strength</span>
              <div className="strength-badge ms-2">{profileStrength}%</div>
            </div>
            <div className="strength-level">
              {profileStrength < 30 ? 'Needs Improvement' :
                profileStrength < 60 ? 'Satisfactory' :
                  profileStrength < 85 ? 'Good' : 'Excellent'}
            </div>
          </div>
          <div className="progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${profileStrength}%`,
                backgroundColor: profileStrength < 30 ? '#dc3545' :
                  profileStrength < 60 ? '#ffc107' :
                    profileStrength < 85 ? '#6f42c1' : '#28a745'
              }}
              aria-valuenow={profileStrength}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="resume-content">
        {/* Personal Info Section */}
        <div className={`resume-section ${activeSection === 'personal' ? 'active' : ''}`}>
          <div className="resume-paper">
            <div className="resume-header">
              <div className="profile-image-container">
                <div className="profile-image">
                  {profileData?.personalInfo?.image ? (
                    <img src={profileData.personalInfo.image} alt="Profile" />
                  ) : (
                    <div className="profile-placeholder">
                      <i className="bi bi-person"></i>
                    </div>
                  )}

                  {/* Wrap the entire overlay in <label> */}
                  <label className="image-upload-overlay" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-camera"></i>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadCV(file, 'image');
                          e.target.value = null;
                        }
                      }}
                    />
                  </label>
                </div>

              </div>

              <div className="profile-info">
                <div className="profile-name">
                  {createEditable(profileData?.name || '', 'Your Name', (val) => {
                    setUser(prev => ({
                      ...prev,
                      name: val
                    }));
                    setProfileData(prev => ({
                      ...prev,
                      name: val
                    }));
                  })}

                </div>
                <div className="profile-title">
                  {createEditable(profileData?.personalInfo?.professionalTitle || '', 'Professional Title', (val) => {
                    setProfileData(prev => ({
                      ...prev,
                      personalInfo: {
                        ...(prev.personalInfo || {}),
                        professionalTitle: val
                      }
                    }));
                  })}
                </div>
                <div className="profile-summary">
                  {createEditable(profileData?.personalInfo?.professionalSummary || '', 'Write a brief professional summary here...', (val) => {
                    setProfileData(prev => ({
                      ...prev,
                      personalInfo: {
                        ...(prev.personalInfo || {}),
                        professionalSummary: val
                      }
                    }));
                  })}
                </div>
                <div className="profile-summary">
                  {/* {createEditable(profileData?.personalInfo?.professionalSummary || '', 'Father name', (val) => {
                    setProfileData(prev => ({
                      ...prev,
                      personalInfo: {
                        ...(prev.personalInfo || {}),
                        professionalSummary: val
                      }
                    }));
                  })} */}
                  <label className="form-label fw-bold">Father Name: {profileData?.fatherName || 'N/A'}</label>
                  <div>{profileData?.personalInfo?.professionalSummary || 'N/A'}</div>
                </div>

                <div className="contact-info mb-3">
                  <div className="contact-item">
                    <i className="bi bi-telephone"></i>
                    {/* {createEditable(profileData?.mobile || '', 'Phone Number', (val) => {
                      setProfileData(prev => ({
                        ...prev,
                        mobile: val
                      }));
                    })} */}
                    <span><strong>Phone Number:</strong> {profileData?.mobile || 'N/A'}</span>

                    {/* <button
                      type="button"
                      className="border-0 bg-transparent"
                      onClick={openPhoneModal}
                    >
                      <i
                        className="bi bi-pencil ms-2 text-primary"
                        style={{ cursor: 'pointer', color: '#fc2b5a' }}
                        title="Edit"
                      ></i>
                    </button> */}

                  </div>
                  <div className="contact-item">
                    <i className="bi bi-envelope"></i>
                    {/* {createEditable(profileData?.email || '', 'Email Address', (val) => {
                      setProfileData(prev => ({
                        ...prev,
                        email: val
                      }));
                    })} */}
                    <label className="form-label fw-bold m-0">Email Address:</label>
                    <div>{profileData?.email || 'N/A'}</div>
                  </div>

                  {/* New Row for Gender and DOB */}
                  <div className="contact-item">
                    <i className={`bi ${profileData?.sex === 'Female' ? 'bi-gender-female' :
                      profileData?.sex === 'Other' ? 'bi-gender-trans' :
                        profileData?.sex === 'Male' ? 'bi-gender-male' :
                          'bi-person'
                      }`}></i>

                    <select
                      className="form-select form-select-sm d-inline-block w-auto ms-2"
                      value={profileData?.sex || ''}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, sex: e.target.value }))
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="contact-item">
                    <i className="bi bi-calendar-event"></i>
                    <input style={{ height: "30px" }}
                      type="date"
                      className="form-control"
                      value={profileData?.dob ? profileData?.dob.slice(0, 10) : ''}  // to remove time part
                      onChange={(e) => {
                        const val = e.target.value;
                        setUser(prev => ({ ...prev, dob: val }));
                        setProfileData(prev => ({ ...prev, dob: val }));
                      }}
                    />
                  </div>

                </div>
                <div className="contact-item">
                  <i className="bi bi-geo-alt"></i>
                  <input
                    type="text"
                    id="address-location"
                    className="form-control"
                    placeholder="Location"
                    value={profileData?.personalInfo?.currentAddress?.fullAddress || ''}
                    onChange={(e) => {
                      setProfileData(prev => ({
                        ...prev,
                        personalInfo: {
                          ...(prev.personalInfo || {}),
                          currentAddress: {
                            ...(prev.personalInfo?.currentAddress || {}),
                            fullAddress: e.target.value
                          }
                        }
                      }));
                    }}
                  />
                </div>
                {/* Current Address */}


                {/* Same as current address checkbox */}
                <div className="form-check ms-3 mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="same-address-check"
                    checked={profileData.personalInfo?.permanentAddress?.sameCurrentAddress || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      const current = profileData?.personalInfo?.currentAddress || {};

                      setProfileData(prev => ({
                        ...prev,
                        personalInfo: {
                          ...(prev.personalInfo || {}),
                          permanentAddress: isChecked
                            ? {
                              ...current,
                              sameCurrentAddress: true
                            }
                            : {
                              sameCurrentAddress: false,
                              type: "Point",
                              coordinates: [0, 0],
                              latitude: '',
                              longitude: '',
                              city: '',
                              state: '',
                              fullAddress: ''
                            }
                        }
                      }));
                    }}

                  />
                  <label className="form-check-label" htmlFor="same-address-check">
                    Same as current address
                  </label>
                </div>

                {/* Permanent Address */}
                <div className="contact-item">
                  <i className="bi bi-house-fill"></i>
                  <input
                    type="text"
                    id="permanent-address"
                    className="form-control"
                    placeholder="Permanent Address"
                    value={profileData?.personalInfo?.permanentAddress.fullAddress || ''}
                    onChange={(e) => {
                      setProfileData(prev => ({
                        ...prev,
                        personalInfo: {
                          ...(prev.personalInfo || {}),
                          permanentAddress: {
                            ...(prev.personalInfo?.permanentAddress || {}),
                            fullAddress: e.target.value
                          }
                        }
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className={`resume-section ${activeSection === 'experience' ? 'active' : ''}`}>
          <div className="resume-paper">
            <div className="section-title">
              <i className="bi bi-briefcase me-2"></i>
              Work Experience
            </div>

            {/* Experience Type Dropdown */}
            <div className="form-group mb-4 experienceLevel">
              <label className="form-label">Experience Level:</label>
              <select
                className="form-select experience-dropdown"
                style={{ width: "auto" }}
                value={profileData.isExperienced ? "Experienced" : "Fresher"}
                onChange={(e) => {
                  const isExperienced = e.target.value === "Experienced";
                  setProfileData(prev => ({
                    ...prev,
                    isExperienced
                  }));

                  // Optional logic to reset or manage experiences based on the switch
                  if (!isExperienced) {
                    setExperiences([{
                      jobTitle: 'Fresher',
                      companyName: '',
                      from: '',
                      to: '',
                      jobDescription: '',
                      currentlyWorking: false
                    }]);
                  } else {
                    setExperiences([{
                      jobTitle: '',
                      companyName: '',
                      from: '',
                      to: '',
                      jobDescription: '',
                      currentlyWorking: false
                    }]);
                  }
                }}
              >
                <option value="Fresher">Fresher</option>
                <option value="Experienced">Experienced</option>
              </select>
            </div>


            {/* Conditional rendering based on selection */}
            {!profileData.isExperienced ? (
              // Fresher input field
              // <div className="fresher-experience">
              //   <div className="form-group mb-3 d-flex gap-5 align-items-center" style={{ display: 'flex', alignItems: 'center' }}>
              //     <label className="form-label">Experience Status:</label>
              //     <input
              //       type="text"
              //       className="form-control"
              //       value="Fresher"
              //       readOnly
              //     />
              //   </div>
              // </div>
              <></>
            ) : (
              // Experienced UI (existing functionality)
              <>
                {/* Map through the experiences array */}
                {experiences.map((experience, index) => (
                  <div className="experience-item" key={`experience-${index}`}>
                    <div className="item-controls">
                      {experiences.length > 1 && (
                        <button
                          className="remove-button"
                          onClick={() => {
                            const updated = [...experiences];
                            updated.splice(index, 1);
                            setExperiences(updated);
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>

                    <div className="job-title">
                      {createEditable(experience.jobTitle || '', 'Job Title', (val) => {
                        const updatedExperiences = [...experiences];
                        updatedExperiences[index].jobTitle = val;
                        setExperiences(updatedExperiences);
                      })}
                    </div>

                    <div className="company-name">
                      <input
                        id={`company-name-${index}`}
                        type="text"
                        className="form-control"
                        placeholder="Company Name"
                        value={experience.companyName || ''}
                        onChange={(e) => {
                          const updatedExperiences = [...experiences];
                          updatedExperiences[index].companyName = e.target.value;
                          setExperiences(updatedExperiences);
                        }}
                      />
                    </div>

                    <div className="date-range">
                      <span className="date-label">From:</span>
                      <input
                        type="date"
                        value={experience.from ? new Date(experience.from).toISOString().slice(0, 10) : ''}

                        onChange={(e) => {
                          const updatedExperiences = [...experiences];
                          updatedExperiences[index].from = new Date(e.target.value); // <-- String नहीं, Date बनाकर दो
                          setExperiences(updatedExperiences);
                          console.log('experiences', experiences)
                        }}

                        className="date-input"
                      />

                      <span className="date-label">To:</span>
                      {!experience.currentlyWorking ? (
                        <input
                          type="date"
                          value={experience.to ? new Date(experience.to).toISOString().slice(0, 10) : ''}

                          onChange={(e) => {
                            const updatedExperiences = [...experiences];
                            updatedExperiences[index].to = new Date(e.target.value); // <-- String नहीं, Date बनाकर दो
                            setExperiences(updatedExperiences);
                          }}

                          className="date-input"
                          disabled={experience.currentlyWorking}
                        />
                      ) : (
                        <span className="current-job-badge">Present</span>
                      )}

                      <div className="form-check ms-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`currently-working-${index}`}
                          checked={experience.currentlyWorking || false}
                          onChange={(e) => {
                            const updatedExperiences = [...experiences];
                            updatedExperiences[index].currentlyWorking = e.target.checked;
                            if (e.target.checked) {
                              updatedExperiences[index].to = '';
                            }
                            setExperiences(updatedExperiences);
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`currently-working-${index}`}
                          onClick={(e) => {
                            e.preventDefault(); // Prevent default label behavior
                            const updatedExperiences = [...experiences];
                            updatedExperiences[index].currentlyWorking = !updatedExperiences[index].currentlyWorking;
                            if (updatedExperiences[index].currentlyWorking) {
                              updatedExperiences[index].to = '';
                            }
                            setExperiences(updatedExperiences);
                          }}
                        >
                          I currently work here
                        </label>
                      </div>

                    </div>

                    <div className="job-description">
                      {createEditable(experience.jobDescription || '', 'Job Description', (val) => {
                        const updatedExperiences = [...experiences];
                        updatedExperiences[index].jobDescription = val;
                        setExperiences(updatedExperiences);
                      })}
                    </div>
                  </div>
                ))}
                <button
                  className="add-button"
                  onClick={() => {
                    // Add a new empty experience object
                    setExperiences([...experiences, {
                      jobTitle: '',
                      companyName: '',
                      from: '',
                      to: '',
                      jobDescription: ''
                    }]);
                  }}
                >
                  <i className="bi bi-plus"></i> Add Experience
                </button>
              </>
            )}
          </div>
        </div>

        {/* Education Section */}
        <div className={`resume-section ${activeSection === 'education' ? 'active' : ''}`}>
          <div className="resume-paper">
            <div className="section-title">
              <i className="bi bi-book me-2"></i>
              Select Education
            </div>

            {educations.map((edu, index) => (
              <div className="education-item" key={`education-${index}`}>
                <div className="item-controls">
                  {educations.length > 1 && (
                    <button
                      className="remove-button"
                      onClick={() => {
                        const updated = [...educations];
                        updated.splice(index, 1);
                        setEducations(updated);
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>

                {/* Select Education Level */}
                <div className="form-group mb-2">
                  <label>Education</label>
                  <select
                    className="form-select"
                    value={edu.education || ''}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[index].education = e.target.value;
                      setEducations(updated);
                      handleEducationChange(e, index)
                    }}
                  >
                    <option value="">Select</option>
                    {educationList.map((e, idx) => (
                      <option key={idx} value={e._id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                {/* Check education type and render appropriate fields */}
                {(() => {
                  // Get education name based on selected ID
                  const educationName = educationList.find(q => q._id === edu.education)?.name || '';

                  // Case 1: Upto 5th or 6th - 9th Class
                  if (['Upto 5th', '6th - 9th Class'].includes(educationName)) {
                    return <></>;
                  }

                  // Case 2: 10th Class
                  else if (educationName === '10th') {
                    return (
                      <>
                        <div className="form-group mb-2 board-autocomplete-wrapper">
                          <label>Board</label>
                          <input
                            type="text"
                            className="form-control"
                            value={edu.boardName || ''}
                            onChange={(e) => handleBoardInputChange(e.target.value, index)}
                          />
                          {suggestionIndex === index && boardSuggestions.length > 0 && (
                            <ul className="suggestion-list board-suggestion-list">
                              {boardSuggestions.map((b) => (
                                <li
                                  key={b._id}
                                  className='board-suggestion-item'
                                  onClick={() => {
                                    const updated = [...educations];
                                    updated[index].board = b._id;
                                    updated[index].boardName = b.name;
                                    setEducations(updated);
                                    setBoardSuggestions([]);
                                    setSuggestionIndex(null);
                                  }}
                                >
                                  {b.name} ({b.type})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="form-group mb-2">
                          <label>School Name</label>
                          <input
                            type="text"
                            id={`school-name-${index}`}
                            className="form-control"
                            value={edu.schoolName || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].schoolName = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>

                        {/* Currently Pursuing Checkbox */}
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`currently-pursuing-${index}`}
                            checked={edu.currentlyPursuing || false}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].currentlyPursuing = e.target.checked;
                              if (e.target.checked) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`currently-pursuing-${index}`}
                            onClick={(e) => {
                              e.preventDefault(); // Prevent default label behavior
                              const updated = [...educations];
                              updated[index].currentlyPursuing = !updated[index].currentlyPursuing;
                              if (updated[index].currentlyPursuing) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          >
                            Currently Pursuing
                          </label>
                        </div>

                        <div className="form-group mb-2">
                          <label>Passing Year</label>
                          {!edu.currentlyPursuing ? (
                            <input
                              type="text"
                              className="form-control"
                              value={edu.passingYear || ''}
                              onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                              }}
                            />
                          ) : (
                            <div className="form-control disabled">
                              Present
                            </div>
                          )}
                        </div>

                        <div className="form-group mb-2">
                          <label>Marks (%)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={edu.marks || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].marks = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                      </>
                    );
                  }

                  // Case 3: 12th Class
                  else if (educationName === '12th') {
                    return (
                      <>
                        <div className="form-group mb-2 board-autocomplete-wrapper">
                          <label>Board</label>
                          <input
                            type="text"
                            className="form-control"
                            value={edu.boardName || ''}
                            onChange={(e) => handleBoardInputChange(e.target.value, index)}
                          />
                          {suggestionIndex === index && boardSuggestions.length > 0 && (
                            <ul className="suggestion-list board-suggestion-list">
                              {boardSuggestions.map((b) => (
                                <li
                                  key={b._id}
                                  className='board-suggestion-item'
                                  onClick={() => {
                                    const updated = [...educations];
                                    updated[index].boardName = b.name;
                                    setEducations(updated);
                                    setBoardSuggestions([]);
                                    setSuggestionIndex(null);
                                  }}
                                >
                                  {b.name} ({b.type})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* For 12th Class */}
                        <div className="form-group mb-2">
                          <label>Specialization</label>
                          <select
                            className="form-select"
                            value={edu.specialization || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].specialization = e.target.value;
                              setEducations(updated);
                            }}
                          >
                            <option value="">Select Specialization</option>
                            <option value="Science (PCM)">Science (PCM)</option>
                            <option value="Science (PCB)">Science (PCB)</option>
                            <option value="Science (PCMB)">Science (PCMB)</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Commerce with Maths">Commerce with Maths</option>
                            <option value="Arts/Humanities">Arts/Humanities</option>
                            <option value="Vocational">Vocational</option>
                          </select>
                        </div>

                        <div className="form-group mb-2">
                          <label>School Name</label>
                          <input
                            type="text"
                            id={`school-name-${index}`}
                            className="form-control"
                            value={edu.schoolName || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].schoolName = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>

                        {/* Currently Pursuing Checkbox */}
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`currently-pursuing-${index}`}
                            checked={edu.currentlypursuing || false}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].currentlypursuing = e.target.checked;
                              if (e.target.checked) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`currently-pursuing-${index}`}
                            onClick={(e) => {
                              e.preventDefault(); // Prevent default label behavior
                              const updated = [...educations];
                              updated[index].currentlypursuing = !updated[index].currentlypursuing;
                              if (updated[index].currentlypursuing) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          >
                            Currently Pursuing
                          </label>
                        </div>

                        <div className="form-group mb-2">
                          <label>Passing Year</label>
                          {!edu.currentlyPursuing ? (
                            <input
                              type="text"
                              autoComplete="off"
                              className="form-control"
                              value={edu.passingYear || ''}
                              onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                              }}
                            />
                          ) : (
                            <div className="form-control disabled">
                              Present
                            </div>
                          )}
                        </div>

                        <div className="form-group mb-2">
                          <label>Marks (%)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={edu.marks || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].marks = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                      </>
                    );
                  }

                  // Case 4: ITI
                  else if (educationName === 'ITI') {
                    return (
                      <>
                        {specializationsList[index] && specializationsList[index].length > 0 && (
                          <div className="form-group mb-2">
                            <label>Specialization</label>
                            <select
                              className="form-select"
                              value={edu.specialization || ''}
                              onChange={(e) => {
                                const updated = [...educations];
                                updated[index].specialization = e.target.value;
                                setEducations(updated);
                              }}
                            >
                              <option value="">Select Specialization</option>
                              {specializationsList[index].map((spec) => (
                                <option key={spec._id} value={spec.name}>{spec.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="form-group mb-2">
                          <label>ITI Name</label>
                          <input
                            id={`iti-name-${index}`}
                            type="text"
                            className="form-control"
                            value={edu.collegeName || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].collegeName = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>

                        {/* Currently Pursuing Checkbox */}
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`currently-pursuing-${index}`}
                            checked={edu.currentlyPursuing || false}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].currentlyPursuing = e.target.checked;
                              if (e.target.checked) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`currently-pursuing-${index}`}
                            onClick={(e) => {
                              e.preventDefault(); // Prevent default label behavior
                              const updated = [...educations];
                              updated[index].currentlyPursuing = !updated[index].currentlyPursuing;
                              if (updated[index].currentlyPursuing) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          >
                            Currently Pursuing
                          </label>
                        </div>

                        <div className="form-group mb-2">
                          <label>Passing Year</label>
                          {!edu.currentlyPursuing ? (
                            <input
                              type="text"
                              className="form-control"
                              value={edu.passingYear || ''}
                              onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                              }}
                            />
                          ) : (
                            <div className="form-control disabled">
                              Present
                            </div>
                          )}
                        </div>

                        <div className="form-group mb-2">
                          <label>Marks (%)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={edu.marks || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].marks = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                      </>
                    );
                  }

                  // Case 5: All other education types (like degree courses)
                  else if (educationName) {
                    return (
                      <>
                        {coursesList[index] && coursesList[index].length > 0 && (
                          <div className="form-group mb-2">
                            <label>Course</label>
                            <select
                              className="form-select"
                              value={edu.course || ''}
                              onChange={(e) => {
                                handleCourseChange(e, index)
                              }}
                            >
                              <option value="">Select Course</option>
                              {coursesList[index].map((course) => (
                                <option key={course._id} value={course._id}>{course.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {specializationsList[index] && specializationsList[index].length > 0 && (
                          <div className="form-group mb-2">
                            <label>Specialization</label>
                            <select
                              className="form-select"
                              value={edu.specialization || ''}
                              onChange={(e) => {
                                const updated = [...educations];
                                updated[index].specialization = e.target.value;
                                setEducations(updated);
                              }}
                            >
                              <option value="">Select Specialization</option>
                              {specializationsList[index].map((spec) => (
                                <option key={spec._id} value={spec.name}>{spec.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="form-group mb-2">
                          <label>University/Technical Boards</label>
                          <input
                            id={`university-name-${index}`}
                            type="text"
                            className="form-control"
                            placeholder="Search for university or board..."
                            value={edu.universityName || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].universityName = e.target.value;
                              setEducations(updated);
                            }}
                            onFocus={() => initializeAutocomplete(`university-name-${index}`, setEducations, index, 'universityName')}
                          />
                        </div>

                        <div className="form-group mb-2">
                          <label>College Name</label>
                          <input
                            type="text"
                            id={`college-name-${index}`}
                            className="form-control"
                            value={edu.collegeName || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].collegeName = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>

                        {/* Currently Pursuing Checkbox */}
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`currently-pursuing-${index}`}
                            checked={edu.currentlyPursuing || false}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].currentlyPursuing = e.target.checked;
                              if (e.target.checked) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`currently-pursuing-${index}`}
                            onClick={(e) => {
                              e.preventDefault(); // Prevent default label behavior
                              const updated = [...educations];
                              updated[index].currentlyPursuing = !updated[index].currentlyPursuing;
                              if (updated[index].currentlyPursuing) {
                                updated[index].passingYear = '';
                              }
                              setEducations(updated);
                            }}
                          >
                            Currently Pursuing
                          </label>
                        </div>

                        <div className="form-group mb-2">
                          <label>Passing Year</label>
                          {!edu.currentlyPursuing ? (
                            <input
                              type="text"
                              className="form-control"
                              value={edu.passingYear || ''}
                              onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                              }}
                            />
                          ) : (
                            <div className="form-control disabled">
                              Present
                            </div>
                          )}
                        </div>

                        <div className="form-group mb-2">
                          <label>Marks (%)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={edu.marks || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].marks = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div>
                      </>
                    );
                  }

                  // Default case when no education is selected
                  return null;
                })()}
              </div>
            ))}

            <button
              className="add-button"
              onClick={() => setEducations([...educations, {}])}
            >
              <i className="bi bi-plus"></i> Add Education
            </button>
          </div>
        </div>

        {/* Skills Section */}
        <div className={`resume-section ${activeSection === 'skills' ? 'active' : ''}`}>
          <div className="resume-paper">
            <div className="section-title">
              <i className="bi bi-star me-2"></i>
              Skills
            </div>

            <div className="skills-grid">
              {skills.map((skill, index) => (
                <div className="skill-item" key={`skill-${index}`}>
                  <div className="skill-header">
                    <div className="skill-edit">
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        data-placeholder="Skill Name"
                        className="skill-name"
                        onBlur={(e) => {
                          const updated = [...skills];
                          updated[index].skillName = e.target.innerText;
                          setSkills(updated);
                        }}
                      >
                        {skill.skillName}
                      </div>
                      <span className="skill-level">{skill.skillPercent || 0}%</span>
                    </div>

                    <button
                      className="remove-skill"
                      onClick={() => {
                        const updatedSkills = [...skills];
                        if (skills.length === 1) {
                          updatedSkills[0] = { skillName: '', skillPercent: 0 }; // reset instead of remove
                        } else {
                          updatedSkills.splice(index, 1); // remove if more than one
                        }
                        setSkills(updatedSkills);
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>

                  <div className="skill-slider">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skill.skillPercent || 0}
                      onChange={(e) => {
                        const updated = [...skills];
                        updated[index].skillPercent = Number(e.target.value);
                        setSkills(updated);
                      }}
                      className="form-range"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="add-button"
              onClick={() => setSkills([...skills, { skillName: '', skillPercent: 50 }])}
            >
              <i className="bi bi-plus"></i> Add Skill
            </button>
          </div>
        </div>

        {/* Additional Section (Languages, Certifications, Projects, Interests) */}
        <div className={`resume-section ${activeSection === 'extras' ? 'active' : ''}`}>
          <div className="resume-paper">
            <div className="extras-section">
              <div className="row">
                {/* Languages */}
                <div className="extra-category">
                  <div className="category-title">
                    <i className="bi bi-translate me-2"></i>
                    Languages
                  </div>

                  <div className="languages-list">
                    {languages.map((language, index) => (
                      <div className="language-item" key={`language-${index}`}>
                        <div className="language-details">
                          {createEditable(language.name || '', 'Language Name', (val) => {
                            const updated = [...languages];
                            updated[index].name = val;
                            setLanguages(updated);
                          })}
                          <div className="language-proficiency">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <span
                                key={`proficiency-${index}-${dot}`}
                                className={`proficiency-dot ${dot <= (language.level || 0) ? 'filled' : ''}`}
                                onClick={() => {
                                  const updated = [...languages];
                                  updated[index].level = dot;
                                  setLanguages(updated);
                                }}
                              ></span>
                            ))}
                          </div>
                        </div>
                        <button
                          className="remove-language"
                          onClick={() => {
                            const updated = [...languages];
                            if (languages.length === 1) {
                              updated[0] = { name: '', level: 0 };
                            } else {
                              updated.splice(index, 1);
                            }
                            setLanguages(updated);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}

                    <button
                      className="add-button"
                      onClick={() => setLanguages([...languages, { lname: '', level: 0 }])} style={{ width: '55%', height: '34px', marginTop: '20px' }}
                    >
                      <i className="bi bi-plus"></i> Add Language
                    </button>
                  </div>
                </div>

                {/* Certifications */}
                <div className="col-md-6 extra-category">
                  <div className="category-title">
                    <i className="bi bi-award me-2"></i>
                    Certifications
                  </div>

                  <div className="certifications-list">
                    {certificates.map((certificate, index) => (
                      <div className="certificate-item" key={`certificate-${index}`}>
                        <div className="certificate-details">
                          <div className="certificate-name">
                            {/* Certificate Name field with validation */}
                            <div className="form-group w-50">
                              <label className="form-label">
                                Certificate Name
                                {(certificate.month || certificate.year || certificate.currentlypursuing) && (
                                  <span className="text-danger">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                className={`form-control ${(certificate.month || certificate.year || certificate.currentlypursuing) && !certificate.certificateName ? "is-invalid" : ""}`}
                                placeholder="Certificate Name"
                                value={certificate.certificateName || ''}
                                onChange={(e) => {
                                  const updated = [...certificates];
                                  updated[index].certificateName = e.target.value;
                                  setCertificates(updated);
                                }}
                                required={(certificate.month || certificate.year || certificate.currentlypursuing)}
                              />
                              {(certificate.month || certificate.year || certificate.currentlypursuing) && !certificate.certificateName && (
                                <div className="invalid-feedback">
                                  Certificate name is required
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="certificate-org">
                            {/* Issuing Organization field with validation */}
                            <div className="form-group w-100">
                              <label className="form-label">
                                Issuing Organization
                                {(certificate.month || certificate.year || certificate.currentlypursuing) && (
                                  <span className="text-danger">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id={`issuing-organization-${index}`}
                                className={`form-control ${(certificate.month || certificate.year || certificate.currentlypursuing) && !certificate.orgName ? "is-invalid" : ""}`}
                                placeholder="Issuing Organization"
                                value={certificate.orgName || ''}
                                onChange={(e) => {
                                  const updated = [...certificates];
                                  updated[index].orgName = e.target.value;
                                  setCertificates(updated);
                                }}
                                required={(certificate.month || certificate.year || certificate.currentlypursuing)}
                              />
                              {(certificate.month || certificate.year || certificate.currentlypursuing) && !certificate.orgName && (
                                <div className="invalid-feedback">
                                  Issuing organization is required
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Currently Pursuing Checkbox */}
                          <div className="form-check mb-3 mt-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`currently-pursuing-cert-${index}`}
                              checked={certificate.currentlypursuing || false}
                              onChange={(e) => {
                                const updated = [...certificates];
                                updated[index].currentlypursuing = e.target.checked;
                                if (e.target.checked) {
                                  updated[index].month = '';
                                  updated[index].year = '';
                                }
                                setCertificates(updated);
                              }}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`currently-pursuing-cert-${index}`}
                              onClick={(e) => {
                                e.preventDefault(); // Prevent default label behavior
                                const updated = [...certificates];
                                updated[index].currentlypursuing = !updated[index].currentlypursuing;
                                if (!updated[index].currentlypursuing === false) {
                                  updated[index].month = '';
                                  updated[index].year = '';
                                }
                                setCertificates(updated);
                              }}
                            >
                              Currently Pursuing
                            </label>
                          </div>

                          {!certificate.currentlyPursuing ? (
                            <div className="certificate-date-fields">
                              <div className="cert-month">
                                <select
                                  className="form-select"
                                  value={certificate.month || ''}
                                  onChange={(e) => {
                                    const updated = [...certificates];
                                    updated[index].month = e.target.value;
                                    setCertificates(updated);
                                  }}
                                >
                                  <option value="">Month</option>
                                  <option value="01">January</option>
                                  <option value="02">February</option>
                                  <option value="03">March</option>
                                  <option value="04">April</option>
                                  <option value="05">May</option>
                                  <option value="06">June</option>
                                  <option value="07">July</option>
                                  <option value="08">August</option>
                                  <option value="09">September</option>
                                  <option value="10">October</option>
                                  <option value="11">November</option>
                                  <option value="12">December</option>
                                </select>
                              </div>

                              <div className="cert-year">
                                <select
                                  className="form-select"
                                  value={certificate.year || ''}
                                  onChange={(e) => {
                                    const updated = [...certificates];
                                    updated[index].year = e.target.value;
                                    setCertificates(updated);
                                  }}
                                >
                                  <option value="">Year</option>
                                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div className="expected-completion">
                              <div className="form-control disabled text-muted">
                                In Progress
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          className="remove-certificate"
                          onClick={() => {
                            const updated = [...certificates];
                            if (certificates.length === 1) {
                              updated[0] = { certificateName: '', orgName: '', month: '', year: '', currentlyPursuing: false };
                            } else {
                              updated.splice(index, 1);
                            }
                            setCertificates(updated);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}

                    <button
                      className="add-button add-certificate"
                      onClick={() => setCertificates([...certificates, { certificateName: '', orgName: '', month: '', year: '', currentlyPursuing: false }])}
                    >
                      <i className="bi bi-plus"></i> Add Certificate
                    </button>
                  </div>
                </div>

                {/* Projects */}
                <div className="col-md-6 extra-category">
                  <div className="category-title">
                    <i className="bi bi-code-square me-2"></i>
                    Projects
                  </div>

                  <div className="projects-list">
                    {projects.map((project, index) => (
                      <div className="project-item" key={`project-${index}`}>
                        <div className="project-details">
                          <div className="project-header">
                            <div className="project-name">
                              {createEditable(project.projectName || '', 'Project Name', (val) => {
                                const updated = [...projects];
                                updated[index].projectName = val;
                                setProjects(updated);
                              })}
                            </div>
                            <div className="project-year">
                              {createEditable(project.proyear || '', 'Year', (val) => {
                                const updated = [...projects];
                                updated[index].proyear = val;
                                setProjects(updated);
                              })}
                            </div>
                          </div>
                          <div className="project-description">
                            {createEditable(project.proDescription || '', 'Project Description', (val) => {
                              const updated = [...projects];
                              updated[index].proDescription = val;
                              setProjects(updated);
                            })}
                          </div>
                        </div>

                        <button
                          className="remove-project"
                          onClick={() => {
                            const updated = [...projects];
                            if (projects.length === 1) {
                              updated[0] = { projectName: '', proyear: '', proDescription: '' };
                            } else {
                              updated.splice(index, 1);
                            }
                            setProjects(updated);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}

                    <button
                      className="add-button add-certificate"
                      onClick={() => setProjects([...projects, { projectName: '', proyear: '', proDescription: '' }])}
                    >
                      <i className="bi bi-plus"></i> Add Project
                    </button>
                  </div>
                </div>

                {/* Interests */}
                <div className="col-md-6 extra-category">
                  <div className="category-title">
                    <i className="bi bi-heart me-2"></i>
                    Interests
                  </div>

                  <div className="interests-container">
                    <div className="interests-tags">
                      {interests.map((interest, index) => (
                        <div className="interest-tag" key={`interest-${index}`}>
                          <div
                            contentEditable
                            suppressContentEditableWarning={true}
                            data-placeholder="Interest"
                            onBlur={(e) => {
                              const updated = [...interests];
                              updated[index] = e.target.innerText;
                              setInterests(updated);
                            }}
                          >
                            {interest}
                          </div>

                          <button
                            className="remove-interest"
                            onClick={() => {
                              const updated = [...interests];
                              if (interests.length === 1) {
                                updated[0] = '';
                              } else {
                                updated.splice(index, 1);
                              }
                              setInterests(updated);
                            }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      className="add-button"
                      onClick={() => setInterests([...interests, ''])}
                    >
                      <i className="bi bi-plus"></i> Add Interest
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="extra-category">
              <div className="category-title">
                <i className="bi bi-file-text me-2"></i>
                Declaration
              </div>

              <div className="declaration-container">
                <div
                  className="d-flex align-items-center declaration-content"
                >
                  <input
                    type="checkbox"
                    id="declaration-check"
                    checked={declaration.isChecked}
                    onChange={(e) => setDeclaration({
                      ...declaration,
                      isChecked: e.target.checked

                    },
                      console.log('Is Declaration Checked:', declaration.isChecked)
                    )}
                  />

                  <p className='ms-2'>I hereby declare that all the information provided above is true to the best of my knowledge.</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Voice Recording Section */}
        {voiceIntroduction && (
          <div className={`resume-section ${activeSection === 'recording' ? 'active' : ''}`}>
            <div className="resume-paper">
              <div className="section-title">
                <i className="bi bi-mic me-2"></i>
                Voice Introduction
              </div>

              <div className="recording-container">
                <div className="recording-controls">
                  <div className="recording-timer">{timer}</div>
                  <div className="recording-status">{recordingStatus}</div>

                  <div className="control-buttons">
                    <button
                      className={`record-button ${isRecording ? 'recording' : ''}`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic-fill'}`}></i>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                  </div>
                </div>

                <div className="recordings-list">
                  <h5>Your Recordings</h5>

                  {recordings.length === 0 ? (
                    <div className="no-recordings">No recordings yet</div>
                  ) : (
                    recordings.map(recording => (
                      <div className="recording-item" key={recording.id}>
                        <div className="recording-info">
                          <div className="recording-name">{recording.name}</div>
                          <div className="recording-timestamp">{recording.timestamp}</div>
                        </div>

                        <div className="recording-actions">
                          <audio controls src={recording.url} className="audio-player"></audio>

                          <button
                            className="delete-recording"
                            onClick={() => deleteRecording(recording.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="resume-actions">
        <button
          className="audio-intro-btn"
          onClick={() => {
            setShowRecordingModal(true);
            setShowIntroOptions(false);
          }}
        >
          <i className="bi bi-mic-fill"></i>
          <span>Introduce Yourself to Build Your Resume</span>
        </button>
        {/* <label className="upload-resume">
          <i className="bi bi-upload me-2"></i> Upload Resume
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadCV(file, 'resume');
                e.target.value = null; // Direct upload on file selection
              }
            }}
          />

        </label> */}
        <label className="upload-resume">
          <i className="bi bi-upload me-2"></i> Upload Resume
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadCV(file, 'resume');

                // Set fileName and uploadDate for immediate display
                setFileName(file.name);
                const currentDate = new Date().toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                }).replace(/ /g, ' ');
                setUploadDate(currentDate);

                e.target.value = null; // Reset input
              }
            }}
          />
        </label>

        {/* <button className="save-resume" onClick={handleSaveCV}>
          <i className="bi bi-save me-2"></i> Save Resume
        </button> */}

        <button
          className="save-resume"
          onClick={async () => {
            // First check if declaration is checked
            if (!declaration?.isChecked) {
              alert("Please accept the declaration before saving your resume.");
              return;
            }
            // Certificate Validation
            const certificatesValid = certificates.every(cert => {
              if (cert.month || cert.year || cert.currentlypursuing) {
                return cert.certificateName && cert.orgName;
              }
              return true;
            });

            if (!certificatesValid) {
              alert("Please complete all required certificate fields (name and organization) for certificates with dates or marked as 'Currently Pursuing'");
              return;
            }
            // First save the resume data
            await handleSaveCV();

            // Then open the preview to access the element
            setShowPreview(true);

            // Need to wait for the preview to render
            setTimeout(async () => {
              try {
                // Now try to get the element
                const element = document.getElementById('resume-download');

                if (!element) {
                  console.error("Resume element still not found after showing preview");
                  alert("Could not generate PDF. Please try using the Preview button and downloading from there.");
                  return;
                }

                const opt = {
                  margin: 0.5,
                  filename: 'resume.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                };

                // Generate blob
                const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');

                // Create a file object from the blob
                const pdfFile = new File([pdfBlob], `focalyt-profile-${Date.now()}.pdf`, {
                  type: 'application/pdf'
                });

                // Upload to focalytProfile
                await uploadCV(pdfFile, 'focalytProfile');

                // Close the preview
                setShowPreview(false);

                alert('Resume has been saved successfully, including the PDF for your profile!');
              } catch (err) {
                console.error("PDF generation error:", err);
                alert('Resume data saved, but there was an error generating the PDF profile.');
                setShowPreview(false); // Close preview on error
              }
            }, 1000); // Wait 1 second for preview to render
          }}
        >
          <i className="bi bi-save me-2"></i> Save Resume
        </button>

        <button className="preview-resume" onClick={() => {
          if (!declaration?.isChecked) {
            alert("Please accept the declaration before saving your resume.");
            return;
          };
          setShowPreview(true)
        }}>
          <i className="bi bi-eye me-2"></i> Preview Resume
        </button>
      </div>
      {fileName && (
        <div className="section-order">
          <div className="section fadeInUp resume">
            <div className="heading-container">
              <div className="text-emoji-container">
                <div className="text-container">
                  <h1 className="section-heading title-16-bold">Uploaded Resume</h1>
                  <h2 className="section-sub-heading title-14-medium">
                    Your resume is the first impression you make on potential employers. Craft it carefully to secure your desired job or internship.
                  </h2>
                </div>
              </div>
            </div>

            <div className="uploaded-container">
              <div className="file-details">
                <div className="file-name title-14-bold">{fileName}</div>
                <div className="uploaded-date title-14-regular">Uploaded on {uploadDate}</div>
              </div>

              <div className="action-container">
                {/* View button */}
                <div className="border-box view"
                  onClick={viewResume}
                  style={{ cursor: 'pointer' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2.625C3.5 2.625 1.1375 7 1.1375 7C1.1375 7 3.5 11.375 7 11.375C10.5 11.375 12.8625 7 12.8625 7C12.8625 7 10.5 2.625 7 2.625Z"
                      stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 9.1875C8.2426 9.1875 9.25 8.18008 9.25 6.9375C9.25 5.69492 8.2426 4.6875 7 4.6875C5.75736 4.6875 4.75 5.69492 4.75 6.9375C4.75 8.18008 5.75736 9.1875 7 9.1875Z"
                      stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="border-box delete"
                  onClick={() => {
                    setFileName("");
                    setUploadDate("");
                    localStorage.removeItem('resumeFileName');
                    localStorage.removeItem('resumeUploadDate');
                    localStorage.removeItem('resume');
                    alert('Resume deleted');
                    // You may want to call a function to delete from backend as well
                  }}
                  style={{ cursor: 'pointer' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <g clipPath="url(#clip0_2370_12506)">
                      <path d="M1.52734 3.35156H2.74333H12.4712"
                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.56812 3.35189V2.1359C4.56812 1.81341 4.69623 1.50412 4.92427 1.27608C5.15231 1.04803 5.4616 0.919922 5.7841 0.919922H8.21606C8.53856 0.919922 8.84785 1.04803 9.07589 1.27608C9.30393 1.50412 9.43205 1.81341 9.43205 2.1359V3.35189"
                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.256 3.35189V11.8638C11.256 12.1863 11.1279 12.4956 10.8999 12.7236C10.6718 12.9516 10.3625 13.0798 10.04 13.0798H3.96012C3.63762 13.0798 3.32833 12.9516 3.10029 12.7236C2.87225 12.4956 2.74414 12.1863 2.74414 11.8638V3.35189H11.256Z"
                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.7832 6.39258V10.0405"
                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.21484 6.39258V10.0405"
                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_2370_12506">
                        <rect width="14" height="14" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>)}
      {showResumeViewer && (
        <div className="resume-viewer-overlay">
          <div className="resume-viewer-modal">
            <div className="modal-header">
              <h5>Resume: {fileName}</h5>
              <button className="close-modal" onClick={() => setShowResumeViewer(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              {resumeUrl.endsWith('.pdf') ? (
                // For PDF files
                <iframe
                  src={`${resumeUrl}#toolbar=0`}
                  className="resume-iframe"
                  title="Resume Viewer"
                ></iframe>
              ) : resumeUrl.endsWith('.doc') || resumeUrl.endsWith('.docx') ? (
                // For Word documents - using Google Docs Viewer
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`}
                  className="resume-iframe"
                  title="Resume Viewer"
                ></iframe>
              ) : (
                // For other formats or fallback
                <div className="resume-fallback">
                  <p>This resume format cannot be directly viewed in the browser.</p>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    <i className="bi bi-download me-2"></i> Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* <div className="section-order">
        <div className="section fadeInUp resume">
          <div className="heading-container">
            <div className="text-emoji-container">
              <div className="text-container">
                <h1 className="section-heading title-16-bold">Resume</h1>
                <h2 className="section-sub-heading title-14-medium">
                  Your resume is the first impression you make on potential employers. Craft it carefully to secure your desired job or internship.
                </h2>
              </div>
            </div>
          </div>

          <div className="uploaded-container">
            <div className="file-details">
              <div className="file-name title-14-bold">{fileName}</div>
              <div className="uploaded-date title-14-regular">Uploaded on {uploadDate}</div>
            </div>

            <div className="action-container">
              <div className="border-box download">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.5015 8.49805V10.9437C12.5015 11.268 12.3726 11.579 12.1433 11.8083C11.914 12.0377 11.603 12.1665 11.2786 12.1665H2.71891C2.3946 12.1665 2.08357 12.0377 1.85425 11.8083C1.62493 11.579 1.49609 11.268 1.49609 10.9437V8.49805"
                    stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.0555 6.44686L6.99845 9.50391L3.94141 6.44686"
                    stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 9.50391V2.16699"
                    stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="border-box delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <g clipPath="url(#clip0_2370_12506)">
                    <path d="M1.52734 3.35156H2.74333H12.4712"
                      stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.56812 3.35189V2.1359C4.56812 1.81341 4.69623 1.50412 4.92427 1.27608C5.15231 1.04803 5.4616 0.919922 5.7841 0.919922H8.21606C8.53856 0.919922 8.84785 1.04803 9.07589 1.27608C9.30393 1.50412 9.43205 1.81341 9.43205 2.1359V3.35189"
                      stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.256 3.35189V11.8638C11.256 12.1863 11.1279 12.4956 10.8999 12.7236C10.6718 12.9516 10.3625 13.0798 10.04 13.0798H3.96012C3.63762 13.0798 3.32833 12.9516 3.10029 12.7236C2.87225 12.4956 2.74414 12.1863 2.74414 11.8638V3.35189H11.256Z"
                      stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.7832 6.39258V10.0405"
                      stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.21484 6.39258V10.0405"
                      stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <defs>
                    <clipPath id="clip0_2370_12506">
                      <rect width="14" height="14" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          <div className="resume-upload-container">
            <input type="file" className="upload-input" onChange={handleFileUpload} />
            <button className="btn upload-button">Update resume</button>
            <div className="help-text title-14-medium">
              Supported formats: doc, docx, rtf, pdf, up to 2MB
            </div>
          </div>
        </div>
      </div> */}
      {/* Recording Modal */}
      {showRecordingModal && (
        <div className="recording-modal-overlay">
          <div className="recording-modal">
            <div className="modal-header">
              <h5>Record Voice Introduction</h5>
              <button className="close-modal" onClick={() => setShowRecordingModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="recording-controls">
                <div className="recording-timer">{timer}</div>
                <div className="recording-status">{recordingStatus}</div>

                <div className="control-buttons">
                  <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic-fill'}`}></i>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </div>
              </div>

              <div className="recordings-list">
                <h5>Your Recordings</h5>

                {recordings.length === 0 ? (
                  <div className="no-recordings">No recordings yet</div>
                ) : (
                  recordings.map(recording => (
                    <div className="recording-item" key={recording.id}>
                      <div className="recording-info">
                        <div className="recording-name">{recording.name}</div>
                        <div className="recording-timestamp">{recording.timestamp}</div>
                      </div>

                      <div className="recording-actions">
                        <audio controls src={recording.url} className="audio-player"></audio>

                        <button
                          className="delete-recording"
                          onClick={() => deleteRecording(recording.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-done" onClick={() => setShowRecordingModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Preview Modal */}
      {showPreview && (
        <div className="resume-preview-modal">
          <div className="resume-preview-content">
            <div className="resume-preview-header">
              <h2>Resume Preview</h2>
              <button className="close-preview" onClick={() => setShowPreview(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="resume-preview-body">
              <div id="resume-download" className="resume-document">
                {/* Header Section */}
                <div className="resume-document-header">
                  <div className="resume-profile-section">
                    {user?.image ? (
                      <img
                        src={`${bucketUrl}/${user.image}`}
                        alt="Profile"
                        className="resume-profile-image"
                      />
                    ) : (
                      <div className="resume-profile-placeholder">
                        <i className="bi bi-person-circle"></i>
                      </div>
                    )}

                    <div className="resume-header-content">
                      <h1 className="resume-name">
                        {profileData?.personalInfo?.name || user?.name || 'Your Name'}
                      </h1>
                      <p className="resume-title">
                        {profileData?.personalInfo?.professionalTitle || 'Professional Title'}
                      </p>
                      <p className="resume-title">
                        {profileData?.sex || 'Sex'}
                      </p>

                      <div className="resume-contact-details">
                        {profileData?.mobile && (
                          <div className="resume-contact-item">
                            <i className="bi bi-telephone-fill"></i>
                            <span>{profileData.mobile}</span>
                          </div>
                        )}
                        {profileData?.email && (
                          <div className="resume-contact-item">
                            <i className="bi bi-envelope-fill"></i>
                            <span>{profileData.email}</span>
                          </div>
                        )}
                        {profileData?.dob && (
                          <div className="resume-contact-item">
                            <i className="bi bi-calendar-heart-fill"></i>

                            {profileData.dob ? new Date(profileData.dob).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            }) : ''}
                          </div>
                        )}
                        {profileData?.personalInfo?.currentAddress?.fullAddress && (

                          <div className="resume-contact-item">
                            <i className="bi bi-geo-alt-fill"></i>
                            <span>Current:{profileData.personalInfo.currentAddress.fullAddress}</span>
                          </div>
                        )}

                        {/* Add permanent address */}
                        {profileData?.personalInfo?.permanentAddress && (
                          <div className="resume-contact-item">
                            <i className="bi bi-house-fill"></i>
                            <span>Permanent: {profileData.personalInfo.permanentAddress.fullAddress}</span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>

                  <div className="resume-summary">
                    <h2 className="resume-section-title">Professional Summary</h2>
                    <p>{profileData?.personalInfo?.summary || 'No summary provided'}</p>
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="resume-document-body">
                  {/* Left Column */}
                  <div className="resume-column resume-left-column">
                    {/* Experience Section */}
                    {profileData?.experienceType === 'fresher' ? (
                      /* Fresher Preview */
                      <div className="resume-section">
                        <h2 className="resume-section-title">Work Experience</h2>
                        <div className="resume-experience-item">
                          <div className="resume-item-header">
                            <h3 className="resume-item-title">Fresher</h3>
                          </div>
                          {profileData?.fresherDetails && (
                            <div className="resume-item-content">
                              <p>{profileData.isExperienced}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Experienced Preview */
                      experiences.length > 0 && experiences.some(exp => exp.jobTitle || exp.companyName || exp.jobDescription) && (
                        <div className="resume-section">
                          <h2 className="resume-section-title">Work Experience</h2>

                          {experiences.map((exp, index) => (
                            (exp.jobTitle || exp.companyName || exp.jobDescription) && (
                              <div className="resume-experience-item" key={`resume-exp-${index}`}>
                                <div className="resume-item-header">
                                  {exp.jobTitle && (
                                    <h3 className="resume-item-title">{exp.jobTitle}</h3>
                                  )}
                                  {exp.companyName && (
                                    <p className="resume-item-subtitle">{exp.companyName}</p>
                                  )}
                                  {(exp.from || exp.to || exp.currentlyWorking) && (
                                    <p className="resume-item-period">
                                      {exp.from ? new Date(exp.from).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                      }) : 'Start Date'}
                                      {" - "}
                                      {exp.currentlyWorking ? 'Present' :
                                        exp.to ? new Date(exp.to).toLocaleDateString('en-IN', {
                                          year: 'numeric',
                                          month: 'short',
                                        }) : 'End Date'}
                                    </p>
                                  )}

                                </div>
                                {exp.jobDescription && (
                                  <div className="resume-item-content">
                                    <p>{exp.jobDescription}</p>
                                  </div>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      )
                    )}
                    {/* Education Section */}
                    {educations.length > 0 && educations.some(edu =>
                      edu.education || edu.course || edu.schoolName || edu.collegeName || edu.universityName || edu.passingYear
                    ) && (
                        <div className="resume-section">
                          <h2 className="resume-section-title">Education</h2>

                          {educations.map((edu, index) => (
                            (edu.education || edu.course || edu.schoolName || edu.collegeName || edu.universityName || edu.passingYear) && (
                              <div className="resume-education-item" key={`resume-edu-${index}`}>
                                <div className="resume-item-header">
                                  {edu.education && (
                                    <h3 className="resume-item-title">
                                      {educationList.find(e => e._id === edu.education)?.name || 'Education'}
                                    </h3>
                                  )}

                                  {typeof edu.course === 'string' && edu.course && (
                                    <h3 className="resume-item-title">
                                      {
                                        coursesList[index]?.find(course => course._id === edu.course)?.name
                                        || edu.course  // fallback in case name not found
                                      }
                                    </h3>
                                  )}

                                  {edu.universityName && (
                                    <p className="resume-item-subtitle">{edu.universityName}</p>
                                  )}
                                  {(edu.schoolName && !edu.universityName) && (
                                    <p className="resume-item-subtitle">{edu.schoolName}</p>
                                  )}
                                  {edu.collegeName && (
                                    <p className="resume-item-subtitle">{edu.collegeName}</p>
                                  )}
                                  {edu.currentlypursuing ? (
                                    <p className="resume-item-period highlight-text">Currently Pursuing</p>
                                  ) : edu.passingYear ? (
                                    <p className="resume-item-period">{edu.passingYear}</p>
                                  ) : null}
                                </div>
                                <div className="resume-item-content">
                                  {edu.marks && <p>Marks: {edu.marks}%</p>}
                                  {edu.specialization && <p>Specialization: {typeof edu.specialization === 'string' ? edu.specialization : 'Specialization'}</p>}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}

                  </div>

                  {/* Right Column */}
                  <div className="resume-column resume-right-column">
                    {/* Skills Section */}
                    {skills.length > 0 && skills.some(skill => skill.skillName) && (
                      <div className="resume-section">
                        <h2 className="resume-section-title">Skills</h2>

                        <div className="resume-skills-list">
                          {skills.map((skill, index) => (
                            skill.skillName && (
                              <div className="resume-skill-item" key={`resume-skill-${index}`}>
                                <div className="resume-skill-name">
                                  {skill.skillName}
                                </div>
                                <div className="resume-skill-bar-container">
                                  <div
                                    className="resume-skill-bar"
                                    style={{ width: `${skill.skillPercent || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages Section */}
                    {languages.length > 0 && languages.some(lang => lang.lname) && (
                      <div className="resume-section">
                        <h2 className="resume-section-title">Languages</h2>

                        <div className="resume-languages-list">
                          {languages.map((lang, index) => (
                            lang.lname && (
                              <div className="resume-language-item" key={`resume-lang-${index}`}>
                                <div className="resume-language-name">{lang.lname}</div>
                                <div className="resume-language-level">
                                  {[1, 2, 3, 4, 5].map(dot => (
                                    <span
                                      key={`resume-lang-dot-${index}-${dot}`}
                                      className={`resume-level-dot ${dot <= (lang.level || 0) ? 'filled' : ''}`}
                                    ></span>
                                  ))}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications Section */}
                    {certificates.length > 0 && certificates.some(cert => cert.certificateName || cert.orgName) && (
                      <div className="resume-section">
                        <h2 className="resume-section-title">Certifications</h2>

                        <ul className="resume-certifications-list">
                          {certificates.map((cert, index) => (
                            (cert.certificateName || cert.orgName) && (
                              <li key={`resume-cert-${index}`} className="resume-certification-item">
                                {cert.certificateName && (
                                  <strong>{cert.certificateName}</strong>
                                )}

                                {cert.orgName && (
                                  <span className="resume-cert-org"> - {cert.orgName}</span>
                                )}

                                {cert.currentlypursuing ? (
                                  <span className="resume-cert-date highlight-text"> (Currently Pursuing)</span>
                                ) : (cert.month || cert.year) && (
                                  <span className="resume-cert-date">
                                    {cert.month && cert.year ?
                                      ` (${cert.month}/${cert.year})` :
                                      cert.month ?
                                        ` (${cert.month})` :
                                        cert.year ?
                                          ` (${cert.year})` :
                                          ''}
                                  </span>
                                )}
                              </li>
                            )
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Projects Section */}
                    {projects.length > 0 && projects.some(p => p.projectName || p.proDescription) && (
                      <div className="resume-section">
                        <h2 className="resume-section-title">Projects</h2>
                        {projects.map((proj, index) => (
                          (proj.projectName || proj.proDescription) && (
                            <div className="resume-project-item" key={`resume-proj-${index}`}>
                              <div className="resume-item-header">
                                <h3 className="resume-project-title">
                                  {proj.projectName || 'Project'}
                                  {proj.proyear && <span className="resume-project-year"> ({proj.proyear})</span>}
                                </h3>
                              </div>
                              {proj.proDescription && (
                                <div className="resume-item-content">
                                  <p>{proj.proDescription}</p>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    )}
                    {/* {projects.length > 0 && projects.some(p => p.projectName || p.proDescription) && (
                      <div className="resume-section">
                        <h2 className="resume-section-title">Projects</h2>
                        {projects.map((proj, index) => (
                          (proj.projectName || proj.proDescription) && (
                            <div className="resume-project-item" key={`resume-proj-${index}`}>
                              <div className="resume-item-header">
                                <h3 className="resume-project-title">
                                  {proj.projectName || 'Project'}
                                  {proj.proyear && <span className="resume-project-year"> ({proj.proyear})</span>}
                                </h3>
                              </div>

                              {proj.projectUrl && (
                                <div className="resume-project-url">
                                  <a href={proj.projectUrl} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-link-45deg"></i> {proj.projectUrl}
                                  </a>
                                </div>
                              )}

                              {proj.proDescription && (
                                <div className="resume-item-content">
                                  <p>{proj.proDescription}</p>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    )} */}
                    {/* Interests Section */}
                    {interests.filter(i => i.trim() !== '').length > 0 && (
                      <div className="resume-section">
                        <h2 className="resume-section-title">Interests</h2>

                        <div className="resume-interests-tags">
                          {interests.filter(i => i.trim() !== '').map((interest, index) => (
                            <span className="resume-interest-tag" key={`resume-interest-${index}`}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Declaration */}
                {declaration?.text && (
                  <div className="resume-declaration">
                    <h2 className="resume-section-title">Declaration</h2>
                    <p>{declaration.text}</p>
                  </div>
                )}

              </div>
            </div>

            <div className="resume-preview-actions">
              <button
                className="download-resume-btn"
                onClick={() => {
                  const element = document.getElementById('resume-download');
                  const opt = {
                    margin: 0.5,
                    filename: 'resume.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                  };

                  html2pdf().set(opt).from(element).save();
                }}
              >
                <i className="bi bi-download"></i> Download PDF
              </button>

              {/* <button
  className="download-resume-btn"
  onClick={() => {
    const element = document.getElementById('resume-download');
    const opt = {
      margin: 0.5,
      filename: 'resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // First generate a blob instead of directly saving
    html2pdf().set(opt).from(element).outputPdf('blob').then((pdfBlob) => {
      // Create a file object from the blob
      const pdfFile = new File([pdfBlob], `focalyt-profile-${Date.now()}.pdf`, {
        type: 'application/pdf'
      });
      
      // Upload this file to your backend using your existing uploadCV function
      uploadCV(pdfFile, 'focalytProfile');
      
      // Also let the user download the PDF if they want
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'resume.pdf';
      a.click();
      URL.revokeObjectURL(pdfUrl);
      
      alert('Resume has been downloaded and saved to your profile!');
    }).catch(err => {
      console.error("PDF generation error:", err);
      alert('Error generating PDF. Please try again.');
    });
  }}
>
  <i className="bi bi-download"></i> Download & Save PDF
</button> */}
              <button
                className="close-preview-btn"
                onClick={() => setShowPreview(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* model intro  */}
      {profileStrength < 100 && showIntroOptions && (
        <div className="intro-options-overlay">
          <div className="intro-options-modal">
            <div className="intro-options-header">
              <h3>How would you like to introduce yourself?</h3>
              <button className="close-intro-options" onClick={() => setShowIntroOptions(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="intro-options-body">
              <div
                className="intro-option-card"
                onClick={() => {
                  setShowRecordingModal(true);
                  setShowIntroOptions(false);
                }}
              >
                <div className="intro-option-icon">
                  <i className="bi bi-mic-fill"></i>
                </div>
                <div className="intro-option-text">
                  <h4>Voice Introduction</h4>
                  <p>Record a brief audio introduction to make your profile stand out</p>
                </div>
              </div>

              <div className="intro-options-divider">
                <span>OR</span>
              </div>

              <div
                className="intro-option-card"
                onClick={() => {
                  setActiveSection('personal');
                  setShowIntroOptions(false);
                }}
              >
                <div className="intro-option-icon">
                  <i className="bi bi-file-earmark-text-fill"></i>
                </div>
                <div className="intro-option-text">
                  <h4>Fill Your Profile</h4>
                  <p>Complete your professional details to create a comprehensive resume</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* {updateNumber && (
        <>
          <div
            className="modal-backdrop show"
            style={{
              position: 'static',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={closeModal}
          >
            
          </div>


          <div className="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50% -50%)' }}>


            <div class="card mt-5 shadow-lg">
              <div class="card-body p-4">
                <h2 class="card-title text-center mb-4 fw-bold text-dark">
                  Update Phone Number
                </h2>

                <form>
                  <div class="mb-3">
                    <label for="oldNumber" class="form-label fw-medium">
                      Enter Old Number
                    </label>
                    <div class="d-flex gap-2">
                      <input
                        type="tel"
                        id="oldNumber"
                        name="oldNumber"
                        placeholder="Enter your current phone number"
                        class="form-control flex-fill"
                      />
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                      >
                        Send OTP
                      </button>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="otp" class="form-label fw-medium">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      placeholder="Enter 6-digit OTP"
                      maxlength="6"
                      class="form-control"
                    />
                    <div class="form-text text-muted">
                      OTP sent to <span id="phoneDisplay"></span>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="newNumber" class="form-label fw-medium">
                      Enter New Number
                    </label>
                    <input
                      type="tel"
                      id="newNumber"
                      name="newNumber"
                      placeholder="Enter your new phone number"
                      class="form-control"
                    />
                  </div>

                  <button
                    type="button"
                    class="btn btn-success w-100 fw-medium"
                  >
                    Update Phone Number
                  </button>
                </form>
              </div>
            </div>

          </div>
        </>
      )} */}


{showPhoneModal && (
  <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
    <div className="modal-backdrop show" onClick={closePhoneModal}></div>
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Update Phone Number</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={closePhoneModal}
          ></button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Old Phone Number Field */}
            <div className="mb-3">
              <label htmlFor="oldNumber" className="form-label fw-medium">
                Enter Current Phone Number
              </label>
              <div className="d-flex gap-2">
                <input
                  type="tel"
                  id="oldNumber"
                  className={`form-control flex-fill ${errors.oldPhone ? 'is-invalid' : ''}`}
                  placeholder="Enter your current phone number"
                  value={oldPhoneNumber}
                  onChange={handleOldPhoneChange}
                  disabled={isOtpSent}
                  maxLength="10"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={sendOtp}
                  disabled={otpLoading || isOtpSent || !oldPhoneNumber}
                >
                  {otpLoading ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : null}
                  {isOtpSent ? 'OTP Sent' : 'Send OTP'}
                </button>
              </div>
              {errors.oldPhone && (
                <div className="invalid-feedback d-block">{errors.oldPhone}</div>
              )}
            </div>

            {/* OTP Field - Only show after OTP is sent */}
            {isOtpSent && (
              <div className="mb-3">
                <label htmlFor="otp" className="form-label fw-medium">
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  className={`form-control ${errors.otp ? 'is-invalid' : ''}`}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength="6"
                />
                {errors.otp && (
                  <div className="invalid-feedback">{errors.otp}</div>
                )}
                <div className="form-text text-muted">
                  OTP sent to +91-{oldPhoneNumber}
                </div>
              </div>
            )}

            {/* New Phone Number Field - Only show after OTP is sent */}
            {isOtpSent && (
              <div className="mb-4">
                <label htmlFor="newNumber" className="form-label fw-medium">
                  Enter New Phone Number
                </label>
                <input
                  type="tel"
                  id="newNumber"
                  className={`form-control ${errors.newPhone ? 'is-invalid' : ''}`}
                  placeholder="Enter your new phone number"
                  value={newPhoneNumber}
                  onChange={handleNewPhoneChange}
                  maxLength="10"
                />
                {errors.newPhone && (
                  <div className="invalid-feedback">{errors.newPhone}</div>
                )}
              </div>
            )}

            {/* Update Button - Only show when OTP is sent */}
            {isOtpSent && (
              <button
                type="button"
                className="btn btn-success w-100 fw-medium"
                onClick={updatePhoneNumber}
                disabled={updateLoading || !otp || !newPhoneNumber}
              >
                {updateLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating...
                  </>
                ) : (
                  'Update Phone Number'
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  </div>
)}
<style jsx>{`
  .modal.show {
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .modal-backdrop.show {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
  }
  
  .modal-dialog {
    position: relative;
    z-index: 1050;
    margin: auto;
  }
  
  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }
`}</style>

      <style>
        {`
/* Styling for company name input field */
.company-name .form-control {
border: none;
border-bottom: 1px solid #e0e0e0;
border-radius: 0;
box-shadow: none;
padding: 0.5rem 0;
background-color: transparent;
transition: border-color 0.3s;
font-size: 1.1rem;
width: 100%;
}

.company-name .form-control:focus {
border-color: #FC2B5A;
box-shadow: none;
outline: none;
}

.company-name .form-control::placeholder {
opacity: 0.6;
font-style: italic;
}



/* Google Maps autocomplete dropdown styling */
.pac-container {
z-index: 10000 !important;
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
background-color: white;
border-radius: 4px;
margin-top: 2px;
font-family: inherit;
}

.pac-item {
padding: 8px 12px;
cursor: pointer;
}

.pac-item:hover {
background-color: #f5f5f5;
}

.pac-icon {
margin-right: 10px;
}

.pac-item-query {
font-size: 14px;
font-weight: bold;
}

.add-certificate {
width: 40%;
}

.declaration-checkbox {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.declaration-checkbox input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
  accent-color: #6f42c1;
  cursor: pointer;
}

.declaration-checkbox label {
  color: #444;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.declaration-checkbox:hover label {
  color: #000;
}

.intro-options-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.intro-options-modal {
  width: 90%;
  max-width: 500px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.intro-options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.intro-options-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.close-intro-options {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
}

.close-intro-options:hover {
  color: #000;
}

.intro-options-body {
  padding: 20px;
}

.intro-option-card {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.intro-option-card:hover {
  border-color: #FC2B5A;
  box-shadow: 0 2px 12px rgba(111, 66, 193, 0.1);
  transform: translateY(-2px);
}

.intro-option-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FC2B5A;
  margin-right: 15px;
}

.intro-option-text h4 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #333;
}

.intro-option-text p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.intro-options-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 15px 0;
  color: #777;
}

.intro-options-divider::before,
.intro-options-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.intro-options-divider span {
  margin: 0 15px;
  font-size: 0.9rem;
  font-weight: 500;
}

.audio-intro-btn {
  background-color: #fc2b5a;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-right: 15px;
}

// .audio-intro-btn:hover {
//   background-color: #5a349a;
// }

.audio-intro-btn i {
  margin-right: 8px;
  font-size: 1.1rem;
}
@media(max-width: 768px) {
.add-certificate {
max-width: 59%;
width: 100%;
}
}
@media (max-width: 576px) {
  .intro-option-card {
    flex-direction: column;
    text-align: center;
  }
  
  .intro-option-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
}

`}
      </style>

      <style>
        {`
.board-suggestion-list {
  position: absolute;
  background-color: white;
  z-index: 10000;
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 4px 4px;
  font-size: 14px;
}

.board-suggestion-item {
  padding: 3px 12px !important;
  cursor: pointer;
  border-top: 1px solid black;
}

.board-suggestion-item:hover {
  background-color: #f0f0f0;
}

.board-autocomplete-wrapper {
  position: relative;
}
  @media(max-width:768px){
  .mediawidth{
  flex-direction:column;}
  .mediawidth button{
  margin-bottom: 15px;
  font-size:11px;}
  .content h2{
  font-size:1.1rem}
  }
  .add-button{
  height: auto !important}
  .certificate-date-fields{
  display:flex;
  gap:10px;
  }
  .experienceLevel{
  display: flex;
  align-items:center;
  gap:10px;
  
  }
  .experience-dropdown{
  width:auto!important;}
`}
      </style>
      <style jsx>{`
  .resume-viewer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
  }

  .resume-viewer-modal {
    width: 90%;
    max-width: 900px;
    height: 90vh;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
  }

  .modal-header h5 {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
  }

  .close-modal {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #666;
  }

  .modal-body {
    padding: 0;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
    .certificate-item{
    width:100%;
    gap:5px;
    }
    .certificate-item > .form-group:nth-child(2){
    width:100%;
    }

  .resume-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .resume-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    text-align: center;
  }

  .download-link {
    display: inline-flex;
    align-items: center;
    background-color: #fc2b5a;
    color: white;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 4px;
    margin-top: 15px;
    font-weight: 500;
  }

  .download-link:hover {
    background-color: #e61e4d;
  }

  .modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-download {
    display: inline-flex;
    align-items: center;
    background-color: #fc2b5a;
    color: white;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
  }

  .btn-download:hover {
    background-color: #e61e4d;
    color: white;
  }

  .btn-close {
    background-color: #f0f0f0;
    color: #333;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-close:hover {
    background-color: #e0e0e0;
  }
  
  .border-box.view, .border-box.delete {
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .border-box.view:hover, .border-box.delete:hover {
    transform: scale(1.1);
  }
`}</style>
<style>
  {
    `
    input[type="text"], 
input[type="email"], 
input[type="number"],
input[type="tel"],
input[type="date"],
select {
  background-color: transparent !important;
  border: var(--bs-border-width) solid var(--bs-border-color);
}
.card {
    margin-bottom: 2.2rem;
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
    transition: all .3sease-in-out;
}
.card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid rgba(34, 41, 47, 0.125);
    border-radius: 0.5rem;
}
.bg-intext {
    background-color: #FC2B5A;
}
.new-bg-text {
    background-color: #FC2B5A !important;
    border-top-right-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
}
.float-left {
    float: left !important;
}
/* .breadcrumb .breadcrumb-item+.breadcrumb-item:before {
    content: "\e847";
    font-family: 'feather';
    color: #626262;
} */
.breadcrumb .breadcrumb-item+.breadcrumb-item:before {
    content: "\f105"; /* Arrow Right */
  font-family: "Font Awesome 6 Free";
  font-weight: 900; /* Solid icons = 900, Regular = 400 */
  color: #626262;
}
.breadcrumb-item+.breadcrumb-item::before {
    display: inline-block;
    padding-right: 0.5rem;
    color: #b8c2cc;
    content: "/";
}
.breadcrumb .breadcrumb-item+.breadcrumb-item {
    padding-left: 0;
}
.breadcrumb {
    font-size: 1rem;
    font-family: "Montserrat", Helvetica, Arial, serif;
    background-color: transparent;
    padding: 0.5rem 0 0.5rem 1rem !important;
    border-left: 1px solid #d6dce1;
    border-radius: 0;
}
.breadcrumbs-top .breadcrumb {
    margin: 0;
    padding: 0;
}

.breadcrumb>li+li::before {
    padding-right: .6rem;
    padding-left: .6rem;
}
a {
    color: #FC2B5A;
    text-decoration: none;
    background-color: transparent;
}
.mandatory {
    color: red;
}
label {
    font-size: 0.80rem !important;
}
.input-group {
    position: relative;
    display: flex
;
    flex-wrap: wrap;
    align-items: stretch;
    width: 100%;
}
#siteforcomp {
    height: 29px;

}

/* Floating Audio Button */
.floating-audio-btn {
position: absolute;
bottom: 0px;
right: 20px;
background-color: #fc2b5a;
color: white;
width: 130px;
height: 45px;
border-radius: 40px;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
cursor: pointer;
box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
z-index: 100;
transition: all 0.2s;
}

.floating-audio-btn:hover {
transform: translateY(-3px);
box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.floating-audio-btn i {
font-size: 18px;
}

/* Recording Modal Styles */
.recording-modal-overlay {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background-color: rgba(0, 0, 0, 0.5);
display: flex;
align-items: center;
justify-content: center;
z-index: 1000;
}

.recording-modal {
background-color: white;
border-radius: 10px;
width: 90%;
max-width: 600px;
max-height: 90vh;
overflow: hidden;
display: flex;
flex-direction: column;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.recording-modal .modal-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px 20px;
border-bottom: 1px solid #eee;
}

.recording-modal .modal-header h5 {
font-size: 18px;
margin: 0;
font-weight: 600;
}

.recording-modal .close-modal {
background: none;
border: none;
color: #555;
cursor: pointer;
font-size: 18px;
}

.recording-modal .modal-body {
padding: 20px;
flex: 1;
overflow-y: auto;
}

.recording-modal .modal-footer {
padding: 15px 20px;
border-top: 1px solid #eee;
text-align: right;
}

.btn-done {
background-color: #fc2b5a;
color: white;
border: none;
padding: 8px 20px;
border-radius: 4px;
cursor: pointer;
}

.btn-done:hover {
background-color: #e6255c;
}

/* The remaining recording controls and recording items
can use the same CSS you already have */

  /* Resume Builder Container */
.resume-builder-container {
max-width: 1200px;
margin: 0 auto;
padding: 30px;
background-color: #f9f9f9;
border-radius: 10px;
box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

/* Header */
.resume-builder-header {
text-align: center;
padding-bottom: 20px;
border-bottom: 1px solid #eee;
}

.resume-builder-title {
font-size: 28px;
font-weight: 700;
color: #333;
margin-bottom: 15px;
}

/* Profile Strength Meter */
.profile-strength-meter {
max-width: 600px;
margin: 20px auto;
padding: 15px;
background-color: #fff;
border-radius: 8px;
box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.strength-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 10px;
}

.strength-label {
font-size: 16px;
font-weight: 500;
color: #333;
}

.strength-badge {
font-size: 18px;
font-weight: 700;
color: #fc2b5a;
}

.strength-level {
font-size: 14px;
color: #666;
}

.progress {
height: 10px;
background-color: #e9ecef;
border-radius: 5px;
overflow: hidden;
}

.progress-bar {
height: 100%;
border-radius: 5px;
transition: width 0.3s ease;
}

/* Navigation Tabs */
.resume-tabs {
margin-bottom: 25px;
}

.nav-tabs {
border-bottom: 1px solid #ddd;
}

.nav-tabs .nav-link {
border: none;
border-bottom: 3px solid transparent;
border-radius: 0;
color: #555;
font-weight: 500;
padding: 12px 20px;
transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
border-color: transparent;
color: #fc2b5a;
background: none;
}

.nav-tabs .nav-link.active {
color: #fc2b5a;
border-color: #fc2b5a;
background: none;
}

/* Resume Content */
/* .resume-section {
display: none;
} */

.resume-section.active {
display: block;
}

.resume-paper {
background-color: #fff;
border-radius: 8px;
padding: 30px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

}

.section-title {
font-size: 20px;
font-weight: 600;
color: #333;
margin-bottom: 25px;
padding-bottom: 10px;
border-bottom: 2px solid #f1f1f1;
}

/* Personal Info */
.resume-header {
display: flex;
gap: 30px;
margin-bottom: 30px;
}

.profile-image-container {
flex-shrink: 0;
}

.profile-image {
width: 150px;
height: 150px;
border-radius: 50%;
overflow: hidden;
background-color: #f1f1f1;
display: flex;
align-items: center;
justify-content: center;
position: relative;
border: 3px solid #fff;
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.profile-image img {
width: 100%;
height: 100%;
object-fit: cover;
}

.profile-placeholder {
font-size: 60px;
color: #ccc;
}

.image-upload-overlay {
position: absolute;
bottom: 0;
left: 0;
right: 0;
background: rgba(0, 0, 0, 0.6);
color: white;
padding: 5px 0;
text-align: center;
cursor: pointer;
opacity: 0;
transition: opacity 0.3s;
}

.profile-image:hover .image-upload-overlay {
opacity: 1;
}

.profile-info {
flex: 1;
}

.profile-name {
font-size: 26px;
font-weight: 700;
color: #333;
margin-bottom: 8px;
}

.profile-title {
font-size: 18px;
color: #555;
margin-bottom: 15px;
}

.profile-summary {
font-size: 15px;
line-height: 1.5;
color: #666;
margin-bottom: 20px;
}

.contact-info {
display: flex;
flex-wrap: wrap;
gap: 15px;
}

.contact-item {
display: flex;
align-items: center;
gap: 8px;
font-size: 14px;
color: #555;
}

.contact-item i {
color: #fc2b5a;
}

/* Experience Section */
.experience-item, .education-item {
position: relative;
padding: 20px;
margin-bottom: 20px;
background-color: #f9f9f9;
border-radius: 8px;
border-left: 3px solid #fc2b5a;
}

.item-controls {
position: absolute;
top: 0px;
right: 10px;
}

.remove-button {
background: none;
border: none;
color: #dc3545;
cursor: pointer;
font-size: 16px;
}

.remove-button:hover {
color: #bd2130;
}

.job-title, .degree-select {
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 5px;
}

.company-name, .university {
font-size: 16px;
color: #555;
margin-bottom: 10px;
}

.date-range, .passing-year {
font-size: 14px;
color: #777;
margin-bottom: 15px;
display: flex;
align-items: center;
flex-wrap: wrap;
gap: 10px;
}

.date-label {
font-weight: 500;
}

.date-input {
border: 1px solid #ddd;
padding: 5px 10px;
border-radius: 4px;
}

.job-description, .additional-info {
background-color: #fff;
padding: 15px;
border-radius: 6px;
font-size: 14px;
line-height: 1.5;
color: #555;
}

/* Skills Section */
.skills-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 20px;
margin-bottom: 20px;
}

.skill-item {
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.skill-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 10px;
}

.skill-edit {
display: flex;
justify-content: space-between;
width: 100%;
margin-right: 10px;
}

.skill-name {
font-weight: 500;
color: #333;
}

.skill-level {
font-size: 14px;
color: #666;
}

.remove-skill {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

.skill-slider {
width: 100%;
}

/* Additional Sections */
.extras-section {
display: flex;
flex-direction: column;
gap: 30px;
}

.extra-category {
margin-bottom: 25px;
}

.category-title {
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 15px;
padding-bottom: 8px;
border-bottom: 1px solid #eee;
}

/* Languages */
.languages-list {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
gap: 15px;
margin-bottom: 20px;
}

.language-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 12px 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.language-details {
flex: 1;
}

.language-proficiency {
display: flex;
gap: 5px;
margin-top: 5px;
}

.proficiency-dot {
width: 12px;
height: 12px;
border-radius: 50%;
background-color: #ddd;
cursor: pointer;
}

.proficiency-dot.filled {
background-color: #fc2b5a;
}

.remove-language {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Certifications */
.certifications-list {
display: flex;
flex-direction: column;
gap: 15px;
margin-bottom: 20px;
}

.certificate-item {
display: flex;
justify-content: space-between;
align-items: flex-start;
padding-inline: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.certificate-details {
flex: 1;
}

.certificate-name {
font-weight: 500;
margin-bottom: 5px;
}

.certificate-issuer {
font-size: 14px;
color: #666;
}

.remove-certificate {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Projects */
.projects-list {
display: flex;
flex-direction: column;
gap: 15px;
margin-bottom: 20px;
}

.project-item {
display: flex;
justify-content: space-between;
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.project-details {
flex: 1;
}

.project-header {
display: flex;
justify-content: space-between;
margin-bottom: 10px;
}

.project-name {
font-weight: 500;
}

.project-year {
font-size: 14px;
color: #777;
}

.project-description {
font-size: 14px;
line-height: 1.5;
color: #555;
}

.remove-project {
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 24px;
position: absolute;
top: -6px;
right: 0;
}

/* Interests */
.interests-container {
margin-bottom: 20px;
}

.interests-tags {
display: flex;
flex-wrap: wrap;
gap: 10px;
margin-bottom: 15px;
}

.interest-tag {
display: flex;
align-items: center;
background-color: #f1f1f1;
border-radius: 30px;
padding: 6px 15px;
font-size: 14px;
}

.remove-interest {

margin-left: 8px;
background: none;
border: none;
color: #dc3545;
cursor: pointer !important;
font-size: 18px;
position: absolute;
top: -6px;
right: 0px;
}

/* Declaration */
.declaration-container {
padding: 15px;
background-color: #f9f9f9;
border-radius: 8px;
}

.declaration-content {
font-size: 14px;
line-height: 1.5;
color: #555;
min-height: 60px;
}

/* Voice Recording */
.recording-container {
padding: 20px;
background-color: #f9f9f9;
border-radius: 8px;
}

.recording-controls {
text-align: center;
margin-bottom: 30px;
}

.recording-timer {
font-size: 36px;
font-weight: 700;
margin-bottom: 10px;
}

.recording-status {
margin-bottom: 20px;
color: #666;
min-height: 20px;
}

.control-buttons {
display: flex;
justify-content: center;
gap: 15px;
}

.record-button {
padding: 10px 20px;
background-color: #fc2b5a;
color: white;
border: none;
border-radius: 30px;
cursor: pointer;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.record-button:hover {
background-color: #e6255c;
}

.record-button.recording {
background-color: #dc3545;
animation: pulse 1.5s infinite;
}

@keyframes pulse {
0% { transform: scale(1); }
50% { transform: scale(1.05); }
100% { transform: scale(1); }
}

.recordings-list {
margin-top: 30px;
}

.recordings-list h5 {
margin-bottom: 15px;
font-size: 18px;
}

.no-recordings {
text-align: center;
padding: 20px;
color: #777;
font-style: italic;
}

.recording-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px;
background-color: #fff;
border-radius: 8px;
margin-bottom: 10px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recording-info {
flex: 1;
}

.recording-name {
font-weight: 500;
margin-bottom: 5px;
}

.recording-timestamp {
font-size: 12px;
color: #777;
}

.recording-actions {
display: flex;
align-items: center;
gap: 15px;
}

.audio-player {
height: 30px;
}

.delete-recording {
background: none;
border: none;
color: #dc3545;
cursor: pointer;
}

/* Add Button */
.add-button {
padding: 8px 16px;
background-color: #fc2b5a;
color: white;
border: none;
border-radius: 30px;
cursor: pointer;
font-size: 14px;
display: inline-flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.add-button:hover {
background-color: #e6255c;
}

/* Action Buttons */
.resume-actions {
margin-top: 30px;
display: flex;
justify-content: flex-end;
gap: 15px;
}

.upload-resume, .save-resume, .preview-resume {
padding: 10px 20px;
border-radius: 30px;
cursor: pointer;
font-size: 15px;
font-weight: 500;
display: flex;
align-items: center;
gap: 8px;
transition: all 0.2s;
}

.upload-resume {
background-color: #f8f9fa;
color: #333;
border: 1px solid #ddd;
}

.upload-resume:hover {
background-color: #e9ecef;
}

.save-resume {
background-color: #28a745;
color: white;
border: none;
}

.save-resume:hover {
background-color: #218838;
}

.preview-resume {
background-color: #fc2b5a;
color: white;
border: none;
}

.preview-resume:hover {
background-color: #e6255c;
}

/* Editable Content */
[contenteditable=true] {
min-height: 20px;
border: 1px solid transparent;
padding: 3px;
border-radius: 4px;
transition: border 0.2s;
min-width: 10%;
border: 1px solid #ddd;
}

[contenteditable=true]:hover {
border-color: #ddd;
}

[contenteditable=true]:focus {
outline: none;
border-color: #fc2b5a;
background-color: rgba(252, 43, 90, 0.05);
}

[contenteditable=true]:empty:before {
content: attr(data-placeholder);
color: #aaa;
cursor: text;
}
/* Remove Field Option Styling */
.field-container {
position: relative;
}

.remove-field-btn {
position: absolute;
top: 8px;
right: 8px;
background: none;
border: none;
color: #dc3545;
cursor: pointer;
font-size: 16px;
width: 24px;
height: 24px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 50%;
opacity: 0;
transition: opacity 0.2s, background-color 0.2s;
}

.field-container:hover .remove-field-btn {
opacity: 1;
}

.remove-field-btn:hover {
background-color: rgba(220, 53, 69, 0.1);
}

/* Add this to the existing field items */
.experience-item,
.education-item,
.skill-item,
.certificate-item,
.language-item,
.project-item,
.interest-tag {
position: relative;
}
/* Responsive Fixes */
@media (max-width: 768px) {
    .floating-audio-btn{
        top:-85px;
        right: 5px;
    }
.resume-builder-container {
padding: 15px;
}

.resume-header {
flex-direction: column;
align-items: center;
}

.profile-image-container {
margin-bottom: 20px;
}

.profile-info {
text-align: center;
}

.contact-info {
justify-content: center;
}

.skills-grid, .languages-list {
grid-template-columns: 1fr;
}

.recording-item {
flex-direction: column;
align-items: flex-start;
}

.recording-actions {
margin-top: 10px;
width: 100%;
}

.audio-player {
width: 100%;
}

.resume-actions {
flex-direction: column;
}

.upload-resume, .save-resume, .preview-resume {
width: 100%;
justify-content: center;
}
.field-wrapper {
position: relative;
}

.remove-btn {
position: absolute;
top: 6px;
right: 6px;
background: transparent;
border: none;
color: #dc3545;
font-size: 16px;
padding: 2px 6px;
border-radius: 50%;
opacity: 0;
transition: all 0.2s ease-in-out;
}

.field-wrapper:hover .remove-btn {
opacity: 1;
background-color: rgba(220, 53, 69, 0.1);
}
.resume-preview-modal {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.6);
z-index: 999;
display: flex;
justify-content: center;
align-items: center;
}

.resume-preview-content {
background-color: white;
padding: 30px;
border-radius: 12px;
max-height: 80vh;
overflow-y: auto;
width: 90%;
max-width: 600px;
}


}
/* Resume Preview Modal */
.resume-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .resume-preview-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 900px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  
  .resume-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .resume-preview-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  
  .close-preview {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #555;
  }
  
  .resume-preview-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #f5f5f5;
  }
  
  .resume-preview-actions {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  }
  
  .download-resume-btn, .close-preview-btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .download-resume-btn {
    background-color: #28a745;
    color: white;
    border: none;
  }
  
  .close-preview-btn {
    background-color: #f8f9fa;
    color: #333;
    border: 1px solid #ddd;
  }
  
  /* Resume Document Styling */
  .resume-document {
    background-color: white;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    font-family: 'Roboto', Arial, sans-serif;
  }
  
  .resume-document-header {
    margin-bottom: 30px;
  }
  
  .resume-profile-section {
    display: flex;
    gap: 25px;
    margin-bottom: 25px;
  }
  
  .resume-profile-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #f0f0f0;
  }
  
  .resume-profile-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    font-size: 50px;
    color: #aaa;
  }
  
  .resume-header-content {
    flex: 1;
  }
  
  .resume-name {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 5px 0;
    color: #333;
  }
  
  .resume-title {
    font-size: 18px;
    color: #666;
    margin: 0 0 15px 0;
  }
  
  .resume-contact-details {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .resume-contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #555;
  }
  
  .resume-contact-item i {
    color: #fc2b5a;
    font-size: 16px;
  }
  
  .resume-summary {
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 6px;
    margin-bottom: 30px;
  }
  
  .resume-summary p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #555;
  }
  
  .resume-document-body {
    display: flex;
    gap: 30px;
  }
  
  .resume-column {
    flex: 1;
  }
  
  .resume-left-column {
    border-right: 1px solid #eee;
    padding-right: 25px;
  }
  
  .resume-right-column {
    padding-left: 5px;
  }
  
  .resume-section {
    margin-bottom: 25px;
  }
  
  .resume-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #fc2b5a;
    margin: 0 0 15px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  
  .resume-experience-item, .resume-education-item, .resume-project-item {
    margin-bottom: 20px;
  }
  
  .resume-item-header {
    margin-bottom: 8px;
  }
  
  .resume-item-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 3px 0;
    color: #333;
  }
  
  .resume-item-subtitle {
    font-size: 14px;
    color: #666;
    margin: 0 0 3px 0;
  }
  
  .resume-item-period {
    font-size: 12px;
    color: #888;
    margin: 0;
  }
  
  .resume-item-content {
    font-size: 14px;
    color: #555;
    line-height: 1.5;
  }
  
  .resume-skills-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .resume-skill-item {
    margin-bottom: 8px;
  }
  
  .resume-skill-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .resume-skill-bar-container {
    height: 6px;
    background-color: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .resume-skill-bar {
    height: 100%;
    background-color: #fc2b5a;
    border-radius: 3px;
  }
  
  .resume-languages-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .resume-language-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .resume-language-name {
    font-size: 14px;
    font-weight: 500;
  }
  
  .resume-language-level {
    display: flex;
    gap: 3px;
  }
  
  .resume-level-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #f0f0f0;
  }
  
  .resume-level-dot.filled {
    background-color: #fc2b5a;
  }
  
  .resume-certifications-list {
    padding-left: 20px;
    margin: 0;
    font-size: 14px;
    color: #555;
  }
  
  .resume-certifications-list li {
    margin-bottom: 8px;
  }
  
  .resume-project-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 5px 0;
  }
  
  .resume-project-year {
    font-size: 14px;
    font-weight: normal;
    color: #777;
  }
  
  .resume-interests-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .resume-interest-tag {
    display: inline-block;
    padding: 5px 12px;
    background-color: #f5f5f5;
    border-radius: 20px;
    font-size: 13px;
    color: #555;
  }
  
  .resume-declaration {
    border-top: 1px solid #eee;
    margin-top: 30px;
    padding-top: 20px;
  }
  
  .resume-declaration p {
    font-size: 14px;
    color: #555;
    line-height: 1.5;
    font-style: italic;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .resume-document {
      padding: 20px;
    }
    
    .resume-profile-section {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .resume-contact-details {
      justify-content: center;
    }
    
    .resume-document-body {
      flex-direction: column;
    }
    
    .resume-left-column {
      border-right: none;
      padding-right: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    .resume-right-column {
      padding-left: 0;
    }
  }
 

  .pac-container {
    z-index: 10000 !important;
  }
.section-order {
    background-color: #f8f9fa;
    min-height: 100vh;
    padding: 20px;
  }
  
  .section.fadeInUp.resume {
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  /* Heading Container */
  .heading-container {
    margin-bottom: 24px;
  }
  
  .text-emoji-container {
    display: flex;
    align-items: flex-start;
  }
  
  .text-container {
    flex: 1;
  }
  
  .section-heading.title-16-bold {
    font-size: 20px;
    font-weight: 700;
    color: #212529;
    margin: 0 0 8px 0;
  }
  
  .section-sub-heading.title-14-medium {
    font-size: 15px;
    font-weight: 400;
    color: #6c757d;
    margin: 0;
    line-height: 1.5;
  }
  
  /* Uploaded Container */
  .uploaded-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
  }
  
  .file-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .file-name.title-14-bold {
    font-size: 15px;
    font-weight: 600;
    color: #212529;
  }
  
  .uploaded-date.title-14-regular {
    font-size: 13px;
    font-weight: 400;
    color: #6c757d;
  }
  
  /* Action Container */
  .action-container {
    display: flex;
    gap: 12px;
  }
  
  .border-box {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .border-box.download {
    background: rgba(39, 93, 245, 0.1);
  }
  
  .border-box.delete {
    background: rgba(39, 93, 245, 0.1);
  }
  
  .border-box:hover {
    background: rgba(39, 93, 245, 0.2);
  }
  
  /* Resume Upload Container */
  .resume-upload-container {
    text-align: center;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 32px 24px;
    position: relative;
    background: #ffffff;
  }
  
  .upload-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  
  .btn.upload-button {
    background: transparent;
    border: 1px solid #275DF5;
    color: #275DF5;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 24px;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 12px;
    transition: all 0.2s ease;
  }
  
  .btn.upload-button:hover {
    background: rgba(39, 93, 245, 0.05);
  }
  
  .help-text.title-14-medium {
    font-size: 13px;
    font-weight: 400;
    color: #6c757d;
    margin: 0;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .section.fadeInUp.resume {
      margin: 10px;
      padding: 16px;
    }
    
    .uploaded-container {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .action-container {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
    `
  }
</style>
    </div>
  );
};

export default CandidateProfile;