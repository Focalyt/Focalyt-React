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
  faChartLine, faUser, faSearch, faClipboardList, faWallet, faIndianRupeeSign, faForward, faCoins,
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

          if (candidate.showProfileForm) {
            setShowProfileForm(candidate.showProfileForm);
          } else {
            setShowProfileForm(false)
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
              <li className={`nav-item has-sub ${openSubmenu.profile ? 'open' : ''} ${location.pathname === '/candidate/myprofile' ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('profile')}>
                  <FontAwesomeIcon icon={faUser} />
                  <span className="menu-title">Profile</span>
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
              <li className={`nav-item has-sub ${openSubmenu.courses ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('courses')}>
                  <FontAwesomeIcon icon={farUser} />
                  <span className="menu-title">Courses</span>
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
                </ul>
              </li>

              {/* Jobs */}
              <li className={`nav-item has-sub ${openSubmenu.jobs ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('jobs')}>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span className="menu-title">Jobs</span>
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
              <li className={`nav-item has-sub ${openSubmenu.wallet ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('wallet')}>
                  <FontAwesomeIcon icon={faWallet} />
                  <span className="menu-title">Wallet</span>
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
                  <li className={`nav-item ${location.pathname === '/candidate/cashback' ? 'active' : ''}`}>
                    <Link to="/candidate/cashback" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faIndianRupeeSign} />
                      <span className="menu-title">Cashback Offers</span>
                    </Link>
                  </li>
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
                  <li className={`nav-item ${location.pathname === '/candidate/Coins' ? 'active' : ''}`}>
                    <Link to="/candidate/Coins" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faCoins} />
                      <span className="menu-title">Coins</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Events */}
              <li className={`nav-item has-sub ${openSubmenu.events ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('events')}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span className="menu-title">Events</span>
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
              <li className={`nav-item ${location.pathname === '/candidate/requestLoan' ? 'active' : ''}`}>
                <Link to="/candidate/requestLoan" onClick={() => { handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farCircle} />
                  <span className="menu-title">Request Loan</span>
                </Link>
              </li>

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
                                  <User />
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
    </div>
  )
}

export default CandidateLayout


// import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
// import { Link, Outlet, useLocation } from "react-router-dom";
// import CandidateHeader from './CandidateHeader/CandidateHeader'
// import CandidateFooter from './CandidateFooter/CandidateFooter'
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
// import { useNavigate } from "react-router-dom";
// import User from './StepContainer/User';
// import axios from 'axios'

// import {
//   faChartLine, faUser, faSearch, faClipboardList, faWallet, faIndianRupeeSign, faForward, faCoins,
// } from "@fortawesome/free-solid-svg-icons";

// import {
//   faUser as farUser, faFile as farFile,
//   faPaperPlane as farPaperPlane, faMap as farMap, faHand as farHand, faBookmark as farBookmark,
//   faCircle as farCircle, faCirclePlay as farCirclePlay, faShareFromSquare as farShareFromSquare, faBell as farBell, faMoneyBill1 as farMoneyBill1,
// } from "@fortawesome/free-regular-svg-icons";

// function CandidateLayout({ children }) {
//   const navigate = useNavigate();
//   const [user, setUser] = useState();
//   const location = useLocation();
//   // popup model 
//   const [showProfileForm, setShowProfileForm] = useState(false);
//   const [isFirstLoad, setIsFirstLoad] = useState(true);
//   // Backend URL
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
//   // Add this function to toggle the popup visibility

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         if (!token) {
//           navigate('/candidate/login');
//         }

//         const response = await axios.get(`${backendUrl}/candidate/getProfile`, {
//           headers: {
//             'x-auth': token
//           }
//         });

//         if (response.data.status) {
//           console.log("Profile data fetched:", response.data.data);
//           const data = response.data.data;
//           const candidate = data.candidate;


//           if (candidate.showProfileForm) {
//             setShowProfileForm(candidate.showProfileForm);
//             // Map backend data to frontend state


//           } else {
//             setShowProfileForm(false)
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching profile:", error);
//       }
//     };

//     fetchProfile();
//   }, [backendUrl]);


//   useEffect(() => {
//     const storedUser = sessionStorage.getItem('user');
//     if (storedUser) {
//       const parsed = JSON.parse(storedUser);
//       setUser(parsed);
//     } else {
//       navigate('/candidate/login');
//     }
//   }, []);







//   const [openDropdown, setOpenDropdown] = useState(null);
//   const profileMenuRef = useRef(null);
//   const toggleDropdown = (menu) => {
//     setOpenDropdown((prev) => (prev === menu ? null : menu));
//   };
//   const toggleSubmenu = (menu) => {
//     setOpenSubmenu(prev => {
//       const newState = { ...prev, [menu]: !prev[menu] };


//       return newState;
//     });
//   };




//   const [expanded, setExpanded] = useState(true);
//   const [activeItem, setActiveItem] = useState('dashboard');
//   const [openSubmenu, setOpenSubmenu] = useState({
//     profile: false,
//     courses: false,
//     jobs: false,
//     wallet: false
//   });
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 1199);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1199);

//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 1199;
//       setIsMobile(mobile);
//       setIsSidebarOpen(!mobile);
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Close sidebar on outside click
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         isMobile &&
//         !e.target.closest(".main-menu") &&
//         !e.target.closest(".menu-toggle")
//       ) {
//         setIsSidebarOpen(false);
//       }
//     };
//     document.addEventListener("click", handleClickOutside);
//     return () => document.removeEventListener("click", handleClickOutside);
//   }, [isMobile]);

//   const handleSidebarToggle = () => {
//     setIsSidebarOpen((prev) => !prev);
//   };

//   const handleSidebarClose = () => {
//     if (isMobile) {
//       setIsSidebarOpen(false);
//     }
//   }


//   const toggleSidebar = () => {
//     setExpanded(!expanded);
//   };

//   // const toggleSubmenu = (menu) => {
//   //   setOpenSubmenu({
//   //     ...openSubmenu,
//   //     [menu]: !openSubmenu[menu]
//   //   });
//   // };
//   const menuRefs = {
//     profile: useRef(null),
//     courses: useRef(null),
//     jobs: useRef(null),
//     wallet: useRef(null),
//   };

//   const handleItemClick = (item) => {
//     setActiveItem(item);
//   };

//   const [submenuMaxHeight, setSubmenuMaxHeight] = useState({
//     profile: '0px',
//     courses: '0px',
//     jobs: '0px',
//     wallet: '0px'
//   });

//   const [currentStep, setCurrentStep] = useState(1);

//   // Static education options
//   const educationList = [
//     { _id: "1", name: "10th" },
//     { _id: "2", name: "12th" },
//     { _id: "3", name: "ITI" },
//     { _id: "4", name: "Graduation/Diploma" },
//     { _id: "5", name: "Masters/Post-Graduation" },
//     { _id: "6", name: "Doctorate/PhD" }
//   ];

//   // Static courses and specializations for demo

//   const sampleCourses = [
//     { _id: "c1", name: "B.Tech" },
//     { _id: "c2", name: "BCA" },
//     { _id: "c3", name: "B.Sc" }
//   ];

//   const sampleSpecializations = [
//     { _id: "s1", name: "Computer Science" },
//     { _id: "s2", name: "Electronics" },
//     { _id: "s3", name: "Mechanical" }
//   ];

//   const [educations, setEducations] = useState([{
//     education: '',
//     universityName: '',
//     boardName: '',
//     collegeName: '',
//     schoolName: '',
//     course: '',
//     specialization: '',
//     passingYear: '',
//     marks: ''
//   }]);

//   const [formData, setFormData] = useState({
//     basicDetails: { completed: false },
//     education: { completed: false },
//     lastStep: { completed: false }
//   });

//   // For board suggestions
//   const [boardSuggestions, setBoardSuggestions] = useState([]);
//   const [suggestionIndex, setSuggestionIndex] = useState(null);
//   const [coursesList, setCoursesList] = useState({});
//   const [specializationsList, setSpecializationsList] = useState({});

//   // Handle education change
//   const handleEducationChange = (e, index) => {
//     const educationId = e.target.value;
//     const updated = [...educations];
//     updated[index].education = educationId;
//     updated[index].course = '';
//     updated[index].specialization = '';
//     setEducations(updated);

//     // Add some sample courses based on education
//     if (educationId === "4" || educationId === "5") {
//       setCoursesList(prev => ({
//         ...prev,
//         [index]: sampleCourses
//       }));
//     }

//     // Handle ITI case
//     if (educationId === "3") {
//       setCoursesList(prev => ({
//         ...prev,
//         [index]: [{ _id: "iti1", name: "ITI Course" }]
//       }));

//       setSpecializationsList(prev => ({
//         ...prev,
//         [index]: [
//           { _id: "itispec1", name: "Electrician" },
//           { _id: "itispec2", name: "Plumber" },
//           { _id: "itispec3", name: "Mechanic" }
//         ]
//       }));
//     }
//   };

//   // Handle course change
//   const handleCourseChange = (e, index) => {
//     const courseId = e.target.value;
//     const updated = [...educations];
//     updated[index].course = courseId;
//     updated[index].specialization = '';
//     setEducations(updated);

//     // Show sample specializations
//     setSpecializationsList(prev => ({
//       ...prev,
//       [index]: sampleSpecializations
//     }));
//   };

//   // Handle board input change with static suggestions
//   const handleBoardInputChange = (value, index) => {
//     const updated = [...educations];
//     updated[index].boardName = value;
//     setEducations(updated);

//     if (value.length >= 2) {
//       // Static board suggestions
//       setBoardSuggestions([
//         { _id: "b1", name: "CBSE", type: "Central" },
//         { _id: "b2", name: "ICSE", type: "Central" },
//         { _id: "b3", name: "State Board", type: "State" }
//       ]);
//       setSuggestionIndex(index);
//     } else {
//       setBoardSuggestions([]);
//     }
//   };

//   // Handle continue button click
//   const handleContinue = () => {
//     if (currentStep === 1) {
//       // Set basic details as completed and move to next step
//       setFormData({
//         ...formData,
//         basicDetails: { completed: true }
//       });
//       setCurrentStep(2);
//     } else if (currentStep === 2) {
//       // Validate education
//       if (!educations[0].education) {
//         alert('Please select your highest qualification');
//         return;
//       }

//       setFormData({
//         ...formData,
//         education: { completed: true }
//       });
//       setCurrentStep(3);
//     } else if (currentStep === 3) {
//       // Complete the form
//       // setFormData({
//       //   ...formData,
//       //   lastStep: { completed: true }
//       // });
//       setFormData(prev => ({ ...prev, certificates: { completed: true } }));
//       setCurrentStep(4);
//       // alert('Form completed!');
//     } else if (currentStep === 4) {
//       setFormData(prev => ({ ...prev, additional: { completed: true } }));

//     }
//   };

//   // Step navigation
//   const goToStep = (stepNumber) => {
//     if (stepNumber === 1 ||
//       (stepNumber === 2 && formData.basicDetails.completed) ||
//       (stepNumber === 3 && formData.education.completed)) {
//       setCurrentStep(stepNumber);
//     }
//   };

//   // Render education fields based on type
//   const renderEducationFields = (edu, index) => {
//     // Get education name based on selected ID
//     const educationName = educationList.find(q => q._id === edu.education)?.name || '';

//     // 10th Class
//     if (educationName === '10th') {
//       return (
//         <>
//           <div className="form-group">
//             <label className="form-label">Board</label>
//             <div className="board-autocomplete-wrapper">
//               <input
//                 type="text"
//                 className="form-input"
//                 value={edu.boardName || ''}
//                 onChange={(e) => handleBoardInputChange(e.target.value, index)}
//               />
//               {suggestionIndex === index && boardSuggestions.length > 0 && (
//                 <ul className="suggestion-list board-suggestion-list">
//                   {boardSuggestions.map((b) => (
//                     <li
//                       key={b._id}
//                       className='board-suggestion-item'
//                       onClick={() => {
//                         const updated = [...educations];
//                         updated[index].boardName = b.name;
//                         setEducations(updated);
//                         setBoardSuggestions([]);
//                         setSuggestionIndex(null);
//                       }}
//                     >
//                       {b.name} ({b.type})
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </div>

//           <div className="form-group">
//             <label className="form-label">School Name</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.schoolName || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].schoolName = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Passing Year</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.passingYear || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].passingYear = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Marks (%)</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.marks || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].marks = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>
//         </>
//       );
//     }

//     // 12th Class
//     else if (educationName === '12th') {
//       return (
//         <>
//           <div className="form-group">
//             <label className="form-label">Board</label>
//             <div className="board-autocomplete-wrapper">
//               <input
//                 type="text"
//                 className="form-input"
//                 value={edu.boardName || ''}
//                 onChange={(e) => handleBoardInputChange(e.target.value, index)}
//               />
//               {suggestionIndex === index && boardSuggestions.length > 0 && (
//                 <ul className="suggestion-list board-suggestion-list">
//                   {boardSuggestions.map((b) => (
//                     <li
//                       key={b._id}
//                       className='board-suggestion-item'
//                       onClick={() => {
//                         const updated = [...educations];
//                         updated[index].boardName = b.name;
//                         setEducations(updated);
//                         setBoardSuggestions([]);
//                         setSuggestionIndex(null);
//                       }}
//                     >
//                       {b.name} ({b.type})
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </div>

//           <div className="form-group">
//             <label className="form-label">Specialization</label>
//             <select
//               className="form-input"
//               value={edu.specialization || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].specialization = e.target.value;
//                 setEducations(updated);
//               }}
//             >
//               <option value="">Select Specialization</option>
//               <option value="Science (PCM)">Science (PCM)</option>
//               <option value="Science (PCB)">Science (PCB)</option>
//               <option value="Science (PCMB)">Science (PCMB)</option>
//               <option value="Commerce">Commerce</option>
//               <option value="Commerce with Maths">Commerce with Maths</option>
//               <option value="Arts/Humanities">Arts/Humanities</option>
//               <option value="Vocational">Vocational</option>
//             </select>
//           </div>

//           <div className="form-group">
//             <label className="form-label">School Name</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.schoolName || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].schoolName = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Passing Year</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.passingYear || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].passingYear = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Marks (%)</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.marks || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].marks = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>
//         </>
//       );
//     }

//     // ITI
//     else if (educationName === 'ITI') {
//       return (
//         <>
//           {specializationsList[index] && specializationsList[index].length > 0 && (
//             <div className="form-group">
//               <label className="form-label">Specialization</label>
//               <select
//                 className="form-input"
//                 value={edu.specialization || ''}
//                 onChange={(e) => {
//                   const updated = [...educations];
//                   updated[index].specialization = e.target.value;
//                   setEducations(updated);
//                 }}
//               >
//                 <option value="">Select Specialization</option>
//                 {specializationsList[index].map((spec) => (
//                   <option key={spec._id} value={spec.name}>{spec.name}</option>
//                 ))}
//               </select>
//             </div>
//           )}

//           <div className="form-group">
//             <label className="form-label">ITI Name</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.collegeName || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].collegeName = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Passing Year</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.passingYear || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].passingYear = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Marks (%)</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.marks || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].marks = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>
//         </>
//       );
//     }

//     // Graduation, Masters, PhD
//     else if (educationName === 'Graduation/Diploma' || educationName === 'Masters/Post-Graduation' || educationName === 'Doctorate/PhD') {
//       return (
//         <>
//           {coursesList[index] && coursesList[index].length > 0 && (
//             <div className="form-group">
//               <label className="form-label">Course</label>
//               <select
//                 className="form-input"
//                 value={edu.course || ''}
//                 onChange={(e) => handleCourseChange(e, index)}
//               >
//                 <option value="">Select Course</option>
//                 {coursesList[index].map((course) => (
//                   <option key={course._id} value={course._id}>{course.name}</option>
//                 ))}
//               </select>
//             </div>
//           )}

//           {specializationsList[index] && specializationsList[index].length > 0 && (
//             <div className="form-group">
//               <label className="form-label">Specialization</label>
//               <select
//                 className="form-input"
//                 value={edu.specialization || ''}
//                 onChange={(e) => {
//                   const updated = [...educations];
//                   updated[index].specialization = e.target.value;
//                   setEducations(updated);
//                 }}
//               >
//                 <option value="">Select Specialization</option>
//                 {specializationsList[index].map((spec) => (
//                   <option key={spec._id} value={spec.name}>{spec.name}</option>
//                 ))}
//               </select>
//             </div>
//           )}

//           <div className="form-group">
//             <label className="form-label">University Name</label>
//             <input
//               type="text"
//               className="form-input"
//               placeholder="Enter university name"
//               value={edu.universityName || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].universityName = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">College Name</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.collegeName || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].collegeName = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Passing Year</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.passingYear || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].passingYear = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Marks (%)</label>
//             <input
//               type="text"
//               className="form-input"
//               value={edu.marks || ''}
//               onChange={(e) => {
//                 const updated = [...educations];
//                 updated[index].marks = e.target.value;
//                 setEducations(updated);
//               }}
//             />
//           </div>
//         </>
//       );
//     }

//     return null;
//   };
//   // useLayoutEffect(() => {
//   //   const newHeights = {};
//   //   Object.keys(menuRefs).forEach((key) => {
//   //     const ref = menuRefs[key];
//   //     // Smooth open or close
//   //     newHeights[key] = openSubmenu[key] && ref.current
//   //       ? `${ref.current.scrollHeight}px`
//   //       : '0px';
//   //   });
//   //   setSubmenuMaxHeight(newHeights);
//   // }, [openSubmenu]);
//   //  useLayoutEffect(() => {
//   //     if (!menuRefs.profile.current) return;

//   //     const newHeights = {};
//   //     Object.keys(menuRefs).forEach((key) => {
//   //       const ref = menuRefs[key];
//   //       if (ref.current) {
//   //         if (openSubmenu[key]) {
//   //           // When opening, get actual height
//   //           newHeights[key] = `${ref.current.scrollHeight}px`;
//   //         } else {
//   //           // When closing, use 0px
//   //           newHeights[key] = '0px';
//   //         }
//   //       }
//   //     });
//   //     setSubmenuMaxHeight(newHeights);
//   //   }, [openSubmenu]); 
//   useLayoutEffect(() => {
//     const newHeights = {};
//     Object.keys(menuRefs).forEach((key) => {
//       const ref = menuRefs[key];
//       if (ref.current) {
//         if (openSubmenu[key]) {
//           // Opening: set to scrollHeight immediately
//           newHeights[key] = `${ref.current.scrollHeight}px`;
//         } else {
//           const currentHeight = `${ref.current.scrollHeight}px`;
//           newHeights[key] = currentHeight;

//           setTimeout(() => {
//             setSubmenuMaxHeight(prev => ({
//               ...prev,
//               [key]: '0px'
//             }));
//           }, 5);
//         }
//       }
//     });

//     // Set the heights for open menus immediately
//     setSubmenuMaxHeight(prev => ({
//       ...prev,
//       ...newHeights,
//     }));
//   }, [openSubmenu]);


//   return (
//     <div className="min-h-screen flex flex-col">
//       <main className="flex flex-1">

//         {/* <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${expanded ? 'expanded' : 'collapsed'}`}> */}
//         <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
//           <div className={`navbar-header ${expanded ? 'expanded' : ''}`}>
//             <ul className="nav navbar-nav flex-row">
//               <li className="nav-item mr-auto">
//                 <Link to="/candidate/dashboard" className="navbar-brand">
//                   <img className="img-fluid logocs" src="/Assets/images/logo/logo.png" alt="Logo" />
//                 </Link>
//               </li>
//               <li className="nav-item nav-toggle">
//                 <a className="nav-link modern-nav-toggle pr-0" onClick={toggleSidebar}>
//                   <i className={`icon-x d-block d-xl-none font-medium-4 primary toggle-icon feather ${expanded ? 'icon-disc' : 'icon-circle'}`}></i>
//                   <i className={`toggle-icon icon-disc font-medium-4 d-none d-xl-block collapse-toggle-icon primary feather`}></i>
//                 </a>
//               </li>
//             </ul>
//           </div>
//           <div className="shadow-bottom"></div>
//           <div className="main-menu-content border border-left-0 border-right-0 border-bottom-0">
//             <ul className="navigation navigation-main" id="main-menu-navigation">
//               {/* Dashboard */}
//               <li className={`nav-item ${location.pathname === '/candidate/dashboard' ? 'active' : ''}`}>
//                 <Link to="/candidate/dashboard" onClick={() => {

