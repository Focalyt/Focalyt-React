import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './CandidateProfile.css';

const CandidateNewProfile = () => {
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
  const [profileData, setProfileData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
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

  // Calculate profile strength using a useCallback
  const CandidateProfile = useCallback(() => {
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
  }, [user, experiences, educations, skills, languages, projects, interests, certificates, declaration]);

  useEffect(() => {
    CandidateProfile();  // Call only when dependencies change
  }, [CandidateProfile]);

  // Fetch profile data when the component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${backendUrl}/candidate/getProfile`, {
          headers: { 'x-auth': token }
        });
        
        if (response.data.status) {
          setProfileData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);  // This ensures it runs only once

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
          { id: Date.now(), url: audioUrl, timestamp, name: `Recording ${prevRecordings.length + 1}` },
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
      clearInterval(timerIntervalRef.current);  // Clear interval when stopping the recording
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
        personalInfo: {
          name: user.name,
          title: document.querySelector('[data-placeholder="Professional Title"]')?.textContent || '',
          summary: document.querySelector('[data-placeholder="Write a brief professional summary here..."]')?.textContent || '',
          email: document.querySelector('[data-placeholder="Email Address"]')?.textContent || '',
          location: document.querySelector('[data-placeholder="Location"]')?.textContent || '',
          image: user.image || '',
          resume: user.resume || '',
          voiceIntro: recordings.map(rec => ({
            name: rec.name,
            url: rec.url,
            timestamp: rec.timestamp,
            status: true
          }))
        },
        workexperience: experiences.map(e => ({
          jobTitle: e.jobTitle || '',
          companyName: e.companyName || '',
          jobDescription: e.jobDescription || ''
        })),
        education: educations.map(e => ({
          degree: e.degree || '',
          university: e.university || '',
          duration: e.duration || '',
          addInfo: e.additionalInfo || ''
        })),
        skill: skills.map(s => ({
          skillName: s.name,
          skillPercent: s.level
        })),
        certification: certificates.map(c => ({
          certificateName: c.name || '',
          orgName: c.org || ''
        })),
        language: languages.map(l => ({
          lname: l.name || '',
          level: l.level
        })),
        projects: projects.map(p => ({
          projectName: p.name || '',
          proyear: p.year || '',
          proDescription: p.description || ''
        })),
        interest: interests.filter(i => i !== ''),
        declaration: declaration
      };

      const res = await axios.post(`${backendUrl}/candidate/saveProfile`, cvPayload, {
        headers: { 'x-auth': token }
      });

      if (res.data.status) {
        alert('CV Saved Successfully!');
      } else {
        alert('Failed to save CV!');
      }
    } catch (err) {
      console.error('Error saving CV:', err);
      alert('An error occurred while saving your CV');
    }
  };

  return (
    <div className="resume-builder-container">
      <div className="resume-builder-header mb-4">
        <h2 className="resume-builder-title">Professional Resume Builder</h2>
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

      {/* Profile Sections */}
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

      {/* Preview Modal */}
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
        <div className="resume-document">
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
              {experiences.some(exp => exp.jobTitle || exp.companyName || exp.jobDescription) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Work Experience</h2>
                   {experiences.map((exp, index) => (
                    (exp.jobTitle || exp.companyName || exp.jobDescription) && (
                      <div className="resume-experience-item" key={index}>
                        <div className="resume-item-header">
                          <h3 className="resume-item-title">{exp.jobTitle || 'Job Title'}</h3>
                          <p className="resume-item-subtitle">{exp.companyName || 'Company Name'}</p>
                          <p className="resume-item-period">
                            {exp.from || 'Start Date'} - {exp.to || 'Present'}
                          </p>
                        </div>
                        <div className="resume-item-content">
                          <p>{exp.jobDescription || 'No job description provided'}</p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              {/* Education Section */}
              {educations.some(edu => edu.degree || edu.university || edu.additionalInfo) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Education</h2>
                  {educations.map((edu, index) => (
                    (edu.degree || edu.university || edu.additionalInfo) && (
                      <div className="resume-education-item" key={index}>
                        <div className="resume-item-header">
                          <h3 className="resume-item-title">{edu.degree || 'Degree'}</h3>
                          <p className="resume-item-subtitle">{edu.university || edu.school || 'University/Institution'}</p>
                          <p className="resume-item-period">{edu.passingYear || edu.duration || 'Graduation Year'}</p>
                        </div>
                        <div className="resume-item-content">
                          <p>{edu.additionalInfo || ''}</p>
                          {edu.marks && <p>Marks: {edu.marks}%</p>}
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
              {skills.some(skill => skill.name) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Skills</h2>
                  <div className="resume-skills-list">
                    {skills.map((skill, index) => (
                      skill.name && (
                        <div className="resume-skill-item" key={index}>
                          <div className="resume-skill-name">{skill.name}</div>
                          <div className="resume-skill-bar-container">
                            <div 
                              className="resume-skill-bar" 
                              style={{width: `${skill.level || 0}%`}}
                            ></div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Languages Section */}
              {languages.some(lang => lang.name) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Languages</h2>
                  <div className="resume-languages-list">
                    {languages.map((lang, index) => (
                      lang.name && (
                        <div className="resume-language-item" key={index}>
                          <div className="resume-language-name">{lang.name}</div>
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
              {certificates.some(cert => cert.name || cert.org) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Certifications</h2>
                  <ul className="resume-certifications-list">
                    {certificates.map((cert, index) => (
                      (cert.name || cert.org) && (
                        <li key={index}>
                          <strong>{cert.name || 'Certificate'}</strong>
                          {cert.org && <span> - {cert.org}</span>}
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Projects Section */}
              {projects.some(proj => proj.name || proj.description) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Projects</h2>
                  {projects.map((proj, index) => (
                    (proj.name || proj.description) && (
                      <div className="resume-project-item" key={index}>
                        <div className="resume-item-header">
                          <h3 className="resume-project-title">
                            {proj.name || 'Project'}
                            {proj.year && <span className="resume-project-year"> ({proj.year})</span>}
                          </h3>
                        </div>
                        <div className="resume-item-content">
                          <p>{proj.description || 'No project description provided'}</p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              {/* Interests Section */}
              {interests.some(interest => interest) && (
                <div className="resume-section">
                  <h2 className="resume-section-title">Interests</h2>
                  <div className="resume-interests-tags">
                    {interests.map((interest, index) => (
                      interest && (
                        <span className="resume-interest-tag" key={index}>
                          {interest}
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
            alert('Download functionality would be implemented here');
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

      {/* Actions */}
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
                  {createEditable('', 'Professional Title')}
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
  const updated = [...experiences];
  updated[index].jobTitle = val;
  setExperiences(updated);
})}

                </div>
                <div className="company-name">
                  {/* {createEditable(experience.companyName || '', 'Company Name')} */}
                  {createEditable(experience.companyName || '', 'Company Name', (val) => {
  const updated = [...experiences];
  updated[index].companyName = val;
  setExperiences(updated);
  setProfileData(prev => ({
    ...prev,
    experiences: updated
  }));
})}

                </div>

                <div className="date-range">
                  <span className="date-label">From:</span>
                  <input
                    type="month"
                    value={experience.from || ''}
                    onChange={(e) => {
                      const updated = [...experiences];
                      updated[index].from = e.target.value;
                      setExperiences(updated);
                    }}
                    className="date-input"
                  />

                  <span className="date-label">To:</span>
                  <input
                    type="month"
                    value={experience.to || ''}
                    onChange={(e) => {
                      const updated = [...experiences];
                      updated[index].to = e.target.value;
                      setExperiences(updated);
                    }}
                    className="date-input"
                  />
                </div>

                <div className="job-description">
                {createEditable(experience.jobDescription || '', 'Job Description', (val) => {
  const updated = [...experiences];
  updated[index].jobDescription = val;
  setExperiences(updated);
  setProfileData(prev => ({
    ...prev,
    experiences: updated
  }));
})}

                </div>
              </div>
            ))}

            <button
              className="add-button"
              onClick={() => setExperiences([...experiences, {}])}
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
                    // onChange={(e) => {
                    //   const updated = [...educations];
                    //   updated[index].degree = e.target.value;
                    //   setEducations(updated);
                    // }}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[index].school = e.target.value; 
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
                        value={edu.board || ''}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[index].board = e.target.value;
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
                        // onBlur={(e) => {
                        //   const updated = [...skills];
                        //   updated[index].name = e.target.innerText;
                        //   setSkills(updated);
                        // }}
                        onBlur={(e) => {
  const updated = [...skills];
  updated[index].name = e.target.innerText;
  setSkills(updated);
  setProfileData(prev => ({
    ...prev,
    skills: updated
  }));
}}
   >
                        {skill.name}
                      </div>
                      <span className="skill-level">{skill.level}%</span>
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
                      value={skill.level}
                      // onChange={(e) => {
                      //   const updated = [...skills];
                      //   updated[index].level = Number(e.target.value);
                      //   setSkills(updated);
                      // }}
                      onChange={(e) => {
                        const updated = [...skills];
                        updated[index].level = Number(e.target.value);
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
                          {createEditable(language.name || '', 'Language Name')}
                          <div className="language-proficiency">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <span
                                key={dot}
                                className={`proficiency-dot ${dot <= language.level ? 'filled' : ''}`}
                                onClick={() => {
                                  const updated = [...languages];
                                  updated[index].level = dot === language.level ? 0 : dot;
                                  setLanguages(updated);
                                }}
                              ></span>
                            ))}
                          </div>
                        </div>

                        {/* {languages.length > 1 && (
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
                      )} */}
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
                            {/* {createEditable(certificate.name || '', 'Certificate Name')} */}
                            {createEditable(certificate.name || '', 'Certificate Name', (val) => {
  const updated = [...certificates];
  updated[index].name = val;
  setCertificates(updated);
  setProfileData(prev => ({
    ...prev,
    certificates: updated
  }));
})}
                          </div>
                          <div className="certificate-issuer">
                            {/* {createEditable(certificate.org || '', 'Issuing Organization, Year')} */}
                            {createEditable(certificate.org || '', 'Issuing Organization, Year', (val) => {
  const updated = [...certificates];
  updated[index].org = val;
  setCertificates(updated);
  setProfileData(prev => ({
    ...prev,
    certificates: updated
  }));
})}
                          </div>
                        </div>

                        {/* {certificates.length > 1 && (
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
                      )} */}
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
                              {/* {createEditable(project.name || '', 'Project Name')} */}
                              {createEditable(project.name || '', 'Project Name', (val) => {
  const updated = [...projects];
  updated[index].name = val;
  setProjects(updated);
  setProfileData(prev => ({
    ...prev,
    projects: updated
  }));
})}

                            </div>
                            <div className="project-year">
                              {/* {createEditable(project.year || '', 'Year')} */}
                              {createEditable(project.year || '', 'Project Name', (val) => {
  const updated = [...projects];
  updated[index].name = val;
  setProjects(updated);
  setProfileData(prev => ({
    ...prev,
    projects: updated
  }));
})}

                            </div>
                          </div>
                          <div className="project-description">
                            {/* {createEditable(project.description || '', 'Project Description')} */}
                            {createEditable(project.project || '', 'Project Name', (val) => {
  const updated = [...projects];
  updated[index].name = val;
  setProjects(updated);
  setProfileData(prev => ({
    ...prev,
    projects: updated
  }));
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
                            // onBlur={(e) => {
                            //   const updated = [...interests];
                            //   updated[index] = e.target.innerText;
                            //   setInterests(updated);
                            // }}
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
        <button className="save-resume" onClick={handleSaveCV}>Save Resume</button>
        <button className="preview-resume" onClick={() => setShowPreview(true)}>Preview Resume</button>
      </div>
      {/* <div className="resume-actions">
        <button className="save-resume" onClick={handleSaveCV}>Save Resume</button>
        <button className="preview-resume" onClick={() => setShowPreview(true)}>Preview Resume</button>
      </div> */}
    </div>
  );
};

export default CandidateNewProfile;
