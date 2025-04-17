import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './CandidateProfile.css';
import html2pdf from 'html2pdf.js';

const CandidateProfile = () => {
  // State for resume data
  const [user, setUser] = useState({});
  const [experiences, setExperiences] = useState([{}]);
  const [educations, setEducations] = useState([{}]);
  const [skills, setSkills] = useState([{ name: '', level: 0 }]);
  const [certificates, setCertificates] = useState([{}]);
  const [projects, setProjects] = useState([{}]);
  const [interests, setInterests] = useState(['']);
  const [languages, setLanguages] = useState([{ name: '', level: 0 }]);
  const [declaration, setDeclaration] = useState('');

  // State for UI control
  const [profileData, setProfileData] = useState({
    
  });
  
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

  // Backend URL
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // For creating editable content
const createEditable = (content, placeholder, onChange) => (
    <div
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
    CandidateProfile();
  }, [user, experiences, educations, skills, languages, projects, interests]);

  const CandidateProfile = () => {
    let strength = 0;

    // Check basic info
    if (user?.name) strength += 10;

    // Check sections
    if (experiences.some(exp => exp.jobTitle || exp.companyName)) strength += 15;
    if (educations.some(edu => edu.degree || edu.university)) strength += 15;
    if (skills.some(skill => skill.name)) strength += 15;
    if (languages.some(lang => lang.name)) strength += 10;
    if (projects.some(proj => proj.name)) strength += 10;
    if (interests.some(interest => interest)) strength += 10;
    if (certificates.some(cert => cert.name)) strength += 10;
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
      const user = JSON.parse(sessionStorage.getItem('user'));
  
      // Format the data to match what your API expects
      const cvPayload = {
        personalInfo: 
          {
            name: user.name,
            title: document.querySelector('[data-placeholder="Professional Title"]')?.textContent || '',
            summary: document.querySelector('[data-placeholder="Write a brief professional summary here..."]')?.textContent || '',
            email: document.querySelector('[data-placeholder="Email Address"]')?.textContent || '',
            location: document.querySelector('[data-placeholder="Location"]')?.textContent || '',
            experiences: document.querySelector('[data-placeholder="Summary"]')?.textContent || '',
            skills: document.querySelector('[data-placeholder="Skills"]')?.textContent || '',
            certifications: document.querySelector('[data-placeholder="Certifications"]')?.textContent || '',
            interest: document.querySelector('[data-placeholder="Interest"]')?.textContent || '',
            projects: document.querySelector('[data-placeholder="Projects"]')?.textContent || '',

            image: user.image || '',
            resume: user.resume || '',
            voiceIntro: recordings.map(rec => ({
              name: rec.name,
              url: rec.url,
              timestamp: rec.timestamp,
              status: true
            }))
          }
        ,
        workexperience: experiences.map(e => ({
          jobTitle: document.querySelectorAll('[data-placeholder="Job Title"]')[experiences.indexOf(e)]?.textContent || e.jobTitle || '',
          companyName: document.querySelectorAll('[data-placeholder="Company Name"]')[experiences.indexOf(e)]?.textContent || e.companyName || '',
          jobDescription: document.querySelectorAll('[data-placeholder="Job Description"]')[experiences.indexOf(e)]?.textContent || e.jobDescription || ''
        })),
        education: educations.map(e => ({
          degree: e.degree || '',
          university: document.querySelectorAll('[data-placeholder="University"]')[educations.indexOf(e)]?.textContent || e.university || '',
          duration: e.duration || '',
          addInfo: document.querySelectorAll('[data-placeholder="Additional Information"]')[educations.indexOf(e)]?.textContent || e.additionalInfo || ''
        })),
        skill: skills.map(s => ({
          skillName: s.name,
          skillPercent: s.level
        })),
        certification: certificates.map(c => ({
          certificateName: document.querySelectorAll('[data-placeholder="Certificate Name"]')[certificates.indexOf(c)]?.textContent || c.name || '',
          orgName: document.querySelectorAll('[data-placeholder="Issuing Organization, Year"]')[certificates.indexOf(c)]?.textContent || c.org || ''
        })),
        language: languages.map(l => ({
          lname: document.querySelectorAll('[data-placeholder="Language Name"]')[languages.indexOf(l)]?.textContent || l.name || '',
          level: l.level
        })),
        projects: projects.map(p => ({
          projectName: document.querySelectorAll('[data-placeholder="Project Name"]')[projects.indexOf(p)]?.textContent || p.name || '',
          proyear: document.querySelectorAll('[data-placeholder="Year"]')[projects.indexOf(p)]?.textContent || p.year || '',
          proDescription: document.querySelectorAll('[data-placeholder="Project Description"]')[projects.indexOf(p)]?.textContent || p.description || ''
        })),
        interest: interests.filter(i => i !== ''),
        declaration: declaration
      };
  
      console.log("📤 CV Payload being sent to backend:", cvPayload);
  
      const res = await axios.post(`${backendUrl}/candidate/saveProfile`, cvPayload, {
        headers: {
          'x-auth': localStorage.getItem('token')
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
        const response = await axios.get(`${backendUrl}/candidate/getProfile`, {
          headers: {
            'x-auth': token
          }
        });
        
        if (response.data.status) {
          console.log("Profile data fetched:", response.data.data);
          setProfileData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
  
    fetchProfile();
  }, );

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

      {/* Navigation Tabs */}
      <div className="resume-tabs">
        <ul className="nav nav-tabs nav-fill">
          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'personal' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('personal'); }}
            >
              <i className="bi bi-person-circle me-2"></i>
              Personal
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'experience' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('experience'); }}
            >
              <i className="bi bi-briefcase me-2"></i>
              Experience
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'education' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('education'); }}
            >
              <i className="bi bi-book me-2"></i>
              Education
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('skills'); }}
            >
              <i className="bi bi-star me-2"></i>
              Skills
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'extras' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('extras'); }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Additional
            </a>
          </li>
          {/* <li className="nav-item">
            <a
              className={`nav-link ${activeSection === 'recording' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveSection('recording'); }}
            >
              <i className="bi bi-mic me-2"></i>
              Voice Intro
            </a>
          </li> */}
          {/* <li className='nav-item position-relative'>
           
          </li> */}
        </ul>
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
                    <img src={`${process.env.REACT_APP_BUCKET_URL}/${user.image}`} alt="Profile" />
                  ) : (
                    <div className="profile-placeholder">
                      <i className="bi bi-person"></i>
                    </div>
                  )}
                  <div className="image-upload-overlay">
                    <label>
                      <i className="bi bi-camera"></i>
                      <input type="file" accept="image/*" style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="profile-info">
                <div className="profile-name">
                {createEditable(profileData?.personalInfo?.name || '', 'Your Name', (val) => {
  setProfileData(prev => ({
    ...prev,
    personalInfo: {
      ...(prev.personalInfo || {}),
      name: val
    }
  }));
})}


                </div>
                <div className="profile-title">
                  {/* {createEditable('', 'Professional Title')} */}
                  {createEditable(profileData?.personalInfo?.title || '', 'Professional Title...', (val) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...(prev.personalInfo || {}),
        title: val
      }
    }));
  })}
                </div>
                <div className="profile-summary">
                {createEditable(profileData?.personalInfo?.summary || '', 'Write a brief professional summary here...', (val) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...(prev.personalInfo || {}),
        summary: val
      }
    }));
  })}
                </div>

                <div className="contact-info">
                  <div className="contact-item">
                    <i className="bi bi-telephone"></i>
                    {createEditable(profileData?.personalInfo?.phone || '', 'Phone Number', (val) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...(prev.personalInfo || {}),
        phone: val
      }
    }));
  })} 
                  </div>
                  <div className="contact-item">
                    <i className="bi bi-envelope"></i>
                    {createEditable(profileData?.personalInfo?.email || '', 'Email Address', (val) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...(prev.personalInfo || {}),
        email: val
      }
    }));
  })}
                  </div>
                  <div className="contact-item">
                    <i className="bi bi-geo-alt"></i>
                    {createEditable(profileData?.personalInfo?.location || '', 'Location', (val) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...(prev.personalInfo || {}),
        location: val
      }
    }));
  })}
                  </div>
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
      <div className="experience-item" key={index}>
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
          {createEditable(experience.companyName || '', 'Company Name', (val) => {
            const updatedExperiences = [...experiences];
            updatedExperiences[index].companyName = val;
            setExperiences(updatedExperiences);
          })}
        </div>

        <div className="date-range">
          <span className="date-label">From:</span>
          <input
            type="month"
            value={experience.from || ''}
            onChange={(e) => {
              const updatedExperiences = [...experiences];
              updatedExperiences[index].from = e.target.value;
              setExperiences(updatedExperiences);
            }}
            className="date-input"
          />

          <span className="date-label">To:</span>
          <input
            type="month"
            value={experience.to || ''}
            onChange={(e) => {
              const updatedExperiences = [...experiences];
              updatedExperiences[index].to = e.target.value;
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
              <div className="education-item" key={index}>
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
                    value={edu.degree || ''}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[index].degree = e.target.value; 
                      setEducations(updated);
                      setProfileData(prev => ({
                        ...prev,
                        educations: updated
                      }));
                    }}
                    
                  >
                    <option value="">Select</option>
                    <option value="10th">10th</option>
                    <option value="12th">12th</option>
                    <option value="ITI">ITI</option>
                    <option value="Diploma">Diploma</option>
                    <option value="After 12th Course">After 12th Course</option>
                  </select>
                </div>

                {/* Conditional Rendering */}
                {['10th', '12th'].includes(edu.degree) ? (
                  <>
                    <div className="form-group mb-2">
                      <label>Board</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData?.education?.degree || ''}
                        onChange={(e) =>
                          setProfileData(prev => ({
                            ...prev,
                            education: {
                              ...(prev.education || {}),
                              degree: e.target.value
                            }
                          }))
                        }
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
                      <label>School Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.school || ''}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[index].school = e.target.value;
                          setEducations(updated);
                        }}
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label>Medium</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.medium || ''}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[index].medium = e.target.value;
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
                ) : (
                  <>
                    <div className="form-group mb-2">
                      <label>Course</label>
                      <select
                        className="form-select"
                        value={edu.course || ''}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[index].course = e.target.value;
                          setEducations(updated);
                        }}
                      >
                        <option value="">Select Course</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Mechanical">Mechanical</option>
                      </select>
                    </div>

                    <div className="form-group mb-2">
                      <label>Specialization</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.specialization || ''}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[index].specialization = e.target.value;
                          setEducations(updated);
                        }}
                      />
                    </div>

                    <div className="form-group mb-2">
                      <label>Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.duration || ''}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[index].duration = e.target.value;
                          setEducations(updated);
                        }}
                      />
                    </div>
                  </>
                )}
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
                <div className="skill-item" key={index}>
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
                          setProfileData(prev => ({
                            ...prev,
                            skills: updated
                          }));
                        }}
   >
                     {skill.skillName}
                      </div>
                      <span className="skill-level">{skill.skillPercent || 0}%</span>
                    </div>

                    {/* {skills.length > 1 && (
                      <button
                        className="remove-skill"
                        onClick={() => {
                          const updated = [...skills];
                          if (updated.length > 1) {
                            updated.splice(index, 1);
                          } else {
                            updated[0] = { name: '', level: 0 }; // clear if only 1 left
                          }
                          setSkills(updated);
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )} */}

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
                      value={skills[index].skillPercent || 0}
                      onChange={(e) => {
                        const updated = [...skills];
                        updated[index].skillPercent = Number(e.target.value);
                        setSkills(updated);
                        setProfileData(prev => ({
                          ...prev,
                          skills: updated
                        }));
                      }}
                      
                      className="form-range"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="add-button"
              onClick={() => setSkills([...skills, { name: '', level: 50 }])}
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
                      <div className="language-item" key={index}>
                        <div className="language-details">
                        {createEditable(language.lname || '', 'Language Name', (val) => {
            const updated = [...languages];
            updated[index].lname = val;
            setLanguages(updated);
          })}
                          <div className="language-proficiency">
                         {[1, 2, 3, 4, 5].map((dot) => (
  <span
    key={dot}
    className={`proficiency-dot ${dot <= (language.level || 0) ? 'filled' : ''}`}
    onClick={() => {
      const updated = [...languages];
      updated[index].level = dot;
      setLanguages(updated);
      setProfileData(prev => ({
        ...prev,
        language: updated
      }));
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
                              updated[0] = { lname: '', level: 0 };
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
                      onClick={() => setLanguages([...languages, { name: '', level: 0 }])}
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
                      <div className="certificate-item" key={index}>
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
                            updated.splice(index, 1);
                            setCertificates(updated);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}

                    <button
                      className="add-button"
                      onClick={() => setCertificates([...certificates, {}])}
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
                      <div className="project-item" key={index}>
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

                        {projects.length > 1 && (
                          <button
                            className="remove-project"
                            onClick={() => {
                              const updated = [...projects];
                              updated.splice(index, 1);
                              setProjects(updated);
                            }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      className="add-button"
                      onClick={() => setProjects([...projects, {}])}
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
                        <div className="interest-tag" key={index}>
                          <div
                            contentEditable
                            suppressContentEditableWarning={true}
                            data-placeholder="Interest"
                            onBlur={(e) => {
                              const updated = [...interests];
                              updated[index] = e.target.innerText;
                              setInterests(updated);
                              setProfileData(prev => ({
                                ...prev,
                                interests: updated
                              }));
                            }}
                            
                          >
                            {interest}
                          </div>

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
                  onBlur={(e) => setDeclaration(e.target.innerText)}
                >
                  {declaration}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Recording Section */}
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

      {/* model  */}
     
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
                
                <div className="resume-contact-details">
                  <div className="resume-contact-item">
                    <i className="bi bi-telephone-fill"></i>
                    <span>{profileData?.personalInfo?.phone || 'Phone Number'}</span>
                  </div>
                  <div className="resume-contact-item">
                    <i className="bi bi-envelope-fill"></i>
                    <span>{profileData?.personalInfo?.email || 'Email Address'}</span>
                  </div>
                  <div className="resume-contact-item">
                    <i className="bi bi-geo-alt-fill"></i>
                    <span>{profileData?.personalInfo?.location || 'Location'}</span>
                  </div>
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
            { (profileData.experience?.jobTitle || profileData.experience?.companyName || profileData.experience?.jobDescription) && (
                 <div className="resume-section">
                  <h2 className="resume-section-title">Work Experience</h2>
                  
                  
                      <div className="resume-experience-item">
                        <div className="resume-item-header">
              { (profileData.experience?.jobTitle ) && (

                          <h3 className="resume-item-title">{profileData?.experience?.jobTitle|| 'Job Title'}</h3>)}
              { (profileData.experience?.companyName ) && (

                          <p className="resume-item-subtitle">{profileData?.experience?.companyName|| 'Company Name'}</p>)}
              { (profileData.experience?.companyName ) && (
                        
                          <p className="resume-item-period">
                            {profileData.experience.from || 'Start Date'} - {profileData.experience.to || 'Present'}
                          </p>
              )}
                        </div>
                        <div className="resume-item-content">
              { (profileData.experience?.jobDescription ) && (                        
                         <p>{profileData?.experience?.jobDescription|| 'No Job description'}</p>
              )}
                        </div>
                      </div>
                   
                </div>
                )}


              
              {/* Education Section */}
              {(profileData.education?.degree || profileData.education?.school || profileData.education?.passingYear) && (

                <div className="resume-section">
                  <h2 className="resume-section-title">Education</h2>
                  
                      <div className="resume-education-item">
                        <div className="resume-item-header">
                        {profileData.education?.degree && (
                          <h3 className="resume-item-title">{profileData.education.degree}</h3>)}
                         {profileData.education?.school && (
                          <p className="resume-item-subtitle">{profileData.education.school}</p>
                        )}
                        {profileData.education?.passingYear && (
                          <p className="resume-item-period">{profileData.education.passingYear}</p>
                        )}
                        </div>
                        <div className="resume-item-content">
                        {profileData.education?.medium && (
                          <p>Medium: {profileData.education.medium}</p>)}
                          {profileData.education?.marks && (
          <p>Marks: {profileData.education.marks}%</p>
        )}
        {profileData.education?.specialization && (
          <p>Specialization: {profileData.education.specialization}</p>
        )}
        {profileData.education?.duration && (
          <p>Duration: {profileData.education.duration}</p>
        )}
                        </div>
                      </div>
                 
                </div>
              )}
            </div>
            
            {/* Right Column */}
            <div className="resume-column resume-right-column">
              {/* Skills Section */}
              {profileData.skills && profileData.skills.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Skills</h2>
                  
                  <div className="resume-skills-list">
                  {profileData.skills.map((skill, index) => (
        skill.skillName && (
                        <div className="resume-skill-item" >
                        { (profileData.skills.skillName ) && (
                          <div className="resume-skill-name">
                           {skill.skillName}
                          </div>)}
                          <div className="resume-skill-bar-container">
                            <div 
                              className="resume-skill-bar" 
                              style={{width: `${skill.skillPercent || 0}%`}}
                            ></div>
                          </div>
                        </div>
                  )
                ))}
                  </div>
                </div>
              )}
              
              {/* Languages Section */}
              {/* {profileData?.language?.lname && ( */}

              {/* {languages.some(lang => lang.lname) && (                <div className="resume-section">
                  <h2 className="resume-section-title">Languages</h2>
                  
                  <div className="resume-languages-list">
                   
                      
                        <div className="resume-language-item">
                          <div className="resume-language-name">{profileData.language.lname}</div>
                          <div className="resume-language-level">
                            {[1, 2, 3, 4, 5].map(dot => (
                              <span 
                                key={dot} 
                                className={`resume-level-dot ${dot <= (profileData.language.level || 0) ? 'filled' : ''}`}
                              ></span>
                            ))}
                          </div>
                        </div>
                   
                  </div>
                </div>
              )} */}
             {languages.some(lang => lang.lname) && (
  <div className="resume-section">
    <h2 className="resume-section-title">Languages</h2>
    
    <div className="resume-languages-list">
      {languages.map((lang, index) => (
        lang.lname && (
          <div className="resume-language-item" key={index}>
            <div className="resume-language-name">{lang.lname}</div>
            <div className="resume-language-level">
              {[1, 2, 3, 4, 5].map(dot => (
                <span
                  key={dot}
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
              {/* {(profileData?.certificate?.certificateName || profileData?.certificate?.orgName) && ( */}
              {certificates.some(cert => cert.certificateName || cert.orgName) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Certifications</h2>
                  
                  <ul className="resume-certifications-list">
                  {certificates.map((cert, index) => (
        (cert.certificateName || cert.orgName) && (
                        <li key={index}>
                        <strong>{cert.certificateName || 'Certificate'}</strong>
                        {cert.orgName && <span> - {cert.orgName}</span>}
                        </li>
                       )
                      ))}
                  </ul>
                </div>
              )}
              
              {/* Projects Section */}
              {/* {(profileData?.project?.projectName || profileData?.project?.proDescription) && ( */}
              {projects.some(p => p.projectName || p.proDescription) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Projects</h2>
                  {projects.map((proj, index) => (
      (proj.projectName || proj.proDescription) && (
                      <div className="resume-project-item" key={index}>
                        <div className="resume-item-header">
                          <h3 className="resume-project-title">
                          {proj.projectName || 'Project'}
                          {proj.proyear && <span className="resume-project-year"> ({proj.proyear})</span>}
                          {/* {profileData.project.projectName || 'Project'}
                          {profileData.project.proyear &&  <span className="resume-project-year"> ({profileData.project.proyear})</span>} */}
                          </h3>
                        </div>
                        <div className="resume-item-content">
                          {/* <p>{profileData.project.proDescription || 'No project description provided'}</p> */}
                          <p>{proj.proDescription || 'No project description provided'}</p>
                        </div>
                      </div>
                    )
                  ))}
                  
                </div>
              )}
              
              {/* Interests Section */}
              {profileData?.interests?.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Interests</h2>
                  
                  <div className="resume-interests-tags">
                    {interests.map((interest, index) => (
                      interest && (
                        <span className="resume-interest-tag" key={index}>
                        {profileData.interests.filter(i => i.trim() !== '').join(', ')}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Declaration */}
          {declaration && (
            <div className="resume-declaration">
              <h2 className="resume-section-title">Declaration</h2>
              <p>{declaration}</p>
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
    
    </div>
  );
};

export default CandidateProfile;







// import React, { useState, useEffect, useRef } from 'react';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';

// import axios from 'axios';

// const CandidateProfile = () => {
  
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioURL, setAudioURL] = useState('');
//   const [recordingTime, setRecordingTime] = useState(0);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const timerRef = useRef(null);


//   const [activeStep, setActiveStep] = useState(0);
//   const steps = [
//     'Personal Information',
//     'Qualifications',
//     'Experience',
//     'Skills',
//     'Additional Information'
//   ];

//   // State for dynamic arrays
//   const [skills, setSkills] = useState([{ skillName: '', skillPercent: 0 }]);
//   const [certifications, setCertifications] = useState([{ certificateName: '', orgName: '', year: '' }]);
//   const [languages, setLanguages] = useState([{ lname: '', level: 0 }]);
//   const [projects, setProjects] = useState([{ projectName: '', proyear: '', proDescription: '' }]);
//   const [interests, setInterests] = useState(['']);
//   const [qualifications, setQualifications] = useState([{ 
//     Qualification: '', 
//     subQualification: '', 
//     QualificationCourse: '', 
//     College: '', 
//     UniversityName: '',
//     PassingYear: '',
//     location: {
//       city: '',
//       state: '',
//       fullAddress: ''
//     }
//   }]);
//   const [experiences, setExperiences] = useState([{ 
//     Industry_Name: '', 
//     SubIndustry_Name: '', 
//     Company_Name: '', 
//     Company_State: '', 
//     Company_City: '', 
//     Comments: '', 
//     FromDate: '', 
//     ToDate: '' 
//   }]);
//   const [jobLocations, setJobLocations] = useState([{ state: '', city: '' }]);

//   // Handle audio recording
//   const startRecording = () => {
//     navigator.mediaDevices.getUserMedia({ audio: true })
//       .then(stream => {
//         const mediaRecorder = new MediaRecorder(stream);
//         mediaRecorderRef.current = mediaRecorder;
//         audioChunksRef.current = [];

//         mediaRecorder.addEventListener('dataavailable', event => {
//           audioChunksRef.current.push(event.data);
//         });

//         mediaRecorder.addEventListener('stop', () => {
//           const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
//           const audioUrl = URL.createObjectURL(audioBlob);
//           setAudioURL(audioUrl);
          
//           // Here you can upload the audio if you want
//           // uploadAudio(audioBlob);
//         });

//         mediaRecorder.start();
//         setIsRecording(true);
        
//         // Start timer
//         setRecordingTime(0);
//         timerRef.current = setInterval(() => {
//           setRecordingTime(prevTime => prevTime + 1);
//         }, 1000);
//       })
//       .catch(error => {
//         console.error('Error accessing the microphone:', error);
//       });
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
      
//       // Stop timer
//       clearInterval(timerRef.current);
//     }
//   };

//   const uploadAudio = async (audioBlob) => {
//     const formData = new FormData();
//     formData.append('audio', audioBlob, 'recording.mp3');
    
//     try {
//       const response = await axios.post('/api/upload-audio', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
      
//       if (response.data.url) {
//         formik.setFieldValue('personalInfo.profilevideo', response.data.url);
//       }
//     } catch (error) {
//       console.error('Error uploading audio:', error);
//     }
//   };

//   // Formik setup
//   const validationSchema = Yup.object({
//     personalInfo: Yup.object({
//       name: Yup.string().required('Name is required'),
//       mobile: Yup.number().required('Mobile number is required'),
//       email: Yup.string().email('Invalid email format').required('Email is required'),
//       // Add more validations for other fields
//     }),
//     // Add more validations for other sections
//   });

//   const formik = useFormik({
//     initialValues: {
//       personalInfo: {
//         name: '',
//         mobile: '',
//         email: '',
//         place: '',
//         profilevideo: '',
//         sex: '',
//         dob: '',
//         whatsapp: '',
//         resume: '',
//         linkedInUrl: '',
//         facebookUrl: '',
//         twitterUrl: '',
//         professionalTitle: '',
//         professionalSummary: '',
//         location: {
//           latitude: '',
//           longitude: '',
//           city: '',
//           state: '',
//           fullAddress: ''
//         },
//         image: '',
//         declaration: {
//           isChecked: false
//         }
//       },
//       qualifications: [],
//       experiences: [],
//       isExperienced: false,
//       highestQualification: '',
//       isProfileCompleted: false
//     },
//     validationSchema,
//     onSubmit: async (values) => {
//       // Add dynamic arrays to the form values
//       values.personalInfo.skill = skills;
//       values.personalInfo.certification = certifications;
//       values.personalInfo.language = languages;
//       values.personalInfo.projects = projects;
//       values.personalInfo.interest = interests;
//       values.personalInfo.jobLocationPreferences = jobLocations;
//       values.qualifications = qualifications;
//       values.experiences = experiences;
      
//       try {
//         const response = await axios.post('/api/candidate/profile', values);
//         alert('Profile saved successfully!');
//         console.log(response.data);
//       } catch (error) {
//         alert('Error saving profile');
//         console.error('Error:', error);
//       }
//     },
//   });

//   // Handle next and previous steps
//   const handleNext = () => {
//     setActiveStep(prevStep => prevStep + 1);
//   };

//   const handleBack = () => {
//     setActiveStep(prevStep => prevStep - 1);
//   };

//   // Form sections based on active step
//   const renderFormSection = () => {
//     switch (activeStep) {
//       case 0:
//         return (
//           <div className="p-4 bg-white rounded shadow">
//             <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="form-group">
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="personalInfo.name"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.name}
//                   onChange={formik.handleChange}
//                   onBlur={formik.handleBlur}
//                 />
//                 {formik.touched.personalInfo?.name && formik.errors.personalInfo?.name ? (
//                   <div className="text-red-500">{formik.errors.personalInfo.name}</div>
//                 ) : null}
//               </div>

//               <div className="form-group">
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
//                 <input
//                   type="email"
//                   id="email"
//                   name="personalInfo.email"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.email}
//                   onChange={formik.handleChange}
//                   onBlur={formik.handleBlur}
//                 />
//                 {formik.touched.personalInfo?.email && formik.errors.personalInfo?.email ? (
//                   <div className="text-red-500">{formik.errors.personalInfo.email}</div>
//                 ) : null}
//               </div>

//               <div className="form-group">
//                 <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile Number</label>
//                 <input
//                   type="text"
//                   id="mobile"
//                   name="personalInfo.mobile"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.mobile}
//                   onChange={formik.handleChange}
//                   onBlur={formik.handleBlur}
//                 />
//                 {formik.touched.personalInfo?.mobile && formik.errors.personalInfo?.mobile ? (
//                   <div className="text-red-500">{formik.errors.personalInfo.mobile}</div>
//                 ) : null}
//               </div>

//               <div className="form-group">
//                 <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
//                 <input
//                   type="text"
//                   id="whatsapp"
//                   name="personalInfo.whatsapp"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.whatsapp}
//                   onChange={formik.handleChange}
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Gender</label>
//                 <select
//                   id="sex"
//                   name="personalInfo.sex"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.sex}
//                   onChange={formik.handleChange}
//                 >
//                   <option value="">Select Gender</option>
//                   <option value="Male">Male</option>
//                   <option value="Female">Female</option>
//                   <option value="Other">Other</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
//                 <input
//                   type="date"
//                   id="dob"
//                   name="personalInfo.dob"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.dob}
//                   onChange={formik.handleChange}
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="place" className="block text-sm font-medium text-gray-700">Place</label>
//                 <input
//                   type="text"
//                   id="place"
//                   name="personalInfo.place"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.place}
//                   onChange={formik.handleChange}
//                 />
//               </div>

//               <div className="form-group col-span-2">
//                 <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700">Full Address</label>
//                 <textarea
//                   id="fullAddress"
//                   name="personalInfo.location.fullAddress"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.location.fullAddress}
//                   onChange={formik.handleChange}
//                   rows="3"
//                 ></textarea>
//               </div>

//               <div className="form-group">
//                 <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
//                 <input
//                   type="text"
//                   id="city"
//                   name="personalInfo.location.city"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.location.city}
//                   onChange={formik.handleChange}
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
//                 <input
//                   type="text"
//                   id="state"
//                   name="personalInfo.location.state"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.location.state}
//                   onChange={formik.handleChange}
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700">Professional Title</label>
//                 <input
//                   type="text"
//                   id="professionalTitle"
//                   name="personalInfo.professionalTitle"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.professionalTitle}
//                   onChange={formik.handleChange}
//                   placeholder="e.g. Senior Software Developer"
//                 />
//               </div>

//               <div className="form-group col-span-2">
//                 <label htmlFor="professionalSummary" className="block text-sm font-medium text-gray-700">Professional Summary</label>
//                 <textarea
//                   id="professionalSummary"
//                   name="personalInfo.professionalSummary"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.professionalSummary}
//                   onChange={formik.handleChange}
//                   rows="4"
//                   placeholder="Brief summary about your professional background"
//                 ></textarea>
//               </div>

//               <div className="form-group">
//                 <label htmlFor="linkedInUrl" className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
//                 <input
//                   type="text"
//                   id="linkedInUrl"
//                   name="personalInfo.linkedInUrl"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.linkedInUrl}
//                   onChange={formik.handleChange}
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700">Facebook URL</label>
//                 <input
//                   type="text"
//                   id="facebookUrl"
//                   name="personalInfo.facebookUrl"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.facebookUrl}
//                   onChange={formik.handleChange}
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700">Twitter URL</label>
//                 <input
//                   type="text"
//                   id="twitterUrl"
//                   name="personalInfo.twitterUrl"
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                   value={formik.values.personalInfo.twitterUrl}
//                   onChange={formik.handleChange}
//                 />
//               </div>
                
//               <div className="form-group col-span-2">
//                 <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Upload Resume</label>
//                 <input
//                   type="file"
//                   id="resume"
//                   className="mt-1 block w-full text-sm text-gray-500
//                     file:mr-4 file:py-2 file:px-4
//                     file:rounded-md file:border-0
//                     file:text-sm file:font-semibold
//                     file:bg-indigo-50 file:text-indigo-700
//                     hover:file:bg-indigo-100"
//                   onChange={(event) => {
//                     // Here you would handle file upload to a server
//                     // and set the returned URL to formik.values.personalInfo.resume
//                   }}
//                   accept=".pdf,.doc,.docx"
//                 />
//               </div>

//               <div className="form-group col-span-2">
//                 <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">Profile Image</label>
//                 <input
//                   type="file"
//                   id="profileImage"
//                   className="mt-1 block w-full text-sm text-gray-500
//                     file:mr-4 file:py-2 file:px-4
//                     file:rounded-md file:border-0
//                     file:text-sm file:font-semibold
//                     file:bg-indigo-50 file:text-indigo-700
//                     hover:file:bg-indigo-100"
//                   onChange={(event) => {
//                     // Here you would handle file upload to a server
//                     // and set the returned URL to formik.values.personalInfo.image
//                   }}
//                   accept="image/*"
//                 />
//               </div>

//               <div className="form-group col-span-2 mt-6">
//                 <label className="block text-lg font-medium text-gray-700 mb-2">Profile Video/Audio</label>
                
//                 <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
//                   <button
//                     type="button"
//                     className={`py-2 px-4 rounded-md ${isRecording 
//                       ? 'bg-red-600 hover:bg-red-700 text-white' 
//                       : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
//                     onClick={isRecording ? stopRecording : startRecording}
//                   >
//                     <div className="flex items-center">
//                       {isRecording ? (
//                         <>
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
//                           </svg>
//                           Stop Recording
//                         </>
//                       ) : (
//                         <>
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
//                           </svg>
//                           Start Recording
//                         </>
//                       )}
//                     </div>
//                   </button>
                  
//                   {isRecording && (
//                     <div className="flex items-center text-red-600">
//                       <span className="animate-pulse">●</span>
//                       <span className="ml-2">Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
//                     </div>
//                   )}
//                 </div>
                
//                 {audioURL && (
//                   <div className="mt-4">
//                     <audio controls src={audioURL} className="w-full"></audio>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <h3 className="text-lg font-medium text-gray-700 mt-6 mb-3">Preferred Job Locations</h3>
            
//             {jobLocations.map((location, index) => (
//               <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded mb-4">
//                 <div className="form-group">
//                   <label className="block text-sm font-medium text-gray-700">State</label>
//                   <select
//                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                     value={location.state}
//                     onChange={(e) => {
//                       const newLocations = [...jobLocations];
//                       newLocations[index].state = e.target.value;
//                       setJobLocations(newLocations);
//                     }}
//                   >
//                     <option value="">Select State</option>
//                     {/* Add states from API */}
//                   </select>
//                 </div>
                
//                 <div className="form-group">
//                   <label className="block text-sm font-medium text-gray-700">City</label>
//                   <select
//                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                     value={location.city}
//                     onChange={(e) => {
//                       const newLocations = [...jobLocations];
//                       newLocations[index].city = e.target.value;
//                       setJobLocations(newLocations);
//                     }}
//                   >
//                     <option value="">Select City</option>
//                     {/* Add cities from API based on selected state */}
//                   </select>
//                 </div>
                
//                 <div className="col-span-2 flex justify-end">
//                   {jobLocations.length > 1 && (
//                     <button
//                       type="button"
//                       className="text-red-600 hover:text-red-800"
//                       onClick={() => {
//                         setJobLocations(jobLocations.filter((_, i) => i !== index));
//                       }}
//                     >
//                       Remove
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}
            
//             <button
//               type="button"
//               className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800"
//               onClick={() => setJobLocations([...jobLocations, { state: '', city: '' }])}
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//               </svg>
//               Add Another Location
//             </button>

//             <div className="form-group mt-6">
//               <div className="flex items-start">
//                 <div className="flex items-center h-5">
//                   <input
//                     id="declaration"
//                     name="personalInfo.declaration.isChecked"
//                     type="checkbox"
//                     className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                     checked={formik.values.personalInfo.declaration.isChecked}
//                     onChange={formik.handleChange}
//                   />
//                 </div>
//                 <div className="ml-3 text-sm">
//                   <label htmlFor="declaration" className="font-medium text-gray-700">Declaration</label>
//                   <p className="text-gray-500">I hereby declare that all the information provided above is true to the best of my knowledge.</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case 1:
//         return (
//           <div className="p-4 bg-white rounded shadow">
//             <h2 className="text-xl font-bold mb-4">Qualifications</h2>
            
//             {qualifications.map((qualification, index) => (
//               <div key={index} className="p-4 border rounded mb-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">Qualification</label>
//                     <select
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.Qualification}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].Qualification = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     >
//                       <option value="">Select Qualification</option>
//                       {/* Add qualifications from API */}
//                     </select>
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">Sub Qualification</label>
//                     <select
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.subQualification}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].subQualification = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     >
//                       <option value="">Select Sub Qualification</option>
//                       {/* Add sub qualifications from API based on selected qualification */}
//                     </select>
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">Course</label>
//                     <select
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.QualificationCourse}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].QualificationCourse = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     >
//                       <option value="">Select Course</option>
//                       {/* Add courses from API based on selected sub qualification */}
//                     </select>
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">College/Institute</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.College}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].College = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     />
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">University</label>
//                     <select
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.UniversityName}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].UniversityName = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     >
//                       <option value="">Select University</option>
//                       {/* Add universities from API */}
//                     </select>
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">Passing Year</label>
//                     <select
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.PassingYear}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].PassingYear = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     >
//                       <option value="">Select Year</option>
//                       {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
//                         <option key={year} value={year}>{year}</option>
//                       ))}
//                     </select>
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">City</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.location.city}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].location.city = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     />
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">State</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.location.state}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].location.state = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     />
//                   </div>
                  
//                   <div className="form-group col-span-2">
//                     <label className="block text-sm font-medium text-gray-700">Address</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={qualification.location.fullAddress}
//                       onChange={(e) => {
//                         const newQualifications = [...qualifications];
//                         newQualifications[index].location.fullAddress = e.target.value;
//                         setQualifications(newQualifications);
//                       }}
//                     />
//                   </div>
//                 </div>
                
//                 <div className="flex justify-end mt-4">
//                   {qualifications.length > 1 && (
//                     <button
//                       type="button"
//                       className="text-red-600 hover:text-red-800"
//                       onClick={() => {
//                         setQualifications(qualifications.filter((_, i) => i !== index));
//                       }}
//                     >
//                       Remove
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}
            
//             <button
//               type="button"
//               className="flex items-center text-indigo-600 hover:text-indigo-800"
//               onClick={() => setQualifications([...qualifications, { 
//                 Qualification: '', 
//                 subQualification: '', 
//                 QualificationCourse: '', 
//                 College: '', 
//                 UniversityName: '',
//                 PassingYear: '',
//                 location: {
//                   city: '',
//                   state: '',
//                   fullAddress: ''
//                 }
//               }])}
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//               </svg>
//               Add Another Qualification
//             </button>
            
//             <div className="mt-6">
//               <div className="flex items-center">
//                 <input
//                   id="isExperienced"
//                   name="isExperienced"
//                   type="checkbox"
//                   className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                   checked={formik.values.isExperienced}
//                   onChange={(e) => {
//                     formik.setFieldValue('isExperienced', e.target.checked);
//                   }}
//                 />
//                 <label htmlFor="isExperienced" className="ml-2 block text-sm font-medium text-gray-700">
//                   I have work experience
//                 </label>
//               </div>
//             </div>
//           </div>
//         );
        
//       case 2:
//         return (
//           <div className="p-4 bg-white rounded shadow">
//             <h2 className="text-xl font-bold mb-4">Experience</h2>
            
//             {!formik.values.isExperienced ? (
//               <div className="bg-yellow-50 p-4 rounded-md">
//                 <p className="text-yellow-700">You have indicated that you don't have any work experience. You can skip this section or go back and check "I have work experience" if you want to add experience details.</p>
//               </div>
//             ) : (
//               <>
//                 {experiences.map((experience, index) => (
//                   <div key={index} className="p-4 border rounded mb-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div className="form-group">
//                         <label className="block text-sm font-medium text-gray-700">Industry</label>
//                         <select
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           value={experience.Industry_Name}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].Industry_Name = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                         >
//                           <option value="">Select Industry</option>
//                           {/* Add industries from API */}
//                         </select>
//                       </div>
                      
//                       <div className="form-group">
//                         <label className="block text-sm font-medium text-gray-700">Sub Industry</label>
//                         <select
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           value={experience.SubIndustry_Name}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].SubIndustry_Name = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                         >
//                           <option value="">Select Sub Industry</option>
//                           {/* Add sub industries from API based on selected industry */}
//                         </select>
//                       </div>
                      