//                   handleSidebarClose();
//                 }} >
//                   <FontAwesomeIcon icon={faChartLine} />
//                   <span className="menu-title">Dashboard</span>
//                 </Link>
//               </li>

//               {/* Profile */}
//               <li className={`nav-item has-sub ${openSubmenu.profile ? 'open' : ''} ${location.pathname === '/candidate/myprofile' ? 'open' : ''}`}>
//                 <a href="#" onClick={() => toggleSubmenu('profile')}>
//                   <FontAwesomeIcon icon={faUser} />
//                   <span className="menu-title">Profile</span>
//                 </a>
//                 {/* <ul className={`menu-content ${openSubmenu.profile ? 'open' : ''}`}> */}
//                 <ul
//                   ref={menuRefs.profile}
//                   className="menu-content"
//                   style={{
//                     maxHeight: submenuMaxHeight.profile,
//                     overflow: 'hidden',
//                     transition: 'max-height 0.3s ease-in-out,'
//                   }}
//                 >


//                   <li className={`nav-item ${location.pathname === '/candidate/myProfile' ? 'active' : ''}`}>
//                     <Link to="/candidate/myProfile" onClick={() => { handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={faUser} />
//                       <span className="menu-title">Your Profile</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${location.pathname === '/candidate/document' ? 'active' : ''}`}>
//                     <Link to="/candidate/document" onClick={() => { handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farFile} />
//                       <span className="menu-title">Documents</span>
//                     </Link>
//                   </li>
//                 </ul>
//               </li>

