import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const User = () => {
  // Current step state
  const [currentStep, setCurrentStep] = useState(1);

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
    year: ''
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

  // States for autocomplete and suggestions
  const [boardSuggestions, setBoardSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(null);
  const [coursesList, setCoursesList] = useState({});
  const [specializationsList, setSpecializationsList] = useState({});

  // Backend URL
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // Fetch educational options on component mount
  useEffect(() => {
    const fetchEducationOptions = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/educationlist`);
        if (response.data?.status && response.data.data?.educationlist) {
          setEducationList(response.data.data.educationlist);
        } else {
          console.error("Education API error:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching education options:", error);
      }
    };

    fetchEducationOptions();
  }, [backendUrl]);

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
    const educationId = e.target.value;

    const updated = [...educations];
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

    return null;
  };

  // Handle form submission
  const handleSaveCV = async () => {
    try {
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
        showProfileForm: true,
        personalInfo: {
          professionalTitle: profileData?.personalInfo?.professionalTitle || '',
          professionalSummary: profileData?.personalInfo?.professionalSummary || '',
          currentAddress: profileData?.personalInfo?.currentAddress || {},
          permanentAddress: profileData?.personalInfo?.permanentAddress || {},
          image: userData.image || user.image || '',
          resume: userData.resume || user.resume || '',
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
        })),
        isExperienced: isExperienced,
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
        alert('Profile saved successfully!');
        
        window.location.reload();

      } else {
        alert('Failed to save CV!');
      }
    } catch (err) {
      console.error("Error saving CV:", err);
      alert("An error occurred while saving your CV");
    }
  };

  // Navigation functions
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
      handleSaveCV();
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

          // Set education options
          setEducationList(data.educations || []);

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

  return (
    <>

      <div className="user-container">
        {/* Step Progress Bar */}
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
                  <div className="certificate-item" key={`certificate-${index}`}>
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

                    <div className="form-group">
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
                      />
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
              <p className="form-description">Add skills, languages, and other relevant details</p>

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

              <button className="submit-btn" onClick={handleContinue}>Save Profile</button>
            </div>
          )}
        </div>

        <style>{`
        .user-container {
          margin: 0 auto;
          padding: 20px;
          width:100%;
        }
        
        .step-progress-container {
          margin-bottom: 30px;
        }
        
        .newloader {
          height: 5px;
          width: 100%;
          background-color: #f3f3f3;
          position: relative;
          margin-bottom: 30px;
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
        
        .continue-btn, .submit-btn {
          background-color: #FC2B5A;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
          transition: background-color 0.3s;
        }
        
        .continue-btn:hover, .submit-btn:hover {
          background-color: #e61e4d;
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

    `}</style>
      </div>


    </>
  )
};
export default User;