//                       <div className="form-group">
//                         <label className="block text-sm font-medium text-gray-700">Company Name</label>
//                         <input
//                           type="text"
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           value={experience.Company_Name}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].Company_Name = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                         />
//                       </div>
                      
//                       <div className="form-group">
//                         <label className="block text-sm font-medium text-gray-700">State</label>
//                         <input
//                           type="text"
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           value={experience.Company_State}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].Company_State = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                         />
//                       </div>
                      
//                       <div className="form-group">
//                         <label className="block text-sm font-medium text-gray-700">City</label>
//                         <input
//                           type="text"
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           value={experience.Company_City}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].Company_City = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                         />
//                       </div>
                      
//                       <div className="form-group">
//                         <label className="block text-sm font-medium text-gray-700">From Date</label>
//                         <input
//                           type="month"
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           value={experience.FromDate}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].FromDate = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                         />
//                       </div>
                      
//                       <div className="form-group">
//                         <label className="block text-sm font-medium text-gray-700">To Date</label>
//                         <input
//                           type="month"
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           value={experience.ToDate}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].ToDate = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                         />
//                       </div>
                      
//                       <div className="form-group col-span-2">
//                         <label className="block text-sm font-medium text-gray-700">Comments</label>
//                         <textarea
//                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                           rows="3"
//                           value={experience.Comments}
//                           onChange={(e) => {
//                             const newExperiences = [...experiences];
//                             newExperiences[index].Comments = e.target.value;
//                             setExperiences(newExperiences);
//                           }}
//                           placeholder="Describe your responsibilities and achievements"
//                         ></textarea>
//                       </div>
//                     </div>
                    
