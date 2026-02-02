import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom";
import CollegeHeader from './CollegeHeader/CollegeHeader';
import CollegeFooter from './CollegeFooter/CollegeFooter';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useWhatsAppContext } from '../../../../contexts/WhatsAppContext';
import {
  faUser, faBookOpen, faPlusCircle, faEye, faShoppingCart, faChartLine, faUserFriends, faUserCheck, faBell,
  faHandshake, faTasks, faClipboardList, faFileUpload, faGraduationCap, faBuilding, faCalendarAlt, faCheckCircle,
  faCogs, faUserShield, faSitemap, faProjectDiagram, faFileAlt, faWallet, faCaretDown, faIndustry, faTags, faGlobe, faBullhorn, faUserTie
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import {
  faUser as farUser, faFile as farFile,
  faPaperPlane as farPaperPlane, faMap as farMap, faHand as farHand, faBookmark as farBookmark,
  faCircle as farCircle, faCirclePlay as farCirclePlay, faShareFromSquare as farShareFromSquare, faBell as farBell, faMoneyBill1 as farMoneyBill1,
} from "@fortawesome/free-regular-svg-icons";

function CollegeLayout({ children }) {
  const navigate = useNavigate();
  const userData = JSON.parse(sessionStorage.getItem('user'))
  const isUser = JSON.parse(sessionStorage.getItem('user'))?.role === 2 ? true : false
  // const permissions = userData?.permissions
  const [permissions, setPermissions] = useState();
  const [user, setUser] = useState();
  const [collegeLogo, setCollegeLogo] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const location = useLocation();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const token = userData.token;
  const whatsAppContext = useWhatsAppContext();
  
  useEffect(() => {
    updatedPermission();
    fetchCollegeLogo();
    fetchUnreadCount();
  }, []);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/whatsappUnreadCount`, {
        headers: { 'x-auth': token }
      });
      if (response.data.success) {
        setTotalUnreadCount(response.data.totalUnreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setTotalUnreadCount(0);
    }
  };

  // Listen to incoming WhatsApp messages and update count
  useEffect(() => {
    if (!whatsAppContext) return;

    const unsubscribe = whatsAppContext.onMessage((message) => {
      // Only count incoming messages
      if (message && message.direction === 'incoming') {
        setTotalUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [whatsAppContext]);

  // Refresh count when navigating to WhatsApp chat page (messages might be read)
  useEffect(() => {
    if (location.pathname === '/institute/whatsappchat') {
      // Small delay to allow messages to be marked as read
      const timer = setTimeout(() => {
        fetchUnreadCount();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Listen for messages read event from WhatsApp chat page
  useEffect(() => {
    const handleMessagesRead = () => {
      // Refresh unread count when messages are marked as read
      setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    };

    window.addEventListener('whatsappMessagesRead', handleMessagesRead);
    return () => {
      window.removeEventListener('whatsappMessagesRead', handleMessagesRead);
    };
  }, []);

  // Listen for logo updates from profile page
  useEffect(() => {
    const handleStorageChange = () => {
      fetchCollegeLogo();
    };
    
    // Listen for custom event when logo is updated
    window.addEventListener('collegeLogoUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('collegeLogoUpdated', handleStorageChange);
    };
  }, []);

  const fetchCollegeLogo = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/profile`, {
        headers: { 'x-auth': token }
      });
      if (response.data && response.data.college && response.data.college.logo) {
        const logo = response.data.college.logo;
        // Only set logo if it's not empty
        if (logo && logo.trim() !== '') {
          setCollegeLogo(logo);
        } else {
          setCollegeLogo(null);
        }
      } else {
        setCollegeLogo(null);
      }
    } catch (error) {
      console.error('Error fetching college logo:', error);
      // Keep default logo on error
      setCollegeLogo(null);
    }
  };

  const updatedPermission = async () => {

    const respose = await axios.get(`${backendUrl}/college/permission`, {
      headers: { 'x-auth': token }
    });
    if (respose.data.status) {

      setPermissions(respose.data.permissions);
    }
  }

  useEffect(() => {
    console.log('userData', userData)
    console.log("permissions", permissions)
  }, [permissions])

  useEffect(() => {
    const userFromStorage = sessionStorage.getItem('user');
    if (!userFromStorage) {
      navigate('/institute/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(userFromStorage);
      if (!parsedUser || parsedUser.role !== 2) {
        navigate('/institute/login');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/institute/login');
      return;
    }
  }, []);



  useEffect(() => {
    if (isUser) {
      setUser(userData);
    } else {
      navigate('/institute/login');
    }
  }, [isUser]);

  const [openDropdown, setOpenDropdown] = useState(null);
  const profileMenuRef = useRef(null);

  const toggleDropdown = (menu) => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(prev => {
      const newState = { ...prev, [menu]: !prev[menu] };
      // console.log(`Toggling ${menu}:`, newState[menu]); 
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
    sales: false,
    salesb2b: false,
    dropdown: false,
    events: false,
    placements: false,
    trainerManagement: false
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
    sales: useRef(null),
    salesb2b: useRef(null),
    dropdown: useRef(null),
    events: useRef(null),
    placements: useRef(null),
    trainerManagement: useRef(null)
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
    sales: '0px',
    salesb2b: '0px',
    dropdown: '0px',
    events: '0px',
    placements: '0px',
    trainerManagement: '0px'
  });

  useLayoutEffect(() => {
    const newHeights = {};
    Object.keys(menuRefs).forEach((key) => {
      const ref = menuRefs[key];
      if (ref.current) {
        if (openSubmenu[key]) {
          // Opening: get scrollHeight without breaking transition
          const scrollHeight = ref.current.scrollHeight;
          // console.log(`${key} opening - height:`, scrollHeight); 
          newHeights[key] = `${scrollHeight}px`;
        } else {
          // Closing: set current height first, then animate to 0
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

  // Special effect for nested submenus (like dropdown inside settings)
  useEffect(() => {
    // When dropdown opens/closes, recalculate both dropdown and settings heights
    if (openSubmenu.dropdown !== undefined) {
      const dropdownRef = menuRefs.dropdown;
      const settingsRef = menuRefs.settings;

      if (dropdownRef.current) {
        // Force immediate height calculation for dropdown
        const dropdownHeight = dropdownRef.current.scrollHeight;
        console.log('Dropdown height:', dropdownHeight, 'Open state:', openSubmenu.dropdown); // Debug log
        console.log('Current submenuMaxHeight.dropdown:', submenuMaxHeight.dropdown); // Debug log

        setSubmenuMaxHeight(prev => ({
          ...prev,
          dropdown: openSubmenu.dropdown ? `${Math.max(dropdownHeight, 80)}px` : '0px'
        }));
      }

      if (settingsRef.current && openSubmenu.settings) {
        setTimeout(() => {
          const settingsHeight = settingsRef.current.scrollHeight;
          console.log('Settings height:', settingsHeight); // Debug log
          setSubmenuMaxHeight(prev => ({
            ...prev,
            settings: `${settingsHeight}px`
          }));
        }, 100);
      }
    }
  }, [openSubmenu.dropdown]);

  // Additional effect to handle nested submenu height updates
  useEffect(() => {
    // Force recalculation of parent menu heights when nested menus change
    const updateParentHeights = () => {
      const newHeights = {};
      Object.keys(menuRefs).forEach((key) => {
        const ref = menuRefs[key];
        if (ref.current && openSubmenu[key]) {
          // Get accurate scrollHeight while maintaining transition
          const scrollHeight = ref.current.scrollHeight;
          newHeights[key] = `${scrollHeight}px`;
        }
      });

      if (Object.keys(newHeights).length > 0) {
        setSubmenuMaxHeight(prev => ({
          ...prev,
          ...newHeights,
        }));
      }
    };

    // Use a delay to ensure DOM updates are complete
    const timeoutId = setTimeout(updateParentHeights, 100);
    return () => clearTimeout(timeoutId);
  }, [openSubmenu]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-1">
        <div className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
          <div className={`navbar-header ${expanded ? 'expanded' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '15px', position: 'relative' }}>
            <ul className="nav navbar-nav flex-row" style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <li className="nav-item" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Link to="/institute/myprofile" className="navbar-brand" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  {collegeLogo && collegeLogo.trim() !== '' ? (
                    <img 
                      className="img-fluid logocs" 
                      src={`${bucketUrl}/${collegeLogo}?t=${Date.now()}`} 
                      alt="College Logo"
                      style={{ maxWidth: '180px', width: 'auto', height: 'auto', display: 'block' }}
                      onError={(e) => {
                        e.target.src = "/Assets/images/logo/logo.png";
                        setCollegeLogo(null);
                      }}
                    />
                  ) : (
                    <img className="img-fluid logocs" src="/Assets/images/logo/logo.png" alt="Focalyt Logo" style={{ maxWidth: '180px', width: 'auto', height: 'auto', display: 'block' }} />
                  )}
                </Link>
              </li>
              <li className="nav-item nav-toggle" style={{ position: 'absolute', right: '15px', top: '15px' }}>
                <a className="nav-link modern-nav-toggle pr-0" onClick={toggleSidebar}>
                  <i className={`icon-x d-block d-xl-none font-medium-4 primary toggle-icon feather ${expanded ? 'icon-disc' : 'icon-circle'}`}></i>
                  <i className={`toggle-icon icon-disc font-medium-4 d-none d-xl-block collapse-toggle-icon primary feather`}></i>
                </a>
              </li>
            </ul>
            {/* Account Number - Mobile View Only */}
            {userData?.collegeId && (
              <div className="d-md-none w-100 mt-3" style={{ padding: '0 10px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  background: 'rgba(252, 43, 90, 0.08)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(252, 43, 90, 0.15)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: '#fc2b5a',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    Account No:
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    color: '#fc2b5a',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                    background: 'rgba(252, 43, 90, 0.12)',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    letterSpacing: '0.2px',
                    textAlign: 'left',
                    minWidth: 0
                  }}>
                    {userData.collegeId}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(userData.collegeId);
                        if (window.toast) {
                          window.toast.success('Account number copied to clipboard!', {
                            position: "top-right",
                            autoClose: 2000,
                          });
                        } else {
                          alert('Account number copied!');
                        }
                      } catch (error) {
                        console.error('Failed to copy:', error);
                      }
                    }}
                    style={{
                      background: 'rgba(252, 43, 90, 0.15)',
                      border: '1px solid rgba(252, 43, 90, 0.25)',
                      color: '#fc2b5a',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px',
                      height: '32px',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(252, 43, 90, 0.25)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(252, 43, 90, 0.15)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Copy Account Number"
                  >
                    <i className="fas fa-copy" style={{ fontSize: '12px' }}></i>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="shadow-bottom"></div>
          <div className="main-menu-content border border-left-0 border-right-0 border-bottom-0" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)' }}>
            <ul className="navigation navigation-main" id="main-menu-navigation" style={{ flex: 1, overflowY: 'auto' }}>

              {/* Your Profile */}
              <li className={`nav-item ${location.pathname === '/institute/myProfile' ? 'active' : ''}`}>
                <Link to="/institute/myProfile" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faUser} />
                  <span className="menu-title">Your Profile</span>
                </Link>
              </li>

              {/* Courses */}
              <li className={`nav-item has-sub dropdown-courses ${openSubmenu.courses ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('courses')}>
                  <FontAwesomeIcon icon={faBookOpen} />
                  <span className="menu-title">Courses</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faCaretDown}
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
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                    opacity: submenuMaxHeight.courses === '0px' ? 0 : 1
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
                      <FontAwesomeIcon icon={faEye} />
                      <span className="menu-title">View Courses</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Sales (B2C) */}
              {((permissions?.custom_permissions?.can_view_leads && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin' || permissions?.permission_type === 'view_only') && (

                <li className={`nav-item has-sub dropdown-sales ${openSubmenu.sales ? 'open' : ''}`}>
                  <a href="#" onClick={() => toggleSubmenu('sales')}>
                    <FontAwesomeIcon icon={faShoppingCart} />
                    <span className="menu-title">Sales (B2C)</span>
                    <span className="dropdown-arrow">
                      <FontAwesomeIcon
                        icon={faCaretDown}
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
                      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                      opacity: submenuMaxHeight.sales === '0px' ? 0 : 1
                    }}
                  >
                    <li className={`nav-item ${location.pathname === '/institute/dashboard' ? 'active' : ''}`}>
                      <Link to="/institute/dashboard" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faChartLine} />
                        <span className="menu-title">Dashboard</span>
                      </Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/registration' ? 'active' : ''}`}>
                      <Link to="/institute/registration" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faUserFriends} />
                        <span className="menu-title">Admission Cycle Pre</span>
                      </Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/admissionpost' ? 'active' : ''}`}>
                      <Link to="/institute/admissionpost" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faUserCheck} />
                        <span className="menu-title">Admission Cycle Post</span>
                      </Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/whatsappchat' ? 'active' : ''}`}>
                      <Link to="/institute/whatsappchat" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faWhatsapp} />
                        <span className="menu-title">Whatsapp Chat</span>
                        {totalUnreadCount > 0 && (
                          <span className="badge bg-danger rounded-pill ms-2" style={{ fontSize: '0.75rem', minWidth: '20px', padding: '2px 6px' , position: 'absolute', top: '3px', left: '43px'}}>
                            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                          </span>
                        )}
                      </Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/calenderb2c' ? 'active' : ''}`}>
                      <Link to="/institute/calenderb2c" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span className="menu-title">Candidate Visit Calender</span>
                      </Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/myfollowup' ? 'active' : ''}`}>
                      <Link to="/institute/myfollowup" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faBell} />
                        <span className="menu-title">Follow up</span>
                      </Link>
                    </li>
                    {/* <li className={`nav-item ${location.pathname === '/institute/re-enquire' ? 'active' : ''}`}>
                    <Link to="/institute/re-enquire" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faBell} />
                      <span className="menu-title">Re-enquire</span>
                    </Link>
                  </li> */}
                  </ul>
                </li>
              )}

              {/* Sales (B2B) */}
              {((permissions?.custom_permissions?.can_view_leads_b2b && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin' || permissions?.permission_type === 'view_only') && (
                <li className={`nav-item has-sub dropdown-salesb2b ${openSubmenu.salesb2b ? 'open' : ''}`}>
                  <a href="#" onClick={() => toggleSubmenu('salesb2b')}>
                    <FontAwesomeIcon icon={faHandshake} />
                    <span className="menu-title">Sales (B2B)</span>
                    <span className="dropdown-arrow">
                      <FontAwesomeIcon
                        icon={faCaretDown}
                        className={`chevron-icon ${openSubmenu.salesb2b ? 'rotate-90' : ''}`}
                      />
                    </span>
                  </a>
                  <ul
                    ref={menuRefs.salesb2b}
                    className="menu-content"
                    style={{
                      maxHeight: submenuMaxHeight.salesb2b,
                      overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                      opacity: submenuMaxHeight.salesb2b === '0px' ? 0 : 1
                    }}
                  >
                    <li className={`nav-item ${location.pathname === '/institute/dashboardb2b' ? 'active' : ''}`}>
                      <Link to="/institute/dashboardb2b" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faChartLine} />
                        <span className="menu-title">Dashboard</span>
                      </Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/sales' ? 'active' : ''}`}>
                      <a href="/institute/sales" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faTasks} />
                        <span className="menu-title">Sales (B2B)</span>
                      </a>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/myfollowupb2b' ? 'active' : ''}`}>
                      <Link to="/institute/myfollowupb2b" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faBell} />
                        <span className="menu-title">Follow up</span>
                      </Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/institute/b2bfollowup' ? 'active' : ''}`}>
                      <Link to="/institute/b2bfollowup" onClick={() => handleSidebarClose()}>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span className="menu-title">Calendar Follow-up</span>
                      </Link>
                    </li>
                  </ul>
                </li>
              )}
              <li className={`nav-item has-sub dropdown-placements ${openSubmenu.placements ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('placements')}>
                  <FontAwesomeIcon icon={faHandshake} />
                  <span className="menu-title">Placements</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faCaretDown}
                      className={`chevron-icon ${openSubmenu.placements ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.placements}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.placements,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                    opacity: submenuMaxHeight.placements === '0px' ? 0 : 1
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/institute/dashboardplacements' ? 'active' : ''}`}>
                    <Link to="/institute/dashboardplacements" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faChartLine} />
                      <span className="menu-title">Dashboard</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/placements' ? 'active' : ''}`}>
                    <a href="/institute/placements" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faTasks} />
                      <span className="menu-title">Placements</span>
                    </a>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/placementfollowup' ? 'active' : ''}`}>
                    <Link to="/institute/placementfollowup" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faBell} />
                      <span className="menu-title">Follow up</span>
                    </Link>
                  </li>
                  {/* <li className={`nav-item ${location.pathname === '/institute/b2bfollowup' ? 'active' : ''}`}>
                    <Link to="/institute/b2bfollowup" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span className="menu-title">Calendar Follow-up</span>
                    </Link>
                  </li> */}
                </ul>
              </li>
              {/* Training management */}
              <li className={`nav-item has-sub dropdown-training ${openSubmenu.trainerManagement ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('trainerManagement')}>
                  <FontAwesomeIcon icon={faHandshake} />
                  <span className="menu-title">Training</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faCaretDown}
                      className={`chevron-icon ${openSubmenu.trainerManagement ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.trainerManagement}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.trainerManagement,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                    opacity: submenuMaxHeight.trainerManagement === '0px' ? 0 : 1
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/institute/candidatemanagment' ? 'active' : ''}`}>
                <a href="/institute/candidatemanagment" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faTasks} />
                  <span className="menu-title">Training management</span>
                </a>
              </li>
              <li className={`nav-item ${location.pathname === '/institute/trainerManagement' ? 'active' : ''}`}>
                    <Link to="/institute/trainerManagement" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faUserTie} />
                      <span className="menu-title">Add Trainer</span>
                    </Link>
                  </li>
                  {/* <li className={`nav-item ${location.pathname === '/institute/b2bfollowup' ? 'active' : ''}`}>
                    <Link to="/institute/b2bfollowup" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span className="menu-title">Calendar Follow-up</span>
                    </Link>
                  </li> */}
                </ul>
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
                  <FontAwesomeIcon icon={faFileUpload} />
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
              <li className={`nav-item has-sub dropdown-events ${openSubmenu.events ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('events')}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span className="menu-title">Events</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faCaretDown}
                      className={`chevron-icon ${openSubmenu.events ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.events}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.events,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                    opacity: submenuMaxHeight.events === '0px' ? 0 : 1
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/institute/viewEvent' ? 'active' : ''}`}>
                    <Link to="/institute/viewEvent" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faEye} />
                      <span className="menu-title">View Events</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Approval Request */}
              <li className={`nav-item ${location.pathname === '/institute/approvalManagement' ? 'active' : ''}`}>
                <Link to="/institute/approvalManagement" onClick={() => handleSidebarClose()}>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span className="menu-title">Approval Request </span>
                </Link>
              </li>

              {/* Settings */}
              <li className={`nav-item has-sub dropdown-settings ${openSubmenu.settings ? 'open' : ''}`}>
                <a href="#" onClick={() => toggleSubmenu('settings')}>
                  <FontAwesomeIcon icon={faCogs} />
                  <span className="menu-title">Settings</span>
                  <span className="dropdown-arrow">
                    <FontAwesomeIcon
                      icon={faCaretDown}
                      className={`chevron-icon ${openSubmenu.settings ? 'rotate-90' : ''}`}
                    />
                  </span>
                </a>
                <ul
                  ref={menuRefs.settings}
                  className="menu-content"
                  style={{
                    maxHeight: submenuMaxHeight.settings,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                    opacity: submenuMaxHeight.settings === '0px' ? 0 : 1
                  }}
                >
                  <li className={`nav-item ${location.pathname === '/institute/accessManagement' ? 'active' : ''}`}>
                    <Link to="/institute/accessManagement" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faUserShield} />
                      <span className="menu-title">Access Management</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/statusdesign' ? 'active' : ''}`}>
                    <Link to="/institute/statusdesign" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faSitemap} />
                      <span className="menu-title">Status Design (B2B)</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/statusdesignb2c' ? 'active' : ''}`}>
                    <Link to="/institute/statusdesignb2c" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faProjectDiagram} />
                      <span className="menu-title">Status Design (B2C)</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/statusplacements' ? 'active' : ''}`}>
                    <Link to="/institute/statusplacements" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faProjectDiagram} />
                      <span className="menu-title">Status Design (Placements)</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/whatapp' ? 'active' : ''}`}>
                    <Link to="/institute/whatapp" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faWhatsapp} />
                      <span className="menu-title">Whatapp</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/whatappTemplate' ? 'active' : ''}`}>
                    <Link to="/institute/whatappTemplate" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faFileAlt} />
                      <span className="menu-title">Create Template</span>
                    </Link>
                  </li>
                  <li className={`nav-item ${location.pathname === '/institute/whatsappWallet' ? 'active' : ''}`}>
                    <Link to="/institute/whatsappWallet" onClick={() => handleSidebarClose()}>
                      <FontAwesomeIcon icon={faWallet} />
                      <span className="menu-title">Whatsapp Wallet</span>
                    </Link>
                  </li>
                 
                  <li className={`nav-item has-sub ${openSubmenu.dropdown ? 'open' : ''}`}>
                    <a href="#" onClick={() => toggleSubmenu('dropdown')}>
                      <FontAwesomeIcon icon={faCaretDown} />
                      <span className="menu-title">Dropdown</span>
                      <span className="dropdown-arrow">
                        <FontAwesomeIcon
                          icon={faCaretDown}
                          className={`chevron-icon ${openSubmenu.dropdown ? 'rotate-90' : ''}`}
                        />
                      </span>
                    </a>
                    <ul
                      ref={menuRefs.dropdown}
                      className="menu-content"
                      style={{
                        maxHeight: openSubmenu.dropdown ? '700px' : '0px',
                        overflow: 'hidden',
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                        opacity: openSubmenu.dropdown ? 1 : 0
                      }}
                    >
                      <li className={`nav-item ${location.pathname === '/institute/typeOfB2b' ? 'active' : ''}`}>
                        <Link to="/institute/typeOfB2b" onClick={() => handleSidebarClose()}>
                          <FontAwesomeIcon icon={faIndustry} />
                          <span className="menu-title">Type of B2B</span>
                        </Link>
                      </li>
                      <li className={`nav-item ${location.pathname === '/institute/typeOfCategory' ? 'active' : ''}`}>
                        <Link to="/institute/typeOfCategory" onClick={() => handleSidebarClose()}>
                          <FontAwesomeIcon icon={faTags} />
                          <span className="menu-title">Type of Category</span>
                        </Link>
                      </li>
                      <li className={`nav-item ${location.pathname === '/institute/source' ? 'active' : ''}`}>
                        <Link to="/institute/source" onClick={() => handleSidebarClose()}>
                          <FontAwesomeIcon icon={faGlobe} />
                          <span className="menu-title">Source</span>
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li className={`nav-item ${location.pathname === '/institute/dripmarketing' ? 'active' : ''}`}>
                    <Link to="/institute/dripmarketing" onClick={() => handleSidebarClose()}>
                      {/* <FontAwesomeIcon icon={} /> */}
                      {/* <FontAwesomeIcon icon={faDrip} /> */}
                      <FontAwesomeIcon icon={faBullhorn} />
                      <span className="menu-title">Drip Marketing</span>
                    </Link>
                  </li>
                </ul>
              </li>

            </ul>
            
            {collegeLogo && collegeLogo.trim() !== '' ? (
              <div className="sidebar-footer-logo" style={{
                padding: '15px 20px 25px 10px',
                textAlign: 'center',
                borderTop: '1px solid #e0e0e0',
                marginTop: 'auto',
                background: '#fff',
                flexShrink: 0
              }}>
                <img 
                  className="img-fluid" 
                  src="/Assets/images/logo/logo.png" 
                  alt="Focalyt Logo"
                  style={{ maxWidth: '100px', height: 'auto', display: 'block', margin: '0 auto' }}
                />
              </div>
            ) : null}
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
        /* Webkit Scrollbar Styling for Sidebar */
        .navigation-main::-webkit-scrollbar {
          width: 6px !important;
          -webkit-width: 6px !important;
        }

        .navigation-main::-webkit-scrollbar-track {
          background: #f1f1f1 !important;
          -webkit-background: #f1f1f1 !important;
          border-radius: 10px !important;
          -webkit-border-radius: 10px !important;
        }

        .navigation-main::-webkit-scrollbar-thumb {
          background: #888 !important;
          -webkit-background: #888 !important;
          border-radius: 10px !important;
          -webkit-border-radius: 10px !important;
        }

        .navigation-main::-webkit-scrollbar-thumb:hover {
          background: #555 !important;
          -webkit-background: #555 !important;
        }

        .main-menu-content::-webkit-scrollbar {
          width: 6px !important;
          -webkit-width: 6px !important;
        }

        .main-menu-content::-webkit-scrollbar-track {
          background: #f1f1f1 !important;
          -webkit-background: #f1f1f1 !important;
        }

        .main-menu-content::-webkit-scrollbar-thumb {
          background: #888 !important;
          -webkit-background: #888 !important;
          border-radius: 10px !important;
          -webkit-border-radius: 10px !important;
        }

        
        .menu-content {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out;
          width: 100% !important;
          -webkit-width: 100% !important;
          opacity: 1;
          will-change: max-height, opacity;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
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

.navigation li.active > a {
  background-color: #ff3366 !important;
  color: #fff !important;
  font-weight: 500;
  width: 100%;
  display: block;
}

.navigation li.active > a > span,
.navigation li.active > a > svg,
.navigation li.active > a > i {
  color: #fff !important;
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
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chevron-icon {
  font-size: 12px!important;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.rotate-90 {
  transform: rotate(90deg) translateZ(0);
  -webkit-transform: rotate(90deg) translateZ(0);
}

/* Differentiate menu items with dropdowns/submenus - Base Styles */
.nav-item.has-sub > a {
  background-color: #f8f9fa !important;
  border-left: 2px solid #fc2b5a;
  font-weight: 500;
  color: #333 !important;
  position: relative;
  width: 100%;
}

/* Regular menu items (without dropdown) */
.nav-item:not(.has-sub) > a,
.nav-item:not(.has-sub) > Link {
  background-color: transparent !important;
  border-left: 2px solid transparent;
  color: #666 !important;
  width: 100%;
  display: block;
}

/* Active state for regular menu items */
.nav-item:not(.has-sub).active > a,
.nav-item:not(.has-sub).active > Link {
  background-color: #ff3366 !important;
  color: #fff !important;
  font-weight: 500;
  width: 100%;
  display: block;
}

.nav-item:not(.has-sub).active > a > span,
.nav-item:not(.has-sub).active > a > svg,
.nav-item:not(.has-sub).active > Link > span,
.nav-item:not(.has-sub).active > Link > svg {
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
  background-color: #ff3366 !important;
  color: #fff !important;
}

/* Admissions (B2C) Dropdown - Pink Color */
.nav-item.has-sub.dropdown-sales > a {
  background-color: #fee2e2 !important;
  border-left: 2px solid #fc2b5a;
}

.nav-item.has-sub.dropdown-sales > a:hover {
  background-color: #fecaca !important;
  border-left-color: #ef4444;
}

.nav-item.has-sub.dropdown-sales.open > a {
  background-color: #fecaca !important;
  border-left-color: #ef4444;
  color: #dc2626 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-sales .menu-content {
  background-color: #fee2e2 !important;
  border-left: 2px solid #fc2b5a;
}

.nav-item.has-sub.dropdown-sales .menu-content .nav-item > a {
  background-color: #fee2e2 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-sales .menu-content .nav-item > a:hover {
  background-color: #fecaca !important;
  color: #fc2b5a !important;
}

.nav-item.has-sub.dropdown-sales .menu-content .nav-item.active > a {
  background-color: #ff3366 !important;
  color: #fff !important;
}

/* Admissions (B2B) Dropdown - Green Color */
.nav-item.has-sub.dropdown-salesb2b > a {
  background-color: #dcfce7 !important;
  border-left: 2px solid #10b981;
}

.nav-item.has-sub.dropdown-salesb2b > a:hover {
  background-color: #bbf7d0 !important;
  border-left-color: #059669;
}

.nav-item.has-sub.dropdown-salesb2b.open > a {
  background-color: #bbf7d0 !important;
  border-left-color: #059669;
  color: #047857 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-salesb2b .menu-content {
  background-color: #dcfce7 !important;
  border-left: 2px solid #10b981;
}

.nav-item.has-sub.dropdown-salesb2b .menu-content .nav-item > a {
  background-color: #dcfce7 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-salesb2b .menu-content .nav-item > a:hover {
  background-color: #bbf7d0 !important;
  color: #10b981 !important;
}

.nav-item.has-sub.dropdown-salesb2b .menu-content .nav-item.active > a {
  background-color: #ff3366 !important;
  color: #fff !important;
}

/* Placements Dropdown - Orange Color */
.nav-item.has-sub.dropdown-placements > a {
  background-color: #ffedd5 !important;
  border-left: 2px solid #f59e0b;
}

.nav-item.has-sub.dropdown-placements > a:hover {
  background-color: #fed7aa !important;
  border-left-color: #d97706;
}

.nav-item.has-sub.dropdown-placements.open > a {
  background-color: #fed7aa !important;
  border-left-color: #d97706;
  color: #b45309 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-placements .menu-content {
  background-color: #ffedd5 !important;
  border-left: 2px solid #f59e0b;
}

.nav-item.has-sub.dropdown-placements .menu-content .nav-item > a {
  background-color: #ffedd5 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-placements .menu-content .nav-item > a:hover {
  background-color: #fed7aa !important;
  color: #f59e0b !important;
}

.nav-item.has-sub.dropdown-placements .menu-content .nav-item.active > a {
  background-color: #ff3366 !important;
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
  background-color: #ff3366 !important;
  color: #fff !important;
}

/* Training Dropdown - Teal/Cyan Color */
.nav-item.has-sub.dropdown-training > a {
  background-color: #ccfbf1 !important;
  border-left: 2px solid #14b8a6;
}

.nav-item.has-sub.dropdown-training > a:hover {
  background-color: #99f6e4 !important;
  border-left-color: #0d9488;
}

.nav-item.has-sub.dropdown-training.open > a {
  background-color: #99f6e4 !important;
  border-left-color: #0d9488;
  color: #0f766e !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-training .menu-content {
  background-color: #ccfbf1 !important;
  border-left: 2px solid #14b8a6;
}

.nav-item.has-sub.dropdown-training .menu-content .nav-item > a {
  background-color: #ccfbf1 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-training .menu-content .nav-item > a:hover {
  background-color: #99f6e4 !important;
  color: #14b8a6 !important;
}

.nav-item.has-sub.dropdown-training .menu-content .nav-item.active > a {
  background-color: #ff3366 !important;
  color: #fff !important;
}

/* Settings Dropdown - Gray Color */
.nav-item.has-sub.dropdown-settings > a {
  background-color: #f3f4f6 !important;
  border-left: 2px solid #6b7280;
}

.nav-item.has-sub.dropdown-settings > a:hover {
  background-color: #e5e7eb !important;
  border-left-color: #4b5563;
}

.nav-item.has-sub.dropdown-settings.open > a {
  background-color: #e5e7eb !important;
  border-left-color: #4b5563;
  color: #374151 !important;
  font-weight: 600;
}

.nav-item.has-sub.dropdown-settings .menu-content {
  background-color: #f3f4f6 !important;
  border-left: 2px solid #6b7280;
}

.nav-item.has-sub.dropdown-settings .menu-content .nav-item > a {
  background-color: #f3f4f6 !important;
  color: #555 !important;
}

.nav-item.has-sub.dropdown-settings .menu-content .nav-item > a:hover {
  background-color: #e5e7eb !important;
  color: #6b7280 !important;
}

.nav-item.has-sub.dropdown-settings .menu-content .nav-item.active > a {
  background-color: #ff3366 !important;
  color: #fff !important;
}

/* Nested dropdown inside settings */
.nav-item.has-sub.dropdown-settings .menu-content .nav-item.has-sub > a {
  background-color: #f3f4f6 !important;
  border-left: 3px solid #6b7280;
}

.nav-item.has-sub.dropdown-settings .menu-content .nav-item.has-sub > a:hover {
  background-color: #e5e7eb !important;
  border-left-color: #4b5563;
}

.nav-item.has-sub.dropdown-settings .menu-content .nav-item.has-sub.open > a {
  background-color: #e5e7eb !important;
  border-left-color: #4b5563;
  color: #374151 !important;
}

.nav-item.has-sub.dropdown-settings .menu-content .menu-content {
  background-color: #f3f4f6 !important;
  border-left: 2px solid #6b7280;
}

.nav-item.has-sub.dropdown-settings .menu-content .menu-content .nav-item > a {
  background-color: #f3f4f6 !important;
}

.nav-item.has-sub.dropdown-settings .menu-content .menu-content .nav-item > a:hover {
  background-color: #e5e7eb !important;
  color: #6b7280 !important;
}

.nav-item.has-sub.dropdown-settings .menu-content .menu-content .nav-item.active > a {
  background-color: #ff3366 !important;
  color: #fff !important;
}

/* Common hover effect for all dropdowns */
.nav-item.has-sub > a:hover {
  cursor: pointer;
}

/* Submenu items styling - Base (will be overridden by specific dropdowns) */
.nav-item.has-sub .menu-content {
  margin-left: 10px;
}

.nav-item.has-sub .menu-content .nav-item > a {
  padding-left: 2.5rem !important;
  font-size: 0.9rem;
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
    background: #ff6b8d;
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
    .navbar-header {
        height: 135px !important;
        min-height: 135px !important;
    }
 
}


    
            `
        }
      </style>
    </div>
  )
}

export default CollegeLayout