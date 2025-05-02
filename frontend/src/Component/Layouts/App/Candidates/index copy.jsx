import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import CandidateHeader from './CandidateHeader/CandidateHeader'
import CandidateFooter from './CandidateFooter/CandidateFooter'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

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
  const toggleSubmenu = (menu) => {
    setOpenSubmenu(prev => {
      const newState = { ...prev, [menu]: !prev[menu] };


      return newState;
    });
  };
  const [showLoginModal, setShowLoginModal] = useState(false);
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    }
  }, []);
  
  const [expanded, setExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [openSubmenu, setOpenSubmenu] = useState({
    profile: false,
    courses: false,
    jobs: false,
    wallet: false,
    events: false
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

  // const toggleSubmenu = (menu) => {
  //   setOpenSubmenu({
  //     ...openSubmenu,
  //     [menu]: !openSubmenu[menu]
  //   });
  // };
  const menuRefs = {
    profile: useRef(null),
    courses: useRef(null),
    jobs: useRef(null),
    wallet: useRef(null),
    events: useRef(null)
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  const [submenuMaxHeight, setSubmenuMaxHeight] = useState({
    profile: '0px',
    courses: '0px',
    jobs: '0px',
    wallet: '0px',
    events: '0px'
  });

  // useLayoutEffect(() => {
  //   const newHeights = {};
  //   Object.keys(menuRefs).forEach((key) => {
  //     const ref = menuRefs[key];
  //     // Smooth open or close
  //     newHeights[key] = openSubmenu[key] && ref.current
  //       ? `${ref.current.scrollHeight}px`
  //       : '0px';
  //   });
  //   setSubmenuMaxHeight(newHeights);
  // }, [openSubmenu]);
  //  useLayoutEffect(() => {
  //     if (!menuRefs.profile.current) return;

  //     const newHeights = {};
  //     Object.keys(menuRefs).forEach((key) => {
  //       const ref = menuRefs[key];
  //       if (ref.current) {
  //         if (openSubmenu[key]) {
  //           // When opening, get actual height
  //           newHeights[key] = `${ref.current.scrollHeight}px`;
  //         } else {
  //           // When closing, use 0px
  //           newHeights[key] = '0px';
  //         }
  //       }
  //     });
  //     setSubmenuMaxHeight(newHeights);
  //   }, [openSubmenu]); 
  useLayoutEffect(() => {
    const newHeights = {};
    Object.keys(menuRefs).forEach((key) => {
      const ref = menuRefs[key];
      if (ref.current) {
        if (openSubmenu[key]) {
          // Opening: set to scrollHeight immediately
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

    // Set the heights for open menus immediately
    setSubmenuMaxHeight(prev => ({
      ...prev,
      ...newHeights,
    }));
  }, [openSubmenu]);


  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-1">

        {/* <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${expanded ? 'expanded' : 'collapsed'}`}> */}
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
                {/* <ul className={`menu-content ${openSubmenu.profile ? 'open' : ''}`}> */}
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
                {/* <ul className={`menu-content ${openSubmenu.courses ? 'open' : ''}`}> */}
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
                {/* <ul className={`menu-content ${openSubmenu.jobs ? 'open' : ''}`}> */}
                <ul
                  ref={menuRefs.jobs}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.jobs,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >

                  <li className={`nav-item ${activeItem === 'searchjob' ? 'active' : ''}`}>
                    <Link to="/candidate/searchjob" onClick={() => { handleItemClick('searchjob'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span className="menu-title">Search Job</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'nearbyJobs' ? 'active' : ''}`}>
                    <Link to="/candidate/nearbyJobs" onClick={() => { handleItemClick('nearbyJobs'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farMap} />
                      <span className="menu-title">Jobs Near Me</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'appliedJobs' ? 'active' : ''}`}>
                    <Link to="/candidate/appliedJobs" onClick={() => { handleItemClick('appliedJobs'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farPaperPlane} />
                      <span className="menu-title">Applied Jobs</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'registerInterviewsList' ? 'active' : ''}`}>
                    <Link to="/candidate/registerInterviewsList" onClick={() => { handleItemClick('registerInterviewsList'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farHand} />
                      <span className="menu-title">Register For Interview</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'InterestedCompanies' ? 'active' : ''}`}>
                    <Link to="/candidate/InterestedCompanies" onClick={() => { handleItemClick('InterestedCompanies'); handleSidebarClose(); }}>
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
                {/* <ul className={`menu-content ${openSubmenu.wallet ? 'open' : ''}`}> */}
                <ul
                  ref={menuRefs.wallet}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.wallet,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >

                  <li className={`nav-item ${activeItem === 'cashback' ? 'active' : ''}`}>
                    <Link to="/candidate/cashback" onClick={() => { handleItemClick('cashback'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faIndianRupeeSign} />;
                      <span className="menu-title">Cashback Offers</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'myEarnings' ? 'active' : ''}`}>
                    <Link to="/candidate/myEarnings" onClick={() => { handleItemClick('myEarnings'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farMoneyBill1} />
                      <span className="menu-title">My Earnings</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'referral' ? 'active' : ''}`}>
                    <Link to="/candidate/referral" onClick={() => { handleItemClick('referral'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faForward} />
                      <span className="menu-title">Refer & Earn</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'Coins' ? 'active' : ''}`}>
                    <Link to="/candidate/Coins" onClick={() => { handleItemClick('Coins'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faCoins} />
                      <span className="menu-title">Coins</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Event page  */}

              <li className={`nav-item has-sub ${openSubmenu.events ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('events')}>
                  <FontAwesomeIcon icon={faWallet} />
                  <span className="menu-title">Events</span>
                </a>
                {/* <ul className={`menu-content ${openSubmenu.wallet ? 'open' : ''}`}> */}
                <ul
                  ref={menuRefs.events}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.events,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >

                  <li className={`nav-item ${activeItem === 'candidateevent' ? 'active' : ''}`}>
                    <Link to="/candidate/candidateevent" onClick={() => { handleItemClick('candidateevent'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farCircle} />
                      <span className="menu-title">Event</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'appliedevents' ? 'active' : ''}`}>
                  <Link to="/candidate/appliedevents" onClick={() => { handleItemClick('appliedevents'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farCircle} />
                      <span className="menu-title">Applied Event</span>
                    </Link>
                  </li>
                </ul>
              </li>



              {/* Request Loan */}
              <li className={`nav-item ${activeItem === 'requestLoan' ? 'active' : ''}`}>
                <Link to="/candidate/requestLoan" onClick={() => { handleItemClick('requestLoan'); handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farCircle} />
                  <span className="menu-title">Request Loan</span>
                </Link>
              </li>

              {/* Watch Videos */}
              <li className={`nav-item ${activeItem === 'watchVideos' ? 'active' : ''}`}>
                <Link to="/candidate/watchVideos" onClick={() => { handleItemClick('watchVideos'); handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farCirclePlay} />
                  <span className="menu-title">Watch Videos</span>
                </Link>
              </li>

              {/* Share Profile */}
              <li className={`nav-item ${activeItem === 'shareCV' ? 'active' : ''}`}>
                <Link to="/candidate/shareCV" onClick={() => { handleItemClick('shareCV'); handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farShareFromSquare} />
                  <span className="menu-title">Share Profile</span>
                </Link>
              </li>

              {/* Notifications */}
              <li className={`nav-item ${activeItem === 'notifications' ? 'active' : ''}`}>
                <Link to="/candidate/notifications" onClick={() => { handleItemClick('notifications'); handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={farBell} />
                  <span className="menu-title">Notifications</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* <div className="flex-1">

          <div className="app-content content basic-timeline">
            <CandidateHeader />
            <Outlet />
            <CandidateFooter />

          </div>
        </div> */}

        <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
          data-open="click" data-menu="vertical-menu-modern" data-col="2-columns" id="inner_job_page">

          <div className="app-content content">
            <div className="content-overlay"></div>
            <div className="header-navbar-shadow"></div>
            <CandidateHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen} />
            <div className="content-wrapper">
              <div className="content-body mb-4">
                <Outlet />

             
                  <div className="login-modal-overlay">
                    <div className="login-modal">
                      <div className="login-modal-header">
                        <h3>Login Required</h3>
                        <button className="close-btn" >
                         
                        </button>
                      </div>
                      <div className="login-modal-body">
                      <div className="user-container">
            {/* Step Progress Bar */}
            <div className="step-progress-container">
                <div className="newloader">
                    <div
                        className="bar"
                        style={{
                            width: currentStep === 1 ? '0%' :
                                currentStep === 2 ? '50%' : '100%'
                        }}
                    ></div>
                    <div className="check-bar-container">
                        <div></div>
                        <div
                            className={`check ${formData.basicDetails.completed ? 'completed' : currentStep === 1 ? 'active' : ''}`}
                            onClick={() => goToStep(1)}
                        >
                            {formData.basicDetails.completed ? (
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
                            className={`check ${formData.lastStep.completed ? 'completed' : currentStep === 3 ? 'active' : ''}`}
                            onClick={() => goToStep(3)}
                        >
                            {formData.lastStep.completed ? (
                                <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                                    <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                                </svg>
                            ) : (
                                <span>3</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="step-labels">
                    <div className={`step-label ${currentStep === 1 ? 'active' : ''}`}>Basic details</div>
                    <div className={`step-label ${currentStep === 2 ? 'active' : ''}`}>Education</div>
                    <div className={`step-label ${currentStep === 3 ? 'active' : ''}`}>Last step</div>
                </div>
            </div>

            {/* Form Content */}
            <div className="form-container">
                {currentStep === 1 && (
                    <div className="step-content">
                        <h2>Basic details</h2>
                        <p className="form-description">Fill in your basic information</p>
                        
                        {/* Basic details form fields */}
                        <div className="form-group">
                            <label className="form-label">Full Name <span className="required">*</span></label>
                            <input type="text" className="form-input" placeholder="Enter your full name" />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Email Address <span className="required">*</span></label>
                            <input type="email" className="form-input" placeholder="Enter your email" />
                        </div>
                        
                        <button className="continue-btn" onClick={handleContinue}>Continue</button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="step-content">
                        <h2>Education details</h2>
                        <p className="form-description">These details help recruiters identify your background</p>
                        
                        {educations.map((edu, index) => (
                            <div className="education-item" key={`education-${index}`}>
                                {index > 0 && (
                                    <div className="item-controls">
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
                                    </div>
                                )}
                                
                                <div className="form-group">
                                    <label className="form-label">Education Level <span className="required">*</span></label>
                                    <select
                                        className="form-input"
                                        value={edu.education || ''}
                                        onChange={(e) => handleEducationChange(e, index)}
                                    >
                                        <option value="">Select Education Level</option>
                                        {educationList.map((e) => (
                                            <option key={e._id} value={e._id}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Render additional fields based on selected education type */}
                                {renderEducationFields(edu, index)}
                                
                            </div>
                        ))}
                        
                        <button
                            className="add-button"
                            onClick={() => setEducations([...educations, {}])}
                        >
                            + Add Education
                        </button>
                        
                        <button className="continue-btn" onClick={handleContinue}>
                            Save and continue
                        </button>
                    </div>
                )}
                
                {currentStep === 3 && (
                    <div className="step-content">
                        <h2>Last step</h2>
                        <p className="form-description">Almost done! Just a few more details...</p>
                        
                        {/* Last step form fields */}
                        <div className="form-group">
                            <label className="form-label">Additional Information</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Any additional information you'd like to share"
                            ></textarea>
                        </div>
                        
                        <button className="continue-btn" onClick={handleContinue}>
                            Complete
                        </button>
                    </div>
                )}
            </div>
        </div>
                      </div>
                    </div>
                  </div>
              


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
    `
        }
      </style>
      <style>
        {`
          .menu-content {
            overflow: hidden;
            transition: max-height 0.3s ease-in-out;
          }
          
          /* Login Modal Styles */
          .login-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1050;
          }
          
          .login-modal {
            background-color: white;
            border-radius: 8px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          }
          
          .login-modal-header {
            padding: 1rem;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .login-modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
          }
          
          .close-btn {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            color: #6c757d;
          }
          
          .login-modal-body {
            padding: 1.5rem;
          }
          
          .form-group {
            margin-bottom: 1rem;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }
          
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 1rem;
          }
          
          .login-btn {
            width: 100%;
            padding: 0.75rem;
            background-color: #4f5b8b;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          
          .login-btn:hover {
            background-color: #3a446e;
          }
          
          .mt-2 {
            margin-top: 0.75rem;
          }
          
          .mt-3 {
            margin-top: 1rem;
          }
          
          .mr-2 {
            margin-right: 0.5rem;
          }
          
          .text-center {
            text-align: center;
          }
        `}
      </style>

    </div>
  )
}

export default CandidateLayout