//                     <div className="flex justify-end mt-4">
//                       {experiences.length > 1 && (
//                         <button
//                           type="button"
//                           className="text-red-600 hover:text-red-800"
//                           onClick={() => {
//                             setExperiences(experiences.filter((_, i) => i !== index));
//                           }}
//                         >
//                           Remove
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
                
//                 <button
//                   type="button"
//                   className="flex items-center text-indigo-600 hover:text-indigo-800"
//                   onClick={() => setExperiences([...experiences, { 
//                     Industry_Name: '', 
//                     SubIndustry_Name: '', 
//                     Company_Name: '', 
//                     Company_State: '', 
//                     Company_City: '', 
//                     Comments: '', 
//                     FromDate: '', 
//                     ToDate: '' 
//                   }])}
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//                   </svg>
//                   Add Another Experience
//                 </button>
//               </>
//             )}
//           </div>
//         );

//       case 3:
//         return (
//           <div className="p-4 bg-white rounded shadow">
//             <h2 className="text-xl font-bold mb-4">Skills</h2>
            
//             <div className="mb-6">
//               <h3 className="text-lg font-medium text-gray-700 mb-3">Skills</h3>
              
//               {skills.map((skill, index) => (
//                 <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center mb-3">
//                   <div className="md:col-span-3 form-group">
//                     <label className="block text-sm font-medium text-gray-700">Skill Name</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={skill.skillName}
//                       onChange={(e) => {
//                         const newSkills = [...skills];
//                         newSkills[index].skillName = e.target.value;
//                         setSkills(newSkills);
//                       }}
//                     />
//                   </div>
                  
