import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CandidatesEvents = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [courseData, setCourseData] = useState({
    title: '',
    category: '',
    eligibility: '',
    duration: '',
    location: '',
    mode: '',
    videoThumbnail: '',
    videoLink: ''
  });

  useEffect(() => {
    // Initialize carousel when component mounts
    initCarousel();
    
    // You would typically fetch course data here from your API
    // Example:
    // const fetchCourseData = async () => {
    //   try {
    //     const response = await fetch(`${backendUrl}/course/details/${courseId}`);
    //     const data = await response.json();
    //     setCourseData(data);
    //   } catch (error) {
    //     console.error("Error fetching course data:", error);
    //   }
    // };
    // fetchCourseData();
  }, []);

  // Carousel initialization function
  const initCarousel = () => {
    document.querySelectorAll(".happy_candidate_images").forEach(container => {
      const slides = [...container.children];
      if (slides.length <= 1) return;

      container.insertAdjacentHTML("beforebegin", `
        <button class="carousel-btn prev">❮</button>
        <button class="carousel-btn next">❯</button>
      `);
      
      let currentSlide = 0;
      const updateSlides = () => slides.forEach((slide, i) => 
        slide.style.display = i === currentSlide ? "block" : "none"
      );
      
      container.parentNode.querySelector(".prev").addEventListener("click", () => { 
        currentSlide = (currentSlide - 1 + slides.length) % slides.length; 
        updateSlides(); 
      });
      
      container.parentNode.querySelector(".next").addEventListener("click", () => { 
        currentSlide = (currentSlide + 1) % slides.length; 
        updateSlides(); 
      });
      
      updateSlides();
    });
  };

  return (
    <>      
          <div id="add-Events">
            <div className="content-body">
              <div className="mb-2">
                <section className="searchjobspage">
                  {/* For Large Screens */}
                  <div className="forlrgscreen">
                    <div className="pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
                      <div className="course_nw mb-3">
                        <div className="row justify-content-sm-center justify-content-md-start">
                          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-10 mx-auto">
                            <div className="cr_nw_in">
                              <div className="right_obj shadow"></div>

                              {/* Video Button */}
                              <a href="#" data-target="#videoModal" data-toggle="modal" 
                                 className="video-bttn position-relative d-block">
                                <img 
                                  id="videoPlay" 
                                  src={courseData.videoThumbnail || ''} 
                                  className="video_thum img-fluid" 
                                  alt="Video Thumbnail" 
                                />
                                <img 
                                  src="/assets/images/newjoblisting/play.svg" 
                                  alt="Play Button" 
                                  className="group1" 
                                />
                              </a>

                              {/* Course Information */}
                              <div className="course_inf pt-0">
                                <Link to="/candidate/course/">
                                  <h5>{courseData.title}</h5>
                                  <span className="job_cate">{courseData.category}</span>
                                  
                                  <div className="row">
                                    {/* Eligibility Info */}
                                    <div className="col-md-6 col-sm-6 col-6">
                                      <div className="course_spec">
                                        <div className="spe_icon">
                                          <figure className="text-end">
                                            <img 
                                              src="/assets/images/newicons/eligibility.png" 
                                              className="img-fluid p-0 width" 
                                              draggable="false" 
                                              alt="Eligibility Icon"
                                            />
                                          </figure>
                                        </div>
                                        <div className="spe_detail">
                                          <p className="mb-0 text-black">Eligibility</p>
                                          <p className="mb-0 text-black">
                                            <small className="sub_head">({courseData.eligibility})</small>
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Duration Info */}
                                    <div className="col-md-6 col-sm-6 col-6">
                                      <div className="course_spec">
                                        <div className="spe_icon">
                                          <figure className="text-end">
                                            <img 
                                              src="/assets/images/newicons/duration.png" 
                                              className="img-fluid p-0 width" 
                                              draggable="false" 
                                              alt="Duration Icon"
                                            />
                                          </figure>
                                        </div>
                                        <div className="spe_detail">
                                          <p className="mb-0 text-black">Duration</p>
                                          <p className="mb-0 text-black">
                                            <small className="sub_head">({courseData.duration})</small>
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Location Info */}
                                    <div className="col-md-6 col-sm-6 col-6">
                                      <div className="course_spec">
                                        <div className="spe_icon">
                                          <figure className="text-end">
                                            <img 
                                              src="/assets/images/newicons/location.png" 
                                              className="img-fluid p-0 width" 
                                              draggable="false" 
                                              alt="Location Icon"
                                            />
                                          </figure>
                                        </div>
                                        <div className="spe_detail">
                                          <p className="mb-0 text-black">Location</p>
                                          <div className="ellipsis-wrapper">
                                            <p className="mb-0 text-black para_ellipsis" title={courseData.location}>
                                              <small className="sub_head">{courseData.location}</small>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Mode Info */}
                                    <div className="col-md-6 col-sm-6 col-6">
                                      <div className="course_spec">
                                        <div className="spe_icon">
                                          <figure className="text-end">
                                            <img 
                                              src="/assets/images/newicons/job-mode.png" 
                                              className="img-fluid p-0 width" 
                                              draggable="false" 
                                              alt="Mode Icon"
                                            />
                                          </figure>
                                        </div>
                                        <div className="spe_detail">
                                          <p className="mb-0 text-black">Mode</p>
                                          <p className="mb-0 text-black">
                                            <small className="sub_head">({courseData.mode})</small>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Link>

                                {/* Action Buttons */}
                                <div className="row mt-1">
                                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                    <Link 
                                      className="apply-thisjob text-left px-1 apply-padding mb-0 mt-0" 
                                      to="/candidate/course/" 
                                      title="Apply Now"
                                    >
                                      <i className="la la-paper-plane"></i> Apply Now
                                    </Link>
                                  </div>
                                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                    <a 
                                      className="apply-thisjob text-left px-1 apply-padding mb-0 mt-0" 
                                      href="https://wa.me/918699017301?text=hi" 
                                      title="Chat Now"
                                    >
                                      <i className="la la-mobile-phone"></i> Chat Now
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

                  {/* For Small Screens */}
                  <div className="forsmallscrn d-none">
                    <div className="container search-page pt-xl-5 pt-lg-0 pt-md-0 pt-sm-0 pt-0">
                      <div className="row pointer">
                        <div className="card-body px-0">
                          <div className="col-lg-8 col-md-7 column">
                            <div className="job-single-sec">
                              <div className="job-single-head border-0 pb-0">
                                <div className="job-head-info">
                                  <h6 className="text-capitalize font-weight-bolder">
                                    {courseData.title || '...'}
                                  </h6>
                                  <span className="text-capitalize set-lineh">
                                    {courseData.category || '...'}
                                  </span>
                                </div>
                              </div>
                              <Link to="/candidate/course/">
                                <div className="job-overview mt-1">
                                  <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                                    <li>
                                      <i className="la la-money"></i>
                                      <h3 className="jobDetails-wrap">
                                        {/* Course Fee would go here */}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Course Fee
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-shield"></i>
                                      <h3 className="jobDetails-wrap">
                                        {/* Course Level data would go here */}
                                      </h3>
                                      <span className="jobDetails-wrap">
                                        Course Level
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-graduation-cap"></i>
                                      <h3 className="jobDetails-wrap">
                                        {/* Course Agency data would go here */}
                                      </h3>
                                      <span className="jobDetails-wrap">
                                        Course Agency
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              </Link>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-5 column mt-xl-4 mt-lg-5 mt-md-5 mt-sm-3 mt-2">
                            <Link 
                              className="apply-thisjob text-left px-0 d-xl-block d-lg-block d-md-block d-sm-none d-none apply-padding text-center" 
                              to="/candidate/course/" 
                              title="Register for this Course"
                            >
                              <i className="la la-paper-plane"></i> Register for this Course
                            </Link>
                            <div className="row">
                              <div className="col-6 same-plane mt-2">
                                <Link 
                                  className="apply-thisjob text-center py-1 px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block w-100 same-plane" 
                                  to="/candidate/job/" 
                                  title="Course Apply"
                                >
                                  <i className="la la-paper-plane ml-xl-3 mt-lg-3 mt-md-2 mt-sm-0 ml-xl-0 ml-lg-0 ml-md-1 ml-sm-2 ml-0 text-center-sm text-center-md text-center-lg text-center-xl plane-font"></i>
                                  Course Apply
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* CSS Styles */}
            <style jsx>{`
              .course--apply {
                background: #fff;
                border-radius: 0.5rem;
                box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
                transition: all .3s ease-in-out;
                text-align: center;
                padding: 8px 5px;
              }

              .course--apply a {
                color: #000;
              }

              #courseTabs {
                gap: 25px;
              }

              .serach-course-form {
                display: flex;
                justify-content: center;
                transition: 0.5 ease-in-out;
              }

              .serach-course-form input {
                border: 1px solid;
                border-radius: 10px;
                padding: 10px 15px;
                font-size: 15px;
                transition: 0.5s ease-in-out;
              }

              .width {
                width: 30px;
              }
            `}</style>
          </div>
        

    </>
  );
};

export default CandidatesEvents;