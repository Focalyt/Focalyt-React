import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import "./CollegeLogin.css";
const CollegeLogin = () => {
    const urlLocation = useLocation();
    const queryParams = new URLSearchParams(urlLocation.search);
    const returnUrl = queryParams.get('returnUrl');

    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('login');

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

    const handleLogin = async () => {
        const body = {
            mobile: mobileNumber,
            pass: password,
            module: 'college'
        };

        try {
            const verifyRes = await axios.post(`${backendUrl}/api/verifyPass`, body);

            if (verifyRes.data.status === true) {
                setErrorMessage('');
                setSuccessMessage('Password verified');

                const loginRes = await axios.post(`${backendUrl}/api/otpLogin`, body);

                if (loginRes.data.status === true) {
                    localStorage.setItem("collegeName", loginRes.data.collegeName);
                    localStorage.setItem("collegeId", loginRes.data.collegeId);
                    localStorage.setItem("name", loginRes.data.name);
                    localStorage.setItem("token", loginRes.data.token);

                    if (returnUrl) {
                        window.location.href = decodeURIComponent(returnUrl);
                    } else {
                        window.location.href = '/college/dashboard';
                    }
                } else {
                    setSuccessMessage('');
                    setErrorMessage('Login failed !!!');
                }
            } else {
                setSuccessMessage('');
                setErrorMessage('Incorrect Password');
            }
        } catch (err) {
            console.error("Error in login:", err);
            setErrorMessage('Login failed !!!');
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
        <div
            className="vertical-layout vertical-menu-modern 1-column navbar-floating footer-static bg-full-screen-image blank-page blank-page"
            data-open="click"
            data-menu="vertical-menu-modern"
            data-col="1-column"
        >
            {/* Google Tag Manager (noscript) */}
            {/* <noscript>
                <iframe 
                    src="https://www.googletagmanager.com/ns.html?id=GTM-W39K27R"
                    height="0"
                    width="0"
                    style={{ display: 'none', visibility: 'hidden' }}
                ></iframe>
            </noscript> */}
            {/* End Google Tag Manager (noscript) */}

            <div className="app-content content">
                <div className="content-overlay"></div>
                <div className="header-navbar-shadow"></div>
                <div className="content-wrapper">
                    <div className="content-header row"></div>
                    <div className="content-body" id="login_card">
                        <section className="row flexbox-container">
                            <div className="col-xl-6 col-lg-7 col-sm-9 col-12 d-flex justify-content-center mx-auto px-3">
                                <div className="col-xl-12 card bg-authentication rounded mb-0 shadow px-0 card-placement">
                                    <div className="row m-0">
                                        <div className="col-lg-12 col-sm-12 col-12 text-center align-self-center px-1 py-0 logo_sec">
                                            <img
                                                src="/Assets/images/logo/logo.png"
                                                alt="branding logo"
                                                className="img-fluid brand_logo py-1 w-25"
                                            />
                                        </div>
                                        <div className="col-lg-12 col-sm-12 col-12 col-12 p-0">
                                            <div className="card rounded-0 mb-0 px-xl-2 px-lg-2 px-md-2 px-sm-0 px-0 card-placement-bottom">
                                                <div className="card-header pb-1 px-1">
                                                    <div className="card-title">
                                                        <h4>Institute Portal</h4>
                                                    </div>
                                                </div>
                                                <p className="card-header pt-0 px-1">Please login to your account</p>
                                                <div className="card-content card-placement-bottom">
                                                    <div className="card-body px-1">
                                                        <ul className="nav nav-tabs justify-content-left" role="tablist">
                                                            <li className="nav-item">
                                                                <a
                                                                    className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                                                                    id="service-tab-center"
                                                                    data-toggle="tab"
                                                                    href="#"
                                                                    aria-controls="service-center"
                                                                    role="tab"
                                                                    aria-selected={activeTab === 'login' ? 'true' : 'false'}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setActiveTab('login');
                                                                    }}
                                                                >
                                                                    Login
                                                                </a>
                                                            </li>
                                                            <li className="nav-item">
                                                                <a
                                                                    className={`nav-link ${activeTab === 'signup' ? 'active' : ''}`}
                                                                    id="home-tab-center"
                                                                    data-toggle="tab"
                                                                    href={`/college/register${window.location.search}`}
                                                                    aria-controls="home-center"
                                                                    role="tab"
                                                                    aria-selected={activeTab === 'signup' ? 'true' : 'false'}
                                                                >
                                                                    Signup
                                                                </a>
                                                            </li>
                                                        </ul>

                                                        <div className="tab-content mt-3">
                                                            <div
                                                                className={`tab-pane ${activeTab === 'login' ? 'active' : ''}`}
                                                                id="service-center"
                                                                aria-labelledby="service-tab-center"
                                                                role="tabpanel"
                                                            >
                                                                <div className=" rounded-0 mb-0">
                                                                    <div className="card-content">
                                                                        <div className="card-body p-0">
                                                                            <fieldset className="input-group form-label-group form-group position-relative has-icon-left">
                                                                                <input
                                                                                    type="tel"
                                                                                    className="form-control"
                                                                                    maxLength="10"
                                                                                    id="user-input"
                                                                                    placeholder="Mobile / मोबाइल"
                                                                                    pattern="[0-9]{10}"
                                                                                    value={mobileNumber}
                                                                                    onChange={(e) => setMobileNumber(e.target.value)}
                                                                                    onKeyPress={(e) => {
                                                                                        if (e.target.value.length === 10) {
                                                                                            e.preventDefault();
                                                                                            return false;
                                                                                        }
                                                                                        handleMobileNumberKeyPress(e);
                                                                                    }}
                                                                                    aria-label="Mobile Number"
                                                                                    aria-describedby="basic-addon2"
                                                                                />
                                                                                <div className="form-control-position">
                                                                                    <i className="fa-regular fa-user"></i>
                                                                                </div>
                                                                            </fieldset>

                                                                            <fieldset className="input-group form-label-group form-group position-relative has-icon-left">
                                                                                <div
                                                                                    className="form-control-position"
                                                                                    onClick={togglePassword}
                                                                                >
                                                                                    <i
                                                                                        className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                                                                        id="toggleIcon"
                                                                                    ></i>
                                                                                </div>
                                                                                <input
                                                                                    type={showPassword ? "text" : "password"}
                                                                                    placeholder="Enter your password"
                                                                                    id="userPassword"
                                                                                    className="form-control"
                                                                                    value={password}
                                                                                    onChange={(e) => setPassword(e.target.value)}
                                                                                    onKeyPress={handleKeyPress}
                                                                                />
                                                                            </fieldset>

                                                                            <p className="pt-0 px-0 mb-0">
                                                                                I agree to <a href="/employersTermsofService" target="_blank">Employers terms of use</a> and <a href="/userAgreement" target="_blank">User Agreement</a>.
                                                                            </p>

                                                                            <div className="row">
                                                                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mt-1">
                                                                                    <a
                                                                                        className="btn btn-primary float-right btn-inline waves-effect waves-light text-white btn-block"
                                                                                        id="login-btn"
                                                                                        onClick={handleLogin}
                                                                                        ref={loginBtnRef}
                                                                                    >
                                                                                        Login
                                                                                    </a>
                                                                                </div>
                                                                            </div>

                                                                            <div className="form-group d-flex justify-content-between align-items-center">
                                                                            </div>

                                                                            <div
                                                                                id="error"
                                                                                style={{
                                                                                    color: 'red',
                                                                                    fontWeight: 'bold',
                                                                                    display: errorMessage ? 'block' : 'none'
                                                                                }}
                                                                            >
                                                                                {errorMessage}
                                                                            </div>

                                                                            <div
                                                                                id="success"
                                                                                style={{
                                                                                    color: 'green',
                                                                                    fontWeight: 'bold',
                                                                                    display: successMessage ? 'block' : 'none'
                                                                                }}
                                                                            >
                                                                                {successMessage}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div
                                                                className={`tab-pane ${activeTab === 'signup' ? 'active' : ''}`}
                                                                id="home-center"
                                                                aria-labelledby="home-tab-center"
                                                                role="tabpanel"
                                                            >
                                                                <div className="card rounded-0 mb-0">
                                                                    <div className="card-content">
                                                                        <div className="card-body p-0">
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

            <style>
                {
                    `
                    .app-content.content{
                    height: 100dvh;}
                    html body .content {
    margin-left: 0!important;
}
                    `
                }
            </style>
        </div>
    );
};

export default CollegeLogin;