//                   <div className="md:col-span-2 form-group">
//                     <label className="block text-sm font-medium text-gray-700">Proficiency (%)</label>
//                     <input
//                       type="range"
//                       min="0"
//                       max="100"
//                       className="mt-1 block w-full"
//                       value={skill.skillPercent}
//                       onChange={(e) => {
//                         const newSkills = [...skills];
//                         newSkills[index].skillPercent = parseInt(e.target.value);
//                         setSkills(newSkills);
//                       }}
//                     />
//                     <div className="text-center mt-1">{skill.skillPercent}%</div>
//                   </div>
                  
//                   <div className="flex justify-end items-end h-full">
//                     {skills.length > 1 && (
//                       <button
//                         type="button"
//                         className="text-red-600 hover:text-red-800 mt-6"
//                         onClick={() => {
//                           setSkills(skills.filter((_, i) => i !== index));
//                         }}
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
              
//               <button
//                 type="button"
//                 className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
//                 onClick={() => setSkills([...skills, { skillName: '', skillPercent: 0 }])}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//                 </svg>
//                 Add Another Skill
//               </button>
//             </div>
            
//             <div className="mb-6">
//               <h3 className="text-lg font-medium text-gray-700 mb-3">Certifications</h3>
              
//               {certifications.map((certification, index) => (
//                 <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border rounded mb-3">
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">Certificate Name</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={certification.certificateName}
//                       onChange={(e) => {
//                         const newCertifications = [...certifications];
//                         newCertifications[index].certificateName = e.target.value;
//                         setCertifications(newCertifications);
//                       }}
//                     />
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">Organization Name</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={certification.orgName}
//                       onChange={(e) => {
//                         const newCertifications = [...certifications];
//                         newCertifications[index].orgName = e.target.value;
//                         setCertifications(newCertifications);
//                       }}
//                     />
//                   </div>
                  
