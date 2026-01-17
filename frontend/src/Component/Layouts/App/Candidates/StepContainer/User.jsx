import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';


const User = ({handleSaveCV, onCloseModal}) => {
  // Initial option state - check localStorage first to see if user already chose an option
  const [showInitialOption, setShowInitialOption] = useState(() => {
    // Check if resume was already uploaded or build option was selected
    const hasResumeUploaded = localStorage.getItem('resumeUploaded') === 'true';
    const resumeOptionSelected = localStorage.getItem('resumeOptionSelected');
    return !hasResumeUploaded && !resumeOptionSelected;
  });
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem('resumeOptionSelected') || null;
  }); // 'upload' or 'build'
  
  // Current step state
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadDate, setUploadDate] = useState("");



  // For tracking form completion status
  const [formData, setFormData] = useState({
    workExperience: { completed: false },
    education: { completed: false },
    certificates: { completed: false },
    additional: { completed: false }
  });

  // State for resume data
  const [user, setUser] = useState({});
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

  const [certificates, setCertificates] = useState([{
    certificateName: '',
    orgName: '',
    month: '',
    year: '',
    orgLocation: {
      type: 'Point',
      coordinates: [0, 0],
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

  // State for UI control
  const [profileData, setProfileData] = useState({});
  const [educationList, setEducationList] = useState([]);
  const [isExperienced, setIsExperienced] = useState(true);
  const [declaration, setDeclaration] = useState({
    isChecked: false,
    text: 'I hereby declare that all the information provided above is true to the best of my knowledge.'
  });


  // States for autocomplete and suggestions
  const [boardSuggestions, setBoardSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(null);
  const [coursesList, setCoursesList] = useState({});
  const [specializationsList, setSpecializationsList] = useState({});

  // Backend URL
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;


  // Fetch educational options on component mount
  useEffect(() => {
    const fetchEducationOptions = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/educationlist`);
        if (response.data?.status && response.data.data?.educationlist) {
          // Sort education list by class level (ascending order: 1-5, 6-9, 10, 12, then higher)
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
          
          const sortedEducations = (response.data.data.educationlist || []).sort((a, b) => {
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
        } else {
          console.error("Education API error:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching education options:", error);
      }
    };

    fetchEducationOptions();
  }, [backendUrl]);

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

        if (!place || !place.geometry || !place.geometry.location) {
          console.warn('Invalid place data selected.');
          return;
        }

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

        // 👇 Set directly into certificates[index]
        setCertificates(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            orgName: place.name || '', // ✅ Set orgName
            orgLocation: {
              type: 'Point',
              coordinates: [lng, lat],
              city,
              state,
              fullAddress
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

  // useEffect में आप निम्न प्रकार से इसे कॉल कर सकते हैं

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
          if (!place || !place.geometry || !place.geometry.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const fullAddress = place.formatted_address || place.name || inputElement.value;

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

          // Set name and location
          stateUpdater(prev => {
            const updated = [...prev];
            updated[index][propertyName] = place.name || '';

            const locationKey = propertyName === 'schoolName' ? 'schoolLocation' :
              propertyName === 'collegeName' ? 'collegeLocation' :
                propertyName === 'universityName' ? 'universityLocation' :
                  propertyName === 'orgName' ? 'orgLocation' : null;

            if (locationKey) {
              updated[index][locationKey] = {
                type: 'Point',
                coordinates: [lng, lat],
                city,
                state,
                fullAddress
              };
            }

            return updated;
          });
        });

        console.log(`Autocomplete initialized for ${inputId}`);
      } catch (error) {
        console.error(`Error initializing autocomplete for ${inputId}:`, error);
      }
    }, 300);
  };






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
  // useEffect में ऐसा करें


  const initializeCompanyAutocomplete = (inputId, index) => {
    setTimeout(() => {
      const companyInput = document.getElementById(inputId);
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

        // Close modal if resume was uploaded directly - same pattern as Build Resume steps
        if (schemaFieldName === 'resume') {
          // Close modal immediately in frontend first (same as Build Resume's finally block does)
          if (onCloseModal) {
            onCloseModal();
          }
          
          // Update backend to set showProfileForm: true so modal doesn't show after reload
          // Note: showProfileForm: true means modal is closed (modal shows when showProfileForm is false)
          // Use saveProfile endpoint with minimal data just to update showProfileForm
          try {
            const updateShowProfileRes = await axios.post(`${backendUrl}/candidate/saveProfile`, {
              showProfileForm: true
            }, {
              headers: { 'x-auth': token }
            });
            console.log('showProfileForm updated:', updateShowProfileRes.data);
          } catch (updateErr) {
            console.error('Error updating showProfileForm:', updateErr);
            // Continue anyway - modal is already closed in frontend
          }
          
          return; // Don't reload here, modal is already closed
        }

        window.location.reload();

      }
    } catch (err) {
      console.error(`${schemaFieldName} update failed:`, err);
    }
  };

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

        // Note: reload and modal close are handled in updateFileInProfile
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert('Failed to upload resume. Please try again.');
    }
  };

  // Handle board input change
  const handleBoardInputChange = async (value, index) => {
    const updated = [...educations];
    updated[index].boardName = value; // temporary label
    updated[index].board = ''; // reset ID
    setEducations(updated);

    if (value.length >= 2) {
      try {
        const res = await axios.get(`${backendUrl}/api/boards?search=${value}`);
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

  // Fetch courses by education
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

  // Fetch specializations by course
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

  // Handle education change
  const handleEducationChange = async (e, index) => {
    const educationId = e.target.value; const updated = [...educations];
    updated[index].education = educationId;
    updated[index].course = '';
    updated[index].specialization = '';
    setEducations(updated);

    const educationName = educationList.find(ed => ed._id === educationId)?.name;

    if (educationName === 'ITI') {
      const courseRes = await fetchCoursesByEducation(educationId);
      if (courseRes && courseRes.length > 0) {
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

  // Handle course change
  const handleCourseChange = async (e, index) => {
    const courseId = e.target.value;

    const updated = [...educations];
    updated[index].course = courseId;
    // Reset specialization since course changed
    updated[index].specialization = '';
    setEducations(updated);

    // Fetch specializations
    if (courseId) {
      const specializations = await fetchSpecializationsByCourse(courseId);

      // Store specializations list in state
      setSpecializationsList(prevState => ({
        ...prevState,
        [index]: specializations
      }));
    }
  };

  // Update education details when education changes
  useEffect(() => {
    if (educations.length > 0 && educationList.length > 0) {
      educations.forEach(async (edu, index) => {
        const educationName = educationList.find(q => q._id === edu.education)?.name;

        // If Graduation or other higher education, fetch course list
        if (educationName && !['Upto 5th', '6th - 9th Class', '10th', '12th', 'ITI'].includes(educationName)) {
          const courseRes = await fetchCoursesByEducation(edu.education);
          if (courseRes && courseRes.length > 0) {
            setCoursesList(prev => ({
              ...prev,
              [index]: courseRes
            }));
          }

          // Then fetch specialization
          if (edu.course) {
            const specRes = await fetchSpecializationsByCourse(edu.course);
            if (specRes && specRes.length > 0) {
              setSpecializationsList(prev => ({
                ...prev,
                [index]: specRes
              }));
            }
          }
        }

        // If ITI, handle that case separately
        if (educationName === 'ITI') {
          const courseRes = await fetchCoursesByEducation(edu.education);
          if (courseRes && courseRes.length > 0) {
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
            if (specRes && specRes.length > 0) {
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
      className="editable-content"
    >
      {content}
    </div>
  );

  // Render education fields based on education type
  const renderEducationFields = (edu, index) => {
    // Get education name based on selected ID
    const educationName = educationList.find(q => q._id === edu.education)?.name || '';

    // Case 1: Upto 5th or 6th - 9th Class
    if (['Upto 5th', '6th - 9th Class'].includes(educationName)) {
      return null;
    }

    // Case 2: 10th Class
    else if (educationName === '10th') {
      return (
        <>
          <div className="form-group">
            <label className="form-label">Board</label>
            <div className="board-autocomplete-wrapper">
              <input
                type="text"
                className="form-input"
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
          </div>

          <div className="form-group">
            <label className="form-label">School Name</label>
            <input
              type="text"
              id={`school-name-${index}`}
              className="form-input"
              value={edu.schoolName || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].schoolName = e.target.value;
                setEducations(updated);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passing Year</label>
            <input
              type="text"
              className="form-input"
              value={edu.passingYear || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].passingYear = e.target.value;
                setEducations(updated);
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Marks (%)</label>
            <input
              type="text"
              className="form-input"
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
          <div className="form-group">
            <label className="form-label">Board</label>
            <div className="board-autocomplete-wrapper">
              <input
                type="text"
                className="form-input"
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
          </div>

          <div className="form-group">
            <label className="form-label">Specialization</label>
            <select
              className="form-input"
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

          <div className="form-group">
            <label className="form-label">School Name</label>
            <input
              type="text"
              id={`school-name-${index}`}
              className="form-input"
              value={edu.schoolName || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].schoolName = e.target.value;
                setEducations(updated);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passing Year</label>
            <input
              type="text"
              className="form-input"
              value={edu.passingYear || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].passingYear = e.target.value;
                setEducations(updated);
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Marks (%)</label>
            <input
              type="text"
              className="form-input"
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
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <select
                className="form-input"
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

          <div className="form-group">
            <label className="form-label">ITI Name</label>
            <input
              id={`iti-name-${index}`}
              type="text"
              className="form-input"
              value={edu.collegeName || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].collegeName = e.target.value;
                setEducations(updated);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passing Year</label>
            <input
              type="text"
              className="form-input"
              value={edu.passingYear || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].passingYear = e.target.value;
                setEducations(updated);
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Marks (%)</label>
            <input
              type="text"
              className="form-input"
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
            <div className="form-group">
              <label className="form-label">Course</label>
              <select
                className="form-input"
                value={edu.course || ''}
                onChange={(e) => handleCourseChange(e, index)}
              >
                <option value="">Select Course</option>
                {coursesList[index].map((course) => (
                  <option key={course._id} value={course._id}>{course.name}</option>
                ))}
              </select>
            </div>
          )}

          {specializationsList[index] && specializationsList[index].length > 0 && (
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <select
                className="form-input"
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

          <div className="form-group">
            <label className="form-label">University/Technical Boards</label>
            <input
              id={`university-name-${index}`}
              type="text"
              className="form-input"
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

          <div className="form-group">
            <label className="form-label">College Name</label>
            <input
              type="text"
              id={`college-name-${index}`}
              className="form-input"
              value={edu.collegeName || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].collegeName = e.target.value;
                setEducations(updated);
              }}
              onFocus={() => initializeAutocomplete(`college-name-${index}`, setEducations, index, 'collegeName')}

            />
          </div>

          <div className="form-group">
            <label className="form-label">Passing Year</label>
            <input
              id={`passing-year-${index}`}
              type="text"
              className="form-input"
              value={edu.passingYear || ''}
              onChange={(e) => {
                const updated = [...educations];
                updated[index].passingYear = e.target.value;
                setEducations(updated);
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Marks (%)</label>
            <input
              type="text"
              className="form-input"
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

    return null;
  };

  // Handle form submission


  // Navigation functions
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1) {
      // If on step 1, go back to initial option screen
      setShowInitialOption(true);
      setSelectedOption(null);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      // Validate work experience details
      setFormData(prev => ({ ...prev, workExperience: { completed: true } }));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate education details
      if (educations.length > 0 && !educations[0].education) {
        alert("Please select at least one education qualification");
        return;
      }
      setFormData(prev => ({ ...prev, education: { completed: true } }));
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Validate certificates
      setFormData(prev => ({ ...prev, certificates: { completed: true } }));
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Submit form
      setFormData(prev => ({ ...prev, additional: { completed: true } }));
      handleSaveCV(profileData, skills, certificates, languages, projects, interests, experiences, isExperienced, educations);
    }
  };

  const goToStep = (stepNumber) => {
    if (
      stepNumber === 1 ||
      (stepNumber === 2 && formData.workExperience.completed) ||
      (stepNumber === 3 && formData.education.completed) ||
      (stepNumber === 4 && formData.certificates.completed)
    ) {
      setCurrentStep(stepNumber);
    }
  };

  // Fetch profile data on component mount
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

            // Check experience status
            setIsExperienced(candidate.isExperienced);

            // Check if resume already exists - if yes, hide initial option screen
            const hasResume = Array.isArray(candidate.personalInfo?.resume) && candidate.personalInfo.resume.length > 0;
            if (hasResume) {
              localStorage.setItem('resumeUploaded', 'true');
              localStorage.setItem('resumeOptionSelected', 'upload');
              setShowInitialOption(false);
              setSelectedOption('upload');
            }

            // Update form completion status
            setFormData({
              workExperience: { completed: true },
              education: { completed: candidate.qualifications && candidate.qualifications.length > 0 },
              certificates: { completed: candidate.personalInfo?.certifications && candidate.personalInfo.certifications.length > 0 },
              additional: { completed: false }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [backendUrl]);

  // Handle option selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowInitialOption(false);
    localStorage.setItem('resumeOptionSelected', option);
  };

  // Handle resume upload directly
  const handleDirectResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name;
    const fileSize = file.size;

    // Validate file type and size
    const allowedExtensions = /\.(docx?|pdf|jpg|jpeg|png)$/i;
    if (!allowedExtensions.test(fileType)) {
      alert("Upload the CV in .docx, .doc, .jpg, .jpeg, .png or pdf format");
      e.target.value = '';
      return;
    }

    if (fileSize > 5 * 1024 * 1024) {
      alert("Uploaded CV size should be less than 5MB");
      e.target.value = '';
      return;
    }

    setSelectedOption('upload');
    // Set localStorage flags before upload
    localStorage.setItem('resumeUploaded', 'true');
    localStorage.setItem('resumeOptionSelected', 'upload');
    setShowInitialOption(false);
    
    try {
      await uploadCV(file, 'resume');
      // Note: Success alert is shown in updateFileInProfile, no need to show here
      // Page will reload after upload, and localStorage flags will persist
    } catch (error) {
      console.error('Resume upload error:', error);
      alert('Failed to upload resume. Please try again.');
      // On error, remove flags so user can try again
      localStorage.removeItem('resumeUploaded');
      localStorage.removeItem('resumeOptionSelected');
      setShowInitialOption(true);
      setSelectedOption(null);
    }
  };

  return (
    <>

      <div className="user-container">
        {/* Initial Option Screen */}
        {showInitialOption && (
          <div className="initial-option-screen">
            <div className="option-card">
              <h2 className="option-title">Choose Your Resume Option</h2>
              <p className="option-subtitle">Select how you'd like to proceed with your resume</p>
              
              <div className="option-buttons">
                <button
                  className="option-btn upload-option-btn"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                    input.onchange = (e) => {
                      handleDirectResumeUpload(e);
                      setShowInitialOption(false);
                    };
                    input.click();
                  }}
                >
                  <i className="bi bi-upload"></i>
                  <span>Upload Your Resume</span>
                  <small>Upload your existing resume file</small>
                </button>

                <button
                  className="option-btn build-option-btn"
                  onClick={() => handleOptionSelect('build')}
                >
                  <i className="bi bi-file-earmark-text"></i>
                  <span>Build Your Resume</span>
                  <small>Create your resume step by step</small>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Text and Back Button - Only show if build option is selected */}
        {!showInitialOption && selectedOption === 'build' && (
          <>
            <div className="step-header-container">
              <div className="StepHeader"> 
                Your Complete Profile will help you to select the best job for you.
              </div>
              <button className="top-back-btn" onClick={handleBack}>
                <i className="bi bi-arrow-left"></i> Back
              </button>
            </div>
            
            <div className="step-progress-container">
              <div className="newloader">
                <div
                  className="bar"
                  style={{
                    width: currentStep === 1 ? '0%' :
                      currentStep === 2 ? '33%' :
                        currentStep === 3 ? '66%' : '100%'
                  }}
                ></div>
                <div className="check-bar-container">
                  <div
                    className={`check ${formData.workExperience.completed ? 'completed' : currentStep === 1 ? 'active' : ''}`}
                    onClick={() => goToStep(1)}
                  >
                    {formData.workExperience.completed ? (
                      <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                        <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                      </svg>
                    ) : (
                      <span>1</span>
                    )}
                  </div>
                  <div
                    className={`check ${formData.education.completed ? 'completed' : currentStep === 2 ? 'active' : ''}`}
                    onClick={() => goToStep(2)}
                  >
                    {formData.education.completed ? (
                      <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                        <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                      </svg>
                    ) : (
                      <span>2</span>
                    )}
                  </div>
                  <div
                    className={`check ${formData.certificates.completed ? 'completed' : currentStep === 3 ? 'active' : ''}`}
                    onClick={() => goToStep(3)}
                  >
                    {formData.certificates.completed ? (
                      <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                        <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                      </svg>
                    ) : (
                      <span>3</span>
                    )}
                  </div>
                  <div
                    className={`check ${formData.additional.completed ? 'completed' : currentStep === 4 ? 'active' : ''}`}
                    onClick={() => goToStep(4)}
                  >
                    {formData.additional.completed ? (
                      <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                        <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                      </svg>
                    ) : (
                      <span>4</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="step-labels">
                <div className={`step-label ${currentStep === 1 ? 'active' : ''}`}>Work Experience</div>
                <div className={`step-label ${currentStep === 2 ? 'active' : ''}`}>Education</div>
                <div className={`step-label ${currentStep === 3 ? 'active' : ''}`}>Certificates</div>
                <div className={`step-label ${currentStep === 4 ? 'active' : ''}`}>Additional</div>
              </div>
            </div>

            {/* Form Content */}
            <div className="form-container">
              {/* Work Experience Step */}
              {currentStep === 1 && (
                <div className="step-content">
              <h2>Work Experience</h2>
              <p className="form-description">Tell us about your work history</p>

              <div className="form-group mb-4">
                <label className="form-label">Experience Level:</label>
                <select
                  className="form-input experience-dropdown"
                  value={isExperienced ? "Experienced" : "Fresher"}
                  onChange={(e) => {
                    const isExp = e.target.value === "Experienced";
                    setIsExperienced(isExp);
                    setProfileData(prev => ({
                      ...prev,
                      isExperienced: isExp
                    }));

                    if (!isExp) {
                      setExperiences([{
                        jobTitle: 'Fresher',
                        companyName: '',
                        from: '',
                        to: '',
                        jobDescription: '',
                        currentlyWorking: false
                      }]);
                    } else if (experiences.length === 1 && experiences[0].jobTitle === 'Fresher') {
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

              {!isExperienced ? (
                <div className="fresher-section">
                  <p className="fresher-notice">You've selected 'Fresher'. You can proceed to the next step.</p>
                </div>
              ) : (
                experiences.map((exp, index) => (
                  <div className="experience-item" key={`experience-${index}`}>
                    {experiences.length > 1 && (
                      <button
                        className="remove-button"
                        onClick={() => {
                          const updated = [...experiences];
                          updated.splice(index, 1);
                          setExperiences(updated);
                        }}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    )}

                    <div className="form-group">
                      <label className="form-label">Job Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={exp.jobTitle || ''}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[index].jobTitle = e.target.value;
                          setExperiences(updated);
                        }}
                        placeholder="e.g. Software Developer"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        id={`company-name-${index}`}
                        className="form-input"
                        value={exp.companyName || ''}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[index].companyName = e.target.value;
                          setExperiences(updated);
                        }}
                        placeholder="e.g. XYZ Technologies"
                        onFocus={() => initializeCompanyAutocomplete(`company-name-${index}`, index)}

                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">From</label>
                        <input
                          type="date"
                          className="form-input"
                          value={exp.from ? new Date(exp.from).toISOString().slice(0, 10) : ''}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].from = e.target.value ? new Date(e.target.value) : null;
                            setExperiences(updated);
                          }}
                        />
                      </div>

                      <div className="form-group half-width">
                        <label className="form-label">To</label>
                        <input
                          type="date"
                          className="form-input"
                          value={exp.to ? new Date(exp.to).toISOString().slice(0, 10) : ''}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].to = e.target.value ? new Date(e.target.value) : null;
                            setExperiences(updated);
                          }}
                          disabled={exp.currentlyWorking}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-check-label">
                        <input
                          type="checkbox"
                          checked={exp.currentlyWorking || false}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[index].currentlyWorking = e.target.checked;
                            if (e.target.checked) {
                              updated[index].to = null;
                            }
                            setExperiences(updated);
                          }}
                        />
                        I currently work here
                      </label>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Job Description</label>
                      <textarea
                        className="form-textarea"
                        value={exp.jobDescription || ''}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[index].jobDescription = e.target.value;
                          setExperiences(updated);
                        }}
                        placeholder="Describe your responsibilities and achievements"
                      ></textarea>
                    </div>

                    {index < experiences.length - 1 && <hr className="experience-divider" />}
                  </div>
                ))
              )}

              {isExperienced && (
                <button
                  className="add-button"
                  onClick={() => setExperiences([...experiences, {
                    jobTitle: '',
                    companyName: '',
                    from: null,
                    to: null,
                    jobDescription: '',
                    currentlyWorking: false
                  }])}
                >
                  + Add Another Experience
                </button>
              )}

              <button className="continue-btn" onClick={handleContinue}>Continue to Education</button>
            </div>
          )}

              {/* Education Step */}
              {currentStep === 2 && (
            <div className="step-content">
              <h2>Education</h2>
              <p className="form-description">Tell us about your educational background</p>

              {educations.map((edu, index) => (
                <div className="education-item" key={`education-${index}`}>
                  {educations.length > 1 && (
                    <button
                      className="remove-button"
                      onClick={() => {
                        const updated = [...educations];
                        updated.splice(index, 1);
                        setEducations(updated);
                      }}
                    >
                      <i className="bi bi-trash"></i> Remove
                    </button>
                  )}

                  <div className="form-group">
                    <label className="form-label">Education Level <span className="required">*</span></label>
                    <select
                      className="form-input"
                      value={edu.education || ''}
                      onChange={(e) => handleEducationChange(e, index)}
                    >
                      <option value="">Select Education Level</option>
                      {Array.isArray(educationList) && educationList.map((e) => (
                        <option key={e._id} value={e._id}>{e.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Render additional fields based on selected education type */}
                  {renderEducationFields(edu, index)}

                  {index < educations.length - 1 && <hr className="education-divider" />}
                </div>
              ))}

              <button
                className="add-button me-3"
                onClick={() => setEducations([...educations, {
                  education: '',
                  universityName: '',
                  boardName: '',
                  collegeName: '',
                  schoolName: '',
                  course: '',
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
                }])}
              >
                + Add Another Education
              </button>

              <button className="continue-btn" onClick={handleContinue}>Continue to Certificates</button>
            </div>
          )}

              {/* Certificates Step */}
              {currentStep === 3 && (
            <div className="step-content">
              <h2>Certifications</h2>
              <p className="form-description">Add your certifications and professional qualifications</p>

              <div className="certifications-container">
                {certificates.map((cert, index) => (
                  <div className="certificate-item" key={`certificate-${index}`} style={{ flexDirection: 'column' }}>
                    <div className='certificateFieldMobile' style={{ display: 'flex', gap: '15px', width: '100%' }}>
                      <div className="form-group">
                        <label className="form-label">Certificate Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={cert.certificateName || ''}
                          onChange={(e) => {
                            const updated = [...certificates];
                            updated[index].certificateName = e.target.value;
                            setCertificates(updated);
                          }}
                          placeholder="Certificate name"

                        />
                      </div>

                      <div className="form-group w-100">
                        <label className="form-label">Issuing Organization</label>
                        <input
                          type="text"
                          id={`issuing-organization-${index}`}
                          className="form-input"
                          value={cert.orgName || ''}
                          onChange={(e) => {
                            const updated = [...certificates];
                            updated[index].orgName = e.target.value;
                            setCertificates(updated);
                          }}
                          placeholder="Issuing organization"
                          onFocus={() => initializeAutocomplete(`issuing-organization-${index}`, setCertificates, index, 'orgName')}

                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group half-width">
                        <label className="form-label">Month</label>
                        <select
                          className="form-input"
                          value={cert.month || ''}
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

                      <div className="form-group half-width">
                        <label className="form-label">Year</label>
                        <select
                          className="form-input"
                          value={cert.year || ''}
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

                    {certificates.length > 1 && (
                      <button
                        className="remove-button"
                        onClick={() => {
                          const updated = [...certificates];
                          updated.splice(index, 1);
                          setCertificates(updated);
                        }}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    )}

                    {index < certificates.length - 1 && <hr className="certificate-divider" />}
                  </div>
                ))}

                <button
                  className="add-button small-add-button"
                  onClick={() => setCertificates([...certificates, { certificateName: '', orgName: '', month: '', year: '' }])}
                >
                  + Add Certificate
                </button>
              </div>

              <button className="continue-btn" onClick={handleContinue}>Continue to Additional Info</button>
            </div>
          )}

              {/* Additional Info Step */}
              {currentStep === 4 && (
            <div className="step-content">
              <h2>Additional Information</h2>
              {/* <p className="form-description">Add skills, languages, and other relevant details</p> */}

              <div className="form-group">
                <label className="form-label">Father's Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileData?.personalInfo?.fatherName || ''}

                  placeholder="Enter father's full name"
                />
              </div>


              {/* Skills Section */}
              <div className="section-header">
                <h3>Skills</h3>
              </div>

              <div className="skills-container">
                {skills.map((skill, index) => (
                  <div className="skill-item" key={`skill-${index}`}>
                    <div className="form-row skill-row">
                      <input
                        type="text"
                        className="form-input skill-name"
                        value={skill.skillName || ''}
                        onChange={(e) => {
                          const updated = [...skills];
                          updated[index].skillName = e.target.value;
                          setSkills(updated);
                        }}
                        placeholder="Skill name"
                      />

                      <div className="skill-level-container">
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
                          className="skill-range"
                        />
                        <span className="skill-percent">{skill.skillPercent || 0}%</span>
                      </div>

                      {skills.length > 1 && (
                        <button
                          className="remove-skill"
                          onClick={() => {
                            const updated = [...skills];
                            updated.splice(index, 1);
                            setSkills(updated);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  className="add-button small-add-button"
                  onClick={() => setSkills([...skills, { skillName: '', skillPercent: 50 }])}
                >
                  + Add Skill
                </button>
              </div>

              {/* Languages Section */}
              <div className="section-header">
                <h3>Languages</h3>
              </div>

              <div className="languages-container">
                {languages.map((language, index) => (
                  <div className="language-item" key={`language-${index}`}>
                    <div className="form-row language-row">
                      <input
                        type="text"
                        className="form-input language-name"
                        value={language.name || ''}
                        onChange={(e) => {
                          const updated = [...languages];
                          updated[index].name = e.target.value;
                          setLanguages(updated);
                        }}
                        placeholder="Language name"
                      />

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

                      {languages.length > 1 && (
                        <button
                          className="remove-language"
                          onClick={() => {
                            const updated = [...languages];
                            updated.splice(index, 1);
                            setLanguages(updated);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  className="add-button small-add-button"
                  onClick={() => setLanguages([...languages, { name: '', level: 0 }])}
                >
                  + Add Language
                </button>
              </div>

              {/* Interests Section */}
              <div className="section-header">
                <h3>Interests</h3>
              </div>

              <div className="interests-container">
                <div className="interests-tags">
                  {interests.map((interest, index) => (
                    <div className="interest-tag" key={`interest-${index}`}>
                      <input
                        type="text"
                        className="interest-input"
                        value={interest}
                        onChange={(e) => {
                          const updated = [...interests];
                          updated[index] = e.target.value;
                          setInterests(updated);
                        }}
                        placeholder="Add interest"
                      />

                      {interests.length > 1 && (
                        <button
                          className="remove-interest"
                          onClick={() => {
                            const updated = [...interests];
                            updated.splice(index, 1);
                            setInterests(updated);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  className="add-button small-add-button"
                  onClick={() => setInterests([...interests, ''])}
                >
                  + Add Interest
                </button>
              </div>

              {/* Projects Section */}
              <div className="section-header">
                <h3>Projects</h3>
              </div>

              <div className="projects-container">
                {projects.map((project, index) => (
                  <div className="project-item" key={`project-${index}`}>
                    <div className="form-group">
                      <label className="form-label">Project Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={project.projectName || ''}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].projectName = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="Project Name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <input
                        type="text"
                        className="form-input"
                        value={project.proyear || ''}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].proyear = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="Year"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={project.proDescription || ''}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].proDescription = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="Project Description"
                      ></textarea>
                    </div>

                    {projects.length > 1 && (
                      <button
                        className="remove-button"
                        onClick={() => {
                          const updated = [...projects];
                          updated.splice(index, 1);
                          setProjects(updated);
                        }}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    )}

                    {index < projects.length - 1 && <hr className="project-divider" />}
                  </div>
                ))}

                <button
                  className="add-button small-add-button"
                  onClick={() => setProjects([...projects, { projectName: '', proyear: '', proDescription: '' }])}
                >
                  + Add Project
                </button>
              </div>

              <button className="submit-btn" onClick={ () => {
                 handleContinue();
                // setShowPreview(true);

                // // Need to wait for the preview to render
                // setTimeout(async () => {
                //   try {
                //     // Now try to get the element
                //     const element = document.getElementById('resume-download');

                //     if (!element) {
                //       console.error("Resume element still not found after showing preview");
                //       alert("Could not generate PDF. Please try using the Preview button and downloading from there.");
                //       return;
                //     }

                //     const opt = {
                //       margin: 0.5,
                //       filename: 'resume.pdf',
                //       image: { type: 'jpeg', quality: 0.98 },
                //       html2canvas: { scale: 2 },
                //       jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                //     };

                //     // Generate blob
                //     const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');

                //     // Create a file object from the blob
                //     const pdfFile = new File([pdfBlob], `focalyt-profile-${Date.now()}.pdf`, {
                //       type: 'application/pdf'
                //     });

                //     // Upload to focalytProfile
                //     await uploadCV(pdfFile, 'focalytProfile');

                //     // Close the preview
                //     setShowPreview(false);

                //     alert('Resume has been saved successfully, including the PDF for your profile!');
                //   } catch (err) {
                //     console.error("PDF generation error:", err);
                //     alert('Resume data saved, but there was an error generating the PDF profile.');
                //     setShowPreview(false); // Close preview on error
                //   }
                // }, 1000);


              }}>Save Profile</button>
            </div>
          )}
            </div>
          </>
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
                                <li key={`resume-cert-${index}`} className="resume-certification-item">
                                  {cert.certificateName && (
                                    <strong>{cert.certificateName}</strong>
                                  )}

                                  {cert.orgName && (
                                    <span className="resume-cert-org"> - {cert.orgName}</span>
                                  )}

                                  {(cert.month || cert.year) && (
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

        <style>{`
        .user-container {
          margin: 0 auto;
          padding: 20px;
          width:100%;
        }
        
        /* Initial Option Screen */
        .initial-option-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          padding: 40px 20px;
        }
        
        .option-card {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 40px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        }
        
        .option-title {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }
        
        .option-subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 40px;
        }
        
        .option-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .option-btn {
          flex: 1;
          min-width: 200px;
          padding: 30px 20px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          background-color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .option-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .upload-option-btn {
          border-color: #28a745;
        }
        
        .upload-option-btn:hover {
          background-color: #f0f9f4;
          border-color: #28a745;
        }
        
        .build-option-btn {
          border-color: #FC2B5A;
        }
        
        .build-option-btn:hover {
          background-color: #fff9fa;
          border-color: #FC2B5A;
        }
        
        .option-btn i {
          font-size: 48px;
          margin-bottom: 10px;
        }
        
        .upload-option-btn i {
          color: #28a745;
        }
        
        .build-option-btn i {
          color: #FC2B5A;
        }
        
        .option-btn span {
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }
        
        .option-btn small {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        
        @media (max-width: 768px) {
          .option-buttons {
            flex-direction: column;
          }
          
          .option-btn {
            min-width: 100%;
          }
          
          .option-card {
            padding: 30px 20px;
          }
        }
        
        .step-progress-container {
          margin-bottom: 30px;
        }
        
        .step-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 0 10px;
        }
        
        .StepHeader {
          text-align: center;
          color: #666;
          font-size: 1.2rem;
          font-weight: 600;
          flex: 1;
          padding: 0 10px;
        }
        
        .top-back-btn {
          background-color: #f8f9fa;
          color: #333;
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        
        .top-back-btn:hover {
          background-color: #e9ecef;
          border-color: #bbb;
        }
        
        .newloader {
          height: 5px;
          width: 100%;
          background-color: #f3f3f3;
          position: relative;
          margin-bottom: 30px;
          margin-top: 0;
        }
        
        .bar {
          height: 100%;
          background-color: #FC2B5A;
          transition: width 0.5s ease;
        }
        
        .check-bar-container {
          display: flex;
          justify-content: space-between;
          position: absolute;
          width: 100%;
          top: -12px;
        }
        
        .check {
          width: 24px;
          height: 24px;
          background-color: #f3f3f3;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          cursor: pointer;
          border: 2px solid #ddd;
          color: #666;
        }
        
        .check.active {
          border-color: #FC2B5A;
          color: #FC2B5A;
        }
        
        .check.completed {
          background-color: #FC2B5A;
          border-color: #FC2B5A;
          color: white;
        }
        
        .step-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
        }
        
        .step-label {
          text-align: center;
          font-size: 0.85rem;
          color: #6c757d;
          flex: 1;
        }
        
        .step-label.active {
          color: #FC2B5A;
          font-weight: 600;
        }
        
        .form-container {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20px;
        }
        
        .step-content {
          animation: fadeIn 0.4s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        h2 {
          color: #333;
          margin-bottom: 5px;
        }
        
        .form-description {
          color: #666;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-row {
          display: flex;
          gap: 15px;
        }
        
        .half-width {
          flex: 1;
        }
        
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .form-check-label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .form-check-label input[type="checkbox"] {
          margin-right: 8px;
        }
        
        .step-navigation-buttons {
          display: flex;
          gap: 15px;
          margin-top: 20px;
          justify-content: space-between;
        }
        
        .back-btn {
          background-color: #f8f9fa;
          color: #333;
          padding: 10px 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .back-btn:hover {
          background-color: #e9ecef;
          border-color: #bbb;
        }
        
        .continue-btn, .submit-btn {
          background-color: #FC2B5A;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-top: 20px;
          width: 100%;
        }
        
        .continue-btn:hover, .submit-btn:hover {
          background-color: #e61e4d;
        }
        
        @media (max-width: 768px) {
          .step-navigation-buttons {
            flex-direction: column;
          }
          
          .continue-btn, .submit-btn, .back-btn {
            width: 100%;
          }
        }
        
        .add-button {
          background-color: transparent;
          color: #FC2B5A;
          border: 1px dashed #FC2B5A;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          margin-top: 10px;
          transition: all 0.3s;
        }
        
        .add-button:hover {
          background-color: #fff9fa;
        }
        
        .remove-button {
          background-color: transparent;
          color: #dc3545;
          border: none;
          cursor: pointer;
          float: right;
          font-size: 14px;
          display: flex;
          align-items: center;
        }
        
        .experience-item, .education-item, .certificate-item, .project-item {
          position: relative;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 6px;
          margin-bottom: 15px;
        }
        
        .experience-divider, .education-divider, .certificate-divider, .project-divider {
          margin: 20px 0;
          border-color: #eee;
        }
        
        .editable-content {
          border: 1px solid #eee;
          padding: 8px 12px;
          min-height: 40px;
          border-radius: 4px;
          outline: none;
        }
        
        .editable-content:focus {
          border-color: #FC2B5A;
        }
        
        .editable-content[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #aaa;
        }
        
        .fresher-section {
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 6px;
          text-align: center;
        }
        
        .fresher-notice {
          color: #666;
          margin-bottom: 0;
        }
        
        .required {
          color: #dc3545;
        }
        
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
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        list-style-type: none;
      }
      
      .board-suggestion-item:hover {
        background-color: #f0f0f0;
      }
      
      .board-autocomplete-wrapper {
        position: relative;
      }
      
      /* Skills section */
      .section-header {
        margin: 30px 0 15px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      
      .section-header h3 {
        font-size: 1.1rem;
        color: #444;
        margin: 0;
      }
      
      .skills-container {
        margin-bottom: 20px;
      }
      
      .skill-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .skill-name {
        flex: 2;
      }
      
      .skill-level-container {
        flex: 3;
        display: flex;
        align-items: center;
        margin: 0 10px;
      }
      
      .skill-range {
        flex: 1;
      }
      
      .skill-percent {
        width: 40px;
        text-align: right;
        font-size: 14px;
        color: #555;
      }
      
      .remove-skill, .remove-language, .remove-interest {
        background: none;
        border: none;
        color: #dc3545;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Languages section */
      .languages-container {
        margin-bottom: 20px;
      }
      
      .language-item {
        margin-bottom: 10px;
      }
      
      .language-row {
        display: flex;
        align-items: center;
      }
      
      .language-name {
        flex: 1;
      }
      
      .language-proficiency {
        display: flex;
        margin: 0 15px;
      }
      
      .proficiency-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid #aaa;
        margin: 0 3px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .proficiency-dot.filled {
        background-color: #6f42c1;
        border-color: #6f42c1;
      }
      
      /* Interests section */
      .interests-container {
        margin-bottom: 20px;
      }
      
      .interests-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 10px;
      }
      
      .interest-tag {
        display: flex;
        align-items: center;
        background-color: #f8f9fa;
        border-radius: 20px;
        padding: 5px 12px;
      }
      
      .interest-input {
        border: none;
        background: transparent;
        font-size: 14px;
        outline: none;
        width: 100px;
      }
      
      /* Projects section */
      .projects-container {
        margin-bottom: 20px;
      }
      
      .small-add-button {
        font-size: 14px;
        padding: 6px 12px;
      }
      
      /* Certificate section */
      .certifications-container {
        margin-bottom: 20px;
      }
      
      .certificate-date-fields {
        display: flex;
        gap: 10px;
      }
      
      /* Responsive styles */
      @media (max-width: 768px) {
      .certificateFieldMobile{
      flex-direction: column;
      }
        .form-row {
          flex-direction: column;
          gap: 10px;
          width:100%
        }
        .project-item{
        flex-direction: column;
        }
        
        .half-width {
          width: 100%;
        }
        
        .skill-row {
          flex-wrap: wrap;
        }
        
        .skill-name {
          flex: 1 1 100%;
          margin-bottom: 5px;
        }
        
        .skill-level-container {
          flex: 1 1 80%;
        }
        
        .language-row {
          flex-wrap: wrap;
        }
        
        .certificate-date-fields {
          flex-direction: column;
        }
        
        .experienceLevel {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .experience-dropdown {
          width: auto !important;
        }
      }

@media(max-width:768px){
.certificate-item {
flex-direction: column;
        }
}


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

    `}</style>
      </div>


    </>
  )
};
export default User;