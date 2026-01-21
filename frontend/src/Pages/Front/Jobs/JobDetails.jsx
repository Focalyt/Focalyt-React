import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import FrontLayout from '../../../Component/Layouts/Front';

function JobDetails() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pills-home');
    const videoRef = useRef(null);

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                setLoading(true);
                console.log("📡 FRONTEND: Making API call to backend");
                console.log("📡 URL:", `${backendUrl}/jobdetailsmore/${jobId}`);
                // Try the API endpoint - if it returns JSON, use it; otherwise we may need a different endpoint
                const response = await axios.get(`${backendUrl}/jobdetailsmore/${jobId}`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                console.log("✅ FRONTEND: API call successful, response received");
                // Handle API response - backend now returns { status: true, job, ... }
                if (response.data.status && response.data.job) {
                    setJob(response.data.job);
                } else if (response.data.job) {
                    setJob(response.data.job);
                } else if (response.data) {
                    setJob(response.data);
                } else {
                    setError("Job data not found in response");
                }
            } catch (err) {
                setError("Failed to load job details");
                console.error("Error fetching job details:", err);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId, backendUrl]);

    useEffect(() => {
        // Initialize Bootstrap carousel
        if (job && job._company?.mediaGallery?.length > 0) {
            const carouselElement = document.querySelector("#carouselExampleIndicators");
            if (carouselElement && window.bootstrap) {
                new window.bootstrap.Carousel(carouselElement, {
                    interval: 3000,
                    ride: "carousel",
                });
            }
        }
    }, [job]);

    useEffect(() => {
        // Handle video modal
        const videoModal = document.getElementById('videoModal');
        if (videoModal && window.bootstrap) {
            const modalInstance = new window.bootstrap.Modal(videoModal);
            
            videoModal.addEventListener('show.bs.modal', (event) => {
                const button = event.relatedTarget;
                const link = button?.getAttribute('data-bs-link');
                const videoElement = document.getElementById('vodeoElement');
                if (videoElement && link) {
                    videoElement.src = link;
                    if (videoRef.current) {
                        videoRef.current.load();
                    }
                }
            });

            videoModal.addEventListener('hide.bs.modal', () => {
                if (videoRef.current) {
                    videoRef.current.pause();
                }
            });
        }
    }, []);

    const handleVideoClick = (videoUrl) => {
        const videoModal = document.getElementById('videoModal');
        const videoElement = document.getElementById('vodeoElement');
        if (videoElement && videoUrl) {
            videoElement.src = videoUrl;
            if (videoRef.current) {
                videoRef.current.load();
            }
        }
        if (videoModal && window.bootstrap) {
            const modalInstance = window.bootstrap.Modal.getInstance(videoModal) || new window.bootstrap.Modal(videoModal);
            modalInstance.show();
        }
    };

    const handleApplyNow = () => {
        const returnUrl = `/candidate/job/${jobId}`;
        navigate(`/candidate/login?returnUrl=${returnUrl}`);
    };

    if (loading) return <FrontLayout><div className="text-center py-5">Loading job details...</div></FrontLayout>;
    if (error) return <FrontLayout><div className="text-center py-5 text-danger">Error: {error}</div></FrontLayout>;
    if (!job) return <FrontLayout><div className="text-center py-5">Job not found</div></FrontLayout>;

    const mediaGallery = job._company?.mediaGallery || [];
    const videoUrl = job._company?.mediaGalaryVideo ? `${bucketUrl}/${job._company.mediaGalaryVideo}` : '';

    let thumbnailUrl = '';
    if (job.jobVideoThumbnail) {
        // jobVideoThumbnail is usually already an absolute URL from S3
        if (job.jobVideoThumbnail.startsWith('http://') || job.jobVideoThumbnail.startsWith('https://')) {
            thumbnailUrl = job.jobVideoThumbnail;
        } else {
            // If relative, make it absolute using bucketUrl
            const thumbPath = job.jobVideoThumbnail.startsWith('/') 
                ? job.jobVideoThumbnail.slice(1) 
                : job.jobVideoThumbnail;
            thumbnailUrl = bucketUrl ? `${bucketUrl}/${thumbPath}` : job.jobVideoThumbnail;
        }
    } else if (job.thumbnail) {
        // thumbnail might be absolute or relative
        if (job.thumbnail.startsWith('http://') || job.thumbnail.startsWith('https://')) {
            thumbnailUrl = job.thumbnail;
        } else {
            const thumbPath = job.thumbnail.startsWith('/') 
                ? job.thumbnail.slice(1) 
                : job.thumbnail;
            thumbnailUrl = bucketUrl ? `${bucketUrl}/${thumbPath}` : job.thumbnail;
        }
    } else if (job._company?.logo) {
        // company logo might be absolute or relative
        if (job._company.logo.startsWith('http://') || job._company.logo.startsWith('https://')) {
            thumbnailUrl = job._company.logo;
        } else {
            const logoPath = job._company.logo.startsWith('/') 
                ? job._company.logo.slice(1) 
                : job._company.logo;
            thumbnailUrl = bucketUrl ? `${bucketUrl}/${logoPath}` : job._company.logo;
        }
    } else {
        // Default fallback
        thumbnailUrl = '/Assets/public_assets/images/newjoblisting/course_img.svg';
    }
    
    const jobDescriptionArray = job.jobDescription ? job.jobDescription.split('\n').filter(item => item.trim()) : [];
    const dutiesArray = job.duties ? job.duties.split('\n').filter(item => item.trim()) : [];
    const remarksArray = job.remarks ? job.remarks.split('\n').filter(item => item.trim()) : [];
    const questionsAnswers = job.questionsAnswers || [];

    // Meta tags data for social sharing
    const jobTitle = job.title || job.name || 'Job Opening';
    const companyName = job._company?.name || 'Focalyt';
    const jobDescription = job.jobDescription 
        ? job.jobDescription.substring(0, 200).replace(/\n/g, ' ').trim() + '...'
        : `Apply for ${jobTitle} at ${companyName}`;
    const shareUrl = `${window.location.origin}/jobdetailsmore/${jobId}`;
    // Ensure shareImage is always an absolute URL for Open Graph meta tags
    const shareImage = thumbnailUrl.startsWith('http') 
        ? thumbnailUrl 
        : `${window.location.origin}${thumbnailUrl.startsWith('/') ? thumbnailUrl : '/' + thumbnailUrl}`;

    return (
        <FrontLayout>
            <Helmet>
                {/* Primary Meta Tags */}
                <title>{jobTitle} - {companyName} | Focalyt</title>
                <meta name="title" content={`${jobTitle} - ${companyName}`} />
                <meta name="description" content={jobDescription} />
                
                {/* Open Graph / Facebook / WhatsApp */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={shareUrl} />
                <meta property="og:title" content={`${jobTitle} - ${companyName}`} />
                <meta property="og:description" content={jobDescription} />
                <meta property="og:image" content={shareImage} />
                <meta property="og:image:secure_url" content={shareImage} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:type" content="image/jpeg" />
                <meta property="og:site_name" content="Focalyt" />
                <meta property="og:locale" content="en_US" />
                
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={shareUrl} />
                <meta name="twitter:title" content={`${jobTitle} - ${companyName}`} />
                <meta name="twitter:description" content={jobDescription} />
                <meta name="twitter:image" content={shareImage} />
                <meta name="twitter:image:src" content={shareImage} />
            </Helmet>
            <section className="section-padding-120 mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 mx-auto py-md-2 p-sm-0">
                            <div className="row">
                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 my-auto">
                                    <div className="student_video">
                                        <a 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (videoUrl) handleVideoClick(videoUrl);
                                            }}
                                            className="pointer img-fluid"
                                        >
                                            <img 
                                                src={thumbnailUrl} 
                                                className="digi img-fluid shadow rounded" 
                                                alt="Job video thumbnail"
                                                onError={(e) => {
                                                    e.target.src = '/Assets/public_assets/images/newjoblisting/banner1.jpg';
                                                }}
                                            />
                                            <img 
                                                src="/Assets/public_assets/images/newjoblisting/play.svg" 
                                                alt="Play button" 
                                                className="play__btn"
                                            />
                                        </a>
                                    </div>
                                </div>
                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 my-xxl-0 my-xl-0 my-lg-0 my-mt-0 my-sm-3 my-3">
                                    <div className="student_video">
                                        <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel">
                                            <div className="carousel-indicators">
                                                {mediaGallery.length > 0 ? (
                                                    mediaGallery.map((_, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            data-bs-target="#carouselExampleIndicators"
                                                            data-bs-slide-to={i}
                                                            className={i === 0 ? "active activeclass" : "activeclass"}
                                                            aria-current={i === 0 ? "true" : "false"}
                                                            aria-label={`Slide ${i + 1}`}
                                                        />
                                                    ))
                                                ) : (
                                                    <button
                                                        type="button"
                                                        data-bs-target="#carouselExampleIndicators"
                                                        data-bs-slide-to="0"
                                                        aria-label="Slide 2"
                                                        className="activeclass"
                                                    />
                                                )}
                                            </div>
                                            <div className="carousel-inner focalgalery">
                                                {mediaGallery.length > 0 ? (
                                                    mediaGallery.map((photo, i) => (
                                                        <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                                                            <img
                                                                src={photo ? `${bucketUrl}/${photo}` : '/Assets/public_assets/images/newjoblisting/banner1.jpg'}
                                                                className="d-block w-100 rounded shadow"
                                                                alt={`Gallery ${i + 1}`}
                                                                onError={(e) => {
                                                                    e.target.src = '/Assets/public_assets/images/newjoblisting/banner1.jpg';
                                                                }}
                                                            />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <>
                                                        <div className="carousel-item active">
                                                            <img
                                                                src="/Assets/public_assets/images/newjoblisting/stu_img_one.svg"
                                                                className="d-block mx-auto"
                                                                alt="Default"
                                                            />
                                                        </div>
                                                        <div className="carousel-item">
                                                            <img
                                                                src="/Assets/public_assets/images/newjoblisting/stu_img.svg"
                                                                className="d-block mx-auto"
                                                                alt="Default"
                                                            />
                                                        </div>
                                                        <div className="carousel-item">
                                                            <img
                                                                src="/Assets/public_assets/images/newjoblisting/stu_img_one.svg"
                                                                className="d-block mx-auto"
                                                                alt="Default"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            {mediaGallery.length > 0 && (
                                                <>
                                                    <button
                                                        className="carousel-control-prev"
                                                        type="button"
                                                        data-bs-target="#carouselExampleIndicators"
                                                        data-bs-slide="prev"
                                                    >
                                                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                                        <span className="visually-hidden">Previous</span>
                                                    </button>
                                                    <button
                                                        className="carousel-control-next"
                                                        type="button"
                                                        data-bs-target="#carouselExampleIndicators"
                                                        data-bs-slide="next"
                                                    >
                                                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                                        <span className="visually-hidden">Next</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="pattern" id="job_theme">
                <div className="container">
                    <div className="row">
                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mx-auto text-center border-bottom pt-5">
                            <button onClick={handleApplyNow} className="btn btn_cta_apply px-5">
                                APPLY NOW
                            </button>
                        </div>
                        <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 mx-auto text-center pt-3">
                            <ul className="nav nav-pills mx-auto text-center" id="pills-tab" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'pills-home' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('pills-home')}
                                        type="button"
                                        role="tab"
                                    >
                                        Job Details
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'pills-profile' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('pills-profile')}
                                        type="button"
                                        role="tab"
                                    >
                                        Salary Description
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'pills-contact' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('pills-contact')}
                                        type="button"
                                        role="tab"
                                    >
                                        FAQ's
                                    </button>
                                </li>
                            </ul>
                            <div className="tab-content" id="pills-tabContent">
                                {/* Job Details Tab */}
                                <div
                                    className={`tab-pane fade ${activeTab === 'pills-home' ? 'show active' : ''} text-white`}
                                    id="pills-home"
                                    role="tabpanel"
                                >
                                    <div className="row feature-widget-7-row pt-4" id="apply_modal">
                                        <div className="col-xxl-8 col-xl-8 col-lg-12 col-md-12 col-sm-12 col-12 mb-3 mx-auto">
                                            <div className="course_details_col">
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/education.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Education"
                                                            />
                                                            Education
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job._qualification?.name || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/age.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Age"
                                                            />
                                                            Age
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job.ageMin || 'N/A'}-{job.ageMax || 'N/A'} Years
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/location.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Location"
                                                            />
                                                            Location
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body text-truncate text-end">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job.place || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/experience.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Experience"
                                                            />
                                                            Experience
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job.experience || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/job-mode.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Job Mode"
                                                            />
                                                            Job Mode
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job.work || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/shifts.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Shift"
                                                            />
                                                            Shift
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job.shift || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/gender.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Gender"
                                                            />
                                                            Gender
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job.genderPreference || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal">
                                                            <img
                                                                src="/Assets/public_assets/images/purple/experience.png"
                                                                className="img-fluid"
                                                                draggable="false"
                                                                alt="Skills"
                                                            />
                                                            Required Skills
                                                        </h5>
                                                    </div>
                                                    <div className="feature-widget-7__body required_skills text-end">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                            {job._techSkills?.map((skill, idx) => (
                                                                <span key={idx} className="tag">{skill.name}</span>
                                                            ))}
                                                            {job._nonTechSkills?.map((skill, idx) => (
                                                                <span key={`nontech-${idx}`} className="tag">{skill.name}</span>
                                                            ))}
                                                        </p>
                                                    </div>
                                                </div>
                                                {job.requirement && (
                                                    <div className="feature-widget-7 border-bottom">
                                                        <div className="feature-widget-7__icon-wrapper my-auto">
                                                            <h5 className="fw-normal">
                                                                <img
                                                                    src="/Assets/public_assets/images/purple/payout_icon.png"
                                                                    className="img-fluid"
                                                                    draggable="false"
                                                                    alt="Requirement"
                                                                />
                                                                Requirement
                                                            </h5>
                                                        </div>
                                                        <div className="feature-widget-7__body">
                                                            <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                {job.requirement}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {job.payOut && (
                                                    <div className="feature-widget-7 border-bottom">
                                                        <div className="feature-widget-7__icon-wrapper my-auto">
                                                            <h5 className="fw-normal">
                                                                <img
                                                                    src="/Assets/public_assets/images/purple/English_level.png"
                                                                    className="img-fluid"
                                                                    draggable="false"
                                                                    alt="Payout"
                                                                />
                                                                Payout
                                                            </h5>
                                                        </div>
                                                        <div className="feature-widget-7__body">
                                                            <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                {job.payOut}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Salary Description Tab */}
                                <div
                                    className={`tab-pane fade ${activeTab === 'pills-profile' ? 'show active' : ''} text-white`}
                                    id="pills-profile"
                                    role="tabpanel"
                                >
                                    <div className="row">
                                        <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12 mx-auto">
                                            <div className="row feature-widget-7-row pt-4" id="apply_modal">
                                                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-3 mx-auto">
                                                    <div className="course_details_col">
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto mx-auto">
                                                                <h5 className="fw-normal">
                                                                    <img
                                                                        src="/Assets/public_assets/images/purple/reg_fee.png"
                                                                        className="img-fluid"
                                                                        draggable="false"
                                                                        alt="Salary"
                                                                    />
                                                                    Salary {job.isFixed 
                                                                        ? `₹ ${job.amount || 'NA'}` 
                                                                        : `Range ₹ ${job.min || 'NA'} - ${job.max || 'NA'}`}
                                                                </h5>
                                                            </div>
                                                        </div>
                                                        {['Health Insurance', 'Overtime', 'Accomodation', 'Transport', 'PF', 'Joining Bonus', 'Fuel Allowance', 'Travel Allowance', 'Laptop', 'Mobile', 'Others'].map((benefit) => {
                                                            const hasBenefit = job.benifits?.includes(benefit);
                                                            return (
                                                                <div key={benefit} className="feature-widget-7 border-bottom">
                                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                                        <h5 className="fw-normal bullet">
                                                                            <img
                                                                                src="/Assets/public_assets/images/purple/ul_li_shape.svg"
                                                                                draggable="false"
                                                                                alt={benefit}
                                                                            />
                                                                            {benefit}
                                                                        </h5>
                                                                    </div>
                                                                    <div className="feature-widget-7__body">
                                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                            <img
                                                                                src={`/Assets/public_assets/images/icons/${hasBenefit ? 'active_tick.svg' : 'dis_tick.svg'}`}
                                                                                draggable="false"
                                                                                alt={hasBenefit ? 'Yes' : 'No'}
                                                                            />
                                                                            <img
                                                                                src={`/Assets/public_assets/images/icons/${hasBenefit ? 'dis_cross.svg' : 'active_cross.svg'}`}
                                                                                draggable="false"
                                                                                alt={hasBenefit ? 'Yes' : 'No'}
                                                                            />
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FAQ Tab */}
                                <div
                                    className={`tab-pane fade ${activeTab === 'pills-contact' ? 'show active' : ''} text-white`}
                                    id="pills-contact"
                                    role="tabpanel"
                                >
                                    <div className="row">
                                        <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12 mx-auto">
                                            <div className="single-footer">
                                                <ul className="contact-info">
                                                    <div className="row">
                                                        <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mx-auto text-center">
                                                            <div className="single-footer">
                                                                <ul className="contact-info color-pink mb-2">
                                                                    <h3 className="color-pink text-center mb-3">FAQ'S</h3>
                                                                    {questionsAnswers.length > 0 ? (
                                                                        questionsAnswers.map((item, index) => (
                                                                            <div key={index} className="accordion accordion-flush jobfaqs_accordian" id={`accordionFlushExample-${index}`}>
                                                                                <div className="accordion-item rounded-3 border-0 shadow mb-2">
                                                                                    <h2 className="accordion-header">
                                                                                        <button
                                                                                            className="accordion-button border-bottom collapsed fw-semibold"
                                                                                            type="button"
                                                                                            data-bs-toggle="collapse"
                                                                                            data-bs-target={`#flush-collapse${index}`}
                                                                                            aria-expanded="false"
                                                                                            aria-controls={`flush-collapse${index}`}
                                                                                        >
                                                                                            {item.Question}
                                                                                        </button>
                                                                                    </h2>
                                                                                    <div
                                                                                        id={`flush-collapse${index}`}
                                                                                        className="accordion-collapse collapse"
                                                                                        data-bs-parent={`#accordionFlushExample-${index}`}
                                                                                    >
                                                                                        <div className="accordion-body">
                                                                                            <p className="text-white">{item.Answer}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-white text-center">No FAQs available</p>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <br />
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Job Features */}
                            <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 mx-auto text-center border-top pt-3 pb-5 mt-3">
                                <div className="single-footer">
                                    <h3 className="color-pink text-center mb-3">JOB FEATURES</h3>
                                    <ul className="contact-info" style={{position: 'relative', color: '#fff'}}>
                                        {jobDescriptionArray.map((description, i) => (
                                            <li key={i}>
                                                <img
                                                    src="/Assets/public_assets/images/purple/ul_li_shape.svg"
                                                    draggable="false"
                                                    alt="bullet"
                                                />
                                                {description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Job Duties */}
                            {job.duties && (
                                <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-12 col-sm-12 col-12 mx-auto text-center border-top pt-5 mt-3">
                                    <div className="single-footer">
                                        <h3 className="color-pink text-center mb-3">JOB DUTIES</h3>
                                        <ul className="contact-info">
                                            {dutiesArray.map((duty, i) => (
                                                <li key={i}>
                                                    <img
                                                        src="/Assets/public_assets/images/purple/ul_li_shape.svg"
                                                        draggable="false"
                                                        alt="bullet"
                                                    />
                                                    {duty}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Job Remarks */}
                            {job.remarks && (
                                <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-12 col-sm-12 col-12 mx-auto text-center border-top pt-5 mt-3">
                                    <div className="single-footer">
                                        <h3 className="color-pink text-center mb-3">JOB REMARKS</h3>
                                        <ul className="contact-info">
                                            {remarksArray.map((remark, i) => (
                                                <li key={i}>
                                                    <img
                                                        src="/Assets/public_assets/images/purple/ul_li_shape.svg"
                                                        draggable="false"
                                                        alt="bullet"
                                                    />
                                                    {remark}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Video Modal */}
            <div
                className="modal fade"
                id="videoModal"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="videoModalTitle"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <button
                            type="button"
                            className="close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div className="modal-body p-0 text-center embed-responsive">
                            <video
                                ref={videoRef}
                                id="courseVid"
                                controls
                                autoPlay
                                className="video-fluid text-center"
                            >
                                <source id="vodeoElement" src="" type="video/mp4" className="img-fluid video-fluid" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            </div>

            <style>

                {
                    `
                    * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
div#videoModal .modal-content {
    background: transparent;
    border: 0;
}
video#courseVid {
    width: 100%;
    height: auto;
    border-radius: 6px;
}
body{
    background-color: #121212!important;
}
figure {
    margin: 0;
}
ul {
    list-style: none;
    padding-left: initial;
}
.main-job{
    display: flex;
    gap: 12px;
}
#que p {
    color: #FC2B5A!important;
}
.overflow-x-auto{
    overflow-x: hidden;
}
.student_vedio {
    border: 1px solid #FC2B5A;
}
.brand-logo img {
    width: 180px;
    height: auto;
}
.year{
    font-size: 12px;
}
.over{
    overflow-y: hidden!important;
}
.active_menu {
    color: #FC2B5A;
    background: #fff;
    border-radius: 10px;
    padding: 0px 10px !important;
    line-height: 0px !important;
    font-weight: 500;
}

.perpendicular-list::-webkit-scrollbar {
    width: 6px !important;
    height: 4px;
}

.perpendicular-list::-webkit-scrollbar-track {
    background: #F1F1F1;
    border-radius: 50px !important;
}

.perpendicular-list::-webkit-scrollbar-thumb {
    background: #CAA03F;
    border-radius: 50px !important;
}

.perpendicular-list::-webkit-scrollbar-thumb:hover {
    background: #15284E;
}

.perpendicular-list {
    list-style: none;
    display: -webkit-inline-box;
    justify-content: space-evenly;
    overflow-x: auto;
    padding: 0px;
    width: 100%;
    -webkit-box-flex: 0;
    -webkit-flex: none;
    flex: none;
    display: flex;
  overflow-x: auto;
}

.perpendicular-list-item {
    display: flex;
    align-items: center;
    color: #fff;
    box-shadow: 0px 0px 14px 6px rgba(0, 0, 0, 0.55);
    border-radius: 12px;
    padding: 5px 14px;
    margin: 10px 9px 10px 2px;
    transition: 0.3s ease;
    flex: 0 0 auto;
  width: auto;
}

.perpendicular-list-item:hover {
    background-color: #FC2B5A;
    color: white;
    cursor: pointer;
}

.perpendicular-list-item p {
    color: #fff;
    font-size: 15px;
    line-height: 17px;
    /* text-align: center; */
    font-family: "inter", sans-serif;
}

.perpendicular-text {
    color: #fff;
    margin: 0px;
}

figure {
    margin: 0 !important;
}
.video{
    width: 100%;
}
figure img {
    width: 20px;
    padding-top: 4px;
}

.form-select:focus {
    outline: none;
    border-color: initial;
    box-shadow: none;
}

.form-select {
    border: none;
}

.jobs {
    background-color: #FFF;
}

.jobs h1 {
    color: #FC2B5A;
    font-size: 45px;
    font-weight: 700;
    font-family: 'INTER', sans-serif;
}

.card {
    border: none;
    border-radius: 13px;
}

.bg-img {
    position: relative;
    border-radius: 11px;
    border: 1px solid #ffffff;
    box-shadow: rgb(227, 59, 22, 77%) 0px 0px 0.25em, rgba(24, 86, 201, 0.05) 0px 0.25em 1em;
}

.bg-img img {
    width: 100%;
    border-radius: 10px;
}

/* .bg-img .group1 {
    position: absolute;
    top: 90px;
    left: 140px;
    width: 20%;
    border: none;
} */
.bg-img{
    position: relative;
}
.match_card{
    font-size: 13px;
}
.match_del{
    font-size: 12px;
}
.text{
    text-decoration-color:#FF0000;
    text-decoration-thickness: 2px;
  }
  a#uploadedvideo {
    display: block;
}
.match_final{
    font-size: 15px;
    color: #FC2B5A;
    font-weight: 400;
}
.bullet img{
    width: 20px!important;
}
.stars img{
    width: 100%!important;
}
.review{
    color: #FFD542;
    font-size: 25px;
    font-weight: 400;
    line-height: normal;
}
.star_txt{
    color:#fff;
    line-height: normal;
}
.student-review{
    color:#fff;
    line-height: normal;
    font-size: 14px;
}
.jobsearch-img{
    display:flex;
    gap: 10px;
}
:root {
    --link_color: #9F1783;
}

*, ::before, ::after {
  box-sizing: border-box;
}

.link_wrap {
    /* padding: 0 20px;
    margin: 20px 0; */
    position: absolute;
    top: 0;
    left: 20px;
    background: #FFD542;
}

a {
    display: inline-block;
    text-decoration: none;
    line-height: 1;
}

.acc_style04 {
    background: var(--link_color);
    padding: 1em 4em;
    color: #fff;
    transition: all 0.2s ease-in;
    position: absolute;
}

.acc_style04::before {
    content: "";
    position: absolute;
    left: 14px;
    top: -2px;
    width: 24px;
    height: 74%;
    background: #c7c7c7;
    clip-path: polygon(100% 0%, 100% 100%, 50% 75%, 0 100%, 0 0);
    transition: all 0.2s ease-in;
}

.acc_style04:hover::before {
    height: 90%;
}
.section-padding-top{
    padding-top: 80px!important;
}
.ellipsis{
    max-width: 380px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .cta_cols_list {
    padding: 5px 14px;
    margin: 10px 9px 10px 2px;
    flex: 0 0 auto;
    width: auto;
}
#flag {
    background: #ffca28;
    display: inline-block;
    height: auto;
    position: absolute;
    width: 70px;
    top: 0;
    left: 9px;
}
#flag p{
    line-height: 15px;
}
#flag .course_card{
    font-size: 11px;
}
#flag:before {
    content: "";
    position: absolute;
    width: 100%;
    clip-path: polygon(100% 0%, 100% 100%, 50% 35%, 0 100%, 0 0);
    top: 60px;
    background: #ffca28;
    height: 22px;
}
#base {
    background: #ffca28;
    display: inline-block;
    height: auto;
    position: absolute;
    width: 90px;
    top: 0;
    left: 9px;
}
#base:before {
    content: "";
    position: absolute;
    width: 100%;
    clip-path: polygon(100% 0%, 100% 100%, 50% 35%, 0 100%, 0 0);
    top: 20px;
    /* top: 59px; */
    background: #ffca28;
    height: 22px;
}
#base {
    background: #ffca28;
    display: inline-block;
    height: auto;
    position: absolute;
    width: 90px;
    top: 0;
    left: 9px;
}
.courseCard #base:before {
    content: "";
    position: absolute;
    width: 100%;
    clip-path: polygon(100% 0%, 100% 100%, 50% 35%, 0 100%, 0 0);
    top: 40px;
    /* top: 59px; */
    background: #ffca28;
    height: 22px;
}
  #base p{
    line-height: 20px;
  }
.bg-img .group2 {
    position: absolute;
    width: 20%;
    height: 30%;
    top: -6px;
    left: 0;
    border: none;
    background: transparent;
}

.bg-img .digi-price {
    line-height: 3.5rem;
}

.card-body {
    background-size: 100% !important;
    background-position: center;
    background-image: url("/public_assets/images/newjoblisting/pattern-bg.jpg") !important;
    background-repeat: no-repeat;
    position: relative !important;
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, 0.89);
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
}

.card-title {
    color: #FC2B5A !important;
    text-align: center;
    font-family: Inter, sans-serif;
    font-size: 22px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
}
.card-body h5 {
    color: #FFF;
    text-align: center;
    font-family: Inter, sans-serif;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 0.9rem;
}
.c_rupee{
    font-size: 17px;
    height: auto;
    /* color: #FC2B5A; */
    color: #fff;
}
.c_price{
    color: #FFF;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    font-size: 17px;
}
.c_n_rupee{
    font-size: 33px;
    height: auto;
    /* color: #FC2B5A; */
    color: #fff;
}
.c_n_price{
    color: #FFF;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    font-size: 33px;
}

.rupee {
    /* font-size: 20px; */
    height: auto;
    color: #FC2B5A;
    font-weight: 400;
}

.r-price {
    color: #FFF;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    font-size: 15px;
}
button.accordion-button {
    font-weight: 600;
}
.accordion-body.text-start {
    font-size: 14px;
}
.rej-price{
    font-size: 10px;
}
.courses_feature p {
    font-size: 13px;
}

.btn-apply {
    width: 120px;
    color: #FC2B5A !important;
    font-size: 15px;
    font-weight: 600;
    border-radius: 15px;
    border: none;
    background-color: #FFF;
    font-family: "Inter", sans-serif !important;
    padding: 5px 10px;
    text-align: center;
}

.btn-apply:hover {
    background-color: #FC2B5A;
    color: #FFF !important;
    cursor: pointer !important;
}


a {
    text-decoration: none;
}
header{
    background-color: #121212;
}
.margin-top-120{
    margin-top: 120px;
}
.pattern {
    background-image: url(/Assets/public_assets/images/pattern-bg.jpg);
    background-position: center center;
    transform-origin: 0 0;
    background-size: initial;
    background-repeat: repeat;
    position: relative !important;
    box-shadow: inset 0 0 0 1000px rgba(18, 18, 18, 0.92);
}
#job_theme a.btn.btn_cta_apply,
#job_theme button.btn.btn_cta_apply {
    color: #5c2b5a !important;
}

a.btn.btn_cta_apply,
button.btn.btn_cta_apply {
    color: #FC2B5A;
    background: #fff;
    border-radius: 20px;
    font-weight: 600;
    padding: 5px 20px;
    border: none;
    cursor: pointer;
    /* width: 30%; */
    margin: 0 auto;
    display: inline-block;
    font-size: 20px;
    margin-bottom: 30px;
    transition: all 0.3s ease, background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
    transform: scale(1);
}

#job_theme a.btn.btn_cta_apply,
#job_theme button.btn.btn_cta_apply {
    transition: all 0.3s ease, background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
}

button.btn.btn_cta_apply:hover,
a.btn.btn_cta_apply:hover {
    background: #FC2B5A;
    color: #fff !important;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(252, 43, 90, 0.4);
}

#job_theme button.btn.btn_cta_apply:hover,
#job_theme a.btn.btn_cta_apply:hover {
    background: #FC2B5A !important;
    color: #fff !important;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(252, 43, 90, 0.4);
}

button.btn.btn_cta_apply:active,
a.btn.btn_cta_apply:active,
button.btn.btn_cta_apply:focus,
a.btn.btn_cta_apply:focus {
    background: #FC2B5A;
    color: #fff !important;
    outline: none;
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(252, 43, 90, 0.3);
    transition: all 0.1s ease;
}

#job_theme button.btn.btn_cta_apply:active,
#job_theme a.btn.btn_cta_apply:active,
#job_theme button.btn.btn_cta_apply:focus,
#job_theme a.btn.btn_cta_apply:focus {
    background: #FC2B5A !important;
    color: #fff !important;
}

ul#pills-tab {
    justify-content: space-evenly;
}
    #job_theme ul#pills-tab .nav-link.active {
    background: #5c2b5a !important;
}
#job_theme ul#pills-tab .nav-link {
    color: #FFF !important;
}
ul#pills-tab .nav-link.active {
    background: #FC2B5A;
    color: #ffffff;
}
ul#pills-tab .nav-link {
    color: #FC2B5A;
    font-weight: 600;
}
#job_theme .course_details_col {
    border: 1px solid #FFD542 !important;
}
.course_details_col {
    background: rgba(217, 217, 217, 0.3);
    border: 1px solid #FC2B5A;
    border-radius: 25px;
    padding: 30px 30px;
}
div#apply_modal .feature-widget-7.border-bottom {
    padding: 7px 0px;
}
#job_theme .feature-widget-7.border-bottom {
    border-bottom: 1px solid #FFD542 !important;
}
div#apply_modal .feature-widget-7 {
    grid-column-gap: 20px;
    grid-row-gap: 20px;
    grid-template-rows: auto;
    grid-template-columns: max-content;
    grid-auto-columns: auto;
    align-items: center;
    padding: 15px 20px;
    display: flex !important;
    width: 100% !important;
    flex-wrap: wrap;
    border-radius: 0px;
    justify-content: space-between;
}
.feature-widget-7.border-bottom {
    border-bottom: 1px solid #FC2B5A !important;
}
.feature-widget-7 {
    grid-column-gap: 20px;
    grid-row-gap: 20px;
    border-radius: 15px;
    grid-template-rows: auto;
    grid-template-columns: 40px 1fr;
    grid-auto-columns: 1fr;
    align-items: center;
    padding: 10px 20px;
    /* padding: 15px 20px; */
    display: grid;
}
.active .feature-widget-7__icon-wrapper h5 {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    text-align: center;
    color: #fff;
    font-weight: 800;
    font-size: .999rem;
    -webkit-user-select: none;
    user-select: none;
    /* color: #fff !important; */
    margin: 0 auto !important;
    /* border: 1px solid #fc2b5a !important; */
    transition: .3s ease !important;
    transition: .3s ease;
}
div#apply_modal img {
    width: 30px;
    padding-left: 5px;
    padding-right: 5px;
}

@media (min-width: 992px) {
    .feature-widget-7 {
        flex-direction: row;
        justify-content: initial;
        align-items: initial;
        text-align: initial;
    }
}
@media (min-width: 1400px) {
    .feature-widget-7 {
        column-gap: 24px;
    }
}
.header .nav-link {
    color: white !important;
}
#features_cta .head {
    font-size: 13px !important;
}

#carouselExampleIndicators .carousel-indicators button.active {
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background-color: rgba(255, 42, 86, 1);

}

.carousel-indicators button {
    color: white;
    width: 10px!important;
    height: 10px!important;
    border-radius: 50%;
    border: 1px solid #FC2B5A!important;
}
.pree {
    background: transparent !important;
}

body {
    background-color: #121212;
}

.footer {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.page-link{
    color: #000!important;
}
.page-item.active .page-link {
    z-index: 3;
    color: #fff!important;
    border-color: #dee2e6;
    background-color: #FC2B5A;
}
.page-item.active   {
    border: none;
}
.page-link:focus {
    outline: none;
    box-shadow: none;
    border: none;
  }

/* contact-form */
.contact-form .form-group .form-contro:hover
{
  border: 1px solid #FC2B5A !important;
  box-shadow: 2px 5px #FC2B5A !important;
  transition: .3s ease-in;
  cursor: pointer;
}
.contact-form .form-group .form-contro
{
  border: 1px solid #666762;
  background-color: #fff;
  transition: .2s ease-in-out;
}
input[type="text"], input[type="password"], input[type="email"], textarea
{
  background: #e4e4e4 none repeat scroll 0 0;
    background-color: rgb(228, 228, 228);
  border: medium none;
  float: left;
  font-size: 12px;
  font-weight: 400;
  margin-bottom: 20px;
  padding: 19px 28px;
  width: 100%;
}
.distance-btn{
    background-color: #FC2B5A;
    color: #fff;
}
.distance-btn:hover{
    outline: none;
    border: 1px solid #FC2B5A;
    color: #FC2B5A!important;
    transition: ease .3s;
}
.font-weight-bold{
    font-weight: 700!important;
}
.distance-color:hover
{
  color: #FC2B5A !important;
}
.contact a:hover{
    color: #FC2B5A!important;
}
.contact-detail{
    font-size: 16px;
}
.fa{
  display: inline-block;
  font: normal normal normal 14px/1 FontAwesome;
    font-size: 14px;
  font-size: inherit;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
p
{
  color: #666666;
  font-size: 15px;
  margin-bottom: 30px;
  line-height: 29px;
}
a{
    color: #666666;
}
.fa-phone:hover{
    color: #121212;
}
.job-image-container img{
    width: 47%;
    position: absolute;
    bottom: 0;
    right: 7px;
}
.contact-form .form-group .form-contro {
    border: 1px solid #666762;
    background-color: #fff;
}
input[type="text"], input[type="password"], input[type="email"], textarea {
    background: #e4e4e4 none repeat scroll 0 0;
    border: medium none;
    float: left;
    font-size: 12px;
    font-weight: 400;
    margin-bottom: 20px;
    padding: 19px 28px;
    width: 100%;
}
p {
    font-size: 15px;
    line-height: 1.67;
    margin-bottom: initial;
    color: rgba(10, 16, 47, 0.8);
}
.footer-list a{
    font-size: 14px;
}
.morejobs{
    padding-top: 8px;
}
h4{
    margin-bottom: inherit;
}
ul{
    list-style:none;
    padding-left: inherit;
}
.footer-l02 .list-social li a:hover {
    background-color: var(--black-2);
    color: #fff;
}
.contact-form .form-group .form-contro:hover {
    border: 1px solid #FC2B5A !important;    
    box-shadow: 5px 10px #FC2B5A !important;    
  }

  input[type=color]:focus {
    border: 1px solid #FC2B5A !important;
    box-shadow: 5px 10px #FC2B5A !important;

  }
  .distance-btn {
    background-color: #FC2B5A !important;
    color: #fff;
    justify-content: center;
}
.distance-btn:hover {
    background-color: white !important;
    color: #FC2B5A !important;
    border: 1px solid #FC2B5A !important;
}
footer-brand img {
    width: 200px;
    height: auto;
    align-items: center;
}

a.pointer.img-fluid {
    position: relative;
}
    .play__btn {
    width: 60px;
    height: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
/* #carouselExampleIndicators .active {
    color: white;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid #FC2B5A;
} */
.overflow-x-auto::-webkit-scrollbar {
    width: 10px; 
    height: 4px;
  }
  
  
  .overflow-x-auto::-webkit-scrollbar-track {
    background: #F1F1F1;
    border-radius: 50px !important;
  }
  
 
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #FC2B5A;
    border-radius: 5px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #FC2B5A; 
  }
  
  .fs-focal{
    font-size: 20px;
  }
.copyright-inner h4{
    font-size: 15px;
}
.add_review{
    font-size: 18px!important;
}
.review_card{
    background: #838383;
    border-radius: 20px;
    border: 1px solid #FC2B5A;
}
.review_details_col {
    background: #FC2B5A;
    border-top-left-radius: 20px !important;
    border-top-right-radius: 20px !important;
    border-bottom-left-radius: 15px !important;
    border-bottom-right-radius: 15px !important;
}
.img-reg{
    font-size: 24px!important;
}
.img-reg{
    width: 55px!important;
}
.focalgalery img {
    width: 85%;
    aspect-ratio: 3/2;
    object-fit: contain;
}
.bg-course-pink{
    background-color: #FC2B5A!important;
    border-radius: 10px!important;
    outline: none!important;
    border: none !important;
    color: #fff!important;
}
.bg-course-pink li img{
    width: 16px!important;   
}
.single-footer .faq-info li img {
    position: absolute;
    left: 15px;
    top: 5px;
    height: auto;
    width: 13px;
}
.single-footer .faq-info li {
    margin-bottom: 10px;
    color: #fff;
    font-weight: 400;
    position: relative;
    padding: 0px 0px 0px 19px;
    text-align: left;
    letter-spacing: .3px;
}
.faq-ques .single-footer h5{
    font-size: 16px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}
.faq-ques .single-footer .faq-ans {
   line-height: normal;
   letter-spacing: normal;
   font-size: 13px;
}
.accordion{
    border: none!important;
    outline: none!important;
    --bs-accordion-btn-active-icon: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23ffffff'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e") !important;
    --bs-accordion-btn-icon:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23ffffff'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")!important;
}
.faq-ques .accordion-body {
    padding: 0!important;
}
.accordion-button:focus {
    box-shadow: none!important;
    outline: none!important;
}
.course_star img{
    width: 70%;
}
.btn_contact_us{
    color: #fff;
    background: #FC2B5A;
    font-weight: 400;
    padding: 5px 20px;
    margin: 0 auto;
    display: inline-block;
    font-size: 20px;
    margin-bottom: 30px;
    border-radius: 4px;
}
.bg-img a {
    display: block;
    max-height: 230px;
}
#callbackForm .form-control {
    background: transparent;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 12px 15px;
    color: #333;
    transition: all 0.3s ease;
}

#callbackForm .form-control:focus {
    box-shadow: none;
    border-color: #80bdff;
    background: rgba(255, 255, 255, 0.05);
}

#callbackForm textarea.form-control {
    resize: none;
    min-height: 80px;
}

#callbackForm .form-label {
    margin-bottom: 0.5rem;
    font-weight: 500;
}



@media only screen and (max-width: 1930px) {
    .bg-img {
        position: relative;
    }

    /* .bg-img .group1 {
        position: absolute;
        top: 95px;
        left: 170px;
        width: 65px;
        border: none;
    } */
}

@media only screen and (max-width:1399px) {
    .bg-img {
        position: relative;
    }

    /* .bg-img .group1 {
        position: absolute;
        top: 90px;
        left: 145px;
        width: 55px;
        border: none;
    } */
}

@media only screen and (max-width:1199px) {
    .card-padd {
        display: flex;
        justify-content: center;
        padding-left: 0 !important;
    }

    .bg-img {
        position: relative;
    }

    /* .bg-img .group1 {
        position: absolute;
        top: 71px;
        left: 111px;
        width: 55px;
        border: none;
    } */

    .card {
        width: 100%;
    }

    .btn.cta-callnow {
        background: #fff;
        color: #FC2B5A;
        font-family: inter;
        border-radius: 50px;
        font-weight: 500;
        padding: 4px 10px;
        width: 100%;
        font-size: 14px;
        letter-spacing: 1px;
        transition: .3s;
    }

    .courses_feature p {
        font-size: 13px;
    }
}

@media (max-width:1024px) {
    .site-menu-main .nav-link-item {
        padding-top: 10px !important;
        padding-bottom: 10px !important;
    }
}

@media only screen and (max-width:992px) {
    .perpendicular-list {
        overflow-x: visible;
      }
    .bg-img {
        position: relative;
    }

    /* .bg-img .group1 {
        position: absolute;
        top: 85px;
        left: 130px;
        width: 55px;
        border: none;
    } */
    .job-image-container img{
        width: 37%;
        position: absolute;
        bottom: 0;
        right: 7px;
    }
    .footer-brand img {
        width: 156px!important;
        height: auto;
        align-items: center;
    }
    .apply-button{
        font-size: 12px!important;
        width: 80%!important;
    }
    .perpendicular-list-item p{
        font-size: 12px!important;
    }
}
@media only screen and (max-width:767px) {
    #how_sliderdual.slick-slide.feature-widget-7 {
            z-index: 1;
            background-color: #fff!important;
            /* box-shadow: 0 12px 40px rgba(105,131,160,.2); */
            border-radius: 20px;
            width: 100%;
            padding: 10px 20px;
            transition: .3s ease;
        
      }
      .bg-img a {
        display: block;
        max-height: auto!important;
    }
   .jobsearch-img{
    display: block;
   }
    .copyright-inner{
       margin-bottom: 35px;
    }
    .overflow-x-auto{
        overflow-x: auto;
    }
    .navbar-brand {
        width: 69%;
    }

    .figure img {
        width: 20%;
    }
    .jobs h1{
        font-size: 34px;
    }
    .jobs-heading {
        font-size: 22px;
    }

    .card {
        width: 95% !important;
    }

    .similar-jobs-heading h1{
        font-size: 45px;
    }
    /* .job-image-container img{
        width: 30%;
        position: absolute;
        bottom: 0;
        right: 7px;
    } */
    .contact-detail {
        font-size: 11px;
    }
    
div#features_cta img {
    width: 70px;
    height: auto;
    text-align: center;
    margin: 0 auto;
    /* transition: ; */
}
#features_cta .head {
    font-size: 9px !important;
}
.cta_cols{
    padding: 10px;
    margin: 2px 9px 2px 2px;
}
ul.d-flex.justify-content-between.overflow-x-auto {
    padding: 0px;
}
ul.h-100.d-flex.align-items-center.justify-content-between {
    margin-bottom: 0px;
}
}
@media(max-width:740px){
    .copyright-inner p {
        font-size: 15px;
        margin-bottom: 0;
      }
      .apply-button {
        font-size: 9px!important;
        width: 70%;
    }
    .r-prices{
        line-height: 15px!important;
    } 
}
@media only screen and (max-width:700px) {
    .header .navbar-brand img {
        width: 70%;
    }

    .figure img {
        width: 20%;
    }
    /* .bg-img .group1 {
        position: absolute;
        top: 90px;
        left: 150px;
        width: 55px;
        border: none;
    } */

    .card {
        width: 95% !important;
    }
    /* .job-image-container img {
        width: 40%;
        height: auto;
        position: absolute;
        right: 0;
        bottom: 0;
    } */
}
@media only screen and (max-width: 720px){
    .contact-detail {
        font-size: 9px;
    }
}
@media(max-width:640px){
    .copyright-inner p {
        font-size: 13px;
        margin-bottom: 0;
      }
      
}
@media(max-width:576px){
    .job-image-container img {
        width: 34%;
        height: auto;
        position: absolute;
        right: 0;
        bottom: 0;
    }
}
@media (max-width:400px){

}
@media (max-width:392px) {
    .courses_feature p {
        font-size: 12px;
    }

    .btn.cta-callnow {
        background: #fff;
        color: #FC2B5A;
        font-family: inter;
        border-radius: 50px;
        font-weight: 500;
        padding: 4px 10px;
        width: 100%;
        font-size: 14px;
        letter-spacing: 1px;
        transition: .3s;
    }
}

@media(max-width:327px) {
    .btn.cta-callnow {
        background: #fff;
        color: #FC2B5A;
        font-family: inter;
        border-radius: 50px;
        font-weight: 500;
        padding: 4px 10px;
        width: 100%;
        font-size: 13px !important;
        letter-spacing: 1px;
        transition: .3s;
    }
}       
 .single-footer .contact-info li img {
    position: absolute;
    left: 3px;
    top: 7px;
    height: auto;
    width: 13px;
} 
.single-footer .contact-info {
    margin-top: 15px;
}
    .single-footer ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}
    
#job_theme .color-pink {
    color: #FFD542 !important;
}

`
                }
            </style>
        </FrontLayout>
    );
}

export default JobDetails;