//                   <div className="form-group">
//                     <label className="block text-sm font-medium text-gray-700">Year</label>
//                     <select
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={certification.year}
//                       onChange={(e) => {
//                         const newCertifications = [...certifications];
//                         newCertifications[index].year = e.target.value;
//                         setCertifications(newCertifications);
//                       }}
//                     >
//                       <option value="">Select Year</option>
//                       {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
//                         <option key={year} value={year.toString()}>{year}</option>
//                       ))}
//                     </select>
//                   </div>
                  
//                   <div className="md:col-span-3 flex justify-end">
//                     {certifications.length > 1 && (
//                       <button
//                         type="button"
//                         className="text-red-600 hover:text-red-800"
//                         onClick={() => {
//                           setCertifications(certifications.filter((_, i) => i !== index));
//                         }}
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
              
//               <button
//                 type="button"
//                 className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
//                 onClick={() => setCertifications([...certifications, { certificateName: '', orgName: '', year: '' }])}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//                 </svg>
//                 Add Another Certification
//               </button>
//             </div>
            
//             <div className="mb-6">
//               <h3 className="text-lg font-medium text-gray-700 mb-3">Languages</h3>
              
//               {languages.map((language, index) => (
//                 <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center mb-3">
//                   <div className="md:col-span-3 form-group">
//                     <label className="block text-sm font-medium text-gray-700">Language</label>
//                     <input
//                       type="text"
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={language.lname}
//                       onChange={(e) => {
//                         const newLanguages = [...languages];
//                         newLanguages[index].lname = e.target.value;
//                         setLanguages(newLanguages);
//                       }}
//                     />
//                   </div>
                  
