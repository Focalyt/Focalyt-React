import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ClubHeader from './ClubHeader/ClubHeader';
import ClubFooter from './ClubFooter/ClubFooter';
import ClubSidebar from './ClubSidebar/ClubSidebar';
import { ClubProvider } from '../../../../contexts/ClubContext';
import { ToastViewport } from '../../../../Pages/App/Club/Components/ToastViewport';
import { getAuthSession } from '../../../../config/club/clubAuthSession';
import '../../../../Pages/App/Club/theme/clubStyles.css';

function ClubLayout({ mode = 'club_admin', basePath = '/club' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1199);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1199);

  // Auth Guard (same pattern as CandidateLayout, CollegeLayout & TrainerLayout)
  useEffect(() => {
    const auth = getAuthSession();
    const storedUser = sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!auth.isLoggedIn && !storedUser && !token) {
      const loginPath = mode === 'club_admin' || mode === 'admin' ? '/institute/login' : '/candidate/login';
      navigate(`${loginPath}?returnUrl=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data in ClubLayout:', err);
      }
    }
  }, [mode, navigate, location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-foc-theme', 'sky-magenta');
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1199;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
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

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <ClubProvider mode={mode} basePath={basePath}>
      <div className="min-h-screen flex flex-col focalyt-club-root club-in-portal">
        <main className="flex flex-1">
          <ClubSidebar
            isSidebarOpen={isSidebarOpen}
            expanded={expanded}
            toggleSidebar={toggleSidebar}
            handleSidebarClose={handleSidebarClose}
          />

          <div
            className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static"
            data-open="click"
            data-menu="vertical-menu-modern"
            data-col="2-columns"
            id="inner_job_page"
          >
            <div className="app-content content">
              <div className="content-overlay"></div>
              <div className="header-navbar-shadow"></div>
              <ClubHeader
                toggleSidebar={handleSidebarToggle}
                isSideBarOpen={isSidebarOpen}
              />
              <div className="content-wrapper">
                <div className="content-body mb-4">
                  <Outlet />
                </div>
                <ClubFooter />
              </div>
            </div>
          </div>
        </main>
        <ToastViewport />

        <style>
          {`
            html body .content .content-wrapper {
              padding: calc(2.2rem - 0.4rem) 2.2rem 0;
              margin-top: 6rem;
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
            .navbar-collapse {
              height: 68px;
              min-height: 4.5rem;
            }
            @media (max-width: 1199px) {
              .main-menu {
                background-color: white;
                width: 230px;
                height: 100vh;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 998;
                box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.05);
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
              html body .content {
                margin: 0;
              }
            }
            @media (max-width: 768px) {
              html body .content .content-wrapper {
                padding: calc(2.2rem - 0.4rem) 0.8rem 0;
                margin-top: 6rem;
              }
              .header-navbar.floating-nav {
                width: 100% !important;
                margin: 0;
              }
            }
          `}
        </style>
      </div>
    </ClubProvider>
  );
}

export default ClubLayout;
