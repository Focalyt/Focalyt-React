import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import "./CompanyLogin.css"
// import { Phone, Send } from 'lucide-react';

const CompanyLogin = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const otpInputRef = useRef(null);

  // Handle mobile number input with validation
  const handleMobileInput = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobileNumber(value);
    }
  };

  // Handle OTP input
  const handleOtpInput = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setOtp(value);
      if (value.length === 4) {
        setShowLoginButton(true);
      } else {
        setShowLoginButton(false);
      }
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setIsResendDisabled(true);
    setResendTimer(20);
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Generate OTP
  const handleGenerateOtp = async () => {
    setError('');
    setSuccess('');

    if (mobileNumber.length !== 10) {
      setError('Please enter the correct mobile number');
      return;
    }

    try {
      const response = await axios.post('/api/sendCompanyOtp', { mobile: mobileNumber });
      if (response.data.status === true) {
        setSuccess('OTP sent successfully');
        setShowOtpField(true);
        setShowResendButton(true);
        startResendTimer();
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 100);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (isResendDisabled) return;

    try {
      const response = await axios.get('/api/resendOTP', { params: { mobile: mobileNumber } });
      if (response.data.status === true) {
        setSuccess('OTP resent successfully');
        startResendTimer();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  // Verify OTP and Login
  const handleLogin = async () => {
    try {
      const verifyResponse = await axios.post('/api/verifyOtp', {
        mobile: mobileNumber,
        otp
      });

      if (verifyResponse.data.status === true) {
        const loginResponse = await axios.post('/api/otpCompanyLogin', {
          mobile: mobileNumber,
          otp
        });

        if (loginResponse.data.status === true) {
          localStorage.setItem('company', loginResponse.data.name);
          localStorage.setItem('registeredEmail', loginResponse.data.email);
          localStorage.setItem('token', loginResponse.data.token);
          window.location.href = '/company/dashboard';
        } else {
          setError('Login failed!');
        }
      } else {
        setError('Incorrect OTP');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
  };

  // Handle key press events
  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'mobile' && mobileNumber.length === 10) {
        handleGenerateOtp();
      } else if (type === 'otp' && otp.length === 4) {
        handleLogin();
      }
    }
  };

  return (
    <div className="app-content content">
      <div className="content-overlay"></div>
      <div className="header-navbar-shadow"></div>
      <div className="content-wrapper">
        <div className="content-body">
          <section className="row flexbox-container">
            <div className="col-xl-6 col-lg-7 col-sm-9 col-12 d-flex justify-content-center px-3">
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
                    <div className="card rounded-0 mb-0 px-2">
                      <div className="card-header pb-1">
                        <h4 className="card-title">Company Portal</h4>
                        <p className="mb-0">Please login to your account.</p>
                      </div>
                      
                      <div className="card-content">
                        <div className="card-body">
                          <ul className="nav nav-tabs">
                            <li className="nav-item">
                              <a className="nav-link active" href="/company/login">Login</a>
                            </li>
                            <li className="nav-item">
                              <a className="nav-link" href="/company/register">Signup</a>
                            </li>
                          </ul>

                          <div className="mt-4">
                            <div className="input-group mb-3">
                              <input
                                type="tel"
                                className="form-control"
                                placeholder="Mobile"
                                value={mobileNumber}
                                onChange={handleMobileInput}
                                onKeyPress={(e) => handleKeyPress(e, 'mobile')}
                                maxLength="10"
                              />
                              <div className="input-group-append">
                                <button
                                  className="btn btn-primary"
                                  type="button"
                                  onClick={handleGenerateOtp}
                                  style={{ display: showOtpField ? 'none' : 'block' }}
                                >
                                  Send OTP
                                </button>
                              </div>
                            </div>

                            {showOtpField && (
                              <div className="form-group">
                                <input
                                  ref={otpInputRef}
                                  type="number"
                                  className="form-control"
                                  placeholder="Enter OTP"
                                  value={otp}
                                  onChange={handleOtpInput}
                                  onKeyPress={(e) => handleKeyPress(e, 'otp')}
                                />
                              </div>
                            )}

                            {error && <div className="text-danger mb-2">{error}</div>}
                            {success && <div className="text-success mb-2">{success}</div>}

                            {showOtpField && (
                              <div className="row mt-2">
                                <div className="col-6">
                                  <button
                                    className="btn btn-primary btn-block"
                                    onClick={handleLogin}
                                    disabled={otp.length !== 4}
                                  >
                                    Login
                                  </button>
                                </div>
                                <div className="col-6">
                                  <button
                                    className="btn btn-outline-primary btn-block"
                                    onClick={handleResendOtp}
                                    disabled={isResendDisabled}
                                  >
                                    {isResendDisabled 
                                      ? `Resend in ${resendTimer}s` 
                                      : 'Resend OTP'}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="mt-3">
                              <p className="mb-0">
                                Please <a href="tel:+918699081947">Contact Us</a> for a change of Mobile Number.
                              </p>
                              <p className="mb-0">
                                I agree to <a href="/employersTermsofService" target="_blank">Employers terms of use</a> and{' '}
                                <a href="/userAgreement" target="_blank">User Agreement</a>.
                              </p>
                            </div>
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
  );
};

export default CompanyLogin;