import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClub } from '../../../../../contexts/ClubContext';
import { STAFF_ROLES } from '../../../../../config/club/roles';
import './ClubHeader.css';

function ClubHeader({ toggleSidebar }) {
  const navigate = useNavigate();
  const { activeRole, getClubPath, mode } = useClub();
  const isStaff = STAFF_ROLES.includes(activeRole);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        const candidateName = localStorage.getItem('candidate') || localStorage.getItem('name');
        if (candidateName) {
          setUser({ name: candidateName });
        }
      }
    } catch (error) {
      console.error('Error parsing user data in ClubHeader:', error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate(
      mode === 'club_admin' || mode === 'admin'
        ? '/institute/login'
        : mode === 'company'
          ? '/cmp/login'
          : '/candidate/login'
    );
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#club-logout-block')) {
        setIsLogoutOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="header-navbar navbar-expand-lg navbar navbar-with-menu floating-nav navbar-theme navbar-shadow">
        <div className="navbar-wrapper">
          <div className="navbar-container content">
            <div className="navbar-collapse" id="navbar-mobile">
              <div className="mr-auto float-left bookmark-wrapper d-flex align-items-center">
                <ul className="nav navbar-nav">
                  <li className="nav-item mobile-menu d-xl-none mr-auto">
                    <a
                      className="nav-link nav-menu-main menu-toggle hidden-xs"
                      href="#toggle"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSidebar && toggleSidebar();
                      }}
                    >
                      <i className="fas fa-bars" style={{ fontSize: '26px', color: '#fff' }}></i>
                    </a>
                  </li>
                </ul>
                <span className="text-white fw-bold d-none d-md-inline-block ml-2" style={{ fontSize: '15px' }}>
                  {isStaff ? 'Focalyt Club Admin Portal' : 'Focalyt Club Portal'}
                </span>
              </div>

              <ul className="nav navbar-nav float-right" style={{ gap: '10px', alignItems: 'center' }}>
                <div className="bell my-auto">
                  <Link to={getClubPath('announcements')}>
                    <i className="fa-solid fa-bell" style={{ color: '#fff', fontSize: '20px' }}></i>
                  </Link>
                </div>

                <li className="dropdown dropdown-user nav-item" id="club-logout-block" style={{ position: 'relative' }}>
                  <a
                    className="dropdown-toggle nav-link dropdown-user-link"
                    href="#user-menu"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLogoutOpen(!isLogoutOpen);
                    }}
                    style={{ gap: '12px', display: 'flex', alignItems: 'center' }}
                  >
                    <div className="user-nav d-sm-flex d-flex flex-column">
                      <span className="user-name text-bold-600 text-white">
                        {user?.name || (isStaff ? 'Club Admin' : 'Club Member')}
                      </span>
                    </div>
                    <span className="text-center pl-1">
                      <img
                        src="/Assets/images/confirm.png"
                        alt="profile-status"
                        className="img-fluid"
                        style={{ width: '35px' }}
                      />
                    </span>
                  </a>

                  {isLogoutOpen && (
                    <div
                      className="dropdownProfile"
                      style={{
                        minWidth: '170px',
                        position: 'absolute',
                        right: 0,
                        background: '#fff',
                        top: '65px',
                        borderRadius: '6px',
                        boxShadow: '0 5px 25px rgba(0,0,0,0.12)',
                        zIndex: 1000,
                      }}
                    >
                      <Link
                        className="dropdown-item"
                        to={getClubPath(isStaff ? 'settings' : 'profile')}
                        onClick={() => setIsLogoutOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', color: '#333', textDecoration: 'none' }}
                      >
                        <i className="fa-solid fa-user-pen" style={{ width: '16px' }}></i>{' '}
                        {isStaff ? 'Club Settings' : 'Club Profile'}
                      </Link>
                      <div className="dropdown-divider"></div>
                      <a
                        className="dropdown-item"
                        href="#logout"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        style={{
                          cursor: 'pointer',
                          color: '#dc3545',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 15px',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="fa-solid fa-power-off" style={{ width: '16px' }}></i> Logout
                      </a>
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default ClubHeader;
