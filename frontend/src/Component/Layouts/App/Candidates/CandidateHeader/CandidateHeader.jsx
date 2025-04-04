import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./CandidateHeader.css";


function CandidateHeader() {
  const [userName, setUserName] = useState('');
  const [userCredit, setUserCredit] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [profileVisibility, setProfileVisibility] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // useEffect(() => {
  //   setUserName(localStorage.getItem('candidate') || '');
  //   fetchUserCredit();
  //   fetchNotifications();
  //   fetchProfileStatus();
  // }, []);

  // const fetchUserCredit = async () => {
  //   try {
  //     const res = await axios.get('/candidate/getCreditCount', {
  //       headers: { 'x-auth': localStorage.getItem('token') },
  //     });
  //     setUserCredit(res.data.credit || 0);
  //   } catch (error) {
  //     console.error("Error fetching credit count:", error);
  //   }
  // };

  // const fetchNotifications = async () => {
  //   try {
  //     const res = await axios.get('/candidate/notificationCount', {
  //       headers: { 'x-auth': localStorage.getItem('token') },
  //     });
  //     setNotificationCount(res.data?.count || 0);
  //   } catch (error) {
  //     console.error("Error fetching notifications:", error);
  //   }
  // };

  // const fetchProfileStatus = async () => {
  //   try {
  //     const res = await axios.get('/candidate/getcandidatestatus');
  //     setProfileVisibility(res.data.visibility);
  //     if (!res.data.visibility && !localStorage.getItem("modalShown")) {
  //       setIsProfileModalOpen(true);
  //       localStorage.setItem('modalShown', 'true');
  //     }
  //   } catch (error) {
  //     console.error("Error fetching profile status:", error);
  //   }
  // };

  const handleLogout = async () => {
    try {
      await axios.get('/api/logout', {
        headers: { 'x-auth': localStorage.getItem('token') },
      });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/candidate/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleProfileStatusUpdate = async (status) => {
    try {
      const res = await axios.post("/candidate/updateprofilestatus", { status });
      if (res.data.status) {
        setSuccessMsg(res.data.message);
        setErrorMsg('');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setErrorMsg(res.data.message);
        setSuccessMsg('');
      }
    } catch (error) {
      setErrorMsg(error.message);
      setSuccessMsg('');
    }
  };

  const handleOtpVerification = async () => {
    if (otp.length !== 4) {
      setErrorMsg("Incorrect OTP");
      return;
    }
    try {
      const res = await axios.post('/api/verifyOtp', { mobile, otp });
      if (res.data.status) {
        setSuccessMsg("Mobile Number Verified");
        setErrorMsg('');
        await axios.post('/candidate/verification', { mobile, verified: true }, {
          headers: { 'x-auth': localStorage.getItem('token') }
        });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setErrorMsg("Incorrect OTP");
        setSuccessMsg('');
      }
    } catch (error) {
      setErrorMsg("Error verifying OTP");
      console.error(error);
    }
  };

  return (
    <>
      <nav className="header-navbar navbar-expand-lg navbar navbar-with-menu floating-nav navbar-theme navbar-shadow">
        <div className="navbar-wrapper">
          <div className="navbar-container content">
            <div className="navbar-collapse" id="navbar-mobile">
              <div className="mr-auto float-left bookmark-wrapper d-flex align-items-center">
                <ul className="nav navbar-nav">
                  <li className="nav-item mobile-menu d-xl-none mr-auto">
                    <a className="nav-link nav-menu-main menu-toggle hidden-xs" href="#">
                      <i className="ficon feather icon-menu"></i>
                    </a>
                  </li>
                </ul>
                <ul className="nav navbar-nav bookmark-icons d-none">
                  <li className="nav-item d-none d-lg-block">
                    <a className="nav-link" href="mailto:info@Focalyt.in">
                      <i className="ficon feather icon-mail text-white"></i>
                    </a>
                  </li>
                </ul>
              </div>
              <ul className="nav navbar-nav float-right">
                <li className="dropdown dropdown-user nav-item" id="logout-block">
                  <a className="dropdown-toggle nav-link dropdown-user-link" onClick={() => setIsLogoutOpen(!isLogoutOpen)}>
                    <div className="user-nav d-sm-flex d-flex">
                      <span className="user-name text-bold-600 text-white">{userName}</span>
                      <span className="text-white">Coins: <strong>{userCredit}</strong></span>
                    </div>
                    <span className="text-center pl-1">
                      <img id="profile-visibility-status" src={profileVisibility ? "/Assets/images/confirm.png" : "/Assets/images/notconfirm.png"} alt="profile-status" className="img-fluid"/>
                    </span>
                  </a>
                  {isLogoutOpen && (
                    <div className="dropdown-menu dropdown-menu-right">
                      <a className="dropdown-item" href="/candidate/myProfile">
                        <i className="feather icon-edit"></i> Edit Profile
                      </a>
                      <a className="dropdown-item" onClick={handleLogout}>
                        <i className="feather icon-power"></i> Logout
                      </a>
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

    
      {isProfileModalOpen && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-sm">
              <div className="modal-header">
                <h5 className="modal-title">Show Profile</h5>
                <button type="button" className="close" onClick={() => setIsProfileModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <h3>Show my profile to the company?</h3>
                <div className="modal-footer">
                  <button className="btn btn-md text-white" onClick={() => handleProfileStatusUpdate(false)}>No</button>
                  <button className="btn btn-md text-white" onClick={() => handleProfileStatusUpdate(true)}>Yes</button>
                </div>
                {successMsg && <p className="text-success">{successMsg}</p>}
                {errorMsg && <p className="text-danger">{errorMsg}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

     
      <script src="https://kit.fontawesome.com/9f033fe1e6.js" crossOrigin="anonymous"></script>
    </>
  );
}

export default CandidateHeader;
