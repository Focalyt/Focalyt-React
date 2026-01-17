import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { trackMetaConversion } from "../../../../utils/conversionTrakingRoutes";
import { parseAddressComponents, getCoordinates, isValidPlace } from "../../../../utils/addressUtils";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css/pagination';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { subYears } from "date-fns";
const CandidateLogin = () => {
    const urlLocation = useLocation();
    const queryParams = new URLSearchParams(urlLocation.search);

    const user = sessionStorage.getItem('user');
    const returnUrl = queryParams.get('returnUrl');
    const refCode = queryParams.get("refCode");

    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [Email, setEmail] = useState('');
    const [dob, setDob] = useState(null);
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPC] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    // const [fatherName, setFatherName] = useState('');
    // const [motherName, setMotherName] = useState('');

    const [location, setLocation] = useState({ place: '', lat: '', lng: '' });
    const [isNewUser, setIsNewUser] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);
    const [showSendBtn, setShowSetBtn] = useState(true);
    const [showExtraFields, setShowExtraFields] = useState(false);
    const [showLoginBtn, setShowLoginBtn] = useState(false);
    const [resendBtnText, setResendBtnText] = useState('OTP on call');
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [numberDisable, setnumberDisable] = useState(false);
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

    const [permanentAddress, setPermanentAddress] = useState('');
    const [permanentLat, setPermanentLat] = useState('');
    const [permanentLng, setPermanentLng] = useState('');
    const [permanentCity, setPermanentCity] = useState('');
    const [permanentState, setPermanentState] = useState('');
    const [permanentPincode, setPermanentPincode] = useState('');
    // const [isExperienced, setIsExperience] = useState(null);
    // const [sameAddress, setSameAddress] = useState(false);
    // const [highestQualificationdata, sethighestQualificationdata] = useState([]);
    // const [highestQualification, setHighestQualification] = useState('');
    const inputRef = useRef(null);
    const otpRef = useRef(null);
    const generateOTPRef = useRef(null);

    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            if (returnUrl) {
                window.location.href = returnUrl;
            } else {
                window.location.href = '/candidate/searchjob';
            }
        }
    }, [user, returnUrl]);

    //     useEffect(() => {
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
    useEffect(() => {
        if (!showExtraFields) return;

        const waitForGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                const input = document.getElementById('address-location');
                if (input) {
                    const autocomplete = new window.google.maps.places.Autocomplete(input, {
                        types: ['geocode'],
                        componentRestrictions: { country: 'in' },
                    });

                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (!isValidPlace(place)) return;

                        const coordinates = getCoordinates(place);
                        const addressData = parseAddressComponents(place);

                        setAddress(addressData.fullAddress);
                        setCity(addressData.city);
                        setState(addressData.state);
                        setPC(addressData.pincode);
                        setLatitude(coordinates[1]); // latitude
                        setLongitude(coordinates[0]); // longitude
                        setLocation({ place: place.name || '', lat: coordinates[1], lng: coordinates[0] });

                        // Debug logging
                        console.log('Address Parsed:', {
                            fullAddress: addressData.fullAddress,
                            city: addressData.city,
                            state: addressData.state,
                            pincode: addressData.pincode,
                            coordinates: coordinates,
                            latitude: coordinates[1],
                            longitude: coordinates[0]
                        });

                        // if (sameAddress) {
                        //     setPermanentAddress(addressData.fullAddress);
                        //     setPermanentCity(addressData.city);
                        //     setPermanentState(addressData.state);
                        //     setPermanentPincode(addressData.pincode);
                        //     setPermanentLat(coordinates[1]);
                        //     setPermanentLng(coordinates[0]);
                        // }
                    });
                }

                // const permanentInput = document.getElementById('permanent-location');
                // if (permanentInput && !sameAddress) {
                //     const autocompletePermanent = new window.google.maps.places.Autocomplete(permanentInput, {
                //         types: ['geocode'],
                //         componentRestrictions: { country: 'in' },
                //     });

                //     autocompletePermanent.addListener('place_changed', () => {
                //         const place = autocompletePermanent.getPlace();
                //         if (!isValidPlace(place)) return;

                //         const coordinates = getCoordinates(place);
                //         const addressData = parseAddressComponents(place);

                //         setPermanentAddress(addressData.fullAddress);
                //         setPermanentLat(coordinates[1]); // latitude
                //         setPermanentLng(coordinates[0]); // longitude
                //         setPermanentCity(addressData.city);
                //         setPermanentState(addressData.state);
                //         setPermanentPincode(addressData.pincode);
                //     });
                // }
            } else {
                setTimeout(waitForGoogle, 100);
            }
        };

        waitForGoogle();
    }, [showExtraFields]); // removed sameAddress from dependencies since permanent address is commented out

    const validateMobile = () => {
        const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
        return phoneRegex.test(mobileNumber);
    };

    const validateEmail = (email) => {
        if (!email || email.trim() === '') {
            return true; // Empty email is allowed (optional field)
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const handleGenerateOTP = async () => {
        if (!validateMobile()) {
            setErrorMessage('Please enter the correct mobile number');
            setSuccessMessage('');
            return;
        }
        setShowSetBtn(false);
        setnumberDisable(true);

        try {
            const res = await axios.post(`${backendUrl}/api/sendCandidateOtp`, { mobile: mobileNumber });
            console.log("OTP Send API Response:", res.data);

            setErrorMessage('');
            setSuccessMessage('OTP Sent Successfully');

            if (res.data.newUser) {
                setIsNewUser(true);
                setShowExtraFields(true);
                setShowOtpField(false);
                setShowLoginBtn(true);

                // Commented out - fetching qualifications not needed for now
                // try {
                //     const qualificationRes = await axios.get(`${backendUrl}/candidate/api/highestQualifications`);
                //     if (qualificationRes.data.status) {
                //         sethighestQualificationdata(qualificationRes.data.data || []);
                //     }
                //     console.log("higherQualificaitons :-", qualificationRes);
                // } catch (err) {
                //     console.error("Error fetching qualifications:", err);
                // }
            } else {
                setIsNewUser(false);
                setShowOtpField(true);
                setShowExtraFields(false);
                setShowLoginBtn(true);
                startResendTimer();
            }
        } catch (err) {
            setErrorMessage('Error sending OTP');
            console.error("Error sending OTP:", err);
        }
    };

    const handleResendOTP = async () => {
        if (isResendDisabled || !validateMobile()) return;
        try {
            const res = await axios.post(`${backendUrl}/api/resendOTP`, { mobile: mobileNumber });
            if (res.data.status) {
                setSuccessMessage('OTP resent successfully');
                startResendTimer();
                console.log("response from backend", res);
            } else {
                // Ensure error message is always a string
                const errorMsg = res.data.message;
                setErrorMessage(
                    typeof errorMsg === 'string' 
                        ? errorMsg 
                        : 'Failed to resend OTP'
                );
                console.log("response from backend", res);
            }
        } catch (error) {
            // Ensure error message is always a string
            const errorMsg = error.response?.data?.message || error.message;
            setErrorMessage(
                typeof errorMsg === 'string' 
                    ? errorMsg 
                    : 'Error resending OTP'
            );
            console.error("Error resending OTP:", error);
        }
    };

    const startResendTimer = () => {
        setIsResendDisabled(true);
        let time = 20000;
        const interval = setInterval(() => {
            time -= 1000;
            const timeLeft = Math.floor(time / 1000);
            setResendBtnText(`Resend in ${timeLeft} secs`);
            if (time <= 0) {
                clearInterval(interval);
                setResendBtnText('OTP on call');
                setIsResendDisabled(false);
            }
        }, 1000);
    };

    const handleMobileNumberKeyPress = (e) => {
        const charCode = e.which ? e.which : e.keyCode;
        if (charCode < 48 || charCode > 57) {
            e.preventDefault();
        }
    };

    const handleVerifyLogin = async () => {
        setErrorMessage('');
        setSuccessMessage('');

        if (isNewUser) {
            if (!fullName || !gender || !address || !latitude || !longitude) {
                setErrorMessage('Please fill all required details');
                return;
            }

            // Validate email format if provided
            if (Email && Email.trim() !== '' && !validateEmail(Email)) {
                setErrorMessage('Please enter a valid email address (must contain @ symbol)');
                return;
            }

            try {
                // First verify OTP
                const otpVerifyRes = await axios.post(`${backendUrl}/api/verifyOtp`, {
                    mobile: mobileNumber,
                    otp
                });

                if (otpVerifyRes.data.status) {
                    // Prepare registration body
                    // Create the body object with required fields first
                    const body = {
                        name: fullName,
                        mobile: mobileNumber,
                        sex: gender,
                        // fatherName: fatherName,
                        // motherName: motherName,
                        personalInfo: {
                            currentAddress: {
                                type: "Point",
                                coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0], // [lng, lat] for MongoDB
                                city,
                                state,
                                fullAddress: address,
                                latitude: String(latitude),
                                longitude: String(longitude),

                            },
                            permanentAddress: {
                                type: "Point",
                                coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0], // [lng, lat] for MongoDB - using current address since permanent address field is commented out
                                fullAddress: address || '',
                                latitude: String(latitude),
                                longitude: String(longitude),
                                city: city || '',
                                state: state || '',
                            }
                            // Note: Using current address for permanent address since permanent address field is commented out
                            // Original permanent address code (commented):
                            // permanentAddress: {
                            //     type: "Point",
                            //     coordinates: [parseFloat(permanentLng) || 0, parseFloat(permanentLat) || 0],
                            //     fullAddress: permanentAddress,
                            //     latitude: String(permanentLat),
                            //     longitude: String(permanentLng),
                            //     city: permanentCity,
                            //     state: permanentState,
                            // }
                        }
                    };

                    // Only add email if it's not empty
                    if (Email && Email.trim() !== '') {
                        body.email = Email.trim();
                    }

                    // Only add dob if it's not empty
                    if (dob) {
                        body.dob = dob.toISOString().split('T')[0]; // YYYY-MM-DD format
                    }

                    // Commented out - highestQualification and isExperienced not required for new registration
                    // Only add highestQualification if it's not empty
                    // if (highestQualification && highestQualification.trim() !== '') {
                    //     body.highestQualification = highestQualification.trim();
                    // }

                    // if (isExperienced !== undefined && isExperienced !== null) {
                    //     if (typeof isExperienced === 'string') {
                    //         body.isExperienced = isExperienced === 'true';
                    //     } else if (typeof isExperienced === 'boolean') {
                    //         body.isExperienced = isExperienced;
                    //     }
                    // }

                    if (refCode) {
                        body.refCode = refCode;
                    }
                    console.log("body...", body);
                    // Register the new user
                    const registerRes = await axios.post(`${backendUrl}/candidate/register`, body);
                    console.log("Register API response:", registerRes.data);

                    if (registerRes.data.status === "success") {

                        const loginRes = await axios.post(`${backendUrl}/api/otpCandidateLogin`, { mobile: mobileNumber });
                        // const loginRes = await axios.post('/api/otpCandidateLogin', { mobile: mobileNumber });
                        if (loginRes.data.status) {
                            localStorage.setItem('name', loginRes.data.name);
                            localStorage.setItem('token', loginRes.data.token);
                            sessionStorage.setItem('user', JSON.stringify(loginRes.data.user));
                            sessionStorage.setItem('candidate', JSON.stringify(loginRes.data.candidate));


                            if (returnUrl) {
                                window.location.href = returnUrl;
                            } else {
                                window.location.href = '/candidate/searchjob';
                            }
                            await trackMetaConversion({
                                eventName: "Signup",
                                sourceUrl: window.location.href

                            });
                            await trackMetaConversion({
                                eventName: "Login",
                                sourceUrl: window.location.href
                            });
                        } else {
                            setErrorMessage('Login failed after registration');
                        }
                    } else {
                        // Ensure error message is always a string
                        const errorMsg = registerRes.data.error;
                        setErrorMessage(
                            typeof errorMsg === 'string' 
                                ? errorMsg 
                                : errorMsg?.message || JSON.stringify(errorMsg) || 'Registration failed'
                        );
                    }
                }
            } catch (err) {
                // Ensure error message is always a string
                const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
                setErrorMessage(
                    typeof errorMsg === 'string' 
                        ? errorMsg 
                        : 'Something went wrong during registration'
                );
            }
        } else {
            if (!otp || otp.length !== 4) {
                setErrorMessage('Please enter valid OTP');
                return;
            }
            try {
                // const verifyRes = await axios.post('/api/verifyOtp', { mobile: mobileNumber, otp });
                const otpVerifyRes = await axios.post(`${backendUrl}/api/verifyOtp`, { mobile: mobileNumber, otp })
                if (otpVerifyRes.data.status) {
                    // const loginRes = await axios.post('/api/otpCandidateLogin', { mobile: mobileNumber });
                    const loginRes = await axios.post(`${backendUrl}/api/otpCandidateLogin`, { mobile: mobileNumber });
                    if (loginRes.data.status) {
                        const token = loginRes.data.token;
                        const verificationBody = { mobile: mobileNumber, verified: true }
                        const headers = { headers: { 'x-auth': token } };
                        const verifyRes = await axios.post(`${backendUrl}/candidate/verification`, verificationBody, headers);
                        if (verifyRes.data.status) {
                            localStorage.setItem('candidate', loginRes.data.name);
                            localStorage.setItem('token', loginRes.data.token);
                            sessionStorage.setItem('user', JSON.stringify(loginRes.data.user));

                            await trackMetaConversion({
                                eventName: "Login",
                                sourceUrl: window.location.href
                            });



                            if (returnUrl) {

                                window.location.href = returnUrl
                            }
                            else {
                                window.location.href = '/candidate/searchjob';
                            }


                            // const verificationRes = await axios.post('/candidate/verification', verificationBody, headers);
                            // const verificationRes = await axios.post(`${backendUrl}/candidate/verification`, verificationBody, headers)
                            // if (verificationRes.data.status) {
                            // }
                        } else {
                            setErrorMessage('Login failed after OTP verification');
                        }
                    }
                } else {
                    setErrorMessage('Incorrect OTP');
                }
            } catch (err) {
                console.error("Registration error:", err);
                setErrorMessage('Something went wrong during registration');
            }
        }

    };

    return (
        <div className="app-content blank-page content marginLeft">
            <div className="content-wrapper mt-4">
                <section className="row flexbox-container">
                    <div className="col-xl-5 col-lg-6 col-md-8 col-sm-10 col-12 mx-auto">
                        <div className="card rounded mb-0 shadow">
                            <div className="text-center py-2">
                                <img
                                    src="/Assets/images/logo/logo.png"
                                    alt="Focalyt logo"
                                    className="img-fluid w-25 py-1"
                                />
                            </div>

                            <div className="card-title text-center mb-0">
                                <h4 className='readyMinds'>#Building Future Ready Minds</h4>
                            </div>

                            <div className="carousel-gallery px-xl-2 px-lg-2 px-md-2 px-sm-1 px-1 mb-0">
                                <Swiper
                                    modules={[Pagination, Autoplay]}
                                    spaceBetween={10}
                                    slidesPerView={2.5}
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                                    breakpoints={{
                                        320: { slidesPerView: 1.5 },
                                        425: { slidesPerView: 1.5 },
                                        768: { slidesPerView: 2 },
                                        1200: { slidesPerView: 2 },
                                        1366: { slidesPerView: 2 },
                                    }}
                                >
                                    {/* <SwiperSlide>
                                        <img src="/Assets/images/logo/cashback-login.png" className="img-fluid login-border" alt="cashback" />
                                    </SwiperSlide> */}
                                    <SwiperSlide>
                                        <img src="/Assets/images/logo/near-login.png" className="img-fluid login-border" alt="near you" />
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <img src="/Assets/images/logo/verified-login.png" className="img-fluid login-border" alt="verified" />
                                    </SwiperSlide>
                                    {/* <SwiperSlide>
                                        <img src="/Assets/images/logo/getloan.png" className="img-fluid login-border" alt="loan" />
                                    </SwiperSlide> */}
                                </Swiper>
                            </div>

                            <div className="card-body">
                                <h5 className="text-left mb-3 spanAfter">
                                    Candidate Login / Signup
                                    <br />
                                    <small className="text-primary" style={{ color: "#FC2B5A" }}>लॉग इन / साइन अप करें</small>
                                </h5>

                                {/* Mobile Number Input */}
                                <div className="row mb-3">
                                    <div className={`${showSendBtn ? 'col-9' : 'col-12'} userMobile`}>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Mobile / मोबाइल"
                                            maxLength="10"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            onKeyPress={handleMobileNumberKeyPress}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleGenerateOTP();
                                                }
                                            }}
                                            ref={inputRef}
                                            disabled={numberDisable}
                                        />
                                    </div>
                                    {showSendBtn && (
                                        <div className="col-3">
                                            <button
                                                className="btn btn-primary sendBtnn w-100"
                                                onClick={handleGenerateOTP}
                                                ref={generateOTPRef}
                                            >
                                                <img src="/Assets/images/login_arrow.png" alt="Focalyt logo" className="candid_arrow" />
                                                SEND
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* OTP Input */}
                                {showOtpField && (
                                    <div className="mb-3">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Enter OTP / अपना ओटीपी दर्ज करें"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            ref={otpRef}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleVerifyLogin();
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Additional fields for new users */}
                                {showExtraFields && (
                                    <div className='userMobile'>
                                        <div className="mb-3">
                                            <input
                                                type="email"
                                                className={`form-control ${Email && Email.trim() !== '' && !validateEmail(Email) ? 'is-invalid' : ''}`}
                                                placeholder='Enter Email '
                                                value={Email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setErrorMessage(''); // Clear error on change
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value && e.target.value.trim() !== '' && !validateEmail(e.target.value)) {
                                                        setErrorMessage('Please enter a valid email address (must contain @ symbol)');
                                                    }
                                                }}
                                            />
                                            {Email && Email.trim() !== '' && !validateEmail(Email) && (
                                                <div className="invalid-feedback">
                                                    Please enter a valid email address (must contain @ symbol)
                                                </div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Full Name / पूरा नाम"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>
                                        {/* <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Father Name / पिता का नाम"
                                                value={fatherName}
                                                onChange={(e) => setFatherName(e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Mother Name / माँ का नाम"
                                                value={motherName}
                                                onChange={(e) => setMotherName(e.target.value)}
                                            />
                                        </div> */}

                                        <div className="mb-3 datepicker-wrapper">

                                        <DatePicker
                                                selected={dob}
                                                onChange={(date) => setDob(date)}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Select DOB / जन्म तिथि चुनें"
                                                className="form-control"
                                                showYearDropdown
                                                scrollableYearDropdown
                                                yearDropdownItemNumber={100}
                                                maxDate={subYears(new Date(), 7)}
                                                showMonthDropdown
                                                dropdownMode="select"
                                                wrapperClassName="datepicker-input-wrapper"
                                            />

                                        </div>
                                        <div className="mb-3">
                                            <select
                                                className="form-control"
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                            >
                                                <option value="">Select Your Gender</option>
                                                <option value="Female">Female</option>
                                                <option value="Male">Male</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="address-location"
                                                placeholder="Current address/ वर्तमान पता"
                                                value={address}
                                                onChange={(e) => {
                                                    setAddress(e.target.value);
                                                    // if (sameAddress) setPermanentAddress(e.target.value);
                                                }}
                                            />
                                        </div>
                                        {/* <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="permanent-location"
                                                placeholder="Permanent address/ स्थायी पता"
                                                value={permanentAddress}
                                                onChange={(e) => setPermanentAddress(e.target.value)}
                                                disabled={sameAddress}
                                            />
                                            <div className="form-check mt-2">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="sameAddressCheck"
                                                    checked={sameAddress}
                                                    onChange={(e) => {
                                                        setSameAddress(e.target.checked);
                                                        if (e.target.checked) {
                                                            setPermanentAddress(address);
                                                            setPermanentCity(city);
                                                            setPermanentState(state);
                                                            setPermanentPincode(pincode);
                                                            setPermanentLat(latitude);
                                                            setPermanentLng(longitude);
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor="sameAddressCheck">
                                                    Same as Current Address
                                                </label>
                                            </div>
                                        </div> */}

                                        {/* <div className="mb-3">
                                            <select
                                                onChange={(e) => setHighestQualification(e.target.value)}
                                                className="form-control"
                                                value={highestQualification}
                                            >
                                                <option value="">Highest Qualification / उच्चतम योग्यता</option>
                                                {Array.isArray(highestQualificationdata) &&
                                                    highestQualificationdata.map((q) => (
                                                        <option key={q._id} value={q._id}>
                                                            {q.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div className="form-group mb-2">
                                            <select onChange={(e) => setIsExperience(e.target.value)} className="form-control" value={isExperienced}>
                                                <option value="">Experience / अनुभव</option>
                                                <option value='false'>Fresher</option>
                                                <option value='true'>Experienced</option>


                                            </select>
                                        </div> */}

                                        <div className="mb-3">
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Enter OTP / अपना ओटीपी दर्ज करें"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleVerifyLogin();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {showLoginBtn && (
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={handleVerifyLogin}
                                            >
                                                Login / लॉगइन
                                            </button>
                                        </div>
                                        <div className="col-6">
                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={handleResendOTP}
                                                disabled={isResendDisabled}
                                            >
                                                {resendBtnText}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Error and Success Messages */}
                                {errorMessage && (
                                    <div className="alert alert-danger">{errorMessage}</div>
                                )}
                                {successMessage && (
                                    <div className="alert alert-success">{successMessage}</div>
                                )}

                                {/* Partners Slider */}
                                <h3 className="my-3">Our Partners</h3>
                                <div className="slider py-0">
                                    <div className="slide-track-1">
                                        <div className="slide">
                                            <img src="/Assets/images/logo/cashback-login.png" className="img-fluid login-border" alt="cashback" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/arms.png" alt="Focalyt partner" draggable="false" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/utl_solar.png" alt="Focalyt partner" draggable="false" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/dixon.png" alt="Focalyt partner" draggable="false" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/quess.png" alt="Focalyt partner" draggable="false" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/mankind.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/methodex.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/bodycare.jpg" alt="Focalyt partner" draggable="false" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/htw.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/maple.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/satya.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/arms.png" alt="Focalyt partner" draggable="false" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/dixon.png" alt="Focalyt partner" draggable="false" />
                                        </div>
                                        <div className="slide">
                                            <img src="/Assets/images/logo/quess.png" alt="Focalyt partner" draggable="false" />
                                        </div>
                                    </div>
                                </div>

                                {/* Terms Agreement */}
                                <p className="mt-3">
                                    I agree to <a href="/employersTermsofService" target="_blank">Employer's terms</a>
                                    {' '} & {' '}
                                    <a href="/userAgreement" target="_blank">User Policy</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <style>
                {`
                .marginLeft{
                    margin-left:0px!important;
                    overflow-x: hidden;
                }
                .swiper-pagination-bullet{
                    width: 5px;
                    height: 5px;
                    background-color:#d63031;
                }
                .text-primary {
                    color: #FC2B5A!important;
                }
                .spanAfter {
                    position: relative;
                    display: inline-block;
                }
                .spanAfter::after {
                    content: attr(data-before);
                    height: 2px;
                    width: 100%;
                    left: 0;
                    position: absolute;
                    bottom: 0;
                    top: 100%;
                    background: linear-gradient(30deg, #FC2B5A, rgba(115, 103, 240, 0.5)) !important;
                    box-shadow: 0 0 8px 0 rgba(115, 103, 240, 0.5) !important;
                    transform: translateY(0px);
                    transition: all .2s linear;
                }  
                .btn-primary:hover {
                    border-color: #2e394b !important;
                    color: #fff !important;
                    box-shadow: 0 8px 25px -8px #FC2B5A;
                }
                .btn-primary:hover {
                    color: #fff;
                    background-color: #5344ed!important;
                    border-color:#4839eb!important;
                }
                .btn-primary{
                    border: 1px solid #FC2B5A;
                }
                .userMobile input.form-control:focus,
                .userMobile select.form-control:focus,
                .userMobile textarea.form-control:focus {
                    border: 1px solid #FC2B5A !important;
                    outline: none !important;
                    box-shadow: none !important;
                }
                .userMobile input.form-control,
                .userMobile select.form-control,
                .userMobile textarea.form-control {
                    transition: border 0.3s ease;
                }
                .candid_arrow {
                    width: 17%;
                    margin-right: 5px
                }
                .sendBtnn{
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
                `}
            </style>
            <style>
                {

                    `
                    .blank-page{
   background:url(/Assets/images/logo/rename.webp) repeat; 
//   background:url(../../../../../public/Assets/public/images/logo/rename.webp) repeat;
    background-size: auto;
  background-size: contain!important;
  height:100vh;
}

/* .blank-page {
  margin: 0px !important;
  height: 100vh!important;
}    */

.text-primary{
  color: #FC2B5A!important;
}
/* .btn{
  border: 1px solid #FC2B5A!important;
} */
.card-title.text-center.mb-0{
    border-top: 3px solid #f2f0f8;
    border-bottom: 3px solid #f2f0f8;
}
.carousel-gallery {
    margin: 20px 0;
}
.carousel-gallery img{
    border-radius: 10px;
}
.carousel-gallery .swiper-pagination-horizontal{
    position: relative;
    top: 0!important;
}

.nav.nav-tabs {
    border: none;
    margin-bottom: 1rem;
    position: relative;
    border-radius: 0;
}

/* login page slider  */

#login-partner{
    font-weight: 600;
    color: #FC2B5A;
  }
  .slider {
    background: transparent;
    /* height: 60pt!important; */
    margin: 0 auto;
    overflow: hidden;
    position: relative;
    cursor: default;
    user-select: none;
    touch-action: none;
  }
  
  .slider:before {
    left: 0;
    top: 0;
  }
  .slider:after,
  .slider:before {
    background: transparent;
    content: "";
    height: auto;
    position: absolute;
    width: 200px;
    z-index: 2;
  }
  .slider:after {
    right: 0;
    top: 0;
    transform: rotateZ(180deg);
  }
  .slider:after,
  .slider:before {
    background: transparent;
    content: "";
    height: auto;
    position: absolute;
    width: 200px;
    z-index: 2;
  }
  
  .slider .slide-track-1 {
    animation: scroll-l 37s linear infinite;
    display: flex;
    width: 3500px;
  }
  .slider .slide-track-2 {
    animation: scroll-r 30s linear infinite;
    display: flex;
    width: 3500px;
  }
  
  .slider .slide {
    height: 45pt;
    width: 180px!important;
    display: flex;
    align-items: center;
    text-align: center;
  }
  .slider .slide img {
    width: 150px;
    padding: 0px 10px;
    vertical-align: middle;
    margin: 0 auto;
    display: inline-block;
    max-width: 100%;
    height: auto;
  }
  
  @keyframes scroll-l {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(calc(-250px * 7));
    }
  }
  @keyframes scroll-r {
    100% {
        transform: translateX(0);
    }
    0% {
        transform: translateX(calc(-250px * 7));
    }
  }
  /* login page slider end */
  .card-title.text-center.mb-0 {
    border-top: 3px solid #f2f0f8;
    border-bottom: 3px solid #f2f0f8;
  }
  .readyMinds{
    margin: 0;
    padding-block: 5px;
  }
    .datepicker-input-wrapper{
    width: 100%;
    }
                    `
                }
            </style>
        </div>
    );
};

export default CandidateLogin;