//                   <div className="md:col-span-2 form-group">
//                     <label className="block text-sm font-medium text-gray-700">Proficiency Level</label>
//                     <select
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                       value={language.level}
//                       onChange={(e) => {
//                         const newLanguages = [...languages];
//                         newLanguages[index].level = parseInt(e.target.value);
//                         setLanguages(newLanguages);
//                       }}
//                     >
//                       <option value="1">Beginner</option>
//                       <option value="2">Intermediate</option>
//                       <option value="3">Advanced</option>
//                       <option value="4">Fluent</option>
//                       <option value="5">Native</option>
//                     </select>
//                   </div>
                  
//                   <div className="md:col-span-3 form-group">
//                     {languages.length > 1 && (
//                       <button
//                         type="button"
//                         className="text-red-600 hover:text-red-800"
//                         onClick={() => {
//                           setLanguages(languages.filter((_, i) => i !== index));
//                         }}
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
              
//               <button
//                 type="button"
//                 className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
//                 onClick={() => setLanguages([...languages, { lname: '', level: 1 }])}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//                 </svg>
//                 Add Another Language
//               </button>
//             </div>
//           </div>
//         );
        
//       case 4:
//         return (
//           <div className="p-4 bg-white rounded shadow">
//             <h2 className="text-xl font-bold mb-4">Additional Information</h2>
            
//             <div className="mb-6">
//               <h3 className="text-lg font-medium text-gray-700 mb-3">Projects</h3>
              
//               {projects.map((project, index) => (
//                 <div key={index} className="p-3 border rounded mb-3">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="form-group">
//                       <label className="block text-sm font-medium text-gray-700">Project Name</label>
//                       <input
//                         type="text"
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                         value={project.projectName}
//                         onChange={(e) => {
//                           const newProjects = [...projects];
//                           newProjects[index].projectName = e.target.value;
//                           setProjects(newProjects);
//                         }}
//                       />
//                     </div>
                    
//                     <div className="form-group">
//                       <label className="block text-sm font-medium text-gray-700">Year</label>
//                       <select
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                         value={project.proyear}
//                         onChange={(e) => {
//                           const newProjects = [...projects];
//                           newProjects[index].proyear = parseInt(e.target.value);
//                           setProjects(newProjects);
//                         }}
//                       >
//                         <option value="">Select Year</option>
//                         {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
//                           <option key={year} value={year}>{year}</option>
//                         ))}
//                       </select>
//                     </div>
                    
//                     <div className="form-group col-span-2">
//                       <label className="block text-sm font-medium text-gray-700">Description</label>
//                       <textarea
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                         rows="3"
//                         value={project.proDescription}
//                         onChange={(e) => {
//                           const newProjects = [...projects];
//                           newProjects[index].proDescription = e.target.value;
//                           setProjects(newProjects);
//                         }}
//                       ></textarea>
//                     </div>
//                   </div>
                  
//                   <div className="flex justify-end mt-2">
//                     {projects.length > 1 && (
//                       <button
//                         type="button"
//                         className="text-red-600 hover:text-red-800"
//                         onClick={() => {
//                           setProjects(projects.filter((_, i) => i !== index));
//                         }}
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
              
//               <button
//                 type="button"
//                 className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
//                 onClick={() => setProjects([...projects, { projectName: '', proyear: '', proDescription: '' }])}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//                 </svg>
//                 Add Another Project
//               </button>
//             </div>
            
//             <div className="mb-6">
//               <h3 className="text-lg font-medium text-gray-700 mb-3">Interests</h3>
              
//               {interests.map((interest, index) => (
//                 <div key={index} className="flex items-center space-x-2 mb-2">
//                   <input
//                     type="text"
//                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                     value={interest}
//                     onChange={(e) => {
//                       const newInterests = [...interests];
//                       newInterests[index] = e.target.value;
//                       setInterests(newInterests);
//                     }}
//                     placeholder="e.g. Reading, Playing Guitar, Traveling"
//                   />
                  
//                   {interests.length > 1 && (
//                     <button
//                       type="button"
//                       className="text-red-600 hover:text-red-800"
//                       onClick={() => {
//                         setInterests(interests.filter((_, i) => i !== index));
//                       }}
//                     >
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                       </svg>
//                     </button>
//                   )}
//                 </div>
//               ))}
              
//               <button
//                 type="button"
//                 className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
//                 onClick={() => setInterests([...interests, ''])}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//                 </svg>
//                 Add Another Interest
//               </button>
//             </div>
//           </div>
//         );
        
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold text-center mb-8">Candidate Profile</h1>
      
