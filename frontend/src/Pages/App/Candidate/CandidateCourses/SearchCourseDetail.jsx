import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import "./SearchCoursesDetail.css";
import PopupModelApply from "../../../../Component/Layouts/App/Candidates/PopupModelApply/PopupModelApply"
const CourseDetails = () => {
 
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(false);
  const [canApply, setCanApply] = useState(true);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(false);

  // const [gender, setGender] = useState('');
  // const [dob, setDob] = useState('');
  // const [experience, setExperience] = useState('');
  // const [highestQualification, setHighestQualification] = useState('');
  // const [state, setState] = useState('');
  // const [city, setCity] = useState('');
  // const [pincode, setPincode] = useState('');
  // const [location, setLocation] = useState('');
  // const [latitude, setLatitude] = useState('');
  // const [longitude, setLongitude] = useState('');

  const videoRef = useRef(null);
  const navigate = useNavigate();

const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        console.log("Fetching course details...");
        console.log("Course ID:", courseId);

        // const response = await axios.get(`${backendUrl}/candidate/course/${courseId}`, {
        
        const response = await axios.get(`${backendUrl}/candidate/course/${courseId}`, {
          headers: {
            'x-auth': localStorage.getItem('token'),
          },
        });
        console.log('backendUrl',backendUrl)
  
        console.log("API Response:", response.data);
  
        if (response.data && response.data.course) {
          setCourse(response.data.course);
          setIsApplied(response.data.isApplied);
          setCanApply(response.data.canApply);
          setMobileNumber(response.data.mobileNumber || response.data.course.counslerphonenumber);
        } else {
          console.error("Course data is missing in API response:", response.data);
        }
  
        setLoading(false);
      } catch (error) {
        console.error("Error fetching course details:", error.response ? error.response.data : error);
        setLoading(false);
      }
    };
  
    fetchCourseDetails();
  }, [courseId]);
  // }, [courseId]);
  
  const applyCourse = async (courseId) => {
    try {
      const entryUrlData = localStorage.getItem('entryUrl');
      const data = {
        entryUrl: entryUrlData ? entryUrlData : null,
      };

      const response = await axios({
        method: 'post',
        url: `${backendUrl}/candidate/course/${courseId}/apply`,
        data: data,
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });

      // Close modal
      document.getElementById('apply').classList.remove('show');
      document.getElementsByClassName('modal-backdrop')[0]?.remove();
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');

      // Check if registration charges exist
      if (course.registrationCharges > 0) {
        handlePayment(courseId);
      } else {
        // Show completion modal
        document.getElementById('completeRegistration').classList.add('show');
        document.getElementById('completeRegistration').style.display = 'block';
        document.body.classList.add('modal-open');
      }
    } catch (error) {
      console.error('Error applying for course:', error);
      window.location.reload();
    }
  };

  const handlePayment = (courseId) => {
    const amount = 1;
    const data = {
      courseId,
      amount
    };

    axios({
      method: 'post', 
      url: `${backendUrl}/candidate/coursepayment`, 
      data, 
      headers: { 
        'x-auth': localStorage.getItem('token') 
      }
    }).then((res) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: res.data.order.amount,
        currency: res.data.order.currency,
        name: "Focalyt",
        description: "",
        image: "/images/logo/logo.png",
        order_id: res.data.order.id,
        handler: function (response) {
          const paymentData = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            _candidate: res.data.candidate._id,
            courseId,
            amount
          };
          
          axios({
            method: 'post',
            url: `${backendUrl}/candidate/coursepaymentStatus`,
            data: paymentData,
            headers: {
              'x-auth': localStorage.getItem('token')
            }
          }).then(res => {
            document.getElementById('completeRegistration').classList.add('show');
            document.getElementById('completeRegistration').style.display = 'block';
            document.body.classList.add('modal-open');
          }).catch(error => {
            console.error('Error processing payment status:', error);
          });
        },
        prefill: {
          name: res.data.candidate.name,
          email: res.data.candidate.email,
          contact: res.data.candidate.mobile
        },
        theme: {
          color: "#FC2B5A"
        }
      };
      
      const rzp1 = window.Razorpay(options);
      rzp1.open();
    }).catch(err => console.error('Error initiating payment:', err));
  };

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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!course) {
    return <div className="error">Course not found</div>;
  }
  const stripHTML = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };
  // const handleProfileSubmit = async () => {
  //   const profileData = {
  //     highestQualification,
  //     personalInfo: {
  //       sex: gender,
  //       state,
  //       city,
  //       pincode,
  //       longitude,
  //       latitude,
  //       dob
  //     },
  //     totalExperience: experience,
  //     isExperienced: experience == 0 ? false : true
  //   };
  
  //   try {
  //     await axios.post(`${backendUrl}/candidate/myprofile`, profileData, {
  //       headers: { 'x-auth': localStorage.getItem('token') }
  //     });
  
  //     await axios.post(`${backendUrl}/candidate/course/${course._id}/apply`, {}, {
  //       headers: { 'x-auth': localStorage.getItem('token') }
  //     });
  
  //     window.location.reload();
  //   } catch (err) {
  //     console.error("Profile update or apply failed:", err);
  //   }
  // };
  
  return (
      <>
       
        <section className="ml-3">
          <div className="container-fluid px-1">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-8 col-md-8 column">
                    <div className="course_dtl mt-2">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="curs_description">
                            <h3 className="text-capitalize mb-2 font-weight-bold">{course.name}</h3>
                            <h4 className="job_cate">{course?.sectors ? course.sectors[0].name : ""}</h4>
                            <h6>Course Overview</h6>
                            <div className="row">
                              <div className="col-md-4 col-lg-4 col-sm-6 col-6">
                                <div className="course_spec">
                                  <div className="spe_icon">
                                    <i className="la la-money"></i>
                                  </div>
                                  <div className="spe_detail">
                                    <h3 className="jobDetails-wrap">
                                      {course.cutPrice 
                                        ? course.cutPrice.toLowerCase() === 'free'
                                          ? course.cutPrice 
                                          : '₹ ' + course.cutPrice 
                                        : 'N/A'}
                                    </h3>
                                    <span className="text-capitalize jobDetails-wrap">Course Fee</span>
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4 col-lg-4 col-sm-6 col-6">
                                <div className="course_spec">
                                  <div className="spe_icon">
                                    <i className="la la-money"></i>
                                  </div>
                                  <div className="spe_detail">
                                    <h3 className="jobDetails-wrap">{course.courseLevel ? course.courseLevel : 'N/A'}</h3>
                                    <span className="text-capitalize jobDetails-wrap">Course Level</span>
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4 col-lg-4 col-sm-6 col-6">
                                <div className="course_spec">
                                  <div className="spe_icon">
                                    <i className="la la-money"></i>
                                  </div>
                                  <div className="spe_detail">
                                    <h3 className="jobDetails-wrap">{course?.certifyingAgency ? course.certifyingAgency : 'N/A'}</h3>
                                    <span className="text-capitalize jobDetails-wrap">Course Agency</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="row py-4">
                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-2 mb-lg-2 mb-md-2 mb-sm-4 mb-4">
                          <div id="carouselExampleIndicators" className="carousel slide" data-ride="carousel">
                            <div className="carousel-indicators">
                              {course.photos && course.photos.length > 0 ? (
                                course.photos.map((photo, i) => (
                                  <button 
                                    key={i}
                                    type="button" 
                                    data-target="#carouselExampleIndicators" 
                                    data-slide-to={i}
                                    className={i === 0 ? "active activeclass" : "activeclass"} 
                                    aria-label={`Slide ${i+1}`}>
                                  </button>
                                ))
                              ) : (
                                <button 
                                  type="button" 
                                  data-target="#carouselExampleIndicators" 
                                  data-slide-to="0"
                                  className="activeclass" 
                                  aria-label="Slide 1">
                                </button>
                              )}
                            </div>
                            
                            <div className="carousel-inner">
                              {course.photos && course.photos.length > 0 ? (
                                course.photos.map((photo, i) => (
                                  <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                                    <img 
                                      className="d-block w-100 rounded shadow" 
                                      src={photo ? `${bucketUrl}/${photo}` : '/public_assets/images/newjoblisting/banner1.jpg'} 
                                      alt={`Course slide ${i+1}`} 
                                    />
                                  </div>
                                ))
                              ) : (
                                <div className="carousel-item active">
                                  <img 
                                    src="/public_assets/images/newjoblistingbanner2.jpg" 
                                    className="d-block w-100 rounded shadow" 
                                    alt="Default course banner" 
                                  />
                                </div>
                              )}
                            </div>
                            
                            {course.photos && course.photos.length > 0 && (
                              <>
                                <button 
                                  className="carousel-control-prev" 
                                  type="button" 
                                  data-bs-target="#carouselExampleIndicators"
                                  data-bs-slide="prev">
                                  <span className="carousel-control-prev-icon pree" aria-hidden="true"></span>
                                  <span className="visually-hidden">Previous</span>
                                </button>
                                <button 
                                  className="carousel-control-next" 
                                  type="button" 
                                  data-bs-target="#carouselExampleIndicators"
                                  data-bs-slide="next">
                                  <span className="carousel-control-next-icon pree" aria-hidden="true"></span>
                                  <span className="visually-hidden">Next</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-md-6 d-xl-block d-lg-block d-md-block d-sm-none d-none">
                          <div className="v_pal mt-sm-3 mt-md-0 mt-3">
                            {course.videos && (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleVideoModal(`${bucketUrl}/${course.videos[0]}`);
                                }}
                                className="video-bttn position-relative d-block"
                              >
                                <img 
                                  id="videoPlay" 
                                  src={course.thumbnail ? `${bucketUrl}/${course.thumbnail}` : '/images/pages/video_thum1.png'} 
                                  className="video_thum img-fluid" 
                                  alt="Video thumbnail" 
                                />
                                <img src="/Assets/images/icon-play.png" alt="Play button" className="group1 d-none" />
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-md-6 d-xl-none d-lg-none d-md-none d-sm-block d-block">
                          <div className="v_pal">
                            {course.videos && (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleVideoModal(`${bucketUrl}/${course.videos[0]}`);
                                }}
                                className="video-bttn position-relative d-block"
                              >
                                <img 
                                  id="videoPlay" 
                                  src={course.thumbnail ? `${bucketUrl}/${course.thumbnail}` : '/images/pages/video_thum1.png'} 
                                  className="video_thum img-fluid" 
                                  alt="Video thumbnail" 
                                />
                                <img src="/public_assets/images/newjoblisting/play.svg" alt="Play button" className="group1" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="job-single-sec">
                      <div className="cr_detail_in cr_vw">
                        <h3 className="mt-xl-2 mt-lg-3 mt-md-3 mt-sm-2 mt-2 mb-xl-4 mb-lg-4 mb-sm-2 mb-2">Course Details</h3>
                        <div className="row">
                          {course.age && (
                            <div className="col-md-3 col-sm-6 col-6">
                              <div className="course_dt mb-4">
                                <h6>Age</h6>
                                <p className="text-capitalize mb-0">
                                  <span>{course.age ? `${course.age} Years` : 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                          )}

                          {course.qualification && (
                            <div className="col-md-3 col-sm-6 col-6">
                              <div className="course_dt mb-4">
                                <h6>Course Qualification</h6>
                                <p className="text-capitalize mb-0">
                                  <span>{course.qualification ? course.qualification : 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                          )}

                          {course.duration && (
                            <div className="col-md-3 col-sm-6 col-6">
                              <div className="course_dt mb-3">
                                <h6>Course Duration</h6>
                                <p className="text-capitalize mb-0">
                                  <span>{course.duration ? course.duration : 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                          )}

                          {course.experience && (
                            <div className="col-md-3 col-sm-6 col-6">
                              <div className="course_dt mb-3">
                                <h6>Experience</h6>
                                <p className="text-capitalize mb-0">
                                  <span>{course.experience ? course.experience : 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                          )}

                          {course.courseFeatures && course.courseFeatures !== '' && (
                            <div className="col-md-6">
                              <div className="course_dt mb-4">
                                <h6>Course feature</h6>
                                <p className="text-capitalize mb-0">
                                  <ul className="contact-info text-start text-white pl-4">
                                    {course.courseFeatures.split('\n').map((feature, i) => (
                                      <li key={i}>{feature}</li>
                                    ))}
                                  </ul>
                                </p>
                              </div>
                            </div>
                          )}

                          {course.importantTerms && course.importantTerms !== '' && (
                            <div className="col-md-6">
                              <div className="course_dt mb-4">
                                <h6>Course terms</h6>
                                <p className="text-capitalize mb-0">
                                  <ul className="contact-info text-start text-white pl-4">
                                    {course.importantTerms.split('\n').map((term, i) => (
                                      <li key={i}>{term}</li>
                                    ))}
                                  </ul>
                                </p>
                              </div>
                            </div>
                          )}

                          {course.requiredDocuments && course.requiredDocuments !== '' && (
                            <div className="col-md-6">
                              <div className="course_dt mb-4">
                                <h6>Required Documents</h6>
                                <p className="text-capitalize mb-0">
                                  <ul className="contact-info text-start text-white pl-4">
                                    {course.requiredDocuments.split('\n').map((doc, i) => (
                                      <li key={i}>{doc}</li>
                                    ))}
                                  </ul>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-4 col-md-4 column mt-xl-2 mt-lg-3 mt-md-3 mt-sm-0 mt-0">
                    <a 
                      className="apply-thisjob apply-div-field text-left d-xl-block d-lg-block d-md-block d-sm-none d-none mb-2 decoration-none"
                      href={`tel:${course.counslerphonenumber}`} 
                      title="call"
                      style={{ textDecoration: 'none' }}
                    >
                      <i className="la la-phone plane-font ml-2"></i>Call Now
                    </a>
                    
                    {!isApplied ? (
                      <a 
                        className="apply-thisjob apply-div-field text-left d-xl-block d-lg-block d-md-block d-sm-none d-none mb-2 decoration-none"
                        href="#" 
                        title="apply" 
                        style={{ textDecoration: 'none' }}
                        data-toggle="modal"
                        data-target="#apply"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('apply').classList.add('show');
                          document.getElementById('apply').style.display = 'block';
                          document.body.classList.add('modal-open');
                        }}
                      >
                        <i className="la la-paper-plane ml-2"></i>Apply Now
                      </a>
                    ) : course.registrationStatus !== 'Paid' && Number(course.registrationCharges) > 0 ? (
                      <a 
                        className="apply-thisjob text-left px-0 py-3 d-xl-block d-lg-block d-md-block d-sm-none d-none"
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePayment(course._id);
                        }}
                      >
                        <i className="la la-paper-plane ml-3"></i>Complete Registration
                      </a>
                    ) : (
                      <a 
                        className="apply-thisjob text-left px-0 py-3 d-xl-block d-lg-block d-md-block d-sm-none d-none disabled-button"
                        href="#"
                      >
                        <i className="la la-paper-plane ml-3"></i>Applied Course
                      </a>
                    )}

                    <div className="d-xl--none d-lg-none d-md-none d-sm-block d-block" id="floating-apply">
                      {!isApplied ? (
                        <a 
                          className="apply-thisjob apply-div-field text-left px-0 py-2 mb-2 decoration-none shadow text-center"
                          href="#" 
                          title="apply" 
                          style={{ textDecoration: 'none' }}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('apply').classList.add('show');
                            document.getElementById('apply').style.display = 'block';
                            document.body.classList.add('modal-open');
                          }}
                        >
                          APPLY NOW
                        </a>
                      ) : course.registrationStatus !== 'Paid' && Number(course.registrationCharges) > 0 ? (
                        <a 
                          className="apply-thisjob text-left px-0 py-3"
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handlePayment(course._id);
                          }}
                        >
                          <i className="la la-paper-plane ml-3"></i>Complete Registration
                        </a>
                      ) : (
                        <a 
                          className="apply-thisjob text-left px-0 py-3 disabled-button"
                          href="#"
                        >
                          <i className="la la-paper-plane ml-3"></i>Applied Course
                        </a>
                      )}
                      <a 
                        className="apply-thisjob text-center apply-div-field text-left px-0 py-2 mb-2 decoration-none shadow text-white" 
                        href={`tel:${mobileNumber}`}
                      >
                        CALL NOW
                      </a>
                    </div>

                    {/* Course Overview */}
                    <div className="extra-job-info mb-1 mt-3">
                      <span className="text-capitalize px-0 py-1">
                        <i className="la la-male"></i>
                        <strong>Training Mode</strong>{' '}
                        {course.trainingMode ? course.trainingMode : 'No Preferances'}
                      </span>
                      
                      <span className="text-capitalize px-0 py-1">
                        <i className="la la-briefcase"></i>
                        <strong>Registration Charges</strong>{' '}
                        {course.registrationCharges ? course.registrationCharges : 'N/A'}{' '}
                        <b>{isApplied ? ` ( ${course.registrationStatus || 'Unpaid'} )` : ''}</b>
                      </span>
                      
                      <span className="text-capitalize px-0 py-1">
                        <i className="la la-money"></i>
                        <strong>Experience</strong>{' '}
                        {course.experience ? course.experience : 'N/A'}
                      </span>
                      
                      <span className="py-2 px-0">
                        <i className="la la-building"></i>
                        <strong>Stiepend During Training</strong>{' '}
                        {course.stipendDuringTraining ? course.stipendDuringTraining : 'N/A'}
                      </span>
                      
                      <span className="py-2 px-0">
                        <i className="la la-credit-card"></i>
                        <strong>Duration</strong>{' '}
                        {course.duration ? course.duration : 'N/A'}
                      </span>
                      
                      <span className="px-0">
                        <i className="la la-map"></i>
                        <strong>Last Date</strong>{' '}
                        {moment(course.lastDateForApply || course.createdAt).utcOffset('+05:30').format('DD MMM YYYY')}
                      </span>
                      
                      <span className="text-capitalize px-0 py-1">
                        <i className="la la-rupee"></i>
                        <strong>EMI Options Available</strong>{' '}
                        {course.emiOptionAvailable ? course.emiOptionAvailable : 'N/A'}
                      </span>
                      
                      <span className="text-capitalize px-0 py-1">
                        <i className="la la-map"></i>
                        <strong>Assigned Date</strong>{' '}
                        {course.assignDate 
                          ? moment(course.assignDate, 'DD MMM YYYY').format('DD MMM YYYY') 
                          : 'N/A'}
                      </span>
                      
                      <span className="text-capitalize px-0 py-1">
                        <a href={`${bucketUrl}/${course.brochure}`} target="_blank" rel="noopener noreferrer">
                          <i className="la la-download"></i>
                          <strong><em>Download Brochure</em></strong>
                        </a>
                      </span>
                      
                      <span className="text-capitalize px-0 py-1">
                        <i className="la la-map-pin"></i>
                        <strong>Location</strong>{' '}
                        {course.city ? `(${course.city}, ${course.state})` : 'NA'}
                      </span>
                    </div>
                    
                    {/* Mobile Apply Button */}
                    {!isApplied ? (
                      <a 
                        className="viewjob-apply apply-thisjob apply-div-field text-left px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block mt-xl-2 mt-lg-2 mt-md-2 mt-sm-1 mt-1 text-center"
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('apply').classList.add('show');
                          document.getElementById('apply').style.display = 'block';
                          document.body.classList.add('modal-open');
                        }}
                      >
                        <i className="la la-paper-plane ml-3"></i>Register for this Course
                      </a>
                    ) : course.registrationStatus !== 'Paid' && Number(course.registrationCharges) > 0 ? (
                      <a 
                        className="apply-thisjob text-left px-0 py-3 d-xl-block d-lg-block d-md-block d-sm-none d-none"
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePayment(course._id);
                        }}
                      >
                        <i className="la la-paper-plane ml-3"></i>Complete Registration
                      </a>
                    ) : (
                      <a 
                        className="apply-thisjob text-left px-0 py-3 d-xl-block d-lg-block d-md-block d-sm-none d-none disabled-button"
                        href="#"
                      >
                        <i className="la la-paper-plane ml-3"></i>Applied Course
                      </a>
                    )}
                  </div>
                  
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-4 mt-4">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="course_dt mb-4" id="admin_col_data">
                          <h6>Course Remarks</h6>
                          <div className="row feature-widget-7-row pt-xl-2 pt-lg-2 pt-md-2 pt-sm-1 pt-1" id="apply_modal">
                            <div className="col-xl-12 mb-3 mx-auto">
                              <div className="course_details_col">
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Eligibility.png" className="img-fluid" draggable="false" alt="Eligibility" />
                                      Eligibility
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.qualification}
                                    </p>

                                    </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Age.png" className="img-fluid" draggable="false" alt="Age" />
                                      Age
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.age} Years
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Experience.png" className="img-fluid" draggable="false" alt="Experience" />
                                      Experience
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.experience}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Course_mode.png" className="img-fluid" draggable="false" alt="Course Mode" />
                                      Course Mode
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.trainingMode}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Course_duration.png" className="img-fluid" draggable="false" alt="Course Duration" />
                                      Course Duration
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.duration}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Course_type.png" className="img-fluid" draggable="false" alt="Course Type" />
                                      Course Type
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.courseType === 'coursejob' ? 'Course + Job' : 'Course'}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Timing.png" className="img-fluid" draggable="false" alt="Timings" />
                                      Timings
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.onlineTrainingTiming || course.offlineTrainingTiming}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto text-end">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/Institute_name.png" className="img-fluid" draggable="false" alt="Institute Name" />
                                      Institute Name
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal text-truncate">
                                      {course.certifyingAgency}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/jobicons/job_training.png" className="img-fluid" draggable="false" alt="On Job Training" />
                                      On Job Training
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.ojt}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="course_dt mb-4">
                          <h6>Course Fee Description</h6>
                          <div className="row feature-widget-7-row pt-xl-2 pt-lg-2 pt-md-2 pt-sm-1 pt-1" id="apply_modal">
                            <div className="col-xl-12 mb-3 mx-auto">
                              <div className="course_details_col">
                                <div className="feature-widget-7__icon-wrapper my-auto mx-auto text-center">
                                  <h5 className="fw-normal">
                                    Registration Fee : ₹{course.registrationCharges}
                                  </h5>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/tick_icon.svg" className="img-fluid" draggable="false" alt="Course Fee" />
                                      Course Fee
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.cutPrice 
                                        ? course.cutPrice.toLowerCase() === 'free'
                                          ? course.cutPrice 
                                          : '₹ ' + course.cutPrice 
                                        : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/tick_icon.svg" className="img-fluid" draggable="false" alt="Exam Fee" />
                                      Exam Fee
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      ₹{course.examFee}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/tick_icon.svg" className="img-fluid" draggable="false" alt="Stipend During Training" />
                                      Stipend During Training
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      ₹{course.stipendDuringTraining || 'NA'}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/tick_icon.svg" className="img-fluid" draggable="false" alt="Any Other Charges" />
                                      Any Other Charges
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      ₹{course.otherFee || 'NA'}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/tick_icon.svg" className="img-fluid" draggable="false" alt="Installment Option" />
                                      Installment Option
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.emiOptionAvailable}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/tick_icon.svg" className="img-fluid" draggable="false" alt="Max. EMI Tenure" />
                                      Max. EMI Tenure
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.maxEMITenure || 'NA'}
                                    </p>
                                  </div>
                                </div>
                                <div className="feature-widget-7 border-bottom">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="fw-normal">
                                      <img src="/Assets/public_assets/images/tick_icon.svg" className="img-fluid" draggable="false" alt="Bank Loan Option" />
                                      Bank Loan Option
                                    </h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <p className="feature-widget-7__title mb-0 fw-normal">
                                      {course.loan === 'Yes' ? 'Yes' : 'No'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="course_dt mb-4" id="candi_login-faq">
                          <h6>FAQ's</h6>
                          <div className="">
                            <div className="single-footer">
                              <ul className="contact-info color-pink mb-2">
                                {course.questionAnswers && course.questionAnswers.map((ele, index) => (
                                  <React.Fragment key={index}>
                                    <li id="que" className="mb-1">
                                      <img src="/Assets/public_assets/images/ul_li_shape.svg" draggable="false" alt="List icon" /> {stripHTML(ele.Question)}
                                    </li>
                                    <li id="que">{stripHTML(ele.Answer)}</li>
                                  </React.Fragment>
                                ))}

                              </ul>
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
       
        <div className="modal fade" id="apply" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            {canApply ? (
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">REGISTRATION</h5>
                  <button 
                    type="button" 
                    className="close" 
                    onClick={() => {
                      document.getElementById('apply').classList.remove('show');
                      document.getElementById('apply').style.display = 'none';
                      document.body.classList.remove('modal-open');
                      document.getElementsByClassName('modal-backdrop')[0]?.remove();
                    }}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body pt-1" id="popup-body">
                  <h5 className="pb-1 mb-0">
                    Register for this Course
                  </h5>
                </div>
                <div className="modal-footer">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    id="apply-btn" 
                    onClick={() => applyCourse(course._id)}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            ) : (

             <PopupModelApply/>
            )}
          </div>
        </div>
   
        <div className="modal fade" id="completeRegistration" tabIndex="-1" role="dialog" aria-labelledby="completeRegistrationTitle" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase" id="completeRegistrationTitle">REGISTRATION DONE</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => {
                    document.getElementById('completeRegistration').classList.remove('show');
                    document.getElementById('completeRegistration').style.display = 'none';
                    document.body.classList.remove('modal-open');
                    document.getElementsByClassName('modal-backdrop')[0]?.remove();
                    window.location.reload();
                  }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body pt-1" id="popup-body">
                <h5 className="pb-1 mb-0">
                  Congratulations!
                </h5>
                <span>You have successfully registered for this course.<br/> Our team will contact you shortly.</span>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  id="close" 
                  onClick={() => {
                    document.getElementById('completeRegistration').classList.remove('show');
                    document.getElementById('completeRegistration').style.display = 'none';
                    document.body.classList.remove('modal-open');
                    document.getElementsByClassName('modal-backdrop')[0]?.remove();
                    window.location.reload();
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        
  
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

export default CourseDetails;










// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import moment from 'moment';


// const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
// const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

// const CourseDetails = () => {
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch applied courses data
//     const fetchAppliedCourses = async () => {
//       try {
//         const response = await axios.get(`${backendUrl}/candidate/appliedCourses`, {
//           withCredentials: true
//         });
//         setCourses(response.data.courses || []);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching applied courses:', error);
//         setLoading(false);
//       }
//     };

//     fetchAppliedCourses();
//   }, []);

//   return (
//     <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static pose-lead"
//       data-open="click" data-menu="vertical-menu-modern" data-col="2-columns">

      
//       <div className="">
//         <div className="content-overlay"></div>
//         <div className="header-navbar-shadow"></div>
//         <div className="content-wrapper">
//           {/* Breadcrumbs header for desktop */}
//           <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
//             <div className="content-header-left col-md-9 col-12 mb-2">
//               <div className="row breadcrumbs-top">
//                 <div className="col-12 my-auto">
//                   <h3 className="content-header-title float-left mb-0">Applied Courses</h3>
//                   <div className="breadcrumb-wrapper col-12">
//                     <ol className="breadcrumb">
//                       <li className="breadcrumb-item">
//                         <Link to="/candidate/dashboard">Home</Link>
//                       </li>
//                       <li className="breadcrumb-item"><Link to="#">Applied Courses</Link></li>
//                     </ol>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Tab navigation */}
//           <section id="searchCourses" className="mb-2">
//             <div className="container">
//               <ul className="nav nav-tabs justify-content-center" id="courseTabs" role="tablist">
//                 <li className="nav-item" role="presentation">
//                   <Link className="nav-link" id="search-tab" to="/candidate/searchcourses" role="tab" aria-controls="search" aria-selected="false">
//                     Search Courses
//                   </Link>
//                 </li>
//                 <li className="nav-item" role="presentation">
//                   <Link className="nav-link" id="pending-tab" to="/candidate/pendingFee" role="tab" aria-controls="pending" aria-selected="false">
//                     Pending for Fee
//                   </Link>
//                 </li>
//                 <li className="nav-item" role="presentation">
//                   <Link className="nav-link active" id="applied-tab" to="/candidate/appliedCourses" role="tab" aria-controls="applied" aria-selected="true">
//                     Applied Courses
//                   </Link>
//                 </li>
//               </ul>
//             </div>
//           </section>

//           {/* Course listings */}
//           <section className="searchjobspage">
//             <div className="forlrgscreen">
//               <div className="pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
//                 {loading ? (
//                   <div className="text-center">Loading...</div>
//                 ) : courses && courses.length > 0 ? (
//                   courses.map((appliedcourse, index) => (
//                     <div className="card" key={index}>
//                       <div className="card-body">
//                         <div className="row pointer">
//                           <div className="col-lg-8 col-md-7 column">
//                             <div className="job-single-sec mt-xl-0">
//                               <div className="job-single-head border-0 pb-0">
//                                 <div>
//                                   <h6 className="text-capitalize font-weight-bolder">
//                                     {appliedcourse._course.name ? appliedcourse._course.name : 'NA'}
//                                   </h6>
//                                   <span className="text-capitalize set-lineh">
//                                     {appliedcourse._course.sectors && appliedcourse._course.sectors[0] ? appliedcourse._course.sectors[0].name : ""}
//                                   </span>
//                                 </div>
//                               </div>
//                               <Link to={`/candidate/course/${appliedcourse._course._id}`}>
//                                 <div className="job-overview mt-1">
//                                   <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
//                                     <li>
//                                       <i className="la la-money"></i>
//                                       <h3 className="jobDetails-wrap">
//                                         {appliedcourse._course.cutPrice 
//                                           ? appliedcourse._course.cutPrice.toLowerCase() === 'free' 
//                                             ? appliedcourse._course.cutPrice 
//                                             : '₹ ' + appliedcourse._course.cutPrice 
//                                           : 'N/A'}
//                                       </h3>
//                                       <span className="text-capitalize jobDetails-wrap">
//                                         Course Fee
//                                       </span>
//                                     </li>
//                                     <li>
//                                       <i className="la la-shield"></i>
//                                       <h3 className="jobDetails-wrap">
//                                         {appliedcourse._course.courseLevel ? appliedcourse._course.courseLevel : 'N/A'}
//                                       </h3>
//                                       <span className="jobDetails-wrap">
//                                         Course Level
//                                       </span>
//                                     </li>
//                                     <li>
//                                       <i className="la la-graduation-cap"></i>
//                                       <h3 className="jobDetails-wrap">
//                                         {appliedcourse._course?.certifyingAgency ? appliedcourse._course.certifyingAgency : 'N/A'}
//                                       </h3>
//                                       <span className="jobDetails-wrap">
//                                         Course Agency
//                                       </span>
//                                     </li>
//                                     <li>
//                                       <i className="la la-money"></i>
//                                       <h3 className="jobDetails-wrap">
//                                         {appliedcourse?.registrationFee === 'Paid' ? 'Paid' : 'Unpaid'}
//                                       </h3>
//                                       <span className="jobDetails-wrap">
//                                         Registration Status
//                                       </span>
//                                     </li>
//                                   </ul>
//                                 </div>
//                               </Link>
//                             </div>
//                           </div>
//                           <div className="col-lg-4 col-md-5 column mt-xl-1 mt-lg-1 mt-md-1 mt-sm-3 mt-0">
//                             <div className="extra-job-info mt-1">
//                               <span className="px-0">
//                                 <i className="la la-map"></i>
//                                 <strong>Last Date</strong> {' '}
//                                 {moment(appliedcourse._course.lastDateForApply || 
//                                   appliedcourse._course.createdAt).utcOffset('+05:30').format('DD MMM YYYY')}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <h4 className="text-center">No Course found</h4>
//                 )}
//               </div>
//             </div>
//           </section>

//           {/* Hidden map section */}
//           <section className="map" style={{ display: 'none' }}>
//             <div className="row">
//               <div className="col-xl-12 col-lg-12">
//                 <div id="collapseOne" className="collapse" aria-labelledby="headingOne" data-parent="#accordion">
//                   <div className="card-body px-1 py-0">
//                     <div className="card border border-top-1">
//                       <div id="filter">
//                         <div className="card-content">
//                           <div className="card-body p-0">
//                             <div className="row my-0 mx-0" id="allFields">
//                               <div className="cont" style={{ display: 'none' }}>
//                                 <p id="companyNameMarker"></p>
//                                 <p id="stateCityMarker"></p>
//                                 <p id="industryMarker"></p>
//                                 <p id="qualificationMarker"></p>
//                                 <p id="salaryMarker"></p>
//                                 <p id="locationMarker"></p>
//                                 <a id="jobDetailsMarker"></a>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className="col-xl-12 col-lg-12">
//                 <div id="error" style={{ color: 'red' }}></div>
//                 <div id="map" style={{ width: '100%', height: '400px' }} className="rounded"></div>
//               </div>
//               </div>
//             </section>
//           </div>
//         </div>

//         {/* Modal */}
//         <div className="modal fade" id="popup" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-modal="true">
//           <div className="modal-dialog modal-dialog-centered" role="document">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">Complete Profile</h5>
//                 <button type="button" className="close" data-dismiss="modal" aria-label="Close">
//                   <span aria-hidden="true">×</span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
// };

// export default CourseDetails;