//               {/* Courses */}
//               <li className={`nav-item has-sub ${openSubmenu.courses ? 'open' : ''}`}>
//                 <a href="#" onClick={() => toggleSubmenu('courses')}>
//                   <FontAwesomeIcon icon={farUser} />
//                   <span className="menu-title">Courses</span>
//                 </a>
//                 {/* <ul className={`menu-content ${openSubmenu.courses ? 'open' : ''}`}> */}
//                 <ul
//                   ref={menuRefs.courses}
//                   className="menu-content"
//                   style={{
//                     maxHeight: submenuMaxHeight.courses,
//                     overflow: 'hidden',
//                     transition: 'max-height 0.3s ease-in-out'
//                   }}
//                 >

//                   <li className={`nav-item ${location.pathname === '/candidate/searchcourses' ? 'active' : ''}`}>
//                     <Link to="/candidate/searchcourses" onClick={() => { handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={faSearch} />
//                       <span className="menu-title">Search Courses</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${location.pathname === '/candidate/appliedCourses' ? 'active' : ''}`}>
//                     <Link to="/candidate/appliedCourses" onClick={() => { handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farPaperPlane} />
//                       <span className="menu-title">Applied Course</span>
//                     </Link>
//                   </li>
//                 </ul>
//               </li>

