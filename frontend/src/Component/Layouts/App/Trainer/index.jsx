import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import TrainerHeader from './TrainerHeader/TrainerHeader'
import TrainerFooter from './TrainerFooter/TrainerFooter'


function TrainerLayout({ children }){
    const userData = JSON.parse(sessionStorage.getItem('user'))
    const isUser = JSON.parse(sessionStorage.getItem('user'))?.role === 4 ? true : false
    const location = useLocation();
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const token = userData?.token;


    const [expanded, setExpanded] = useState(true);
    const [activeItem, setActiveItem] = useState('dashboard');
    const [openSubmenu, setOpenSubmenu] = useState({
      profile: false,
      students: false,
      jobs: false,
      courses: false,
      settings: false,
      education: false,
      sales: false,
      salesb2b: false,
      dropdown: false,
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
          // console.log(`Toggling ${menu}:`, newState[menu]); 
          return newState;
        });
    };
    const menuRefs = {
        profile: useRef(null),
        students: useRef(null),
        jobs: useRef(null),
        courses: useRef(null),
        settings: useRef(null),
        education: useRef(null),
        sales: useRef(null),
        salesb2b: useRef(null),
        dropdown: useRef(null),
        events: useRef(null)
    };
    const [submenuMaxHeight, setSubmenuMaxHeight] = useState({
        profile: '0px',
        students: '0px',
        jobs: '0px',
        courses: '0px',
        settings: '0px',
        education: '0px',
        sales: '0px',
        salesb2b: '0px',
        dropdown: '0px',
        events: '0px'
    });






   return(
    <div className="min-h-screen flex flex-col">
    <main className="flex flex-1">
      <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
        <div className={`navbar-header ${expanded ? 'expanded' : ''}`}>
          <ul className="nav navbar-nav flex-row">
            <li className="nav-item mr-auto">
              <Link to="/institute/myprofile" className="navbar-brand">
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

           

            {/* Courses */}
            <li className={`nav-item has-sub ${openSubmenu.courses ? 'open' : ''}`}>
              <a href="#" onClick={() => toggleSubmenu('courses')}>
                {/* <FontAwesomeIcon icon={faBookOpen} /> */}
                <span className="menu-title">Courses</span>
                <span className="dropdown-arrow">
                  {/* <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`chevron-icon ${openSubmenu.courses ? 'rotate-90' : ''}`}
                  /> */}
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
                <li className={`nav-item ${location.pathname === '' ? 'active' : ''}`}>
                  <Link to="" onClick={() => handleSidebarClose()}>
                    {/* <FontAwesomeIcon
                      icon={faPlusCircle}
                      style={{
                        color: location.pathname === '/institute/addcourse' ? 'white' : 'black'
                      }}
                    /> */}
                    <span className="menu-title">Add Courses</span>
                  </Link>
                </li>
                <li className={`nav-item ${location.pathname === '' ? 'active' : ''}`}>
                  <Link to="" onClick={() => handleSidebarClose()}>
                    {/* <FontAwesomeIcon icon={faEye} /> */}
                    <span className="menu-title">View Courses</span>
                  </Link>
                </li>
              </ul>
            </li>

            {/* Sales (B2C) */}

            <li className={`nav-item has-sub ${openSubmenu.sales ? 'open' : ''}`}>
              <a href="#" onClick={() => toggleSubmenu('sales')}>
                {/* <FontAwesomeIcon icon={faShoppingCart} /> */}
                <span className="menu-title">Sales (B2C)</span>
                <span className="dropdown-arrow">
                  {/* <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`chevron-icon ${openSubmenu.sales ? 'rotate-90' : ''}`}
                  /> */}
                </span>
              </a>
              <ul
                ref={menuRefs.sales}
                className="menu-content"
                style={{
                  maxHeight: submenuMaxHeight.sales,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out'
                }}
              >
                <li className={`nav-item ${location.pathname === '' ? 'active' : ''}`}>
                  <Link to="" onClick={() => handleSidebarClose()}>
                    {/* <FontAwesomeIcon icon={faChartLine} /> */}
                    <span className="menu-title">Dashboard</span>
                  </Link>
                </li>
                <li className={`nav-item ${location.pathname === '' ? 'active' : ''}`}>
                  <Link to="" onClick={() => handleSidebarClose()}>
                    {/* <FontAwesomeIcon icon={faUserFriends} /> */}
                    <span className="menu-title">Admission Cycle Pre</span>
                  </Link>
                </li>
                <li className={`nav-item ${location.pathname === '' ? 'active' : ''}`}>
                  <Link to="" onClick={() => handleSidebarClose()}>
                    {/* <FontAwesomeIcon icon={faUserCheck} /> */}
                    <span className="menu-title">Admission Cycle Post</span>
                  </Link>
                </li>
                <li className={`nav-item ${location.pathname === '' ? 'active' : ''}`}>
                  <Link to="" onClick={() => handleSidebarClose()}>
                    {/* <FontAwesomeIcon icon={faCalendarAlt} /> */}
                    <span className="menu-title">Candidate Visit Calender</span>
                  </Link>
                </li>
                <li className={`nav-item ${location.pathname === '' ? 'active' : ''}`}>
                  <Link to="" onClick={() => handleSidebarClose()}>
                    {/* <FontAwesomeIcon icon={faBell} /> */}
                    <span className="menu-title">Follow up</span>
                  </Link>
                </li>
              
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
transition: transform 0.3s ease;
}

.chevron-icon {
font-size: 12px!important;
transition: transform 0.3s ease;
}

.rotate-90 {
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