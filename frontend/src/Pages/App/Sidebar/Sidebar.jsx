import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./Sidebar.css";
const Sidebar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleToggle = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  return (
    <div className="main-menu menu-fixed menu-light menu-accordion menu-shadow" data-scroll-to-active="true">
      <div className="navbar-header">
        <ul className="nav navbar-nav flex-row">
          <li className="nav-item mr-auto">
            <NavLink to="/candidate/dashboard" className="navbar-brand">
              <img className="img-fluid logocs" src="/images/logo/logo.png" alt="Logo" />
            </NavLink>
          </li>
        </ul>
      </div>
      <div className="shadow-bottom"></div>
      <div className="main-menu-content border border-left-0 border-right-0 border-bottom-0">
        <ul className="navigation navigation-main" id="main-menu-navigation" data-menu="menu-navigation">
          <li className="nav-item">
            <NavLink to="/candidate/dashboard" activeClassName="active">
              <i className="fa-solid fa-chart-line"></i>
              <span className="menu-title">Dashboard</span>
            </NavLink>
          </li>

          {/* Profile Dropdown */}
          <li className={`nav-item ${openDropdown === "profile" ? "open" : ""}`}>
            <a href="#" className="nav-link" onClick={() => handleToggle("profile")}>
              <i className="fa-solid fa-user"></i>
              <span className="menu-title">Profile</span>
            </a>
            {openDropdown === "profile" && (
              <ul className="menu-content">
                <li>
                  <NavLink to="/candidate/myProfile" activeClassName="active">
                    <i className="fa-regular fa-user"></i> Your Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/candidate/document" activeClassName="active">
                    <i className="fa-regular fa-file"></i> Documents
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Courses Dropdown */}
          <li className={`nav-item ${openDropdown === "courses" ? "open" : ""}`}>
            <a href="#" className="nav-link" onClick={() => handleToggle("courses")}>
              <i className="fa-solid fa-book"></i>
              <span className="menu-title">Courses</span>
            </a>
            {openDropdown === "courses" && (
              <ul className="menu-content">
                <li>
                  <NavLink to="/candidate/searchcourses" activeClassName="active">
                    <i className="fa fa-search"></i> Search Courses
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/candidate/appliedCourses" activeClassName="active">
                    <i className="fa-regular fa-paper-plane"></i> Applied Courses
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Jobs Dropdown */}
          <li className={`nav-item ${openDropdown === "jobs" ? "open" : ""}`}>
            <a href="#" className="nav-link" onClick={() => handleToggle("jobs")}>
              <i className="fa-solid fa-clipboard-list"></i>
              <span className="menu-title">Jobs</span>
            </a>
            {openDropdown === "jobs" && (
              <ul className="menu-content">
                <li>
                  <NavLink to="/candidate/searchjob" activeClassName="active">
                    <i className="fa fa-search"></i> Search Jobs
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/candidate/nearbyJobs" activeClassName="active">
                    <i className="fa-regular fa-map"></i> Jobs Near Me
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/candidate/appliedJobs" activeClassName="active">
                    <i className="fa-regular fa-paper-plane"></i> Applied Jobs
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          <li className="nav-item">
            <NavLink to="/candidate/wallet" className="nav-link">
              <i className="fa-solid fa-wallet"></i>
              <span className="menu-title">Wallet</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/candidate/requestLoan" activeClassName="active">
              <i className="fa-regular fa-circle"></i> Request Loan
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/candidate/watchVideos" activeClassName="active">
              <i className="fa-regular fa-circle-play"></i> Watch Videos
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/candidate/shareCV" activeClassName="active">
              <i className="fa-regular fa-share-from-square"></i> Share Profile
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/candidate/notifications" activeClassName="active">
              <i className="fa-regular fa-bell"></i> Notifications
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