//               {/* Jobs */}
//               <li className={`nav-item has-sub ${openSubmenu.jobs ? 'open' : ''}`}>
//                 <a href="#" onClick={() => toggleSubmenu('jobs')}>
//                   <FontAwesomeIcon icon={faClipboardList} />
//                   <span className="menu-title">Jobs</span>
//                 </a>
//                 {/* <ul className={`menu-content ${openSubmenu.jobs ? 'open' : ''}`}> */}
//                 <ul
//                   ref={menuRefs.jobs}
//                   className="menu-content"
//                   style={{
//                     maxHeight: submenuMaxHeight.jobs,
//                     overflow: 'hidden',
//                     transition: 'max-height 0.3s ease-in-out'
//                   }}
//                 >

//                   <li className={`nav-item ${activeItem === 'searchjob' ? 'active' : ''}`}>
//                     <Link to="/candidate/searchjob" onClick={() => { handleItemClick('searchjob'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={faSearch} />
//                       <span className="menu-title">Search Job</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'nearbyJobs' ? 'active' : ''}`}>
//                     <Link to="/candidate/nearbyJobs" onClick={() => { handleItemClick('nearbyJobs'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farMap} />
//                       <span className="menu-title">Jobs Near Me</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'appliedJobs' ? 'active' : ''}`}>
//                     <Link to="/candidate/appliedJobs" onClick={() => { handleItemClick('appliedJobs'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farPaperPlane} />
//                       <span className="menu-title">Applied Jobs</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'registerInterviewsList' ? 'active' : ''}`}>
//                     <Link to="/candidate/registerInterviewsList" onClick={() => { handleItemClick('registerInterviewsList'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farHand} />
//                       <span className="menu-title">Register For Interview</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'InterestedCompanies' ? 'active' : ''}`}>
//                     <Link to="/candidate/InterestedCompanies" onClick={() => { handleItemClick('InterestedCompanies'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farBookmark} />
//                       <span className="menu-title">Shortlisting</span>
//                     </Link>
//                   </li>
//                 </ul>
//               </li>

