import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import "./CourseDetails.css"
import FrontLayout from '../../../Component/Layouts/Front';

function CourseDetails() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [termsArray, setTermsArray] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const coursePhotos = course?.photos || []; // Ensure it's an array
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:8080/coursedetails/${courseId}`);
                setCourse(response.data.course);
            } catch (err) {
                setError("Failed to load course details");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        const carouselElement = document.querySelector("#courseCarousel");
        if (carouselElement) {
            new window.bootstrap.Carousel(carouselElement, {
                interval: 1000, // Auto-slide every 3 seconds
                ride: "carousel",
            });
        }

        

        fetchCourseDetails();
       
        
    }, [courseId]);

    // Important Terms ko split karne ke liye alag useEffect
  useEffect(() => {
    if (course?.importantTerms) {
        setTermsArray(course.importantTerms.split("\n").filter(term => term.trim() !== ""));
    }
  }, [course]);
    console.log("Courses:", course);
    console.log("importantTerms:", termsArray);
    // console.log("Courses Exist:", course ? "Yes" : "No");
    // console.log("Course Keys:", Object.keys(course));
    // setTimeout(() => {
    //     console.log("importantTerms After Delay:", course?.importantTerms);
    //   }, 1000);



    // console.log("Bucket URL:", bucketUrl);
    // console.log("Extracted Photos:", coursePhotos); // Debugging



    if (loading) return <div>Loading course details...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <>
<FrontLayout>
            <section className="section-padding-120 mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-md-8 mx-auto py-3">
                            <div className="row">

                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mx-auto my-4">
                                    <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel">
                                        <div className="carousel-indicators">
                                            <button type="button" data-bs-target="#carouselExampleIndicators"
                                                data-bs-slide-to="" className="active activeclassName"
                                                aria-current="true" aria-label="Slide 1"></button>
                                            {/* else { %>
                                                            <button type="button"
                                                                data-bs-target="#carouselExampleIndicators"
                                                                data-bs-slide-to="0" aria-label="Slide 2"
                                                                className="activeclassName"></button> */}

                                        </div>
                                        <div className="carousel-inner ">
                                            <div id="courseCarousel" className="carousel slide" data-bs-ride="carousel">
                                                {/* Carousel Indicators */}
                                                {coursePhotos.length > 1 && (
                                                    <div className="carousel-indicators">
                                                        {coursePhotos.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                data-bs-target="#courseCarousel"
                                                                data-bs-slide-to={index}
                                                                className={index === 0 ? "active" : ""}
                                                                aria-current={index === 0 ? "true" : "false"}
                                                                aria-label={`Slide ${index + 1}`}
                                                            ></button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Carousel Items */}
                                                <div className="carousel-inner">
                                                    {coursePhotos.length > 0 ? (
                                                        coursePhotos.map((photo, index) => (
                                                            <div key={index} className={`carousel-item ${index === 0 ? "active" : ""}`}>
                                                                <img
                                                                    src={`${bucketUrl}/${photo}`}
                                                                    className="d-block w-100 rounded shadow"
                                                                    alt={`Course photo ${index + 1}`}
                                                                    onError={(e) => { e.target.src = "/Assets/public_assets/images/newjoblisting/banner1.jpg"; }}
                                                                />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="carousel-item active">
                                                            <img
                                                                src="/Assets/public_assets/images/newjoblisting/banner1.jpg"
                                                                className="d-block w-100 rounded shadow"
                                                                alt="Default course image"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Carousel Controls (Arrows) - Fixed Placement */}
                                                {coursePhotos.length > 1 && (
                                                    <>
                                                        <button className="carousel-control-prev" type="button" data-bs-target="#courseCarousel" data-bs-slide="prev">
                                                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                                            <span className="visually-hidden">Previous</span>
                                                        </button>
                                                        <button className="carousel-control-next" type="button" data-bs-target="#courseCarousel" data-bs-slide="next">
                                                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                                            <span className="visually-hidden">Next</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>



                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 text-center my-auto">
                                    <a href="#" data-bs-target="#videoModal" data-bs-toggle="modal"
                                        data-bs-link=""
                                        className="pointer img-fluid"><img
                                            src="/Assets/public_assets/images/newjoblisting/banner3.jpg"
                                            className="digi img-fluid shadow rounded" />
                                        <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt=""
                                            className="play__btn" /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="bg_hexa py-5">
                <div className="container">
                    <div className="row">
                        <div
                            className="col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mx-auto text-center border-bottom mb-3">
                            <a href="/candidate/login?returnUrl=/candidate/course/<%=course._id%>"
                                className="btn btn_cta_apply">Apply Now</a>
                        </div>
                        <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 mx-auto text-center">
                            <ul className="nav nav-pills mb-3  mx-auto text-center" id="pills-tab" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link active" id="pills-home-tab" data-bs-toggle="pill"
                                        data-bs-target="#pills-home" type="button" role="tab" aria-controls="pills-home"
                                        aria-selected="true">Course Details</button>
                                </li>
                                {/* <!-- <li className="nav-item" role="presentation">
                                <button className="nav-link" id="pills-profile-tab" data-bs-toggle="pill"
                                    data-bs-target="#pills-profile" type="button" role="tab"
                                    aria-controls="pills-profile" aria-selected="false">Course Fee Description</button>
                            </li> --> */}
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="pills-contact-tab" data-bs-toggle="pill"
                                        data-bs-target="#pills-contact" type="button" role="tab"
                                        aria-controls="pills-contact" aria-selected="false">FAQ's</button>
                                </li>
                                {/* <!-- <li className="nav-item" role="presentation">
                                <button className="nav-link" id="pills-reviews-tab" data-bs-toggle="pill"
                                    data-bs-target="#pills-review" type="button" role="tab" aria-controls="pills-review"
                                    aria-selected="false">Review</button>
                            </li>  --> */}
                            </ul>
                            <div className="tab-content" id="pills-tabContent">
                                <div className="tab-pane fade show active text-white" id="pills-home" role="tabpanel"
                                    aria-labelledby="pills-home-tab">
                                    <div className="row feature-widget-7-row pt-4" id="apply_modal">
                                        <div className="col-xxl-8 col-xl-8 col-lg-12 col-md-12 col-sm-12 col-12 mb-3 mx-auto">
                                            <div className="course_details_col">
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Eligibility.png"
                                                            className="img-fluid" draggable="false" />Eligibility</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">  {course.qualification}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Age.png"
                                                            className="img-fluid" draggable="false" />Age</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">

                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.age}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/newpage/index/modal/empl.svg"
                                                            className="img-fluid" draggable="false" />Location</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body text-truncate text-end">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.city}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Experience.png"
                                                            className="img-fluid" draggable="false" />Experience</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.experience}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* <!-- <div className="feature-widget-7 border-bottom">
                                      <div className="feature-widget-7__icon-wrapper my-auto">
                                          <h5 className="fw-normal"><img
                                                  src="/public_assets/images/newpage/index/modal/empl.svg"
                                                  className="img-fluid" draggable="false">English level</h5>
                                      </div>
                                      <div className="feature-widget-7__body">
                                          <p className="feature-widget-7__title mb-0 text-white fw-normal">Basic
                                          </p>
                                      </div>
                                  </div> --> */}
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Course_mode.png"
                                                            className="img-fluid" draggable="false" />Course Mode</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.qualification}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Course_duration.png"
                                                            className="img-fluid" draggable="false" />Course Duration</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.duration}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Course_type.png"
                                                            className="img-fluid" draggable="false" />Course Type</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.courseType}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Timing.png"
                                                            className="img-fluid" draggable="false" />Timings</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.onlineTrainingTiming}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto text-end">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/Institute_name.png"
                                                            className="img-fluid" draggable="false" />Institute Name</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body text-truncate text-end">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal ">{course.courseType}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="feature-widget-7 border-bottom">
                                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                                        <h5 className="fw-normal"><img
                                                            src="/Assets/public_assets/images/jobicons/job_training.png"
                                                            className="img-fluid" draggable="false" />On Job Training</h5>
                                                    </div>
                                                    <div className="feature-widget-7__body">
                                                        <p className="feature-widget-7__title mb-0 text-white fw-normal">{course.ojt}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="tab-pane fade text-white" id="pills-profile" role="tabpanel"
                                    aria-labelledby="pills-profile-tab">
                                    <div className="row">
                                        <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12 mx-auto">
                                            <div className="row feature-widget-7-row pt-4" id="apply_modal">
                                                <div
                                                    className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-3 mx-auto">
                                                    <div className="course_details_col">
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto mx-auto">
                                                                <h5 className="fw-normal"><img
                                                                    src="/Assets/public_assets/images/jobicons/Eligibility.png"
                                                                    className="img-fluid" draggable="false" />Registration Fee
                                                                    : &#8377;
                                                                </h5>
                                                            </div>
                                                        </div>
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto">
                                                                <h5 className="fw-normal bullet"><img
                                                                    src="/assets/public_assets/images/ul_li_shape.svg"
                                                                    draggable="false" />Course Fee</h5>
                                                            </div>
                                                            <div className="feature-widget-7__body">

                                                                <p
                                                                    className="feature-widget-7__title mb-0 text-white fw-normal">

                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto">
                                                                <h5 className="fw-normal bullet"><img
                                                                    src="/Assets/public_assets/images/ul_li_shape.svg"
                                                                    draggable="false" />Exam Fee</h5>
                                                            </div>
                                                            <div className="feature-widget-7__body">
                                                                <p
                                                                    className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                    &#8377;
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto">
                                                                <h5 className="fw-normal bullet"><img
                                                                    src="/public_assets/images/ul_li_shape.svg"
                                                                    draggable="false" />Stipend During Training</h5>
                                                            </div>
                                                            <div className="feature-widget-7__body">
                                                                <p
                                                                    className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                    &#8377;
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto">
                                                                <h5 className="fw-normal bullet"><img
                                                                    src="/Assets/public_assets/images/ul_li_shape.svg"
                                                                    draggable="false" />Any Other Charges</h5>
                                                            </div>
                                                            <div className="feature-widget-7__body">
                                                                <p
                                                                    className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                    &#8377;
                                                                </p>
                                                            </div>
                                                            {/* <!-- <div className="feature-widget-7__body">
                                                            <p
                                                                className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                <img src="/public_assets/images/icons/<%=course.otherFee==='Yes'? 'active_tick.svg' :'dis_tick.svg'%>"
                                                                    draggable="false">
                                                                <img src="/public_assets/images/icons/<%=course.otherFee==='Yes'? 'dis_cross.svg' :'active_cross.svg'%>"
                                                                    draggable="false">
                                                            </p>
                                                        </div> --> */}
                                                        </div>
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto">
                                                                <h5 className="fw-normal bullet"><img
                                                                    src="/Assets/public_assets/images/ul_li_shape.svg"
                                                                    draggable="false" />Installment Option</h5>
                                                            </div>
                                                            <div className="feature-widget-7__body">
                                                                <p
                                                                    className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                    <img src="/Assets/public_assets/images/icons"
                                                                        draggable="false" />
                                                                    <img src="/Assets/public_assets/images/icons"
                                                                        draggable="false" />
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto">
                                                                <h5 className="fw-normal bullet"><img
                                                                    src="/public_assets/images/ul_li_shape.svg"
                                                                    draggable="false" />Max. EMI Tenure</h5>
                                                            </div>
                                                            <div className="feature-widget-7__body">
                                                                <p
                                                                    className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="feature-widget-7 border-bottom">
                                                            <div className="feature-widget-7__icon-wrapper my-auto">
                                                                <h5 className="fw-normal bullet"><img
                                                                    src="/Assets/public_assets/images/ul_li_shape.svg"
                                                                    draggable="false" />Bank Loan Option</h5>
                                                            </div>
                                                            <div className="feature-widget-7__body">
                                                                <p
                                                                    className="feature-widget-7__title mb-0 text-white fw-normal">
                                                                    <img src="/Assets/public_assets/images/icons/"
                                                                        draggable="false" />
                                                                    <img src="/Assets/public_assets/images/icons/"
                                                                        draggable="false" />
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <div className="tab-pane fade text-white" id="pills-contact" role="tabpanel"
                                    aria-labelledby="pills-contact-tab">
                                    <div className="row">
                                        <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12 mx-auto">
                                            <div className="single-footer">
                                                <ul className="contact-info color-pink mb-2">
                                                    <h3 className="color-pink text-center mb-3">
                                                        FAQ'S
                                                    </h3>
                                                </ul>
                                                <div className="accordion accordion-flush faqs_accordian"
                                                    id="accordionFlushExample">
                                                    <div className="accordion-item rounded-3 border-0 shadow mb-2">
                                                        <h2 className="accordion-header">
                                                            <button
                                                                className="accordion-button border-bottom collapsed fw-semibold"
                                                                type="button" data-bs-toggle="collapse"
                                                                data-bs-target="#flush-collapse"
                                                                aria-expanded="false"
                                                                aria-controls="flush-collapse">
                                                            </button>
                                                        </h2>
                                                        <div id="flush-collapse"
                                                            className="accordion-collapse collapse"
                                                            data-bs-parent="#accordionFlushExample">
                                                            <div className="accordion-body">
                                                                <p className="text-white"></p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <div className="tab-pane fade text-white" id="pills-review" role="tabpanel"
                                    aria-labelledby="pills-review-tab">
                                    <div className="row">
                                        <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                            <h3 className="text-uppercase jobs-heading pb-4 fw-bold color-pink text-uppercase">
                                                Live Course Reviews</h3>
                                        </div>
                                    </div>
                                    {/* <!-- <div className=" col-xl-12 text-center" data-aos-duration="1000" data-aos="fade-right">
                          <div className="content">
                            <div className="howfocal slider">
                              <div className="partner_col">
                                <img src="public_assets/images/dummy_review.jpg">
                              </div>
                              <div className="partner_col">
                                <img src="public_assets/images/dummy_review.jpg">
                              </div>
                              <div className="partner_col">
                                <img src="public_assets/images/dummy_review.jpg">
                              </div>
                            </div>
                          </div>
                        </div> --> */}
                                    <div className="row feature-widget-7-row pt-4" id="apply_modal">
                                        <div className="col-xxl-8 col-xl-8 col-lg-12 col-md-12 col-sm-12 col-12 mb-3 mx-auto">
                                            <div className="review_card">
                                                <div className="feature-widget-7 review_details_col">
                                                    <div className="feature-widget-7__icon-wrapper my-auto  mx-auto">
                                                        <h5 className="fw-normal stars"><img
                                                            src="/public_assets/images/jobicons/review_five.png"
                                                            draggable="false" /></h5>
                                                        <p className="text-center review">
                                                            4.8 out of 5
                                                        </p>
                                                        <p className="star_txt text-center">897 Students review this course</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="feature-widget-7">
                                                        <div className="feature-widget-7__icon-wrapper my-auto  mx-auto">
                                                            <h5 className="fw-normal"><img
                                                                src="/public_assets/images/jobicons/stu_img.png"
                                                                draggable="false" /> Student Name</h5>
                                                            <p className="review">
                                                                <img src="/public_assets/images/jobicons/review_star.png"
                                                                    draggable="false" />
                                                            </p>
                                                            <p className="student-review fw-light">Lorem ipsum dolor sit amet
                                                                consectetur
                                                                adipisicing elit. Necessitatibus tempore similique
                                                                reprehenderit veniam illo, accusamus voluptatem quos
                                                                provident optio non!</p>
                                                        </div>

                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="feature-widget-7">
                                                        <div className="feature-widget-7__icon-wrapper my-auto  mx-auto">
                                                            <h5 className="fw-normal"><img
                                                                src="/public_assets/images/jobicons/stu_img.png"
                                                                draggable="false" /> Student Name</h5>
                                                            <p className="review">
                                                                <img src="/public_assets/images/jobicons/review_star.png"
                                                                    draggable="false" />
                                                            </p>
                                                            <p className="student-review fw-light">Lorem ipsum dolor sit amet
                                                                consectetur
                                                                adipisicing elit. Necessitatibus tempore similique
                                                                reprehenderit veniam illo, accusamus voluptatem quos
                                                                provident optio non!</p>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                            {/* <!-- <div className="accordion accordion-flush" id="accordionFlushExample">
                                <div className="accordion-item">
                                  <h2 className="accordion-header" id="flush-headingOne">
                                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="true" aria-controls="flush-collapseOne">
                                        <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                            <h3 className="text-uppercase jobs-heading pb-4 fw-bold color-pink text-uppercase">Live Course Reviews</h1>
                                        </div>
                                    </button>
                                  </h2>
                                  <div id="flush-collapseOne" className="accordion-collapse collapse show" aria-labelledby="flush-headingOne" data-bs-parent="#accordionFlushExample" style="">
                                    <div className="accordion-body text-start"> 
                                        <div className="review_card">
                                            <div className="feature-widget-7 review_details_col">
                                                <div className="feature-widget-7__icon-wrapper my-auto  mx-auto">
                                                    <h5 className="fw-normal stars"><img
                                                        src="/public_assets/images/jobicons/review_five.png" draggable="false"></h5>
                                                        <p className="text-center review">
                                                            4.8 out of 5
                                                        </p>
                                                        <p className="star_txt">897 Students review this course</p>
                                                </div>
                                        </div>
                                        <div>
                                            <div className="feature-widget-7">
                                                <div className="feature-widget-7__icon-wrapper my-auto  mx-auto">
                                                    <h5 className="fw-normal"><img
                                                        src="/public_assets/images/jobicons/stu_img.png" draggable="false"> Student Name</h5>
                                                        <p className="review">
                                                            <img src="/public_assets/images/jobicons/review_star.png" draggable="false">
                                                        </p>
                                                        <p className="star_txt">Lorem ipsum dolor sit amet consectetur adipisicing elit. Necessitatibus tempore similique reprehenderit veniam illo, accusamus voluptatem quos provident optio non!</p>
                                                </div>
                                              
                                            </div>
                                        </div>
                                        <div>
                                            <div className="feature-widget-7">
                                                <div className="feature-widget-7__icon-wrapper my-auto  mx-auto">
                                                    <h5 className="fw-normal"><img
                                                        src="/public_assets/images/jobicons/stu_img.png" draggable="false"> Student Name</h5>
                                                        <p className="review">
                                                            <img src="/public_assets/images/jobicons/review_star.png" draggable="false">
                                                        </p>
                                                        <p className="star_txt">Lorem ipsum dolor sit amet consectetur adipisicing elit. Necessitatibus tempore similique reprehenderit veniam illo, accusamus voluptatem quos provident optio non!</p>
                                                </div>
                                              
                                            </div>
                                        </div>
                                       </div>
                                    </div>
                                  </div>
                                </div>
                              </div> --> */}
                                            <div
                                                className="col-xxl-7 col-xl-7 col-lg-7 col-md-12 col-sm-12 col-12 mx-auto text-center pt-3 mt-3">
                                                <a href="" className="btn btn_cta_apply px-5 add_review">Add Your Review</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {coursePhotos.brochure ?
                                <div
                                    className="col-xxl-8 col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 mx-auto text-center border-top pt-3 mt-3">
                                    <a href="" target="_blank"
                                        className="btn btn_cta_apply px-5">Download Brochure</a>
                                </div> : <div></div>}
                            <div className="col-xxl-8 col-xl-7 col-lg-7 col-md-12 col-sm-12 col-12 mb-3 mx-auto">
                                <div className="single-footer">
                                    <h3 className="color-pink text-center mb-3">
                                        COURSE FEATURES
                                    </h3>
                                    <ul className="contact-info text-start text-white pl-4">

                                        <li>
                                            <img src="/Assets/public_assets/images/ul_li_shape.svg"
                                                draggable="false" />
                                        </li>
                                    </ul>

                                </div>
                            </div>
                            {termsArray ? (
                                
                  
                            <div
                                className="col-xxl-8 col-xl-7 col-lg-7 col-md-12 col-sm-12 col-12 mb-3 mx-auto">
                                <div className="single-footer">
                                    <h3 className="color-pink text-center mb-3">
                                        TERMS
                                    </h3>{termsArray.map((term, index) => (
                                    <ul className="contact-info text-start text-white pl-4">
                                        <li>
                                            <img src="/Assets/public_assets/images/ul_li_shape.svg"
                                                draggable="false" />
                                                {term}

                                        </li>
                                        

                                    </ul>))}
                                </div>
                            </div>
                ) : (
                  <div></div>
                )}

                            {/* <!-- <div
                                            // className="col-xxl-8 col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 mx-auto text-center border-top pt-3 mt-4"> --> */}

                            <div
                                className="col-xxl-8 col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 mx-auto text-center border-top pt-3 mt-4">
                                <h3 className="pb-4 fw-light text-white">
                                    Have more questions?</h3>
                                <a href="/contact"
                                    className="btn_contact_us px-5 text-uppercase">contact us</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* <!-- Modal --> */}
            <div className="modal fade" id="videoModal" tabindex="-1" role="dialog" aria-labelledby="videoModalTitle"
                aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div className="modal-body p-0 text-center embed-responsive">
                            <video id="courseVid" controls autoPlay className="video-fluid text-center">
                                <source id="vodeoElement" src="" type="video/mp4" className="img-fluid video-fluid" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            </div>

</FrontLayout>
        </>
    )
}

export default CourseDetails
