import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCompass,
  faUsers,
  faCalendarAlt,
  faHeart,
  faGift,
  faCertificate,
  faComments,
  faBullhorn,
  faUser,
  faUserShield,
  faClipboardList,
  faWallet,
  faTrophy,
  faCogs,
  faChevronRight,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons';
import { useClub } from '../../../../../contexts/ClubContext';
import {
  canShowInstituteClubLink,
  isStaffClubMode,
  readClubSessionUser,
} from '../../../../../config/club/clubAuthSession';
import { canShowClubPageLink, CLUB_NAV_PERMISSION } from '../../../../../config/club/clubAssignablePermissions';
import './ClubSidebar.css';

const ClubSidebar = ({
  isSidebarOpen = true,
  expanded = true,
  toggleSidebar,
  handleSidebarClose,
}) => {
  const location = useLocation();
  const { mode, getClubPath, state } = useClub();
  const isStaff = isStaffClubMode(mode);
  const permissions = readClubSessionUser()?.permissions || {};

  const [openSubmenu, setOpenSubmenu] = useState({
    explore: true,
    community: true,
    operations: true,
    admin: true,
  });

  const toggleSubmenu = (menu) => {
    setOpenSubmenu((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isPathActive = (slug) => {
    const target = getClubPath(slug);
    return location.pathname === target || location.pathname.endsWith(`/${slug}`);
  };

  const studentItems = [
    { label: 'Discover', slug: 'discover', icon: faCompass },
    { label: 'Overview', slug: 'overview', icon: faChartLine },
    { label: 'Explore Clubs', slug: 'clubs', icon: faUsers },
    { label: 'Events (What’s On)', slug: 'whats-on', icon: faCalendarAlt },
    { label: 'My Clubs', slug: 'my-space', icon: faHeart },
    ...(state?.settings?.positionsFeatureEnabled
      ? [{ label: 'Ask for a Role', slug: 'positions', icon: faBriefcase }]
      : []),
    { label: 'Budgets', slug: 'budgets', icon: faWallet },
    { label: 'Rewards & Points', slug: 'rewards', icon: faGift },
    { label: 'Certificates', slug: 'certificates', icon: faCertificate },
    { label: 'Community Feed', slug: 'community', icon: faComments },
    { label: 'Announcements', slug: 'announcements', icon: faBullhorn },
    { label: 'My Profile', slug: 'profile', icon: faUser },
  ];

  const staffItems = [
    { label: 'Dashboard', slug: 'dashboard', icon: faChartLine },
    { label: 'Clubs', slug: 'clubs', icon: faUsers },
    { label: 'Members & Requests', slug: 'members', icon: faUserShield },
    { label: 'Positions', slug: 'positions', icon: faBriefcase },
    { label: 'Activities', slug: 'activities', icon: faCalendarAlt },
    { label: 'Registrations', slug: 'registrations', icon: faClipboardList },
    { label: 'Budgets', slug: 'budgets', icon: faWallet },
    { label: 'Results', slug: 'results', icon: faTrophy },
    { label: 'Certificates', slug: 'certificates', icon: faCertificate },
    { label: 'Rewards', slug: 'rewards', icon: faGift },
    { label: 'Community Posts', slug: 'posts', icon: faComments },
    { label: 'Announcements', slug: 'announcements', icon: faBullhorn },
    { label: 'Profile', slug: 'profile', icon: faUser },
    { label: 'Settings', slug: 'settings', icon: faCogs, customPermission: 'can_be_club_admin' },
  ].filter((item) => (
    canShowInstituteClubLink(permissions, item.customPermission)
    && canShowClubPageLink(permissions, CLUB_NAV_PERMISSION[item.slug] || item.slug)
  ));

  const menuItems = isStaff ? staffItems : studentItems;

  return (
    <div
      className={`main-menu menu-fixed menu-light menu-accordion menu-shadow ${
        isSidebarOpen ? 'expanded' : 'collapsed'
      }`}
    >
      <div className={`navbar-header ${expanded ? 'expanded' : ''}`}>
        <ul className="nav navbar-nav flex-row" style={{ width: '100%', alignItems: 'center' }}>
          <li className="nav-item mr-auto">
            <Link to={getClubPath(isStaff ? 'dashboard' : 'discover')} className="navbar-brand">
              <img className="img-fluid logocs" src="/Assets/images/logo/logo.png" alt="Logo" />
            </Link>
          </li>
          <li className="nav-item nav-toggle">
            <a
              className="nav-link modern-nav-toggle pr-0"
              href="#toggle"
              onClick={(e) => {
                e.preventDefault();
                toggleSidebar && toggleSidebar();
              }}
            >
              <i
                className={`icon-x d-block d-xl-none font-medium-4 primary toggle-icon feather ${
                  expanded ? 'icon-disc' : 'icon-circle'
                }`}
              ></i>
              <i className="toggle-icon icon-disc font-medium-4 d-none d-xl-block collapse-toggle-icon primary feather"></i>
            </a>
          </li>
        </ul>
      </div>

      <div className="shadow-bottom"></div>

      <div className="main-menu-content border border-left-0 border-right-0 border-bottom-0">
        <ul className="navigation navigation-main" id="main-menu-navigation">
          <li className={`nav-item has-sub dropdown-profile ${openSubmenu.explore ? 'open' : ''}`}>
            <a
              href="#club-menu"
              onClick={(e) => {
                e.preventDefault();
                toggleSubmenu('explore');
              }}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span className="menu-title">{isStaff ? 'Club Management' : 'Student Club'}</span>
              <span className="dropdown-arrow">
                <FontAwesomeIcon
                  icon={faChevronRight}
                  style={{ fontSize: '12px' }}
                  className={`chevron-icon ${openSubmenu.explore ? 'rotate-90' : ''}`}
                />
              </span>
            </a>

            {openSubmenu.explore && (
              <ul className="menu-content" style={{ maxHeight: '2000px', overflow: 'hidden' }}>
                {menuItems.map((item) => (
                  <li
                    key={item.slug}
                    className={`nav-item ${isPathActive(item.slug) ? 'active' : ''}`}
                  >
                    <Link
                      to={getClubPath(item.slug)}
                      onClick={() => handleSidebarClose && handleSidebarClose()}
                    >
                      <FontAwesomeIcon icon={item.icon} />
                      <span className="menu-title">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ClubSidebar;
