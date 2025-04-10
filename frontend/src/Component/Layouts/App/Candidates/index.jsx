import React, { useState, useEffect, useRef } from 'react'
import { Link, Outlet , useLocation } from "react-router-dom";
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

  
  const [expanded, setExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [openSubmenu, setOpenSubmenu] = useState({
    profile: false,
    courses: false,
    jobs: false,
    wallet: false
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
    }}


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
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
  };
   
  const [submenuHeights, setSubmenuHeights] = useState({
    profile: '0px',
    courses: '0px',
    jobs: '0px',
    wallet: '0px'
  });
  
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
                <ul className={`menu-content ${openSubmenu.profile ? 'open' : ''}`}>

                  <li className={`nav-item ${location.pathname === '/candidate/myProfile' ? 'active' : ''}`}>
                    <Link to="/candidate/myProfile" onClick={() => {handleSidebarClose();}}>
                      <FontAwesomeIcon icon={faUser} />
                      <span className="menu-title">Your Profile</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/document' ? 'active' : ''}`}>
                    <Link to="/candidate/document" onClick={() =>{  handleSidebarClose();}}>
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
                <ul className={`menu-content ${openSubmenu.courses ? 'open' : ''}`}>
                  <li className={`nav-item ${location.pathname === '/candidate/searchcourses' ? 'active' : ''}`}>
                    <Link to="/candidate/searchcourses" onClick={() => {handleSidebarClose();}}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span className="menu-title">Search Courses</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/candidate/appliedCourses' ? 'active' : ''}`}>
                    <Link to="/candidate/appliedCourses" onClick={() =>{handleSidebarClose();}}>
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
                <ul className={`menu-content ${openSubmenu.jobs ? 'open' : ''}`}>
                  <li className={`nav-item ${activeItem === 'searchjob' ? 'active' : ''}`}>
                    <Link to="/candidate/searchjob" onClick={() => {handleItemClick('searchjob'); handleSidebarClose();}}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span className="menu-title">Search Job</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'nearbyJobs' ? 'active' : ''}`}>
                    <Link to="/candidate/nearbyJobs" onClick={() => {handleItemClick('nearbyJobs');handleSidebarClose();}}>
                      <FontAwesomeIcon icon={farMap} />
                      <span className="menu-title">Jobs Near Me</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'appliedJobs' ? 'active' : ''}`}>
                    <Link to="/candidate/appliedJobs" onClick={() => {handleItemClick('appliedJobs');handleSidebarClose();}}>
                      <FontAwesomeIcon icon={farPaperPlane} />
                      <span className="menu-title">Applied Jobs</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'registerInterviewsList' ? 'active' : ''}`}>
                    <Link to="/candidate/registerInterviewsList" onClick={() => {handleItemClick('registerInterviewsList');handleSidebarClose();}}>
                      <FontAwesomeIcon icon={farHand} />
                      <span className="menu-title">Register For Interview</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'InterestedCompanies' ? 'active' : ''}`}>
                    <Link to="/candidate/InterestedCompanies" onClick={() => {handleItemClick('InterestedCompanies');handleSidebarClose();}}>
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
                <ul className={`menu-content ${openSubmenu.wallet ? 'open' : ''}`}>
                  <li className={`nav-item ${activeItem === 'cashback' ? 'active' : ''}`}>
                    <Link to="/candidate/cashback" onClick={() => {handleItemClick('cashback');handleSidebarClose();}}>
                      <FontAwesomeIcon icon={faIndianRupeeSign} />;
                      <span className="menu-title">Cashback Offers</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'myEarnings' ? 'active' : ''}`}>
                    <Link to="/candidate/myEarnings" onClick={() => {handleItemClick('myEarnings');handleSidebarClose();}}>
                      <FontAwesomeIcon icon={farMoneyBill1} />
                      <span className="menu-title">My Earnings</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'referral' ? 'active' : ''}`}>
                    <Link to="/candidate/referral" onClick={() => {handleItemClick('referral');handleSidebarClose();}}>
                      <FontAwesomeIcon icon={faForward} />
                      <span className="menu-title">Refer & Earn</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${activeItem === 'Coins' ? 'active' : ''}`}>
                    <Link to="/candidate/Coins" onClick={() => {handleItemClick('Coins');handleSidebarClose();}}>
                      <FontAwesomeIcon icon={faCoins} />
                      <span className="menu-title">Coins</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Request Loan */}
              <li className={`nav-item ${activeItem === 'requestLoan' ? 'active' : ''}`}>
                <Link to="/candidate/requestLoan" onClick={() => {handleItemClick('requestLoan');handleSidebarClose();}}>
                  <FontAwesomeIcon icon={farCircle} />
                  <span className="menu-title">Request Loan</span>
                </Link>
              </li>

              {/* Watch Videos */}
              <li className={`nav-item ${activeItem === 'watchVideos' ? 'active' : ''}`}>
                <Link to="/candidate/watchVideos" onClick={() => {handleItemClick('watchVideos');handleSidebarClose();}}>
                  <FontAwesomeIcon icon={farCirclePlay} />
                  <span className="menu-title">Watch Videos</span>
                </Link>
              </li>

              {/* Share Profile */}
              <li className={`nav-item ${activeItem === 'shareCV' ? 'active' : ''}`}>
                <Link to="/candidate/shareCV" onClick={() => {handleItemClick('shareCV');handleSidebarClose();}}>
                  <FontAwesomeIcon icon={farShareFromSquare} />
                  <span className="menu-title">Share Profile</span>
                </Link>
              </li>

              {/* Notifications */}
              <li className={`nav-item ${activeItem === 'notifications' ? 'active' : ''}`}>
                <Link to="/candidate/notifications" onClick={() => {handleItemClick('notifications');handleSidebarClose();}}>
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
              <CandidateHeader toggleSidebar={handleSidebarToggle} isSideBarOpen={isSidebarOpen}/>
              <div className="content-wrapper">
                <div className="content-body mb-4">
                <Outlet />
                </div>
            <CandidateFooter />
              </div>
            </div>
          </div>
      </main>
      <style>
        {`
  .menu-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.5s ease-in-out;
  }

  .menu-content.open {
    max-height: 500px;
  }
`}
      </style>

    </div>
  )
}

export default CandidateLayout
