import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import CollegeHeader from './CollegeHeader/CollegeHeader';
import CollegeFooter from './CollegeFooter/CollegeFooter';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

import {
  faChartLine, faUser, faSearch, faClipboardList, faWallet, faIndianRupeeSign, faForward, faCoins, faGraduationCap, faBuilding, faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

import {
  faUser as farUser, faFile as farFile,
  faPaperPlane as farPaperPlane, faMap as farMap, faHand as farHand, faBookmark as farBookmark,
  faCircle as farCircle, faCirclePlay as farCirclePlay, faShareFromSquare as farShareFromSquare, faBell as farBell, faMoneyBill1 as farMoneyBill1,
} from "@fortawesome/free-regular-svg-icons";

function CollegeLayout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const collegeData = localStorage.getItem('collegeName');
    if (token && collegeData) {
      setUser({ token, collegeName: collegeData });
    } else {
      navigate('/college/login');
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

  const [expanded, setExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [openSubmenu, setOpenSubmenu] = useState({
    profile: false,
    students: false,
    jobs: false,
    courses: false
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

  const menuRefs = {
    profile: useRef(null),
    students: useRef(null),
    jobs: useRef(null),
    courses: useRef(null),
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  const [submenuMaxHeight, setSubmenuMaxHeight] = useState({
    profile: '0px',
    students: '0px',
    jobs: '0px',
    courses: '0px'
  });

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
        <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
          <div className={`navbar-header ${expanded ? 'expanded' : ''}`}>
            <ul className="nav navbar-nav flex-row">
              <li className="nav-item mr-auto">
                <Link to="/college/dashboard" className="navbar-brand">
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
              <li className={`nav-item ${location.pathname === '/college/dashboard' ? 'active' : ''}`}>
                <Link to="/college/dashboard" onClick={() => {
                  handleSidebarClose();
                }} >
                  <FontAwesomeIcon icon={faChartLine} />
                  <span className="menu-title">Dashboard</span>
                </Link>
              </li>

              {/* Profile */}
              <li className={`nav-item has-sub ${openSubmenu.profile ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('profile')}>
                  <FontAwesomeIcon icon={faBuilding} />
                  <span className="menu-title">Institute Profile</span>
                </a>
                <ul
                  ref={menuRefs.profile}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.profile,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/college/profile' ? 'active' : ''}`}>
                    <Link to="/college/profile" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faBuilding} />
                      <span className="menu-title">Institute Details</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/college/documents' ? 'active' : ''}`}>
                    <Link to="/college/documents" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farFile} />
                      <span className="menu-title">Documents</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Students */}
              <li className={`nav-item has-sub ${openSubmenu.students ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('students')}>
                  <FontAwesomeIcon icon={faGraduationCap} />
                  <span className="menu-title">Students</span>
                </a>
                <ul
                  ref={menuRefs.students}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.students,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/college/students' ? 'active' : ''}`}>
                    <Link to="/college/students" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farUser} />
                      <span className="menu-title">All Students</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/college/addStudent' ? 'active' : ''}`}>
                    <Link to="/college/addStudent" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faUser} />
                      <span className="menu-title">Add Student</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/college/studentReports' ? 'active' : ''}`}>
                    <Link to="/college/studentReports" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faClipboardList} />
                      <span className="menu-title">Student Reports</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Courses */}
              <li className={`nav-item has-sub ${openSubmenu.courses ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('courses')}>
                  <FontAwesomeIcon icon={faBookOpen} />
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
                  <li className={`nav-item ${location.pathname === '/college/courses' ? 'active' : ''}`}>
                    <Link to="/college/courses" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faBookOpen} />
                      <span className="menu-title">All Courses</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/college/addCourse' ? 'active' : ''}`}>
                    <Link to="/college/addCourse" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span className="menu-title">Add Course</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/college/enrollments' ? 'active' : ''}`}>
                    <Link to="/college/enrollments" onClick={() => { handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farPaperPlane} />
                      <span className="menu-title">Enrollments</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Jobs & Placement */}
              <li className={`nav-item has-sub ${openSubmenu.jobs ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('jobs')}>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span className="menu-title">Jobs & Placement</span>
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
                  <li className={`nav-item ${activeItem === 'jobPostings' ? 'active' : ''}`}>
                    <Link to="/college/jobPostings" onClick={() => { handleItemClick('jobPostings'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={faClipboardList} />
                      <span className="menu-title">Job Postings</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'placementDrives' ? 'active' : ''}`}>
                    <Link to="/college/placementDrives" onClick={() => { handleItemClick('placementDrives'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farHand} />
                      <span className="menu-title">Placement Drives</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'placedStudents' ? 'active' : ''}`}>
                    <Link to="/college/placedStudents" onClick={() => { handleItemClick('placedStudents'); handleSidebarClose(); }}>
                      <FontAwesomeIcon icon={farBookmark} />
                      <span className="menu-title">Placed Students</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Reports */}
              <li className={`nav-item ${activeItem === 'reports' ? 'active' : ''}`}>
                <Link to="/college/reports" onClick={() => { handleItemClick('reports'); handleSidebarClose(); }}>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span className="menu-title">Reports</span>
                </Link>
              </li>

              {/* Notifications */}
              <li className={`nav-item ${activeItem === 'notifications' ? 'active' : ''}`}>
                <Link to="/college/notifications" onClick={() => { handleItemClick('notifications'); handleSidebarClose(); }}>
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
            {/* <CollegeHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen} /> */}
            <CollegeHeader/>
            <div className="content-wrapper">
              <div className="content-body mb-4">
                <Outlet />
              </div>
             <CollegeFooter/>
            </div>
          </div>
        </div>
      </main>
    
      <style>
        {`
        .menu-content {
          overflow: hidden;
          transition: max-height 0.3s ease-in-out;
        }
        `}
      </style>
    </div>
  )
}

export default CollegeLayout