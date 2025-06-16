import React, { useState, useEffect } from 'react';

const CompanyRegister = ({ embedded = false }) => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    mobile: '',
    otp: ''
  });

  // UI state
  const [otpSent, setOtpSent] = useState(false);
  const [otpField, setOtpField] = useState(true);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendText, setResendText] = useState('Resend OTP');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Timer effect for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setResendDisabled(false);
            setResendText('Resend OTP');
            return 0;
          }
          setResendText(`Resend in ${prev - 1} secs`);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Validation functions
  const checkEmail = (email) => {
    const emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailReg.test(email);
  };

  const alphaOnly = (str) => {
    return /^[a-zA-Z\s]*$/.test(str);
  };

  const isValidMobile = (mobile) => {
    return /^[0-9]{10}$/.test(mobile);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Apply specific validations
    if (name === 'firstName' || name === 'lastName') {
      if (!alphaOnly(value)) return;
      if (value.length > 15) return;
    }
    
    if (name === 'email' && value.length > 30) return;
    if (name === 'companyName' && value.length > 50) return;
    
    if (name === 'mobile') {
      if (!/^[0-9]*$/.test(value)) return;
      if (value.length > 10) return;
    }

    if (name === 'otp') {
      if (!/^[0-9]*$/.test(value)) return;
      if (value.length > 4) return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear messages on input change
    setErrorMessage('');
    setSuccessMessage('');

    // Mobile number validation
    if (name === 'mobile' && value.length === 10) {
      if (isValidMobile(value)) {
        setErrorMessage('');
      } else {
        setErrorMessage('Enter a valid mobile number');
        setOtpField(true);
      }
    } else if (name === 'mobile' && value.length < 10) {
      setErrorMessage('Enter a valid mobile number');
      setOtpField(true);
    }

    // OTP validation
    if (name === 'otp') {
      if (value.length === 4) {
        setErrorMessage('');
      } else if (value.length > 0) {
        setErrorMessage('Incorrect OTP');
      }
    }
  };

  // Handle mobile number keypress
  const handleMobileKeyPress = (e) => {
    const k = e.which || e.keyCode;
    if (k > 58 || k < 48) {
      e.preventDefault();
    }
    
    if (e.key === 'Enter' && formData.mobile.length === 10) {
      e.preventDefault();
      handleSendOTP();
    }
  };

  // Handle OTP keypress
  const handleOtpKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSignup();
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!isValidMobile(formData.mobile)) {
      setErrorMessage('Enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/sendOtptoRegisterCompany`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: formData.mobile
        })
      });
      
      const data = await response.json();

      if (data.status === true) {
        setErrorMessage('');
        setSuccessMessage('OTP sent successfully');
        setOtpField(false);
        setOtpSent(true);
        setResendDisabled(true);
        setResendTimer(20);
      } else {
        setErrorMessage(data.message || 'Failed to send OTP');
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('Error sending OTP');
      setSuccessMessage('');
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/resendOTP?mobile=${formData.mobile}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();

      if (data.status === true) {
        setErrorMessage('');
        setResendDisabled(true);
        setResendTimer(20);
      } else {
        setErrorMessage(data.message || 'Failed to resend OTP');
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('Error resending OTP');
      setSuccessMessage('');
    }
  };

  // Handle signup
  const handleSignup = async () => {
    // Validation
    if (formData.email.length && !checkEmail(formData.email)) {
      setErrorMessage('Not a Valid Email!');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim() || 
        !formData.mobile || !formData.otp || !formData.companyName.trim()) {
      setErrorMessage('Please fill all the fields !!!');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP first
      const otpResponse = await fetch(`${backendUrl}/api/verifyOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: formData.mobile,
          otp: formData.otp
        })
      });
      
      const otpData = await otpResponse.json();

      if (otpData.status === true) {
        setErrorMessage('');
        setSuccessMessage('OTP verified');

        // Register company
        const registerResponse = await fetch(`${backendUrl}/company/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email.trim(),
            phoneNumber: formData.mobile,
            companyName: formData.companyName
          })
        });
        
        const registerData = await registerResponse.json();

        if (registerData.status === 'success') {
          // Login after registration
          const loginResponse = await fetch(`${backendUrl}/api/otpCompanyLogin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mobile: formData.mobile
            })
          });
          
          const loginData = await loginResponse.json();

          if (loginData.status === true) {
            localStorage.setItem("company", loginData.name);
            localStorage.setItem("registeredEmail", loginData.email);
            localStorage.setItem("token", loginData.token);
            window.location.href = "/company/dashboard";
          } else {
            setSuccessMessage('');
            setErrorMessage('Login failed !!!');
            setTimeout(() => {
              window.location.href = "/company/login";
            }, 2000);
          }
        } else {
          setSuccessMessage('');
          setErrorMessage(registerData.error || 'Registration failed');
        }
      } else {
        setSuccessMessage('');
        setErrorMessage('Incorrect OTP');
      }
    } catch (error) {
      setSuccessMessage('');
      setErrorMessage('Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const renderForm = () => (
    <div className="row">
                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="text" 
                                              className="form-control"
                                              name="firstName"
                                              placeholder="First Name" 
                                              value={formData.firstName}
                                              onChange={handleInputChange}
                                              maxLength="15"
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-user"></i>
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="text" 
                                              className="form-control"
                                              name="lastName"
                                              placeholder="Last Name" 
                                              value={formData.lastName}
                                              onChange={handleInputChange}
                                              maxLength="15" 
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-user"></i>
                                            </div>
                                          </fieldset>

                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="email" 
                                              className="form-control"
                                              name="email"
                                              placeholder="Email ID" 
                                              value={formData.email}
                                              onChange={handleInputChange}
                                              maxLength="30" 
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-mail"></i>
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group position-relative has-icon-left">
                                            <input 
                                              type="text" 
                                              className="form-control"
                                              name="companyName"
                                              placeholder="Company Name" 
                                              value={formData.companyName}
                                              onChange={handleInputChange}
                                              maxLength="50" 
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-user"></i>
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 input-group form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="tel" 
                                              className="form-control"
                                              name="mobile"
                                              maxLength="10"
                                              pattern="[0-9]{10}" 
                                              value={formData.mobile}
                                              onChange={handleInputChange}
                                              onKeyPress={handleMobileKeyPress}
                                              placeholder="Mobile"
                                              aria-label="Mobile Number"
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-phone"></i>
                                            </div>
                                            <div className="input-group-append">
                                              {!otpSent && (
                                                <button
                                                  className="btn btn-primary float-right btn-inline waves-effect waves-light text-white"
                                                  type="button"
                                                  onClick={handleSendOTP}
                                                  disabled={loading || formData.mobile.length !== 10}
                                                >
                                                  {loading ? 'Sending...' : 'Send OTP'}
                                                </button>
                                              )}
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 form-label-group position-relative has-icon-left">
                                            <input 
                                              type="number"
                                              className="form-control" 
                                              name="otp"
                                              placeholder="Enter your OTP"
                                              value={formData.otp}
                                              onChange={handleInputChange}
                                              onKeyPress={handleOtpKeyPress}
                                              disabled={otpField}
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-lock"></i>
                                            </div>
                                            <label htmlFor="otp">Enter the OTP</label>
                                          </fieldset>
                                          
                                          <p className="pt-0 px-1">
                                            I agree to{' '}
                                            <a href="/employersTermsofService" target="_blank" rel="noopener noreferrer">
                                              Employers terms of use
                                            </a>{' '}
                                            and{' '}
                                            <a href="/userAgreement" target="_blank" rel="noopener noreferrer">
                                              User Agreement
                                            </a>.
                                          </p>
                                          
                                          <div className="row">
                                            {otpSent && (
                                              <>
                                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                                  <button 
                                                    className="btn btn-primary btn-block waves-effect waves-light text-white"
                                                    type="button"
                                                    onClick={handleSignup}
                                                    disabled={loading}
                                                  >
                                                    {loading ? 'Signing up...' : 'Signup'}
                                                  </button>
                                                </div>
                                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                                  <button 
                                                    className={`btn btn-primary btn-block waves-effect waves-light text-white ${resendDisabled ? 'disabled' : ''}`}
                                                    type="button"
                                                    onClick={handleResendOTP}
                                                    disabled={resendDisabled}
                                                    style={{ padding: '1rem' }}
                                                  >
                                                    {resendText}
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
  );

  return embedded ? (
    <div className="embedded-signup-form">
      {renderForm()}
    </div>
  ) : (

    <div className="vertical-layout vertical-menu-modern 1-column navbar-floating footer-static bg-full-screen-image blank-page blank-page">
      <div className="app-content content">
        <div className="content-overlay"></div>
        <div className="header-navbar-shadow"></div>
        <div className="content-wrapper">
          <div className="content-header row"></div>
          <div className="content-body" id="login_card">
            <section className="row flexbox-container">
              <div className="col-xl-5 col-lg-5 col-md-6 col-sm-10 col-12 d-flex justify-content-center rounded py-0 px-xl-0 px-lg-0 px-md-0 px-sm-3 px-0 mx-auto">
                <div className="col-xl-12 card bg-authentication rounded mb-0 Regular shadow px-0">
                  <div className="row m-0">
                    <div className="col-12 text-center align-self-center px-1 py-0 logo_sec my-1">
                      <img 
                        src="/Assets/images/logo/logo.png" 
                        alt="branding logo"
                        className="img-fluid brand_logo brand-custom"
                      />
                    </div>
                    <div className="col-12 p-0">
                      <div className="card rounded-0 mb-0 px-xl-2 px-lg-2 px-md-2 px-sm-0 px-0 card-placement-bottom">
                        <div className="card-header pb-1 center-belong">
                          <div className="card-title text-center">
                            <h4>Company Portal</h4>
                          </div>
                        </div>
                        <p className="card-header pt-0 center-belong">Please signup for a new account.</p>
                        <div className="card-content px-0">
                          <div className="card-body">
                            <ul className="nav nav-tabs justify-content-left" role="tablist">
                              <li className="nav-item">
                                <a 
                                  className="nav-link" 
                                  href="/company/login"
                                  role="tab"
                                >
                                  Login
                                </a>
                              </li>
                              <li className="nav-item">
                                <a 
                                  className="nav-link active" 
                                  href="/company/register"
                                  role="tab"
                                >
                                  Signup
                                </a>
                              </li>
                            </ul>
                            <div className="tab-content">
                              <div className="tab-pane active" role="tabpanel">
                                <div className="card rounded-0 mb-0">
                                  <div className="card-content">
                                    <div className="card-body p-0">
                                      <div>
                                      {renderForm()}
                                        {/* <div className="row">
                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="text" 
                                              className="form-control"
                                              name="firstName"
                                              placeholder="First Name" 
                                              value={formData.firstName}
                                              onChange={handleInputChange}
                                              maxLength="15"
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-user"></i>
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="text" 
                                              className="form-control"
                                              name="lastName"
                                              placeholder="Last Name" 
                                              value={formData.lastName}
                                              onChange={handleInputChange}
                                              maxLength="15" 
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-user"></i>
                                            </div>
                                          </fieldset>

                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="email" 
                                              className="form-control"
                                              name="email"
                                              placeholder="Email ID" 
                                              value={formData.email}
                                              onChange={handleInputChange}
                                              maxLength="30" 
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-mail"></i>
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 form-label-group position-relative has-icon-left">
                                            <input 
                                              type="text" 
                                              className="form-control"
                                              name="companyName"
                                              placeholder="Company Name" 
                                              value={formData.companyName}
                                              onChange={handleInputChange}
                                              maxLength="50" 
                                              required
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-user"></i>
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 input-group form-label-group form-group position-relative has-icon-left">
                                            <input 
                                              type="tel" 
                                              className="form-control"
                                              name="mobile"
                                              maxLength="10"
                                              pattern="[0-9]{10}" 
                                              value={formData.mobile}
                                              onChange={handleInputChange}
                                              onKeyPress={handleMobileKeyPress}
                                              placeholder="Mobile"
                                              aria-label="Mobile Number"
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-phone"></i>
                                            </div>
                                            <div className="input-group-append">
                                              {!otpSent && (
                                                <button
                                                  className="btn btn-primary float-right btn-inline waves-effect waves-light text-white"
                                                  type="button"
                                                  onClick={handleSendOTP}
                                                  disabled={loading || formData.mobile.length !== 10}
                                                >
                                                  {loading ? 'Sending...' : 'Send OTP'}
                                                </button>
                                              )}
                                            </div>
                                          </fieldset>
                                          
                                          <fieldset className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 form-label-group position-relative has-icon-left">
                                            <input 
                                              type="number"
                                              className="form-control" 
                                              name="otp"
                                              placeholder="Enter your OTP"
                                              value={formData.otp}
                                              onChange={handleInputChange}
                                              onKeyPress={handleOtpKeyPress}
                                              disabled={otpField}
                                            />
                                            <div className="form-control-position">
                                              <i className="feather icon-lock"></i>
                                            </div>
                                            <label htmlFor="otp">Enter the OTP</label>
                                          </fieldset>
                                          
                                          <p className="pt-0 px-1">
                                            I agree to{' '}
                                            <a href="/employersTermsofService" target="_blank" rel="noopener noreferrer">
                                              Employers terms of use
                                            </a>{' '}
                                            and{' '}
                                            <a href="/userAgreement" target="_blank" rel="noopener noreferrer">
                                              User Agreement
                                            </a>.
                                          </p>
                                          
                                          <div className="row">
                                            {otpSent && (
                                              <>
                                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                                  <button 
                                                    className="btn btn-primary btn-block waves-effect waves-light text-white"
                                                    type="button"
                                                    onClick={handleSignup}
                                                    disabled={loading}
                                                  >
                                                    {loading ? 'Signing up...' : 'Signup'}
                                                  </button>
                                                </div>
                                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                                  <button 
                                                    className={`btn btn-primary btn-block waves-effect waves-light text-white ${resendDisabled ? 'disabled' : ''}`}
                                                    type="button"
                                                    onClick={handleResendOTP}
                                                    disabled={resendDisabled}
                                                    style={{ padding: '1rem' }}
                                                  >
                                                    {resendText}
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div> */}
                                      </div>
                                      
                                      {errorMessage && (
                                        <div style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>
                                          {errorMessage}
                                        </div>
                                      )}
                                      
                                      {successMessage && (
                                        <div style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>
                                          {successMessage}
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
};

export default CompanyRegister;