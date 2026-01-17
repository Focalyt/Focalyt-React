import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import CandidateHeader from './CandidateHeader/CandidateHeader'
import CandidateFooter from './CandidateFooter/CandidateFooter'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import User from './StepContainer/User';
import axios from 'axios'

import {
  faChartLine, faUser, faSearch, faClipboardList, faChevronRight , faWallet, faIndianRupeeSign, faForward, faCoins,
} from "@fortawesome/free-solid-svg-icons";

import {
  faUser as farUser, faFile as farFile,
  faPaperPlane as farPaperPlane, faMap as farMap, faHand as farHand, faBookmark as farBookmark,
  faCircle as farCircle, faCirclePlay as farCirclePlay, faShareFromSquare as farShareFromSquare, faBell as farBell, faMoneyBill1 as farMoneyBill1,
} from "@fortawesome/free-regular-svg-icons";

function CandidateLayout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const location = useLocation();
  // popup model 
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Backend URL
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // Chatbot functionality
  // useEffect(() => {
  //   // Add external CSS and script dynamically
  //   const cssLink = document.createElement("link");
  //   cssLink.rel = "stylesheet";
  //   cssLink.href = "https://app.helloyubo.com/assets/focalyt_bot.bot.css";
  //   document.head.appendChild(cssLink);

  //   const script = document.createElement("script");
  //   script.src = "https://app.helloyubo.com/assets/focalyt_bot.bot.js";
  //   script.async = true;
  //   document.body.appendChild(script);

  //   // Wait for the script to load and then apply drag functionality
  //   script.onload = () => {
  //     // Wait a bit for the chatbot element to be created
  //     setTimeout(() => {
  //       const botContainer = document.getElementsByClassName("chat-start")[0];
  //       if (botContainer && window.dragElement) {
  //         window.dragElement(botContainer); // Apply drag to the container div
  //       }
  //     }, 1000); // Give time for the chatbot to initialize
  //   };

  //   return () => {
  //     // Cleanup CSS and script when component unmounts
  //     if (cssLink.parentNode) {
  //       document.head.removeChild(cssLink);
  //     }
  //     if (script.parentNode) {
  //       document.body.removeChild(script);
  //     }
  //   };
  // }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/candidate/login');
        }

        const response = await axios.get(`${backendUrl}/candidate/getProfile`, {
          headers: {
            'x-auth': token
          }
        });

        if (response.data.status) {
          console.log("Profile data fetched:", response.data.data);
          const data = response.data.data;
          const candidate = data.candidate;

          // Check if candidate has resume uploaded
          const hasResume = Array.isArray(candidate.personalInfo?.resume) && candidate.personalInfo.resume.length > 0;
          
          // If resume exists, modal should not show (set showProfileForm = true)
          if (hasResume) {
            setShowProfileForm(true);
          } else if (candidate.showProfileForm !== undefined) {
            // Use backend value if available
            setShowProfileForm(candidate.showProfileForm);
          } else {
            // Default: show modal if no resume and no showProfileForm value
            setShowProfileForm(false);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [backendUrl]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    } else {
      navigate('/candidate/login');
    }
  }, []);

  const [openDropdown, setOpenDropdown] = useState(null);
  const profileMenuRef = useRef(null);
  const toggleDropdown = (menu) => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  const [expanded, setExpanded] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState({
    profile: false,
    courses: false,
    jobs: false,
    wallet: false,
    events: false // Added events to the initial state
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1199);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1199);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1199;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobile &&
        !e.target.closest(".main-menu") &&
        !e.target.closest(".menu-toggle")
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(prev => {
      const newState = { ...prev, [menu]: !prev[menu] };
      return newState;
    });
  };

  const menuRefs = {
    profile: useRef(null),
    courses: useRef(null),
    jobs: useRef(null),
    wallet: useRef(null),
    events: useRef(null), // Added events ref
  };

  const [submenuMaxHeight, setSubmenuMaxHeight] = useState({
    profile: '0px',
    courses: '0px',
    jobs: '0px',
    wallet: '0px',
    events: '0px' // Added events height
  });

  // Education form states (keeping existing form logic)
  const [currentStep, setCurrentStep] = useState(1);
  const educationList = [
    { _id: "1", name: "10th" },
    { _id: "2", name: "12th" },
    { _id: "3", name: "ITI" },
    { _id: "4", name: "Graduation/Diploma" },
    { _id: "5", name: "Masters/Post-Graduation" },
    { _id: "6", name: "Doctorate/PhD" }
  ];

  const sampleCourses = [
    { _id: "c1", name: "B.Tech" },
    { _id: "c2", name: "BCA" },
    { _id: "c3", name: "B.Sc" }
  ];

  const sampleSpecializations = [
    { _id: "s1", name: "Computer Science" },
    { _id: "s2", name: "Electronics" },
    { _id: "s3", name: "Mechanical" }
  ];

  const [educations, setEducations] = useState([{
    education: '',
    universityName: '',
    boardName: '',
    collegeName: '',
    schoolName: '',
    course: '',
    specialization: '',
    passingYear: '',
    marks: ''
  }]);

  const [formData, setFormData] = useState({
    basicDetails: { completed: false },
    education: { completed: false },
    lastStep: { completed: false }
  });

  const [boardSuggestions, setBoardSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(null);
  const [coursesList, setCoursesList] = useState({});
  const [specializationsList, setSpecializationsList] = useState({});

  // Handle education change
  const handleEducationChange = (e, index) => {
    const educationId = e.target.value;
    const updated = [...educations];
    updated[index].education = educationId;
    updated[index].course = '';
    updated[index].specialization = '';
    setEducations(updated);

    if (educationId === "4" || educationId === "5") {
      setCoursesList(prev => ({
        ...prev,
        [index]: sampleCourses
      }));
    }

    if (educationId === "3") {
      setCoursesList(prev => ({
        ...prev,
        [index]: [{ _id: "iti1", name: "ITI Course" }]
      }));

      setSpecializationsList(prev => ({
        ...prev,
        [index]: [
          { _id: "itispec1", name: "Electrician" },
          { _id: "itispec2", name: "Plumber" },
          { _id: "itispec3", name: "Mechanic" }
        ]
      }));
    }
  };

  const handleCourseChange = (e, index) => {
    const courseId = e.target.value;
    const updated = [...educations];
    updated[index].course = courseId;
    updated[index].specialization = '';
    setEducations(updated);

    setSpecializationsList(prev => ({
      ...prev,
      [index]: sampleSpecializations
    }));
  };

  const handleBoardInputChange = (value, index) => {
    const updated = [...educations];
    updated[index].boardName = value;
    setEducations(updated);

    if (value.length >= 2) {
      setBoardSuggestions([
        { _id: "b1", name: "CBSE", type: "Central" },
        { _id: "b2", name: "ICSE", type: "Central" },
        { _id: "b3", name: "State Board", type: "State" }
      ]);
      setSuggestionIndex(index);
    } else {
      setBoardSuggestions([]);
    }
  };

  const handleSaveCV = async (profileData, skills, certificates, languages, projects, interests, experiences, isExperienced, educations = [], setShowProfileFormValue = undefined) => {
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
        showProfileForm: setShowProfileFormValue !== undefined ? setShowProfileFormValue : true,
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

      } else {
        alert('Failed to save CV!');
      }
    } catch (err) {
      console.error("Error saving CV:", err);
      alert("An error occurred while saving your CV");
    }
    finally{
      setShowProfileForm(!showProfileForm)
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      setFormData({
        ...formData,
        basicDetails: { completed: true }
      });
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!educations[0].education) {
        alert('Please select your highest qualification');
        return;
      }

      setFormData({
        ...formData,
        education: { completed: true }
      });
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setFormData(prev => ({ ...prev, certificates: { completed: true } }));
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setFormData(prev => ({ ...prev, additional: { completed: true } }));
    }
  };

  const goToStep = (stepNumber) => {
    if (stepNumber === 1 ||
      (stepNumber === 2 && formData.basicDetails.completed) ||
      (stepNumber === 3 && formData.education.completed)) {
      setCurrentStep(stepNumber);
    }
  };

  const renderEducationFields = (edu, index) => {
    const educationName = educationList.find(q => q._id === edu.education)?.name || '';

    if (educationName === '10th') {
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
            <label className="form-label">School Name</label>
            <input
              type="text"
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

    else if (educationName === 'Graduation/Diploma' || educationName === 'Masters/Post-Graduation' || educationName === 'Doctorate/PhD') {
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
            <label className="form-label">University Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter university name"
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

  useLayoutEffect(() => {
    const newHeights = {};
    Object.keys(menuRefs).forEach((key) => {
      const ref = menuRefs[key];
      if (ref.current) {
        if (openSubmenu[key]) {
          newHeights[key] = `${ref.current.scrollHeight}px`;
        } else {
          const currentHeight = `${ref.current.scrollHeight}px`;
          newHeights[key] = currentHeight;

          setTimeout(() => {
            setSubmenuMaxHeight(prev => ({
              ...prev,
              [key]: '0px'
            }));
          }, 5);
        }
      }
    });

    setSubmenuMaxHeight(prev => ({
      ...prev,
      ...newHeights,
    }));
  }, [openSubmenu]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-1">

        <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
          <div className={`navbar-header ${expanded ? 'expanded' : ''}`}>
            <ul className="nav navbar-nav flex-row">
              <li className="nav-item mr-auto">
                <Link to="/candidate/dashboard" className="navbar-brand">
                  <img className="img-fluid logocs" src="/Assets/images/logo/logo.png" alt="Logo" />
                </Link>
              </li>
              <li className="nav-item nav-toggle">
                <a className="nav-link modern-nav-toggle pr-0" onClick={toggleSidebar}>
                  <i className={`icon-x d-block d-xl-none font-medium-4 primary toggle-icon feather ${expanded ? 'icon-disc' : 'icon-circle'}`}></i>
                  <i className={`toggle-icon icon-disc font-medium-4 d-none d-xl-block collapse-toggle-icon primary feather`}></i>
                </a>
              </li>
            </ul>
          </div>
          <div className="shadow-bottom"></div>
          <div className="main-menu-content border border-left-0 border-right-0 border-bottom-0">
            <ul className="navigation navigation-main" id="main-menu-navigation">
              {/* Dashboard */}
              <li className={`nav-item ${location.pathname === '/candidate/dashboard' ? 'active' : ''}`}>
                <Link to="/candidate/dashboard" onClick={() => {
                  handleSidebarClose();
                }} >
                  <FontAwesomeIcon icon={faChartLine} />
                  <span className="menu-title">Dashboard</span>
                </Link>
              </li>

              {/* Profile */}
              <li className={`nav-item has-sub dropdown-profile ${openSubmenu.profile ? 'open' : ''} ${location.pathname === '/candidate/myprofile' ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('profile')}>
                  <FontAwesomeIcon icon={faUser} />
                  <span className="menu-title">Profile</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      style={{fontSize: '12px'}}
                      className={`chevron-icon ${openSubmenu.profile ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.profile}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.profile,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out,'
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/candidate/myProfile' ? 'active' : ''}`}>
                    <Link to="/candidate/myProfile" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faUser} />
                      <span className="menu-title">Your Profile</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/document' ? 'active' : ''}`}>
                    <Link to="/candidate/document" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farFile} />
                      <span className="menu-title">Documents</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Courses */}
              <li className={`nav-item has-sub dropdown-courses ${openSubmenu.courses ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('courses')}>
                  <FontAwesomeIcon icon={farUser} />
                  <span className="menu-title">Courses</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      style={{fontSize: '12px'}}
                      className={`chevron-icon ${openSubmenu.courses ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.courses}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.courses,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/candidate/searchcourses' ? 'active' : ''}`}>
                    <Link to="/candidate/searchcourses" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span className="menu-title">Search Courses</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/appliedCourses' ? 'active' : ''}`}>
                    <Link to="/candidate/appliedCourses" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farPaperPlane} />
                      <span className="menu-title">Applied Course</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/enrolledCourses' ? 'active' : ''}`}>
                    <Link to="/candidate/enrolledCourses" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farPaperPlane} />
                      <span className="menu-title">Enrolled Course</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Jobs */}
              <li className={`nav-item has-sub dropdown-jobs ${openSubmenu.jobs ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('jobs')}>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span className="menu-title">Jobs</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      style={{fontSize: '12px'}}
                      className={`chevron-icon ${openSubmenu.jobs ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.jobs}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.jobs,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/candidate/searchjob' ? 'active' : ''}`}>
                    <Link to="/candidate/searchjob" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span className="menu-title">Search Job</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/nearbyJobs' ? 'active' : ''}`}>
                    <Link to="/candidate/nearbyJobs" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farMap} />
                      <span className="menu-title">Jobs Near Me</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/Joboffer' ? 'active' : ''}`}>
                    <Link to="/candidate/joboffer" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farMap} />
                      <span className="menu-title">Jobs Offer</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/appliedJobs' ? 'active' : ''}`}>
                    <Link to="/candidate/appliedJobs" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farPaperPlane} />
                      <span className="menu-title">Applied Jobs</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/registerInterviewsList' ? 'active' : ''}`}>
                    <Link to="/candidate/registerInterviewsList" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farHand} />
                      <span className="menu-title">Register For Interview</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/InterestedCompanies' ? 'active' : ''}`}>
                    <Link to="/candidate/InterestedCompanies" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farBookmark} />
                      <span className="menu-title">Shortlisting</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Wallet */}
              <li className={`nav-item has-sub dropdown-wallet ${openSubmenu.wallet ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('wallet')}>
                  <FontAwesomeIcon icon={faWallet} />
                  <span className="menu-title">Wallet</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      style={{fontSize: '12px'}}
                      className={`chevron-icon ${openSubmenu.wallet ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.wallet}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.wallet,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >
                  {/* <li className={`nav-item ${location.pathname === '/candidate/cashback' ? 'active' : ''}`}>
                    <Link to="/candidate/cashback" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faIndianRupeeSign} />
                      <span className="menu-title">Cashback Offers</span>
                    </Link>
                  </li> */}
                  <li className={`nav-item ${location.pathname === '/candidate/myEarnings' ? 'active' : ''}`}>
                    <Link to="/candidate/myEarnings" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farMoneyBill1} />
                      <span className="menu-title">My Earnings</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/referral' ? 'active' : ''}`}>
                    <Link to="/candidate/referral" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faForward} />
                      <span className="menu-title">Refer & Earn</span>
                    </Link>
                  </li>
                  {/* <li className={`nav-item ${location.pathname === '/candidate/Coins' ? 'active' : ''}`}>
                    <Link to="/candidate/Coins" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faCoins} />
                      <span className="menu-title">Coins</span>
                    </Link>
                  </li> */}
                </ul>
              </li>

              {/* Events */}
              <li className={`nav-item has-sub dropdown-events ${openSubmenu.events ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('events')}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span className="menu-title">Events</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className={`chevron-icon ${openSubmenu.events ? 'rotate-90' : ''}`}
                      style={{fontSize: '12px'}}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.events}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.events,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/candidate/candidateevent' ? 'active' : ''}`}>
                    <Link to="/candidate/candidateevent" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farCircle} />
                      <span className="menu-title">Event</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/appliedevents' ? 'active' : ''}`}>
                    <Link to="/candidate/appliedevents" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farCircle} />
                      <span className="menu-title">Applied Event</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Request Loan */}
              {/* <li className={`nav-item ${location.pathname === '/candidate/requestLoan' ? 'active' : ''}`}>
                <Link to="/candidate/requestLoan" onClick={() => { handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farCircle} />
                  <span className="menu-title">Request Loan</span>
                </Link>
              </li> */}

              {/* Watch Videos */}
              <li className={`nav-item ${location.pathname === '/candidate/watchVideos' ? 'active' : ''}`}>
                <Link to="/candidate/watchVideos" onClick={() => { handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farCirclePlay} />
                  <span className="menu-title">Watch Videos</span>
                </Link>
              </li>

              {/* Share Profile */}
              <li className={`nav-item ${location.pathname === '/candidate/shareCV' ? 'active' : ''}`}>
                <Link to="/candidate/shareCV" onClick={() => { handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farShareFromSquare} />
                  <span className="menu-title">Share Profile</span>
                </Link>
              </li>

              {/* Notifications */}
              <li className={`nav-item ${location.pathname === '/candidate/notifications' ? 'active' : ''}`}>
                <Link to="/candidate/notifications" onClick={() => { handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farBell} />
                  <span className="menu-title">Notifications</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
          data-open="click" data-menu="vertical-menu-modern" data-col="2-columns" id="inner_job_page">

          <div className="app-content content">
            <div className="content-overlay"></div>
            <div className="header-navbar-shadow"></div>
            <CandidateHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen} />
            <div className="content-wrapper">
              <div className="mt-2 mb-2">

                {!showProfileForm && (
                  <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
                  data-open="click" data-menu="vertical-menu-modern" data-col="2-columns" id="inner_job_page">
        
                  <div className="">
                    <CandidateHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen} />
                    <div className="content-wrapper">
                      <div className="mt-2 mb-2">
        
                      
                          <div className="modal fade show popmodel"
                            style={{ display: 'block' }}
                            tabIndex="-1"
                            aria-modal="true"
                            role="dialog"
                            data-bs-backdrop="static"
                            data-bs-keyboard="false">
                            <div className="fade show"></div>
                            <div className="modal-dialog modal-dialog-centered modal-lg">
                              <div className="modal-content">
                                
                                <div className="modal-body">
                                  <User handleSaveCV={handleSaveCV} onCloseModal={() => setShowProfileForm(true)} />
                                </div>
                              </div>
                            </div>
                          </div>
                      
                      </div>
                      <div className="content-body mb-4">
                        <Outlet />
                      </div>
                      <CandidateFooter />
                    </div>
                  </div>
                </div>
                 )} 
              </div>
              <div className="content-body mb-4">
                <Outlet />
              </div>
              <CandidateFooter />
            </div>
          </div>
        </div>
      </main>

      <style>
        {
          `
    .menu-content {
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}
 
.menu-content {
            overflow: hidden;
            transition: max-height 0.3s ease-in-out;
          }

/* Profile Dropdown - Pink Color */
.nav-item.has-sub.dropdown-profile > a {
  background-color: #fee2e2 !important;
  border-left: 2px solid #fc2b5a;
}

.nav-item.has-sub.dropdown-profile > a:hover {
  background-color: #fecaca !important;
  border-left-color: #ef4444;
}

.nav-item.has-sub.dropdown-profile.open > a {
  background-color: #fecaca !important;
  border-left-color: #ef4444;
  color: #dc2626 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-profile .menu-content {
  background-color: #fee2e2 !important;
  border-left: 2px solid #fc2b5a;
}

.nav-item.has-sub.dropdown-profile .menu-content .nav-item > a {
  background-color: #fee2e2 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-profile .menu-content .nav-item > a:hover {
  background-color: #fecaca !important;
  color: #fc2b5a !important;
}

.nav-item.has-sub.dropdown-profile .menu-content .nav-item.active > a {
  background-color: #fc2b5a !important;
  color: #fff !important;
}

/* Courses Dropdown - Blue Color */
.nav-item.has-sub.dropdown-courses > a {
  background-color: #dbeafe !important;
  border-left: 2px solid #3b82f6;
}

.nav-item.has-sub.dropdown-courses > a:hover {
  background-color: #bfdbfe !important;
  border-left-color: #2563eb;
}

.nav-item.has-sub.dropdown-courses.open > a {
  background-color: #bfdbfe !important;
  border-left-color: #2563eb;
  color: #1e40af !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-courses .menu-content {
  background-color: #dbeafe !important;
  border-left: 2px solid #3b82f6;
}

.nav-item.has-sub.dropdown-courses .menu-content .nav-item > a {
  background-color: #dbeafe !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-courses .menu-content .nav-item > a:hover {
  background-color: #bfdbfe !important;
  color: #3b82f6 !important;
}

.nav-item.has-sub.dropdown-courses .menu-content .nav-item.active > a {
  background-color: #fc2b5a !important;
  color: #fff !important;
}

/* Jobs Dropdown - Green Color */
.nav-item.has-sub.dropdown-jobs > a {
  background-color: #dcfce7 !important;
  border-left: 2px solid #10b981;
}

.nav-item.has-sub.dropdown-jobs > a:hover {
  background-color: #bbf7d0 !important;
  border-left-color: #059669;
}

.nav-item.has-sub.dropdown-jobs.open > a {
  background-color: #bbf7d0 !important;
  border-left-color: #059669;
  color: #047857 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-jobs .menu-content {
  background-color: #dcfce7 !important;
  border-left: 2px solid #10b981;
}

.nav-item.has-sub.dropdown-jobs .menu-content .nav-item > a {
  background-color: #dcfce7 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-jobs .menu-content .nav-item > a:hover {
  background-color: #bbf7d0 !important;
  color: #10b981 !important;
}

.nav-item.has-sub.dropdown-jobs .menu-content .nav-item.active > a {
  background-color: #fc2b5a !important;
  color: #fff !important;
}

/* Wallet Dropdown - Orange Color */
.nav-item.has-sub.dropdown-wallet > a {
  background-color: #ffedd5 !important;
  border-left: 2px solid #f59e0b;
}

.nav-item.has-sub.dropdown-wallet > a:hover {
  background-color: #fed7aa !important;
  border-left-color: #d97706;
}

.nav-item.has-sub.dropdown-wallet.open > a {
  background-color: #fed7aa !important;
  border-left-color: #d97706;
  color: #b45309 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-wallet .menu-content {
  background-color: #ffedd5 !important;
  border-left: 2px solid #f59e0b;
}

.nav-item.has-sub.dropdown-wallet .menu-content .nav-item > a {
  background-color: #ffedd5 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-wallet .menu-content .nav-item > a:hover {
  background-color: #fed7aa !important;
  color: #f59e0b !important;
}

.nav-item.has-sub.dropdown-wallet .menu-content .nav-item.active > a {
  background-color: #fc2b5a !important;
  color: #fff !important;
}

/* Events Dropdown - Purple Color */
.nav-item.has-sub.dropdown-events > a {
  background-color: #f3e8ff !important;
  border-left: 2px solid #8b5cf6;
}

.nav-item.has-sub.dropdown-events > a:hover {
  background-color: #e9d5ff !important;
  border-left-color: #7c3aed;
}

.nav-item.has-sub.dropdown-events.open > a {
  background-color: #e9d5ff !important;
  border-left-color: #7c3aed;
  color: #6d28d9 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-events .menu-content {
  background-color: #f3e8ff !important;
  border-left: 2px solid #8b5cf6;
}

.nav-item.has-sub.dropdown-events .menu-content .nav-item > a {
  background-color: #f3e8ff !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-events .menu-content .nav-item > a:hover {
  background-color: #e9d5ff !important;
  color: #8b5cf6 !important;
}

.nav-item.has-sub.dropdown-events .menu-content .nav-item.active > a {
  background-color: #fc2b5a !important;
  color: #fff !important;
}
          
          /* Add popup styles */
          .profile-form-popup {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .popup-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
          }
          
          .popup-content {
            position: relative;
            background-color: white;
            border-radius: 8px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 20px;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }
          
          .close-popup {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            background: none;
            border: none;
            cursor: pointer;
            z-index: 10001;
            color: #333;
            font-weight: bold;
          }
          
          .close-popup:hover {
            color: #FC2B5A;
          }
            .popmodel{
            overflow-y: scroll!important;
            }
`
        }
      </style>
        <style>
        {

            `
            html body .content .content-wrapper {
    padding: calc(2.2rem - 0.4rem) 2.2rem 0;
    margin-top: 6rem;
}
    .breadcrumb {
    border-left: 1px solid #d6dce1;
    padding: .5rem 0 .5rem 1rem !important;
    }
//     .breadcrumb-item a, .card-body a {
//     color: #fc2b5a;
// }

button.close {
    z-index: 9;
    background: #fff;
    border: 2px solid #FC2B5A !important;
    font-size: 19px;
    border-radius: 100px;
    height: 38px;
    opacity: 1;
    padding: 0;
    position: absolute;
    /* right: -13px; */
    right: 0px;
    /* top: -12px; */
    top: 0px;
    width: 38px;
    -webkit-appearance: none;
    box-shadow: none;
    font-weight: 400;
    transition: .3s;
    font-weight: 900;
    color: #000 !important;
}

html body .content .content-wrapper .content-header-title {
    color: #636363;
    font-weight: 500;
    margin-right: 1rem;
    padding-bottom: 10px;
}      
.float-left {
    float: left !important;
}      
.header-navbar-shadow {
    display: none;
}
.header-navbar.navbar-shadow {
    box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 20px 0px;
}
.header-navbar.floating-nav {
    position: fixed;
    width: calc(100% - 230px - 4.4rem + 0vw);
    z-index: 12;
    right: 0px;
    margin: 1.3rem 2.2rem 0px;
    border-radius: 0.5rem;
    padding: 0;
}
.navbar-theme {
    background: #FC2B5A;
}
.header-navbar {
    min-height: 4.5rem;
    font-family: Montserrat, Helvetica, Arial, serif;
    z-index: 997;
    padding: 0px;
    transition: 300ms;
    background: linear-gradient(rgba(248, 248, 248, 0.95) 44%, rgba(248, 248, 248, 0.46) 73%, rgba(255, 255, 255, 0));
}
.navbar-floating .header-navbar-shadow {
  display: none;
  background: linear-gradient(180deg, rgba(248, 248, 248, 0.95) 44%, rgba(248, 248, 248, 0.46) 73%, rgba(255, 255, 255, 0));
  padding-top: 2.2rem;
  background-repeat: repeat;
  width: 100%;
  height: 102px;
  position: fixed;
  top: 0;
  z-index: 11;
}

.header-navbar .navbar-wrapper {
    width: 100%;
}
.header-navbar .navbar-container {
    padding-left: 1rem;
    margin-left: 0px;
    transition: 300ms;
    background: #fc2b5a;
    border-radius: 7px;
}

.header-navbar .navbar-container .bookmark-wrapper ul.nav li > a.nav-link {
    padding: 1.4rem 0.5rem 1.35rem;
}
.header-navbar .navbar-container ul.nav li > a.nav-link {
    color: rgb(98, 98, 98);
    padding: 1.6rem 0.5rem 1.35rem 1rem;
}
.header-navbar .navbar-container ul.nav li.dropdown .dropdown-menu {
    top: 48px;
}
.dropdown-notification .dropdown-menu.dropdown-menu-right {
    right: -2px;
    padding: 0px;
}
.header-navbar .navbar-container .dropdown-menu-media {
    width: 26rem;
}
.horizontal-menu-wrapper .dropdown-menu, .header-navbar .dropdown-menu {
    animation-duration: 0.3s;
    animation-fill-mode: both;
    animation-name: slideIn;
}
.dropdown .dropdown-menu {
    box-shadow: rgba(0, 0, 0, 0.1) 0px 5px 25px;
    min-width: 8rem;
    border-width: 1px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.05);
    border-image: initial;
    border-radius: 5px;
}
.header-navbar .navbar-container .dropdown-menu-media .dropdown-menu-header {
    border-bottom: 1px solid rgb(218, 225, 231);
}
.dropdown-notification .dropdown-menu-header {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    color: rgb(255, 255, 255);
    text-align: center;
    background: rgb(252, 43, 90);
}
.dropdown-notification .notification-title {
    color: rgba(255, 255, 255, 0.75);
}
.white {
    color: #FFFFFF !important;
}
.navbar-collapse{
    /* background-color: #FC2B5A; */
    height: 68px;
    min-height: 4.5rem;
}
.dropdown-divider {
    height: 0;
    margin: 0.5rem 0;
    overflow: hidden;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
}
span#notification {
    position: relative;
    right: 9px;
    top: -10px;
}
.badges {
    position: absolute;
    top: 3px;
    right: -10px;
    background-color: #2d2d2d;
    color: white;
    font-size: 12px;
    border-radius: 50%;
    padding: 3px 6px;
}
 .dropdownProfile::before {
    content: "";
    position: absolute;
    top: -1px;
    right: 1.2rem;
    width: 0.75rem;
    height: 0.75rem;
    display: block;
    background: #fff;
    transform: rotate(45deg) translate(-7px);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 10;
    box-sizing: border-box;
}
#wrapping-bottom {
    white-space: pre-wrap !important;
}
@media (max-width: 1199px) {
    .main-menu {
    background-color: white;
    width: 230px;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 998;
    box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.05);
      transform: translateX(-100%);
      transition: transform 0.3s ease-in-out;
    }
  
    .main-menu.expanded {
      transform: translateX(0);
    }
    .header-navbar.floating-nav {
        position: fixed;
        width: calc(100% - 4.4rem + 0vw);
    }
    html body .content{
        margin: 0;
    }
  }
@media (min-width: 992px) {
    .navbar-expand-lg .navbar-nav {
        flex-direction: row;
    }
}
@media (min-width: 992px) {
    .navbar-expand-lg .navbar-collapse {
        display: flex !important
;
        flex-basis: auto;
    }
}

@media (min-width: 992px) {
    .navbar-expand-lg {
        flex-flow: row nowrap;
        justify-content: flex-start;
    }
}
@media(max-width:768px){
    
    .header-navbar.floating-nav{
        width: 100%!important;
        margin: 0;
    }
    .float-right{
        flex-direction: row!important;
    }
 
}


    
            `
        }
      </style>

      <style>
        {

          `
          .main-menu.menu-light .navigation>li.active>a {
    background: #FC2B5A;
    box-shadow: none;
    color: #fff;
    font-weight: 400;
    border-radius: 4px;
}
    .main-menu.menu-light .navigation>li.active>a .menu-title {
    color: #fff;
}
    .nav-item.active > a {
    background-color: #FC2B5A !important;
    color: #fff !important;
}
    .nav-item.active > a .menu-title{
    color: #fff !important;
    }

    .nav-item.has-sub.open > a:after {
    transform: translateY(-50%) rotate(90deg);
}
    .nav-item.has-sub > a:after {
    content: '\f054';
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    transition: transform 0.3s ease;
    color: #494949;
}
.nav-item > a::after {
    content: '\f105';
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    position: absolute;
    right: 15px;
    top: 10px;
    transition: transform 0.3s ease;
}
    
.dropdown-arrow {
    position: absolute;
    right: 15px;
    transition: transform 0.3s ease;
}
.dropdown-arrow {
    color: #6c757d;
    font-size: 0.75rem;
    transition: transform 0.2s ease;
    margin-left: 0.5rem;
    flex-shrink: 0;
}
.nav-item > a::after {
    content: '\f105';
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    position: absolute;
    right: 15px;
    top: 10px;
    transition: transform 0.3s ease;
}
.nav-item.open > a::after {
    transform: rotate(90deg);
}
.nav-item > a::after {
    content: ''; position: absolute;
    top: 0;
    visibility: hidden;
}
.chevron-icon {
  font-size: 12px!important;
  transition: transform 0.3s ease;
}

.rotate-90 {
  transform: rotate(90deg);
}
`
        }
      </style>
    </div>
  )

}

export default CandidateLayout


