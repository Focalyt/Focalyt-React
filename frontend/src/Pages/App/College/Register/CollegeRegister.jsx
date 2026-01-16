import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';


const CollegeRegister = ({ embedded = false }) => {
    const urlLocation = useLocation();
    const queryParams = new URLSearchParams(urlLocation.search);
    const returnUrl = queryParams.get('returnUrl');
    const navigate = useNavigate();
    const [collegeName, setCollegeName] = useState('');
    const [concernedPerson, setConcernedPerson] = useState('');
    const [email, setEmail] = useState('');
    const [instituteType, setInstituteType] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [message, setMessage] = useState('');
    const [otpDisabled, setOtpDisabled] = useState(true);
    const [showGenerateOTP, setShowGenerateOTP] = useState(true);
    const [showSignupBtn, setShowSignupBtn] = useState(false);
    const [showResendBtn, setShowResendBtn] = useState(false);
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [resendBtnText, setResendBtnText] = useState('Resend OTP');
    const [showOtpInput, setShowOtpInput] = useState(false);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

    const signupBtnRef = useRef(null);
    const otpInputRef = useRef(null);
    const generateOTPRef = useRef(null);


    //refer leads


    useEffect(() => {


        const waitForGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                const input = document.getElementById('collegeName');
                if (input) {
                    const autocomplete = new window.google.maps.places.Autocomplete(input, {
                        types: ['establishment'],
                        componentRestrictions: { country: 'in' },
                    });

                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (!place || !place.geometry || !place.geometry.location) return;

                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();

                        const placeNameOnly = place.name || input.value;

                        // Only set the name, not the full address
                        setCollegeName(placeNameOnly);

                        let city = '', state = '';
                        place.address_components?.forEach((component) => {
                            const types = component.types.join(',');
                            if (types.includes("locality")) city = component.long_name;
                            if (types.includes("administrative_area_level_1")) state = component.long_name;
                            if (!city && types.includes("sublocality_level_1")) city = component.long_name;
                        });

                        setCity(city);
                        setState(state);
                        setLatitude(lat);
                        setLongitude(lng);

                        // Optionally save full address in another state
                        setAddress(place.formatted_address || '');
                    });

                }


            } else {
                setTimeout(waitForGoogle, 100);
            }
        };

        waitForGoogle();
    }, []);
    const checkEmail = (email) => {
        let emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        return emailReg.test(email);
    };

    const verifyPassword = () => {
        if (password === confirmPassword && password.length > 0) {
            return {
                border: "1px solid green"
            };
        } else if (password.length > 0 || confirmPassword.length > 0) {
            return {
                border: "1px solid red"
            };
        }
        return {};
    };

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const confirmTogglePassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handlePhoneNumberKeyPress = (e) => {
        const charCode = e.which ? e.which : e.keyCode;
        if (charCode < 48 || charCode > 57) {
            e.preventDefault();
        }
    };

    // const handleConcernedPersonKeyPress = (e) => {
    //     const charCode = e.which ? e.which : e.keyCode;
    //     if (!((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122))) {
    //         e.preventDefault();
    //     }
    // };

    const handleConcernedPersonKeyPress = (e) => {
        const charCode = e.which ? e.which : e.keyCode;
        // Allow A-Z, a-z, and space
        if (
            !(
                (charCode >= 65 && charCode <= 90) || // A-Z
                (charCode >= 97 && charCode <= 122) || // a-z
                charCode === 32 // space
            )
        ) {
            e.preventDefault();
        }
    };


    const handlePhoneNumberChange = (e) => {
        const value = e.target.value;
        setPhoneNumber(value);

        if (value.length === 10 || value.length === 12) {
            let pattern = /[0-9]{10,12}/gm;
            let test = pattern.test(value);

            if (test === true) {
                setErrorMessage('');
                setOtpDisabled(false);
            } else {
                setSuccessMessage('');
                setErrorMessage('Enter a valid mobile number');
                setOtpDisabled(true);
            }
        } else {
            setSuccessMessage('');
            setErrorMessage('Enter a valid mobile number');
            setOtpDisabled(true);
        }
    };

    const handleOtpChange = (e) => {
        const value = e.target.value;
        setOtp(value);

        if (value.length === 4) {
            setErrorMessage('');
        } else {
            setSuccessMessage('');
            setErrorMessage('Incorrect OTP');
        }
    };

    const startResendTimer = () => {
        setIsResendDisabled(true);
        let time = 20000;
        const interval = setInterval(() => {
            time -= 1000;
            const timeLeft = (time / 1000) % 60;
            setResendBtnText(`Resend in ${timeLeft} secs`);

            if (time <= 0) {
                clearInterval(interval);
                setResendBtnText('Resend OTP');
                setIsResendDisabled(false);
            }
        }, 1000);
    };

    const handleGenerateOTP = async (e) => {
        e.preventDefault();

        const body = { mobile: phoneNumber, module: 'college' };

        try {
            const res = await axios.post(`${backendUrl}/api/sendOtptoRegister`, body);

            if (res.data.status === true) {
                setErrorMessage('');
                setSuccessMessage('OTP sent successfully.');
                setOtpDisabled(false);
                setShowGenerateOTP(false);
                setShowSignupBtn(true);
                setShowResendBtn(true);
                setShowOtpInput(true);
                startResendTimer();

                if (otpInputRef.current) {
                    otpInputRef.current.focus();
                }
            } else {
                setErrorMessage(res.data.message);
                setSuccessMessage('');
            }
        } catch (error) {
            setErrorMessage('Error sending OTP');
            setSuccessMessage('');
        }
    };

    const handleResendOTP = async (e) => {
        if (isResendDisabled) return;

        e.preventDefault();
        const body = { mobile: phoneNumber };

        try {
            const res = await axios.get(`${backendUrl}/api/resendOTP`, { params: body });

            if (res.status === true) {
                setErrorMessage('');
                setSuccessMessage('OTP resent');
                startResendTimer();
            } else {
                setErrorMessage(res.data.message);
                setSuccessMessage('');
            }
        } catch (error) {
            setErrorMessage('Error resending OTP');
            setSuccessMessage('');
        }
    };

    const handleSignup = async () => {
        if (email.length && !checkEmail(email)) {
            setMessage('Not a Valid Email!');
            return;
        }

        if (collegeName.length !== 0 && concernedPerson.length !== 0 &&
            phoneNumber.length !== 0 && otp.length !== 0) {

            let body = { mobile: phoneNumber, otp: otp, module: 'college' };

            try {
                const verifyRes = await axios.post(`${backendUrl}/api/verifyOtp`, body);

                if (verifyRes.data.status === true) {
                    setErrorMessage('');
                    setSuccessMessage('OTP verified');

                    body = {
                        collegeName,
                        concernedPerson,
                        email,
                        mobile: phoneNumber,
                        password,
                        confirmPassword,
                        type: instituteType,
                        location: {
                            type: "Point",
                            coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
                            city,
                            state,
                            fullAddress: address,

                        }
                    };

                    const registerRes = await axios.post(`${backendUrl}/college/register`, body);

                    if (registerRes.data.status) {
                        body = { userInput: phoneNumber, password };
                        const loginRes = await axios.post(`${backendUrl}/college/login`, body);

                        if (loginRes.data.status === true) {
                            sessionStorage.setItem("user", JSON.stringify(loginRes.data.userData));

                            if (returnUrl) {
                                // window.location.href = decodeURIComponent(returnUrl);
                                navigate(decodeURIComponent(returnUrl));
                            } else {
                                // window.location.href = "/institute/dashboard";
                                navigate("/institute/dashboard");
                            }

                        } else {
                            setSuccessMessage('');
                            setErrorMessage('Login failed !!!');
                            window.location.href = "/institute/login";
                        }
                    } else {
                        console.log('error', registerRes.data)
                        setSuccessMessage('');
                        setErrorMessage(registerRes.data.error);
                        toast.error(registerRes.data.error);

                    }
                } else {
                    setSuccessMessage('');
                    setErrorMessage('Incorrect OTP');
                }
            } catch (error) {
                setErrorMessage('Error during signup process');
                setSuccessMessage('');
            }
        } else {
            setSuccessMessage('');
            setErrorMessage('Please fill all the fields !!!');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (showSignupBtn && signupBtnRef.current) {
                signupBtnRef.current.click();
            }
        }
    };

    const handlePhoneKeyPress = (e) => {
        if (e.key === 'Enter' && phoneNumber.length === 10) {
            e.preventDefault();
            if (generateOTPRef.current) {
                generateOTPRef.current.click();
            }
            setTimeout(() => {
                if (otpInputRef.current) {
                    otpInputRef.current.focus();
                }
            }, 600);
        }
    };

    const renderForm = () => (
        <form onSubmit={(e) => e.preventDefault()} className='collegeRegistration'>
            <div className="row">
                <fieldset className="form-label-group form-group position-relative has-icon-left col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                    <div className="input-field">
                        <input
                            type="text"
                            className=""
                            id="collegeName"
                            placeholder="Institute Name"
                            value={collegeName}
                            onChange={(e) => setCollegeName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.target.value.length === 50) {
                                    e.preventDefault();
                                    return false;
                                }
                            }}
                        />
                        <div className="form-control-position input-icon" style={{ top: '50%' }}>
                            <i className="fa-regular fa-user"></i>
                        </div>


                        <label htmlFor="user-name"></label>
                    </div>
                </fieldset>

                <fieldset className="form-label-group form-group position-relative has-icon-left col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                    <div className='input-field'>
                        <input
                            type="text"
                            className=""
                            id="concernedPerson"
                            placeholder="Concerned Person Name"
                            value={concernedPerson}
                            onChange={(e) => setConcernedPerson(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.target.value.length === 15) {
                                    e.preventDefault();
                                    return false;
                                }
                                handleConcernedPersonKeyPress(e);
                            }}
                        />
                        <div className="form-control-position  input-icon" style={{ top: '50%' }}>
                            <i className="fa-regular fa-user"></i>
                        </div>
                        <label htmlFor="user-name"></label>
                    </div>
                </fieldset>

                <fieldset className="form-label-group form-group position-relative has-icon-left col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                    <div className="input-field" >
                        <input
                            type="text"
                            className=""
                            id="user-mail"
                            placeholder="Email ID"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.target.value.length === 30) {
                                    e.preventDefault();
                                    return false;
                                }
                            }}
                        />
                        <div className="form-control-position input-icon " style={{ top: '50%' }}>
                            <i className="fa-regular fa-envelope"></i>
                        </div>
                        <label htmlFor="user-name"></label>
                    </div>
                </fieldset>

                <fieldset className="form-label-group form-group position-relative has-icon-left col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                    <div className="input-field" >
                        <select
                            className="form-control"
                            id="select"
                            value={instituteType}
                            onChange={(e) => setInstituteType(e.target.value)} style={{ padding: '10px 6px 10px 40px' }}
                        >
                            <option value="" >Type of Institute</option>
                            <option value="School">School</option>
                            <option value="College">College</option>
                            <option value="Computer Center">Computer Center</option>
                            <option value="University">University</option>
                            <option value="Private University">Private University</option>
                        </select>
                        <div className="form-control-position input-icon" style={{ top: '50%' }}>
                            <i className="fa-solid fa-check" ></i>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="form-label-group position-relative has-icon-left col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                    <div className="input-field" >
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            id="pass"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={verifyPassword()}
                        />
                        <div
                            className="form-control-position  input-icon" style={{ top: '50%' }}
                            onClick={togglePassword}
                        >
                            <i
                                className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                id="toggleIcon"
                            ></i>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="form-label-group position-relative has-icon-left col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                    <div className="input-field" >
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control"
                            id="confirmPass"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={verifyPassword()}
                        />
                        <div
                            className="form-control-position input-icon" style={{ top: '50%' }}
                            onClick={confirmTogglePassword}
                        >
                            <i
                                className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                id="toggleBtn"
                            ></i>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="input-group form-label-group form-group position-relative has-icon-left row
                ">
                    <div className="input-field col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8" >
                        <input
                            type="tel"
                            className="form-control"
                            maxLength="10"
                            id="user-number"
                            pattern="[0-9]{10}"
                            placeholder="Mobile"
                            value={phoneNumber}
                            onChange={handlePhoneNumberChange}
                            onKeyPress={(e) => {
                                if (e.target.value.length === 10) {
                                    e.preventDefault();
                                    return false;
                                }
                                handlePhoneNumberKeyPress(e);
                                handlePhoneKeyPress(e);
                            }}
                            aria-label="Mobile Number"
                            aria-describedby="basic-addon2"
                        />
                        <div className="form-control-position input-icon" style={{ top: '50%' }}>
                            <i className="fa-solid fa-phone"></i>
                        </div>
                    </div>
                    <div className="input-group-append col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4">
                        {showGenerateOTP && (
                            <button
                                className="btn btn-primary float-right btn-inline waves-effect waves-light text-white sendOTP"
                                type="button"
                                id="generate-otp"
                                onClick={handleGenerateOTP}
                                ref={generateOTPRef}
                            >
                                Send OTP
                            </button>
                        )}
                    </div>
                </fieldset>
                {showOtpInput && (
                    <fieldset className="form-label-group position-relative has-icon-left col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                        <div className="input-field" >
                            <input
                                type="number"
                                className="form-control"
                                id="user-otp"
                                placeholder="Enter your OTP"
                                value={otp}
                                onChange={handleOtpChange}
                                disabled={otpDisabled}
                                ref={otpInputRef}
                                onKeyPress={handleKeyPress}
                            />
                            <div className="form-control-position input-icon">
                                <i className="fa-solid fa-lock"></i>
                            </div>
                        </div>
                    </fieldset>
                )}

                <p className="pt-0 px-1" style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                    I agree to <a href="/terms-of-service" target="_blank"> Terms of Service</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
                </p>

                <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                        {showSignupBtn && (
                            <a
                                className="btn btn-primary btn-block waves-effect waves-light text-white"
                                id="submit-button"
                                style={{ padding: '1rem' }}
                                onClick={handleSignup}
                                ref={signupBtnRef}
                            >
                                Signup
                            </a>
                        )}
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                        {showResendBtn && (
                            <div
                                className={`btn btn-primary btn-block waves-effect waves-light text-white ${isResendDisabled ? 'disabled' : ''}`}
                                id="resend-btn"
                                style={{ padding: '1rem' }}
                                onClick={handleResendOTP}
                            >
                                {resendBtnText}
                            </div>
                        )}
                    </div>
                </div>

                <div>&nbsp;</div>

                <div
                    id="error"
                    style={{
                        color: 'rgb(243, 56, 56)',
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

                <div id="msg">{message}</div>
            </div>
        </form>
    );


    return embedded ? (<div className="embedded-signup-form">
        {renderForm()}
    </div>) : (
        <div
            className="vertical-layout vertical-menu-modern 1-column navbar-floating footer-static bg-full-screen-image blank-page blank-page"
            data-open="click"
            data-menu="vertical-menu-modern"
            data-col="1-column"
        >
            <div className="app-content content">
                <div className="content-overlay"></div>
                <div className="header-navbar-shadow"></div>
                <div className="content-wrapper">
                    <div className="content-header row"></div>
                    <div className="content-body" id="login_card">
                        <section className="row flexbox-container">
                            <div className="col-xl-5 col-lg-5 col-md-6 col-sm-10 col-12 d-flex justify-content-center mx-auto px-0">
                                <div className="col-xl-12 card bg-authentication mb-0 shadow px-0">
                                    <div className="row m-0">
                                        <div className="col-lg-12 text-center align-self-center px-1 py-0 logo_sec my-1">
                                            <img
                                                src="/Assets/images/logo/logo.png"
                                                alt="branding logo"
                                                className="img-fluid brand_logo brand-custom"
                                            />
                                        </div>
                                        {/* <div className="col-lg-12 col-12 p-0">
                                            <div className="card rounded-0 mb-0 px-xl-2 px-lg-2 px-md-2 px-sm-0 px-0 card-placement-bottom">
                                                <div className="mt-2 text-center pb-1 px-1">
                                                    <div className="card-title">
                                                        <h4 className="">Institute Portal</h4>
                                                    </div>
                                                </div>
                                                <p className="text-center pt-0">Please signup for a new account</p>
                                                <div className="card-content card-placement-bottom">
                                                    <div className="card-body px-1">
                                                        <ul className="nav nav-tabs justify-content-left" role="tablist">
                                                            <li className="nav-item">
                                                                <a
                                                                    className="nav-link"
                                                                    id="service-tab-center"
                                                                    data-toggle="tab"
                                                                    // href={`/institute/login${window.location.search}`}
                                                                    onClick={() => navigate(`/institute/login${window.location.search}`)}
                                                                    aria-controls="service-center"
                                                                    role="tab"
                                                                    aria-selected="false"
                                                                >
                                                                    Login
                                                                </a>
                                                            </li>
                                                            <li className="nav-item">
                                                                <a
                                                                    className="nav-link active"
                                                                    id="home-tab-center"
                                                                    data-toggle="tab"
                                                                    href="#"
                                                                    aria-controls="home-center"
                                                                    role="tab"
                                                                    aria-selected="true"
                                                                >
                                                                    Signup
                                                                </a>
                                                            </li>
                                                        </ul>

                                                        <div className="tab-content">
                                                            <div
                                                                className="tab-pane"
                                                                id="service-center"
                                                                aria-labelledby="service-tab-center"
                                                                role="tabpanel"
                                                            >
                                                                <div className="card rounded-0 mb-0">
                                                                    <div className="card-content">
                                                                        <div className="card-body p-0"></div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div
                                                                className="tab-pane active"
                                                                id="home-center"
                                                                aria-labelledby="home-tab-center"
                                                                role="tabpanel"
                                                            >
                                                                <div className="rounded-0 mb-0">
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
                                        </div> */}
                                        <div className="col-lg-12 col-12 p-0">
                                            {renderForm()}
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
    .form-label-group {
    position: relative;
    margin-bottom: 1.5rem;
}
.collegeRegistration input {
    margin: 0px !important;
}
.collegeRegistration .row fieldset:nth-of-type(1), .collegeRegistration .row fieldset:nth-of-type(2), .collegeRegistration .row fieldset:nth-of-type(3){
    margin: 0px;
}
.sendOTP{
    height: 40px;
    border-top-left-radius: 0px!important;
    border-bottom-left-radius: 0px!important;
}
.brand-custom {
    width: 30% !important;
}
        `

                }
            </style>

        </div>
    );
};

export default CollegeRegister;