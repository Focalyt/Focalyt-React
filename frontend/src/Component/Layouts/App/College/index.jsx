import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import CollegeHeader from './CollegeHeader/CollegeHeader';
import CollegeFooter from './CollegeFooter/CollegeFooter';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

import {
  faChartLine, faUser, faSearch, faClipboardList, faChevronRight, faPlusCircle, faForward, faCoins, faGraduationCap, faBuilding, faBookOpen, faTasks
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

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   const collegeData = localStorage.getItem('collegeName');
  //   if (token && collegeData) {
  //     setUser({ token, collegeName: collegeData });
  //   } else {
  //     navigate('/institute/login');
  //   }
  // }, []);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    } else {
      navigate('/institute/login');
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
    courses: false,
    settings: false,
    education: false,
    sales: false
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

  // const toggleSidebar = () => {
  //   setExpanded(!expanded);
  // };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1199;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Desktop: open, Mobile: close by default
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobile &&
        !e.target.closest('.main-menu') &&
        !e.target.closest('.menu-toggle')
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile]);

  const menuRefs = {
    profile: useRef(null),
    students: useRef(null),
    jobs: useRef(null),
    courses: useRef(null),
    settings: useRef(null),
    education: useRef(null),
    sales :useRef(null)
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  const [submenuMaxHeight, setSubmenuMaxHeight] = useState({
    profile: '0px',
    students: '0px',
    jobs: '0px',
    courses: '0px',
    settings: '0px',
    education: '0px',
    sales: '0px'
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
              {/* Dashboard */}
              <li className={`nav-item ${location.pathname === '/institute/dashboard' ? 'active' : ''}`}>
                <Link to="/institute/dashboard" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faChartLine} />
                  <span className="menu-title">Dashboard</span>
                </Link>
              </li>

              {/* Your Profile */}
              <li className={`nav-item ${location.pathname === '/institute/myProfile' ? 'active' : ''}`}>
                <Link to="/institute/myProfile" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faUser} />
                  <span className="menu-title">Your Profile</span>
                </Link>
              </li>


              {/* Courses */}
              <li className={`nav-item has-sub ${openSubmenu.courses ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('courses')}>
                  <FontAwesomeIcon icon={faBookOpen} />
                  {/* <i class="fas fa-list"></i> */}
                  <span className="menu-title">Courses</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faChevronRight}
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
                  <li className={`nav-item ${location.pathname === '/institute/addcourse' ? 'active' : ''}`}>
                    <Link to="/institute/addcourse" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon
                        icon={faPlusCircle}
                        style={{
                          color: location.pathname === '/institute/addcourse' ? 'white' : 'black'
                        }}
                      />
                      <span className="menu-title">Add Courses</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/viewcourse' ? 'active' : ''}`}>
                    <Link to="/institute/viewcourse" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={farMoneyBill1} />
                      <span className="menu-title">View Courses</span>
                    </Link>
                  </li>

                </ul>
              </li>

              <li className={`nav-item has-sub ${openSubmenu.sales ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('sales')}>
                  <FontAwesomeIcon icon={faBookOpen} />
                  {/* <i class="fas fa-list"></i> */}
                  <span className="menu-title">Sales</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className={`chevron-icon ${openSubmenu.sales ? 'rotate-90' : ''}`}
                    />
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
                  <li className={`nav-item ${location.pathname === '/institute/registration' ? 'active' : ''}`}>
                <Link to="/institute/registration" onClick={() => handleSidebarClose()}>
                  {/* <FontAwesomeIcon icon={faForward} /> */}
                  <i class="fas fa-user-friends m-0" style={{
                    color: location.pathname === '/institute/registration' ? 'white' : 'black'
                  }}></i>
                  <span className="menu-title">Admission Cycle Pre</span>
                </Link>
              </li>
              <li className={`nav-item ${location.pathname === '/institute/admissionpost' ? 'active' : ''}`}>
                <Link to="/institute/admissionpost" onClick={() => handleSidebarClose()}>
                  {/* <FontAwesomeIcon icon={faForward} /> */}
                  <i class="fas fa-user-friends m-0" style={{
                    color: location.pathname === '/institute/admissionpost' ? 'white' : 'black'
                  }}></i>
                  <span className="menu-title">Admission Cycle Post</span>
                </Link>
              </li>

                </ul>
              </li>  
              <li className={`nav-item ${location.pathname === '/institute/projectmanagment' ? 'active' : ''}`}>
                <Link to="/institute/projectmanagment" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faTasks} />
                  <span className="menu-title">Training management</span>
                </Link>
              </li>

              <li className={`nav-item ${location.pathname === '/institute/myfollowup' ? 'active' : ''}`}>
                <Link to="/institute/myfollowup" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faChartLine} />
                  <span className="menu-title">Follow up</span>
                </Link>
              </li>

              {/* Upload Candidates */}
              <li className={`nav-item ${location.pathname === '/institute/uploadCandidates' ? 'active' : ''}`}>
                <Link to="/institute/uploadCandidates" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span className="menu-title">Upload Candidates</span>
                </Link>
              </li>

              {/* Upload Templates */}
              <li className={`nav-item ${location.pathname === '/institute/uploadTemplates' ? 'active' : ''}`}>
                <Link to="/institute/uploadTemplates" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={farFile} />
                  <span className="menu-title">Upload Templates</span>
                </Link>
              </li>

              {/* My Students */}
              <li className={`nav-item ${location.pathname === '/institute/myStudents' ? 'active' : ''}`}>
                <Link to="/institute/myStudents" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faGraduationCap} />
                  <span className="menu-title">My Students</span>
                </Link>
              </li>

              {/* Available Jobs */}
              <li className={`nav-item ${location.pathname === '/institute/availablejobs' ? 'active' : ''}`}>
                <Link to="/institute/availablejobs" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faBuilding} />
                  <span className="menu-title">Available Jobs</span>
                </Link>
              </li>

              {/* Events */}
              <li className={`nav-item has-sub ${openSubmenu.events ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('events')}>
                  <FontAwesomeIcon icon={farCirclePlay} />
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
                  <li className={`nav-item ${location.pathname === '/institute/viewEvent' ? 'active' : ''}`}>
                    <Link to="/institute/viewEvent" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={farPaperPlane} />
                      <span className="menu-title">View Events</span>
                    </Link>
                  </li>
                </ul>
              </li>
              <li className={`nav-item ${location.pathname === '/institute/approvalManagement' ? 'active' : ''}`}>
                <Link to="/institute/approvalManagement" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faTasks} />
                  <span className="menu-title">Approval Request </span>
                </Link>
              </li>

              {/* Settings */}
              <li className={`nav-item has-sub ${openSubmenu.settings ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('settings')}>
                  <FontAwesomeIcon icon={faSearch} />
                  <span className="menu-title">Settings</span>
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
                  <li className={`nav-item ${location.pathname === '/institute/accessManagement' ? 'active' : ''}`}>
                    <Link to="/institute/accessManagement" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faUser} />
                      <span className="menu-title">Access Management</span>
                    </Link>
                  </li>
                  {/* <li className={`nav-item ${location.pathname === '/institute/assignmentRule' ? 'active' : ''}`}>
                    <Link to="/institute/assignmentRule" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={farBookmark} />
                      <span className="menu-title">Assignment Rule</span>
                    </Link>
                  </li> */}

                  <li className={`nav-item ${location.pathname === '/institute/statusdesign' ? 'active' : ''}`}>
                    <Link to="/institute/statusdesign" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={farBookmark} />
                      <span className="menu-title">Status Design</span>
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
            <CollegeHeader toggleSidebar={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
            <div className="content-wrapper">
              <div className="mb-4" >
                <Outlet />
              </div>
              <CollegeFooter />
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
    </div>
  )
}

export default CollegeLayout