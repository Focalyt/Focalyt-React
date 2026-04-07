import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import "./CollegeHeader.css";
import LanguageSwitcher from '../../../../LanguageSwitcher'

const useScrollBlur = (navbarHeight = 88) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      setIsScrolled(currentScrollY > navbarHeight / 3);
      setScrollY(currentScrollY);
      tickingRef.current = false;
    };

    const throttledScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        window.requestAnimationFrame(handleScroll);
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [navbarHeight]);

  return { isScrolled, scrollY };
};

const CollegeHeader = ({ toggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const { t } = useTranslation();
  const [collegeAccountNo, setCollegeAccountNo] = useState(null);
  const [userName, setUserName] = useState('');
  const { isScrolled, scrollY } = useScrollBlur();
  const blurStrength = Math.min(18, 6 + scrollY / 24);
  const headerBackground = isScrolled
    ? 'rgba(252, 43, 90, 0.78)'
    : 'rgba(252, 43, 90, 0.96)';
  const containerBackground = isScrolled
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.08)';

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setUserName(parsedUserData?.name || '');

        if (parsedUserData?.collegeId) {
          setCollegeAccountNo(parsedUserData.collegeId);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const logout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/institute/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    const logoutDiv = document.getElementById('logout-div');
    logoutDiv.classList.toggle('show');
  };

  const copyAccountNo = async () => {
    try {
      await navigator.clipboard.writeText(collegeAccountNo);
      toast.success(t('account_number_copied'), {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(t('failed_to_copy_account_number'), {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const logoutDiv = document.getElementById('logout-div');
      if (logoutDiv && !logoutDiv.contains(e.target)) {
        logoutDiv.classList.remove('show');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav
        className={`header-navbar navbar-expand-lg navbar navbar-with-menu floating-nav navbar-theme navbar-shadow ${isScrolled ? 'header-navbar-blurred' : ''}`}
        style={{
          background: headerBackground,
          backdropFilter: isScrolled ? `blur(${blurStrength}px)` : 'none',
          WebkitBackdropFilter: isScrolled ? `blur(${blurStrength}px)` : 'none',
          boxShadow: isScrolled
            ? '0 18px 40px rgba(17, 24, 39, 0.14)'
            : '0 10px 30px rgba(252, 43, 90, 0.12)',
          border: isScrolled
            ? '1px solid rgba(255, 255, 255, 0.16)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'background 0.35s ease, backdrop-filter 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease'
        }}
      >
        <div className="navbar-wrapper">
          <div
            className="navbar-container content"
            style={{
              background: containerBackground,
              backdropFilter: isScrolled ? 'blur(10px)' : 'none',
              WebkitBackdropFilter: isScrolled ? 'blur(10px)' : 'none',
              transition: 'background 0.35s ease, backdrop-filter 0.35s ease'
            }}
          >
            <div className="navbar-collapse" id="navbar-mobile">
              <div className="mr-auto float-left bookmark-wrapper d-flex align-items-center">
                <ul className="nav navbar-nav">
                  <li className="nav-item mobile-menu d-xl-none mr-auto">
                    <a className="nav-link nav-menu-main menu-toggle hidden-xs" href="#" onClick={toggleSidebar}>
                      <i class="fas fa-bars" style={{color: "white", fontSize: "30px"}}></i>
                    </a>
                  </li>
                </ul>
                {collegeAccountNo && (
                  <ul className="nav navbar-nav d-none d-md-block" style={{ marginLeft: '20px' }}>
                    <li className="nav-item">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease'
                      }}>
                        <span
                          className="text-white"
                          style={{ 
                            fontSize: '13px', 
                            fontWeight: '600',
                            letterSpacing: '0.3px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('account_no')}
                        </span>
                        <span className="text-white" style={{ 
                          fontSize: '13px', 
                          fontWeight: 'bold',
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'monospace',
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          letterSpacing: '0.5px',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          {collegeAccountNo}
                        </span>
                        <button
                          id="copy-account-btn"
                          onClick={copyAccountNo}
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '32px',
                            height: '32px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title={t('copy_account_number')}
                        >
                          <i className="fas fa-copy" style={{ fontSize: '13px' }}></i>
                        </button>
                      </div>
                    </li>
                  </ul>
                )}
                <ul className="nav navbar-nav bookmark-icons d-none">
                  <li className="nav-item d-none d-lg-block">
                    <a className="nav-link" href="mailto:info@focalyt.in" target="_top" data-toggle="tooltip" data-placement="top" title="Email">
                      <i className="ficon feather icon-mail text-white"></i>
                    </a>
                  </li>
                </ul>
              </div>

              <ul className="nav navbar-nav float-right">
                <li className="nav-item nav-search d-none">
                  <div className="search-input">
                    <div className="search-input-icon">
                      <i className="feather icon-search primary"></i>
                    </div>
                    <input className="input" type="text" placeholder={t('explore_vuexy')} />
                    <div className="search-input-close">
                      <i className="feather icon-x"></i>
                    </div>
                    <ul className="search-list search-list-main"></ul>
                  </div>
                </li>

                <li className="dropdown dropdown-user nav-item">
                  <a
                    className="dropdown-toggle nav-link dropdown-user-link"
                    href="#"
                    onClick={handleDropdownToggle}
                  >
                    <div className="user-nav d-sm-flex d-flex">
                      <span className="user-name text-bold-600 text-white text-capitalize mb-0">
                        {userName ? t('welcome', { name: userName }) : ''}
                      </span>
                      <span className="text-white">
                        <ul className="list-unstyled LanguageSwitcher">
                          <li>
                            <span className="user-status text-white">{userName || t('available')}</span>
                          </li>
                          {/* <li>
                            <span className="user-status text-white"><LanguageSwitcher/></span>
                          </li> */}
                        </ul>
                        
                      </span>
                    </div>
                    <span>
                      {/* <img src={`${bucketUrl}/images/loader.png`} alt="avatar" height="40" width="40" /> */}
                      <img src="/Assets/images/confirm.png" alt="" style={{ width: '35px' }} />
                    </span>
                  </a>

                  <div className="dropdown-menu dropdown-menu-right" id="logout-div">
                    <a className="dropdown-item" href="/institute/myProfile" style={{display: "flex", alignItems: "center", gap: "8px"}}>
                      <i className="fa-solid fa-user-pen" style={{width: "16px"}}></i> {t('edit_profile')}
                    </a>
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item" href="#" onClick={logout} style={{cursor: "pointer", color: "#dc3545", display: "flex", alignItems: "center", gap: "8px"}}>
                      <i className="fa-solid fa-power-off" style={{width: "16px"}}></i> {t('logout')}
                    </a>
                  </div>
                </li>
              </ul>

            </div>
          </div>
        </div>
      </nav>

      <style>
        {
          `

          .header-navbar.header-navbar-blurred {
            overflow: visible;
          }

          .header-navbar .navbar-container ul.nav li.dropdown .dropdown-menu{
          top:70px;
          position: absolute;
          left: -11px;
          }

          #navbar-mobile{
          display: flex;
    flex-direction: revert;
    justify-content: space-between
          }
          .user-nav {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    float: left;
    margin-right: 0.8rem;
}
    .nav-item > a::after {
    content:''
    position: absolute;
    top:0;
    visibility: hidden;
    }

    .navbar-floating .header-navbar-shadow {
    display: block;
    background: linear-gradient(rgba(248, 248, 248, 0.95) 44%, rgba(248, 248, 248, 0.46) 73%, rgba(255, 255, 255, 0)) repeat;
}

    #logout-div .dropdown-item {
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #333;
    text-decoration: none;
    transition: background-color 0.2s;
    }

    #logout-div .dropdown-item:hover {
    background-color: #f5f5f5;
    color: #333;
    }

    #logout-div .dropdown-item i {
    width: 16px;
    text-align: center;
    }
    .LanguageSwitcher{
    display: flex;
    align-items: center;
    gap: 5px;
    flex-direction: row-reverse;
    }
          `
        }
      </style>
    </>
  );
};

export default CollegeHeader;
