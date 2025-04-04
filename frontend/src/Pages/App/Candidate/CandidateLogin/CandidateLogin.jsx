import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import "./CandidateLogin.css";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css/pagination';


const CandidateLogin = () => {
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [city, setCity] = useState('');
    const [location, setLocation] = useState({ place: '', lat: '', lng: '' });
    const [isNewUser, setIsNewUser] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);
    const [showExtraFields, setShowExtraFields] = useState(false);
    const [showLoginBtn, setShowLoginBtn] = useState(false);
    const [resendBtnText, setResendBtnText] = useState('OTP on call');
    const [isResendDisabled, setIsResendDisabled] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

    const inputRef = useRef(null);
    const otpRef = useRef(null);
    const generateOTPRef = useRef(null);

    useEffect(() => {
        const loadGooglePlaces = () => {
            const options = {
                componentRestrictions: { country: 'in' },
                types: ['(cities)']
            };
            const autocomplete = new window.google.maps.places.Autocomplete(
                document.getElementById('city-location'),
                options
            );
            autocomplete.addListener('place_changed', function () {
                const place = autocomplete.getPlace();
                setLocation({
                    place: place.name,
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
                setCity(place.name);
            });
        };

        if (window.google) {
            loadGooglePlaces();
        } else {
            window.initMap = loadGooglePlaces;
        }
    }, []);

    const validateMobile = () => {
        const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
        return phoneRegex.test(mobileNumber);
    };

    const handleGenerateOTP = async () => {
        if (!validateMobile()) {
            setErrorMessage('Please enter the correct mobile number');
            setSuccessMessage('');
            return;
        }

        try {
            // const response = await axios.post('/api/sendCandidateOtp', { mobile: mobileNumber });
            const res = await axios.post(`${backendUrl}/api/sendCandidateOtp`, { mobile: mobileNumber });
            setShowOtpField(true);
            setShowLoginBtn(true);
            setErrorMessage('');
            setSuccessMessage('OTP Sent Successfully');
            console.log("otp send successfully", res);
            if (res.data.newUser) {
                setIsNewUser(true);
                setShowExtraFields(true);
                setShowOtpField(false);
                setShowLoginBtn(true);
            } else {
                setIsNewUser(false);
                setShowOtpField(true);
                setShowExtraFields(false);
                setShowLoginBtn(true);
                startResendTimer();
            }
        } catch (err) {
            setErrorMessage('Error sending OTP');
        }
    };

    const handleResendOTP = async () => {
        if (isResendDisabled || !validateMobile()) return;
        try {
            // const res = await axios.get('/api/resendOTP', { params: { mobile: mobileNumber } });
            const res = await axios.post(`${backendUrl}/api/sendCandidateOtp`, { mobile: mobileNumber });
            if (res.data.status) {
                setSuccessMessage('OTP resent successfully');
                startResendTimer();
                console.log("response from backend", res)
            } else {
                setErrorMessage(res.data.message);
                console.log("response from backend", res)

            }
        } catch (error) {
            setErrorMessage('Error resending OTP');
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
        if (isNewUser) {
            if (!fullName || !gender || !city || !location.lat || !location.lng) {
                setErrorMessage('Please fill all details');
                return;
            }
            const body = {
                name: fullName,
                mobile: mobileNumber,
                sex: gender,
                place: location.place,
                latitude: location.lat,
                longitude: location.lng
            };
            try {
                // const registerRes = await axios.post('/candidate/register', body);
                const registerRes = await axios.post(`${backendUrl}/candidate/register`, body);

                if (registerRes.data.status) {
                    const loginRes = await axios.post(`${backendUrl}/api/otpCandidateLogin`, { mobile: mobileNumber });
                    // const loginRes = await axios.post('/api/otpCandidateLogin', { mobile: mobileNumber });
                    if (loginRes.data.status) {
                        localStorage.setItem('candidate', loginRes.data.name);
                        localStorage.setItem('token', loginRes.data.token);
                        window.location.href = '/candidate/searchcourses';
                    } else {
                        setErrorMessage('Login failed after registration');
                    }
                } else {
                    setErrorMessage(registerRes.data.error);
                }
            } catch (err) {
                setErrorMessage('Something went wrong during registration');
            }
        } else {
            if (!otp || otp.length !== 4) {
                setErrorMessage('Please enter valid OTP');
                return;
            }
            try {
                // const verifyRes = await axios.post('/api/verifyOtp', { mobile: mobileNumber, otp });
                const verifyRes = await axios.post(`${backendUrl}/api/verifyOtp`, { mobile: mobileNumber })
                if (verifyRes.data.status) {
                    // const loginRes = await axios.post('/api/otpCandidateLogin', { mobile: mobileNumber });
                    const loginRes = await axios.post(`${backendUrl}/api/otpCandidateLogin`, { mobile: mobileNumber });
                    if (loginRes.data.status) {
                        localStorage.setItem('candidate', loginRes.data.name);
                        localStorage.setItem('token', loginRes.data.token);
                        const token = loginRes.data.token;
                        const verificationBody = { mobile: mobileNumber, verified: true };
                        const headers = { headers: { 'x-auth': token } };

                        // const verificationRes = await axios.post('/candidate/verification', verificationBody, headers);
                        const verificationRes = await axios.post(`${backendUrl}/candidate/verification`, verificationBody, headers)
                        if (verificationRes.data.status) {
                            window.location.href = '/candidate/searchcourses';
                        }
                    } else {
                        setErrorMessage('Login failed after OTP verification');
                    }
                } else {
                    setErrorMessage('Incorrect OTP');
                }
            } catch (err) {
                setErrorMessage('Error verifying OTP');
            }
        }
    };

    return (
        <div className="app-content content">
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

                            <div className="text-center mb-2">
                                <h4>#Building Future Ready Minds</h4>
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
                                    <SwiperSlide>
                                        <img src="/Assets/images/logo/cashback-login.png" className="img-fluid login-border" alt="cashback" />
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <img src="/Assets/images/logo/near-login.png" className="img-fluid login-border" alt="near you" />
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <img src="/Assets/images/logo/verified-login.png" className="img-fluid login-border" alt="verified" />
                                    </SwiperSlide>
                                    <SwiperSlide>
                                        <img src="/Assets/images/logo/getloan.png" className="img-fluid login-border" alt="loan" />
                                    </SwiperSlide>
                                </Swiper>
                            </div>


                            <div className="card-body">
                                <h5 className="text-left mb-3">
                                    Candidate Login / Signup
                                    <br />
                                    <small className="text-primary" style={{ color: "#FC2B5A" }}>लॉग इन / साइन अप करें</small>
                                </h5>

                                {/* Mobile Number Input */}
                                <div className="row mb-3">
                                    <div className="col-9">
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Mobile / मोबाइल"
                                            maxLength="10"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            onKeyPress={handleMobileNumberKeyPress}
                                            ref={inputRef}
                                        />
                                    </div>
                                    <div className="col-3">
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={handleGenerateOTP}
                                            ref={generateOTPRef}
                                        >
                                            SEND
                                        </button>
                                    </div>
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
                                        />
                                    </div>
                                )}


                                {/* Full Name Input */}

                                {/* Gender Select */}

                                {showExtraFields && (
                                    <>
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Full Name / पूरा नाम"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
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
                                                id="city-location"
                                                placeholder="City/ शहर"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                {showLoginBtn && (
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <button className="btn btn-primary w-100" onClick={handleVerifyLogin}>
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
                                <h3 className="text-center my-3">Our Partners</h3>
                                <div className="slider py-0">
                                    <div className="slide-track-1">
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/cashback-login.png" className="img-fluid login-border" alt="cashback" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/arms.png" alt="Focalyt partner" draggable="false" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/utl_solar.png" alt="Focalyt partner" draggable="false" /></SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/dixon.png" alt="Focalyt partner" draggable="false" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/quess.png" alt="Focalyt partner" draggable="false" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/mankind.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/methodex.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/bodycare.jpg" alt="Focalyt partner" draggable="false" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/htw.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/maple.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/satya.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/arms.png" alt="Focalyt partner" draggable="false" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/dixon.png" alt="Focalyt partner" draggable="false" />
                                            </SwiperSlide>
                                        </div>
                                        <div className="slide">
                                            <SwiperSlide>
                                                <img src="/Assets/images/logo/quess.png" alt="Focalyt partner" draggable="false" />
                                            </SwiperSlide>
                                        </div>
                                    </div>
                                </div>



                                {/* Terms Agreement */}
                                <p className="text-center mt-3">
                                    I agree to <a href="/employersTermsofService" target="_blank">Employer's terms</a>
                                    {' '} & {' '}
                                    <a href="/userAgreement" target="_blank">User Policy</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CandidateLogin;