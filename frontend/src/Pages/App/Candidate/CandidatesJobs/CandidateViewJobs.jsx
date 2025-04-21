import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { Fancybox } from '@fancyapps/ui';




const CandidateViewJobs = () => {
  const { JobId } = useParams();
  const [jobDetails, setJobDetails] = useState(null);
  const [address, setAddress] = useState('');
  const [highestQualificationdata, sethighestQualificationdata] = useState([]);
  
  const [totalExperience, setTotalExperience] = useState('');
  const [highestQualification, setHighestQualification] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPC] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [location, setLocation] = useState({ place: '', lat: '', lng: '' });
  const [candidate, setCandidate] = useState(null);
  const [isApplied, setIsApplied] = useState(false);
  const [isRegisterInterview, setIsRegisterInterview] = useState(false);
  const [canApply, setCanApply] = useState(false);
  const [hasCredit, setHasCredit] = useState(true);
  const [coins, setCoins] = useState(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAfterApplyModal, setShowAfterApplyModal] = useState(false);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showCoinOfferModal, setShowCoinOfferModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMessage, setVoucherMessage] = useState({ type: '', message: '' });
  const [amount, setAmount] = useState(0);
  const [offerAmount, setOfferAmount] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const videoRef = useRef(null);


  useEffect(() => {
    if (JobId) {
      fetchJobDetails();
    }
    if (!canApply) {
      waitForGoogle();
    }
  }, [JobId]);

  useEffect(() => {
    if (showApplyModal && !canApply) {
      setTimeout(() => {
        waitForGoogle();
      }, 100); // Delay thoda dena zaroori hota hai modal ke open hone ke baad DOM render ke liye
    }
  }, [showApplyModal]);
  



    const waitForGoogle = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        const input = document.getElementById('address-location');
        if (!input) {
          console.warn('Input not found yet');
          return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['geocode'],
          componentRestrictions: { country: 'in' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            console.warn('Invalid place data.');
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          let fullAddress = '';
          if (place.formatted_address) fullAddress = place.formatted_address;
          else if (place.name) fullAddress = place.name;
          else if (input.value) fullAddress = input.value;

          let city = '', state = '', pincode = '';

          if (Array.isArray(place.address_components)) {
            place.address_components.forEach((component) => {
              const types = component.types.join(',');
              if (types.includes("postal_code")) pincode = component.long_name;
              if (types.includes("locality")) city = component.long_name;
              if (types.includes("administrative_area_level_1")) state = component.long_name;
              if (!city && types.includes("sublocality_level_1")) city = component.long_name;
            });
          }

          setAddress(fullAddress);
          setCity(city);
          setState(state);
          setLatitude(lat);
          setLongitude(lng);
          setLocation({ place: place.name || '', lat, lng });
        });
      } else {
        setTimeout(waitForGoogle, 100);
      }
    };

    


  useEffect(() => {
    // Initialize Swiper for gallery
    if (jobDetails && jobDetails._company && jobDetails._company.mediaGallery && jobDetails._company.mediaGallery.length > 0) {
      new Swiper('.carousel-gallery .swiper-container', {
        effect: 'slide',
        speed: 900,
        slidesPerView: 3,
        spaceBetween: 5,
        simulateTouch: true,
        autoplay: {
          delay: 5000,
          stopOnLastSlide: false,
          disableOnInteraction: false
        },
        pagination: {
          el: '.carousel-gallery .swiper-pagination',
          clickable: true
        },
        breakpoints: {
          320: {
            slidesPerView: 1,
            spaceBetween: 2
          },
          425: {
            slidesPerView: 2,
            spaceBetween: 2
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 2
          }
        }
      });

      // Initialize FancyBox for gallery
      Fancybox.bind("[data-fancybox]", {});
    }
  }, [jobDetails]);

  useEffect(() => {
      if (candidate) {
        setSex(candidate.sex || '');
        setDob(candidate.dob ? moment(candidate.dob).format("YYYY-MM-DD") : '');
        setTotalExperience(candidate.personalInfo.totalExperience || '');
        setHighestQualification(candidate.highestQualification?._id || '');
        setAddress(candidate.personalInfo.location?.fullAddress || '');
      }
    }, [candidate]);

  const handleVideoModal = (videoUrl) => {
    const videoModal = document.getElementById('videoModal');
    const videoElement = document.getElementById('vodeoElement');

    if (videoElement) {
      videoElement.src = videoUrl;
    }

    if (videoRef.current) {
      videoRef.current.load();
    }

    // Show modal
    videoModal.classList.add('show');
    videoModal.style.display = 'block';
    document.body.classList.add('modal-open');
  };

  const closeVideoModal = () => {
    const videoModal = document.getElementById('videoModal');

    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Hide modal
    videoModal.classList.remove('show');
    videoModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    document.getElementsByClassName('modal-backdrop')[0]?.remove();
  };
  const fetchJobDetails = async () => {
    try {
      console.log('jobId', JobId)
      const response = await axios.get(`${backendUrl}/candidate/job/${JobId}`, {
        headers: {
          'x-auth': localStorage.getItem('token'),
        },
      });
      const data = response.data;
      console.log('response', data)
      setJobDetails(data.jobDetails);
      sethighestQualificationdata(response.data.highestQualification);

      setCandidate(data.candidate);
      setIsApplied(data.isApplied);
      setIsRegisterInterview(data.isRegisterInterview);
      setCanApply(data.canApply);
      setHasCredit(data.hasCredit);
      setCoins(data.coins);
      setMobileNumber(data.mobileNumber);
      setReviewed(data.reviewed);
      setCourses(data.course || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setLoading(false);
    }
  };

  const applyJob = async () => {
    try {
      const response = await axios.post(`${backendUrl}/candidate/job/${JobId}/apply`, {}, {
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      if (response.data.status) {
        setIsApplied(true);
        setShowApplyModal(false);
        setShowAfterApplyModal(true);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
    }
  };

  const registerForInterview = async () => {
    try {
      const response = await axios.post(`${backendUrl}/candidate/job/${JobId}/registerInterviews`, {}, {
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      if (response.data.status) {
        setIsRegisterInterview(true);
        window.location.reload()
      }
    } catch (error) {
      console.error('Error registering for interview:', error);
    }
  };

  const getOffers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/candidate/getCoinOffers`, {
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      setOffers(response.data);
      if (response.data.length > 0) {
        setSelectedOffer(response.data[0]);
        setAmount(response.data[0].payAmount.$numberDecimal);
        setOfferAmount(response.data[0].payAmount.$numberDecimal);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handlePayment = async () => {
    try {
      if (!selectedOffer) return;

      const response = await axios.post(`${backendUrl}/candidate/payment`, {
        offerId: selectedOffer._id,
        amount: amount
      }, {
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: response.data.order.amount,
        currency: response.data.order.currency,
        name: "MiPie",
        description: "",
        image: "/images/logo/logo.png",
        order_id: response.data.order.id,
        handler: function (response) {
          handlePaymentSuccess(response, selectedOffer._id);
        },
        prefill: {
          name: response.data.candidate.name,
          email: response.data.candidate.email,
          contact: response.data.candidate.mobile
        },
        theme: {
          color: "#FC2B5A"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
    }
  };

  const handlePaymentSuccess = async (response, offerId) => {
    try {
      const paymentData = {
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        _candidate: candidate._id,
        _offer: offerId,
        amount: amount
      };

      await axios.post(`${backendUrl}/candidate/paymentStatus`, paymentData, {
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      window.location.reload();
    } catch (error) {
      console.error('Error processing payment status:', error);
    }
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      return handlePayment();
    }

    try {
      const response = await axios.put(`${backendUrl}/candidate/applyVoucher`, {
        amount: offerAmount,
        code: voucherCode,
        offerId: selectedOffer._id
      }, {
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      if (response.data.status && response.data.amount > 0) {
        setVoucherMessage({ type: 'success', message: response.data.message });
        setAmount(response.data.amount);
        return handlePayment();
      } else if (response.data.status && response.data.amount === 0) {
        setVoucherMessage({ type: 'success', message: response.data.message });
        window.location.reload();
      } else {
        setVoucherMessage({ type: 'error', message: response.data.message });
        setVoucherCode('');
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
    }
  };

  const sendReview = async () => {
    try {
      await axios.post(`${backendUrl}/candidate/review/${JobId}`, {
        rating,
        comment
      }, {
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      setReviewed(true);
      setShowFeedbackModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error sending review:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!jobDetails) {
    return <div>Job not found</div>;
  }

  const handleProfileSubmit = async () => {
  
      const profileData = {
        highestQualification,
        sex,
        dob,
        personalInfo: {
          totalExperience,
          location: {
            state,
            city,
            fullAddress: address,
            longitude,
            latitude,
  
          }
  
  
        },
        
        isExperienced: totalExperience == 0 ? false : true
      }
  
      console.log('profileData',profileData)
  
      try {
        await axios.post(`${backendUrl}/candidate/myprofile`, profileData, {
          headers: { 'x-auth': localStorage.getItem('token') }
        });
  
  
        const response = await axios.post(`${backendUrl}/candidate/job/${JobId}/apply`, {}, {
          headers: {
            'x-auth': localStorage.getItem('token')
          }
        });
  
        if (response.data.status) {
          setIsApplied(true);
          setCanApply(true);
          setShowApplyModal(false);
          setShowRegisterModal(true);
          
        }
      } catch (err) {
        console.error("Profile update or apply failed:", err);
      }
    };

  return (
    <>

      <section className="ml-3">
        <div className="container-fluid px-1">
          <div className="card">
            <div className="card-body">
              <div className="row">
                {/* Left Column - Job Details */}
                <div className="col-lg-8 col-md-8 column">
                  <div className="course_dtl mt-2">
                    <div className="row">
                      <div className="col-md-7">
                        <div className="curs_description">
                          <h4>{jobDetails.displayCompanyName || jobDetails._company?.name}</h4>
                          <span className="job_cate">{jobDetails.title}</span>

                          <h6>Job Overview / नौकरी का अवलोकन</h6>

                          <div className="row">
                            <div className="col-md-4">
                              <div className="course_spec">
                                <div className="spe_icon" style={{ backgroundColor: "transparent" }}>
                                  <i className="la la-money"></i>
                                </div>
                                <div className="spe_detail">
                                  <h3 className="jobDetails-wrap">
                                    ₹ {jobDetails.isFixed ? jobDetails.amount || 'NA' : (jobDetails.min || 'NA') + ' - ' + (jobDetails.max || 'NA')}
                                  </h3>
                                  <span className="text-capitalize jobDetails-wrap" style={{ whiteSpace: "normal" }}>Minimum Salary / न्यूनतम वेतन</span>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-4">
                              <div className="course_spec">
                                <div className="spe_icon" style={{ backgroundColor: "transparent" }}>
                                  <i className="la la-money"></i>
                                </div>
                                <div className="spe_detail">
                                  <h3 className="jobDetails-wrap">
                                    {jobDetails.experience === 0 ? 'Fresher' : `${jobDetails.experience} Years`}
                                  </h3>
                                  <span className="text-capitalize jobDetails-wrap" style={{ whiteSpace: "normal" }}>Experience / अनुभव</span>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-4">
                              <div className="course_spec">
                                <div className="spe_icon" style={{ backgroundColor: "transparent" }}>
                                  <i className="la la-money"></i>
                                </div>
                                <div className="spe_detail">
                                  <h3 className="jobDetails-wrap">{jobDetails._qualification?.name}</h3>
                                  <span className="text-capitalize jobDetails-wrap" style={{ whiteSpace: "normal" }}>Qualification / योग्यता</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-5">
                        <div className="v_pal mt-sm-3 mt-md-0 mt-3">
                          {jobDetails.jobVideo && (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleVideoModal(jobDetails.jobVideo);

                                setShowVideoModal(true);
                                console.log("Video URL:", `${jobDetails.jobVideo}`);

                              }}
                              className="video-bttn position-relative d-block"
                            >
                              <img
                                src="/Assets/images/pages/video_thum1.png"
                                className="video_thum img-fluid"
                                alt="Video thumbnail"
                              />

                            </a>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="job-single-sec">
                    <div className="job-details cr_vw mx-1">
                      {jobDetails.jobDescription && (
                        <>
                          <h3 className="mt-5">Job Description / नौकरी का विवरण</h3>
                          <p className="text-capitalize mb-3">
                            <span>{jobDetails.jobDescription}</span>
                          </p>
                        </>
                      )}

                      {jobDetails.questionsAnswers && jobDetails.questionsAnswers.length > 0 && (
                        <>
                          <h3>FAQ's</h3>
                          <p className="text-capitalize mb-0">
                            <span>
                              {jobDetails.questionsAnswers.map((item, index) => (
                                <div className="row questionanswerrow" key={index} style={{ marginBottom: '1px' }}>
                                  <div className="col-xl-12">
                                    <p style={{ fontSize: '14px' }} className="mb-0">
                                      <b>Question</b> {item.Question}
                                    </p>
                                    <p style={{ fontSize: '14px' }}>
                                      <b>Answer:</b> {item.Answer}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </span>
                          </p>
                        </>
                      )}

                      {jobDetails._techSkills && jobDetails._techSkills.length > 0 && (
                        <>
                          <h3 style={{ lineHeight: '27px!important' }}>
                            Required Knowledge, Skills, and Abilities / आवश्यक ज्ञान, कौशल और क्षमताएं
                          </h3>
                          <ul className="list-unstyled pl-3">
                            {jobDetails._techSkills.map((skill, index) => (
                              <li className="text-capitalize" key={`tech-${index}`}>
                                {skill.name}
                              </li>
                            ))}
                            {jobDetails._nonTechSkills && jobDetails._nonTechSkills.map((skill, index) => (
                              <li className="text-capitalize" key={`nontech-${index}`}>
                                {skill.name}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {jobDetails.benifits && jobDetails.benifits.length > 0 && (
                        <>
                          <h3>Benefits / लाभ</h3>
                          <ul className="pl-3">
                            {jobDetails.benifits.map((benefit, index) => (
                              <li className="text-capitalize" key={index}>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {jobDetails.remarks && (
                        <>
                          <h3>Remarks / टिप्पणियां</h3>
                          <p>{jobDetails.remarks}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Job Actions */}
                <div className="col-lg-4 col-md-4 column mt-xl-2 mt-lg-3 mt-md-3 mt-sm-0 mt-0">
                  {/* Register for Interview Button */}
                  {!isRegisterInterview ? (
                    isApplied && (
                      <a
                        className="apply-thisjob text-left px-1 d-xl-block d-lg-block d-md-block d-sm-none d-none apply-padding mb-0 mt-0 mb-md-2 mb-md-2"
                        href="#"
                        onClick={() => setShowRegisterModal(true)}
                      >
                        <i className="fa-regular fa-hand"></i>Register for Interview / साक्षात्कार के लिए पंजीकरण करें
                      </a>
                    )
                  ) : (
                    <a
                      className="apply-thisjob text-left px-1 d-xl-block d-lg-block d-md-block d-sm-none d-none apply-padding mb-0 mt-0 mb-md-2 disabled-button mb-md-2"
                      href="#"
                    >
                      <i className="fa-regular fa-hand"></i>
                      Sucessfully Registered
                    </a>
                  )}

                  {/* Apply for Job Button */}
                  {!isApplied && (
                    <a
                      className="apply-thisjob apply-div-field text-left px-0 d-xl-block d-lg-block d-md-block d-sm-none d-none py-4 mb-2 decoration-none"
                      href="#"
                      onClick={() => setShowApplyModal(true)}
                    >
                      <i className="la la-paper-plane ml-2"></i>Apply for Job / नौकरी के लिए आवेदन
                    </a>
                  )}

                  {/* Call HR Button */}
                  {isApplied ? (
                    <a
                      href={`tel:${mobileNumber}`}
                      className="apply-thisjob text-left py-2 mt-2 d-xl-block d-lg-block d-md-block d-sm-none d-none call-btn px-1 decoration-none"
                    >
                      <i className="la la-phone plane-font"></i>
                      Call To HR/ एचआर को कॉल करें
                    </a>
                  ) : (
                    <a
                      href="#"
                      onClick={() => setShowApplyModal(true)}
                      className="apply-thisjob call-div-field text-left py-2 mt-2 d-xl-block d-lg-block d-md-block d-sm-none d-none call-btn px-2 decoration-none mb-3"
                    >
                      <i className="la la-phone plane-font"></i>
                      Call To HR/ एचआर को कॉल करें
                    </a>
                  )}

                  {/* Job Overview */}
                  <div className="extra-job-info mt-1 mb-4">
                    <span className="text-capitalize px-0 py-1">
                      <i className="la la-map-pin"></i>
                      <strong>Location</strong> {jobDetails.city?.name}, {jobDetails.state?.name}
                    </span>

                    <span className="text-capitalize px-0 py-1">
                      <i className="la la-male"></i>
                      <strong>Gender Preference</strong> {jobDetails.genderPreference || 'No Preferences'}
                    </span>

                    <span className="text-capitalize px-0 py-1">
                      <i className="la la-briefcase"></i>
                      <strong>Work Type</strong> {jobDetails.work || 'NA'}
                    </span>

                    <span className="text-capitalize px-0 py-1">
                      <i className="la la-money"></i>
                      <strong>Compensation</strong> {jobDetails.compensation || 'NA'}
                    </span>

                    <span className="text-capitalize px-0 py-1">
                      <i className="la la-building"></i>
                      <strong>Working Type</strong> {jobDetails.jobType || 'NA'}
                    </span>

                    <span className="text-capitalize px-0 py-1">
                      <i className="la la-credit-card"></i>
                      <strong>Pay Type</strong> {jobDetails.pay || 'NA'}
                    </span>

                    <span className="text-capitalize px-0 py-1">
                      <i className="la la-rupee"></i>
                      <strong>Pay Frequency</strong> {jobDetails.payOut || 'NA'}
                    </span>
                  </div>

                  {/* Feedback Button */}
                  <a
                    href="#"
                    onClick={() => !reviewed && setShowFeedbackModal(true)}
                    className={`apply-thisjob text-center py-2 mt-2 d-xl-block d-lg-block d-md-block d-sm-block d-block px-2 decoration-none rebase-job mb-3 ${reviewed ? 'disabled' : ''}`}
                  >
                    <i className="fa-regular fa-comments"></i>
                    Give your Feedback/ अपनी प्रतिक्रिया दें
                  </a>

                  {/* Mobile View Buttons */}
                  {!isApplied ? (
                    <a
                      className="viewjob-apply apply-thisjob apply-div-field text-left px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block mt-xl-2 mt-lg-2 mt-md-2 mt-sm-1 mt-1 text-center"
                      href="#"
                      onClick={() => setShowApplyModal(true)}
                    >
                      <i className="la la-paper-plane ml-3"></i>Apply for Job / नौकरी के लिए आवेदन
                    </a>
                  ) : (
                    <a
                      className="viewjob-apply apply-thisjob text-left px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block disabled-button mt-5"
                      href="#"
                    >
                      <i className="la la-paper-plane ml-3"></i>Applied / प्रयुक्त
                    </a>
                  )}

                  {/* Mobile Call HR Button */}
                  <a
                    href="#"
                    onClick={() => isApplied ? window.location.href = `tel:${mobileNumber}` : setShowApplyModal(true)}
                    className="apply-thisjob call-div-field text-center py-2 px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block w-100 same-plane call-btn mt-xl-2 mt-lg-2 mt-md-3 mt-sm-3 mt-3"
                  >
                    <i className="la la-phone ml-xl-3 mt-lg-3 mt-md-2 mt-sm-0 ml-xl-0 ml-lg-0 ml-md-1 ml-sm-2 ml-0 text-center-sm text-center-md text-center-lg text-center-xl plane-font"></i>
                    Call To HR/एचआर को कॉल करें
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Courses Section */}
          <section className="list-view">
            <div className="row">
              <div className="col-xl-12 col-lg-12">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0 pb-1 px-xl-0 px-lg-0 px-md-1 px-sm-1 px-1 pt-2">
                    <div className="col-xl-6">
                      <h4 className="mt-1">Recommended Courses</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Course List */}
          <section className="searchjobspage">
            <div className="forlrgscreen d-xl-block d-lg-block d-md-block d-sm-none d-none">
              <div className="pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
                {courses && courses.length > 0 ? (
                  courses.map((course, index) => (
                    <div className="card" key={index}>
                      <div className="card-body">
                        <div className="row pointer">
                          <div className="col-lg-8 col-md-8 column">
                            <div className="job-single-sec">
                              <div className="card-body px-0">
                                <div className="job-single-head">
                                  <div className="curs_description">
                                    <h4>{course.sectors ? course.sectors[0].name : ""}</h4>
                                    <span className="job_cate">{course.name}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="job-overview mx-1 custom_sty">
                                <h3>Course Overview</h3>
                                <ul className="list-unstyled">
                                  <li>
                                    <i className="la la-money"></i>
                                    <h3 className="jobDetails-wrap">
                                      {course.cutPrice ?
                                        course.cutPrice.toLowerCase() === 'free' ?
                                          course.cutPrice : `₹ ${course.cutPrice}`
                                        : 'N/A'}
                                    </h3>
                                    <span className="text-capitalize jobDetails-wrap">Course Fee</span>
                                  </li>
                                  <li>
                                    <i className="la la-shield"></i>
                                    <h3 className="jobDetails-wrap">
                                      {course.courseLevel || 'N/A'}
                                    </h3>
                                    <span className="jobDetails-wrap">Course Level</span>
                                  </li>
                                  <li>
                                    <i className="la la-graduation-cap"></i>
                                    <h3 className="jobDetails-wrap">
                                      {course.certifyingAgency || ''}
                                    </h3>
                                    <span className="jobDetails-wrap">Course Agency</span>
                                  </li>
                                </ul>
                              </div>
                              {course.age !== undefined && course.age !== null && (
                                <div className="job-details custom_sty mx-1">
                                  <h3>Course Details</h3>
                                  <div className="row">
                                    <div className="col-md-4">
                                      <div className="cr_rec_detail">
                                        <h6>Age</h6>
                                        <p className="text-capitalize mb-0">
                                          <span>{course.age || 'N/A'}</span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-5 column mt-xl-4 mt-lg-5 mt-md-5 mt-sm-3 mt-2">
                            <a
                              className="apply-thisjob text-left px-1 d-xl-block d-lg-block d-md-block d-sm-none d-none apply-padding mb-0 mt-0"
                              href={`/candidate/course/${course._id}`}
                            >
                              <i className="la la-paper-plane"></i>Apply Now
                            </a>
                            <div className="extra-job-info mt-3">
                              <span className="px-0">
                                <i className="la la-map"></i>
                                <strong>Last Date For Apply</strong>
                                {moment(course.lastDateForApply || course.createdAt)
                                  .utcOffset('+05:30')
                                  .format('DD MMM YYYY')}
                              </span>
                            </div>
                            <a
                              className="apply-thisjob text-left px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block w-100"
                              href={`/candidate/course/${course._id}`}
                            >
                              <i className="la la-paper-plane ml-xl-3 mt-lg-3 mt-md-2 mt-sm-0 ml-xl-0 ml-lg-0 ml-md-1 ml-sm-2 ml-0 text-center-sm text-center-md text-center-lg text-center-xl"></i> Apply Now
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <h4 className="text-center">No Recommended Course found</h4>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Media Gallery Section */}
      {jobDetails._company && jobDetails._company.mediaGallery && jobDetails._company.mediaGallery.length > 0 && (
        <section className="mt-0">
          <div className="container-fluid px-3">
            <div className="card">
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-12">
                    <h5>Media Gallery / मीडिया गैलरी</h5>
                    <div className="carousel-gallery">
                      <div className="swiper-container">
                        <div className="swiper-wrapper">
                          {jobDetails._company.mediaGallery.map((img, index) => (
                            <div className="swiper-slide" key={index}>
                              <a href={`${process.env.REACT_APP_MIPIE_BUCKET_URL}/${img}`} data-fancybox="gallery">
                                <div
                                  className="image"
                                  style={{ backgroundImage: `url('${process.env.REACT_APP_MIPIE_BUCKET_URL}/${img}')` }}
                                >
                                  <div className="overlay">
                                    <em className="mdi mdi-magnify-plus"></em>
                                  </div>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                        <div className="swiper-pagination mt-4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Video Gallery Section */}
      {jobDetails._company && jobDetails._company.mediaGalaryVideo && (
        <section className="mb-2">
          <div className="container-fluid px-3">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="col-xl-12">
                    <div className="card-body px-0 pt-0 pb-0">
                      <h5>Video Gallery / वीडियो गैलरी</h5>
                      <div className="position-relative my-md-2 my-4">
                        <div className="row">
                          <div className="col-xl-5 col-lg-5 col-md-6 col-sm-6 col-6">
                            <img
                              src="/public_assets/images/resource/about-2.jpg"
                              className="img-fluid rounded mt-2"
                              alt=""
                            />
                            <a
                              target="_blank"
                              href={`${process.env.REACT_APP_MIPIE_BUCKET_URL}/${jobDetails._company.mediaGalaryVideo}`}
                              className="glightbox play-btn"
                              rel="noopener noreferrer"
                            >
                              <div className="pluscenter">
                                <div className="pulse">
                                  <img src="/public_assets/images/resource/ytplay.png" className="uplay" alt="play" />
                                </div>
                              </div>
                            </a>


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
      )}


      {/* Modals */}

      {/* Apply Job Modal */}
      {showApplyModal && (
        <div className="modal fade show" style={{ display: 'block' }} id="apply">
          <div className="modal-dialog modal-dialog-centered">
            {canApply ? (
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-white text-uppercase">Apply Now</h5>
                  <button type="button" className="close" onClick={() => setShowApplyModal(false)}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body pt-1" id="popup-body">
                  <h5 className="pb-1 mb-0 py-2">
                    Before applying for this position, please make sure that you have thoroughly reviewed all the
                    details. / इस पद के लिए आवेदन करने से पहले, कृपया सुनिश्चित करें कि आपने सभी विवरणों की पूरी
                    समीक्षा की है।
                  </h5>
                </div>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={applyJob}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowApplyModal(false)}
                  >
                    <i className="feather icon-x d-block d-lg-none"></i>
                    <span className="d-none d-lg-block">Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-white text-uppercase">Complete Profile</h5>
                  <button type="button" className="close" onClick={() => setShowApplyModal(false)}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <p>Please complete your profile before applying for this job.</p>
                  {/* Profile completion form would go here */}
                </div>
                <div className="row">


                  <div className="form-group mb-2">
                    <select onChange={(e) => setSex(e.target.value)} className="form-control" value={sex}>
                      <option value="">Your Gender / आपका लिंग</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="form-group  mb-2">
                    <input onChange={(e) => setDob(e.target.value)} type="date" className="form-control" placeholder="Date of Birth / जन्म तिथि" value={dob} />
                  </div>

                  <div className="form-group mb-2">
                    <select onChange={(e) => setTotalExperience(e.target.value)} className="form-control" value={totalExperience}>
                      <option value="">Experience / अनुभव</option>
                      <option value="0">Fresher</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                      <option value="13">13</option>
                      <option value="14">14</option>
                      <option value="15">15</option>

                    </select>
                  </div>
                  <div className="form-group mb-2">
                    <select onChange={(e) => setHighestQualification(e.target.value)} className="form-control" value={ highestQualification} >
                      <option value="">Highest Qualification / उच्चतम योग्यता</option>
                      {highestQualificationdata.map((q) => (
                        <option value={q._id}>{q.name}</option>))}


                    </select>
                  </div>
                  <div className="form-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      id="address-location"
                      placeholder="City/ शहर"
                      value={address}

                      onChange={(e) => setAddress(e.target.value)}

                    />


                  </div>

                </div>
                <div className="modal-footer">
                <div className="modal-footer">
                <button onClick={() => handleProfileSubmit()} id='updateAndApply' className="btn btn-primary" >Update and Apply</button>
              </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register for Interview Modal */}
      {showRegisterModal && (
        <div className="modal fade show" style={{ display: 'block' }} id="registerApply">
          <div className="modal-dialog modal-dialog-centered">
            {(canApply && hasCredit ) &&(
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-white text-uppercase">Register for Interview</h5>
                  <button type="button" className="close" onClick={() => setShowRegisterModal(false)}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body pt-1" id="popup-body">
                  <ul className="list-unstyled">
                    <li className="mb-1">
                      <span className="credit font-weight-bold">
                        Current Coins Balance: {candidate?.creditLeft}
                      </span>
                    </li>
                  </ul>
                  <h5 className="pb-1 mb-0">
                    Register For Interview / साक्षात्कार के लिए पंजीकरण करें
                  </h5>
                </div>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={registerForInterview}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowRegisterModal(false)}
                  >
                    <i className="feather icon-x d-block d-lg-none"></i>
                    <span className="d-none d-lg-block">Cancel</span>
                  </button>
                </div>
              </div>
            )}
            { (canApply && !hasCredit) && (
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-white text-uppercase">Insufficient Coins</h5>
                  <button type="button" className="close" onClick={() => setShowRegisterModal(false)}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body py-xl-5 py-lg-4 py-md-3 py-sm-2 py-2" id="popup-body">
                  <ul className="list-unstyled">
                    <li className="mb-1">
                      <span className="credit font-weight-bold">
                        Current Coins Balance: {candidate?.creditLeft}
                      </span>
                    </li>
                  </ul>
                  <h5 className="pb-1 mb-0">
                    You need {coins?.job} COIN to Register for Interview / साक्षात्कार के लिए पंजीकरण करने के लिए आपको {coins?.job} COIN की आवश्यकता है
                  </h5>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-fix"
                    onClick={() => {
                      setShowRegisterModal(false);
                      getOffers();
                      setShowCoinOfferModal(true);
                    }}
                  >
                    Buy Coins
                  </button>
                  <button
                    type="button"
                    className="btn btn-cancel"
                    onClick={() => setShowRegisterModal(false)}
                  >
                    <i className="feather icon-x d-block d-lg-none"></i>
                    <span className="d-none d-lg-block">Cancel</span>
                  </button>
                </div>
              </div>
            )} 
              {/* <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-white text-uppercase">Complete Profile</h5>
                  <button type="button" className="close" onClick={() => setShowRegisterModal(false)}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <p>Please complete your profile before registering for an interview.</p>
                  {/* Profile completion form would go here */}
                {/* </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowRegisterModal(false)}
                  >
                    Close
                  </button> */}
                {/* </div>
              </div> */}
              </div>
        </div>
      )}

      {/* Coin Offer Modal */}
      {showCoinOfferModal && (
        <div className="modal fade show" style={{ display: 'block' }} id="coin_offer">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">COIN OFFERS</h5>
                <button type="button" className="close" onClick={() => setShowCoinOfferModal(false)}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body pt-1" id="popup-body">
                <ul className="list-unstyled">
                  <li>
                    <div className="col-xl-8 mx-auto" id="offers">
                      {offers.map((offer, index) => (
                        <div className="row inner-border my-2 text-white popup-bg py-1" key={index}>
                          <div className="col-9 pr-0">{offer.displayOffer}</div>
                          <div className="col-3 text-left">
                            <span>
                              <input
                                type="radio"
                                id={offer._id}
                                name="offerName"
                                value={offer.payAmount.$numberDecimal}
                                className="radio-size"
                                onChange={() => {
                                  setSelectedOffer(offer);
                                  setAmount(offer.payAmount.$numberDecimal);
                                  setOfferAmount(offer.payAmount.$numberDecimal);
                                }}
                                checked={selectedOffer?._id === offer._id}
                              />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </li>
                  <li className="mb-1">
                    <span className="credit font-weight-bold">
                      Current Coins Balance: {candidate?.creditLeft}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn btn-primary waves-effect waves-light"
                  onClick={() => {
                    setShowCoinOfferModal(false);
                    setShowRedeemModal(true);
                  }}
                >
                  Pay Now
                </button>
                <button
                  type="button"
                  className="btn btn-outline-light waves-effect waves-danger"
                  onClick={() => setShowCoinOfferModal(false)}
                >
                  <i className="feather icon-x d-block d-lg-none"></i>
                  <span className="d-none d-lg-block">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Cashback Modal */}
      {showRedeemModal && (
        <div className="modal fade show" style={{ display: 'block' }} id="redeemCashback">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-sm">
              <div className="modal-header vchr_header">
                <h5 className="modal-title text-white text-uppercase">Buy Coins / सिक्के खरीदें</h5>
                <button type="button" className="close color-purple" onClick={() => setShowRedeemModal(false)}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body mode-dice p-0">
                <form className="my-3">
                  <h3 className="coupon-text">
                    If you have <strong>Coupon Code</strong>, apply here / यदि आपके पास <strong>कूपन कोड</strong> है, तो यहां आवेदन करें।
                  </h3>
                  <input
                    type="text"
                    name="voucherField"
                    className="text-white mt-1"
                    placeholder="Enter Code / कोड दर्ज करें"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                  <button
                    type="button"
                    className={`voucher-btn ${!voucherCode.trim() ? 'disabled' : ''} btn btn-sm ml-1`}
                    aria-label="Apply"
                    disabled={!voucherCode.trim()}
                    onClick={() => {
                      if (voucherCode.trim()) {
                        applyVoucher();
                      }
                    }}
                  >
                    <span aria-hidden="true" className="yes-cross">Apply</span>
                  </button>
                </form>
                {voucherMessage.type === 'success' && (
                  <p className="text-success font-weight-bolder font-italic">
                    {voucherMessage.message}
                  </p>
                )}
                {voucherMessage.type === 'error' && (
                  <p className="text-danger font-weight-bolder font-italic">
                    {voucherMessage.message}
                  </p>
                )}
              </div>
              <div className="modal-footer text-center">
                <button
                  className="btn button-vchr shadow"
                  onClick={applyVoucher}
                >
                  Pay / भुगतान करें ₹{amount}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* After Apply Modal */}
      {showAfterApplyModal && (
        <div className="modal fade show" style={{ display: 'block' }} id="afterApply">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">Applied successfully</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => {
                    setShowAfterApplyModal(false);
                    window.location.reload();
                  }}
                >
                  <span>Register for Interview</span>
                </button>
              </div>
              <div className="modal-body pt-1" id="popup-body">
                <h5 className="pb-1 mb-0 py-2">
                  Thank you for applying!for complete your application please register for interview.
                </h5>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setShowAfterApplyModal(false);
                    registerForInterview()

                  }}
                >
                  <i className="feather icon-x d-block d-lg-none"></i>
                  <span className="d-none d-lg-block">Register for Interview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal fade show" style={{ display: 'block' }} id="feedback">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content review-border">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">Feedback</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body py-3" id="popup-body">
                <div className="row vfg">
                  <div className="space-ex mb-2">
                    <div className="col-12">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <React.Fragment key={star}>
                          <input
                            className={`star star-${star}`}
                            id={`star-${star}-2`}
                            type="radio"
                            name="rating"
                            value={star}
                            checked={rating === star}
                            onChange={() => setRating(star)}
                          />
                          <label className={`star star-${star}`} htmlFor={`star-${star}-2`}></label>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="col-12">
                    <textarea
                      rows="2"
                      name="comment"
                      className="w-75 my-3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-primary text-white"
                  onClick={sendReview}
                >
                  Send Feedback/ प्रतिक्रिया भेजें
                </button>
                <button
                  type="button"
                  className="btn btn-danger py-2"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  <i className="feather icon-x d-block d-lg-none"></i>
                  <span className="d-none d-lg-block">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="modal fade" id="videoModal" tabIndex="-1" role="dialog" aria-labelledby="videoModalTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <button
              type="button"
              className="close"
              onClick={closeVideoModal}
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <div className="modal-body p-0 text-center embed-responsive embed-responsive-4by3">
              <video id="courseVid" controls autoPlay className="video-fluid text-center" ref={videoRef}>
                <source id="vodeoElement" src="" type="video/mp4" className="img-fluid video-fluid" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CandidateViewJobs;