//               {/* Wallet */}
//               <li className={`nav-item has-sub ${openSubmenu.wallet ? 'open' : ''}`}>
//                 <a href="#" onClick={() => toggleSubmenu('wallet')}>
//                   <FontAwesomeIcon icon={faWallet} />
//                   <span className="menu-title">Wallet</span>
//                 </a>
//                 {/* <ul className={`menu-content ${openSubmenu.wallet ? 'open' : ''}`}> */}
//                 <ul
//                   ref={menuRefs.wallet}
//                   className="menu-content"
//                   style={{
//                     maxHeight: submenuMaxHeight.wallet,
//                     overflow: 'hidden',
//                     transition: 'max-height 0.3s ease-in-out'
//                   }}
//                 >

//                   <li className={`nav-item ${activeItem === 'cashback' ? 'active' : ''}`}>
//                     <Link to="/candidate/cashback" onClick={() => { handleItemClick('cashback'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={faIndianRupeeSign} />;
//                       <span className="menu-title">Cashback Offers</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'myEarnings' ? 'active' : ''}`}>
//                     <Link to="/candidate/myEarnings" onClick={() => { handleItemClick('myEarnings'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farMoneyBill1} />
//                       <span className="menu-title">My Earnings</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'referral' ? 'active' : ''}`}>
//                     <Link to="/candidate/referral" onClick={() => { handleItemClick('referral'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={faForward} />
//                       <span className="menu-title">Refer & Earn</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'Coins' ? 'active' : ''}`}>
//                     <Link to="/candidate/Coins" onClick={() => { handleItemClick('Coins'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={faCoins} />
//                       <span className="menu-title">Coins</span>
//                     </Link>
//                   </li>
//                 </ul>
//               </li>

