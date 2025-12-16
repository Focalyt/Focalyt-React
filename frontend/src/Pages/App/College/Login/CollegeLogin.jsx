import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

import CollegeRegister from '../Register/CollegeRegister';

const CollegeLogin = () => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    const urlLocation = useLocation();
    const queryParams = new URLSearchParams(urlLocation.search);
    const returnUrl = queryParams.get('returnUrl');
    const navigate = useNavigate();
    const [userInput, setUserInput] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('login');
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [otp, setOtp] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);
    const [showOtpBtn, setShowOtpBtn] = useState(false);

    const [isUserInputDisabled, setIsUserInputDisabled] = useState(false);

    // Forgot password states
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: mobile input, 2: OTP verify, 3: new password
    const [forgotMobile, setForgotMobile] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Logo URL
    const logoUrl = "/Assets/images/logo/logo.png";

    useEffect(() => {
        console.log('userData', userData)
        if (userData?.role === 2) {
            if (returnUrl) {
                navigate(returnUrl);
            } else {
                navigate('/institute/dashboard');
            }
        }
    }, [userData]);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const loginBtnRef = useRef(null);

    const handleMobileNumberKeyPress = (e) => {
        const charCode = e.which ? e.which : e.keyCode;
        if (charCode < 48 || charCode > 57) {
            e.preventDefault();
        }
    };

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const toggleNewPassword = () => {
        setShowNewPassword(!showNewPassword);
    };

    const handleLogin = async () => {
        if (loginMethod === 'password') {
            // Existing password login
            const body = {
                userInput,
                password,
                module: 'college'
            };

            try {
                const verifyRes = await axios.post(`${backendUrl}/college/login`, body);

                if (verifyRes.data.status === true) {
                    setErrorMessage('');
                    setSuccessMessage('Password verified');
                    sessionStorage.setItem("user", JSON.stringify(verifyRes.data.userData));
                    if (returnUrl) {
                        // window.location.href = decodeURIComponent(returnUrl);
                        navigate(decodeURIComponent(returnUrl));
                    } else {
                        window.location.href = '/institute/dashboard';
                    }
                } else {
                    setSuccessMessage('');
                    setErrorMessage('Login failed !!!');
                }

            } catch (err) {
                console.error("Error in login:", err);
                setErrorMessage('Login failed !!!');
            }
        } else {
            // OTP login
            // Verify OTP here
            try {
                const body = {
                    userInput,
                    otp
                };

                const verifyRes = await axios.post(`${backendUrl}/api/otpCollegeLogin`, body);

                if (verifyRes.data.status === true) {
                    setErrorMessage('');
                    setSuccessMessage('OTP verified');
                    sessionStorage.setItem("user", JSON.stringify(verifyRes.data.userData));
                    if (returnUrl) {
                        // window.location.href = decodeURIComponent(returnUrl);
                        navigate(decodeURIComponent(returnUrl));
                    } else {
                        // window.location.href = '/institute/dashboard';
                        navigate('/institute/dashboard');
                    }
                } else {
                    setSuccessMessage('');
                    console.log('response', verifyRes)
                    setErrorMessage('OTP verification failed !!!');
                }
            } catch (err) {
                console.error("Error in OTP verification:", err);
                setErrorMessage('OTP verification failed !!!');
            }
        }
    };

    const sendOtp = async () => {
        try {
            // Validate userInput (email or mobile)
            if (!userInput) {
                setErrorMessage('Please enter mobile number or email');
                return;
            }

            const body = {
                userInput,
                module: 'college'
            };

            const sendRes = await axios.post(`${backendUrl}/api/sendOtp`, body);

            if (sendRes.data.status === true) {
                toast.success(sendRes.data.message);

                setShowOtpBtn(false);


                setShowOtpField(true); // Show OTP field after successful OTP send
                setIsUserInputDisabled(true); // Disable the mobile/email input
            } else {
                toast.error(sendRes.data.message);
                setSuccessMessage('');
                setErrorMessage(sendRes.data.message);
            }
        } catch (err) {
            console.error("Error in sending OTP:", err);
            setErrorMessage('Failed to send OTP !!!');
        }
    };

    const handleChangeNumber = () => {
        setIsUserInputDisabled(false);
        setShowOtpField(false);
        setOtp('');
    };
    // useEffect(() => {
    //     // Add external CSS and script dynamically
    //     const cssLink = document.createElement("link");
    //     cssLink.rel = "stylesheet";
    //     cssLink.href = "https://app.helloyubo.com/assets/focalyt_bot.bot.css";
    //     document.head.appendChild(cssLink);
    
    //     return () => {
    //       // Cleanup CSS and script when component unmounts
    //       if (cssLink.parentNode) {
    //         document.head.removeChild(cssLink);
    //       }
        
    //     };
    //   }, []);
    // Forgot password functions
    const openForgotModal = () => {
        setShowForgotModal(true);
        setForgotStep(1);
        setForgotMobile('');
        setForgotOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        setSuccessMessage('');
    };

    const closeForgotModal = () => {
        setShowForgotModal(false);
    };

    const sendForgotOtp = async () => {
        try {
            // Validate mobile/email
            if (!forgotMobile) {
                setErrorMessage('Please enter mobile number or email');
                return;
            }

            const body = {
                userInput: forgotMobile,
                module: 'college',
            };

            const sendRes = await axios.post(`${backendUrl}/api/sendOtp`, body);

            if (sendRes.data.status === true) {
                toast.success(sendRes.data.message);

                setForgotStep(2);
            } else {
                toast.error(sendRes.data.message);

            }
        } catch (err) {
            console.error("Error in sending forgot OTP:", err);
            setErrorMessage('Failed to send OTP !!!');
        }
    };

    const verifyForgotOtp = async () => {
        try {
            // Validate OTP
            if (!forgotOtp) {
                setErrorMessage('Please enter OTP');
                return;
            }

            const body = {
                userInput: forgotMobile,
                otp: forgotOtp,
                module: 'college',
                purpose: 'reset_password'
            };

            const verifyRes = await axios.post(`${backendUrl}/api/verifyOtp`, body);

            if (verifyRes.data.status === true) {
                setErrorMessage('');
                setSuccessMessage('OTP verified successfully');
                setForgotStep(3);
            } else {
                setSuccessMessage('');
                setErrorMessage('OTP verification failed !!!');
            }
        } catch (err) {
            console.error("Error in verifying forgot OTP:", err);
            setErrorMessage('OTP verification failed !!!');
        }
    };

    const resetPassword = async () => {
        try {
            // Validate password
            if (!newPassword) {
                setErrorMessage('Please enter new password');
                return;
            }

            if (newPassword !== confirmPassword) {
                setErrorMessage('Passwords do not match');
                return;
            }

            const body = {
                userInput: forgotMobile,
                password: newPassword,
                module: 'college'
            };

            const resetRes = await axios.post(`${backendUrl}/college/users/reset-password`, body);

            if (resetRes.data.status === true) {
                setErrorMessage('');
                setSuccessMessage('Password reset successfully');
                setTimeout(() => {
                    closeForgotModal();
                }, 2000);
            } else {
                setSuccessMessage('');
                setErrorMessage('Failed to reset password !!!');
            }
        } catch (err) {
            console.error("Error in resetting password:", err);
            setErrorMessage('Failed to reset password !!!');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (loginBtnRef.current) {
                loginBtnRef.current.click();
            }
        }
    };

    return (

        <div className="login-page-container blank-page">

            <div className="login-card">
                <div className="logo-container">
                    <img src={logoUrl} alt="Focalyt Logo" className="logo" />
                </div>

                <h3 className="title">Institute Portal</h3>
                <p className="subtitle">Please login to your account</p>

                <div className="login-tabs">
                    <span
                        className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </span>
                    <span
                        className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                    // onClick={() => window.location.href = `/institute/register${window.location.search}`}
                    // onClick={() => navigate(`/institute/register${window.location.search}`)}
                    >
                        Signup
                    </span>
                </div>
                <div className="tab-content">
                    {activeTab === 'login' && (
                        <>
                            <form className="login-content" onSubmit={(e) => {
                                e.preventDefault();
                                if (showOtpBtn) {
                                    sendOtp();
                                } else {
                                    handleLogin();
                                }
                            }}>
                                <div className="login-method">
                                    <label className="radio-container">
                                        <input
                                            type="radio"
                                            name="loginMethod"
                                            checked={loginMethod === 'password'}
                                            onChange={() => {
                                                setLoginMethod('password');
                                                setShowOtpField(false);
                                            }}
                                        />
                                        <span className="radio-label">Password Login</span>
                                    </label>
                                    <label className="radio-container">
                                        <input
                                            type="radio"
                                            name="loginMethod"
                                            checked={loginMethod === 'otp'}
                                            onChange={() => {
                                                setLoginMethod('otp');
                                                setShowOtpField(false);
                                                setShowOtpBtn(true);
                                            }}
                                        />
                                        <span className="radio-label">OTP Login</span>
                                    </label>
                                </div>

                                <div className="input-field">
                                    <span className="input-icon">
                                        <i className="fa-regular fa-user"></i>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Mobile / Email"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        disabled={loginMethod === 'otp' && isUserInputDisabled}
                                    />
                                </div>

                                {loginMethod === 'password' ? (
                                    <div className="input-field">
                                        <span className="input-icon">
                                            <i className="fa-solid fa-lock"></i>
                                        </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                        />
                                        <span className="toggle-password" onClick={togglePassword}>
                                            <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </span>
                                    </div>
                                ) : (
                                    <div>
                                        {loginMethod === 'otp' && isUserInputDisabled && (
                                            <div className="change-number-container">
                                                <button
                                                    className="change-number-btn"
                                                    onClick={handleChangeNumber}
                                                >
                                                    Change Number/Email
                                                </button>
                                            </div>
                                        )}

                                        {showOtpField && (
                                            <div className="input-field">
                                                <span className="input-icon">
                                                    <i className="fa-regular fa-key"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Enter OTP"
                                                    maxLength="6"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                />
                                            </div>
                                        )}

                                        <div className="otp-btn-container">
                                            <button
                                                className="send-otp-btn"
                                                onClick={sendOtp}
                                            >
                                                {showOtpField ? "Resend OTP" : ""}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {loginMethod === 'password' && (
                                    <div className="forgot-password">
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openForgotModal();
                                            }}
                                        >
                                            Forgot Password?
                                        </a>
                                    </div>
                                )}

                                <div className="terms">
                    I agree to <a href="/terms-of-service" target="_blank"> Terms of Service</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
                                </div>

                                <button
                                    type="submit"
                                    className="login-btn"
                                    ref={loginBtnRef}
                                >
                                    {showOtpBtn ? "Send OTP" : "Login"}
                                </button>

                                {errorMessage && (
                                    <div className="error-message">{errorMessage}</div>
                                )}

                                {successMessage && (
                                    <div className="success-message">{successMessage}</div>
                                )}
                            </form>
                        </>
                    )}
                    {activeTab === 'signup' && (
                        <>
                            <CollegeRegister embedded={true} />
                        </>
                    )}
                </div>
            </div>



            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h4>Forgot Password</h4>
                            <button className="close-btn" onClick={closeForgotModal}>×</button>
                        </div>

                        <form className="modal-body" onSubmit={(e) => {
                            e.preventDefault();
                            if (forgotStep === 1) {
                                sendForgotOtp();
                            } else if (forgotStep === 2) {
                                verifyForgotOtp();
                            } else if (forgotStep === 3) {
                                resetPassword();
                            }
                        }}>
                            {forgotStep === 1 && (
                                <div>
                                    <div className="input-field">
                                        <span className="input-icon">
                                            <i className="fa-regular fa-user"></i>
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Mobile / Email"
                                            value={forgotMobile}
                                            onChange={(e) => setForgotMobile(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="modal-btn"
                                    >
                                        Send OTP
                                    </button>
                                </div>
                            )}

                            {forgotStep === 2 && (
                                <div>
                                    <div className="input-field">
                                        <span className="input-icon">
                                            <i className="fa-regular fa-key"></i>
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Enter OTP"
                                            maxLength="6"
                                            value={forgotOtp}
                                            onChange={(e) => setForgotOtp(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="modal-btn"
                                    >
                                        Verify OTP
                                    </button>
                                </div>
                            )}

                            {forgotStep === 3 && (
                                <div>
                                    <div className="input-field">
                                        <span className="input-icon">
                                            <i className="fa-regular fa-lock"></i>
                                        </span>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <span className="toggle-password" onClick={toggleNewPassword}>
                                            <i className={`fa-regular ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </span>
                                    </div>

                                    <div className="input-field">
                                        <span className="input-icon">
                                            <i className="fa-regular fa-lock"></i>
                                        </span>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="modal-btn"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="error-message">{errorMessage}</div>
                            )}

                            {successMessage && (
                                <div className="success-message">{successMessage}</div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .login-page-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f5f5f5;
                    // background-image: url('/Assets/images/bg.jpg');
                    background-size: cover;
                    background-position: center;
                }
                
                .login-card {
                    width: 100%;
                    max-width: 500px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    padding: 25px;
                    margin: 20px;
                    transition: all 0.3s ease;
                }
                
                .logo-container {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .logo {
                    max-width: 120px;
                    height: auto;
                }
                
                .title {
                    font-size: 22px;
                    font-weight: 600;
                    text-align: left;
                    margin-bottom: 5px;
                    color: #333;
                }
                
                .subtitle {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 20px;
                }
                
                .login-tabs {
                    display: flex;
                    margin-bottom: 25px;
                    border-bottom: 1px solid #eee;
                }
                
                .tab {
                    padding: 10px 0;
                    margin-right: 20px;
                    cursor: pointer;
                    font-weight: 500;
                    color: #666;
                    position: relative;
                }
                
                .tab.active {
                    color: #7a29c9;
                    font-weight: 600;
                }
                
                .tab.active:after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background-color: #7a29c9;
                }
                
                .login-method {
                    display: flex;
                    margin-bottom: 20px;
                }
                
                .radio-container {
                    display: flex;
                    align-items: center;
                    margin-right: 25px;
                    cursor: pointer;
                }
                
                .radio-container input[type="radio"] {
                    margin-right: 8px;
                    accent-color: #7a29c9;
                }
                
                .radio-label {
                    font-size: 14px;
                    color: #333;
                }
                
                .input-field {
                    position: relative;
                    margin-bottom: 15px;
                }
                
                .input-field input {
                    width: 100%;
                    padding: 12px 15px 12px 40px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }
                
                .input-field input:focus {
                    border-color: #7a29c9;
                    outline: none;
                }
                
                .input-field input:disabled {
                    background-color: #f9f9f9;
                    color: #666;
                }
                
                .input-icon {
                    position: absolute;
                    left: 15px;
                    top: 35%;
                    transform: translateY(-50%);
                    color: #999;
                }
                
                .toggle-password {
                    position: absolute;
                    right: 15px;
                    top: 35%;
                    transform: translateY(-50%);
                    cursor: pointer;
                    color: #999;
                }
                
                .otp-btn-container {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 15px;
                }
                
                .send-otp-btn {
                    background: none;
                    border: none;
                    color: #7a29c9;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 0;
                    text-decoration: underline;
                }
                
                .change-number-container {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 10px;
                }
                
                .change-number-btn {
                    background: none;
                    border: none;
                    color: #7a29c9;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 0;
                    text-decoration: underline;
                }
                
                .forgot-password {
                    text-align: right;
                    margin-bottom: 15px;
                }
                
                .forgot-password a {
                    color: #7a29c9;
                    font-size: 14px;
                    text-decoration: none;
                }
                
                .terms {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 20px;
                }
                
                .terms a {
                    color: #7a29c9;
                    text-decoration: none;
                }
                
                .login-btn {
                    width: 100%;
                    background-color: #7a29c9;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 12px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                
                .login-btn:hover {
                    background-color: #6a1ca9;
                }
                
                .error-message {
                    color: #f44336;
                    font-size: 14px;
                    margin-top: 15px;
                    text-align: center;
                }
                
                .success-message {
                    color: #4caf50;
                    font-size: 14px;
                    margin-top: 15px;
                    text-align: center;
                }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .modal-container {
                    background: white;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    border-bottom: 1px solid #eee;
                }
                
                .modal-header h4 {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #999;
                }
                
                .modal-body {
                    padding: 20px;
                }
                
                .modal-btn {
                    width: 100%;
                    background-color: #ff4081;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 12px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    margin-top: 10px;
                }
                
                .modal-btn:hover {
                    background-color: #e91e63;
                }

/* .blank-page{
  
  background:url(../../../../../public/Assets/public/images/logo/rename.webp) repeat;
    background-size: auto;
  background-size: contain;
}

.blank-page {
  margin: 0px !important;
  height: 100vh!important;
}   

.text-primary{
  color: #FC2B5A!important;
} */

.btn-block {
  display: block;
  width: 100%;
}

            `}</style>
        </div>
    );
};

export default CollegeLogin;