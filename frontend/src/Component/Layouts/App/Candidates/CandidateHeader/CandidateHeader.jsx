import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./CandidateHeader.css";
import { useLocation } from 'react-router-dom';

function CandidateHeader({toggleSidebar, isSideBarOpen}) {
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
  const location = useLocation(); 
  
   const [user, setUser] = useState({});
    useEffect(() => {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        console.log("user (after sessionStorage):", parsed); // ✅ Right place to log
      }
    }, []);
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  useEffect(() => {
    setUserName(localStorage.getItem('candidate') || '');
    fetchUserCredit();
    fetchNotifications();
    // fetchProfileStatus();
  }, []);

  const fetchUserCredit = async () => {
    try {
      // const res = await axios.get('/candidate/getCreditCount', {
        const res = await axios.get(`${backendUrl}/candidate/getCreditCount`, {
        headers: { 'x-auth': localStorage.getItem('token') },
      });
      setUserCredit(res.data.credit || 0);
    } catch (error) {
      console.error("Error fetching credit count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // const res = await axios.get('/candidate/notificationCount', {
        const res = await axios.get(`${backendUrl}/candidate/notificationCount`, {

        headers: { 'x-auth': localStorage.getItem('token') },
      });
      setNotificationCount(res.data?.count || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // const fetchProfileStatus = async () => {
  //   try {
  //     // const res = await axios.get('/candidate/getcandidatestatus');
  //     const res = await axios.get(`${backendUrl}/candidate/getcandidatestatus`)
  //     setProfileVisibility(res.data.visibility);
  //     if (!res.data.visibility ) {
  //       setIsProfileModalOpen(true);
  //       localStorage.setItem('modalShown', 'true');
  //     }
  //   } catch (error) {
  //     console.error("Error fetching profile status:", error);
  //   }
  // };

  const handleLogout = async () => {
    try {
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
                    <a className="nav-link nav-menu-main menu-toggle hidden-xs" href="#" onClick={toggleSidebar}>
                    <i className="fas fa-bars" style={{fontSize:"30px", color: "#fff"}}></i>
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
              <ul className="nav navbar-nav float-right" style={{ gap: "10px" }}>
                <div class="bell my-auto">
                  <a href="/candidate/notifications"><i class="fa-solid fa-bell " style={{ color: "#fff", fontSize: "22px" }}></i>
                    <span class="badge text-bg-secondary" id="notification"></span></a>
                </div>
                <li className="dropdown dropdown-user nav-item" id="logout-block">
                  <a className="dropdown-toggle nav-link dropdown-user-link" onClick={() => setIsLogoutOpen(!isLogoutOpen)} style={{ gap: "15px" }}>
                    <div className="user-nav d-sm-flex d-flex flex-column">
                      {/* <span className="user-name text-bold-600 text-white">{userName}</span> */}
                      <span className="user-name text-bold-600 text-white">{user.name}</span>
                      {/* <span className="text-white">Coins: <strong>{userCredit}</strong></span> */}
                    </div>
                    <span className="text-center pl-1" >
                      <img id="profile-visibility-status" src={profileVisibility ? "/Assets/images/norconfirm.png" : "/Assets/images/confirm.png"} alt="profile-status" className="img-fluid" />
                    </span>
                  </a>
                  {isLogoutOpen && (
                    <div className="dropdownProfile" style={{
                      width: "100%", position: "absolute", background: "#fff", top: "70px",
                      borderRadius: "6px"
                    }}>
                      <a className="dropdown-item" href="/candidate/myProfile" style={{display: "flex", alignItems: "center", gap: "8px"}}>
                        <i className="fa-solid fa-user-pen" style={{width: "16px"}}></i> Edit Profile
                      </a>
                      <a className="dropdown-item" href="/candidate/myProfile" style={{display: "flex", alignItems: "center", gap: "8px"}}>
                        <i className="fa-solid fa-eye" style={{width: "16px"}}></i> Show Profile
                      </a>
                      <div className="dropdown-divider"></div>
                      <a className="dropdown-item" onClick={handleLogout} style={{cursor: "pointer", color: "#dc3545", display: "flex", alignItems: "center", gap: "8px"}}>
                        <i className="fa-solid fa-power-off" style={{width: "16px"}}></i> Logout
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
                  <button className="btn btn-md text-black" onClick={() => handleProfileStatusUpdate(false)}>No</button>
                  <button className="btn btn-md text-black" onClick={() => handleProfileStatusUpdate(true)}>Yes</button>
                </div>
                {successMsg && <p className="text-success">{successMsg}</p>}
                {errorMsg && <p className="text-danger">{errorMsg}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>
        {
          `
    .dropdown-divider {
    height: 0;
    margin: 0.5rem 0;
    overflow: hidden;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.dropdownProfile .dropdown-item {
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #333;
    text-decoration: none;
    transition: background-color 0.2s;
}

.dropdownProfile .dropdown-item:hover {
    background-color: #f5f5f5;
    color: #333;
}

.dropdownProfile .dropdown-item i {
    width: 16px;
    text-align: center;
}

#navbar-mobile{
display:flex;
align-items:center;
justify-content: space-between;
width:100%;
flex-direction: row;}  

.float-right{
        flex-direction: row;
      }  
`
        }
      </style>

      <script src="https://kit.fontawesome.com/9f033fe1e6.js" crossOrigin="anonymous"></script>
    </>
  );
}

export default CandidateHeader;