//               {/* Event page  */}

//               <li className={`nav-item has-sub ${openSubmenu.events ? 'open' : ''}`}>
//                 <a href="#" onClick={() => toggleSubmenu('events')}>
//                   <FontAwesomeIcon icon={faCalendarAlt} />
//                   <span className="menu-title">Events</span>
//                 </a>
//                 {/* <ul className={`menu-content ${openSubmenu.wallet ? 'open' : ''}`}> */}
//                 <ul
//                   ref={menuRefs.events}
//                   className="menu-content"
//                   style={{
//                     maxHeight: submenuMaxHeight.events,
//                     overflow: 'hidden',
//                     transition: 'max-height 0.3s ease-in-out'
//                   }}
//                 >

//                   <li className={`nav-item ${activeItem === 'candidateevent' ? 'active' : ''}`}>
//                     <Link to="/candidate/candidateevent" onClick={() => { handleItemClick('candidateevent'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farCircle} />
//                       <span className="menu-title">Event</span>
//                     </Link>
//                   </li>
//                   <li className={`nav-item ${activeItem === 'appliedevents' ? 'active' : ''}`}>
//                     <Link to="/candidate/appliedevents" onClick={() => { handleItemClick('appliedevents'); handleSidebarClose(); }}>
//                       <FontAwesomeIcon icon={farCircle} />
//                       <span className="menu-title">Applied Event</span>
//                     </Link>
//                   </li>
//                 </ul>
//               </li>

