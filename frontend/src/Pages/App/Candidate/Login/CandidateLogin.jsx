import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { trackMetaConversion } from "../../../../utils/conversionTrakingRoutes";
import "./CandidateLogin.css";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css/pagination';
import { useLocation } from 'react-router-dom';



const CandidateLogin = () => {
    const urlLocation = useLocation();

    const queryParams = new URLSearchParams(urlLocation.search);


    const user = sessionStorage.getItem('user');
    const returnUrl = queryParams.get('returnUrl');
    const refCode = queryParams.get("refCode");
    console.log('returnUrl', returnUrl)


    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPC] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

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

    const [sameAddress, setSameAddress] = useState(false);
    const [highestQualificationdata, sethighestQualificationdata] = useState([]);
    const [highestQualification, setHighestQualification] = useState('');
    const inputRef = useRef(null);
    const otpRef = useRef(null);
    const generateOTPRef = useRef(null);



    if (user) {
        if (returnUrl) {

            window.location.href = returnUrl
        }
        else {
            window.location.href = '/candidate/dashboard';
        }
    }


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
                        if (!place || !place.geometry || !place.geometry.location) return;
    
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        let fullAddress = place.formatted_address || place.name || input.value;
    
                        let city = '', state = '', pincode = '';
                        place.address_components?.forEach((component) => {
                            const types = component.types.join(',');
                            if (types.includes("postal_code")) pincode = component.long_name;
                            if (types.includes("locality")) city = component.long_name;
                            if (types.includes("administrative_area_level_1")) state = component.long_name;
                            if (!city && types.includes("sublocality_level_1")) city = component.long_name;
                        });
    
                        setAddress(fullAddress);
                        setCity(city);
                        setState(state);
                        setPC(pincode);
                        setLatitude(lat);
                        setLongitude(lng);
                        setLocation({ place: place.name || '', lat, lng });
    
                        if (sameAddress) setPermanentAddress(fullAddress);
                    });
                }
    
                const permanentInput = document.getElementById('permanent-location');
                if (permanentInput && !sameAddress) {
                    const autocompletePermanent = new window.google.maps.places.Autocomplete(permanentInput, {
                        types: ['geocode'],
                        componentRestrictions: { country: 'in' },
                    });
                
                    autocompletePermanent.addListener('place_changed', () => {
                        const place = autocompletePermanent.getPlace();
                        if (!place || !place.geometry || !place.geometry.location) return;
                
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        let fullAddress = place.formatted_address || place.name || permanentInput.value;
                
                        let city = '', state = '', pincode = '';
                        place.address_components?.forEach((component) => {
                            const types = component.types.join(',');
                            if (types.includes("postal_code")) pincode = component.long_name;
                            if (types.includes("locality")) city = component.long_name;
                            if (types.includes("administrative_area_level_1")) state = component.long_name;
                            if (!city && types.includes("sublocality_level_1")) city = component.long_name;
                        });
                
                        setPermanentAddress(fullAddress);
                        setPermanentLat(lat);
                        setPermanentLng(lng);
                        setPermanentCity(city);
                        setPermanentState(state);
                        setPermanentPincode(pincode);
                    });
                }
                
            } else {
                setTimeout(waitForGoogle, 100);
            }
        };
    
        waitForGoogle();
    }, [showExtraFields, sameAddress]);
    


    const validateMobile = () => {
        const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
        return phoneRegex.test(mobileNumber);
    };
    console.log('address', address)

    const handleGenerateOTP = async () => {
        if (!validateMobile()) {
            setErrorMessage('Please enter the correct mobile number');
            setSuccessMessage('');
            return;
        }
        setShowSetBtn(false);
        setnumberDisable(true);

        try {
            // const response = await axios.post('/api/sendCandidateOtp', { mobile: mobileNumber });
            const res = await axios.post(`${backendUrl}/api/sendCandidateOtp`, { mobile: mobileNumber });
            console.log("OTP Send API Response:", res.data);
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

                try {
                    const qualificationRes = await axios.get(`${backendUrl}/candidate/api/highestQualifications`);
                    if (qualificationRes.data.status) {
                        sethighestQualificationdata(qualificationRes.data.data);
                    }
                    console.log("higherQualificaitons :-", qualificationRes)
                } catch (err) {
                    console.error("Error fetching qualifications:", err);
                }

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
            const res = await axios.post(`${backendUrl}/api/resendOTP`, { mobile: mobileNumber });
            // const res = await axios.get(`${backendUrl}/api/api/resendOTP`, { mobile: mobileNumber });
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
                highestQualification,
                personalInfo: {
                    currentAddress: {
                        type: "Point", // ✅ Always mention type also
                        coordinates: [Number(longitude), Number(latitude)], // ✅ longitude first
                        city,
                        state,
                        fullAddress: address,
                        latitude: String(latitude),
                        longitude: String(longitude)
                    },
                    permanentAddress: {
                        type: "Point",
                        coordinates: [Number(permanentLng), Number(permanentLat)],
                        fullAddress: permanentAddress,
                        latitude: String(permanentLat),
                        longitude: String(permanentLng),
                        city: permanentCity,
                        state: permanentState
                    }

                }
            };

            if (refCode) {
                body.refCode = refCode;
            }
            try {
                // const registerRes = await axios.post('/candidate/register', body);
                const otpVerifyRes = await axios.post(`${backendUrl}/api/verifyOtp`, { mobile: mobileNumber, otp })
                if (otpVerifyRes.data.status) {
                    const registerRes = await axios.post(`${backendUrl}/candidate/register`, body);
                    console.log("OTP Verified, sending data to register API:", body);
                    console.log("Register API response:", registerRes.data);
                    
                    if (registerRes.data.status === "success") {
                        await trackMetaConversion({
                            eventName: isNewUser ? "Signup" : "Login",
                            sourceUrl: window.location.href
                          });
                        const loginRes = await axios.post(`${backendUrl}/api/otpCandidateLogin`, { mobile: mobileNumber });
                        // const loginRes = await axios.post('/api/otpCandidateLogin', { mobile: mobileNumber });
                        if (loginRes.data.status) {
                            localStorage.setItem('name', loginRes.data.name);
                            localStorage.setItem('token', loginRes.data.token);
                            sessionStorage.setItem('user', JSON.stringify(loginRes.data.user));
                            sessionStorage.setItem('candidate', JSON.stringify(loginRes.data.candidate));
                            
                              

                            if (returnUrl) {

                                window.location.href = returnUrl
                            }
                            else {
                                window.location.href = '/candidate/dashboard';
                            }
                        } else {
                            setErrorMessage('Login failed after registration');
                        }
                    } else {
                        setErrorMessage(registerRes.data.error);
                    }
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
                console.log('Verifing OTP')
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
                                eventName: isNewUser ? "Signup" : "Login",
                                sourceUrl: window.location.href
                              });



                            if (returnUrl) {

                                window.location.href = returnUrl
                            }
                            else {
                                window.location.href = '/candidate/dashboard';
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
                setErrorMessage('Error verifying OTP');
            }
        }
    };

    return (

        <div className="app-content blank-page content">
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
                                                <img src="/Assets/images/login_arrow.png" alt="Focalyt logo" class="candid_arrow" />
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


                                {/* Full Name Input */}

                                {/* Gender Select */}

                                {showExtraFields && (
                                    <div className='userMobile'>
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
                                                id="address-location"
                                                placeholder="Current address/ वर्तमान पता"
                                                value={address}
                                                onChange={(e) => {
                                                    setAddress(e.target.value)
                                                    if (sameAddress) setPermanentAddress(e.target.value);
                                                }}

                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="permanent-location"
                                                placeholder="Permanent address/ स्थायी पता"
                                                value={permanentAddress}
                                                onChange={(e) => setPermanentAddress(e.target.value)}
                                                disabled={sameAddress}

                                            />
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={sameAddress}
                                                    onChange={(e) => {
                                                        setSameAddress(e.target.checked);
                                                        if (e.target.checked) {
                                                            setPermanentAddress(address);
                                                        }

                                                    }}


                                                />
                                                Same as Current Address
                                            </label>
                                            <input
                                                type="hidden"
                                                name="state"
                                                placeholder='state'
                                                className="form-control"
                                                id="state-location"
                                                value={state}

                                            />
                                            <input
                                                type="hidden"
                                                name='City'
                                                className="form-control"
                                                id="city-location"
                                                value={city}
                                            />

                                            <input type="hidden" className="form-control" value={latitude} placeholder="Latitude" readOnly />
                                            <input type="hidden" className="form-control" value={longitude} placeholder="Longitude" readOnly />

                                        </div>

                                        <div className="mb-3">
                                            <select onChange={(e) => setHighestQualification(e.target.value)} className="form-control" value={highestQualification} >
                                                <option value="">Highest Qualification / उच्चतम योग्यता</option>
                                                {Array.isArray(highestQualificationdata) &&
                                                    highestQualificationdata.map((q) => (
                                                        <option key={q._id} value={q._id}>
                                                            {q.name}
                                                        </option>
                                                    ))}

                                            </select>

                                        </div>


                                        <div className="mb-3">
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Enter OTP / अपना ओटीपी दर्ज करें"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                ref={otpRef}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'enter') {
                                                        handleVerifyLogin()
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
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
                                <h3 className="my-3">Our Partners</h3>
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
                {` .swiper-pagination-bullet{
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
  background:
linear-gradient(30deg, #FC2B5A, rgba(115, 103, 240, 0.5)) !important;
  box-shadow: 0 0 8px 0 rgba(115, 103, 240, 0.5) !important;
  transform: translateY(0px);
  transition:
all .2s linear;
}  
.btn-primary:hover {
  border-color:
#2e394b !important;
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
  display: flex
;
    justify-content: center;
    align-items: center;
    text-align: center;
}
  `

                }
            </style>
        </div>
    );
};

export default CandidateLogin;