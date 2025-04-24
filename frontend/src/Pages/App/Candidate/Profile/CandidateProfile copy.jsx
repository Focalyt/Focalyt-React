import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './CandidateProfile.css';
import html2pdf from 'html2pdf.js';

const CandidateProfile = () => {
  // State for resume data
  const [user, setUser] = useState({});
  const [voiceIntroduction, setVoiceIntroduction] = useState(false);
  const [experiences, setExperiences] = useState([{
    jobTitle: '',
    companyName: '',
    from: '',
    to: '',
    jobDescription: ''
  }]);

  const [educations, setEducations] = useState([{
    education: '',
    course: '',
    specialization: '',
    university: '',
    passingYear: '',
    schoolName: '',
    collegeName: ''
  }]);
  const [skills, setSkills] = useState([{
    skillName: '',
    skillPercent: 0
  }]);
  const [certificates, setCertificates] = useState([{
    certificateName: '',
    orgName: ''
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


  // Backend URL
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

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

  // सामान्य ऑटोकम्पलीट इनिशियलाइज़ फंक्शन
  const initializeAutocomplete = (inputId, stateUpdater, index, propertyName) => {
    setTimeout(() => {
      const inputElement = document.getElementById(inputId);
      console.log(`Trying to initialize autocomplete for ${inputId}`);

      if (!inputElement || !window.google || !window.google.maps || !window.google.maps.places) {
        console.log(`Input element ${inputId} not found or Google Maps not loaded`);
        return; // Not ready yet
      }

      try {
        // Create the autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
          types: ['establishment'], // This ensures we only get establishments
          componentRestrictions: { country: 'in' }
        });

        // Add styling to ensure visibility
        inputElement.style.backgroundColor = "#ffffff";
        inputElement.style.color = "#000000";

        // When a place is selected
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place) {
            return;
          }

          // Get the name of the place
          const placeName = place.name || '';

          // Update the state using the provided updater function
          stateUpdater(prev => {
            const updated = [...prev];
            updated[index][propertyName] = placeName;
            return updated;
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
          initializeAutocomplete(`university-name-${index}`, setEducations, index, 'university');
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
      input.style.zIndex = "1000";

      // Add change event listener
      autocomplete.addListener('place_changed', () => {
        console.log("Place changed event fired");
        const place = autocomplete.getPlace();

        if (!place || !place.geometry || !place.geometry.location) {
          console.warn('Invalid place data selected.');
          return;
        }

        console.log("Selected place:", place);

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const fullAddress = place.formatted_address || place.name || input.value;

        let city = '', state = '', pincode = '';

        if (Array.isArray(place.address_components)) {
          place.address_components.forEach((component) => {
            const types = component.types.join(',');
            if (types.includes("postal_code")) pincode = component.long_name;
            if (types.includes("locality")) city = component.long_name;
            if (types.includes("administrative_area_level_1")) state = component.long_name;
            if (!city && types.includes("sublocality_level_1")) city = component.long_name;
          });
        }

        console.log("Extracted data:", { fullAddress, city, state, pincode, lat, lng });

        setProfileData(prev => ({
          ...prev,
          personalInfo: {
            ...(prev.personalInfo || {}),
            location: {
              fullAddress,
              state,
              city,
              pincode,
              latitude: lat,
              longitude: lng
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
    if (educations.some(edu => edu.degree || edu.university)) strength += 15;
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

      mediaRecorder.onstop = () => {
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
        resetTimer();

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
      const token = localStorage.getItem('token');
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');

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
          location: profileData?.personalInfo?.location || {},
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
            orgName: c.orgName || ''
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
          FromDate: e.FromDate || '',
          ToDate: e.ToDate || '',
          jobDescription: e.jobDescription || ''
        })),
      
        qualifications: educations.map(edu => ({
          education: edu.education,
          boardName: edu.boardName,
          schoolName: edu.schoolName,
          collegeName: edu.collegeName,
          universityName: edu.university,
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

          // Set education options
          setEducationList(data.educations || []);

          // Set candidate data
          const candidate = data.candidate;
          if (candidate) {
            setProfileData(candidate);

            // Map backend data to frontend state
            setUser({
              name: candidate.name,
              image: candidate.personalInfo?.image,
              resume: candidate.personalInfo?.resume
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
                  {user?.image ? (
                    <img src={user.image} alt="Profile" />
                  ) : (
                    <div className="profile-placeholder">
                      <i className="bi bi-person"></i>
                    </div>
                  )}
                  <div className="image-upload-overlay">
                    <label>
                      <i className="bi bi-camera"></i>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          // Handle image upload
                          if (e.target.files && e.target.files[0]) {
                            // You would typically upload this to your server
                            // For now, we'll just update the local state
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setUser(prev => ({
                                ...prev,
                                image: reader.result
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
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

                <div className="contact-info">
                  <div className="contact-item">
                    <i className="bi bi-telephone"></i>
                    {createEditable(profileData?.mobile || '', 'Phone Number', (val) => {
                      setProfileData(prev => ({
                        ...prev,
                        mobile: val
                      }));
                    })}
                  </div>
                  <div className="contact-item">
                    <i className="bi bi-envelope"></i>
                    {createEditable(profileData?.email || '', 'Email Address', (val) => {
                      setProfileData(prev => ({
                        ...prev,
                        email: val
                      }));
                    })}
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
                    <input
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
                    value={profileData?.personalInfo?.location?.fullAddress || ''}
                    onChange={(e) => {
                      setProfileData(prev => ({
                        ...prev,
                        personalInfo: {
                          ...(prev.personalInfo || {}),
                          location: {
                            ...(prev.personalInfo?.location || {}),
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
                    type="month"
                    value={experience.FromDate || ''}
                    onChange={(e) => {
                      const updatedExperiences = [...experiences];
                      updatedExperiences[index].FromDate = e.target.value;
                      setExperiences(updatedExperiences);
                    }}
                    className="date-input"
                  />

                  <span className="date-label">To:</span>
                  <input
                    type="month"
                    value={experience.ToDate || ''}
                    onChange={(e) => {
                      const updatedExperiences = [...experiences];
                      updatedExperiences[index].ToDate = e.target.value;
                      setExperiences(updatedExperiences);
                    }}
                    className="date-input"
                  />
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

                        <div className="form-group mb-2">
                          <label>Passing Year</label>
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


                        <div className="form-group mb-2">
                          <label>Passing Year</label>
                          <input
                            type="text"
                            autoComplete="off"
                            id={`passing-year-${index}`}
                            className="form-control"
                            value={edu.passingYear || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].passingYear = e.target.value;
                              setEducations(updated);
                            }}
                          />

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
                        {/* <div className="form-group mb-2">
                          <label>Specialization</label>
                          <input
                            type="text"
                            className="form-control"
                            value={edu.specialization.name || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].specialization = e.target.value;
                              setEducations(updated);
                            }}
                          />
                        </div> */}
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

                        <div className="form-group mb-2">
                          <label>Passing Year</label>
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
                            value={edu.university || ''}
                            onChange={(e) => {
                              const updated = [...educations];
                              updated[index].university = e.target.value;
                              setEducations(updated);
                            }}
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

                        <div className="form-group mb-2">
                          <label>Passing Year</label>
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
                            {createEditable(certificate.certificateName || '', 'Certificate Name', (val) => {
                              const updated = [...certificates];
                              updated[index].certificateName = val;
                              setCertificates(updated);
                            })}
                          </div>
                          <div className="certificate-issuer">
                            {createEditable(certificate.orgName || '', 'Issuing Organization, Year', (val) => {
                              const updated = [...certificates];
                              updated[index].orgName = val;
                              setCertificates(updated);
                            })}
                          </div>
                        </div>
                        <button
                          className="remove-certificate"
                          onClick={() => {
                            const updated = [...certificates];
                            if (certificates.length === 1) {
                              updated[0] = { certificateName: '', orgName: '' };
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
                      onClick={() => setCertificates([...certificates, { certificateName: '', orgName: '' }])}
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
                  className="declaration-content"
                  contentEditable
                  suppressContentEditableWarning={true}
                  data-placeholder="I hereby declare that all the information provided above is true to the best of my knowledge."
                  onBlur={(e) => setDeclaration({
                    ...declaration,
                    text: e.target.innerText
                  })}
                >
                  {declaration.text}
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
        <div className="audio-btn upload-resume" onClick={() => setShowRecordingModal(true)}>
          <i className="bi bi-mic-fill"></i>
          <span>Add Voice Introduction</span>
        </div>
        <label className="upload-resume">
          <i className="bi bi-upload me-2"></i> Upload Resume
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
          />
        </label>

        <button className="save-resume" onClick={handleSaveCV}>
          <i className="bi bi-save me-2"></i> Save Resume
        </button>

        <button className="preview-resume" onClick={() => setShowPreview(true)}>
          <i className="bi bi-eye me-2"></i> Preview Resume
        </button>
      </div>

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
                        src={`${process.env.REACT_APP_BUCKET_URL}/${user.image}`}
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
                        {profileData?.personalInfo?.title || 'Professional Title'}
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
                        {profileData?.personalInfo?.location?.fullAddress && (
                          <div className="resume-contact-item">
                            <i className="bi bi-geo-alt-fill"></i>
                            <span>{profileData.personalInfo.location.fullAddress}</span>
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
                    {experiences.length > 0 && experiences.some(exp => exp.jobTitle || exp.companyName || exp.jobDescription) && (
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
                                {(exp.from || exp.to) && (
                                  <p className="resume-item-period">
                                    {exp.from || 'Start Date'} - {exp.to || 'Present'}
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
                    )}
                    {/* Education Section */}
                    {educations.length > 0 && educations.some(edu =>
                      edu.education || edu.course || edu.schoolName || edu.collegeName || edu.university || edu.passingYear
                    ) && (
                        <div className="resume-section">
                          <h2 className="resume-section-title">Education</h2>

                          {educations.map((edu, index) => (
                            (edu.education || edu.course || edu.schoolName || edu.collegeName || edu.university || edu.passingYear) && (
                              <div className="resume-education-item" key={`resume-edu-${index}`}>
                                <div className="resume-item-header">
                                  {edu.education && (
                                    <h3 className="resume-item-title">
                                      {educationList.find(e => e._id === edu.education)?.name || 'Education'}
                                    </h3>
                                  )}

                                  {typeof edu.course === 'string' && edu.course && (
                                    <h3 className="resume-item-title">{edu.course}</h3>
                                  )}
                                  {edu.university && (
                                    <p className="resume-item-subtitle">{edu.university}</p>
                                  )}
                                  {(edu.schoolName && !edu.university) && (
                                    <p className="resume-item-subtitle">{edu.schoolName}</p>
                                  )}
                                  {edu.collegeName && (
                                    <p className="resume-item-subtitle">{edu.collegeName}</p>
                                  )}
                                  {edu.passingYear && (
                                    <p className="resume-item-period">{edu.passingYear}</p>
                                  )}
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
                              <li key={`resume-cert-${index}`}>
                                <strong>{cert.certificateName || 'Certificate'}</strong>
                                {cert.orgName && <span> - {cert.orgName}</span>}
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
border-color: #6f42c1;
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

@media(max-width: 768px) {
.add-certificate {
max-width: 59%;
width: 100%;
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
  
`}
      </style>

    </div>
  );
};

export default CandidateProfile;