//               {/* Request Loan */}
//               <li className={`nav-item ${activeItem === 'requestLoan' ? 'active' : ''}`}>
//                 <Link to="/candidate/requestLoan" onClick={() => { handleItemClick('requestLoan'); handleSidebarClose(); }}>
//                   <FontAwesomeIcon icon={farCircle} />
//                   <span className="menu-title">Request Loan</span>
//                 </Link>
//               </li>

//               {/* Watch Videos */}
//               <li className={`nav-item ${activeItem === 'watchVideos' ? 'active' : ''}`}>
//                 <Link to="/candidate/watchVideos" onClick={() => { handleItemClick('watchVideos'); handleSidebarClose(); }}>
//                   <FontAwesomeIcon icon={farCirclePlay} />
//                   <span className="menu-title">Watch Videos</span>
//                 </Link>
//               </li>

//               {/* Share Profile */}
//               <li className={`nav-item ${activeItem === 'shareCV' ? 'active' : ''}`}>
//                 <Link to="/candidate/shareCV" onClick={() => { handleItemClick('shareCV'); handleSidebarClose(); }}>
//                   <FontAwesomeIcon icon={farShareFromSquare} />
//                   <span className="menu-title">Share Profile</span>
//                 </Link>
//               </li>

//               {/* Notifications */}
//               <li className={`nav-item ${activeItem === 'notifications' ? 'active' : ''}`}>
//                 <Link to="/candidate/notifications" onClick={() => { handleItemClick('notifications'); handleSidebarClose(); }}>
//                   <FontAwesomeIcon icon={farBell} />
//                   <span className="menu-title">Notifications</span>
//                 </Link>
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* <div className="flex-1">

