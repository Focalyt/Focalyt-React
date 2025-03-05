import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./CandidateSidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser as faUserRegular,
  faFile,
  faPaperPlane,
  faMap,
  faHand,
  faBookmark,
  faMoneyBill1,
  faCirclePlay,
  faShareFromSquare,
  faBell,
} from "@fortawesome/free-regular-svg-icons";

import {
  faChartLine,
  faBook,
  faSearch,
  faClipboardList,
  faWallet,
  faIndianRupeeSign,
  faForward,
} from "@fortawesome/free-solid-svg-icons";

const CandidateSidebar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (menu) => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  return (
    <>
    <div className="sidebar">
      {/* Navbar Header */}
      <div className="navbar-header">
        <ul className="nav navbar-nav flex-row">
          <li className="nav-item">
            <NavLink to="/candidate/dashboard">
              <img className="img-fluid logocs" src="/Assets/images/logo/logo.png" alt="Logo" />
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Sidebar Menu */}
      <div className="main-menu-content">
        <ul className="navigation">
          
          {/* Dashboard */}
          <li className="nav-item">
            <NavLink to="/candidate/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
              <div className="nav-item-content">
                <FontAwesomeIcon icon={faChartLine} />
                <span>Dashboard</span>
              </div>
            </NavLink>
          </li>

          {/* Profile Dropdown */}
          <li className={`nav-item ${openDropdown === "profile" ? "open" : ""}`}>
            <button className="dropdown-btn" onClick={() => toggleDropdown("profile")}>
              <FontAwesomeIcon icon={faUserRegular} />
              <span>Profile</span>
            </button>
            {openDropdown === "profile" && (
              <ul className="menu-content">
                <li key="myProfile">
                  <NavLink to="/candidate/myProfile">
                    <FontAwesomeIcon icon={faUserRegular} /> Your Profile
                  </NavLink>
                </li>
                <li key="documents">
                  <NavLink to="/candidate/document">
                    <FontAwesomeIcon icon={faFile} /> Documents
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Jobs Dropdown */}
          <li className={`nav-item ${openDropdown === "jobs" ? "open" : ""}`}>
            <button className="dropdown-btn" onClick={() => toggleDropdown("jobs")}>
              <FontAwesomeIcon icon={faClipboardList} />
              <span>Jobs</span>
            </button>
            {openDropdown === "jobs" && (
              <ul className="menu-content">
                <li key="searchjob">
                  <NavLink to="/candidate/searchjob">
                    <FontAwesomeIcon icon={faSearch} /> Search Job
                  </NavLink>
                </li>
                <li key="nearbyJobs">
                  <NavLink to="/candidate/nearbyJobs">
                    <FontAwesomeIcon icon={faMap} /> Jobs Near Me
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Notifications */}
          <li className="nav-item">
            <NavLink to="/candidate/notifications" className={({ isActive }) => isActive ? "active" : ""}>
              <div className="nav-item-content">
                <FontAwesomeIcon icon={faBell} />
                <span>Notifications</span>
              </div>
            </NavLink>
          </li>

        </ul>
      </div>
    </div>

    <div className="main-content">
      <Outlet/>
    </div>
    </>
  );
};

export default CandidateSidebar;
