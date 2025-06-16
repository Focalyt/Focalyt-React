import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CompanyRegister from '../CompanyRegister/CompanyRegister';

const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

function CompanyLogin() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [showGenerateBtn, setShowGenerateBtn] = useState(true);
  const [showLoginBtn, setShowLoginBtn] = useState(false);
  const [showResendBtn, setShowResendBtn] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendText, setResendText] = useState('Resend OTP');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  
  const otpInputRef = useRef(null);
  const resendIntervalRef = useRef(null);

  const handleMobileKeyPress = (e) => {
    const k = e.which || e.keyCode;
    if (k > 58 || k < 48) {
      e.preventDefault();
    }
  };

  const handleMobileInputKeyPress = (e) => {
    if (e.key === 'Enter' && mobile.length === 10) {
      e.preventDefault();
      handleGenerateOTP();
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }, 600);
    }
  };

  const handleOtpKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const showError = (message) => {
    setError(message);
    setSuccess('');
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setError('');
  };

  const startResendTimer = () => {
    setResendDisabled(true);
    let time = 20000;
    
    resendIntervalRef.current = setInterval(() => {
      time = time - 1000;
      const timeleft = (time / 1000) % 60;
      setResendText(`Resend in ${timeleft} secs`);
      
      if (time <= 0) {
        setResendText('Resend OTP');
        clearInterval(resendIntervalRef.current);
        setResendDisabled(false);
      }
    }, 1000);
  };

  const handleGenerateOTP = async () => {
    if (mobile.length !== 10) {
      showError('Please enter the correct mobile number');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/sendCompanyOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });
      
      const data = await response.json();
      
      if (data.status === true) {
        showSuccess('OTP sent successfully');
        setShowOtpField(true);
        setShowGenerateBtn(false);
        setShowLoginBtn(true);
        setShowResendBtn(true);
        startResendTimer();
      } else {
        showError(data.message);
      }
    } catch (err) {
      showError('Failed to send OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (resendDisabled) return;

    try {
      const response = await axios.get(`${backendUrl}/api/resendOTP`, { 
        params: { mobile } 
      });
      
      if (response.data.status === true) {
        showSuccess('OTP resent');
        startResendTimer();
      } else {
        showError(response.data.message);
      }
    } catch (err) {
      showError('Failed to resend OTP. Please try again.');
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    setOtp(value);
    
    if (value.length === 4) {
      setShowLoginBtn(true);
    }
  };

  const handleLogin = async () => {
    if (otp.length !== 4) {
      showError('Please enter valid OTP');
      return;
    }

    const body = { mobile, otp };

    try {
      // First verify OTP
      const verifyResponse = await axios.post(`${backendUrl}/api/verifyOtp`, body);
      
      if (verifyResponse.data.status === true) {
        showSuccess('OTP verified');
        
        // Then login
        const loginResponse = await axios.post(`${backendUrl}/api/otpCompanyLogin`, body);
        
        if (loginResponse.data.status === true) {
          localStorage.setItem('company', loginResponse.data.name);
          localStorage.setItem('registeredEmail', loginResponse.data.email);
          localStorage.setItem('token', loginResponse.data.token);
          window.location.href = '/company/dashboard';
        } else {
          showError('Login failed !!!');
        }
      } else {
        showError('Incorrect OTP');
      }
    } catch (err) {
      showError('Login failed. Please try again.');
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="vertical-layout vertical-menu-modern 1-column navbar-floating footer-static bg-full-screen-image blank-page blank-page">
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe 
          src="https://www.googletagmanager.com/ns.html?id=GTM-W39K27R" 
          height="0" 
          width="0"
          style={{display: 'none', visibility: 'hidden'}}
        />
      </noscript>
      
      <div className="app-content content">
        <div className="content-overlay"></div>
        <div className="header-navbar-shadow"></div>
        <div className="content-wrapper">
          <div className="content-header row"></div>
          <div className="content-body" id="login_card">
            <section className="row flexbox-container">
              <div className="col-xl-6 col-lg-7 col-sm-9 col-12 d-flex justify-content-center px-3 mx-auto">
                <div className="col-xl-12 card bg-authentication rounded shadow mb-0 px-0">
                  <div className="row m-0">
                    <div className="col-lg-12 text-center align-self-center px-1 py-0 logo_sec">
                      <img 
                        src="/Assets/images/logo/logo.png" 
                        alt="branding logo"
                        className="img-fluid brand_logo w-25 py-1"
                      />
                    </div>
                    <div className="col-lg-12 col-12 p-0">
                      <div className="card rounded-0 mb-0 card-placement px-xl-2 px-lg-2 px-md-1 px-sm-0 px-0">
                        <div className="card-header pb-1">
                          <div className="card-title">
                            <h4>Company Portal</h4>
                          </div>
                        </div>
                        <p className="card-header mb-0 pt-0">Please login to your account.</p>
                        <div className="card-content">
                          <div className="card-body">
                            <ul className="nav nav-tabs justify-content-left" role="tablist">
                              <li className="nav-item">
                                <a 
                                  className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('login')}
                                  href="#"
                                  role="tab"
                                >
                                  Login
                                </a>
                              </li>
                              <li className="nav-item">
                                <a 
                                  className={`nav-link ${activeTab === 'signup' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('signup')}
                                  href="#"
                                  role="tab"
                                >
                                  Signup
                                </a>
                              </li>
                            </ul>
                            <div className="tab-content mt-2">
                              {activeTab === 'login' && (
                                <div className="tab-pane active">
                                  <div className="card rounded-0 mb-0">
                                    <div className="card-content">
                                      <div className="card-body p-0 mt-1">
                                        <fieldset className="input-group form-label-group form-group position-relative has-icon-left">
                                          <input 
                                            type="tel" 
                                            className="form-control"
                                            maxLength="10" 
                                            placeholder="Mobile" 
                                            pattern="[0-9]{10}"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            onKeyPress={handleMobileKeyPress}
                                            onKeyDown={handleMobileInputKeyPress}
                                            aria-label="Mobile Number"
                                          />
                                          <div className="form-control-position">
                                            <i className="feather icon-phone"></i>
                                          </div>
                                          {showGenerateBtn && (
                                            <div className="input-group-append">
                                              <button
                                                className="btn btn-primary float-right btn-inline waves-effect waves-light text-white"
                                                type="button" 
                                                onClick={handleGenerateOTP}
                                              >
                                                Send OTP
                                                <span className="d-xl-inline d-lg-inline d-md-inline d-sm-none d-none"></span>
                                              </button>
                                            </div>
                                          )}
                                        </fieldset>

                                        {showOtpField && (
                                          <fieldset className="form-label-group position-relative has-icon-left">
                                            <input 
                                              type="text" 
                                              className="form-control"
                                              maxLength="4"
                                              placeholder="Enter OTP" 
                                              value={otp}
                                              onChange={handleOtpChange}
                                              onKeyPress={handleOtpKeyPress}
                                              ref={otpInputRef}
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-lock"></i>
                                            </div>
                                            <label htmlFor="otp">Enter OTP</label>
                                          </fieldset>
                                        )}

                                        <p className="pt-0 px-0">
                                          Please <a href="tel:+918699081947">Contact Us</a> for a change of Mobile Number.
                                        </p>
                                        <p className="pt-0 px-0">
                                          I agree to <a href="/employersTermsofService" target="_blank" rel="noopener noreferrer">
                                            Employers terms of use
                                          </a> and <a href="/userAgreement" target="_blank" rel="noopener noreferrer">
                                            User Agreement
                                          </a>.
                                        </p>

                                        <div className="row">
                                          {showLoginBtn && (
                                            <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                              <button 
                                                className="btn btn-primary float-right btn-inline waves-effect waves-light text-white btn-block"
                                                onClick={handleLogin}
                                              >
                                                Login
                                              </button>
                                            </div>
                                          )}
                                          {showResendBtn && (
                                            <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                              <button 
                                                className={`btn btn-primary btn-block waves-effect waves-light text-white btn-block ${resendDisabled ? 'disabled' : ''}`}
                                                onClick={handleResendOTP}
                                                disabled={resendDisabled}
                                                style={{padding: '1rem'}}
                                              >
                                                {resendText}
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {error && (
                                          <div style={{color: 'red', fontWeight: 'bold', marginTop: '10px'}}>
                                            {error}
                                          </div>
                                        )}
                                        {success && (
                                          <div style={{color: 'green', fontWeight: 'bold', marginTop: '10px'}}>
                                            {success}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeTab === 'signup' && (
                                <div className="tab-pane active">
                                  <div className="card rounded-0 mb-0">
                                    <div className="card-content">
                                      <div className="card-body p-0">
                                        {/* Signup form content would go here */}
                                        <CompanyRegister embedded={true}/>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyLogin;