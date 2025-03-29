import React, { useEffect, useState , useRef} from 'react';
import axios from 'axios';
import "./CandidateLogin.css";

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css/pagination';
const backendUrl = process.env.REACT_APP_BASE_URL;

const CandidateLogin = () => {
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [city, setCity] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showNameField, setShowNameField] = useState(false);
    const [showGenderField, setShowGenderField] = useState(false);
    const [showLocationField, setShowLocationField] = useState(false);
    const [showLoginBtn, setShowLoginBtn] = useState(false);
    const [showResendBtn, setShowResendBtn] = useState(false);
    const [resendBtnText, setResendBtnText] = useState('OTP on call');
    const [isResendDisabled, setIsResendDisabled] = useState(false);

    const userInputRef = useRef(null);
    const generateOTPRef = useRef(null);


    const carouselImages = [
        '/Assets/images/logo/cashback-login.png',
        '/Assets/images/logo/near-login.png',
        '/Assets/images/logo/verified-login.png',
        '/Assets/images/logo/cashback-login.png',
        '/Assets/images/logo/getloan.png'
    ];

    const handleMobileNumberKeyPress = (e) => {
        const charCode = e.which ? e.which : e.keyCode;
        if (charCode > 58 || charCode < 48) {
            e.preventDefault();
        }
    };
    
    const handleSendOtp = () => {
        // OTP sending logic
        setSuccessMessage('OTP Sent Successfully');
        setErrorMessage('');
    };
    const handleResendOTP = async (event) => {
        if (isResendDisabled) return;

        event.preventDefault();
        
        try {
            const params = { mobile: mobileNumber };
            const res = await axios.get('/api/resendOTP', { params });

            if (res.data.status === true) {
                setErrorMessage('');
                setSuccessMessage("OTP resend");
                setIsResendDisabled(true);

                let time = 20000;
                const interval = setInterval(() => {
                    time -= 1000;
                    const timeleft = Math.floor((time / 1000) % 60);
                    
                    setResendBtnText(`Resend in ${timeleft} secs`);

                    if (time <= 0) {
                        setResendBtnText('OTP on call');
                        clearInterval(interval);
                        setIsResendDisabled(false);
                    }
                }, 1000);
            } else {
                setErrorMessage(res.data.message);
                setSuccessMessage('');
            }
        } catch (error) {
            setErrorMessage('An error occurred');
        }
    };
    const handleGenerateOTP = async () => {
        try {
            const params = { mobile: mobileNumber };
            const res = await axios.get('/api/generateOTP', { params });

            if (res.data.status === true) {
                // Show additional fields
                setShowNameField(true);
                setShowGenderField(true);
                setShowLocationField(true);
                setShowLoginBtn(true);
                setShowResendBtn(true);
                
                setSuccessMessage('OTP Generated Successfully');
                setErrorMessage('');
            } else {
                setErrorMessage(res.data.message);
            }
        } catch (error) {
            setErrorMessage('An error occurred');
        }
    };


    const handleVerifyLogin = async () => {
        try {
            const loginData = {
                mobile: mobileNumber,
                otp: otp,
                fullName: fullName,
                gender: gender,
                city: city
            };

            const res = await axios.post('/api/verifyLogin', loginData);

            if (res.data.status === true) {
                setSuccessMessage('Login Successful');
                setErrorMessage('');
                // Redirect or do something after successful login
            } else {
                setErrorMessage(res.data.message);
            }
        } catch (error) {
            setErrorMessage('An error occurred');
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
                                    src="/images/logo/logo.png" 
                                    alt="Focalyt logo" 
                                    className="img-fluid w-25 py-1" 
                                />
                            </div>

                            <div className="text-center mb-2">
                                <h4>#Building Future Ready Minds</h4>
                            </div>

                            {/* Carousel Gallery */}
                            <div className="carousel-gallery px-2 mb-2">
                                <div className="d-flex overflow-auto">
                                    {carouselImages.map((img, index) => (
                                        <div key={index} className="mx-2">
                                            <img 
                                                src={img} 
                                                alt={`Slide ${index + 1}`} 
                                                className="img-fluid login-border" 
                                              
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card-body">
                                <h5 className="text-center mb-3">
                                    Candidate Login / Signup
                                    <br />
                                    <small className="text-primary">लॉग इन / साइन अप करें</small>
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
                                        ref={userInputRef}
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
                                <div className="mb-3">
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        placeholder="Enter OTP / अपना ओटीपी दर्ज करें"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>

                                {/* Full Name Input */}
                                <div className="mb-3">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Full Name / पूरा नाम"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

                                {/* Gender Select */}
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

                                {/* City Input */}
                                <div className="mb-3">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="City/ शहर"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>

                                {/* Login Buttons */}
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
                                        <button className="btn btn-primary w-100">
                                            OTP on call
                                        </button>
                                    </div>
                                </div>

                                {/* Error and Success Messages */}
                                {errorMessage && (
                                    <div className="alert alert-danger">{errorMessage}</div>
                                )}
                                {successMessage && (
                                    <div className="alert alert-success">{successMessage}</div>
                                )}

                                {/* Partners Slider */}
                                <h3 className="text-center my-3">Our Partners</h3>
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



// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import "./CandidateLogin.css";

// import { Swiper, SwiperSlide } from 'swiper/react';
// import 'swiper/css';
// import { Pagination, Autoplay } from 'swiper/modules';
// import 'swiper/css/pagination';
// const backendUrl = process.env.REACT_APP_BASE_URL;

// const CandidateLogin = () => {
//     const [mobile, setMobile] = useState('');
//     const [otp, setOtp] = useState('');
//     const [name, setName] = useState('');
//     const [gender, setGender] = useState('');
//     const [location, setLocation] = useState('');
//     const [step, setStep] = useState('input');
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');
//     const [newUser, setNewUser] = useState(false);
//     const [resendDisabled, setResendDisabled] = useState(true);
//     const [resendTimer, setResendTimer] = useState(0);
//     const [intervalId, setIntervalId] = useState(null);
//     // useEffect(() => {
//     //     new Swiper('.carousel-gallery .swiper-container', {
//     //         effect: 'slide',
//     //         speed: 900,
//     //         slidesPerView: 2.5,
//     //         spaceBetween: 10,
//     //         simulateTouch: true,
//     //         autoplay: {
//     //             delay: 5000,
//     //             stopOnLastSlide: false,
//     //             disableOnInteraction: false,
//     //         },
//     //         pagination: {
//     //             el: '.carousel-gallery .swiper-pagination',
//     //             clickable: true,
//     //         },
//     //         breakpoints: {
//     //             320: { slidesPerView: 1.5, spaceBetween: 10 },
//     //             425: { slidesPerView: 1.5, spaceBetween: 10 },
//     //             768: { slidesPerView: 2, spaceBetween: 10 },
//     //             1200: { slidesPerView: 2, spaceBetween: 10 },
//     //             1366: { slidesPerView: 2, spaceBetween: 10 },
//     //         },
//     //     });
//     // }, []);

//     const handleSendOtp = async () => {
//         if (!/^\d{10}$/.test(mobile)) {
//           setError("Please enter the correct mobile number");
//           return;
//         }
      
//         try {
//           const response = await axios.post('/api/sendCandidateOtp', { mobile });
//           if (response.data.newUser) {
//             setNewUser(true);
//           }
      
//           setStep("otp");
//           setSuccess("OTP Sent Successfully");
//           setError("");
      
//           startResendTimer();
//         } catch (err) {
//           setError("Failed to send OTP");
//           setSuccess("");
//         }
//       };
      
//       const startResendTimer = () => {
//         setResendDisabled(true);
//         setResendTimer(20);
      
//         const id = setInterval(() => {
//           setResendTimer((prev) => {
//             if (prev <= 1) {
//               clearInterval(id);
//               setResendDisabled(false);
//               return 0;
//             }
//             return prev - 1;
//           });
//         }, 1000);
      
//         setIntervalId(id);
//       };
      
//       const handleResendOtp = async () => {
//         if (resendDisabled) return;
      
//         try {
//           await axios.get('/api/resendOTP', { params: { mobile } });
//           setSuccess("OTP resend");
//           setError("");
//           startResendTimer();
//         } catch (err) {
//           setError("Error resending OTP");
//         }
//       };

//       const handleVerifyOtp = async () => {
//         if (!otp) {
//           setError("Please Enter OTP");
//           return;
//         }
      
//         if (newUser) {
//           if (!name) return setError("Please Enter Your Name");
//           if (!gender) return setError("Please Select Your Gender");
//           if (!location) return setError("Please Enter Your Location");
      
//           try {
//             const registerBody = {
//               name,
//               mobile,
//               sex: gender,
//               place: location,
//               latitude: "",  // You can get it from Google Places
//               longitude: ""
//             };
      
//             const res = await axios.post("/candidate/register", registerBody);
//             if (res.data.status) {
//               await loginCandidate();
//             } else {
//               setError(res.data.error || "Registration Failed");
//             }
//           } catch (err) {
//             setError("Error during registration");
//           }
      
//         } else {
//           try {
//             const res = await axios.post('/api/verifyOtp', { mobile, otp });
//             if (res.data.status) {
//               setSuccess("OTP Verified");
//               loginCandidate();
//             } else {
//               setError("Incorrect OTP");
//             }
//           } catch (err) {
//             setError("Verification failed");
//           }
//         }
//       };
      
//       const loginCandidate = async () => {
//         try {
//           const res = await axios.post('/api/otpCandidateLogin', { mobile });
//           if (res.data.status) {
//             localStorage.setItem("candidate", res.data.name);
//             localStorage.setItem("token", res.data.token);
//             window.location.href = "/candidate/searchcourses";
//           } else {
//             setError("Login Failed");
//           }
//         } catch (err) {
//           setError("Login failed");
//         }
//       };
//       useEffect(() => {
//         return () => {
//           if (intervalId) clearInterval(intervalId);
//         };
//       }, [intervalId]);
      

//     return (
//         <div className="container mt-5">

//             <section className="row flexbox-container">
//                 <div className="col-xl-5 col-lg-6 col-md-8 col-sm-10 col-12 d-flex justify-content-center mx-auto pr-0 px-2" id="candi_login">
//                     <div className="col-xl-12 card rounded mb-0 shadow px-0">
//                         <div className="row m-0">
//                             <div className="col-xl-12 text-center">
//                                 <img src="/Assets/images/logo/logo.png" alt="Focalyt logo" className="img-fluid brand_logo w-25 py-1" />
//                             </div>
//                             <div className="col-xl-12 col-lg-12 col-sm-12 col-12 col-12 p-0">
//                                 <div className="card mb-0">
//                                     <div className="card-title text-center mb-0">
//                                         <h4>#Building Future Ready Minds</h4>
//                                     </div>

//                                     {/* <!--Carousel Gallery--> */}
//                                     {/* <div className="carousel-gallery px-xl-2 px-lg-2 px-md-2 px-sm-1 px-1 mb-0">
//                                         <div className="swiper-container swiper-container-horizontal">
//                                             <div className="swiper-wrapper text-center" style={{ transform: "translate3d(-251px, 0px, 0px);", transitionDuration: "0ms;" }}>
//                                                 <div className="swiper-slide text-center swiper-slide-prev" style={{ width: "241px;", marginRight: "10px;" }}>
//                                                     <img src="/Assets/images/logo/cashback-login.png" alt="dd" className="img-fluid login-border" />
//                                                 </div>
//                                                 <div className="swiper-slide text-center swiper-slide-active" style={{ width: "241px;", marginRight: "10px;" }}>
//                                                     <img src="/Assets/images/logo/near-login.png" alt="dd" className="img-fluid login-border" />
//                                                 </div>
//                                                 <div className="swiper-slide text-center swiper-slide-next" style={{ width: "241px;", marginRight: "10px;" }}>
//                                                     <img src="/Assets/images/logo/verified-login.png" alt="dd" className="img-fluid login-border" />
//                                                 </div>
//                                                 <div className="swiper-slide text-center" style={{ width: "241px;", marginRight: "10px;" }}>
//                                                     <img src="/Assets/images/logo/cashback-login.png" alt="dd" className="img-fluid login-border" />
//                                                 </div>
//                                                 <div className="swiper-slide text-center" style={{ width: "241px;", marginRight: "10px;" }}>
//                                                     <img src="/Assets/images/logo/getloan.png" alt="dd" className="img-fluid login-border" />
//                                                 </div>
//                                             </div>
//                                             <div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets"><span className="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 1"></span><span className="swiper-pagination-bullet swiper-pagination-bullet-active" tabindex="0" role="button" aria-label="Go to slide 2"></span><span className="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 3"></span><span className="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide 4"></span></div>
//                                             <span className="swiper-notification" aria-live="assertive" aria-atomic="true"></span></div>
//                                     </div> */}
// <div className="carousel-gallery px-xl-2 px-lg-2 px-md-2 px-sm-1 px-1 mb-0">
//                                     <Swiper
//                                         modules={[Pagination, Autoplay]}
//                                         spaceBetween={10}
//                                         slidesPerView={2.5}
//                                         pagination={{ clickable: true }}
//                                         autoplay={{ delay: 5000, disableOnInteraction: false }}
//                                         breakpoints={{
//                                             320: { slidesPerView: 1.5 },
//                                             425: { slidesPerView: 1.5 },
//                                             768: { slidesPerView: 2 },
//                                             1200: { slidesPerView: 2 },
//                                             1366: { slidesPerView: 2 },
//                                         }}
//                                     >
//                                         <SwiperSlide>
//                                             <img src="/Assets/images/logo/cashback-login.png" className="img-fluid login-border" alt="cashback" />
//                                         </SwiperSlide>
//                                         <SwiperSlide>
//                                             <img src="/Assets/images/logo/near-login.png" className="img-fluid login-border" alt="near you" />
//                                         </SwiperSlide>
//                                         <SwiperSlide>
//                                             <img src="/Assets/images/logo/verified-login.png" className="img-fluid login-border" alt="verified" />
//                                         </SwiperSlide>
//                                         <SwiperSlide>
//                                             <img src="/Assets/images/logo/getloan.png" className="img-fluid login-border" alt="loan" />
//                                         </SwiperSlide>
//                                     </Swiper>
//                                     </div>
//                                     {/* <!--#Carousel Gallery--> */}

//                                     <div className="card-content px-xl-0 px-lg-0 px-md-0 px-sm-0 px-0">
//                                         <div className="card-body px-xl-2 px-lg-2 px-md-2 px-sm-1 px-1 py-0">
//                                             <ul className="nav nav-tabs justify-content-left" role="tablist">
//                                                 <li className="nav-item">
//                                                     <a className="nav-link active px-0" id="service-tab-center" data-toggle="tab" href="#" aria-controls="service-center" role="tab" aria-selected="false">
//                                                         <h5 className="color-black font-weight-bold">Candidate Login /
//                                                             Signup</h5>
//                                                         <h5 className="text-primary font-weight-bold mb-0 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-1 mt-1">लॉग इन / साइन
//                                                             अप करें</h5>
//                                                     </a>
//                                                 </li>
//                                             </ul>
//                                             {/* <!-- <div className="col-xl-12 px-0">
//                                                     <p className="color-black">Register Quickly</p>
//                                                     <p className="text-primary">नौकरियां आपका इंतजार कर रही हैं</p>
//                                                 </div>
//                                                 <div className="col-xl-12 px-0">
//                                                     <p className="color-black">Enter your mobile number</p>
//                                                     <p className="text-primary">अपना मोबाइल संख्या दर्ज करे</p>
//                                                 </div>
//                                                 <div className="col-xl-12 px-0">
//                                                     <img src="/images/login-arrow.png" alt="arrow" className="img-fluid"
//                                                         draggable="false" id="arrow_login"/>
//                                                 </div> --> */}
//                                             <div className=" mt-1">
//                                                 <div className="tab-pane active" id="service-center" aria-labelledby="service-tab-center" role="tabpanel">
//                                                     <div className="card rounded-0 mb-0">
//                                                         <div className="card-content">
//                                                             <div className="card-body px-0 pt-xl-1 pt-lg-1 pt-md-1 pt-sm-1 pt-1 pb-1">
//                                                                 {/* <!----------------------> */}

//                                                                 <div className="row ">
//                                                                     <div className="col-xl-9 col-lg-9 col-md-9 col-sm-9 col-9" id="mb_input">
//                                                                         <input type="tel" className="form-control py-2" maxlength="10" onkeypress="if(this.value.length==10) return false;" id="user-input" placeholder="Mobile / मोबाइल" pattern="[0-9]{10}" value="" aria-label="Mobile Number" aria-describedby="basic-addon2" />
//                                                                     </div>
//                                                                     <div className="col text-center pl-0">
//                                                                         <button className="btn btn-primary float-right btn-inline waves-effect waves-light text-white btn-block px-xl-0 px-lg-0 px-md-0 px-sm-0 px-0 py-1" type="button" id="generate-otp"><img src="/Assets/images/login_arrow.png" alt="Focalyt logo" className="candid_arrow" />&nbsp;&nbsp;<span>SEND</span></button>
//                                                                     </div>
//                                                                 </div>


//                                                                 {/* <!----------------------> */}
//                                                                 <fieldset className="form-label-group position-relative has-icon-left mt-2" id="user-otp" style={{ display: "none;" }}>
//                                                                     <input type="number" className="form-control" id="otp-input" placeholder="Enter OTP / अपना ओटीपी दर्ज करें" value="" />
//                                                                     <div className="form-control-position">
//                                                                         <i className="feather icon-send"></i>
//                                                                     </div>
//                                                                     <label for="Enter OTP">Enter
//                                                                         OTP</label>
//                                                                 </fieldset>
//                                                                 <fieldset id="name" className="form-label-group form-group position-relative has-icon-left mt-2" style={{ display: "none;" }}>
//                                                                     <input type="text" className="form-control" id="full-name" onkeypress="if(this.value.length==30) return false" placeholder="Full Name / पूरा नाम" value="" />


//                                                                     <div className="form-control-position">
//                                                                         <i className="feather icon-user"></i>
//                                                                     </div>
//                                                                     <label for="user-name"></label>
//                                                                 </fieldset>

//                                                                 <fieldset id="gender-field" className="form-label-group form-group position-relative has-icon-left" style={{ display: "none;" }}>
//                                                                     <select className="form-control dropdown open" id="gender" placeholder="select">
//                                                                         <option value="">Select Your Gender
//                                                                         </option>
//                                                                         <option value="Female">Female
//                                                                         </option>
//                                                                         <option value="Male">Male</option>
//                                                                     </select>
//                                                                     <div className="form-control-position">
//                                                                         <i className="fa-solid fa-person-half-dress" aria-hidden="true"></i>
//                                                                     </div>

//                                                                     <label for="user-name"></label>
//                                                                 </fieldset>
//                                                                 <fieldset id="location" className="form-label-group form-group position-relative" style={{ display: "none;" }}>
//                                                                     <div className="input-group mb-0">
//                                                                         <div className="input-group-prepend bg-locat">
//                                                                             <div className="input-group-text bg-intext">
//                                                                                 <img src="/Assets/images/isist.png" id="siteforcomp" />
//                                                                             </div>
//                                                                         </div>
//                                                                         <input type="text" className="form-control pac-target-input" id="loc" value="" placeholder="City/ शहर" autocomplete="off" />
//                                                                         <input type="hidden" id="place" name="place" value="" className="form-control" />
//                                                                         <input type="hidden" id="latitude" name="latitude" value="" className="form-control" />
//                                                                         <input type="hidden" id="longitude" name="longitude" value="" className="form-control" />
//                                                                         <label for="user-name"></label>
//                                                                     </div></fieldset>
//                                                                 <div className="row ">
//                                                                     <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
//                                                                         <a className="btn btn-primary float-right btn-inline waves-effect waves-light text-white btn-block" id="verify-login-btn" style={{ display: "none;" }}>
//                                                                             Login / लॉगइन</a>
//                                                                     </div>
//                                                                     <div className="colx-l-6 col-lg-6 col-md-6 col-sm-6 col-6  pl-sm-0 pl-0 ">
//                                                                         <div className="btn btn-primary btn-block waves-effect waves-light text-white btn-block" id="resend-btn" style={{ padding: "0.9rem;", display: "none;" }}>
//                                                                             OTP on call</div>
//                                                                     </div>
//                                                                 </div>
//                                                                 <div className="form-group d-flex justify-content-between align-items-center">
//                                                                 </div>
//                                                                 <div id="error" style={{ color: "red;", fontWeight: "bold;", display: "none;" }}>
//                                                                 </div>
//                                                                 <div id="success" style={{ color: "green;", fontWeight: "bold;", display: "none;" }}>
//                                                                 </div>
//                                                                 <div id="verified" className="pb-1 d-none" style={{ color: "green;", fontWeight: "bold;" }}>
//                                                                     <div id="msg1">
//                                                                         <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
//                                                                         OTP Sent Successfully
//                                                                     </div>
//                                                                     <div id="msg2"> </div>
//                                                                 </div>
//                                                                 <h3 id="login-partner" className="mt-2">Our Partners </h3>
//                                                                 <div className="slider py-0">
//                                                                     <div className="slide-track-1">
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/cashback-login.png" className="img-fluid login-border" alt="cashback" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/arms.png" alt="Focalyt partner" draggable="false" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/utl_solar.png" alt="Focalyt partner" draggable="false" /></SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/dixon.png" alt="Focalyt partner" draggable="false" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/quess.png" alt="Focalyt partner" draggable="false" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/mankind.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/methodex.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/bodycare.jpg" alt="Focalyt partner" draggable="false" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/htw.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/maple.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/satya.jpg" alt="Focalyt partner" draggable="false" className="px-0" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/arms.png" alt="Focalyt partner" draggable="false" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/dixon.png" alt="Focalyt partner" draggable="false" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                         <div className="slide">
//                                                                             <SwiperSlide>
//                                                                                 <img src="/Assets/images/logo/quess.png" alt="Focalyt partner" draggable="false" />
//                                                                             </SwiperSlide>
//                                                                         </div>
//                                                                     </div>
//                                                                 </div>

//                                                                 <p className=" mt-1 mb-0 pt-0 px-0">I agree to <a href="/employersTermsofService" target="_blank">Employer's terms</a>
//                                                                     &amp; <a href="/userAgreement" target="_blank">User Policy</a>.
//                                                                 </p>

//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                                 <div className="tab-pane " id="home-center" aria-labelledby="home-tab-center" role="tabpanel">
//                                                     <div className="card rounded-0 mb-0">
//                                                         <div className="card-content">
//                                                             <div className="card-body p-0">
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div></section>

        

//         </div>
//     );
// };

// export default CandidateLogin;
