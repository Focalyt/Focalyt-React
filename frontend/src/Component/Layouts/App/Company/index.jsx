import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import CompanyHeader from './CompanyHeader/CompanyHeader'
import CompanyFooter from './CompanyFooter/CompanyFooter'
import { useNavigate } from "react-router-dom";
import axios from 'axios'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTachometerAlt,
  faFileText,
  faUser,
  faBell,
  faFileAlt,
  faList,
  faMapPin,
  faAward,
  faStar,
  faCircle
} from '@fortawesome/free-solid-svg-icons';

function CompanyLayout({ children }) {
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
          navigate('/company/login');
        }

        const response = await axios.get(`${backendUrl}/company/profile`, {
          headers: {
            'x-auth': token
          }
        });

        if (response.data.status || response.data.success) {
          console.log("Profile data fetched:", response.data);
          const data = response.data;
          
          if (data.showProfileForm) {
            setShowProfileForm(data.showProfileForm);
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
    const storedUser = sessionStorage.getItem('company') || localStorage.getItem('company');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (error) {
        console.error("Invalid JSON in storage for 'company':", error);
        // Optional fallback: store as plain string
        setUser({ name: storedUser });
      }
    } else {
      navigate('/company/login');
    }
  }, []);

  const [openDropdown, setOpenDropdown] = useState(null);
  const profileMenuRef = useRef(null);
  const toggleDropdown = (menu) => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  const [expanded, setExpanded] = useState(true);
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

  // Helper function to check if current path matches menu item
  const isActiveMenuItem = (paths) => {
    if (Array.isArray(paths)) {
      return paths.some(path => location.pathname === path || location.pathname.startsWith(path));
    }
    return location.pathname === paths || location.pathname.startsWith(paths);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-1">

        {/* Sidebar */}
        <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
          <div className={`navbar-header ${expanded ? 'expanded' : ''}`}>
            <ul className="nav navbar-nav flex-row">
              <li className="nav-item mr-auto">
                <Link to="/company/dashboard" className="navbar-brand">
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
              <li className={`nav-item ${isActiveMenuItem('/company/dashboard') ? 'active' : ''}`}>
                <Link to="/company/dashboard" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faTachometerAlt} className="feather" />
                  <span className="menu-title" data-i18n="Dashboard">Dashboard</span>
                </Link>
              </li>

              {/* Your Profile */}
              <li className={`nav-item ${isActiveMenuItem('/company/myProfile') ? 'active' : ''}`}>
                <Link to="/company/myProfile" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faUser} className="feather" />
                  <span className="menu-title" data-i18n="Todo">Your Profile</span>
                </Link>
              </li>

              {/* Notifications */}
              <li className={`nav-item ${isActiveMenuItem('/company/notifications') ? 'active' : ''}`}>
                <Link to="/company/notifications" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faBell} className="fa" />
                  <span className="menu-title" data-i18n="Todo">Notifications</span>
                </Link>
              </li>

              {/* Job Details */}
              <li className={`nav-item ${isActiveMenuItem(['/company/list/jobs', '/company/jobs', '/company/addjobs', '/company/editJobs']) ? 'active' : ''}`}>
                <Link to="/company/list/jobs" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faFileText} className="feather" />
                  <span className="menu-title" data-i18n="Todo">Job Details</span>
                </Link>
              </li>

              {/* List Candidates */}
              <li className={`nav-item ${isActiveMenuItem('/company/list-candidates') ? 'active' : ''}`}>
                <Link to="/company/list-candidates" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faList} className="feather" />
                  <span className="menu-title" data-i18n="Todo">List Candidates</span>
                </Link>
              </li>

              {/* Interested Candidates */}
              <li className={`nav-item ${isActiveMenuItem('/company/interested-candidates') ? 'active' : ''}`}>
                <Link to="/company/interested-candidates" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faList} className="feather" />
                  <span className="menu-title" data-i18n="Todo">Interested Candidates</span>
                </Link>
              </li>

              {/* Candidates Near Me */}
              <li className={`nav-item ${isActiveMenuItem('/company/nearbyCandidates') ? 'active' : ''}`}>
                <Link to="/company/nearbyCandidates" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faMapPin} className="feather" />
                  <span className="menu-title" data-i18n="Todo">Candidates Near Me</span>
                </Link>
              </li>

              {/* Shortlisted Candidates */}
              <li className={`nav-item ${isActiveMenuItem('/company/shortlisted') ? 'active' : ''}`}>
                <Link to="/company/shortlisted" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faAward} className="feather" />
                  <span className="menu-title" data-i18n="Todo">Shortlisted Candidates</span>
                </Link>
              </li>

              {/* On Going Hiring */}
              <li className={`nav-item ${isActiveMenuItem('/company/onGoingHiring') ? 'active' : ''}`}>
                <Link to="/company/onGoingHiring" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faStar} className="feather" />
                  <span className="menu-title" data-i18n="Todo">On Going Hiring</span>
                </Link>
              </li>

              {/* Coins */}
              <li className={`nav-item ${isActiveMenuItem('/company/Coins') ? 'active' : ''}`}>
                <Link to="/company/Coins" onClick={handleSidebarClose}>
                  <FontAwesomeIcon icon={faCircle} className="feather" />
                  <span className="menu-title" data-i18n="Todo">Coins</span>
                </Link>
              </li>

            </ul>
          </div>
        </div>

        {/* Main Content Area - FIXED: Only one header now */}
        <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
          data-open="click" data-menu="vertical-menu-modern" data-col="2-columns" id="inner_job_page">

          <div className="app-content content">
            <div className="content-overlay"></div>
            <div className="header-navbar-shadow"></div>
            
            {/* ✅ SINGLE HEADER - No more duplication */}
            <CompanyHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen} />
            
            <div className="content-wrapper">
              <div className="content-body mb-4">
                {/* ✅ DIRECT OUTLET - Clean and simple */}
                <Outlet />
              </div>
              <CompanyFooter />
            </div>
          </div>
        </div>
      </main>

      <style>
        {
          `
          .main-menu {
            transition: all 0.3s ease;
          }
          
          .main-menu.collapsed {
            width: 80px;
          }
          
          .main-menu.expanded {
            width: 260px;
          }
          
          .nav-item.active > a {
            background-color: #FC2B5A !important;
            color: white !important;
            border-radius: 4px;
          }
          
          .nav-item.active > a .feather,
          .nav-item.active > a .fa {
            color: white !important;
          }
          
          .nav-item > a {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            color: #6E6B7B;
            text-decoration: none;
            transition: all 0.3s ease;
          }
          
          .nav-item > a:hover {
            background-color: #f8f8f8;
            color: #FC2B5A;
            border-radius: 4px;
          }
          
          .nav-item > a .feather,
          .nav-item > a .fa {
            width: 18px;
            height: 18px;
            margin-right: 12px;
            font-size: 18px;
            color: #6E6B7B;
          }
          
          .nav-item > a:hover .feather,
          .nav-item > a:hover .fa {
            color: #FC2B5A;
          }
          
          .menu-title {
            font-size: 16px;
            font-weight: 400;
            white-space: nowrap;
          }
          
          .navbar-header {
            padding: 1rem;
            border-bottom: 1px solid #ebe9f1;
          }
          
          .navbar-brand img {
            max-height: 40px;
            width: auto;
          }
          
          .modern-nav-toggle {
            cursor: pointer;
            color: #FC2B5A;
          }
          
          .shadow-bottom {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
          }
          
          .main-menu-content {
            padding: 1rem 0;
            height: calc(100vh - 80px);
            overflow-y: auto;
          }
          
          .navigation {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          /* Mobile responsiveness */
          @media (max-width: 1199px) {
            .main-menu {
              position: fixed;
              left: -260px;
              top: 0;
              height: 100vh;
              z-index: 1000;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            
            .main-menu.expanded {
              left: 0;
            }
            
            .app-content {
              margin-left: 0 !important;
            }
          }
          
          /* Desktop */
          @media (min-width: 1200px) {
            .app-content {
              margin-left: 260px;
            }
            
            .main-menu.collapsed + .vertical-layout .app-content {
              margin-left: 80px;
            }
          }
          
          /* Profile form popup styles */
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
          
          .popmodel {
            overflow-y: scroll !important;
          }
          
          /* Scrollbar styling */
          .main-menu-content::-webkit-scrollbar {
            width: 4px;
          }
          
          .main-menu-content::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          
          .main-menu-content::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 2px;
          }
          
          .main-menu-content::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `
        }
      </style>
    </div>
  )
}

export default CompanyLayout