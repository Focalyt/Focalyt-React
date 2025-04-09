import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';


const CandidateViewJobs = () => {

    const { JobId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isApplied, setIsApplied] = useState(false);
    const [canApply, setCanApply] = useState(true);
    const [mobileNumber, setMobileNumber] = useState('');
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showAfterApply, setShowAfterApply] = useState(false);
    const [isRegisterInterview, setIsRegisterInterview] = useState(false);

    const [videoSrc, setVideoSrc] = useState("");
    const videoRef = useRef(null);
    const navigate = useNavigate();

    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                console.log("Fetching job details...");
                console.log("jobId:", JobId);

                // const response = await axios.get(`${backendUrl}/candidate/course/${courseId}`, {

                const response = await axios.get(`${backendUrl}/candidate/job/${JobId}`, {
                    headers: {
                        'x-auth': localStorage.getItem('token'),
                    },
                });
                console.log('backendUrl', backendUrl)

                console.log("API Response:", response);

                if (response.data && response.data.jobDetails) {
                    setCourse(response.data.jobDetails);
                    setIsApplied(response.data.isApplied);
                    setIsRegisterInterview(response.data.isRegisterInterview);
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

        fetchJobDetails();
    }, [JobId]);


    const applyCourse = async (JobId) => {
        try {
            const entryUrlData = localStorage.getItem('entryUrl');
            const data = {
                entryUrl: entryUrlData ? entryUrlData : null,
            };

            const response = await axios({
                method: 'post',
                url: `${backendUrl}/candidate/course/${JobId}/apply`,
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
                handlePayment(JobId);
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
        return <div className="error">No Jobs found</div>;
    }
    const stripHTML = (html) => {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    };

    const handleVideoClick = (videoUrl) => {
        setVideoSrc(videoUrl);
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play();
            }
        }, 300); // Give time to open modal
    };
    const applyJob = async () => {
        try {
            const token = localStorage.getItem('token');
            // const response = await axios.post(`/candidate/job/${course._id}/apply`, {}, {
            const response = await axios.post(`${backendUrl}/candidate/job/${course._id}/apply`, {}, {
                headers: { 'x-auth': token }
            });
            setHasApplied(true);
            setShowApplyModal(false);
            setShowRegisterModal(true);
        } catch (error) {
            console.error(error);
        }
    };
    const registerForInterview = async () => {
        try {
            const token = localStorage.getItem('token');
            // const response = await axios.post(`/candidate/job/${course._id}/registerInterviews`, {}, {
            const response = await axios.post(`${backendUrl}/candidate/job/${course._id}/registerInterviews`, {}, {
                headers: { 'x-auth': token }
            });
            setShowRegisterModal(false);
            setShowAfterApply(true);
        } catch (error) {
            console.error(error);
        }
    };
    //   useEffect(() => {
    //     if (document.querySelector('.swiper-container')) {
    //       new Swiper('.swiper-container', {
    //         slidesPerView: 3,
    //         spaceBetween: 5,
    //         pagination: { el: '.swiper-pagination', clickable: true },
    //         breakpoints: {
    //           320: { slidesPerView: 1 },
    //           425: { slidesPerView: 2 },
    //           768: { slidesPerView: 2 }
    //         }
    //       });
    //     }
    //   }, []);



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
                                            <div className="col-md-7">
                                                <div className="curs_description">
                                                    <h3 className="text-capitalize mb-2 font-weight-bold">{course.displayCompanyName}</h3>
                                                    <h4 className="job_cate">{course?.sectors ? course.sectors[0].name : ""}</h4>
                                                    <h6>Job Overview / नौकरी का अवलोकन</h6>
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="course_spec">
                                                                <div className="spe_icon">
                                                                    <i className="la la-money"></i>
                                                                </div>
                                                                <div className="spe_detail">
                                                                    <h3 className="jobDetails-wrap">
                                                                        {course.isFixed ? `₹ ${course.amount || 'NA'}` : `₹ ${course.min || 'NA'} - ${course.max || 'NA'}`}
                                                                    </h3>
                                                                    <span className="text-capitalize jobDetails-wrap">Minimum Salary / न्यूनतम वेतन</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="col-md-4">
                                                            <div className="course_spec">
                                                                <div className="spe_icon">
                                                                    <i className="la la-money"></i>
                                                                </div>
                                                                <div className="spe_detail">
                                                                    <h3 className="jobDetails-wrap">{course.experience ? course.experience : 'Fresher'}</h3>
                                                                    <span className="text-capitalize jobDetails-wrap">Experience / अनुभव</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="col-md-4">
                                                            <div className="course_spec">
                                                                <div className="spe_icon">
                                                                    <i className="la la-money"></i>
                                                                </div>
                                                                <div className="spe_detail">
                                                                    <h3 className="jobDetails-wrap">{course?._qualification.name || 'N/A'}</h3>
                                                                    <span className="text-capitalize jobDetails-wrap">Qualification / योग्यता</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-5">
                                                <div className='v_pal mt-sm-3 mt-md-0 mt-3'>
                                                    {/* thumbnail  */}
                                                    <a
                                                        href="#"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#videoModal"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleVideoClick(course.jobVideo || "");
                                                        }}
                                                        className="video-bttn position-relative d-block"
                                                    >
                                                        <img
                                                            src={course.jobVideoThumbnail || "/Assets/images/pages/video_thum1.png"}
                                                            className="video_thum img-fluid rounded shadow"
                                                            alt="Job Thumbnail"
                                                        />
                                                        <img
                                                            src="/Assets/public_assets/images/newjoblisting/play.svg"
                                                            alt="Play"
                                                            className="group1 position-absolute"
                                                            style={{
                                                                top: "50%",
                                                                left: "50%",
                                                                transform: "translate(-50%, -50%)",
                                                                width: "50px",
                                                                height: "50px",
                                                            }}
                                                        />
                                                    </a>


                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    {/* <div className="row py-4">
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
                                                                aria-label={`Slide ${i + 1}`}>
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
                                                                    alt={`Course slide ${i + 1}`}
                                                                />
                                                            </div>
                                                        ))
                                                    ) : null}
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

                                        {/* <div className="col-md-6 d-xl-block d-lg-block d-md-block d-sm-none d-none">
                                                <div className="v_pal mt-sm-3 mt-md-0 mt-3">
                                                    <a
                                                        href="#"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#videoModal"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleVideoClick(course.jobVideo || "");
                                                        }}
                                                        className="video-bttn position-relative d-block"
                                                    >
                                                        <img
                                                            src={course.jobVideoThumbnail || "/Assets/images/pages/video_thum1.png"}
                                                            className="video_thum img-fluid rounded shadow"
                                                            alt="Job Thumbnail"
                                                        />
                                                        <img
                                                            src="/Assets/public_assets/images/newjoblisting/play.svg"
                                                            alt="Play"
                                                            className="group1 position-absolute"
                                                            style={{
                                                                top: "50%",
                                                                left: "50%",
                                                                transform: "translate(-50%, -50%)",
                                                                width: "50px",
                                                                height: "50px",
                                                            }}
                                                        />
                                                    </a>

                                                </div>
                                            </div> 

                                        <div className="col-md-6 d-xl-none d-lg-none d-md-none d-sm-block d-block">
                                            <div className="v_pal">
                                                {course.videos && (
                                                    <a
                                                        href="#"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#videoModal"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleVideoClick(course.jobVideo || "");
                                                        }}
                                                        className="video-bttn position-relative d-block"
                                                    >
                                                        <img
                                                            src={course.jobVideoThumbnail || "/Assets/images/pages/video_thum1.png"}
                                                            className="video_thum img-fluid rounded shadow"
                                                            alt="Job Thumbnail"
                                                        />
                                                        <img
                                                            src="/Assets/public_assets/images/newjoblisting/play.svg"
                                                            alt="Play"
                                                            className="group1 position-absolute"
                                                            style={{
                                                                top: "50%",
                                                                left: "50%",
                                                                transform: "translate(-50%, -50%)",
                                                                width: "50px",
                                                                height: "50px",
                                                            }}
                                                        />
                                                    </a>

                                                )}
                                            </div>
                                        </div>
                                    </div> */}

                                    <div className="job-single-sec">
                                        <div className="cr_detail_in cr_vw">
                                            <h3 className="mt-xl-2 mt-lg-3 mt-md-3 mt-sm-2 mt-2 mb-xl-4 mb-lg-4 mb-sm-2 mb-2">Job Description / नौकरी का विवरण</h3>
                                            <div className="row">
                                                <div className="col-12">
                                                    <p>
                                                        {course.description || "No description available."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>




                                <div className="col-lg-4 col-md-4 column mt-xl-2 mt-lg-3 mt-md-3 mt-sm-0 mt-0">


                                    {!isApplied ? (
                                        <a
                                            className="apply-thisjob text-left d-xl-block d-lg-block d-md-block d-sm-none d-none mb-2 decoration-none"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowApplyModal(true);
                                            }}
                                        >
                                            <i className="la la-paper-plane ml-2"></i>Apply for Job / नौकरी के लिए आवेदन
                                        </a>
                                    ) : !isRegisterInterview ? (
                                        <a
                                            className="apply-thisjob text-left d-xl-block d-lg-block d-md-block d-sm-none d-none mb-2 decoration-none"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowRegisterModal(true);
                                            }}
                                        >
                                            <i className="fa fa-hand-o-up ml-2"></i>Register for Interview / साक्षात्कार के लिए पंजीकरण करें
                                        </a>
                                    ) : (
                                        <a
                                            className="apply-thisjob text-left d-xl-block d-lg-block d-md-block d-sm-none d-none mb-2 decoration-none disabled-button"
                                            href="#"
                                        >
                                            <i className="la la-paper-plane ml-2"></i>Registered / पंजीकृत
                                        </a>
                                    )}

                                    <a
                                        className="apply-thisjob apply-div-field text-left d-xl-block d-lg-block d-md-block d-sm-none d-none mb-2 decoration-none"
                                        href={`tel:${course.counslerphonenumber}`}
                                        title="call"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <i className="la la-phone plane-font ml-2"></i>Call To HR/ एचआर को कॉल करें
                                    </a>

                                    <div className="d-xl-none d-lg-none d-md-none d-sm-block d-block" id="floating-apply">
                                        {!isApplied ? (
                                            <a
                                                className="apply-thisjob apply-div-field text-left px-0 py-2 mb-2 decoration-none shadow text-center"
                                                href="#"
                                                title="apply"
                                                style={{ textDecoration: 'none' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowApplyModal(true);
                                                }}
                                            >
                                                APPLY NOW
                                            </a>
                                        ) : !isRegisterInterview ? (
                                            <a
                                                className="apply-thisjob text-left px-0 py-2 mb-2 shadow"
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowRegisterModal(true);
                                                }}
                                            >
                                                Register for Interview
                                            </a>
                                        ) : (
                                            <a className="apply-thisjob text-left px-0 py-2 mb-2 disabled-button">Registered</a>
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
                                            <strong>Location</strong>{' '}
                                            {course.trainingMode ? course.trainingMode : 'No Preferances'}
                                        </span>

                                        <span className="text-capitalize px-0 py-1">
                                            <i className="la la-briefcase"></i>
                                            <strong>Gender Preferance</strong>{' '}
                                            {course.registrationCharges ? course.registrationCharges : 'N/A'}{' '}
                                            <b>{isApplied ? ` ( ${course.registrationStatus || 'Unpaid'} )` : ''}</b>
                                        </span>

                                        <span className="text-capitalize px-0 py-1">
                                            <i className="la la-money"></i>
                                            <strong>Work Type</strong>{' '}
                                            {course.work || 'N/A'}
                                        </span>

                                        <span className="py-2 px-0">
                                            <i className="la la-building"></i>
                                            <strong>Compensation</strong>{' '}
                                            {course.compensation || 'N/A'}
                                        </span>

                                        <span className="py-2 px-0">
                                            <i className="la la-credit-card"></i>
                                            <strong>Working Type</strong>{' '}
                                            {course.jobType || 'N/A'}
                                        </span>

                                        <span className="px-0">
                                            <i className="la la-map"></i>
                                            <strong>Pay Type</strong>{' '}
                                            {moment(course.lastDateForApply || course.createdAt).utcOffset('+05:30').format('DD MMM YYYY')}
                                        </span>

                                        <span className="text-capitalize px-0 py-1">
                                            <i className="la la-rupee"></i>
                                            <strong>Pay Frequency</strong>{' '}
                                            {course.emiOptionAvailable ? course.emiOptionAvailable : 'N/A'}
                                        </span>
                                    </div>
                                    <a href="#"
                                        class="apply-thisjob text-center py-2 mt-2  d-xl-block d-lg-block d-md-block d-sm-block d-block px-2 decoration-none rebase-job  mb-3 <%= reviewed ? 'disabled' : '' %> "
                                        data-bs-toggle="modal"
                                        data-bs-target="#feedback"> <i
                                            class="fa-regular fa-comments"></i>
                                        Give your Feedback/ अपनी प्रतिक्रिया दें
                                    </a>

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
                                            <i className="la la-paper-plane ml-3"></i>Applied job
                                        </a>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

            </section >

            <section class="list-view">
                <div class="row">
                    <div class="col-xl-12 col-lg-12">
                        <div class="card">
                            <div class="card-header border border-top-0 border-left-0 border-right-0 pb-1 px-xl-0 px-lg-0 px-md-1 px-sm-1 px-1 pt-2">
                                <div class="col-xl-6">
                                    <h4 class="mt-1">Recomended Courses</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="searchjobspage">
                <div class="forlrgscreen d-xl-block d-lg-block d-md-block d-sm-none d-none">
                    <div class="pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">

                        <h4 class="text-center"> No Recommended Course found</h4>


                    </div>
                </div>
            </section>

            {showApplyModal && <div className="modal-backdrop fade show"></div>}

            <div
                className={`modal fade ${showApplyModal ? 'show d-block' : ''}`}
                id="apply"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="exampleModalCenterTitle"
                aria-hidden={!showApplyModal}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    {canApply ? (
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-white text-uppercase">REGISTRATION</h5>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() => setShowApplyModal(false)}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body pt-1" id="popup-body">
                                <h5 className="pb-1 mb-0">Register for this job</h5>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        applyCourse(course._id);
                                        setShowApplyModal(false);
                                    }}
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-white text-uppercase">COMPLETE PROFILE</h5>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() => setShowApplyModal(false)}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body pt-1" id="popup-body">
                                <h5 className="pb-1 mb-0">Please complete your profile before applying</h5>
                                <p>You need to complete your profile details to apply for this course.</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setShowApplyModal(false);
                                        navigate('/candidate/profile');
                                    }}
                                >
                                    Go to Profile
                                </button>
                            </div>
                        </div>
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
                            <span>You have successfully registered for this job.<br /></span>
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

            <div
                className="modal fade"
                id="videoModal"
                tabIndex="-1"
                aria-labelledby="videoModalTitle"
                aria-hidden="true"
                onClick={() => setVideoSrc("")}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <button
                            type="button"
                            className="close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={() => {
                                setVideoSrc("");
                                videoRef.current?.pause();
                            }}
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div className="modal-body p-0 text-center embed-responsive embed-responsive-4by3">
                            <video
                                ref={videoRef}
                                controls
                                autoPlay
                                className="video-fluid text-center"
                                key={videoSrc}
                            >
                                <source src={videoSrc} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="modal fade"
                id="feedback"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="feedbackModalLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="feedbackModalLabel">Your Feedback</h5>
                            <button
                                type="button"
                                className="close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <textarea
                                className="form-control"
                                rows="4"
                                placeholder="Write your feedback here..."
                            ></textarea>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary">Submit Feedback</button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {
                    `
        .course_spec {
  display: flex;
  margin-top: 20px;
  color: #000;
}
  .jobDetails-wrap{
  white-space: pre-wrap;
  }
        .spe_icon{
        background: transparent;
        }
        .spe_icon i {
  font-size: 20px;
  color: #fc2b5a;
  background:
#fc2b5a12;
  border-radius:
50px;
  padding:
5px;
  border:
solid 1px #fc2b5a75;
}
.course_spec .spe_icon {
  margin-right: 10px;
}
        `
                }
            </style>

        </>
    );
};

export default CandidateViewJobs;