//           <div className="app-content content basic-timeline">
//             <CandidateHeader />
//             <Outlet />
//             <CandidateFooter />

//           </div>
//         </div> */}

//         <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
//           data-open="click" data-menu="vertical-menu-modern" data-col="2-columns" id="inner_job_page">

//           <div className="app-content content">
//             <div className="content-overlay"></div>
//             <div className="header-navbar-shadow"></div>
//             <CandidateHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen} />
//             <div className="content-wrapper">
//               <div className="mt-2 mb-2">

//                 {!showProfileForm && (
//                   <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
//                   data-open="click" data-menu="vertical-menu-modern" data-col="2-columns" id="inner_job_page">
        
//                   <div className="">
//                     <CandidateHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen} />
//                     <div className="content-wrapper">
//                       <div className="mt-2 mb-2">
        
                      
//                           <div className="modal fade show popmodel"
//                             style={{ display: 'block' }}
//                             tabIndex="-1"
//                             aria-modal="true"
//                             role="dialog"
//                             data-bs-backdrop="static"
//                             data-bs-keyboard="false">
//                             <div className="fade show"></div>
//                             <div className="modal-dialog modal-dialog-centered modal-lg">
//                               <div className="modal-content">
                                
//                                 <div className="modal-body">
//                                   <User />
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
                      
//                       </div>
//                       <div className="content-body mb-4">
//                         <Outlet />
//                       </div>
//                       <CandidateFooter />
//                     </div>
//                   </div>
//                 </div>
//                  )} 
//               </div>
//               <div className="content-body mb-4">
//                 <Outlet />
//               </div>
//               <CandidateFooter />
//             </div>
//           </div>
//         </div>
//       </main>

//       <style>
//         {
//           `
//     .menu-content {
//   overflow: hidden;
//   transition: max-height 0.3s ease-in-out;
// }
 
// .menu-content {
//             overflow: hidden;
//             transition: max-height 0.3s ease-in-out;
//           }
          
//           /* Add popup styles */
//           .profile-form-popup {
//             position: fixed;
//             top: 0;
//             left: 0;
//             right: 0;
//             bottom: 0;
//             z-index: 9999;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//           }
          
//           .popup-overlay {
//             position: absolute;
//             top: 0;
//             left: 0;
//             right: 0;
//             bottom: 0;
//             background-color: rgba(0, 0, 0, 0.6);
//           }
          
//           .popup-content {
//             position: relative;
//             background-color: white;
//             border-radius: 8px;
//             width: 90%;
//             max-width: 900px;
//             max-height: 90vh;
//             overflow-y: auto;
//             padding: 20px;
//             z-index: 10000;
//             box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
//           }
          
//           .close-popup {
//             position: absolute;
//             top: 10px;
//             right: 15px;
//             font-size: 24px;
//             background: none;
//             border: none;
//             cursor: pointer;
//             z-index: 10001;
//             color: #333;
//             font-weight: bold;
//           }
          
//           .close-popup:hover {
//             color: #FC2B5A;
//           }
//             .popmodel{
//             overflow-y: scroll!important;
//             }
// `
//         }
//       </style>
//     </div>
//   )
// }

// export default CandidateLayout
