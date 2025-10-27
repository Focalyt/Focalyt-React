import React, { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import TrainerHeader from './TrainerHeader/TrainerHeader'
import TrainerFooter from './TrainerFooter/TrainerFooter'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faBookOpen, faPlusCircle, faListCheck, faEye, faShoppingCart, faChartLine, faUserFriends, faUserCheck, faBell,
  faHandshake, faTasks, faClipboardList, faFileUpload, faGraduationCap, faBuilding, faCalendarAlt, faCheckCircle,
  faCogs, faUserShield, faSitemap, faProjectDiagram, faFileAlt, faCaretDown, faIndustry, faTags, faGlobe, faBullhorn
} from "@fortawesome/free-solid-svg-icons";
import { faList, faTrendingUp } from '@fortawesome/free-solid-svg-icons';

function TrainerLayout({ children }){

  useEffect(()=>{
    const role = JSON.parse(sessionStorage.getItem('role'))
    if(role !== 4){
      navigate('/trainer/login')
    }
  },[])

    const token = JSON.parse(sessionStorage.getItem('token'))
    const location = useLocation();
    const navigate = useNavigate();
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

    const [expanded, setExpanded] = useState(true);
    const [activeItem, setActiveItem] = useState('dashboard');
    const [openSubmenu, setOpenSubmenu] = useState({
      profile: false,
      students: false,
      courses: false,
      assignments: false,
      assessments: false,
      reports: false,
      communication: false,
      resources: false,
      attendance: false,
      settings: false
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

    const toggleSidebar = () => {
      setIsSidebarOpen(prev => !prev);
    };
    const handleSidebarClose = () => {
        if (isMobile) {
          setIsSidebarOpen(false);
        }
    }
    const toggleSubmenu = (menu) => {
        setOpenSubmenu(prev => {
          const newState = { ...prev, [menu]: !prev[menu] };
          return newState;
        });
    };
    
    const menuRefs = {
        profile: useRef(null),
        students: useRef(null),
        courses: useRef(null),
        assignments: useRef(null),
        assessments: useRef(null),
        reports: useRef(null),
        communication: useRef(null),
        resources: useRef(null),
        attendance: useRef(null),
        settings: useRef(null)
    };
    
    const [submenuMaxHeight, setSubmenuMaxHeight] = useState({
        profile: '0px',
        students: '0px',
        courses: '0px',
        assignments: '0px',
        assessments: '0px',
        reports: '0px',
        communication: '0px',
        resources: '0px',
        attendance: '0px',
        settings: '0px'
    });

    // Update submenu heights when they open/close
    useEffect(() => {
      Object.keys(openSubmenu).forEach((key) => {
        if (menuRefs[key]?.current) {
          setSubmenuMaxHeight(prev => ({
            ...prev,
            [key]: openSubmenu[key] ? `${menuRefs[key].current.scrollHeight}px` : '0px'
          }));
        }
      });
    }, [openSubmenu]);


   return(
    <div className="min-h-screen flex flex-col">
    <main className="flex flex-1">
      <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
        <div className={`navbar-header ${expanded ? 'expanded' : ''}`}>
          <ul className="nav navbar-nav flex-row">
            <li className="nav-item mr-auto">
              <Link to="/trainer/dashboard" className="navbar-brand">
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

           
            <li className={`nav-item ${location.pathname === '/trainer/dashboard' ? 'active' : ''}`}>
              <Link to="/trainer/dashboard " onClick={() => handleSidebarClose()}>
              <FontAwesomeIcon icon={faChartLine} />
                <span className="menu-title">Dashboard</span>
              </Link>
            </li>

            
            <li className={`nav-item ${location.pathname === '/trainer/profile' ? 'active' : ''}`}>
              <Link to="/trainer/profile" onClick={() => handleSidebarClose()}>
              <FontAwesomeIcon icon={faUser} />
                <span className="menu-title">My Profile</span>
              </Link>
            </li>

            
            <li className={`nav-item has-sub ${openSubmenu.courses ? 'open' : ''}`}>
              <a href="#" onClick={() => toggleSubmenu('courses')}>
              <FontAwesomeIcon icon={faBookOpen} />
                <span className="menu-title">Courses Management</span>
                <span className="dropdown-arrow">
                  <i className={`feather icon-chevron-right chevron-icon ${openSubmenu.courses ? 'rotate-90' : ''}`}></i>
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
                <li className={`nav-item ${location.pathname === '/trainer/center' ? 'active' : ''}`}>
                  <Link to="/trainer/center" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faBookOpen} />
                    <span className="menu-title">My Courses</span>
                  </Link>
                </li>
                <li className={`nav-item ${location.pathname === '/trainer/courses/add-content' ? 'active' : ''}`}>
                  <Link to="/trainer/addcoursecontent" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faPlusCircle} />
                    <span className="menu-title">Add Course Content</span>
                  </Link>
                </li>
               
              </ul>
            </li>
             
            <li className={`nav-item has-sub ${openSubmenu.settings ? 'open' : ''}`}>
              <a href="#" onClick={() => toggleSubmenu('settings')}>
              <FontAwesomeIcon icon={faCogs} />
                <span className="menu-title">Settings</span>
                <span className="dropdown-arrow">
                  <i className={`feather icon-chevron-right chevron-icon ${openSubmenu.settings ? 'rotate-90' : ''}`}></i>
                </span>
              </a>
              <ul
                ref={menuRefs.settings}
                className="menu-content"
                style={{
                  maxHeight: submenuMaxHeight.settings,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out'
                }}
              >
               
              </ul>
            </li>

          </ul>
        </div>
      </div>

      <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
        data-open="click" data-menu="vertical-menu-modern" data-col="2-columns" id="inner_job_page">

        <div className="app-content content">
          <div className="content-overlay"></div>
          <div className="header-navbar-shadow"></div>
          <TrainerHeader toggleSidebar={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
          <div className="content-wrapper">
            <div className="mb-4" >
              <Outlet />
            </div>
            <TrainerFooter />
          </div>
        </div>
      </div>
    </main>


    <style>
      {`
      html body .content .content-wrapper {
  margin-top: 6rem;
  padding: 1.8rem 2.2rem 0;
}
.breadcrumb {
  border-left: 1px solid #d6dce1;
  padding: .5rem 0 .5rem 1rem !important;
  }
  .breadcrumb-item a, .card-body a {
  color: #fc2b5a;
}
  html body .content .content-wrapper .content-header-title {
  color: #636363;
  font-weight: 500;
  margin-right: 1rem;
  padding-bottom: 10px;
}
  .nav-item.active svg {
    color: white;
}
  .float-left {
  float: left !important;
}
      .menu-content {
        overflow: hidden;
        transition: max-height 0.3s ease-in-out;
      }

.card{
  box-shadow: 0 4px 25px 0 #0000001a;
  margin-bottom: 2.2rem;
}
  label {
  font-size: .8rem !important;
}
  .nav-pills .nav-link.active, .nav-pills .show>.nav-link {
  background-color: #fc2b5a;
}

.navigation li.active > a , .navigation li.active > a > span {
background-color: #ff3366;
color: #fff;
font-weight: 500;
}

/* Make dropdown items visually distinct */
.dropdown-toggle-link {
position: relative;
display: flex;
justify-content: space-between;
align-items: center;
width: 100%;
}

.dropdown-arrow {
position: absolute;
right: 15px;
top: 50%;
transform: translateY(-50%);
transition: transform 0.3s ease;
z-index: 10;
}

.chevron-icon {
font-size: 14px !important;
transition: transform 0.3s ease;
color: #666 !important;
display: inline-block;
opacity: 1;
visibility: visible;
}

.rotate-90 {
transform: rotate(90deg);
}

/* Ensure proper arrow rotation */
.nav-item.has-sub .chevron-icon {
transform: rotate(0deg);
transition: transform 0.3s ease;
}

.nav-item.has-sub.open .chevron-icon {
transform: rotate(90deg);
}

/* Add hover effect to show it's clickable */
.nav-item.has-sub > a:hover {
background-color: rgba(115, 103, 240, 0.08);
cursor: pointer;
}

/* Style for open dropdown */
.nav-item.has-sub.open > a {
background-color: rgba(115, 103, 240, 0.12);
}

/* Ensure dropdown arrows are visible and properly positioned */
.nav-item.has-sub > a {
position: relative;
display: flex;
align-items: center;
justify-content: space-between;
padding-right: 40px;
}

.nav-item.has-sub > a .menu-title {
flex: 1;
}

/* Make sure chevron is always visible */
.nav-item.has-sub .chevron-icon {
opacity: 1 !important;
visibility: visible !important;
color: #666 !important;
font-size: 14px !important;
}

/* Enhanced dropdown arrow styling */
.nav-item.has-sub .dropdown-arrow {
right: 20px;
top: 50%;
transform: translateY(-50%);
}

.nav-item.has-sub .dropdown-arrow .chevron-icon {
color: #999 !important;
font-weight: bold;
transition: all 0.3s ease;
transform-origin: center;
}

.nav-item.has-sub:hover .dropdown-arrow .chevron-icon {
color: #333 !important;
}

/* Enhanced rotation animation */
.nav-item.has-sub .chevron-icon {
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item.has-sub.open .chevron-icon {
transform: rotate(90deg);
color: #333 !important;
}

/* Add a subtle background to indicate clickable dropdown */
.nav-item.has-sub > a {
border-radius: 4px;
margin: 2px 0;
}

.nav-item.has-sub > a:hover {
background-color: rgba(115, 103, 240, 0.08);
border-radius: 4px;
}

/* Make dropdown arrow more prominent */
.nav-item.has-sub .dropdown-arrow::after {
content: '';
position: absolute;
right: -5px;
top: 50%;
transform: translateY(-50%);
width: 0;
height: 0;
border-left: 4px solid transparent;
border-right: 4px solid transparent;
border-top: 4px solid #999;
margin-left: 5px;
}
      
      `}
    </style>

    <style>
      {

        `
          
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
  transform: scale(1, 0);
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
  margin: 0;
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

@keyframes slideIn {
  from {
        transform: translateX(-100%);
        opacity: 0;
       }
   to {
       transform: translateX(0);
       opacity: 1;
      }
  }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        .slide-in {
          animation: slideIn 0.3s ease-out;
        }

@media (max-width: 1199px) {
  .main-menu {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 999;
    background-color: white;
    width: 250px;
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
  </div>
   )
    
}

export default TrainerLayout
