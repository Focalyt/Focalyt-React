import React , {useState, useEffect} from 'react'
import { Link, Outlet } from "react-router-dom";
import AdminHeader from './AdminHeader/AdminHeader';
import AdminFooter from './AdminFooter/AdminFooter'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,faUser,faSearch,faClipboardList,faWallet,faIndianRupeeSign,faForward,faCoins,
} from "@fortawesome/free-solid-svg-icons";

import {
  faUser as farUser,faFile as farFile,
  faPaperPlane as farPaperPlane,faMap as farMap,faHand as farHand,faBookmark as farBookmark,
  faCircle as farCircle,faCirclePlay as farCirclePlay,faShareFromSquare as farShareFromSquare,faBell as farBell,faMoneyBill1 as farMoneyBill1,
} from "@fortawesome/free-regular-svg-icons";

function AdminLayout({ children }) {

  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (menu) => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };
  const [expanded, setExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [openSubmenu, setOpenSubmenu] = useState({
    profile: false,
    courses: false,
    jobs: false,
    wallet: false
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Resize Listener for Responsive Sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setExpanded(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenu({
      ...openSubmenu,
      [menu]: !openSubmenu[menu]
    });
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-1">
        
        <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${expanded ? 'expanded' : 'collapsed'}`}>
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
                      <li className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}>
                        <Link to="/candidate/dashboard" onClick={() => handleItemClick('dashboard')}>
                        <FontAwesomeIcon icon={faChartLine} />
                          <span className="menu-title">Dashboard</span>
                        </Link>
                      </li>
        
                   
                    <li className={`nav-item has-sub ${openSubmenu.profile ? 'open' : ''}`}>
                      <a href="#" onClick={() => toggleSubmenu('profile')}>
                      <FontAwesomeIcon icon={faUser} />
                        <span className="menu-title">Profile</span>
                      </a>
                      <ul className={`menu-content ${openSubmenu.profile ? 'show' : ''}`}>
                        <li className={`nav-item ${activeItem === 'myProfile' ? 'active' : ''}`}>
                          <Link to="/candidate/myProfile" onClick={() => handleItemClick('myProfile')}>
                          <FontAwesomeIcon icon={faUser} />
                            <span className="menu-title">Your Profile</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'document' ? 'active' : ''}`}>
                          <Link to="/candidate/document" onClick={() => handleItemClick('document')}>
                          <FontAwesomeIcon icon={farFile} />
                            <span className="menu-title">Documents</span>
                          </Link>
                        </li>
                      </ul>
                    </li>
                    <li className={`nav-item has-sub ${openSubmenu.profile ? 'open' : ''}`}>
                      <a href="#" onClick={() => toggleSubmenu('profile')}>
                      <FontAwesomeIcon icon={faUser} />
                        <span className="menu-title">Profile</span>
                      </a>
                      <ul className={`menu-content ${openSubmenu.profile ? 'show' : ''}`}>
                        <li className={`nav-item ${activeItem === 'myProfile' ? 'active' : ''}`}>
                          <Link to="/candidate/myProfile" onClick={() => handleItemClick('myProfile')}>
                          <FontAwesomeIcon icon={faUser} />
                            <span className="menu-title">Your Profile</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'document' ? 'active' : ''}`}>
                          <Link to="/candidate/document" onClick={() => handleItemClick('document')}>
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
                      <ul className={`menu-content ${openSubmenu.courses ? 'show' : ''}`}>
                        <li className={`nav-item ${activeItem === 'searchcourses' ? 'active' : ''}`}>
                          <Link to="/candidate/searchcourses" onClick={() => handleItemClick('searchcourses')}>
                          <FontAwesomeIcon icon={faSearch} />
                            <span className="menu-title">Search Courses</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'appliedCourses' ? 'active' : ''}`}>
                          <Link to="/candidate/appliedCourses" onClick={() => handleItemClick('appliedCourses')}>
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
                      <ul className={`menu-content ${openSubmenu.jobs ? 'show' : ''}`}>
                        <li className={`nav-item ${activeItem === 'searchjob' ? 'active' : ''}`}>
                          <Link to="/candidate/searchjob" onClick={() => handleItemClick('searchjob')}>
                          <FontAwesomeIcon icon={faSearch} />
                            <span className="menu-title">Search Job</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'nearbyJobs' ? 'active' : ''}`}>
                          <Link to="/candidate/nearbyJobs" onClick={() => handleItemClick('nearbyJobs')}>
                          <FontAwesomeIcon icon={farMap} />
                            <span className="menu-title">Jobs Near Me</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'appliedJobs' ? 'active' : ''}`}>
                          <Link to="/candidate/appliedJobs" onClick={() => handleItemClick('appliedJobs')}>
                          <FontAwesomeIcon icon={farPaperPlane} />
                            <span className="menu-title">Applied Jobs</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'registerInterviewsList' ? 'active' : ''}`}>
                          <Link to="/candidate/registerInterviewsList" onClick={() => handleItemClick('registerInterviewsList')}>
                          <FontAwesomeIcon icon={farHand} />
                            <span className="menu-title">Register For Interview</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'InterestedCompanies' ? 'active' : ''}`}>
                          <Link to="/candidate/InterestedCompanies" onClick={() => handleItemClick('InterestedCompanies')}>
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
                      <ul className={`menu-content ${openSubmenu.wallet ? 'show' : ''}`}>
                        <li className={`nav-item ${activeItem === 'cashback' ? 'active' : ''}`}>
                          <Link to="/candidate/cashback" onClick={() => handleItemClick('cashback')}>
                          <FontAwesomeIcon icon={faIndianRupeeSign} />
                            <span className="menu-title">Cashback Offers</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'myEarnings' ? 'active' : ''}`}>
                          <Link to="/candidate/myEarnings" onClick={() => handleItemClick('myEarnings')}>
                          <FontAwesomeIcon icon={farMoneyBill1} />
                            <span className="menu-title">My Earnings</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'referral' ? 'active' : ''}`}>
                          <Link to="/candidate/referral" onClick={() => handleItemClick('referral')}>
                          <FontAwesomeIcon icon={faForward} />
                            <span className="menu-title">Refer & Earn</span>
                          </Link>
                        </li>
                        <li className={`nav-item ${activeItem === 'Coins' ? 'active' : ''}`}>
                          <Link to="/candidate/Coins" onClick={() => handleItemClick('Coins')}>
                          <FontAwesomeIcon icon={faCoins} />
                            <span className="menu-title">Coins</span>
                          </Link>
                        </li>
                      </ul>
                    </li>
        
                    {/* Request Loan */}
                    <li className={`nav-item ${activeItem === 'requestLoan' ? 'active' : ''}`}>
                      <Link to="/candidate/requestLoan" onClick={() => handleItemClick('requestLoan')}>
                      <FontAwesomeIcon icon={farCircle} />
                        <span className="menu-title">Request Loan</span>
                      </Link>
                    </li>
        
                    {/* Watch Videos */}
                    <li className={`nav-item ${activeItem === 'watchVideos' ? 'active' : ''}`}>
                      <Link to="/candidate/watchVideos" onClick={() => handleItemClick('watchVideos')}>
                      <FontAwesomeIcon icon={farCirclePlay} />
                        <span className="menu-title">Watch Videos</span>
                      </Link>
                    </li>
        
                    {/* Share Profile */}
                    <li className={`nav-item ${activeItem === 'shareCV' ? 'active' : ''}`}>
                      <Link to="/candidate/shareCV" onClick={() => handleItemClick('shareCV')}>
                      <FontAwesomeIcon icon={farShareFromSquare} />
                        <span className="menu-title">Share Profile</span>
                      </Link>
                    </li>
        
                    {/* Notifications */}
                    <li className={`nav-item ${activeItem === 'notifications' ? 'active' : ''}`}>
                      <Link to="/candidate/notifications" onClick={() => handleItemClick('notifications')}>
                      <FontAwesomeIcon icon={farBell} />
                        <span className="menu-title">Notifications</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

        <div className="flex-1">
          
          <div className="app-content content basic-timeline">
            <AdminHeader/>
          <Outlet />
      <AdminFooter />

          </div>
        </div>
      </main>
      
    </div>
  )
}

export default AdminLayout



// import React from 'react';
// import AdminHeader from './AdminHeader'; // Import header
// import AdminFooter from './AdminFooter'; // Import footer

// const AdminLayout = ({ children }) => {
//   return (
//     <div className="min-h-screen flex flex-col">
//       <AdminHeader />
//       <main className="flex-grow p-4 bg-gray-100">
//         {children}
//       </main>
//       <AdminFooter />
//     </div>
//   );
// };

// function Index() {
//   return (
//     <AdminLayout>
//       <div>
//         <h1>Welcome to Admin Panel</h1>
//       </div>
//     </AdminLayout>
//   );
// }

// export default Index;