//       <div className="mb-6">
//         <div className="flex overflow-x-auto">
//           <div className="flex space-x-4 p-2">
//             {steps.map((step, index) => (
//               <button
//                 key={index}
//                 className={`px-4 py-2 rounded-lg whitespace-nowrap ${
//                   activeStep === index 
//                     ? 'bg-indigo-600 text-white' 
//                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                 }`}
//                 onClick={() => setActiveStep(index)}
//               >
//                 {index + 1}. {step}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
      
//       <form onSubmit={formik.handleSubmit}>
//         {renderFormSection()}
        
//         <div className="flex justify-between mt-6">
//           {activeStep > 0 && (
//             <button
//               type="button"
//               className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
//               onClick={handleBack}
//             >
//               Previous
//             </button>
//           )}
          
//           {activeStep < steps.length - 1 ? (
//             <button
//               type="button"
//               className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg ml-auto"
//               onClick={handleNext}
//             >
//               Next
//             </button>
//           ) : (
//             <button
//               type="submit"
//               className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg ml-auto"
//             >
//               Submit
//             </button>
//           )}
//         </div>
//       </form>


//       <style>
//         {`
//           /* Resume Builder Container */
// .resume-builder-container {
//   font-family: 'Roboto', Arial, sans-serif;
//   max-width: 1200px;
//   margin: 0 auto;
//   padding: 30px;
//   background-color: #f9f9f9;
//   border-radius: 10px;
//   box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
// }

// /* Header */
// .resume-builder-header {
//   text-align: center;
//   padding-bottom: 20px;
//   border-bottom: 1px solid #eee;
// }

// .resume-builder-title {
//   font-size: 28px;
//   font-weight: 700;
//   color: #333;
//   margin-bottom: 15px;
// }

// /* Profile Strength Meter */
// .profile-strength-meter {
//   max-width: 600px;
//   margin: 20px auto;
//   padding: 15px;
//   background-color: #fff;
//   border-radius: 8px;
//   box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
// }

// .strength-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 10px;
// }

// .strength-label {
//   font-size: 16px;
//   font-weight: 500;
//   color: #333;
// }

// .strength-badge {
//   font-size: 18px;
//   font-weight: 700;
//   color: #fc2b5a;
// }

// .strength-level {
//   font-size: 14px;
//   color: #666;
// }

// .progress {
//   height: 10px;
//   background-color: #e9ecef;
//   border-radius: 5px;
//   overflow: hidden;
// }

// .progress-bar {
//   height: 100%;
//   border-radius: 5px;
//   transition: width 0.3s ease;
// }

// /* Navigation Tabs */
// .resume-tabs {
//   margin-bottom: 25px;
// }

// .nav-tabs {
//   border-bottom: 1px solid #ddd;
// }

// .nav-tabs .nav-link {
//   border: none;
//   border-bottom: 3px solid transparent;
//   border-radius: 0;
//   color: #555;
//   font-weight: 500;
//   padding: 12px 20px;
//   transition: all 0.2s;
// }

// .nav-tabs .nav-link:hover {
//   border-color: transparent;
//   color: #fc2b5a;
//   background: none;
// }

// .nav-tabs .nav-link.active {
//   color: #fc2b5a;
//   border-color: #fc2b5a;
//   background: none;
// }

// /* Resume Content */
// .resume-section {
//   display: none;
// }

// .resume-section.active {
//   display: block;
// }

// .resume-paper {
//   background-color: #fff;
//   border-radius: 8px;
//   padding: 30px;
//   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
//   min-height: 500px;
// }

// .section-title {
//   font-size: 20px;
//   font-weight: 600;
//   color: #333;
//   margin-bottom: 25px;
//   padding-bottom: 10px;
//   border-bottom: 2px solid #f1f1f1;
// }

// /* Personal Info */
// .resume-header {
//   display: flex;
//   gap: 30px;
//   margin-bottom: 30px;
// }

// .profile-image-container {
//   flex-shrink: 0;
// }

// .profile-image {
//   width: 150px;
//   height: 150px;
//   border-radius: 50%;
//   overflow: hidden;
//   background-color: #f1f1f1;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   position: relative;
//   border: 3px solid #fff;
//   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
// }

// .profile-image img {
//   width: 100%;
//   height: 100%;
//   object-fit: cover;
// }

// .profile-placeholder {
//   font-size: 60px;
//   color: #ccc;
// }

// .image-upload-overlay {
//   position: absolute;
//   bottom: 0;
//   left: 0;
//   right: 0;
//   background: rgba(0, 0, 0, 0.6);
//   color: white;
//   padding: 5px 0;
//   text-align: center;
//   cursor: pointer;
//   opacity: 0;
//   transition: opacity 0.3s;
// }

// .profile-image:hover .image-upload-overlay {
//   opacity: 1;
// }

// .profile-info {
//   flex: 1;
// }

// .profile-name {
//   font-size: 26px;
//   font-weight: 700;
//   color: #333;
//   margin-bottom: 8px;
// }

// .profile-title {
//   font-size: 18px;
//   color: #555;
//   margin-bottom: 15px;
// }

// .profile-summary {
//   font-size: 15px;
//   line-height: 1.5;
//   color: #666;
//   margin-bottom: 20px;
// }

// .contact-info {
//   display: flex;
//   flex-wrap: wrap;
//   gap: 15px;
// }

// .contact-item {
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   font-size: 14px;
//   color: #555;
// }

// .contact-item i {
//   color: #fc2b5a;
// }

// /* Experience Section */
// .experience-item, .education-item {
//   position: relative;
//   padding: 20px;
//   margin-bottom: 20px;
//   background-color: #f9f9f9;
//   border-radius: 8px;
//   border-left: 3px solid #fc2b5a;
// }

// .item-controls {
//   position: absolute;
//   top: 10px;
//   right: 10px;
// }

// .remove-button {
//   background: none;
//   border: none;
//   color: #dc3545;
//   cursor: pointer;
//   font-size: 16px;
//   position: absolute;
//     top: 1px;
//     right: 2px;
//     z-index: 10;
//     width:15px;
//     height:15px;
// }

// .remove-button:hover {
//   color: #bd2130;
// }

// .job-title, .degree-select {
//   font-size: 18px;
//   font-weight: 600;
//   color: #333;
//   margin-bottom: 5px;
// }

// .company-name, .university {
//   font-size: 16px;
//   color: #555;
//   margin-bottom: 10px;
// }

// .date-range, .passing-year {
//   font-size: 14px;
//   color: #777;
//   margin-bottom: 15px;
//   display: flex;
//   align-items: center;
//   flex-wrap: wrap;
//   gap: 10px;
// }

// .date-label {
//   font-weight: 500;
// }

// .date-input {
//   border: 1px solid #ddd;
//   padding: 5px 10px;
//   border-radius: 4px;
// }

// .job-description, .additional-info {
//   background-color: #fff;
//   padding: 15px;
//   border-radius: 6px;
//   font-size: 14px;
//   line-height: 1.5;
//   color: #555;
// }

// /* Skills Section */
// .skills-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//   gap: 20px;
//   margin-bottom: 20px;
// }

// .skill-item {
//   padding: 15px;
//   background-color: #f9f9f9;
//   border-radius: 8px;
// }

// .skill-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 10px;
// }

// .skill-edit {
//   display: flex;
//   justify-content: space-between;
//   width: 100%;
//   margin-right: 10px;
// }

// .skill-name {
//   font-weight: 500;
//   color: #333;
// }

// .skill-level {
//   font-size: 14px;
//   color: #666;
// }

// .remove-skill {
//   background: none;
//   border: none;
//   color: #dc3545;
//   cursor: pointer;
//   font-size: 14px;
// }

// .skill-slider {
//   width: 100%;
// }

// /* Additional Sections */
// .extras-section {
//   display: flex;
//   flex-direction: column;
//   gap: 30px;
// }

// .extra-category {
//   margin-bottom: 25px;
// }

// .category-title {
//   font-size: 18px;
//   font-weight: 600;
//   color: #333;
//   margin-bottom: 15px;
//   padding-bottom: 8px;
//   border-bottom: 1px solid #eee;
// }

// /* Languages */
// .languages-list {
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
//   gap: 15px;
//   margin-bottom: 20px;
// }

// .language-item {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: 12px 15px;
//   background-color: #f9f9f9;
//   border-radius: 8px;
// }

// .language-details {
//   flex: 1;
// }

// .language-proficiency {
//   display: flex;
//   gap: 5px;
//   margin-top: 5px;
// }

// .proficiency-dot {
//   width: 12px;
//   height: 12px;
//   border-radius: 50%;
//   background-color: #ddd;
//   cursor: pointer;
// }

// .proficiency-dot.filled {
//   background-color: #fc2b5a;
// }

// .remove-language {
//   background: none;
//   border: none;
//   color: #dc3545;
//   cursor: pointer;
//   font-size: 14px;
// }

// /* Certifications */
// .certifications-list {
//   display: flex;
//   flex-direction: column;
//   gap: 15px;
//   margin-bottom: 20px;
// }

// .certificate-item {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   padding: 15px;
//   background-color: #f9f9f9;
//   border-radius: 8px;
// }

// .certificate-details {
//   flex: 1;
// }

// .certificate-name {
//   font-weight: 500;
//   margin-bottom: 5px;
// }

// .certificate-issuer {
//   font-size: 14px;
//   color: #666;
// }

// .remove-certificate {
//   background: none;
//   border: none;
//   color: #dc3545;
//   cursor: pointer;
//   font-size: 14px;
// }

// /* Projects */
// .projects-list {
//   display: flex;
//   flex-direction: column;
//   gap: 15px;
//   margin-bottom: 20px;
// }

// .project-item {
//   display: flex;
//   justify-content: space-between;
//   padding: 15px;
//   background-color: #f9f9f9;
//   border-radius: 8px;
// }

// .project-details {
//   flex: 1;
// }

// .project-header {
//   display: flex;
//   justify-content: space-between;
//   margin-bottom: 10px;
// }

// .project-name {
//   font-weight: 500;
// }

// .project-year {
//   font-size: 14px;
//   color: #777;
// }

// .project-description {
//   font-size: 14px;
//   line-height: 1.5;
//   color: #555;
// }

// .remove-project {
//   background: none;
//   border: none;
//   color: #dc3545;
//   cursor: pointer;
//   font-size: 14px;
//   align-self: flex-start;
// }

// /* Interests */
// .interests-container {
//   margin-bottom: 20px;
// }

// .interests-tags {
//   display: flex;
//   flex-wrap: wrap;
//   gap: 10px;
//   margin-bottom: 15px;
// }

// .interest-tag {
//   display: flex;
//   align-items: center;
//   background-color: #f1f1f1;
//   border-radius: 30px;
//   padding: 6px 15px;
//   font-size: 14px;
// }

// .remove-interest {
//   background: none;
//   border: none;
//   color: #777;
//   cursor: pointer;
//   font-size: 12px;
//   margin-left: 8px;
// }

// /* Declaration */
// .declaration-container {
//   padding: 15px;
//   background-color: #f9f9f9;
//   border-radius: 8px;
// }

// .declaration-content {
//   font-size: 14px;
//   line-height: 1.5;
//   color: #555;
//   min-height: 60px;
// }

// /* Voice Recording */
// .recording-container {
//   padding: 20px;
//   background-color: #f9f9f9;
//   border-radius: 8px;
// }

// .recording-controls {
//   text-align: center;
//   margin-bottom: 30px;
// }

// .recording-timer {
//   font-size: 36px;
//   font-weight: 700;
//   margin-bottom: 10px;
// }

// .recording-status {
//   margin-bottom: 20px;
//   color: #666;
//   min-height: 20px;
// }

// .control-buttons {
//   display: flex;
//   justify-content: center;
//   gap: 15px;
// }

// .record-button {
//   padding: 10px 20px;
//   background-color: #fc2b5a;
//   color: white;
//   border: none;
//   border-radius: 30px;
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   transition: all 0.2s;
// }

// .record-button:hover {
//   background-color: #e6255c;
// }

// .record-button.recording {
//   background-color: #dc3545;
//   animation: pulse 1.5s infinite;
// }

// @keyframes pulse {
//   0% { transform: scale(1); }
//   50% { transform: scale(1.05); }
//   100% { transform: scale(1); }
// }

// .recordings-list {
//   margin-top: 30px;
// }

// .recordings-list h5 {
//   margin-bottom: 15px;
//   font-size: 18px;
// }

// .no-recordings {
//   text-align: center;
//   padding: 20px;
//   color: #777;
//   font-style: italic;
// }

// .recording-item {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: 15px;
//   background-color: #fff;
//   border-radius: 8px;
//   margin-bottom: 10px;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
// }

// .recording-info {
//   flex: 1;
// }

// .recording-name {
//   font-weight: 500;
//   margin-bottom: 5px;
// }

// .recording-timestamp {
//   font-size: 12px;
//   color: #777;
// }

// .recording-actions {
//   display: flex;
//   align-items: center;
//   gap: 15px;
// }

// .audio-player {
//   height: 30px;
// }

// .delete-recording {
//   background: none;
//   border: none;
//   color: #dc3545;
//   cursor: pointer;
// }

// /* Add Button */
// .add-button {
//   padding: 8px 16px;
//   background-color: #fc2b5a;
//   color: white;
//   border: none;
//   border-radius: 30px;
//   cursor: pointer;
//   font-size: 14px;
//   display: inline-flex;
//   align-items: center;
//   gap: 8px;
//   transition: all 0.2s;
// }

// .add-button:hover {
//   background-color: #e6255c;
// }

// /* Action Buttons */
// .resume-actions {
//   margin-top: 30px;
//   display: flex;
//   justify-content: flex-end;
//   gap: 15px;
// }

// .upload-resume, .save-resume, .preview-resume {
//   padding: 10px 20px;
//   border-radius: 30px;
//   cursor: pointer;
//   font-size: 15px;
//   font-weight: 500;
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   transition: all 0.2s;
// }

// .upload-resume {
//   background-color: #f8f9fa;
//   color: #333;
//   border: 1px solid #ddd;
// }

// .upload-resume:hover {
//   background-color: #e9ecef;
// }

// .save-resume {
//   background-color: #28a745;
//   color: white;
//   border: none;
// }

// .save-resume:hover {
//   background-color: #218838;
// }

// .preview-resume {
//   background-color: #fc2b5a;
//   color: white;
//   border: none;
// }

// .preview-resume:hover {
//   background-color: #e6255c;
// }

// /* Editable Content */
// [contenteditable=true] {
//   min-height: 20px;
//   border: 1px solid transparent;
//   padding: 3px;
//   border-radius: 4px;
//   transition: border 0.2s;
//       min-width: 10%;
//     border: 1px solid #ddd;
// }

// [contenteditable=true]:hover {
//   border-color: #ddd;
// }

// [contenteditable=true]:focus {
//   outline: none;
//   border-color: #fc2b5a;
//   background-color: rgba(252, 43, 90, 0.05);
// }

// [contenteditable=true]:empty:before {
//   content: attr(data-placeholder);
//   color: #aaa;
//   cursor: text;
// }
// /* Remove Field Option Styling */
// .field-container {
//   position: relative;
// }

// .remove-field-btn {
//   position: absolute;
//   top: 8px;
//   right: 8px;
//   background: none;
//   border: none;
//   color: #dc3545;
//   cursor: pointer;
//   font-size: 16px;
//   width: 24px;
//   height: 24px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 50%;
//   opacity: 0;
//   transition: opacity 0.2s, background-color 0.2s;
// }

// .field-container:hover .remove-field-btn {
//   opacity: 1;
// }

// .remove-field-btn:hover {
//   background-color: rgba(220, 53, 69, 0.1);
// }

// /* Add this to the existing field items */
// .experience-item,
// .education-item,
// .skill-item,
// .certificate-item,
// .language-item,
// .project-item,
// .interest-tag {
//   position: relative;
// }
// /* Responsive Fixes */
// @media (max-width: 768px) {
//   .resume-builder-container {
//     padding: 15px;
//   }
  
//   .resume-header {
//     flex-direction: column;
//     align-items: center;
//   }
  
//   .profile-image-container {
//     margin-bottom: 20px;
//   }
  
//   .profile-info {
//     text-align: center;
//   }
  
//   .contact-info {
//     justify-content: center;
//   }
  
//   .skills-grid, .languages-list {
//     grid-template-columns: 1fr;
//   }
  
//   .recording-item {
//     flex-direction: column;
//     align-items: flex-start;
//   }
  
//   .recording-actions {
//     margin-top: 10px;
//     width: 100%;
//   }
  
//   .audio-player {
//     width: 100%;
//   }
  
//   .resume-actions {
//     flex-direction: column;
//   }
  
//   .upload-resume, .save-resume, .preview-resume {
//     width: 100%;
//     justify-content: center;
//   }
// }
//   `}
//       </style>
//     </div>
//   );
// };

// export default CandidateProfile;